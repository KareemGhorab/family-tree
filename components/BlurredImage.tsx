"use client";

import { cn } from "@/lib/utils";
import { useState } from "react";

interface BlurredImageProps
  extends Omit<
    React.ImgHTMLAttributes<HTMLImageElement>,
    "onLoad" | "onError"
  > {
  wrapperClassName?: string;
}


export function BlurredImage({
  src,
  alt,
  className,
  wrapperClassName,
  ...imgProps
}: BlurredImageProps) {
  const [loaded, setLoaded] = useState(false);

  return (
    <span
      className={cn("relative block size-full overflow-hidden", wrapperClassName)}
    >
      {src && (
        <img
          src={src}
          alt=""
          aria-hidden
          className={cn(
            "absolute inset-0 size-full object-cover opacity-100 transition-opacity duration-300",
            loaded && "opacity-0"
          )}
          style={{
            filter: "blur(12px)",
            transform: "scale(1.08)",
          }}
        />
      )}
      <img
        src={src}
        alt={alt}
        className={cn(
          "relative size-full object-cover transition-opacity duration-300",
          loaded ? "opacity-100" : "opacity-0",
          className
        )}
        onLoad={() => setLoaded(true)}
        {...imgProps}
      />
    </span>
  );
}
