import ExcelJS from "exceljs";
import { saveAs } from "file-saver";
import { RequestedPOItem } from "../types/requestedPo.types";

interface ParsedPoResult {
  detectedPoNumber?: string;
  detectedPoDate?: string;
  items: RequestedPOItem[];
  totalQuantity: number;
  totalAmount: number;
  columns?: string[];
}

/**
 * Checks whether a column header should be excluded from display.
 * Excluded columns requested by user: External Id Type, Title, INR, Window Type
 */
export function isExcludedHeader(header: string): boolean {
  if (!header || !header.trim()) return true;
  const norm = header.toLowerCase().replace(/[^a-z0-9]/g, "");
  if (!norm) return true;
  return [
    "externalidtype",
    "title",
    "producttitle",
    "windowtype",
    "inr",
    "currency",
  ].includes(norm);
}

export function getCellStringValue(cell: ExcelJS.Cell | undefined | null): string {
  if (!cell) return "";
  const val = cell.value;
  if (val instanceof Date) {
    const d = String(val.getDate()).padStart(2, "0");
    const m = String(val.getMonth() + 1).padStart(2, "0");
    const y = val.getFullYear();
    return `${d}/${m}/${y}`;
  }
  if (cell.text !== undefined && cell.text !== null && cell.text !== "") {
    return String(cell.text).trim();
  }
  if (val === undefined || val === null) return "";
  if (typeof val === "object") {
    const obj = val as unknown as Record<string, unknown>;
    if (obj.text) return String(obj.text).trim();
    if (obj.result !== undefined && obj.result !== null) {
      return String(obj.result).trim();
    }
    if (Array.isArray(obj.richText)) {
      return (obj.richText as Array<{ text?: string }>).map((t) => t.text || "").join("").trim();
    }
    return "";
  }
  return String(val).trim();
}

function parseNumberSafe(val: unknown): number {
  if (val == null) return 0;
  if (typeof val === "number") return isNaN(val) ? 0 : val;
  const str = String(val).replace(/[^0-9.-]/g, "").trim();
  const num = parseFloat(str);
  return isNaN(num) ? 0 : num;
}

