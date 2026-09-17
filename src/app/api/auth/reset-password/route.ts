import { NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

const bodySchema = z.object({
  token: z.string(),
  newPassword: z.string().min(6, "סיסמה חייבת להכיל לפחות 6 תווים"),
});

// POST /api/auth/reset-password
export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "נתונים לא תקינים" }, { status: 400 });
  }

  const resetToken = await prisma.passwordResetToken.findUnique({ where: { token: parsed.data.token } });
  if (!resetToken || resetToken.expiresAt < new Date()) {
    return NextResponse.json({ error: "הקישור לא תקין או פג תוקף" }, { status: 400 });
  }

  const passwordHash = await bcrypt.hash(parsed.data.newPassword, 10);

  await prisma.$transaction([
    prisma.user.update({ where: { id: resetToken.userId }, data: { passwordHash } }),
    prisma.passwordResetToken.delete({ where: { id: resetToken.id } }),
  ]);

  return NextResponse.json({ success: true });
}
