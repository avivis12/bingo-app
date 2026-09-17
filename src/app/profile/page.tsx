"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSession, signOut } from "next-auth/react";

type Me = { name: string; email: string; phone: string; coinsBalance: number; role?: string };
type Tx = { id: string; type: string; amount: number; note: string | null; createdAt: string };
type RefundReq = { id: string; amountRequested: number; status: string; createdAt: string };

const TX_LABELS: Record<string, string> = {
  ADMIN_CREDIT: "הפקדה מהאדמין",
  ADMIN_DEBIT: 'הפחתה ע"י האדמין',
  SPEND: "רכישת כרטיס",
  WIN: "זכייה",
  TIP: "טיפ",
  REFUND: "אישור החזר",
};

const TX_ICONS: Record<string, string> = {
  ADMIN_CREDIT: "💰",
  ADMIN_DEBIT: "⬇️",
  SPEND: "🎫",
  WIN: "🏆",
  TIP: "🎁",
  REFUND: "↩️",
};

const REFUND_STATUS_LABELS: Record<string, string> = {
  PENDING: "ממתין",
  APPROVED: "אושר",
  REJECTED: "נדחה",
};

const REFUND_STATUS_STYLES: Record<string, string> = {
  PENDING: "bg-gray-100 text-gray-700",
  APPROVED: "bg-black text-white",
  REJECTED: "bg-gray-100 text-gray-400",
};

