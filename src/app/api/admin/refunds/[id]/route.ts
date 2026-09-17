import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/requireAdmin";
import { prisma } from "@/lib/prisma";
import { debitCoins } from "@/lib/coins";
import { CoinTransactionType } from "@prisma/client";

const bodySchema = z.object({
  action: z.enum(["APPROVE", "REJECT"]),
  adminNote: z.string().max(500).optional(),
});

// PATCH /api/admin/refunds/:id
// אישור: מפחית את המטבעות בפועל (רק אחרי שהעברת את הכסף למשתמש מחוץ למערכת).
// דחייה: לא נוגע ביתרה.
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await req.json().catch(() => null);
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "נתונים לא תקינים" }, { status: 400 });

  const adminId = (session.user as { id: string }).id;
  const refundRequest = await prisma.refundRequest.findUnique({ where: { id } });
  if (!refundRequest) return NextResponse.json({ error: "בקשה לא נמצאה" }, { status: 404 });
  if (refundRequest.status !== "PENDING") {
    return NextResponse.json({ error: "הבקשה כבר טופלה" }, { status: 400 });
  }

  if (parsed.data.action === "REJECT") {
    const updated = await prisma.refundRequest.update({
      where: { id },
      data: { status: "REJECTED", adminNote: parsed.data.adminNote, resolvedAt: new Date() },
    });
    return NextResponse.json({ request: updated });
  }

  // APPROVE — הפחתת מטבעות בפועל, בהנחה שהאדמין כבר העביר את הכסף ידנית למשתמש.
  try {
    await debitCoins({
      userId: refundRequest.userId,
      amount: refundRequest.amountRequested,
      type: CoinTransactionType.REFUND,
      note: parsed.data.adminNote ?? "אישור בקשת החזר",
      performedByAdminId: adminId,
    });
  } catch (err) {
    if (err instanceof Error && err.message === "INSUFFICIENT_BALANCE") {
      return NextResponse.json(
        { error: "למשתמש אין מספיק יתרה כרגע לביצוע ההחזר המבוקש" },
        { status: 400 }
      );
    }
    return NextResponse.json({ error: "שגיאה בעדכון היתרה" }, { status: 500 });
  }

  const updated = await prisma.refundRequest.update({
    where: { id },
    data: { status: "APPROVED", adminNote: parsed.data.adminNote, resolvedAt: new Date() },
  });

  return NextResponse.json({ request: updated });
}
