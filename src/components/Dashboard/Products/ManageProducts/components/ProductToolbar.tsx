"use client";

import { useRef } from "react";
import {
  Download,
  RotateCw,
  Search,
  Upload,
  X,
  Layers,
  Sparkles,
  Boxes,
  FileSpreadsheet,
} from "lucide-react";
import ExcelJS from "exceljs";
import { saveAs } from "file-saver";
import { toast } from "sonner";

import ThemeSelectDropdown from "@/components/ui/ThemeSelectDropdown";
import { validateImportSheetFormat } from "../utils/validateImportSheet";
import { downloadDemoSheet } from "../utils/downloadDemoSheet";

interface Option {
  label: string;
  value: string;
}

export type ImportType = "product" | "asin" | "myntra";

interface Props {
  search: string;
  onSearchChange: (value: string) => void;

  status: string;
  onStatusChange: (value: string) => void;

  category: string;
  onCategoryChange: (value: string) => void;

  brand: string;
  onBrandChange: (value: string) => void;

  importType: ImportType;
  onImportTypeChange: (value: ImportType) => void;

  categoryOptions: Option[];
  brandOptions: Option[];

  onRefresh: () => void;

  onImportExcel?: (file: File, type: ImportType) => void;
  isImporting?: boolean;

  productsData?: any[];
  asinData?: any[];
  myntraData?: any[];
}

const statusOptions = [
  {
    label: "All Status",
    value: "",
  },
  {
    label: "Active",
    value: "true",
  },
  {
    label: "Inactive",
    value: "false",
  },
];

const importTypeOptions: { label: string; value: ImportType }[] = [
  {
    label: "Product Import",
    value: "product",
  },
  {
    label: "ASIN Import",
    value: "asin",
  },
  {
    label: "Myntra Import",
    value: "myntra",
  },
];

