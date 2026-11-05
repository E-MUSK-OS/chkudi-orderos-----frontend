"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import {
  ArrowLeft,
  Circle,
  CheckCircle2,
  Save,
  Upload,
  Trash2,
  Loader2,
  Check,
  BookOpen,
  MapPin,
  Scale,
  Landmark,
  CircleDot,
  FileText,
} from "lucide-react";
import { Ledger, CreateLedgerPayload } from "../types/ledger.types";
import { ledgerService } from "../services/ledger.service";
import { toast } from "sonner";
import ThemeSelectDropdown, {
  ThemeSelectOption,
} from "@/components/ui/ThemeSelectDropdown";
import DatePicker from "@/components/ui/DatePicker";
import { cn, getMediaUrl } from "@/lib/utils";

interface LedgerBookFormProps {
  initialLedger?: Ledger | null;
  onBack: () => void;
  onSaved: (saved: Ledger) => void;
}

type TabType = "general" | "contact" | "accounting" | "logo";

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
  "Assam",
  "Chandigarh",
  "Chhattisgarh",
  "Himachal Pradesh",
  "Jammu and Kashmir",
  "Jharkhand",
  "Uttarakhand",
];

const ACCOUNT_HEAD_OPTIONS = [
  "Sundry Debtors",
  "Sundry Creditors",
  "Employee",
  "Bank Accounts",
  "Cash-in-hand",
  "Direct Expenses",
  "Indirect Expenses",
  "Direct Incomes",
  "Indirect Incomes",
  "Capital Account",
  "Duties & Taxes",
  "Purchase Accounts",
  "Sales Accounts",
  "Loans & Advances",
  "Current Assets",
  "Current Liabilities",
  "Fixed Assets",
  "Investments",
];

