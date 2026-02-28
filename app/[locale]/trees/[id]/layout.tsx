import { TreeHeader } from "@/components/TreeHeader";
import { notDeleted } from "@/lib/helpers";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";

export default async function TreeLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string; id: string }>;
}) {
  const { id } = await params;

  const tree = await prisma.familyTree.findFirst({
    where: { id, ...notDeleted },
    select: { name: true },
  });

  if (!tree) {
    notFound();
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <TreeHeader treeId={id} treeName={tree.name} />
      <main className="min-h-0 flex-1">{children}</main>
    </div>
  );
}
