import { z } from "zod";

export const warehouseSchema = z.object({
  warehouseName: z
    .string()
    .trim()
    .min(2, "Warehouse name is required")
    .max(100),

  warehouseCode: z
    .string()
    .trim()
    .min(2, "Warehouse code is required")
    .max(30),

  description: z.string().optional(),

  contactPerson: z.string().optional(),

  phone: z.string().optional(),

  email: z
    .string()
    .email("Invalid email")
    .or(z.literal(""))
    .optional(),

  addressLine1: z.string().optional(),

  addressLine2: z.string().optional(),

  city: z.string().optional(),

  state: z.string().optional(),

  country: z.string().optional(),

  pincode: z.string().optional(),

  gstNumber: z.string().optional(),

  isDefault: z.boolean(),

  isActive: z.boolean(),
});

export type WarehouseFormValues = z.infer<
  typeof warehouseSchema
>;