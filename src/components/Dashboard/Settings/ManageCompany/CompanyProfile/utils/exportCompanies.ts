import { Company } from "../types/company.types";

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
 * Export companies list to downloadable CSV
 */
export function exportCompaniesToCsv(companies: Company[]): void {
  const headers = [
    "Code",
    "Company Name",
    "Owner Name",
    "GSTIN",
    "PAN Number",
    "Status",
    "Email",
    "Phone",
    "Date of Registration",
    "Address Line 1",
    "Address Line 2",
    "City",
    "State",
    "State Code",
    "Pincode",
    "Bank Name",
    "Bank Account No",
    "IFSC Code",
    "Branch Name",
  ];

  const rows = companies.map((c) => [
    c.companyCode || "",
    escapeCsv(c.companyName || ""),
    escapeCsv(c.ownerName || ""),
    escapeCsv(c.gstNumber || ""),
    escapeCsv(c.panNumber || ""),
    c.status || "ACTIVE",
    escapeCsv(c.email || ""),
    escapeCsv(c.phone || ""),
    formatDate(c.registrationDate || c.createdAt),
    escapeCsv(c.addressLine1 || ""),
    escapeCsv(c.addressLine2 || ""),
    escapeCsv(c.city || ""),
    escapeCsv(c.state || ""),
    escapeCsv(c.stateCode || ""),
    escapeCsv(c.pincode || ""),
    escapeCsv(c.bankName || ""),
    escapeCsv(c.accountNumber || ""),
    escapeCsv(c.ifscCode || ""),
    escapeCsv(c.branchName || ""),
  ]);

  const csvContent =
    "data:text/csv;charset=utf-8,\uFEFF" +
    [headers.join(","), ...rows.map((r) => r.join(","))].join("\r\n");

  const encodedUri = encodeURI(csvContent);
  const link = document.createElement("a");
  const dateStr = new Date().toISOString().split("T")[0];
  link.setAttribute("href", encodedUri);
  link.setAttribute("download", `OrderOS_Companies_Listing_${dateStr}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
