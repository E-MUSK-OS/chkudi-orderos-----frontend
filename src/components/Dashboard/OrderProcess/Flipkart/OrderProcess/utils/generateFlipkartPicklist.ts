import ExcelJS from "exceljs";
import { saveAs } from "file-saver";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { FlipkartOrderItem } from "../types";
import { isSkuBidirectionalMatch } from "./flipkartSkuMatch";

export interface FlipkartPicklistItem {
  sku: string;
  rackAddress: string;
  generateBarcode: string;
  quantity: number;
  orderType?: "single_quantity" | "multiple_pieces" | "multiple_sku";
  orderTypeLabel?: string;
}

export interface FlipkartPicklistResult {
  items: FlipkartPicklistItem[];
  totalQuantity: number;
}

/**
 * Splits a rack address into normalized comparison tokens:
 * Letters/words as uppercase strings, digits as numbers.
 * Non-alphanumeric separators (hyphens, spaces, slashes) are discarded
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

export const compareRackAddresses = (
  rackA?: string | null,
  rackB?: string | null
): number => {
  const tokensA = parseRackTokens(rackA);
  const tokensB = parseRackTokens(rackB);

  const hasA = tokensA.length > 0;
  const hasB = tokensB.length > 0;

  // Items with valid rack address always sort before unassigned ("--")
  if (hasA && !hasB) return -1;
  if (!hasA && hasB) return 1;
  if (!hasA && !hasB) return 0;

  const minLen = Math.min(tokensA.length, tokensB.length);
  for (let i = 0; i < minLen; i++) {
    const tA = tokensA[i];
    const tB = tokensB[i];

    if (typeof tA === "number" && typeof tB === "number") {
      if (tA !== tB) return tA - tB;
    } else if (typeof tA === "number" && typeof tB === "string") {
      return -1;
    } else if (typeof tA === "string" && typeof tB === "number") {
      return 1;
    } else {
      const cmp = String(tA).localeCompare(String(tB), undefined, { sensitivity: "base" });
      if (cmp !== 0) return cmp;
    }
  }

  return tokensA.length - tokensB.length;
};

/**
 * Generate Picklist data from Flipkart Orders & SKU Mappings,
 * grouped exactly like Amazon Order Process (Single Quantity, Multiple FSN, Multiple Pieces)
 * with ONLY SKU, Rack, and Qty.
 */
