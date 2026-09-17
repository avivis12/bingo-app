import Pusher from "pusher";

/**
 * שכבת Real-time (Pusher).
 * דורש 4 משתני סביבה: PUSHER_APP_ID, PUSHER_KEY, PUSHER_SECRET, PUSHER_CLUSTER
 * (ר' .env.example). אם הם לא מוגדרים (למשל בסביבת פיתוח מקומית בלי Pusher עדיין),
 * הפונקציה רק כותבת ל-console ולא זורקת שגיאה — כדי לא לשבור את שאר הלוגיקה
 * (שליפת כדור/רכישה/הכרזה תמיד עובדים מול ה-DB בלי קשר לשידור הלייב).
 */

export type GameEvent =
  | { type: "BALL_DRAWN"; ball: number; ballsDrawn: number[] }
  | { type: "GAME_STATUS"; status: string; countdownEndsAt?: string | null }
  | { type: "ANNOUNCEMENT"; message: string }
  | { type: "LINE_WINNER"; userName: string }
  | { type: "BINGO_WINNER"; userName: string };

let pusherServer: Pusher | null = null;

function getPusher(): Pusher | null {
  const { PUSHER_APP_ID, PUSHER_KEY, PUSHER_SECRET, PUSHER_CLUSTER } = process.env;
  if (!PUSHER_APP_ID || !PUSHER_KEY || !PUSHER_SECRET || !PUSHER_CLUSTER) {
    return null;
  }
  if (!pusherServer) {
    pusherServer = new Pusher({
      appId: PUSHER_APP_ID,
      key: PUSHER_KEY,
      secret: PUSHER_SECRET,
      cluster: PUSHER_CLUSTER,
      useTLS: true,
    });
  }
  return pusherServer;
}

export async function broadcastToGame(gameId: string, event: GameEvent) {
  const pusher = getPusher();
  if (!pusher) {
    console.log(`[realtime] Pusher not configured — event not broadcast:`, gameId, event);
    return;
  }
  await pusher.trigger(`game-${gameId}`, event.type, event);
}
