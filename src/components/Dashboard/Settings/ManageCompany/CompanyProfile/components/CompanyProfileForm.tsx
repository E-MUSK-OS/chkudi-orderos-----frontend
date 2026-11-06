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
  Building2,
  MapPin,
  Landmark,
  ImageIcon,
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
import DatePicker from "@/components/ui/DatePicker";

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
  "Assam",
  "Chandigarh",
  "Chhattisgarh",
  "Himachal Pradesh",
  "Jammu and Kashmir",
  "Jharkhand",
  "Uttarakhand",
];

export const PAN_ENTITY_MAP: Record<string, string> = {
  P: "Individual / Proprietor",
  C: "Company",
  H: "Hindu Undivided Family (HUF)",
  F: "Firm / Partnership",
  A: "Association of Persons (AOP)",
  B: "Body of Individuals (BOI)",
  T: "Trust",
  L: "Local Authority",
  J: "Artificial Juridical Person",
  G: "Government",
};

const STANDARD_BUSINESS_TYPES: DropdownOption[] = [
  { label: "Individual / Proprietor", value: "Individual / Proprietor" },
  { label: "Company", value: "Company" },
  { label: "Firm / Partnership", value: "Firm / Partnership" },
  { label: "Hindu Undivided Family (HUF)", value: "Hindu Undivided Family (HUF)" },
  { label: "Association of Persons (AOP)", value: "Association of Persons (AOP)" },
  { label: "Body of Individuals (BOI)", value: "Body of Individuals (BOI)" },
  { label: "Trust", value: "Trust" },
  { label: "Local Authority", value: "Local Authority" },
  { label: "Artificial Juridical Person", value: "Artificial Juridical Person" },
  { label: "Government", value: "Government" },
  { label: "Properiter", value: "Properiter" },
  { label: "Partnership", value: "Partnership" },
  { label: "Private Limited", value: "Private Limited" },
  { label: "Public Limited", value: "Public Limited" },
  { label: "LLP", value: "LLP" },
  { label: "Individual", value: "Individual" },
];

