import ExcelJS from "exceljs";
import { saveAs } from "file-saver";
import { toast } from "sonner";

/**
 * Generates and downloads a demo Excel sheet styled
 * according to the OrderOS brand theme:
 * - Columns: Operator Name, Day (Sunday to Saturday), Seller SKU, Amazon Product URL
 * - Header: Deep Navy (#0A0E1A) with Signature Gold (#E8C16D) typography
 * - Bottom Accent: Rich Amber Gold (#B88728) border
 * - Data Rows: Subtle cream zebra striping (#FFFDF7 / #FFFFFF) with warm borders (#E7E0D2)
 * - Data Validation: Dropdown list on Day column for Sunday to Saturday
 */
export async function downloadAmazonAnalyticsDemoSheet() {
  try {
    const workbook = new ExcelJS.Workbook();
    workbook.creator = "OrderOS";
    workbook.created = new Date();

    const worksheet = workbook.addWorksheet("Amazon Analytics", {
      views: [{ showGridLines: true, activeCell: "A2" }],
      pageSetup: {
        paperSize: 9, // A4
        orientation: "landscape",
        fitToPage: true,
        fitToWidth: 1,
        fitToHeight: 0,
      },
    });

    // Configure 4 columns:
    // 1. Operator Name
    // 2. Day (Sunday to Saturday)
    // 3. Seller SKU
    // 4. Amazon Product URL
    worksheet.columns = [
      { header: "Operator Name", key: "operatorName", width: 24 },
      { header: "Day", key: "day", width: 18 },
      { header: "Seller SKU", key: "sku", width: 28 },
      { header: "Amazon Product URL", key: "url", width: 68 },
    ];

    // Style Header Row (Row 1) with OrderOS signature dark navy & gold
    const headerRow = worksheet.getRow(1);
    headerRow.height = 32;
    headerRow.eachCell((cell) => {
      cell.font = {
        name: "Calibri",
        size: 11,
        bold: true,
        color: { argb: "FFE8C16D" }, // OrderOS Signature Gold
      };
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FF0A0E1A" }, // OrderOS Dark Navy
      };
      cell.alignment = {
        vertical: "middle",
        horizontal: "center",
      };
      cell.border = {
        top: { style: "thin", color: { argb: "FF263045" } },
        left: { style: "thin", color: { argb: "FF263045" } },
        bottom: { style: "medium", color: { argb: "FFB88728" } }, // Gold bottom accent border
        right: { style: "thin", color: { argb: "FF263045" } },
      };
    });

    // Sample data rows covering Sunday to Saturday
    const sampleRows = [
      {
        operatorName: "Rahul Sharma",
        day: "Sunday",
        sku: "TS-BLK-M",
        url: "https://www.amazon.in/dp/B0DK9HFD2S",
      },
      {
        operatorName: "Amit Patel",
        day: "Monday",
        sku: "JN-BLU-32",
        url: "https://www.amazon.in/dp/B0GGYM3WFR",
      },
      {
        operatorName: "Pooja Verma",
        day: "Tuesday",
        sku: "KT-RED-S",
        url: "https://www.amazon.in/dp/B0GGYDT9KN",
      },
      {
        operatorName: "Vikas Kumar",
        day: "Wednesday",
        sku: "SH-WHT-L",
        url: "https://www.amazon.in/dp/B0H395B1TY",
      },
      {
        operatorName: "Neha Singh",
        day: "Thursday",
        sku: "TR-GRY-34",
        url: "https://www.amazon.in/dp/B0H9YBXF6W",
      },
      {
        operatorName: "Suresh Gupta",
        day: "Friday",
        sku: "DR-BLU-M",
        url: "https://www.amazon.in/dp/B0DK9HFD2S",
      },
      {
        operatorName: "Priya Sharma",
        day: "Saturday",
        sku: "JK-BLK-XL",
        url: "https://www.amazon.in/dp/B0GGYM3WFR",
      },
    ];

    const daysList = '"Sunday,Monday,Tuesday,Wednesday,Thursday,Friday,Saturday"';

    // Add and style sample data rows with theme-based alternating fills & borders
    sampleRows.forEach((item, index) => {
      const row = worksheet.addRow({
        operatorName: item.operatorName,
        day: item.day,
        sku: item.sku,
        url: item.url,
      });
      row.height = 25;

      // Alternating row background: White (#FFFFFF) & Soft Warm Cream (#FFFFFDF7)
      const isEven = index % 2 === 0;
      const rowBgColor = isEven ? "FFFFFFFF" : "FFFFFDF7";

      const commonBorder: Partial<ExcelJS.Borders> = {
        top: { style: "thin", color: { argb: "FFE7E0D2" } },
        left: { style: "thin", color: { argb: "FFE7E0D2" } },
        bottom: { style: "thin", color: { argb: "FFE7E0D2" } },
        right: { style: "thin", color: { argb: "FFE7E0D2" } },
      };

      // Cell 1: Operator Name
      const operatorCell = row.getCell(1);
      operatorCell.font = {
        name: "Calibri",
        size: 10.5,
        bold: false,
        color: { argb: "FF0A0E1A" },
      };
      operatorCell.alignment = {
        vertical: "middle",
        horizontal: "left",
        indent: 1,
      };
      operatorCell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: rowBgColor },
      };
      operatorCell.border = commonBorder;

      // Cell 2: Day (Sunday to Saturday with Data Validation Dropdown)
      const dayCell = row.getCell(2);
      dayCell.font = {
        name: "Calibri",
        size: 10.5,
        bold: true,
        color: { argb: "FF0A0E1A" },
      };
      dayCell.alignment = {
        vertical: "middle",
        horizontal: "center",
      };
      dayCell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: rowBgColor },
      };
      dayCell.border = commonBorder;
      dayCell.dataValidation = {
        type: "list",
        allowBlank: true,
        formulae: [daysList],
        showErrorMessage: true,
        errorTitle: "Invalid Day",
        error: "Please select a valid day (Sunday, Monday, Tuesday, Wednesday, Thursday, Friday, Saturday).",
      };

      // Cell 3: Seller SKU (Bold, Dark Navy)
      const skuCell = row.getCell(3);
      skuCell.font = {
        name: "Calibri",
        size: 10.5,
        bold: true,
        color: { argb: "FF0A0E1A" },
      };
      skuCell.alignment = {
        vertical: "middle",
        horizontal: "left",
        indent: 1,
      };
      skuCell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: rowBgColor },
      };
      skuCell.border = commonBorder;

      // Cell 4: Amazon Product URL (Clickable Hyperlink)
      const urlCell = row.getCell(4);
      urlCell.value = {
        text: item.url,
        hyperlink: item.url,
      };
      urlCell.font = {
        name: "Calibri",
        size: 10,
        color: { argb: "FF0969DA" }, // Clean link blue
        underline: true,
      };
      urlCell.alignment = {
        vertical: "middle",
        horizontal: "left",
        indent: 1,
      };
      urlCell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: rowBgColor },
      };
      urlCell.border = commonBorder;
    });

    // Provide data validation dropdown on the Day column for rows 9 to 100 as well
    for (let rowIdx = sampleRows.length + 2; rowIdx <= 100; rowIdx++) {
      const cell = worksheet.getCell(`B${rowIdx}`);
      cell.dataValidation = {
        type: "list",
        allowBlank: true,
        formulae: [daysList],
        showErrorMessage: true,
        errorTitle: "Invalid Day",
        error: "Please select a valid day (Sunday, Monday, Tuesday, Wednesday, Thursday, Friday, Saturday).",
      };
    }

    const buffer = await workbook.xlsx.writeBuffer();
    saveAs(
      new Blob([buffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      }),
      "amazon-analytics-demo-sheet.xlsx"
    );

    toast.success("Amazon Analytics demo sheet downloaded successfully!");
  } catch (error) {
    console.error("Failed to generate Amazon Analytics demo sheet:", error);
    toast.error("Failed to download demo sheet");
  }
}
