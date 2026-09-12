"use client";

import { useRef } from "react";
import { Download, RotateCw, Search } from "lucide-react";
import ExcelJS from "exceljs";
import { saveAs } from "file-saver";
import { toast } from "sonner";

import Button from "@/components/ui/Button";
import ReactSelect from "@/components/ui/ReactSelect";

interface Option {
  label: string;
  value: string;
}

export type ImportType = "product" | "asin";

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
}: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const selectedTypeRef = useRef<ImportType>(importType);
  selectedTypeRef.current = importType;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && onImportExcel) {
      onImportExcel(file, selectedTypeRef.current);
      e.target.value = "";
    }
  };

  const handleSelectImportType = (option: { label: string; value: ImportType } | null) => {
    if (!option) return;
    const selected = option.value;
    selectedTypeRef.current = selected;
    onImportTypeChange(selected);

    // Trigger file input upload dialog
    setTimeout(() => {
      fileInputRef.current?.click();
    }, 100);
  };

  const handleDownloadDemoSheet = async () => {
    try {
      const workbook = new ExcelJS.Workbook();

      if (selectedTypeRef.current === "asin") {
        const worksheet = workbook.addWorksheet("ASIN Import");

        worksheet.columns = [
          { header: "ASIN", key: "asin", width: 22 },
          { header: "SKU", key: "sku", width: 25 },
          { header: "Generate Barcode", key: "generateBarcode", width: 20 },
          { header: "Rack Address", key: "rackAddress", width: 20 },
        ];

        const headerRow = worksheet.getRow(1);
        headerRow.font = {
          name: "Calibri",
          size: 11,
          bold: true,
          color: { argb: "FFFFFFFF" },
        };
        headerRow.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "FF0A0E1A" },
        };
        headerRow.alignment = { vertical: "middle", horizontal: "center" };
        headerRow.height = 28;

        const sampleRows = [
          {
            asin: "B0DK9HFD2S",
            sku: "TOPLOT-002",
            generateBarcode: "Yes",
            rackAddress: "RACK002",
          },
          {
            asin: "B0GGYM3WFR",
            sku: "TOPLOT-003",
            generateBarcode: "No",
            rackAddress: "RACK003",
          },
          {
            asin: "B0GGYDT9KN",
            sku: "TOPLOT-004",
            generateBarcode: "Yes",
            rackAddress: "RACK004",
          },
          {
            asin: "B0H395B1TY",
            sku: "TOPLOT-005",
            generateBarcode: "No",
            rackAddress: "RACK005",
          },
          {
            asin: "B0H9YBXF6W",
            sku: "TOPLOT-006",
            generateBarcode: "Yes",
            rackAddress: "RACK006",
          },
        ];

        sampleRows.forEach((item) => {
          const r = worksheet.addRow(item);
          r.height = 22;
          r.alignment = { vertical: "middle" };
        });

        const buffer = await workbook.xlsx.writeBuffer();
        saveAs(
          new Blob([buffer], {
            type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          }),
          "asin-import-demo-sheet.xlsx",
        );
        toast.success("ASIN Import demo sheet downloaded successfully!");
      } else {
        const worksheet = workbook.addWorksheet("Product Import");

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
        headerRow.font = {
          name: "Calibri",
          size: 11,
          bold: true,
          color: { argb: "FFFFFFFF" },
        };
        headerRow.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "FF0A0E1A" },
        };
        headerRow.alignment = { vertical: "middle", horizontal: "center" };
        headerRow.height = 28;

        const sampleRows = [
          {
            productName: "Men Casual Solid Cotton Shirt",
            masterSku: "SH-BLU-001",
            brand: "TOPLOT",
            category: "Clothing",
            subCategory: "Shirts",
            description: "100% Premium Cotton Slim Fit Shirt",
            asin: "B08F9V7XYZ",
            rackAddress: "RACK001",
            generateBarcode: "Yes",
            mrp: 899,
            hsnCode: "6205",
            gstRate: "5%",
          },
          {
            productName: "Men Slim Fit Stretchable Jeans",
            masterSku: "JN-BLK-001",
            brand: "Roadster",
            category: "Clothing",
            subCategory: "Jeans",
            description: "Comfortable stretch denim jeans",
            asin: "B09G1H2JKL",
            rackAddress: "RACK002",
            generateBarcode: "No",
            mrp: 1299,
            hsnCode: "6203",
            gstRate: "12%",
          },
        ];

        sampleRows.forEach((item) => {
          const r = worksheet.addRow(item);
          r.height = 22;
          r.alignment = { vertical: "middle" };
        });

        const buffer = await workbook.xlsx.writeBuffer();
        saveAs(
          new Blob([buffer], {
            type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          }),
          "product-import-demo-sheet.xlsx",
        );
        toast.success("Product Import demo sheet downloaded successfully!");
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to generate demo sheet");
    }
  };

  return (
    <div className="mb-6 flex flex-col gap-4 rounded-lg border border-slate-700 bg-[#0F172A] p-4 sm:p-5 xl:flex-row xl:items-center xl:justify-between shadow-sm">
      <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-4 xl:flex xl:flex-1 xl:items-center xl:gap-4">
        {/* Search */}
        <div className="relative w-full xl:max-w-xs">
          <Search
            size={18}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
          />

          <input
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder={importType === "asin" ? "Search ASIN, SKU, Rack..." : "Search Product..."}
            className="
              h-12
              w-full
              rounded-md
              border
              border-slate-700
              bg-[#111827]
              pl-11
              pr-4
              text-sm
              text-white
              outline-none
              transition
              focus:border-[#E8C16D]
            "
          />
        </div>

        {/* Status */}
        <div className="w-full xl:w-48">
          <ReactSelect
            options={statusOptions}
            value={
              statusOptions.find((option) => option.value === status) ?? statusOptions[0] ?? null
            }
            onChange={(option) => onStatusChange(option?.value ?? "")}
            height={48}
            borderColor="#334155"
            backgroundColor="#111827"
            textColor="#ffffff"
            placeholderColor="#94A3B8"
            menuBackgroundColor="#111827"
            optionHoverColor="#1E293B"
            optionSelectedTextColor="#ffffff"
          />
        </div>

        {/* Category */}
        <div className="w-full xl:w-52">
          <ReactSelect
            options={categoryOptions}
            value={
              categoryOptions.find((option) => option.value === category) ?? categoryOptions[0] ?? null
            }
            onChange={(option) => onCategoryChange(option?.value ?? "")}
            height={48}
            borderColor="#334155"
            backgroundColor="#111827"
            textColor="#ffffff"
            placeholderColor="#94A3B8"
            menuBackgroundColor="#111827"
            optionHoverColor="#1E293B"
            optionSelectedTextColor="#ffffff"
          />
        </div>

        {/* Brand */}
        <div className="w-full xl:w-52">
          <ReactSelect
            options={brandOptions}
            value={
              brandOptions.find((option) => option.value === brand) ?? brandOptions[0] ?? null
            }
            onChange={(option) => onBrandChange(option?.value ?? "")}
            height={48}
            borderColor="#334155"
            backgroundColor="#111827"
            textColor="#ffffff"
            placeholderColor="#94A3B8"
            menuBackgroundColor="#111827"
            optionHoverColor="#1E293B"
            optionSelectedTextColor="#ffffff"
          />
        </div>
      </div>

      <div className="flex flex-wrap sm:flex-nowrap items-center justify-stretch sm:justify-end gap-2.5 sm:gap-3 w-full xl:w-auto">
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept=".xlsx, .xls"
          className="hidden"
        />

        {/* Import Select Dropdown using ReactSelect UI */}
        <div className="w-full sm:w-48 flex-1 sm:flex-none">
          <ReactSelect
            options={importTypeOptions}
            value={
              importTypeOptions.find((opt) => opt.value === importType) ?? importTypeOptions[0]
            }
            onChange={(option) => handleSelectImportType(option as any)}
            height={48}
            borderColor="#E8C16D"
            backgroundColor="#E8C16D"
            textColor="#0A0E1A"
            placeholderColor="#0A0E1A"
            menuBackgroundColor="#111827"
            optionHoverColor="#1E293B"
            optionSelectedColor="#E8C16D"
            optionSelectedTextColor="#0A0E1A"
            optionTextColor="#ffffff"
            isDisabled={isImporting}
          />
        </div>

        <Button
          variant="secondary"
          fullWidth={false}
          className="h-12 flex-1 sm:flex-none"
          leftIcon={<Download size={18} />}
          onClick={handleDownloadDemoSheet}
        >
          Demo Sheet
        </Button>

        <Button
          variant="secondary"
          fullWidth={false}
          className="h-12 flex-1 sm:flex-none"
          leftIcon={<RotateCw size={18} />}
          onClick={onRefresh}
        >
          Refresh
        </Button>
      </div>
    </div>
  );
}