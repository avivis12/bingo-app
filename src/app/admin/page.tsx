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
      <h1 className="text-2xl sm:text-3xl font-bold mb-1 sm:mb-2">דשבורד</h1>
      <p className="text-xs sm:text-sm text-gray-500 mb-4 sm:mb-6">
        סקירה כללית של המערכת
      </p>

      {!stats ? (
        <div className="grid grid-cols-4 gap-2 sm:gap-3">
          {[...Array(4)].map((_, i) => (
            <div
              key={i}
              className="bg-white border border-gray-200 rounded-xl p-2 sm:p-4 h-20 sm:h-28 animate-pulse"
            />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-4 gap-2 sm:gap-3">
          <StatCard label="משתמשים" value={stats.totalUsers} icon="👥" />
          <StatCard label="משחקים פעילים" value={stats.activeGames} icon="🎮" />
          <StatCard label="החזרים" value={stats.pendingRefunds} icon="💰" />
          <StatCard label="מטבעות" value={stats.totalCoinsInSystem} icon="💵" />
        </div>
      )}

      {/* קיצורי דרך */}
      <div className="mt-4 sm:mt-6 grid grid-cols-3 gap-2 sm:gap-3">
        <QuickLink
          href="/admin/games"
          icon="🎮"
          title="ניהול משחקים"
          desc="צור, עקוב, סיים"
        />
        <QuickLink
          href="/admin/users"
          icon="👥"
          title="ניהול משתמשים"
          desc="חפש, הזן מטבעות"
        />
        <QuickLink
          href="/admin/refunds"
          icon="💰"
          title="בקשות החזר"
          desc="אשר או דחה"
        />
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  icon,
}: {
  label: string;
  value: number;
  icon: string;
}) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-2 sm:p-4">
      <div className="text-base sm:text-2xl mb-0.5 sm:mb-1">{icon}</div>
      <div className="text-base sm:text-2xl font-bold text-black truncate">
        {value.toLocaleString("he-IL")}
      </div>
      <div className="text-[10px] sm:text-xs text-gray-500 truncate">{label}</div>
    </div>
  );
}

function QuickLink({
  href,
  icon,
  title,
  desc,
}: {
  href: string;
  icon: string;
  title: string;
  desc: string;
}) {
  return (
    <Link
      href={href}
      className="bg-white border border-gray-200 rounded-xl p-2 sm:p-4 hover:border-black hover:shadow-sm transition-all group"
    >
      <div className="text-base sm:text-2xl mb-1 sm:mb-2">{icon}</div>
      <div className="font-bold text-black text-[10px] sm:text-sm group-hover:underline leading-tight">
        {title}
      </div>
      <div className="text-[9px] sm:text-xs text-gray-500 mt-0.5 sm:mt-1 hidden sm:block">
        {desc}
      </div>
    </Link>
  );
}