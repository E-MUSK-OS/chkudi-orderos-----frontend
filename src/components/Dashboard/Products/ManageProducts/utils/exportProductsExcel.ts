import ExcelJS from "exceljs";
import { saveAs } from "file-saver";
import { toast } from "sonner";
import type { Product } from "../types/product.types";

/**
 * Helper to extract Color for a variant
 */
function extractColor(variant: any, product: Product): string {
  // 1. Variant attributes
  if (Array.isArray(variant?.attributes)) {
    const colAttr = variant.attributes.find((a: any) => {
      const name = (a.productAttribute?.attributeName || a.attributeName || "").toLowerCase().trim();
      return ["colour", "color"].includes(name) || name.includes("col");
    });
    if (colAttr?.attributeValue?.trim()) {
      return colAttr.attributeValue.trim();
    }
  }

  // 2. Parse from variantSku using product.colors
  const sku = (variant?.variantSku || "").toUpperCase().trim();
  if (Array.isArray(product.colors) && product.colors.length > 0) {
    const cleanColors = product.colors.filter((c): c is string => typeof c === "string" && Boolean(c.trim()));
    if (cleanColors.length === 1) {
      return cleanColors[0];
    }
    const skuTokens = sku.split(/[-_\s/]+/);
    for (const c of cleanColors) {
      const cUpper = c.toUpperCase().trim();
      if (skuTokens.includes(cUpper)) {
        return c;
      }
    }
    // If no specific variant (single product row)
    if (!variant || !product.variants || product.variants.length <= 1) {
      return cleanColors.join(", ");
    }
  } else if (typeof product.colors === "string" && (product.colors as string).trim()) {
    return (product.colors as string).trim();
  }

  // 3. Product attributes
  if (Array.isArray(product.attributes)) {
    const attrCol = product.attributes.find((a: any) => {
      const name = (a.attributeName || "").toLowerCase().trim();
      return ["colour", "color"].includes(name) || name.includes("col");
    });
    if (attrCol?.attributeValue?.trim()) {
      return attrCol.attributeValue.trim();
    }
  }

  // 4. Cached localStorage fallback
  if (typeof window !== "undefined") {
    try {
      const cachedStr =
        localStorage.getItem(`product_attrs_${product.id}`) ||
        localStorage.getItem(`product_attrs_${product.masterSku}`);
      if (cachedStr) {
        const cached = JSON.parse(cachedStr);
        if (Array.isArray(cached)) {
          const found = cached.find((c: any) =>
            ["colour", "color"].includes((c.attributeName || "").toLowerCase().trim())
          );
          if (found?.attributeValue?.trim()) return found.attributeValue.trim();
        }
      }
    } catch {
      // ignore
    }
  }

  return "";
}

/**
 * Helper to extract Size for a variant
 */
function extractSize(variant: any, product: Product): string {
  // 1. Variant attributes
  if (Array.isArray(variant?.attributes)) {
    const sizeAttr = variant.attributes.find((a: any) => {
      const name = (a.productAttribute?.attributeName || a.attributeName || "").toLowerCase().trim();
      return ["size"].includes(name);
    });
    if (sizeAttr?.attributeValue?.trim()) {
      return sizeAttr.attributeValue.trim();
    }
  }

  // 2. Parse from variantSku using product.sizeList
  const sku = (variant?.variantSku || "").toUpperCase().trim();
  if (product.sizeList && typeof product.sizeList === "string") {
    const sizes = product.sizeList.split(",").map((s) => s.trim()).filter(Boolean);
    if (sizes.length === 1) {
      return sizes[0];
    }
    // Sort sizes by length descending so "XXL" matches before "XL" or "L"
    const sortedSizes = [...sizes].sort((a, b) => b.length - a.length);
    const skuTokens = sku.split(/[-_\s/]+/);
    for (const sz of sortedSizes) {
      const szUpper = sz.toUpperCase();
      if (skuTokens.includes(szUpper) || sku.endsWith(`-${szUpper}`) || sku.endsWith(`_${szUpper}`)) {
        return sz;
      }
    }
    // If no specific variant (single product row)
    if (!variant || !product.variants || product.variants.length <= 1) {
      return product.sizeList;
    }
  }

  // 3. Product attributes
  if (Array.isArray(product.attributes)) {
    const attrSize = product.attributes.find((a: any) => {
      const name = (a.attributeName || "").toLowerCase().trim();
      return ["size"].includes(name);
    });
    if (attrSize?.attributeValue?.trim()) {
      return attrSize.attributeValue.trim();
    }
  }

  // 4. Cached localStorage fallback
  if (typeof window !== "undefined") {
    try {
      const cachedStr =
        localStorage.getItem(`product_attrs_${product.id}`) ||
        localStorage.getItem(`product_attrs_${product.masterSku}`);
      if (cachedStr) {
        const cached = JSON.parse(cachedStr);
        if (Array.isArray(cached)) {
          const found = cached.find(
            (c: any) => (c.attributeName || "").toLowerCase().trim() === "size"
          );
          if (found?.attributeValue?.trim()) return found.attributeValue.trim();
        }
      }
    } catch {
      // ignore
    }
  }

  return "";
}

/**
 * Helper to extract Gender for a variant
 */
