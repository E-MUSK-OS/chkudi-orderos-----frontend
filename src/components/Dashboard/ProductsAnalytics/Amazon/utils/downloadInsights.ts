import ExcelJS from "exceljs";
import { saveAs } from "file-saver";
import { toast } from "sonner";
import { format, parseISO } from "date-fns";

export interface AnalyticsDownloadItem {
  id: string;
  sku: string;
  url: string;
  operatorName?: string;
  day?: string;
  asin?: string;
  bsrCategory?: string;
  bsrSubcategory?: string;
  rating?: number;
  reviewCount?: number;
  lastScrapedAt?: string;
  createdAt: string;
  history?: any[];
}

interface DownloadInsightsParams {
  data: AnalyticsDownloadItem[];
  selectedDate?: string;
}

/**
 * Generates and downloads an Excel sheet containing comprehensive Amazon Analytics insights
 * styled with the OrderOS brand aesthetic:
 * - Columns: Operator Name, Day, Seller SKU, Associated URL, ASIN, BSR / Rank, Rating & Reviews, Rating, Review Count, Snapshot Date
 * - Header: Deep Navy (#0A0E1A) with Signature Gold (#E8C16D) typography
 * - Bottom Accent: Rich Amber Gold (#B88728) border
 * - Data Rows: Zebra striping with warm borders and clickable hyperlinks
 */
