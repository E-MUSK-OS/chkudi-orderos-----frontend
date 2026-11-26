import * as XLSX from "xlsx";
import { PurchaseChallan, PurchaseChallanItem } from "../types/purchaseChallan.types";

export const downloadPurchaseChallansExcel = (challans: PurchaseChallan[]) => {
  const data = (challans || []).map((ch, idx) => ({
    "No.": idx + 1,
    Date: ch.challanDate ? new Date(ch.challanDate).toLocaleDateString("en-IN") : "-",
    "Challan No": ch.challanNo,
    "Lot No":
      ch.lotNo ||
      Array.from(
        new Set(
          (ch.items || [])
            .map((it) => it.lotNo?.trim())
            .filter((no): no is string => Boolean(no && no.length > 0))
        )
      ).join(", ") ||
      "-",
    "Party Challan No":
      ch.partyChallanNo ||
      Array.from(
        new Set(
          (ch.items || [])
            .map((it) => it.partyChallanNo?.trim())
            .filter((no): no is string => Boolean(no && no.length > 0))
        )
      ).join(", ") ||
      "-",
    "Party Name": ch.supplierName,
    "Contact No": ch.contactNo || "-",
    "Ordered Qty": Number(ch.totalOrderedQty) || 0,
    "Received Qty": Number(ch.totalReceivedQty) || 0,
    "Prepared By": ch.preparedBy || "-",
    "Challan For": ch.challanFor,
    "Stock In": ch.stockIn,
    "Courier Partner": ch.courierPartner || "-",
    "LR No": ch.lrNo || "-",
    "Invoice Status": ch.invoiceStatus,
  }));

  const headers = [
    "No.",
    "Date",
    "Challan No",
    "Lot No",
    "Party Challan No",
    "Party Name",
    "Contact No",
    "Ordered Qty",
    "Received Qty",
    "Prepared By",
    "Challan For",
    "Stock In",
    "Courier Partner",
    "LR No",
    "Invoice Status",
  ];

  const worksheet =
    data.length > 0
      ? XLSX.utils.json_to_sheet(data)
      : XLSX.utils.aoa_to_sheet([headers]);

  worksheet["!cols"] = [
    { wch: 8 },
    { wch: 14 },
    { wch: 16 },
    { wch: 16 },
    { wch: 18 },
    { wch: 26 },
    { wch: 16 },
    { wch: 14 },
    { wch: 14 },
    { wch: 16 },
    { wch: 16 },
    { wch: 16 },
    { wch: 18 },
    { wch: 14 },
    { wch: 16 },
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Purchase Challans");
  XLSX.writeFile(workbook, `purchase_challans_${Date.now()}.xlsx`);
};

export const downloadPurchaseSkuWiseExcel = (challans: PurchaseChallan[]) => {
  const rows: any[] = [];
  (challans || []).forEach((ch) => {
    (ch.items || []).forEach((item) => {
      rows.push({
        "Challan No": ch.challanNo,
        Date: ch.challanDate ? new Date(ch.challanDate).toLocaleDateString("en-IN") : "-",
        "Lot No": item.lotNo || ch.lotNo || "-",
        "Party Challan No": item.partyChallanNo || ch.partyChallanNo || "-",
        "Party Name": ch.supplierName,
        "Stock In Godown": ch.stockIn,
        "Item No": item.itemNo,
        "Product SKU": item.sku,
        "Particulars Name": item.name,
        "Ord.Qty": Number(item.orderedQty) || 0,
        "Rec.Qty": Number(item.receivedQty) || 0,
        Rate: Number(item.rate) || 0,
        Amount: (Number(item.receivedQty) || 0) * (Number(item.rate) || 0),
        "PO No": item.poNo || "-",
        "Rec.Date": item.receivedDate || "-",
        Remarks: item.remarks || "-",
      });
    });
  });

  const headers = [
    "Challan No",
    "Date",
    "Lot No",
    "Party Challan No",
    "Party Name",
    "Stock In Godown",
    "Item No",
    "Product SKU",
    "Particulars Name",
    "Ord.Qty",
    "Rec.Qty",
    "Rate",
    "Amount",
    "PO No",
    "Rec.Date",
    "Remarks",
  ];

  const worksheet =
    rows.length > 0
      ? XLSX.utils.json_to_sheet(rows)
      : XLSX.utils.aoa_to_sheet([headers]);

  worksheet["!cols"] = [
    { wch: 16 },
    { wch: 14 },
    { wch: 16 },
    { wch: 18 },
    { wch: 26 },
    { wch: 18 },
    { wch: 10 },
    { wch: 22 },
    { wch: 28 },
    { wch: 12 },
    { wch: 12 },
    { wch: 12 },
    { wch: 14 },
    { wch: 16 },
    { wch: 14 },
    { wch: 20 },
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "SKU Wise Purchase");
  XLSX.writeFile(workbook, `purchase_challans_sku_wise_${Date.now()}.xlsx`);
};

export const downloadPurchaseBlankFormatExcel = () => {
  const headers = [
    [
      "Particulars [SKU]",
      "Lot No",
      "Particulars [Name]",
      "Ord.Qty",
      "Rec.Qty",
      "Rate",
      "PO No",
      "Challan No",
      "Rec.Date",
      "Remarks",
    ],
  ];

  const worksheet = XLSX.utils.aoa_to_sheet(headers);

  worksheet["!cols"] = [
    { wch: 22 }, // Particulars [SKU]
    { wch: 18 }, // Lot No
    { wch: 30 }, // Particulars [Name]
    { wch: 12 }, // Ord.Qty
    { wch: 12 }, // Rec.Qty
    { wch: 12 }, // Rate
    { wch: 16 }, // PO No
    { wch: 18 }, // Challan No
    { wch: 14 }, // Rec.Date
    { wch: 24 }, // Remarks
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Inward Template");
  XLSX.writeFile(workbook, "purchase_challan_template.xlsx");
};

export const parsePurchaseItemsFromExcel = async (
  file: File
): Promise<PurchaseChallanItem[]> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: "array" });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const json: any[] = XLSX.utils.sheet_to_json(sheet);

        const items: PurchaseChallanItem[] = json.map((row, idx) => {
          const sku =
            row["Particulars [SKU]"] ||
            row["SKU"] ||
            row["Product SKU"] ||
            row["sku"] ||
            "";
          const lotNo =
            row["Lot No"] ||
            row["Lot No."] ||
            row["Lot"] ||
            row["lotNo"] ||
            "";
          const name =
            row["Particulars [Name]"] ||
            row["Product Name"] ||
            row["Name"] ||
            row["name"] ||
            "";
          const orderedQty =
            Number(
              row["Ord.Qty"] ||
              row["Ordered Qty"] ||
              row["Order Qty"] ||
              row["orderedQty"]
            ) || 0;
          const receivedQty =
            Number(
              row["Rec.Qty"] ||
              row["Received Qty"] ||
              row["Quantity"] ||
              row["Qty"] ||
              row["receivedQty"]
            ) || 0;
          const rate =
            Number(row["Rate"] || row["Price"] || row["rate"] || 0) || 0;
          const poNo =
            row["PO No"] || row["PO.No"] || row["PO Number"] || row["poNo"] || "";
          const partyChallanNo =
            row["Challan No"] || row["Party Challan No"] || row["partyChallanNo"] || "";
          const receivedDate =
            row["Rec.Date"] || row["Received Date"] || row["receivedDate"] || "";
          const remarks = row["Remarks"] || row["remarks"] || "";

          return {
            itemNo: idx + 1,
            sku: String(sku).trim(),
            lotNo: lotNo ? String(lotNo).trim() : undefined,
            name: String(name).trim(),
            orderedQty,
            receivedQty,
            rate,
            amount: receivedQty * rate,
            poNo: poNo ? String(poNo).trim() : undefined,
            partyChallanNo: partyChallanNo ? String(partyChallanNo).trim() : undefined,
            receivedDate: receivedDate ? String(receivedDate).trim() : undefined,
            remarks: remarks ? String(remarks).trim() : undefined,
            printBarcode: true,
          };
        }).filter((it) => it.sku.length > 0);

        resolve(items);
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = (err) => reject(err);
    reader.readAsArrayBuffer(file);
  });
};