function extractGender(variant: any, product: Product): string {
  // 1. Variant attributes
  if (Array.isArray(variant?.attributes)) {
    const gAttr = variant.attributes.find((a: any) => {
      const name = (a.productAttribute?.attributeName || a.attributeName || "").toLowerCase().trim();
      return ["gender"].includes(name);
    });
    if (gAttr?.attributeValue?.trim()) {
      return gAttr.attributeValue.trim();
    }
  }

  // 2. Product gender
  if (product.gender && product.gender.trim()) {
    return product.gender.trim();
  }

  // 3. Product attributes
  if (Array.isArray(product.attributes)) {
    const attrG = product.attributes.find((a: any) => {
      const name = (a.attributeName || "").toLowerCase().trim();
      return ["gender"].includes(name);
    });
    if (attrG?.attributeValue?.trim()) {
      return attrG.attributeValue.trim();
    }
  }

  // 4. Any sibling variant's gender
  if (Array.isArray(product.variants)) {
    for (const v of product.variants) {
      const found = (v.attributes || []).find((a: any) => {
        const name = (a.productAttribute?.attributeName || a.attributeName || "").toLowerCase().trim();
        return ["gender"].includes(name);
      });
      if (found?.attributeValue?.trim()) {
        return found.attributeValue.trim();
      }
    }
  }

  return "";
}

/**
 * Exports products as an Excel sheet containing ONLY:
 * - Variant SKU
 * - Asin
 * - Rack Address
 * - Color
 * - Size
 * - Gender
 *
 * Includes all variant details for each product.
 */
export const exportProductsExcel = async (
  productsToExport: Product[],
  isSelectedOnly = false
) => {
  try {
    if (!productsToExport || productsToExport.length === 0) {
      toast.error("No products to export.");
      return;
    }

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Product Variants");

    // Define columns: ONLY Variant SKU, Asin, Rack Address, Color, Size, Gender
    worksheet.columns = [
      { header: "Variant SKU", key: "variantSku", width: 28 },
      { header: "Asin", key: "asin", width: 22 },
      { header: "Rack Address", key: "rackAddress", width: 20 },
      { header: "Color", key: "color", width: 18 },
      { header: "Size", key: "size", width: 16 },
      { header: "Gender", key: "gender", width: 18 },
    ];

    // Header styling matching OrderOS dark theme
    const headerRow = worksheet.getRow(1);
    headerRow.font = {
      name: "Calibri",
      size: 11,
      bold: true,
      color: { argb: "FFFFFFFF" },
    };
    headerRow.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF0A0E1A" },
    };
    headerRow.alignment = { vertical: "middle", horizontal: "center" };
    headerRow.height = 28;

    let totalExportedRows = 0;

    // Add rows for each product / variant
    productsToExport.forEach((product) => {
      if (Array.isArray(product.variants) && product.variants.length > 0) {
        // Output each variant as a row
        product.variants.forEach((variant: any) => {
          const rowData = {
            variantSku: (variant.variantSku || product.masterSku || product.sku || "").trim(),
            asin: (variant.asin || product.asin || "").trim(),
            rackAddress: (variant.rackAddress || product.rackAddress || "").trim(),
            color: extractColor(variant, product),
            size: extractSize(variant, product),
            gender: extractGender(variant, product),
          };

          const r = worksheet.addRow(rowData);
          r.height = 22;
          r.alignment = { vertical: "middle" };
          totalExportedRows++;
        });
      } else {
        // Output single row for product without variants
        const rowData = {
          variantSku: (product.masterSku || product.sku || "").trim(),
          asin: (product.asin || "").trim(),
          rackAddress: (product.rackAddress || "").trim(),
          color: extractColor(null, product),
          size: extractSize(null, product),
          gender: extractGender(null, product),
        };

        const r = worksheet.addRow(rowData);
        r.height = 22;
        r.alignment = { vertical: "middle" };
        totalExportedRows++;
      }
    });

    // Apply clean cell border and styling to all data rows
    worksheet.eachRow((row, rowNumber) => {
      if (rowNumber === 1) return;
      row.eachCell((cell) => {
        cell.border = {
          top: { style: "thin", color: { argb: "FFE2E8F0" } },
          left: { style: "thin", color: { argb: "FFE2E8F0" } },
          bottom: { style: "thin", color: { argb: "FFE2E8F0" } },
          right: { style: "thin", color: { argb: "FFE2E8F0" } },
        };
        cell.font = { name: "Calibri", size: 10 };
      });
    });

    const buffer = await workbook.xlsx.writeBuffer();
    const dateStr = new Date().toISOString().slice(0, 10);
    const fileName = isSelectedOnly
      ? `product-variants-selected-${dateStr}.xlsx`
      : `product-variants-all-${dateStr}.xlsx`;

    saveAs(
      new Blob([buffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      }),
      fileName
    );

    toast.success(
      isSelectedOnly
        ? `Exported ${totalExportedRows} variant row(s) from ${productsToExport.length} selected product(s)!`
        : `Exported ${totalExportedRows} variant row(s) successfully!`
    );
  } catch (err) {
    console.error("Export error:", err);
    toast.error("Failed to export products data.");
  }
};
