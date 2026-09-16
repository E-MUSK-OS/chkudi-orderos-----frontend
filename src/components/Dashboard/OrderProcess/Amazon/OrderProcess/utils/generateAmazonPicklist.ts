import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import ExcelJS from "exceljs";
import { saveAs } from "file-saver";
import { AmazonComparisonResult } from "../types";

export interface PicklistItem {
  sku: string;
  asin?: string;
  rackAddress: string;
  generateBarcode: string;
  quantity: number;
  orderType?: "single_quantity" | "multiple_asin" | "multiple_pieces";
  orderTypeLabel?: string;
}

export interface PicklistResult {
  items: PicklistItem[];
  totalQuantity: number;
}

export const generateAmazonPicklist = (
  results: AmazonComparisonResult[],
  selectedRows: Set<number>,
  skuDetailsMap?: Map<string, { rackAddress?: string; generateBarcode?: string }>
): PicklistResult => {
  const selectedOrders = results.filter((r) => selectedRows.has(r.index));

  const resolveOrderType = (item: AmazonComparisonResult): "single_quantity" | "multiple_asin" | "multiple_pieces" => {
    if (item.orderType) return item.orderType;

    let totalQty = item.totalQuantity || 0;
    let asinsCount = item.asinsCount || 0;
    let skusCount = 1;

    if (item.asin && item.asin !== "N/A") {
      const rawAsins = item.asin.split(/[\r\n]+|\s+\/\s+/).map((s) => s.trim()).filter(Boolean);
      asinsCount = new Set(rawAsins).size;
      if (!totalQty) totalQty = rawAsins.length;
    }

    if (item.sellerSku && item.sellerSku !== "N/A") {
      const rawSkus = item.sellerSku.split(/[\r\n]+|\s+\/\s+/).map((s) => s.trim()).filter(Boolean);
      skusCount = new Set(rawSkus).size;
      if (rawSkus.length > totalQty) totalQty = rawSkus.length;
    }

    if (asinsCount > 1) return "multiple_asin";
    if (skusCount > 1 || totalQty > 1) return "multiple_pieces";
    return "single_quantity";
  };

  const normalizeRackAddress = (rack?: string | null): string => {
    if (!rack) return "";
    const trimmed = rack.trim().toUpperCase();
    if (trimmed === "--" || trimmed === "-" || trimmed === "N/A" || trimmed === "NA") {
      return "";
    }
    return trimmed;
  };

  /**
   * Splits a rack address into normalized comparison tokens:
   * Letters/words as uppercase strings, digits as numbers.
   * Non-alphanumeric separators (hyphens, spaces, slashes, etc.) are discarded
   * so that "A-4" and "A4" and "A 4" compare equivalently against "A5".
   */
  const parseRackTokens = (rack?: string | null): (string | number)[] => {
    if (!rack) return [];
    const trimmed = rack.trim().toUpperCase();
    if (!trimmed || trimmed === "--" || trimmed === "-" || trimmed === "N/A" || trimmed === "NA") {
      return [];
    }

    const matches = trimmed.match(/[A-Z]+|\d+/g);
    if (!matches) return [trimmed];

    return matches.map((token) => {
      if (/^\d+$/.test(token)) {
        return parseInt(token, 10);
      }
      return token;
    });
  };

  const compareRackAddresses = (rackA?: string | null, rackB?: string | null): number => {
    const tokensA = parseRackTokens(rackA);
    const tokensB = parseRackTokens(rackB);

    const hasA = tokensA.length > 0;
    const hasB = tokensB.length > 0;

    // Items with valid rack address always come before unassigned ("--")
    if (hasA && !hasB) return -1;
    if (!hasA && hasB) return 1;
    if (!hasA && !hasB) return 0;

    const minLen = Math.min(tokensA.length, tokensB.length);
    for (let i = 0; i < minLen; i++) {
      const tA = tokensA[i];
      const tB = tokensB[i];

      if (typeof tA === "number" && typeof tB === "number") {
        if (tA !== tB) {
          return tA - tB;
        }
      } else if (typeof tA === "number" && typeof tB === "string") {
        return -1;
      } else if (typeof tA === "string" && typeof tB === "number") {
        return 1;
      } else {
        const strA = tA as string;
        const strB = tB as string;
        const cmp = strA.localeCompare(strB, undefined, { sensitivity: "base" });
        if (cmp !== 0) {
          return cmp;
        }
      }
    }

    if (tokensA.length !== tokensB.length) {
      return tokensA.length - tokensB.length;
    }

    return 0;
  };

  const ORDER_GROUPS: {
    type: "single_quantity" | "multiple_asin" | "multiple_pieces";
    label: string;
  }[] = [
    { type: "single_quantity", label: "Single Quantity" },
    { type: "multiple_asin", label: "Multiple Quantity" },
    { type: "multiple_pieces", label: "Multiple Pieces" },
  ];

  let totalQuantity = 0;
  const allItems: PicklistItem[] = [];

  ORDER_GROUPS.forEach((grp) => {
    const groupOrders = selectedOrders.filter((o) => resolveOrderType(o) === grp.type);
    if (groupOrders.length === 0) return;

    const skuMap = new Map<string, number>();
    const skuToAsinMap = new Map<string, string>();

    groupOrders.forEach((item) => {
      const rawSkuStr =
        item.sellerSku && item.sellerSku !== "N/A"
          ? item.sellerSku
          : item.asin && item.asin !== "N/A"
          ? item.asin
          : "UNKNOWN-SKU";

      const skus = rawSkuStr
        .split(/[\n\r]+|\s+\/\s+/)
        .map((s) => s.trim())
        .filter(Boolean);

      const rawAsin = item.asin && item.asin !== "N/A" ? item.asin.trim() : "";
      if (rawAsin) {
        const asins = rawAsin.split(/[\n\r]+|\s+\/\s+/).map((a) => a.trim()).filter(Boolean);
        skus.forEach((sku, idx) => {
          const assignedAsin = asins[idx] || asins[0] || rawAsin;
          if (!skuToAsinMap.has(sku)) {
            skuToAsinMap.set(sku, assignedAsin);
          }
          if (!skuToAsinMap.has(sku.toUpperCase())) {
            skuToAsinMap.set(sku.toUpperCase(), assignedAsin);
          }
        });
      }

      if (skus.length === 0) {
        const currentQty = skuMap.get("UNKNOWN-SKU") ?? 0;
        skuMap.set("UNKNOWN-SKU", currentQty + 1);
        totalQuantity += 1;
      } else if (skus.length === 1) {
        const qtyToAdd = item.totalQuantity && item.totalQuantity > 1 ? item.totalQuantity : 1;
        const currentQty = skuMap.get(skus[0]) ?? 0;
        skuMap.set(skus[0], currentQty + qtyToAdd);
        totalQuantity += qtyToAdd;
      } else {
        skus.forEach((sku) => {
          const currentQty = skuMap.get(sku) ?? 0;
          skuMap.set(sku, currentQty + 1);
          totalQuantity += 1;
        });
      }
    });

    const groupItems: PicklistItem[] = Array.from(skuMap.entries()).map(([sku, quantity]) => {
      const trimmedSku = sku.trim();
      const normSku = trimmedSku.toUpperCase();
      const itemAsin = (
        skuToAsinMap.get(trimmedSku) ||
        skuToAsinMap.get(normSku) ||
        skuToAsinMap.get(sku) ||
        ""
      ).trim();
      const normAsin = itemAsin.toUpperCase();

      const skuDetails =
        skuDetailsMap?.get(normSku) ||
        skuDetailsMap?.get(trimmedSku) ||
        skuDetailsMap?.get(sku);

      const asinDetails =
        (normAsin ? skuDetailsMap?.get(normAsin) : undefined) ||
        (itemAsin ? skuDetailsMap?.get(itemAsin) : undefined);

      let rack = skuDetails?.rackAddress?.trim() || asinDetails?.rackAddress?.trim() || "";
      if (rack === "-" || rack === "N/A" || rack === "NA") {
        rack = "";
      }

      if (!rack && skuDetailsMap && skuDetailsMap.size > 0) {
        for (const [key, val] of skuDetailsMap.entries()) {
          const kNorm = key.trim().toUpperCase();
          if (
            (kNorm === normSku || (normAsin && kNorm === normAsin)) &&
            val.rackAddress &&
            val.rackAddress.trim() &&
            val.rackAddress.trim() !== "-" &&
            val.rackAddress.trim() !== "N/A"
          ) {
            rack = val.rackAddress.trim();
            break;
          }
        }
      }

      const rackAddress = rack || "--";

      const rawBarcode = (
        skuDetails?.generateBarcode?.trim() ||
        asinDetails?.generateBarcode?.trim() ||
        ""
      ).toUpperCase();

      const isBarcodeYes =
        rawBarcode === "YES" ||
        rawBarcode === "Y" ||
        rawBarcode === "TRUE" ||
        rawBarcode === "1";
      const generateBarcode = isBarcodeYes ? "Yes" : "No";

      return {
        sku: trimmedSku,
        asin: itemAsin || normAsin || "--",
        rackAddress,
        generateBarcode,
        quantity,
        orderType: grp.type,
        orderTypeLabel: grp.label,
      };
    });

    // Sorting within category:
    // 1. Natural rack address sort ("A-4" < "A5" < "A-12" < "A14" < "A16" < "A-24" < "A35" < "B-5"...)
    // 2. Seller SKU natural sort
    groupItems.sort((a, b) => {
      const rackComparison = compareRackAddresses(a.rackAddress, b.rackAddress);
      if (rackComparison !== 0) {
        return rackComparison;
      }
      return a.sku.localeCompare(b.sku, undefined, {
        numeric: true,
        sensitivity: "base",
      });
    });

    allItems.push(...groupItems);
  });

  return {
    items: allItems,
    totalQuantity,
  };
};

