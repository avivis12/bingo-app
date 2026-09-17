import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

const signupSchema = z.object({
  name: z.string().min(2, "יש להזין שם מלא"),
  email: z.string().email("אימייל לא תקין"),
  password: z.string().min(6, "סיסמה חייבת להכיל לפחות 6 תווים"),
  // ולידציית פורמט בלבד — ללא אימות SMS בפועל (לפי האפיון)
  phone: z
    .string()
    .regex(/^0\d{8,9}$/, "מספר טלפון לא תקין (למשל 0501234567)"),
});

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const parsed = signupSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "נתונים לא תקינים" },
      { status: 400 }
    );
  }

  const { name, email, password, phone } = parsed.data;

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json({ error: "כתובת האימייל כבר רשומה במערכת" }, { status: 409 });
  }

  const passwordHash = await bcrypt.hash(password, 10);

  // אין אימות אימייל — המשתמש פעיל מיד לאחר ההרשמה.
  const user = await prisma.user.create({
    data: { name, email, phone, passwordHash },
    select: { id: true, name: true, email: true },
  });

  return NextResponse.json({ user }, { status: 201 });
}
