"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Game = {
  id: string;
  status: string;
  ticketPrice: number;
  maxTicketsPerUser: number;
  createdAt: string;
  _count: { tickets: number };
};

const STATUS_LABELS: Record<string, string> = {
  DRAFT: "טיוטה",
  SELLING: "מכירה פתוחה",
  COUNTDOWN: "בספירה לאחור",
  LIVE: "פעיל",
  FINISHED: "הסתיים",
  CANCELLED: "בוטל",
};

const STATUS_STYLES: Record<string, string> = {
  DRAFT: "bg-gray-100 text-gray-700",
  SELLING: "bg-black text-white",
  COUNTDOWN: "bg-gray-800 text-white",
  LIVE: "bg-black text-white",
  FINISHED: "bg-gray-100 text-gray-500",
  CANCELLED: "bg-gray-100 text-gray-400",
};

const ACTIVE_STATUSES = ["SELLING", "COUNTDOWN", "LIVE"];

export default function AdminGamesPage() {
  const [games, setGames] = useState<Game[]>([]);
  const [ticketPrice, setTicketPrice] = useState("50");
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [confirmAction, setConfirmAction] = useState<{
    game: Game;
    action: "CANCEL" | "FINISH";
  } | null>(null);

  async function load() {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/games");
      if (res.ok) setGames((await res.json()).games);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, []);

  async function createGame() {
    setError(null);
    setCreating(true);
    try {
      const res = await fetch("/api/admin/games", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ticketPrice: Number(ticketPrice), maxTicketsPerUser: 4 }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "שגיאה");
        return;
      }
      await load();
    } finally {
      setCreating(false);
    }
  }

  async function performAction(id: string, action: "CANCEL" | "FINISH") {
    setBusyId(id);
    try {
      const endpoint =
        action === "CANCEL"
          ? `/api/admin/games/${id}/cancel`
          : `/api/admin/games/${id}/finish`;

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        alert(data.error ?? "שגיאה בביצוע הפעולה");
        return;
      }
      await load();
    } finally {
      setBusyId(null);
      setConfirmAction(null);
    }
  }

  const hasActiveGame = games.some((g) => ACTIVE_STATUSES.includes(g.status));

  return (
    <div dir="rtl">
      <div className="flex items-center justify-between mb-2">
        <h1 className="text-3xl font-bold">ניהול משחקים</h1>
        <button
          onClick={load}
          className="text-sm text-gray-500 hover:text-black transition-colors"
        >
          🔄 רענן
        </button>
      </div>
      <p className="text-gray-500 mb-8">צור משחקים, עקוב אחר פעילים, ופתח חדרי בקרה</p>

      {/* יצירת משחק חדש */}
      {!hasActiveGame && (
        <div className="bg-white border border-gray-200 rounded-2xl p-6 mb-8">
          <h2 className="font-bold text-lg mb-4">יצירת משחק חדש</h2>
          <div className="flex flex-wrap items-end gap-4">
            <div>
              <label className="block text-sm text-gray-500 mb-1">מחיר לכרטיס (מטבעות)</label>
              <input
                type="number"
                className="border border-gray-300 rounded-xl px-4 py-2 text-black w-32 focus:outline-none focus:border-black transition-colors"
                value={ticketPrice}
                onChange={(e) => setTicketPrice(e.target.value)}
              />
            </div>
            <button
              onClick={createGame}
              disabled={creating}
              className="bg-black text-white font-semibold rounded-xl px-6 py-2.5 hover:bg-gray-800 disabled:opacity-50 transition-colors"
            >
              {creating ? "יוצר..." : "צור משחק ופתח מכירה"}
            </button>
          </div>
          {error && (
            <p className="text-red-600 text-sm mt-3 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
              {error}
            </p>
          )}
        </div>
      )}

      {hasActiveGame && (
        <div className="bg-gray-50 border border-gray-200 rounded-2xl p-4 mb-8 text-sm text-gray-600">
          ℹ️ יש כבר משחק פעיל — יש לסיים/לבטל אותו לפני יצירת משחק חדש.
        </div>
      )}

      {/* רשימת משחקים */}
      <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="font-bold">כל המשחקים ({games.length})</h2>
        </div>

        {loading ? (
          <div className="p-12 text-center">
            <div className="inline-block w-6 h-6 border-2 border-gray-300 border-t-black rounded-full animate-spin" />
          </div>
        ) : games.length === 0 ? (
          <div className="p-12 text-center text-gray-400">אין משחקים עדיין</div>
        ) : (
          <ul className="divide-y divide-gray-200">
            {games.map((g) => {
              const isActive = ACTIVE_STATUSES.includes(g.status);
              const isBusy = busyId === g.id;
              return (
                <li
                  key={g.id}
                  className="p-6 flex flex-wrap gap-4 justify-between items-center hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-4 flex-1 min-w-0">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap ${STATUS_STYLES[g.status]}`}
                    >
                      {STATUS_LABELS[g.status]}
                    </span>
                    <div className="min-w-0">
                      <div className="font-medium text-black">
                        {g.ticketPrice} מטבעות לכרטיס · {g._count.tickets} כרטיסים
                      </div>
                      <div className="text-xs text-gray-500 mt-0.5">
                        {new Date(g.createdAt).toLocaleString("he-IL")}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {isActive && (
                      <button
                        disabled={isBusy}
                        onClick={() => setConfirmAction({ game: g, action: "FINISH" })}
                        className="bg-black text-white rounded-xl px-4 py-2 text-sm font-medium hover:bg-gray-800 disabled:opacity-50 transition-colors"
                      >
                        {isBusy ? "..." : "סיים"}
                      </button>
                    )}

                    {isActive && (
                      <button
                        disabled={isBusy}
                        onClick={() => setConfirmAction({ game: g, action: "CANCEL" })}
                        className="bg-white text-red-600 border border-red-300 rounded-xl px-4 py-2 text-sm font-medium hover:bg-red-50 disabled:opacity-50 transition-colors"
                      >
                        {isBusy ? "..." : "בטל"}
                      </button>
                    )}

                    <Link
                      href={`/admin/games/${g.id}`}
                      className="bg-white text-black border border-gray-300 rounded-xl px-4 py-2 text-sm font-medium hover:bg-black hover:text-white transition-colors"
                    >
                      חדר בקרה →
                    </Link>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {/* מודאל אישור */}
      {confirmAction && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl">
            <h3 className="text-xl font-bold mb-2">
              {confirmAction.action === "CANCEL" ? "ביטול משחק" : "סיום משחק"}
            </h3>
            <p className="text-gray-600 mb-6 text-sm">
              {confirmAction.action === "CANCEL" ? (
                <>
                  האם לבטל את המשחק? הכרטיסים שנרכשו ייחשבו כמבוטלים.
                  <br />
                  <b className="text-red-600">
                    שים לב: המטבעות לא יוחזרו אוטומטית למשתמשים.
                  </b>
                </>
              ) : (
                <>האם לסיים את המשחק? לא ניתן לבטל פעולה זו.</>
              )}
            </p>
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setConfirmAction(null)}
                disabled={busyId !== null}
                className="bg-white text-black border border-gray-300 rounded-xl px-5 py-2.5 font-medium hover:bg-gray-50 disabled:opacity-50 transition-colors"
              >
                ביטול
              </button>
              <button
                onClick={() => performAction(confirmAction.game.id, confirmAction.action)}
                disabled={busyId !== null}
                className={`rounded-xl px-5 py-2.5 font-semibold disabled:opacity-50 transition-colors ${
                  confirmAction.action === "CANCEL"
                    ? "bg-red-600 text-white hover:bg-red-700"
                    : "bg-black text-white hover:bg-gray-800"
                }`}
              >
                {busyId !== null
                  ? "מעבד..."
                  : confirmAction.action === "CANCEL"
                  ? "כן, בטל"
                  : "כן, סיים"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}