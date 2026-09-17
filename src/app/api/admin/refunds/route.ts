import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/requireAdmin";

// GET /api/admin/refunds — תור בקשות ההחזר (ברירת מחדל: רק ממתינות)
export async function GET(req: Request) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status") ?? "PENDING";

  const requests = await prisma.refundRequest.findMany({
    where: status === "ALL" ? {} : { status: status as "PENDING" | "APPROVED" | "REJECTED" },
    orderBy: { createdAt: "asc" },
    include: {
      user: { select: { id: true, name: true, email: true, phone: true, coinsBalance: true } },
    },
  });

  return NextResponse.json({ requests });
}
