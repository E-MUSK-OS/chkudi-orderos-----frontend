import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import type { Company } from "@/components/Dashboard/Settings/ManageCompany/CompanyProfile/types/company.types";

export interface DocumentPdfItem {
  srNo: number;
  name: string;
  subText?: string;
  hsn?: string;
  qty?: number;
  rate?: number;
  discount?: number;
  taxable?: number;
  sgst?: number;
  cgst?: number;
  igst?: number;
  total: number;
}

export interface DocumentPdfPayload {
  fileName: string;
  documentTitle: string;
  copyLabel?: string;
  docNo: string;
  docDate?: string | null;
  company?: Company | null;
  partySectionTitle: string;
  partyName: string;
  partyAddress?: string;
  partyGstin?: string;
  partyPhone?: string;
  metaRows?: Array<{ label: string; value: string }>;
  items: DocumentPdfItem[];
  totals?: Array<{ label: string; value: number; bold?: boolean }>;
  isChallan?: boolean;
}

function fmtDate(val?: string | null): string {
  if (!val) return "-";
  const d = new Date(val);
  if (Number.isNaN(d.getTime())) return String(val);
  return `${String(d.getDate()).padStart(2, "0")}-${String(d.getMonth() + 1).padStart(2, "0")}-${d.getFullYear()}`;
}

