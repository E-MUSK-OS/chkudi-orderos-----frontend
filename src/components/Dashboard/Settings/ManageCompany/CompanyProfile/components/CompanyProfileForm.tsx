"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import {
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Circle,
  Save,
  Check,
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
import DropdownWithOther, {
  type DropdownOption,
} from "@/components/Dashboard/Products/ManageProducts/components/DropdownWithOther";
import { useDropdownOptions } from "@/components/Dashboard/Products/ManageProducts/hooks/useDropdownOptions";
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
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Hidden file inputs for Logo and Signature
  const logoInputRef = useRef<HTMLInputElement | null>(null);
  const signatureInputRef = useRef<HTMLInputElement | null>(null);
  const [isLogoDragging, setIsLogoDragging] = useState(false);
  const [isSignatureDragging, setIsSignatureDragging] = useState(false);

  // Fetch dynamic dropdown options from DB
  const { data: dropdownResponse } = useDropdownOptions();
  const dropdownData = dropdownResponse?.data;

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

  const stateOptions: ThemeSelectOption[] = useMemo(
    () => INDIAN_STATES.map((st) => ({ value: st, label: st })),
    []
  );

  // Dynamic businessTypeOptions purely loaded from database
  const businessTypeOptions: DropdownOption[] = useMemo(() => {
    const dbSaved = (dropdownData?.savedOptions || [])
      .filter((o) => o.field.toLowerCase() === "businesstype")
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

  // Dynamic tradeCategoryOptions purely loaded from database
  const tradeCategoryOptions: DropdownOption[] = useMemo(() => {
    const dbSaved = (dropdownData?.savedOptions || [])
      .filter((o) => o.field.toLowerCase() === "tradecategory")
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
    taxInvoicePrefix: "",
    taxInvoiceNext: "1",
    retailInvoicePrefix: "",
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

        taxInvoicePrefix: company.taxInvoicePrefix || "",
        taxInvoiceNext: company.taxInvoiceNext || "1",
        retailInvoicePrefix: company.retailInvoicePrefix || "",
        retailInvoiceNext: company.retailInvoiceNext || "1",
        considerInPnL: company.considerInPnL || "Yes",

        logoUrl: company.logoUrl || "",
        signatureUrl: company.signatureUrl || "",
        status: company.status || "ACTIVE",
      });
    }
  }, [company]);

  const handleChange = (
    field: keyof UpdateCompanyPayload,
    value: UpdateCompanyPayload[keyof UpdateCompanyPayload]
  ) => {
    if (errors[field]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
    setFormData((prev) => {
      const updated = { ...prev, [field]: value };

      // If shipping same as billing is checked, sync billing fields to shipping
      if (
        updated.shippingSameAsBilling &&
        typeof value === "string" &&
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
  const completionPercentage = useMemo(() => {
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

  const getInputClassName = (fieldKey?: string, isMono = false, disabled = false) => {
    const hasErr = Boolean(fieldKey && errors[fieldKey]);
    if (disabled) {
      return cn(
        "w-full px-3.5 py-2.5 text-xs rounded-xl border outline-none bg-slate-100 border-[#E7E0D2] text-slate-500 cursor-not-allowed select-none dark:bg-[#161B26]/50 dark:border-white/[0.04] dark:text-slate-400",
        isMono && "font-mono"
      );
    }
    return cn(
      "w-full px-3.5 py-2.5 text-xs rounded-xl bg-white border text-[#0A0E1A] placeholder-slate-400 dark:bg-[#161B26] dark:text-white outline-none transition-all",
      isMono && "font-mono",
      hasErr
        ? "border-rose-500 focus:border-rose-500 ring-1 ring-rose-500/30"
        : "border-[#E7E0D2] focus:border-[#E8C16D] dark:border-white/[0.08] dark:focus:border-white/[0.2]"
    );
  };

  const renderFieldError = (fieldKey: string) => {
    if (!errors[fieldKey]) return null;
    return (
      <p className="text-[10px] text-rose-500 font-medium mt-1 flex items-center gap-1">
        <AlertCircle size={11} className="shrink-0" />
        <span>{errors[fieldKey]}</span>
      </p>
    );
  };

  const validateForm = (): { isValid: boolean; firstErrorTab?: TabType } => {
    const newErrors: Record<string, string> = {};
    let firstErrorTab: TabType | undefined;

    // --- Tab 1: General ---
    if (!formData.legalName?.trim()) {
      newErrors.legalName = "Legal Name is required.";
      if (!firstErrorTab) firstErrorTab = "general";
    }
    if (!formData.companyName?.trim()) {
      newErrors.companyName = "Company Name is required.";
      if (!firstErrorTab) firstErrorTab = "general";
    }
    if (!formData.ownerName?.trim()) {
      newErrors.ownerName = "Owner Name is required.";
      if (!firstErrorTab) firstErrorTab = "general";
    }
    if (!formData.abbreviation?.trim()) {
      newErrors.abbreviation = "Abbreviation is required.";
      if (!firstErrorTab) firstErrorTab = "general";
    }
    if (!formData.businessType?.trim()) {
      newErrors.businessType = "Business Type is required.";
      if (!firstErrorTab) firstErrorTab = "general";
    }
    if (!formData.email?.trim()) {
      newErrors.email = "Email is required.";
      if (!firstErrorTab) firstErrorTab = "general";
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email.trim())) {
        newErrors.email = "Please enter a valid email address.";
        if (!firstErrorTab) firstErrorTab = "general";
      }
    }
    if (!formData.phone?.trim()) {
      newErrors.phone = "Contact number is required.";
      if (!firstErrorTab) firstErrorTab = "general";
    } else if (formData.phone.trim().length !== 10) {
      newErrors.phone = "Contact number must be exactly 10 digits.";
      if (!firstErrorTab) firstErrorTab = "general";
    }

    // --- Tab 2: Contact ---
    if (!formData.billingAddress1?.trim()) {
      newErrors.billingAddress1 = "Billing Address 1 is required.";
      if (!firstErrorTab) firstErrorTab = "contact";
    }
    if (!formData.billingPincode?.trim()) {
      newErrors.billingPincode = "Billing Pincode is required.";
      if (!firstErrorTab) firstErrorTab = "contact";
    } else if (formData.billingPincode.trim().length !== 6) {
      newErrors.billingPincode = "Pincode must be exactly 6 digits.";
      if (!firstErrorTab) firstErrorTab = "contact";
    }
    if (!formData.billingArea?.trim()) {
      newErrors.billingArea = "Billing Area is required.";
      if (!firstErrorTab) firstErrorTab = "contact";
    }
    if (!formData.billingCity?.trim()) {
      newErrors.billingCity = "Billing City is required.";
      if (!firstErrorTab) firstErrorTab = "contact";
    }
    if (!formData.billingState?.trim()) {
      newErrors.billingState = "Billing State is required.";
      if (!firstErrorTab) firstErrorTab = "contact";
    }
    if (!formData.billingContactName?.trim()) {
      newErrors.billingContactName = "Billing Contact Name is required.";
      if (!firstErrorTab) firstErrorTab = "contact";
    }
    if (!formData.billingContactNo?.trim()) {
      newErrors.billingContactNo = "Billing Contact No is required.";
      if (!firstErrorTab) firstErrorTab = "contact";
    } else if (formData.billingContactNo.trim().length !== 10) {
      newErrors.billingContactNo = "Contact number must be exactly 10 digits.";
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
      if (!formData.shippingContactName?.trim()) {
        newErrors.shippingContactName = "Shipping Contact Name is required.";
        if (!firstErrorTab) firstErrorTab = "contact";
      }
      if (!formData.shippingContactNo?.trim()) {
        newErrors.shippingContactNo = "Shipping Contact No is required.";
        if (!firstErrorTab) firstErrorTab = "contact";
      } else if (formData.shippingContactNo.trim().length !== 10) {
        newErrors.shippingContactNo = "Contact number must be exactly 10 digits.";
        if (!firstErrorTab) firstErrorTab = "contact";
      }
    }

    // --- Tab 3: Accounting ---
    if (!formData.gstNumber?.trim()) {
      newErrors.gstNumber = "GST Number is required.";
      if (!firstErrorTab) firstErrorTab = "accounting";
    } else if (formData.gstNumber.trim().length !== 15) {
      newErrors.gstNumber = "GST Number must be exactly 15 characters.";
      if (!firstErrorTab) firstErrorTab = "accounting";
    }

    if (!formData.panNumber?.trim()) {
      newErrors.panNumber = "PAN Number is required.";
      if (!firstErrorTab) firstErrorTab = "accounting";
    } else if (formData.panNumber.trim().length !== 10) {
      newErrors.panNumber = "PAN Number must be exactly 10 characters.";
      if (!firstErrorTab) firstErrorTab = "accounting";
    }

    if (!formData.bankName?.trim()) {
      newErrors.bankName = "Bank Name is required.";
      if (!firstErrorTab) firstErrorTab = "accounting";
    }
    if (!formData.accountHolderName?.trim()) {
      newErrors.accountHolderName = "Account Holder Name is required.";
      if (!firstErrorTab) firstErrorTab = "accounting";
    }
    if (!formData.accountNumber?.trim()) {
      newErrors.accountNumber = "Bank Account Number is required.";
      if (!firstErrorTab) firstErrorTab = "accounting";
    }
    if (!formData.ifscCode?.trim()) {
      newErrors.ifscCode = "IFSC Code is required.";
      if (!firstErrorTab) firstErrorTab = "accounting";
    } else if (formData.ifscCode.trim().length !== 11) {
      newErrors.ifscCode = "IFSC Code must be exactly 11 characters.";
      if (!firstErrorTab) firstErrorTab = "accounting";
    }
    if (!formData.accountType?.trim()) {
      newErrors.accountType = "Account Type is required.";
      if (!firstErrorTab) firstErrorTab = "accounting";
    }
    if (!formData.branchName?.trim()) {
      newErrors.branchName = "Branch Name is required.";
      if (!firstErrorTab) firstErrorTab = "accounting";
    }
    if (!formData.upiId?.trim()) {
      newErrors.upiId = "UPI ID is required.";
      if (!firstErrorTab) firstErrorTab = "accounting";
    }

    setErrors(newErrors);
    return {
      isValid: Object.keys(newErrors).length === 0,
      firstErrorTab,
    };
  };

  const hasTabError = (tabKey: TabType) => {
    if (tabKey === "general") {
      return Boolean(
        errors.legalName ||
        errors.companyName ||
        errors.ownerName ||
        errors.abbreviation ||
        errors.businessType ||
        errors.email ||
        errors.phone
      );
    }
    if (tabKey === "contact") {
      return Boolean(
        errors.billingAddress1 ||
        errors.billingPincode ||
        errors.billingArea ||
        errors.billingCity ||
        errors.billingState ||
        errors.billingContactName ||
        errors.billingContactNo ||
        errors.shippingAddress1 ||
        errors.shippingPincode ||
        errors.shippingArea ||
        errors.shippingCity ||
        errors.shippingState ||
        errors.shippingContactName ||
        errors.shippingContactNo
      );
    }
    if (tabKey === "accounting") {
      return Boolean(
        errors.gstNumber ||
        errors.panNumber ||
        errors.bankName ||
        errors.accountHolderName ||
        errors.accountNumber ||
        errors.ifscCode ||
        errors.accountType ||
        errors.branchName ||
        errors.upiId
      );
    }
    return false;
  };

  const handleSave = async () => {
    if (!company) return;

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

      const payload: UpdateCompanyPayload = {
        ...formData,
        companyCode: formData.abbreviation || company.companyCode || "ACM",
        completionPercentage,
      };

      const res = await companyService.updateCompany(company.id, payload);
      toast.success("Company profile updated successfully.");
      onSaved(res.data);
    } catch (err: unknown) {
      // Handled via toast notification
      const msg = err instanceof Error ? err.message : "Failed to update company profile.";
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  const tabs: { key: TabType; label: string; completed: boolean }[] = [
    {
      key: "general",
      label: "General",
      completed: Boolean(
        formData.legalName &&
        formData.companyName &&
        formData.ownerName &&
        formData.abbreviation &&
        formData.businessType &&
        formData.email &&
        formData.phone
      ),
    },
    {
      key: "contact",
      label: "Contact",
      completed: Boolean(
        formData.billingAddress1 &&
        formData.billingPincode &&
        formData.billingArea &&
        formData.billingCity &&
        formData.billingState &&
        formData.billingContactName &&
        formData.billingContactNo
      ),
    },
    {
      key: "accounting",
      label: "Accounting",
      completed: Boolean(
        formData.gstNumber &&
        formData.panNumber &&
        formData.bankName &&
        formData.accountHolderName &&
        formData.accountNumber &&
        formData.ifscCode &&
        formData.accountType &&
        formData.branchName &&
        formData.upiId
      ),
    },
    {
      key: "logo",
      label: "Logo",
      completed: Boolean(formData.logoUrl),
    },
    {
      key: "signature",
      label: "Signature",
      completed: Boolean(formData.signatureUrl),
    },
  ];

  return (
    <div className="flex flex-col min-h-[calc(100vh-100px)] w-full rounded-2xl border border-[#E7E0D2] bg-white text-[#0A0E1A] shadow-md dark:border-white/[0.08] dark:bg-[#0E121A] dark:text-slate-100 dark:shadow-2xl overflow-hidden font-sans">
      {/* Top Header Bar matching Screenshot 2 */}
      <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-white/[0.06] flex items-center justify-between gap-4 bg-white dark:bg-[#0E121A]">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onBack}
            className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white dark:hover:bg-white/[0.06] transition-colors cursor-pointer"
            title="Back to list"
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <h1 className="text-base sm:text-lg font-bold text-[#0A0E1A] dark:text-white leading-tight">
              Company Profile
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              <span className="font-semibold text-slate-700 dark:text-slate-300">Name.</span>{" "}
              {formData.companyName || company?.companyName || "Company Name"}{" "}
              <span className="ml-3 font-semibold text-slate-700 dark:text-slate-300">GSTN.</span>{" "}
              <span className="font-mono">{formData.gstNumber || company?.gstNumber || "24ABCDE1234F1Z5"}</span>
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

      {/* Full-Width Tabs Segmented Bar matching screenshot */}
      <div className="px-6 py-3 w-full border-b border-slate-100 bg-white dark:border-white/[0.06] dark:bg-[#0E121A]">
        <div className="w-full rounded-xl bg-slate-100 border border-slate-200 dark:bg-[#161B24] dark:border-white/[0.08] p-1 grid grid-cols-5 gap-1 select-none">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.key;
            const hasErr = hasTabError(tab.key);
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveTab(tab.key)}
                className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  isActive
                    ? "border border-slate-300 bg-white text-slate-900 shadow-xs dark:border-white/20 dark:bg-white/[0.05] dark:text-white"
                    : "border border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-200/50 dark:text-slate-400 dark:hover:text-slate-200 dark:hover:bg-white/[0.02]"
                }`}
              >
                {hasErr ? (
                  <span className="relative flex h-2 w-2 shrink-0">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500" />
                  </span>
                ) : tab.completed ? (
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

      {/* Form Content Area - Full-width padding with 2-column balanced grid */}
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
                  className={getInputClassName("legalName")}
                />
                {renderFieldError("legalName")}
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
                  className={getInputClassName("companyName")}
                />
                {renderFieldError("companyName")}
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
                  className={getInputClassName()}
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
                  className={getInputClassName("ownerName")}
                />
                {renderFieldError("ownerName")}
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
                  placeholder="e.g. ACM"
                  className={getInputClassName("abbreviation", true)}
                />
                {renderFieldError("abbreviation")}
              </div>

              {/* Type Dropdown */}
              <div>
                <label className="text-[11px] font-medium text-slate-700 dark:text-slate-300 mb-1.5 block">
                  Type. <span className="text-red-500 font-bold">*</span>
                </label>
                <DropdownWithOther
                  hideLabel
                  label="Type"
                  required
                  value={formData.businessType || "Properiter"}
                  onChange={(val) => handleChange("businessType", val)}
                  options={businessTypeOptions}
                  placeholder="Select Type"
                  fieldKey="businesstype"
                  className="w-full"
                  buttonClassName={cn(
                    dropdownButtonClassName,
                    errors.businessType && "border-rose-500 ring-1 ring-rose-500/30"
                  )}
                  menuClassName={dropdownMenuClassName}
                />
                {renderFieldError("businessType")}
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
                  className={getInputClassName("email")}
                />
                {renderFieldError("email")}
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
                  className={getInputClassName("phone", true)}
                />
                {renderFieldError("phone")}
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
                  className={getInputClassName()}
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
                      placeholder="e.g. Plot No. 12, Main Street"
                      className={getInputClassName("billingAddress1")}
                    />
                    {renderFieldError("billingAddress1")}
                  </div>

                  <div>
                    <label className="text-[11px] font-medium text-slate-700 dark:text-slate-300 mb-1.5 block">
                      Address 2.
                    </label>
                    <input
                      type="text"
                      value={formData.billingAddress2 || ""}
                      onChange={(e) => handleChange("billingAddress2", e.target.value)}
                      placeholder="e.g. Industrial Area, Phase 1"
                      className={getInputClassName()}
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
                      placeholder="e.g. Near City Center, Ring Road"
                      className={getInputClassName()}
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
                      placeholder="e.g. 395001"
                      className={getInputClassName("billingPincode", true)}
                    />
                    {renderFieldError("billingPincode")}
                  </div>

                  <div>
                    <label className="text-[11px] font-medium text-slate-700 dark:text-slate-300 mb-1.5 block">
                      Area. <span className="text-red-500 font-bold">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.billingArea || ""}
                      onChange={(e) => handleChange("billingArea", e.target.value)}
                      placeholder="e.g. Central Zone"
                      className={getInputClassName("billingArea")}
                    />
                    {renderFieldError("billingArea")}
                  </div>

                  <div>
                    <label className="text-[11px] font-medium text-slate-700 dark:text-slate-300 mb-1.5 block">
                      City. <span className="text-red-500 font-bold">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.billingCity || ""}
                      onChange={(e) => handleChange("billingCity", e.target.value)}
                      placeholder="e.g. Surat"
                      className={getInputClassName("billingCity")}
                    />
                    {renderFieldError("billingCity")}
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
                      buttonClassName={cn(
                        dropdownButtonClassName,
                        errors.billingState && "border-rose-500 ring-1 ring-rose-500/30"
                      )}
                      menuClassName={dropdownMenuClassName}
                    />
                    {renderFieldError("billingState")}
                  </div>

                  <div>
                    <label className="text-[11px] font-medium text-slate-700 dark:text-slate-300 mb-1.5 block">
                      Country.
                    </label>
                    <input
                      type="text"
                      disabled
                      value={formData.billingCountry || "India"}
                      className={getInputClassName(undefined, false, true)}
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
                      placeholder="e.g. John Doe"
                      className={getInputClassName("billingContactName")}
                    />
                    {renderFieldError("billingContactName")}
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
                      placeholder="e.g. 9876543210"
                      className={getInputClassName("billingContactNo", true)}
                    />
                    {renderFieldError("billingContactNo")}
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
                      placeholder="e.g. Plot No. 12, Main Street"
                      className={getInputClassName("shippingAddress1", false, Boolean(formData.shippingSameAsBilling))}
                    />
                    {!formData.shippingSameAsBilling && renderFieldError("shippingAddress1")}
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
                      placeholder="e.g. Industrial Area, Phase 1"
                      className={getInputClassName(undefined, false, Boolean(formData.shippingSameAsBilling))}
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
                      placeholder="e.g. Near City Center, Ring Road"
                      className={getInputClassName(undefined, false, Boolean(formData.shippingSameAsBilling))}
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
                      placeholder="e.g. 395001"
                      className={getInputClassName("shippingPincode", true, Boolean(formData.shippingSameAsBilling))}
                    />
                    {!formData.shippingSameAsBilling && renderFieldError("shippingPincode")}
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
                      placeholder="e.g. Central Zone"
                      className={getInputClassName("shippingArea", false, Boolean(formData.shippingSameAsBilling))}
                    />
                    {!formData.shippingSameAsBilling && renderFieldError("shippingArea")}
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
                      placeholder="e.g. Surat"
                      className={getInputClassName("shippingCity", false, Boolean(formData.shippingSameAsBilling))}
                    />
                    {!formData.shippingSameAsBilling && renderFieldError("shippingCity")}
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
                          "bg-slate-100 border-[#E7E0D2] text-slate-500 cursor-not-allowed pointer-events-none dark:bg-[#161B26]/50 dark:border-white/[0.04] dark:text-slate-400",
                        !formData.shippingSameAsBilling &&
                          errors.shippingState &&
                          "border-rose-500 ring-1 ring-rose-500/30"
                      )}
                      menuClassName={dropdownMenuClassName}
                    />
                    {!formData.shippingSameAsBilling && renderFieldError("shippingState")}
                  </div>

                  <div>
                    <label className="text-[11px] font-medium text-slate-700 dark:text-slate-300 mb-1.5 block">
                      Country.
                    </label>
                    <input
                      type="text"
                      disabled
                      value={formData.shippingCountry || "India"}
                      className={getInputClassName(undefined, false, true)}
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
                      placeholder="e.g. John Doe"
                      className={getInputClassName("shippingContactName", false, Boolean(formData.shippingSameAsBilling))}
                    />
                    {!formData.shippingSameAsBilling && renderFieldError("shippingContactName")}
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
                      placeholder="e.g. 9876543210"
                      className={getInputClassName("shippingContactNo", true, Boolean(formData.shippingSameAsBilling))}
                    />
                    {!formData.shippingSameAsBilling && renderFieldError("shippingContactNo")}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 3: ACCOUNTING DETAILS                                                 */}
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
                      placeholder="e.g. 24ABCDE1234F1Z5"
                      className={getInputClassName("gstNumber", true)}
                    />
                    {renderFieldError("gstNumber")}
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
                      placeholder="e.g. ABCD12345E"
                      className={getInputClassName(undefined, true)}
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
                      placeholder="e.g. ABCDE1234F"
                      className={getInputClassName("panNumber", true)}
                    />
                    {renderFieldError("panNumber")}
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
                      placeholder="e.g. CST12345678"
                      className={getInputClassName(undefined, true)}
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
                      placeholder="e.g. 12345678901234"
                      className={getInputClassName(undefined, true)}
                    />
                  </div>

                  {/* Trade Category */}
                  <div>
                    <label className="text-[11px] font-medium text-slate-700 dark:text-slate-300 mb-1.5 block">
                      Trade Category.
                    </label>
                    <DropdownWithOther
                      hideLabel
                      label="Trade Category"
                      value={formData.tradeCategory || "Manufacturing"}
                      onChange={(val) => handleChange("tradeCategory", val)}
                      options={tradeCategoryOptions}
                      placeholder="Select Trade Category"
                      fieldKey="tradecategory"
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
                      placeholder="e.g. UDYAM-GJ-01-0000000"
                      className={getInputClassName(undefined, true)}
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
                      placeholder="e.g. HDFC Bank"
                      className={getInputClassName("bankName")}
                    />
                    {renderFieldError("bankName")}
                  </div>

                  <div>
                    <label className="text-[11px] font-medium text-slate-700 dark:text-slate-300 mb-1.5 block">
                      Account Holder Name. <span className="text-red-500 font-bold">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.accountHolderName || ""}
                      onChange={(e) => handleChange("accountHolderName", e.target.value)}
                      placeholder="e.g. John Doe"
                      className={getInputClassName("accountHolderName")}
                    />
                    {renderFieldError("accountHolderName")}
                  </div>

                  <div>
                    <label className="text-[11px] font-medium text-slate-700 dark:text-slate-300 mb-1.5 block">
                      Account Name.
                    </label>
                    <input
                      type="text"
                      value={formData.accountName || ""}
                      onChange={(e) => handleChange("accountName", e.target.value)}
                      placeholder="e.g. Acme Corporation"
                      className={getInputClassName()}
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
                      placeholder="e.g. 123456789012"
                      className={getInputClassName("accountNumber", true)}
                    />
                    {renderFieldError("accountNumber")}
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
                      placeholder="e.g. HDFC0001234"
                      className={getInputClassName("ifscCode", true)}
                    />
                    {renderFieldError("ifscCode")}
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
                      buttonClassName={cn(
                        dropdownButtonClassName,
                        errors.accountType && "border-rose-500 ring-1 ring-rose-500/30"
                      )}
                      menuClassName={dropdownMenuClassName}
                    />
                    {renderFieldError("accountType")}
                  </div>

                  <div>
                    <label className="text-[11px] font-medium text-slate-700 dark:text-slate-300 mb-1.5 block">
                      Branch Name. <span className="text-red-500 font-bold">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.branchName || ""}
                      onChange={(e) => handleChange("branchName", e.target.value)}
                      placeholder="e.g. Main Branch"
                      className={getInputClassName("branchName")}
                    />
                    {renderFieldError("branchName")}
                  </div>

                  <div>
                    <label className="text-[11px] font-medium text-slate-700 dark:text-slate-300 mb-1.5 block">
                      UPI ID. <span className="text-red-500 font-bold">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.upiId || ""}
                      onChange={(e) => handleChange("upiId", e.target.value)}
                      placeholder="e.g. company@okhdfcbank"
                      className={getInputClassName("upiId")}
                    />
                    {renderFieldError("upiId")}
                  </div>

                  <div>
                    <label className="text-[11px] font-medium text-slate-700 dark:text-slate-300 mb-1.5 block">
                      Client Code.
                    </label>
                    <input
                      type="text"
                      value={formData.clientCode || ""}
                      onChange={(e) => handleChange("clientCode", e.target.value)}
                      placeholder="e.g. CLI12345"
                      className={getInputClassName()}
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
                      placeholder="e.g. PRD12345"
                      className={getInputClassName()}
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
                      value={formData.taxInvoicePrefix || ""}
                      onChange={(e) => handleChange("taxInvoicePrefix", e.target.value.toUpperCase())}
                      placeholder="e.g. INV"
                      className={getInputClassName(undefined, true)}
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
                      className={getInputClassName(undefined, true)}
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-medium text-slate-700 dark:text-slate-300 mb-1.5 block">
                      Retail Invoice Prefix.
                    </label>
                    <input
                      type="text"
                      value={formData.retailInvoicePrefix || ""}
                      onChange={(e) => handleChange("retailInvoicePrefix", e.target.value.toUpperCase())}
                      placeholder="e.g. RET"
                      className={getInputClassName(undefined, true)}
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
                      className={getInputClassName(undefined, true)}
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
                        {formData.companyName || company?.companyName || "Company Name"}
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
