import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/requireAdmin";
import { prisma } from "@/lib/prisma";

// GET /api/admin/games/:gameId/tickets — כל הכרטיסים עם פרטי משתמשים
export async function GET(req: Request, { params }: { params: Promise<{ gameId: string }> }) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { gameId } = await params;

  const tickets = await prisma.ticket.findMany({
    where: { gameId },
    include: {
      user: { select: { id: true, name: true, email: true, phone: true } },
    },
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json({
    tickets: tickets.map((t) => ({
      id: t.id,
      numbers: t.numbers,
      userId: t.userId,
      userName: t.user.name,
      userEmail: t.user.email,
      userPhone: t.user.phone,
    })),
  });
}