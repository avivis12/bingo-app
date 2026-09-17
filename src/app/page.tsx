"use client";

import { useEffect, useState } from "react";
import { useSession, signOut } from "next-auth/react";
import Link from "next/link";

type Game = {
  id: string;
  // הוסף כאן שדות נוספים אם יש (למשל name, status וכו')
};

export default function HomePage() {
  const { data: session, status } = useSession();
  const [checked, setChecked] = useState(false);
  const [activeGame, setActiveGame] = useState<Game | null>(null);
  const [noGame, setNoGame] = useState(false);

  useEffect(() => {
    fetch("/api/games/current")
      .then((r) => r.json())
      .then((d) => {
        if (d.game) {
          setActiveGame(d.game);
        } else {
          setNoGame(true);
        }
      })
      .catch(() => setNoGame(true))
      .finally(() => setChecked(true));
  }, []);

  const role = (session?.user as { role?: string } | undefined)?.role;
  const isLoading = status === "loading" || !checked;

  return (
    <div dir="rtl" className="min-h-screen bg-white flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* כרטיס ראשי */}
        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-8">
          {/* לוגו + כותרת */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-black text-white text-2xl mb-4">
              🎱
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-black">
              בינגו
            </h1>
            <p className="text-sm text-gray-500 mt-2">
              משחק הבינגו החברתי
            </p>
          </div>

          {/* מצב טעינה */}
          {isLoading && (
            <div className="text-center py-6">
              <div className="inline-block w-6 h-6 border-2 border-gray-300 border-t-black rounded-full animate-spin" />
              <p className="text-sm text-gray-500 mt-3">טוען...</p>
            </div>
          )}

          {!isLoading && (
            <div className="flex flex-col gap-3">
              {/* משחק פעיל – כפתור הצטרפות */}
              {activeGame && (
                <div className="mb-2">
                  <div className="bg-black text-white rounded-xl p-4 mb-3 text-center">
                    <p className="text-xs uppercase tracking-wider text-gray-400 mb-1">
                      משחק פעיל כעת
                    </p>
                    <p className="text-lg font-bold">
                      🎮 מוכן להצטרף?
                    </p>
                  </div>
                  <Link
                    href={`/game/${activeGame.id}`}
                    className="block w-full text-center bg-black text-white font-semibold rounded-xl py-3 hover:bg-gray-800 transition-colors"
                  >
                    הצטרף למשחק הפעיל
                  </Link>
                </div>
              )}

              {/* אין משחק פעיל */}
              {noGame && (
                <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 text-center mb-2">
                  <p className="text-sm text-gray-500">
                    אין כרגע משחק פעיל. חזרו מאוחר יותר.
                  </p>
                </div>
              )}

              {/* כפתורי התחברות / הרשמה */}
              {status === "unauthenticated" && (
                <div className="flex flex-col gap-3 mt-2">
                  <Link
                    href="/login"
                    className="w-full text-center bg-black text-white font-semibold rounded-xl py-3 hover:bg-gray-800 transition-colors"
                  >
                    התחברות
                  </Link>
                  <Link
                    href="/register"
                    className="w-full text-center bg-white text-black font-semibold border border-gray-300 rounded-xl py-3 hover:bg-gray-50 transition-colors"
                  >
                    הרשמה
                  </Link>
                </div>
              )}

              {/* אזור משתמש מחובר */}
              {status === "authenticated" && (
                <div className="flex flex-col gap-3 mt-2">
                  <Link
                    href="/profile"
                    className="w-full text-center bg-white text-black font-semibold border border-gray-300 rounded-xl py-3 hover:bg-gray-50 transition-colors"
                  >
                    הפרופיל שלי
                  </Link>

                  {/* קישורי אדמין */}
                  {role === "ADMIN" && (
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
                        ניהול
                      </p>
                      <div className="flex flex-col gap-2">
                        <Link
                          href="/admin/games"
                          className="w-full text-center bg-white text-black font-medium border border-gray-300 rounded-xl py-2.5 hover:bg-gray-50 transition-colors text-sm"
                        >
                          ניהול משחקים
                        </Link>
                        <Link
                          href="/admin/users"
                          className="w-full text-center bg-white text-black font-medium border border-gray-300 rounded-xl py-2.5 hover:bg-gray-50 transition-colors text-sm"
                        >
                          ניהול משתמשים / מטבעות
                        </Link>
                        <Link
                          href="/admin/refunds"
                          className="w-full text-center bg-white text-black font-medium border border-gray-300 rounded-xl py-2.5 hover:bg-gray-50 transition-colors text-sm"
                        >
                          בקשות החזר
                        </Link>
                      </div>
                    </div>
                  )}

                  {/* התנתקות */}
                  <button
                    onClick={() => signOut()}
                    className="mt-4 text-center text-sm text-gray-500 hover:text-black transition-colors underline-offset-4 hover:underline"
                  >
                    התנתקות
                  </button>
                </div>
              )}
            </div>
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