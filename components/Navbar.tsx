"use client";

import { Link, usePathname } from "@/i18n/navigation";
import { Languages, Menu, Moon, Sun } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useTheme } from "next-themes";
import { useState } from "react";

export function Navbar() {
  const t = useTranslations("nav");
  const locale = useLocale();
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  const { resolvedTheme, setTheme } = useTheme();
  const nextLocale = locale === "en" ? "ar" : "en";
  const switchLabel =
    nextLocale === "ar" ? t("switchToArabic") : t("switchToEnglish");
  const pathForLocale = pathname || "/";
  const isDark = resolvedTheme === "dark";
  const themeLabel = isDark ? t("switchToLight") : t("switchToDark");

  const navLinks = [
    { href: "/", label: t("home") },
    { href: "/trees", label: t("myTrees") },
    { href: "/settings", label: t("settings") },
  ] as const;

  return (
    <header className="sticky top-0 z-50 w-full border-b border-zinc-200 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80 dark:border-zinc-800 dark:bg-zinc-950/95 dark:supports-[backdrop-filter]:bg-zinc-950/80">
      <nav className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <Link
          href="/"
          className="text-lg font-semibold text-zinc-900 dark:text-zinc-100"
        >
          Family Tree
        </Link>

        {/* Desktop: center links + language */}
        <div className="hidden items-center gap-1 md:flex">
          {navLinks.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className="rounded-md px-3 py-2 text-sm font-medium text-zinc-600 transition-colors hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
            >
              {label}
            </Link>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            className="inline-flex items-center justify-center rounded-md p-2 text-zinc-600 transition-colors hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
            aria-label={themeLabel}
            title={themeLabel}
            onClick={() => setTheme(isDark ? "light" : "dark")}
          >
            {isDark ? (
              <Sun className="h-5 w-5" aria-hidden />
            ) : (
              <Moon className="h-5 w-5" aria-hidden />
            )}
            <span className="sr-only">{themeLabel}</span>
          </button>
          <Link
            href={pathForLocale}
            locale={nextLocale}
            className="inline-flex items-center justify-center gap-1.5 rounded-md p-2 text-zinc-600 transition-colors hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
            aria-label={switchLabel}
            title={switchLabel}
          >
            <Languages className="h-5 w-5" aria-hidden />
            <span className="sr-only">{switchLabel}</span>
          </Link>

          <button
            type="button"
            className="rounded-md p-2 text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800 md:hidden"
            aria-expanded={mobileOpen}
            aria-controls="mobile-menu"
            onClick={() => setMobileOpen((o) => !o)}
            aria-label={mobileOpen ? "Close menu" : "Open menu"}
          >
            <Menu className="h-5 w-5" />
          </button>
        </div>
      </nav>

      {/* Mobile menu */}
      <div
        id="mobile-menu"
        className={`border-t border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950 md:hidden ${mobileOpen ? "block" : "hidden"}`}
        role="region"
        aria-label="Mobile navigation"
      >
        <div className="flex flex-col gap-0.5 px-4 py-3">
          {navLinks.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className="rounded-md px-3 py-2.5 text-sm font-medium text-zinc-700 dark:text-zinc-300"
              onClick={() => setMobileOpen(false)}
            >
              {label}
            </Link>
          ))}
        </div>
      </div>
    </header>
  );
}
