"use client";

import { useState } from "react";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    await fetch("/api/auth/forgot-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    setSent(true);
  }

  return (
    <div dir="rtl" className="max-w-sm mx-auto mt-16 p-6">
      <h1 className="text-2xl font-bold mb-6">שחזור סיסמה</h1>
      {sent ? (
        <p>אם קיים חשבון עם האימייל הזה, נשלח אליו קישור לאיפוס סיסמה.</p>
      ) : (
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <input
            className="border rounded-lg px-3 py-2"
            placeholder="אימייל"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <button type="submit" className="bg-yellow-400 text-gray-900 font-bold rounded-lg py-2">
            שלח קישור איפוס
          </button>
        </form>
      )}
    </div>
  );
}
