import ExcelJS from "exceljs";
import { ImportType } from "../components/MaterialToolbar";

export interface SheetValidationResult {
  valid: boolean;
  message?: string;
}

export async function validateImportSheetFormat(
  file: File,
  type: ImportType = "material"
): Promise<SheetValidationResult> {
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

    if (worksheet.rowCount < 2) {
      return {
        valid: false,
        message: "The uploaded Excel sheet is empty or has no data rows. Please fill in the details.",
      };
    }

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
        message: "No header row found in the uploaded sheet. Please download the demo sheet for the correct format.",
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
      if (!hasMyntraSku || !hasSellerSku) {
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
      if (!hasAsin || !hasSku) {
        return {
          valid: false,
          message: "Please upload the appropriate sheet format for ASIN Import! You can download the demo sheet for reference.",
        };
      }
    } else {
      // Validate Material sheet headers
      const hasSku = normalizedHeaders.some((h) =>
        ["sku", "mastersku", "materialsku"].includes(h)
      );
      const hasName = normalizedHeaders.some((h) =>
        ["name", "materialname"].includes(h)
      );
      const hasCategory = normalizedHeaders.some((h) =>
        ["category", "materialcategory"].includes(h)
      );

      if (!hasSku || !hasName) {
        return {
          valid: false,
          message:
            "Invalid Material sheet format! Required header columns (SKU *, Name *) were not found. Please use the Demo Sheet template.",
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