export const buildAmazonPicklistPDFDoc = (
  picklist: PicklistResult
): { doc: jsPDF; picklistNo: string; now: Date } => {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const now = new Date();
  const formattedDate = now.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  const picklistNo = `PL${Date.now()}`;

  const PAGE_WIDTH = 210;
  const PAGE_HEIGHT = 297;
  const MARGIN = 8;
  const HEADER_HEIGHT = 26;
  const FOOTER_HEIGHT = 10;
  const COLUMN_GAP = 6;
  const MAX_ROWS_PER_COLUMN = 40;
  const hasRightColumn = picklist.items.length > MAX_ROWS_PER_COLUMN;
  const ITEMS_PER_PAGE = hasRightColumn ? 80 : MAX_ROWS_PER_COLUMN; // 40 left + 40 right = 80 records per page, or 40 for single column
  const TABLE_WIDTH = hasRightColumn ? 94 : PAGE_WIDTH - 2 * MARGIN;
  const LEFT_X = MARGIN;
  const RIGHT_X = LEFT_X + 94 + COLUMN_GAP;

  const totalPages = Math.max(1, Math.ceil(picklist.items.length / ITEMS_PER_PAGE));

  const drawHeader = (page: number) => {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(15);
    doc.text("AMAZON PICKLIST", PAGE_WIDTH / 2, 10, {
      align: "center",
    });

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    doc.text(`Picklist No : ${picklistNo}`, MARGIN, 16);
    doc.text(`Generated : ${formattedDate}`, MARGIN, 21);
    doc.text(`Total SKU : ${picklist.items.length}`, 145, 16);
    doc.text(`Total Qty : ${picklist.totalQuantity}`, 145, 21);
    doc.text(`Page : ${page} of ${totalPages}`, 145, 25);

    doc.setDrawColor(180);
    doc.line(MARGIN, HEADER_HEIGHT, PAGE_WIDTH - MARGIN, HEADER_HEIGHT);
  };

  const drawFooter = (page: number) => {
    doc.setDrawColor(180);
    doc.line(
      MARGIN,
      PAGE_HEIGHT - FOOTER_HEIGHT,
      PAGE_WIDTH - MARGIN,
      PAGE_HEIGHT - FOOTER_HEIGHT
    );

    doc.setFontSize(8);
    doc.text(
      `Amazon Warehouse Picklist | Page ${page} of ${totalPages}`,
      PAGE_WIDTH - MARGIN,
      PAGE_HEIGHT - 4,
      {
        align: "right",
      }
    );
  };

  for (let pageIdx = 0; pageIdx < totalPages; pageIdx++) {
    if (pageIdx > 0) {
      doc.addPage();
    }

    const currentPageNum = pageIdx + 1;
    drawHeader(currentPageNum);
    drawFooter(currentPageNum);

    const startIdx = pageIdx * ITEMS_PER_PAGE;
    const pageItems = picklist.items.slice(startIdx, startIdx + ITEMS_PER_PAGE);

    // Fill left column first up to 40 items
    const leftItems = pageItems.slice(0, MAX_ROWS_PER_COLUMN);
    // Fill right column with remaining items (up to 40 items) if 2-column mode
    const rightItems = hasRightColumn ? pageItems.slice(MAX_ROWS_PER_COLUMN, ITEMS_PER_PAGE) : [];

    // Left Column Table (Max 40 rows)
    autoTable(doc, {
      startY: HEADER_HEIGHT + 3,
      margin: { left: LEFT_X },
      tableWidth: TABLE_WIDTH,
      pageBreak: "avoid",
      head: [["Rack Address", "SKU", "Qty", "Gen Barcode"]],
      body: leftItems.map((item) => [
        item.rackAddress || "--",
        item.sku,
        item.quantity.toString(),
        item.generateBarcode || "No",
      ]),
      styles: {
        fontSize: hasRightColumn ? 7.5 : 8.5,
        cellPadding: hasRightColumn ? 1.2 : 1.5,
        lineWidth: 0.1,
        minCellHeight: 6,
        overflow: "ellipsize",
      },
      headStyles: {
        fillColor: [10, 14, 26],
        textColor: [255, 255, 255],
        fontStyle: "bold",
        halign: "center",
        minCellHeight: 6,
      },
      columnStyles: hasRightColumn
        ? {
            0: { cellWidth: 19, halign: "center" },
            1: { cellWidth: 48, halign: "left" },
            2: { cellWidth: 10, halign: "center", fontStyle: "bold" },
            3: { cellWidth: 17, halign: "center" },
          }
        : {
            0: { cellWidth: 32, halign: "center" },
            1: { cellWidth: 104, halign: "left" },
            2: { cellWidth: 22, halign: "center", fontStyle: "bold" },
            3: { cellWidth: 36, halign: "center" },
          },
      theme: "grid",
      didParseCell: (data) => {
        if (data.section === "body") {
          // Column 0: Rack Address
          if (data.column.index === 0 && data.cell.raw !== "--") {
            data.cell.styles.fontStyle = "bold";
            data.cell.styles.textColor = [30, 41, 59];
          }
          // Column 1: SKU
          if (data.column.index === 1) {
            data.cell.styles.fontStyle = "bold";
            data.cell.styles.textColor = [15, 23, 42];
          }
          // Column 2: Qty
          if (data.column.index === 2) {
            data.cell.styles.fontStyle = "bold";
            data.cell.styles.textColor = [0, 0, 0];
          }
          // Column 3: Gen Barcode
          if (data.column.index === 3) {
            if (data.cell.raw === "Yes") {
              data.cell.styles.fontStyle = "bold";
              data.cell.styles.textColor = [16, 185, 129];
            } else {
              data.cell.styles.textColor = [100, 116, 139];
            }
          }
        }
      },
    });

    // Right Column Table (Max 40 rows) - only if hasRightColumn and rightItems exist
    if (hasRightColumn && rightItems.length > 0) {
      autoTable(doc, {
        startY: HEADER_HEIGHT + 3,
        margin: { left: RIGHT_X },
        tableWidth: 94,
        pageBreak: "avoid",
        head: [["Rack Address", "SKU", "Qty", "Gen Barcode"]],
        body: rightItems.map((item) => [
          item.rackAddress || "--",
          item.sku,
          item.quantity.toString(),
          item.generateBarcode || "No",
        ]),
        styles: {
          fontSize: 7.5,
          cellPadding: 1.2,
          lineWidth: 0.1,
          minCellHeight: 6,
          overflow: "ellipsize",
        },
        headStyles: {
          fillColor: [10, 14, 26],
          textColor: [255, 255, 255],
          fontStyle: "bold",
          halign: "center",
          minCellHeight: 6,
        },
        columnStyles: {
          0: { cellWidth: 19, halign: "center" },
          1: { cellWidth: 48, halign: "left" },
          2: { cellWidth: 10, halign: "center", fontStyle: "bold" },
          3: { cellWidth: 17, halign: "center" },
        },
        theme: "grid",
        didParseCell: (data) => {
          if (data.section === "body") {
            // Column 0: Rack Address
            if (data.column.index === 0 && data.cell.raw !== "--") {
              data.cell.styles.fontStyle = "bold";
              data.cell.styles.textColor = [30, 41, 59];
            }
            // Column 1: SKU
            if (data.column.index === 1) {
              data.cell.styles.fontStyle = "bold";
              data.cell.styles.textColor = [15, 23, 42];
            }
            // Column 2: Qty
            if (data.column.index === 2) {
              data.cell.styles.fontStyle = "bold";
              data.cell.styles.textColor = [0, 0, 0];
            }
            // Column 3: Gen Barcode
            if (data.column.index === 3) {
              if (data.cell.raw === "Yes") {
                data.cell.styles.fontStyle = "bold";
                data.cell.styles.textColor = [16, 185, 129];
              } else {
                data.cell.styles.textColor = [100, 116, 139];
              }
            }
          }
        },
      });
    }
  }

  return { doc, picklistNo, now };
};