export const generateFlipkartPicklist = (
  orders: FlipkartOrderItem[],
  selectedRows?: Set<number>,
  skuDetailsMap?: Map<string, { fsn?: string; asin?: string; rackAddress?: string; generateBarcode?: string }>
): FlipkartPicklistResult => {
  const targetOrders =
    selectedRows && selectedRows.size > 0
      ? orders.filter((o) => selectedRows.has(o.index))
      : orders;

  const ORDER_GROUPS: {
    type: "single_quantity" | "multiple_sku" | "multiple_pieces";
    label: string;
  }[] = [
      { type: "single_quantity", label: "Single Quantity" },
      { type: "multiple_sku", label: "Multiple FSN" },
      { type: "multiple_pieces", label: "Multiple Pieces" },
    ];

  let totalQuantity = 0;
  const allItems: FlipkartPicklistItem[] = [];

  ORDER_GROUPS.forEach((grp) => {
    const groupOrders = targetOrders.filter(
      (o) => (o.orderType || "single_quantity") === grp.type
    );
    if (groupOrders.length === 0) return;

    const groupMap = new Map<string, FlipkartPicklistItem>();

    for (const order of groupOrders) {
      const lineItems: { sku: string; quantity: number; rackAddress?: string }[] = [];

      if (order.items && order.items.length > 0) {
        order.items.forEach((it) => {
          const s = (it.sku || "").trim();
          if (s.includes("/")) {
            s.split("/").forEach((sub) => {
              if (sub.trim()) {
                lineItems.push({
                  sku: sub.trim(),
                  quantity: it.quantity || 1,
                  rackAddress: it.rackAddress,
                });
              }
            });
          } else if (s) {
            lineItems.push({
              sku: s,
              quantity: it.quantity || 1,
              rackAddress: it.rackAddress,
            });
          }
        });
      } else {
        const parts = (order.sku || "")
          .split("/")
          .map((s) => s.trim())
          .filter(Boolean);
        if (parts.length > 1) {
          parts.forEach((p) => {
            lineItems.push({
              sku: p,
              quantity: 1,
              rackAddress: order.rackAddress,
            });
          });
        } else if (parts.length === 1) {
          lineItems.push({
            sku: parts[0],
            quantity: order.totalQuantity || 1,
            rackAddress: order.rackAddress,
          });
        }
      }

      for (const item of lineItems) {
        const rawSku = (item.sku || "").trim();
        if (!rawSku) continue;

        const normKey = rawSku.toLowerCase();
        let mapped = skuDetailsMap?.get(normKey);
        if (!mapped && skuDetailsMap) {
          for (const [dbSku, d] of skuDetailsMap.entries()) {
            if (
              (d.asin || d.rackAddress) &&
              isSkuBidirectionalMatch(dbSku, normKey)
            ) {
              mapped = d;
              break;
            }
          }
        }
        const rackAddress =
          mapped?.rackAddress || item.rackAddress || order.rackAddress || "";
        const rawBarcode = (mapped?.generateBarcode?.trim() || "").toUpperCase();
        const isBarcodeYes =
          rawBarcode === "YES" ||
          rawBarcode === "Y" ||
          rawBarcode === "TRUE" ||
          rawBarcode === "1";
        const generateBarcode = isBarcodeYes ? "Yes" : "No";
        const qty = item.quantity || 1;

        totalQuantity += qty;

        if (groupMap.has(normKey)) {
          const existing = groupMap.get(normKey)!;
          existing.quantity += qty;
          if (!existing.rackAddress && rackAddress) {
            existing.rackAddress = rackAddress;
          }
          if (existing.generateBarcode !== "Yes" && generateBarcode === "Yes") {
            existing.generateBarcode = "Yes";
          }
        } else {
          groupMap.set(normKey, {
            sku: rawSku,
            rackAddress,
            generateBarcode,
            quantity: qty,
            orderType: grp.type,
            orderTypeLabel: grp.label,
          });
        }
      }
    }

    // Sort items within this group primarily by Rack Address, secondarily by SKU
    const groupItems = Array.from(groupMap.values()).sort((a, b) => {
      const rackComp = compareRackAddresses(a.rackAddress, b.rackAddress);
      if (rackComp !== 0) return rackComp;
      return a.sku.localeCompare(b.sku);
    });

    allItems.push(...groupItems);
  });

  return {
    items: allItems,
    totalQuantity,
  };
};

/**
 * Populate Worksheet matching Amazon Order Process Picklist layout
 * (Symmetrical 2-Column layout, A4 Portrait, Rack / SKU / Qty columns)
 */