export async function downloadAmazonAnalyticsInsights({
  data,
  selectedDate,
}: DownloadInsightsParams) {
  try {
    if (!data || data.length === 0) {
      toast.error("No analytics data available to download.");
      return;
    }

    const workbook = new ExcelJS.Workbook();
    workbook.creator = "OrderOS";
    workbook.created = new Date();

    const worksheet = workbook.addWorksheet("Amazon Insights", {
      views: [{ showGridLines: true, activeCell: "A2" }],
      pageSetup: {
        paperSize: 9, // A4
        orientation: "landscape",
        fitToPage: true,
        fitToWidth: 1,
        fitToHeight: 0,
      },
    });

    // Configure complete columns matching user requirements
    worksheet.columns = [
      { header: "Operator Name", key: "operatorName", width: 22 },
      { header: "Day", key: "day", width: 16 },
      { header: "Seller SKU", key: "sku", width: 26 },
      { header: "Associated URL", key: "url", width: 55 },
      { header: "ASIN", key: "asin", width: 18 },
      { header: "Category Rank", key: "categoryRank", width: 28 },
      { header: "Product Rank", key: "productRank", width: 28 },
      { header: "Rating & Reviews", key: "ratingReviews", width: 26 },
      { header: "Rating", key: "rating", width: 14 },
      { header: "Review Count", key: "reviewCount", width: 16 },
      { header: "Date", key: "snapshotDate", width: 18 },
    ];

    // Style Header Row (Row 1)
    const headerRow = worksheet.getRow(1);
    headerRow.height = 32;
    headerRow.eachCell((cell) => {
      cell.font = {
        name: "Calibri",
        size: 11,
        bold: true,
        color: { argb: "FFE8C16D" }, // Signature Gold
      };
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FF0A0E1A" }, // Dark Navy
      };
      cell.alignment = {
        vertical: "middle",
        horizontal: "center",
      };
      cell.border = {
        top: { style: "thin", color: { argb: "FF263045" } },
        left: { style: "thin", color: { argb: "FF263045" } },
        bottom: { style: "medium", color: { argb: "FFB88728" } }, // Gold bottom border
        right: { style: "thin", color: { argb: "FF263045" } },
      };
    });

    const formattedDate = selectedDate
      ? (() => {
          try {
            return format(parseISO(selectedDate), "dd MMM yyyy");
          } catch {
            return selectedDate;
          }
        })()
      : "-";

    // Add and style data rows
    data.forEach((item, index) => {
      // Resolve history for the selected date if present, or fallback to current scraped fields
      const historyItem = selectedDate
        ? item.history?.find((h: any) => h.dateString === selectedDate)
        : null;

      const categoryRank = historyItem?.clothingRank || item.bsrCategory || "";
      const subcategoryRank = historyItem?.rank || item.bsrSubcategory || "";
      const rating = historyItem?.rating ?? item.rating;
      const reviews = historyItem?.reviews ?? item.reviewCount;
      const resolvedAsin = historyItem?.asin || item.asin || "-";

      // Build Rating & Reviews combined string
      const rrParts: string[] = [];
      if (rating !== null && rating !== undefined) rrParts.push(`${rating} / 5`);
      if (reviews !== null && reviews !== undefined) rrParts.push(`(${reviews.toLocaleString()} reviews)`);
      const ratingReviews = rrParts.length > 0 ? rrParts.join(" ") : "-";

      const row = worksheet.addRow({
        operatorName: item.operatorName || "-",
        day: item.day || "-",
        sku: item.sku,
        url: item.url || "-",
        asin: resolvedAsin,
        categoryRank: categoryRank || "-",
        productRank: subcategoryRank || "-",
        ratingReviews,
        rating: rating !== null && rating !== undefined ? `${rating} / 5` : "-",
        reviewCount: reviews !== null && reviews !== undefined ? reviews.toLocaleString() : "-",
        snapshotDate: formattedDate,
      });

      row.height = 26;

      // Alternating row background: White (#FFFFFF) & Soft Warm Cream (#FFFFFDF7)
      const isEven = index % 2 === 0;
      const rowBgColor = isEven ? "FFFFFFFF" : "FFFFFDF7";

      const commonBorder: Partial<ExcelJS.Borders> = {
        top: { style: "thin", color: { argb: "FFE7E0D2" } },
        left: { style: "thin", color: { argb: "FFE7E0D2" } },
        bottom: { style: "thin", color: { argb: "FFE7E0D2" } },
        right: { style: "thin", color: { argb: "FFE7E0D2" } },
      };

      // 1. Operator Name
      const operatorCell = row.getCell(1);
      operatorCell.font = { name: "Calibri", size: 10.5, color: { argb: "FF0A0E1A" } };
      operatorCell.alignment = { vertical: "middle", horizontal: "center" };
      operatorCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: rowBgColor } };
      operatorCell.border = commonBorder;

      // 2. Day
      const dayCell = row.getCell(2);
      dayCell.font = { name: "Calibri", size: 10.5, bold: true, color: { argb: "FF0A0E1A" } };
      dayCell.alignment = { vertical: "middle", horizontal: "center" };
      dayCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: rowBgColor } };
      dayCell.border = commonBorder;

      // 3. Seller SKU
      const skuCell = row.getCell(3);
      skuCell.font = { name: "Calibri", size: 10.5, bold: true, color: { argb: "FF0A0E1A" } };
      skuCell.alignment = { vertical: "middle", horizontal: "center" };
      skuCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: rowBgColor } };
      skuCell.border = commonBorder;

      // 4. Associated URL (Clickable Hyperlink)
      const urlCell = row.getCell(4);
      if (item.url) {
        urlCell.value = { text: item.url, hyperlink: item.url };
        urlCell.font = { name: "Calibri", size: 10, color: { argb: "FF0969DA" }, underline: true };
      } else {
        urlCell.value = "-";
        urlCell.font = { name: "Calibri", size: 10, color: { argb: "FF888888" } };
      }
      urlCell.alignment = { vertical: "middle", horizontal: "center" };
      urlCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: rowBgColor } };
      urlCell.border = commonBorder;

      // 5. ASIN
      const asinCell = row.getCell(5);
      asinCell.font = { name: "Calibri", size: 10.5, bold: true, color: { argb: "FF0A0E1A" } };
      asinCell.alignment = { vertical: "middle", horizontal: "center" };
      asinCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: rowBgColor } };
      asinCell.border = commonBorder;

      // 6. Category Rank
      const categoryRankCell = row.getCell(6);
      categoryRankCell.font = { name: "Calibri", size: 10, color: { argb: "FF0A0E1A" } };
      categoryRankCell.alignment = { vertical: "middle", horizontal: "center" };
      categoryRankCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: rowBgColor } };
      categoryRankCell.border = commonBorder;

      // 7. Product Rank
      const productRankCell = row.getCell(7);
      productRankCell.font = { name: "Calibri", size: 10, color: { argb: "FF0A0E1A" } };
      productRankCell.alignment = { vertical: "middle", horizontal: "center" };
      productRankCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: rowBgColor } };
      productRankCell.border = commonBorder;

      // 8. Rating & Reviews
      const rrCell = row.getCell(8);
      rrCell.font = { name: "Calibri", size: 10, bold: true, color: { argb: "FFB88728" } };
      rrCell.alignment = { vertical: "middle", horizontal: "center" };
      rrCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: rowBgColor } };
      rrCell.border = commonBorder;

      // 9. Rating
      const ratingCell = row.getCell(9);
      ratingCell.font = { name: "Calibri", size: 10, color: { argb: "FF0A0E1A" } };
      ratingCell.alignment = { vertical: "middle", horizontal: "center" };
      ratingCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: rowBgColor } };
      ratingCell.border = commonBorder;

      // 10. Review Count
      const reviewCell = row.getCell(10);
      reviewCell.font = { name: "Calibri", size: 10, color: { argb: "FF0A0E1A" } };
      reviewCell.alignment = { vertical: "middle", horizontal: "center" };
      reviewCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: rowBgColor } };
      reviewCell.border = commonBorder;

      // 11. Snapshot Date
      const dateCell = row.getCell(11);
      dateCell.font = { name: "Calibri", size: 10, color: { argb: "FF0A0E1A" } };
      dateCell.alignment = { vertical: "middle", horizontal: "center" };
      dateCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: rowBgColor } };
      dateCell.border = commonBorder;
    });

    const buffer = await workbook.xlsx.writeBuffer();
    const fileName = `amazon-insights-${selectedDate || "all"}.xlsx`;

    saveAs(
      new Blob([buffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      }),
      fileName
    );

    toast.success("Amazon Insights sheet downloaded successfully!");
  } catch (error) {
    console.error("Failed to generate Amazon Analytics insights sheet:", error);
    toast.error("Failed to download insights sheet");
  }
}
