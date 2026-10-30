import { z } from "zod";

// ======================================================
// Product Attribute Validation
// ======================================================

const productAttributeSchema = z.object({
  id: z.string().optional(),
  attributeName: z.string().trim().optional().default(""),
  attributeValue: z.string().trim().optional().default(""),
});

export const productSchema = z.object({
  productName: z.string().trim().min(1, "Product Name is required"),
  masterSku: z.string().trim().min(1, "Master SKU is required"),
  sku: z.string().trim().optional().default(""),
  brand: z.string().trim().optional().default(""),
  category: z
    .string()
    .trim()
    .min(1, "Category is required")
    .max(100, "Category cannot exceed 100 characters"),
  subCategory: z.string().optional().default(""),
  unit: z.string().optional().default("Pcs"),
  sizeList: z.string().optional().default(""),
  colors: z.array(z.string()).default([]),
  gender: z.string().optional().default(""),
  referenceParty: z.string().optional().default(""),

  description: z.string().optional().default(""),
  asin: z.string().optional().default(""),
  rackAddress: z.string().optional().default(""),
  generateBarcode: z.string().optional().default("No"),
  mrp: z.preprocess(
    (val) => (val === undefined || val === null ? "" : String(val).trim()),
    z.string().min(1, "MRP is required")
  ),
  mfgMonth: z.string().optional().default(""),
  hsnCode: z.string().trim().optional().default(""),
  gstRate: z.preprocess(
    (val) => (val === "" || val === undefined || val === null ? undefined : Number(val)),
    z.number().optional()
  ),

  // Kardex fields
  productCost: z.preprocess(
    (v) => (v === "" || v === undefined || v === null ? 0 : Number(v)),
    z.number().default(0)
  ),
  dealerRate: z.preprocess(
    (v) => (v === "" || v === undefined || v === null ? 0 : Number(v)),
    z.number().default(0)
  ),
  retailRate: z.preprocess(
    (v) => (v === "" || v === undefined || v === null ? 0 : Number(v)),
    z.number().default(0)
  ),
  openingStock: z.preprocess(
    (v) => (v === "" || v === undefined || v === null ? 0 : Number(v)),
    z.number().default(0)
  ),
  reorderLevelStock: z.preprocess(
    (v) => (v === "" || v === undefined || v === null ? 0 : Number(v)),
    z.number().default(0)
  ),
  minimumStock: z.preprocess(
    (v) => (v === "" || v === undefined || v === null ? 0 : Number(v)),
    z.number().default(0)
  ),
  productPoints: z.preprocess(
    (v) => (v === "" || v === undefined || v === null ? 1 : Number(v)),
    z.number().default(1)
  ),
  isPaired: z.boolean().default(false),
  availability: z.string().default("Public"),

  attributes: z.array(productAttributeSchema).optional().default([]),

  isActive: z.boolean().default(true),
});

export type ProductFormValues = z.infer<typeof productSchema>;
