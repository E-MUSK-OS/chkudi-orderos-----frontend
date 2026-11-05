"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import DashboardLayout from "@/components/Dashboard/layout/DashboardLayout";
import {
  ArrowLeft,
  Circle,
  CheckCircle2,
  Save,
  Upload,
  Calendar as CalendarIcon,
  Trash2,
  Loader2,
  FileText,
  User,
  CreditCard,
  Building,
  Check,
  Printer,
  Eye,
  Download,
  X,
  AlertCircle,
} from "lucide-react";
import { toast } from "sonner";
import { Employee, EmployeeFormData, EmployeeDocumentItem } from "../types/employee.types";
import { employeeService } from "../services/employee.service";
import { companyService } from "../../CompanyProfile/services/company.service";
import { CompanyBranchItem, Company } from "../../CompanyProfile/types/company.types";
import PrintIdCardModal from "./PrintIdCardModal";
import ThemeSelectDropdown, {
  ThemeSelectOption,
} from "@/components/ui/ThemeSelectDropdown";
import DropdownWithOther, {
  type DropdownOption,
} from "@/components/Dashboard/Products/ManageProducts/components/DropdownWithOther";
import { useDropdownOptions } from "@/components/Dashboard/Products/ManageProducts/hooks/useDropdownOptions";
import DatePicker from "@/components/ui/DatePicker";
import { getMediaUrl, cn } from "@/lib/utils";

interface EmployeeProfileFormProps {
  initialData?: Employee | null;
  mode: "create" | "edit";
}

type TabType = "general" | "bank" | "photo" | "documents";

const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-"];

const DEPARTMENTS = [
  "Admin",
  "Cutting",
  "Stitching",
  "Finishing",
  "Store",
  "Inventory",
  "Computer Operator",
  "Other",
];

const DESIGNATIONS = [
  "Admin",
  "Master",
  "Computer Operator",
  "Manager",
  "Supervisor",
  "Staff",
  "Helper",
  "Other",
];



const SALARY_TYPES = ["Salaried", "Daily Wage", "Piece Rate", "Hourly"];

const WORKER_PROCESSES = [
  "Select Process",
  "Cutting",
  "Embroidery",
  "Stitching",
  "Ironing",
  "Packing",
  "Quality Check",
];

const ACCOUNT_TYPES = ["Savings", "Current"];

function formatToDisplayDate(val?: string | null): string {
  if (!val) return "";
  if (/^\d{2}-\d{2}-\d{4}$/.test(val)) return val;
  try {
    const d = new Date(val);
    if (isNaN(d.getTime())) return val;
    const day = String(d.getDate()).padStart(2, "0");
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const year = d.getFullYear();
    return `${day}-${month}-${year}`;
  } catch {
    return val;
  }
}

