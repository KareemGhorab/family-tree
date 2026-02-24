import { routing } from "@/i18n/routing";
import createIntlMiddleware from "next-intl/middleware";
import { type NextRequest, NextResponse } from "next/server";

const REDIRECT_AFTER_SIGNIN_COOKIE = "redirect_after_signin";
const intlMiddleware = createIntlMiddleware(routing);

export default function middleware(request: NextRequest) {
  const redirectPath = request.cookies.get(REDIRECT_AFTER_SIGNIN_COOKIE)?.value;
  if (redirectPath?.startsWith("/") && !redirectPath.startsWith("//")) {
    const url = new URL(redirectPath, request.url);
    if (url.origin === request.nextUrl.origin) {
      const res = NextResponse.redirect(url);
      res.cookies.set(REDIRECT_AFTER_SIGNIN_COOKIE, "", { path: "/", maxAge: 0 });
      return res;
    }
  }
  return intlMiddleware(request);
}

export const config = {
  matcher: ["/((?!api|_next|.*\\..*).*)"],
};
