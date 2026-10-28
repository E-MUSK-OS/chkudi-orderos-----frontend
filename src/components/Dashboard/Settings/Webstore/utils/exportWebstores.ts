import { Webstore } from "../types/webstore.types";

/**
 * Clean string for CSV escaping
 */
function escapeCsv(val: any): string {
  if (val === null || val === undefined) return "";
  const str = String(val);
  if (str.includes(",") || str.includes('"') || str.includes("\n") || str.includes("\r")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

/**
 * Format ISO date string into DD/MM/YYYY
 */
function formatDate(dateStr?: string | null): string {
  if (!dateStr) return "-";
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return "-";
    return d.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  } catch {
    return "-";
  }
}

/**
 * Export webstores list to downloadable CSV
 */
export function exportWebstoresToCsv(stores: Webstore[]): void {
  const headers = [
    "Code",
    "Webstore Name",
    "Marketplace Channel",
    "Parent / Child",
    "Company Name (Bill To)",
    "Status",
    "No. of SKUs",
    "Date of Registration",
    "Registered Email",
    "Contact Us Email",
    "Registered Phone",
    "Contact Us Phone",
    "Address 1",
    "Address 2",
    "City",
    "State",
    "Pincode",
    "GST No.",
    "Bank Account",
    "Bank IFSC",
    "Warehouse Code",
  ];

  const rows = stores.map((s) => [
    s.code,
    escapeCsv(s.storeName),
    escapeCsv(s.marketplaceName),
    escapeCsv(s.parentOrChild || "Parent"),
    escapeCsv(s.billTo || ""),
    s.isActive ? "Active" : "Inactive",
    s.skuCount ?? 0,
    formatDate(s.registrationDate),
    escapeCsv(s.registeredEmail || ""),
    escapeCsv(s.contactUsEmail || ""),
    escapeCsv(s.registeredPhone || ""),
    escapeCsv(s.contactUsPhone || ""),
    escapeCsv(s.address1 || ""),
    escapeCsv(s.address2 || ""),
    escapeCsv(s.city || ""),
    escapeCsv(s.state || ""),
    escapeCsv(s.pincode || ""),
    escapeCsv(s.gstNo || ""),
    escapeCsv(s.bankAccount || ""),
    escapeCsv(s.bankIfscCode || ""),
    escapeCsv(s.warehouseCode || ""),
  ]);

  const csvContent =
    "data:text/csv;charset=utf-8,\uFEFF" +
    [headers.join(","), ...rows.map((r) => r.join(","))].join("\r\n");

  const encodedUri = encodeURI(csvContent);
  const link = document.createElement("a");
  const dateStr = new Date().toISOString().split("T")[0];
  link.setAttribute("href", encodedUri);
  link.setAttribute("download", `OrderOS_Webstores_Listing_${dateStr}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
