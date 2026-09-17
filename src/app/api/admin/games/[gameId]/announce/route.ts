import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/requireAdmin";
import { broadcastToGame } from "@/lib/realtime";

const bodySchema = z.object({
  message: z.string().min(1).max(200),
});

// POST /api/admin/games/:gameId/announce
// הודעת מערכת חיה — משודרת מיידית לכל המשתמשים המחוברים למשחק (באנר בולט).
export async function POST(req: Request, { params }: { params: Promise<{ gameId: string }> }) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { gameId } = await params;
  const body = await req.json().catch(() => null);
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "יש להזין הודעה" }, { status: 400 });

  await broadcastToGame(gameId, { type: "ANNOUNCEMENT", message: parsed.data.message });

  return NextResponse.json({ success: true });
}
