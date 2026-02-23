import { getSessionOrRedirect } from "@/lib/require-session";
import { getTranslations } from "next-intl/server";

export default async function SettingsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  await getSessionOrRedirect(params, "/settings");

  const t = await getTranslations("settings");

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
      <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-100">
        {t("title")}
      </h1>
    </div>
  );
}
