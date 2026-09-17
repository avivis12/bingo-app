import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET /api/me/transactions — היסטוריית תנועות המטבעות של המשתמש המחובר
// (כולל "הפקדות" שהאדמין הזין — ר' סעיף 3.3 באפיון: שקיפות מלאה למשתמש)
export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = (session.user as { id: string }).id;

  const transactions = await prisma.coinTransaction.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return NextResponse.json({ transactions });
}