export async function parsePoExcelFile(file: File): Promise<ParsedPoResult> {
  const arrayBuffer = await file.arrayBuffer();
  const workbook = new ExcelJS.Workbook();

  if (file.name.endsWith(".csv")) {
    const text = new TextDecoder("utf-8").decode(arrayBuffer);
    return parseCsvContent(text);
  }

  await workbook.xlsx.load(arrayBuffer);
  const worksheet = workbook.worksheets[0];
  if (!worksheet) {
    throw new Error("No sheet found in the selected Excel file.");
  }

  let headerRowIdx = -1;
  const allHeaders: { colIdx: number; header: string; norm: string }[] = [];

  // Scan first 15 rows to detect header row
  for (let r = 1; r <= Math.min(15, worksheet.rowCount); r++) {
    const row = worksheet.getRow(r);
    let hasSkuOrId = false;
    let hasQtyOrCost = false;

    row.eachCell({ includeEmpty: false }, (cell) => {
      const s = getCellStringValue(cell).toLowerCase();
      if (
        s.includes("sku") ||
        s.includes("item") ||
        s.includes("asin") ||
        s.includes("external id") ||
        s.includes("model number")
      ) {
        hasSkuOrId = true;
      }
      if (
        s.includes("qty") ||
        s.includes("quantity") ||
        s.includes("units") ||
        s.includes("cost") ||
        s.includes("price") ||
        s.includes("total")
      ) {
        hasQtyOrCost = true;
      }
    });

    if (hasSkuOrId && hasQtyOrCost) {
      headerRowIdx = r;
      row.eachCell({ includeEmpty: false }, (cell, colNumber) => {
        const headerText = getCellStringValue(cell);
        if (headerText) {
          allHeaders.push({
            colIdx: colNumber,
            header: headerText,
            norm: headerText.toLowerCase().replace(/[^a-z0-9]/g, ""),
          });
        }
      });
      break;
    }
  }

  // Fallback to row 1 if header wasn't flagged
  if (headerRowIdx === -1 || allHeaders.length === 0) {
    headerRowIdx = 1;
    const row = worksheet.getRow(1);
    row.eachCell({ includeEmpty: false }, (cell, colNumber) => {
      const headerText = getCellStringValue(cell);
      if (headerText) {
        allHeaders.push({
          colIdx: colNumber,
          header: headerText,
          norm: headerText.toLowerCase().replace(/[^a-z0-9]/g, ""),
        });
      }
    });
  }

  // Filter out excluded columns: External Id Type, Title, INR, Window Type
  const visibleHeaders = allHeaders.filter((h) => !isExcludedHeader(h.header));
  const visibleColumnNames = visibleHeaders.map((h) => h.header);

  // Column helpers
  const externalIdCol = allHeaders.find((h) => h.norm === "externalid");
  const skuCol = allHeaders.find((h) => h.norm.includes("sku") && h.norm !== "externalidtype");
  const asinCol = allHeaders.find((h) => h.norm.includes("asin"));
  const hsnCol = allHeaders.find((h) => h.norm.includes("hsn"));
  const poNoCol = allHeaders.find(
    (h) => h.norm.includes("po") && (h.norm.includes("no") || h.norm.includes("num") || h.norm.includes("id"))
  );

  // Quantity column priority (Accepted quantity > Quantity requested > Quantity received > ASN quantity > generic qty)
  const acceptedQtyCol = allHeaders.find((h) => h.norm.includes("acceptedquant") || h.norm.includes("acceptedqty"));
  const requestedQtyCol = allHeaders.find((h) => h.norm.includes("quantityrequested") || h.norm.includes("qtyrequested") || h.norm.includes("requestedquant"));
  const receivedQtyCol = allHeaders.find((h) => h.norm.includes("quantityreceived") || h.norm.includes("qtyreceived") || h.norm.includes("receivedquant"));
  const asnQtyCol = allHeaders.find((h) => h.norm.includes("asnquant") || h.norm.includes("asnqty"));
  const genericQtyCol = allHeaders.find((h) => h.norm.includes("qty") || h.norm.includes("quantity") || h.norm.includes("units"));

  // Cost / Price columns
  const unitCostCol = allHeaders.find((h) => h.norm.includes("unitcost") || h.norm.includes("unitprice") || h.norm === "rate" || h.norm === "price");
  const totalCostCol = allHeaders.find((h) => h.norm.includes("totalcost") || h.norm.includes("totalamount") || h.norm === "amount");

  const items: RequestedPOItem[] = [];
  let lineCounter = 1;
  let totalQuantity = 0;
  let totalAmount = 0;
  let detectedPoNumber = "";

  for (let r = headerRowIdx + 1; r <= worksheet.rowCount; r++) {
    const row = worksheet.getRow(r);

    const rawData: Record<string, unknown> = {};
    let hasAnyData = false;

    visibleHeaders.forEach((col) => {
      const cell = row.getCell(col.colIdx);
      const cellText = getCellStringValue(cell);
      if (cellText && cellText !== "-" && cellText !== "") {
        hasAnyData = true;
      }
      rawData[col.header] = cellText || "-";
    });

    if (!hasAnyData) continue;

    // Determine primary SKU
    const externalIdVal = externalIdCol ? getCellStringValue(row.getCell(externalIdCol.colIdx)) : "";
    const skuVal = skuCol ? getCellStringValue(row.getCell(skuCol.colIdx)) : "";
    const asinVal = asinCol ? getCellStringValue(row.getCell(asinCol.colIdx)) : "";
    const primarySku = externalIdVal || skuVal || asinVal || `SKU-${lineCounter}`;

    if (!primarySku && !asinVal) continue;

    // Detect PO number from row if available
    if (poNoCol && !detectedPoNumber) {
      detectedPoNumber = getCellStringValue(row.getCell(poNoCol.colIdx));
    }

    // Determine Quantity (priority: Accepted quantity > Quantity requested > Quantity received > ASN quantity > generic)
    let qtyVal = 0;
    if (acceptedQtyCol) {
      qtyVal = parseNumberSafe(row.getCell(acceptedQtyCol.colIdx).value ?? row.getCell(acceptedQtyCol.colIdx).text);
    }
    if (!qtyVal && requestedQtyCol) {
      qtyVal = parseNumberSafe(row.getCell(requestedQtyCol.colIdx).value ?? row.getCell(requestedQtyCol.colIdx).text);
    }
    if (!qtyVal && receivedQtyCol) {
      qtyVal = parseNumberSafe(row.getCell(receivedQtyCol.colIdx).value ?? row.getCell(receivedQtyCol.colIdx).text);
    }
    if (!qtyVal && asnQtyCol) {
      qtyVal = parseNumberSafe(row.getCell(asnQtyCol.colIdx).value ?? row.getCell(asnQtyCol.colIdx).text);
    }
    if (!qtyVal && genericQtyCol) {
      qtyVal = parseNumberSafe(row.getCell(genericQtyCol.colIdx).value ?? row.getCell(genericQtyCol.colIdx).text);
    }
    if (!qtyVal) qtyVal = 1;

    // Determine Unit Price
    const priceVal = unitCostCol
      ? parseNumberSafe(row.getCell(unitCostCol.colIdx).value ?? row.getCell(unitCostCol.colIdx).text)
      : 0;

    // Determine Total Cost
    let rowTotal = totalCostCol
      ? parseNumberSafe(row.getCell(totalCostCol.colIdx).value ?? row.getCell(totalCostCol.colIdx).text)
      : 0;
    if (!rowTotal && priceVal > 0) {
      rowTotal = Math.round(qtyVal * priceVal * 100) / 100;
    }

    const hsnVal = hsnCol ? getCellStringValue(row.getCell(hsnCol.colIdx)) : undefined;

    totalQuantity += qtyVal;
    totalAmount += rowTotal;

    items.push({
      id: `po_item_${r}_${Date.now()}`,
      lineNo: lineCounter++,
      sku: primarySku,
      asin: asinVal || undefined,
      quantity: qtyVal,
      initialQuantity: qtyVal,
      scannedQuantity: 0,
      unitPrice: priceVal,
      totalAmount: Math.round(rowTotal * 100) / 100,
      hsn: hsnVal || undefined,
      rawData,
    });
  }

  return {
    detectedPoNumber: detectedPoNumber || undefined,
    items,
    totalQuantity,
    totalAmount: Math.round(totalAmount * 100) / 100,
    columns: visibleColumnNames,
  };
}

