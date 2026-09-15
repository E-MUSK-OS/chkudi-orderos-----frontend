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
    // 1. Generate Barcode === "Yes" FIRST
    // 2. Rack Address natural sort
    // 3. Seller SKU natural sort
    groupItems.sort((a, b) => {
      const aYes = a.generateBarcode === "Yes";
      const bYes = b.generateBarcode === "Yes";
      if (aYes && !bYes) return -1;
      if (!aYes && bYes) return 1;

      const rackA = normalizeRackAddress(a.rackAddress);
      const rackB = normalizeRackAddress(b.rackAddress);

      if (rackA && rackB) {
        const rackComparison = rackA.localeCompare(rackB, undefined, {
          numeric: true,
          sensitivity: "base",
        });
        if (rackComparison !== 0) {
          return rackComparison;
        }
        return a.sku.localeCompare(b.sku, undefined, {
          numeric: true,
          sensitivity: "base",
        });
      }

      if (rackA && !rackB) return -1;
      if (!rackA && rackB) return 1;

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
  const TABLE_WIDTH = 94;
  const LEFT_X = MARGIN;
  const RIGHT_X = LEFT_X + TABLE_WIDTH + COLUMN_GAP;
  const MAX_ROWS_PER_COLUMN = 40;
  const ITEMS_PER_PAGE = 80; // 40 left + 40 right = 80 records per page

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
    // Fill right column with remaining items (up to 40 items)
    const rightItems = pageItems.slice(MAX_ROWS_PER_COLUMN, ITEMS_PER_PAGE);

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

    // Right Column Table (Max 40 rows)
    if (rightItems.length > 0) {
      autoTable(doc, {
        startY: HEADER_HEIGHT + 3,
        margin: { left: RIGHT_X },
        tableWidth: TABLE_WIDTH,
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

  const rowsHtml = picklist.items
    .map(
      (item) => `
      <tr>
        <td style="text-align: center;">${item.rackAddress || "--"}</td>
        <td style="text-align: left; font-weight: bold;">${item.sku}</td>
        <td style="text-align: center; font-weight: bold;">${item.quantity}</td>
        <td style="text-align: center; ${item.generateBarcode === "Yes" ? "font-weight: bold; color: #16a34a;" : "color: #64748b;"}">${item.generateBarcode || "No"}</td>
      </tr>`
    )
    .join("");

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Amazon Picklist - ${picklistNo}</title>
  <style>
    * { box-sizing: border-box; }
    body {
      font-family: Calibri, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif;
      margin: 20px;
      color: #000;
      background: #f8fafc;
    }
    .sheet-wrapper {
      max-width: 980px;
      margin: 0 auto;
      background: #fff;
      padding: 24px;
      border-radius: 8px;
      box-shadow: 0 4px 16px rgba(0,0,0,0.06);
      border: 1px solid #e2e8f0;
    }
    .sheet-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 16px;
      padding-bottom: 12px;
      border-bottom: 2px solid #000;
    }
    .sheet-title {
      font-size: 20px;
      font-weight: bold;
      color: #0f172a;
    }
    .sheet-meta {
      font-size: 12px;
      color: #64748b;
      margin-top: 4px;
    }
    .sheet-actions {
      display: flex;
      gap: 8px;
    }
    .btn {
      display: inline-flex;
      align-items: center;
      padding: 6px 14px;
      font-size: 13px;
      font-weight: 600;
      border-radius: 6px;
      cursor: pointer;
      border: 1px solid #cbd5e1;
      background: #f8fafc;
      color: #334155;
      text-decoration: none;
    }
    .btn:hover { background: #f1f5f9; }
    .btn-print {
      background: #0f172a;
      color: #fff;
      border: 1px solid #0f172a;
    }
    .btn-print:hover { background: #1e293b; }
    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 13px;
    }
    th {
      border: 1px solid #d4d4d8;
      border-bottom: 2px solid #000;
      padding: 8px 12px;
      font-weight: bold;
      background: #f8fafc;
      color: #000;
    }
    td {
      border: 1px solid #e2e8f0;
      padding: 7px 12px;
      vertical-align: middle;
      color: #000;
    }
    .total-row td {
      border-top: 1px solid #000;
      border-bottom: 3px double #000;
      font-weight: bold;
      font-size: 13.5px;
      background: #f8fafc;
    }
    @media print {
      body { margin: 0; background: #fff; }
      .sheet-wrapper { box-shadow: none; border: none; padding: 0; max-width: 100%; }
      .sheet-actions { display: none; }
    }
  </style>
</head>
<body>
  <div class="sheet-wrapper">
    <div class="sheet-header">
      <div>
        <div class="sheet-title">Amazon Picklist (${picklistNo})</div>
        <div class="sheet-meta">Generated on ${formattedDate} &bull; Total Orders: ${picklist.items.length} SKUs (${picklist.totalQuantity} Units)</div>
      </div>
      <div class="sheet-actions">
        <button class="btn btn-print" onclick="window.print()">Print Picklist</button>
      </div>
    </div>
    <table>
      <thead>
        <tr>
          <th style="width: 18%;">Rack Address</th>
          <th style="width: 48%; text-align: left;">Seller SKU</th>
          <th style="width: 16%;">Quantity</th>
          <th style="width: 18%;">Generate Barcode</th>
        </tr>
      </thead>
      <tbody>
        ${rowsHtml}
        <tr class="total-row">
          <td></td>
          <td style="text-align: right;">TOTAL QUANTITY</td>
          <td style="text-align: center;">${picklist.totalQuantity}</td>
          <td style="text-align: center;">${picklist.items.length} Unique SKUs</td>
        </tr>
      </tbody>
    </table>
  </div>
</body>
</html>`;

  const blob = new Blob([html], { type: "text/html" });
  const blobUrl = URL.createObjectURL(blob);
  window.open(blobUrl, "_blank");
  setTimeout(() => URL.revokeObjectURL(blobUrl), 60000);
};

export const downloadAmazonPicklistExcel = async (picklist: PicklistResult) => {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet("Amazon Picklist");

  const now = new Date();
  const picklistNo = `PL${Date.now()}`;

  // Columns specification: Rack Address, Seller SKU, Quantity, Generate Barcode
  worksheet.columns = [
    { header: "Rack Address", key: "rackAddress", width: 20 },
    { header: "Seller SKU", key: "sku", width: 44 },
    { header: "Quantity", key: "quantity", width: 14 },
    { header: "Generate Barcode", key: "generateBarcode", width: 18 },
  ];

  // Header row styling: bold black text, clean borders, height 26
  const headerRow = worksheet.getRow(1);
  headerRow.height = 26;
  headerRow.eachCell((cell, colNumber) => {
    cell.font = { bold: true, color: { argb: "FF000000" }, size: 11, name: "Calibri" };
    cell.alignment = { vertical: "middle", horizontal: colNumber === 2 ? "left" : "center" };
    cell.border = {
      top: { style: "thin", color: { argb: "FFD4D4D8" } },
      left: { style: "thin", color: { argb: "FFD4D4D8" } },
      bottom: { style: "medium", color: { argb: "FF000000" } },
      right: { style: "thin", color: { argb: "FFD4D4D8" } },
    };
  });

  let activeSection = "";

  // Data rows with section divider rows
  picklist.items.forEach((item) => {
    const itemSection = item.orderTypeLabel || "Single Quantity";

    if (itemSection !== activeSection) {
      activeSection = itemSection;
      const sectionItems = picklist.items.filter(
        (i) => (i.orderTypeLabel || "Single Quantity") === activeSection
      );
      const sectionQty = sectionItems.reduce((acc, i) => acc + i.quantity, 0);

      const dividerRow = worksheet.addRow({
        rackAddress: `▶ ${activeSection.toUpperCase()}`,
        sku: `${sectionItems.length} Unique SKUs (${sectionQty} Units)`,
        quantity: sectionQty,
        generateBarcode: "",
      });

      dividerRow.height = 22;
      dividerRow.eachCell((cell) => {
        cell.font = { bold: true, size: 10.5, name: "Calibri", color: { argb: "FF0F172A" } };
        cell.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "FFF1F5F9" },
        };
        cell.border = {
          top: { style: "medium", color: { argb: "FF0A0E1A" } },
          bottom: { style: "thin", color: { argb: "FFCBD5E1" } },
          left: { style: "thin", color: { argb: "FFCBD5E1" } },
          right: { style: "thin", color: { argb: "FFCBD5E1" } },
        };
      });
    }

    const row = worksheet.addRow({
      rackAddress: item.rackAddress || "--",
      sku: item.sku,
      quantity: item.quantity,
      generateBarcode: item.generateBarcode || "No",
    });

    row.height = 20;

    row.eachCell((cell, colNumber) => {
      cell.border = {
        top: { style: "thin", color: { argb: "FFE2E8F0" } },
        left: { style: "thin", color: { argb: "FFE2E8F0" } },
        bottom: { style: "thin", color: { argb: "FFE2E8F0" } },
        right: { style: "thin", color: { argb: "FFE2E8F0" } },
      };
      cell.alignment = { vertical: "middle", horizontal: colNumber === 2 ? "left" : "center" };
      cell.font = { size: 10.5, name: "Calibri", color: { argb: "FF000000" } };

      if (colNumber === 2) {
        cell.font = { bold: true, size: 10.5, name: "Calibri", color: { argb: "FF000000" } };
      }

      if (colNumber === 4) {
        if (item.generateBarcode === "Yes") {
          cell.font = { bold: true, size: 10.5, name: "Calibri", color: { argb: "FF16A34A" } };
        } else {
          cell.font = { size: 10.5, name: "Calibri", color: { argb: "FF64748B" } };
        }
      }
    });
  });

  // Total Summary Row: standard Excel background (no fill), bold black text
  const totalRow = worksheet.addRow({
    rackAddress: "",
    sku: "TOTAL QUANTITY",
    quantity: picklist.totalQuantity,
    generateBarcode: `${picklist.items.length} Unique SKUs`,
  });

  totalRow.height = 24;
  totalRow.eachCell((cell, colNumber) => {
    cell.border = {
      top: { style: "thin", color: { argb: "FF000000" } },
      bottom: { style: "double", color: { argb: "FF000000" } },
      left: { style: "thin", color: { argb: "FFE2E8F0" } },
      right: { style: "thin", color: { argb: "FFE2E8F0" } },
    };
    cell.font = { bold: true, size: 11, name: "Calibri", color: { argb: "FF000000" } };
    cell.alignment = { vertical: "middle", horizontal: colNumber === 2 ? "right" : "center" };
  });

  // Auto-fit column widths so columns fit content snugly without unnecessary spaces
  const maxRackLen = picklist.items.reduce(
    (max, i) => Math.max(max, (i.rackAddress && i.rackAddress !== "--" ? i.rackAddress : "").length),
    "Rack Address".length
  );
  const maxSkuLen = picklist.items.reduce(
    (max, i) => Math.max(max, (i.sku || "").length),
    "Seller SKU".length
  );

  // Column 1: Rack Address (snug fit for "Rack Address" or longest address)
  worksheet.getColumn(1).width = Math.max(maxRackLen + 3, 14);
  // Column 2: Seller SKU (snug fit for longest SKU in this batch instead of huge 44 width)
  worksheet.getColumn(2).width = Math.max(maxSkuLen + 3, 16);
  // Column 3: Quantity (fits "Quantity" snugly with no wasted space)
  worksheet.getColumn(3).width = 11;
  // Column 4: Generate Barcode (fits "Generate Barcode" snugly with no wasted space)
  worksheet.getColumn(4).width = 17;

  const buffer = await workbook.xlsx.writeBuffer();
  const fileName = `Amazon_Picklist_${picklistNo}_${now.toISOString().slice(0, 10)}.xlsx`;

  saveAs(
    new Blob([buffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    }),
    fileName
  );
};
