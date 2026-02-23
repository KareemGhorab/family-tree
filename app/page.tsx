import { redirect } from "next/navigation";
import { routing } from "@/i18n/routing";

/**
 * Root page for "/". Redirects to the default locale so Next.js type validation
 * and routing work. Actual home content lives at [locale]/page.tsx.
 */
export default function RootPage() {
  redirect(`/${routing.defaultLocale}`);
}
