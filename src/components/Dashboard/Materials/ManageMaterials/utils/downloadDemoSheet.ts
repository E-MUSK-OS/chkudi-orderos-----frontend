import ExcelJS from "exceljs";
import { saveAs } from "file-saver";
import { toast } from "sonner";
import { ImportType } from "../components/MaterialToolbar";

export const MATERIAL_EXCEL_COLUMNS = [
  // General Details
  { header: "SKU *", key: "sku", width: 22 },
  { header: "Master SKU *", key: "masterSku", width: 22 },
  { header: "Name *", key: "materialName", width: 30 },
  { header: "Category *", key: "category", width: 20 },
  { header: "Manufacturing Group *", key: "manufacturingGroup", width: 25 },
  { header: "Unit *", key: "unit", width: 16 },
  { header: "Colors", key: "colors", width: 24 },
  { header: "Width", key: "width", width: 14 },
  { header: "Width Range From", key: "widthRangeFrom", width: 18 },
  { header: "Width Range To", key: "widthRangeTo", width: 18 },
  { header: "GSM", key: "gsm", width: 14 },
  { header: "GSM Range From", key: "gsmRangeFrom", width: 18 },
  { header: "GSM Range To", key: "gsmRangeTo", width: 18 },
  { header: "Less (%)", key: "less", width: 14 },
  { header: "GST (%)", key: "gstRate", width: 14 },
  { header: "HSN Code *", key: "hsnCode", width: 18 },
  { header: "Brand Name *", key: "brand", width: 20 },
  { header: "Description", key: "description", width: 35 },

  // Kardex Details
  { header: "Cost Applying Mode *", key: "costApplyingMode", width: 24 },
  { header: "Material Cost", key: "materialCost", width: 16 },
  { header: "MRP", key: "mrp", width: 14 },
  { header: "Sales Rate", key: "salesRate", width: 14 },
  { header: "Re-Order Level Stock", key: "reorderLevelStock", width: 22 },
  { header: "Purchase Type", key: "purchaseType", width: 18 },
  { header: "Details Compulsory", key: "isStockDetailsCompulsory", width: 20 },
  { header: "Issue Mode *", key: "issueMode", width: 18 },
  { header: "Consumption Mode *", key: "consumptionMode", width: 22 },
  { header: "Is Issuable", key: "isIssuable", width: 15 },
  { header: "Is Sellable", key: "isSellable", width: 15 },
];

export const downloadDemoSheet = async (type: ImportType = "material") => {
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
      headerRow.font = { name: "Calibri", size: 11, bold: true, color: { argb: "FFFFFFFF" } };
      headerRow.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF0A0E1A" } };
      headerRow.alignment = { vertical: "middle", horizontal: "center" };
      headerRow.height = 28;

      const sampleRows = [
        {
          rackAddress: "A-01-01",
          myntraSku: "MYN-MAT-FAB-M",
          sellerSku: "FAB-BLK-M",
          generateBarcode: "FAB-BLK-M",
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
      headerRow.font = { name: "Calibri", size: 11, bold: true, color: { argb: "FFFFFFFF" } };
      headerRow.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF0A0E1A" } };
      headerRow.alignment = { vertical: "middle", horizontal: "center" };
      headerRow.height = 28;

      const sampleRows = [
        {
          asin: "B0DK9HFD2S",
          sku: "MAT-002",
          generateBarcode: "Yes",
          rackAddress: "RACK002",
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
      // Material Import Demo Sheet
      const worksheet = workbook.addWorksheet("Materials");

      worksheet.columns = MATERIAL_EXCEL_COLUMNS;

      const headerRow = worksheet.getRow(1);
      headerRow.font = {
        name: "Calibri",
        size: 11,
        bold: true,
        color: { argb: "FFE8C16D" }, // Gold accent font
      };
      headerRow.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FF0A0E1A" }, // OrderOS dark background
      };
      headerRow.alignment = { vertical: "middle", horizontal: "center" };
      headerRow.height = 30;

      const sampleRows = [
        {
          sku: "MAT-FAB-COT-01",
          masterSku: "FAB-COT-01",
          materialName: "100% Cotton Poplin",
          category: "Fabric",
          manufacturingGroup: "Weaving",
          unit: "Meters",
          colors: "Blue, White, Black",
          width: 44,
          widthRangeFrom: 40,
          widthRangeTo: 48,
          gsm: 180,
          gsmRangeFrom: 160,
          gsmRangeTo: 200,
          less: 0,
          gstRate: 5,
          hsnCode: "5208",
          brand: "No Brand",
          description: "Premium pure cotton fabric for shirt manufacturing",
          costApplyingMode: "FIFO",
          materialCost: 120,
          mrp: "220",
          salesRate: 160,
          reorderLevelStock: 100,
          purchaseType: "Local",
          isStockDetailsCompulsory: "Yes",
          issueMode: "FIFO",
          consumptionMode: "Standard",
          isIssuable: "Yes",
          isSellable: "Yes",
        },
        {
          sku: "MAT-TRM-BTN-01",
          masterSku: "TRM-BTN-01",
          materialName: "Poly Button 18L 4-Hole",
          category: "Button",
          manufacturingGroup: "Finishing",
          unit: "Pcs",
          colors: "White, Transparent",
          width: 0,
          widthRangeFrom: 0,
          widthRangeTo: 0,
          gsm: 0,
          gsmRangeFrom: 0,
          gsmRangeTo: 0,
          less: 0,
          gstRate: 12,
          hsnCode: "9606",
          brand: "No Brand",
          description: "Standard polyester buttons for shirts and kurtas",
          costApplyingMode: "Average Cost",
          materialCost: 0.5,
          mrp: "1.5",
          salesRate: 1.0,
          reorderLevelStock: 500,
          purchaseType: "Local",
          isStockDetailsCompulsory: "No",
          issueMode: "FIFO",
          consumptionMode: "Standard",
          isIssuable: "Yes",
          isSellable: "No",
        },
      ];

      sampleRows.forEach((item) => {
        const r = worksheet.addRow(item);
        r.height = 24;
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
        "material-import-demo-sheet.xlsx"
      );
      toast.success("Material Import demo sheet downloaded successfully!");
    }
  } catch (err) {
    console.error(err);
    toast.error("Failed to generate demo sheet");
  }
};
