"use client";

import React, { useState, useEffect, useMemo } from "react";
import { X, Building2, Save, Trash2, Loader2, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { Company, CompanyStatus, UpdateCompanyPayload } from "../types/company.types";
import { companyService } from "../services/company.service";
import ThemeSelectDropdown, {
  ThemeSelectOption,
} from "@/components/ui/ThemeSelectDropdown";

interface EditCompanyModalProps {
  open: boolean;
  company: Company | null;
  onClose: () => void;
  onSuccess: (updated: Company) => void;
  onDeleteSuccess?: () => void;
}

const INDIAN_STATES = [
  { code: "24", name: "Gujarat" },
  { code: "27", name: "Maharashtra" },
  { code: "08", name: "Rajasthan" },
  { code: "23", name: "Madhya Pradesh" },
  { code: "07", name: "Delhi" },
  { code: "09", name: "Uttar Pradesh" },
  { code: "29", name: "Karnataka" },
  { code: "33", name: "Tamil Nadu" },
  { code: "19", name: "West Bengal" },
  { code: "06", name: "Haryana" },
  { code: "03", name: "Punjab" },
  { code: "36", name: "Telangana" },
  { code: "37", name: "Andhra Pradesh" },
  { code: "10", name: "Bihar" },
  { code: "21", name: "Odisha" },
  { code: "30", name: "Goa" },
  { code: "32", name: "Kerala" },
];

export default function EditCompanyModal({
  open,
  company,
  onClose,
  onSuccess,
  onDeleteSuccess,
}: EditCompanyModalProps) {
  const [formData, setFormData] = useState<UpdateCompanyPayload>({
    companyName: "",
    companyCode: "",
    ownerName: "",
    gstNumber: "",
    panNumber: "",
    email: "",
    phone: "",
    addressLine1: "",
    addressLine2: "",
    city: "",
    state: "Gujarat",
    stateCode: "24",
    pincode: "",
    logoUrl: "",
    bankName: "",
    accountNumber: "",
    ifscCode: "",
    branchName: "",
    status: "ACTIVE",
    isDefault: false,
  });

  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    if (company) {
      setFormData({
        companyName: company.companyName || "",
        companyCode: company.companyCode || "",
        ownerName: company.ownerName || "",
        gstNumber: company.gstNumber || "",
        panNumber: company.panNumber || "",
        email: company.email || "",
        phone: company.phone || "",
        addressLine1: company.addressLine1 || "",
        addressLine2: company.addressLine2 || "",
        city: company.city || "",
        state: company.state || "Gujarat",
        stateCode: company.stateCode || "24",
        pincode: company.pincode || "",
        logoUrl: company.logoUrl || "",
        bankName: company.bankName || "",
        accountNumber: company.accountNumber || "",
        ifscCode: company.ifscCode || "",
        branchName: company.branchName || "",
        status: company.status || "ACTIVE",
        isDefault: company.isDefault || false,
      });
      setShowDeleteConfirm(false);
    }
  }, [company]);

  const statusOptions: ThemeSelectOption[] = useMemo(
    () => [
      { value: "ACTIVE", label: "Active" },
      { value: "DRAFT", label: "Draft" },
      { value: "INACTIVE", label: "Inactive" },
    ],
    []
  );

  const stateModalOptions: ThemeSelectOption[] = useMemo(
    () => INDIAN_STATES.map((s) => ({ value: s.code, label: `${s.code} - ${s.name}` })),
    []
  );

  const modalDropdownButtonClassName =
    "w-full justify-between h-9 px-3.5 text-sm font-normal rounded-xl bg-white border border-[#E7E0D2] text-[#0A0E1A] hover:border-[#E8C16D] dark:bg-[#161B26] dark:border-white/[0.08] dark:text-white dark:hover:border-white/20 transition-all";
  const modalDropdownMenuClassName =
    "w-full min-w-full max-w-none bg-white border border-[#E7E0D2] text-[#0A0E1A] dark:bg-[#0F1626] dark:border-white/[0.08] dark:text-white rounded-xl shadow-2xl";

  if (!open || !company) return null;

  const handleChange = (
    key: keyof UpdateCompanyPayload,
    value: any
  ) => {
    setFormData((prev) => {
      const updated = { ...prev, [key]: value };
      // Auto-extract PAN if GST is modified
      if (key === "gstNumber" && typeof value === "string") {
        const clean = value.toUpperCase().replace(/[^0-9A-Z]/g, "").slice(0, 15);
        updated.gstNumber = clean;
        if (clean.length >= 12 && !prev.panNumber) {
          updated.panNumber = clean.substring(2, 12);
        }
        if (clean.length >= 2) {
          const sc = clean.substring(0, 2);
          const found = INDIAN_STATES.find((s) => s.code === sc);
          if (found) {
            updated.stateCode = found.code;
            updated.state = found.name;
          }
        }
      }
      return updated;
    });
  };

  const handleStateSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const code = e.target.value;
    const found = INDIAN_STATES.find((s) => s.code === code);
    setFormData((prev) => ({
      ...prev,
      stateCode: code,
      state: found ? found.name : prev.state,
    }));
  };

  const onModalStateChange = (code: string) => {
    const found = INDIAN_STATES.find((s) => s.code === code);
    setFormData((prev) => ({
      ...prev,
      stateCode: code,
      state: found ? found.name : prev.state,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.companyName?.trim()) {
      toast.error("Company Name is required.");
      return;
    }
    if (!formData.companyCode?.trim()) {
      toast.error("Company Code is required.");
      return;
    }
    if (!formData.gstNumber?.trim() || formData.gstNumber.trim().length !== 15) {
      toast.error("Valid 15-character GST Number is required.");
      return;
    }

    try {
      setSaving(true);
      const res = await companyService.updateCompany(company.id, formData);
      toast.success(res.message || "Company profile updated successfully!");
      onSuccess(res.data);
      onClose();
    } catch (err: any) {
      // Handled via toast notification
      toast.error(err.message || "Failed to update company.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    try {
      setDeleting(true);
      await companyService.deleteCompany(company.id);
      toast.success("Company deleted successfully.");
      onClose();
      if (onDeleteSuccess) onDeleteSuccess();
    } catch (err: any) {
      // Handled via toast notification
      toast.error(err.message || "Failed to delete company.");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/80 backdrop-blur-sm transition-opacity"
        onClick={() => {
          if (!saving && !deleting) onClose();
        }}
      />

      {/* Modal Dialog */}
      <div className="relative w-full max-w-2xl bg-white border border-[#E7E0D2] dark:bg-[#13161F] dark:border-white/[0.1] rounded-2xl shadow-2xl z-10 max-h-[92vh] flex flex-col my-auto overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-4 border-b border-white/[0.08] flex items-center justify-between bg-white/[0.02]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-400/10 border border-amber-400/20 flex items-center justify-center text-[#F5C451]">
              <Building2 size={20} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-[#0A0E1A] dark:text-white tracking-wide">
                Edit Company Profile
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Update company registration details and tax identity
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={saving || deleting}
            className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-white/[0.06] transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
          {/* Section: Basic Info */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#F5C451] mb-3 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[#F5C451]" />
              Basic Information
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Company Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.companyName || ""}
                  onChange={(e) => handleChange("companyName", e.target.value)}
                  placeholder="e.g. Acme Corporation"
                  required
                  className="w-full rounded-xl px-3.5 py-2 text-sm bg-white border border-[#E7E0D2] text-[#0A0E1A] placeholder-slate-400 hover:border-[#E8C16D] focus:border-[#E8C16D] focus:ring-1 focus:ring-[#E8C16D]/40 outline-none transition-all dark:bg-[#0E1017] dark:border-white/[0.1] dark:text-white dark:placeholder-slate-500 dark:hover:border-white/20 dark:focus:border-amber-400/80 dark:focus:ring-amber-400/30"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Company Code <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.companyCode || ""}
                  onChange={(e) =>
                    handleChange("companyCode", e.target.value.toUpperCase())
                  }
                  placeholder="e.g. ACM"
                  required
                  className="w-full rounded-xl px-3.5 py-2 text-sm uppercase bg-white border border-[#E7E0D2] text-[#0A0E1A] placeholder-slate-400 hover:border-[#E8C16D] focus:border-[#E8C16D] focus:ring-1 focus:ring-[#E8C16D]/40 outline-none transition-all dark:bg-[#0E1017] dark:border-white/[0.1] dark:text-white dark:placeholder-slate-500 dark:hover:border-white/20 dark:focus:border-amber-400/80 dark:focus:ring-amber-400/30"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Owner / Proprietor Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.ownerName || ""}
                  onChange={(e) => handleChange("ownerName", e.target.value)}
                  placeholder="e.g. John Doe"
                  required
                  className="w-full rounded-xl px-3.5 py-2 text-sm uppercase bg-white border border-[#E7E0D2] text-[#0A0E1A] placeholder-slate-400 hover:border-[#E8C16D] focus:border-[#E8C16D] focus:ring-1 focus:ring-[#E8C16D]/40 outline-none transition-all dark:bg-[#0E1017] dark:border-white/[0.1] dark:text-white dark:placeholder-slate-500 dark:hover:border-white/20 dark:focus:border-amber-400/80 dark:focus:ring-amber-400/30"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Status
                </label>
                <ThemeSelectDropdown
                  value={formData.status || "ACTIVE"}
                  onChange={(val) => handleChange("status", val as CompanyStatus)}
                  options={statusOptions}
                  placeholder="Select Status"
                  className="w-full"
                  buttonClassName={modalDropdownButtonClassName}
                  menuClassName={modalDropdownMenuClassName}
                />
              </div>
            </div>
          </div>

          {/* Section: Tax & Identity */}
          <div className="pt-2 border-t border-white/[0.06]">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#F5C451] mb-3 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[#F5C451]" />
              Tax & Legal Identity
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  GST Number (15 Chars) <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.gstNumber || ""}
                  onChange={(e) => handleChange("gstNumber", e.target.value)}
                  maxLength={15}
                  placeholder="e.g. 24ABCDE1234F1Z5"
                  required
                  className="w-full rounded-xl px-3.5 py-2 text-sm font-mono uppercase tracking-wider bg-white border border-[#E7E0D2] text-[#0A0E1A] placeholder-slate-400 hover:border-[#E8C16D] focus:border-[#E8C16D] focus:ring-1 focus:ring-[#E8C16D]/40 outline-none transition-all dark:bg-[#0E1017] dark:border-white/[0.1] dark:text-white dark:placeholder-slate-500 dark:hover:border-white/20 dark:focus:border-amber-400/80 dark:focus:ring-amber-400/30"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  PAN Number (10 Chars)
                </label>
                <input
                  type="text"
                  value={formData.panNumber || ""}
                  onChange={(e) =>
                    handleChange("panNumber", e.target.value.toUpperCase())
                  }
                  maxLength={10}
                  placeholder="e.g. ABCDE1234F"
                  className="w-full rounded-xl px-3.5 py-2 text-sm font-mono uppercase tracking-wider bg-white border border-[#E7E0D2] text-[#0A0E1A] placeholder-slate-400 hover:border-[#E8C16D] focus:border-[#E8C16D] focus:ring-1 focus:ring-[#E8C16D]/40 outline-none transition-all dark:bg-[#0E1017] dark:border-white/[0.1] dark:text-white dark:placeholder-slate-500 dark:hover:border-white/20 dark:focus:border-amber-400/80 dark:focus:ring-amber-400/30"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  value={formData.email || ""}
                  onChange={(e) => handleChange("email", e.target.value)}
                  placeholder="company@example.com"
                  className="w-full rounded-xl px-3.5 py-2 text-sm bg-white border border-[#E7E0D2] text-[#0A0E1A] placeholder-slate-400 hover:border-[#E8C16D] focus:border-[#E8C16D] focus:ring-1 focus:ring-[#E8C16D]/40 outline-none transition-all dark:bg-[#0E1017] dark:border-white/[0.1] dark:text-white dark:placeholder-slate-500 dark:hover:border-white/20 dark:focus:border-amber-400/80 dark:focus:ring-amber-400/30"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Phone / Mobile
                </label>
                <input
                  type="text"
                  value={formData.phone || ""}
                  onChange={(e) => handleChange("phone", e.target.value)}
                  placeholder="+91 9876543210"
                  className="w-full rounded-xl px-3.5 py-2 text-sm bg-white border border-[#E7E0D2] text-[#0A0E1A] placeholder-slate-400 hover:border-[#E8C16D] focus:border-[#E8C16D] focus:ring-1 focus:ring-[#E8C16D]/40 outline-none transition-all dark:bg-[#0E1017] dark:border-white/[0.1] dark:text-white dark:placeholder-slate-500 dark:hover:border-white/20 dark:focus:border-amber-400/80 dark:focus:ring-amber-400/30"
                />
              </div>
            </div>
          </div>

          {/* Section: Address Details */}
          <div className="pt-2 border-t border-white/[0.06]">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#F5C451] mb-3 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[#F5C451]" />
              Address Details
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Address Line 1
                </label>
                <input
                  type="text"
                  value={formData.addressLine1 || ""}
                  onChange={(e) => handleChange("addressLine1", e.target.value)}
                  placeholder="Plot/Shop No, Street, Complex"
                  className="w-full rounded-xl px-3.5 py-2 text-sm bg-white border border-[#E7E0D2] text-[#0A0E1A] placeholder-slate-400 hover:border-[#E8C16D] focus:border-[#E8C16D] focus:ring-1 focus:ring-[#E8C16D]/40 outline-none transition-all dark:bg-[#0E1017] dark:border-white/[0.1] dark:text-white dark:placeholder-slate-500 dark:hover:border-white/20 dark:focus:border-amber-400/80 dark:focus:ring-amber-400/30"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  City
                </label>
                <input
                  type="text"
                  value={formData.city || ""}
                  onChange={(e) => handleChange("city", e.target.value)}
                  placeholder="e.g. Surat"
                  className="w-full rounded-xl px-3.5 py-2 text-sm bg-white border border-[#E7E0D2] text-[#0A0E1A] placeholder-slate-400 hover:border-[#E8C16D] focus:border-[#E8C16D] focus:ring-1 focus:ring-[#E8C16D]/40 outline-none transition-all dark:bg-[#0E1017] dark:border-white/[0.1] dark:text-white dark:placeholder-slate-500 dark:hover:border-white/20 dark:focus:border-amber-400/80 dark:focus:ring-amber-400/30"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  State
                </label>
                <ThemeSelectDropdown
                  value={formData.stateCode || "24"}
                  onChange={onModalStateChange}
                  options={stateModalOptions}
                  placeholder="Select State"
                  className="w-full"
                  buttonClassName={modalDropdownButtonClassName}
                  menuClassName={modalDropdownMenuClassName}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Pincode
                </label>
                <input
                  type="text"
                  value={formData.pincode || ""}
                  onChange={(e) => handleChange("pincode", e.target.value)}
                  maxLength={6}
                  placeholder="e.g. 395006"
                  className="w-full rounded-xl px-3.5 py-2 text-sm bg-white border border-[#E7E0D2] text-[#0A0E1A] placeholder-slate-400 hover:border-[#E8C16D] focus:border-[#E8C16D] focus:ring-1 focus:ring-[#E8C16D]/40 outline-none transition-all dark:bg-[#0E1017] dark:border-white/[0.1] dark:text-white dark:placeholder-slate-500 dark:hover:border-white/20 dark:focus:border-amber-400/80 dark:focus:ring-amber-400/30"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Logo URL (Optional)
                </label>
                <input
                  type="text"
                  value={formData.logoUrl || ""}
                  onChange={(e) => handleChange("logoUrl", e.target.value)}
                  placeholder="https://... / logo.png"
                  className="w-full rounded-xl px-3.5 py-2 text-sm bg-white border border-[#E7E0D2] text-[#0A0E1A] placeholder-slate-400 hover:border-[#E8C16D] focus:border-[#E8C16D] focus:ring-1 focus:ring-[#E8C16D]/40 outline-none transition-all dark:bg-[#0E1017] dark:border-white/[0.1] dark:text-white dark:placeholder-slate-500 dark:hover:border-white/20 dark:focus:border-amber-400/80 dark:focus:ring-amber-400/30"
                />
              </div>
            </div>
          </div>

          {/* Section: Bank Details */}
          <div className="pt-2 border-t border-white/[0.06]">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#F5C451] mb-3 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[#F5C451]" />
              Bank Information (Optional)
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Bank Name
                </label>
                <input
                  type="text"
                  value={formData.bankName || ""}
                  onChange={(e) => handleChange("bankName", e.target.value)}
                  placeholder="e.g. HDFC Bank"
                  className="w-full rounded-xl px-3.5 py-2 text-sm bg-white border border-[#E7E0D2] text-[#0A0E1A] placeholder-slate-400 hover:border-[#E8C16D] focus:border-[#E8C16D] focus:ring-1 focus:ring-[#E8C16D]/40 outline-none transition-all dark:bg-[#0E1017] dark:border-white/[0.1] dark:text-white dark:placeholder-slate-500 dark:hover:border-white/20 dark:focus:border-amber-400/80 dark:focus:ring-amber-400/30"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Account Number
                </label>
                <input
                  type="text"
                  value={formData.accountNumber || ""}
                  onChange={(e) => handleChange("accountNumber", e.target.value)}
                  placeholder="Bank Account Number"
                  className="w-full rounded-xl px-3.5 py-2 text-sm bg-white border border-[#E7E0D2] text-[#0A0E1A] placeholder-slate-400 hover:border-[#E8C16D] focus:border-[#E8C16D] focus:ring-1 focus:ring-[#E8C16D]/40 outline-none transition-all dark:bg-[#0E1017] dark:border-white/[0.1] dark:text-white dark:placeholder-slate-500 dark:hover:border-white/20 dark:focus:border-amber-400/80 dark:focus:ring-amber-400/30"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  IFSC Code
                </label>
                <input
                  type="text"
                  value={formData.ifscCode || ""}
                  onChange={(e) =>
                    handleChange("ifscCode", e.target.value.toUpperCase())
                  }
                  placeholder="e.g. HDFC0001234"
                  className="w-full rounded-xl px-3.5 py-2 text-sm uppercase bg-white border border-[#E7E0D2] text-[#0A0E1A] placeholder-slate-400 hover:border-[#E8C16D] focus:border-[#E8C16D] focus:ring-1 focus:ring-[#E8C16D]/40 outline-none transition-all dark:bg-[#0E1017] dark:border-white/[0.1] dark:text-white dark:placeholder-slate-500 dark:hover:border-white/20 dark:focus:border-amber-400/80 dark:focus:ring-amber-400/30"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Branch
                </label>
                <input
                  type="text"
                  value={formData.branchName || ""}
                  onChange={(e) => handleChange("branchName", e.target.value)}
                  placeholder="e.g. Ring Road Branch"
                  className="w-full rounded-xl px-3.5 py-2 text-sm bg-white border border-[#E7E0D2] text-[#0A0E1A] placeholder-slate-400 hover:border-[#E8C16D] focus:border-[#E8C16D] focus:ring-1 focus:ring-[#E8C16D]/40 outline-none transition-all dark:bg-[#0E1017] dark:border-white/[0.1] dark:text-white dark:placeholder-slate-500 dark:hover:border-white/20 dark:focus:border-amber-400/80 dark:focus:ring-amber-400/30"
                />
              </div>
            </div>
          </div>

          {/* Delete Danger Zone */}
          <div className="pt-4 border-t border-white/[0.06] flex items-center justify-between">
            {!showDeleteConfirm ? (
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(true)}
                className="text-xs text-red-400 hover:text-red-300 flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Trash2 size={13} />
                <span>Delete Company</span>
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <span className="text-xs text-red-400 font-medium">Are you sure?</span>
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={deleting}
                  className="px-2.5 py-1 rounded bg-red-600/80 hover:bg-red-600 text-white text-xs font-semibold cursor-pointer"
                >
                  {deleting ? "Deleting..." : "Yes, Delete"}
                </button>
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(false)}
                  className="px-2 py-1 text-xs text-slate-400 hover:text-white cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            )}
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/[0.08]">
            <button
              type="button"
              onClick={onClose}
              disabled={saving || deleting}
              className="px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold text-slate-700 hover:text-slate-900 bg-white hover:bg-slate-50 border border-[#E7E0D2] dark:text-slate-300 dark:hover:text-white dark:bg-white/[0.04] dark:hover:bg-white/[0.08] dark:border-white/[0.1] shadow-xs transition-all cursor-pointer disabled:opacity-50"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={saving || deleting}
              className="inline-flex items-center justify-center gap-2 px-5 py-2 rounded-xl text-xs sm:text-sm font-semibold bg-[#0A0E1A] hover:bg-black text-white dark:bg-white dark:hover:bg-slate-100 dark:text-slate-900 border border-[#0A0E1A] dark:border-transparent shadow transition-all cursor-pointer active:scale-95 disabled:opacity-50"
            >
              {saving ? (
                <>
                  <Loader2 size={15} className="animate-spin text-white dark:text-slate-900" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Save size={15} className="text-white dark:text-slate-900" />
                  <span>Save Changes</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
