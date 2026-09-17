import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { debitCoins } from "@/lib/coins";
import { CoinTransactionType } from "@prisma/client";
import { generateTicketNumbers } from "@/lib/tickets";

const bodySchema = z.object({
  quantity: z.number().int().min(1).max(4),
});

// POST /api/games/:gameId/purchase — קניית 1-4 כרטיסים למשחק שהמכירה בו פתוחה
export async function POST(req: Request, { params }: { params: Promise<{ gameId: string }> }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { gameId } = await params;
  const body = await req.json().catch(() => null);
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "נתונים לא תקינים" }, { status: 400 });

  const userId = (session.user as { id: string }).id;
  const { quantity } = parsed.data;

  const game = await prisma.game.findUnique({ where: { id: gameId } });
  if (!game) return NextResponse.json({ error: "משחק לא נמצא" }, { status: 404 });

  // המכירה פתוחה רק בסטטוס DRAFT/SELLING/COUNTDOWN — נעולה ברגע שהמשחק live
  if (game.status === "LIVE" || game.status === "FINISHED" || game.status === "CANCELLED") {
    return NextResponse.json({ error: "המכירה נסגרה, המשחק כבר התחיל" }, { status: 400 });
  }

  const existingCount = await prisma.ticket.count({ where: { gameId, userId } });
  if (existingCount + quantity > game.maxTicketsPerUser) {
    return NextResponse.json(
      { error: `ניתן לרכוש עד ${game.maxTicketsPerUser} כרטיסים למשחק (יש לך כבר ${existingCount})` },
      { status: 400 }
    );
  }

  const totalCost = game.ticketPrice * quantity;

  try {
    await debitCoins({
      userId,
      amount: totalCost,
      type: CoinTransactionType.SPEND,
      note: `רכישת ${quantity} כרטיסים למשחק`,
      gameId,
    });
  } catch (err) {
    if (err instanceof Error && err.message === "INSUFFICIENT_BALANCE") {
      return NextResponse.json({ error: "אין מספיק מטבעות ביתרה. פנה/י לאדמין להטענה." }, { status: 400 });
    }
    return NextResponse.json({ error: "שגיאה ברכישה" }, { status: 500 });
  }

  const tickets = await prisma.$transaction(
    Array.from({ length: quantity }).map(() =>
      prisma.ticket.create({
        data: { gameId, userId, numbers: generateTicketNumbers() },
      })
    )
  );

  return NextResponse.json({ tickets }, { status: 201 });
}
