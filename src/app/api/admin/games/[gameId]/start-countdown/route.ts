import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/requireAdmin";
import { prisma } from "@/lib/prisma";
import { broadcastToGame } from "@/lib/realtime";

const bodySchema = z.object({
  countdownSeconds: z.number().int().min(5).max(3600),
});

// POST /api/admin/games/:gameId/start-countdown
// נועל את המכירה (הכרטיסים שכבר נרכשו נשארים) ומתחיל טיימר ספירה לאחור.
export async function POST(req: Request, { params }: { params: Promise<{ gameId: string }> }) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { gameId } = await params;
  const body = await req.json().catch(() => null);
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "נתונים לא תקינים" }, { status: 400 });

  const game = await prisma.game.findUnique({ where: { id: gameId } });
  if (!game) return NextResponse.json({ error: "משחק לא נמצא" }, { status: 404 });
  if (game.status !== "SELLING") {
    return NextResponse.json({ error: "אפשר להתחיל טיימר רק כשהמכירה פתוחה" }, { status: 400 });
  }

  const countdownEndsAt = new Date(Date.now() + parsed.data.countdownSeconds * 1000);

  const updated = await prisma.game.update({
    where: { id: gameId },
    data: { status: "COUNTDOWN", countdownSeconds: parsed.data.countdownSeconds, countdownEndsAt },
  });

  await broadcastToGame(gameId, {
    type: "GAME_STATUS",
    status: "COUNTDOWN",
    countdownEndsAt: countdownEndsAt.toISOString(),
  });

  return NextResponse.json({ game: updated });
}
