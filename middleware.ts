import { NextRequest, NextResponse } from "next/server";
import { sessionCookie, verifySessionToken } from "@/lib/auth/session";

function privateResponse() {
  const response = NextResponse.next();
  response.headers.set("Cache-Control", "private, no-store, max-age=0");
  return response;
}

export async function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const token = request.cookies.get(sessionCookie.name)?.value;
  const session = await verifySessionToken(token);
  const isLoginPage = pathname === "/login";
  const isLoginEndpoint = pathname === "/api/auth/login";

  if (isLoginEndpoint) {
    return privateResponse();
  }

  if (isLoginPage) {
    if (session) {
      return NextResponse.redirect(new URL("/", request.url));
    }

    return privateResponse();
  }

  if (session) {
    return privateResponse();
  }

  if (pathname.startsWith("/api/")) {
    return NextResponse.json({ error: "Authentification requise." }, { status: 401 });
  }

  const loginUrl = new URL("/login", request.url);
  loginUrl.searchParams.set("next", `${pathname}${search}`);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|robots.txt).*)"],
};
