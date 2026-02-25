"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Download, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useState } from "react";

const STORAGE_KEY = "pwa-install-banner-dismissed";

function isStandalone(): boolean {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (window.navigator as unknown as { standalone?: boolean }).standalone === true
  );
}

function isIOS(): boolean {
  if (typeof navigator === "undefined") return false;
  return /iPad|iPhone|iPod/.test(navigator.userAgent);
}

function isMobile(): boolean {
  if (typeof window === "undefined") return false;
  return window.innerWidth < 768;
}

export function InstallBanner() {
  const t = useTranslations("common");
  const [visible, setVisible] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<{
    prompt: () => Promise<{ outcome: string }>;
  } | null>(null);
  const [isIos, setIsIos] = useState(false);

  useEffect(() => {
    if (isStandalone()) return;

    const dismissed = sessionStorage.getItem(STORAGE_KEY);
    if (dismissed) return;

    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as unknown as { prompt: () => Promise<{ outcome: string }> });
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstall);

    if (isIOS()) {
      setIsIos(true);
    }

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstall);
    };
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (sessionStorage.getItem(STORAGE_KEY)) return;
      if (!isStandalone() && isMobile() && (deferredPrompt || isIos)) {
        setVisible(true);
      }
    }, 2000);
    return () => clearTimeout(timer);
  }, [deferredPrompt, isIos]);

  const handleInstall = useCallback(async () => {
    if (deferredPrompt) {
      await deferredPrompt.prompt();
      setDeferredPrompt(null);
      setVisible(false);
    }
  }, [deferredPrompt]);

  const handleDismiss = useCallback(() => {
    setVisible(false);
    sessionStorage.setItem(STORAGE_KEY, "true");
  }, []);

  if (!visible) return null;

  return (
    <div
      className={cn(
        "sticky top-0 z-50 flex items-center justify-between gap-3",
        "border-b border-zinc-800 bg-zinc-900/95 px-4 py-3 backdrop-blur-sm",
        "safe-area-inset-top"
      )}
    >
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <Download className="size-5 shrink-0 text-zinc-400" />
        <p className="truncate text-sm text-zinc-200">
          {isIos
            ? (t("installAppIOS") as string) || "Tap the Share button and Add to Home Screen"
            : (t("installApp") as string) || "Install the app for a better experience"}
        </p>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        {!isIos && deferredPrompt && (
          <Button size="sm" onClick={handleInstall}>
            {t("install") ?? "Install"}
          </Button>
        )}
        <button
          type="button"
          onClick={handleDismiss}
          className="rounded p-1 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200"
          aria-label={t("close") ?? "Close"}
        >
          <X className="size-4" />
        </button>
      </div>
    </div>
  );
}
