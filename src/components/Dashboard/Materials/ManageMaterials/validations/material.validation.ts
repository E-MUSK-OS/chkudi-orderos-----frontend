import { z } from "zod";

// ======================================================
// Material Schema matching screenshot exactly
// ======================================================

export const materialAttributeSchema = z.object({
  id: z.string().optional(),
  attributeName: z.string().trim().optional(),
  attributeValue: z.string().trim().optional(),
});

export const materialSchema = z.object({
  // General Details
  sku: z.string().trim().min(1, "SKU is required"),
  masterSku: z.string().trim().min(1, "Master SKU is required"),
  materialName: z.string().trim().min(1, "Name is required"),

  category: z.string().trim().min(1, "Category is required"),
  subCategory: z.string().optional().default("No Sub Category"),
  manufacturingGroup: z.string().trim().min(1, "Manufacturing Group is required"),
  unit: z.string().trim().min(1, "Unit is required"),

  colors: z.array(z.string()).default([]),
  sizeList: z.string().optional().default(""),
  attributes: z.array(materialAttributeSchema).optional().default([]),
  width: z.preprocess(
    (v) => (v === "" || v === undefined || v === null ? 0 : Number(v)),
    z.number().default(0)
  ),
  widthRangeFrom: z.preprocess(
    (v) => (v === "" || v === undefined || v === null ? 0 : Number(v)),
    z.number().default(0)
  ),
  widthRangeTo: z.preprocess(
    (v) => (v === "" || v === undefined || v === null ? 0 : Number(v)),
    z.number().default(0)
  ),

  gsm: z.preprocess(
    (v) => (v === "" || v === undefined || v === null ? 0 : Number(v)),
    z.number().default(0)
  ),
  gsmRangeFrom: z.preprocess(
    (v) => (v === "" || v === undefined || v === null ? 0 : Number(v)),
    z.number().default(0)
  ),
  gsmRangeTo: z.preprocess(
    (v) => (v === "" || v === undefined || v === null ? 0 : Number(v)),
    z.number().default(0)
  ),

  gstRate: z.preprocess(
    (v) => (v === "" || v === undefined || v === null ? 5 : Number(v)),
    z.number().default(5)
  ),
  hsnCode: z.string().trim().min(1, "HSN Code is required"),
  brand: z.string().trim().min(1, "Brand Name is required").default("No Brand"),
  forUse: z.string().optional().default("No For Use"),

  less: z.preprocess(
    (v) => (v === "" || v === undefined || v === null ? 0 : Number(v)),
    z.number().default(0)
  ),
  description: z.string().optional().default(""),

  // Kardex Details
  costApplyingMode: z.string().trim().min(1, "Cost Applying Mode is required"),
  materialCost: z.preprocess(
    (v) => (v === "" || v === undefined || v === null ? 0 : Number(v)),
    z.number().default(0)
  ),
  mrp: z.preprocess(
    (v) => (v === "" || v === undefined || v === null ? "0" : String(v).trim()),
    z.string().default("0")
  ),
  salesRate: z.preprocess(
    (v) => (v === "" || v === undefined || v === null ? 0 : Number(v)),
    z.number().default(0)
  ),
  reorderLevelStock: z.preprocess(
    (v) => (v === "" || v === undefined || v === null ? 0 : Number(v)),
    z.number().default(0)
  ),
  purchaseType: z.string().optional().default(""),
  isStockDetailsCompulsory: z.boolean().default(false),

  issueMode: z.string().trim().min(1, "Issue Mode is required"),
  consumptionMode: z.string().trim().min(1, "Consumption Mode is required"),
  isIssuable: z.boolean().default(false),
  isSellable: z.boolean().default(false),

  isActive: z.boolean().default(true),
});

export type MaterialFormValues = z.infer<typeof materialSchema>;
