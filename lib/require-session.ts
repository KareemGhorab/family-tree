import { auth } from "@/lib/auth";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

const REDIRECT_AFTER_SIGNIN_COOKIE = "redirect_after_signin";
const COOKIE_MAX_AGE = 60 * 10; // 10 minutes

export async function getSessionOrRedirect(
  params: Promise<{ locale: string }>,
  callbackPath: string
) {
  const session = await auth();
  if (!session?.user) {
    const { locale } = await params;
    const returnPath = `/${locale}${callbackPath}`;
    (await cookies()).set(REDIRECT_AFTER_SIGNIN_COOKIE, returnPath, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: COOKIE_MAX_AGE,
    });
    redirect("/api/auth/signin");
  }
  return session;
}
