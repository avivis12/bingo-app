import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { creditCoins, debitCoins } from "@/lib/coins";
import { CoinTransactionType } from "@prisma/client";

const bodySchema = z.object({
  amount: z.number().int().positive(),
});

// POST /api/games/:gameId/tip — זוכה בוחר לתת טיפ (או מדלג פשוט ע"י לא לקרוא לזה בכלל)
export async function POST(req: Request, { params }: { params: Promise<{ gameId: string }> }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { gameId } = await params;
  const body = await req.json().catch(() => null);
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "נתונים לא תקינים" }, { status: 400 });

  const userId = (session.user as { id: string }).id;

  // מוצא את חשבון האדמין (במערכת עם אדמין יחיד — הראשון עם role=ADMIN)
  const admin = await prisma.user.findFirst({ where: { role: "ADMIN" } });
  if (!admin) return NextResponse.json({ error: "לא נמצא חשבון אדמין לזיכוי" }, { status: 500 });

  try {
    await debitCoins({
      userId,
      amount: parsed.data.amount,
      type: CoinTransactionType.TIP,
      note: "טיפ לאדמין",
      gameId,
    });
    await creditCoins({
      userId: admin.id,
      amount: parsed.data.amount,
      type: CoinTransactionType.TIP,
      note: `טיפ ממשתמש (משחק ${gameId})`,
      gameId,
    });
  } catch (err) {
    if (err instanceof Error && err.message === "INSUFFICIENT_BALANCE") {
      return NextResponse.json({ error: "אין מספיק יתרה לטיפ בסכום הזה" }, { status: 400 });
    }
    return NextResponse.json({ error: "שגיאה בשליחת הטיפ" }, { status: 500 });
  }

  await prisma.tip.create({ data: { gameId, fromUserId: userId, amount: parsed.data.amount } });

  return NextResponse.json({ success: true });
}
