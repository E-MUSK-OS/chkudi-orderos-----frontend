"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import DashboardLayout from "@/components/Dashboard/layout/DashboardLayout";
import { Company } from "./types/company.types";
import { companyService } from "./services/company.service";
import DeleteCompanyModal from "./components/DeleteCompanyModal";
import {
  ArrowLeft,
  Edit3,
  Trash2,
  ExternalLink,
  MapPin,
  FileCheck,
  Landmark,
  Receipt,
  User,
  Phone,
  Mail,
  Globe,
  Copy,
  Check,
  Calendar,
  FileText,
  Loader2,
  Plus,
  X,
  Building2,
} from "lucide-react";
import { toast } from "sonner";
import { getMediaUrl } from "@/lib/utils";

/* ── Create Branch Modal ─────────────────────────────────────────── */
interface CreateBranchModalProps {
  open: boolean;
  onClose: () => void;
}

function CreateBranchModal({ open, onClose }: CreateBranchModalProps) {
  const router = useRouter();
  const [gstNumber, setGstNumber] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!gstNumber.trim()) {
      toast.error("GST number is required.");
      return;
    }
    if (gstNumber.trim().length !== 15) {
      toast.error("GST number must be 15 characters.");
      return;
    }
    setLoading(true);
    try {
      const res = await companyService.createDraft({ gstNumber: gstNumber.trim().toUpperCase() });
      toast.success(res.message || "Branch draft created successfully.");
      setGstNumber("");
      onClose();
      if (res.data?.id) {
        router.push(`/dashboard/settings/manage-company/company-profile/edit/${res.data.id}`);
      }
    } catch (err: any) {
      toast.error(err?.message || "Failed to create branch. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (loading) return;
    setGstNumber("");
    onClose();
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={handleClose}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

      {/* Modal */}
      <div
        className="relative w-full max-w-md rounded-2xl bg-white border border-[#E7E0D2] shadow-2xl p-6 dark:bg-[#111827] dark:border-white/[0.1]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between mb-1">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#FFF9EC] border border-[#E8C16D]/30 dark:bg-white/[0.06] dark:border-white/[0.1] flex items-center justify-center shrink-0">
              <Building2 size={15} className="text-[#B88728] dark:text-slate-300" />
            </div>
            <h2 className="text-base font-bold text-[#0A0E1A] dark:text-white">
              Create a company branch
            </h2>
          </div>
          <button
            type="button"
            onClick={handleClose}
            disabled={loading}
            className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-slate-800 dark:hover:bg-white/[0.08] dark:text-slate-400 dark:hover:text-white transition-colors cursor-pointer disabled:opacity-50"
          >
            <X size={16} />
          </button>
        </div>

        <p className="text-xs text-slate-500 dark:text-slate-400 mb-5 ml-[42px]">
          Start by entering your GST number.
        </p>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* GST Number Input */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1.5">
              GST Number{" "}
              <span className="text-rose-500 dark:text-rose-400">*</span>
            </label>
            <div className="relative">
              <input
                type="text"
                value={gstNumber}
                onChange={(e) =>
                  setGstNumber(e.target.value.toUpperCase().slice(0, 15))
                }
                placeholder="Enter your GST number"
                disabled={loading}
                className="w-full rounded-lg bg-white border border-[#E7E0D2] text-[#0A0E1A] placeholder-slate-400 text-sm px-3.5 py-2.5 pr-14 focus:outline-none focus:border-[#E8C16D] transition-colors disabled:opacity-60 dark:bg-[#0E121A] dark:border-white/[0.1] dark:text-white dark:placeholder-slate-500 dark:focus:border-white/30"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 dark:text-slate-500 font-mono select-none">
                {gstNumber.length}/15
              </span>
            </div>
          </div>

          {/* Info list */}
          <div className="rounded-xl bg-slate-50 border border-slate-200 px-4 py-3 dark:bg-white/[0.03] dark:border-white/[0.06]">
            <p className="text-xs text-slate-600 dark:text-slate-400 mb-2">
              After creating the branch, you&apos;ll have to:
            </p>
            <ul className="space-y-1.5">
              {[
                "Complete the registration form at once",
                "Activate the branch once all details are complete",
              ].map((item) => (
                <li key={item} className="flex items-start gap-2 text-xs text-slate-500 dark:text-slate-400">
                  <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-slate-400 dark:bg-slate-500 shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-1">
            <button
              type="button"
              onClick={handleClose}
              disabled={loading}
              className="px-4 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-700 hover:text-slate-900 border border-[#E7E0D2] text-xs font-semibold transition-all cursor-pointer disabled:opacity-50 dark:bg-white/[0.05] dark:hover:bg-white/[0.1] dark:text-slate-200 dark:hover:text-white dark:border-white/[0.1]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || gstNumber.trim().length === 0}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#0A0E1A] hover:bg-black text-white dark:bg-white dark:hover:bg-slate-100 dark:text-slate-900 text-xs font-bold transition-all cursor-pointer shadow disabled:opacity-50 disabled:cursor-not-allowed active:scale-95"
            >
              {loading ? (
                <Loader2 size={13} className="animate-spin" />
              ) : (
                <Plus size={13} className="stroke-[3]" />
              )}
              <span>{loading ? "Creating…" : "Create Draft"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
/* ─────────────────────────────────────────────────────────────────── */

interface CompanyProfileViewPageProps {
  id?: string;
}

function CopyButton({ text }: { text?: string | null }) {
  const [copied, setCopied] = useState(false);

  if (!text || text === "—") return null;

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success("Copied to clipboard");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      type="button"
      onClick={handleCopy}
      className="p-1 rounded text-slate-400 hover:text-slate-700 dark:text-slate-500 dark:hover:text-white transition-colors cursor-pointer shrink-0"
      title="Copy to clipboard"
    >
      {copied ? <Check size={12} className="text-emerald-500 dark:text-emerald-400" /> : <Copy size={12} />}
    </button>
  );
}

function formatDateDisplay(v?: string | Date | null): string {
  if (!v) return "—";
  try {
    const d = new Date(v);
    if (isNaN(d.getTime())) return "—";
    const day = String(d.getDate()).padStart(2, "0");
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const year = d.getFullYear();
    return `${day}-${month}-${year}`;
  } catch {
    return "—";
  }
}

export default function CompanyProfileViewPage({ id: propId }: CompanyProfileViewPageProps) {
  const router = useRouter();
  const params = useParams();
  const companyId = propId || (params?.id as string);

  const [company, setCompany] = useState<Company | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [createBranchModalOpen, setCreateBranchModalOpen] = useState(false);

  const fetchCompany = useCallback(async () => {
    if (!companyId) return;
    try {
      setLoading(true);
      setError(null);
      const res = await companyService.getCompanyById(companyId);
      setCompany(res.data);
    } catch (err: any) {
      console.error(err);
      const msg = err.message || "Failed to load company profile.";
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }, [companyId]);

  useEffect(() => {
    fetchCompany();
  }, [fetchCompany]);

  const handleBack = () => {
    router.push("/dashboard/setting/manage-company/company-profile");
  };

  const handleEdit = () => {
    if (!company) return;
    router.push(`/dashboard/setting/manage-company/company-profile/edit/${company.id}`);
  };

  const handleDeleteConfirm = async () => {
    if (!company) return;
    try {
      setIsDeleting(true);
      await companyService.deleteCompany(company.id);
      toast.success(`Company "${company.companyName}" deleted successfully.`);
      setDeleteModalOpen(false);
      router.push("/dashboard/setting/manage-company/company-profile");
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Failed to delete company profile.");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleGenerateReport = () => {
    if (!company) return;

    const fmt = (v?: string | null) => v || "—";
    const fmtDate = (v?: string | Date | null) =>
      v ? new Date(v).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "—";

    const billingAddrFull = [
      company.billingAddress1 || company.addressLine1,
      company.billingAddress2 || company.addressLine2,
      company.billingAddress3,
      company.billingArea,
      company.billingCity || company.city,
      company.billingState || company.state,
      company.billingPincode || company.pincode,
      company.billingCountry || "India",
    ].filter(Boolean).join(", ");

    const shippingAddrFull = [
      company.shippingAddress1 || company.addressLine1,
      company.shippingAddress2 || company.addressLine2,
      company.shippingAddress3,
      company.shippingArea,
      company.shippingCity || company.city,
      company.shippingState || company.state,
      company.shippingPincode || company.pincode,
      company.shippingCountry || "India",
    ].filter(Boolean).join(", ");

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>Company Profile Report — ${fmt(company.companyName)}</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    font-family: 'Segoe UI', Arial, sans-serif;
    font-size: 11px;
    color: #0f172a;
    background: #fff;
    padding: 28px 32px;
  }
  .report-header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    padding-bottom: 16px;
    border-bottom: 2.5px solid #0f172a;
    margin-bottom: 18px;
  }
  .company-name { font-size: 20px; font-weight: 800; letter-spacing: 0.5px; color: #0f172a; }
  .company-meta { margin-top: 4px; font-size: 10px; color: #64748b; font-weight: 500; }
  .report-badge { text-align: right; }
  .report-badge .label { font-size: 9px; text-transform: uppercase; letter-spacing: 1px; color: #94a3b8; font-weight: 600; }
  .report-badge .date { font-size: 10px; color: #475569; margin-top: 2px; }
  .status-badge {
    display: inline-block; margin-top: 5px; padding: 2px 10px;
    border-radius: 99px; font-size: 9px; font-weight: 700;
    text-transform: uppercase; letter-spacing: 0.5px;
    background: #dcfce7; color: #166534; border: 1px solid #86efac;
  }
  .sections-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; margin-bottom: 14px; }
  .section { border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden; }
  .section.full-width { grid-column: 1 / -1; }
  .section-title { background: #0f172a; color: #fff; font-size: 9.5px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.8px; padding: 6px 12px; }
  .section-body { display: grid; grid-template-columns: 1fr 1fr; gap: 0; }
  .field { padding: 7px 12px; border-bottom: 1px solid #f1f5f9; border-right: 1px solid #f1f5f9; }
  .field:nth-child(even) { border-right: none; }
  .field.span-full { grid-column: 1 / -1; border-right: none; }
  .field-label { font-size: 8.5px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; color: #94a3b8; margin-bottom: 2px; }
  .field-value { font-size: 10.5px; font-weight: 600; color: #0f172a; word-break: break-word; }
  .field-value.mono { font-family: 'Courier New', monospace; letter-spacing: 0.3px; }
  .field-value.dash { color: #cbd5e1; font-weight: 400; }
  .report-footer { margin-top: 18px; padding-top: 12px; border-top: 1px solid #e2e8f0; display: flex; justify-content: space-between; align-items: flex-end; }
  .footer-meta { font-size: 9px; color: #94a3b8; line-height: 1.7; }
  .signature-box { text-align: center; }
  .signature-line { width: 160px; border-bottom: 1.5px solid #0f172a; margin-bottom: 4px; height: 32px; }
  .signature-label { font-size: 9px; color: #64748b; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; }
  @media print {
    body { padding: 16px 20px; }
    @page { size: A4; margin: 12mm 14mm; }
  }
</style>
</head>
<body>

<div class="report-header">
  <div>
    <div class="company-name">${fmt(company.companyName)}</div>
    <div class="company-meta">
      ${fmt(company.abbreviation || company.companyCode)} &nbsp;&bull;&nbsp;
      ${fmt(company.businessType)} &nbsp;&bull;&nbsp;
      GST: ${fmt(company.gstNumber)}
    </div>
    <div class="company-meta" style="margin-top:3px;">
      ${fmt(company.email)} &nbsp;&bull;&nbsp; ${fmt(company.phone)}
      ${company.website ? `&nbsp;&bull;&nbsp; ${fmt(company.website)}` : ""}
    </div>
  </div>
  <div class="report-badge">
    <div class="label">Company Profile Report</div>
    <div class="date">Generated: ${new Date().toLocaleString("en-IN")}</div>
    <div class="status-badge">${fmt(company.status)}</div>
  </div>
</div>

<div class="sections-grid">
  <div class="section">
    <div class="section-title">Basic Information</div>
    <div class="section-body">
      <div class="field"><div class="field-label">Legal Name</div><div class="field-value">${fmt(company.legalName)}</div></div>
      <div class="field"><div class="field-label">Brand Name</div><div class="field-value">${fmt(company.brandName)}</div></div>
      <div class="field"><div class="field-label">Owner Name</div><div class="field-value">${fmt(company.ownerName)}</div></div>
      <div class="field"><div class="field-label">Business Type</div><div class="field-value">${fmt(company.businessType)}</div></div>
      <div class="field"><div class="field-label">Company Code</div><div class="field-value mono">${fmt(company.companyCode)}</div></div>
      <div class="field"><div class="field-label">Abbreviation</div><div class="field-value mono">${fmt(company.abbreviation)}</div></div>
      <div class="field"><div class="field-label">Email</div><div class="field-value">${fmt(company.email)}</div></div>
      <div class="field"><div class="field-label">Phone</div><div class="field-value">${fmt(company.phone)}</div></div>
      <div class="field span-full"><div class="field-label">Website</div><div class="field-value">${fmt(company.website)}</div></div>
    </div>
  </div>

  <div class="section">
    <div class="section-title">Taxation &amp; Legal Details</div>
    <div class="section-body">
      <div class="field"><div class="field-label">GST Number</div><div class="field-value mono">${fmt(company.gstNumber)}</div></div>
      <div class="field"><div class="field-label">PAN Number</div><div class="field-value mono">${fmt(company.panNumber)}</div></div>
      <div class="field"><div class="field-label">TAN Number</div><div class="field-value mono">${fmt(company.tanNumber)}</div></div>
      <div class="field"><div class="field-label">Trade Category</div><div class="field-value">${fmt(company.tradeCategory)}</div></div>
      <div class="field"><div class="field-label">FSSAI Number</div><div class="field-value">${fmt(company.fssaiNumber)}</div></div>
      <div class="field"><div class="field-label">Central Sales Tax No</div><div class="field-value">${fmt(company.cstNumber)}</div></div>
      <div class="field span-full"><div class="field-label">MSME ID</div><div class="field-value">${fmt(company.msmeNumber)}</div></div>
    </div>
  </div>

  <div class="section">
    <div class="section-title">Billing Address</div>
    <div class="section-body">
      <div class="field span-full"><div class="field-label">Address</div><div class="field-value">${billingAddrFull || "—"}</div></div>
      <div class="field"><div class="field-label">Contact Person</div><div class="field-value">${fmt(company.billingContactName)}</div></div>
      <div class="field"><div class="field-label">Contact No</div><div class="field-value">${fmt(company.billingContactNo)}</div></div>
    </div>
  </div>

  <div class="section">
    <div class="section-title">Shipping Address</div>
    <div class="section-body">
      <div class="field span-full"><div class="field-label">Address</div><div class="field-value">${shippingAddrFull || "—"}</div></div>
      <div class="field"><div class="field-label">Contact Person</div><div class="field-value">${fmt(company.shippingContactName)}</div></div>
      <div class="field"><div class="field-label">Contact No</div><div class="field-value">${fmt(company.shippingContactNo)}</div></div>
    </div>
  </div>

  <div class="section">
    <div class="section-title">Bank Details</div>
    <div class="section-body">
      <div class="field"><div class="field-label">Bank Name</div><div class="field-value">${fmt(company.bankName)}</div></div>
      <div class="field"><div class="field-label">Branch Name</div><div class="field-value">${fmt(company.branchName)}</div></div>
      <div class="field"><div class="field-label">Account Holder</div><div class="field-value">${fmt(company.accountHolderName)}</div></div>
      <div class="field"><div class="field-label">Account Name</div><div class="field-value">${fmt(company.accountName)}</div></div>
      <div class="field"><div class="field-label">Account Number</div><div class="field-value mono">${fmt(company.accountNumber)}</div></div>
      <div class="field"><div class="field-label">Account Type</div><div class="field-value">${fmt(company.accountType)}</div></div>
      <div class="field"><div class="field-label">IFSC Code</div><div class="field-value mono">${fmt(company.ifscCode)}</div></div>
      <div class="field"><div class="field-label">UPI ID</div><div class="field-value">${fmt(company.upiId)}</div></div>
    </div>
  </div>

  <div class="section">
    <div class="section-title">Invoice Details</div>
    <div class="section-body">
      <div class="field"><div class="field-label">Tax Invoice Prefix</div><div class="field-value mono">${fmt(company.taxInvoicePrefix)}</div></div>
      <div class="field"><div class="field-label">Next Tax Invoice No</div><div class="field-value mono">${fmt(company.taxInvoiceNext)}</div></div>
      <div class="field"><div class="field-label">Retail Invoice Prefix</div><div class="field-value mono">${fmt(company.retailInvoicePrefix)}</div></div>
      <div class="field"><div class="field-label">Next Retail Invoice No</div><div class="field-value mono">${fmt(company.retailInvoiceNext)}</div></div>
    </div>
  </div>
</div>

<div class="report-footer">
  <div class="footer-meta">
    <div>Created: ${fmtDate(company.createdAt)}</div>
    <div>Last Updated: ${fmtDate(company.updatedAt)}</div>
    <div style="margin-top:4px;font-size:8px;">This report was generated from OrderOS — ${new Date().toLocaleString("en-IN")}</div>
  </div>
  <div class="signature-box">
    <div class="signature-line"></div>
    <div class="signature-label">Authorized Signature</div>
  </div>
</div>

</body>
</html>`;

    // Use a hidden iframe so the print dialog opens without a new tab
    const existing = document.getElementById("__company-report-frame__");
    if (existing) existing.remove();

    const iframe = document.createElement("iframe");
    iframe.id = "__company-report-frame__";
    iframe.style.cssText = "position:fixed;top:0;left:0;width:0;height:0;border:none;opacity:0;pointer-events:none;";
    document.body.appendChild(iframe);

    const doc = iframe.contentDocument || iframe.contentWindow?.document;
    if (!doc) {
      toast.error("Unable to generate report. Please try again.");
      iframe.remove();
      return;
    }

    doc.open();
    doc.write(html);
    doc.close();

    iframe.onload = () => {
      setTimeout(() => {
        iframe.contentWindow?.focus();
        iframe.contentWindow?.print();
        // Clean up after the print dialog closes
        setTimeout(() => iframe.remove(), 2000);
      }, 300);
    };
  };

  if (loading) {
    return (
      <DashboardLayout title="Company Profile">
        <div className="flex flex-col items-center justify-center min-h-[500px] text-slate-400">
          <Loader2 size={36} className="animate-spin text-[#F5C451] mb-3" />
          <p className="text-sm font-medium">Loading company profile details...</p>
        </div>
      </DashboardLayout>
    );
  }

  if (error || !company) {
    return (
      <DashboardLayout title="Company Profile">
        <div className="flex flex-col items-center justify-center min-h-[400px] text-center p-8 bg-white border border-[#E7E0D2] shadow-sm dark:bg-[#0E121A] rounded-2xl dark:border-white/[0.08]">
          <p className="text-sm text-rose-500 dark:text-rose-400 mb-4">{error || "Company not found."}</p>
          <button
            type="button"
            onClick={handleBack}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#0A0E1A] text-white hover:bg-black dark:bg-white dark:text-slate-900 font-semibold text-xs transition-all cursor-pointer dark:hover:bg-slate-100"
          >
            <ArrowLeft size={16} />
            <span>Back to Company Profiles</span>
          </button>
        </div>
      </DashboardLayout>
    );
  }

  // Format full addresses
  const billingAddressFull = [
    company.billingAddress1 || company.addressLine1,
    company.billingAddress2 || company.addressLine2,
    company.billingAddress3,
    company.billingArea,
    company.billingCity || company.city,
    company.billingState || company.state,
    company.billingPincode || company.pincode,
    company.billingCountry || "India",
  ]
    .filter(Boolean)
    .join(", ");

  const shippingAddressFull = [
    company.shippingAddress1 || company.addressLine1,
    company.shippingAddress2 || company.addressLine2,
    company.shippingAddress3,
    company.shippingArea,
    company.shippingCity || company.city,
    company.shippingState || company.state,
    company.shippingPincode || company.pincode,
    company.shippingCountry || "India",
  ]
    .filter(Boolean)
    .join(", ");

  const billingContactPerson = company.billingContactName || company.ownerName || "—";
  const billingPhone = company.billingContactNo || company.phone || "—";

  const shippingContactPerson = company.shippingContactName || company.ownerName || "—";
  const shippingPhone = company.shippingContactNo || company.phone || "—";

  return (
    <DashboardLayout title="Company Profile">
      <div className="flex flex-col h-[calc(100vh-72px)] -my-4 sm:-my-6 lg:-my-8 w-full text-[#0A0E1A] dark:text-slate-100 font-sans overflow-hidden">
        {/* Top Header Card matching footer card rounded style */}
        <div className="w-full pt-4 sm:pt-6 pb-2 shrink-0 z-20">
          <div className="w-full rounded-2xl bg-white border border-[#E7E0D2] px-5 py-3.5 shadow-sm dark:bg-[#131622] dark:border-white/[0.08] dark:shadow-xl flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handleBack}
                className="p-1 rounded-lg hover:bg-slate-100 text-slate-700 hover:text-slate-900 dark:hover:bg-white/[0.08] dark:text-slate-300 dark:hover:text-white transition-colors cursor-pointer"
                title="Back to Company Profiles"
              >
                <ArrowLeft size={18} />
              </button>
              <h1 className="text-base sm:text-lg font-bold text-[#0A0E1A] dark:text-white tracking-wide">
                Company Profile
              </h1>
            </div>

            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={handleEdit}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-white hover:bg-slate-50 text-slate-800 hover:text-slate-900 border border-[#E7E0D2] shadow-xs dark:bg-white/[0.05] dark:hover:bg-white/[0.1] dark:text-slate-200 dark:hover:text-white dark:border-white/[0.1] transition-all cursor-pointer active:scale-95"
              >
                <Edit3 size={13} />
                <span>Edit</span>
              </button>

              <button
                type="button"
                onClick={() => setDeleteModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-rose-50 hover:bg-rose-100 text-rose-600 hover:text-rose-700 border border-rose-200 shadow-xs dark:bg-rose-500/10 dark:hover:bg-rose-500/20 dark:text-rose-400 dark:hover:text-rose-300 dark:border-rose-500/20 transition-all cursor-pointer active:scale-95"
              >
                <Trash2 size={13} />
                <span>Delete</span>
              </button>
            </div>
          </div>
        </div>

        {/* Scrollable Middle Content Area matching Screenshot (Red Box) - scrollbar hidden */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden py-4 no-scrollbar [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
          {/* Main Content Grid: Left 8 cols, Right 4 cols */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 w-full">
          {/* ========================================================================= */}
          {/* LEFT COLUMN: Main Company Card + 4 Detail Cards                           */}
          {/* ========================================================================= */}
          <div className="lg:col-span-8 flex flex-col gap-4">
            {/* Main Company Card */}
            <div className="rounded-2xl bg-white border border-[#E7E0D2] p-5 shadow-sm dark:bg-[#131622] dark:border-white/[0.08] dark:shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5 relative">
              <div className="flex items-start sm:items-center gap-4 flex-1">
                {/* Logo Box */}
                <div className="w-24 h-24 rounded-2xl bg-slate-50 border border-[#E7E0D2] dark:bg-black dark:border-white/[0.1] flex flex-col items-center justify-center p-2 shrink-0 relative overflow-hidden group select-none shadow-xs">
                  <ExternalLink size={12} className="text-slate-400 absolute top-2 right-2 pointer-events-none" />
                  {company.logoUrl ? (
                    <img
                      src={getMediaUrl(company.logoUrl)}
                      alt={company.companyName}
                      className="w-full h-full object-contain"
                    />
                  ) : (
                    <div className="flex flex-col items-center justify-center text-center">
                      <svg
                        width="36"
                        height="26"
                        viewBox="0 0 40 32"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                        className="text-slate-700 dark:text-white"
                      >
                        <path
                          d="M20 16C15 6 6 6 6 13C6 20 15 20 20 16ZM20 16C25 6 34 6 34 13C34 20 25 20 20 16Z"
                          stroke="currentColor"
                          strokeWidth="2.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                        <path
                          d="M20 16C19 21 17 26 15 29M20 16C21 21 23 26 25 29"
                          stroke="currentColor"
                          strokeWidth="2.2"
                          strokeLinecap="round"
                        />
                      </svg>
                      <span className="text-[9px] font-black uppercase tracking-tight text-slate-800 dark:text-white mt-1.5 leading-tight px-1 text-center">
                        {company.companyName || "JAY BHAVANI FASHION"}
                      </span>
                    </div>
                  )}
                </div>

                {/* Company Information */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="text-lg sm:text-xl font-bold text-[#0A0E1A] dark:text-white tracking-wide truncate">
                      {company.companyName || "Untitled Company"}
                    </h2>
                    {company.status === "ACTIVE" && (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-500/15 dark:text-emerald-400 dark:border-emerald-500/30">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 dark:bg-emerald-400" />
                        Active
                      </span>
                    )}
                    {company.status === "DRAFT" && (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-500/15 dark:text-amber-400 dark:border-amber-500/30">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500 dark:bg-amber-400" />
                        Draft
                      </span>
                    )}
                    {company.status === "INACTIVE" && (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-600 border border-slate-200 dark:bg-slate-500/15 dark:text-slate-400 dark:border-slate-500/30">
                        <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                        Inactive
                      </span>
                    )}
                    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-slate-100 text-slate-700 border border-slate-200 dark:bg-white/[0.08] dark:text-slate-300 dark:border-white/[0.08]">
                      Completion: {company.completionPercentage ?? 60}%
                    </span>
                  </div>

                  <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-1 uppercase tracking-wide">
                    {company.companyName || "Company"} {company.abbreviation || company.companyCode ? `@ ${company.abbreviation || company.companyCode}` : ""} {company.businessType ? `• ${company.businessType}` : ""}
                  </p>

                  <div className="flex items-center gap-x-5 gap-y-1.5 flex-wrap mt-3 text-xs">
                    <div className="flex items-center gap-1.5">
                      <User size={13} className="text-slate-400 dark:text-slate-500 shrink-0" />
                      <span className="text-slate-500 dark:text-slate-400 text-[11px]">Owner.</span>
                      <span className="font-semibold text-[#0A0E1A] dark:text-white">
                        {company.ownerName || "—"}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <Mail size={13} className="text-slate-400 dark:text-slate-500 shrink-0" />
                      <span className="text-slate-500 dark:text-slate-400 text-[11px]">Email.</span>
                      <span className="font-semibold text-[#0A0E1A] dark:text-white">
                        {company.email || "—"}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <Phone size={13} className="text-slate-400 dark:text-slate-500 shrink-0" />
                      <span className="text-slate-500 dark:text-slate-400 text-[11px]">Phone.</span>
                      <span className="font-semibold text-[#0A0E1A] dark:text-white">
                        {company.phone ? (company.phone.startsWith("+") ? company.phone : `+91 ${company.phone}`) : "—"}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <Globe size={13} className="text-slate-400 dark:text-slate-500 shrink-0" />
                      <span className="text-slate-500 dark:text-slate-400 text-[11px]">Website.</span>
                      {company.website ? (
                        <a
                          href={company.website.startsWith("http") ? company.website : `https://${company.website}`}
                          target="_blank"
                          rel="noreferrer"
                          className="font-semibold text-sky-600 hover:underline flex items-center gap-1 dark:text-sky-400"
                        >
                          <span>{company.website}</span>
                          <ExternalLink size={10} />
                        </a>
                      ) : (
                        <span className="font-semibold text-[#0A0E1A] dark:text-white">—</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Authorized Signature Box */}
              <div className="flex flex-col items-center shrink-0">
                <div className="w-24 h-24 rounded-2xl bg-slate-50 border border-[#E7E0D2] dark:bg-[#0B0D13] dark:border-white/[0.08] flex items-center justify-center p-2 overflow-hidden shadow-xs">
                  {company.signatureUrl ? (
                    <img
                      src={getMediaUrl(company.signatureUrl)}
                      alt="Authorized Signature"
                      className="w-full h-full object-contain"
                    />
                  ) : (
                    <span className="text-xl font-bold tracking-wider text-slate-700 dark:text-slate-300 select-none">
                      JA
                    </span>
                  )}
                </div>
                <span className="text-[10px] text-slate-500 dark:text-slate-400 mt-1.5 font-medium">
                  Authorized Signature
                </span>
              </div>
            </div>

            {/* 2x2 Grid of Detail Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Card 1: Contact Details */}
              <div className="rounded-2xl bg-white border border-[#E7E0D2] p-4 shadow-sm dark:bg-[#131622] dark:border-white/[0.08] dark:shadow-xl flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <MapPin size={15} className="text-slate-500 dark:text-slate-400" />
                    <h3 className="text-xs font-bold text-[#0A0E1A] dark:text-white tracking-wide">
                      Contact Details
                    </h3>
                  </div>

                  <div className="space-y-3.5 text-xs">
                    {/* Billing Address */}
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                          Billing Address.
                        </span>
                        <CopyButton text={billingAddressFull} />
                      </div>
                      <p className="text-slate-500 dark:text-slate-400 text-[11px] leading-relaxed">
                        {billingAddressFull || "No billing address provided."}
                      </p>
                      <div className="flex items-center gap-3 mt-1.5 text-[11px] font-medium">
                        <span className="flex items-center gap-1 text-slate-600 dark:text-slate-400">
                          <User size={12} className="text-slate-400 dark:text-slate-500" />
                          {billingContactPerson}
                        </span>
                        <span className="flex items-center gap-1 text-slate-600 dark:text-slate-400">
                          <Phone size={12} className="text-slate-400 dark:text-slate-500" />
                          {billingPhone}
                        </span>
                      </div>
                    </div>

                    <div className="border-t border-slate-100 dark:border-white/[0.06] pt-3">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                          Shipping Address.
                        </span>
                        <CopyButton text={shippingAddressFull} />
                      </div>
                      <p className="text-slate-500 dark:text-slate-400 text-[11px] leading-relaxed">
                        {shippingAddressFull || "No shipping address provided."}
                      </p>
                      <div className="flex items-center gap-3 mt-1.5 text-[11px] font-medium">
                        <span className="flex items-center gap-1 text-slate-600 dark:text-slate-400">
                          <User size={12} className="text-slate-400 dark:text-slate-500" />
                          {shippingContactPerson}
                        </span>
                        <span className="flex items-center gap-1 text-slate-600 dark:text-slate-400">
                          <Phone size={12} className="text-slate-400 dark:text-slate-500" />
                          {shippingPhone}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Card 2: Taxation & Legal Details */}
              <div className="rounded-2xl bg-white border border-[#E7E0D2] p-4 shadow-sm dark:bg-[#131622] dark:border-white/[0.08] dark:shadow-xl flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <FileCheck size={15} className="text-slate-500 dark:text-slate-400" />
                    <h3 className="text-xs font-bold text-[#0A0E1A] dark:text-white tracking-wide">
                      Taxation & Legal Details
                    </h3>
                  </div>

                  <div className="grid grid-cols-2 gap-x-4 gap-y-3 text-xs">
                    <div>
                      <span className="text-[10px] text-slate-500 dark:text-slate-400 block mb-0.5">
                        GST No.
                      </span>
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-[#0A0E1A] dark:text-white font-mono text-[11px]">
                          {company.gstNumber || "—"}
                        </span>
                        {company.gstNumber && <CopyButton text={company.gstNumber} />}
                      </div>
                    </div>

                    <div>
                      <span className="text-[10px] text-slate-500 dark:text-slate-400 block mb-0.5">
                        PAN No.
                      </span>
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-[#0A0E1A] dark:text-white font-mono text-[11px]">
                          {company.panNumber || "—"}
                        </span>
                        {company.panNumber && <CopyButton text={company.panNumber} />}
                      </div>
                    </div>

                    <div>
                      <span className="text-[10px] text-slate-500 dark:text-slate-400 block mb-0.5">
                        Trade Category.
                      </span>
                      <span className="font-semibold text-[#0A0E1A] dark:text-white text-[11px]">
                        {company.tradeCategory || "Manufacturing"}
                      </span>
                    </div>

                    <div>
                      <span className="text-[10px] text-slate-500 dark:text-slate-400 block mb-0.5">
                        TAN No.
                      </span>
                      <span className="font-semibold text-[#0A0E1A] dark:text-white font-mono text-[11px]">
                        {company.tanNumber || "—"}
                      </span>
                    </div>

                    <div>
                      <span className="text-[10px] text-slate-500 dark:text-slate-400 block mb-0.5">
                        FSSAI No.
                      </span>
                      <span className="font-semibold text-[#0A0E1A] dark:text-white text-[11px]">
                        {company.fssaiNumber || "-"}
                      </span>
                    </div>

                    <div>
                      <span className="text-[10px] text-slate-500 dark:text-slate-400 block mb-0.5">
                        Central Sales Tax No.
                      </span>
                      <span className="font-semibold text-[#0A0E1A] dark:text-white text-[11px]">
                        {company.cstNumber || "-"}
                      </span>
                    </div>

                    <div>
                      <span className="text-[10px] text-slate-500 dark:text-slate-400 block mb-0.5">
                        MSME ID.
                      </span>
                      <span className="font-semibold text-[#0A0E1A] dark:text-white text-[11px]">
                        {company.msmeNumber || "-"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Card 3: Bank Details */}
              <div className="rounded-2xl bg-white border border-[#E7E0D2] p-4 shadow-sm dark:bg-[#131622] dark:border-white/[0.08] dark:shadow-xl flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <Landmark size={15} className="text-slate-500 dark:text-slate-400" />
                    <h3 className="text-xs font-bold text-[#0A0E1A] dark:text-white tracking-wide">
                      Bank Details
                    </h3>
                  </div>

                  <div className="grid grid-cols-2 gap-x-4 gap-y-3 text-xs">
                    <div>
                      <span className="text-[10px] text-slate-500 dark:text-slate-400 block mb-0.5">
                        Account No.
                      </span>
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-[#0A0E1A] dark:text-white font-mono text-[11px]">
                          {company.accountNumber || "—"}
                        </span>
                        {company.accountNumber && <CopyButton text={company.accountNumber} />}
                      </div>
                    </div>

                    <div>
                      <span className="text-[10px] text-slate-500 dark:text-slate-400 block mb-0.5">
                        Holder Name.
                      </span>
                      <span className="font-semibold text-[#0A0E1A] dark:text-white text-[11px] truncate block">
                        {company.accountHolderName || company.ownerName || "—"}
                      </span>
                    </div>

                    <div>
                      <span className="text-[10px] text-slate-500 dark:text-slate-400 block mb-0.5">
                        Account Name.
                      </span>
                      <span className="font-semibold text-[#0A0E1A] dark:text-white text-[11px] truncate block">
                        {company.accountName || company.companyName || "—"}
                      </span>
                    </div>

                    <div>
                      <span className="text-[10px] text-slate-500 dark:text-slate-400 block mb-0.5">
                        UPI ID.
                      </span>
                      <span className="font-semibold text-[#0A0E1A] dark:text-white text-[11px]">
                        {company.upiId || "—"}
                      </span>
                    </div>

                    <div>
                      <span className="text-[10px] text-slate-500 dark:text-slate-400 block mb-0.5">
                        Bank Name.
                      </span>
                      <span className="font-semibold text-[#0A0E1A] dark:text-white text-[11px] truncate block">
                        {company.bankName || "—"}
                      </span>
                    </div>

                    <div>
                      <span className="text-[10px] text-slate-500 dark:text-slate-400 block mb-0.5">
                        Branch Name.
                      </span>
                      <span className="font-semibold text-[#0A0E1A] dark:text-white text-[11px] truncate block">
                        {company.branchName || "—"}
                      </span>
                    </div>

                    <div>
                      <span className="text-[10px] text-slate-500 dark:text-slate-400 block mb-0.5">
                        Account Type.
                      </span>
                      <span className="font-semibold text-[#0A0E1A] dark:text-white text-[11px]">
                        {company.accountType || "Current"}
                      </span>
                    </div>

                    <div>
                      <span className="text-[10px] text-slate-500 dark:text-slate-400 block mb-0.5">
                        IFSC Code.
                      </span>
                      <span className="font-semibold text-[#0A0E1A] dark:text-white font-mono text-[11px]">
                        {company.ifscCode || "—"}
                      </span>
                    </div>

                    <div>
                      <span className="text-[10px] text-slate-500 dark:text-slate-400 block mb-0.5">
                        Client Code.
                      </span>
                      <span className="font-semibold text-[#0A0E1A] dark:text-white text-[11px]">
                        {company.clientCode || "-"}
                      </span>
                    </div>

                    <div>
                      <span className="text-[10px] text-slate-500 dark:text-slate-400 block mb-0.5">
                        Product Code.
                      </span>
                      <span className="font-semibold text-[#0A0E1A] dark:text-white text-[11px]">
                        {company.productCode || "-"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Card 4: Invoice Details */}
              <div className="rounded-2xl bg-white border border-[#E7E0D2] p-4 shadow-sm dark:bg-[#131622] dark:border-white/[0.08] dark:shadow-xl flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <Receipt size={15} className="text-slate-500 dark:text-slate-400" />
                    <h3 className="text-xs font-bold text-[#0A0E1A] dark:text-white tracking-wide">
                      Invoice Details
                    </h3>
                  </div>

                  <div className="grid grid-cols-2 gap-x-4 gap-y-3 text-xs">
                    <div>
                      <span className="text-[10px] text-slate-500 dark:text-slate-400 block mb-0.5">
                        Tax Invoice Prefix. [Offline]
                      </span>
                      <span className="font-semibold text-[#0A0E1A] dark:text-white font-mono text-[11px]">
                        {company.taxInvoicePrefix || "—"}
                      </span>
                    </div>

                    <div>
                      <span className="text-[10px] text-slate-500 dark:text-slate-400 block mb-0.5">
                        Next Tax Invoice No. [Offline]
                      </span>
                      <span className="font-semibold text-[#0A0E1A] dark:text-white font-mono text-[11px]">
                        {company.taxInvoiceNext || "1"}
                      </span>
                    </div>

                    <div>
                      <span className="text-[10px] text-slate-500 dark:text-slate-400 block mb-0.5">
                        Retail Invoice Prefix. [Offline]
                      </span>
                      <span className="font-semibold text-[#0A0E1A] dark:text-white font-mono text-[11px]">
                        {company.retailInvoicePrefix || "—"}
                      </span>
                    </div>

                    <div>
                      <span className="text-[10px] text-slate-500 dark:text-slate-400 block mb-0.5">
                        Next Retail Invoice No. [Offline]
                      </span>
                      <span className="font-semibold text-[#0A0E1A] dark:text-white font-mono text-[11px]">
                        {company.retailInvoiceNext || "1"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* RIGHT COLUMN: Branch(s) Card matching Screenshot                         */}
          {/* ========================================================================= */}
          <div className="lg:col-span-4 flex flex-col">
            <div className="rounded-2xl bg-white border border-[#E7E0D2] p-4 shadow-sm dark:bg-[#131622] dark:border-white/[0.08] dark:shadow-xl flex flex-col h-full min-h-[460px]">
              {/* Header with Title & + Create Button */}
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-white/[0.06]">
                <h3 className="text-xs font-bold text-[#0A0E1A] dark:text-white tracking-wide">
                  Branch(s)
                </h3>
                <button
                  type="button"
                  onClick={() => setCreateBranchModalOpen(true)}
                  className="inline-flex items-center gap-1 px-4 py-1.5 rounded-full bg-[#F5C451] hover:bg-[#e8b83e] active:scale-[0.97] text-slate-900 font-bold text-[11px] transition-all cursor-pointer shadow-md"
                >
                  <Plus size={12} className="stroke-[3]" />
                  <span>Create</span>
                </button>
              </div>

              {/* Table Column Headers */}
              <div className="grid grid-cols-12 text-[11px] font-semibold text-slate-500 dark:text-slate-400 py-2.5 border-b border-slate-100 dark:border-white/[0.06]">
                <span className="col-span-2">No.</span>
                <span className="col-span-7">Company Name.</span>
                <span className="col-span-3 text-right">Status.</span>
              </div>

              {/* Empty State matching Screenshot with clipboard icon */}
              <div className="flex-1 flex flex-col items-center justify-center p-8 select-none">
                {/* Custom SVG clipboard icon matching screenshot */}
                <div className="mb-3">
                  <svg width="42" height="48" viewBox="0 0 32 38" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <rect x="2" y="5" width="28" height="32" rx="4" fill="#C58349" />
                    <rect x="5" y="8" width="22" height="26" rx="2" fill="#FFFFFF" />
                    <line x1="8" y1="14" x2="24" y2="14" stroke="#F59E0B" strokeWidth="1.5" strokeLinecap="round" />
                    <line x1="8" y1="18" x2="24" y2="18" stroke="#CBD5E1" strokeWidth="1.5" strokeLinecap="round" />
                    <line x1="8" y1="22" x2="24" y2="22" stroke="#CBD5E1" strokeWidth="1.5" strokeLinecap="round" />
                    <line x1="8" y1="26" x2="18" y2="26" stroke="#CBD5E1" strokeWidth="1.5" strokeLinecap="round" />
                    <rect x="11" y="2" width="10" height="6" rx="2" fill="#94A3B8" />
                    <rect x="13" y="1" width="6" height="3" rx="1.5" fill="#64748B" />
                  </svg>
                </div>
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                  No data available
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* BOTTOM STATIC FOOTER BAR matching Screenshot (Red Box)                     */}
      {/* ========================================================================= */}
      <div className="w-full pt-3 pb-4 sm:pb-5 lg:pb-6 bg-transparent dark:bg-[#080B11] shrink-0 z-20">
        <div className="w-full rounded-2xl bg-white border border-[#E7E0D2] px-5 py-3.5 shadow-sm dark:bg-[#131622] dark:border-white/[0.08] dark:shadow-xl flex flex-col sm:flex-row items-center justify-between gap-4">
          {/* Left Metadata items */}
          <div className="flex items-center gap-6 sm:gap-8 flex-wrap">
            {/* Creation Date */}
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 text-slate-700 dark:bg-white/[0.06] dark:border-white/[0.08] dark:text-slate-300 flex items-center justify-center shrink-0">
                <Calendar size={14} />
              </div>
              <div>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-tight">
                  Creation Date
                </p>
                <p className="text-xs font-semibold text-[#0A0E1A] dark:text-white mt-0.5">
                  {formatDateDisplay(company.createdAt)}
                </p>
              </div>
            </div>

            {/* Created By */}
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 text-slate-700 dark:bg-white/[0.06] dark:border-white/[0.08] dark:text-slate-300 flex items-center justify-center shrink-0">
                <User size={14} />
              </div>
              <div>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-tight">
                  Created By
                </p>
                <p className="text-xs font-semibold text-[#0A0E1A] dark:text-white mt-0.5">
                  {company.ownerName || "Admin"}
                </p>
              </div>
            </div>

            {/* Last Updated */}
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 text-slate-700 dark:bg-white/[0.06] dark:border-white/[0.08] dark:text-slate-300 flex items-center justify-center shrink-0">
                <Calendar size={14} />
              </div>
              <div>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-tight">
                  Last Updated
                </p>
                <p className="text-xs font-semibold text-[#0A0E1A] dark:text-white mt-0.5">
                  {formatDateDisplay(company.updatedAt)}
                </p>
              </div>
            </div>

            {/* Last Updated By */}
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 text-slate-700 dark:bg-white/[0.06] dark:border-white/[0.08] dark:text-slate-300 flex items-center justify-center shrink-0">
                <User size={14} />
              </div>
              <div>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-tight">
                  Last Updated By
                </p>
                <p className="text-xs font-semibold text-[#0A0E1A] dark:text-white mt-0.5">
                  {company.ownerName || "Admin"}
                </p>
              </div>
            </div>
          </div>

          {/* Right Action: Generate Report */}
          <button
            type="button"
            onClick={handleGenerateReport}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-800 border border-[#E7E0D2] shadow-xs dark:bg-white/[0.05] dark:hover:bg-white/[0.1] dark:text-white dark:border-white/[0.1] text-xs font-semibold transition-all cursor-pointer active:scale-95 shrink-0"
          >
            <FileText size={14} />
            <span>Generate Report</span>
          </button>
        </div>
      </div>
      </div>

      {/* Delete Confirmation Modal */}
      <DeleteCompanyModal
        open={deleteModalOpen}
        companyName={company?.companyName}
        gstNumber={company?.gstNumber}
        loading={isDeleting}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={handleDeleteConfirm}
      />

      {/* Create Branch Modal */}
      <CreateBranchModal
        open={createBranchModalOpen}
        onClose={() => setCreateBranchModalOpen(false)}
      />
    </DashboardLayout>
  );
}