export const getBusinessTypeFromPan = (
  panOrGst?: string | null,
  availableOptions?: DropdownOption[]
): string | null => {
  if (!panOrGst || typeof panOrGst !== "string") return null;
  const clean = panOrGst.trim().toUpperCase().replace(/[^0-9A-Z]/g, "");
  let panChar = "";
  if (clean.length === 15) {
    panChar = clean.charAt(5);
  } else if (clean.length >= 4) {
    panChar = clean.charAt(3);
  }

  if (!panChar || !PAN_ENTITY_MAP[panChar]) return null;

  const targetType = PAN_ENTITY_MAP[panChar];

  if (availableOptions && availableOptions.length > 0) {
    const directMatch = availableOptions.find(
      (opt) =>
        opt.value.trim().toLowerCase() === targetType.toLowerCase() ||
        opt.label.trim().toLowerCase() === targetType.toLowerCase()
    );
    if (directMatch) return directMatch.value;

    if (panChar === "P") {
      const match = availableOptions.find((opt) => {
        const v = opt.value.trim().toLowerCase();
        return (
          v === "individual / proprietor" ||
          v === "properiter" ||
          v === "proprietor" ||
          v === "individual"
        );
      });
      if (match) return match.value;
    } else if (panChar === "C") {
      const match = availableOptions.find((opt) => {
        const v = opt.value.trim().toLowerCase();
        return v === "company" || v === "private limited" || v === "public limited";
      });
      if (match) return match.value;
    } else if (panChar === "F") {
      const match = availableOptions.find((opt) => {
        const v = opt.value.trim().toLowerCase();
        return v === "firm / partnership" || v === "partnership" || v === "firm" || v === "llp";
      });
      if (match) return match.value;
    } else if (panChar === "H") {
      const match = availableOptions.find((opt) => {
        const v = opt.value.trim().toLowerCase();
        return v === "hindu undivided family (huf)" || v === "huf";
      });
      if (match) return match.value;
    } else if (panChar === "T") {
      const match = availableOptions.find((opt) => opt.value.trim().toLowerCase() === "trust");
      if (match) return match.value;
    }
  }

  return targetType;
};

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

  // Dynamic businessTypeOptions loaded from database + standard Indian PAN entity types
  const businessTypeOptions: DropdownOption[] = useMemo(() => {
    const dbSaved = (dropdownData?.savedOptions || [])
      .filter((o) => o.field.toLowerCase() === "businesstype")
      .map((o) => ({ label: o.label || o.value, value: o.value }));

    const map = new Map<string, DropdownOption>();
    // First, user saved options from DB
    dbSaved.forEach((opt) => {
      const v = opt.value?.trim();
      if (v && !map.has(v.toLowerCase())) {
        map.set(v.toLowerCase(), { label: opt.label || v, value: v });
      }
    });

    // Merge standard Indian PAN entity types if not already present
    STANDARD_BUSINESS_TYPES.forEach((opt) => {
      const v = opt.value.trim();
      if (!map.has(v.toLowerCase())) {
        map.set(v.toLowerCase(), opt);
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
    "w-full justify-between h-11 sm:h-12 px-5 text-xs sm:text-sm font-medium rounded-full bg-white border border-[#E7E0D2] hover:border-[#E8C16D] focus:border-[#E8C16D] focus:ring-2 focus:ring-[#E8C16D]/20 text-[#0A0E1A] dark:bg-[#080B11] dark:border-white/[0.08] dark:text-white dark:hover:border-[#E8C16D]/50 transition-all shadow-xs";
  const dropdownMenuClassName =
    "w-full min-w-full max-w-none bg-white border border-[#E7E0D2] text-[#0A0E1A] dark:bg-[#0F1626] dark:border-white/[0.08] dark:text-white rounded-2xl shadow-2xl p-1.5";

  // Form state holding all fields from database
  const [formData, setFormData] = useState<UpdateCompanyPayload>({
    // General Details
    legalName: "",
    companyName: "",
    brandName: "",
    ownerName: "",
    abbreviation: "",
    businessType: "Individual / Proprietor",
    email: "",
    phone: "",
    website: "",
    registrationDate: "",

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

  // Pre-fill form data from initial company
  useEffect(() => {
    if (!company) return;

    const panOrGst = company.panNumber || company.gstNumber || "";
    const autoType = getBusinessTypeFromPan(panOrGst, businessTypeOptions);

    let initialBusinessType = company.businessType;
    if (!initialBusinessType) {
      initialBusinessType = autoType || "Individual / Proprietor";
    } else if (
      (initialBusinessType === "Properiter" || initialBusinessType.toLowerCase() === "properiter") &&
      autoType &&
      autoType !== "Properiter" &&
      autoType !== "Individual / Proprietor"
    ) {
      // If company has default "Properiter" in database but PAN indicates another entity (e.g. C -> Company)
      initialBusinessType = autoType;
    }

    setFormData({
      legalName: company.legalName || company.companyName || "",
      companyName: company.companyName || "",
      brandName: company.brandName || company.companyName || "",
      ownerName: company.ownerName || "",
      abbreviation: company.abbreviation || company.companyCode || "",
      businessType: initialBusinessType || "Individual / Proprietor",
      email: company.email || "",
      phone: company.phone || "",
      website: company.website || "",
      registrationDate: company.registrationDate || (company.createdAt ? company.createdAt.split("T")[0] : ""),

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
      shippingAddress1: company.shippingAddress1 || company.billingAddress1 || company.addressLine1 || "",
      shippingAddress2: company.shippingAddress2 || company.billingAddress2 || company.addressLine2 || "",
      shippingAddress3: company.shippingAddress3 || company.billingAddress3 || "",
      shippingPincode: company.shippingPincode || company.billingPincode || company.pincode || "",
      shippingArea: company.shippingArea || company.billingArea || "",
      shippingCity: company.shippingCity || company.billingCity || company.city || "Surat",
      shippingState: company.shippingState || company.billingState || company.state || "Gujarat",
      shippingCountry: company.shippingCountry || company.billingCountry || "India",
      shippingContactName: company.shippingContactName || company.billingContactName || company.ownerName || "",
      shippingContactNo: company.shippingContactNo || company.billingContactNo || company.phone || "",

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
  }, [company]);

  const handleChange = (field: keyof UpdateCompanyPayload, value: any) => {
    // Clear validation error when user types
    if (errors[field]) {
      setErrors((prev) => {
        const copy = { ...prev };
        delete copy[field];
        return copy;
      });
    }

    setFormData((prev) => {
      const updated = { ...prev, [field]: value };

      // Auto-derive businessType based on PAN number 4th character
      if (field === "panNumber" && typeof value === "string") {
        const cleanPan = value.trim().toUpperCase();
        if (cleanPan.length >= 4) {
          const autoType = getBusinessTypeFromPan(cleanPan, businessTypeOptions);
          if (autoType) {
            updated.businessType = autoType;
          }
        }
      }

      // Auto-derive PAN number and businessType from GST number
      if (field === "gstNumber" && typeof value === "string") {
        const cleanGst = value.trim().toUpperCase();
        if (cleanGst.length >= 12) {
          const panPart = cleanGst.substring(2, 12);
          if (!prev.panNumber || (prev.gstNumber && prev.panNumber === prev.gstNumber.substring(2, 12))) {
            updated.panNumber = panPart;
          }
        }
        if (cleanGst.length >= 6) {
          const autoType = getBusinessTypeFromPan(cleanGst, businessTypeOptions);
          if (autoType) {
            updated.businessType = autoType;
          }
        }
      }

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
        const map: Record<string, keyof UpdateCompanyPayload> = {
          billingAddress1: "shippingAddress1",
          billingAddress2: "shippingAddress2",
          billingAddress3: "shippingAddress3",
          billingPincode: "shippingPincode",
          billingArea: "shippingArea",
          billingCity: "shippingCity",
          billingState: "shippingState",
          billingCountry: "shippingCountry",
          billingContactName: "shippingContactName",
          billingContactNo: "shippingContactNo",
        };
        const target = map[field];
        if (target) {
          (updated as any)[target] = value;
        }
      }

      return updated;
    });
  };

  const handleShippingSameToggle = (checked: boolean) => {
    setFormData((prev) => {
      const updated = { ...prev, shippingSameAsBilling: checked };
      if (checked) {
        updated.shippingAddress1 = prev.billingAddress1;
        updated.shippingAddress2 = prev.billingAddress2;
        updated.shippingAddress3 = prev.billingAddress3;
        updated.shippingPincode = prev.billingPincode;
        updated.shippingArea = prev.billingArea;
        updated.shippingCity = prev.billingCity;
        updated.shippingState = prev.billingState;
        updated.shippingCountry = prev.billingCountry;
        updated.shippingContactName = prev.billingContactName;
        updated.shippingContactNo = prev.billingContactNo;
      }
      return updated;
    });
  };

  // Completion percentage calculation
  const completionPercentage = useMemo(() => {
    const requiredFields = [
      formData.legalName,
      formData.companyName,
      formData.ownerName,
      formData.abbreviation,
      formData.businessType,
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
      formData.upiId,
      formData.logoUrl,
      formData.signatureUrl,
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
      newErrors.billingPincode = "Pincode must be 6 digits.";
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
      newErrors.billingContactNo = "Contact number must be 10 digits.";
      if (!firstErrorTab) firstErrorTab = "contact";
    }

    if (!formData.shippingSameAsBilling) {
      if (!formData.shippingAddress1?.trim()) {
        newErrors.shippingAddress1 = "Shipping Address 1 is required.";
        if (!firstErrorTab) firstErrorTab = "contact";
      }
      if (!formData.shippingPincode?.trim()) {
        newErrors.shippingPincode = "Shipping Pincode is required.";
        if (!firstErrorTab) firstErrorTab = "contact";
      } else if (formData.shippingPincode.trim().length !== 6) {
        newErrors.shippingPincode = "Pincode must be 6 digits.";
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
        newErrors.shippingContactNo = "Contact number must be 10 digits.";
        if (!firstErrorTab) firstErrorTab = "contact";
      }
    }

    // --- Tab 3: Accounting ---
    if (!formData.gstNumber?.trim()) {
      newErrors.gstNumber = "GST Number is required.";
      if (!firstErrorTab) firstErrorTab = "accounting";
    } else if (formData.gstNumber.trim().length !== 15) {
      newErrors.gstNumber = "GST Number must be 15 characters.";
      if (!firstErrorTab) firstErrorTab = "accounting";
    }
    if (!formData.panNumber?.trim()) {
      newErrors.panNumber = "PAN Number is required.";
      if (!firstErrorTab) firstErrorTab = "accounting";
    } else if (formData.panNumber.trim().length !== 10) {
      newErrors.panNumber = "PAN Number must be 10 characters.";
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
      newErrors.accountNumber = "Account Number is required.";
      if (!firstErrorTab) firstErrorTab = "accounting";
    }
    if (!formData.ifscCode?.trim()) {
      newErrors.ifscCode = "IFSC Code is required.";
      if (!firstErrorTab) firstErrorTab = "accounting";
    } else if (formData.ifscCode.trim().length !== 11) {
      newErrors.ifscCode = "IFSC Code must be 11 characters.";
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
    return { isValid: Object.keys(newErrors).length === 0, firstErrorTab };
  };

  const hasTabError = (tabKey: TabType): boolean => {
    switch (tabKey) {
      case "general":
        return Boolean(
          errors.legalName ||
            errors.companyName ||
            errors.ownerName ||
            errors.abbreviation ||
            errors.businessType ||
            errors.email ||
            errors.phone
        );
      case "contact":
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
      case "accounting":
        return Boolean(
          errors.gstNumber ||
            errors.panNumber ||
            errors.bankName ||
            errors.accountHolderName ||
            errors.accountNumber ||
            errors.ifscCode ||
            errors.branchName ||
            errors.upiId
        );
      case "logo":
        return Boolean(errors.logoUrl);
      case "signature":
        return Boolean(errors.signatureUrl);
      default:
        return false;
    }
  };

  const handleSave = async () => {
    const { isValid, firstErrorTab } = validateForm();

    if (!isValid) {
      if (firstErrorTab) {
        setActiveTab(firstErrorTab);
      }
      toast.error("Please fill in all required fields marked with an asterisk (*).");
      return;
    }

    try {
      setSaving(true);
      const isCreate = !company?.id;

      // Clean payload: omit frontend-only UI fields like registrationDate
      const { registrationDate: _regDate, ...payload } = formData;
      payload.completionPercentage = completionPercentage;

      let savedCompany: Company;
      if (isCreate) {
        const res = await companyService.createCompany(payload);
        savedCompany = res.data;
        toast.success(res.message || "Company created successfully.");
      } else {
        const res = await companyService.updateCompany(company.id, payload);
        savedCompany = res.data;
        toast.success(res.message || "Company updated successfully.");
      }

      onSaved(savedCompany);
    } catch (err: any) {
      console.error("Save company error:", err);
      toast.error(err?.message || "Failed to save company profile.");
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
                title="Back to Company Profiles"
              >
                <ArrowLeft size={18} />
              </button>
              <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-[#0A0E1A] dark:text-white">
                Company Profile
              </h1>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium ml-1">
              Update company profile information, addresses, banking details, and authorized branding.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 sm:gap-3 shrink-0">
            <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-[#FFF9EC] text-[#B88728] border border-[#E8C16D]/30 dark:bg-[#1A160E] dark:text-[#E8C16D] shadow-xs">
              <Check size={12} className="stroke-[3] text-[#B88728] dark:text-[#E8C16D]" />
              <span>{formData.status === "ACTIVE" ? "Active" : "Draft"}</span>
            </div>

            <div className="px-4 py-1.5 rounded-full bg-[#0A0E1A] text-[#E8C16D] dark:bg-[#E8C16D] dark:text-[#0A0E1A] font-bold text-xs shadow-xs select-none">
              Edit Mode
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. TABS FLOATING BAR matching the image                                    */}
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
      {/* 3. MAIN SECTION CARD with Integrated Action Bar matching our theme        */}
      {/* ========================================================================= */}
      <div className="rounded-3xl border border-[#E7E0D2] dark:border-white/[0.08] bg-white dark:bg-[#0F1626] shadow-sm overflow-hidden flex flex-col">
        <div className="p-6 sm:p-8 flex-1">
        {/* ========================================================================= */}
        {/* TAB 1: GENERAL DETAILS                                                   */}
        {/* ========================================================================= */}
        {activeTab === "general" && (
          <div className="w-full">
            {/* Header matching image icon box */}
            <div className="flex items-center gap-3.5 mb-6">
              <div className="w-10 h-10 rounded-2xl bg-[#FFF9EC] border border-[#E8C16D]/40 text-[#B88728] dark:bg-[#1A160E] dark:text-[#E8C16D] flex items-center justify-center shrink-0 shadow-2xs">
                <Building2 size={18} />
              </div>
              <div>
                <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                  General Details
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Enter basic information about company.
                </p>
              </div>
            </div>

            <hr className="border-t border-[#E7E0D2] dark:border-white/[0.08] mb-6 sm:mb-8" />

            {/* 2-Column Balanced Form Grid with pill inputs */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-5">
              {/* Legal Name */}
              <div>
                <label className="text-xs font-bold text-slate-800 dark:text-slate-200 tracking-tight mb-1.5 block">
                  Legal Name. <span className="text-rose-500 font-bold ml-0.5">*</span>
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
                <label className="text-xs font-bold text-slate-800 dark:text-slate-200 tracking-tight mb-1.5 block">
                  Company Name. <span className="text-rose-500 font-bold ml-0.5">*</span>
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
                <label className="text-xs font-bold text-slate-800 dark:text-slate-200 tracking-tight mb-1.5 block">
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
                <label className="text-xs font-bold text-slate-800 dark:text-slate-200 tracking-tight mb-1.5 block">
                  Owner Name. <span className="text-rose-500 font-bold ml-0.5">*</span>
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
                <label className="text-xs font-bold text-slate-800 dark:text-slate-200 tracking-tight mb-1.5 block">
                  Abbreviation. <span className="text-rose-500 font-bold ml-0.5">*</span>
                </label>
                <input
                  type="text"
                  value={formData.abbreviation || ""}
                  onChange={(e) => handleChange("abbreviation", e.target.value.toUpperCase())}
                  placeholder="e.g. NETU"
                  className={getInputClassName("abbreviation", true)}
                />
                {renderFieldError("abbreviation")}
              </div>

              {/* Type Dropdown */}
              <div>
                <label className="text-xs font-bold text-slate-800 dark:text-slate-200 tracking-tight mb-1.5 block">
                  Type. <span className="text-rose-500 font-bold ml-0.5">*</span>
                </label>
                <DropdownWithOther
                  hideLabel
                  label="Type"
                  required
                  value={formData.businessType || ""}
                  onChange={(val) => handleChange("businessType", val)}
                  options={businessTypeOptions}
                  placeholder="Select Type"
                  fieldKey="businesstype"
                  className="w-full"
                  buttonClassName={cn(
                    dropdownButtonClassName,
                    errors.businessType && "border-rose-500 ring-2 ring-rose-500/20"
                  )}
                  menuClassName={dropdownMenuClassName}
                />
                {renderFieldError("businessType")}
              </div>

              {/* Email */}
              <div>
                <label className="text-xs font-bold text-slate-800 dark:text-slate-200 tracking-tight mb-1.5 block">
                  Email. <span className="text-rose-500 font-bold ml-0.5">*</span>
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

              {/* Contact No with 10/10 counter on top right */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-slate-800 dark:text-slate-200 tracking-tight">
                    Contact No. <span className="text-rose-500 font-bold ml-0.5">*</span>
                  </label>
                  <span
                    className={cn(
                      "text-[11px] font-bold font-mono",
                      formData.phone && formData.phone.length === 10
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
                  onChange={(e) => handleChange("phone", e.target.value.replace(/\D/g, ""))}
                  placeholder="Enter 10-digit Contact No"
                  className={getInputClassName("phone", true)}
                />
                {renderFieldError("phone")}
              </div>

              {/* Website */}
              <div>
                <label className="text-xs font-bold text-slate-800 dark:text-slate-200 tracking-tight mb-1.5 block">
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

{/* Registration Date */}
              <div>
                <label className="text-xs font-bold text-slate-800 dark:text-slate-200 tracking-tight mb-1.5 block">
                  Registration Date.
                </label>
                <DatePicker
                  allowInput
                  value={formData.registrationDate || ""}
                  onChange={(_, str) => handleChange("registrationDate", str || "")}
                  placeholder="YYYY-MM-DD (e.g. 2004-07-01)"
                  dateFormat="yyyy-MM-dd"
                  className="w-full"
                />
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 2: CONTACT DETAILS (Billing & Shipping)                               */}
        {/* ========================================================================= */}
        {activeTab === "contact" && (
          <div className="w-full">
            {/* Header */}
            <div className="flex items-center gap-3.5 mb-6">
              <div className="w-10 h-10 rounded-2xl bg-[#FFF9EC] border border-[#E8C16D]/40 text-[#B88728] dark:bg-[#1A160E] dark:text-[#E8C16D] flex items-center justify-center shrink-0 shadow-2xs">
                <MapPin size={18} />
              </div>
              <div>
                <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                  Contact Details
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Enter registered billing and shipping office addresses.
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
                      value={formData.billingAddress1 || ""}
                      onChange={(e) => handleChange("billingAddress1", e.target.value)}
                      placeholder="e.g. Plot No. 12, Main Street"
                      className={getInputClassName("billingAddress1")}
                    />
                    {renderFieldError("billingAddress1")}
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-800 dark:text-slate-200 tracking-tight mb-1.5 block">
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
                    <label className="text-xs font-bold text-slate-800 dark:text-slate-200 tracking-tight mb-1.5 block">
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
                    <label className="text-xs font-bold text-slate-800 dark:text-slate-200 tracking-tight mb-1.5 block">
                      Pincode. <span className="text-rose-500 font-bold ml-0.5">*</span>
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
                    <label className="text-xs font-bold text-slate-800 dark:text-slate-200 tracking-tight mb-1.5 block">
                      Area. <span className="text-rose-500 font-bold ml-0.5">*</span>
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
                    <label className="text-xs font-bold text-slate-800 dark:text-slate-200 tracking-tight mb-1.5 block">
                      City. <span className="text-rose-500 font-bold ml-0.5">*</span>
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
                    <label className="text-xs font-bold text-slate-800 dark:text-slate-200 tracking-tight mb-1.5 block">
                      State. <span className="text-rose-500 font-bold ml-0.5">*</span>
                    </label>
                    <ThemeSelectDropdown
                      value={formData.billingState || "Gujarat"}
                      onChange={(val) => handleChange("billingState", val)}
                      options={stateOptions}
                      placeholder="Select a state"
                      className="w-full"
                      buttonClassName={cn(
                        dropdownButtonClassName,
                        errors.billingState && "border-rose-500 ring-2 ring-rose-500/20"
                      )}
                      menuClassName={dropdownMenuClassName}
                    />
                    {renderFieldError("billingState")}
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-800 dark:text-slate-200 tracking-tight mb-1.5 block">
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
                    <label className="text-xs font-bold text-slate-800 dark:text-slate-200 tracking-tight mb-1.5 block">
                      Contact Name. <span className="text-rose-500 font-bold ml-0.5">*</span>
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
                      <label className="text-xs font-bold text-slate-800 dark:text-slate-200 tracking-tight">
                        Contact No. <span className="text-rose-500 font-bold ml-0.5">*</span>
                      </label>
                      <span
                        className={cn(
                          "text-[11px] font-bold font-mono",
                          formData.billingContactNo && formData.billingContactNo.length === 10
                            ? "text-emerald-600 dark:text-emerald-400"
                            : "text-slate-400"
                        )}
                      >
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
                      placeholder="e.g. Plot No. 12, Main Street"
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
                      placeholder="e.g. Industrial Area, Phase 1"
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
                      placeholder="e.g. Near City Center, Ring Road"
                      className={getInputClassName(undefined, false, Boolean(formData.shippingSameAsBilling))}
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-800 dark:text-slate-200 tracking-tight mb-1.5 block">
                      Pincode. <span className="text-rose-500 font-bold ml-0.5">*</span>
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
                    <label className="text-xs font-bold text-slate-800 dark:text-slate-200 tracking-tight mb-1.5 block">
                      Area. <span className="text-rose-500 font-bold ml-0.5">*</span>
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
                    <label className="text-xs font-bold text-slate-800 dark:text-slate-200 tracking-tight mb-1.5 block">
                      City. <span className="text-rose-500 font-bold ml-0.5">*</span>
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

                  <div>
                    <label className="text-xs font-bold text-slate-800 dark:text-slate-200 tracking-tight mb-1.5 block">
                      Contact Name. <span className="text-rose-500 font-bold ml-0.5">*</span>
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
                      <label className="text-xs font-bold text-slate-800 dark:text-slate-200 tracking-tight">
                        Contact No. <span className="text-rose-500 font-bold ml-0.5">*</span>
                      </label>
                      <span
                        className={cn(
                          "text-[11px] font-bold font-mono",
                          formData.shippingContactNo && formData.shippingContactNo.length === 10
                            ? "text-emerald-600 dark:text-emerald-400"
                            : "text-slate-400"
                        )}
                      >
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
            {/* Header */}
            <div className="flex items-center gap-3.5 mb-6">
              <div className="w-10 h-10 rounded-2xl bg-[#FFF9EC] border border-[#E8C16D]/40 text-[#B88728] dark:bg-[#1A160E] dark:text-[#E8C16D] flex items-center justify-center shrink-0 shadow-2xs">
                <Landmark size={18} />
              </div>
              <div>
                <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                  Accounting Details
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Enter Legal, Banking and Invoice Numbering Information.
                </p>
              </div>
            </div>

            <hr className="border-t border-[#E7E0D2] dark:border-white/[0.08] mb-6 sm:mb-8" />

            {/* Top Grid: Legal vs Bank Details */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-10 gap-y-8 mb-8">
              {/* Legal Details */}
              <div>
                <div className="flex items-center gap-2 mb-4 pb-2 border-b border-slate-100 dark:border-white/[0.06]">
                  <h3 className="text-sm font-bold text-[#0A0E1A] dark:text-white">
                    Legal Details
                  </h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-5 gap-y-4">
                  {/* GST Number */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-xs font-bold text-slate-800 dark:text-slate-200 tracking-tight">
                        GST Number. <span className="text-rose-500 font-bold ml-0.5">*</span>
                      </label>
                      <span
                        className={cn(
                          "text-[11px] font-bold font-mono",
                          formData.gstNumber && formData.gstNumber.length === 15
                            ? "text-emerald-600 dark:text-emerald-400"
                            : "text-slate-400"
                        )}
                      >
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
                      <label className="text-xs font-bold text-slate-800 dark:text-slate-200 tracking-tight">
                        TAN Number.
                      </label>
                      <span className="text-[11px] font-bold font-mono text-slate-400">
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
                      <label className="text-xs font-bold text-slate-800 dark:text-slate-200 tracking-tight">
                        PAN Number. <span className="text-rose-500 font-bold ml-0.5">*</span>
                      </label>
                      <span
                        className={cn(
                          "text-[11px] font-bold font-mono",
                          formData.panNumber && formData.panNumber.length === 10
                            ? "text-emerald-600 dark:text-emerald-400"
                            : "text-slate-400"
                        )}
                      >
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
                      <label className="text-xs font-bold text-slate-800 dark:text-slate-200 tracking-tight">
                        Central Sale Tax Number.
                      </label>
                      <span className="text-[11px] font-bold font-mono text-slate-400">
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
                      <label className="text-xs font-bold text-slate-800 dark:text-slate-200 tracking-tight">
                        FSSAI Number.
                      </label>
                      <span className="text-[11px] font-bold font-mono text-slate-400">
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
                    <label className="text-xs font-bold text-slate-800 dark:text-slate-200 tracking-tight mb-1.5 block">
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
                      <label className="text-xs font-bold text-slate-800 dark:text-slate-200 tracking-tight">
                        MSME Number.
                      </label>
                      <span className="text-[11px] font-bold font-mono text-slate-400">
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

                  {/* Spacer */}
                  <div />
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
                      Bank Name. <span className="text-rose-500 font-bold ml-0.5">*</span>
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
                    <label className="text-xs font-bold text-slate-800 dark:text-slate-200 tracking-tight mb-1.5 block">
                      Account Holder Name. <span className="text-rose-500 font-bold ml-0.5">*</span>
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
                    <label className="text-xs font-bold text-slate-800 dark:text-slate-200 tracking-tight mb-1.5 block">
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
                    <label className="text-xs font-bold text-slate-800 dark:text-slate-200 tracking-tight mb-1.5 block">
                      Bank Account Number. <span className="text-rose-500 font-bold ml-0.5">*</span>
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
                    <label className="text-xs font-bold text-slate-800 dark:text-slate-200 tracking-tight mb-1.5 block">
                      IFSC Code. <span className="text-rose-500 font-bold ml-0.5">*</span>
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
                    <label className="text-xs font-bold text-slate-800 dark:text-slate-200 tracking-tight mb-1.5 block">
                      Account Type. <span className="text-rose-500 font-bold ml-0.5">*</span>
                    </label>
                    <ThemeSelectDropdown
                      value={formData.accountType || "Current"}
                      onChange={(val) => handleChange("accountType", val)}
                      options={accountTypeOptions}
                      placeholder="Select Account Type"
                      className="w-full"
                      buttonClassName={cn(
                        dropdownButtonClassName,
                        errors.accountType && "border-rose-500 ring-2 ring-rose-500/20"
                      )}
                      menuClassName={dropdownMenuClassName}
                    />
                    {renderFieldError("accountType")}
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-800 dark:text-slate-200 tracking-tight mb-1.5 block">
                      Branch Name. <span className="text-rose-500 font-bold ml-0.5">*</span>
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
                    <label className="text-xs font-bold text-slate-800 dark:text-slate-200 tracking-tight mb-1.5 block">
                      UPI ID. <span className="text-rose-500 font-bold ml-0.5">*</span>
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
                    <label className="text-xs font-bold text-slate-800 dark:text-slate-200 tracking-tight mb-1.5 block">
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
                    <label className="text-xs font-bold text-slate-800 dark:text-slate-200 tracking-tight mb-1.5 block">
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
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-10 gap-y-8 pt-6 border-t border-slate-100 dark:border-white/[0.06]">
              {/* Invoice Details */}
              <div>
                <div className="flex items-center gap-2 mb-4 pb-2 border-b border-slate-100 dark:border-white/[0.06]">
                  <h3 className="text-sm font-bold text-[#0A0E1A] dark:text-white">
                    Invoice Details
                  </h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-5 gap-y-4">
                  <div>
                    <label className="text-xs font-bold text-slate-800 dark:text-slate-200 tracking-tight mb-1.5 block">
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
                    <label className="text-xs font-bold text-slate-800 dark:text-slate-200 tracking-tight mb-1.5 block">
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
                    <label className="text-xs font-bold text-slate-800 dark:text-slate-200 tracking-tight mb-1.5 block">
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
                    <label className="text-xs font-bold text-slate-800 dark:text-slate-200 tracking-tight mb-1.5 block">
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
                <div className="flex items-center gap-2 mb-4 pb-2 border-b border-slate-100 dark:border-white/[0.06]">
                  <h3 className="text-sm font-bold text-[#0A0E1A] dark:text-white">
                    Other Details
                  </h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-5 gap-y-4">
                  <div>
                    <label className="text-xs font-bold text-slate-800 dark:text-slate-200 tracking-tight mb-1.5 block">
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
            {/* Header */}
            <div className="flex items-center gap-3.5 mb-6">
              <div className="w-10 h-10 rounded-2xl bg-[#FFF9EC] border border-[#E8C16D]/40 text-[#B88728] dark:bg-[#1A160E] dark:text-[#E8C16D] flex items-center justify-center shrink-0 shadow-2xs">
                <Upload size={18} />
              </div>
              <div>
                <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                  Company Logo
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Upload your official company logo for invoices and portal branding.
                </p>
              </div>
            </div>

            <hr className="border-t border-[#E7E0D2] dark:border-white/[0.08] mb-6 sm:mb-8" />

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
                  className={cn(
                    "w-56 h-56 rounded-3xl bg-slate-50 border-2 border-dashed flex flex-col items-center justify-center p-4 shadow-sm dark:shadow-2xl overflow-hidden relative group cursor-pointer transition-all select-none",
                    isLogoDragging
                      ? "border-[#E8C16D] ring-4 ring-[#E8C16D]/20 bg-[#FFF9EC]/40"
                      : "border-[#E7E0D2] hover:border-[#E8C16D] dark:border-white/[0.1] dark:hover:border-[#E8C16D]/50 dark:bg-[#0B0F17]"
                  )}
                  title="Click to select and upload company logo"
                >
                  {formData.logoUrl ? (
                    <img
                      src={getMediaUrl(formData.logoUrl)}
                      alt="Company Logo"
                      className="w-full h-full object-contain"
                    />
                  ) : (
                    <div className="flex flex-col items-center justify-center text-slate-500 text-center select-none">
                      <ImageIcon size={28} className="mb-1.5 text-slate-400 dark:text-slate-500" />
                      <span className="text-xs font-medium text-slate-600 dark:text-slate-400">No Logo Uploaded</span>
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
                      className="absolute top-2.5 right-2.5 p-1.5 rounded-xl bg-black/80 hover:bg-rose-600/90 text-slate-300 hover:text-white border border-white/10 opacity-0 group-hover:opacity-100 transition-all z-20 cursor-pointer shadow-lg"
                      title="Remove Logo"
                    >
                      <Trash2 size={13} />
                    </button>
                  )}

                  {/* Hover Overlay indicating click to upload */}
                  <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px] opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1.5 text-white pointer-events-none">
                    <Upload size={22} className="text-[#E8C16D]" />
                    <span className="text-xs font-semibold">
                      {formData.logoUrl ? "Change Logo" : "Upload Logo"}
                    </span>
                    <span className="text-[10px] text-slate-300">Click or drag & drop</span>
                  </div>
                </div>
                {renderFieldError("logoUrl")}
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
            {/* Header */}
            <div className="flex items-center gap-3.5 mb-6">
              <div className="w-10 h-10 rounded-2xl bg-[#FFF9EC] border border-[#E8C16D]/40 text-[#B88728] dark:bg-[#1A160E] dark:text-[#E8C16D] flex items-center justify-center shrink-0 shadow-2xs">
                <FileText size={18} />
              </div>
              <div>
                <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                  Company Signature
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Upload authorized signatory signature for invoices and tax documents.
                </p>
              </div>
            </div>

            <hr className="border-t border-[#E7E0D2] dark:border-white/[0.08] mb-6 sm:mb-8" />

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
                  className={cn(
                    "w-72 h-44 rounded-3xl bg-slate-50 border-2 border-dashed flex items-center justify-center p-4 shadow-sm dark:shadow-2xl overflow-hidden relative group cursor-pointer transition-all select-none",
                    isSignatureDragging
                      ? "border-[#E8C16D] ring-4 ring-[#E8C16D]/20 bg-[#FFF9EC]/40"
                      : "border-[#E7E0D2] hover:border-[#E8C16D] dark:border-white/[0.1] dark:hover:border-[#E8C16D]/50 dark:bg-[#0B0F17]"
                  )}
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
                      className="absolute top-2.5 right-2.5 p-1.5 rounded-xl bg-black/80 hover:bg-rose-600/90 text-slate-300 hover:text-white border border-white/10 opacity-0 group-hover:opacity-100 transition-all z-20 cursor-pointer shadow-lg"
                      title="Remove Signature"
                    >
                      <Trash2 size={13} />
                    </button>
                  )}

                  {/* Hover Overlay indicating click to upload */}
                  <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px] opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1.5 text-white pointer-events-none">
                    <Upload size={22} className="text-[#E8C16D]" />
                    <span className="text-xs font-semibold">
                      {formData.signatureUrl ? "Change Signature" : "Upload Signature"}
                    </span>
                    <span className="text-[10px] text-slate-300">Click or drag & drop</span>
                  </div>
                </div>
                {renderFieldError("signatureUrl")}
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
