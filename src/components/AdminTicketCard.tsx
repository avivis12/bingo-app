"use client";

import { ticketNumbersToGrid, hasCompletedLine, hasFullBingo } from "@/lib/tickets";

const COLUMN_LABELS = ["B", "I", "N", "G", "O"];

type Props = {
  ticket: {
    id: string;
    numbers: number[];
    userName: string;
    userPhone: string;
  };
  ballsDrawn: number[];
  isLineWinner: boolean;
  isBingoWinner: boolean;
  isDistributed: boolean;
};

export function AdminTicketCard({
  ticket,
  ballsDrawn,
  isLineWinner,
  isBingoWinner,
  isDistributed,
}: Props) {
  const grid = ticketNumbersToGrid(ticket.numbers);
  const drawnSet = new Set(ballsDrawn);
  const hasLine = hasCompletedLine(ticket.numbers, ballsDrawn);
  const hasBingo = hasFullBingo(ticket.numbers, ballsDrawn);

  // מסגרת הכרטיס – לפי סטטוס
  const borderClass = isBingoWinner
    ? "border-yellow-400 ring-2 ring-yellow-400/50"
    : isLineWinner
    ? "border-blue-400 ring-1 ring-blue-400/30"
    : hasBingo
    ? "border-green-400"
    : hasLine
    ? "border-blue-300"
    : "border-gray-800";

  return (
    <div className={`bg-gray-900 rounded-xl p-3 border-2 ${borderClass}`}>
      {/* שם השחקן + תגים */}
      <div className="flex items-center justify-between gap-2 mb-2">
        <div className="min-w-0 flex-1">
          <div className="font-bold text-sm text-white truncate">
            {ticket.userName}
          </div>
          <div className="text-xs text-gray-500 truncate">
            {ticket.userPhone}
          </div>
        </div>
        <div className="flex gap-1 shrink-0">
          {isBingoWinner && (
            <span className="bg-yellow-400 text-gray-900 text-xs font-bold rounded px-2 py-0.5">
              👑 בינגו
            </span>
          )}
          {isLineWinner && !isBingoWinner && (
            <span className="bg-blue-500 text-white text-xs font-bold rounded px-2 py-0.5">
              שורה
            </span>
          )}
          {hasBingo && !isBingoWinner && (
            <span className="bg-green-500 text-white text-xs font-bold rounded px-2 py-0.5 animate-pulse">
              מוכן לבינגו
            </span>
          )}
          {hasLine && !isLineWinner && !hasBingo && (
            <span className="bg-blue-400 text-white text-xs font-bold rounded px-2 py-0.5">
              מוכן לשורה
            </span>
          )}
        </div>
      </div>

      {/* הכרטיס */}
      <div className="grid grid-cols-5 gap-0.5">
        {COLUMN_LABELS.map((label) => (
          <div
            key={label}
            className="text-center font-bold text-[10px] text-yellow-400 pb-0.5"
          >
            {label}
          </div>
        ))}
        {Array.from({ length: 4 }).map((_, row) =>
          grid.map((col, colIdx) => {
            const num = col[row];
            const isMarked = drawnSet.has(num);
            return (
              <div
                key={`${colIdx}-${row}`}
                className={[
                  "aspect-square rounded-sm flex items-center justify-center font-semibold text-[10px] sm:text-xs border transition-colors",
                  isMarked
                    ? "bg-yellow-400 text-gray-900 border-yellow-300"
                    : "bg-gray-800 text-gray-400 border-gray-700",
                ].join(" ")}
              >
                {num}
              </div>
            );
          })
        )}
      </div>

      {/* סטטיסטיקה */}
      <div className="text-center text-[10px] text-gray-500 mt-1.5">
        {ticket.numbers.filter((n) => drawnSet.has(n)).length}/{ticket.numbers.length} סומנו
      </div>
    </div>
  );
}