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
        { header: "Asin", key: "asin", width: 22 },
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
          variantSku: "SH-BLU-001-Blue-M",
          asin: "B08F9V7XYZ",
          rackAddress: "RACK001",
          color: "Blue",
          size: "M",
          gender: "Men",
        },
        {
          variantSku: "SH-BLU-001-Blue-L",
          asin: "B08F9V7XYL",
          rackAddress: "RACK001",
          color: "Blue",
          size: "L",
          gender: "Men",
        },
        {
          variantSku: "JN-BLK-001-Black-32",
          asin: "B09G1H2JKL",
          rackAddress: "RACK002",
          color: "Black",
          size: "32",
          gender: "Men",
        },
        {
          variantSku: "KT-RED-001-Red-S",
          asin: "B07X1V9ABC",
          rackAddress: "RACK003",
          color: "Red",
          size: "S",
          gender: "Women",
        },
      ];

      sampleRows.forEach((item) => {
        const r = worksheet.addRow(item);
        r.height = 22;
        r.alignment = { vertical: "middle" };
      });

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
