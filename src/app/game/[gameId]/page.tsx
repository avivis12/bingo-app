"use client";

import { use, useCallback, useEffect, useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { TicketGrid } from "@/components/TicketGrid";
import { WinModal } from "@/components/WinModal";
import { hasMarkedLine, hasMarkedBingo, TOTAL_BALLS } from "@/lib/tickets";
import { useGameChannel } from "@/lib/useGameChannel";
import type { GameEvent } from "@/lib/realtime";

type Game = {
  id: string;
  status: "DRAFT" | "SELLING" | "COUNTDOWN" | "LIVE" | "FINISHED" | "CANCELLED";
  ticketPrice: number;
  maxTicketsPerUser: number;
  ballsDrawn: number[];
  countdownEndsAt: string | null;
  lineWinnerUserIds: string[];
  bingoWinnerUserIds: string[];
  lineDistributed: boolean;
  bingoDistributed: boolean;
};

type Ticket = { id: string; numbers: number[]; userId: string };

export default function GamePage({ params }: { params: Promise<{ gameId: string }> }) {
  const { gameId } = use(params);
  const { data: session } = useSession();
  const userId = (session?.user as { id?: string } | undefined)?.id;

  const [game, setGame] = useState<Game | null>(null);
  const [myTickets, setMyTickets] = useState<Ticket[]>([]);
  const [transparency, setTransparency] = useState({
    playerCount: 0,
    ticketCount: 0,
    projectedPlayerPool: 0,
    linePrize: 0,
    bingoPrize: 0,
    linePrizePerWinner: 0,
    bingoPrizePerWinner: 0,
    lineWinnersCount: 0,
    bingoWinnersCount: 0,
  });
  const [announcement, setAnnouncement] = useState<string | null>(null);
  const [announcementType, setAnnouncementType] = useState<"info" | "success" | "error">("info");
  const [balance, setBalance] = useState<number | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [purchasing, setPurchasing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tipAmount, setTipAmount] = useState("");
  const [tipSent, setTipSent] = useState(false);
  const [now, setNow] = useState(0);
  const [winModal, setWinModal] = useState<{
    open: boolean;
    prizeType: "LINE" | "BINGO";
    amount: number;
    winnersCount: number;
  }>({ open: false, prizeType: "LINE", amount: 0, winnersCount: 1 });

  const [markedNumbers, setMarkedNumbers] = useState<Record<string, number[]>>({});

  const showAnnouncement = useCallback(
    (msg: string, type: "info" | "success" | "error" = "info", duration = 8000) => {
      setAnnouncement(msg);
      setAnnouncementType(type);
      setTimeout(() => setAnnouncement(null), duration);
    },
    []
  );

  const loadState = useCallback(async () => {
    const res = await fetch(`/api/games/${gameId}`);
    if (!res.ok) return;
    const data = await res.json();
    setGame(data.game);
    setTransparency(data.transparency);
    setMyTickets(data.myTickets);
  }, [gameId]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadState();
  }, [loadState]);

  useEffect(() => {
    if (!game) return;
    const intervalMs =
      game.status === "LIVE"
        ? 1000
        : game.status === "COUNTDOWN"
        ? 2000
        : game.status === "SELLING"
        ? 5000
        : 0;
    if (intervalMs === 0) return;
    const id = setInterval(() => {
      if (document.hasFocus()) loadState();
    }, intervalMs);
    return () => clearInterval(id);
  }, [game?.status, loadState]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setNow(Date.now());
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const handleEvent = useCallback(
    (event: GameEvent) => {
      if (event.type === "BALL_DRAWN") {
        setGame((g) => (g ? { ...g, ballsDrawn: event.ballsDrawn, status: "LIVE" } : g));
      } else if (event.type === "GAME_STATUS") {
        setGame((g) => (g ? { ...g, status: event.status as Game["status"] } : g));
        if (event.status === "LIVE") loadState();
      } else if (event.type === "ANNOUNCEMENT") {
        showAnnouncement(event.message, "info", 12000);
      } else if (event.type === "LINE_WINNER") {
        showAnnouncement(`יש שורה! ${event.userName} — בדקו את הכרטיסים שלכם`, "success", 12000);
      } else if (event.type === "BINGO_WINNER") {
        showAnnouncement(`יש בינגו! ${event.userName}`, "success", 12000);
      }
    },
    [loadState, showAnnouncement]
  );
  useGameChannel(gameId, handleEvent);

  const lastBall = game?.ballsDrawn[game.ballsDrawn.length - 1];
  const drawnSet = useMemo(() => new Set(game?.ballsDrawn ?? []), [game?.ballsDrawn]);

  const countdownRemaining =
    game?.countdownEndsAt && now > 0
      ? Math.max(0, Math.floor((new Date(game.countdownEndsAt).getTime() - now) / 1000))
      : null;

  function toggleMark(ticketId: string, num: number) {
    if (!game) return;
    if (!drawnSet.has(num)) return;
    setMarkedNumbers((prev) => {
      const current = prev[ticketId] ?? [];
      const isMarked = current.includes(num);
      return {
        ...prev,
        [ticketId]: isMarked ? current.filter((n) => n !== num) : [...current, num],
      };
    });
  }

  function autoMarkTicket(ticketId: string) {
    if (!game) return;
    const ticket = myTickets.find((t) => t.id === ticketId);
    if (!ticket) return;

    setMarkedNumbers((prev) => {
      const current = prev[ticketId] ?? [];
      const currentSet = new Set(current);
      for (const num of ticket.numbers) {
        if (drawnSet.has(num)) currentSet.add(num);
      }
      return { ...prev, [ticketId]: Array.from(currentSet) };
    });
  }

  async function handlePurchase() {
    setError(null);
    setPurchasing(true);
    try {
      const res = await fetch(`/api/games/${gameId}/purchase`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ quantity }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "שגיאה ברכישה");
        return;
      }
      await loadState();
      const me = await fetch("/api/me").then((r) => (r.ok ? r.json() : null));
      if (me) setBalance(me.coinsBalance);
      showAnnouncement(`✅ נרכשו ${quantity} כרטיסים בהצלחה`, "success");
    } finally {
      setPurchasing(false);
    }
  }

  async function handleClaim(ticketId: string, claimType: "LINE" | "BINGO") {
    setError(null);
    const marks = markedNumbers[ticketId] ?? [];

    if (marks.length === 0) {
      showAnnouncement("❌ לא סימנת אף מספר", "error", 5000);
      return;
    }

    const res = await fetch(`/api/games/${gameId}/claim`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ticketId, claimType, markedNumbers: marks }),
    });
    const data = await res.json();

    if (!res.ok) {
      const errMsg = data.error ?? "שגיאה בהכרזה";
      setError(errMsg);
      showAnnouncement(`❌ ${errMsg}`, "error", 6000);
      return;
    }

    setWinModal({
      open: true,
      prizeType: claimType,
      amount: data.prize ?? 0,
      winnersCount: data.winnersCount ?? 1,
    });

    await loadState();
  }

  async function handleTip() {
    if (!tipAmount) return;
    const res = await fetch(`/api/games/${gameId}/tip`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ amount: Number(tipAmount) }),
    });
    if (res.ok) setTipSent(true);
  }

  useEffect(() => {
    fetch("/api/me")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => d && setBalance(d.coinsBalance))
      .catch(() => {});
  }, []);

  if (!game) {
    return (
      <div dir="rtl" className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="inline-block w-8 h-8 border-2 border-gray-300 border-t-black rounded-full animate-spin" />
      </div>
    );
  }

  const saleOpen = game.status === "SELLING" || game.status === "COUNTDOWN";
  const isFinished = game.status === "FINISHED" || game.status === "CANCELLED";
  const isWinner =
    !!userId && game.bingoWinnerUserIds.includes(userId) && game.bingoDistributed;

  const announcementBg =
    announcementType === "success"
      ? "bg-green-600"
      : announcementType === "error"
      ? "bg-red-600"
      : "bg-black";

  const announcementText = "text-white";

  return (
    <div dir="rtl" className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto p-4 md:p-6">
        {announcement && (
          <div
            className={`fixed top-3 inset-x-3 z-50 ${announcementBg} ${announcementText} font-bold text-center rounded-xl py-3 shadow-lg`}
          >
            {announcement}
          </div>
        )}

        <div className="flex items-center justify-between mb-4">
          <Link
            href="/profile"
            className="text-sm text-gray-500 hover:text-black transition-colors"
          >
            ← הפרופיל שלי
          </Link>
          <span
            className={`text-xs font-bold rounded-full px-3 py-1 ${
              game.status === "LIVE"
                ? "bg-black text-white"
                : game.status === "SELLING" || game.status === "COUNTDOWN"
                ? "bg-black text-white"
                : "bg-gray-200 text-gray-600"
            }`}
          >
            {game.status === "LIVE"
              ? "🟢 פעיל"
              : game.status === "SELLING"
              ? "מכירה פתוחה"
              : game.status === "COUNTDOWN"
              ? "בספירה לאחור"
              : game.status === "FINISHED"
              ? "הסתיים"
              : game.status === "CANCELLED"
              ? "בוטל"
              : game.status}
          </span>
        </div>

        {isFinished && (
          <div className="bg-yellow-400 text-gray-900 rounded-2xl p-5 text-center mb-4">
            <h2 className="text-xl font-bold mb-3">
              {game.status === "CANCELLED" ? "המשחק בוטל" : "🎉 המשחק הסתיים!"}
            </h2>
            <Link
              href="/"
              className="inline-block bg-black text-white font-bold rounded-xl px-6 py-3 hover:bg-gray-800 transition-colors"
            >
              ← חזרה לדף הבית
            </Link>
          </div>
        )}

        <div className="bg-white border border-gray-200 rounded-2xl p-4 mb-4">
          <div className="flex justify-between text-xs text-gray-500 mb-3">
            <span>👥 משתתפים: {transparency.playerCount}</span>
            <span>🎫 כרטיסים: {transparency.ticketCount}</span>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-3 text-center">
              <div className="text-xs text-gray-500 font-semibold mb-1">📏 פרס שורה</div>
              <div className="text-2xl font-extrabold text-black">
                {transparency.linePrizePerWinner}
              </div>
              <div className="text-xs text-gray-400 mt-0.5">
                {transparency.lineWinnersCount > 0
                  ? `מתחלק בין ${transparency.lineWinnersCount}`
                  : "מטבעות"}
              </div>
            </div>
            <div className="bg-black rounded-xl p-3 text-center">
              <div className="text-xs text-yellow-400 font-semibold mb-1">🏆 פרס בינגו</div>
              <div className="text-2xl font-extrabold text-white">
                {transparency.bingoPrizePerWinner}
              </div>
              <div className="text-xs text-gray-400 mt-0.5">
                {transparency.bingoWinnersCount > 0
                  ? `מתחלק בין ${transparency.bingoWinnersCount}`
                  : "מטבעות"}
              </div>
            </div>
          </div>
        </div>

        {saleOpen && (
          <div className="bg-white border border-gray-200 rounded-2xl p-5 mb-4">
            <div className="flex justify-between mb-4 text-sm text-black">
              <span>
                מחיר לכרטיס: <b>{game.ticketPrice}</b> מטבעות
              </span>
              {balance !== null && (
                <span>
                  היתרה שלך: <b>{balance}</b> 🪙
                </span>
              )}
            </div>

            {countdownRemaining !== null && (
              <div className="text-center text-4xl font-extrabold text-black mb-4 tabular-nums">
                {Math.floor(countdownRemaining / 60)}:
                {String(countdownRemaining % 60).padStart(2, "0")}
              </div>
            )}

            <div className="flex items-center justify-center gap-4 mb-4">
              <button
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                className="w-10 h-10 rounded-full border border-gray-300 hover:bg-gray-50 font-bold text-lg transition-colors"
              >
                −
              </button>
              <span className="text-2xl font-bold w-10 text-center">{quantity}</span>
              <button
                onClick={() => setQuantity((q) => Math.min(game.maxTicketsPerUser, q + 1))}
                className="w-10 h-10 rounded-full border border-gray-300 hover:bg-gray-50 font-bold text-lg transition-colors"
              >
                +
              </button>
            </div>

            <div className="text-center text-sm text-gray-500 mb-4">
              סה״כ לתשלום: <b className="text-black">{quantity * game.ticketPrice}</b> מטבעות
            </div>

            <button
              onClick={handlePurchase}
              disabled={purchasing || myTickets.length >= game.maxTicketsPerUser}
              className="w-full bg-black text-white font-bold rounded-xl py-3 hover:bg-gray-800 disabled:opacity-50 transition-colors"
            >
              {myTickets.length >= game.maxTicketsPerUser
                ? "הגעת למכסת הכרטיסים"
                : purchasing
                ? "קונה..."
                : "קנה"}
            </button>
            {error && <p className="text-red-600 text-sm mt-3 text-center">{error}</p>}
          </div>
        )}

        {/* כדור מרכזי — רק מספר, בלי אות */}
        {game.status === "LIVE" && (
          <div className="text-center mb-6">
            <div className="text-sm text-gray-500 mb-2">הכדור האחרון שנשלף</div>
            <div className="inline-flex items-center justify-center w-28 h-28 rounded-full bg-black text-white text-4xl font-extrabold shadow-lg">
              {lastBall ?? "—"}
            </div>
          </div>
        )}

        {game.status === "LIVE" && (
          <div className="bg-white border border-gray-200 rounded-2xl p-4 mb-4">
            <div className="text-xs text-gray-500 text-center mb-3 font-medium">לוח הכדורים</div>
            <div className="grid grid-cols-10 gap-1 text-xs">
              {Array.from({ length: TOTAL_BALLS }, (_, i) => i + 1).map((n) => (
                <div
                  key={n}
                  className={[
                    "aspect-square flex items-center justify-center rounded font-bold",
                    drawnSet.has(n) ? "bg-black text-white" : "bg-gray-100 text-gray-400",
                  ].join(" ")}
                >
                  {n}
                </div>
              ))}
            </div>
          </div>
        )}

        {myTickets.length > 0 && (
          <div className="mb-6">
            <h2 className="font-bold mb-3 text-center text-black">
              הכרטיסים שלי ({myTickets.length})
            </h2>

            <div
              className={`grid gap-3 mx-auto ${
                myTickets.length === 1 ? "grid-cols-1 max-w-sm" : "grid-cols-2 max-w-2xl"
              }`}
            >
              {myTickets.map((ticket, idx) => {
                const marks = markedNumbers[ticket.id] ?? [];
                const hasLine = hasMarkedLine(ticket.numbers, marks);
                const hasBingo = hasMarkedBingo(ticket.numbers, marks);

                return (
                  <div
                    key={ticket.id}
                    className="bg-white border border-gray-200 rounded-2xl p-3"
                  >
                    <div className="flex items-center justify-between mb-2 px-1">
                      <span className="text-xs text-gray-500 font-semibold">
                        כרטיס {idx + 1}
                      </span>
                      {game.status === "LIVE" && (
                        <button
                          onClick={() => autoMarkTicket(ticket.id)}
                          className="text-[11px] text-black font-bold bg-yellow-400 hover:bg-yellow-300 rounded-full px-2 py-0.5 transition-colors"
                        >
                          ✨ סמן אוטומטית
                        </button>
                      )}
                    </div>

                    <TicketGrid
                      numbers={ticket.numbers}
                      drawnBalls={game.ballsDrawn}
                      markedNumbers={marks}
                      onToggle={(num) => toggleMark(ticket.id, num)}
                      compact={myTickets.length > 1}
                      disabled={game.status !== "LIVE"}
                    />

                    {game.status === "LIVE" && (
                      <div className="flex gap-2 mt-3">
                        <button
                          onClick={() => handleClaim(ticket.id, "LINE")}
                          disabled={!hasLine || game.lineDistributed}
                          className="flex-1 bg-black text-white text-xs font-bold rounded-lg py-2 disabled:opacity-30 hover:bg-gray-800 transition-colors"
                        >
                          שורה!
                        </button>
                        <button
                          onClick={() => handleClaim(ticket.id, "BINGO")}
                          disabled={!hasBingo || game.bingoDistributed}
                          className="flex-1 bg-yellow-400 text-black text-xs font-bold rounded-lg py-2 disabled:opacity-30 hover:bg-yellow-300 transition-colors"
                        >
                          בינגו!
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {error && <p className="text-red-600 text-sm mt-3 text-center">{error}</p>}
          </div>
        )}

        {isWinner && !tipSent && (
          <div className="bg-white border border-gray-200 rounded-2xl p-5 text-center">
            <p className="mb-3 font-bold text-black">
              🎉 מזל טוב על הזכייה! רוצה לתת טיפ?
            </p>
            <input
              type="number"
              placeholder="סכום"
              value={tipAmount}
              onChange={(e) => setTipAmount(e.target.value)}
              className="border border-gray-300 rounded-xl px-4 py-2 text-black mb-3 w-32 text-center focus:outline-none focus:border-black transition-colors"
            />
            <div className="flex gap-2 justify-center">
              <button
                onClick={handleTip}
                className="bg-black text-white font-bold rounded-xl px-5 py-2.5 hover:bg-gray-800 transition-colors"
              >
                שלח טיפ
              </button>
              <button
                onClick={() => setTipSent(true)}
                className="bg-white text-black border border-gray-300 font-bold rounded-xl px-5 py-2.5 hover:bg-gray-50 transition-colors"
              >
                לא תודה
              </button>
            </div>
          </div>
        )}

        <div className="mt-8 text-center">
          <Link
            href="/profile"
            className="inline-block text-sm text-gray-500 hover:text-black underline-offset-4 hover:underline transition-colors"
          >
            ← חזרה לפרופיל
          </Link>
        </div>
      </div>

      <WinModal
        isOpen={winModal.open}
        prizeType={winModal.prizeType}
        amount={winModal.amount}
        winnersCount={winModal.winnersCount}
        onClose={() => setWinModal((w) => ({ ...w, open: false }))}
      />
    </div>
  );
}