export const openAmazonPicklistPDF = (picklist: PicklistResult) => {
  const { doc } = buildAmazonPicklistPDFDoc(picklist);
  const blob = doc.output("blob");
  const blobUrl = URL.createObjectURL(blob);
  window.open(blobUrl, "_blank");
  setTimeout(() => URL.revokeObjectURL(blobUrl), 60000);
};

export const downloadAmazonPicklistPDF = (picklist: PicklistResult) => {
  const { doc, picklistNo, now } = buildAmazonPicklistPDFDoc(picklist);
  const fileName = `Amazon_Picklist_${picklistNo}_${now.toISOString().slice(0, 10)}.pdf`;
  const blob = doc.output("blob");
  const blobUrl = URL.createObjectURL(blob);
  window.open(blobUrl, "_blank");
  doc.save(fileName);
  setTimeout(() => URL.revokeObjectURL(blobUrl), 60000);
};

export const openAmazonPicklistTab = (picklist: PicklistResult) => {
  const now = new Date();
  const picklistNo = `PL${Date.now()}`;
  const formattedDate = now.toLocaleString("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  });

  const MAX_ROWS_PER_COLUMN = 40;
  const hasRightColumn = picklist.items.length > MAX_ROWS_PER_COLUMN;
  const ITEMS_PER_PAGE = hasRightColumn ? 80 : MAX_ROWS_PER_COLUMN;
  const totalPages = Math.max(1, Math.ceil(picklist.items.length / ITEMS_PER_PAGE));

  const renderTableRows = (items: PicklistItem[]) =>
    items
      .map(
        (item) => `
      <tr>
        <td style="text-align: center; font-weight: 600;">${item.rackAddress || "--"}</td>
        <td style="text-align: left; font-weight: bold; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: ${hasRightColumn ? "140px" : "320px"};">${item.sku}</td>
        <td style="text-align: center; font-weight: bold;">${item.quantity}</td>
        <td style="text-align: center; ${item.generateBarcode === "Yes" ? "font-weight: bold; color: #16a34a;" : "color: #64748b;"}">${item.generateBarcode || "No"}</td>
      </tr>`
      )
      .join("");

  let pagesHtml = "";
  for (let pageIdx = 0; pageIdx < totalPages; pageIdx++) {
    const startIdx = pageIdx * ITEMS_PER_PAGE;
    const pageItems = picklist.items.slice(startIdx, startIdx + ITEMS_PER_PAGE);
    const leftItems = pageItems.slice(0, MAX_ROWS_PER_COLUMN);
    const rightItems = hasRightColumn ? pageItems.slice(MAX_ROWS_PER_COLUMN, ITEMS_PER_PAGE) : [];

    pagesHtml += `
    <div class="a4-page">
      <div class="sheet-header">
        <div>
          <div class="sheet-title">Amazon Picklist (${picklistNo})</div>
          <div class="sheet-meta">Generated: ${formattedDate} &bull; Total Orders: ${picklist.items.length} SKUs (${picklist.totalQuantity} Units) &bull; Page ${pageIdx + 1} of ${totalPages}</div>
        </div>
        <div class="sheet-actions">
          <button class="btn btn-print" onclick="window.print()">Print A4 Picklist</button>
        </div>
      </div>

      ${
        hasRightColumn
          ? `<div class="two-column-layout">
              <!-- Left Column Table (Max 40 rows) -->
              <div class="table-col">
                <table>
                  <thead>
                    <tr>
                      <th style="width: 22%;">Rack</th>
                      <th style="width: 48%; text-align: left;">SKU</th>
                      <th style="width: 12%;">Qty</th>
                      <th style="width: 18%;">Barcode</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${renderTableRows(leftItems)}
                  </tbody>
                </table>
              </div>

              <!-- Right Column Table (Max 40 rows) -->
              <div class="table-col">
                ${
                  rightItems.length > 0
                    ? `<table>
                  <thead>
                    <tr>
                      <th style="width: 22%;">Rack</th>
                      <th style="width: 48%; text-align: left;">SKU</th>
                      <th style="width: 12%;">Qty</th>
                      <th style="width: 18%;">Barcode</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${renderTableRows(rightItems)}
                  </tbody>
                </table>`
                    : `<div class="empty-col-placeholder"></div>`
                }
              </div>
            </div>`
          : `<div class="single-column-layout">
              <table>
                <thead>
                  <tr>
                    <th style="width: 20%;">Rack</th>
                    <th style="width: 52%; text-align: left;">SKU</th>
                    <th style="width: 12%;">Qty</th>
                    <th style="width: 16%;">Barcode</th>
                  </tr>
                </thead>
                <tbody>
                  ${renderTableRows(leftItems)}
                </tbody>
              </table>
            </div>`
      }

      ${
        pageIdx === totalPages - 1
          ? `<div class="summary-bar">
              <div><strong>TOTAL QUANTITY:</strong> ${picklist.totalQuantity} Units</div>
              <div><strong>TOTAL SKUs:</strong> ${picklist.items.length} Unique SKUs</div>
            </div>`
          : ""
      }
    </div>`;
  }

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Amazon Picklist - ${picklistNo}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    @page {
      size: A4 portrait;
      margin: 8mm 6mm;
    }
    body {
      font-family: Calibri, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif;
      color: #000;
      background: #f1f5f9;
      padding: 16px 0;
    }
    .a4-page {
      width: 210mm;
      min-height: 297mm;
      max-width: 210mm;
      margin: 0 auto 16px auto;
      background: #fff;
      padding: 8mm 6mm;
      box-shadow: 0 4px 14px rgba(0,0,0,0.08);
      border: 1px solid #e2e8f0;
      page-break-after: always;
      break-after: page;
      position: relative;
    }
    .a4-page:last-child {
      page-break-after: avoid;
      break-after: avoid;
      margin-bottom: 0;
    }
    .sheet-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 8px;
      padding-bottom: 6px;
      border-bottom: 2px solid #0f172a;
    }
    .sheet-title {
      font-size: 16px;
      font-weight: 800;
      color: #0f172a;
      letter-spacing: -0.2px;
    }
    .sheet-meta {
      font-size: 10px;
      color: #475569;
      margin-top: 2px;
    }
    .sheet-actions {
      display: flex;
      gap: 8px;
    }
    .btn {
      display: inline-flex;
      align-items: center;
      padding: 5px 12px;
      font-size: 11px;
      font-weight: 600;
      border-radius: 5px;
      cursor: pointer;
      text-decoration: none;
    }
    .btn-print {
      background: #0f172a;
      color: #fff;
      border: 1px solid #0f172a;
    }
    .btn-print:hover { background: #1e293b; }
    .single-column-layout {
      width: 100%;
    }
    .two-column-layout {
      display: flex;
      gap: 6mm;
      width: 100%;
      align-items: flex-start;
    }
    .table-col {
      width: calc(50% - 3mm);
      flex: 1;
    }
    .empty-col-placeholder {
      width: 100%;
      height: 100px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 9.5px;
    }
    th {
      border: 1px solid #cbd5e1;
      border-bottom: 1.5px solid #0f172a;
      padding: 3.5px 5px;
      font-weight: bold;
      background: #f8fafc;
      color: #0f172a;
      font-size: 9.5px;
    }
    td {
      border: 1px solid #e2e8f0;
      padding: 3px 5px;
      vertical-align: middle;
      color: #0f172a;
      font-size: 9px;
      line-height: 1.15;
    }
    .summary-bar {
      margin-top: 8px;
      padding: 6px 10px;
      background: #f8fafc;
      border: 1px solid #cbd5e1;
      display: flex;
      justify-content: space-between;
      font-size: 11px;
      color: #0f172a;
    }
    @media print {
      body { padding: 0; background: #fff; }
      .a4-page {
        box-shadow: none;
        border: none;
        margin: 0;
        padding: 0;
        width: 100%;
        min-height: auto;
      }
      .sheet-actions { display: none !important; }
    }
  </style>
</head>
<body>
  ${pagesHtml}
</body>
</html>`;

  const blob = new Blob([html], { type: "text/html" });
  const blobUrl = URL.createObjectURL(blob);
  window.open(blobUrl, "_blank");
  setTimeout(() => URL.revokeObjectURL(blobUrl), 60000);
};

const populatePicklistWorksheet = (
  worksheet: ExcelJS.Worksheet,
  items: PicklistItem[],
  totalQuantity: number,
  emptyMessage = "No items found in this picklist"
) => {
  // Page setup to fit perfectly onto A4 portrait sheet when printing
  worksheet.pageSetup = {
    paperSize: 9, // A4
    orientation: "portrait",
    fitToPage: true,
    fitToWidth: 1,
    fitToHeight: 0,
    margins: {
      left: 0.25,
      right: 0.25,
      top: 0.35,
      bottom: 0.35,
      header: 0.2,
      footer: 0.2,
    },
  };

  if (items.length === 0) {
    const emptyRow = worksheet.addRow([emptyMessage]);
    worksheet.mergeCells(emptyRow.number, 1, emptyRow.number, 4);
    emptyRow.height = 24;
    const cell = emptyRow.getCell(1);
    cell.font = { italic: true, size: 10.5, color: { argb: "FF64748B" } };
    cell.alignment = { vertical: "middle", horizontal: "center" };
    worksheet.getColumn(1).width = 15;
    worksheet.getColumn(2).width = 30;
    worksheet.getColumn(3).width = 10;
    worksheet.getColumn(4).width = 14;
    return;
  }

  // Build sequential list of entries (section headers + items)
  type SheetEntry =
    | { type: "divider"; text: string }
    | { type: "item"; item: PicklistItem };

  const entries: SheetEntry[] = [];
  let activeSection = "";

  items.forEach((item) => {
    const itemSection = item.orderTypeLabel || "Single Quantity";
    if (itemSection !== activeSection) {
      activeSection = itemSection;
      const sectionItems = items.filter(
        (i) => (i.orderTypeLabel || "Single Quantity") === activeSection
      );
      const sectionQty = sectionItems.reduce((acc, i) => acc + i.quantity, 0);
      entries.push({
        type: "divider",
        text: `▶ ${activeSection.toUpperCase()} — ${sectionItems.length} Unique SKUs (${sectionQty} Units)`,
      });
    }
    entries.push({ type: "item", item });
  });

  const MAX_ROWS_PER_COLUMN = 40;
  const hasRightColumn = entries.length > MAX_ROWS_PER_COLUMN;
  const ITEMS_PER_PAGE = hasRightColumn ? 80 : MAX_ROWS_PER_COLUMN;
  const totalPages = Math.max(1, Math.ceil(entries.length / ITEMS_PER_PAGE));

  const styleHeaderCell = (cell: ExcelJS.Cell, isLeft = false) => {
    cell.font = { bold: true, color: { argb: "FF000000" }, size: 9.5, name: "Calibri" };
    cell.alignment = { vertical: "middle", horizontal: isLeft ? "left" : "center" };
    cell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FFF8FAFC" },
    };
    cell.border = {
      top: { style: "thin", color: { argb: "FFD4D4D8" } },
      left: { style: "thin", color: { argb: "FFD4D4D8" } },
      bottom: { style: "medium", color: { argb: "FF000000" } },
      right: { style: "thin", color: { argb: "FFD4D4D8" } },
    };
  };

  const styleItemCells = (
    row: ExcelJS.Row,
    startCol: number,
    item: PicklistItem
  ) => {
    const rackCell = row.getCell(startCol);
    const skuCell = row.getCell(startCol + 1);
    const qtyCell = row.getCell(startCol + 2);
    const barcodeCell = row.getCell(startCol + 3);

    rackCell.value = item.rackAddress || "--";
    skuCell.value = item.sku;
    qtyCell.value = item.quantity;
    barcodeCell.value = item.generateBarcode || "No";

    [rackCell, skuCell, qtyCell, barcodeCell].forEach((c, idx) => {
      c.border = {
        top: { style: "thin", color: { argb: "FFE2E8F0" } },
        left: { style: "thin", color: { argb: "FFE2E8F0" } },
        bottom: { style: "thin", color: { argb: "FFE2E8F0" } },
        right: { style: "thin", color: { argb: "FFE2E8F0" } },
      };
      c.font = { size: 9, name: "Calibri", color: { argb: "FF000000" } };
      c.alignment = { vertical: "middle", horizontal: idx === 1 ? "left" : "center" };
    });

    skuCell.font = { bold: true, size: 9, name: "Calibri", color: { argb: "FF000000" } };

    if (item.generateBarcode === "Yes") {
      barcodeCell.font = { bold: true, size: 9, name: "Calibri", color: { argb: "FF16A34A" } };
    } else {
      barcodeCell.font = { size: 9, name: "Calibri", color: { argb: "FF64748B" } };
    }
  };

  const styleDividerCells = (
    row: ExcelJS.Row,
    startCol: number,
    text: string
  ) => {
    for (let c = startCol; c <= startCol + 3; c++) {
      const cell = row.getCell(c);
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FFF1F5F9" },
      };
      cell.border = {
        top: { style: "medium", color: { argb: "FF0A0E1A" } },
        bottom: { style: "thin", color: { argb: "FFCBD5E1" } },
        left: c === startCol ? { style: "thin", color: { argb: "FFCBD5E1" } } : undefined,
        right: c === startCol + 3 ? { style: "thin", color: { argb: "FFCBD5E1" } } : undefined,
      };
    }
    const firstCell = row.getCell(startCol);
    firstCell.value = text;
    firstCell.font = { bold: true, size: 9.5, name: "Calibri", color: { argb: "FF0F172A" } };
    firstCell.alignment = { vertical: "middle", horizontal: "left" };
    worksheet.mergeCells(row.number, startCol, row.number, startCol + 3);
  };

  let lastPageHadRightEntries = false;

  for (let pageIdx = 0; pageIdx < totalPages; pageIdx++) {
    if (pageIdx > 0) {
      const lastRow = worksheet.lastRow;
      if (lastRow) {
        lastRow.addPageBreak();
      }
    }

    const startIdx = pageIdx * ITEMS_PER_PAGE;
    const pageEntries = entries.slice(startIdx, startIdx + ITEMS_PER_PAGE);

    const leftEntries = pageEntries.slice(0, MAX_ROWS_PER_COLUMN);
    const rightEntries = hasRightColumn
      ? pageEntries.slice(MAX_ROWS_PER_COLUMN, ITEMS_PER_PAGE)
      : [];
    const numRowsOnPage = Math.max(leftEntries.length, rightEntries.length);
    lastPageHadRightEntries = rightEntries.length > 0;

    // Page Table Header Row
    const headerRow = worksheet.addRow([]);
    headerRow.height = 24;

    // Left Column Headers (Cols 1 to 4)
    headerRow.getCell(1).value = "Rack";
    headerRow.getCell(2).value = "SKU";
    headerRow.getCell(3).value = "Qty";
    headerRow.getCell(4).value = "Barcode";

    styleHeaderCell(headerRow.getCell(1), false);
    styleHeaderCell(headerRow.getCell(2), true);
    styleHeaderCell(headerRow.getCell(3), false);
    styleHeaderCell(headerRow.getCell(4), false);

    // Right Column Headers (Cols 6 to 9) - ONLY if hasRightColumn AND rightEntries exist
    if (hasRightColumn && rightEntries.length > 0) {
      // Spacer Column (Col 5)
      headerRow.getCell(5).value = "";

      headerRow.getCell(6).value = "Rack";
      headerRow.getCell(7).value = "SKU";
      headerRow.getCell(8).value = "Qty";
      headerRow.getCell(9).value = "Barcode";

      styleHeaderCell(headerRow.getCell(6), false);
      styleHeaderCell(headerRow.getCell(7), true);
      styleHeaderCell(headerRow.getCell(8), false);
      styleHeaderCell(headerRow.getCell(9), false);
    }

    // Add data rows side-by-side
    for (let r = 0; r < numRowsOnPage; r++) {
      const dataRow = worksheet.addRow([]);
      dataRow.height = 18.5;

      const left = leftEntries[r];
      const right = rightEntries[r];

      // Left Column (Cols 1-4)
      if (left) {
        if (left.type === "divider") {
          styleDividerCells(dataRow, 1, left.text);
        } else {
          styleItemCells(dataRow, 1, left.item);
        }
      }

      // Right Column (Cols 6-9) - ONLY if hasRightColumn and right exists
      if (hasRightColumn && right) {
        // Spacer Column (Col 5)
        dataRow.getCell(5).value = "";

        if (right.type === "divider") {
          styleDividerCells(dataRow, 6, right.text);
        } else {
          styleItemCells(dataRow, 6, right.item);
        }
      }
    }
  }

  // Summary Row across bottom of sheet (only once)
  const totalRow = worksheet.addRow([]);
  totalRow.height = 24;

  totalRow.getCell(1).value = "";
  totalRow.getCell(2).value = "TOTAL QUANTITY";
  totalRow.getCell(3).value = totalQuantity;
  totalRow.getCell(4).value = `${items.length} Unique SKUs`;

  for (let c = 1; c <= 4; c++) {
    const cell = totalRow.getCell(c);
    cell.border = {
      top: { style: "thin", color: { argb: "FF000000" } },
      bottom: { style: "double", color: { argb: "FF000000" } },
      left: { style: "thin", color: { argb: "FFE2E8F0" } },
      right: { style: "thin", color: { argb: "FFE2E8F0" } },
    };
    cell.font = { bold: true, size: 9.5, name: "Calibri", color: { argb: "FF000000" } };
    cell.alignment = {
      vertical: "middle",
      horizontal: c === 2 ? "right" : "center",
      shrinkToFit: true,
    };
  }

  // Column widths fitted snugly for A4 Portrait paper
  const maxRackLen = items.reduce(
    (max, i) => Math.max(max, (i.rackAddress && i.rackAddress !== "--" ? i.rackAddress : "").length),
    "Rack".length
  );
  const maxSkuLen = items.reduce(
    (max, i) => Math.max(max, (i.sku || "").length),
    "SKU".length
  );
  const totalSkuSummaryText = `${items.length} Unique SKUs`;
  const barcodeColWidth = Math.max(18, totalSkuSummaryText.length + 3);

  if (!hasRightColumn) {
    // Single 4-column layout (fit cleanly onto A4 Portrait without empty right columns)
    const singleRackWidth = Math.min(Math.max(maxRackLen + 3, 14), 26);
    const singleSkuWidth = Math.min(Math.max(maxSkuLen + 3, 26), 45);

    worksheet.getColumn(1).width = singleRackWidth;
    worksheet.getColumn(2).width = singleSkuWidth;
    worksheet.getColumn(3).width = 9;
    worksheet.getColumn(4).width = barcodeColWidth;
  } else {
    // Two-column side-by-side layout (Cols 1-4, Col 5 spacer, Cols 6-9)
    const rackWidth = Math.min(Math.max(maxRackLen + 2, 12), 18);
    const skuWidth = Math.min(Math.max(maxSkuLen + 2, 16), 26);

    worksheet.getColumn(1).width = rackWidth;
    worksheet.getColumn(2).width = skuWidth;
    worksheet.getColumn(3).width = 8;
    worksheet.getColumn(4).width = barcodeColWidth;
    worksheet.getColumn(5).width = 2; // Spacer
    worksheet.getColumn(6).width = rackWidth;
    worksheet.getColumn(7).width = skuWidth;
    worksheet.getColumn(8).width = 8;
    worksheet.getColumn(9).width = barcodeColWidth;
  }
};

export const downloadAmazonPicklistExcel = async (picklist: PicklistResult) => {
  const workbook = new ExcelJS.Workbook();
  const now = new Date();
  const picklistNo = `PL${Date.now()}`;

  // Configure workbook views so Sheet 1 ("Amazon Picklist") is explicitly the active tab when opened in Excel
  workbook.views = [
    {
      x: 0,
      y: 0,
      width: 10000,
      height: 20000,
      firstSheet: 0,
      activeTab: 0,
      visibility: "visible",
    },
  ];

  // Sheet 1: All items (both Barcode Yes & No) grouped by section and sorted purely by Rack Address
  const sheet1 = workbook.addWorksheet("Amazon Picklist");
  sheet1.views = [{ state: "normal", activeCell: "A1" }];
  populatePicklistWorksheet(
    sheet1,
    picklist.items,
    picklist.totalQuantity,
    "No items found in this picklist"
  );

  // Sheet 2: Only items where Generate Barcode === "Yes" grouped by Single, Multiple Quantity, Multiple Pieces
  const barcodeYesItems = picklist.items.filter((item) => item.generateBarcode === "Yes");
  const barcodeYesTotalQty = barcodeYesItems.reduce((acc, item) => acc + item.quantity, 0);

  const sheet2 = workbook.addWorksheet("Barcode Yes");
  sheet2.views = [{ state: "normal", activeCell: "A1" }];
  populatePicklistWorksheet(
    sheet2,
    barcodeYesItems,
    barcodeYesTotalQty,
    "No Barcode Yes items found in this batch"
  );

  const buffer = await workbook.xlsx.writeBuffer();
  const fileName = `Amazon_Picklist_${picklistNo}_${now.toISOString().slice(0, 10)}.xlsx`;

  saveAs(
    new Blob([buffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    }),
    fileName
  );
};