const populatePicklistWorksheet = (
  worksheet: ExcelJS.Worksheet,
  items: FlipkartPicklistItem[],
  totalQuantity: number,
  emptyMessage: string = "No items found in this picklist",
  forceSingleColumn: boolean = false
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
      top: 0.25,
      bottom: 0.25,
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
    worksheet.getColumn(1).width = 16;
    worksheet.getColumn(2).width = 32;
    worksheet.getColumn(3).width = 10;
    worksheet.getColumn(4).width = 14;
    return;
  }

  type SheetEntry =
    | { type: "divider"; text: string }
    | { type: "item"; item: FlipkartPicklistItem }
    | { type: "empty" };

  interface PageData {
    left: SheetEntry[];
    right: SheetEntry[];
  }

  const MAX_ROWS_PER_COLUMN = 52;
  const hasRightColumn =
    !forceSingleColumn &&
    (items.length > MAX_ROWS_PER_COLUMN ||
      items.some((i) => (i.orderTypeLabel || "Single Quantity") !== "Single Quantity") ||
      items.length > 1);

  const pages: PageData[] = [];
  let currentLeft: SheetEntry[] = [];
  let currentRight: SheetEntry[] = [];

  const finalizePage = () => {
    if (currentLeft.length > 0 || currentRight.length > 0) {
      pages.push({ left: currentLeft, right: currentRight });
      currentLeft = [];
      currentRight = [];
    }
  };

  const getRemainingRows = () =>
    MAX_ROWS_PER_COLUMN - Math.max(currentLeft.length, currentRight.length);

  const sections: { name: string; items: FlipkartPicklistItem[] }[] = [];
  let activeSection = "";
  items.forEach((item) => {
    const itemSection = item.orderTypeLabel || "Single Quantity";
    if (itemSection !== activeSection) {
      activeSection = itemSection;
      sections.push({ name: activeSection, items: [] });
    }
    sections[sections.length - 1].items.push(item);
  });

  for (const section of sections) {
    if (getRemainingRows() === 0) finalizePage();

    const sectionQty = section.items.reduce((acc, i) => acc + i.quantity, 0);
    const dividerEntry: SheetEntry = {
      type: "divider",
      text: `▶ ${section.name.toUpperCase()} — ${section.items.length} Unique SKUs (${sectionQty} Units)`,
    };

    currentLeft.push(dividerEntry);
    currentRight.push({ type: "empty" });

    let itemsToDistribute = [...section.items];

    while (itemsToDistribute.length > 0) {
      if (getRemainingRows() === 0) finalizePage();

      const availableRows = getRemainingRows();
      const maxItemsOnPage = availableRows * (hasRightColumn ? 2 : 1);

      const itemsForThisPage = itemsToDistribute.slice(0, maxItemsOnPage);
      itemsToDistribute = itemsToDistribute.slice(maxItemsOnPage);

      const numRowsNeeded = hasRightColumn
        ? Math.ceil(itemsForThisPage.length / 2)
        : itemsForThisPage.length;
      const leftCol = itemsForThisPage.slice(0, numRowsNeeded);
      const rightCol = hasRightColumn ? itemsForThisPage.slice(numRowsNeeded) : [];

      for (let r = 0; r < numRowsNeeded; r++) {
        currentLeft.push(leftCol[r] ? { type: "item", item: leftCol[r] } : { type: "empty" });
        if (hasRightColumn) {
          currentRight.push(rightCol[r] ? { type: "item", item: rightCol[r] } : { type: "empty" });
        }
      }
    }
  }
  finalizePage();

  const totalPages = pages.length || 1;

  // Add Date/Time Header at the top
  const formattedDate = new Date().toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
  const dateRow = worksheet.addRow([`Picklist Generated on: ${formattedDate}`]);
  dateRow.height = 20;
  worksheet.mergeCells(dateRow.number, 1, dateRow.number, hasRightColumn ? 9 : 4);
  const dateCell = dateRow.getCell(1);
  dateCell.font = { bold: true, size: 12, name: "Calibri", color: { argb: "FF0F172A" } };
  dateCell.alignment = { vertical: "middle", horizontal: "center" };
  worksheet.addRow([]).height = 5; // spacer

  const styleHeaderCell = (cell: ExcelJS.Cell, isLeft = false) => {
    cell.font = { bold: true, color: { argb: "FF000000" }, size: 10, name: "Calibri" };
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
    item: FlipkartPicklistItem
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
      c.font = { size: 10, name: "Calibri", color: { argb: "FF000000" } };
      c.alignment = { vertical: "middle", horizontal: idx === 1 ? "left" : "center" };
    });

    skuCell.font = { bold: true, size: 10, name: "Calibri", color: { argb: "FF000000" } };

    if (item.generateBarcode === "Yes") {
      barcodeCell.font = { bold: true, size: 10, name: "Calibri", color: { argb: "FF16A34A" } };
    } else {
      barcodeCell.font = { size: 10, name: "Calibri", color: { argb: "FF64748B" } };
    }
  };

  const styleDividerCells = (
    row: ExcelJS.Row,
    startCol: number,
    text: string,
    spanCols = 3
  ) => {
    const endCol = startCol + spanCols;
    for (let c = startCol; c <= endCol; c++) {
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
        right: c === endCol ? { style: "thin", color: { argb: "FFCBD5E1" } } : undefined,
      };
    }
    const firstCell = row.getCell(startCol);
    firstCell.value = text;
    firstCell.font = { bold: true, size: 10, name: "Calibri", color: { argb: "FF0F172A" } };
    firstCell.alignment = { vertical: "middle", horizontal: "left" };
    worksheet.mergeCells(row.number, startCol, row.number, endCol);
  };

  for (let pageIdx = 0; pageIdx < totalPages; pageIdx++) {
    if (pageIdx > 0) {
      const lastRow = worksheet.lastRow;
      if (lastRow) {
        lastRow.addPageBreak();
      }
    }

    const pageData = pages[pageIdx] || { left: [], right: [] };
    const leftEntries = pageData.left;
    const rightEntries = pageData.right;
    const numRowsOnPage = Math.max(leftEntries.length, rightEntries.length);

    // Page Table Header Row
    const headerRow = worksheet.addRow([]);
    headerRow.height = 18;

    // Left Column Headers (Cols 1 to 4: Rack, SKU, Qty, Barcode)
    headerRow.getCell(1).value = "Rack";
    headerRow.getCell(2).value = "SKU";
    headerRow.getCell(3).value = "Qty";
    headerRow.getCell(4).value = "Barcode";

    styleHeaderCell(headerRow.getCell(1), false);
    styleHeaderCell(headerRow.getCell(2), true);
    styleHeaderCell(headerRow.getCell(3), false);
    styleHeaderCell(headerRow.getCell(4), false);

    // Right Column Headers (Cols 6 to 9: Rack, SKU, Qty, Barcode)
    if (hasRightColumn) {
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
      dataRow.height = 14.5;

      const left = leftEntries[r];
      const right = rightEntries[r];

      // Left Column (Cols 1-4)
      if (left && left.type !== "empty") {
        if (left.type === "divider") {
          styleDividerCells(dataRow, 1, left.text, hasRightColumn ? 8 : 3);
        } else {
          styleItemCells(dataRow, 1, left.item);
        }
      }

      // Right Column (Cols 6-9)
      if (hasRightColumn && right && right.type !== "empty") {
        dataRow.getCell(5).value = "";
        if (right.type === "divider") {
          styleDividerCells(dataRow, 6, right.text, 3);
        } else {
          styleItemCells(dataRow, 6, right.item);
        }
      }
    }
  }

  // Summary Row across bottom of sheet
  const totalRow = worksheet.addRow([]);
  totalRow.height = 24;

  if (!hasRightColumn) {
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
      cell.font = { bold: true, size: 10, name: "Calibri", color: { argb: "FF000000" } };
      cell.alignment = {
        vertical: "middle",
        horizontal: c === 2 ? "right" : "center",
        shrinkToFit: true,
      };
    }
  } else {
    totalRow.getCell(1).value = `TOTAL QUANTITY: ${totalQuantity}`;
    totalRow.getCell(6).value = `TOTAL SKUs: ${items.length} Unique SKUs`;

    worksheet.mergeCells(totalRow.number, 1, totalRow.number, 4);
    worksheet.mergeCells(totalRow.number, 6, totalRow.number, 9);

    [1, 6].forEach((c) => {
      const cell = totalRow.getCell(c);
      cell.border = {
        top: { style: "thin", color: { argb: "FF000000" } },
        bottom: { style: "double", color: { argb: "FF000000" } },
      };
      cell.font = { bold: true, size: 10, name: "Calibri", color: { argb: "FF000000" } };
      cell.alignment = { vertical: "middle", horizontal: "center" };
    });
  }

  // Time and Signature Fields at the bottom
  worksheet.addRow([]).height = 20; // spacer

  const signRow = worksheet.addRow([]);
  signRow.height = 30;

  if (!hasRightColumn) {
    signRow.getCell(1).value = "Time: _______________________";
    worksheet.mergeCells(signRow.number, 1, signRow.number, 2);
    signRow.getCell(1).font = { bold: true, size: 11, name: "Calibri" };
    signRow.getCell(1).alignment = { vertical: "bottom", horizontal: "center" };

    signRow.getCell(3).value = "Signature: _______________________";
    worksheet.mergeCells(signRow.number, 3, signRow.number, 4);
    signRow.getCell(3).font = { bold: true, size: 11, name: "Calibri" };
    signRow.getCell(3).alignment = { vertical: "bottom", horizontal: "center" };
  } else {
    signRow.getCell(1).value = "Time: _______________________";
    worksheet.mergeCells(signRow.number, 1, signRow.number, 4);
    signRow.getCell(1).font = { bold: true, size: 11, name: "Calibri" };
    signRow.getCell(1).alignment = { vertical: "bottom", horizontal: "center" };

    signRow.getCell(6).value = "Signature: _______________________";
    worksheet.mergeCells(signRow.number, 6, signRow.number, 9);
    signRow.getCell(6).font = { bold: true, size: 11, name: "Calibri" };
    signRow.getCell(6).alignment = { vertical: "bottom", horizontal: "center" };
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
    const singleRackWidth = Math.min(Math.max(maxRackLen + 3, 16), 26);
    const singleSkuWidth = Math.min(Math.max(maxSkuLen + 3, 30), 55);

    worksheet.getColumn(1).width = singleRackWidth;
    worksheet.getColumn(2).width = singleSkuWidth;
    worksheet.getColumn(3).width = 10;
    worksheet.getColumn(4).width = Math.max(barcodeColWidth, 20);
  } else {
    const rackWidth = Math.min(Math.max(maxRackLen + 1, 8), 12);
    const skuWidth = Math.min(Math.max(maxSkuLen + 1, 20), 28);
    const qtyWidth = 6;
    const barcodeW = 10;

    worksheet.getColumn(1).width = rackWidth;
    worksheet.getColumn(2).width = skuWidth;
    worksheet.getColumn(3).width = qtyWidth;
    worksheet.getColumn(4).width = barcodeW;
    worksheet.getColumn(5).width = 2; // Spacer
    worksheet.getColumn(6).width = rackWidth;
    worksheet.getColumn(7).width = skuWidth;
    worksheet.getColumn(8).width = qtyWidth;
    worksheet.getColumn(9).width = barcodeW;
  }
};

