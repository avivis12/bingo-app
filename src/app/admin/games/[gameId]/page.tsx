"use client";

import { use, useCallback, useEffect, useState } from "react";
import { announceBallInHebrew } from "@/lib/ballAnnouncement";
import { AdminTicketCard } from "@/components/AdminTicketCard";

type Game = {
  id: string;
  status: string;
  ticketPrice: number;
  ballsDrawn: number[];
  countdownEndsAt: string | null;
  lineWinnerUserIds: string[];
  bingoWinnerUserIds: string[];
  lineDistributed: boolean;
  bingoDistributed: boolean;
};

type Ticket = {
  id: string;
  numbers: number[];
  userId: string;
  userName: string;
  userEmail: string;
  userPhone: string;
};

export default function AdminGameControlRoom({ params }: { params: Promise<{ gameId: string }> }) {
  const { gameId } = use(params);
  const [game, setGame] = useState<Game | null>(null);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [countdownSeconds, setCountdownSeconds] = useState("300");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "line" | "bingo">("all");

  const load = useCallback(async () => {
    const [gameRes, ticketsRes] = await Promise.all([
      fetch(`/api/games/${gameId}`),
      fetch(`/api/admin/games/${gameId}/tickets`),
    ]);
    if (gameRes.ok) setGame((await gameRes.json()).game);
    if (ticketsRes.ok) setTickets((await ticketsRes.json()).tickets);
  }, [gameId]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
    // פולינג דינמי: 2 שניות ב-LIVE, 5 שניות אחרת
    const intervalMs = game?.status === "LIVE" ? 2000 : 5000;
    const id = setInterval(load, intervalMs);
    return () => clearInterval(id);
  }, [load, game?.status]);

  async function callAction(url: string, body?: object) {
    setError(null);
    setBusy(true);
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: body ? JSON.stringify(body) : undefined,
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "שגיאה");
        return;
      }
      await load();
    } finally {
      setBusy(false);
    }
  }

  if (!game) return <div dir="rtl" className="p-6 text-center text-gray-400">טוען...</div>;

  const lastBall = game.ballsDrawn[game.ballsDrawn.length - 1];

  // סינון כרטיסים
  const filteredTickets = tickets.filter((t) => {
    if (search) {
      const q = search.toLowerCase();
      if (
        !t.userName.toLowerCase().includes(q) &&
        !t.userPhone.includes(q) &&
        !t.userEmail.toLowerCase().includes(q)
      ) {
        return false;
      }
    }
    if (filter === "line" && !game.lineWinnerUserIds.includes(t.userId)) return false;
    if (filter === "bingo" && !game.bingoWinnerUserIds.includes(t.userId)) return false;
    return true;
  });

  const stats = {
    total: tickets.length,
    players: new Set(tickets.map((t) => t.userId)).size,
    lineWinners: game.lineWinnerUserIds.length,
    bingoWinners: game.bingoWinnerUserIds.length,
  };

  return (
    <div dir="rtl" className="max-w-6xl mx-auto p-4">
      {/* כותרת */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">חדר בקרה</h1>
          <div className="flex items-center gap-2 mt-1">
            <span
              className={`px-3 py-1 rounded-full text-xs font-semibold ${
                game.status === "LIVE"
                  ? "bg-green-500 text-white"
                  : game.status === "SELLING"
                  ? "bg-black text-white"
                  : game.status === "COUNTDOWN"
                  ? "bg-blue-500 text-white"
                  : "bg-gray-200 text-gray-700"
              }`}
            >
              {game.status === "LIVE" ? "🟢 LIVE" : game.status}
            </span>
            <span className="text-sm text-gray-500">
              כדורים: {game.ballsDrawn.length}/75
            </span>
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-3 mb-4 text-sm">
          {error}
        </div>
      )}

      {/* סטטיסטיקות */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <StatBox label="שחקנים" value={stats.players} icon="👥" />
        <StatBox label="כרטיסים" value={stats.total} icon="🎫" />
        <StatBox label="זוכי שורה" value={stats.lineWinners} icon="📏" />
        <StatBox label="זוכי בינגו" value={stats.bingoWinners} icon="🏆" />
      </div>

      {/* בקרת שלבי משחק */}
      <div className="bg-white border border-gray-200 rounded-2xl p-4 mb-4">
        <h2 className="font-bold mb-3">בקרת משחק</h2>
        <div className="flex flex-wrap gap-3 items-center">
          {game.status === "SELLING" && (
            <>
              <input
                type="number"
                value={countdownSeconds}
                onChange={(e) => setCountdownSeconds(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-1.5 text-black w-24 focus:outline-none focus:border-black"
              />
              <span className="text-sm text-gray-500">שניות טיימר</span>
              <button
                disabled={busy}
                onClick={() =>
                  callAction(`/api/admin/games/${gameId}/start-countdown`, {
                    countdownSeconds: Number(countdownSeconds),
                  })
                }
                className="bg-black text-white rounded-lg px-4 py-2 font-medium hover:bg-gray-800 disabled:opacity-50"
              >
                נעל מכירה והתחל טיימר
              </button>
            </>
          )}
          {(game.status === "SELLING" || game.status === "COUNTDOWN") && (
            <button
              disabled={busy}
              onClick={() => callAction(`/api/admin/games/${gameId}/draw-ball`)}
              className="bg-black text-white font-bold rounded-lg px-4 py-2 hover:bg-gray-800 disabled:opacity-50"
            >
              התחל משחק ושלוף כדור ראשון
            </button>
          )}
          {game.status === "LIVE" && (
            <button
              disabled={busy || game.ballsDrawn.length >= 75}
              onClick={() => callAction(`/api/admin/games/${gameId}/draw-ball`)}
              className="bg-black text-white font-bold rounded-lg px-4 py-2 hover:bg-gray-800 disabled:opacity-50"
            >
              🎲 שלוף כדור הבא ({game.ballsDrawn.length}/75)
            </button>
          )}
          {["SELLING", "COUNTDOWN"].includes(game.status) && (
            <button
              disabled={busy}
              onClick={() => callAction(`/api/admin/games/${gameId}/cancel`)}
              className="bg-white text-red-600 border border-red-300 rounded-lg px-4 py-2 font-medium hover:bg-red-50 disabled:opacity-50"
            >
              בטל משחק
            </button>
          )}
        </div>
      </div>

      {/* כדור אחרון + הודעת מערכת */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
        {lastBall ? (
          <div className="bg-white border border-gray-200 rounded-2xl p-4 flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-black text-white flex items-center justify-center text-2xl font-bold shrink-0">
              {lastBall}
            </div>
            <div>
              <div className="text-xs text-gray-500">כדור אחרון</div>
              <div className="font-bold text-lg">{announceBallInHebrew(lastBall)}</div>
            </div>
          </div>
        ) : (
          <div className="bg-gray-50 border border-gray-200 rounded-2xl p-4 text-center text-gray-400 text-sm">
            עוד לא נשלפו כדורים
          </div>
        )}

        <div className="bg-white border border-gray-200 rounded-2xl p-4">
          <h2 className="font-bold mb-2 text-sm">📢 הודעה חיה</h2>
          <div className="flex gap-2">
            <input
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="למשל: יש שורה! בדקו את הכרטיסים"
              className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-black focus:outline-none focus:border-black"
            />
            <button
              disabled={!message || busy}
              onClick={async () => {
                await callAction(`/api/admin/games/${gameId}/announce`, { message });
                setMessage("");
              }}
              className="bg-black text-white rounded-lg px-4 py-2 font-medium hover:bg-gray-800 disabled:opacity-50"
            >
              שלח
            </button>
          </div>
        </div>
      </div>

      {/* חלוקת פרסים */}
      <div className="bg-white border border-gray-200 rounded-2xl p-4 mb-6">
        <h2 className="font-bold mb-3">💰 חלוקת פרסים</h2>
        <div className="flex flex-wrap gap-3">
          <button
            disabled={busy || game.lineDistributed || game.lineWinnerUserIds.length === 0}
            onClick={() => callAction(`/api/admin/games/${gameId}/distribute`, { prizeType: "LINE" })}
            className="flex-1 min-w-[200px] bg-white text-black border border-gray-300 rounded-lg px-4 py-2 font-medium hover:bg-gray-50 disabled:opacity-40"
          >
            {game.lineDistributed ? "✅ שורה חולקה" : `סגור שורה (${game.lineWinnerUserIds.length} זוכים)`}
          </button>
          <button
            disabled={busy || game.bingoDistributed || game.bingoWinnerUserIds.length === 0}
            onClick={() => callAction(`/api/admin/games/${gameId}/distribute`, { prizeType: "BINGO" })}
            className="flex-1 min-w-[200px] bg-black text-white rounded-lg px-4 py-2 font-bold hover:bg-gray-800 disabled:opacity-40"
          >
            {game.bingoDistributed ? "✅ בינגו חולק" : `סגור בינגו (${game.bingoWinnerUserIds.length} זוכים)`}
          </button>
        </div>
      </div>

      {/* רשימת כרטיסים */}
      <div className="bg-white border border-gray-200 rounded-2xl p-4">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <h2 className="font-bold">🎫 כרטיסים במשחק ({filteredTickets.length})</h2>
          <div className="flex gap-2 flex-wrap">
            <input
              type="text"
              placeholder="🔍 חפש שחקן..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm text-black focus:outline-none focus:border-black w-48"
            />
            <div className="flex gap-1 border border-gray-300 rounded-lg p-0.5">
              <button
                onClick={() => setFilter("all")}
                className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                  filter === "all" ? "bg-black text-white" : "text-gray-600 hover:bg-gray-50"
                }`}
              >
                הכל
              </button>
              <button
                onClick={() => setFilter("line")}
                className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                  filter === "line" ? "bg-blue-500 text-white" : "text-gray-600 hover:bg-gray-50"
                }`}
              >
                שורה
              </button>
              <button
                onClick={() => setFilter("bingo")}
                className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                  filter === "bingo" ? "bg-black text-white" : "text-gray-600 hover:bg-gray-50"
                }`}
              >
                בינגו
              </button>
            </div>
          </div>
        </div>

        {filteredTickets.length === 0 ? (
          <div className="text-center text-gray-400 py-8 text-sm">
            {tickets.length === 0 ? "אין כרטיסים עדיין" : "אין תוצאות לחיפוש"}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {filteredTickets.map((t) => (
              <AdminTicketCard
                key={t.id}
                ticket={t}
                ballsDrawn={game.ballsDrawn}
                isLineWinner={game.lineWinnerUserIds.includes(t.userId)}
                isBingoWinner={game.bingoWinnerUserIds.includes(t.userId)}
                isDistributed={game.bingoDistributed}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function StatBox({ label, value, icon }: { label: string; value: number; icon: string }) {
  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-4">
      <div className="text-2xl mb-1">{icon}</div>
      <div className="text-2xl font-bold text-black">{value}</div>
      <div className="text-xs text-gray-500">{label}</div>
    </div>
  );
}