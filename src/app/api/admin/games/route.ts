import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/requireAdmin";
import { prisma } from "@/lib/prisma";

const bodySchema = z.object({
  ticketPrice: z.number().int().positive(),
  maxTicketsPerUser: z.number().int().min(1).max(4).default(4),
});

// POST /api/admin/games — יוצר משחק חדש (מכירה נפתחת מיד). יש תמיד משחק פעיל בודד.
export async function POST(req: Request) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "נתונים לא תקינים" }, { status: 400 });

  const activeGame = await prisma.game.findFirst({
    where: { status: { in: ["SELLING", "COUNTDOWN", "LIVE"] } },
  });
  if (activeGame) {
    return NextResponse.json(
      { error: "כבר יש משחק פעיל. יש לסיים/לבטל אותו לפני יצירת משחק חדש (משחק בודד בכל רגע נתון)." },
      { status: 400 }
    );
  }

  const game = await prisma.game.create({
    data: {
      ticketPrice: parsed.data.ticketPrice,
      maxTicketsPerUser: parsed.data.maxTicketsPerUser,
      status: "SELLING",
    },
  });

  return NextResponse.json({ game }, { status: 201 });
}

// GET /api/admin/games — רשימת משחקים (היסטוריה), החדש ביותר קודם
export async function GET() {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const games = await prisma.game.findMany({
    orderBy: { createdAt: "desc" },
    take: 20,
    include: { _count: { select: { tickets: true } } },
  });

  return NextResponse.json({ games });
}
