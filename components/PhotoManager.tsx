"use client";

import type { OurFileRouter } from "@/app/api/uploadthing/core";
import {
    useAddPhoto,
    useDeletePhoto,
} from "@/app/service/family-node/node/hooks";
import type { Photo } from "@/app/service/types";
import { useImageLightbox } from "@/components/ImageLightboxProvider";
import { Button } from "@/components/ui/button";
import { UploadButton } from "@uploadthing/react";
import { Loader2, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";

interface PhotoManagerProps {
  nodeId: string;
  photos: Photo[];
  isEditor: boolean;
  showUpload?: boolean;
}

export function PhotoManager({
  nodeId,
  photos,
  isEditor,
  showUpload = true,
}: PhotoManagerProps) {
  const t = useTranslations("trees");
  const { openLightbox } = useImageLightbox();
  const addPhoto = useAddPhoto(nodeId);
  const deletePhoto = useDeletePhoto(nodeId);

  return (
    <div>
      <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
        {t("photos")}
      </p>

      {photos.length === 0 && !isEditor && (
        <p className="mt-1 text-sm text-zinc-400">{t("noPhotos")}</p>
      )}

      {photos.length > 0 && (
        <div className="mt-2 grid grid-cols-3 gap-2">
          {photos.map((photo) => (
            <div
              key={photo.id}
              className="group relative aspect-square overflow-hidden rounded-lg bg-zinc-100 dark:bg-zinc-800"
            >
              <button
                type="button"
                className="block size-full cursor-pointer"
                onClick={() => openLightbox(photo.blobUrl)}
              >
                <img
                  src={photo.blobUrl}
                  alt=""
                  className="size-full object-cover"
                />
              </button>
              {isEditor && (
                <Button
                  variant="destructive"
                  size="icon-xs"
                  className="absolute top-1 right-1 opacity-0 transition-opacity group-hover:opacity-100"
                  onClick={(e) => {
                    e.stopPropagation();
                    deletePhoto.mutate(photo.id);
                  }}
                  disabled={deletePhoto.isPending}
                  aria-label={t("removePhoto")}
                >
                  {deletePhoto.isPending ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    <Trash2 className="h-3 w-3" />
                  )}
                </Button>
              )}
            </div>
          ))}
        </div>
      )}

      {isEditor && showUpload && (
        <div className="mt-2">
          <UploadButton<OurFileRouter, "imageUploader">
            endpoint="imageUploader"
            onClientUploadComplete={(res) => {
              if (res) {
                for (const file of res) {
                  const url =
                    (file.serverData as { url?: string })?.url ?? file.ufsUrl;
                  if (url) addPhoto.mutate(url);
                }
              }
            }}
            appearance={{
              button:
                "h-8 rounded-md bg-zinc-900 px-3 text-xs font-medium text-white dark:bg-zinc-100 dark:text-zinc-900 ut-uploading:cursor-not-allowed",
              allowedContent: "text-xs text-zinc-400",
            }}
          />
        </div>
      )}
    </div>
  );
}
