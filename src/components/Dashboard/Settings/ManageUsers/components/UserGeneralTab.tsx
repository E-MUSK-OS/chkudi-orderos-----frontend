"use client";

import React, { useState, useRef, useEffect } from "react";
import DepartmentSelect from "./DepartmentSelect";
import DropdownWithOther from "./DropdownWithOther";
import { type UserFormValues } from "../types/userManagement.types";
import { ChevronDown, Calendar as CalendarIcon, Check, Building2, Eye, EyeOff, Plus } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format, parseISO, isValid } from "date-fns";
import ThemeSelectDropdown from "@/components/ui/ThemeSelectDropdown";
import { useUserDropdownOptions, useSaveUserDropdownOption } from "../hooks/useManageUsers";
import { toast } from "sonner";
import { useDropdownManagementMode } from "@/components/Dashboard/Settings/Configuration/hooks/useDropdownManagementMode";
import { buildMergedOptions } from "@/utils/dropdownOptions.utils";

interface Props {
  values: UserFormValues;
  onChange: (field: keyof UserFormValues, val: any) => void;
  errors: Partial<Record<keyof UserFormValues, string>>;
  mode: "create" | "edit";
}

const ROLE_OPTIONS = [
  { value: "USER", label: "USER (Standard User)" },
  { value: "ADMIN", label: "ADMIN (Account Manager)" },
];

