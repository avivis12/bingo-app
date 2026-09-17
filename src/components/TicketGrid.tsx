"use client";

import { ticketNumbersToGrid } from "@/lib/tickets";

export function TicketGrid({
  numbers,
  drawnBalls,
  markedNumbers,
  onToggle,
  compact = false,
  disabled = false,
}: {
  numbers: number[];
  drawnBalls: number[];
  markedNumbers: number[];
  onToggle?: (num: number) => void;
  compact?: boolean;
  disabled?: boolean;
}) {
  const grid = ticketNumbersToGrid(numbers);
  const drawnSet = new Set(drawnBalls);
  const markedSet = new Set(markedNumbers);

  return (
    <div
      dir="rtl"
      className={[
        "grid grid-cols-5 w-full mx-auto",
        compact ? "gap-0.5 sm:gap-1" : "gap-1.5 max-w-sm",
      ].join(" ")}
    >
      {Array.from({ length: 4 }).map((_, row) =>
        grid.map((col, colIdx) => {
          const num = col[row];
          const isDrawn = drawnSet.has(num);
          const isMarked = markedSet.has(num);
          const isClickable = !disabled && isDrawn && onToggle;

          // 3 מצבים:
          // 1. מסומן (marked)      → רקע ירוק, כיתוב לבן
          // 2. נשלף (drawn)        → רקע לבן, כיתוב שחור, מסגרת אפורה, לחיץ (hover מסגרת שחורה)
          // 3. לא נשלף (not drawn) → רקע לבן, כיתוב שחור, מסגרת אפורה בהירה, לא לחיץ
          let cellClass =
            "aspect-square rounded flex items-center justify-center font-bold border-2 transition-all";

          if (isMarked) {
            cellClass += " bg-green-500 text-white border-green-600 shadow-md";
          } else if (isDrawn) {
            cellClass +=
              " bg-white text-black border-gray-300 hover:border-black active:scale-95 cursor-pointer";
          } else {
            cellClass += " bg-white text-black border-gray-200 cursor-not-allowed";
          }

          if (compact) {
            cellClass += " text-xs sm:text-sm rounded-sm sm:rounded";
          } else {
            cellClass += " text-sm sm:text-lg rounded-lg";
          }

          return (
            <button
              type="button"
              key={`${colIdx}-${row}`}
              onClick={() => isClickable && onToggle(num)}
              disabled={!isClickable}
              className={cellClass}
            >
              {num}
            </button>
          );
        })
      )}
    </div>
  );
}