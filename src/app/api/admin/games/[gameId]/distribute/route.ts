import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/requireAdmin";
import { prisma } from "@/lib/prisma";
import { creditCoins } from "@/lib/coins";
import { CoinTransactionType } from "@prisma/client";

const bodySchema = z.object({
  prizeType: z.enum(["LINE", "BINGO"]),
});

/**
 * POST /api/admin/games/:gameId/distribute
 *
 * מחלק את פרס השורה או הבינגו המלא לזוכים שנצברו עד כה ב-Game.lineWinnerUserIds /
 * bingoWinnerUserIds. האדמין מפעיל זאת אחרי שנתן חלון סביר לזוכים "בו-זמנית" להכריז
 * (ר' הערה ב-/claim). מחשב לפי האפיון:
 *   קופה = ticketPrice × מספר כרטיסים שנמכרו למשחק
 *   עמלת אדמין = 15% מהקופה (לא מחולקת, פשוט לא יוצאת משם)
 *   פרס שורה = 10% מהקופה, מתחלק שווה בשווה בין זוכי השורה
 *   פרס בינגו מלא = 75% מהקופה (85% - 10%), מתחלק שווה בשווה בין זוכי הבינגו
 */
export async function POST(req: Request, { params }: { params: Promise<{ gameId: string }> }) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { gameId } = await params;
  const body = await req.json().catch(() => null);
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "נתונים לא תקינים" }, { status: 400 });

  const game = await prisma.game.findUnique({ where: { id: gameId } });
  if (!game) return NextResponse.json({ error: "משחק לא נמצא" }, { status: 404 });

  const ticketCount = await prisma.ticket.count({ where: { gameId } });
  const pot = game.ticketPrice * ticketCount;

  const { prizeType } = parsed.data;

  if (prizeType === "LINE") {
    if (game.lineDistributed) {
      return NextResponse.json({ error: "פרס השורה כבר חולק" }, { status: 400 });
    }
    if (game.lineWinnerUserIds.length === 0) {
      return NextResponse.json({ error: "אין עדיין זוכי שורה רשומים" }, { status: 400 });
    }

    const linePrizeTotal = Math.floor(pot * 0.1);
    const perWinner = Math.floor(linePrizeTotal / game.lineWinnerUserIds.length);

    for (const winnerId of game.lineWinnerUserIds) {
      await creditCoins({
        userId: winnerId,
        amount: perWinner,
        type: CoinTransactionType.WIN,
        note: `זכייה בשורה (משחק ${gameId})`,
        gameId,
      });
    }

    await prisma.game.update({ where: { id: gameId }, data: { lineDistributed: true } });
    return NextResponse.json({
      prizeType,
      pot,
      linePrizeTotal,
      perWinner,
      winners: game.lineWinnerUserIds,
    });
  }

  // BINGO
  if (game.bingoDistributed) {
    return NextResponse.json({ error: "פרס הבינגו כבר חולק" }, { status: 400 });
  }
  if (game.bingoWinnerUserIds.length === 0) {
    return NextResponse.json({ error: "אין עדיין זוכי בינגו רשומים" }, { status: 400 });
  }

  const bingoPrizeTotal = Math.floor(pot * 0.75); // 85% - 10% ששולם לשורה
  const perWinner = Math.floor(bingoPrizeTotal / game.bingoWinnerUserIds.length);

  for (const winnerId of game.bingoWinnerUserIds) {
    await creditCoins({
      userId: winnerId,
      amount: perWinner,
      type: CoinTransactionType.WIN,
      note: `זכייה בבינגו מלא (משחק ${gameId})`,
      gameId,
    });
  }

  await prisma.game.update({
    where: { id: gameId },
    data: { bingoDistributed: true, status: "FINISHED", endedAt: new Date() },
  });

  return NextResponse.json({
    prizeType,
    pot,
    bingoPrizeTotal,
    perWinner,
    winners: game.bingoWinnerUserIds,
  });
}
