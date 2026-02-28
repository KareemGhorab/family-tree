import { StatisticsView } from "@/components/StatisticsView";

export default async function StatisticsPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { id } = await params;
  return <StatisticsView treeId={id} />;
}
