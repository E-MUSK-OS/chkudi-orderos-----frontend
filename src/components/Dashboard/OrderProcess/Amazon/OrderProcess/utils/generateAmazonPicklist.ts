import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { AmazonComparisonResult } from "../types";

export interface PicklistItem {
  sku: string;
  rackAddress: string;
  generateBarcode: string;
  quantity: number;
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

  const skuMap = new Map<string, number>();
  let totalQuantity = 0;

  selectedOrders.forEach((item) => {
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

  const items: PicklistItem[] = Array.from(skuMap.entries()).map(
    ([sku, quantity]) => {
      const normSku = sku.toUpperCase();
      const details = skuDetailsMap?.get(normSku) || skuDetailsMap?.get(sku);

      const rawBarcode = details?.generateBarcode?.trim().toUpperCase() || "";
      const isBarcodeYes =
        rawBarcode === "YES" ||
        rawBarcode === "Y" ||
        rawBarcode === "TRUE" ||
        rawBarcode === "1";
      const generateBarcode = isBarcodeYes ? "Yes" : "No";

      return {
        sku,
        rackAddress: details?.rackAddress?.trim() || "--",
        generateBarcode,
        quantity,
      };
    }
  );

  const normalizeRackAddress = (rack?: string | null): string => {
    if (!rack) return "";
    const trimmed = rack.trim().toUpperCase();
    if (trimmed === "--" || trimmed === "-" || trimmed === "N/A" || trimmed === "NA") {
      return "";
    }
    return trimmed;
  };

  items.sort((a, b) => {
    const rackA = normalizeRackAddress(a.rackAddress);
    const rackB = normalizeRackAddress(b.rackAddress);

    // Both have valid rack addresses -> natural alphanumeric sort (A1, A2, ..., B1, ...)
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

    // Items with assigned rack addresses come first ("pela A1, A2, ...")
    if (rackA && !rackB) return -1;
    if (!rackA && rackB) return 1;

    // Both unassigned ("--") -> sort by SKU
    return a.sku.localeCompare(b.sku, undefined, {
      numeric: true,
      sensitivity: "base",
    });
  });

  return {
    items,
    totalQuantity,
  };
};

export const downloadAmazonPicklistPDF = (picklist: PicklistResult) => {
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

  const fileName = `Amazon_Picklist_${picklistNo}_${now.toISOString().slice(0, 10)}.pdf`;
  const blob = doc.output("blob");
  const blobUrl = URL.createObjectURL(blob);
  window.open(blobUrl, "_blank");
  doc.save(fileName);
  setTimeout(() => URL.revokeObjectURL(blobUrl), 60000);
};
