import ExcelJS from "exceljs";
import { saveAs } from "file-saver";
import { toast } from "sonner";
import type { Product } from "../types/product.types";
import { getDefaultAttributesForCategory } from "../constants/product.constants";

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
 * Helper to extract any custom dynamic attribute value for a variant / product
 */
function extractCustomAttributeValue(
  attrName: string,
  variant: any,
  product: Product
): string {
  const lowerName = attrName.toLowerCase().trim();

  // 1. Variant attributes
  if (variant && Array.isArray(variant.attributes)) {
    const matched = variant.attributes.find((a: any) => {
      const aName = (
        a.productAttribute?.attributeName ||
        a.attributeName ||
        ""
      ).toLowerCase().trim();
      return aName === lowerName;
    });
    if (matched?.attributeValue && String(matched.attributeValue).trim()) {
      return String(matched.attributeValue).trim();
    }
  }

  // 2. Parent product attributes
  if (Array.isArray(product.attributes)) {
    const matched = product.attributes.find((a: any) => {
      const aName = (a.attributeName || "").toLowerCase().trim();
      return aName === lowerName;
    });
    if (matched?.attributeValue && String(matched.attributeValue).trim()) {
      return String(matched.attributeValue).trim();
    }
  }

  // 3. Direct product property fallback
  const directVal = (product as any)[attrName] || (product as any)[lowerName];
  if (directVal && typeof directVal === "string" && directVal.trim()) {
    return directVal.trim();
  }

  // 4. LocalStorage cached fallback
  if (typeof window !== "undefined") {
    try {
      const cachedStr =
        localStorage.getItem(`product_attrs_${product.id}`) ||
        localStorage.getItem(`product_attrs_${product.masterSku}`);
      if (cachedStr) {
        const cached = JSON.parse(cachedStr);
        if (Array.isArray(cached)) {
          const found = cached.find(
            (c: any) =>
              (c.attributeName || "").toLowerCase().trim() === lowerName
          );
          if (found?.attributeValue && String(found.attributeValue).trim()) {
            return String(found.attributeValue).trim();
          }
        }
      }
    } catch {
      // ignore
    }
  }

  return "";
}

/**
 * Exports products as an Excel sheet containing:
 * - Variant SKU
 * - Marketplace identifiers (ASIN, Myntra SKU, FSN Code - dynamically if present in table)
 * - Rack Address
 * - Dynamic table attributes (Color, Size, Gender, and any custom attributes only if present in table)
 *
 * Includes all variant details for each product.
 */
