import { NextRequest, NextResponse } from "next/server";

/**
 * Guest browsing is allowed for home, services, packages.
 * Login is required only for: cart checkout, bookings, profile.
 * The cart page itself is accessible (shows items), only /bookings/new gates login.
 */
const PROTECTED = [
  "/client/bookings/new",
  "/client/bookings/status",
  "/client/profile",
];

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const token = req.cookies.get("session")?.value;

  // Admin always protected
  if (pathname.startsWith("/admin")) {
    if (!token) return NextResponse.redirect(new URL("/login", req.url));
    return NextResponse.next();
  }

  // Provider always protected
  if (pathname.startsWith("/provider")) {
    if (!token) return NextResponse.redirect(new URL("/login", req.url));
    return NextResponse.next();
  }

  // Selectively protect client routes
  if (pathname.startsWith("/client")) {
    const needsAuth = PROTECTED.some((p) => pathname.startsWith(p));
    if (needsAuth && !token) {
      const loginUrl = new URL("/login", req.url);
      loginUrl.searchParams.set("redirect", pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/provider/:path*", "/client/:path*"],
};