"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const res = await signIn("credentials", {
      email,
      password,
      redirect: false,
      // "זכור אותי" — ניתן לממש הבדלי משך session ב-callbacks.jwt לפי דגל זה.
      remember: remember ? "1" : "0",
    });
    if (res?.error) {
      setError("אימייל או סיסמה שגויים");
      return;
    }
    router.push("/");
    router.refresh();
  }

  return (
    <div dir="rtl" className="max-w-sm mx-auto mt-16 p-6">
      <h1 className="text-2xl font-bold mb-6">התחברות</h1>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <input
          className="border rounded-lg px-3 py-2"
          placeholder="אימייל"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <input
          className="border rounded-lg px-3 py-2"
          placeholder="סיסמה"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} />
          זכור אותי
        </label>
        {error && <p className="text-red-500 text-sm">{error}</p>}
        <button type="submit" className="bg-yellow-400 text-gray-900 font-bold rounded-lg py-2">
          התחבר
        </button>
      </form>

      <div className="mt-4 text-sm text-center">
        <a href="/forgot-password" className="text-blue-500 underline">
          שכחתי סיסמה
        </a>
      </div>
    </div>
  );
}