export default function ProductToolbar({
  search,
  onSearchChange,

  status,
  onStatusChange,

  category,
  onCategoryChange,

  brand,
  onBrandChange,

  importType,
  onImportTypeChange,

  categoryOptions,
  brandOptions,

  onRefresh,

  onImportExcel,
  isImporting = false,
  productsData = [],
  asinData = [],
  myntraData = [],
}: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const selectedTypeRef = useRef<ImportType>(importType);
  selectedTypeRef.current = importType;

  const handleDownloadDemoSheet = () => {
    downloadDemoSheet(selectedTypeRef.current);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const currentType = selectedTypeRef.current;
    const validation = await validateImportSheetFormat(file, currentType);

    if (!validation.valid) {
      const label =
        currentType === "myntra"
          ? "Myntra"
          : currentType === "asin"
          ? "ASIN"
          : "Product";

      toast.error(
        validation.message ||
          `Please upload the appropriate sheet format for ${label} Import!`
      );
      e.target.value = "";
      return;
    }

    if (onImportExcel) {
      onImportExcel(file, currentType);
      e.target.value = "";
    }
  };

  const handleSelectImportType = (selected: ImportType) => {
    selectedTypeRef.current = selected;
    onImportTypeChange(selected);
  };

  const handleDownloadData = async () => {
    try {
      const workbook = new ExcelJS.Workbook();
      if (selectedTypeRef.current === "myntra") {
        const worksheet = workbook.addWorksheet("Myntra Import");
        worksheet.columns = [
          { header: "Rack Address", key: "rackAddress", width: 20 },
          { header: "Myntra SKU", key: "myntraSku", width: 25 },
          { header: "Seller SKU", key: "sellerSku", width: 25 },
          { header: "Generate Barcode", key: "generateBarcode", width: 22 },
        ];
        const headerRow = worksheet.getRow(1);
        headerRow.font = { name: "Calibri", size: 11, bold: true, color: { argb: "FFFFFFFF" } };
        headerRow.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF0A0E1A" } };
        headerRow.alignment = { vertical: "middle", horizontal: "center" };
        headerRow.height = 28;

        myntraData.forEach((item: any) => {
          const r = worksheet.addRow({
            rackAddress: item.rackAddress || "",
            myntraSku: item.myntraSku || "",
            sellerSku: item.sellerSku || "",
            generateBarcode: item.generateBarcode || item.generatedBarcode || item.sellerSku || item.myntraSku || "",
          });
          r.height = 22;
          r.alignment = { vertical: "middle" };
        });

        const buffer = await workbook.xlsx.writeBuffer();
        saveAs(
          new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }),
          "myntra-data.xlsx"
        );
        toast.success("Myntra data downloaded successfully!");
      } else if (selectedTypeRef.current === "asin") {
        const worksheet = workbook.addWorksheet("ASIN Import");
        worksheet.columns = [
          { header: "ASIN", key: "asin", width: 22 },
          { header: "SKU", key: "sku", width: 25 },
          { header: "Generate Barcode", key: "generateBarcode", width: 20 },
          { header: "Rack Address", key: "rackAddress", width: 20 },
        ];
        const headerRow = worksheet.getRow(1);
        headerRow.font = { name: "Calibri", size: 11, bold: true, color: { argb: "FFFFFFFF" } };
        headerRow.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF0A0E1A" } };
        headerRow.alignment = { vertical: "middle", horizontal: "center" };
        headerRow.height = 28;

        asinData.forEach((item) => {
          const r = worksheet.addRow({
            asin: item.asin,
            sku: item.sku,
            generateBarcode: item.generateBarcode,
            rackAddress: item.rackAddress,
          });
          r.height = 22;
          r.alignment = { vertical: "middle" };
        });

        const buffer = await workbook.xlsx.writeBuffer();
        saveAs(
          new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }),
          "asin-data.xlsx"
        );
        toast.success("ASIN data downloaded successfully!");
      } else {
        const worksheet = workbook.addWorksheet("Products");
        worksheet.columns = [
          { header: "Product Name", key: "productName", width: 30 },
          { header: "Master SKU", key: "masterSku", width: 22 },
          { header: "Brand", key: "brand", width: 18 },
          { header: "Category", key: "category", width: 18 },
          { header: "Sub Category", key: "subCategory", width: 18 },
          { header: "Description", key: "description", width: 35 },
          { header: "ASIN", key: "asin", width: 20 },
          { header: "Rack Address", key: "rackAddress", width: 18 },
          { header: "Generate Barcode", key: "generateBarcode", width: 20 },
          { header: "MRP", key: "mrp", width: 15 },
          { header: "HSN Code", key: "hsnCode", width: 16 },
          { header: "GST %", key: "gstRate", width: 14 },
        ];
        const headerRow = worksheet.getRow(1);
        headerRow.font = { name: "Calibri", size: 11, bold: true, color: { argb: "FFFFFFFF" } };
        headerRow.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF0A0E1A" } };
        headerRow.alignment = { vertical: "middle", horizontal: "center" };
        headerRow.height = 28;

        productsData.forEach((item) => {
          const r = worksheet.addRow({
            productName: item.productName,
            masterSku: item.masterSku,
            brand: item.brand,
            category: item.category,
            subCategory: item.subCategory,
            description: item.description,
            asin: item.asin,
            rackAddress: item.rackAddress,
            generateBarcode: item.generateBarcode,
            mrp: item.mrp,
            hsnCode: item.hsnCode,
            gstRate: item.gstRate,
          });
          r.height = 22;
          r.alignment = { vertical: "middle" };
        });

        const buffer = await workbook.xlsx.writeBuffer();
        saveAs(
          new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }),
          "products-data.xlsx"
        );
        toast.success("Products data downloaded successfully!");
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to download data");
    }
  };

  const isFilterActive =
    (search && search.trim() !== "") ||
    Boolean(status) ||
    Boolean(category) ||
    Boolean(brand);

  const handleResetFilters = () => {
    onSearchChange("");
    onStatusChange("");
    onCategoryChange("");
    onBrandChange("");
  };

  const hasData =
    (importType === "asin" && asinData.length > 0) ||
    (importType === "product" && productsData.length > 0) ||
    (importType === "myntra" && myntraData.length > 0);

  return (
    <>
      <div className="rounded-2xl border border-[#E7E0D2] bg-white p-3.5 sm:p-4 shadow-sm flex flex-col xl:flex-row xl:items-center justify-between gap-3 sm:gap-4 dark:border-white/[0.08] dark:bg-[#0F1626]">
        {/* Left side: Searchbar matching OrderOS theme */}
        <div className="w-full xl:max-w-md sm:w-80 md:w-96 lg:w-[420px] transition-all">
          <div className="group flex items-center gap-2.5 rounded-2xl border border-slate-200 bg-white px-3.5 sm:px-4 py-2 sm:py-2.5 shadow-xs transition-all hover:border-[#E8C16D] hover:bg-slate-50/50 focus-within:border-[#E8C16D] focus-within:ring-2 focus-within:ring-[#E8C16D]/30 focus-within:bg-white dark:border-white/[0.08] dark:bg-[#0B0F17] dark:hover:border-[#F5C451]/50 dark:focus-within:border-[#F5C451] dark:focus-within:ring-[#F5C451]/30 dark:focus-within:bg-[#0B0F17]">
            <div className="grid h-6 w-6 place-items-center rounded-md bg-[#FFF9EC] text-[#B88728] shrink-0 border border-[#E8C16D]/30 dark:bg-[#F5C451]/15 dark:text-[#F5C451] dark:border-[#F5C451]/30">
              <Search className="h-3.5 w-3.5" />
            </div>
            <input
              type="text"
              placeholder={
                importType === "asin"
                  ? "Search ASIN, SKU, Rack..."
                  : importType === "myntra"
                  ? "Search Myntra SKU, Seller SKU, Rack..."
                  : "Search Product / SKU..."
              }
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full bg-transparent text-xs sm:text-sm font-semibold text-[#0A0E1A] placeholder:font-normal placeholder:text-slate-400 outline-none dark:text-white dark:placeholder:text-slate-500"
            />
            {search && (
              <button
                type="button"
                onClick={() => onSearchChange("")}
                className="grid h-5 w-5 place-items-center rounded-full text-slate-400 hover:text-red-500 hover:bg-red-50 transition cursor-pointer shrink-0 dark:text-slate-500 dark:hover:bg-red-500/15 dark:hover:text-red-400"
                title="Clear search"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Right side: Filters & Actions */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-2.5">
          {/* Status Dropdown */}
          <ThemeSelectDropdown
            ariaLabel="Filter by Status"
            value={status}
            onChange={(val) => onStatusChange(val)}
            options={statusOptions}
            icon={<Boxes className="h-3.5 w-3.5" />}
          />

          {/* Category Dropdown (if on product view) */}
          {importType === "product" && (
            <ThemeSelectDropdown
              ariaLabel="Filter by Category"
              value={category}
              onChange={(val) => onCategoryChange(val)}
              options={categoryOptions}
              icon={<Layers className="h-3.5 w-3.5" />}
            />
          )}

          {/* Brand Dropdown (if on product view) */}
          {importType === "product" && (
            <ThemeSelectDropdown
              ariaLabel="Filter by Brand"
              value={brand}
              onChange={(val) => onBrandChange(val)}
              options={brandOptions}
              icon={<Sparkles className="h-3.5 w-3.5" />}
            />
          )}

          {/* Import / View Type Dropdown */}
          <ThemeSelectDropdown
            ariaLabel="Select View / Import Type"
            value={importType}
            onChange={(val) => handleSelectImportType(val as ImportType)}
            options={importTypeOptions}
            icon={<FileSpreadsheet className="h-3.5 w-3.5" />}
          />

          {/* Reset filter button if active */}
          {isFilterActive && (
            <button
              type="button"
              onClick={handleResetFilters}
              className="inline-flex items-center gap-2 rounded-2xl border border-red-200 bg-red-50/70 hover:bg-red-100 text-red-600 hover:text-red-700 px-3.5 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm font-bold transition-all shadow-xs active:scale-[0.98] cursor-pointer dark:border-red-500/30 dark:bg-red-500/15 dark:text-red-400 dark:hover:bg-red-500/25"
              title="Reset all filters"
            >
              <div className="grid h-5 w-5 place-items-center rounded-md bg-red-100 text-red-600 shrink-0 dark:bg-red-500/20 dark:text-red-400">
                <X className="h-3.5 w-3.5" />
              </div>
              <span>Reset</span>
            </button>
          )}

          {/* Upload Button */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isImporting}
            className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3.5 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm font-bold text-[#0A0E1A] transition-all shadow-xs cursor-pointer hover:border-[#E8C16D] hover:bg-slate-50 focus-within:border-[#E8C16D] active:scale-[0.98] disabled:opacity-50 dark:border-white/[0.08] dark:bg-[#0B0F17] dark:text-white dark:hover:border-[#F5C451]/50 dark:hover:bg-white/[0.04]"
            title="Import Excel file"
          >
            <div className="grid h-5 w-5 place-items-center rounded-md bg-slate-100 text-slate-700 shrink-0 dark:bg-white/[0.06] dark:text-slate-300">
              <Upload className="h-3.5 w-3.5" />
            </div>
            <span>{isImporting ? "Importing..." : "Import"}</span>
          </button>

          {/* Export / Demo Button */}
          {hasData ? (
            <button
              type="button"
              onClick={handleDownloadData}
              className="inline-flex items-center gap-2 rounded-2xl border border-[#E8C16D] bg-[#FFF9EC] px-3.5 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm font-bold text-[#0A0E1A] transition-all shadow-xs hover:bg-[#FFF3D6] ring-2 ring-[#E8C16D]/30 active:scale-[0.98] cursor-pointer dark:border-[#F5C451]/50 dark:bg-[#F5C451]/15 dark:text-[#F5C451] dark:ring-[#F5C451]/20 dark:hover:bg-[#F5C451]/25"
              title="Export data"
            >
              <div className="grid h-5 w-5 place-items-center rounded-md bg-[#FFF3D6] text-[#B88728] shrink-0 dark:bg-[#F5C451]/20 dark:text-[#F5C451]">
                <Download className="h-3.5 w-3.5" />
              </div>
              <span>Export</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={handleDownloadDemoSheet}
              className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3.5 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm font-bold text-[#0A0E1A] transition-all shadow-xs cursor-pointer hover:border-[#E8C16D] hover:bg-slate-50 active:scale-[0.98] dark:border-white/[0.08] dark:bg-[#0B0F17] dark:text-white dark:hover:border-[#F5C451]/50 dark:hover:bg-white/[0.04]"
              title="Download demo Excel sheet"
            >
              <div className="grid h-5 w-5 place-items-center rounded-md bg-slate-100 text-slate-700 shrink-0 dark:bg-white/[0.06] dark:text-slate-300">
                <Download className="h-3.5 w-3.5" />
              </div>
              <span>Demo Sheet</span>
            </button>
          )}

          {/* Refresh Button */}
          <button
            type="button"
            onClick={onRefresh}
            className="inline-flex items-center justify-center h-9 sm:h-10 w-9 sm:w-10 rounded-2xl border border-slate-200 bg-slate-50/80 hover:bg-slate-100 text-slate-700 transition-all shadow-xs active:scale-[0.98] cursor-pointer dark:border-white/[0.08] dark:bg-[#0B0F17] dark:text-slate-300 dark:hover:bg-white/[0.06] dark:hover:text-white"
            title="Refresh"
          >
            <RotateCw className="h-4 w-4" />
          </button>
        </div>
      </div>

      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept=".xlsx, .xls"
        className="hidden"
      />
    </>
  );
}