import ExcelJS from "exceljs";
import { saveAs } from "file-saver";
import { RequestedPOItem } from "../types/requestedPo.types";

interface ParsedPoResult {
  detectedPoNumber?: string;
  detectedPoDate?: string;
  items: RequestedPOItem[];
  totalQuantity: number;
  totalAmount: number;
}

export async function parsePoExcelFile(file: File): Promise<ParsedPoResult> {
  const arrayBuffer = await file.arrayBuffer();
  const workbook = new ExcelJS.Workbook();

  if (file.name.endsWith(".csv")) {
    // Read CSV via text
    const text = new TextDecoder("utf-8").decode(arrayBuffer);
    return parseCsvContent(text);
  }

  await workbook.xlsx.load(arrayBuffer);
  const worksheet = workbook.worksheets[0];
  if (!worksheet) {
    throw new Error("No sheet found in the selected Excel file.");
  }

  const items: RequestedPOItem[] = [];
  let headerRowIdx = -1;
  const colMap: Record<string, number> = {};

  // Scan first 15 rows to detect header
  for (let r = 1; r <= Math.min(15, worksheet.rowCount); r++) {
    const row = worksheet.getRow(r);
    const cellValues = row.values as any[];
    if (!Array.isArray(cellValues)) continue;

    const lower = cellValues.map((v) =>
      typeof v === "string" ? v.toLowerCase().trim() : String(v || "").toLowerCase().trim()
    );

    const hasSku = lower.some(
      (v) => v.includes("sku") || v.includes("item") || v.includes("product") || v.includes("code")
    );
    const hasQty = lower.some(
      (v) => v.includes("qty") || v.includes("quantity") || v.includes("units") || v.includes("count")
    );

    if (hasSku && hasQty) {
      headerRowIdx = r;
      cellValues.forEach((val, idx) => {
        if (!val) return;
        const s = String(val).toLowerCase().trim();
        if (s.includes("sku") || s.includes("item code") || s.includes("seller sku")) {
          colMap.sku = idx;
        } else if (s.includes("qty") || s.includes("quantity") || s.includes("units")) {
          colMap.qty = idx;
        } else if (s.includes("title") || s.includes("description") || s.includes("product name")) {
          colMap.title = idx;
        } else if (s.includes("price") || s.includes("rate") || s.includes("unit price")) {
          colMap.price = idx;
        } else if (s.includes("asin")) {
          colMap.asin = idx;
        } else if (s.includes("hsn")) {
          colMap.hsn = idx;
        } else if (s.includes("po") && (s.includes("no") || s.includes("num") || s.includes("id"))) {
          colMap.poNo = idx;
        }
      });
      break;
    }
  }

  if (headerRowIdx === -1 || !colMap.sku || !colMap.qty) {
    // Fallback: assume Row 1 headers (Col 1: SKU, Col 2: Title, Col 3: Qty, Col 4: Price)
    colMap.sku = 1;
    colMap.title = 2;
    colMap.qty = 3;
    colMap.price = 4;
    headerRowIdx = 1;
  }

  let lineCounter = 1;
  let totalQuantity = 0;
  let totalAmount = 0;
  let detectedPoNumber = "";

  for (let r = headerRowIdx + 1; r <= worksheet.rowCount; r++) {
    const row = worksheet.getRow(r);
    const skuVal = row.getCell(colMap.sku).text?.trim();
    if (!skuVal) continue;

    const qtyVal = Number(row.getCell(colMap.qty).value) || 1;
    const priceVal = Number(row.getCell(colMap.price || 999).value) || 0;
    const titleVal = colMap.title ? row.getCell(colMap.title).text?.trim() : `Item ${skuVal}`;
    const asinVal = colMap.asin ? row.getCell(colMap.asin).text?.trim() : undefined;
    const hsnVal = colMap.hsn ? row.getCell(colMap.hsn).text?.trim() : undefined;

    if (colMap.poNo && !detectedPoNumber) {
      detectedPoNumber = row.getCell(colMap.poNo).text?.trim() || "";
    }

    const rowTotal = Math.round(qtyVal * priceVal * 100) / 100;
    totalQuantity += qtyVal;
    totalAmount += rowTotal;

    items.push({
      id: `po_item_${r}_${Date.now()}`,
      lineNo: lineCounter++,
      sku: skuVal,
      productTitle: titleVal || `Product ${skuVal}`,
      asin: asinVal,
      quantity: qtyVal,
      unitPrice: priceVal,
      totalAmount: rowTotal,
      hsn: hsnVal,
    });
  }

  return {
    detectedPoNumber: detectedPoNumber || undefined,
    items,
    totalQuantity,
    totalAmount: Math.round(totalAmount * 100) / 100,
  };
}

