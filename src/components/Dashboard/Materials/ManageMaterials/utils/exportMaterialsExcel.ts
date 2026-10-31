import ExcelJS from "exceljs";
import { saveAs } from "file-saver";
import { toast } from "sonner";
import type { Material } from "../types/material.types";
import { MATERIAL_EXCEL_COLUMNS } from "./downloadDemoSheet";

export const exportMaterialsExcel = async (
  materialsToExport: Material[],
  isSelectedOnly = false
) => {
  try {
    if (!materialsToExport || materialsToExport.length === 0) {
      toast.error("No materials to export.");
      return;
    }

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Materials");

    worksheet.columns = MATERIAL_EXCEL_COLUMNS;

    const headerRow = worksheet.getRow(1);
    headerRow.font = {
      name: "Calibri",
      size: 11,
      bold: true,
      color: { argb: "FFE8C16D" },
    };
    headerRow.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF0A0E1A" },
    };
    headerRow.alignment = { vertical: "middle", horizontal: "center" };
    headerRow.height = 30;

    materialsToExport.forEach((material) => {
      const colorsStr = Array.isArray(material.colors)
        ? material.colors.join(", ")
        : typeof material.colors === "string"
        ? material.colors
        : "";

      const rowData = {
        sku: material.sku || material.masterSku || "",
        masterSku: material.masterSku || "",
        materialName: material.materialName || "",
        category: material.category || "",
        manufacturingGroup: material.manufacturingGroup || "",
        unit: material.unit || "Meters",
        colors: colorsStr,
        width: material.width ?? 0,
        widthRangeFrom: material.widthRangeFrom ?? 0,
        widthRangeTo: material.widthRangeTo ?? 0,
        gsm: material.gsm ?? 0,
        gsmRangeFrom: material.gsmRangeFrom ?? 0,
        gsmRangeTo: material.gsmRangeTo ?? 0,
        gstRate: material.gstRate ?? 5,
        hsnCode: material.hsnCode || "",
        brand: material.brand || "No Brand",
        less: material.less ?? 0,
        description: material.description || "",
        costApplyingMode: material.costApplyingMode || "",
        materialCost: material.materialCost ?? 0,
        mrp: String(material.mrp ?? "0"),
        salesRate: material.salesRate ?? 0,
        reorderLevelStock: material.reorderLevelStock ?? 0,
        purchaseType: material.purchaseType || "",
        isStockDetailsCompulsory: material.isStockDetailsCompulsory ? "Yes" : "No",
        issueMode: material.issueMode || "",
        consumptionMode: material.consumptionMode || "",
        isIssuable: material.isIssuable ? "Yes" : "No",
        isSellable: material.isSellable ? "Yes" : "No",
      };

      const r = worksheet.addRow(rowData);
      r.height = 24;
      r.alignment = { vertical: "middle" };
    });

    worksheet.eachRow((row, rowNumber) => {
      if (rowNumber === 1) return;
      row.eachCell((cell) => {
        cell.border = {
          top: { style: "thin", color: { argb: "FFE2E8F0" } },
          left: { style: "thin", color: { argb: "FFE2E8F0" } },
          bottom: { style: "thin", color: { argb: "FFE2E8F0" } },
          right: { style: "thin", color: { argb: "FFE2E8F0" } },
        };
        cell.font = { name: "Calibri", size: 10 };
      });
    });

    const buffer = await workbook.xlsx.writeBuffer();
    const dateStr = new Date().toISOString().slice(0, 10);
    const fileName = isSelectedOnly
      ? `materials-selected-${dateStr}.xlsx`
      : `materials-all-${dateStr}.xlsx`;

    saveAs(
      new Blob([buffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      }),
      fileName
    );

    toast.success(
      isSelectedOnly
        ? `Exported ${materialsToExport.length} selected material(s) successfully!`
        : `Exported ${materialsToExport.length} material(s) successfully!`
    );
  } catch (err) {
    console.error("Export error:", err);
    toast.error("Failed to export materials data.");
  }
};