/**
 * Download Flipkart Picklist in styled Excel (.xlsx) format matching Amazon Order Process
 */
export const downloadFlipkartPicklistExcel = async (
  picklist: FlipkartPicklistResult,
  batchName?: string
) => {
  const workbook = new ExcelJS.Workbook();
  const now = new Date();
  const picklistNo = `PL${Date.now()}`;

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

  const sheet1 = workbook.addWorksheet("Flipkart Picklist");
  sheet1.views = [{ state: "normal", activeCell: "A1" }];
  populatePicklistWorksheet(
    sheet1,
    picklist.items,
    picklist.totalQuantity,
    "No items found in this picklist"
  );

  // Sheet 2: Only items where Generate Barcode === "Yes"
  const barcodeYesItems = picklist.items.filter((item) => item.generateBarcode === "Yes");
  const barcodeYesTotalQty = barcodeYesItems.reduce((acc, item) => acc + item.quantity, 0);

  const sheet2 = workbook.addWorksheet("Barcode Yes");
  sheet2.views = [{ state: "normal", activeCell: "A1" }];
  populatePicklistWorksheet(
    sheet2,
    barcodeYesItems,
    barcodeYesTotalQty,
    "No Barcode Yes items found in this batch",
    true // forceSingleColumn for Barcode Yes sheet
  );

  const buffer = await workbook.xlsx.writeBuffer();
  const fileName = `Flipkart_Picklist_${picklistNo}_${now.toISOString().slice(0, 10)}.xlsx`;

  saveAs(
    new Blob([buffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    }),
    fileName
  );
};

