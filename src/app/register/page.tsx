"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
  });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    // 🔒 בדיקת אימות סיסמה
    if (form.password !== form.confirmPassword) {
      setError("הסיסמאות אינן תואמות");
      return;
    }

    // בדיקת אורך סיסמה
    if (form.password.length < 6) {
      setError("הסיסמה חייבת להכיל לפחות 6 תווים");
      return;
    }

    // בדיקת טלפון (ספרות בלבד)
    const phoneDigits = form.phone.replace(/\D/g, "");
    if (phoneDigits.length < 9 || phoneDigits.length > 10) {
      setError("מספר הטלפון חייב להכיל 9-10 ספרות");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          email: form.email,
          phone: form.phone,
          password: form.password,
        }),
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

  const passwordsMatch =
    form.confirmPassword.length === 0 || form.password === form.confirmPassword;

  return (
    <div dir="rtl" className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* לוגו + כותרת */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-black text-white text-2xl mb-3">
            🎱
          </div>
          <h1 className="text-2xl font-bold text-black">בינגו</h1>
          <p className="text-sm text-gray-500 mt-1">הרשמה לחשבון חדש</p>
        </div>

        {/* כרטיס */}
        <div className="bg-white border border-gray-200 rounded-2xl p-5">
          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            <div>
              <label className="block text-xs text-gray-500 mb-1">שם מלא</label>
              <input
                className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm text-black focus:outline-none focus:border-black transition-colors"
                placeholder="ישראל ישראלי"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
                autoComplete="name"
              />
            </div>

            <div>
              <label className="block text-xs text-gray-500 mb-1">אימייל</label>
              <input
                className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm text-black focus:outline-none focus:border-black transition-colors"
                placeholder="your@email.com"
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                required
                autoComplete="email"
              />
            </div>

            <div>
              <label className="block text-xs text-gray-500 mb-1">טלפון</label>
              <input
                className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm text-black focus:outline-none focus:border-black transition-colors"
                placeholder="0501234567"
                type="tel"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                required
                autoComplete="tel"
              />
            </div>

            <div>
              <label className="block text-xs text-gray-500 mb-1">סיסמה</label>
              <input
                className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm text-black focus:outline-none focus:border-black transition-colors"
                placeholder="לפחות 6 תווים"
                type="password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                required
                autoComplete="new-password"
              />
            </div>

            <div>
              <label className="block text-xs text-gray-500 mb-1">אימות סיסמה</label>
              <input
                className={`w-full border rounded-xl px-3 py-2.5 text-sm text-black focus:outline-none transition-colors ${
                  passwordsMatch
                    ? "border-gray-300 focus:border-black"
                    : "border-red-400 focus:border-red-500 bg-red-50"
                }`}
                placeholder="הקלד שוב את הסיסמה"
                type="password"
                value={form.confirmPassword}
                onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
                required
                autoComplete="new-password"
              />
              {!passwordsMatch && (
                <p className="text-red-600 text-[10px] mt-1">הסיסמאות אינן תואמות</p>
              )}
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl px-3 py-2 text-center">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !passwordsMatch}
              className="w-full bg-black text-white font-bold rounded-xl py-3 text-sm hover:bg-gray-800 disabled:opacity-50 transition-colors mt-1"
            >
              {loading ? "נרשם..." : "הרשמה"}
            </button>
          </form>

          {/* קישור */}
          <div className="mt-4 pt-4 border-t border-gray-200 text-center text-xs">
            <Link
              href="/login"
              className="text-gray-500 hover:text-black transition-colors"
            >
              יש לך חשבון? <span className="font-bold text-black">התחבר</span>
            </Link>
          </div>
        </div>

        {/* פוטר */}
        <p className="text-center text-[10px] text-gray-400 mt-4">
          © {new Date().getFullYear()} בינגו
        </p>
      </div>
    </div>
  );
}