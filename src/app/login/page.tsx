"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await signIn("credentials", {
        email,
        password,
        redirect: false,
        remember: remember ? "1" : "0",
      });
      if (res?.error) {
        setError("אימייל או סיסמה שגויים");
        return;
      }
      router.push("/");
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div dir="rtl" className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* לוגו + כותרת */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-black text-white text-2xl mb-3">
            🎱
          </div>
          <h1 className="text-2xl font-bold text-black">בינגו</h1>
          <p className="text-sm text-gray-500 mt-1">התחברות לחשבון</p>
        </div>

        {/* כרטיס */}
        <div className="bg-white border border-gray-200 rounded-2xl p-5">
          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            <div>
              <label className="block text-xs text-gray-500 mb-1">אימייל</label>
              <input
                className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm text-black focus:outline-none focus:border-black transition-colors"
                placeholder="your@email.com"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
            </div>

            <div>
              <label className="block text-xs text-gray-500 mb-1">סיסמה</label>
              <input
                className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm text-black focus:outline-none focus:border-black transition-colors"
                placeholder="••••••••"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
              />
            </div>

            <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={remember}
                onChange={(e) => setRemember(e.target.checked)}
                className="w-4 h-4"
              />
              זכור אותי
            </label>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl px-3 py-2 text-center">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-black text-white font-bold rounded-xl py-3 text-sm hover:bg-gray-800 disabled:opacity-50 transition-colors mt-1"
            >
              {loading ? "מתחבר..." : "התחבר"}
            </button>
          </form>

          {/* קישורים */}
          <div className="mt-4 pt-4 border-t border-gray-200 flex flex-col gap-2 text-center text-xs">
            <Link
              href="/forgot-password"
              className="text-gray-500 hover:text-black transition-colors"
            >
              שכחתי סיסמה
            </Link>
            <Link
              href="/register"
              className="text-gray-500 hover:text-black transition-colors"
            >
              אין לך חשבון? <span className="font-bold text-black">הירשם</span>
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