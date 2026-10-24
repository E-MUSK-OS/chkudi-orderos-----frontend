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
      const worksheet = workbook.addWorksheet("Product Import");

      worksheet.columns = [
        { header: "Product Name", key: "productName", width: 30 },
        { header: "Master SKU", key: "masterSku", width: 22 },
        { header: "Brand", key: "brand", width: 18 },
        { header: "Category", key: "category", width: 18 },
        { header: "Sub Category", key: "subCategory", width: 18 },
        { header: "Description", key: "description", width: 35 },
        { header: "ASIN", key: "asin", width: 20 },
        { header: "Rack Address", key: "rackAddress", width: 18 },
        { header: "Generate Barcode", key: "generateBarcode", width: 20 },
        { header: "MRP", key: "mrp", width: 15 },
        { header: "HSN Code", key: "hsnCode", width: 16 },
        { header: "GST %", key: "gstRate", width: 14 },
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
          productName: "Men Casual Solid Cotton Shirt",
          masterSku: "SH-BLU-001",
          brand: "TOPLOT",
          category: "Clothing",
          subCategory: "Shirts",
          description: "100% Premium Cotton Slim Fit Shirt",
          asin: "B08F9V7XYZ",
          rackAddress: "RACK001",
          generateBarcode: "Yes",
          mrp: 899,
          hsnCode: "6205",
          gstRate: "5%",
        },
        {
          productName: "Men Slim Fit Stretchable Jeans",
          masterSku: "JN-BLK-001",
          brand: "Roadster",
          category: "Clothing",
          subCategory: "Jeans",
          description: "Comfortable stretch denim jeans",
          asin: "B09G1H2JKL",
          rackAddress: "RACK002",
          generateBarcode: "No",
          mrp: 1299,
          hsnCode: "6203",
          gstRate: "12%",
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
        "product-import-demo-sheet.xlsx"
      );
      toast.success("Product Import demo sheet downloaded successfully!");
    }
  } catch (err) {
    console.error(err);
    toast.error("Failed to generate demo sheet");
  }
};
