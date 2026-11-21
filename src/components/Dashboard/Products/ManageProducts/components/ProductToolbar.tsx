"use client";

import { useRef } from "react";
import Link from "next/link";
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
  Store,
} from "lucide-react";
import ExcelJS from "exceljs";
import { saveAs } from "file-saver";
import { toast } from "sonner";

import ThemeSelectDropdown from "@/components/ui/ThemeSelectDropdown";
import { usePagePermissions } from "@/utils/pagePermissions";
import { validateImportSheetFormat } from "../utils/validateImportSheet";
import { downloadDemoSheet } from "../utils/downloadDemoSheet";
import { exportProductsExcel } from "../utils/exportProductsExcel";

interface Option {
  label: string;
  value: string;
}

export type ImportType = "product" | "asin" | "myntra" | "flipkart";

interface Props {
  search: string;
  onSearchChange: (value: string) => void;

  status: string;
  onStatusChange: (value: string) => void;

  category: string;
  onCategoryChange: (value: string) => void;

  brand: string;
  onBrandChange: (value: string) => void;

  marketplace?: string;
  onMarketplaceChange?: (value: string) => void;

  importType: ImportType;
  onImportTypeChange: (value: ImportType) => void;

  categoryOptions: Option[];
  brandOptions: Option[];
  marketplaceOptions?: Option[];

  onRefresh: () => void;

  onImportExcel?: (file: File, type: ImportType) => void;
  isImporting?: boolean;

  productsData?: any[];
  asinData?: any[];
  myntraData?: any[];
  flipkartData?: any[];