export const exportProductsExcel = async (
  productsToExport: Product[],
  isSelectedOnly = false,
  activeMarketplaceFilter = ""
) => {
  try {
    if (!productsToExport || productsToExport.length === 0) {
      toast.error("No products to export.");
      return;
    }

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Product Variants");

    // Helper to safely extract marketplaces array from product
    const getProductMarketplaces = (product: Product): string[] => {
      const raw = product.marketplace;
      if (Array.isArray(raw)) {
        return raw.map((m) => String(m).trim().toLowerCase()).filter(Boolean);
      }
      if (typeof raw === "string" && raw.trim()) {
        return raw
          .split(",")
          .map((m) => m.trim().toLowerCase())
          .filter(Boolean);
      }
      return ["all"];
    };

    // Determine presence of ASIN, Myntra SKU, and FSN Code strictly based on marketplace selection:
    // 1. If user filtered by a specific marketplace:
    //    - "amazon" -> ONLY ASIN column
    //    - "myntra" -> ONLY Myntra SKU column
    //    - "flipkart" -> ONLY FSN Code column
    // 2. If user selected "all" / no filter:
    //    - If any product has "all" -> All three columns (ASIN, Myntra SKU, FSN Code)
    //    - If products have specific marketplace(s) -> only columns for those marketplace(s)
    const filterLower = (activeMarketplaceFilter || "").toLowerCase().trim();

    let hasAsin = false;
    let hasMyntraSku = false;
    let hasFsnCode = false;

    if (filterLower && filterLower !== "all" && filterLower !== "all marketplaces") {
      if (filterLower.includes("amazon")) {
        hasAsin = true;
      } else if (filterLower.includes("myntra")) {
        hasMyntraSku = true;
      } else if (filterLower.includes("flipkart") || filterLower.includes("flipcart")) {
        hasFsnCode = true;
      }
    } else {
      // Check if any product has "all"
      const hasAllMarketplace = productsToExport.some((product) => {
        const mkts = getProductMarketplaces(product);
        return mkts.length === 0 || mkts.includes("all");
      });

      if (hasAllMarketplace) {
        hasAsin = true;
        hasMyntraSku = true;
        hasFsnCode = true;
      } else {
        hasAsin = productsToExport.some((product) => {
          const mkts = getProductMarketplaces(product);
          return mkts.includes("amazon");
        });

        hasMyntraSku = productsToExport.some((product) => {
          const mkts = getProductMarketplaces(product);
          return mkts.includes("myntra");
        });

        hasFsnCode = productsToExport.some((product) => {
          const mkts = getProductMarketplaces(product);
          return mkts.includes("flipkart") || mkts.includes("flipcart");
        });
      }
    }

    // -------------------------------------------------------------
    // Dynamically detect table attributes across exported products
    // (Attributes are not fixed to Color, Size, Gender)
    // -------------------------------------------------------------
    const hasColor = productsToExport.some((product) => {
      const rawColors: any = product.colors;
      if (
        Array.isArray(rawColors) &&
        rawColors.some((c) => typeof c === "string" && Boolean(c.trim()))
      ) {
        return true;
      }
      if (typeof rawColors === "string" && rawColors.trim()) {
        return true;
      }
      if (
        Array.isArray(product.attributes) &&
        product.attributes.some((a) =>
          ["colour", "color"].includes((a.attributeName || "").toLowerCase().trim())
        )
      ) {
        return true;
      }
      if (
        Array.isArray(product.variants) &&
        product.variants.some(
          (v: any) =>
            (v.attributes || []).some((a: any) =>
              ["colour", "color"].includes(
                (a.productAttribute?.attributeName || a.attributeName || "").toLowerCase().trim()
              )
            ) || Boolean(extractColor(v, product))
        )
      ) {
        return true;
      }
      return false;
    });

    let colorLabel = "Color";
    if (hasColor) {
      const usesUkSpelling = productsToExport.some((p) => {
        if (
          Array.isArray(p.attributes) &&
          p.attributes.some((a) => (a.attributeName || "").toLowerCase().trim() === "colour")
        ) {
          return true;
        }
        if (
          Array.isArray(p.variants) &&
          p.variants.some((v: any) =>
            (v.attributes || []).some(
              (a: any) =>
                (a.productAttribute?.attributeName || a.attributeName || "").toLowerCase().trim() === "colour"
            )
          )
        ) {
          return true;
        }
        return false;
      });
      if (usesUkSpelling) colorLabel = "Colour";
    }

    const hasSize = productsToExport.some((product) => {
      if (product.sizeList && typeof product.sizeList === "string" && product.sizeList.trim()) {
        return true;
      }
      if (
        Array.isArray(product.attributes) &&
        product.attributes.some((a) => (a.attributeName || "").toLowerCase().trim() === "size")
      ) {
        return true;
      }
      if (
        Array.isArray(product.variants) &&
        product.variants.some(
          (v: any) =>
            (v.attributes || []).some(
              (a: any) =>
                (a.productAttribute?.attributeName || a.attributeName || "").toLowerCase().trim() === "size"
            ) || Boolean(extractSize(v, product))
        )
      ) {
        return true;
      }
      return false;
    });

    const hasGender = productsToExport.some((product) => {
      if (product.gender && typeof product.gender === "string" && product.gender.trim()) {
        return true;
      }
      if (
        Array.isArray(product.attributes) &&
        product.attributes.some((a) => (a.attributeName || "").toLowerCase().trim() === "gender")
      ) {
        return true;
      }
      if (
        Array.isArray(product.variants) &&
        product.variants.some(
          (v: any) =>
            (v.attributes || []).some(
              (a: any) =>
                (a.productAttribute?.attributeName || a.attributeName || "").toLowerCase().trim() === "gender"
            ) || Boolean(extractGender(v, product))
        )
      ) {
        return true;
      }
      return false;
    });

    const standardSkip = new Set([
      "colour",
      "color",
      "size",
      "gender",
      "sku",
      "variantsku",
      "mastersku",
      "asin",
      "myntrasku",
      "fsncode",
      "rackaddress",
      "productname",
      "brand",
      "category",
      "status",
      "action",
      "img",
      "image",
    ]);

    const dynamicAttrMap = new Map<string, { header: string; key: string }>();

    productsToExport.forEach((product) => {
      if (Array.isArray(product.attributes) && product.attributes.length > 0) {
        product.attributes.forEach((a) => {
          const raw = (a.attributeName || "").trim();
          const lower = raw.toLowerCase();
          if (lower && !standardSkip.has(lower) && !dynamicAttrMap.has(lower)) {
            const safeKey = `attr_${lower.replace(/[^a-z0-9]/g, "_")}`;
            dynamicAttrMap.set(lower, { header: raw, key: safeKey });
          }
        });
      } else if (product.category) {
        const catDefaults = getDefaultAttributesForCategory(product.category);
        catDefaults.forEach((raw) => {
          const lower = raw.trim().toLowerCase();
          if (lower && !standardSkip.has(lower) && !dynamicAttrMap.has(lower)) {
            const safeKey = `attr_${lower.replace(/[^a-z0-9]/g, "_")}`;
            dynamicAttrMap.set(lower, { header: raw, key: safeKey });
          }
        });
      }

      if (Array.isArray(product.variants)) {
        product.variants.forEach((v: any) => {
          if (Array.isArray(v.attributes)) {
            v.attributes.forEach((va: any) => {
              const raw = (
                va.productAttribute?.attributeName ||
                va.attributeName ||
                ""
              ).trim();
              const lower = raw.toLowerCase();
              if (lower && !standardSkip.has(lower) && !dynamicAttrMap.has(lower)) {
                const safeKey = `attr_${lower.replace(/[^a-z0-9]/g, "_")}`;
                dynamicAttrMap.set(lower, { header: raw, key: safeKey });
              }
            });
          }
        });
      }
    });

    // Define columns dynamically:
    // 1. Variant SKU
    // 2. Dynamic Marketplace Identifiers (if present)
    // 3. Rack Address
    // 4. Dynamic Attributes (Color, Size, Gender only if present, followed by custom attributes)
    const columns: Partial<ExcelJS.Column>[] = [
      { header: "Variant SKU", key: "variantSku", width: 28 },
    ];

    if (hasAsin) {
      columns.push({ header: "ASIN", key: "asin", width: 22 });
    }
    if (hasMyntraSku) {
      columns.push({ header: "Myntra SKU", key: "myntraSku", width: 22 });
    }
    if (hasFsnCode) {
      columns.push({ header: "FSN Code", key: "fsnCode", width: 22 });
    }

    columns.push({ header: "Rack Address", key: "rackAddress", width: 20 });

    if (hasColor) {
      columns.push({ header: colorLabel, key: "color", width: 18 });
    }
    if (hasSize) {
      columns.push({ header: "Size", key: "size", width: 16 });
    }
    if (hasGender) {
      columns.push({ header: "Gender", key: "gender", width: 18 });
    }

    dynamicAttrMap.forEach(({ header, key }) => {
      columns.push({
        header,
        key,
        width: Math.max(16, header.length + 6),
      });
    });

    worksheet.columns = columns;

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
          const rowData: Record<string, any> = {
            variantSku: (variant.variantSku || product.masterSku || product.sku || "").trim(),
          };

          if (hasAsin) {
            rowData.asin = (variant.asin || "").trim();
          }
          if (hasMyntraSku) {
            rowData.myntraSku = (variant.myntraSku || "").trim();
          }
          if (hasFsnCode) {
            rowData.fsnCode = (variant.fsnCode || "").trim();
          }

          rowData.rackAddress = (variant.rackAddress || "").trim();

          if (hasColor) {
            rowData.color = extractColor(variant, product);
          }
          if (hasSize) {
            rowData.size = extractSize(variant, product);
          }
          if (hasGender) {
            rowData.gender = extractGender(variant, product);
          }

          dynamicAttrMap.forEach(({ header, key }) => {
            rowData[key] = extractCustomAttributeValue(header, variant, product);
          });

          const r = worksheet.addRow(rowData);
          r.height = 22;
          r.alignment = { vertical: "middle" };
          totalExportedRows++;
        });
      } else {
        // Output single row for product without variants
        const rowData: Record<string, any> = {
          variantSku: (product.masterSku || product.sku || "").trim(),
        };

        if (hasAsin) {
          rowData.asin = (product.asin || "").trim();
        }
        if (hasMyntraSku) {
          rowData.myntraSku = ((product as any).myntraSku || "").trim();
        }
        if (hasFsnCode) {
          rowData.fsnCode = ((product as any).fsnCode || "").trim();
        }

        rowData.rackAddress = (product.rackAddress || "").trim();

        if (hasColor) {
          rowData.color = extractColor(null, product);
        }
        if (hasSize) {
          rowData.size = extractSize(null, product);
        }
        if (hasGender) {
          rowData.gender = extractGender(null, product);
        }

        dynamicAttrMap.forEach(({ header, key }) => {
          rowData[key] = extractCustomAttributeValue(header, null, product);
        });

        const r = worksheet.addRow(rowData);
        r.height = 22;
        r.alignment = { vertical: "middle" };
        totalExportedRows++;
      }
    });

    // Lock non-editable columns (Variant SKU, attributes), unlock editable columns (ASIN, Myntra SKU, FSN Code, Rack Address)
    const editableKeys = new Set(["asin", "myntraSku", "fsnCode", "rackAddress"]);

    // Set column-level protection
    worksheet.columns.forEach((col) => {
      const isEditable = Boolean(col.key && editableKeys.has(String(col.key)));
      col.protection = { locked: !isEditable };
    });

    // Explicitly apply cell-level protection, borders, fonts, and styling
    for (let c = 1; c <= worksheet.columnCount; c++) {
      const col = worksheet.getColumn(c);
      const isEditable = Boolean(col.key && editableKeys.has(String(col.key)));

      for (let r = 1; r <= worksheet.rowCount; r++) {
        const cell = worksheet.getCell(r, c);

        if (r === 1) {
          // Header row is always locked
          cell.protection = { locked: true };
          continue;
        }

        cell.protection = { locked: !isEditable };

        if (isEditable) {
          // Clean white background for user-editable cells
          cell.fill = {
            type: "pattern",
            pattern: "solid",
            fgColor: { argb: "FFFFFFFF" },
          };
        } else {
          // Slightly muted background for locked cells (Variant SKU and Attributes)
          cell.fill = {
            type: "pattern",
            pattern: "solid",
            fgColor: { argb: "FFF8FAFC" },
          };
        }

        cell.border = {
          top: { style: "thin", color: { argb: "FFE2E8F0" } },
          left: { style: "thin", color: { argb: "FFE2E8F0" } },
          bottom: { style: "thin", color: { argb: "FFE2E8F0" } },
          right: { style: "thin", color: { argb: "FFE2E8F0" } },
        };
        cell.font = { name: "Calibri", size: 10 };
      }
    }

    // Protect worksheet: user can select and edit ONLY unlocked cells (ASIN, Myntra SKU, FSN Code, Rack Address)
    await worksheet.protect("", {
      selectLockedCells: true,
      selectUnlockedCells: true,
      formatCells: false,
      formatColumns: false,
      formatRows: false,
      insertColumns: false,
      insertRows: false,
      deleteColumns: false,
      deleteRows: false,
      sort: true,
      autoFilter: true,
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