export default function ProfilePage() {
  const { data: session } = useSession();
  const [me, setMe] = useState<Me | null>(null);
  const [transactions, setTransactions] = useState<Tx[]>([]);
  const [refunds, setRefunds] = useState<RefundReq[]>([]);
  const [refundAmount, setRefundAmount] = useState("");
  const [refundNote, setRefundNote] = useState("");
  const [status, setStatus] = useState<{ type: "ok" | "err"; msg: string } | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [showRefundForm, setShowRefundForm] = useState(false);

  async function loadAll() {
    const [meRes, txRes, refundsRes] = await Promise.all([
      fetch("/api/me"),
      fetch("/api/me/transactions"),
      fetch("/api/refunds"),
    ]);
    if (meRes.ok) setMe(await meRes.json());
    if (txRes.ok) setTransactions((await txRes.json()).transactions);
    if (refundsRes.ok) setRefunds((await refundsRes.json()).requests);
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadAll();
  }, []);

  async function submitRefund() {
    setStatus(null);
    setSubmitting(true);
    try {
      const res = await fetch("/api/refunds", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amountRequested: Number(refundAmount),
          userNote: refundNote || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setStatus({ type: "err", msg: data.error ?? "שגיאה" });
        return;
      }
      setStatus({ type: "ok", msg: "בקשת ההחזר נשלחה, ממתינה לטיפול האדמין." });
      setRefundAmount("");
      setRefundNote("");
      setShowRefundForm(false);
      await loadAll();
    } finally {
      setSubmitting(false);
    }
  }

  if (!me) {
    return (
      <div dir="rtl" className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="inline-block w-8 h-8 border-2 border-gray-300 border-t-black rounded-full animate-spin" />
      </div>
    );
  }

  const role = (session?.user as { role?: string } | undefined)?.role;
  const isAdmin = role === "ADMIN" || me.role === "ADMIN";

  const initials = me.name
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const stats = {
    totalTx: transactions.length,
    wins: transactions.filter((t) => t.type === "WIN").length,
    spent: Math.abs(
      transactions
        .filter((t) => t.type === "SPEND")
        .reduce((sum, t) => sum + t.amount, 0)
    ),
    earned: transactions
      .filter((t) => t.type === "WIN")
      .reduce((sum, t) => sum + t.amount, 0),
  };

  return (
    <div dir="rtl" className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto p-4 md:p-8">
        {/* כרטיס פרופיל עליון */}
        <div className="bg-white border border-gray-200 rounded-2xl p-6 mb-6">
          <div className="flex items-center gap-4">
            {/* אווטאר */}
            <div className="w-20 h-20 rounded-full bg-black text-white flex items-center justify-center text-2xl font-bold shrink-0">
              {initials || "?"}
            </div>

            {/* פרטים */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-2xl font-bold text-black truncate">{me.name}</h1>
                {isAdmin && (
                  <span className="bg-black text-white text-xs font-bold rounded px-2 py-0.5">
                    ADMIN
                  </span>
                )}
              </div>
              <p className="text-sm text-gray-500 mt-1">{me.email}</p>
              <p className="text-sm text-gray-500">{me.phone}</p>
            </div>

            {/* התנתקות */}
            <button
              onClick={() => signOut()}
              className="text-sm text-gray-500 hover:text-black transition-colors underline-offset-4 hover:underline shrink-0"
            >
              התנתקות
            </button>
          </div>

          {/* קישורים מהירים */}
          <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-gray-200">
            <Link
              href="/"
              className="bg-white text-black border border-gray-300 rounded-xl px-4 py-2 text-sm font-medium hover:bg-gray-50 transition-colors"
            >
              ← חזרה למשחקים
            </Link>
            {isAdmin && (
              <Link
                href="/admin"
                className="bg-black text-white rounded-xl px-4 py-2 text-sm font-medium hover:bg-gray-800 transition-colors"
              >
                🔧 ממשק ניהול
              </Link>
            )}
          </div>
        </div>

        {/* יתרת מטבעות + סטטיסטיקות */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          <div className="bg-black text-white rounded-2xl p-4 col-span-2 md:col-span-1">
            <div className="text-xs text-gray-400 mb-1">יתרת מטבעות</div>
            <div className="text-3xl font-extrabold">{me.coinsBalance}</div>
            <div className="text-xs text-gray-400 mt-1">💵</div>
          </div>
          <StatBox label="עסקאות" value={stats.totalTx} icon="📊" />
          <StatBox label="זכיות" value={stats.wins} icon="🏆" />
          <StatBox label="סה״כ הוצא" value={stats.spent} icon="💸" />
        </div>

        {/* בקשת החזר */}
        <div className="bg-white border border-gray-200 rounded-2xl p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-lg">💰 בקשת החזר</h2>
            {!showRefundForm && (
              <button
                onClick={() => setShowRefundForm(true)}
                className="bg-black text-white rounded-xl px-4 py-2 text-sm font-medium hover:bg-gray-800 transition-colors"
              >
                + בקשה חדשה
              </button>
            )}
          </div>

          {showRefundForm && (
            <div className="space-y-3 mb-4">
              <div>
                <label className="block text-sm text-gray-500 mb-1">
                  כמות להחזר (עד {me.coinsBalance} מטבעות)
                </label>
                <input
                  type="number"
                  placeholder="למשל: 50"
                  value={refundAmount}
                  onChange={(e) => setRefundAmount(e.target.value)}
                  max={me.coinsBalance}
                  className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-black focus:outline-none focus:border-black transition-colors"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-500 mb-1">הערה (אופציונלי)</label>
                <input
                  placeholder="למשל: שולם בביט"
                  value={refundNote}
                  onChange={(e) => setRefundNote(e.target.value)}
                  className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-black focus:outline-none focus:border-black transition-colors"
                />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={submitRefund}
                  disabled={!refundAmount || submitting}
                  className="bg-black text-white font-semibold rounded-xl px-5 py-2.5 hover:bg-gray-800 disabled:opacity-50 transition-colors"
                >
                  {submitting ? "שולח..." : "שלח בקשה"}
                </button>
                <button
                  onClick={() => {
                    setShowRefundForm(false);
                    setRefundAmount("");
                    setRefundNote("");
                  }}
                  className="bg-white text-black border border-gray-300 rounded-xl px-5 py-2.5 font-medium hover:bg-gray-50 transition-colors"
                >
                  ביטול
                </button>
              </div>
            </div>
          )}

          {status && (
            <div
              className={`text-sm rounded-xl px-4 py-3 mb-4 ${
                status.type === "ok"
                  ? "bg-gray-50 border border-gray-200 text-black"
                  : "bg-red-50 border border-red-200 text-red-700"
              }`}
            >
              {status.msg}
            </div>
          )}

          {refunds.length > 0 ? (
            <ul className="space-y-2">
              {refunds.map((r) => (
                <li
                  key={r.id}
                  className="flex items-center justify-between bg-gray-50 rounded-xl px-4 py-3"
                >
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-black">{r.amountRequested} 💵</span>
                    <span className="text-xs text-gray-500">
                      {new Date(r.createdAt).toLocaleDateString("he-IL")}
                    </span>
                  </div>
                  <span
                    className={`text-xs font-semibold rounded-full px-3 py-1 ${
                      REFUND_STATUS_STYLES[r.status] ?? "bg-gray-100 text-gray-500"
                    }`}
                  >
                    {REFUND_STATUS_LABELS[r.status] ?? r.status}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            !showRefundForm && (
              <p className="text-sm text-gray-400 text-center py-4">אין בקשות החזר</p>
            )
          )}
        </div>

        {/* היסטוריית תנועות */}
        <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="font-bold text-lg">📜 היסטוריית מטבעות</h2>
          </div>

          {transactions.length === 0 ? (
            <div className="p-12 text-center text-gray-400 text-sm">אין תנועות עדיין</div>
          ) : (
            <ul className="divide-y divide-gray-100">
              {transactions.map((t) => (
                <li
                  key={t.id}
                  className="px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="text-xl shrink-0">{TX_ICONS[t.type] ?? "•"}</span>
                    <div className="min-w-0">
                      <div className="font-medium text-black text-sm truncate">
                        {TX_LABELS[t.type] ?? t.type}
                      </div>
                      {t.note && (
                        <div className="text-xs text-gray-500 truncate">{t.note}</div>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-col items-end shrink-0 ml-3">
                    <span
                      className={`font-bold text-sm ${
                        t.amount >= 0 ? "text-black" : "text-gray-500"
                      }`}
                    >
                      {t.amount >= 0 ? "+" : ""}
                      {t.amount}
                    </span>
                    <span className="text-xs text-gray-400">
                      {new Date(t.createdAt).toLocaleDateString("he-IL")}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* פוטר קטן */}
        <p className="text-center text-xs text-gray-400 mt-6">
          © {new Date().getFullYear()} בינגו
        </p>
      </div>
    </div>
  );
}

function StatBox({ label, value, icon }: { label: string; value: number; icon: string }) {
  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-4">
      <div className="text-xl mb-1">{icon}</div>
      <div className="text-2xl font-bold text-black">{value.toLocaleString("he-IL")}</div>
      <div className="text-xs text-gray-500 mt-0.5">{label}</div>
    </div>
  );
}