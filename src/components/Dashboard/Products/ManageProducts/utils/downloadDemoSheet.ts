import ExcelJS from "exceljs";
import { saveAs } from "file-saver";
import { toast } from "sonner";
import { ImportType } from "../components/ProductToolbar";

export const downloadDemoSheet = async (type: ImportType) => {
  try {
    const workbook = new ExcelJS.Workbook();

    if (type === "myntra") {
      const worksheet = workbook.addWorksheet("Myntra Import");

      worksheet.columns = [
        { header: "Rack Address", key: "rackAddress", width: 20 },
        { header: "Myntra SKU", key: "myntraSku", width: 25 },
        { header: "Seller SKU", key: "sellerSku", width: 25 },
        { header: "Generate Barcode", key: "generateBarcode", width: 22 },
      ];

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

      const sampleRows = [
        {
          rackAddress: "A-01-01",
          myntraSku: "MYN-TSHIRT-BLK-M",
          sellerSku: "TS-BLK-M",
          generateBarcode: "TS-BLK-M",
        },
        {
          rackAddress: "A-01-02",
          myntraSku: "MYN-TSHIRT-BLK-L",
          sellerSku: "TS-BLK-L",
          generateBarcode: "TS-BLK-L",
        },
        {
          rackAddress: "B-03-04",
          myntraSku: "MYN-JEANS-BLU-32",
          sellerSku: "JN-BLU-32",
          generateBarcode: "JN-BLU-32",
        },
        {
          rackAddress: "C-02-08",
          myntraSku: "MYN-KURTI-RED-S",
          sellerSku: "KT-RED-S",
          generateBarcode: "KT-RED-S",
        },
      ];

      sampleRows.forEach((item) => {
        const r = worksheet.addRow(item);
        r.height = 22;
        r.alignment = { vertical: "middle" };
      });

      const buffer = await workbook.xlsx.writeBuffer();
      saveAs(
        new Blob([buffer], {
          type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        }),
        "myntra-import-demo-sheet.xlsx"
      );
      toast.success("Myntra Import demo sheet downloaded successfully!");
    } else if (type === "asin") {
      const worksheet = workbook.addWorksheet("ASIN Import");

      worksheet.columns = [
        { header: "ASIN", key: "asin", width: 22 },
        { header: "SKU", key: "sku", width: 25 },
        { header: "Generate Barcode", key: "generateBarcode", width: 20 },
        { header: "Rack Address", key: "rackAddress", width: 20 },
      ];

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

      const sampleRows = [
        {
          asin: "B0DK9HFD2S",
          sku: "TOPLOT-002",
          generateBarcode: "Yes",
          rackAddress: "RACK002",
        },
        {
          asin: "B0GGYM3WFR",
          sku: "TOPLOT-003",
          generateBarcode: "No",
          rackAddress: "RACK003",
        },
        {
          asin: "B0GGYDT9KN",
          sku: "TOPLOT-004",
          generateBarcode: "Yes",
          rackAddress: "RACK004",
        },
        {
          asin: "B0H395B1TY",
          sku: "TOPLOT-005",
          generateBarcode: "No",
          rackAddress: "RACK005",
        },
        {
          asin: "B0H9YBXF6W",
          sku: "TOPLOT-006",
          generateBarcode: "Yes",
          rackAddress: "RACK006",
        },
      ];

      sampleRows.forEach((item) => {
        const r = worksheet.addRow(item);
        r.height = 22;
        r.alignment = { vertical: "middle" };
      });

      const buffer = await workbook.xlsx.writeBuffer();
      saveAs(
        new Blob([buffer], {
          type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        }),
        "asin-import-demo-sheet.xlsx"
      );
      toast.success("ASIN Import demo sheet downloaded successfully!");
    } else {
      const worksheet = workbook.addWorksheet("Product Variants");

      worksheet.columns = [
        { header: "Variant SKU", key: "variantSku", width: 28 },
        { header: "ASIN", key: "asin", width: 22 },
        { header: "Myntra SKU", key: "myntraSku", width: 22 },
        { header: "FSN Code", key: "fsnCode", width: 22 },
        { header: "Rack Address", key: "rackAddress", width: 20 },
        { header: "Color", key: "color", width: 18 },
        { header: "Size", key: "size", width: 16 },
        { header: "Gender", key: "gender", width: 18 },
      ];

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

      const sampleRows = [
        {
          variantSku: "Cargo-5292-Blue-28",
          asin: "B08F9V7XYZ",
          myntraSku: "MYN-CARGO-BLU-28",
          fsnCode: "FSN-CRG-BLU-28",
          rackAddress: "a9",
          color: "Blue",
          size: "28",
          gender: "Men",
        },
        {
          variantSku: "Cargo-5292-Blue-30",
          asin: "B08F9V7XYL",
          myntraSku: "MYN-CARGO-BLU-30",
          fsnCode: "FSN-CRG-BLU-30",
          rackAddress: "a9",
          color: "Blue",
          size: "30",
          gender: "Men",
        },
        {
          variantSku: "Cargo-5292-Black-30",
          asin: "B09G1H2JKL",
          myntraSku: "MYN-CARGO-BLK-30",
          fsnCode: "FSN-CRG-BLK-30",
          rackAddress: "a6",
          color: "Black",
          size: "30",
          gender: "Men",
        },
        {
          variantSku: "Cargo-5292-Black-32",
          asin: "B07X1V9ABC",
          myntraSku: "MYN-CARGO-BLK-32",
          fsnCode: "FSN-CRG-BLK-32",
          rackAddress: "a7",
          color: "Black",
          size: "32",
          gender: "Men",
        },
      ];

      sampleRows.forEach((item) => {
        const r = worksheet.addRow(item);
        r.height = 22;
        r.alignment = { vertical: "middle" };
      });

      // Lock non-editable columns (Variant SKU, attributes), unlock editable columns (ASIN, Myntra SKU, FSN Code, Rack Address)
      const editableKeys = new Set(["asin", "myntraSku", "fsnCode", "rackAddress"]);

      worksheet.columns.forEach((col) => {
        const isEditable = Boolean(col.key && editableKeys.has(String(col.key)));
        col.protection = { locked: !isEditable };
      });

      for (let c = 1; c <= worksheet.columnCount; c++) {
        const col = worksheet.getColumn(c);
        const isEditable = Boolean(col.key && editableKeys.has(String(col.key)));

        for (let r = 1; r <= worksheet.rowCount; r++) {
          const cell = worksheet.getCell(r, c);

          if (r === 1) {
            cell.protection = { locked: true };
            continue;
          }

          cell.protection = { locked: !isEditable };

          if (isEditable) {
            cell.fill = {
              type: "pattern",
              pattern: "solid",
              fgColor: { argb: "FFFFFFFF" },
            };
          } else {
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

      await worksheet.protect("", {
        selectLockedCells: true,
        selectUnlockedCells: true,
        formatCells: false,
        formatColumns: false,
        formatRows: false,
        insertColumns: false,
        insertRows: false,
        insertHyperlinks: false,
        deleteColumns: false,
        deleteRows: false,
        sort: true,
        autoFilter: true,
      });

      const buffer = await workbook.xlsx.writeBuffer();
      saveAs(
        new Blob([buffer], {
          type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        }),
        "product-import-demo-sheet.xlsx"
      );
      toast.success("Product Import demo sheet downloaded successfully!");
    }
  } catch (err) {
    console.error(err);
    toast.error("Failed to generate demo sheet");
  }
};
