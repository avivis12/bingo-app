"use client";

import { useEffect, useState } from "react";

type RefundRequest = {
  id: string;
  amountRequested: number;
  userNote: string | null;
  status: string;
  createdAt: string;
  user: { name: string; phone: string; email: string; coinsBalance: number };
};

export default function AdminRefundsPage() {
  const [requests, setRequests] = useState<RefundRequest[]>([]);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/refunds?status=PENDING");
      if (res.ok) setRequests((await res.json()).requests);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, []);

  async function resolve(id: string, action: "APPROVE" | "REJECT") {
    if (action === "APPROVE" && !confirm("האם העברת את הכסף למשתמש בפועל? אישור יפחית את היתרה שלו.")) {
      return;
    }
    setBusyId(id);
    try {
      await fetch(`/api/admin/refunds/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      await load();
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <h1 className="text-3xl font-bold">בקשות החזר</h1>
        <button
          onClick={load}
          className="text-sm text-gray-500 hover:text-black transition-colors"
        >
          🔄 רענן
        </button>
      </div>
      <p className="text-gray-500 mb-8">אשר או דחה בקשות החזר ממתינות</p>

      {loading ? (
        <div className="p-12 text-center">
          <div className="inline-block w-6 h-6 border-2 border-gray-300 border-t-black rounded-full animate-spin" />
        </div>
      ) : requests.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-2xl p-12 text-center">
          <div className="text-4xl mb-3">✅</div>
          <p className="text-gray-500">אין בקשות ממתינות כרגע</p>
        </div>
      ) : (
        <ul className="space-y-4">
          {requests.map((r) => (
            <li key={r.id} className="bg-white border border-gray-200 rounded-2xl p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <div className="font-bold text-lg">{r.user.name}</div>
                  <div className="text-sm text-gray-500 mt-1">
                    {r.user.phone} · {r.user.email}
                  </div>
                  <div className="text-sm text-gray-500">
                    יתרה נוכחית: <b className="text-black">{r.user.coinsBalance} 💵</b>
                  </div>
                </div>
                <div className="bg-black text-white rounded-xl px-4 py-2 font-bold">
                  {r.amountRequested} 💵
                </div>
              </div>

              {r.userNote && (
                <div className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 mb-4 text-sm">
                  <b>הערת המשתמש:</b> {r.userNote}
                </div>
              )}

              <div className="text-xs text-gray-500 mb-4">
                נשלח: {new Date(r.createdAt).toLocaleString("he-IL")}
              </div>

              <div className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 mb-4 text-xs text-gray-600">
                ⚠️ יש להעביר את הכסף למשתמש בפועל (מחוץ למערכת) <b>לפני</b> לחיצה על אישור.
              </div>

              <div className="flex gap-2">
                <button
                  disabled={busyId === r.id}
                  onClick={() => resolve(r.id, "APPROVE")}
                  className="bg-black text-white rounded-xl px-6 py-2.5 text-sm font-semibold hover:bg-gray-800 disabled:opacity-50 transition-colors"
                >
                  {busyId === r.id ? "מעבד..." : "אישרתי — הפחת יתרה"}
                </button>
                <button
                  disabled={busyId === r.id}
                  onClick={() => resolve(r.id, "REJECT")}
                  className="bg-white text-black border border-gray-300 rounded-xl px-6 py-2.5 text-sm font-semibold hover:bg-gray-50 disabled:opacity-50 transition-colors"
                >
                  דחה
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}