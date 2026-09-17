import { NextResponse } from "next/server";
import { z } from "zod";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";

const bodySchema = z.object({ email: z.string().email() });

// POST /api/auth/forgot-password
// יוצר טוקן חד-פעמי בתוקף 30 דקות. בפרודקשן יש לשלוח אותו במייל (למשל דרך Resend) —
// כרגע, לצורך פיתוח, הקישור נכתב ל-console בלבד.
export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "אימייל לא תקין" }, { status: 400 });

  const user = await prisma.user.findUnique({ where: { email: parsed.data.email } });

  // תמיד מחזירים תשובה זהה, גם אם האימייל לא קיים — כדי לא לחשוף אילו אימיילים רשומים.
  if (user && user.passwordHash) {
    const token = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000);
    await prisma.passwordResetToken.create({ data: { userId: user.id, token, expiresAt } });

    // TODO: לשלוח מייל אמיתי עם קישור זה. לפיתוח מקומי — הקישור מודפס כאן:
    console.log(`[forgot-password] Reset link for ${user.email}: /reset-password/${token}`);
  }

  return NextResponse.json({ success: true });
}
