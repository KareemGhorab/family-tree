import { z } from "zod";

const optionalDate = z
  .string()
  .transform((v) => new Date(v))
  .nullable()
  .optional();

export const createTreeSchema = z.object({
  name: z.string().min(1, "name is required"),
  ownerId: z.string().min(1, "ownerId is required"),
});

export const updateTreeSchema = z.object({
  name: z.string().min(1, "name is required"),
});

const familyNodeBase = z.object({
  familyTreeId: z.string().min(1, "familyTreeId is required"),
  firstName: z.string().min(1, "firstName is required"),
  lastName: z.string().nullable().optional(),
  birthDate: optionalDate,
  deathDate: optionalDate,
  bio: z.string().nullable().optional(),
  birthOrder: z.number().int().nullable().optional(),
  motherId: z.string().nullable().optional(),
  fatherId: z.string().nullable().optional(),
});

export const createNodeSchema = familyNodeBase;

export const updateNodeSchema = familyNodeBase
  .omit({ familyTreeId: true })
  .partial()
  .refine((data) => Object.keys(data).length > 0, {
    message: "No valid fields to update",
  });

export type CreateTree = z.infer<typeof createTreeSchema>;
export type UpdateTree = z.infer<typeof updateTreeSchema>;
export type CreateNode = z.infer<typeof createNodeSchema>;
export type UpdateNode = z.infer<typeof updateNodeSchema>;
