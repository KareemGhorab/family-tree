"use client";

import { LogIn, LogOut } from "lucide-react";
import { signIn, signOut, useSession } from "next-auth/react";
import { useTranslations } from "next-intl";
import Image from "next/image";

export function UserMenu() {
  const { data: session, status } = useSession();
  const t = useTranslations("auth");

  if (status === "loading") {
    return (
      <div className="h-8 w-8 animate-pulse rounded-full bg-zinc-200 dark:bg-zinc-700" />
    );
  }

  if (!session) {
    return (
      <button
        type="button"
        className="inline-flex items-center gap-1.5 rounded-md px-3 py-2 text-sm font-medium text-zinc-600 transition-colors hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
        onClick={() => signIn("google")}
      >
        <LogIn className="h-4 w-4" aria-hidden />
        <span>{t("signIn")}</span>
      </button>
    );
  }

  return (
    <div className="flex items-center gap-2">
      {session.user?.image && (
        <Image
          src={session.user.image}
          alt={session.user.name ?? ""}
          width={28}
          height={28}
          className="rounded-full"
        />
      )}
      <button
        type="button"
        className="inline-flex items-center gap-1.5 rounded-md p-2 text-zinc-600 transition-colors hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
        onClick={() => signOut()}
        aria-label={t("signOut")}
        title={t("signOut")}
      >
        <LogOut className="h-4 w-4" aria-hidden />
        <span className="sr-only">{t("signOut")}</span>
      </button>
    </div>
  );
}
