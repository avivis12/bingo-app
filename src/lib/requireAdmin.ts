import { auth } from "@/lib/auth";

/** מוודא שהמשתמש המחובר הוא אדמין. מחזיר את ה-session או null אם לא מורשה. */
export async function requireAdmin() {
  const session = await auth();
  const role = (session?.user as { role?: string } | undefined)?.role;
  if (!session?.user || role !== "ADMIN") return null;
  return session;
}
