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

  // If the request is for '/breve', redirect to root '/' to keep the URL clean
  if (pathname === "/breve") {
    return NextResponse.redirect(new URL("/", request.url))
  }

  // If the request is exactly '/', rewrite it to '/breve' so it displays the coming soon content at the root
  if (pathname === "/") {
    return NextResponse.rewrite(new URL("/breve", request.url))
  }

  // Redirect all other page routes to the home page '/' (which renders '/breve' via rewrite)
  return NextResponse.redirect(new URL("/", request.url))
}