function parseCsvContent(csvText: string): ParsedPoResult {
  const lines = csvText.split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (lines.length < 2) {
    throw new Error("CSV file does not contain enough data rows.");
  }

  const headers = lines[0].split(",").map((h) => h.replace(/^["']|["']$/g, "").trim().toLowerCase());
  const skuIdx = headers.findIndex((h) => h.includes("sku") || h.includes("item") || h.includes("code"));
  const qtyIdx = headers.findIndex((h) => h.includes("qty") || h.includes("quantity"));
  const titleIdx = headers.findIndex((h) => h.includes("title") || h.includes("desc") || h.includes("name"));
  const priceIdx = headers.findIndex((h) => h.includes("price") || h.includes("rate"));

  const items: RequestedPOItem[] = [];
  let totalQuantity = 0;
  let totalAmount = 0;

  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(",").map((c) => c.replace(/^["']|["']$/g, "").trim());
    const sku = cols[skuIdx >= 0 ? skuIdx : 0];
    if (!sku) continue;

    const qty = Number(cols[qtyIdx >= 0 ? qtyIdx : 1]) || 1;
    const price = Number(cols[priceIdx >= 0 ? priceIdx : 2]) || 0;
    const title = titleIdx >= 0 ? cols[titleIdx] : `Product ${sku}`;
    const rowTotal = Math.round(qty * price * 100) / 100;

    totalQuantity += qty;
    totalAmount += rowTotal;

    items.push({
      id: `po_csv_${i}_${Date.now()}`,
      lineNo: i,
      sku,
      productTitle: title,
      quantity: qty,
      unitPrice: price,
      totalAmount: rowTotal,
    });
  }

  return {
    items,
    totalQuantity,
    totalAmount: Math.round(totalAmount * 100) / 100,
  };
}

export async function generateSamplePoExcel(storeName?: string): Promise<void> {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("Requested PO");

  sheet.columns = [
    { header: "Line No", key: "lineNo", width: 10 },
    { header: "Product SKU", key: "sku", width: 22 },
    { header: "Product Title", key: "title", width: 36 },
    { header: "Quantity", key: "qty", width: 14 },
    { header: "Unit Price (INR)", key: "price", width: 18 },
    { header: "HSN Code", key: "hsn", width: 14 },
  ];

  // Header styling
  const headerRow = sheet.getRow(1);
  headerRow.font = { bold: true, color: { argb: "FFFFFFFF" } };
  headerRow.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FF0A0E1A" },
  };
  headerRow.alignment = { vertical: "middle", horizontal: "center" };

  // Sample data rows
  const sampleItems = [
    { lineNo: 1, sku: "CHK-KURTI-RED-M", title: "Embroidered Rayon Kurti - Red / M", qty: 25, price: 549, hsn: "6204" },
    { lineNo: 2, sku: "CHK-KURTI-BLUE-L", title: "Anarkali Printed Kurti - Blue / L", qty: 40, price: 699, hsn: "6204" },
    { lineNo: 3, sku: "CHK-SAREE-SILK-01", title: "Banarasi Silk Saree with Blouse", qty: 15, price: 1299, hsn: "5007" },
    { lineNo: 4, sku: "CHK-DUPATTA-GOLD", title: "Chiffon Dupatta with Zari Work", qty: 50, price: 299, hsn: "6214" },
  ];

  sampleItems.forEach((item) => sheet.addRow(item));

  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  saveAs(blob, `Sample_PO_Template_${(storeName || "Store").replace(/[\s/\\:]+/g, "_")}.xlsx`);
}
