"use client";

import { useEffect, useState } from "react";

type Props = {
  isOpen: boolean;
  prizeType: "LINE" | "BINGO";
  amount: number;
  winnersCount: number;
  onClose: () => void;
};

export function WinModal({ isOpen, prizeType, amount, winnersCount, onClose }: Props) {
  const [showConfetti, setShowConfetti] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setShowConfetti(true);
      const t = setTimeout(() => setShowConfetti(false), 3000);
      return () => clearTimeout(t);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const isBingo = prizeType === "BINGO";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70">
      {showConfetti && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {Array.from({ length: 40 }).map((_, i) => (
            <div
              key={i}
              className="absolute w-3 h-3 animate-bounce"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                backgroundColor: ["#FCD34D", "#F59E0B", "#FFFFFF", "#000000"][i % 4],
                borderRadius: i % 2 === 0 ? "50%" : "0",
                animationDelay: `${Math.random() * 2}s`,
                animationDuration: `${1 + Math.random() * 2}s`,
                opacity: 0.7,
              }}
            />
          ))}
        </div>
      )}

      <div className="relative bg-white rounded-3xl max-w-sm w-full p-8 text-center shadow-2xl">
        <div className="text-7xl mb-4 animate-bounce">
          {isBingo ? "🏆" : "📏"}
        </div>

        <h2
          className={`text-4xl font-extrabold mb-2 ${
            isBingo ? "text-yellow-500" : "text-blue-500"
          }`}
        >
          {isBingo ? "בינגו!" : "שורה!"}
        </h2>

        <p className="text-gray-500 mb-6">
          {isBingo ? "זכית בפרס הגדול!" : "זכית בפרס השורה!"}
        </p>

        <div className="bg-black text-white rounded-2xl py-6 px-4 mb-4">
          <div className="text-sm text-gray-400 mb-1">הזכייה שלך</div>
          <div className="text-5xl font-extrabold text-yellow-400">
            {amount.toLocaleString("he-IL")}
          </div>
          <div className="text-sm text-gray-400 mt-1">מטבעות 💵</div>
        </div>

        {winnersCount > 1 && (
          <div className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-2 mb-4 text-xs text-gray-600">
            ℹ️ יש {winnersCount} זוכים — הפרס מתחלק שווה בשווה
          </div>
        )}

        <p className="text-xs text-gray-400 mb-6">
          הזכייה תועבר לחשבונך על-ידי האדמין
        </p>

        <button
          onClick={onClose}
          className="w-full bg-black text-white font-bold rounded-xl py-3 hover:bg-gray-800 transition-colors"
        >
          מעולה!
        </button>
      </div>
    </div>
  );
}