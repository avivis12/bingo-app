import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/games/:gameId
 *
 * מקור האמת למצב המשחק — נקרא בטעינה ראשונית של הדף וגם אחרי רענון.
 * מחזיר גם את סכומי הזכייה המדויקים לשורה ולבינגו, וגם את שמות הזוכים.
 */
export async function GET(req: Request, { params }: { params: Promise<{ gameId: string }> }) {
  const { gameId } = await params;
  const session = await auth();
  const userId = (session?.user as { id?: string } | undefined)?.id;

  const game = await prisma.game.findUnique({ where: { id: gameId } });
  if (!game) return NextResponse.json({ error: "משחק לא נמצא" }, { status: 404 });

  const [ticketCount, playerCount, myTickets] = await Promise.all([
    prisma.ticket.count({ where: { gameId } }),
    prisma.ticket
      .findMany({ where: { gameId }, select: { userId: true }, distinct: ["userId"] })
      .then((rows: unknown[]) => rows.length),
    userId
      ? prisma.ticket.findMany({ where: { gameId, userId }, orderBy: { createdAt: "asc" } })
      : Promise.resolve([]),
  ]);

  // 🔥 שמות הזוכים — שורה ובינגו
  const [lineWinnerUsers, bingoWinnerUsers] = await Promise.all([
    game.lineWinnerUserIds.length > 0
      ? prisma.user.findMany({
          where: { id: { in: game.lineWinnerUserIds } },
          select: { id: true, name: true },
        })
      : Promise.resolve([]),
    game.bingoWinnerUserIds.length > 0
      ? prisma.user.findMany({
          where: { id: { in: game.bingoWinnerUserIds } },
          select: { id: true, name: true },
        })
      : Promise.resolve([]),
  ]);

  const pot = game.ticketPrice * ticketCount;

  // חישוב סכומי זכייה — זהים ללוגיקה ב-distribute
  const linePrizeTotal = Math.floor(pot * 0.1); // 10% מהקופה
  const bingoPrizeTotal = Math.floor(pot * 0.75); // 75% מהקופה

  const lineWinnersCount = game.lineWinnerUserIds.length;
  const bingoWinnersCount = game.bingoWinnerUserIds.length;

  const linePrizePerWinner =
    lineWinnersCount > 0 ? Math.floor(linePrizeTotal / lineWinnersCount) : linePrizeTotal;
  const bingoPrizePerWinner =
    bingoWinnersCount > 0 ? Math.floor(bingoPrizeTotal / bingoWinnersCount) : bingoPrizeTotal;

  return NextResponse.json({
    game,
    transparency: {
      playerCount,
      ticketCount,
      projectedPlayerPool: linePrizeTotal + bingoPrizeTotal,
      linePrize: linePrizeTotal,
      bingoPrize: bingoPrizeTotal,
      linePrizePerWinner,
      bingoPrizePerWinner,
      lineWinnersCount,
      bingoWinnersCount,
    },
    myTickets,
    // 🔥 חדש — שמות הזוכים
    lineWinners: lineWinnerUsers.map((u) => ({ id: u.id, name: u.name })),
    bingoWinners: bingoWinnerUsers.map((u) => ({ id: u.id, name: u.name })),
  });
}