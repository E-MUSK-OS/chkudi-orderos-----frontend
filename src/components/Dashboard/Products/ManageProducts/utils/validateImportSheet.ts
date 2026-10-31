import ExcelJS from "exceljs";
import { ImportType } from "../components/ProductToolbar";

export interface SheetValidationResult {
  valid: boolean;
  message?: string;
}

/**
 * Validates that an uploaded Excel file matches the required demo sheet format
 * for the selected import type ("product" | "asin" | "myntra").
 */
export async function validateImportSheetFormat(
  file: File,
  type: ImportType
): Promise<SheetValidationResult> {
  // 1. Basic file check
  if (!file) {
    return { valid: false, message: "No file selected." };
  }

  const fileName = file.name.toLowerCase();
  if (!fileName.endsWith(".xlsx") && !fileName.endsWith(".xls")) {
    return {
      valid: false,
      message: "Please upload a valid Excel spreadsheet (.xlsx or .xls).",
    };
  }

  try {
    const buffer = await file.arrayBuffer();
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(buffer);

    const worksheet = workbook.worksheets[0];
    if (!worksheet) {
      return {
        valid: false,
        message: "The uploaded Excel file has no worksheets.",
      };
    }

    if (worksheet.rowCount < 1) {
      return {
        valid: false,
        message: "The uploaded Excel sheet is empty.",
      };
    }

    // Find the header row by scanning the first 10 rows
    let headers: string[] = [];
    const maxScanRows = Math.min(worksheet.rowCount || 10, 10);

    for (let r = 1; r <= maxScanRows; r++) {
      const row = worksheet.getRow(r);
      const rowCells: string[] = [];
      row.eachCell({ includeEmpty: false }, (cell) => {
        let val = cell.value;
        if (typeof val === "string") {
          rowCells.push(val.trim());
        } else if (val && typeof val === "object" && "richText" in val) {
          const text = (val as any).richText?.map((t: any) => t.text).join("") || "";
          rowCells.push(text.trim());
        } else if (val !== null && val !== undefined) {
          rowCells.push(String(val).trim());
        }
      });

      const rowNorm = rowCells.map((s) => s.toLowerCase().replace(/[^a-z0-9]/g, ""));
      const isHeader = rowNorm.some((h) =>
        [
          "variantsku",
          "mastersku",
          "sku",
          "productname",
          "asin",
          "myntrasku",
          "fsncode",
          "rackaddress",
          "color",
          "colour",
          "size",
        ].includes(h)
      );

      if (isHeader) {
        headers = rowCells;
        break;
      }
      if (headers.length === 0 && rowCells.length > 0) {
        headers = rowCells;
      }
    }

    if (headers.length === 0) {
      return {
        valid: false,
        message: "No header row found in the uploaded sheet. Please upload the appropriate sheet format.",
      };
    }

    const normalize = (str: string) => str.toLowerCase().replace(/[^a-z0-9]/g, "");
    const normalizedHeaders = headers.map(normalize);

    if (type === "myntra") {
      const hasMyntraSku = normalizedHeaders.some((h) =>
        ["myntrasku", "myntraskucode", "platformsku"].includes(h)
      );
      const hasSellerSku = normalizedHeaders.some((h) =>
        ["sellersku", "sellerskucode", "mastersku", "productsku", "sku"].includes(h)
      );

      // Check if user accidentally uploaded Product or ASIN sheet
      const hasProductName = normalizedHeaders.includes("productname");
      const hasAsinWithoutMyntra = normalizedHeaders.includes("asin") && !hasMyntraSku;

      if (!hasMyntraSku || !hasSellerSku || hasProductName || hasAsinWithoutMyntra) {
        return {
          valid: false,
          message: "Please upload the appropriate sheet format for Myntra Import! You can download the demo sheet for reference.",
        };
      }
    } else if (type === "asin") {
      const hasAsin = normalizedHeaders.some((h) =>
        ["asin", "asincode", "amazonasin"].includes(h)
      );
      const hasSku = normalizedHeaders.some((h) =>
        ["sku", "mastersku", "productsku", "sellersku"].includes(h)
      );

      // Check if user accidentally uploaded Product or Myntra sheet
      const hasProductName = normalizedHeaders.includes("productname");
      const hasMyntraSku = normalizedHeaders.some((h) =>
        ["myntrasku", "myntraskucode"].includes(h)
      );

      if (!hasAsin || !hasSku || hasProductName || hasMyntraSku) {
        return {
          valid: false,
          message: "Please upload the appropriate sheet format for ASIN Import! You can download the demo sheet for reference.",
        };
      }
    } else {
      // product import: supports the exported/demo sheet format (Variant SKU, Asin, Myntra SKU, FSN Code, Rack Address, attributes)
      // as well as legacy product sheet format (Product Name, Master SKU)
      const hasVariantSku = normalizedHeaders.some((h) =>
        [
          "variantsku",
          "variant",
          "productvariantsku",
          "childsku",
          "subsku",
          "mastersku",
          "productsku",
          "sku",
          "sellersku",
          "productname",
          "product",
          "title",
        ].includes(h) || (h.includes("variant") && h.includes("sku"))
      );

      const isDedicatedMyntraSheet =
        normalizedHeaders.includes("sellersku") &&
        normalizedHeaders.includes("generatebarcode") &&
        !normalizedHeaders.some((h) => h.includes("variant")) &&
        !normalizedHeaders.includes("productname");

      const isDedicatedAsinSheet =
        normalizedHeaders.includes("asin") &&
        normalizedHeaders.includes("generatebarcode") &&
        !normalizedHeaders.some((h) => h.includes("variant")) &&
        !normalizedHeaders.includes("productname");

      if (!hasVariantSku || isDedicatedMyntraSheet || isDedicatedAsinSheet) {
        return {
          valid: false,
          message:
            "Please upload the appropriate sheet format for Product Import! You can download the demo sheet for reference.",
        };
      }
    }

    return { valid: true };
  } catch (err: any) {
    console.error("Sheet format validation error:", err);
    return {
      valid: false,
      message: "Unable to read the uploaded sheet. Please upload a valid .xlsx file in the appropriate format.",
    };
  }
}
