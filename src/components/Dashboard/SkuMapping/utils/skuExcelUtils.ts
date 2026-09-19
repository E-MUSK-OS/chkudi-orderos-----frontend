import ExcelJS from "exceljs";
import { saveAs } from "file-saver";
import { toast } from "sonner";
import { skuMappingService } from "../services/skuMapping.service";
import { getToken } from "@/utils/auth";
import { SkuMapping } from "../types/skuMapping.types";

/**
 * Downloads the demo/sample Excel template for Godown Inventory Sheet.
 */
export async function downloadDemoSheet(): Promise<void> {
  try {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Godown Inventory Sheet");

    worksheet.columns = [
      { header: "Short SKU", key: "shortSku", width: 22 },
      { header: "Barcode SKU", key: "barcodeSku", width: 25 },
      { header: "Full SKU", key: "fullSku", width: 28 },
      { header: "OrderCook SKU", key: "ordercookSku", width: 20 },
      { header: "Brand Name", key: "brandName", width: 18 },
      { header: "Color", key: "color", width: 15 },
      { header: "Size", key: "size", width: 12 },
      { header: "Title", key: "title", width: 40 },
      { header: "QTY", key: "qty", width: 12 },
      { header: "MRP", key: "mrp", width: 15 },
      { header: "Asin (Barcode)", key: "asinBarcode", width: 20 },
    ];

    const headerRow = worksheet.getRow(1);
    headerRow.font = {
      name: "Calibri",
      size: 11,
      bold: true,
      color: { argb: "FF000000" },
    };
    headerRow.alignment = { vertical: "middle", horizontal: "center" };
    headerRow.height = 26;

    headerRow.eachCell((cell) => {
      cell.border = {
        top: { style: "thin", color: { argb: "FF000000" } },
        left: { style: "thin", color: { argb: "FF000000" } },
        bottom: { style: "medium", color: { argb: "FF000000" } },
        right: { style: "thin", color: { argb: "FF000000" } },
      };
    });

    const sampleRows = [
      {
        shortSku: "SH-BLU-L",
        barcodeSku: "SHIRT-BLU-LRG-002",
        fullSku: "SHIRT-RDSTR-BLU-L",
        ordercookSku: "OC-SH-BLU-L",
        brandName: "TOPLOT",
        color: "Blue",
        size: "L",
        title: "Men Casual Solid Slim Fit Cotton Shirt",
        qty: 25,
        mrp: 899,
        asinBarcode: "B08F9V7XYZ",
      },
      {
        shortSku: "SH-RED-M",
        barcodeSku: "SHIRT-RED-MED-001",
        fullSku: "SHIRT-RDSTR-RED-M",
        ordercookSku: "OC-SH-RED-M",
        brandName: "TOPLOT",
        color: "Red",
        size: "M",
        title: "Men Casual Solid Slim Fit Cotton Shirt",
        qty: 30,
        mrp: 899,
        asinBarcode: "B08F9V7B3R",
      },
      {
        shortSku: "1005-BLACK-32",
        barcodeSku: "RDSTTRSR128132087",
        fullSku: "MY-RS-1005-Black-32",
        ordercookSku: "ORDERO026",
        brandName: "Roadster",
        color: "Black",
        size: "32",
        title: "Men Slim Fit Stretchable Denim Jeans",
        qty: 40,
        mrp: 1299,
        asinBarcode: "B09G1H2JKL",
      },
      {
        shortSku: "1005-BLACK-30",
        barcodeSku: "RDSTTRSR128132086",
        fullSku: "MY-RS-1005-Black-30",
        ordercookSku: "ORDERO025",
        brandName: "Roadster",
        color: "Black",
        size: "30",
        title: "Men Slim Fit Stretchable Denim Jeans",
        qty: 15,
        mrp: 1299,
        asinBarcode: "B09G1H2MNP",
      },
      {
        shortSku: "1004-CREAM-30",
        barcodeSku: "RDSTTRSR128132072",
        fullSku: "MY-RS-1004-Cream-30",
        ordercookSku: "ORDERO002",
        brandName: "Roadster",
        color: "Cream",
        size: "30",
        title: "Men Regular Fit Casual Chino Trousers",
        qty: 20,
        mrp: 1149,
        asinBarcode: "",
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
      "godown-inventory-demo-sheet.xlsx",
    );
    toast.success("Demo Excel sheet downloaded successfully!");
  } catch (err) {
    console.error("Failed to generate demo sheet:", err);
    toast.error("Failed to generate demo sheet");
  }
}

/**
 * Fetches all inventory records from the server and generates a complete Excel sheet.
 */
export async function downloadAllRecordsSheet(search?: string): Promise<void> {
  const toastId = toast.loading("Fetching inventory records for export...");
  try {
    const params: Record<string, string | number | undefined> = {
      page: 1,
      limit: 100000,
    };
    if (search && search.trim() !== "") {
      params.search = search.trim();
    }

    const response = await skuMappingService.getAll(params, getToken());
    const records: SkuMapping[] = response?.data || [];

    if (records.length === 0) {
      toast.error("No records found to download.", { id: toastId });
      return;
    }

    toast.loading(`Generating Excel sheet with ${records.length} records...`, {
      id: toastId,
    });

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Godown Inventory Sheet");

    worksheet.columns = [
      { header: "Short SKU", key: "shortSku", width: 22 },
      { header: "Barcode SKU", key: "barcodeSku", width: 25 },
      { header: "Full SKU", key: "fullSku", width: 28 },
      { header: "OrderCook SKU", key: "ordercookSku", width: 22 },
      { header: "Created Date", key: "createdAt", width: 20 },
    ];

    const headerRow = worksheet.getRow(1);
    headerRow.font = {
      name: "Calibri",
      size: 11,
      bold: true,
      color: { argb: "FF000000" },
    };
    headerRow.alignment = { vertical: "middle", horizontal: "center" };
    headerRow.height = 26;

    headerRow.eachCell((cell) => {
      cell.border = {
        top: { style: "thin", color: { argb: "FF000000" } },
        left: { style: "thin", color: { argb: "FF000000" } },
        bottom: { style: "medium", color: { argb: "FF000000" } },
        right: { style: "thin", color: { argb: "FF000000" } },
      };
    });

    records.forEach((item) => {
      const formattedDate = item.createdAt
        ? new Date(item.createdAt).toLocaleDateString("en-IN", {
            day: "2-digit",
            month: "short",
            year: "numeric",
          })
        : "-";

      const r = worksheet.addRow({
        shortSku: item.shortSku || "-",
        barcodeSku: item.barcodeSku || "-",
        fullSku: item.fullSku || "-",
        ordercookSku: item.ordercookSku || "-",
        createdAt: formattedDate,
      });
      r.height = 22;
      r.alignment = { vertical: "middle" };
    });

    const buffer = await workbook.xlsx.writeBuffer();
    const dateStr = new Date().toISOString().split("T")[0];
    saveAs(
      new Blob([buffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      }),
      `godown-inventory-sheet-${dateStr}.xlsx`,
    );

    toast.success(
      `Downloaded ${records.length} inventory records successfully!`,
      { id: toastId },
    );
  } catch (err) {
    console.error("Failed to export inventory sheet:", err);
    toast.error("Failed to download inventory sheet.", { id: toastId });
  }
}
