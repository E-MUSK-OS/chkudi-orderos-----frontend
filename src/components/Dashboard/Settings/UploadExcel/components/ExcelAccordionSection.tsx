"use client";

import React, { useState, useRef } from "react";
import {
  ChevronDown,
  ChevronUp,
  Download,
  Upload,
  Check,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import ThemeSelectDropdown, { ThemeSelectOption } from "@/components/ui/ThemeSelectDropdown";
import ThemeMultiSelectFilter from "./ThemeMultiSelectFilter";
import { toast } from "sonner";
import {
  handleDownloadBlankTemplate,
  handleDownloadFilteredData,
  handleUploadFile,
} from "../services/uploadExcel.service";
import type { ProfileKey, SectionConfig } from "../constants/uploadExcel.constants";
import { useUploadExcelFilters } from "../hooks/useUploadExcelFilters";

interface ExcelAccordionSectionProps {
  profile: ProfileKey;
  section: SectionConfig;
  defaultOpen?: boolean;
}

export default function ExcelAccordionSection({
  profile,
  section,
  defaultOpen = false,
}: ExcelAccordionSectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const [activeDropdownKey, setActiveDropdownKey] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { getOptionsForFilterKey } = useUploadExcelFilters(profile);

  const availableFields = section.fields || [];
  const [selectedFields, setSelectedFields] = useState<string[]>(() => {
    return availableFields.length > 0 ? [availableFields[0]] : [];
  });

  const [filters, setFilters] = useState<Record<string, string | string[]>>({
    product: "All",
    material: "All",
    company: "All",
    category: "All",
    masterSku: "All",
    status: "All",
    state: "All",
    accountHead: "All",
    department: "All",
    employee: "All",
    month: "All",
  });

  const handleFilterChange = (key: string, value: string | string[]) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const handleToggleField = (field: string) => {
    setSelectedFields((prev) =>
      prev.includes(field) ? prev.filter((f) => f !== field) : [...prev, field]
    );
  };

  const isAllSelected =
    availableFields.length > 0 && selectedFields.length === availableFields.length;

  const handleSelectAll = () => {
    if (isAllSelected) {
      setSelectedFields([]);
    } else {
      setSelectedFields([...availableFields]);
    }
  };

  const handleBlankTemplateClick = async () => {
    try {
      setIsDownloading(true);
      await handleDownloadBlankTemplate(profile);
    } finally {
      setIsDownloading(false);
    }
  };

  const handleDownloadClick = async () => {
    if (availableFields.length > 0 && selectedFields.length === 0) {
      toast.warning("Please select at least one field to export.");
      return;
    }

    try {
      setIsDownloading(true);
      await handleDownloadFilteredData({
        profile,
        sectionId: section.id,
        selectedFields,
        filters,
      });
    } finally {
      setIsDownloading(false);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsUploading(true);
      const res = await handleUploadFile({
        profile,
        sectionId: section.id,
        file,
      });
      if (res.success) {
        toast.success(res.message);
      } else {
        toast.error(res.message || "Failed to process file.");
      }
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Failed to upload file.");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  return (
    <div className={cn(
        "rounded-2xl border border-[#E7E0D2] dark:border-white/[0.08] bg-white dark:bg-[#0F1626] shadow-xs mb-3.5 transition-all hover:border-[#E8C16D]/40 dark:hover:border-white/[0.14]",
        activeDropdownKey
          ? "relative z-50 overflow-visible"
          : isOpen
          ? "relative z-10 overflow-visible"
          : "relative z-0 overflow-hidden"
      )}>
      {/* Clean Accordion Header matching screenshots & OrderOS theme */}
      <div
        className="flex items-center justify-between px-5 sm:px-6 py-4 cursor-pointer select-none bg-white dark:bg-[#0F1626] hover:bg-slate-50/60 dark:hover:bg-white/[0.02] transition-colors"
        onClick={() => {
          setIsOpen((prev) => {
            if (prev) setActiveDropdownKey(null);
            return !prev;
          });
        }}
      >
        <span className="text-sm sm:text-base font-semibold text-[#0A0E1A] dark:text-slate-100 truncate">
          {section.title}
        </span>

        <div className="grid h-6 w-6 place-items-center text-slate-400 dark:text-slate-400 shrink-0 ml-2">
          {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </div>
      </div>

      {/* Accordion Body matching screenshots & OrderOS theme for Light and Dark mode */}
      {isOpen && (
        <div className="px-5 sm:px-6 pb-6 pt-1 space-y-5 animate-in fade-in duration-150">
          {section.isCreate ? (
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button
                type="button"
                onClick={handleBlankTemplateClick}
                disabled={isDownloading}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 dark:border-transparent bg-white dark:bg-white text-slate-900 px-4 sm:px-5 py-2.5 text-xs sm:text-sm font-semibold shadow-xs hover:bg-slate-50 hover:border-slate-400 dark:hover:bg-slate-100 active:scale-[0.98] cursor-pointer transition-all disabled:opacity-60"
              >
                {isDownloading ? (
                  <Loader2 className="h-4 w-4 animate-spin text-slate-900" />
                ) : (
                  <Download className="h-4 w-4 text-slate-900" />
                )}
                <span>Blank Template</span>
              </button>

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#0A0E1A] dark:bg-[#1A1D27] text-white border border-transparent dark:border-white/[0.15] px-5 sm:px-6 py-2.5 text-xs sm:text-sm font-semibold shadow-xs hover:bg-[#161D2E] dark:hover:bg-[#242836] active:scale-[0.98] cursor-pointer transition-all disabled:opacity-60"
              >
                {isUploading ? (
                  <Loader2 className="h-4 w-4 animate-spin text-white" />
                ) : (
                  <Upload className="h-4 w-4 text-white" />
                )}
                <span>Upload</span>
              </button>
            </div>
          ) : (
            <>
              {/* Fields Section with horizontal divider */}
              {availableFields.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      Fields.
                    </span>
                    <div className="h-px flex-1 bg-slate-200 dark:bg-white/[0.08]" />
                  </div>

                  <div className="flex items-center justify-between text-xs font-medium text-slate-500 dark:text-slate-400 px-0.5">
                    <span>Field.</span>
                    <label className="inline-flex items-center gap-2 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={isAllSelected}
                        onChange={handleSelectAll}
                        className="h-3.5 w-3.5 rounded border-slate-300 dark:border-white/[0.2] text-[#B88728] focus:ring-0 cursor-pointer"
                      />
                      <span className="text-xs text-slate-700 dark:text-slate-300 font-medium">Select All</span>
                    </label>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 pt-0.5">
                    {availableFields.map((field) => {
                      const isSelected = selectedFields.includes(field);
                      return (
                        <button
                          key={field}
                          type="button"
                          onClick={() => handleToggleField(field)}
                          className={cn(
                            "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs transition-all cursor-pointer select-none border",
                            isSelected
                              ? "bg-[#FFF9EC] dark:bg-transparent border-[#B88728] dark:border-white text-[#B88728] dark:text-white font-semibold shadow-2xs"
                              : "bg-white dark:bg-[#1A1D27] border-slate-300 dark:border-white/[0.08] text-slate-700 dark:text-slate-300 hover:border-slate-400 dark:hover:border-slate-500"
                          )}
                        >
                          {isSelected && <Check className="h-3 w-3 stroke-[2.5]" />}
                          <span>{field}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Filters Section with horizontal divider */}
              {section.filterKeys.length > 0 && (
                <div className="space-y-3 pt-2">
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      Filters.
                    </span>
                    <div className="h-px flex-1 bg-slate-200 dark:bg-white/[0.08]" />
                  </div>

                  <div className="flex flex-wrap items-center gap-3">
                    {section.filterKeys.map((filterKey) => {
                      const label =
                        filterKey === "masterSku"
                          ? "Master SKU"
                          : filterKey.charAt(0).toUpperCase() + filterKey.slice(1);
                      const options = getOptionsForFilterKey(filterKey);
                      const currentVal = filters[filterKey] || "All";

                      const isMulti = filterKey === "category" || filterKey === "masterSku";

                      if (isMulti) {
                        const selectedArray = Array.isArray(currentVal)
                          ? currentVal
                          : currentVal === "All" || !currentVal
                          ? ["All"]
                          : [currentVal];

                        return (
                          <div key={filterKey} className="flex items-center gap-2 text-xs">
                            <span className="text-slate-500 dark:text-slate-400 font-medium">
                              {label}
                            </span>
                            <ThemeMultiSelectFilter
                              value={selectedArray}
                              onChange={(val) => handleFilterChange(filterKey, val)}
                              options={options}
                              placeholder={`All ${label === "Category" ? "categories" : label === "Master SKU" ? "Master SKUs" : label}`}
                              buttonClassName="h-8.5 px-3.5 text-xs rounded-xl bg-white dark:bg-[#131622] border border-[#E7E0D2] dark:border-white/[0.08] text-slate-800 dark:text-white font-medium hover:border-[#E8C16D] dark:hover:border-[#F5C451]/50 shadow-xs"
                              onOpenChange={(open) => setActiveDropdownKey(open ? filterKey : null)}
                            />
                          </div>
                        );
                      }

                      return (
                        <div key={filterKey} className="flex items-center gap-2 text-xs">
                          <span className="text-slate-500 dark:text-slate-400 font-medium">
                            {label}
                          </span>
                          <ThemeSelectDropdown
                            value={typeof currentVal === "string" ? currentVal : "All"}
                            onChange={(val) => handleFilterChange(filterKey, val)}
                            options={options as ThemeSelectOption[]}
                            buttonClassName="h-8.5 px-3.5 text-xs rounded-xl bg-white dark:bg-[#131622] border border-[#E7E0D2] dark:border-white/[0.08] text-slate-800 dark:text-white font-medium hover:border-[#E8C16D] dark:hover:border-[#F5C451]/50 shadow-xs"
                            onOpenChange={(open) => setActiveDropdownKey(open ? filterKey : null)}
                          />
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Action Buttons matching screenshots & OrderOS theme */}
              <div className="flex flex-wrap items-center gap-3 pt-3">
                <button
                  type="button"
                  onClick={handleDownloadClick}
                  disabled={isDownloading}
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 dark:border-transparent bg-white dark:bg-white text-slate-900 px-4 sm:px-5 py-2.5 text-xs sm:text-sm font-semibold shadow-xs hover:bg-slate-50 hover:border-slate-400 dark:hover:bg-slate-100 active:scale-[0.98] cursor-pointer transition-all disabled:opacity-60"
                >
                  {isDownloading ? (
                    <Loader2 className="h-4 w-4 animate-spin text-slate-900" />
                  ) : (
                    <Download className="h-4 w-4 text-slate-900" />
                  )}
                  <span>Download</span>
                </button>

                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#0A0E1A] dark:bg-[#1A1D27] text-white border border-transparent dark:border-white/[0.15] px-5 sm:px-6 py-2.5 text-xs sm:text-sm font-semibold shadow-xs hover:bg-[#161D2E] dark:hover:bg-[#242836] active:scale-[0.98] cursor-pointer transition-all disabled:opacity-60"
                >
                  {isUploading ? (
                    <Loader2 className="h-4 w-4 animate-spin text-white" />
                  ) : (
                    <Upload className="h-4 w-4 text-white" />
                  )}
                  <span>Upload & Update</span>
                </button>
              </div>
            </>
          )}

          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept=".xlsx, .xls, .csv"
            className="hidden"
          />
        </div>
      )}
    </div>
  );
}
