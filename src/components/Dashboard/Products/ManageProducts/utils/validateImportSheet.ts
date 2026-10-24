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

    // Extract headers from Row 1
    const headerRow = worksheet.getRow(1);
    const headers: string[] = [];

    headerRow.eachCell({ includeEmpty: false }, (cell) => {
      let val = cell.value;
      if (typeof val === "string") {
        headers.push(val.trim());
      } else if (val && typeof val === "object" && "richText" in val) {
        const text = (val as any).richText?.map((t: any) => t.text).join("") || "";
        headers.push(text.trim());
      } else if (val !== null && val !== undefined) {
        headers.push(String(val).trim());
      }
    });

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
      // product import
      const hasProductName = normalizedHeaders.some((h) =>
        ["productname", "product", "title"].includes(h)
      );
      const hasMasterSku = normalizedHeaders.some((h) =>
        ["mastersku", "sku", "masterskucode"].includes(h)
      );

      // Check if user accidentally uploaded ASIN or Myntra sheet
      const hasMyntraSku = normalizedHeaders.some((h) =>
        ["myntrasku", "myntraskucode"].includes(h)
      );
      const isAsinOnly =
        !hasProductName &&
        normalizedHeaders.includes("asin") &&
        normalizedHeaders.length <= 5;

      if (!hasProductName || !hasMasterSku || hasMyntraSku || isAsinOnly) {
        return {
          valid: false,
          message: "Please upload the appropriate sheet format for Product Import! You can download the demo sheet for reference.",
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
