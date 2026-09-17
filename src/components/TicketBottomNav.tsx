"use client";

type TicketTab = {
  id: string;
  label: string; // "כרטיס 1"
  markedCount: number; // כמה מ-20 המספרים כבר נשלפו
  totalCount: number; // 20
};

export function TicketBottomNav({
  tickets,
  activeId,
  onSelect,
}: {
  tickets: TicketTab[];
  activeId: string;
  onSelect: (id: string) => void;
}) {
  return (
    <nav
      dir="rtl"
      className="fixed bottom-0 inset-x-0 z-40 flex border-t border-gray-800 bg-gray-950/95 backdrop-blur md:hidden"
      aria-label="מעבר בין כרטיסים"
    >
      {tickets.map((t) => {
        const isActive = t.id === activeId;
        const isClose = t.markedCount >= t.totalCount - 2 && t.markedCount < t.totalCount;
        return (
          <button
            key={t.id}
            onClick={() => onSelect(t.id)}
            className={[
              "flex-1 flex flex-col items-center justify-center gap-0.5 py-2.5 text-sm font-medium transition-colors",
              isActive ? "text-yellow-400 border-t-2 border-yellow-400" : "text-gray-400 border-t-2 border-transparent",
              isClose && !isActive ? "text-orange-400" : "",
            ].join(" ")}
          >
            <span>{t.label}</span>
            <span className="text-[11px] opacity-80">
              {t.markedCount}/{t.totalCount}
            </span>
          </button>
        );
      })}
    </nav>
  );
}
