import { FamilyTreeView } from "@/components/FamilyTreeView";
import { getSessionOrRedirect } from "@/lib/require-session";

export default async function TreeDetailPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const resolvedParams = await params;
  await getSessionOrRedirect(params, "/trees");

  return <FamilyTreeView treeId={resolvedParams.id} />;
}