export default function UserGeneralTab({ values, onChange, errors, mode }: Props) {
  const [isDatePopoverOpen, setIsDatePopoverOpen] = useState(false);
  const [dobInput, setDobInput] = useState(values.dob || "");
  const [companyDropdownOpen, setCompanyDropdownOpen] = useState(false);
  const [isOtherCompanyActive, setIsOtherCompanyActive] = useState(false);
  const [customCompany, setCustomCompany] = useState("");
  const [localCustomCompanies, setLocalCustomCompanies] = useState<string[]>([]);
  const [showPassword, setShowPassword] = useState(false);
  const [passwordReadOnly, setPasswordReadOnly] = useState(true);

  const companyRef = useRef<HTMLDivElement>(null);
  const customCompanyInputRef = useRef<HTMLInputElement>(null);

  const { data: dropdownData } = useUserDropdownOptions();
  const saveOptionMutation = useSaveUserDropdownOption();
  const { isSettingMastersOnly } = useDropdownManagementMode();

  // Sync external dob changes to local input state
  useEffect(() => {
    setDobInput(values.dob || "");
  }, [values.dob]);

  useEffect(() => {
    const handleOutside = (e: MouseEvent) => {
      if (companyRef.current && !companyRef.current.contains(e.target as Node)) {
        setCompanyDropdownOpen(false);
      }
    };
    if (companyDropdownOpen) document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, [companyDropdownOpen]);

  // Synchronize when dropdown options are updated externally
  useEffect(() => {
    const handleSync = () => {
      setLocalCustomCompanies([]);
    };
    window.addEventListener("dropdown_options_updated", handleSync);
    return () => window.removeEventListener("dropdown_options_updated", handleSync);
  }, []);

  // Merge DB-saved companies and locally created companies
  const allCompanies = React.useMemo(() => {
    const disabledCompanies = new Set<string>();
    (dropdownData?.savedOptions || [])
      .filter((o: any) => o.field?.toLowerCase() === "company" && (o.isActive === false || o.label === "__DELETED__"))
      .forEach((o: any) => {
        if (o.value) disabledCompanies.add(String(o.value).trim().toLowerCase());
        if (o.label && o.label !== "__DELETED__") disabledCompanies.add(String(o.label).trim().toLowerCase());
      });

    const set = new Set<string>();
    (dropdownData?.companies || []).forEach((c) => {
      if (!disabledCompanies.has(c.trim().toLowerCase())) set.add(c);
    });
    (dropdownData?.savedOptions || [])
      .filter((o: any) => o.field?.toLowerCase() === "company" && o.isActive !== false && o.label !== "__DELETED__")
      .forEach((o: any) => {
        const val = (o.label || o.value || "").trim();
        if (val && !disabledCompanies.has(val.toLowerCase())) set.add(val);
      });
    localCustomCompanies.forEach((c) => {
      if (!disabledCompanies.has(c.trim().toLowerCase())) set.add(c);
    });
    (values.companies || []).forEach((c) => set.add(c));
    return Array.from(set);
  }, [dropdownData, localCustomCompanies, values.companies]);

  // Merge gender options dynamically from Setting Masters
  const allGenderOptions = React.useMemo(() => {
    return buildMergedOptions(
      "gender",
      [],
      dropdownData?.savedOptions,
      [...(dropdownData?.genders || []), ...(values.gender ? [values.gender] : [])]
    );
  }, [dropdownData, values.gender]);

  const toggleCompany = (company: string) => {
    const current = values.companies || [];
    if (current.includes(company)) {
      onChange("companies", current.filter((c) => c !== company));
    } else {
      onChange("companies", [...current, company]);
    }
  };

  const handleAddCustomCompany = () => {
    const trimmed = customCompany.trim();
    if (!trimmed) return;

    const current = values.companies || [];
    if (!current.includes(trimmed)) {
      onChange("companies", [...current, trimmed]);
    }
    setLocalCustomCompanies((prev) => [...prev, trimmed]);
    toast.success(`Added "${trimmed}" to Companies`);

    // Persist to database
    saveOptionMutation.mutate({
      field: "company",
      value: trimmed,
      label: trimmed,
    });

    setCustomCompany("");
    setIsOtherCompanyActive(false);
  };

  // DOB manual typing handlers
  const handleDobChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const typed = e.target.value;
    setDobInput(typed);
    onChange("dob", typed);
  };

  const handleDobBlur = () => {
    const trimmed = dobInput.trim();
    if (!trimmed) {
      onChange("dob", "");
      return;
    }

    // Try format YYYY-MM-DD
    if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
      const parsed = parseISO(trimmed);
      if (isValid(parsed)) {
        const formatted = format(parsed, "yyyy-MM-dd");
        setDobInput(formatted);
        onChange("dob", formatted);
        return;
      }
    }

    // Try format DD-MM-YYYY or DD/MM/YYYY
    const dmyMatch = trimmed.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})$/);
    if (dmyMatch) {
      const day = dmyMatch[1].padStart(2, "0");
      const month = dmyMatch[2].padStart(2, "0");
      const year = dmyMatch[3];
      const isoCandidate = `${year}-${month}-${day}`;
      const parsed = parseISO(isoCandidate);
      if (isValid(parsed)) {
        const formatted = format(parsed, "yyyy-MM-dd");
        setDobInput(formatted);
        onChange("dob", formatted);
        return;
      }
    }

    // Fallback: try standard Date parsing
    const fallback = new Date(trimmed);
    if (isValid(fallback) && !isNaN(fallback.getTime())) {
      const formatted = format(fallback, "yyyy-MM-dd");
      setDobInput(formatted);
      onChange("dob", formatted);
    }
  };

  const parsedSelectedDate = React.useMemo(() => {
    if (!values.dob) return undefined;
    try {
      const p = parseISO(values.dob);
      return isValid(p) ? p : undefined;
    } catch {
      return undefined;
    }
  }, [values.dob]);

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* 1. User Details Section */}
      <div>
        <div className="flex items-center justify-between pb-3.5 mb-5 border-b border-[#E7E0D2] dark:border-white/[0.08]">
          <div>
            <h3 className="text-sm sm:text-base font-extrabold text-[#0A0E1A] dark:text-white">
              User Details.
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Enter basic user details
            </p>
          </div>

          {/* Active Switch */}
          <div className="flex items-center gap-3">
            <span className="text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-300">
              Active
            </span>
            <button
              type="button"
              role="switch"
              aria-checked={values.isActive}
              onClick={() => onChange("isActive", !values.isActive)}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                values.isActive ? "bg-emerald-500" : "bg-slate-300 dark:bg-slate-700"
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                  values.isActive ? "translate-x-5" : "translate-x-0"
                }`}
              />
            </button>
          </div>
        </div>

        {/* Row 1: First Name, Middle Name, Last Name */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              First Name. <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={values.firstName}
              onChange={(e) => onChange("firstName", e.target.value)}
              placeholder="Enter First Name"
              className={`w-full h-11 px-3.5 rounded-2xl text-xs sm:text-sm bg-white dark:bg-[#080B11] border text-[#0A0E1A] dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#E8C16D]/30 transition-all shadow-xs ${
                errors.firstName
                  ? "border-red-500 focus:border-red-500"
                  : "border-slate-200 dark:border-white/[0.08] focus:border-[#E8C16D]"
              }`}
            />
            {errors.firstName && <p className="mt-1 text-xs text-red-500 font-semibold">{errors.firstName}</p>}
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              Middle Name.
            </label>
            <input
              type="text"
              value={values.middleName || ""}
              onChange={(e) => onChange("middleName", e.target.value)}
              placeholder="Enter Middle Name"
              className="w-full h-11 px-3.5 rounded-2xl text-xs sm:text-sm bg-white dark:bg-[#080B11] border border-slate-200 dark:border-white/[0.08] text-[#0A0E1A] dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-[#E8C16D] focus:ring-2 focus:ring-[#E8C16D]/30 transition-all shadow-xs"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              Last Name. <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={values.lastName}
              onChange={(e) => onChange("lastName", e.target.value)}
              placeholder="Enter Last Name"
              className={`w-full h-11 px-3.5 rounded-2xl text-xs sm:text-sm bg-white dark:bg-[#080B11] border text-[#0A0E1A] dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#E8C16D]/30 transition-all shadow-xs ${
                errors.lastName
                  ? "border-red-500 focus:border-red-500"
                  : "border-slate-200 dark:border-white/[0.08] focus:border-[#E8C16D]"
              }`}
            />
            {errors.lastName && <p className="mt-1 text-xs text-red-500 font-semibold">{errors.lastName}</p>}
          </div>
        </div>

        {/* Row 2: Date of Birth (Manual Typing + Picker), Gender (DropdownWithOther) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
          {/* Dual Input DOB: Manual writing + Calendar Picker */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              Date of Birth
            </label>
            <div className="relative">
              <input
                type="text"
                value={dobInput}
                onChange={handleDobChange}
                onBlur={handleDobBlur}
                placeholder="YYYY-MM-DD (e.g. 1995-12-25)"
                className="w-full h-11 pl-3.5 pr-11 rounded-2xl text-xs sm:text-sm bg-white dark:bg-[#080B11] border border-slate-200 dark:border-white/[0.08] text-[#0A0E1A] dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-[#E8C16D] focus:ring-2 focus:ring-[#E8C16D]/30 transition-all shadow-xs"
              />

              {/* Calendar Picker Popover Icon */}
              <Popover open={isDatePopoverOpen} onOpenChange={setIsDatePopoverOpen}>
                <PopoverTrigger
                  type="button"
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1.5 rounded-xl text-[#B88728] dark:text-[#E8C16D] hover:bg-[#FFF9EC] dark:hover:bg-white/[0.06] transition-colors cursor-pointer"
                  title="Open calendar picker"
                >
                  <CalendarIcon size={16} />
                </PopoverTrigger>
                <PopoverContent
                  className="w-auto p-0 bg-white dark:bg-[#0F1626] border border-[#E7E0D2] dark:border-white/[0.08] shadow-xl rounded-2xl z-50"
                  align="end"
                >
                  <Calendar
                    mode="single"
                    selected={parsedSelectedDate}
                    onSelect={(date) => {
                      if (date) {
                        const formatted = format(date, "yyyy-MM-dd");
                        setDobInput(formatted);
                        onChange("dob", formatted);
                        setIsDatePopoverOpen(false);
                      }
                    }}
                    captionLayout="dropdown"
                  />
                </PopoverContent>
              </Popover>
            </div>
            <p className="mt-1 text-[11px] text-slate-400 dark:text-slate-500">
              Type date directly (YYYY-MM-DD) or click calendar to select
            </p>
          </div>

          {/* Gender: DropdownWithOther allowing "Other" custom option with DB persistence */}
          <div>
            <DropdownWithOther
              label="Gender."
              value={values.gender || ""}
              options={allGenderOptions}
              onChange={(val) => onChange("gender", val)}
              placeholder="Select Gender"
              fieldKey="gender"
              allowOther={true}
            />
          </div>
        </div>
      </div>

      {/* 2. Contact Details Section */}
      <div>
        <div className="pb-3.5 mb-5 border-b border-[#E7E0D2] dark:border-white/[0.08]">
          <h3 className="text-sm sm:text-base font-extrabold text-[#0A0E1A] dark:text-white">
            Contact Details.
          </h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              Email. ( User Name ) <span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              value={values.email}
              onChange={(e) => onChange("email", e.target.value)}
              placeholder="user@example.com"
              className={`w-full h-11 px-3.5 rounded-2xl text-xs sm:text-sm bg-white dark:bg-[#080B11] border text-[#0A0E1A] dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#E8C16D]/30 transition-all shadow-xs ${
                errors.email
                  ? "border-red-500 focus:border-red-500"
                  : "border-slate-200 dark:border-white/[0.08] focus:border-[#E8C16D]"
              }`}
            />
            {errors.email && <p className="mt-1 text-xs text-red-500 font-semibold">{errors.email}</p>}
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              Mobile No. <span className="text-red-500">*</span>
            </label>
            <input
              type="tel"
              value={values.phone}
              onChange={(e) => {
                const cleaned = e.target.value.replace(/\D/g, "").slice(0, 10);
                onChange("phone", cleaned);
              }}
              placeholder="10-digit mobile"
              className={`w-full h-11 px-3.5 rounded-2xl text-xs sm:text-sm bg-white dark:bg-[#080B11] border text-[#0A0E1A] dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#E8C16D]/30 transition-all shadow-xs ${
                errors.phone
                  ? "border-red-500 focus:border-red-500"
                  : "border-slate-200 dark:border-white/[0.08] focus:border-[#E8C16D]"
              }`}
            />
            {errors.phone && <p className="mt-1 text-xs text-red-500 font-semibold">{errors.phone}</p>}
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                Password. {mode === "create" && <span className="text-red-500">*</span>}
              </label>
              <span className="text-[11px] text-slate-400 dark:text-slate-500 font-medium">
                (Min 8 characters)
              </span>
            </div>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                name="new_user_custom_password"
                id="new_user_custom_password"
                autoComplete="one-time-code"
                autoCorrect="off"
                autoCapitalize="off"
                spellCheck={false}
                data-lpignore="true"
                data-1p-ignore="true"
                data-form-type="other"
                readOnly={passwordReadOnly}
                onFocus={() => setPasswordReadOnly(false)}
                onClick={() => setPasswordReadOnly(false)}
                value={values.password || ""}
                onChange={(e) => onChange("password", e.target.value)}
                placeholder={mode === "edit" ? "Leave blank to keep current" : "Enter custom password (min 8 chars)"}
                className={`w-full h-11 pl-3.5 pr-11 rounded-2xl text-xs sm:text-sm bg-white dark:bg-[#080B11] border text-[#0A0E1A] dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#E8C16D]/30 transition-all shadow-xs [&:-webkit-autofill]:shadow-[0_0_0_1000px_white_inset] dark:[&:-webkit-autofill]:shadow-[0_0_0_1000px_#080B11_inset] [&:-webkit-autofill]:[-webkit-text-fill-color:inherit] ${
                  errors.password
                    ? "border-red-500 focus:border-red-500"
                    : "border-slate-200 dark:border-white/[0.08] focus:border-[#E8C16D]"
                }`}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                tabIndex={-1}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-[#0A0E1A] dark:hover:text-white transition-colors p-1 cursor-pointer"
                title={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {errors.password && <p className="mt-1 text-xs text-red-500 font-semibold">{errors.password}</p>}
          </div>
        </div>
      </div>

      {/* 3. User Access Section */}
      <div>
        <div className="pb-3.5 mb-5 border-b border-[#E7E0D2] dark:border-white/[0.08]">
          <h3 className="text-sm sm:text-base font-extrabold text-[#0A0E1A] dark:text-white">
            User Access.
          </h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Department Select (With "+ Add Other Department" option & DB persistence) */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              User Department <span className="text-red-500">*</span>
            </label>
            <DepartmentSelect
              value={values.departments}
              onChange={(depts) => onChange("departments", depts)}
              error={errors.departments}
            />
          </div>

          {/* User Companies Theme Multi-Select Dropdown (With "+ Add Other Company" option & DB persistence) */}
          <div ref={companyRef}>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              User Companies <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <button
                type="button"
                onClick={() => setCompanyDropdownOpen((prev) => !prev)}
                className={`w-full min-h-[46px] px-3.5 py-2.5 rounded-2xl border text-left text-xs sm:text-sm font-semibold flex items-center justify-between transition-all bg-white dark:bg-[#080B11] text-[#0A0E1A] dark:text-white cursor-pointer shadow-xs ${
                  errors.companies
                    ? "border-red-500"
                    : companyDropdownOpen
                    ? "border-[#E8C16D] ring-2 ring-[#E8C16D]/30 dark:border-[#F5C451] dark:ring-[#F5C451]/30"
                    : "border-slate-200 dark:border-white/[0.08] hover:border-[#E8C16D] focus:border-[#E8C16D]"
                }`}
              >
                <div className="flex items-center gap-2 truncate">
                  <div className="grid h-5 w-5 place-items-center rounded-md bg-[#FFF9EC] text-[#B88728] dark:bg-[#1A160E] dark:text-[#E8C16D] shrink-0 border border-[#E8C16D]/30">
                    <Building2 className="h-3 w-3" />
                  </div>
                  <span className={values.companies.length === 0 ? "text-slate-400 dark:text-slate-500 font-normal" : "font-semibold truncate"}>
                    {values.companies.length === 0
                      ? "Select Companies"
                      : values.companies.join(", ")}
                  </span>
                </div>
                <ChevronDown size={14} className={`text-[#B88728] dark:text-[#E8C16D] transition-transform duration-200 ${companyDropdownOpen ? "rotate-180" : ""}`} />
              </button>

              {companyDropdownOpen && (
                <div className="absolute z-50 left-0 top-[calc(100%+8px)] w-full rounded-2xl border border-[#E7E0D2] dark:border-white/[0.08] bg-white dark:bg-[#0F1626] shadow-xl p-1.5 animate-in fade-in zoom-in-95 duration-100">
                  <div className="max-h-56 overflow-y-auto flex flex-col gap-0.5">
                    {allCompanies.length === 0 ? (
                      <div className="py-2.5 px-3 text-center text-xs text-slate-400 dark:text-slate-500 font-medium">
                        No companies yet. Click &quot;Other&quot; below to add one.
                      </div>
                    ) : (
                      allCompanies.map((c) => {
                      const checked = values.companies.includes(c);
                      return (
                        <button
                          key={c}
                          type="button"
                          onClick={() => toggleCompany(c)}
                          className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer text-left ${
                            checked
                              ? "bg-[#0A0E1A] text-[#E8C16D] dark:bg-[#F5C451] dark:text-black shadow-xs"
                              : "text-slate-700 hover:bg-[#FFF9EC] hover:text-[#B88728] dark:text-slate-300 dark:hover:bg-white/10 dark:hover:text-white"
                          }`}
                        >
                          <span className="truncate">{c}</span>
                          {checked && <Check className="h-3.5 w-3.5 text-[#E8C16D] dark:text-black shrink-0 stroke-[2.5]" />}
                        </button>
                      );
                    }))}
                  </div>

                  {/* "Other" Option button / Inline Adder for Company */}
                  {!isSettingMastersOnly && (
                    <div className="pt-2 mt-1 border-t border-slate-100 dark:border-white/[0.06]">
                    {!isOtherCompanyActive ? (
                      <button
                        type="button"
                        onClick={() => {
                          setIsOtherCompanyActive(true);
                          setTimeout(() => customCompanyInputRef.current?.focus(), 50);
                        }}
                        className="w-full px-3 py-2 flex items-center gap-2 text-xs font-bold text-[#B88728] hover:bg-[#FFF9EC] dark:text-[#E8C16D] dark:hover:bg-[#E8C16D]/10 rounded-xl transition-colors text-left cursor-pointer"
                      >
                        <Plus size={14} />
                        <span>Other (Add New Company)</span>
                      </button>
                    ) : (
                      <div className="p-1.5 rounded-xl border border-[#E8C16D] dark:border-[#F5C451]/40 bg-[#FFFDF9] dark:bg-[#131B2E] space-y-1.5">
                        <input
                          ref={customCompanyInputRef}
                          type="text"
                          value={customCompany}
                          onChange={(e) => setCustomCompany(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault();
                              handleAddCustomCompany();
                            }
                          }}
                          placeholder="Enter other company..."
                          className="w-full h-8 px-2.5 text-xs font-medium rounded-lg border border-slate-200 bg-white text-[#0A0E1A] placeholder:text-slate-400 outline-none focus:border-[#E8C16D] dark:border-white/[0.1] dark:bg-[#080B11] dark:text-white"
                        />
                        <div className="flex items-center gap-1.5 justify-end">
                          <button
                            type="button"
                            onClick={() => setIsOtherCompanyActive(false)}
                            className="h-7 px-2.5 text-[11px] font-semibold text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white rounded-lg cursor-pointer"
                          >
                            Cancel
                          </button>
                          <button
                            type="button"
                            onClick={handleAddCustomCompany}
                            disabled={!customCompany.trim() || saveOptionMutation.isPending}
                            className="h-7 px-3 rounded-lg bg-[#0A0E1A] hover:bg-slate-900 text-[#E8C16D] dark:bg-[#F5C451] dark:text-black text-[11px] font-bold transition-all disabled:opacity-50 cursor-pointer shadow-xs"
                          >
                            {saveOptionMutation.isPending ? "Saving..." : "Add"}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                  )}
                </div>
              )}
            </div>
            {errors.companies && <p className="mt-1 text-xs text-red-500 font-semibold">{errors.companies}</p>}
          </div>

          {/* Role with ThemeSelectDropdown */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              Role
            </label>
            <ThemeSelectDropdown
              className="w-full"
              buttonClassName="w-full min-h-[46px] h-[46px] justify-between font-semibold"
              menuClassName="w-full max-w-none"
              value={values.role}
              onChange={(val) => onChange("role", val as any)}
              options={ROLE_OPTIONS}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
