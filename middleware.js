import { NextResponse } from "next/server";

export function middleware(request) {
  const url = request.nextUrl.clone();
  const token = request.cookies.get("adminToken")?.value || null;

  /**
   * ✅ 1. Protect only /admin and its subroutes (except /admin/login)
   */
  if (url.pathname.startsWith("/admin") && url.pathname !== "/admin/login") {
    if (!token) {
      url.pathname = "/admin/login"; // redirect to admin login
      return NextResponse.redirect(url);
    }
  }

  /**
   * ✅ 2. Protect all other routes except public ones
   */
  const publicPaths = ["/", "/auth/login", "/auth/register", "/auth/forgot-password"];
  const isPublic = publicPaths.some((path) => url.pathname.startsWith(path));

  // If not logged in and trying to access protected route → redirect
  if (!token && !isPublic && !url.pathname.startsWith("/admin")) {
    url.pathname = "/auth/login";
    return NextResponse.redirect(url);
  }

  // If logged in and visiting /auth/login → go to /dashboard
  if (token && url.pathname.startsWith("/auth/login")) {
    url.pathname = "/dashboard";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

/**
 * ✅ Apply middleware:
 * - /admin routes
 * - All routes except Next.js internals
 */
export const config = {
  matcher: [
    "/admin/:path*", // keep admin protection as you already had
    "/((?!_next/static|_next/image|favicon.ico).*)", // everything else
  ],
};