export default function LedgerBookForm({
  initialLedger,
  onBack,
  onSaved,
}: LedgerBookFormProps) {
  const [activeTab, setActiveTab] = useState<TabType>("general");
  const [saving, setSaving] = useState(false);
  const [isLogoDragging, setIsLogoDragging] = useState(false);
  const logoInputRef = useRef<HTMLInputElement>(null);

  const isEditMode = Boolean(initialLedger?.id);

  // Today's formatted date: DD-MM-YYYY
  const todayFormatted = useMemo(() => {
    const d = new Date();
    const day = String(d.getDate()).padStart(2, "0");
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const year = d.getFullYear();
    return `${day}-${month}-${year}`;
  }, []);

  // ThemeSelectDropdown options
  const accountHeadOptions: ThemeSelectOption[] = useMemo(
    () => ACCOUNT_HEAD_OPTIONS.map((opt) => ({ value: opt, label: opt })),
    []
  );

  const balanceTypeOptions: ThemeSelectOption[] = useMemo(
    () => [
      { value: "Dr", label: "Dr" },
      { value: "Cr", label: "Cr" },
    ],
    []
  );

  const stateOptions: ThemeSelectOption[] = useMemo(
    () => INDIAN_STATES.map((st) => ({ value: st, label: st })),
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

  const commonInputClass =
    "w-full h-11 px-4 text-xs sm:text-sm rounded-full bg-white border border-[#E7E0D2] text-[#0A0E1A] placeholder:text-slate-400 focus:outline-none focus:border-[#E8C16D] focus:ring-2 focus:ring-[#E8C16D]/20 dark:bg-[#080B11] dark:border-white/[0.08] dark:text-white dark:placeholder:text-slate-500 dark:focus:border-[#E8C16D] transition-all";

  const dropdownButtonClassName =
    "w-full justify-between h-11 px-4 text-xs sm:text-sm font-normal rounded-full bg-white border border-[#E7E0D2] text-[#0A0E1A] hover:border-[#E8C16D] dark:bg-[#080B11] dark:border-white/[0.08] dark:text-white dark:hover:border-[#E8C16D] transition-all";

  const dropdownMenuClassName =
    "w-full min-w-full max-w-none bg-white border border-[#E7E0D2] text-[#0A0E1A] dark:bg-[#0F1626] dark:border-white/[0.08] dark:text-white rounded-2xl shadow-2xl";

  const datePickerButtonClassName =
    "h-11 px-4 text-xs sm:text-sm rounded-full bg-white border border-[#E7E0D2] text-[#0A0E1A] hover:border-[#E8C16D] dark:bg-[#080B11] dark:border-white/[0.08] dark:text-white dark:hover:border-[#E8C16D] transition-all";

  const [formData, setFormData] = useState<CreateLedgerPayload>({
    // General
    partyName: "",
    alias: "",
    accountCode: "",
    accountHead: "Sundry Debtors",
    email: "",
    contactPerson: "",
    creationDate: todayFormatted,
    openingBalance: 0,
    balanceType: "Dr",
    isActive: true,

    // Contact - Billing
    addressLine1: "",
    addressLine2: "",
    addressLine3: "",
    pincode: "",
    area: "",
    city: "",
    state: "Gujarat",
    country: "India",
    phone: "",

    // Contact - Shipping
    shippingSameAsBilling: true,
    shippingAddress1: "",
    shippingAddress2: "",
    shippingAddress3: "",
    shippingPincode: "",
    shippingArea: "",
    shippingCity: "",
    shippingState: "Gujarat",
    shippingCountry: "India",
    shippingPhone: "",

    // Accounting - Taxation & Legal
    gstin: "",
    pan: "",
    msmeNumber: "",
    legalName: "",

    // Accounting - Bank Details
    accountNumber: "",
    accountHolderName: "",
    bankName: "",
    branchName: "",
    accountType: "Current",
    ifsc: "",

    // Accounting - Other Details
    creditDebitLimit: 0,
    billDueDays: 0,
    refContactName: "",

    // Logo & metadata
    logoUrl: "",
    completionPercentage: 0,
  });

  // Populate initial values on edit mode
  useEffect(() => {
    if (initialLedger) {
      setFormData({
        partyName: initialLedger.partyName || "",
        alias: initialLedger.alias || initialLedger.accountCode || "",
        accountCode: initialLedger.accountCode || "",
        accountHead: initialLedger.accountHead || "Sundry Debtors",
        email: initialLedger.email || "",
        contactPerson: initialLedger.contactPerson || "",
        creationDate: initialLedger.joinDate
          ? new Date(initialLedger.joinDate).toISOString().split("T")[0]
          : todayFormatted,
        openingBalance: initialLedger.openingBalance || 0,
        balanceType: initialLedger.balanceType || "Dr",
        isActive: initialLedger.isActive !== undefined ? initialLedger.isActive : true,

        addressLine1: initialLedger.addressLine1 || "",
        addressLine2: initialLedger.addressLine2 || "",
        addressLine3: initialLedger.addressLine3 || "",
        pincode: initialLedger.pincode || "",
        area: initialLedger.area || "",
        city: initialLedger.city || "",
        state: initialLedger.state || "Gujarat",
        country: initialLedger.country || "India",
        phone: initialLedger.phone || "",

        shippingSameAsBilling: initialLedger.shippingSameAsBilling ?? true,
        shippingAddress1: initialLedger.shippingAddress1 || "",
        shippingAddress2: initialLedger.shippingAddress2 || "",
        shippingAddress3: initialLedger.shippingAddress3 || "",
        shippingPincode: initialLedger.shippingPincode || "",
        shippingArea: initialLedger.shippingArea || "",
        shippingCity: initialLedger.shippingCity || "",
        shippingState: initialLedger.shippingState || "Gujarat",
        shippingCountry: initialLedger.shippingCountry || "India",
        shippingPhone: initialLedger.shippingPhone || "",

        gstin: initialLedger.gstin || "",
        pan: initialLedger.pan || "",
        msmeNumber: initialLedger.msmeNumber || "",
        legalName: initialLedger.legalName || initialLedger.partyName || "",

        accountNumber: initialLedger.accountNumber || "",
        accountHolderName: initialLedger.accountHolderName || initialLedger.contactPerson || "",
        bankName: initialLedger.bankName || "",
        branchName: initialLedger.branchName || "",
        accountType: initialLedger.accountType || "Current",
        ifsc: initialLedger.ifsc || "",

        creditDebitLimit: initialLedger.creditDebitLimit || initialLedger.creditLimit || 0,
        billDueDays: initialLedger.billDueDays || 0,
        refContactName: initialLedger.refContactName || "",

        logoUrl: initialLedger.logoUrl || "",
        completionPercentage: initialLedger.completionPercentage || 0,
      });
    }
  }, [initialLedger, todayFormatted]);

  const handleChange = (field: keyof CreateLedgerPayload, value: any) => {
    setFormData((prev) => {
      const next = { ...prev, [field]: value };

      // Auto generate alias/code from partyName if alias is empty
      if (field === "partyName" && (!prev.alias || prev.alias.trim() === "")) {
        const words = String(value).trim().split(/\s+/);
        const code =
          words.length === 1
            ? words[0].slice(0, 4).toUpperCase()
            : words
                .map((w) => w[0])
                .join("")
                .toUpperCase()
                .slice(0, 10);
        next.alias = code;
        next.accountCode = code;
      }

      // If Shipping is set to Same as Billing, sync billing fields
      if (
        next.shippingSameAsBilling &&
        (field === "addressLine1" ||
          field === "addressLine2" ||
          field === "addressLine3" ||
          field === "pincode" ||
          field === "area" ||
          field === "city" ||
          field === "state" ||
          field === "country" ||
          field === "phone")
      ) {
        if (field === "addressLine1") next.shippingAddress1 = value;
        if (field === "addressLine2") next.shippingAddress2 = value;
        if (field === "addressLine3") next.shippingAddress3 = value;
        if (field === "pincode") next.shippingPincode = value;
        if (field === "area") next.shippingArea = value;
        if (field === "city") next.shippingCity = value;
        if (field === "state") next.shippingState = value;
        if (field === "country") next.shippingCountry = value;
        if (field === "phone") next.shippingPhone = value;
      }

      return next;
    });
  };

  const handleShippingSameToggle = (checked: boolean) => {
    setFormData((prev) => {
      const next = { ...prev, shippingSameAsBilling: checked };
      if (checked) {
        next.shippingAddress1 = prev.addressLine1;
        next.shippingAddress2 = prev.addressLine2;
        next.shippingAddress3 = prev.addressLine3;
        next.shippingPincode = prev.pincode;
        next.shippingArea = prev.area;
        next.shippingCity = prev.city;
        next.shippingState = prev.state;
        next.shippingCountry = prev.country;
        next.shippingPhone = prev.phone;
      }
      return next;
    });
  };

  // Completion Percentage calculation matching Company Profile
  const completionPercentage = useMemo(() => {
    const requiredFields = [
      formData.partyName,
      formData.alias,
      formData.accountHead,
      formData.addressLine1,
      formData.city,
      formData.state,
      formData.pincode,
      formData.gstin,
      formData.pan,
      formData.bankName,
      formData.accountNumber,
      formData.ifsc,
    ];
    const filled = requiredFields.filter((f) => f && String(f).trim().length > 0).length;
    return Math.min(100, Math.round((filled / requiredFields.length) * 100));
  }, [formData]);

  // Handle Logo Upload
  const handleLogoFile = (file: File) => {
    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image file (PNG, JPG, SVG, WebP).");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Logo file size must be less than 5MB.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      handleChange("logoUrl", reader.result as string);
      toast.success("Logo uploaded successfully.");
    };
    reader.onerror = () => {
      toast.error("Failed to read logo image.");
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    if (!formData.partyName || formData.partyName.trim() === "") {
      toast.error("Ledger Name is required.");
      setActiveTab("general");
      return;
    }

    if (!formData.alias || formData.alias.trim() === "") {
      toast.error("Alias is required.");
      setActiveTab("general");
      return;
    }

    if (!formData.accountHead || formData.accountHead.trim() === "") {
      toast.error("Account Head is required.");
      setActiveTab("general");
      return;
    }

    try {
      setSaving(true);
      const payload: CreateLedgerPayload = {
        ...formData,
        completionPercentage,
      };

      let resultLedger: Ledger;
      if (isEditMode && initialLedger?.id) {
        const res = await ledgerService.updateLedger(initialLedger.id, payload);
        toast.success(res.message || "Ledger updated successfully.");
        resultLedger = res.data;
      } else {
        const res = await ledgerService.createLedger(payload);
        toast.success(res.message || "Ledger created successfully.");
        resultLedger = res.data;
      }

      onSaved(resultLedger);
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Failed to save ledger.");
    } finally {
      setSaving(false);
    }
  };

  // Tabs definition matching Company Profile
  const tabs = [
    {
      key: "general",
      label: "General",
      completed: Boolean(formData.partyName && formData.alias && formData.accountHead),
    },
    {
      key: "contact",
      label: "Contact",
      completed: Boolean(formData.addressLine1 && formData.city && formData.state),
    },
    {
      key: "accounting",
      label: "Accounting",
      completed: Boolean((formData.gstin || formData.pan) && formData.bankName),
    },
    {
      key: "logo",
      label: "Logo",
      completed: Boolean(formData.logoUrl),
    },
  ];

  return (
    <div className="w-full font-sans text-slate-900 dark:text-slate-100 pb-8 space-y-4 max-w-[1600px] mx-auto">
      {/* ========================================================================= */}
      {/* 1. TOP HEADER BAR matching Company Profile / Main Ledger Book Page        */}
      {/* ========================================================================= */}
      <div className="w-full rounded-2xl sm:rounded-3xl border border-[#E7E0D2] dark:border-white/[0.08] bg-white dark:bg-[#0F1626] px-5 sm:px-7 py-4 sm:py-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4 shadow-sm">
        <div className="flex items-center gap-3.5">
          <button
            type="button"
            onClick={onBack}
            className="p-2 rounded-xl hover:bg-slate-100 text-slate-700 hover:text-slate-900 dark:hover:bg-white/[0.08] dark:text-slate-300 dark:hover:text-white transition-colors cursor-pointer shrink-0"
            title="Back to Ledger Book"
          >
            <ArrowLeft size={22} />
          </button>
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#FFF9EC] text-[#B88728] border border-[#E8C16D]/40 dark:bg-[#1A160E] dark:text-[#E8C16D] shrink-0">
            <BookOpen className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-[#0A0E1A] dark:text-white">
              Ledger Book
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
              <span className="font-bold text-[#B88728] dark:text-[#E8C16D]">Name.</span>{" "}
              <span className="text-slate-900 dark:text-white font-medium">
                {formData.partyName || initialLedger?.partyName || "---"}
              </span>
              <span className="mx-2 text-slate-400">·</span>
              <span className="font-bold text-[#B88728] dark:text-[#E8C16D]">GSTN.</span>{" "}
              <span className="text-slate-900 dark:text-white font-medium">
                {formData.gstin || initialLedger?.gstin || "---"}
              </span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 sm:gap-3 shrink-0">
          {/* Active Status Badge matching Company Profile */}
          <button
            type="button"
            onClick={() => handleChange("isActive", !formData.isActive)}
            className={cn(
              "inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs sm:text-sm font-bold transition-all cursor-pointer shadow-xs border",
              formData.isActive
                ? "bg-[#FFF9EC] text-[#B88728] border-[#E8C16D]/50 dark:bg-[#1A160E] dark:text-[#E8C16D] dark:border-[#E8C16D]/30"
                : "bg-rose-50 text-rose-600 border-rose-200 dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-900/50"
            )}
            title="Click to toggle status"
          >
            <span>{formData.isActive ? "Active" : "Inactive"}</span>
            {formData.isActive && <Check size={14} className="stroke-[3]" />}
          </button>

          {/* Edit Mode / New Mode Pill matching Company Profile */}
          <div className="px-4 py-2 rounded-full text-xs sm:text-sm font-bold bg-[#0A0E1A] text-white border border-[#0A0E1A] dark:bg-[#080B11] dark:text-slate-300 dark:border-white/[0.1] shadow-xs select-none">
            {isEditMode ? "Edit Mode" : "New Mode"}
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. TABS FLOATING BAR matching Company Profile Edit UI                      */}
      {/* ========================================================================= */}
      <div className="w-full rounded-2xl sm:rounded-full border border-[#E7E0D2] dark:border-white/[0.08] bg-white dark:bg-[#0F1626] p-1.5 flex items-center justify-between gap-1 shadow-sm overflow-x-auto no-scrollbar">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key as TabType)}
              className={cn(
                "flex-1 flex items-center justify-center gap-2 py-2 px-3 sm:px-6 rounded-full text-xs sm:text-sm font-bold transition-all cursor-pointer whitespace-nowrap",
                isActive
                  ? "bg-[#0A0E1A] text-[#E8C16D] shadow-md border border-[#0A0E1A] dark:bg-[#E8C16D] dark:text-[#0A0E1A] dark:border-[#E8C16D] dark:shadow-[0_0_16px_rgba(232,193,109,0.4)]"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-300 dark:hover:text-white dark:hover:bg-white/[0.05] border border-transparent font-medium"
              )}
            >
              {isActive ? (
                <CheckCircle2 size={16} className="text-[#E8C16D] dark:text-[#0A0E1A] shrink-0" />
              ) : tab.completed ? (
                <CheckCircle2 size={16} className="text-emerald-500 shrink-0" />
              ) : (
                <Circle size={16} className="text-slate-400 dark:text-slate-500 shrink-0" />
              )}
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* ========================================================================= */}
      {/* 3. MAIN FORM CARD matching Edit Company UI theme                          */}
      {/* ========================================================================= */}
      <div className="w-full rounded-3xl border border-[#E7E0D2] dark:border-white/[0.08] bg-white dark:bg-[#0F1626] p-6 sm:p-8 shadow-sm">
        {/* ========================================================================= */}
        {/* TAB 1: GENERAL DETAILS                                                   */}
        {/* ========================================================================= */}
        {activeTab === "general" && (
          <div className="w-full">
            {/* Section Header with Golden BookOpen Icon Badge */}
            <div className="flex items-center gap-3.5 mb-7 pb-4 border-b border-slate-100 dark:border-white/[0.06]">
              <div className="w-11 h-11 rounded-2xl bg-[#FFF9EC] text-[#B88728] border border-[#E8C16D]/40 dark:bg-[#1A160E] dark:text-[#E8C16D] flex items-center justify-center shrink-0">
                <BookOpen size={20} />
              </div>
              <div>
                <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white tracking-wide">
                  General Details
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Enter basic information about ledger.
                </p>
              </div>
            </div>

            {/* 2-Column Balanced Form Grid with pill inputs */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-5">
              {/* Ledger Name. * */}
              <div>
                <label className="text-xs font-semibold text-slate-800 dark:text-slate-200 mb-1.5 block">
                  Ledger Name. <span className="text-rose-500 font-bold">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.partyName || ""}
                  onChange={(e) => handleChange("partyName", e.target.value)}
                  placeholder="Enter ledger name"
                  className={commonInputClass}
                />
              </div>

              {/* Alias. * */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                    Alias. <span className="text-rose-500 font-bold">*</span>
                  </label>
                  <span
                    className={`text-xs font-mono font-semibold ${
                      formData.alias?.length ? "text-emerald-600 dark:text-emerald-400" : "text-rose-500"
                    }`}
                  >
                    {formData.alias ? formData.alias.length : 0}/10
                  </span>
                </div>
                <input
                  type="text"
                  maxLength={10}
                  required
                  value={formData.alias || ""}
                  onChange={(e) => {
                    const val = e.target.value.toUpperCase();
                    handleChange("alias", val);
                    handleChange("accountCode", val);
                  }}
                  placeholder="SHORT CODE / ALIAS"
                  className={cn(commonInputClass, "uppercase font-mono")}
                />
              </div>

              {/* Account Head. * */}
              <div>
                <label className="text-xs font-semibold text-slate-800 dark:text-slate-200 mb-1.5 block">
                  Account Head. <span className="text-rose-500 font-bold">*</span>
                </label>
                <ThemeSelectDropdown
                  value={formData.accountHead || "Sundry Debtors"}
                  onChange={(val) => handleChange("accountHead", val)}
                  options={accountHeadOptions}
                  placeholder="Select Account Head"
                  className="w-full"
                  buttonClassName={dropdownButtonClassName}
                  menuClassName={dropdownMenuClassName}
                />
              </div>

              {/* Email. */}
              <div>
                <label className="text-xs font-semibold text-slate-800 dark:text-slate-200 mb-1.5 block">
                  Email.
                </label>
                <input
                  type="email"
                  value={formData.email || ""}
                  onChange={(e) => handleChange("email", e.target.value)}
                  placeholder="Enter email address"
                  className={commonInputClass}
                />
              </div>

              {/* Contact Name. */}
              <div>
                <label className="text-xs font-semibold text-slate-800 dark:text-slate-200 mb-1.5 block">
                  Contact Name.
                </label>
                <input
                  type="text"
                  value={formData.contactPerson || ""}
                  onChange={(e) => handleChange("contactPerson", e.target.value)}
                  placeholder="Contact person name"
                  className={commonInputClass}
                />
              </div>

              {/* Creation Date. */}
              <div>
                <label className="text-xs font-semibold text-slate-800 dark:text-slate-200 mb-1.5 block">
                  Creation Date.
                </label>
                <DatePicker
                  value={formData.creationDate || todayFormatted}
                  onChange={(_, str) => handleChange("creationDate", str || "")}
                  placeholder="DD-MM-YYYY"
                  dateFormat="dd-MM-yyyy"
                  className="w-full"
                  buttonClassName={datePickerButtonClassName}
                />
              </div>

              {/* Opening Balance. + Dr / Cr */}
              <div className="md:col-span-2">
                <label className="text-xs font-semibold text-slate-800 dark:text-slate-200 mb-1.5 block">
                  Opening Balance.
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 max-w-lg">
                  <input
                    type="number"
                    value={formData.openingBalance ?? 0}
                    onChange={(e) => handleChange("openingBalance", Number(e.target.value))}
                    placeholder="0"
                    className={cn(commonInputClass, "sm:col-span-2 font-mono")}
                  />
                  <ThemeSelectDropdown
                    value={formData.balanceType || "Dr"}
                    onChange={(val) => handleChange("balanceType", val)}
                    options={balanceTypeOptions}
                    placeholder="Dr/Cr"
                    className="w-full"
                    buttonClassName={dropdownButtonClassName}
                    menuClassName={dropdownMenuClassName}
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 2: CONTACT DETAILS                                                   */}
        {/* ========================================================================= */}
        {activeTab === "contact" && (
          <div className="w-full">
            {/* Section Header with Golden MapPin Icon Badge */}
            <div className="flex items-center gap-3.5 mb-7 pb-4 border-b border-slate-100 dark:border-white/[0.06]">
              <div className="w-11 h-11 rounded-2xl bg-[#FFF9EC] text-[#B88728] border border-[#E8C16D]/40 dark:bg-[#1A160E] dark:text-[#E8C16D] flex items-center justify-center shrink-0">
                <MapPin size={20} />
              </div>
              <div>
                <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white tracking-wide">
                  Contact Details
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Enter billing and shipping information
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-10 gap-y-6">
              {/* Billing Column */}
              <div>
                <h3 className="text-sm font-bold text-[#0A0E1A] dark:text-white mb-4">Billing</h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-5 gap-y-4">
                  <div>
                    <label className="text-xs font-semibold text-slate-800 dark:text-slate-200 mb-1.5 block">
                      Address 1. <span className="text-rose-500 font-bold">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.addressLine1 || ""}
                      onChange={(e) => handleChange("addressLine1", e.target.value)}
                      placeholder="Plot / Building / Street address"
                      className={commonInputClass}
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-800 dark:text-slate-200 mb-1.5 block">
                      Address 2.
                    </label>
                    <input
                      type="text"
                      value={formData.addressLine2 || ""}
                      onChange={(e) => handleChange("addressLine2", e.target.value)}
                      placeholder="Suite / Floor / Landmark"
                      className={commonInputClass}
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-800 dark:text-slate-200 mb-1.5 block">
                      Address 3.
                    </label>
                    <input
                      type="text"
                      value={formData.addressLine3 || ""}
                      onChange={(e) => handleChange("addressLine3", e.target.value)}
                      placeholder="Additional address details"
                      className={commonInputClass}
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-800 dark:text-slate-200 mb-1.5 block">
                      Pincode. <span className="text-rose-500 font-bold">*</span>
                    </label>
                    <input
                      type="text"
                      maxLength={6}
                      value={formData.pincode || ""}
                      onChange={(e) =>
                        handleChange("pincode", e.target.value.replace(/\D/g, ""))
                      }
                      placeholder="394230"
                      className={cn(commonInputClass, "font-mono")}
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-800 dark:text-slate-200 mb-1.5 block">
                      Area. <span className="text-rose-500 font-bold">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.area || ""}
                      onChange={(e) => handleChange("area", e.target.value)}
                      placeholder="Area / Locality"
                      className={commonInputClass}
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-800 dark:text-slate-200 mb-1.5 block">
                      City. <span className="text-rose-500 font-bold">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.city || ""}
                      onChange={(e) => handleChange("city", e.target.value)}
                      placeholder="City"
                      className={commonInputClass}
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-800 dark:text-slate-200 mb-1.5 block">
                      State. <span className="text-rose-500 font-bold">*</span>
                    </label>
                    <ThemeSelectDropdown
                      value={formData.state || "Gujarat"}
                      onChange={(val) => handleChange("state", val)}
                      options={stateOptions}
                      placeholder="Select a state"
                      className="w-full"
                      buttonClassName={dropdownButtonClassName}
                      menuClassName={dropdownMenuClassName}
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-800 dark:text-slate-200 mb-1.5 block">
                      Country.
                    </label>
                    <input
                      type="text"
                      disabled
                      value={formData.country || "India"}
                      className={cn(
                        commonInputClass,
                        "bg-slate-100 border-[#E7E0D2] text-slate-500 dark:bg-[#161B26]/50 dark:border-white/[0.06] dark:text-slate-400 cursor-not-allowed"
                      )}
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                        Contact No.
                      </label>
                      <span
                        className={`text-xs font-mono font-semibold ${
                          formData.phone?.length === 10
                            ? "text-emerald-600 dark:text-emerald-400"
                            : "text-rose-500"
                        }`}
                      >
                        {formData.phone ? formData.phone.length : 0}/10
                      </span>
                    </div>
                    <input
                      type="text"
                      maxLength={10}
                      value={formData.phone || ""}
                      onChange={(e) =>
                        handleChange("phone", e.target.value.replace(/\D/g, ""))
                      }
                      placeholder="Enter 10-digit Contact No"
                      className={cn(commonInputClass, "font-mono")}
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
                      className="w-4 h-4 rounded border-slate-300 bg-white text-[#E8C16D] accent-[#E8C16D] dark:border-white/[0.2] dark:bg-[#080B11] focus:ring-0 cursor-pointer"
                    />
                    <span className="font-medium">Shipping same as billing.</span>
                  </label>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-5 gap-y-4">
                  <div>
                    <label className="text-xs font-semibold text-slate-800 dark:text-slate-200 mb-1.5 block">
                      Address 1. <span className="text-rose-500 font-bold">*</span>
                    </label>
                    <input
                      type="text"
                      disabled={Boolean(formData.shippingSameAsBilling)}
                      value={formData.shippingAddress1 || ""}
                      onChange={(e) => handleChange("shippingAddress1", e.target.value)}
                      placeholder="Plot / Building / Street address"
                      className={cn(
                        commonInputClass,
                        formData.shippingSameAsBilling &&
                          "bg-slate-100 border-[#E7E0D2] text-slate-500 cursor-not-allowed dark:bg-[#161B26]/50 dark:border-white/[0.04] dark:text-slate-400"
                      )}
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-800 dark:text-slate-200 mb-1.5 block">
                      Address 2.
                    </label>
                    <input
                      type="text"
                      disabled={Boolean(formData.shippingSameAsBilling)}
                      value={formData.shippingAddress2 || ""}
                      onChange={(e) => handleChange("shippingAddress2", e.target.value)}
                      placeholder="Suite / Floor / Landmark"
                      className={cn(
                        commonInputClass,
                        formData.shippingSameAsBilling &&
                          "bg-slate-100 border-[#E7E0D2] text-slate-500 cursor-not-allowed dark:bg-[#161B26]/50 dark:border-white/[0.04] dark:text-slate-400"
                      )}
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-800 dark:text-slate-200 mb-1.5 block">
                      Address 3.
                    </label>
                    <input
                      type="text"
                      disabled={Boolean(formData.shippingSameAsBilling)}
                      value={formData.shippingAddress3 || ""}
                      onChange={(e) => handleChange("shippingAddress3", e.target.value)}
                      placeholder="Additional address details"
                      className={cn(
                        commonInputClass,
                        formData.shippingSameAsBilling &&
                          "bg-slate-100 border-[#E7E0D2] text-slate-500 cursor-not-allowed dark:bg-[#161B26]/50 dark:border-white/[0.04] dark:text-slate-400"
                      )}
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-800 dark:text-slate-200 mb-1.5 block">
                      Pincode. <span className="text-rose-500 font-bold">*</span>
                    </label>
                    <input
                      type="text"
                      maxLength={6}
                      disabled={Boolean(formData.shippingSameAsBilling)}
                      value={formData.shippingPincode || ""}
                      onChange={(e) =>
                        handleChange("shippingPincode", e.target.value.replace(/\D/g, ""))
                      }
                      placeholder="394230"
                      className={cn(
                        commonInputClass,
                        "font-mono",
                        formData.shippingSameAsBilling &&
                          "bg-slate-100 border-[#E7E0D2] text-slate-500 cursor-not-allowed dark:bg-[#161B26]/50 dark:border-white/[0.04] dark:text-slate-400"
                      )}
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-800 dark:text-slate-200 mb-1.5 block">
                      Area. <span className="text-rose-500 font-bold">*</span>
                    </label>
                    <input
                      type="text"
                      disabled={Boolean(formData.shippingSameAsBilling)}
                      value={formData.shippingArea || ""}
                      onChange={(e) => handleChange("shippingArea", e.target.value)}
                      placeholder="Area / Locality"
                      className={cn(
                        commonInputClass,
                        formData.shippingSameAsBilling &&
                          "bg-slate-100 border-[#E7E0D2] text-slate-500 cursor-not-allowed dark:bg-[#161B26]/50 dark:border-white/[0.04] dark:text-slate-400"
                      )}
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-800 dark:text-slate-200 mb-1.5 block">
                      City. <span className="text-rose-500 font-bold">*</span>
                    </label>
                    <input
                      type="text"
                      disabled={Boolean(formData.shippingSameAsBilling)}
                      value={formData.shippingCity || ""}
                      onChange={(e) => handleChange("shippingCity", e.target.value)}
                      placeholder="City"
                      className={cn(
                        commonInputClass,
                        formData.shippingSameAsBilling &&
                          "bg-slate-100 border-[#E7E0D2] text-slate-500 cursor-not-allowed dark:bg-[#161B26]/50 dark:border-white/[0.04] dark:text-slate-400"
                      )}
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-800 dark:text-slate-200 mb-1.5 block">
                      State. <span className="text-rose-500 font-bold">*</span>
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
                    <label className="text-xs font-semibold text-slate-800 dark:text-slate-200 mb-1.5 block">
                      Country.
                    </label>
                    <input
                      type="text"
                      disabled
                      value={formData.shippingCountry || "India"}
                      className={cn(
                        commonInputClass,
                        "bg-slate-100 border-[#E7E0D2] text-slate-500 dark:bg-[#161B26]/50 dark:border-white/[0.06] dark:text-slate-400 cursor-not-allowed"
                      )}
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                        Contact No.
                      </label>
                      <span
                        className={`text-xs font-mono font-semibold ${
                          formData.shippingPhone?.length === 10
                            ? "text-emerald-600 dark:text-emerald-400"
                            : "text-rose-500"
                        }`}
                      >
                        {formData.shippingPhone ? formData.shippingPhone.length : 0}/10
                      </span>
                    </div>
                    <input
                      type="text"
                      maxLength={10}
                      disabled={Boolean(formData.shippingSameAsBilling)}
                      value={formData.shippingPhone || ""}
                      onChange={(e) =>
                        handleChange("shippingPhone", e.target.value.replace(/\D/g, ""))
                      }
                      placeholder="Enter 10-digit Contact No"
                      className={cn(
                        commonInputClass,
                        "font-mono",
                        formData.shippingSameAsBilling &&
                          "bg-slate-100 border-[#E7E0D2] text-slate-500 cursor-not-allowed dark:bg-[#161B26]/50 dark:border-white/[0.04] dark:text-slate-400"
                      )}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 3: LEGAL & ACCOUNTING DETAILS                                         */}
        {/* ========================================================================= */}
        {activeTab === "accounting" && (
          <div className="w-full">
            {/* Section Header with Golden Scale Icon Badge */}
            <div className="flex items-center gap-3.5 mb-7 pb-4 border-b border-slate-100 dark:border-white/[0.06]">
              <div className="w-11 h-11 rounded-2xl bg-[#FFF9EC] text-[#B88728] border border-[#E8C16D]/40 dark:bg-[#1A160E] dark:text-[#E8C16D] flex items-center justify-center shrink-0">
                <Scale size={20} />
              </div>
              <div>
                <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white tracking-wide">
                  Legal & Accounting Details
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Enter Legal and Accounting Details
                </p>
              </div>
            </div>

            {/* Top Grid: Taxation & Legal vs Bank Details */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-10 gap-y-6 mb-8">
              {/* Taxation & Legal Details */}
              <div>
                <h3 className="text-sm font-bold text-[#0A0E1A] dark:text-white mb-4">
                  Taxation & Legal Details
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-5 gap-y-4">
                  {/* GST Number */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                        GST Number.
                      </label>
                      <span
                        className={`text-xs font-mono font-semibold ${
                          formData.gstin?.length === 15
                            ? "text-emerald-600 dark:text-emerald-400"
                            : "text-rose-500"
                        }`}
                      >
                        {formData.gstin ? formData.gstin.length : 0}/15
                      </span>
                    </div>
                    <input
                      type="text"
                      maxLength={15}
                      value={formData.gstin || ""}
                      onChange={(e) => handleChange("gstin", e.target.value.toUpperCase())}
                      placeholder="24ABCDE1234F1Z5"
                      className={cn(commonInputClass, "font-mono uppercase")}
                    />
                  </div>

                  {/* PAN Number */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                        PAN Number.
                      </label>
                      <span
                        className={`text-xs font-mono font-semibold ${
                          formData.pan?.length === 10
                            ? "text-emerald-600 dark:text-emerald-400"
                            : "text-rose-500"
                        }`}
                      >
                        {formData.pan ? formData.pan.length : 0}/10
                      </span>
                    </div>
                    <input
                      type="text"
                      maxLength={10}
                      value={formData.pan || ""}
                      onChange={(e) => handleChange("pan", e.target.value.toUpperCase())}
                      placeholder="ABCDE1234F"
                      className={cn(commonInputClass, "font-mono uppercase")}
                    />
                  </div>

                  {/* MSME Number */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                        MSME Number.
                      </label>
                      <span
                        className={`text-xs font-mono font-semibold ${
                          formData.msmeNumber?.length
                            ? "text-emerald-600 dark:text-emerald-400"
                            : "text-rose-500"
                        }`}
                      >
                        {formData.msmeNumber ? formData.msmeNumber.length : 0}/19
                      </span>
                    </div>
                    <input
                      type="text"
                      maxLength={19}
                      value={formData.msmeNumber || ""}
                      onChange={(e) =>
                        handleChange("msmeNumber", e.target.value.toUpperCase())
                      }
                      placeholder="UDYAM-XX-00-0000000"
                      className={cn(commonInputClass, "font-mono uppercase")}
                    />
                  </div>

                  {/* Legal Name */}
                  <div>
                    <label className="text-xs font-semibold text-slate-800 dark:text-slate-200 mb-1.5 block">
                      Legal Name.
                    </label>
                    <input
                      type="text"
                      value={formData.legalName || ""}
                      onChange={(e) => handleChange("legalName", e.target.value)}
                      placeholder="Registered legal entity name"
                      className={commonInputClass}
                    />
                  </div>
                </div>
              </div>

              {/* Bank Details */}
              <div>
                <h3 className="text-sm font-bold text-[#0A0E1A] dark:text-white mb-4">Bank Details</h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-5 gap-y-4">
                  <div>
                    <label className="text-xs font-semibold text-slate-800 dark:text-slate-200 mb-1.5 block">
                      Account No.
                    </label>
                    <input
                      type="text"
                      value={formData.accountNumber || ""}
                      onChange={(e) => handleChange("accountNumber", e.target.value)}
                      placeholder="Enter account number"
                      className={cn(commonInputClass, "font-mono")}
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-800 dark:text-slate-200 mb-1.5 block">
                      Holder Name.
                    </label>
                    <input
                      type="text"
                      value={formData.accountHolderName || ""}
                      onChange={(e) => handleChange("accountHolderName", e.target.value)}
                      placeholder="Account holder's full name"
                      className={commonInputClass}
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-800 dark:text-slate-200 mb-1.5 block">
                      Bank Name.
                    </label>
                    <input
                      type="text"
                      value={formData.bankName || ""}
                      onChange={(e) => handleChange("bankName", e.target.value)}
                      placeholder="e.g. KOTAK MAHINDRA BANK"
                      className={cn(commonInputClass, "uppercase")}
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-800 dark:text-slate-200 mb-1.5 block">
                      Branch Name.
                    </label>
                    <input
                      type="text"
                      value={formData.branchName || ""}
                      onChange={(e) => handleChange("branchName", e.target.value)}
                      placeholder="Branch name or location"
                      className={commonInputClass}
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-800 dark:text-slate-200 mb-1.5 block">
                      Account Type.
                    </label>
                    <ThemeSelectDropdown
                      value={formData.accountType || "Current"}
                      onChange={(val) => handleChange("accountType", val)}
                      options={accountTypeOptions}
                      placeholder="Select account type"
                      className="w-full"
                      buttonClassName={dropdownButtonClassName}
                      menuClassName={dropdownMenuClassName}
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-800 dark:text-slate-200 mb-1.5 block">
                      IFSC Code.
                    </label>
                    <input
                      type="text"
                      maxLength={11}
                      value={formData.ifsc || ""}
                      onChange={(e) => handleChange("ifsc", e.target.value.toUpperCase())}
                      placeholder="KKBK0002868"
                      className={cn(commonInputClass, "font-mono uppercase")}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Row: Other Details */}
            <div className="pt-6 border-t border-slate-100 dark:border-white/[0.06]">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-xl bg-[#FFF9EC] text-[#B88728] border border-[#E8C16D]/30 dark:bg-[#1A160E] dark:text-[#E8C16D] flex items-center justify-center shrink-0">
                  <CircleDot size={16} />
                </div>
                <h3 className="text-sm font-bold text-[#0A0E1A] dark:text-white">Other Details</h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-x-8 gap-y-4">
                <div>
                  <label className="text-xs font-semibold text-slate-800 dark:text-slate-200 mb-1.5 block">
                    Credit Debit Limit. <span className="text-rose-500 font-bold">*</span>
                  </label>
                  <input
                    type="number"
                    value={formData.creditDebitLimit ?? 0}
                    onChange={(e) =>
                      handleChange("creditDebitLimit", Number(e.target.value))
                    }
                    className={cn(commonInputClass, "font-mono")}
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-800 dark:text-slate-200 mb-1.5 block">
                    Bill Due Days. <span className="text-rose-500 font-bold">*</span>
                  </label>
                  <input
                    type="number"
                    value={formData.billDueDays ?? 0}
                    onChange={(e) => handleChange("billDueDays", Number(e.target.value))}
                    className={cn(commonInputClass, "font-mono")}
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-800 dark:text-slate-200 mb-1.5 block">
                    Ref. Contact Name.
                  </label>
                  <input
                    type="text"
                    value={formData.refContactName || ""}
                    onChange={(e) => handleChange("refContactName", e.target.value)}
                    placeholder="select / type reference"
                    className={commonInputClass}
                  />
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
            {/* Section Header with Golden FileText/Upload Icon Badge */}
            <div className="flex items-center gap-3.5 mb-7 pb-4 border-b border-slate-100 dark:border-white/[0.06]">
              <div className="w-11 h-11 rounded-2xl bg-[#FFF9EC] text-[#B88728] border border-[#E8C16D]/40 dark:bg-[#1A160E] dark:text-[#E8C16D] flex items-center justify-center shrink-0">
                <Upload size={20} />
              </div>
              <div>
                <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white tracking-wide">
                  Ledger Logo
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Upload ledger image / logo from here.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-10 gap-y-6">
              <div>
                <input
                  type="file"
                  ref={logoInputRef}
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) handleLogoFile(f);
                    e.target.value = "";
                  }}
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
                  onDrop={(e) => {
                    e.preventDefault();
                    setIsLogoDragging(false);
                    const f = e.dataTransfer.files?.[0];
                    if (f) handleLogoFile(f);
                  }}
                  className={`w-72 h-44 rounded-3xl bg-slate-50 border ${
                    isLogoDragging
                      ? "border-[#E8C16D] ring-2 ring-[#E8C16D]/30"
                      : "border-[#E7E0D2] hover:border-[#E8C16D]/60 dark:border-white/[0.1] dark:hover:border-[#E8C16D]/60"
                  } dark:bg-[#0B0F17] flex items-center justify-center p-4 shadow-sm dark:shadow-2xl overflow-hidden relative group cursor-pointer transition-all select-none`}
                  title="Click to select and upload ledger logo"
                >
                  {formData.logoUrl ? (
                    <img
                      src={getMediaUrl(formData.logoUrl)}
                      alt="Ledger Logo"
                      className="w-full h-full object-contain"
                    />
                  ) : (
                    <div className="flex flex-col items-center justify-center text-center select-none">
                      <div className="w-12 h-12 rounded-2xl bg-white dark:bg-white/[0.05] border border-slate-200 dark:border-white/[0.1] flex items-center justify-center text-[#B88728] dark:text-[#E8C16D] mb-2 shadow-xs">
                        <Upload size={22} />
                      </div>
                      <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                        Upload Logo
                      </span>
                      <span className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">
                        Click or drag & drop (PNG, JPG, WebP)
                      </span>
                    </div>
                  )}

                  {formData.logoUrl && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleChange("logoUrl", "");
                        toast.success("Logo removed.");
                      }}
                      className="absolute top-2.5 right-2.5 p-1.5 rounded-lg bg-black/80 hover:bg-rose-600/90 text-slate-300 hover:text-white border border-white/10 opacity-0 group-hover:opacity-100 transition-all z-20 cursor-pointer shadow-lg"
                      title="Remove Logo"
                    >
                      <Trash2 size={13} />
                    </button>
                  )}

                  <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px] opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1.5 text-white pointer-events-none">
                    <Upload size={22} className="text-[#E8C16D]" />
                    <span className="text-xs font-semibold">
                      {formData.logoUrl ? "Change Logo" : "Upload Logo"}
                    </span>
                    <span className="text-[10px] text-slate-300">
                      Click or drag & drop
                    </span>
                  </div>
                </div>
              </div>
              <div />
            </div>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* 4. BOTTOM BAR / FOOTER matching Edit Company UI theme                     */}
      {/* ========================================================================= */}
      <div className="w-full rounded-2xl sm:rounded-3xl border border-[#E7E0D2] dark:border-white/[0.08] bg-white dark:bg-[#0F1626] p-4 sm:p-5 flex items-center justify-between shadow-sm">
        {/* Left: Completion Percentage with gold progress bar */}
        <div className="w-48 sm:w-64 space-y-1">
          <p className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
            Completion Percentage: {completionPercentage}%
          </p>
          <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
            <div
              className="h-full bg-[#E8C16D] rounded-full transition-all duration-300"
              style={{ width: `${completionPercentage}%` }}
            />
          </div>
        </div>

        {/* Right: Golden Save Button */}
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="inline-flex items-center gap-2 px-6 py-2.5 rounded-2xl bg-[#E8C16D] hover:bg-[#d8b05c] active:scale-95 text-[#0A0E1A] font-bold text-xs sm:text-sm shadow-sm transition-all cursor-pointer disabled:opacity-50"
        >
          {saving ? (
            <Loader2 size={16} className="animate-spin text-[#0A0E1A]" />
          ) : (
            <Save size={16} className="text-[#0A0E1A]" />
          )}
          <span>{saving ? "Saving..." : "Save"}</span>
        </button>
      </div>
    </div>
  );
}
