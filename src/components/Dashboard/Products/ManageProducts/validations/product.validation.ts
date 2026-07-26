import { z } from "zod";

// ======================================================
// Product Attribute Validation
// ======================================================

const productAttributeSchema = z.object({
  id: z.string().optional(),

  attributeName: z.string().trim().min(1, "Attribute name is required"),
});

export const productSchema = z.object({
  productName: z.string().trim().min(1, "Product Name is required"),

  masterSku: z.string().trim().min(1, "Master SKU is required"),

  brand: z.string().trim().min(1, "Brand is required"),

  category: z.string().trim().min(1, "Category is required"),

  subCategory: z.string().trim().min(1, "Sub Category is required"),

  description: z.string(),

  attributes: z.array(productAttributeSchema).default([]),

  isActive: z.boolean(),
});

export type ProductFormValues = z.infer<typeof productSchema>;