/**
 * Download Flipkart Picklist in styled PDF format (matching columns: Rack, SKU, Qty)
 */
export const downloadFlipkartPicklistPDF = (
  picklist: FlipkartPicklistResult,
  batchName?: string
) => {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const now = new Date();
  const picklistNo = `PL${Date.now()}`;

  // Header Banner
  doc.setFillColor(10, 14, 26);
  doc.rect(10, 10, 190, 16, "F");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.setTextColor(232, 193, 109);
  doc.text("FLIPKART WAREHOUSE DISPATCH PICKLIST", 105, 20, { align: "center" });

  // Subheader Info
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(71, 85, 105);
  doc.text(
    `Picklist #: ${picklistNo}  |  Batch: ${batchName || "Flipkart"}  |  Generated: ${now.toLocaleString("en-IN")}`,
    10,
    32
  );
  doc.setFont("helvetica", "bold");
  doc.setTextColor(10, 14, 26);
  doc.text(
    `Unique SKUs: ${picklist.items.length}  |  Total Quantity: ${picklist.totalQuantity}`,
    200,
    32,
    { align: "right" }
  );

  const tableBody = picklist.items.map((item, idx) => [
    idx + 1,
    item.rackAddress || "—",
    item.sku,
    item.quantity,
    item.generateBarcode || "No",
    "[   ]",
  ]);

  autoTable(doc, {
    startY: 36,
    head: [["#", "Rack", "SKU ID", "Qty", "Gen Barcode", "Picked"]],
    body: tableBody,
    theme: "striped",
    headStyles: {
      fillColor: [232, 193, 109],
      textColor: [10, 14, 26],
      fontStyle: "bold",
      fontSize: 8.5,
    },
    styles: {
      fontSize: 8,
      cellPadding: 2,
    },
    columnStyles: {
      0: { cellWidth: 10, halign: "center" },
      1: { cellWidth: 30, halign: "center", fontStyle: "bold" },
      2: { cellWidth: 85, fontStyle: "bold" },
      3: { cellWidth: 18, halign: "center", fontStyle: "bold" },
      4: { cellWidth: 25, halign: "center" },
      5: { cellWidth: 22, halign: "center" },
    },
    didParseCell: (data) => {
      if (data.section === "body" && data.column.index === 4) {
        if (data.cell.raw === "Yes") {
          data.cell.styles.fontStyle = "bold";
          data.cell.styles.textColor = [16, 185, 129];
        } else {
          data.cell.styles.textColor = [100, 116, 139];
        }
      }
    },
    margin: { left: 10, right: 10 },
  });

  const fileName = `Flipkart_Picklist_${picklistNo}_${now.toISOString().slice(0, 10)}.pdf`;
  doc.save(fileName);
};

