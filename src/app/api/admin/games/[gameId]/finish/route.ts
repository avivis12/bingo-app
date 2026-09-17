import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/requireAdmin";
import { prisma } from "@/lib/prisma";
import { broadcastToGame } from "@/lib/realtime";

// POST /api/admin/games/:gameId/finish — סיום משחק ידני (ללא הכרזת בינגו)
export async function POST(req: Request, { params }: { params: Promise<{ gameId: string }> }) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { gameId } = await params;
  const game = await prisma.game.findUnique({ where: { id: gameId } });
  if (!game) return NextResponse.json({ error: "משחק לא נמצא" }, { status: 404 });
  if (game.status === "FINISHED" || game.status === "CANCELLED") {
    return NextResponse.json({ error: "המשחק כבר הסתיים/בוטל" }, { status: 400 });
  }

  const updated = await prisma.game.update({
    where: { id: gameId },
    data: { status: "FINISHED", endedAt: new Date() },
  });

  await broadcastToGame(gameId, { type: "GAME_STATUS", status: "FINISHED" });

  return NextResponse.json({ game: updated });
}