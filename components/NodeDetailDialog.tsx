"use client";

import {
    useDeleteFamilyNode,
    useFamilyNode,
} from "@/app/service/family-node/node/hooks";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { EditNodeForm } from "@/components/EditNodeForm";
import { useImageLightbox } from "@/components/ImageLightboxProvider";
import { PhotoManager } from "@/components/PhotoManager";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { formatDisplayDate } from "@/lib/date";
import { Loader2, Pencil, Trash2, User } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";

interface NodeDetailDialogProps {
  nodeId: string | null;
  treeId: string;
  isEditor: boolean;
  open: boolean;
  onClose: () => void;
}

export function NodeDetailDialog({
  nodeId,
  treeId,
  isEditor,
  open,
  onClose,
}: NodeDetailDialogProps) {
  const t = useTranslations("trees");
  const tCommon = useTranslations("common");
  const { openLightbox } = useImageLightbox();
  const { data: node, isLoading } = useFamilyNode(open ? nodeId : null);
  const [editing, setEditing] = useState(false);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);

  const deleteNode = useDeleteFamilyNode(nodeId, treeId, {
    onSuccess: () => {
      setConfirmDeleteOpen(false);
      onClose();
    },
  });

  function handleClose() {
    setEditing(false);
    setConfirmDeleteOpen(false);
    onClose();
  }

  return (
    <>
      <Dialog open={open} onOpenChange={(v) => !v && handleClose()}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="flex items-center justify-between gap-3 pr-8">
              <DialogTitle>
                {editing ? t("editMember") : t("memberDetails")}
              </DialogTitle>
              {isEditor && !editing && node && (
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setEditing(true)}
                    aria-label={t("editMember")}
                  >
                    <Pencil className="h-5 w-5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setConfirmDeleteOpen(true)}
                    aria-label={t("deleteMember")}
                  >
                    <Trash2 className="h-5 w-5 text-destructive" />
                  </Button>
                </div>
              )}
            </div>
          </DialogHeader>

          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-zinc-400" />
            </div>
          ) : node ? (
            <ScrollArea className="max-h-[60vh]">
              {editing ? (
                <div className="space-y-4">
                  <EditNodeForm
                    node={node}
                    onSuccess={() => setEditing(false)}
                    onCancel={() => setEditing(false)}
                  />
                  <PhotoManager
                    nodeId={node.id}
                    treeId={treeId}
                    photos={node.photos}
                    isEditor={isEditor}
                    showUpload={true}
                  />
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    {node.photos?.[0]?.blobUrl ? (
                      <button
                        type="button"
                        className="cursor-pointer rounded-full outline-none focus:ring-2 focus:ring-zinc-400 focus:ring-offset-2 dark:focus:ring-offset-zinc-900"
                        onClick={() =>
                          openLightbox(
                            node.photos[0].blobUrl,
                            node.firstName
                          )
                        }
                      >
                        <Avatar className="h-16 w-16">
                          <AvatarImage
                            src={node.photos[0].blobUrl}
                            alt={node.firstName}
                          />
                          <AvatarFallback className="bg-zinc-100 dark:bg-zinc-800">
                            <User className="h-8 w-8 text-zinc-400" />
                          </AvatarFallback>
                        </Avatar>
                      </button>
                    ) : (
                      <Avatar className="h-16 w-16">
                        <AvatarFallback className="bg-zinc-100 dark:bg-zinc-800">
                          <User className="h-8 w-8 text-zinc-400" />
                        </AvatarFallback>
                      </Avatar>
                    )}
                    <div>
                      <p className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
                        {node.firstName} {node.lastName ?? ""}
                      </p>
                      {node.gender && (
                        <p className="text-sm text-zinc-500">
                          {node.gender === "M" ? t("male") : t("female")}
                        </p>
                      )}
                    </div>
                  </div>

                  <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-sm">
                    <Detail
                      label={t("birthDate")}
                      value={formatDisplayDate(node.birthDate)}
                    />
                    <Detail
                      label={t("deathDate")}
                      value={formatDisplayDate(node.deathDate)}
                    />
                    <Detail
                      label={t("mother")}
                      value={
                        node.mother
                          ? `${node.mother.firstName} ${node.mother.lastName ?? ""}`
                          : null
                      }
                    />
                    <Detail
                      label={t("father")}
                      value={
                        node.father
                          ? `${node.father.firstName} ${node.father.lastName ?? ""}`
                          : null
                      }
                    />
                    <Detail
                      label={t("birthOrder")}
                      value={node.birthOrder?.toString() ?? null}
                    />
                  </dl>

                  {node.bio && (
                    <div>
                      <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
                        {t("bio")}
                      </p>
                      <p className="mt-1 whitespace-pre-wrap text-sm text-zinc-700 dark:text-zinc-300">
                        {node.bio}
                      </p>
                    </div>
                  )}

                  <PhotoManager
                    nodeId={node.id}
                    treeId={treeId}
                    photos={node.photos}
                    isEditor={isEditor}
                    showUpload={false}
                  />
                </div>
              )}
            </ScrollArea>
          ) : null}
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={confirmDeleteOpen}
        onConfirm={() => deleteNode.mutate()}
        onCancel={() => setConfirmDeleteOpen(false)}
        title={t("confirmDelete")}
        description={t("confirmDeleteDescription")}
        confirmLabel={t("confirm")}
        cancelLabel={tCommon("cancel")}
        isPending={deleteNode.isPending}
        variant="destructive"
      />
    </>
  );
}

function Detail({
  label,
  value,
}: {
  label: string;
  value: string | number | null | undefined;
}) {
  if (value == null || value === "") return null;
  return (
    <>
      <dt className="font-medium text-zinc-500 dark:text-zinc-400">{label}</dt>
      <dd className="text-zinc-900 dark:text-zinc-100">{String(value)}</dd>
    </>
  );
}
