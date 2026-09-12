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

  subCategory: z.string().optional().default(""),

  description: z.string().optional().default(""),

  asin: z.string().optional().default(""),

  rackAddress: z.string().optional().default(""),

  generateBarcode: z.string().optional().default("No"),

  mrp: z.preprocess(
    (val) => (val === "" || val === undefined || val === null ? undefined : Number(val)),
    z.number({ message: "MRP is required" }).min(0, "MRP must be non-negative")
  ),

  hsnCode: z.string().trim().min(1, "HSN Code is required"),

  gstRate: z.preprocess(
    (val) => (val === "" || val === undefined || val === null ? undefined : Number(val)),
    z.number({ message: "GST % is required" })
  ),

  attributes: z.array(productAttributeSchema).default([]),

  isActive: z.boolean(),
});

export type ProductFormValues = z.infer<typeof productSchema>;
