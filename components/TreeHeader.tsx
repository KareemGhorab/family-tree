"use client";

import { Link, usePathname } from "@/i18n/navigation";
import { cn } from "@/lib/utils";
import { ArrowLeft } from "lucide-react";
import { useTranslations } from "next-intl";

interface TreeHeaderProps {
  treeId: string;
  treeName: string;
}

export function TreeHeader({ treeId, treeName }: TreeHeaderProps) {
  const t = useTranslations("statistics");
  const pathname = usePathname();
  const treePath = `/trees/${treeId}`;
  const statsPath = `/trees/${treeId}/statistics`;
  const isTree = pathname === treePath;
  const isStats = pathname === statsPath;

  return (
    <header className="border-b border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
      <div className="mx-auto flex max-w-6xl items-center gap-4 px-4 py-3 sm:px-6">
        <Link
          href="/trees"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-zinc-600 transition-colors hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
        >
          <ArrowLeft className="h-4 w-4" />
          <span className="sr-only lg:not-sr-only lg:inline">Back</span>
        </Link>
        <span className="text-zinc-400 dark:text-zinc-500">/</span>
        <span className="truncate font-medium text-zinc-900 dark:text-zinc-100">
          {treeName}
        </span>
        <nav className="ml-auto flex gap-0.5" aria-label="Tree navigation">
          <Link
            href={treePath}
            className={cn(
              "rounded-md px-3 py-2 text-sm font-medium transition-colors",
              isTree
                ? "bg-zinc-100 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-100"
                : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
            )}
          >
            {t("tree")}
          </Link>
          <Link
            href={statsPath}
            className={cn(
              "rounded-md px-3 py-2 text-sm font-medium transition-colors",
              isStats
                ? "bg-zinc-100 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-100"
                : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
            )}
          >
            {t("title")}
          </Link>
        </nav>
      </div>
    </header>
  );
}
