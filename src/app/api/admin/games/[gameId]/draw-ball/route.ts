import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/requireAdmin";
import { prisma } from "@/lib/prisma";
import { drawRandomBall } from "@/lib/tickets";
import { broadcastToGame } from "@/lib/realtime";

// POST /api/admin/games/:gameId/draw-ball
// שליפה ידנית לחלוטין — האדמין לוחץ, השרת שולף כדור אקראי אחד ומוסיף לרצף.
// אין כאן שום בדיקת זוכים — זה קורה רק כשמשתמש לוחץ "בינגו" (ר' /claim).
export async function POST(req: Request, { params }: { params: Promise<{ gameId: string }> }) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { gameId } = await params;
  const game = await prisma.game.findUnique({ where: { id: gameId } });
  if (!game) return NextResponse.json({ error: "משחק לא נמצא" }, { status: 404 });
  if (game.status === "FINISHED" || game.status === "CANCELLED") {
    return NextResponse.json({ error: "המשחק כבר הסתיים" }, { status: 400 });
  }

  // שליפת הכדור הראשון מעבירה את המשחק אוטומטית לסטטוס LIVE (ונועלת את המכירה).
  if (game.status === "SELLING" || game.status === "COUNTDOWN") {
    await prisma.game.update({
      where: { id: gameId },
      data: { status: "LIVE", startedAt: new Date() },
    });
    await broadcastToGame(gameId, { type: "GAME_STATUS", status: "LIVE" });
  }

  let ball: number;
  try {
    ball = drawRandomBall(game.ballsDrawn);
  } catch {
    return NextResponse.json({ error: "כל 75 הכדורים כבר נשלפו" }, { status: 400 });
  }

  const updated = await prisma.game.update({
    where: { id: gameId },
    data: { ballsDrawn: { push: ball } },
  });

  await broadcastToGame(gameId, { type: "BALL_DRAWN", ball, ballsDrawn: updated.ballsDrawn });

  return NextResponse.json({ ball, ballsDrawn: updated.ballsDrawn });
}
