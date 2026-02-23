"use client";

import { useCreateFamilyTree } from "@/app/service/family-tree/hooks";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
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
import { createTreeSchema, type CreateTree } from "@/lib/validations";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

export function CreateFamilyTreeDialog() {
  const t = useTranslations("trees");
  const tCommon = useTranslations("common");
  const router = useRouter();
  const [open, setOpen] = useState(false);

  const form = useForm<CreateTree>({
    resolver: zodResolver(createTreeSchema),
    defaultValues: { name: "" },
  });

  const createTree = useCreateFamilyTree({
    onSuccess: () => {
      setOpen(false);
      form.reset({ name: "" });
      router.refresh();
    },
  });

  function onSubmit(data: CreateTree) {
    createTree.mutate(data);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>{t("createTree")}</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>{t("dialogTitle")}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("treeNameLabel")}</FormLabel>
                  <FormControl>
                    <Input placeholder={t("treeNameLabel")} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
              >
                {tCommon("cancel")}
              </Button>
              <Button type="submit" disabled={createTree.isPending}>
                {createTree.isPending ? tCommon("loading") : tCommon("save")}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
