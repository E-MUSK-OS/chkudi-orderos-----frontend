import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Routes that are publicly accessible without authentication
const PUBLIC_PATHS = [
  "/",
  "/features",
  "/marketplaces",
  "/about",
  "/about-us",
  "/contact",
  "/contact-us",
  "/privacy",
  "/privacy-policy",
  "/terms",
  "/terms-and-conditions",
  "/terms-conditions",
  "/login",
  "/signup",
  "/forgot-password",
  "/reset-password",
  "/verify-email",
  "/offline",
  "/printbridge",
];

// Routes accessible only to unauthenticated visitors
const AUTH_ONLY_PATHS = [
  "/login",
  "/signup",
  "/forgot-password",
  "/reset-password",
  "/verify-email",
];

function isPublic(pathname: string): boolean {
  const clean = pathname.split("?")[0].replace(/\/+$/, "") || "/";
  if (clean === "/" || clean === "") return true;
  return PUBLIC_PATHS.some((p) => p !== "/" && (clean === p || clean.startsWith(p + "/")));
}

function isAuthOnly(pathname: string): boolean {
  const clean = pathname.split("?")[0].replace(/\/+$/, "") || "/";
  return AUTH_ONLY_PATHS.some((p) => clean === p || clean.startsWith(p + "/"));
}

export function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  // 1. Bypass Next.js internals, API endpoints, uploads, and static assets
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname.startsWith("/uploads") ||
    pathname === "/favicon.ico" ||
    /\.(?:svg|png|jpg|jpeg|gif|webp|ico|woff|woff2|ttf|eot)$/i.test(pathname)
  ) {
    return NextResponse.next();
  }

  const token = request.cookies.get("accessToken")?.value;
  const hasValidToken = Boolean(
    token && token !== "null" && token !== "undefined" && token.trim() !== ""
  );

  // 2. Redirect logged-in users away from /login, /signup, etc. to /dashboard
  if (hasValidToken && isAuthOnly(pathname)) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  // 3. Allow public pages for everyone
  if (isPublic(pathname)) {
    return NextResponse.next();
  }

  // 4. Any other page is protected (e.g. /dashboard, /settings, /challan, etc.)
  // Unauthenticated visitors are immediately redirected to /login with redirect parameter
  if (!hasValidToken) {
    const fullTarget = pathname + search;
    const loginUrl = new URL("/login", request.url);
    if (fullTarget && fullTarget !== "/") {
      loginUrl.searchParams.set("redirect", fullTarget);
    }
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except static files and Next internals
     */
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