export const openFlipkartPicklistPDF = (
  picklist: FlipkartPicklistResult,
  batchName?: string
) => {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const now = new Date();
  const picklistNo = `PL${Date.now()}`;

  // Header Banner
  doc.setFillColor(10, 14, 26);
  doc.rect(10, 10, 190, 16, "F");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.setTextColor(232, 193, 109);
  doc.text("FLIPKART WAREHOUSE DISPATCH PICKLIST", 105, 20, { align: "center" });

  // Subheader Info
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(71, 85, 105);
  doc.text(
    `Picklist #: ${picklistNo}  |  Batch: ${batchName || "Flipkart"}  |  Generated: ${now.toLocaleString("en-IN")}`,
    10,
    32
  );
  doc.setFont("helvetica", "bold");
  doc.setTextColor(10, 14, 26);
  doc.text(
    `Unique SKUs: ${picklist.items.length}  |  Total Quantity: ${picklist.totalQuantity}`,
    200,
    32,
    { align: "right" }
  );

  const tableBody = picklist.items.map((item, idx) => [
    idx + 1,
    item.rackAddress || "—",
    item.sku,
    item.quantity,
    item.generateBarcode || "No",
    "[   ]",
  ]);

  autoTable(doc, {
    startY: 36,
    head: [["#", "Rack", "SKU ID", "Qty", "Gen Barcode", "Picked"]],
    body: tableBody,
    theme: "striped",
    headStyles: {
      fillColor: [232, 193, 109],
      textColor: [10, 14, 26],
      fontStyle: "bold",
      fontSize: 8.5,
    },
    styles: {
      fontSize: 8,
      cellPadding: 2,
    },
    columnStyles: {
      0: { cellWidth: 10, halign: "center" },
      1: { cellWidth: 30, halign: "center", fontStyle: "bold" },
      2: { cellWidth: 85, fontStyle: "bold" },
      3: { cellWidth: 18, halign: "center", fontStyle: "bold" },
      4: { cellWidth: 25, halign: "center" },
      5: { cellWidth: 22, halign: "center" },
    },
    didParseCell: (data) => {
      if (data.section === "body" && data.column.index === 4) {
        if (data.cell.raw === "Yes") {
          data.cell.styles.fontStyle = "bold";
          data.cell.styles.textColor = [16, 185, 129];
        } else {
          data.cell.styles.textColor = [100, 116, 139];
        }
      }
    },
    margin: { left: 10, right: 10 },
  });

  const blob = doc.output("blob");
  const url = URL.createObjectURL(blob);
  window.open(url, "_blank");
  setTimeout(() => URL.revokeObjectURL(url), 60000);
};

