import { CreateFamilyTreeDialog } from "@/components/CreateFamilyTreeDialog";
import { Link } from "@/i18n/navigation";
import { getFamilyTreesForUser } from "@/lib/family-tree";
import { getSessionOrRedirect } from "@/lib/require-session";
import { getTranslations } from "next-intl/server";

export default async function TreesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const session = await getSessionOrRedirect(params, "/trees");
  const trees = await getFamilyTreesForUser(session.user?.id ?? "");
  const t = await getTranslations("trees");

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-100">
          {t("title")}
        </h1>
        <CreateFamilyTreeDialog />
      </div>

      {trees.length === 0 ? (
        <p className="mt-6 text-zinc-600 dark:text-zinc-400">{t("noTrees")}</p>
      ) : (
        <ul className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {trees.map((tree) => (
            <li key={tree.id}>
              <Link
                href={`/trees/${tree.id}`}
                className="block rounded-xl border border-zinc-200 bg-white p-4 shadow-sm transition-colors hover:border-zinc-300 hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-zinc-700 dark:hover:bg-zinc-800"
              >
                <span className="font-medium text-zinc-900 dark:text-zinc-100">
                  {tree.name}
                </span>
                <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                  {t("owner")}: {tree.owner?.name ?? tree.owner?.email ?? "—"}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
