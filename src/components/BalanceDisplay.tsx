"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";

export function BalanceDisplay() {
  const { status } = useSession();
  const [balance, setBalance] = useState<number | null>(null);

  useEffect(() => {
    if (status !== "authenticated") return;

    async function fetchBalance() {
      try {
        const res = await fetch("/api/me");
        if (res.ok) {
          const data = await res.json();
          setBalance(data.coinsBalance);
        }
      } catch {
        // silent
      }
    }

    fetchBalance();

    // רענון כל 5 שניות (רק כשהחלון בפוקוס)
    const id = setInterval(() => {
      if (document.hasFocus()) fetchBalance();
    }, 5000);

    // רענון כשהחלון חוזר לפוקוס
    const onFocus = () => fetchBalance();
    window.addEventListener("focus", onFocus);

    return () => {
      clearInterval(id);
      window.removeEventListener("focus", onFocus);
    };
  }, [status]);

  if (status !== "authenticated" || balance === null) return null;

  return (
    <div className="fixed top-3 left-3 z-40 bg-black text-white rounded-full px-4 py-2 shadow-lg flex items-center gap-2 text-sm font-bold">
      <span>🪙</span>
      <span>{balance.toLocaleString("he-IL")}</span>
    </div>
  );
}