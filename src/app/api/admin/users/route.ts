import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/requireAdmin";

// GET /api/admin/users?q=דני  → מחפש בו-זמנית לפי שם, טלפון או אימייל (contains, לא case sensitive)
export async function GET(req: Request) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q")?.trim() ?? "";

  if (!q) {
    const recent = await prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      take: 20,
      select: { id: true, name: true, email: true, phone: true, coinsBalance: true },
    });
    return NextResponse.json({ users: recent });
  }

  const users = await prisma.user.findMany({
    where: {
      OR: [
        { name: { contains: q, mode: "insensitive" } },
        { email: { contains: q, mode: "insensitive" } },
        { phone: { contains: q } },
      ],
    },
    take: 20,
    select: { id: true, name: true, email: true, phone: true, coinsBalance: true },
  });

  return NextResponse.json({ users });
}
