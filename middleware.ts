import { NextRequest, NextResponse } from "next/server";

/**
 * Route protection:
 * - /admin/*     requires session cookie + role === "admin"
 * - /provider/*  requires session cookie + role === "service_provider" | "pending_sp"
 * - select /client/* paths require a session cookie (any role)
 *
 * The session_role cookie is set by /api/auth/verify alongside the session cookie.
 * It is NOT httpOnly so middleware (Edge runtime) can read it without firebase-admin.
 */

const PROTECTED_CLIENT = [
  "/client/bookings/new",
  "/client/bookings/status",
  "/client/profile",
  "/client/checkout",
];

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const token = req.cookies.get("session")?.value;
  const role  = req.cookies.get("session_role")?.value ?? "";

  const loginUrl = (redirect?: string) => {
    const url = new URL("/login", req.url);
    if (redirect) url.searchParams.set("redirect", redirect);
    return NextResponse.redirect(url);
  };

  // ── Admin routes ──────────────────────────────────────────────────────────
  if (pathname.startsWith("/admin")) {
    if (!token) return loginUrl(pathname);
    if (role !== "admin") {
      // Authenticated but wrong role — redirect to their home
      const home = role === "service_provider" || role === "pending_sp"
        ? "/provider"
        : "/client/home";
      return NextResponse.redirect(new URL(home, req.url));
    }
    return NextResponse.next();
  }

  // ── Provider routes ───────────────────────────────────────────────────────
  if (pathname.startsWith("/provider")) {
    if (!token) return loginUrl(pathname);
    if (role !== "service_provider" && role !== "pending_sp" && role !== "admin") {
      return NextResponse.redirect(new URL("/client/home", req.url));
    }
    return NextResponse.next();
  }

  // ── Selectively protected client routes ───────────────────────────────────
  if (pathname.startsWith("/client")) {
    const needsAuth = PROTECTED_CLIENT.some((p) => pathname.startsWith(p));
    if (needsAuth && !token) return loginUrl(pathname);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/provider/:path*", "/client/:path*"],
};