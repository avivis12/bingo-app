"use client";

import { use, useState } from "react";
import { useRouter } from "next/navigation";

export default function ResetPasswordPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = use(params);
  const router = useRouter();
  const [newPassword, setNewPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const res = await fetch("/api/auth/reset-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, newPassword }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error ?? "שגיאה");
      return;
    }
    setDone(true);
    setTimeout(() => router.push("/login"), 2000);
  }

  return (
    <div dir="rtl" className="max-w-sm mx-auto mt-16 p-6">
      <h1 className="text-2xl font-bold mb-6">קביעת סיסמה חדשה</h1>
      {done ? (
        <p>הסיסמה עודכנה בהצלחה. מעביר להתחברות...</p>
      ) : (
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <input
            className="border rounded-lg px-3 py-2"
            placeholder="סיסמה חדשה"
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
          />
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <button type="submit" className="bg-yellow-400 text-gray-900 font-bold rounded-lg py-2">
            עדכן סיסמה
          </button>
        </form>
      )}
    </div>
  );
}
