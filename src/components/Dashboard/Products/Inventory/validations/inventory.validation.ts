import { z } from "zod";

// ==================================================================================
// ============================== UPDATE INVENTORY ==================================
// ==================================================================================

export const updateInventorySchema = z.object({
  reorderLevel: z
    .number({
      error: "Reorder level must be a number.",
    })
    .int("Reorder level must be an integer.")
    .min(0, "Reorder level cannot be negative."),
});

// ==================================================================================
// ============================== ADJUST INVENTORY ==================================
// ==================================================================================

export const adjustInventorySchema = z.object({
  quantity: z
    .number({
      error: "Quantity must be a number.",
    })
    .int("Quantity must be an integer.")
    .positive("Quantity must be greater than zero."),

  adjustmentType: z.enum(["IN", "OUT"], {
    error: "Adjustment type must be IN or OUT.",
  }),

  reason: z
    .string()
    .trim()
    .min(3, "Reason must be at least 3 characters.")
    .max(255, "Reason cannot exceed 255 characters."),
});

// ==================================================================================
// =================================== TYPES ========================================
// ==================================================================================

export type UpdateInventoryFormData = z.infer<
  typeof updateInventorySchema
>;

export type AdjustInventoryFormData = z.infer<
  typeof adjustInventorySchema
>;