export default function EmployeeProfileForm({
  initialData,
  mode,
}: EmployeeProfileFormProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabType>("general");
  const [saving, setSaving] = useState(false);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // File upload state
  const [uploadingField, setUploadingField] = useState<string | null>(null);
  const [uploadingDoc, setUploadingDoc] = useState(false);
  const [previewDoc, setPreviewDoc] = useState<EmployeeDocumentItem | null>(null);

  // File input refs
  const photoInputRef = useRef<HTMLInputElement>(null);
  const bankDocInputRef = useRef<HTMLInputElement>(null);
  const identityDocInputRef = useRef<HTMLInputElement>(null);

  const isEditMode = mode === "edit" || Boolean(initialData?.id);

  // Fetch dynamic dropdown options from DB
  const { data: dropdownResponse } = useDropdownOptions();
  const dropdownData = dropdownResponse?.data;

  // Dynamic Companies & Branches loaded from backend
  const [companyList, setCompanyList] = useState<Company[]>([]);
  const [loadingCompanies, setLoadingCompanies] = useState<boolean>(true);
  const [branchList, setBranchList] = useState<CompanyBranchItem[]>([]);
  const [loadingBranches, setLoadingBranches] = useState<boolean>(true);

  useEffect(() => {
    let isMounted = true;
    const loadData = async () => {
      try {
        setLoadingCompanies(true);
        setLoadingBranches(true);
        const [compRes, branchRes] = await Promise.all([
          companyService.getCompanies({ pageSize: 100 }).catch(() => ({ data: [] })),
          companyService.getBranches().catch(() => ({ data: [] })),
        ]);
        if (isMounted) {
          if (compRes?.data) {
            setCompanyList(compRes.data);
          }
          if (branchRes?.data) {
            setBranchList(branchRes.data);
          }
        }
      } catch (err) {
        console.error("Failed to load companies or branches for employee form:", err);
      } finally {
        if (isMounted) {
          setLoadingCompanies(false);
          setLoadingBranches(false);
        }
      }
    };
    loadData();
    return () => {
      isMounted = false;
    };
  }, []);

  // Form State
  const [formData, setFormData] = useState<EmployeeFormData>({
    firstName: "",
    middleName: "",
    lastName: "",
    employeeId: "",
    machineCode: "",
    loginId: "",
    email: "",
    contactNo: "",
    aadhaarNo: "",
    dob: "25-08-1982",
    bloodGroup: "B+",
    company: initialData?.company || "",
    branch: initialData?.branch || "",
    department: "Admin",
    designation: "Admin",
    salaryType: "Salaried",
    joiningDate: "01-09-2026",
    workerProcess: "Select Process",
    basicSalary: initialData?.basicSalary !== undefined && initialData?.basicSalary !== null ? String(initialData.basicSalary) : "",
    isActive: true,

    addressLine1: "",
    addressLine2: "",
    city: "Surat",
    state: "Gujarat",
    country: "India",
    pincode: "",

    accountNumber: "",
    accountHolderName: "",
    bankName: "",
    branchName: "",
    accountType: "Savings",
    ifscCode: "",

    photoUrl: "",
    identityDocUrl: "",
    bankDocUrl: "",
    documents: [],
  });

  // Prepopulate from initialData
  useEffect(() => {
    if (initialData) {
      let initialDocs: EmployeeDocumentItem[] = [];
      if (Array.isArray(initialData.documents) && initialData.documents.length > 0) {
        initialDocs = initialData.documents;
      } else if (initialData.identityDocUrl) {
        initialDocs = [
          {
            id: "doc_legacy_1",
            name: "Identity Document",
            type: "Identity Proof",
            url: initialData.identityDocUrl,
            uploadedAt: initialData.createdAt,
          },
        ];
      }

      setFormData({
        firstName: initialData.firstName || "",
        middleName: initialData.middleName || "",
        lastName: initialData.lastName || "",
        employeeId: initialData.employeeId || "",
        machineCode: initialData.machineCode || "",
        loginId: initialData.loginId || "",
        email: initialData.email || "",
        contactNo: initialData.contactNo || "",
        aadhaarNo: initialData.aadhaarNo || "",
        dob: formatToDisplayDate(initialData.dob) || "25-08-1982",
        bloodGroup: initialData.bloodGroup || "B+",
        company: initialData.company || "",
        branch: initialData.branch || "",
        department: initialData.department || "Admin",
        designation: initialData.designation || "Admin",
        salaryType: initialData.salaryType || "Salaried",
        joiningDate: formatToDisplayDate(initialData.joiningDate) || "01-09-2026",
        workerProcess: initialData.workerProcess || "Select Process",
        basicSalary: initialData.basicSalary !== undefined && initialData.basicSalary !== null ? String(initialData.basicSalary) : "",
        isActive: initialData.isActive !== undefined ? initialData.isActive : true,

        addressLine1: initialData.addressLine1 || "",
        addressLine2: initialData.addressLine2 || "",
        city: initialData.city || "Surat",
        state: initialData.state || "Gujarat",
        country: initialData.country || "India",
        pincode: initialData.pincode || "",

        accountNumber: initialData.accountNumber || "",
        accountHolderName: initialData.accountHolderName || initialData.fullName || "",
        bankName: initialData.bankName || "",
        branchName: initialData.branchName || "",
        accountType: initialData.accountType || "Savings",
        ifscCode: initialData.ifscCode || "",

        photoUrl: initialData.photoUrl || "",
        identityDocUrl: initialData.identityDocUrl || "",
        bankDocUrl: initialData.bankDocUrl || "",
        documents: initialDocs,
      });
    }
  }, [initialData]);

  // Auto-resolve company from branch if branch is already known but company is blank (e.g. legacy records)
  useEffect(() => {
    if (branchList.length > 0 && !formData.company && formData.branch) {
      const foundBranch = branchList.find(
        (b) =>
          b.displayName === formData.branch ||
          b.branchName === formData.branch ||
          `${b.companyName} - ${b.branchName}` === formData.branch
      );
      if (foundBranch && foundBranch.companyName) {
        setFormData((prev) => ({
          ...prev,
          company: foundBranch.companyName,
        }));
      }
    }
  }, [branchList, formData.branch, formData.company]);

  const handleChange = (field: keyof EmployeeFormData, value: any) => {
    if (errors[field]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }

    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  // Dropdown options matching software ThemeSelectDropdown
  const bloodGroupOptions: ThemeSelectOption[] = useMemo(
    () => BLOOD_GROUPS.map((bg) => ({ value: bg, label: bg })),
    []
  );

  const companyOptions: ThemeSelectOption[] = useMemo(() => {
    return companyList.map((c) => ({
      value: c.companyName || c.legalName || c.id,
      label: c.companyName || c.legalName || "Unnamed Company",
    }));
  }, [companyList]);

  const selectedCompanyObj = useMemo(() => {
    if (!formData.company) return null;
    return companyList.find(
      (c) =>
        c.companyName?.trim().toLowerCase() === formData.company.trim().toLowerCase() ||
        c.id === formData.company ||
        c.legalName?.trim().toLowerCase() === formData.company.trim().toLowerCase()
    );
  }, [companyList, formData.company]);

  const filteredBranchList = useMemo(() => {
    if (!formData.company) {
      return [];
    }
    return branchList.filter((b) => {
      if (selectedCompanyObj && b.companyId && b.companyId === selectedCompanyObj.id) {
        return true;
      }
      if (
        b.companyName &&
        b.companyName.trim().toLowerCase() === formData.company.trim().toLowerCase()
      ) {
        return true;
      }
      return false;
    });
  }, [branchList, formData.company, selectedCompanyObj]);

  const branchOptions: ThemeSelectOption[] = useMemo(() => {
    return filteredBranchList.map((b) => {
      const val = b.displayName || `${b.companyName} - ${b.branchName}` || b.branchName;
      return {
        value: val,
        label: val,
      };
    });
  }, [filteredBranchList]);

  const handleCompanyChange = (companyName: string) => {
    handleChange("company", companyName);

    // If current selected branch does not belong to new company, reset branch
    const compObj = companyList.find(
      (c) =>
        c.companyName?.trim().toLowerCase() === companyName.trim().toLowerCase() ||
        c.id === companyName ||
        c.legalName?.trim().toLowerCase() === companyName.trim().toLowerCase()
    );
    const matchingBranches = branchList.filter((b) => {
      if (compObj && b.companyId && b.companyId === compObj.id) return true;
      if (b.companyName && b.companyName.trim().toLowerCase() === companyName.trim().toLowerCase()) return true;
      return false;
    });

    const isCurrentBranchValid = matchingBranches.some((b) => {
      const val = b.displayName || `${b.companyName} - ${b.branchName}` || b.branchName;
      return val === formData.branch || b.branchName === formData.branch;
    });

    if (!isCurrentBranchValid) {
      handleChange("branch", "");
    }
  };

  // Dynamic departmentOptions merging static DEPARTMENTS and DB saved options
  const departmentOptions: DropdownOption[] = useMemo(() => {
    const list: DropdownOption[] = DEPARTMENTS.map((dept) => ({ value: dept, label: dept }));
    const dbSaved = (dropdownData?.savedOptions || [])
      .filter((o) => o.field.toLowerCase() === "department")
      .map((o) => ({ label: o.label || o.value, value: o.value }));

    const map = new Map<string, DropdownOption>();
    [...list, ...dbSaved].forEach((opt) => {
      const v = opt.value?.trim();
      if (v && !map.has(v.toLowerCase())) {
        map.set(v.toLowerCase(), { label: opt.label || v, value: v });
      }
    });
    return Array.from(map.values());
  }, [dropdownData]);

  // Dynamic designationOptions merging static DESIGNATIONS and DB saved options
  const designationOptions: DropdownOption[] = useMemo(() => {
    const list: DropdownOption[] = DESIGNATIONS.map((desig) => ({ value: desig, label: desig }));
    const dbSaved = (dropdownData?.savedOptions || [])
      .filter((o) => o.field.toLowerCase() === "designation")
      .map((o) => ({ label: o.label || o.value, value: o.value }));

    const map = new Map<string, DropdownOption>();
    [...list, ...dbSaved].forEach((opt) => {
      const v = opt.value?.trim();
      if (v && !map.has(v.toLowerCase())) {
        map.set(v.toLowerCase(), { label: opt.label || v, value: v });
      }
    });
    return Array.from(map.values());
  }, [dropdownData]);

  // Dynamic salaryTypeOptions merging static SALARY_TYPES and DB saved options
  const salaryTypeOptions: DropdownOption[] = useMemo(() => {
    const list: DropdownOption[] = SALARY_TYPES.map((st) => ({ value: st, label: st }));
    const dbSaved = (dropdownData?.savedOptions || [])
      .filter((o) => o.field.toLowerCase() === "salarytype")
      .map((o) => ({ label: o.label || o.value, value: o.value }));

    const map = new Map<string, DropdownOption>();
    [...list, ...dbSaved].forEach((opt) => {
      const v = opt.value?.trim();
      if (v && !map.has(v.toLowerCase())) {
        map.set(v.toLowerCase(), { label: opt.label || v, value: v });
      }
    });
    return Array.from(map.values());
  }, [dropdownData]);

  // Dynamic workerProcessOptions merging static WORKER_PROCESSES and DB saved options
  const workerProcessOptions: DropdownOption[] = useMemo(() => {
    const list: DropdownOption[] = WORKER_PROCESSES
      .filter((wp) => wp !== "Select Process")
      .map((wp) => ({ value: wp, label: wp }));
    const dbSaved = (dropdownData?.savedOptions || [])
      .filter((o) => o.field.toLowerCase() === "workerprocess")
      .map((o) => ({ label: o.label || o.value, value: o.value }));

    const map = new Map<string, DropdownOption>();
    [...list, ...dbSaved].forEach((opt) => {
      const v = opt.value?.trim();
      if (v && !map.has(v.toLowerCase())) {
        map.set(v.toLowerCase(), { label: opt.label || v, value: v });
      }
    });
    return Array.from(map.values());
  }, [dropdownData]);

  const accountTypeOptions: ThemeSelectOption[] = useMemo(
    () => ACCOUNT_TYPES.map((at) => ({ value: at, label: at })),
    []
  );

  const dropdownButtonClassName =
    "w-full justify-between h-10 px-3.5 text-xs font-normal rounded-xl bg-white border border-[#E7E0D2] text-[#0A0E1A] hover:border-[#E8C16D] dark:bg-[#161B26] dark:border-white/[0.08] dark:text-white dark:hover:border-white/20 transition-all";
  const dropdownMenuClassName =
    "w-full min-w-full max-w-none bg-white border border-[#E7E0D2] text-[#0A0E1A] dark:bg-[#0F1626] dark:border-white/[0.08] dark:text-white rounded-xl shadow-2xl";
  const datePickerButtonClassName =
    "h-10 px-3.5 text-xs rounded-xl bg-white border border-[#E7E0D2] text-[#0A0E1A] hover:border-[#E8C16D] dark:bg-[#161B26] dark:border-white/[0.08] dark:text-white dark:hover:border-white/20 transition-all";

  const getInputClassName = (fieldKey?: string, isMono = false) => {
    const hasErr = Boolean(fieldKey && errors[fieldKey]);
    return cn(
      "w-full h-10 px-3.5 text-xs rounded-xl bg-white border text-[#0A0E1A] placeholder-slate-400 dark:bg-[#161B26] dark:text-white outline-none transition-all shadow-inner",
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

    // --- Tab 1: General Details ---
    if (!formData.firstName?.trim()) {
      newErrors.firstName = "First Name is required.";
      if (!firstErrorTab) firstErrorTab = "general";
    }
    if (!formData.middleName?.trim()) {
      newErrors.middleName = "Middle Name is required.";
      if (!firstErrorTab) firstErrorTab = "general";
    }
    if (!formData.lastName?.trim()) {
      newErrors.lastName = "Last Name is required.";
      if (!firstErrorTab) firstErrorTab = "general";
    }
    if (!formData.contactNo?.trim()) {
      newErrors.contactNo = "Contact number is required.";
      if (!firstErrorTab) firstErrorTab = "general";
    } else if (formData.contactNo.trim().length !== 10) {
      newErrors.contactNo = "Contact number must be exactly 10 digits.";
      if (!firstErrorTab) firstErrorTab = "general";
    }
    if (!formData.aadhaarNo?.trim()) {
      newErrors.aadhaarNo = "Aadhar number is required.";
      if (!firstErrorTab) firstErrorTab = "general";
    } else if (formData.aadhaarNo.trim().length !== 12) {
      newErrors.aadhaarNo = "Aadhar number must be exactly 12 digits.";
      if (!firstErrorTab) firstErrorTab = "general";
    }
    if (!formData.employeeId?.trim()) {
      newErrors.employeeId = "Employee ID is required.";
      if (!firstErrorTab) firstErrorTab = "general";
    }
    if (!formData.dob?.trim()) {
      newErrors.dob = "Date of Birth is required.";
      if (!firstErrorTab) firstErrorTab = "general";
    }
    if (!formData.department?.trim()) {
      newErrors.department = "Department is required.";
      if (!firstErrorTab) firstErrorTab = "general";
    }
    if (!formData.designation?.trim()) {
      newErrors.designation = "Designation is required.";
      if (!firstErrorTab) firstErrorTab = "general";
    }
    if (!formData.salaryType?.trim()) {
      newErrors.salaryType = "Salary Type is required.";
      if (!firstErrorTab) firstErrorTab = "general";
    }
    if (formData.email?.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email.trim())) {
        newErrors.email = "Please enter a valid email address.";
        if (!firstErrorTab) firstErrorTab = "general";
      }
    }

    // --- Tab 2: Bank Details ---
    if (formData.ifscCode?.trim() && formData.ifscCode.trim().length !== 11) {
      newErrors.ifscCode = "IFSC Code must be exactly 11 characters.";
      if (!firstErrorTab) firstErrorTab = "bank";
    }

    setErrors(newErrors);
    return {
      isValid: Object.keys(newErrors).length === 0,
      firstErrorTab,
    };
  };

  const hasTabError = (tabKey: TabType): boolean => {
    if (tabKey === "general") {
      return Boolean(
        errors.firstName ||
        errors.middleName ||
        errors.lastName ||
        errors.contactNo ||
        errors.aadhaarNo ||
        errors.employeeId ||
        errors.dob ||
        errors.department ||
        errors.designation ||
        errors.salaryType ||
        errors.email
      );
    }
    if (tabKey === "bank") {
      return Boolean(errors.ifscCode);
    }
    return false;
  };

  // Completion percentage calculation
  const completionPercentage = useMemo(() => {
    const fields = [
      formData.firstName,
      formData.middleName,
      formData.lastName,
      formData.contactNo,
      formData.employeeId,
      formData.dob,
      formData.department,
      formData.designation,
      formData.aadhaarNo,
      formData.bankName,
      formData.accountNumber,
      formData.ifscCode,
      formData.photoUrl,
      formData.documents && formData.documents.length > 0 ? "has_docs" : formData.identityDocUrl,
    ];
    const filled = fields.filter((f) => f && String(f).trim().length > 0).length;
    return Math.min(100, Math.round((filled / fields.length) * 100));
  }, [formData]);

  // File Upload Handlers: Writes directly to Storage/NAS via API (NEVER Base64 in Database!)
  const handleSingleFileUpload = async (
    file: File,
    targetField: "photoUrl" | "bankDocUrl"
  ) => {
    if (file.size > 15 * 1024 * 1024) {
      toast.error("File size must be under 15MB.");
      return;
    }

    try {
      setUploadingField(targetField);
      const prefix = targetField === "photoUrl" ? "photo" : "bank_doc";
      const res = await employeeService.uploadMedia(file, "employees", prefix);
      handleChange(targetField, res.url);
      toast.success("File uploaded to storage successfully.");
    } catch (err: any) {
      toast.error(err.message || "Failed to upload file to storage.");
    } finally {
      setUploadingField(null);
    }
  };

  // Add Document to Multiple Documents list (shifts newly added document next to the attach box)
  const handleAddDocument = async (file: File) => {
    if (file.size > 20 * 1024 * 1024) {
      toast.error("File size must be under 20MB.");
      return;
    }

    try {
      setUploadingDoc(true);
      const res = await employeeService.uploadMedia(file, "employees", "emp_doc");

      // Derive friendly name
      const cleanFileName = file.name.replace(/\.[^/.]+$/, "");
      const friendlyName =
        cleanFileName.charAt(0).toUpperCase() + cleanFileName.slice(1);

      const newDoc: EmployeeDocumentItem = {
        id: `doc_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        name: friendlyName || "Document",
        type: "Identity Proof",
        url: res.url,
        fileName: file.name,
        fileSize: file.size,
        uploadedAt: new Date().toISOString(),
      };

      setFormData((prev) => {
        const prevDocs = prev.documents || [];
        // Put newest document right next to the attach box (index 0)
        const nextDocs = [newDoc, ...prevDocs];
        return {
          ...prev,
          documents: nextDocs,
          identityDocUrl: nextDocs[0]?.url || prev.identityDocUrl,
        };
      });

      toast.success(`"${file.name}" added successfully.`);
    } catch (err: any) {
      toast.error(err.message || "Failed to upload document.");
    } finally {
      setUploadingDoc(false);
      if (identityDocInputRef.current) {
        identityDocInputRef.current.value = "";
      }
    }
  };

  const handleRemoveDocument = (id: string) => {
    setFormData((prev) => {
      const nextDocs = (prev.documents || []).filter((d) => d.id !== id);
      return {
        ...prev,
        documents: nextDocs,
        identityDocUrl: nextDocs[0]?.url || "",
      };
    });
    toast.info("Document removed.");
  };

  const handleUpdateDocument = (id: string, updates: Partial<EmployeeDocumentItem>) => {
    setFormData((prev) => {
      const nextDocs = (prev.documents || []).map((d) =>
        d.id === id ? { ...d, ...updates } : d
      );
      return {
        ...prev,
        documents: nextDocs,
      };
    });
  };

  // Full Name computed
  const displayedFullName = useMemo(() => {
    const parts = [formData.firstName, formData.middleName, formData.lastName].filter(Boolean);
    return parts.join(" ").trim() || initialData?.fullName || "---";
  }, [formData.firstName, formData.middleName, formData.lastName, initialData]);

  // Form Submit / Save
  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();

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
      const payload: Partial<EmployeeFormData> = {
        ...formData,
        basicSalary:
          formData.basicSalary !== "" && formData.basicSalary !== undefined
            ? Number(formData.basicSalary)
            : 0,
        identityDocUrl:
          formData.documents && formData.documents.length > 0
            ? formData.documents[0].url
            : formData.identityDocUrl,
        workerProcess:
          formData.workerProcess === "Select Process" ? "" : formData.workerProcess,
      };

      if (isEditMode && initialData?.id) {
        await employeeService.updateEmployee(initialData.id, payload);
        toast.success("Employee profile updated successfully.");
      } else {
        await employeeService.createEmployee(payload);
        toast.success("Employee profile created successfully.");
      }

      setTimeout(() => {
        router.push("/dashboard/setting/manage-company/employee-profile");
      }, 700);
    } catch (err: any) {
      toast.error(err.message || "Failed to save employee profile.");
    } finally {
      setSaving(false);
    }
  };

  const tabs: { key: TabType; label: string; completed: boolean }[] = [
    {
      key: "general",
      label: "General",
      completed: Boolean(
        formData.firstName &&
        formData.middleName &&
        formData.lastName &&
        formData.contactNo &&
        formData.aadhaarNo &&
        formData.employeeId &&
        formData.dob &&
        formData.department &&
        formData.designation &&
        formData.salaryType
      ),
    },
    {
      key: "bank",
      label: "Bank Detail",
      completed: Boolean(formData.bankName || formData.accountNumber),
    },
    {
      key: "photo",
      label: "Photo",
      completed: Boolean(formData.photoUrl),
    },
    {
      key: "documents",
      label: "Documents",
      completed: Boolean(
        (formData.documents && formData.documents.length > 0) ||
        formData.identityDocUrl
      ),
    },
  ];

  return (
    <DashboardLayout title="Employee Profile">
      <div className="flex flex-col min-h-[calc(100vh-140px)] w-full rounded-2xl border border-[#E7E0D2] bg-white text-[#0A0E1A] shadow-md dark:border-white/[0.08] dark:bg-[#0E121A] dark:text-slate-100 dark:shadow-2xl overflow-hidden font-sans">
        {/* Top Header Bar */}
        <div className="px-6 pt-5 pb-3 w-full flex items-center justify-between border-b border-slate-100 bg-white dark:border-white/[0.06] dark:bg-[#0E121A]">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() =>
                router.push("/dashboard/setting/manage-company/employee-profile")
              }
              className="p-1 rounded-lg hover:bg-slate-100 text-slate-700 dark:text-slate-300 dark:hover:bg-white/[0.08] dark:hover:text-white transition-colors cursor-pointer"
              title="Back to Employee Profile"
            >
              <ArrowLeft size={18} />
            </button>
            <div>
              <h1 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white leading-tight">
                Employee Profile
              </h1>
              <p className="text-xs text-slate-400 mt-0.5">
                <span className="font-semibold text-slate-700 dark:text-slate-300">Employee Name</span>{" "}
                <span className="text-slate-900 dark:text-white font-medium">{displayedFullName}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            {/* Active Status Badge matching Edit Ledger */}
            <button
              type="button"
              onClick={() => handleChange("isActive", !formData.isActive)}
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border shadow-xs transition-colors cursor-pointer ${
                formData.isActive
                  ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20"
                  : "bg-red-500/10 text-red-500 border-red-500/20 dark:text-red-400"
              }`}
              title="Click to toggle active status"
            >
              <span>{formData.isActive ? "Active" : "Inactive"}</span>
              {formData.isActive && <Check size={12} className="stroke-[3]" />}
            </button>

            {/* Edit Mode / New Mode indicator */}
            <div className="px-3.5 py-1 rounded-md border border-[#E7E0D2] bg-white text-slate-900 dark:border-white/[0.08] dark:bg-[#161B24] dark:text-white font-bold text-xs shadow-xs select-none">
              {isEditMode ? "Edit Mode" : "New Mode"}
            </div>

            {/* Create User button */}
            <button
              type="button"
              onClick={() =>
                router.push("/dashboard/setting/manage-company/employee-profile/new")
              }
              className="inline-flex items-center justify-center px-4 py-1.5 rounded-xl bg-[#F5C451] hover:bg-[#E8B83D] active:scale-[0.98] text-[#0A0E1A] font-bold text-xs shadow-sm transition-all cursor-pointer"
            >
              Create User
            </button>
          </div>
        </div>

        {/* 4 Tabs Segmented Bar */}
        <div className="px-6 py-3 w-full border-b border-slate-100 bg-white dark:border-white/[0.06] dark:bg-[#0E121A]">
          <div className="w-full rounded-xl bg-slate-100 border border-slate-200 dark:bg-[#161B24] dark:border-white/[0.08] p-1 grid grid-cols-4 gap-1 select-none">
            {tabs.map((tab) => {
              const isActive = activeTab === tab.key;
              const isTabInvalid = hasTabError(tab.key);
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
                  {isTabInvalid ? (
                    <span className="relative flex h-2 w-2 shrink-0">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75" />
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500" />
                    </span>
                  ) : tab.completed ? (
                    <CheckCircle2
                      size={14}
                      className={isActive ? "text-emerald-400 shrink-0" : "text-emerald-500/70 shrink-0"}
                    />
                  ) : (
                    <Circle size={14} className="text-slate-500 shrink-0" />
                  )}
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Tab Contents Area */}
        <div className="px-6 sm:px-8 py-5 sm:py-6 flex-1 overflow-y-auto no-scrollbar [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
          {/* TAB 1: GENERAL */}
          {activeTab === "general" && (
            <div className="space-y-4">
              {/* Section Header with Active Toggle */}
              <div className="flex items-center justify-between pb-3 border-b border-[#E7E0D2] dark:border-white/[0.06]">
                <div>
                  <h2 className="text-sm font-bold text-slate-900 dark:text-white">General Details</h2>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Enter basic employee details
                  </p>
                </div>
                <div className="flex items-center gap-2.5">
                  <span className="text-xs font-medium text-slate-700 dark:text-slate-300">Active</span>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={formData.isActive}
                    onClick={() => handleChange("isActive", !formData.isActive)}
                    className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors focus:outline-none cursor-pointer border ${
                      formData.isActive
                        ? "bg-emerald-500 border-emerald-600 dark:bg-emerald-500 dark:border-emerald-500"
                        : "bg-slate-200 border-slate-300 dark:bg-slate-700 dark:border-slate-600"
                    }`}
                  >
                    <span
                      className={`inline-block h-3.5 w-3.5 rounded-full bg-white shadow-xs transition-transform ${
                        formData.isActive ? "translate-x-[18px]" : "translate-x-[2px]"
                      }`}
                    />
                  </button>
                </div>
              </div>

              {/* Row 1: First Name, Middle Name, Last Name */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-5">
                <div>
                  <label className="text-[11px] font-medium text-slate-700 dark:text-slate-300 mb-1.5 block">
                    First Name. <span className="text-red-500 font-bold">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.firstName}
                    onChange={(e) => handleChange("firstName", e.target.value)}
                    placeholder="Enter first name"
                    className={getInputClassName("firstName")}
                  />
                  {renderFieldError("firstName")}
                </div>

                <div>
                  <label className="text-[11px] font-medium text-slate-700 dark:text-slate-300 mb-1.5 block">
                    Middle Name. <span className="text-red-500 font-bold">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.middleName}
                    onChange={(e) => handleChange("middleName", e.target.value)}
                    placeholder="Enter middle name"
                    className={getInputClassName("middleName")}
                  />
                  {renderFieldError("middleName")}
                </div>

                <div>
                  <label className="text-[11px] font-medium text-slate-700 dark:text-slate-300 mb-1.5 block">
                    Last Name. <span className="text-red-500 font-bold">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.lastName}
                    onChange={(e) => handleChange("lastName", e.target.value)}
                    placeholder="Enter last name"
                    className={getInputClassName("lastName")}
                  />
                  {renderFieldError("lastName")}
                </div>
              </div>

              {/* Row 2: Contact No, Aadhar No, Employee ID */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-5">
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-[11px] font-medium text-slate-700 dark:text-slate-300">
                      Contact No. <span className="text-red-500 font-bold">*</span>
                    </label>
                    <span className="text-[10px] text-emerald-400 font-mono">
                      {formData.contactNo.length}/10
                    </span>
                  </div>
                  <input
                    type="text"
                    maxLength={10}
                    value={formData.contactNo}
                    onChange={(e) =>
                      handleChange("contactNo", e.target.value.replace(/\D/g, ""))
                    }
                    placeholder="Enter 10-digit number"
                    className={getInputClassName("contactNo", true)}
                  />
                  {renderFieldError("contactNo")}
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-[11px] font-medium text-slate-700 dark:text-slate-300">
                      Aadhar No. <span className="text-red-500 font-bold">*</span>
                    </label>
                    <span className="text-[10px] text-emerald-400 font-mono">
                      {formData.aadhaarNo.length}/12
                    </span>
                  </div>
                  <input
                    type="text"
                    maxLength={12}
                    value={formData.aadhaarNo}
                    onChange={(e) => handleChange("aadhaarNo", e.target.value.replace(/\D/g, ""))}
                    placeholder="Enter 12-digit Aadhaar"
                    className={getInputClassName("aadhaarNo", true)}
                  />
                  {renderFieldError("aadhaarNo")}
                </div>

                <div>
                  <label className="text-[11px] font-medium text-slate-700 dark:text-slate-300 mb-1.5 block">
                    Employee ID. <span className="text-red-500 font-bold">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.employeeId}
                    onChange={(e) => handleChange("employeeId", e.target.value)}
                    placeholder="e.g. AD-01"
                    className={getInputClassName("employeeId", true)}
                  />
                  {renderFieldError("employeeId")}
                </div>
              </div>

              {/* Row 3: Date Of Birth, Blood Group, Company, Branches */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 sm:gap-5">
                <div>
                  <label className="text-[11px] font-medium text-slate-700 dark:text-slate-300 mb-1.5 block">
                    Date Of Birth <span className="text-red-500 font-bold">*</span>
                  </label>
                  <DatePicker
                    value={formData.dob}
                    onChange={(_, str) => handleChange("dob", str || "")}
                    placeholder="DD-MM-YYYY"
                    dateFormat="dd-MM-yyyy"
                    className="w-full"
                    buttonClassName={cn(
                      datePickerButtonClassName,
                      errors.dob && "border-rose-500 hover:border-rose-500 ring-1 ring-rose-500/30"
                    )}
                  />
                  {renderFieldError("dob")}
                </div>

                <div>
                  <label className="text-[11px] font-medium text-slate-700 dark:text-slate-300 mb-1.5 block">
                    Blood Group.
                  </label>
                  <ThemeSelectDropdown
                    value={formData.bloodGroup || "B+"}
                    onChange={(val) => handleChange("bloodGroup", val)}
                    options={bloodGroupOptions}
                    placeholder="Select Blood Group"
                    className="w-full"
                    buttonClassName={dropdownButtonClassName}
                    menuClassName={dropdownMenuClassName}
                  />
                </div>

                <div>
                  <label className="text-[11px] font-medium text-slate-700 dark:text-slate-300 mb-1.5 block">
                    Company.
                  </label>
                  <ThemeSelectDropdown
                    value={formData.company}
                    onChange={(val) => handleCompanyChange(val)}
                    options={companyOptions}
                    placeholder={
                      loadingCompanies
                        ? "Loading companies..."
                        : companyList.length === 0
                        ? "No companies available"
                        : "Select Company"
                    }
                    className="w-full"
                    buttonClassName={dropdownButtonClassName}
                    menuClassName={dropdownMenuClassName}
                  />
                </div>

                <div>
                  <label className="text-[11px] font-medium text-slate-700 dark:text-slate-300 mb-1.5 block">
                    Branches.
                  </label>
                  <ThemeSelectDropdown
                    value={formData.branch}
                    onChange={(val) => handleChange("branch", val)}
                    options={branchOptions}
                    placeholder={
                      loadingBranches || loadingCompanies
                        ? "Loading branches..."
                        : !formData.company
                        ? "Select Company first"
                        : branchOptions.length === 0
                        ? "No branch available"
                        : "Select Branch"
                    }
                    disabled={
                      loadingBranches ||
                      loadingCompanies ||
                      !formData.company ||
                      branchOptions.length === 0
                    }
                    className="w-full"
                    buttonClassName={dropdownButtonClassName}
                    menuClassName={dropdownMenuClassName}
                  />
                </div>
              </div>

              {/* Row 4: Department, Designation, Salary Type */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-5">
                <div>
                  <label className="text-[11px] font-medium text-slate-700 dark:text-slate-300 mb-1.5 block">
                    Department. <span className="text-red-500 font-bold">*</span>
                  </label>
                  <DropdownWithOther
                    hideLabel
                    label="Department"
                    required
                    value={formData.department || DEPARTMENTS[0]}
                    onChange={(val) => handleChange("department", val)}
                    options={departmentOptions}
                    placeholder="Select Department"
                    fieldKey="department"
                    className="w-full"
                    buttonClassName={cn(
                      dropdownButtonClassName,
                      errors.department && "border-rose-500 hover:border-rose-500 ring-1 ring-rose-500/30"
                    )}
                    menuClassName={dropdownMenuClassName}
                  />
                  {renderFieldError("department")}
                </div>

                <div>
                  <label className="text-[11px] font-medium text-slate-700 dark:text-slate-300 mb-1.5 block">
                    Designation. <span className="text-red-500 font-bold">*</span>
                  </label>
                  <DropdownWithOther
                    hideLabel
                    label="Designation"
                    required
                    value={formData.designation || DESIGNATIONS[0]}
                    onChange={(val) => handleChange("designation", val)}
                    options={designationOptions}
                    placeholder="Select Designation"
                    fieldKey="designation"
                    className="w-full"
                    buttonClassName={cn(
                      dropdownButtonClassName,
                      errors.designation && "border-rose-500 hover:border-rose-500 ring-1 ring-rose-500/30"
                    )}
                    menuClassName={dropdownMenuClassName}
                  />
                  {renderFieldError("designation")}
                </div>

                <div>
                  <label className="text-[11px] font-medium text-slate-700 dark:text-slate-300 mb-1.5 block">
                    Salary Type. <span className="text-red-500 font-bold">*</span>
                  </label>
                  <DropdownWithOther
                    hideLabel
                    label="Salary Type"
                    required
                    value={formData.salaryType || "Salaried"}
                    onChange={(val) => handleChange("salaryType", val)}
                    options={salaryTypeOptions}
                    placeholder="Select Salary Type"
                    fieldKey="salarytype"
                    className="w-full"
                    buttonClassName={cn(
                      dropdownButtonClassName,
                      errors.salaryType && "border-rose-500 hover:border-rose-500 ring-1 ring-rose-500/30"
                    )}
                    menuClassName={dropdownMenuClassName}
                  />
                  {renderFieldError("salaryType")}
                </div>
              </div>

              {/* Row 5: Joining Date, Worker Process, Basic Salary */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-5">
                <div>
                  <label className="text-[11px] font-medium text-slate-700 dark:text-slate-300 mb-1.5 block">
                    Joining Date.
                  </label>
                  <DatePicker
                    value={formData.joiningDate}
                    onChange={(_, str) => handleChange("joiningDate", str || "")}
                    placeholder="DD-MM-YYYY"
                    dateFormat="dd-MM-yyyy"
                    className="w-full"
                    buttonClassName={datePickerButtonClassName}
                  />
                </div>

                <div>
                  <label className="text-[11px] font-medium text-slate-700 dark:text-slate-300 mb-1.5 block">
                    Worker Process
                  </label>
                  <DropdownWithOther
                    hideLabel
                    label="Worker Process"
                    value={formData.workerProcess && formData.workerProcess !== "Select Process" ? formData.workerProcess : ""}
                    onChange={(val) => handleChange("workerProcess", val)}
                    options={workerProcessOptions}
                    placeholder="Select Process"
                    fieldKey="workerprocess"
                    className="w-full"
                    buttonClassName={dropdownButtonClassName}
                    menuClassName={dropdownMenuClassName}
                  />
                </div>

                <div>
                  <label className="text-[11px] font-medium text-slate-700 dark:text-slate-300 mb-1.5 block">
                    Basic Salary.
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs text-slate-400 dark:text-slate-500 font-medium font-sans">
                      ₹
                    </span>
                    <input
                      type="number"
                      min="0"
                      step="any"
                      value={formData.basicSalary ?? ""}
                      onChange={(e) => handleChange("basicSalary", e.target.value)}
                      placeholder="e.g. 50000"
                      className={cn(getInputClassName("basicSalary", true), "pl-7 font-mono")}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: BANK DETAIL */}
          {activeTab === "bank" && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              {/* Left Column: Bank Details Fields */}
              <div className="lg:col-span-8 space-y-4">
                <div className="mb-2">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">Bank Details</h3>
                </div>

                {/* Row 1: Bank Name, Account Holder Name */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-[11px] font-medium text-slate-700 dark:text-slate-300 mb-1.5 block">
                      Bank Name.
                    </label>
                    <input
                      type="text"
                      value={formData.bankName}
                      onChange={(e) => handleChange("bankName", e.target.value)}
                      placeholder=""
                      className={getInputClassName("bankName")}
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-medium text-slate-700 dark:text-slate-300 mb-1.5 block">
                      Account Holder Name.
                    </label>
                    <input
                      type="text"
                      value={formData.accountHolderName}
                      onChange={(e) => handleChange("accountHolderName", e.target.value)}
                      placeholder=""
                      className={getInputClassName("accountHolderName")}
                    />
                  </div>
                </div>

                {/* Row 2: Account Number, IFSC Code */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-[11px] font-medium text-slate-700 dark:text-slate-300 mb-1.5 block">
                      Account Number.
                    </label>
                    <input
                      type="text"
                      value={formData.accountNumber}
                      onChange={(e) => handleChange("accountNumber", e.target.value)}
                      placeholder=""
                      className={getInputClassName("accountNumber", true)}
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-medium text-slate-700 dark:text-slate-300 mb-1.5 block">
                      IFSC Code.
                    </label>
                    <input
                      type="text"
                      maxLength={11}
                      value={formData.ifscCode}
                      onChange={(e) =>
                        handleChange("ifscCode", e.target.value.toUpperCase())
                      }
                      placeholder=""
                      className={getInputClassName("ifscCode", true)}
                    />
                    {renderFieldError("ifscCode")}
                  </div>
                </div>

                {/* Row 3: Account Type, Branch Name */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-[11px] font-medium text-slate-700 dark:text-slate-300 mb-1.5 block">
                      Account Type.
                    </label>
                    <ThemeSelectDropdown
                      value={formData.accountType || "Savings"}
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
                      Branch Name.
                    </label>
                    <input
                      type="text"
                      value={formData.branchName}
                      onChange={(e) => handleChange("branchName", e.target.value)}
                      placeholder=""
                      className={getInputClassName("branchName")}
                    />
                  </div>
                </div>
              </div>

              {/* Right Column: Bank Document Upload Box */}
              <div className="lg:col-span-4 space-y-2">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">Bank Document</h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Upload bank passbook & cancelled cheque.
                  </p>
                </div>

                <div
                  onClick={() => !uploadingField && bankDocInputRef.current?.click()}
                  className={`w-48 h-48 rounded-2xl bg-slate-50 border border-dashed border-[#E7E0D2] hover:border-[#E8C16D] dark:bg-[#161B24] dark:border-white/[0.15] dark:hover:border-white/40 flex flex-col items-center justify-center cursor-pointer transition-all relative overflow-hidden group shadow-inner ${
                    uploadingField === "bankDocUrl" ? "opacity-60 pointer-events-none" : ""
                  }`}
                >
                  <input
                    ref={bankDocInputRef}
                    type="file"
                    accept="image/*,.pdf"
                    className="hidden"
                    onChange={(e) => {
                      if (e.target.files?.[0]) {
                        handleSingleFileUpload(e.target.files[0], "bankDocUrl");
                      }
                    }}
                  />

                  {uploadingField === "bankDocUrl" ? (
                    <div className="flex flex-col items-center justify-center text-amber-500">
                      <Loader2 size={24} className="animate-spin mb-1.5" />
                      <span className="text-xs font-medium">Uploading to storage...</span>
                    </div>
                  ) : formData.bankDocUrl ? (
                    <div className="w-full h-full p-2 relative flex items-center justify-center">
                      {formData.bankDocUrl.startsWith("data:image/") ||
                      formData.bankDocUrl.startsWith("http") ||
                      formData.bankDocUrl.startsWith("/uploads/") ? (
                        <img
                          src={getMediaUrl(formData.bankDocUrl)}
                          alt="Bank Document"
                          className="w-full h-full object-cover rounded-xl"
                        />
                      ) : (
                        <div className="text-center p-2">
                          <FileText size={32} className="text-slate-700 dark:text-slate-300 mx-auto mb-1" />
                          <span className="text-[10px] text-slate-700 dark:text-slate-300 break-all">
                            Document Attached
                          </span>
                        </div>
                      )}
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity rounded-2xl">
                        <span className="text-xs text-white font-medium">
                          Click to change
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center text-slate-500 group-hover:text-slate-700 dark:text-slate-300 transition-colors">
                      <Upload size={22} className="mb-1 text-slate-400" />
                      <span className="text-xs text-slate-400">Upload</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: PHOTO */}
          {activeTab === "photo" && (
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">Employee Photo</h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Upload employee image here.
                </p>
              </div>

              {/* Photo Upload Box */}
              <div
                onClick={() => !uploadingField && photoInputRef.current?.click()}
                className={`w-48 h-48 rounded-2xl bg-slate-50 border border-dashed border-[#E7E0D2] hover:border-[#E8C16D] dark:bg-[#161B24] dark:border-white/[0.15] dark:hover:border-white/40 flex flex-col items-center justify-center cursor-pointer transition-all relative overflow-hidden group shadow-inner ${
                  uploadingField === "photoUrl" ? "opacity-60 pointer-events-none" : ""
                }`}
              >
                <input
                  ref={photoInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files?.[0]) {
                      handleSingleFileUpload(e.target.files[0], "photoUrl");
                    }
                  }}
                />

                {uploadingField === "photoUrl" ? (
                  <div className="flex flex-col items-center justify-center text-amber-500">
                    <Loader2 size={24} className="animate-spin mb-1.5" />
                    <span className="text-xs font-medium">Uploading to storage...</span>
                  </div>
                ) : formData.photoUrl ? (
                  <div className="w-full h-full relative">
                    <img
                      src={getMediaUrl(formData.photoUrl)}
                      alt="Employee"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                      <span className="text-xs text-white font-medium">
                        Click to change
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center text-slate-500 group-hover:text-slate-700 dark:text-slate-300 transition-colors">
                    <Upload size={22} className="mb-1 text-slate-400" />
                    <span className="text-xs text-slate-400">Upload</span>
                  </div>
                )}
              </div>

              {/* Print I-Card Button */}
              <div>
                <button
                  type="button"
                  onClick={() => setIsPrintModalOpen(true)}
                  className="inline-flex items-center gap-2 h-10 px-6 rounded-full bg-[#F5C451] hover:bg-[#e8b83e] active:scale-[0.98] text-slate-900 font-bold text-xs sm:text-sm transition-all cursor-pointer shadow-md"
                >
                  <Printer size={16} className="stroke-[2.5]" />
                  <span>Print I-Card</span>
                </button>
              </div>
            </div>
          )}

          {/* TAB 4: DOCUMENTS (Multi-Document Upload: Attach box stays first, documents shift next to it) */}
          {activeTab === "documents" && (
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Employee Documents
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Upload identity document proof here (e.g. Bank Passbook, Aadhaar Card, PAN Card, etc.).
                </p>
              </div>

              {/* Horizontal Row: [ Attach Section / Upload Box ] [ Doc 2 ] [ Doc 1 (Meesho) ] ... */}
              <div className="flex flex-wrap items-start gap-4 pt-1">
                {/* 1. ATTACH / UPLOAD BOX (Always visible on left!) */}
                <div
                  onClick={() => !uploadingDoc && identityDocInputRef.current?.click()}
                  className={`w-48 h-48 rounded-2xl bg-slate-50 border border-dashed border-[#E7E0D2] hover:border-[#E8C16D] dark:bg-[#161B24] dark:border-white/[0.15] dark:hover:border-white/40 flex flex-col items-center justify-center cursor-pointer transition-all relative overflow-hidden group shadow-inner shrink-0 ${
                    uploadingDoc ? "opacity-60 pointer-events-none" : ""
                  }`}
                >
                  <input
                    ref={identityDocInputRef}
                    type="file"
                    accept="image/*,.pdf"
                    multiple
                    className="hidden"
                    onChange={async (e) => {
                      if (e.target.files && e.target.files.length > 0) {
                        const files = Array.from(e.target.files);
                        for (const file of files) {
                          await handleAddDocument(file);
                        }
                      }
                    }}
                  />

                  {uploadingDoc ? (
                    <div className="flex flex-col items-center justify-center text-amber-500">
                      <Loader2 size={24} className="animate-spin mb-1.5" />
                      <span className="text-xs font-medium">Uploading to storage...</span>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center text-slate-500 group-hover:text-slate-800 dark:group-hover:text-white transition-colors">
                      <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-white/[0.06] flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                        <Upload size={20} className="text-slate-500 dark:text-slate-300" />
                      </div>
                      <span className="text-xs font-bold text-slate-700 dark:text-slate-200">
                        Upload
                      </span>
                      <span className="text-[10px] text-slate-400 mt-0.5">
                        PNG, JPG, PDF up to 20MB
                      </span>
                    </div>
                  )}
                </div>

                {/* 2. UPLOADED DOCUMENT CARDS (Shifted next to the attach section) */}
                {(formData.documents || []).map((doc, idx) => {
                  const isPdf =
                    doc.url.toLowerCase().endsWith(".pdf") ||
                    doc.fileName?.toLowerCase().endsWith(".pdf");

                  return (
                    <div
                      key={doc.id || idx}
                      className="w-48 h-48 rounded-2xl border border-[#E7E0D2] dark:border-white/[0.12] bg-white dark:bg-[#161B24] overflow-hidden group shadow-sm flex flex-col relative transition-all hover:shadow-md hover:border-[#E8C16D] shrink-0"
                    >
                      {/* Top Bar with Type Badge & Action Icons */}
                      <div className="absolute top-2 left-2 right-2 z-10 flex items-center justify-between pointer-events-none">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-black/65 backdrop-blur-xs text-white border border-white/10 shadow-xs pointer-events-auto truncate max-w-[100px]">
                          {doc.type || "Document"}
                        </span>

                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-auto">
                          <button
                            type="button"
                            onClick={() => setPreviewDoc(doc)}
                            className="p-1 rounded-lg bg-black/65 hover:bg-black/90 text-white backdrop-blur-xs transition-colors cursor-pointer"
                            title="View Full Preview"
                          >
                            <Eye size={13} />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleRemoveDocument(doc.id)}
                            className="p-1 rounded-lg bg-red-600/80 hover:bg-red-600 text-white backdrop-blur-xs transition-colors cursor-pointer"
                            title="Remove Document"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>

                      {/* Card Middle: Preview Area */}
                      <div
                        onClick={() => setPreviewDoc(doc)}
                        className="w-full flex-1 flex items-center justify-center bg-slate-50/80 dark:bg-[#121620] cursor-pointer overflow-hidden p-2"
                      >
                        {!isPdf ? (
                          <img
                            src={getMediaUrl(doc.url)}
                            alt={doc.name}
                            className="w-full h-full object-contain rounded-xl transition-transform duration-300 group-hover:scale-105"
                          />
                        ) : (
                          <div className="flex flex-col items-center justify-center p-2 text-center">
                            <FileText size={38} className="text-amber-500 mb-1" />
                            <span className="text-[11px] font-medium text-slate-700 dark:text-slate-300 truncate max-w-[150px]">
                              {doc.fileName || doc.name}
                            </span>
                            <span className="text-[10px] text-slate-400">PDF Document</span>
                          </div>
                        )}
                      </div>

                      {/* Card Bottom: Document Title */}
                      <div className="p-2 border-t border-slate-100 dark:border-white/[0.08] bg-white dark:bg-[#161B24] flex items-center justify-between gap-1">
                        <input
                          type="text"
                          value={doc.name}
                          onChange={(e) =>
                            handleUpdateDocument(doc.id, { name: e.target.value })
                          }
                          title="Click to rename document"
                          className="w-full text-[11px] font-semibold text-slate-800 dark:text-white bg-transparent border-0 border-b border-transparent hover:border-slate-300 dark:hover:border-white/20 focus:border-[#E8C16D] outline-none px-1 py-0.5 truncate transition-all"
                          placeholder="Document Name"
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Bottom Fixed Action Bar matching Edit Ledger */}
        <div className="p-4 sm:p-5 border-t border-[#E7E0D2] bg-slate-50 dark:border-white/[0.08] dark:bg-[#0E121A] w-full mt-auto">
          <div className="w-full flex items-center justify-between">
            {/* Left: Completion Percentage bar matching Edit Ledger */}
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

            {/* Right: Save Button matching Edit Ledger */}
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#F5C451] hover:bg-[#e8b83e] text-slate-900 font-bold text-xs sm:text-sm shadow-md transition-all cursor-pointer active:scale-95 disabled:opacity-50"
            >
              {saving ? (
                <Loader2 size={16} className="animate-spin text-slate-900" />
              ) : (
                <Save size={16} className="text-slate-900" />
              )}
              <span>{saving ? "Saving..." : "Save"}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Document Full Preview Lightbox Modal */}
      {previewDoc && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in duration-200"
          onClick={() => setPreviewDoc(null)}
        >
          <div
            className="relative max-w-3xl w-full max-h-[90vh] bg-white dark:bg-[#121622] rounded-2xl shadow-2xl border border-slate-200 dark:border-white/10 flex flex-col overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="px-5 py-3.5 border-b border-slate-100 dark:border-white/[0.08] flex items-center justify-between bg-slate-50 dark:bg-[#161B24]">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  {previewDoc.name}
                </h3>
                <span className="text-xs text-slate-400">
                  {previewDoc.type || "Document"} • {previewDoc.fileName || "File"}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <a
                  href={getMediaUrl(previewDoc.url)}
                  target="_blank"
                  rel="noreferrer"
                  download
                  className="p-1.5 rounded-lg hover:bg-slate-200 text-slate-600 dark:text-slate-300 dark:hover:bg-white/10 transition-colors cursor-pointer"
                  title="Open in new window / Download"
                >
                  <Download size={16} />
                </a>
                <button
                  type="button"
                  onClick={() => setPreviewDoc(null)}
                  className="p-1.5 rounded-lg hover:bg-slate-200 text-slate-600 dark:text-slate-300 dark:hover:bg-white/10 transition-colors cursor-pointer"
                  title="Close"
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-auto p-4 flex items-center justify-center bg-slate-100/50 dark:bg-black/40 min-h-[300px]">
              {previewDoc.url.toLowerCase().endsWith(".pdf") ||
              previewDoc.fileName?.toLowerCase().endsWith(".pdf") ? (
                <iframe
                  src={getMediaUrl(previewDoc.url)}
                  className="w-full h-[600px] rounded-xl border border-slate-200 dark:border-white/10"
                  title={previewDoc.name}
                />
              ) : (
                <img
                  src={getMediaUrl(previewDoc.url)}
                  alt={previewDoc.name}
                  className="max-w-full max-h-[70vh] object-contain rounded-xl shadow-md"
                />
              )}
            </div>
          </div>
        </div>
      )}

      {/* Print ID Card Modal */}
      <PrintIdCardModal
        employee={
          initialData || ({
            ...formData,
            id: "temp",
            userId: "temp",
            fullName: displayedFullName,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          } as any)
        }
        isOpen={isPrintModalOpen}
        onClose={() => setIsPrintModalOpen(false)}
      />
    </DashboardLayout>
  );
}
