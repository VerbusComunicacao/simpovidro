import { NextResponse } from "next/server"

export function middleware(request) {
  const { pathname } = request.nextUrl

  // Bypass internal system routes, api endpoints, and static assets
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname.startsWith("/images") ||
    pathname.startsWith("/fonts") ||
    pathname.includes(".")
  ) {
    return NextResponse.next()
  }

  // Allow registration and admin routes to function normally
  const allowedPrefixes = ["/status"]

  const shouldBypass = allowedPrefixes.some(
    (prefix) => pathname === prefix || pathname.startsWith(prefix + "/"),
  )

  if (shouldBypass) {
    return NextResponse.next()
  }

  // If the request is exactly '/', allow it to render the home page normally
  if (pathname === "/") {
    return NextResponse.next()
  }

  // Redirect all other page routes to the home page '/'
  return NextResponse.redirect(new URL("/", request.url))
}
