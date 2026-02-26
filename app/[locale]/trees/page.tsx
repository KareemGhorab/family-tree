import { CreateFamilyTreeDialog } from "@/components/CreateFamilyTreeDialog";
import { TreeCardLink } from "@/components/TreeCardLink";
import { getFamilyAllTrees } from "@/lib/family-tree";
// import { getSessionOrRedirect } from "@/lib/require-session";
import { getTranslations } from "next-intl/server";

export default async function TreesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  // const session = await getSessionOrRedirect(params, "/trees");
  const trees = await getFamilyAllTrees();
  const t = await getTranslations("trees");

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-100">
          {t("title")}
        </h1>
        {/* <CreateFamilyTreeDialog /> */}
      </div>

      {trees.length === 0 ? (
        <p className="mt-6 text-zinc-600 dark:text-zinc-400">{t("noTrees")}</p>
      ) : (
        <ul className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {trees.map((tree) => (
            <li key={tree.id}>
              <TreeCardLink
                treeId={tree.id}
                name={tree.name}
                ownerLabel={`${t("owner")}: ${tree.owner?.name ?? tree.owner?.email ?? "—"}`}
              />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
