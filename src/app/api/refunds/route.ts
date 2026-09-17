import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const bodySchema = z.object({
  amountRequested: z.number().int().positive(),
  userNote: z.string().max(500).optional(),
});

// POST /api/refunds — משתמש מבקש החזר מתוך היתרה הקיימת שלו. נכנס לתור אצל האדמין.
export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "נתונים לא תקינים" }, { status: 400 });
  }

  const userId = (session.user as { id: string }).id;
  const user = await prisma.user.findUniqueOrThrow({ where: { id: userId } });

  if (parsed.data.amountRequested > user.coinsBalance) {
    return NextResponse.json(
      { error: "אי אפשר לבקש החזר על סכום גדול מהיתרה הקיימת" },
      { status: 400 }
    );
  }

  const request_ = await prisma.refundRequest.create({
    data: {
      userId,
      amountRequested: parsed.data.amountRequested,
      userNote: parsed.data.userNote,
    },
  });

  return NextResponse.json({ request: request_ }, { status: 201 });
}

// GET /api/refunds — היסטוריית בקשות ההחזר של המשתמש המחובר
export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = (session.user as { id: string }).id;

  const requests = await prisma.refundRequest.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ requests });
}
