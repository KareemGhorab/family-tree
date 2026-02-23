"use client";

import { Dialog, DialogContent } from "@/components/ui/dialog";
import { XIcon } from "lucide-react";
import { useTranslations } from "next-intl";

interface ImageLightboxProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  src: string | null;
  alt?: string;
}

export function ImageLightbox({
  open,
  onOpenChange,
  src,
  alt = "",
}: ImageLightboxProps) {
  const t = useTranslations("common");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        overlayClassName="bg-black/90"
        className="fixed inset-0 z-50 flex min-h-screen w-full max-w-none items-center justify-center border-0 bg-transparent p-4 shadow-none sm:p-6"
      >
        {src && (
          <img
            src={src}
            alt={alt}
            className="max-h-full max-w-full object-contain"
          />
        )}
        <button
          type="button"
          onClick={() => onOpenChange(false)}
          className="absolute top-4 right-4 flex min-h-[44px] min-w-[44px] items-center justify-center rounded-full bg-white/10 text-white opacity-90 transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-white/50"
          aria-label={t("close")}
        >
          <XIcon className="h-6 w-6" aria-hidden />
        </button>
      </DialogContent>
    </Dialog>
  );
}
