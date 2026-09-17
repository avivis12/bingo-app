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

          return (
            <button
              type="button"
              key={`${colIdx}-${row}`}
              onClick={() => isClickable && onToggle(num)}
              disabled={!isClickable}
              className={[
                "aspect-square rounded flex items-center justify-center font-semibold border transition-all",
                compact
                  ? "text-xs sm:text-sm rounded-sm sm:rounded"
                  : "text-sm sm:text-lg rounded-lg",
                isMarked
                  ? "bg-yellow-400 text-gray-900 border-yellow-300 scale-95"
                  : isDrawn
                  ? "bg-gray-700 text-white border-gray-500 cursor-pointer hover:bg-gray-600 active:scale-95"
                  : "bg-gray-800 text-gray-500 border-gray-700 cursor-not-allowed",
              ].join(" ")}
            >
              {num}
            </button>
          );
        })
      )}
    </div>
  );
}