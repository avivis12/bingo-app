import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

export default auth((req) => {
  const isAdminRoute = req.nextUrl.pathname.startsWith("/admin");
  const role = (req.auth?.user as { role?: string } | undefined)?.role;

  if (!req.auth) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  if (isAdminRoute && role !== "ADMIN") {
    const url = req.nextUrl.clone();
    url.pathname = "/";
    return NextResponse.redirect(url);
  }
});

export const config = {
  matcher: ["/admin/:path*", "/game/:path*", "/profile/:path*"],
};
