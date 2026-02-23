"use client";

import type { OurFileRouter } from "@/app/api/uploadthing/core";
import { api } from "@/app/service/api";
import { useCreateFamilyNode } from "@/app/service/family-node/hooks";
import { useFamilyTreeNodes } from "@/app/service/family-tree/tree/nodes/hooks";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { zodResolver } from "@hookform/resolvers/zod";
import { UploadButton } from "@uploadthing/react";
import { X } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

const NONE_VALUE = "__none__";

const addMemberSchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().optional(),
  gender: z.string().optional(),
  birthDate: z.string().optional(),
  deathDate: z.string().optional(),
  bio: z.string().optional(),
  birthOrder: z.string().optional(),
  motherId: z.string().optional(),
  fatherId: z.string().optional(),
});

type AddMemberFormValues = z.infer<typeof addMemberSchema>;

interface AddMemberDialogProps {
  treeId: string;
  open: boolean;
  onClose: () => void;
}

export function AddMemberDialog({
  treeId,
  open,
  onClose,
}: AddMemberDialogProps) {
  const t = useTranslations("trees");
  const tCommon = useTranslations("common");
  const router = useRouter();
  const { data: existingNodes } = useFamilyTreeNodes(open ? treeId : null);
  const [uploadedUrls, setUploadedUrls] = useState<string[]>([]);

  const form = useForm<AddMemberFormValues>({
    resolver: zodResolver(addMemberSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      gender: "",
      birthDate: "",
      deathDate: "",
      bio: "",
      birthOrder: "",
      motherId: "",
      fatherId: "",
    },
  });

  const createNode = useCreateFamilyNode({
    onSuccess: async (data) => {
      for (const url of uploadedUrls) {
        await api
          .post(`/api/family-node/${data.id}/photos`, { blobUrl: url })
          .catch(() => {});
      }
      setUploadedUrls([]);
      onClose();
      form.reset();
      router.refresh();
    },
  });

  function onSubmit(values: AddMemberFormValues) {
    createNode.mutate({
      familyTreeId: treeId,
      firstName: values.firstName,
      lastName: values.lastName || null,
      gender:
        values.gender === "M" || values.gender === "F"
          ? values.gender
          : null,
      birthDate: values.birthDate ? new Date(values.birthDate) : null,
      deathDate: values.deathDate ? new Date(values.deathDate) : null,
      bio: values.bio || null,
      birthOrder: values.birthOrder ? parseInt(values.birthOrder, 10) : null,
      motherId:
        values.motherId && values.motherId !== NONE_VALUE
          ? values.motherId
          : null,
      fatherId:
        values.fatherId && values.fatherId !== NONE_VALUE
          ? values.fatherId
          : null,
    });
  }

  const nodeOptions = existingNodes ?? [];

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v) {
          setUploadedUrls([]);
          onClose();
        }
      }}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t("addMember")}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3">
            <FormField
              control={form.control}
              name="firstName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("firstName")}</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-2 gap-3">
              <FormField
                control={form.control}
                name="lastName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("lastName")}</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="gender"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("gender")}</FormLabel>
                    <Select
                      value={field.value || NONE_VALUE}
                      onValueChange={(v) =>
                        field.onChange(v === NONE_VALUE ? "" : v)
                      }
                    >
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value={NONE_VALUE}>{t("none")}</SelectItem>
                        <SelectItem value="M">{t("male")}</SelectItem>
                        <SelectItem value="F">{t("female")}</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormItem>
                )}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <FormField
                control={form.control}
                name="birthDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("birthDate")}</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="deathDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("deathDate")}</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="birthOrder"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("birthOrder")}</FormLabel>
                  <FormControl>
                    <Input type="number" {...field} />
                  </FormControl>
                </FormItem>
              )}
            />
            <div className="grid grid-cols-2 gap-3">
              <FormField
                control={form.control}
                name="motherId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("mother")}</FormLabel>
                    <Select
                      value={field.value || NONE_VALUE}
                      onValueChange={(v) =>
                        field.onChange(v === NONE_VALUE ? "" : v)
                      }
                    >
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value={NONE_VALUE}>{t("none")}</SelectItem>
                        {nodeOptions.map((n) => (
                          <SelectItem key={n.id} value={n.id}>
                            {n.firstName} {n.lastName ?? ""}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="fatherId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("father")}</FormLabel>
                    <Select
                      value={field.value || NONE_VALUE}
                      onValueChange={(v) =>
                        field.onChange(v === NONE_VALUE ? "" : v)
                      }
                    >
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value={NONE_VALUE}>{t("none")}</SelectItem>
                        {nodeOptions.map((n) => (
                          <SelectItem key={n.id} value={n.id}>
                            {n.firstName} {n.lastName ?? ""}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="bio"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("bio")}</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                </FormItem>
              )}
            />

            <div>
              <p className="mb-1 text-sm font-medium">{t("photos")}</p>
              {uploadedUrls.length > 0 && (
                <div className="mb-2 flex flex-wrap gap-1">
                  {uploadedUrls.map((url, i) => (
                    <span
                      key={i}
                      className="inline-flex items-center gap-1 rounded-md bg-zinc-100 px-2 py-0.5 text-xs dark:bg-zinc-800"
                    >
                      Photo {i + 1}
                      <button
                        type="button"
                        onClick={() =>
                          setUploadedUrls((prev) =>
                            prev.filter((_, j) => j !== i)
                          )
                        }
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
              <UploadButton<OurFileRouter, "imageUploader">
                endpoint="imageUploader"
                onClientUploadComplete={(res) => {
                  if (res) {
                    const urls = res.map(
                      (f) =>
                        (f.serverData as { url?: string })?.url ?? f.ufsUrl
                    ).filter(Boolean) as string[];
                    setUploadedUrls((prev) => [...prev, ...urls]);
                  }
                }}
                appearance={{
                  button:
                    "h-8 rounded-md bg-zinc-900 px-3 text-xs font-medium text-white dark:bg-zinc-100 dark:text-zinc-900 ut-uploading:cursor-not-allowed",
                  allowedContent: "text-xs text-zinc-400",
                }}
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose}>
                {tCommon("cancel")}
              </Button>
              <Button type="submit" disabled={createNode.isPending}>
                {createNode.isPending ? tCommon("loading") : tCommon("save")}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
