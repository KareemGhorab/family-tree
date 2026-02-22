import { Link } from "@/i18n/navigation";
import { FileQuestion } from "lucide-react";
import { getTranslations } from "next-intl/server";

export default async function NotFound() {
  const t = await getTranslations("notFound");

  return (
    <div className="flex min-h-[calc(100vh-3.5rem)] flex-col items-center justify-center gap-6 px-4 py-16">
      <div className="flex flex-col items-center gap-4 text-center">
        <div className="rounded-full bg-zinc-100 p-4 dark:bg-zinc-800">
          <FileQuestion className="h-12 w-12 text-zinc-500 dark:text-zinc-400" />
        </div>
        <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-100 sm:text-3xl">
          {t("title")}
        </h1>
        <p className="max-w-md text-zinc-600 dark:text-zinc-400">
          {t("description")}
        </p>
      </div>
      <Link
        href="/"
        className="rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
      >
        {t("backHome")}
      </Link>
    </div>
  );
}