function parseCsvContent(csvText: string): ParsedPoResult {
  const lines = csvText.split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (lines.length < 2) {
    throw new Error("CSV file does not contain enough data rows.");
  }

  const rawHeaders = lines[0].split(",").map((h) => h.replace(/^["']|["']$/g, "").trim());
  const headerObjs = rawHeaders.map((h, idx) => ({
    colIdx: idx,
    header: h,
    norm: h.toLowerCase().replace(/[^a-z0-9]/g, ""),
  }));

  const visibleHeaders = headerObjs.filter((h) => !isExcludedHeader(h.header));
  const visibleColumnNames = visibleHeaders.map((h) => h.header);

  const skuCol = headerObjs.find((h) => h.norm === "externalid") || headerObjs.find((h) => h.norm.includes("sku"));
  const asinCol = headerObjs.find((h) => h.norm.includes("asin"));
  const qtyCol =
    headerObjs.find((h) => h.norm.includes("asnquant")) ||
    headerObjs.find((h) => h.norm.includes("quantityreceived")) ||
    headerObjs.find((h) => h.norm.includes("quantityrequested")) ||
    headerObjs.find((h) => h.norm.includes("qty"));
  const priceCol = headerObjs.find((h) => h.norm.includes("unitcost") || h.norm.includes("price"));
  const totalCol = headerObjs.find((h) => h.norm.includes("totalcost") || h.norm.includes("total"));
  const hsnCol = headerObjs.find((h) => h.norm.includes("hsn"));

  const items: RequestedPOItem[] = [];
  let totalQuantity = 0;
  let totalAmount = 0;

  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(",").map((c) => c.replace(/^["']|["']$/g, "").trim());
    if (cols.length === 0 || cols.every((c) => !c)) continue;

    const rawData: Record<string, unknown> = {};
    visibleHeaders.forEach((vh) => {
      rawData[vh.header] = cols[vh.colIdx] || "-";
    });

    const sku = (skuCol ? cols[skuCol.colIdx] : cols[0]) || `SKU-${i}`;
    const asin = asinCol ? cols[asinCol.colIdx] : undefined;
    const qty = (qtyCol ? parseNumberSafe(cols[qtyCol.colIdx]) : 1) || 1;
    const price = priceCol ? parseNumberSafe(cols[priceCol.colIdx]) : 0;
    const rowTotal = totalCol ? parseNumberSafe(cols[totalCol.colIdx]) : Math.round(qty * price * 100) / 100;

    totalQuantity += qty;
    totalAmount += rowTotal;

    items.push({
      id: `po_csv_${i}_${Date.now()}`,
      lineNo: i,
      sku,
      asin,
      quantity: qty,
      initialQuantity: qty,
      scannedQuantity: 0,
      unitPrice: price,
      totalAmount: rowTotal,
      hsn: hsnCol ? cols[hsnCol.colIdx] : undefined,
      rawData,
    });
  }

  return {
    items,
    totalQuantity,
    totalAmount: Math.round(totalAmount * 100) / 100,
    columns: visibleColumnNames,
  };
}

export async function generateSamplePoExcel(storeName?: string): Promise<void> {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("Requested PO");

  sheet.columns = [
    { header: "Line No", key: "lineNo", width: 10 },
    { header: "Product SKU", key: "sku", width: 22 },
    { header: "ASIN", key: "asin", width: 18 },
    { header: "Quantity Requested", key: "qty", width: 20 },
    { header: "Scanned Quantity", key: "scannedQty", width: 18 },
    { header: "Unit Price", key: "price", width: 18 },
    { header: "HSN Code", key: "hsn", width: 14 },
  ];

  const headerRow = sheet.getRow(1);
  headerRow.font = { bold: true, color: { argb: "FFFFFFFF" } };
  headerRow.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FF0A0E1A" },
  };
  headerRow.alignment = { vertical: "middle", horizontal: "center" };

  const sampleItems = [
    { lineNo: 1, sku: "CHK-KURTI-RED-M", asin: "B0FTG237SS", qty: 25, scannedQty: 0, price: 549, hsn: "6204" },
    { lineNo: 2, sku: "CHK-KURTI-BLUE-L", asin: "B0FTFZBYK1", qty: 40, scannedQty: 0, price: 699, hsn: "6204" },
    { lineNo: 3, sku: "CHK-SAREE-SILK-01", asin: "B0FJ2MLW2T", qty: 15, scannedQty: 0, price: 1299, hsn: "5007" },
    { lineNo: 4, sku: "CHK-DUPATTA-GOLD", asin: "B0FJ2M7Y6V", qty: 50, scannedQty: 0, price: 299, hsn: "6214" },
  ];

  sampleItems.forEach((item) => sheet.addRow(item));

  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  saveAs(blob, `Sample_PO_Template_${(storeName || "Store").replace(/[\s/\\:]+/g, "_")}.xlsx`);
}
