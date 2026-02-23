"use client";

import { createContext, useCallback, useContext, useState } from "react";
import { ImageLightbox } from "@/components/ImageLightbox";

type ImageLightboxContextValue = {
  openLightbox: (src: string, alt?: string) => void;
};

const ImageLightboxContext = createContext<ImageLightboxContextValue | null>(
  null
);

export function ImageLightboxProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [src, setSrc] = useState<string | null>(null);
  const [alt, setAlt] = useState("");

  const openLightbox = useCallback((newSrc: string, newAlt = "") => {
    setSrc(newSrc);
    setAlt(newAlt);
    setOpen(true);
  }, []);

  const onOpenChange = useCallback((next: boolean) => {
    if (!next) setSrc(null);
    setOpen(next);
  }, []);

  return (
    <ImageLightboxContext.Provider value={{ openLightbox }}>
      {children}
      <ImageLightbox
        open={open}
        onOpenChange={onOpenChange}
        src={src}
        alt={alt}
      />
    </ImageLightboxContext.Provider>
  );
}

export function useImageLightbox(): ImageLightboxContextValue {
  const ctx = useContext(ImageLightboxContext);
  if (!ctx) {
    throw new Error("useImageLightbox must be used within ImageLightboxProvider");
  }
  return ctx;
}
