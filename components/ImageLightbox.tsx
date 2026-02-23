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
      >
        {src && (
          <div
            className="grid h-full w-full place-items-center p-4 sm:p-6"
            dir="ltr"
          >
            <img
              src={src}
              alt={alt}
              className="max-h-full max-w-full object-contain"
            />
          </div>
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
