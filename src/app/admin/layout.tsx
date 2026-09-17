"use client";

import { useSession } from "next-auth/react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { useEffect, useState } from "react";

const NAV_ITEMS = [
  { href: "/admin", label: "דשבורד", icon: "📊" },
  { href: "/admin/games", label: "משחקים", icon: "🎮" },
  { href: "/admin/users", label: "משתמשים", icon: "👥" },
  { href: "/admin/refunds", label: "בקשות החזר", icon: "💰" },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const role = (session?.user as { role?: string } | undefined)?.role;

  // סגור תפריט בכל ניווט
  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/login");
    } else if (status === "authenticated" && role !== "ADMIN") {
      router.replace("/");
    }
  }, [status, role, router]);

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="inline-block w-8 h-8 border-2 border-gray-300 border-t-black rounded-full animate-spin" />
      </div>
    );
  }

  if (status !== "authenticated" || role !== "ADMIN") {
    return null;
  }

  return (
    <div dir="rtl" className="min-h-screen bg-gray-50">
      {/* כותרת עליונה לנייד */}
      <header className="md:hidden bg-black text-white flex items-center justify-between px-4 py-3 sticky top-0 z-30">
        <button
          onClick={() => setSidebarOpen(true)}
          className="p-2 -mr-2"
          aria-label="פתח תפריט"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="3" y1="6" x2="21" y2="6" />
            <line x1="3" y1="12" x2="21" y2="12" />
            <line x1="3" y1="18" x2="21" y2="18" />
          </svg>
        </button>
        <Link href="/admin" className="flex items-center gap-2">
          <span className="text-xl">🎱</span>
          <span className="font-bold">בינגו</span>
        </Link>
        <div className="w-8" />
      </header>

      <div className="flex">
        {/* Overlay לנייד */}
        {sidebarOpen && (
          <div
            onClick={() => setSidebarOpen(false)}
            className="fixed inset-0 bg-black/60 z-40 md:hidden"
            aria-hidden="true"
          />
        )}

        {/* סרגל צד */}
        <aside
          className={[
            "w-64 bg-black text-white flex flex-col shrink-0",
            "fixed md:sticky top-0 h-screen z-50 md:z-auto",
            "transition-transform duration-300 ease-in-out",
            sidebarOpen ? "translate-x-0" : "translate-x-full md:translate-x-0",
            "right-0 md:right-auto",
          ].join(" ")}
        >
          {/* כפתור סגירה לנייד */}
          <button
            onClick={() => setSidebarOpen(false)}
            className="md:hidden absolute top-4 left-4 p-2 text-gray-400 hover:text-white"
            aria-label="סגור תפריט"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>

          {/* לוגו */}
          <div className="p-6 border-b border-gray-800">
            <Link href="/admin" className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-white text-black flex items-center justify-center text-xl">
                🎱
              </div>
              <div>
                <div className="font-bold">בינגו</div>
                <div className="text-xs text-gray-400">ממשק ניהול</div>
              </div>
            </Link>
          </div>

          {/* ניווט */}
          <nav className="flex-1 p-4 overflow-y-auto">
            <ul className="space-y-1">
              {NAV_ITEMS.map((item) => {
                const isActive =
                  item.href === "/admin"
                    ? pathname === "/admin"
                    : pathname.startsWith(item.href);
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${
                        isActive
                          ? "bg-white text-black font-semibold"
                          : "text-gray-300 hover:bg-gray-800 hover:text-white"
                      }`}
                    >
                      <span>{item.icon}</span>
                      <span>{item.label}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>

          {/* תחתית */}
          <div className="p-4 border-t border-gray-800">
            <div className="text-xs text-gray-400 mb-3 px-4 truncate">
              מחובר כ: {session.user?.email}
            </div>
            <Link
              href="/"
              className="flex items-center gap-3 px-4 py-2 rounded-xl text-gray-300 hover:bg-gray-800 hover:text-white transition-colors text-sm"
            >
              ← חזרה לאתר
            </Link>
          </div>
        </aside>

        {/* תוכן ראשי */}
        <main className="flex-1 min-w-0 overflow-y-auto">
          <div className="max-w-5xl mx-auto p-4 sm:p-6 md:p-8">{children}</div>
        </main>
      </div>
    </div>
  );
}