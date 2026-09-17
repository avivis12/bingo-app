"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({ name: "", email: "", phone: "", password: "" });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "שגיאה בהרשמה");
        return;
      }
      router.push("/login?registered=1");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div dir="rtl" className="max-w-sm mx-auto mt-16 p-6">
      <h1 className="text-2xl font-bold mb-6">הרשמה</h1>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <input
          className="border rounded-lg px-3 py-2"
          placeholder="שם מלא"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          required
        />
        <input
          className="border rounded-lg px-3 py-2"
          placeholder="אימייל"
          type="email"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
          required
        />
        <input
          className="border rounded-lg px-3 py-2"
          placeholder="טלפון (חובה) — למשל 0501234567"
          value={form.phone}
          onChange={(e) => setForm({ ...form, phone: e.target.value })}
          required
        />
        <input
          className="border rounded-lg px-3 py-2"
          placeholder="סיסמה"
          type="password"
          value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
          required
        />
        {error && <p className="text-red-500 text-sm">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="bg-yellow-400 text-gray-900 font-bold rounded-lg py-2 disabled:opacity-50"
        >
          {loading ? "נרשם..." : "הרשמה"}
        </button>
      </form>
    </div>
  );
}
