"use client";

import { Link } from "@/i18n/navigation";
import { useSession } from "next-auth/react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

interface TreeCardLinkProps {
  treeId: string;
  name: string;
  ownerLabel: string;
}

export function TreeCardLink({ treeId, name, ownerLabel }: TreeCardLinkProps) {
  const { status } = useSession();
  const t = useTranslations("trees");
  const isLoggedIn = status === "authenticated";

  const handleClick = (e: React.MouseEvent) => {
    if (!isLoggedIn) {
      e.preventDefault();
      toast.error(t("loginFirst"));
    }
  };

  return (
    <Link
      href={`/trees/${treeId}`}
      onClick={handleClick}
      className="block rounded-xl border border-zinc-200 bg-white p-4 shadow-sm transition-colors hover:border-zinc-300 hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-zinc-700 dark:hover:bg-zinc-800"
    >
      <span className="font-medium text-zinc-900 dark:text-zinc-100">
        {name}
      </span>
      <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
        {ownerLabel}
      </p>
    </Link>
  );
}