  selectedCount?: number;
  onExportProducts?: () => void;
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
  {
    label: "Flipkart Import",
    value: "flipkart",
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

  marketplace = "",
  onMarketplaceChange,

  importType,
  onImportTypeChange,

  categoryOptions,
  brandOptions,
  marketplaceOptions = [],

  onRefresh,

  onImportExcel,
  isImporting = false,
  productsData = [],
  asinData = [],
  myntraData = [],
  flipkartData = [],
  selectedCount = 0,
  onExportProducts,
}: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { canCreate } = usePagePermissions("settings/manage-product");
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
      if (selectedTypeRef.current === "asin" && (!asinData || asinData.length === 0)) {
        toast.info("No ASIN records found to export. Downloading sample demo sheet.");
        handleDownloadDemoSheet();
        return;
      }
      if (selectedTypeRef.current === "myntra" && (!myntraData || myntraData.length === 0)) {
        toast.info("No Myntra records found to export. Downloading sample demo sheet.");
        handleDownloadDemoSheet();
        return;
      }
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
      } else if (selectedTypeRef.current === "flipkart") {
        const worksheet = workbook.addWorksheet("Flipkart Import");
        worksheet.columns = [
          { header: "FSN Code", key: "fsn", width: 22 },
          { header: "SKU", key: "sku", width: 25 },
          { header: "Rack Address", key: "rackAddress", width: 20 },
        ];
        const headerRow = worksheet.getRow(1);
        headerRow.font = { name: "Calibri", size: 11, bold: true, color: { argb: "FFFFFFFF" } };
        headerRow.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF0A0E1A" } };
        headerRow.alignment = { vertical: "middle", horizontal: "center" };
        headerRow.height = 28;

        (flipkartData || []).forEach((item: any) => {
          const r = worksheet.addRow({
            fsn: item.fsn || "",
            sku: item.sku || "",
            rackAddress: item.rackAddress || "",
          });
          r.height = 22;
          r.alignment = { vertical: "middle" };
        });

        const buffer = await workbook.xlsx.writeBuffer();
        saveAs(
          new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }),
          "flipkart-data.xlsx"
        );
        toast.success("Flipkart data downloaded successfully!");
      } else {
        if (onExportProducts) {
          onExportProducts();
          return;
        }

        await exportProductsExcel(
          productsData || [],
          Boolean(selectedCount && selectedCount > 0)
        );
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to download data");
    }
  };

  const hasData =
    (importType === "asin" && (asinData?.length ?? 0) > 0) ||
    (importType === "product" && (productsData?.length ?? 0) > 0) ||
    (importType === "myntra" && (myntraData?.length ?? 0) > 0) ||
    (importType === "flipkart" && (flipkartData?.length ?? 0) > 0);

  return (
    <>
      <div className="rounded-2xl sm:rounded-3xl border border-[#E7E0D2] bg-white p-3 sm:p-4 shadow-sm flex flex-col xl:flex-row xl:items-center justify-between gap-2.5 sm:gap-4 dark:border-white/[0.08] dark:bg-[#0F1626]">
        {/* Left side: Searchbar matching OrderOS theme */}
        <div className="w-full xl:w-auto xl:max-w-md xl:flex-1 transition-all">
          <div className="group flex items-center gap-2.5 rounded-full border border-slate-200 bg-white px-3.5 sm:px-4 h-9 sm:h-10 shadow-xs transition-all hover:border-[#E8C16D] focus-within:border-[#E8C16D] focus-within:ring-2 focus-within:ring-[#E8C16D]/30 focus-within:bg-white dark:border-white/[0.08] dark:bg-[#0B0F17] dark:hover:border-[#F5C451]/50 dark:focus-within:border-[#F5C451] dark:focus-within:ring-[#F5C451]/30 dark:focus-within:bg-[#0B0F17]">
            <div className="grid h-5 w-5 sm:h-6 sm:w-6 place-items-center rounded-md bg-[#FFF9EC] text-[#B88728] shrink-0 border border-[#E8C16D]/30 dark:bg-[#F5C451]/15 dark:text-[#F5C451] dark:border-[#F5C451]/30">
              <Search className="h-3.5 w-3.5" />
            </div>
            <input
              type="text"
              placeholder={
                importType === "asin"
                  ? "Search ASIN, SKU, Rack..."
                  : importType === "myntra"
                    ? "Search Myntra SKU, Seller SKU, Rack..."
                    : importType === "flipkart"
                      ? "Search FSN, SKU, Rack..."
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
        <div className="flex flex-wrap items-center gap-2 sm:gap-2.5 w-full xl:w-auto">
          {/* Status Dropdown */}
          <ThemeSelectDropdown
            ariaLabel="Filter by Status"
            value={status}
            onChange={(val) => onStatusChange(val)}
            options={statusOptions}
            className="flex-1 sm:flex-initial min-w-[140px]"
            buttonClassName="w-full sm:w-auto justify-between sm:justify-start rounded-full h-9 sm:h-10 px-3.5 sm:px-4 text-xs font-semibold bg-white dark:bg-[#0B0F17] border border-slate-200 dark:border-white/[0.08] hover:border-[#E8C16D] dark:hover:border-[#F5C451]/50"
            icon={<Boxes className="h-3.5 w-3.5 text-[#B88728] dark:text-[#F5C451]" />}
          />

          {/* Category Dropdown (if on product view) */}
          {importType === "product" && (
            <ThemeSelectDropdown
              ariaLabel="Filter by Category"
              value={category}
              onChange={(val) => onCategoryChange(val)}
              options={categoryOptions}
              className="flex-1 sm:flex-initial min-w-[140px]"
              buttonClassName="w-full sm:w-auto justify-between sm:justify-start rounded-full h-9 sm:h-10 px-3.5 sm:px-4 text-xs font-semibold bg-white dark:bg-[#0B0F17] border border-slate-200 dark:border-white/[0.08] hover:border-[#E8C16D] dark:hover:border-[#F5C451]/50"
              icon={<Layers className="h-3.5 w-3.5 text-[#B88728] dark:text-[#F5C451]" />}
            />
          )}

          {/* Brand Dropdown (if on product view) */}
          {importType === "product" && (
            <ThemeSelectDropdown
              ariaLabel="Filter by Brand"
              value={brand}
              onChange={(val) => onBrandChange(val)}
              options={brandOptions}
              className="flex-1 sm:flex-initial min-w-[140px]"
              buttonClassName="w-full sm:w-auto justify-between sm:justify-start rounded-full h-9 sm:h-10 px-3.5 sm:px-4 text-xs font-semibold bg-white dark:bg-[#0B0F17] border border-slate-200 dark:border-white/[0.08] hover:border-[#E8C16D] dark:hover:border-[#F5C451]/50"
              icon={<Sparkles className="h-3.5 w-3.5 text-[#B88728] dark:text-[#F5C451]" />}
            />
          )}

          {/* Marketplace Dropdown (if on product view) */}
          {importType === "product" && marketplaceOptions.length > 0 && onMarketplaceChange && (
            <ThemeSelectDropdown
              ariaLabel="Filter by Marketplace"
              value={marketplace}
              onChange={(val) => onMarketplaceChange(val)}
              options={marketplaceOptions}
              className="flex-1 sm:flex-initial min-w-[140px]"
              buttonClassName="w-full sm:w-auto justify-between sm:justify-start rounded-full h-9 sm:h-10 px-3.5 sm:px-4 text-xs font-semibold bg-white dark:bg-[#0B0F17] border border-slate-200 dark:border-white/[0.08] hover:border-[#E8C16D] dark:hover:border-[#F5C451]/50"
              icon={<Store className="h-3.5 w-3.5 text-[#B88728] dark:text-[#F5C451]" />}
            />
          )}

          {/* Import / View Type Dropdown */}
          <ThemeSelectDropdown
            ariaLabel="Select View / Import Type"
            value={importType}
            onChange={(val) => handleSelectImportType(val as ImportType)}
            options={importTypeOptions}
            className={
              importType === "product"
                ? "w-[calc(100%-44px)] sm:w-auto min-w-[calc(100%-44px)] sm:min-w-[140px] flex-1 sm:flex-initial"
                : "flex-1 sm:flex-initial min-w-[140px]"
            }
            buttonClassName="w-full sm:w-auto justify-between sm:justify-start rounded-full h-9 sm:h-10 px-3.5 sm:px-4 text-xs font-semibold bg-white dark:bg-[#0B0F17] border border-slate-200 dark:border-white/[0.08] hover:border-[#E8C16D] dark:hover:border-[#F5C451]/50"
            icon={<FileSpreadsheet className="h-3.5 w-3.5 text-[#B88728] dark:text-[#F5C451]" />}
          />

          {/* Upload / Import Excel Button */}
          {canCreate && (
            importType === "product" ? (
              <button
                type="button"
                onClick={() => {
                  window.location.href = "/dashboard/settings/upload-excel?tab=product";
                }}
                disabled={isImporting}
                className="order-1 sm:order-none inline-flex flex-1 sm:flex-initial w-[calc(50%-4px)] sm:w-auto min-w-[calc(50%-4px)] sm:min-w-0 justify-center items-center gap-2 rounded-2xl border border-[#E8C16D]/60 dark:border-white/[0.15] bg-[#FEFAEE] dark:bg-[#080B11] px-3.5 sm:px-4 h-9 sm:h-10 text-xs sm:text-sm font-bold text-[#6A4D1D] dark:text-[#E8C16D] transition-all shadow-xs cursor-pointer hover:bg-[#FDF2D1] hover:border-[#E8C16D] hover:text-[#4A3514] dark:hover:bg-[#E8C16D] dark:hover:text-[#0A0E1A] ring-1 ring-[#E8C16D]/20 dark:ring-0 active:scale-[0.98] disabled:opacity-50"
                title="Upload Excel"
              >
                <div className="grid h-5 w-5 place-items-center rounded-md bg-[#FFF3D6] text-[#B88728] shrink-0 dark:bg-[#E8C16D]/20 dark:text-[#E8C16D]">
                  <FileSpreadsheet className="h-3.5 w-3.5" />
                </div>
                <span className="whitespace-nowrap">Upload Excel</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isImporting}
                className="order-1 sm:order-none inline-flex flex-1 sm:flex-initial w-[calc(50%-4px)] sm:w-auto min-w-[calc(50%-4px)] sm:min-w-0 justify-center items-center gap-2 rounded-2xl border border-[#E8C16D]/60 dark:border-white/[0.15] bg-[#FEFAEE] dark:bg-[#080B11] px-3.5 sm:px-4 h-9 sm:h-10 text-xs sm:text-sm font-bold text-[#6A4D1D] dark:text-[#E8C16D] transition-all shadow-xs cursor-pointer hover:bg-[#FDF2D1] hover:border-[#E8C16D] hover:text-[#4A3514] dark:hover:bg-[#E8C16D] dark:hover:text-[#0A0E1A] ring-1 ring-[#E8C16D]/20 dark:ring-0 active:scale-[0.98] disabled:opacity-50"
                title={`Import ${importType === "asin" ? "ASIN" : importType === "myntra" ? "Myntra" : importType === "flipkart" ? "Flipkart" : "Product"} Excel`}
              >
                <div className="grid h-5 w-5 place-items-center rounded-md bg-[#FFF3D6] text-[#B88728] shrink-0 dark:bg-[#E8C16D]/20 dark:text-[#E8C16D]">
                  <Upload className="h-3.5 w-3.5" />
                </div>
                <span className="whitespace-nowrap">{isImporting ? "Importing..." : "Import"}</span>
              </button>
            )
          )}

          {/* Export / Demo Button */}
          {(hasData || importType === "asin" || importType === "myntra" || importType === "flipkart") ? (
            <button
              type="button"
              onClick={handleDownloadData}
              className="order-2 sm:order-none inline-flex flex-1 sm:flex-initial w-[calc(50%-4px)] sm:w-auto min-w-[calc(50%-4px)] sm:min-w-0 justify-center items-center gap-2 rounded-2xl border border-[#E8C16D] bg-[#FFF9EC] px-3.5 sm:px-4 h-9 sm:h-10 text-xs sm:text-sm font-bold text-[#0A0E1A] transition-all shadow-xs hover:bg-[#FFF3D6] ring-2 ring-[#E8C16D]/30 active:scale-[0.98] cursor-pointer dark:border-[#F5C451]/50 dark:bg-[#F5C451]/15 dark:text-[#F5C451] dark:ring-[#F5C451]/20 dark:hover:bg-[#F5C451]/25"
              title={
                importType === "product" && selectedCount > 0
                  ? `Export ${selectedCount} selected product(s)`
                  : `Export ${importType === "asin" ? "ASIN" : importType === "myntra" ? "Myntra" : importType === "flipkart" ? "Flipkart" : "Product"} data`
              }
            >
              <div className="grid h-5 w-5 place-items-center rounded-md bg-[#FFF3D6] text-[#B88728] shrink-0 dark:bg-[#E8C16D]/20 dark:text-[#E8C16D]">
                <Download className="h-3.5 w-3.5" />
              </div>
              <span className="whitespace-nowrap">
                {importType === "product" && selectedCount > 0
                  ? `Export (${selectedCount})`
                  : "Export"}
              </span>
            </button>
          ) : (
            <button
              type="button"
              onClick={handleDownloadDemoSheet}
              className="order-2 sm:order-none inline-flex flex-1 sm:flex-initial w-[calc(50%-4px)] sm:w-auto min-w-[calc(50%-4px)] sm:min-w-0 justify-center items-center gap-2 rounded-2xl border border-[#E8C16D]/60 dark:border-white/[0.15] bg-[#FEFAEE] dark:bg-[#080B11] px-3.5 sm:px-4 h-9 sm:h-10 text-xs sm:text-sm font-bold text-[#6A4D1D] dark:text-[#E8C16D] transition-all shadow-xs cursor-pointer hover:bg-[#FDF2D1] hover:border-[#E8C16D] hover:text-[#4A3514] dark:hover:bg-[#E8C16D] dark:hover:text-[#0A0E1A] ring-1 ring-[#E8C16D]/20 dark:ring-0 active:scale-[0.98]"
              title="Download demo Excel sheet"
            >
              <div className="grid h-5 w-5 place-items-center rounded-md bg-[#FFF3D6] text-[#B88728] shrink-0 dark:bg-[#E8C16D]/20 dark:text-[#E8C16D]">
                <Download className="h-3.5 w-3.5" />
              </div>
              <span className="whitespace-nowrap">Demo Sheet</span>
            </button>
          )}

          {/* Refresh Button */}
          <button
            type="button"
            onClick={onRefresh}
            className="inline-flex items-center justify-center h-9 sm:h-10 w-9 sm:w-10 rounded-full border border-slate-200 bg-slate-50/80 hover:bg-slate-100 text-slate-700 transition-all shadow-xs active:scale-[0.98] cursor-pointer shrink-0 dark:border-white/[0.08] dark:bg-[#0B0F17] dark:text-slate-300 dark:hover:bg-white/[0.06] dark:hover:text-white"
            title="Refresh"
          >
            <RotateCw className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
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
