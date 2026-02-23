import { getSessionOrRedirect } from "@/lib/require-session";

export default async function TreeDetailPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  await getSessionOrRedirect(params, "/trees");

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
      {/* Blank page – tree detail content can be added later */}
    </div>
  );
}
