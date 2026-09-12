"use client";

import { Download, Search, Upload } from "lucide-react";
import ExcelJS from "exceljs";
import { saveAs } from "file-saver";
import { toast } from "sonner";

import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";

interface Props {
  search: string;
  onSearchChange: (value: string) => void;
  total: number;
  onImport: () => void;
  onGenerateSheet: () => void;
}

export default function Toolbar({
  search,
  onSearchChange,
  total,
  onImport,
  onGenerateSheet,
}: Props) {
  const handleDownloadDemoSheet = async () => {
    try {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet("Godown Inventory Sheet");

      worksheet.columns = [
        { header: "Short SKU", key: "shortSku", width: 22 },
        { header: "Barcode SKU", key: "barcodeSku", width: 25 },
        { header: "Full SKU", key: "fullSku", width: 28 },
        { header: "OrderCook SKU", key: "ordercookSku", width: 20 },
        { header: "Brand Name", key: "brandName", width: 18 },
        { header: "Color", key: "color", width: 15 },
        { header: "Size", key: "size", width: 12 },
        { header: "Title", key: "title", width: 40 },
        { header: "QTY", key: "qty", width: 12 },
        { header: "MRP", key: "mrp", width: 15 },
        { header: "Asin (Barcode)", key: "asinBarcode", width: 20 },
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
          shortSku: "SH-BLU-L",
          barcodeSku: "SHIRT-BLU-LRG-002",
          fullSku: "SHIRT-RDSTR-BLU-L",
          ordercookSku: "OC-SH-BLU-L",
          brandName: "TOPLOT",
          color: "Blue",
          size: "L",
          title: "Men Casual Solid Slim Fit Cotton Shirt",
          qty: 25,
          mrp: 899,
          asinBarcode: "B08F9V7XYZ",
        },
        {
          shortSku: "SH-RED-M",
          barcodeSku: "SHIRT-RED-MED-001",
          fullSku: "SHIRT-RDSTR-RED-M",
          ordercookSku: "OC-SH-RED-M",
          brandName: "TOPLOT",
          color: "Red",
          size: "M",
          title: "Men Casual Solid Slim Fit Cotton Shirt",
          qty: 30,
          mrp: 899,
          asinBarcode: "B08F9V7B3R",
        },
        {
          shortSku: "1005-BLACK-32",
          barcodeSku: "RDSTTRSR128132087",
          fullSku: "MY-RS-1005-Black-32",
          ordercookSku: "ORDERO026",
          brandName: "Roadster",
          color: "Black",
          size: "32",
          title: "Men Slim Fit Stretchable Denim Jeans",
          qty: 40,
          mrp: 1299,
          asinBarcode: "B09G1H2JKL",
        },
        {
          shortSku: "1005-BLACK-30",
          barcodeSku: "RDSTTRSR128132086",
          fullSku: "MY-RS-1005-Black-30",
          ordercookSku: "ORDERO025",
          brandName: "Roadster",
          color: "Black",
          size: "30",
          title: "Men Slim Fit Stretchable Denim Jeans",
          qty: 15,
          mrp: 1299,
          asinBarcode: "B09G1H2MNP",
        },
        {
          shortSku: "1004-CREAM-30",
          barcodeSku: "RDSTTRSR128132072",
          fullSku: "MY-RS-1004-Cream-30",
          ordercookSku: "ORDERO002",
          brandName: "Roadster",
          color: "Cream",
          size: "30",
          title: "Men Regular Fit Casual Chino Trousers",
          qty: 20,
          mrp: 1149,
          asinBarcode: "",
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
        "godown-inventory-demo-sheet.xlsx",
      );
      toast.success("Demo Excel sheet downloaded successfully!");
    } catch (err) {
      console.error(err);
      toast.error("Failed to generate demo sheet");
    }
  };
  return (
    <div className="flex flex-col gap-4 border border-slate-200 bg-white p-4 lg:flex-row lg:items-center lg:justify-between">
      {/* Left */}

      <div className="flex flex-1 items-center gap-3">
        <div className="relative max-w-md flex-1">
          <Search
            size={18}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
          />

          <Input
            value={search}
            placeholder="Search Short SKU / Full SKU / Barcode SKU / OrderCook SKU"
            className="pl-10"
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>
      </div>

      {/* Right */}

      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 border border-slate-200 bg-slate-50 px-4 py-3">
          <span className="text-md text-slate-500">Total</span>

          <span className="bg-[#0A0E1A] px-2 py-0.5 text-md font-semibold text-[#E8C16D]">
            {total}
          </span>
        </div>

        <Button variant="outline" onClick={onGenerateSheet}>
          Generate Sheet
        </Button>

        <Button
          variant="outline"
          onClick={handleDownloadDemoSheet}
          className="flex items-center gap-2 border-[#C89B3C]/50 text-[#C89B3C] hover:bg-[#FFF8E7] hover:border-[#C89B3C]"
        >
          <Download size={16} />
          Demo Sheet
        </Button>

        <Button onClick={onImport} className="flex items-center gap-2">
          <Upload size={16} />
          Import Excel
        </Button>
      </div>
    </div>
  );
}
