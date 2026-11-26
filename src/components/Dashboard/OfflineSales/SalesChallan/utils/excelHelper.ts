import * as XLSX from "xlsx";
import { SalesChallan, SalesChallanItem } from "../types/challan.types";

export const downloadChallansExcel = (challans: SalesChallan[]) => {
  const data = (challans || []).map((ch, idx) => ({
    "No.": idx + 1,
    "Party Name": ch.partyName,
    "Challan No": ch.challanNo,
    "Challan Ref.No": ch.challanRefNo || "-",
    Date: ch.challanDate ? new Date(ch.challanDate).toLocaleDateString("en-IN") : "-",
    "Contact No": ch.contactNo || "-",
    Quantity: Number(ch.totalQuantity) || 0,
    "Prepared By": ch.preparedBy || "-",
    "Challan For": ch.challanFor,
    "Stock Out": ch.stockOutFrom,
    "Invoice Status": ch.invoiceStatus,
  }));

  const headers = [
    "No.",
    "Party Name",
    "Challan No",
    "Challan Ref.No",
    "Date",
    "Contact No",
    "Quantity",
    "Prepared By",
    "Challan For",
    "Stock Out",
    "Invoice Status",
  ];

  const worksheet =
    data.length > 0
      ? XLSX.utils.json_to_sheet(data)
      : XLSX.utils.aoa_to_sheet([headers]);

  worksheet["!cols"] = [
    { wch: 8 },
    { wch: 28 },
    { wch: 16 },
    { wch: 16 },
    { wch: 14 },
    { wch: 16 },
    { wch: 12 },
    { wch: 16 },
    { wch: 16 },
    { wch: 16 },
    { wch: 16 },
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Sales Challans");
  XLSX.writeFile(workbook, `sales_challans_${Date.now()}.xlsx`);
};

export const downloadSkuWiseExcel = (challans: SalesChallan[]) => {
  const rows: any[] = [];
  (challans || []).forEach((ch) => {
    (ch.items || []).forEach((item) => {
      rows.push({
        "Challan No": ch.challanNo,
        Date: ch.challanDate ? new Date(ch.challanDate).toLocaleDateString("en-IN") : "-",
        "Party Name": ch.partyName,
        "Item No": item.itemNo,
        "Product SKU": item.sku,
        "Product Name": item.name,
        Quantity: Number(item.quantity) || 1,
        Rate: Number(item.rate) || 0,
        Amount: (Number(item.quantity) || 1) * (Number(item.rate) || 0),
        "Dis.Date": item.dispatchDate || "-",
        "Sub C.N": item.subCn || "-",
        Remarks: item.remarks || "-",
      });
    });
  });

  const headers = [
    "Challan No",
    "Date",
    "Party Name",
    "Item No",
    "Product SKU",
    "Product Name",
    "Quantity",
    "Rate",
    "Amount",
    "Dis.Date",
    "Sub C.N",
    "Remarks",
  ];

  const worksheet =
    rows.length > 0
      ? XLSX.utils.json_to_sheet(rows)
      : XLSX.utils.aoa_to_sheet([headers]);

  worksheet["!cols"] = [
    { wch: 16 },
    { wch: 14 },
    { wch: 26 },
    { wch: 10 },
    { wch: 22 },
    { wch: 28 },
    { wch: 12 },
    { wch: 12 },
    { wch: 14 },
    { wch: 12 },
    { wch: 14 },
    { wch: 24 },
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "SKU Wise Challans");
  XLSX.writeFile(workbook, `sales_challans_sku_wise_${Date.now()}.xlsx`);
};

export const downloadBlankExcelFormat = () => {
  const headers = [
    [
      "Particulars [SKU]",
      "Particulars [Name]",
      "Quantity",
      "Rate",
      "Dis.Date",
      "Sub C.N",
      "Remarks",
    ],
  ];

  const worksheet = XLSX.utils.aoa_to_sheet(headers);

  // Set friendly column widths
  worksheet["!cols"] = [
    { wch: 22 }, // Particulars [SKU]
    { wch: 28 }, // Particulars [Name]
    { wch: 12 }, // Quantity
    { wch: 12 }, // Rate
    { wch: 12 }, // Dis.Date
    { wch: 14 }, // Sub C.N
    { wch: 24 }, // Remarks
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Template");
  XLSX.writeFile(workbook, "challan_items_blank_format.xlsx");
};

export const parseChallanItemsFromExcel = async (
  file: File
): Promise<SalesChallanItem[]> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: "array" });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const json: any[] = XLSX.utils.sheet_to_json(sheet);

        const items: SalesChallanItem[] = json.map((row, idx) => {
          const sku =
            row["Particulars [SKU]"] ||
            row["SKU"] ||
            row["Product SKU"] ||
            row["sku"] ||
            "";
          const name =
            row["Particulars [Name]"] ||
            row["Name"] ||
            row["Product Name"] ||
            row["name"] ||
            sku;
          const quantity =
            Number(row["Quantity"] || row["Qty"] || row["quantity"]) || 1;
          const rate = Number(row["Rate"] || row["rate"] || row["Price"]) || 0;
          const dispatchDate = String(row["Dis.Date"] || row["DisDate"] || "1");
          const subCn = String(row["Sub C.N"] || row["SubCN"] || "");
          const remarks = String(row["Remarks"] || row["remarks"] || "");

          return {
            itemNo: idx + 1,
            sku: String(sku).trim(),
            name: String(name).trim(),
            quantity,
            rate,
            amount: quantity * rate,
            dispatchDate,
            subCn,
            remarks,
            printBarcode: true,
          };
        }).filter((item) => item.sku);

        resolve(items);
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = (err) => reject(err);
    reader.readAsArrayBuffer(file);
  });
};
