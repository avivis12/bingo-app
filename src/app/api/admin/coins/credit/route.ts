import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/requireAdmin";
import { creditCoins, debitCoins } from "@/lib/coins";
import { CoinTransactionType } from "@prisma/client";

const bodySchema = z.object({
  userId: z.string(),
  amount: z.number().int(), // חיובי = הוספה, שלילי = הפחתה ידנית
  note: z.string().optional(),
});

// POST /api/admin/coins/credit — הזנת מטבעות ידנית למשתמש (או הפחתה, לתיקון טעות)
export async function POST(req: Request) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "נתונים לא תקינים" }, { status: 400 });
  }

  const { userId, amount, note } = parsed.data;
  const adminId = (session.user as { id: string }).id;

  try {
    let newBalance: number;
    if (amount > 0) {
      newBalance = await creditCoins({
        userId,
        amount,
        type: CoinTransactionType.ADMIN_CREDIT,
        note,
        performedByAdminId: adminId,
      });
    } else if (amount < 0) {
      newBalance = await debitCoins({
        userId,
        amount: Math.abs(amount),
        type: CoinTransactionType.ADMIN_DEBIT,
        note,
        performedByAdminId: adminId,
      });
    } else {
      return NextResponse.json({ error: "amount cannot be 0" }, { status: 400 });
    }

    return NextResponse.json({ newBalance });
  } catch (err) {
    if (err instanceof Error && err.message === "INSUFFICIENT_BALANCE") {
      return NextResponse.json({ error: "למשתמש אין מספיק יתרה להפחתה הזו" }, { status: 400 });
    }
    return NextResponse.json({ error: "שגיאה בעדכון היתרה" }, { status: 500 });
  }
}
