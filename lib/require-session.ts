import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";

export async function getSessionOrRedirect(
  params: Promise<{ locale: string }>,
  callbackPath: string
) {
  const session = await auth();
  if (!session?.user) {
    const { locale } = await params;
    redirect(
      `/api/auth/signin?callbackUrl=${encodeURIComponent(`/${locale}${callbackPath}`)}`
    );
  }
  return session;
}
