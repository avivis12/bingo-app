"use client";

import { useEffect, useState } from "react";

type UserRow = {
  id: string;
  name: string;
  email: string;
  phone: string;
  coinsBalance: number;
};

export default function AdminUsersPage() {
  const [query, setQuery] = useState("");
  const [users, setUsers] = useState<UserRow[]>([]);
  const [selected, setSelected] = useState<UserRow | null>(null);
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [status, setStatus] = useState<{ type: "ok" | "err"; msg: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const timeout = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/admin/users?q=${encodeURIComponent(query)}`);
        const data = await res.json();
        setUsers(data.users ?? []);
      } finally {
        setLoading(false);
      }
    }, 250);
    return () => clearTimeout(timeout);
  }, [query]);

  async function submitCredit() {
    if (!selected || !amount) return;
    setStatus(null);
    setSubmitting(true);
    try {
      const res = await fetch("/api/admin/coins/credit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: selected.id, amount: Number(amount), note }),
      });
      const data = await res.json();
      if (!res.ok) {
        setStatus({ type: "err", msg: data.error ?? "שגיאה" });
        return;
      }
      setStatus({ type: "ok", msg: `עודכן בהצלחה. יתרה חדשה: ${data.newBalance}` });
      setSelected({ ...selected, coinsBalance: data.newBalance });
      setAmount("");
      setNote("");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div>
      <h1 className="text-3xl font-bold mb-2">ניהול משתמשים</h1>
      <p className="text-gray-500 mb-8">חפש משתמשים והזן/הפחת מטבעות</p>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* עמודת חיפוש */}
        <div>
          <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
            <div className="p-4 border-b border-gray-200">
              <input
                autoFocus
                className="w-full border border-gray-300 rounded-xl px-4 py-2.5 focus:outline-none focus:border-black transition-colors"
                placeholder="🔍 חפש לפי שם, טלפון או אימייל..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>

            {loading ? (
              <div className="p-12 text-center">
                <div className="inline-block w-6 h-6 border-2 border-gray-300 border-t-black rounded-full animate-spin" />
              </div>
            ) : users.length === 0 ? (
              <div className="p-12 text-center text-gray-400 text-sm">
                {query ? "אין תוצאות" : "הקלד לחיפוש"}
              </div>
            ) : (
              <ul className="divide-y divide-gray-200 max-h-[500px] overflow-y-auto">
                {users.map((u) => (
                  <li
                    key={u.id}
                    onClick={() => setSelected(u)}
                    className={`p-4 cursor-pointer transition-colors ${
                      selected?.id === u.id
                        ? "bg-black text-white"
                        : "hover:bg-gray-50"
                    }`}
                  >
                    <div className="font-medium">{u.name}</div>
                    <div className={`text-sm mt-1 ${selected?.id === u.id ? "text-gray-300" : "text-gray-500"}`}>
                      {u.phone} · {u.email}
                    </div>
                    <div className={`text-sm mt-1 font-semibold ${selected?.id === u.id ? "text-white" : "text-black"}`}>
                      יתרה: {u.coinsBalance} 🪙
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* עמודת פעולה */}
        <div>
          {selected ? (
            <div className="bg-white border border-gray-200 rounded-2xl p-6 sticky top-8">
              <h2 className="font-bold text-lg mb-1">עדכון יתרה</h2>
              <p className="text-sm text-gray-500 mb-6">
                {selected.name} · יתרה נוכחית: <b className="text-black">{selected.coinsBalance} 🪙</b>
              </p>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-gray-500 mb-1">
                    כמות (שלילי = הפחתה)
                  </label>
                  <input
                    type="number"
                    className="w-full border border-gray-300 rounded-xl px-4 py-2.5 focus:outline-none focus:border-black transition-colors"
                    placeholder="למשל: 100 או ‎-50"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-sm text-gray-500 mb-1">הערה</label>
                  <input
                    className="w-full border border-gray-300 rounded-xl px-4 py-2.5 focus:outline-none focus:border-black transition-colors"
                    placeholder="למשל: שולם בביט"
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                  />
                </div>

                <button
                  onClick={submitCredit}
                  disabled={submitting || !amount}
                  className="w-full bg-black text-white font-semibold rounded-xl py-3 hover:bg-gray-800 disabled:opacity-50 transition-colors"
                >
                  {submitting ? "מעדכן..." : "עדכן יתרה"}
                </button>

                {status && (
                  <div
                    className={`text-sm rounded-xl px-4 py-3 ${
                      status.type === "ok"
                        ? "bg-gray-50 border border-gray-200 text-black"
                        : "bg-red-50 border border-red-200 text-red-700"
                    }`}
                  >
                    {status.msg}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-gray-50 border border-gray-200 rounded-2xl p-12 text-center text-gray-400 text-sm">
              בחר משתמש מהרשימה כדי לעדכן את היתרה
            </div>
          )}
        </div>
      </div>
    </div>
  );
}