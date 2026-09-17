import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/games/current — המשחק הפעיל היחיד כרגע (SELLING/COUNTDOWN/LIVE), אחרת null.
// זה המקור שממנו כל לקוח (כולל אחרי רענון) יודע לאיזה משחק להתחבר.
export async function GET() {
  const game = await prisma.game.findFirst({
    where: { status: { in: ["SELLING", "COUNTDOWN", "LIVE"] } },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ game });
}