function fmtMoney(n?: number | null): string {
  return Number(n || 0).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export function downloadDocumentPdf(payload: DocumentPdfPayload): void {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const pageW = doc.internal.pageSize.getWidth();
  const margin = 12;
  let y = 14;

  const compName = (payload.company?.companyName || "COMPANY NAME").toUpperCase();
  const compAddr = [
    payload.company?.billingAddress1 || payload.company?.addressLine1,
    payload.company?.billingAddress2 || payload.company?.addressLine2,
    [
      payload.company?.billingCity || payload.company?.city,
      payload.company?.billingState || payload.company?.state,
      payload.company?.billingPincode || payload.company?.pincode,
    ]
      .filter(Boolean)
      .join(", "),
  ].filter(Boolean) as string[];

  // Title & Copy Label
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.setTextColor(15, 23, 42);
  doc.text(payload.documentTitle.toUpperCase(), pageW / 2, y, { align: "center" });
  if (payload.copyLabel) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(100, 116, 139);
    doc.text(payload.copyLabel, pageW - margin, y, { align: "right" });
  }
  y += 8;

  // Company Info (Left) + Doc No/Date (Right)
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10.5);
  doc.setTextColor(15, 23, 42);
  doc.text(compName, margin, y);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(71, 85, 105);
  doc.text(`No. ${payload.docNo || "-"}`, pageW - margin, y, { align: "right" });
  doc.text(`Date. ${fmtDate(payload.docDate)}`, pageW - margin, y + 4.5, { align: "right" });

  y += 4.5;
  for (const line of compAddr) {
    doc.text(line, margin, y);
    y += 3.8;
  }
  if (payload.company?.gstNumber) {
    doc.setFont("helvetica", "bold");
    doc.setTextColor(15, 23, 42);
    doc.text(`GSTN. ${payload.company.gstNumber}`, margin, y);
    y += 3.8;
  }
  y += 2;
  doc.setDrawColor(226, 232, 240);
  doc.line(margin, y, pageW - margin, y);
  y += 5;

  // Party Details (Left) + Meta Rows (Right)
  const midX = pageW / 2;
  let leftY = y;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.setTextColor(15, 23, 42);
  doc.text(payload.partySectionTitle, margin, leftY);
  leftY += 4;
  doc.text((payload.partyName || "-").toUpperCase(), margin, leftY);
  leftY += 4;
  doc.setFont("helvetica", "normal");
  doc.setTextColor(71, 85, 105);
  if (payload.partyAddress) {
    const wrapped = doc.splitTextToSize(`Address. ${payload.partyAddress}`, midX - margin - 6);
    doc.text(wrapped, margin, leftY);
    leftY += wrapped.length * 3.8;
  }
  if (payload.partyGstin) {
    doc.text(`GSTN. ${payload.partyGstin}`, margin, leftY);
    leftY += 3.8;
  }
  if (payload.partyPhone) {
    doc.text(`Contact. ${payload.partyPhone}`, margin, leftY);
    leftY += 3.8;
  }

  let rightY = y;
  if (payload.metaRows && payload.metaRows.length > 0) {
    for (const row of payload.metaRows) {
      doc.setFont("helvetica", "normal");
      doc.setTextColor(100, 116, 139);
      doc.text(row.label, midX + 6, rightY);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(15, 23, 42);
      doc.text(row.value || "-", pageW - margin, rightY, { align: "right" });
      rightY += 4.5;
    }
  }

  y = Math.max(leftY, rightY) + 4;

  // Items Table
  const head = payload.isChallan
    ? [["Sr.", "Item / Particular", "HSN", "Qty", "Rate", "Total"]]
    : [["Sr.", "Item / Particular", "HSN", "Qty", "Rate", "Disc.", "Taxable", "GST", "Total"]];

  const body = payload.items.map((it) => {
    const label = it.subText ? `${it.name}\n${it.subText}` : it.name;
    const gst = Number(it.sgst || 0) + Number(it.cgst || 0) + Number(it.igst || 0);
    if (payload.isChallan) {
      return [
        String(it.srNo),
        label,
        it.hsn || "-",
        String(it.qty ?? 0),
        fmtMoney(it.rate),
        fmtMoney(it.total),
      ];
    }
    return [
      String(it.srNo),
      label,
      it.hsn || "-",
      String(it.qty ?? 0),
      fmtMoney(it.rate),
      fmtMoney(it.discount),
      fmtMoney(it.taxable ?? (it.qty || 0) * (it.rate || 0)),
      fmtMoney(gst),
      fmtMoney(it.total),
    ];
  });

  autoTable(doc, {
    startY: y,
    margin: { left: margin, right: margin },
    head,
    body,
    styles: { fontSize: 7.5, cellPadding: 2, textColor: [30, 41, 59] },
    headStyles: { fillColor: [243, 245, 248], textColor: [15, 23, 42], fontStyle: "bold" },
    columnStyles: payload.isChallan
      ? {
          3: { halign: "right" },
          4: { halign: "right" },
          5: { halign: "right" },
        }
      : {
          3: { halign: "right" },
          4: { halign: "right" },
          5: { halign: "right" },
          6: { halign: "right" },
          7: { halign: "right" },
          8: { halign: "right" },
        },
  });

  let afterTableY = ((doc as any).lastAutoTable?.finalY || y + 20) + 6;

  // Totals (Right-aligned)
  if (payload.totals && payload.totals.length > 0) {
    for (const t of payload.totals) {
      doc.setFont("helvetica", t.bold ? "bold" : "normal");
      doc.setFontSize(t.bold ? 9.5 : 8);
      doc.setTextColor(15, 23, 42);
      doc.text(t.label, pageW - margin - 45, afterTableY);
      doc.text(`Rs. ${fmtMoney(t.value)}`, pageW - margin, afterTableY, { align: "right" });
      afterTableY += t.bold ? 5.5 : 4.2;
    }
  }

  // Signature & Footer
  const sigY = Math.min(afterTableY + 14, doc.internal.pageSize.getHeight() - 28);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.setTextColor(15, 23, 42);
  doc.text(`For ${compName}`, pageW - margin - 20, sigY, { align: "center" });
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  doc.text("AUTHORIZED SIGNATORY", pageW - margin - 20, sigY + 4, { align: "center" });

  const footerY = sigY + 10;
  doc.setDrawColor(226, 232, 240);
  doc.line(margin, footerY, pageW - margin, footerY);
  doc.setFontSize(7.5);
  doc.text(
    `Thank you for your business! For any inquiries, please contact us at ${payload.company?.phone || "8200705348"} or ${payload.company?.email || "netuorderos@gmail.com"}.`,
    pageW / 2,
    footerY + 4.5,
    { align: "center" }
  );
  doc.text(payload.company?.website || "https://netuorderos.io", pageW / 2, footerY + 8.5, {
    align: "center",
  });

  doc.save(payload.fileName.endsWith(".pdf") ? payload.fileName : `${payload.fileName}.pdf`);
}
