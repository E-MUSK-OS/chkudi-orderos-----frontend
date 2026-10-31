"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  ArrowLeft,
  CheckCircle2,
  Circle,
  Save,
  Check,
  Building2,
  Loader2,
  FileText,
  Upload,
  Trash2,
} from "lucide-react";
import { Company, UpdateCompanyPayload } from "../types/company.types";
import { companyService } from "../services/company.service";
import { toast } from "sonner";
import ThemeSelectDropdown, {
  ThemeSelectOption,
} from "@/components/ui/ThemeSelectDropdown";
import { cn, getMediaUrl } from "@/lib/utils";

interface CompanyProfileFormProps {
  company: Company | null;
  onBack: () => void;
  onSaved: (updated: Company) => void;
}

type TabType = "general" | "contact" | "accounting" | "logo" | "signature";

const INDIAN_STATES = [
  "Gujarat",
  "Maharashtra",
  "Delhi",
  "Rajasthan",
  "Madhya Pradesh",
  "Uttar Pradesh",
  "Karnataka",
  "Tamil Nadu",
  "West Bengal",
  "Haryana",
  "Punjab",
  "Telangana",
  "Andhra Pradesh",
  "Bihar",
  "Odisha",
  "Goa",
  "Kerala",
];

export default function CompanyProfileForm({
  company,
  onBack,
  onSaved,
}: CompanyProfileFormProps) {
  const [activeTab, setActiveTab] = useState<TabType>("general");
  const [saving, setSaving] = useState(false);

  // Hidden file inputs for Logo and Signature
  const logoInputRef = React.useRef<HTMLInputElement | null>(null);
  const signatureInputRef = React.useRef<HTMLInputElement | null>(null);
  const [isLogoDragging, setIsLogoDragging] = useState(false);
  const [isSignatureDragging, setIsSignatureDragging] = useState(false);

  const processImageFile = (
    file: File,
    field: "logoUrl" | "signatureUrl",
    label: string
  ) => {
    if (!file.type.startsWith("image/")) {
      toast.error(`Please select a valid image file (PNG, JPG, SVG, WebP) for ${label}.`);
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error(`${label} file size should be less than 5MB.`);
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result as string;
      handleChange(field, base64);
      toast.success(`${label} uploaded successfully.`);
    };
    reader.onerror = () => {
      toast.error(`Failed to read ${label.toLowerCase()} image file.`);
    };
    reader.readAsDataURL(file);
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    processImageFile(file, "logoUrl", "Logo");
    e.target.value = "";
  };

  const handleSignatureUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    processImageFile(file, "signatureUrl", "Signature");
    e.target.value = "";
  };

  const handleLogoDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsLogoDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processImageFile(file, "logoUrl", "Logo");
    }
  };

  const handleSignatureDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsSignatureDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processImageFile(file, "signatureUrl", "Signature");
    }
  };

  // Dropdown options matching software ThemeSelectDropdown
  const businessTypeOptions: ThemeSelectOption[] = useMemo(
    () => [
      { value: "Properiter", label: "Properiter" },
      { value: "Partnership", label: "Partnership" },
      { value: "Private Limited", label: "Private Limited" },
      { value: "Public Limited", label: "Public Limited" },
      { value: "LLP", label: "LLP" },
      { value: "Individual", label: "Individual" },
    ],
    []
  );

  const stateOptions: ThemeSelectOption[] = useMemo(
    () => INDIAN_STATES.map((st) => ({ value: st, label: st })),
    []
  );

  const tradeCategoryOptions: ThemeSelectOption[] = useMemo(
    () => [
      { value: "Manufacturing", label: "Manufacturing" },
      { value: "Wholesale", label: "Wholesale" },
      { value: "Retail", label: "Retail" },
      { value: "Service", label: "Service" },
      { value: "E-Commerce", label: "E-Commerce" },
    ],
    []
  );

  const accountTypeOptions: ThemeSelectOption[] = useMemo(
    () => [
      { value: "Current", label: "Current" },
      { value: "Savings", label: "Savings" },
      { value: "Cash Credit", label: "Cash Credit" },
      { value: "Overdraft", label: "Overdraft" },
    ],
    []
  );

  const considerInPnLOptions: ThemeSelectOption[] = useMemo(
    () => [
      { value: "Yes", label: "Yes" },
      { value: "No", label: "No" },
    ],
    []
  );

  const dropdownButtonClassName =
    "w-full justify-between h-10 px-3.5 text-xs font-normal rounded-xl bg-white border border-[#E7E0D2] text-[#0A0E1A] hover:border-[#E8C16D] dark:bg-[#161B26] dark:border-white/[0.08] dark:text-white dark:hover:border-white/20 transition-all";
  const dropdownMenuClassName =
    "w-full min-w-full max-w-none bg-white border border-[#E7E0D2] text-[#0A0E1A] dark:bg-[#0F1626] dark:border-white/[0.08] dark:text-white rounded-xl shadow-2xl";

  // Form state holding all fields from database
  const [formData, setFormData] = useState<UpdateCompanyPayload>({
    // General Details
    legalName: "",
    companyName: "",
    brandName: "",
    ownerName: "",
    abbreviation: "",
    businessType: "Properiter",
    email: "",
    phone: "",
    website: "",

    // Billing Details
    billingAddress1: "",
    billingAddress2: "",
    billingAddress3: "",
    billingPincode: "",
    billingArea: "",
    billingCity: "Surat",
    billingState: "Gujarat",
    billingCountry: "India",
    billingContactName: "",
    billingContactNo: "",

    // Shipping Details
    shippingSameAsBilling: true,
    shippingAddress1: "",
    shippingAddress2: "",
    shippingAddress3: "",
    shippingPincode: "",
    shippingArea: "",
    shippingCity: "Surat",
    shippingState: "Gujarat",
    shippingCountry: "India",
    shippingContactName: "",
    shippingContactNo: "",

    // Accounting - Legal
    gstNumber: "",
    tanNumber: "",
    panNumber: "",
    cstNumber: "",
    fssaiNumber: "",
    tradeCategory: "Manufacturing",
    msmeNumber: "",

    // Accounting - Bank
    bankName: "",
    accountHolderName: "",
    accountName: "",
    accountNumber: "",
    ifscCode: "",
    accountType: "Current",
    branchName: "",
    upiId: "",
    clientCode: "",
    productCode: "",

    // Invoice Details
    taxInvoicePrefix: "JBFT",
    taxInvoiceNext: "1",
    retailInvoicePrefix: "JBFR",
    retailInvoiceNext: "1",
    considerInPnL: "Yes",

    // Logo & Signature
    logoUrl: "",
    signatureUrl: "",
    status: "ACTIVE",
  });

  // Populate form with real data from database
  useEffect(() => {
    if (company) {
      setFormData({
        legalName: company.legalName || company.companyName || "",
        companyName: company.companyName || "",
        brandName: company.brandName || company.companyName || "",
        ownerName: company.ownerName || "",
        abbreviation: company.abbreviation || company.companyCode || "",
        businessType: company.businessType || "Properiter",
        email: company.email || "",
        phone: company.phone || "",
        website: company.website || "",

        billingAddress1: company.billingAddress1 || company.addressLine1 || "",
        billingAddress2: company.billingAddress2 || company.addressLine2 || "",
        billingAddress3: company.billingAddress3 || "",
        billingPincode: company.billingPincode || company.pincode || "",
        billingArea: company.billingArea || "",
        billingCity: company.billingCity || company.city || "Surat",
        billingState: company.billingState || company.state || "Gujarat",
        billingCountry: company.billingCountry || "India",
        billingContactName: company.billingContactName || company.ownerName || "",
        billingContactNo: company.billingContactNo || company.phone || "",

        shippingSameAsBilling: company.shippingSameAsBilling ?? true,
        shippingAddress1: company.shippingAddress1 || company.addressLine1 || "",
        shippingAddress2: company.shippingAddress2 || company.addressLine2 || "",
        shippingAddress3: company.shippingAddress3 || "",
        shippingPincode: company.shippingPincode || company.pincode || "",
        shippingArea: company.shippingArea || "",
        shippingCity: company.shippingCity || company.city || "Surat",
        shippingState: company.shippingState || company.state || "Gujarat",
        shippingCountry: company.shippingCountry || "India",
        shippingContactName: company.shippingContactName || company.ownerName || "",
        shippingContactNo: company.shippingContactNo || company.phone || "",

        gstNumber: company.gstNumber || "",
        tanNumber: company.tanNumber || "",
        panNumber: company.panNumber || "",
        cstNumber: company.cstNumber || "",
        fssaiNumber: company.fssaiNumber || "",
        tradeCategory: company.tradeCategory || "Manufacturing",
        msmeNumber: company.msmeNumber || "",

        bankName: company.bankName || "",
        accountHolderName: company.accountHolderName || company.ownerName || "",
        accountName: company.accountName || company.companyName || "",
        accountNumber: company.accountNumber || "",
        ifscCode: company.ifscCode || "",
        accountType: company.accountType || "Current",
        branchName: company.branchName || "",
        upiId: company.upiId || "",
        clientCode: company.clientCode || "",
        productCode: company.productCode || "",

        taxInvoicePrefix: company.taxInvoicePrefix || "JBFT",
        taxInvoiceNext: company.taxInvoiceNext || "1",
        retailInvoicePrefix: company.retailInvoicePrefix || "JBFR",
        retailInvoiceNext: company.retailInvoiceNext || "1",
        considerInPnL: company.considerInPnL || "Yes",

        logoUrl: company.logoUrl || "",
        signatureUrl: company.signatureUrl || "",
        status: company.status || "ACTIVE",
      });
    }
  }, [company]);

  const handleChange = (field: keyof UpdateCompanyPayload, value: any) => {
    setFormData((prev) => {
      const updated = { ...prev, [field]: value };

      // If shipping same as billing is checked, sync billing fields to shipping
      if (
        updated.shippingSameAsBilling &&
        (field === "billingAddress1" ||
          field === "billingAddress2" ||
          field === "billingAddress3" ||
          field === "billingPincode" ||
          field === "billingArea" ||
          field === "billingCity" ||
          field === "billingState" ||
          field === "billingCountry" ||
          field === "billingContactName" ||
          field === "billingContactNo")
      ) {
        if (field === "billingAddress1") updated.shippingAddress1 = value;
        if (field === "billingAddress2") updated.shippingAddress2 = value;
        if (field === "billingAddress3") updated.shippingAddress3 = value;
        if (field === "billingPincode") updated.shippingPincode = value;
        if (field === "billingArea") updated.shippingArea = value;
        if (field === "billingCity") updated.shippingCity = value;
        if (field === "billingState") updated.shippingState = value;
        if (field === "billingCountry") updated.shippingCountry = value;
        if (field === "billingContactName") updated.shippingContactName = value;
        if (field === "billingContactNo") updated.shippingContactNo = value;
      }

      return updated;
    });
  };

  const handleShippingSameToggle = (checked: boolean) => {
    setFormData((prev) => {
      const next = { ...prev, shippingSameAsBilling: checked };
      if (checked) {
        next.shippingAddress1 = prev.billingAddress1;
        next.shippingAddress2 = prev.billingAddress2;
        next.shippingAddress3 = prev.billingAddress3;
        next.shippingPincode = prev.billingPincode;
        next.shippingArea = prev.billingArea;
        next.shippingCity = prev.billingCity;
        next.shippingState = prev.billingState;
        next.shippingCountry = prev.billingCountry;
        next.shippingContactName = prev.billingContactName;
        next.shippingContactNo = prev.billingContactNo;
      }
      return next;
    });
  };

  // Dynamic completion percentage calculation
  const completionPercentage = React.useMemo(() => {
    const requiredFields = [
      formData.legalName,
      formData.companyName,
      formData.ownerName,
      formData.abbreviation,
      formData.email,
      formData.phone,
      formData.billingAddress1,
      formData.billingPincode,
      formData.billingArea,
      formData.billingCity,
      formData.billingState,
      formData.billingContactName,
      formData.billingContactNo,
      formData.gstNumber,
      formData.panNumber,
      formData.bankName,
      formData.accountHolderName,
      formData.accountNumber,
      formData.ifscCode,
      formData.branchName,
    ];
    const filled = requiredFields.filter((f) => f && String(f).trim().length > 0).length;
    return Math.min(100, Math.round((filled / requiredFields.length) * 100));
  }, [formData]);

  const handleSave = async () => {
    if (!company) return;
    try {
      setSaving(true);

      const payload: UpdateCompanyPayload = {
        ...formData,
        companyCode: formData.abbreviation || company.companyCode || "JBF",
        completionPercentage,
      };

      const res = await companyService.updateCompany(company.id, payload);
      toast.success("Company profile updated successfully.");
      onSaved(res.data);
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Failed to update company profile.");
    } finally {
      setSaving(false);
    }
  };

  const tabs = [
    {
      key: "general",
      label: "General",
      completed: Boolean(formData.companyName && formData.ownerName && formData.email),
    },
    {
      key: "contact",
      label: "Contact",
      completed: Boolean(formData.billingAddress1 && formData.billingPincode),
    },
    {
      key: "accounting",
      label: "Accounting",
      completed: Boolean(formData.gstNumber && formData.bankName),
    },
    { key: "logo", label: "Logo", completed: Boolean(formData.logoUrl) },
    { key: "signature", label: "Signature", completed: Boolean(formData.signatureUrl) },
  ];

  return (
    <div className="flex flex-col min-h-[calc(100vh-100px)] w-full rounded-2xl border border-[#E7E0D2] bg-white text-[#0A0E1A] shadow-md dark:border-white/[0.08] dark:bg-[#0E121A] dark:text-slate-100 dark:shadow-2xl overflow-hidden font-sans">
      {/* Top Header Bar matching media_1793255914393.png */}
      <div className="px-6 pt-5 pb-3 w-full flex items-center justify-between border-b border-slate-100 bg-white dark:border-white/[0.06] dark:bg-[#0E121A]">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onBack}
            className="p-1 rounded-lg hover:bg-slate-100 text-slate-700 dark:text-slate-300 dark:hover:bg-white/[0.08] dark:hover:text-white transition-colors cursor-pointer"
            title="Back to Company Profiles"
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <h1 className="text-base sm:text-lg font-bold text-[#0A0E1A] dark:text-white leading-tight">
              Company Profile
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              <span className="font-semibold text-slate-700 dark:text-slate-300">Name.</span>{" "}
              {formData.companyName || company?.companyName || "JAY BHAVANI FASHION"}{" "}
              <span className="ml-3 font-semibold text-slate-700 dark:text-slate-300">GSTN.</span>{" "}
              {formData.gstNumber || company?.gstNumber || "24CAGPB1419N1ZW"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          {/* Active Status Badge matching screenshot */}
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-[#FFF9EC] text-[#B88728] border border-[#E8C16D]/30 dark:bg-[#2A3444] dark:text-white dark:border-white/[0.1] shadow-xs">
            <span>{formData.status === "ACTIVE" ? "Active" : "Draft"}</span>
            <Check size={12} className="stroke-[3] text-[#B88728] dark:text-white" />
          </div>

          {/* Edit Mode indicator */}
          <div className="px-3.5 py-1 rounded-md bg-slate-100 text-slate-800 border border-slate-200 dark:bg-white dark:text-slate-900 dark:border-transparent font-bold text-xs shadow-xs select-none">
            Edit Mode
          </div>
        </div>
      </div>

      {/* Full-Width Tabs Segmented Bar matching media_1793255914393.png */}
      <div className="px-6 py-3 w-full border-b border-slate-100 bg-white dark:border-white/[0.06] dark:bg-[#0E121A]">
        <div className="w-full rounded-xl bg-slate-100 border border-slate-200 dark:bg-[#161B24] dark:border-white/[0.08] p-1 grid grid-cols-5 gap-1 select-none">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveTab(tab.key as TabType)}
                className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  isActive
                    ? "border border-slate-300 bg-white text-slate-900 shadow-xs dark:border-white/20 dark:bg-white/[0.05] dark:text-white"
                    : "border border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-200/50 dark:text-slate-400 dark:hover:text-slate-200 dark:hover:bg-white/[0.02]"
                }`}
              >
                {tab.completed ? (
                  <CheckCircle2 size={14} className="text-emerald-400 shrink-0" />
                ) : (
                  <Circle size={14} className="text-slate-500 shrink-0 stroke-dashed" />
                )}
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Form Content Area - Full-width padding with 4-column balanced grid (hidden scrollbar) */}
      <div className="flex-1 px-6 py-6 overflow-y-auto no-scrollbar [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
        {/* ========================================================================= */}
        {/* TAB 1: GENERAL DETAILS                                                   */}
        {/* ========================================================================= */}
        {activeTab === "general" && (
          <div className="w-full">
            <div className="mb-6">
              <h2 className="text-sm font-bold text-[#0A0E1A] dark:text-white tracking-wide">
                General Details
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Enter basic information about company.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-10 gap-y-4">
                {/* Legal Name */}
                <div>
                  <label className="text-[11px] font-medium text-slate-700 dark:text-slate-300 mb-1.5 block">
                    Legal Name. <span className="text-red-500 font-bold">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.legalName || ""}
                    onChange={(e) => handleChange("legalName", e.target.value)}
                    placeholder="Enter Legal Name"
                    className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-white border border-[#E7E0D2] text-[#0A0E1A] placeholder-slate-400 focus:border-[#E8C16D] dark:bg-[#161B26] dark:border-white/[0.08] dark:focus:border-white/[0.2] dark:text-white outline-none transition-all"
                  />
                </div>

                {/* Company Name */}
                <div>
                  <label className="text-[11px] font-medium text-slate-700 dark:text-slate-300 mb-1.5 block">
                    Company Name. <span className="text-red-500 font-bold">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.companyName || ""}
                    onChange={(e) => handleChange("companyName", e.target.value)}
                    placeholder="Enter Company Name"
                    className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-white border border-[#E7E0D2] text-[#0A0E1A] placeholder-slate-400 focus:border-[#E8C16D] dark:bg-[#161B26] dark:border-white/[0.08] dark:focus:border-white/[0.2] dark:text-white outline-none transition-all"
                  />
                </div>

                {/* Brand Name */}
                <div>
                  <label className="text-[11px] font-medium text-slate-700 dark:text-slate-300 mb-1.5 block">
                    Brand Name.
                  </label>
                  <input
                    type="text"
                    value={formData.brandName || ""}
                    onChange={(e) => handleChange("brandName", e.target.value)}
                    placeholder="Enter Brand Name"
                    className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-white border border-[#E7E0D2] text-[#0A0E1A] placeholder-slate-400 focus:border-[#E8C16D] dark:bg-[#161B26] dark:border-white/[0.08] dark:focus:border-white/[0.2] dark:text-white outline-none transition-all"
                  />
                </div>

                {/* Owner Name */}
                <div>
                  <label className="text-[11px] font-medium text-slate-700 dark:text-slate-300 mb-1.5 block">
                    Owner Name. <span className="text-red-500 font-bold">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.ownerName || ""}
                    onChange={(e) => handleChange("ownerName", e.target.value)}
                    placeholder="Enter Owner Name"
                    className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-white border border-[#E7E0D2] text-[#0A0E1A] placeholder-slate-400 focus:border-[#E8C16D] dark:bg-[#161B26] dark:border-white/[0.08] dark:focus:border-white/[0.2] dark:text-white outline-none transition-all"
                  />
                </div>

                {/* Abbreviation */}
                <div>
                  <label className="text-[11px] font-medium text-slate-700 dark:text-slate-300 mb-1.5 block">
                    Abbreviation. <span className="text-red-500 font-bold">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.abbreviation || ""}
                    onChange={(e) => handleChange("abbreviation", e.target.value.toUpperCase())}
                    placeholder="e.g. JBF"
                    className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-white border border-[#E7E0D2] text-[#0A0E1A] placeholder-slate-400 focus:border-[#E8C16D] dark:bg-[#161B26] dark:border-white/[0.08] dark:focus:border-white/[0.2] dark:text-white outline-none uppercase transition-all"
                  />
                </div>

                {/* Type Dropdown */}
                <div>
                  <label className="text-[11px] font-medium text-slate-700 dark:text-slate-300 mb-1.5 block">
                    Type. <span className="text-red-500 font-bold">*</span>
                  </label>
                  <ThemeSelectDropdown
                    value={formData.businessType || "Properiter"}
                    onChange={(val) => handleChange("businessType", val)}
                    options={businessTypeOptions}
                    placeholder="Select Type"
                    className="w-full"
                    buttonClassName={dropdownButtonClassName}
                    menuClassName={dropdownMenuClassName}
                  />
                </div>

                {/* Email */}
                <div>
                  <label className="text-[11px] font-medium text-slate-700 dark:text-slate-300 mb-1.5 block">
                    Email. <span className="text-red-500 font-bold">*</span>
                  </label>
                  <input
                    type="email"
                    value={formData.email || ""}
                    onChange={(e) => handleChange("email", e.target.value)}
                    placeholder="Enter Email Address"
                    className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-white border border-[#E7E0D2] text-[#0A0E1A] placeholder-slate-400 focus:border-[#E8C16D] dark:bg-[#161B26] dark:border-white/[0.08] dark:focus:border-white/[0.2] dark:text-white outline-none transition-all"
                  />
                </div>

                {/* Contact No with 10/10 counter */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-[11px] font-medium text-slate-700 dark:text-slate-300">
                      Contact No. <span className="text-red-500 font-bold">*</span>
                    </label>
                    <span className="text-[10px] text-emerald-400 font-mono">
                      {formData.phone ? formData.phone.length : 0}/10
                    </span>
                  </div>
                  <input
                    type="text"
                    maxLength={10}
                    value={formData.phone || ""}
                    onChange={(e) => handleChange("phone", e.target.value.replace(/\D/g, ""))}
                    placeholder="Enter 10-digit Contact No"
                    className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-white border border-[#E7E0D2] text-[#0A0E1A] placeholder-slate-400 focus:border-[#E8C16D] dark:bg-[#161B26] dark:border-white/[0.08] dark:focus:border-white/[0.2] dark:text-white outline-none transition-all font-mono"
                  />
                </div>

                {/* Website - spans 1 column only */}
                <div>
                  <label className="text-[11px] font-medium text-slate-700 dark:text-slate-300 mb-1.5 block">
                    Website.
                  </label>
                  <input
                    type="url"
                    value={formData.website || ""}
                    onChange={(e) => handleChange("website", e.target.value)}
                    placeholder="https://example.com"
                    className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-white border border-[#E7E0D2] text-[#0A0E1A] placeholder-slate-400 focus:border-[#E8C16D] dark:bg-[#161B26] dark:border-white/[0.08] dark:focus:border-white/[0.2] dark:text-white outline-none transition-all"
                  />
                </div>
                <div />
              </div>
            </div>
          )}

        {/* ========================================================================= */}
        {/* TAB 2: CONTACT DETAILS (Billing & Shipping)                               */}
        {/* ========================================================================= */}
        {activeTab === "contact" && (
          <div className="w-full">
            <div className="mb-6">
              <h2 className="text-sm font-bold text-[#0A0E1A] dark:text-white tracking-wide">
                Contact Details
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Enter billing and shipping information
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-10 gap-y-6">
              {/* Billing Column */}
              <div>
                <h3 className="text-sm font-bold text-[#0A0E1A] dark:text-white mb-4">
                  Billing
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-5 gap-y-4">
                  <div>
                    <label className="text-[11px] font-medium text-slate-700 dark:text-slate-300 mb-1.5 block">
                      Address 1. <span className="text-red-500 font-bold">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.billingAddress1 || ""}
                      onChange={(e) => handleChange("billingAddress1", e.target.value)}
                      placeholder="Plot- No-D-9/13A"
                      className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-white border border-[#E7E0D2] text-[#0A0E1A] placeholder-slate-400 focus:border-[#E8C16D] dark:bg-[#161B26] dark:border-white/[0.08] dark:focus:border-white/[0.2] dark:text-white outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-medium text-slate-700 dark:text-slate-300 mb-1.5 block">
                      Address 2.
                    </label>
                    <input
                      type="text"
                      value={formData.billingAddress2 || ""}
                      onChange={(e) => handleChange("billingAddress2", e.target.value)}
                      placeholder="Sachin Udhyognagar Sahakari Mandli"
                      className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-white border border-[#E7E0D2] text-[#0A0E1A] placeholder-slate-400 focus:border-[#E8C16D] dark:bg-[#161B26] dark:border-white/[0.08] dark:focus:border-white/[0.2] dark:text-white outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-medium text-slate-700 dark:text-slate-300 mb-1.5 block">
                      Address 3.
                    </label>
                    <input
                      type="text"
                      value={formData.billingAddress3 || ""}
                      onChange={(e) => handleChange("billingAddress3", e.target.value)}
                      placeholder="Hojiwal Industrial Estata vanz Road No-2"
                      className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-white border border-[#E7E0D2] text-[#0A0E1A] placeholder-slate-400 focus:border-[#E8C16D] dark:bg-[#161B26] dark:border-white/[0.08] dark:focus:border-white/[0.2] dark:text-white outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-medium text-slate-700 dark:text-slate-300 mb-1.5 block">
                      Pincode. <span className="text-red-500 font-bold">*</span>
                    </label>
                    <input
                      type="text"
                      maxLength={6}
                      value={formData.billingPincode || ""}
                      onChange={(e) => handleChange("billingPincode", e.target.value.replace(/\D/g, ""))}
                      placeholder="394230"
                      className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-white border border-[#E7E0D2] text-[#0A0E1A] placeholder-slate-400 focus:border-[#E8C16D] dark:bg-[#161B26] dark:border-white/[0.08] dark:focus:border-white/[0.2] dark:text-white outline-none font-mono"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-medium text-slate-700 dark:text-slate-300 mb-1.5 block">
                      Area. <span className="text-red-500 font-bold">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.billingArea || ""}
                      onChange={(e) => handleChange("billingArea", e.target.value)}
                      placeholder="Sachin"
                      className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-white border border-[#E7E0D2] text-[#0A0E1A] placeholder-slate-400 focus:border-[#E8C16D] dark:bg-[#161B26] dark:border-white/[0.08] dark:focus:border-white/[0.2] dark:text-white outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-medium text-slate-700 dark:text-slate-300 mb-1.5 block">
                      City. <span className="text-red-500 font-bold">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.billingCity || ""}
                      onChange={(e) => handleChange("billingCity", e.target.value)}
                      placeholder="Surat"
                      className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-white border border-[#E7E0D2] text-[#0A0E1A] placeholder-slate-400 focus:border-[#E8C16D] dark:bg-[#161B26] dark:border-white/[0.08] dark:focus:border-white/[0.2] dark:text-white outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-medium text-slate-700 dark:text-slate-300 mb-1.5 block">
                      State. <span className="text-red-500 font-bold">*</span>
                    </label>
                    <ThemeSelectDropdown
                      value={formData.billingState || "Gujarat"}
                      onChange={(val) => handleChange("billingState", val)}
                      options={stateOptions}
                      placeholder="Select a state"
                      className="w-full"
                      buttonClassName={dropdownButtonClassName}
                      menuClassName={dropdownMenuClassName}
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-medium text-slate-700 dark:text-slate-300 mb-1.5 block">
                      Country.
                    </label>
                    <input
                      type="text"
                      disabled
                      value={formData.billingCountry || "India"}
                      className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-slate-100 border border-[#E7E0D2] text-slate-500 dark:bg-[#161B26]/50 dark:border-white/[0.06] dark:text-slate-400 outline-none cursor-not-allowed select-none"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-medium text-slate-700 dark:text-slate-300 mb-1.5 block">
                      Contact Name. <span className="text-red-500 font-bold">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.billingContactName || ""}
                      onChange={(e) => handleChange("billingContactName", e.target.value)}
                      placeholder="Shailesh Bhatiya"
                      className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-white border border-[#E7E0D2] text-[#0A0E1A] placeholder-slate-400 focus:border-[#E8C16D] dark:bg-[#161B26] dark:border-white/[0.08] dark:focus:border-white/[0.2] dark:text-white outline-none"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-[11px] font-medium text-slate-700 dark:text-slate-300">
                        Contact No. <span className="text-red-500 font-bold">*</span>
                      </label>
                      <span className="text-[10px] text-emerald-400 font-mono">
                        {formData.billingContactNo ? formData.billingContactNo.length : 0}/10
                      </span>
                    </div>
                    <input
                      type="text"
                      maxLength={10}
                      value={formData.billingContactNo || ""}
                      onChange={(e) =>
                        handleChange("billingContactNo", e.target.value.replace(/\D/g, ""))
                      }
                      placeholder="9925377339"
                      className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-white border border-[#E7E0D2] text-[#0A0E1A] placeholder-slate-400 focus:border-[#E8C16D] dark:bg-[#161B26] dark:border-white/[0.08] dark:focus:border-white/[0.2] dark:text-white outline-none font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* Shipping Column */}
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <h3 className="text-sm font-bold text-[#0A0E1A] dark:text-white">Shipping</h3>
                  <label className="flex items-center gap-2 cursor-pointer select-none text-xs text-slate-700 dark:text-slate-300">
                    <input
                      type="checkbox"
                      checked={Boolean(formData.shippingSameAsBilling)}
                      onChange={(e) => handleShippingSameToggle(e.target.checked)}
                      className="w-3.5 h-3.5 rounded border-slate-300 bg-white text-[#B88728] focus:ring-[#F5C451] cursor-pointer dark:border-white/[0.2] dark:bg-[#161B26] dark:text-white"
                    />
                    <span>Shipping same as billing.</span>
                  </label>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-5 gap-y-4">
                  <div>
                    <label className="text-[11px] font-medium text-slate-700 dark:text-slate-300 mb-1.5 block">
                      Address 1. <span className="text-red-500 font-bold">*</span>
                    </label>
                    <input
                      type="text"
                      disabled={Boolean(formData.shippingSameAsBilling)}
                      value={formData.shippingAddress1 || ""}
                      onChange={(e) => handleChange("shippingAddress1", e.target.value)}
                      placeholder="Plot- No-D-9/13A"
                      className={`w-full px-3.5 py-2.5 text-xs rounded-xl border outline-none ${
                        formData.shippingSameAsBilling
                          ? "bg-slate-100 border border-[#E7E0D2] text-slate-500 cursor-not-allowed select-none dark:bg-[#161B26]/50 dark:border-white/[0.04] dark:text-slate-400"
                          : "bg-white border border-[#E7E0D2] text-[#0A0E1A] placeholder-slate-400 focus:border-[#E8C16D] dark:bg-[#161B26] dark:border-white/[0.08] dark:focus:border-white/[0.2] dark:text-white"
                      }`}
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-medium text-slate-700 dark:text-slate-300 mb-1.5 block">
                      Address 2.
                    </label>
                    <input
                      type="text"
                      disabled={Boolean(formData.shippingSameAsBilling)}
                      value={formData.shippingAddress2 || ""}
                      onChange={(e) => handleChange("shippingAddress2", e.target.value)}
                      placeholder="Sachin Udhyognagar Sahakari Mandli"
                      className={`w-full px-3.5 py-2.5 text-xs rounded-xl border outline-none ${
                        formData.shippingSameAsBilling
                          ? "bg-slate-100 border border-[#E7E0D2] text-slate-500 cursor-not-allowed select-none dark:bg-[#161B26]/50 dark:border-white/[0.04] dark:text-slate-400"
                          : "bg-white border border-[#E7E0D2] text-[#0A0E1A] placeholder-slate-400 focus:border-[#E8C16D] dark:bg-[#161B26] dark:border-white/[0.08] dark:focus:border-white/[0.2] dark:text-white"
                      }`}
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-medium text-slate-700 dark:text-slate-300 mb-1.5 block">
                      Address 3.
                    </label>
                    <input
                      type="text"
                      disabled={Boolean(formData.shippingSameAsBilling)}
                      value={formData.shippingAddress3 || ""}
                      onChange={(e) => handleChange("shippingAddress3", e.target.value)}
                      placeholder="Hojiwal Industrial Estata vanz Road No-2"
                      className={`w-full px-3.5 py-2.5 text-xs rounded-xl border outline-none ${
                        formData.shippingSameAsBilling
                          ? "bg-slate-100 border border-[#E7E0D2] text-slate-500 cursor-not-allowed select-none dark:bg-[#161B26]/50 dark:border-white/[0.04] dark:text-slate-400"
                          : "bg-white border border-[#E7E0D2] text-[#0A0E1A] placeholder-slate-400 focus:border-[#E8C16D] dark:bg-[#161B26] dark:border-white/[0.08] dark:focus:border-white/[0.2] dark:text-white"
                      }`}
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-medium text-slate-700 dark:text-slate-300 mb-1.5 block">
                      Pincode. <span className="text-red-500 font-bold">*</span>
                    </label>
                    <input
                      type="text"
                      maxLength={6}
                      disabled={Boolean(formData.shippingSameAsBilling)}
                      value={formData.shippingPincode || ""}
                      onChange={(e) => handleChange("shippingPincode", e.target.value.replace(/\D/g, ""))}
                      placeholder="394230"
                      className={`w-full px-3.5 py-2.5 text-xs rounded-xl border outline-none font-mono ${
                        formData.shippingSameAsBilling
                          ? "bg-slate-100 border border-[#E7E0D2] text-slate-500 cursor-not-allowed select-none dark:bg-[#161B26]/50 dark:border-white/[0.04] dark:text-slate-400"
                          : "bg-white border border-[#E7E0D2] text-[#0A0E1A] placeholder-slate-400 focus:border-[#E8C16D] dark:bg-[#161B26] dark:border-white/[0.08] dark:focus:border-white/[0.2] dark:text-white"
                      }`}
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-medium text-slate-700 dark:text-slate-300 mb-1.5 block">
                      Area. <span className="text-red-500 font-bold">*</span>
                    </label>
                    <input
                      type="text"
                      disabled={Boolean(formData.shippingSameAsBilling)}
                      value={formData.shippingArea || ""}
                      onChange={(e) => handleChange("shippingArea", e.target.value)}
                      placeholder="Sachin"
                      className={`w-full px-3.5 py-2.5 text-xs rounded-xl border outline-none ${
                        formData.shippingSameAsBilling
                          ? "bg-slate-100 border border-[#E7E0D2] text-slate-500 cursor-not-allowed select-none dark:bg-[#161B26]/50 dark:border-white/[0.04] dark:text-slate-400"
                          : "bg-white border border-[#E7E0D2] text-[#0A0E1A] placeholder-slate-400 focus:border-[#E8C16D] dark:bg-[#161B26] dark:border-white/[0.08] dark:focus:border-white/[0.2] dark:text-white"
                      }`}
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-medium text-slate-700 dark:text-slate-300 mb-1.5 block">
                      City. <span className="text-red-500 font-bold">*</span>
                    </label>
                    <input
                      type="text"
                      disabled={Boolean(formData.shippingSameAsBilling)}
                      value={formData.shippingCity || ""}
                      onChange={(e) => handleChange("shippingCity", e.target.value)}
                      placeholder="Surat"
                      className={`w-full px-3.5 py-2.5 text-xs rounded-xl border outline-none ${
                        formData.shippingSameAsBilling
                          ? "bg-slate-100 border border-[#E7E0D2] text-slate-500 cursor-not-allowed select-none dark:bg-[#161B26]/50 dark:border-white/[0.04] dark:text-slate-400"
                          : "bg-white border border-[#E7E0D2] text-[#0A0E1A] placeholder-slate-400 focus:border-[#E8C16D] dark:bg-[#161B26] dark:border-white/[0.08] dark:focus:border-white/[0.2] dark:text-white"
                      }`}
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-medium text-slate-700 dark:text-slate-300 mb-1.5 block">
                      State. <span className="text-red-500 font-bold">*</span>
                    </label>
                    <ThemeSelectDropdown
                      disabled={Boolean(formData.shippingSameAsBilling)}
                      value={formData.shippingState || "Gujarat"}
                      onChange={(val) => handleChange("shippingState", val)}
                      options={stateOptions}
                      placeholder="Select a state"
                      className="w-full"
                      buttonClassName={cn(
                        dropdownButtonClassName,
                        formData.shippingSameAsBilling &&
                          "bg-slate-100 border-[#E7E0D2] text-slate-500 cursor-not-allowed pointer-events-none dark:bg-[#161B26]/50 dark:border-white/[0.04] dark:text-slate-400"
                      )}
                      menuClassName={dropdownMenuClassName}
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-medium text-slate-700 dark:text-slate-300 mb-1.5 block">
                      Country.
                    </label>
                    <input
                      type="text"
                      disabled
                      value={formData.shippingCountry || "India"}
                      className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-slate-100 border border-[#E7E0D2] text-slate-500 dark:bg-[#161B26]/50 dark:border-white/[0.06] dark:text-slate-400 outline-none cursor-not-allowed select-none"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-medium text-slate-700 dark:text-slate-300 mb-1.5 block">
                      Contact Name. <span className="text-red-500 font-bold">*</span>
                    </label>
                    <input
                      type="text"
                      disabled={Boolean(formData.shippingSameAsBilling)}
                      value={formData.shippingContactName || ""}
                      onChange={(e) => handleChange("shippingContactName", e.target.value)}
                      placeholder="Shailesh Bhatiya"
                      className={`w-full px-3.5 py-2.5 text-xs rounded-xl border outline-none ${
                        formData.shippingSameAsBilling
                          ? "bg-slate-100 border border-[#E7E0D2] text-slate-500 cursor-not-allowed select-none dark:bg-[#161B26]/50 dark:border-white/[0.04] dark:text-slate-400"
                          : "bg-white border border-[#E7E0D2] text-[#0A0E1A] placeholder-slate-400 focus:border-[#E8C16D] dark:bg-[#161B26] dark:border-white/[0.08] dark:focus:border-white/[0.2] dark:text-white"
                      }`}
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-[11px] font-medium text-slate-700 dark:text-slate-300">
                        Contact No. <span className="text-red-500 font-bold">*</span>
                      </label>
                      <span className="text-[10px] text-emerald-400 font-mono">
                        {formData.shippingContactNo ? formData.shippingContactNo.length : 0}/10
                      </span>
                    </div>
                    <input
                      type="text"
                      maxLength={10}
                      disabled={Boolean(formData.shippingSameAsBilling)}
                      value={formData.shippingContactNo || ""}
                      onChange={(e) =>
                        handleChange("shippingContactNo", e.target.value.replace(/\D/g, ""))
                      }
                      placeholder="9925377339"
                      className={`w-full px-3.5 py-2.5 text-xs rounded-xl border outline-none font-mono ${
                        formData.shippingSameAsBilling
                          ? "bg-slate-100 border border-[#E7E0D2] text-slate-500 cursor-not-allowed select-none dark:bg-[#161B26]/50 dark:border-white/[0.04] dark:text-slate-400"
                          : "bg-white border border-[#E7E0D2] text-[#0A0E1A] placeholder-slate-400 focus:border-[#E8C16D] dark:bg-[#161B26] dark:border-white/[0.08] dark:focus:border-white/[0.2] dark:text-white"
                      }`}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 3: ACCOUNTING DETAILS (Legal, Bank, Invoice, Other)                   */}
        {/* ========================================================================= */}
        {activeTab === "accounting" && (
          <div className="w-full">
            <div className="mb-6">
              <h2 className="text-sm font-bold text-[#0A0E1A] dark:text-white tracking-wide">
                Accounting Details
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Enter Legal, Invoicing and Banking Information
              </p>
            </div>

            {/* Top Grid: Legal vs Bank Details */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-10 gap-y-6 mb-8">
              {/* Legal Details */}
              <div>
                <h3 className="text-sm font-bold text-[#0A0E1A] dark:text-white mb-4">
                  Legal Details
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-5 gap-y-4">
                  {/* GST Number */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-[11px] font-medium text-slate-700 dark:text-slate-300">
                        GST Number. <span className="text-red-500 font-bold">*</span>
                      </label>
                      <span className="text-[10px] text-emerald-400 font-mono">
                        {formData.gstNumber ? formData.gstNumber.length : 0}/15
                      </span>
                    </div>
                    <input
                      type="text"
                      maxLength={15}
                      value={formData.gstNumber || ""}
                      onChange={(e) => handleChange("gstNumber", e.target.value.toUpperCase())}
                      placeholder="24CAGPB1419N1ZW"
                      className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-white border border-[#E7E0D2] text-[#0A0E1A] placeholder-slate-400 focus:border-[#E8C16D] dark:bg-[#161B26] dark:border-white/[0.08] dark:focus:border-white/[0.2] dark:text-white outline-none font-mono uppercase"
                    />
                  </div>

                  {/* TAN Number */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-[11px] font-medium text-slate-700 dark:text-slate-300">
                        TAN Number.
                      </label>
                      <span className="text-[10px] text-emerald-400 font-mono">
                        {formData.tanNumber ? formData.tanNumber.length : 0}/10
                      </span>
                    </div>
                    <input
                      type="text"
                      maxLength={10}
                      value={formData.tanNumber || ""}
                      onChange={(e) => handleChange("tanNumber", e.target.value.toUpperCase())}
                      placeholder="SRTD09780B"
                      className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-white border border-[#E7E0D2] text-[#0A0E1A] placeholder-slate-400 focus:border-[#E8C16D] dark:bg-[#161B26] dark:border-white/[0.08] dark:focus:border-white/[0.2] dark:text-white outline-none font-mono uppercase"
                    />
                  </div>

                  {/* PAN Number */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-[11px] font-medium text-slate-700 dark:text-slate-300">
                        PAN Number. <span className="text-red-500 font-bold">*</span>
                      </label>
                      <span className="text-[10px] text-emerald-400 font-mono">
                        {formData.panNumber ? formData.panNumber.length : 0}/10
                      </span>
                    </div>
                    <input
                      type="text"
                      maxLength={10}
                      value={formData.panNumber || ""}
                      onChange={(e) => handleChange("panNumber", e.target.value.toUpperCase())}
                      placeholder="CAGPB1419N"
                      className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-white border border-[#E7E0D2] text-[#0A0E1A] placeholder-slate-400 focus:border-[#E8C16D] dark:bg-[#161B26] dark:border-white/[0.08] dark:focus:border-white/[0.2] dark:text-white outline-none font-mono uppercase"
                    />
                  </div>

                  {/* Central Sale Tax Number */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-[11px] font-medium text-slate-700 dark:text-slate-300">
                        Central Sale Tax Number.
                      </label>
                      <span className="text-[10px] text-slate-500 font-mono">
                        {formData.cstNumber ? formData.cstNumber.length : 0}/11
                      </span>
                    </div>
                    <input
                      type="text"
                      maxLength={11}
                      value={formData.cstNumber || ""}
                      onChange={(e) => handleChange("cstNumber", e.target.value)}
                      placeholder=""
                      className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-white border border-[#E7E0D2] text-[#0A0E1A] placeholder-slate-400 focus:border-[#E8C16D] dark:bg-[#161B26] dark:border-white/[0.08] dark:focus:border-white/[0.2] dark:text-white outline-none font-mono"
                    />
                  </div>

                  {/* FSSAI Number */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-[11px] font-medium text-slate-700 dark:text-slate-300">
                        FSSAI Number.
                      </label>
                      <span className="text-[10px] text-slate-500 font-mono">
                        {formData.fssaiNumber ? formData.fssaiNumber.length : 0}/14
                      </span>
                    </div>
                    <input
                      type="text"
                      maxLength={14}
                      value={formData.fssaiNumber || ""}
                      onChange={(e) => handleChange("fssaiNumber", e.target.value)}
                      placeholder=""
                      className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-white border border-[#E7E0D2] text-[#0A0E1A] placeholder-slate-400 focus:border-[#E8C16D] dark:bg-[#161B26] dark:border-white/[0.08] dark:focus:border-white/[0.2] dark:text-white outline-none font-mono"
                    />
                  </div>

                  {/* Trade Category */}
                  <div>
                    <label className="text-[11px] font-medium text-slate-700 dark:text-slate-300 mb-1.5 block">
                      Trade Category.
                    </label>
                    <ThemeSelectDropdown
                      value={formData.tradeCategory || "Manufacturing"}
                      onChange={(val) => handleChange("tradeCategory", val)}
                      options={tradeCategoryOptions}
                      placeholder="Select Trade Category"
                      className="w-full"
                      buttonClassName={dropdownButtonClassName}
                      menuClassName={dropdownMenuClassName}
                    />
                  </div>

                  {/* MSME Number */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-[11px] font-medium text-slate-700 dark:text-slate-300">
                        MSME Number.
                      </label>
                      <span className="text-[10px] text-slate-500 font-mono">
                        {formData.msmeNumber ? formData.msmeNumber.length : 0}/19
                      </span>
                    </div>
                    <input
                      type="text"
                      maxLength={19}
                      value={formData.msmeNumber || ""}
                      onChange={(e) => handleChange("msmeNumber", e.target.value)}
                      placeholder=""
                      className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-white border border-[#E7E0D2] text-[#0A0E1A] placeholder-slate-400 focus:border-[#E8C16D] dark:bg-[#161B26] dark:border-white/[0.08] dark:focus:border-white/[0.2] dark:text-white outline-none font-mono"
                    />
                  </div>

                  {/* Empty cell to balance MSME */}
                  <div />
                </div>
              </div>

              {/* Bank Details */}
              <div>
                <h3 className="text-sm font-bold text-[#0A0E1A] dark:text-white mb-4">
                  Bank Details
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-5 gap-y-4">
                  <div>
                    <label className="text-[11px] font-medium text-slate-700 dark:text-slate-300 mb-1.5 block">
                      Bank Name. <span className="text-red-500 font-bold">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.bankName || ""}
                      onChange={(e) => handleChange("bankName", e.target.value)}
                      placeholder="KOTAK MAHINDRA BANK"
                      className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-white border border-[#E7E0D2] text-[#0A0E1A] placeholder-slate-400 focus:border-[#E8C16D] dark:bg-[#161B26] dark:border-white/[0.08] dark:focus:border-white/[0.2] dark:text-white outline-none uppercase"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-medium text-slate-700 dark:text-slate-300 mb-1.5 block">
                      Account Holder Name. <span className="text-red-500 font-bold">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.accountHolderName || ""}
                      onChange={(e) => handleChange("accountHolderName", e.target.value)}
                      placeholder="DIPABEN RAMESHBHAI BHATIYA"
                      className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-white border border-[#E7E0D2] text-[#0A0E1A] placeholder-slate-400 focus:border-[#E8C16D] dark:bg-[#161B26] dark:border-white/[0.08] dark:focus:border-white/[0.2] dark:text-white outline-none uppercase"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-medium text-slate-700 dark:text-slate-300 mb-1.5 block">
                      Account Name.
                    </label>
                    <input
                      type="text"
                      value={formData.accountName || ""}
                      onChange={(e) => handleChange("accountName", e.target.value)}
                      placeholder="JAY BHAVANI FASHION"
                      className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-white border border-[#E7E0D2] text-[#0A0E1A] placeholder-slate-400 focus:border-[#E8C16D] dark:bg-[#161B26] dark:border-white/[0.08] dark:focus:border-white/[0.2] dark:text-white outline-none uppercase"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-medium text-slate-700 dark:text-slate-300 mb-1.5 block">
                      Bank Account Number. <span className="text-red-500 font-bold">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.accountNumber || ""}
                      onChange={(e) => handleChange("accountNumber", e.target.value)}
                      placeholder="9925828382"
                      className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-white border border-[#E7E0D2] text-[#0A0E1A] placeholder-slate-400 focus:border-[#E8C16D] dark:bg-[#161B26] dark:border-white/[0.08] dark:focus:border-white/[0.2] dark:text-white outline-none font-mono"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-medium text-slate-700 dark:text-slate-300 mb-1.5 block">
                      IFSC Code. <span className="text-red-500 font-bold">*</span>
                    </label>
                    <input
                      type="text"
                      maxLength={11}
                      value={formData.ifscCode || ""}
                      onChange={(e) => handleChange("ifscCode", e.target.value.toUpperCase())}
                      placeholder="KKBK0002868"
                      className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-white border border-[#E7E0D2] text-[#0A0E1A] placeholder-slate-400 focus:border-[#E8C16D] dark:bg-[#161B26] dark:border-white/[0.08] dark:focus:border-white/[0.2] dark:text-white outline-none font-mono uppercase"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-medium text-slate-700 dark:text-slate-300 mb-1.5 block">
                      Account Type. <span className="text-red-500 font-bold">*</span>
                    </label>
                    <ThemeSelectDropdown
                      value={formData.accountType || "Current"}
                      onChange={(val) => handleChange("accountType", val)}
                      options={accountTypeOptions}
                      placeholder="Select Account Type"
                      className="w-full"
                      buttonClassName={dropdownButtonClassName}
                      menuClassName={dropdownMenuClassName}
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-medium text-slate-700 dark:text-slate-300 mb-1.5 block">
                      Branch Name. <span className="text-red-500 font-bold">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.branchName || ""}
                      onChange={(e) => handleChange("branchName", e.target.value)}
                      placeholder="KATARGAM SURAT"
                      className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-white border border-[#E7E0D2] text-[#0A0E1A] placeholder-slate-400 focus:border-[#E8C16D] dark:bg-[#161B26] dark:border-white/[0.08] dark:focus:border-white/[0.2] dark:text-white outline-none uppercase"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-medium text-slate-700 dark:text-slate-300 mb-1.5 block">
                      UPI ID. <span className="text-red-500 font-bold">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.upiId || ""}
                      onChange={(e) => handleChange("upiId", e.target.value)}
                      placeholder=""
                      className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-white border border-[#E7E0D2] text-[#0A0E1A] placeholder-slate-400 focus:border-[#E8C16D] dark:bg-[#161B26] dark:border-white/[0.08] dark:focus:border-white/[0.2] dark:text-white outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-medium text-slate-700 dark:text-slate-300 mb-1.5 block">
                      Client Code.
                    </label>
                    <input
                      type="text"
                      value={formData.clientCode || ""}
                      onChange={(e) => handleChange("clientCode", e.target.value)}
                      placeholder=""
                      className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-white border border-[#E7E0D2] text-[#0A0E1A] placeholder-slate-400 focus:border-[#E8C16D] dark:bg-[#161B26] dark:border-white/[0.08] dark:focus:border-white/[0.2] dark:text-white outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-medium text-slate-700 dark:text-slate-300 mb-1.5 block">
                      Product Code.
                    </label>
                    <input
                      type="text"
                      value={formData.productCode || ""}
                      onChange={(e) => handleChange("productCode", e.target.value)}
                      placeholder=""
                      className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-white border border-[#E7E0D2] text-[#0A0E1A] placeholder-slate-400 focus:border-[#E8C16D] dark:bg-[#161B26] dark:border-white/[0.08] dark:focus:border-white/[0.2] dark:text-white outline-none"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Grid: Invoice Details vs Other Details */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-10 gap-y-6 pt-6">
              {/* Invoice Details */}
              <div>
                <h3 className="text-sm font-bold text-[#0A0E1A] dark:text-white mb-4">
                  Invoice Details
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-5 gap-y-4">
                  <div>
                    <label className="text-[11px] font-medium text-slate-700 dark:text-slate-300 mb-1.5 block">
                      TAX Invoice Prefix.
                    </label>
                    <input
                      type="text"
                      value={formData.taxInvoicePrefix || "JBFT"}
                      onChange={(e) => handleChange("taxInvoicePrefix", e.target.value.toUpperCase())}
                      placeholder="JBFT"
                      className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-white border border-[#E7E0D2] text-[#0A0E1A] placeholder-slate-400 focus:border-[#E8C16D] dark:bg-[#161B26] dark:border-white/[0.08] dark:focus:border-white/[0.2] dark:text-white outline-none uppercase font-mono"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-medium text-slate-700 dark:text-slate-300 mb-1.5 block">
                      TAX Invoice Next.
                    </label>
                    <input
                      type="text"
                      value={formData.taxInvoiceNext || "1"}
                      onChange={(e) => handleChange("taxInvoiceNext", e.target.value)}
                      placeholder="1"
                      className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-white border border-[#E7E0D2] text-[#0A0E1A] placeholder-slate-400 focus:border-[#E8C16D] dark:bg-[#161B26] dark:border-white/[0.08] dark:focus:border-white/[0.2] dark:text-white outline-none font-mono"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-medium text-slate-700 dark:text-slate-300 mb-1.5 block">
                      Retail Invoice Prefix.
                    </label>
                    <input
                      type="text"
                      value={formData.retailInvoicePrefix || "JBFR"}
                      onChange={(e) => handleChange("retailInvoicePrefix", e.target.value.toUpperCase())}
                      placeholder="JBFR"
                      className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-white border border-[#E7E0D2] text-[#0A0E1A] placeholder-slate-400 focus:border-[#E8C16D] dark:bg-[#161B26] dark:border-white/[0.08] dark:focus:border-white/[0.2] dark:text-white outline-none uppercase font-mono"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-medium text-slate-700 dark:text-slate-300 mb-1.5 block">
                      Retail Invoice Next.
                    </label>
                    <input
                      type="text"
                      value={formData.retailInvoiceNext || "1"}
                      onChange={(e) => handleChange("retailInvoiceNext", e.target.value)}
                      placeholder="1"
                      className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-white border border-[#E7E0D2] text-[#0A0E1A] placeholder-slate-400 focus:border-[#E8C16D] dark:bg-[#161B26] dark:border-white/[0.08] dark:focus:border-white/[0.2] dark:text-white outline-none font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* Other Details */}
              <div>
                <h3 className="text-sm font-bold text-[#0A0E1A] dark:text-white mb-4">
                  Other Details
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-5 gap-y-4">
                  <div>
                    <label className="text-[11px] font-medium text-slate-700 dark:text-slate-300 mb-1.5 block">
                      Consider in Profit & Loss.
                    </label>
                    <ThemeSelectDropdown
                      value={formData.considerInPnL || "Yes"}
                      onChange={(val) => handleChange("considerInPnL", val)}
                      options={considerInPnLOptions}
                      placeholder="Select option"
                      className="w-full"
                      buttonClassName={dropdownButtonClassName}
                      menuClassName={dropdownMenuClassName}
                    />
                  </div>
                  <div />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 4: LOGO                                                               */}
        {/* ========================================================================= */}
        {activeTab === "logo" && (
          <div className="w-full">
            <div className="mb-6">
              <h2 className="text-sm font-bold text-[#0A0E1A] dark:text-white tracking-wide">
                Company Logo <span className="text-red-500 font-bold">*</span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Upload your company logo
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-10 gap-y-6">
              <div>
                <input
                  type="file"
                  ref={logoInputRef}
                  onChange={handleLogoUpload}
                  accept="image/png,image/jpeg,image/webp,image/svg+xml"
                  className="hidden"
                />

                <div
                  role="button"
                  tabIndex={0}
                  onClick={() => logoInputRef.current?.click()}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      logoInputRef.current?.click();
                    }
                  }}
                  onDragOver={(e) => {
                    e.preventDefault();
                    setIsLogoDragging(true);
                  }}
                  onDragLeave={() => setIsLogoDragging(false)}
                  onDrop={handleLogoDrop}
                  className={`w-48 h-48 rounded-2xl bg-slate-50 border ${
                    isLogoDragging
                      ? "border-[#E8C16D] ring-2 ring-[#E8C16D]/30"
                      : "border-[#E7E0D2] hover:border-[#E8C16D]/50 dark:border-white/[0.1] dark:hover:border-white/30"
                  } dark:bg-[#0B0F17] flex flex-col items-center justify-center p-4 shadow-sm dark:shadow-2xl overflow-hidden relative group cursor-pointer transition-all select-none`}
                  title="Click to select and upload company logo"
                >
                  {formData.logoUrl ? (
                    <img
                      src={getMediaUrl(formData.logoUrl)}
                      alt="Company Logo"
                      className="w-full h-full object-contain"
                    />
                  ) : (
                    <div className="flex flex-col items-center justify-center text-center select-none">
                      <svg
                        width="54"
                        height="42"
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
                      <span className="text-[11px] font-black uppercase tracking-tight text-slate-800 dark:text-white mt-3.5 leading-tight px-2">
                        {formData.companyName || company?.companyName || "JAY BHAVANI FASHION"}
                      </span>
                    </div>
                  )}

                  {/* Remove Button if custom logo is uploaded */}
                  {formData.logoUrl && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleChange("logoUrl", "");
                        toast.success("Logo removed.");
                      }}
                      className="absolute top-2.5 right-2.5 p-1.5 rounded-lg bg-black/80 hover:bg-rose-600/90 text-slate-700 dark:text-slate-300 hover:text-white border border-white/10 opacity-0 group-hover:opacity-100 transition-all z-20 cursor-pointer shadow-lg"
                      title="Remove Logo"
                    >
                      <Trash2 size={13} />
                    </button>
                  )}

                  {/* Hover Overlay indicating click to upload */}
                  <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px] opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1.5 text-white pointer-events-none">
                    <Upload size={22} className="text-white" />
                    <span className="text-xs font-semibold">
                      {formData.logoUrl ? "Change Logo" : "Upload Logo"}
                    </span>
                    <span className="text-[10px] text-slate-700 dark:text-slate-300">Click or drag & drop</span>
                  </div>
                </div>
              </div>
              <div />
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 5: SIGNATURE                                                          */}
        {/* ========================================================================= */}
        {activeTab === "signature" && (
          <div className="w-full">
            <div className="mb-6">
              <h2 className="text-sm font-bold text-[#0A0E1A] dark:text-white tracking-wide">
                Company Signature <span className="text-red-500 font-bold">*</span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Upload authorized signatory signature for invoices and tax documents
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-10 gap-y-6">
              <div>
                <input
                  type="file"
                  ref={signatureInputRef}
                  onChange={handleSignatureUpload}
                  accept="image/png,image/jpeg,image/webp,image/svg+xml"
                  className="hidden"
                />

                <div
                  role="button"
                  tabIndex={0}
                  onClick={() => signatureInputRef.current?.click()}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      signatureInputRef.current?.click();
                    }
                  }}
                  onDragOver={(e) => {
                    e.preventDefault();
                    setIsSignatureDragging(true);
                  }}
                  onDragLeave={() => setIsSignatureDragging(false)}
                  onDrop={handleSignatureDrop}
                  className={`w-64 h-36 rounded-2xl bg-slate-50 border ${
                    isSignatureDragging
                      ? "border-[#E8C16D] ring-2 ring-[#E8C16D]/30"
                      : "border-[#E7E0D2] hover:border-[#E8C16D]/50 dark:border-white/[0.1] dark:hover:border-white/30"
                  } dark:bg-[#0B0F17] flex items-center justify-center p-4 shadow-sm dark:shadow-2xl overflow-hidden relative group cursor-pointer transition-all select-none`}
                  title="Click to select and upload company signature"
                >
                  {formData.signatureUrl ? (
                    <img
                      src={getMediaUrl(formData.signatureUrl)}
                      alt="Signature"
                      className="w-full h-full object-contain"
                    />
                  ) : (
                    <div className="flex flex-col items-center justify-center text-slate-500 text-center select-none">
                      <FileText size={28} className="mb-1.5 text-slate-400 dark:text-slate-500" />
                      <span className="text-xs font-medium text-slate-600 dark:text-slate-400">No Signature Uploaded</span>
                    </div>
                  )}

                  {/* Remove Button if custom signature is uploaded */}
                  {formData.signatureUrl && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleChange("signatureUrl", "");
                        toast.success("Signature removed.");
                      }}
                      className="absolute top-2.5 right-2.5 p-1.5 rounded-lg bg-black/80 hover:bg-rose-600/90 text-slate-700 dark:text-slate-300 hover:text-white border border-white/10 opacity-0 group-hover:opacity-100 transition-all z-20 cursor-pointer shadow-lg"
                      title="Remove Signature"
                    >
                      <Trash2 size={13} />
                    </button>
                  )}

                  {/* Hover Overlay indicating click to upload */}
                  <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px] opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1.5 text-white pointer-events-none">
                    <Upload size={22} className="text-white" />
                    <span className="text-xs font-semibold">
                      {formData.signatureUrl ? "Change Signature" : "Upload Signature"}
                    </span>
                    <span className="text-[10px] text-slate-700 dark:text-slate-300">Click or drag & drop</span>
                  </div>
                </div>
              </div>
              <div />
            </div>
          </div>
        )}
      </div>

      {/* Bottom Sticky Action Bar */}
      <div className="p-4 sm:p-5 border-t border-slate-200 bg-slate-50 dark:border-white/[0.08] dark:bg-[#0E121A] w-full">
        <div className="w-full flex items-center justify-between">
          {/* Left: Completion Percentage bar */}
          <div className="w-48 sm:w-64 space-y-1">
            <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Completion Percentage: {completionPercentage}%
            </p>
            <div className="w-full h-2 rounded-full bg-slate-200 dark:bg-white/[0.1] overflow-hidden">
              <div
                className="h-full bg-[#0A0E1A] dark:bg-[#F5C451] rounded-full transition-all duration-300"
                style={{ width: `${completionPercentage}%` }}
              />
            </div>
          </div>

          {/* Right: Save Button */}
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#0A0E1A] hover:bg-black text-white dark:bg-[#F5C451] dark:text-slate-900 dark:hover:bg-[#e8b83e] font-bold text-xs sm:text-sm shadow-md transition-all cursor-pointer active:scale-95 disabled:opacity-50"
          >
            {saving ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <Save size={16} />
            )}
            <span>{saving ? "Saving..." : "Save"}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
