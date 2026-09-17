"use client";

import { useEffect, useRef, useState } from "react";
import PusherClient from "pusher-js";
import type { GameEvent } from "@/lib/realtime";

/**
 * מתחבר לערוץ הלייב של משחק ומחזיר את האירוע האחרון שהתקבל.
 * אם משתני הסביבה הציבוריים (NEXT_PUBLIC_PUSHER_KEY/CLUSTER) לא מוגדרים,
 * ה-hook פשוט לא מתחבר — הדף עדיין עובד עם הנתונים שנטענו מהשרת בטעינה
 * הראשונית, רק בלי עדכונים אוטומטיים (המשתמש יצטרך לרענן).
 */
export function useGameChannel(gameId: string, onEvent: (event: GameEvent) => void) {
  const onEventRef = useRef(onEvent);
  useEffect(() => {
    onEventRef.current = onEvent;
  }, [onEvent]);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    const key = process.env.NEXT_PUBLIC_PUSHER_KEY;
    const cluster = process.env.NEXT_PUBLIC_PUSHER_CLUSTER;
    if (!key || !cluster || !gameId) return;

    const pusher = new PusherClient(key, { cluster });
    const channel = pusher.subscribe(`game-${gameId}`);

    const eventTypes: GameEvent["type"][] = [
      "BALL_DRAWN",
      "GAME_STATUS",
      "ANNOUNCEMENT",
      "LINE_WINNER",
      "BINGO_WINNER",
    ];
    for (const type of eventTypes) {
      channel.bind(type, (data: GameEvent) => onEventRef.current(data));
    }

    // eslint-disable-next-line react-hooks/set-state-in-effect -- מדווח שהחיבור ל-Pusher הצליח
    setConnected(true);

    return () => {
      channel.unbind_all();
      pusher.unsubscribe(`game-${gameId}`);
      pusher.disconnect();
      setConnected(false);
    };
  }, [gameId]);

  return { connected };
}
