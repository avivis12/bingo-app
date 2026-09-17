"use client";

import { useSession } from "next-auth/react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { useEffect } from "react";

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

  const role = (session?.user as { role?: string } | undefined)?.role;

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
    <div dir="rtl" className="min-h-screen bg-gray-50 flex">
      {/* סרגל צד */}
      <aside className="w-64 bg-black text-white flex flex-col shrink-0">
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
        <nav className="flex-1 p-4">
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
          <div className="text-xs text-gray-400 mb-3 px-4">
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
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-5xl mx-auto p-8">{children}</div>
      </main>
    </div>
  );
}