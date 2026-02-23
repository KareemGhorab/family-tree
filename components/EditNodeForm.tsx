"use client";

import { useUpdateFamilyNode } from "@/app/service/family-node/node/hooks";
import { useFamilyTreeNodes } from "@/app/service/family-tree/tree/nodes/hooks";
import type { FamilyNodeDetail } from "@/app/service/types";
import { Button } from "@/components/ui/button";
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
import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

const NONE_VALUE = "__none__";

const editNodeSchema = z.object({
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

type EditNodeValues = z.infer<typeof editNodeSchema>;

interface EditNodeFormProps {
  node: FamilyNodeDetail;
  onSuccess: () => void;
  onCancel: () => void;
}

function toDateInput(iso: string | null): string {
  if (!iso) return "";
  return iso.slice(0, 10);
}

export function EditNodeForm({ node, onSuccess, onCancel }: EditNodeFormProps) {
  const t = useTranslations("trees");
  const tCommon = useTranslations("common");
  const { data: existingNodes } = useFamilyTreeNodes(node.familyTreeId);

  const form = useForm<EditNodeValues>({
    resolver: zodResolver(editNodeSchema),
    defaultValues: {
      firstName: node.firstName,
      lastName: node.lastName ?? "",
      gender: node.gender ?? "",
      birthDate: toDateInput(node.birthDate),
      deathDate: toDateInput(node.deathDate),
      bio: node.bio ?? "",
      birthOrder: node.birthOrder?.toString() ?? "",
      motherId: node.motherId ?? "",
      fatherId: node.fatherId ?? "",
    },
  });

  const updateNode = useUpdateFamilyNode(node.id, {
    onSuccess: () => {
      toast.success(tCommon("save"));
      onSuccess();
    },
    onError: (error) => {
      toast.error(error.message ?? tCommon("error"));
    },
  });

  function onSubmit(values: EditNodeValues) {
    updateNode.mutate({
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

  const nodeOptions = (existingNodes ?? []).filter((n) => n.id !== node.id);

  return (
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
        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="outline" onClick={onCancel}>
            {tCommon("cancel")}
          </Button>
          <Button type="submit" disabled={updateNode.isPending}>
            {updateNode.isPending ? tCommon("loading") : tCommon("save")}
          </Button>
        </div>
      </form>
    </Form>
  );
}
