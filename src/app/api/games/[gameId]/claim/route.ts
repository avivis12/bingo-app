import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { hasCompletedLine, hasFullBingo } from "@/lib/tickets";
import { broadcastToGame } from "@/lib/realtime";

const bodySchema = z.object({
  ticketId: z.string(),
  claimType: z.enum(["LINE", "BINGO"]),
});

/**
 * POST /api/games/:gameId/claim
 *
 * לחיצת "שורה!" / "בינגו!" של המשתמש. הבדיקה הקובעת היא כאן, בשרת,
 * מול הכדורים שבאמת נשלפו ב-DB. אם הכרטיס זכאי — המשתמש נוסף לרשימת
 * הזוכים, והתשובה כוללת את סכום הזכייה המדויק (לפי מספר הזוכים הנוכחי).
 */
export async function POST(req: Request, { params }: { params: Promise<{ gameId: string }> }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { gameId } = await params;
  const body = await req.json().catch(() => null);
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "נתונים לא תקינים" }, { status: 400 });

  const userId = (session.user as { id: string }).id;
  const { ticketId, claimType } = parsed.data;

  const game = await prisma.game.findUnique({ where: { id: gameId } });
  if (!game) return NextResponse.json({ error: "משחק לא נמצא" }, { status: 404 });
  if (game.status !== "LIVE") {
    return NextResponse.json({ error: "אפשר להכריז רק כשהמשחק פעיל" }, { status: 400 });
  }

  const ticket = await prisma.ticket.findUnique({ where: { id: ticketId } });
  if (!ticket || ticket.gameId !== gameId || ticket.userId !== userId) {
    return NextResponse.json({ error: "כרטיס לא נמצא" }, { status: 404 });
  }

  const isValid =
    claimType === "LINE"
      ? hasCompletedLine(ticket.numbers, game.ballsDrawn)
      : hasFullBingo(ticket.numbers, game.ballsDrawn);

  if (!isValid) {
    return NextResponse.json({ error: "אין עדיין זכייה על הכרטיס הזה" }, { status: 400 });
  }

  // חישוב קופת זכייה
  const ticketCount = await prisma.ticket.count({ where: { gameId } });
  const pot = game.ticketPrice * ticketCount;

  if (claimType === "LINE") {
    if (game.lineDistributed) {
      return NextResponse.json({ error: "פרס השורה כבר חולק" }, { status: 400 });
    }

    let winners = game.lineWinnerUserIds;
    if (!winners.includes(userId)) {
      await prisma.game.update({
        where: { id: gameId },
        data: { lineWinnerUserIds: { push: userId } },
      });
      winners = [...winners, userId];
      const user = await prisma.user.findUnique({ where: { id: userId } });
      await broadcastToGame(gameId, { type: "LINE_WINNER", userName: user?.name ?? "שחקן" });
    }

    const linePrizeTotal = Math.floor(pot * 0.1);
    const prizePerWinner = Math.floor(linePrizeTotal / winners.length);

    return NextResponse.json({
      success: true,
      claimType: "LINE",
      prize: prizePerWinner,
      totalPrize: linePrizeTotal,
      winnersCount: winners.length,
      message: `🎉 יש לך שורה! הזכייה שלך: ${prizePerWinner} מטבעות`,
    });
  }

  // BINGO
  if (game.bingoDistributed) {
    return NextResponse.json({ error: "פרס הבינגו כבר חולק" }, { status: 400 });
  }

  let winners = game.bingoWinnerUserIds;
  if (!winners.includes(userId)) {
    await prisma.game.update({
      where: { id: gameId },
      data: { bingoWinnerUserIds: { push: userId } },
    });
    winners = [...winners, userId];
    const user = await prisma.user.findUnique({ where: { id: userId } });
    await broadcastToGame(gameId, { type: "BINGO_WINNER", userName: user?.name ?? "שחקן" });
  }

  const bingoPrizeTotal = Math.floor(pot * 0.75);
  const prizePerWinner = Math.floor(bingoPrizeTotal / winners.length);

  return NextResponse.json({
    success: true,
    claimType: "BINGO",
    prize: prizePerWinner,
    totalPrize: bingoPrizeTotal,
    winnersCount: winners.length,
    message: `🏆 בינגו! הזכייה שלך: ${prizePerWinner} מטבעות`,
  });
}