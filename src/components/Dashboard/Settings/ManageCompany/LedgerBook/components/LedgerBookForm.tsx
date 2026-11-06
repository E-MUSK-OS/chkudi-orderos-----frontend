"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import {
  ArrowLeft,
  Circle,
  CheckCircle2,
  AlertCircle,
  Save,
  Upload,
  Trash2,
  Loader2,
  Check,
  BookOpen,
  MapPin,
  Landmark,
} from "lucide-react";
import { Ledger, CreateLedgerPayload } from "../types/ledger.types";
import { ledgerService } from "../services/ledger.service";
import { toast } from "sonner";
import ThemeSelectDropdown, {
  ThemeSelectOption,
} from "@/components/ui/ThemeSelectDropdown";
import DropdownWithOther, {
  type DropdownOption,
} from "@/components/Dashboard/Products/ManageProducts/components/DropdownWithOther";
import { useDropdownOptions } from "@/components/Dashboard/Products/ManageProducts/hooks/useDropdownOptions";
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

export default function LedgerBookForm({
  initialLedger,
  onBack,
  onSaved,
}: LedgerBookFormProps) {
  const [activeTab, setActiveTab] = useState<TabType>("general");
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLogoDragging, setIsLogoDragging] = useState(false);
  const logoInputRef = useRef<HTMLInputElement>(null);

  const isEditMode = Boolean(initialLedger?.id);

  // Fetch dynamic dropdown options from DB
  const { data: dropdownResponse } = useDropdownOptions();
  const dropdownData = dropdownResponse?.data;

  // Today's formatted date: DD-MM-YYYY
  const todayFormatted = useMemo(() => {
    const d = new Date();
    const day = String(d.getDate()).padStart(2, "0");
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const year = d.getFullYear();
    return `${year}-${month}-${day}`;
  }, []);

  // Dynamic accountHeadOptions purely loaded from database
  const accountHeadOptions: DropdownOption[] = useMemo(() => {
    const dbSaved = (dropdownData?.savedOptions || [])
      .filter((o) => o.field.toLowerCase() === "accounthead")
      .map((o) => ({ label: o.label || o.value, value: o.value }));

    const map = new Map<string, DropdownOption>();
    dbSaved.forEach((opt) => {
      const v = opt.value?.trim();
      if (v && !map.has(v.toLowerCase())) {
        map.set(v.toLowerCase(), { label: opt.label || v, value: v });
      }
    });
    return Array.from(map.values());
  }, [dropdownData]);

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

  const dropdownButtonClassName =
    "w-full justify-between h-11 sm:h-12 px-5 text-xs sm:text-sm font-medium rounded-full bg-white border border-[#E7E0D2] hover:border-[#E8C16D] focus:border-[#E8C16D] focus:ring-2 focus:ring-[#E8C16D]/20 text-[#0A0E1A] dark:bg-[#080B11] dark:border-white/[0.08] dark:text-white dark:hover:border-[#E8C16D]/50 transition-all shadow-xs";
  const dropdownMenuClassName =
    "w-full min-w-full max-w-none bg-white border border-[#E7E0D2] text-[#0A0E1A] dark:bg-[#0F1626] dark:border-white/[0.08] dark:text-white rounded-2xl shadow-2xl p-1.5";
  const datePickerButtonClassName =
    "w-full h-11 sm:h-12 px-5 text-xs sm:text-sm font-medium rounded-full bg-white border border-[#E7E0D2] hover:border-[#E8C16D] text-[#0A0E1A] dark:bg-[#080B11] dark:border-white/[0.08] dark:text-white transition-all shadow-xs";

  const isAliasManuallyEditedRef = useRef<boolean>(false);

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

    // Other Details
    creditDebitLimit: 0,
    billDueDays: 0,
    refContactName: "",

    // Logo
    logoUrl: "",
    completionPercentage: 0,
  });

  // Populate initial values if editing
  useEffect(() => {
    if (initialLedger) {
      isAliasManuallyEditedRef.current = Boolean(
        initialLedger.alias && initialLedger.alias !== initialLedger.partyName
      );
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
    if (errors[field]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }

    setFormData((prev) => {
      const next = { ...prev, [field]: value };

      // Auto-sync alias & accountCode from partyName unless alias has been manually customized
      if (field === "partyName") {
        if (!isAliasManuallyEditedRef.current || !prev.alias || prev.alias === prev.partyName) {
          next.alias = value;
          next.accountCode = value;
        }
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

  const getInputClassName = (fieldKey?: string, isMono = false, disabled = false) => {
    const hasErr = Boolean(fieldKey && errors[fieldKey]);
    if (disabled) {
      return cn(
        "w-full h-11 sm:h-12 px-5 text-xs sm:text-sm font-medium rounded-full border outline-none bg-slate-100 border-[#E7E0D2] text-slate-500 cursor-not-allowed select-none dark:bg-[#161B26]/50 dark:border-white/[0.04] dark:text-slate-400 transition-all shadow-xs",
        isMono && "font-mono"
      );
    }
    return cn(
      "w-full h-11 sm:h-12 px-5 text-xs sm:text-sm font-medium rounded-full bg-white border text-[#0A0E1A] placeholder:text-slate-400 dark:bg-[#080B11] dark:text-white outline-none transition-all shadow-xs",
      isMono && "font-mono",
      hasErr
        ? "border-rose-500 focus:border-rose-500 ring-2 ring-rose-500/20 dark:border-rose-500"
        : "border-[#E7E0D2] hover:border-[#E8C16D] focus:border-[#E8C16D] focus:ring-2 focus:ring-[#E8C16D]/20 dark:border-white/[0.08] dark:hover:border-[#E8C16D]/50 dark:focus:border-[#E8C16D]"
    );
  };

  const renderFieldError = (fieldKey: string) => {
    if (!errors[fieldKey]) return null;
    return (
      <p className="text-[10px] text-rose-500 font-semibold mt-1 px-2 flex items-center gap-1 animate-in fade-in-50">
        <AlertCircle size={11} className="shrink-0" />
        <span>{errors[fieldKey]}</span>
      </p>
    );
  };

  const validateForm = (): { isValid: boolean; firstErrorTab?: TabType } => {
    const newErrors: Record<string, string> = {};
    let firstErrorTab: TabType | undefined;

    // --- Tab 1: General Details ---
    if (!formData.partyName?.trim()) {
      newErrors.partyName = "Ledger Name is required.";
      if (!firstErrorTab) firstErrorTab = "general";
    }
    if (!formData.alias?.trim()) {
      newErrors.alias = "Alias is required.";
      if (!firstErrorTab) firstErrorTab = "general";
    }
    if (!formData.accountHead?.trim()) {
      newErrors.accountHead = "Account Head is required.";
      if (!firstErrorTab) firstErrorTab = "general";
    }
    if (formData.email?.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email.trim())) {
        newErrors.email = "Please enter a valid email address.";
        if (!firstErrorTab) firstErrorTab = "general";
      }
    }

    // --- Tab 2: Contact Details ---
    if (!formData.addressLine1?.trim()) {
      newErrors.addressLine1 = "Address 1 is required.";
      if (!firstErrorTab) firstErrorTab = "contact";
    }
    if (!formData.pincode?.trim()) {
      newErrors.pincode = "Pincode is required.";
      if (!firstErrorTab) firstErrorTab = "contact";
    } else if (formData.pincode.trim().length !== 6) {
      newErrors.pincode = "Pincode must be exactly 6 digits.";
      if (!firstErrorTab) firstErrorTab = "contact";
    }
    if (!formData.area?.trim()) {
      newErrors.area = "Area is required.";
      if (!firstErrorTab) firstErrorTab = "contact";
    }
    if (!formData.city?.trim()) {
      newErrors.city = "City is required.";
      if (!firstErrorTab) firstErrorTab = "contact";
    }
    if (!formData.state?.trim()) {
      newErrors.state = "State is required.";
      if (!firstErrorTab) firstErrorTab = "contact";
    }
    if (formData.phone?.trim() && formData.phone.trim().length !== 10) {
      newErrors.phone = "Contact number must be exactly 10 digits.";
      if (!firstErrorTab) firstErrorTab = "contact";
    }

    // Shipping (if not same as billing)
    if (!formData.shippingSameAsBilling) {
      if (!formData.shippingAddress1?.trim()) {
        newErrors.shippingAddress1 = "Shipping Address 1 is required.";
        if (!firstErrorTab) firstErrorTab = "contact";
      }
      if (!formData.shippingPincode?.trim()) {
        newErrors.shippingPincode = "Shipping Pincode is required.";
        if (!firstErrorTab) firstErrorTab = "contact";
      } else if (formData.shippingPincode.trim().length !== 6) {
        newErrors.shippingPincode = "Pincode must be exactly 6 digits.";
        if (!firstErrorTab) firstErrorTab = "contact";
      }
      if (!formData.shippingArea?.trim()) {
        newErrors.shippingArea = "Shipping Area is required.";
        if (!firstErrorTab) firstErrorTab = "contact";
      }
      if (!formData.shippingCity?.trim()) {
        newErrors.shippingCity = "Shipping City is required.";
        if (!firstErrorTab) firstErrorTab = "contact";
      }
      if (!formData.shippingState?.trim()) {
        newErrors.shippingState = "Shipping State is required.";
        if (!firstErrorTab) firstErrorTab = "contact";
      }
      if (formData.shippingPhone?.trim() && formData.shippingPhone.trim().length !== 10) {
        newErrors.shippingPhone = "Contact number must be exactly 10 digits.";
        if (!firstErrorTab) firstErrorTab = "contact";
      }
    }

    // --- Tab 3: Accounting Details ---
    if (formData.gstin?.trim() && formData.gstin.trim().length !== 15) {
      newErrors.gstin = "GST Number must be exactly 15 characters.";
      if (!firstErrorTab) firstErrorTab = "accounting";
    }
    if (formData.pan?.trim() && formData.pan.trim().length !== 10) {
      newErrors.pan = "PAN Number must be exactly 10 characters.";
      if (!firstErrorTab) firstErrorTab = "accounting";
    }
    if (formData.ifsc?.trim() && formData.ifsc.trim().length !== 11) {
      newErrors.ifsc = "IFSC Code must be exactly 11 characters.";
      if (!firstErrorTab) firstErrorTab = "accounting";
    }
    if (
      formData.creditDebitLimit === undefined ||
      formData.creditDebitLimit === null ||
      isNaN(Number(formData.creditDebitLimit))
    ) {
      newErrors.creditDebitLimit = "Credit Debit Limit is required.";
      if (!firstErrorTab) firstErrorTab = "accounting";
    }
    if (
      formData.billDueDays === undefined ||
      formData.billDueDays === null ||
      isNaN(Number(formData.billDueDays))
    ) {
      newErrors.billDueDays = "Bill Due Days is required.";
      if (!firstErrorTab) firstErrorTab = "accounting";
    }

    setErrors(newErrors);
    return {
      isValid: Object.keys(newErrors).length === 0,
      firstErrorTab,
    };
  };

  const hasTabError = (tabKey: TabType): boolean => {
    switch (tabKey) {
      case "general":
        return Boolean(errors.partyName || errors.alias || errors.accountHead || errors.email);
      case "contact":
        return Boolean(
          errors.addressLine1 ||
            errors.pincode ||
            errors.area ||
            errors.city ||
            errors.state ||
            errors.phone ||
            errors.shippingAddress1 ||
            errors.shippingPincode ||
            errors.shippingArea ||
            errors.shippingCity ||
            errors.shippingState ||
            errors.shippingPhone
        );
      case "accounting":
        return Boolean(
          errors.gstin ||
            errors.pan ||
            errors.ifsc ||
            errors.creditDebitLimit ||
            errors.billDueDays
        );
      case "logo":
        return Boolean(errors.logoUrl);
      default:
        return false;
    }
  };

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
    const { isValid, firstErrorTab } = validateForm();
    if (!isValid) {
      if (firstErrorTab) {
        setActiveTab(firstErrorTab);
      }
      toast.error("Please fill in all required fields before saving.");
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
  const tabs: { key: TabType; label: string; completed: boolean }[] = [
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
    <div className="flex flex-col gap-4 w-full text-[#0A0E1A] dark:text-slate-100 font-sans animate-in fade-in-50 duration-200">
      {/* ========================================================================= */}
      {/* 1. TOP HEADER BAR matching Main Company Profile Header UI                  */}
      {/* ========================================================================= */}
      <div className="rounded-3xl border border-[#E7E0D2] dark:border-white/[0.08] bg-white dark:bg-[#0F1626] p-4 sm:p-7 shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="space-y-1.5 min-w-0 max-w-2xl">
            <div className="flex items-center gap-3.5">
              <button
                type="button"
                onClick={onBack}
                className="w-10 h-10 rounded-2xl bg-[#FFF9EC] text-[#B88728] border border-[#E8C16D]/40 dark:bg-[#1A160E] dark:text-[#E8C16D] hover:bg-[#E8C16D] hover:text-[#0A0E1A] flex items-center justify-center transition-colors cursor-pointer shrink-0 shadow-2xs"
                title="Back to Ledger Book"
              >
                <ArrowLeft size={18} />
              </button>
              <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-[#0A0E1A] dark:text-white">
                Ledger Book
              </h1>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium ml-1">
              <span className="font-semibold text-slate-700 dark:text-slate-300">Name.</span>{" "}
              <span className="text-slate-900 dark:text-white font-medium">{formData.partyName || initialLedger?.partyName || "---"}</span>{" "}
              <span className="ml-3 font-semibold text-slate-700 dark:text-slate-300">GSTN.</span>{" "}
              <span className="text-slate-900 dark:text-white font-medium">{formData.gstin || initialLedger?.gstin || "---"}</span>
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 sm:gap-3 shrink-0">
            {/* Active Status Badge matching Company Profile */}
            <button
              type="button"
              onClick={() => handleChange("isActive", !formData.isActive)}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-[#FFF9EC] text-[#B88728] border border-[#E8C16D]/30 dark:bg-[#1A160E] dark:text-[#E8C16D] shadow-xs cursor-pointer hover:border-[#E8C16D] transition-colors"
              title="Click to toggle active status"
            >
              <Check size={12} className={cn("stroke-[3]", formData.isActive ? "text-[#B88728] dark:text-[#E8C16D]" : "opacity-40")} />
              <span>{formData.isActive ? "Active" : "Inactive"}</span>
            </button>

            {/* Edit Mode / New Mode indicator */}
            <div className="px-4 py-1.5 rounded-full bg-[#0A0E1A] text-[#E8C16D] dark:bg-[#E8C16D] dark:text-[#0A0E1A] font-bold text-xs shadow-xs select-none">
              {isEditMode ? "Edit Mode" : "New Mode"}
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. TABS FLOATING BAR matching the Company Profile theme                    */}
      {/* ========================================================================= */}
      <div className="w-full rounded-full border border-slate-200/80 dark:border-white/[0.08] bg-[#F1F3F5] dark:bg-[#0D121F] p-1.5 flex items-center justify-between gap-1 shadow-xs overflow-x-auto no-scrollbar">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.key;
          const hasErr = hasTabError(tab.key);
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key)}
              className={cn(
                "flex-1 flex items-center justify-center gap-2 py-2 px-3 sm:px-6 rounded-full text-xs sm:text-sm font-bold transition-all cursor-pointer whitespace-nowrap",
                isActive
                  ? "bg-[#0A0E1A] text-[#E8C16D] shadow-md border border-[#0A0E1A] dark:bg-[#E8C16D] dark:text-[#0A0E1A] dark:border-[#E8C16D] dark:shadow-[0_0_16px_rgba(232,193,109,0.35)]"
                  : "text-slate-600 hover:text-slate-900 hover:bg-white/60 dark:text-slate-300 dark:hover:text-white dark:hover:bg-white/[0.05] border border-transparent font-medium"
              )}
            >
              {hasErr ? (
                <span className="relative flex h-2.5 w-2.5 shrink-0">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-500" />
                </span>
              ) : isActive ? (
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
      {/* 3. MAIN SECTION CARD with Integrated Action Bar                            */}
      {/* ========================================================================= */}
      <div className="rounded-3xl border border-[#E7E0D2] dark:border-white/[0.08] bg-white dark:bg-[#0F1626] shadow-sm overflow-hidden flex flex-col">
        <div className="p-6 sm:p-8 flex-1">
          {/* ========================================================================= */}
          {/* TAB 1: GENERAL DETAILS                                                   */}
          {/* ========================================================================= */}
          {activeTab === "general" && (
            <div className="w-full">
              <div className="flex items-center gap-3.5 mb-6">
                <div className="w-10 h-10 rounded-2xl bg-[#FFF9EC] border border-[#E8C16D]/40 text-[#B88728] dark:bg-[#1A160E] dark:text-[#E8C16D] flex items-center justify-center shrink-0 shadow-2xs">
                  <BookOpen size={18} />
                </div>
                <div>
                  <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                    General Details
                  </h2>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Enter basic information about ledger.
                  </p>
                </div>
              </div>

              <hr className="border-t border-[#E7E0D2] dark:border-white/[0.08] mb-6 sm:mb-8" />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-5">
                {/* Ledger Name. * */}
                <div>
                  <label className="text-xs font-bold text-slate-800 dark:text-slate-200 tracking-tight mb-1.5 block">
                    Ledger Name. <span className="text-rose-500 font-bold ml-0.5">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.partyName || ""}
                    onChange={(e) => handleChange("partyName", e.target.value)}
                    placeholder="Enter ledger name"
                    className={getInputClassName("partyName")}
                  />
                  {renderFieldError("partyName")}
                </div>

                {/* Alias. * */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-bold text-slate-800 dark:text-slate-200 tracking-tight">
                      Alias. <span className="text-rose-500 font-bold ml-0.5">*</span>
                    </label>
                    <span
                      className={cn(
                        "text-[11px] font-bold font-mono",
                        formData.alias?.length ? "text-emerald-600 dark:text-emerald-400" : "text-slate-400"
                      )}
                    >
                      {formData.alias ? formData.alias.length : 0}/100
                    </span>
                  </div>
                  <input
                    type="text"
                    maxLength={100}
                    value={formData.alias || ""}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (!val || val.trim() === "") {
                        isAliasManuallyEditedRef.current = false;
                      } else {
                        isAliasManuallyEditedRef.current = true;
                      }
                      handleChange("alias", val);
                      handleChange("accountCode", val);
                    }}
                    placeholder="SHORT CODE / ALIAS"
                    className={getInputClassName("alias", true)}
                  />
                  {renderFieldError("alias")}
                </div>

                {/* Account Head. * */}
                <div>
                  <label className="text-xs font-bold text-slate-800 dark:text-slate-200 tracking-tight mb-1.5 block">
                    Account Head. <span className="text-rose-500 font-bold ml-0.5">*</span>
                  </label>
                  <DropdownWithOther
                    hideLabel
                    label="Account Head"
                    required
                    value={formData.accountHead || "Sundry Debtors"}
                    onChange={(val) => handleChange("accountHead", val)}
                    options={accountHeadOptions}
                    placeholder="Select Account Head"
                    fieldKey="accounthead"
                    className="w-full"
                    buttonClassName={cn(
                      dropdownButtonClassName,
                      errors.accountHead && "border-rose-500 ring-2 ring-rose-500/20"
                    )}
                    menuClassName={dropdownMenuClassName}
                  />
                  {renderFieldError("accountHead")}
                </div>

                {/* Email. */}
                <div>
                  <label className="text-xs font-bold text-slate-800 dark:text-slate-200 tracking-tight mb-1.5 block">
                    Email.
                  </label>
                  <input
                    type="email"
                    value={formData.email || ""}
                    onChange={(e) => handleChange("email", e.target.value)}
                    placeholder="Enter email address"
                    className={getInputClassName("email")}
                  />
                  {renderFieldError("email")}
                </div>

                {/* Contact Name. */}
                <div>
                  <label className="text-xs font-bold text-slate-800 dark:text-slate-200 tracking-tight mb-1.5 block">
                    Contact Name.
                  </label>
                  <input
                    type="text"
                    value={formData.contactPerson || ""}
                    onChange={(e) => handleChange("contactPerson", e.target.value)}
                    placeholder="Contact person name"
                    className={getInputClassName()}
                  />
                </div>

                {/* Creation Date. */}
                <div>
                  <label className="text-xs font-bold text-slate-800 dark:text-slate-200 tracking-tight mb-1.5 block">
                    Creation Date.
                  </label>
                  <DatePicker
                    allowInput
                    value={formData.creationDate !== undefined ? formData.creationDate : todayFormatted}
                    onChange={(_, str) => handleChange("creationDate", str || "")}
                    placeholder="YYYY-MM-DD (e.g. 2004-07-01)"
                    dateFormat="yyyy-MM-dd"
                    className="w-full"
                    buttonClassName={datePickerButtonClassName}
                  />
                </div>

                {/* Opening Balance. + Dr / Cr */}
                <div className="md:col-span-2">
                  <label className="text-xs font-bold text-slate-800 dark:text-slate-200 tracking-tight mb-1.5 block">
                    Opening Balance.
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 max-w-md">
                    <input
                      type="number"
                      value={formData.openingBalance ?? 0}
                      onChange={(e) => handleChange("openingBalance", Number(e.target.value))}
                      placeholder="0"
                      className={cn(getInputClassName(undefined, true), "sm:col-span-2")}
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
              <div className="flex items-center gap-3.5 mb-6">
                <div className="w-10 h-10 rounded-2xl bg-[#FFF9EC] border border-[#E8C16D]/40 text-[#B88728] dark:bg-[#1A160E] dark:text-[#E8C16D] flex items-center justify-center shrink-0 shadow-2xs">
                  <MapPin size={18} />
                </div>
                <div>
                  <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                    Contact Details
                  </h2>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Enter billing and shipping information
                  </p>
                </div>
              </div>

              <hr className="border-t border-[#E7E0D2] dark:border-white/[0.08] mb-6 sm:mb-8" />

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-10 gap-y-8">
                {/* Billing Column */}
                <div>
                  <div className="flex items-center gap-2 mb-4 pb-2 border-b border-slate-100 dark:border-white/[0.06]">
                    <h3 className="text-sm font-bold text-[#0A0E1A] dark:text-white">
                      Billing
                    </h3>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-5 gap-y-4">
                    <div>
                      <label className="text-xs font-bold text-slate-800 dark:text-slate-200 tracking-tight mb-1.5 block">
                        Address 1. <span className="text-rose-500 font-bold ml-0.5">*</span>
                      </label>
                      <input
                        type="text"
                        value={formData.addressLine1 || ""}
                        onChange={(e) => handleChange("addressLine1", e.target.value)}
                        placeholder="Plot / Building / Street address"
                        className={getInputClassName("addressLine1")}
                      />
                      {renderFieldError("addressLine1")}
                    </div>

                    <div>
                      <label className="text-xs font-bold text-slate-800 dark:text-slate-200 tracking-tight mb-1.5 block">
                        Address 2.
                      </label>
                      <input
                        type="text"
                        value={formData.addressLine2 || ""}
                        onChange={(e) => handleChange("addressLine2", e.target.value)}
                        placeholder="Suite / Floor / Landmark"
                        className={getInputClassName()}
                      />
                    </div>

                    <div>
                      <label className="text-xs font-bold text-slate-800 dark:text-slate-200 tracking-tight mb-1.5 block">
                        Address 3.
                      </label>
                      <input
                        type="text"
                        value={formData.addressLine3 || ""}
                        onChange={(e) => handleChange("addressLine3", e.target.value)}
                        placeholder="Additional address details"
                        className={getInputClassName()}
                      />
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="text-xs font-bold text-slate-800 dark:text-slate-200 tracking-tight">
                          Pincode. <span className="text-rose-500 font-bold ml-0.5">*</span>
                        </label>
                        <span
                          className={cn(
                            "text-[11px] font-bold font-mono",
                            formData.pincode?.length === 6
                              ? "text-emerald-600 dark:text-emerald-400"
                              : "text-slate-400"
                          )}
                        >
                          {formData.pincode ? formData.pincode.length : 0}/6
                        </span>
                      </div>
                      <input
                        type="text"
                        maxLength={6}
                        value={formData.pincode || ""}
                        onChange={(e) =>
                          handleChange("pincode", e.target.value.replace(/\D/g, ""))
                        }
                        placeholder="e.g. 395001"
                        className={getInputClassName("pincode", true)}
                      />
                      {renderFieldError("pincode")}
                    </div>

                    <div>
                      <label className="text-xs font-bold text-slate-800 dark:text-slate-200 tracking-tight mb-1.5 block">
                        Area. <span className="text-rose-500 font-bold ml-0.5">*</span>
                      </label>
                      <input
                        type="text"
                        value={formData.area || ""}
                        onChange={(e) => handleChange("area", e.target.value)}
                        placeholder="Area / Locality"
                        className={getInputClassName("area")}
                      />
                      {renderFieldError("area")}
                    </div>

                    <div>
                      <label className="text-xs font-bold text-slate-800 dark:text-slate-200 tracking-tight mb-1.5 block">
                        City. <span className="text-rose-500 font-bold ml-0.5">*</span>
                      </label>
                      <input
                        type="text"
                        value={formData.city || ""}
                        onChange={(e) => handleChange("city", e.target.value)}
                        placeholder="City"
                        className={getInputClassName("city")}
                      />
                      {renderFieldError("city")}
                    </div>

                    <div>
                      <label className="text-xs font-bold text-slate-800 dark:text-slate-200 tracking-tight mb-1.5 block">
                        State. <span className="text-rose-500 font-bold ml-0.5">*</span>
                      </label>
                      <ThemeSelectDropdown
                        value={formData.state || "Gujarat"}
                        onChange={(val) => handleChange("state", val)}
                        options={stateOptions}
                        placeholder="Select a state"
                        className="w-full"
                        buttonClassName={cn(
                          dropdownButtonClassName,
                          errors.state && "border-rose-500 ring-2 ring-rose-500/20"
                        )}
                        menuClassName={dropdownMenuClassName}
                      />
                      {renderFieldError("state")}
                    </div>

                    <div>
                      <label className="text-xs font-bold text-slate-800 dark:text-slate-200 tracking-tight mb-1.5 block">
                        Country.
                      </label>
                      <input
                        type="text"
                        disabled
                        value={formData.country || "India"}
                        className={getInputClassName(undefined, false, true)}
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="text-xs font-bold text-slate-800 dark:text-slate-200 tracking-tight">
                          Contact No.
                        </label>
                        <span
                          className={cn(
                            "text-[11px] font-bold font-mono",
                            formData.phone?.length === 10
                              ? "text-emerald-600 dark:text-emerald-400"
                              : "text-slate-400"
                          )}
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
                        className={getInputClassName("phone", true)}
                      />
                      {renderFieldError("phone")}
                    </div>
                  </div>
                </div>

                {/* Shipping Column */}
                <div>
                  <div className="flex items-center justify-between gap-3 mb-4 pb-2 border-b border-slate-100 dark:border-white/[0.06]">
                    <h3 className="text-sm font-bold text-[#0A0E1A] dark:text-white">
                      Shipping
                    </h3>
                    <label className="flex items-center gap-2 cursor-pointer select-none text-xs font-semibold text-slate-700 dark:text-slate-300">
                      <input
                        type="checkbox"
                        checked={Boolean(formData.shippingSameAsBilling)}
                        onChange={(e) => handleShippingSameToggle(e.target.checked)}
                        className="w-4 h-4 rounded-md border-slate-300 bg-white text-[#B88728] focus:ring-[#F5C451] cursor-pointer dark:border-white/[0.2] dark:bg-[#161B26]"
                      />
                      <span>Shipping same as billing.</span>
                    </label>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-5 gap-y-4">
                    <div>
                      <label className="text-xs font-bold text-slate-800 dark:text-slate-200 tracking-tight mb-1.5 block">
                        Address 1. <span className="text-rose-500 font-bold ml-0.5">*</span>
                      </label>
                      <input
                        type="text"
                        disabled={Boolean(formData.shippingSameAsBilling)}
                        value={formData.shippingAddress1 || ""}
                        onChange={(e) => handleChange("shippingAddress1", e.target.value)}
                        placeholder="Plot / Building / Street address"
                        className={getInputClassName("shippingAddress1", false, Boolean(formData.shippingSameAsBilling))}
                      />
                      {!formData.shippingSameAsBilling && renderFieldError("shippingAddress1")}
                    </div>

                    <div>
                      <label className="text-xs font-bold text-slate-800 dark:text-slate-200 tracking-tight mb-1.5 block">
                        Address 2.
                      </label>
                      <input
                        type="text"
                        disabled={Boolean(formData.shippingSameAsBilling)}
                        value={formData.shippingAddress2 || ""}
                        onChange={(e) => handleChange("shippingAddress2", e.target.value)}
                        placeholder="Suite / Floor / Landmark"
                        className={getInputClassName(undefined, false, Boolean(formData.shippingSameAsBilling))}
                      />
                    </div>

                    <div>
                      <label className="text-xs font-bold text-slate-800 dark:text-slate-200 tracking-tight mb-1.5 block">
                        Address 3.
                      </label>
                      <input
                        type="text"
                        disabled={Boolean(formData.shippingSameAsBilling)}
                        value={formData.shippingAddress3 || ""}
                        onChange={(e) => handleChange("shippingAddress3", e.target.value)}
                        placeholder="Additional address details"
                        className={getInputClassName(undefined, false, Boolean(formData.shippingSameAsBilling))}
                      />
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="text-xs font-bold text-slate-800 dark:text-slate-200 tracking-tight">
                          Pincode. <span className="text-rose-500 font-bold ml-0.5">*</span>
                        </label>
                        <span
                          className={cn(
                            "text-[11px] font-bold font-mono",
                            formData.shippingPincode?.length === 6
                              ? "text-emerald-600 dark:text-emerald-400"
                              : "text-slate-400"
                          )}
                        >
                          {formData.shippingPincode ? formData.shippingPincode.length : 0}/6
                        </span>
                      </div>
                      <input
                        type="text"
                        maxLength={6}
                        disabled={Boolean(formData.shippingSameAsBilling)}
                        value={formData.shippingPincode || ""}
                        onChange={(e) =>
                          handleChange("shippingPincode", e.target.value.replace(/\D/g, ""))
                        }
                        placeholder="e.g. 395001"
                        className={getInputClassName("shippingPincode", true, Boolean(formData.shippingSameAsBilling))}
                      />
                      {!formData.shippingSameAsBilling && renderFieldError("shippingPincode")}
                    </div>

                    <div>
                      <label className="text-xs font-bold text-slate-800 dark:text-slate-200 tracking-tight mb-1.5 block">
                        Area. <span className="text-rose-500 font-bold ml-0.5">*</span>
                      </label>
                      <input
                        type="text"
                        disabled={Boolean(formData.shippingSameAsBilling)}
                        value={formData.shippingArea || ""}
                        onChange={(e) => handleChange("shippingArea", e.target.value)}
                        placeholder="Area / Locality"
                        className={getInputClassName("shippingArea", false, Boolean(formData.shippingSameAsBilling))}
                      />
                      {!formData.shippingSameAsBilling && renderFieldError("shippingArea")}
                    </div>

                    <div>
                      <label className="text-xs font-bold text-slate-800 dark:text-slate-200 tracking-tight mb-1.5 block">
                        City. <span className="text-rose-500 font-bold ml-0.5">*</span>
                      </label>
                      <input
                        type="text"
                        disabled={Boolean(formData.shippingSameAsBilling)}
                        value={formData.shippingCity || ""}
                        onChange={(e) => handleChange("shippingCity", e.target.value)}
                        placeholder="City"
                        className={getInputClassName("shippingCity", false, Boolean(formData.shippingSameAsBilling))}
                      />
                      {!formData.shippingSameAsBilling && renderFieldError("shippingCity")}
                    </div>

                    <div>
                      <label className="text-xs font-bold text-slate-800 dark:text-slate-200 tracking-tight mb-1.5 block">
                        State. <span className="text-rose-500 font-bold ml-0.5">*</span>
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
                            "bg-slate-100 border-[#E7E0D2] text-slate-500 cursor-not-allowed pointer-events-none dark:bg-[#161B26]/50 dark:border-white/[0.04] dark:text-slate-400",
                          !formData.shippingSameAsBilling &&
                            errors.shippingState &&
                            "border-rose-500 ring-2 ring-rose-500/20"
                        )}
                        menuClassName={dropdownMenuClassName}
                      />
                      {!formData.shippingSameAsBilling && renderFieldError("shippingState")}
                    </div>

                    <div>
                      <label className="text-xs font-bold text-slate-800 dark:text-slate-200 tracking-tight mb-1.5 block">
                        Country.
                      </label>
                      <input
                        type="text"
                        disabled
                        value={formData.shippingCountry || "India"}
                        className={getInputClassName(undefined, false, true)}
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="text-xs font-bold text-slate-800 dark:text-slate-200 tracking-tight">
                          Contact No.
                        </label>
                        <span
                          className={cn(
                            "text-[11px] font-bold font-mono",
                            formData.shippingPhone?.length === 10
                              ? "text-emerald-600 dark:text-emerald-400"
                              : "text-slate-400"
                          )}
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
                        className={getInputClassName("shippingPhone", true, Boolean(formData.shippingSameAsBilling))}
                      />
                      {!formData.shippingSameAsBilling && renderFieldError("shippingPhone")}
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
              <div className="flex items-center gap-3.5 mb-6">
                <div className="w-10 h-10 rounded-2xl bg-[#FFF9EC] border border-[#E8C16D]/40 text-[#B88728] dark:bg-[#1A160E] dark:text-[#E8C16D] flex items-center justify-center shrink-0 shadow-2xs">
                  <Landmark size={18} />
                </div>
                <div>
                  <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                    Legal & Accounting Details
                  </h2>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Enter Legal and Accounting Details
                  </p>
                </div>
              </div>

              <hr className="border-t border-[#E7E0D2] dark:border-white/[0.08] mb-6 sm:mb-8" />

              {/* Top Grid: Taxation & Legal vs Bank Details */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-10 gap-y-8 mb-8">
                {/* Taxation & Legal Details */}
                <div>
                  <div className="flex items-center gap-2 mb-4 pb-2 border-b border-slate-100 dark:border-white/[0.06]">
                    <h3 className="text-sm font-bold text-[#0A0E1A] dark:text-white">
                      Taxation & Legal Details
                    </h3>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-5 gap-y-4">
                    {/* GST Number */}
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="text-xs font-bold text-slate-800 dark:text-slate-200 tracking-tight">
                          GST Number.
                        </label>
                        <span
                          className={cn(
                            "text-[11px] font-bold font-mono",
                            formData.gstin?.length === 15
                              ? "text-emerald-600 dark:text-emerald-400"
                              : "text-slate-400"
                          )}
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
                        className={getInputClassName("gstin", true)}
                      />
                      {renderFieldError("gstin")}
                    </div>

                    {/* PAN Number */}
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="text-xs font-bold text-slate-800 dark:text-slate-200 tracking-tight">
                          PAN Number.
                        </label>
                        <span
                          className={cn(
                            "text-[11px] font-bold font-mono",
                            formData.pan?.length === 10
                              ? "text-emerald-600 dark:text-emerald-400"
                              : "text-slate-400"
                          )}
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
                        className={getInputClassName("pan", true)}
                      />
                      {renderFieldError("pan")}
                    </div>

                    {/* MSME Number */}
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="text-xs font-bold text-slate-800 dark:text-slate-200 tracking-tight">
                          MSME Number.
                        </label>
                        <span
                          className={cn(
                            "text-[11px] font-bold font-mono",
                            formData.msmeNumber?.length
                              ? "text-emerald-600 dark:text-emerald-400"
                              : "text-slate-400"
                          )}
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
                        className={getInputClassName(undefined, true)}
                      />
                    </div>

                    {/* Legal Name */}
                    <div>
                      <label className="text-xs font-bold text-slate-800 dark:text-slate-200 tracking-tight mb-1.5 block">
                        Legal Name.
                      </label>
                      <input
                        type="text"
                        value={formData.legalName || ""}
                        onChange={(e) => handleChange("legalName", e.target.value)}
                        placeholder="Registered legal entity name"
                        className={getInputClassName()}
                      />
                    </div>
                  </div>
                </div>

                {/* Bank Details */}
                <div>
                  <div className="flex items-center gap-2 mb-4 pb-2 border-b border-slate-100 dark:border-white/[0.06]">
                    <h3 className="text-sm font-bold text-[#0A0E1A] dark:text-white">
                      Bank Details
                    </h3>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-5 gap-y-4">
                    <div>
                      <label className="text-xs font-bold text-slate-800 dark:text-slate-200 tracking-tight mb-1.5 block">
                        Account No.
                      </label>
                      <input
                        type="text"
                        value={formData.accountNumber || ""}
                        onChange={(e) => handleChange("accountNumber", e.target.value)}
                        placeholder="Enter account number"
                        className={getInputClassName(undefined, true)}
                      />
                    </div>

                    <div>
                      <label className="text-xs font-bold text-slate-800 dark:text-slate-200 tracking-tight mb-1.5 block">
                        Holder Name.
                      </label>
                      <input
                        type="text"
                        value={formData.accountHolderName || ""}
                        onChange={(e) => handleChange("accountHolderName", e.target.value)}
                        placeholder="Account holder's full name"
                        className={getInputClassName()}
                      />
                    </div>

                    <div>
                      <label className="text-xs font-bold text-slate-800 dark:text-slate-200 tracking-tight mb-1.5 block">
                        Bank Name.
                      </label>
                      <input
                        type="text"
                        value={formData.bankName || ""}
                        onChange={(e) => handleChange("bankName", e.target.value)}
                        placeholder="e.g. HDFC Bank"
                        className={getInputClassName(undefined, false)}
                      />
                    </div>

                    <div>
                      <label className="text-xs font-bold text-slate-800 dark:text-slate-200 tracking-tight mb-1.5 block">
                        Branch Name.
                      </label>
                      <input
                        type="text"
                        value={formData.branchName || ""}
                        onChange={(e) => handleChange("branchName", e.target.value)}
                        placeholder="Branch name or location"
                        className={getInputClassName()}
                      />
                    </div>

                    <div>
                      <label className="text-xs font-bold text-slate-800 dark:text-slate-200 tracking-tight mb-1.5 block">
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
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="text-xs font-bold text-slate-800 dark:text-slate-200 tracking-tight">
                          IFSC Code.
                        </label>
                        <span
                          className={cn(
                            "text-[11px] font-bold font-mono",
                            formData.ifsc?.length === 11
                              ? "text-emerald-600 dark:text-emerald-400"
                              : "text-slate-400"
                          )}
                        >
                          {formData.ifsc ? formData.ifsc.length : 0}/11
                        </span>
                      </div>
                      <input
                        type="text"
                        maxLength={11}
                        value={formData.ifsc || ""}
                        onChange={(e) => handleChange("ifsc", e.target.value.toUpperCase())}
                        placeholder="e.g. HDFC0001234"
                        className={getInputClassName("ifsc", true)}
                      />
                      {renderFieldError("ifsc")}
                    </div>
                  </div>
                </div>
              </div>

              {/* Bottom Row: Other Details */}
              <div className="pt-6 border-t border-[#E7E0D2] dark:border-white/[0.06]">
                <div className="flex items-center gap-2 mb-4 pb-2 border-b border-slate-100 dark:border-white/[0.06]">
                  <h3 className="text-sm font-bold text-[#0A0E1A] dark:text-white">
                    Other Details
                  </h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-x-8 gap-y-5">
                  <div>
                    <label className="text-xs font-bold text-slate-800 dark:text-slate-200 tracking-tight mb-1.5 block">
                      Credit Debit Limit. <span className="text-rose-500 font-bold ml-0.5">*</span>
                    </label>
                    <input
                      type="number"
                      value={formData.creditDebitLimit ?? 0}
                      onChange={(e) =>
                        handleChange("creditDebitLimit", Number(e.target.value))
                      }
                      className={getInputClassName("creditDebitLimit", true)}
                    />
                    {renderFieldError("creditDebitLimit")}
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-800 dark:text-slate-200 tracking-tight mb-1.5 block">
                      Bill Due Days. <span className="text-rose-500 font-bold ml-0.5">*</span>
                    </label>
                    <input
                      type="number"
                      value={formData.billDueDays ?? 0}
                      onChange={(e) => handleChange("billDueDays", Number(e.target.value))}
                      className={getInputClassName("billDueDays", true)}
                    />
                    {renderFieldError("billDueDays")}
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-800 dark:text-slate-200 tracking-tight mb-1.5 block">
                      Ref. Contact Name.
                    </label>
                    <input
                      type="text"
                      value={formData.refContactName || ""}
                      onChange={(e) => handleChange("refContactName", e.target.value)}
                      placeholder="select / type reference"
                      className={getInputClassName()}
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
              <div className="flex items-center gap-3.5 mb-6">
                <div className="w-10 h-10 rounded-2xl bg-[#FFF9EC] border border-[#E8C16D]/40 text-[#B88728] dark:bg-[#1A160E] dark:text-[#E8C16D] flex items-center justify-center shrink-0 shadow-2xs">
                  <Upload size={18} />
                </div>
                <div>
                  <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                    Ledger Logo
                  </h2>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Upload ledger image / logo from here.
                  </p>
                </div>
              </div>

              <hr className="border-t border-[#E7E0D2] dark:border-white/[0.08] mb-6 sm:mb-8" />

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
                    className={cn(
                      "w-48 h-48 rounded-3xl bg-[#FAF8F5] border text-[#0A0E1A] dark:bg-[#080B11] flex flex-col items-center justify-center p-4 shadow-sm overflow-hidden relative group cursor-pointer transition-all select-none",
                      isLogoDragging
                        ? "border-[#E8C16D] ring-2 ring-[#E8C16D]/30"
                        : "border-[#E7E0D2] hover:border-[#E8C16D] dark:border-white/[0.08] dark:hover:border-[#E8C16D]/50"
                    )}
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
                        <div className="w-12 h-12 rounded-2xl bg-[#FFF9EC] text-[#B88728] border border-[#E8C16D]/30 flex items-center justify-center mb-3">
                          <Upload size={22} />
                        </div>
                        <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                          Upload Logo
                        </span>
                        <span className="text-[10px] text-slate-400 mt-1">
                          Click or drag & drop
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
                        className="absolute top-2.5 right-2.5 p-1.5 rounded-xl bg-black/80 hover:bg-rose-600/90 text-slate-300 hover:text-white border border-white/10 opacity-0 group-hover:opacity-100 transition-all z-20 cursor-pointer shadow-lg"
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
        {/* BOTTOM ACTION BAR matching EmployeeProfileViewPage bottom gradient theme  */}
        {/* ========================================================================= */}
        <div className="border-t border-[#EAE4D8] dark:border-white/[0.08] bg-gradient-to-r from-[#FFF6DE] via-[#FFF9EC] to-white dark:from-[#1E190F] dark:via-[#131722] dark:to-[#0A0E1A] p-5 sm:p-7 w-full flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="w-full sm:w-64 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Completion Percentage:
              </span>
              <span className="text-xs font-bold font-mono text-slate-900 dark:text-[#E8C16D]">
                {completionPercentage}%
              </span>
            </div>
            <div className="w-full h-2 rounded-full bg-slate-200/80 dark:bg-white/[0.1] overflow-hidden">
              <div
                className="h-full bg-[#0A0E1A] dark:bg-[#E8C16D] rounded-full transition-all duration-300"
                style={{ width: `${completionPercentage}%` }}
              />
            </div>
          </div>

          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="inline-flex h-11 sm:h-12 items-center justify-center gap-2 px-7 rounded-2xl bg-[#E8C16D] hover:bg-[#d8b05c] active:scale-[0.97] text-[#0A0E1A] font-bold text-xs sm:text-sm shadow-sm transition-all cursor-pointer disabled:opacity-50 shrink-0"
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
    </div>
  );
}
