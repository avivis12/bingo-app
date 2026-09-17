"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Stats = {
  totalUsers: number;
  activeGames: number;
  pendingRefunds: number;
  totalCoinsInSystem: number;
};

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    // TODO: להחליף ב-API אמיתי אם יש
    Promise.all([
      fetch("/api/admin/users?q=").then((r) => r.json()),
      fetch("/api/admin/games").then((r) => r.json()),
      fetch("/api/admin/refunds?status=PENDING").then((r) => r.json()),
    ]).then(([usersData, gamesData, refundsData]) => {
      const users = usersData.users ?? [];
      const games = gamesData.games ?? [];
      const refunds = refundsData.requests ?? [];

      setStats({
        totalUsers: users.length,
        activeGames: games.filter((g: { status: string }) =>
          ["SELLING", "COUNTDOWN", "LIVE"].includes(g.status)
        ).length,
        pendingRefunds: refunds.length,
        totalCoinsInSystem: users.reduce(
          (sum: number, u: { coinsBalance: number }) => sum + u.coinsBalance,
          0
        ),
      });
    });
  }, []);

  return (
    <div>
      <h1 className="text-3xl font-bold mb-2">דשבורד</h1>
      <p className="text-gray-500 mb-8">סקירה כללית של המערכת</p>

      {!stats ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white border border-gray-200 rounded-2xl p-6 h-32 animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="סה״כ משתמשים" value={stats.totalUsers} icon="👥" />
          <StatCard label="משחקים פעילים" value={stats.activeGames} icon="🎮" />
          <StatCard label="בקשות החזר ממתינות" value={stats.pendingRefunds} icon="💰" />
          <StatCard label="מטבעות במערכת" value={stats.totalCoinsInSystem} icon="💵" />
        </div>
      )}

      {/* קיצורי דרך */}
      <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
        <QuickLink href="/admin/games" icon="🎮" title="ניהול משחקים" desc="צור, עקוב, סיים משחקים" />
        <QuickLink href="/admin/users" icon="👥" title="ניהול משתמשים" desc="חפש משתמשים, הזן מטבעות" />
        <QuickLink href="/admin/refunds" icon="💰" title="בקשות החזר" desc="אשר או דחה בקשות" />
      </div>
    </div>
  );
}

function StatCard({ label, value, icon }: { label: string; value: number; icon: string }) {
  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-6">
      <div className="text-2xl mb-2">{icon}</div>
      <div className="text-3xl font-bold text-black">{value.toLocaleString("he-IL")}</div>
      <div className="text-sm text-gray-500 mt-1">{label}</div>
    </div>
  );
}

function QuickLink({ href, icon, title, desc }: { href: string; icon: string; title: string; desc: string }) {
  return (
    <Link
      href={href}
      className="bg-white border border-gray-200 rounded-2xl p-6 hover:border-black hover:shadow-sm transition-all group"
    >
      <div className="text-2xl mb-3">{icon}</div>
      <div className="font-bold text-black group-hover:underline">{title}</div>
      <div className="text-sm text-gray-500 mt-1">{desc}</div>
    </Link>
  );
}