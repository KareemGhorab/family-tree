"use client";

import type { OurFileRouter } from "@/app/api/uploadthing/core";
import {
    useAddPhoto,
    useDeletePhoto,
    useReorderPhotos,
} from "@/app/service/family-node/node/hooks";
import type { Photo } from "@/app/service/types";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { useImageLightbox } from "@/components/ImageLightboxProvider";
import { Button } from "@/components/ui/button";
import {
    DndContext,
    type DragEndEvent,
    PointerSensor,
    useSensor,
    useSensors,
} from "@dnd-kit/core";
import {
    arrayMove,
    rectSortingStrategy,
    SortableContext,
    useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { UploadButton } from "@uploadthing/react";
import { Loader2, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import { toast } from "sonner";

interface PhotoManagerProps {
  nodeId: string;
  treeId: string | null;
  photos: Photo[];
  isEditor: boolean;
  showUpload?: boolean;
}

function sortPhotosByOrder(photos: Photo[]): Photo[] {
  return [...photos].sort((a, b) => {
    const orderA = a.order ?? 999;
    const orderB = b.order ?? 999;
    if (orderA !== orderB) return orderA - orderB;
    return (
      new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );
  });
}

interface SortablePhotoTileProps {
  photo: Photo;
  isEditor: boolean;
  onDeleteClick: (photo: Photo) => void;
  isDeleting: boolean;
  deletePhotoPending: boolean;
}

function SortablePhotoTile({
  photo,
  isEditor,
  onDeleteClick,
  isDeleting,
  deletePhotoPending,
}: SortablePhotoTileProps) {
  const t = useTranslations("trees");
  const { openLightbox } = useImageLightbox();
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: photo.id });

  const style = useMemo(() => {
    if (!transform) return undefined;
    return {
      transform: CSS.Translate.toString(transform),
      transition,
    };
  }, [transform, transition]);

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`group relative aspect-square overflow-hidden rounded-lg bg-zinc-100 dark:bg-zinc-800 ${
        isEditor ? "cursor-grab active:cursor-grabbing" : ""
      } ${isDragging ? "z-10 opacity-80 shadow-lg" : ""}`}
      {...(isEditor ? { ...attributes, ...listeners } : {})}
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
          className="absolute top-1 right-1"
          onClick={(e) => {
            e.stopPropagation();
            e.preventDefault();
            onDeleteClick(photo);
          }}
          onPointerDown={(e) => e.stopPropagation()}
          disabled={deletePhotoPending}
          aria-label={t("removePhoto")}
        >
          {deletePhotoPending && isDeleting ? (
            <Loader2 className="h-3 w-3 animate-spin" />
          ) : (
            <Trash2 className="h-3 w-3" />
          )}
        </Button>
      )}
    </div>
  );
}

export function PhotoManager({
  nodeId,
  treeId,
  photos,
  isEditor,
  showUpload = true,
}: PhotoManagerProps) {
  const t = useTranslations("trees");
  const tCommon = useTranslations("common");
  const { openLightbox } = useImageLightbox();
  const addPhoto = useAddPhoto(nodeId, treeId);
  const deletePhoto = useDeletePhoto(nodeId, treeId);
  const reorderPhotos = useReorderPhotos(nodeId, treeId);
  const [photoToDelete, setPhotoToDelete] = useState<Photo | null>(null);

  const sortedPhotos = useMemo(() => sortPhotosByOrder(photos), [photos]);
  const photoIds = useMemo(() => sortedPhotos.map((p) => p.id), [sortedPhotos]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    })
  );

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = photoIds.indexOf(active.id as string);
    const newIndex = photoIds.indexOf(over.id as string);
    if (oldIndex === -1 || newIndex === -1) return;
    const newOrder = arrayMove(photoIds, oldIndex, newIndex);
    reorderPhotos.mutate(newOrder, {
      onError: () => {
        toast.error(tCommon("error"));
      },
    });
  }

  const gridContent =
    sortedPhotos.length > 0 ? (
      isEditor ? (
        <DndContext onDragEnd={handleDragEnd} sensors={sensors}>
          <SortableContext
            items={photoIds}
            strategy={rectSortingStrategy}
          >
            <div className="mt-2 grid grid-cols-3 gap-2">
              {sortedPhotos.map((photo) => (
                <SortablePhotoTile
                  key={photo.id}
                  photo={photo}
                  isEditor={isEditor}
                  onDeleteClick={setPhotoToDelete}
                  isDeleting={photoToDelete?.id === photo.id}
                  deletePhotoPending={deletePhoto.isPending}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      ) : (
        <div className="mt-2 grid grid-cols-3 gap-2">
          {sortedPhotos.map((photo) => (
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
            </div>
          ))}
        </div>
      )
    ) : null;

  return (
    <div>
      <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
        {t("photos")}
      </p>

      {photos.length === 0 && !isEditor && (
        <p className="mt-1 text-sm text-zinc-400">{t("noPhotos")}</p>
      )}

      {gridContent}

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

      <ConfirmDialog
        open={photoToDelete !== null}
        onConfirm={() => {
          if (photoToDelete) {
            deletePhoto.mutate(photoToDelete.id, {
              onSettled: () => setPhotoToDelete(null),
            });
          }
        }}
        onCancel={() => setPhotoToDelete(null)}
        title={t("confirmDelete")}
        description={t("confirmDeleteDescription")}
        confirmLabel={t("confirm")}
        cancelLabel={tCommon("cancel")}
        isPending={deletePhoto.isPending}
        variant="destructive"
      />
    </div>
  );
}