export const openFlipkartPicklistTab = (
  picklist: FlipkartPicklistResult,
  batchName?: string
) => {
  const now = new Date();
  const picklistNo = `PL${Date.now()}`;
  const formattedDate = now.toLocaleString("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  });

  const MAX_ROWS_PER_COLUMN = 52;
  const hasRightColumn = picklist.items.length > MAX_ROWS_PER_COLUMN;
  const ITEMS_PER_PAGE = hasRightColumn ? MAX_ROWS_PER_COLUMN * 2 : MAX_ROWS_PER_COLUMN;
  const totalPages = Math.max(1, Math.ceil(picklist.items.length / ITEMS_PER_PAGE));

  const renderTableRows = (items: FlipkartPicklistItem[]) =>
    items
      .map(
        (item) => `
      <tr>
        <td style="text-align: center; font-weight: 700; color: #1e293b;">${item.rackAddress || "—"}</td>
        <td style="text-align: left; font-weight: bold; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: ${hasRightColumn ? "125px" : "290px"};">${item.sku}</td>
        <td style="text-align: center; font-weight: bold;">${item.quantity}</td>
        <td style="text-align: center; ${item.generateBarcode === "Yes" ? "font-weight: bold; color: #16a34a;" : "color: #64748b;"}">${item.generateBarcode || "No"}</td>
        <td style="text-align: center; color: #94a3b8;">[ &nbsp; ]</td>
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
          <div class="sheet-title">Flipkart Picklist (${picklistNo})</div>
          <div class="sheet-meta">Batch: ${batchName || "Flipkart"} &bull; Generated: ${formattedDate} &bull; ${picklist.items.length} SKUs (${picklist.totalQuantity} Units) &bull; Page ${pageIdx + 1} of ${totalPages}</div>
        </div>
        <div class="sheet-actions">
          <button class="btn btn-print" onclick="window.print()">Print A4 Picklist</button>
        </div>
      </div>

      ${hasRightColumn
        ? `<div class="two-column-layout">
              <div class="table-col">
                <table>
                  <thead>
                    <tr>
                      <th style="width: 20%;">Rack</th>
                      <th style="width: 44%; text-align: left;">SKU</th>
                      <th style="width: 10%;">Qty</th>
                      <th style="width: 14%;">Barcode</th>
                      <th style="width: 12%;">Check</th>
                    </tr>
                  </thead>
                  <tbody>${renderTableRows(leftItems)}</tbody>
                </table>
              </div>
              <div class="table-col">
                <table>
                  <thead>
                    <tr>
                      <th style="width: 20%;">Rack</th>
                      <th style="width: 44%; text-align: left;">SKU</th>
                      <th style="width: 10%;">Qty</th>
                      <th style="width: 14%;">Barcode</th>
                      <th style="width: 12%;">Check</th>
                    </tr>
                  </thead>
                  <tbody>${renderTableRows(rightItems)}</tbody>
                </table>
              </div>
            </div>`
        : `<table>
              <thead>
                <tr>
                  <th style="width: 18%;">Rack</th>
                  <th style="width: 48%; text-align: left;">SKU</th>
                  <th style="width: 10%;">Qty</th>
                  <th style="width: 13%;">Barcode</th>
                  <th style="width: 11%;">Check</th>
                </tr>
              </thead>
              <tbody>${renderTableRows(leftItems)}</tbody>
            </table>`
      }
    </div>`;
  }

  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Flipkart Picklist - ${picklistNo}</title>
  <style>
    @page { size: A4 portrait; margin: 6mm; }
    * { box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; margin: 0; background: #e2e8f0; color: #0f172a; font-size: 11px; }
    .a4-page { width: 198mm; min-height: 285mm; background: #fff; margin: 10mm auto; padding: 6mm; box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1); page-break-after: always; display: flex; flex-direction: column; }
    .sheet-header { display: flex; justify-content: space-between; align-items: flex-start; padding-bottom: 5px; margin-bottom: 6px; border-bottom: 2px solid #0f172a; }
    .sheet-title { font-size: 15px; font-weight: 800; color: #0f172a; text-transform: uppercase; }
    .sheet-meta { font-size: 9px; color: #64748b; margin-top: 2px; }
    .sheet-actions { display: flex; gap: 8px; }
    .btn { padding: 4px 10px; font-size: 10px; font-weight: 700; border-radius: 4px; border: 1px solid #cbd5e1; cursor: pointer; background: #f8fafc; }
    .btn-print { background: #0f172a; color: #fff; border-color: #0f172a; }
    .two-column-layout { display: flex; gap: 6mm; flex: 1; }
    .table-col { flex: 1; }
    table { width: 100%; border-collapse: collapse; font-size: 10px; }
    th { background: #0f172a; color: #fff; font-weight: 700; text-align: center; padding: 3px 4px; font-size: 9px; }
    td { padding: 2px 4px; border-bottom: 1px solid #e2e8f0; font-size: 9.5px; }
    tr:nth-child(even) { background: #f8fafc; }
    @media print {
      body { background: #fff; margin: 0; }
      .a4-page { margin: 0 auto; box-shadow: none; width: 100%; min-height: auto; padding: 4mm; }
      .sheet-actions { display: none !important; }
    }
  </style>
</head>
<body>
  ${pagesHtml}
</body>
</html>`;

  const blob = new Blob([html], { type: "text/html;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  window.open(url, "_blank");
  setTimeout(() => URL.revokeObjectURL(url), 60000);
};
