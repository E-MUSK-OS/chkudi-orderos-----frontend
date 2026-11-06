import ExcelJS from "exceljs";
import { saveAs } from "file-saver";
import { toast } from "sonner";
import { productService } from "@/components/Dashboard/Products/ManageProducts/services/product.service";
import { materialService } from "@/components/Dashboard/Materials/ManageMaterials/services/material.service";
import { ledgerService } from "@/components/Dashboard/Settings/ManageCompany/LedgerBook/services/ledger.service";
import { downloadBlankLedgerTemplate } from "@/components/Dashboard/Settings/ManageCompany/LedgerBook/utils/excelTemplate";
import { salariedEmployeeService } from "@/components/Dashboard/Settings/ManageCompany/SalariedEmployee/services/salariedEmployee.service";
import { downloadBlankAttendanceTemplate } from "@/components/Dashboard/Settings/ManageCompany/SalariedEmployee/utils/attendanceTemplate";
import { companyService } from "@/components/Dashboard/Settings/ManageCompany/CompanyProfile/services/company.service";
import { employeeService } from "@/components/Dashboard/Settings/ManageCompany/EmployeeProfile/services/employee.service";
import type { ProfileKey } from "../constants/uploadExcel.constants";

/** Helper to format Excel Header Row matching OrderOS dark/gold theme */
function styleHeaderRow(row: ExcelJS.Row) {
  row.font = { name: "Calibri", size: 11, bold: true, color: { argb: "FFFFFFFF" } };
  row.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF0A0E1A" } };
  row.alignment = { vertical: "middle", horizontal: "center" };
  row.height = 28;
}

/**
 * Safely parse numeric values from Excel/CSV cells.
 * Strips currency symbols (₹, Rs, $, etc.), commas, percent signs, and whitespace.
 * Returns fallback or undefined if empty/invalid to prevent NaN from corrupting payloads.
 */
export function parseNumericValue(val: any, fallback?: number): number | undefined {
  if (val === null || val === undefined) return fallback;
  if (typeof val === "number") return isNaN(val) ? fallback : val;
  const str = String(val)
    .replace(/[₹$€£,%\s]/g, "")
    .replace(/^(rs\.?|inr)\s*/i, "")
    .trim();
  if (
    !str ||
    str === "-" ||
    str === "--" ||
    str.toLowerCase() === "n/a" ||
    str.toLowerCase() === "null" ||
    str.toLowerCase() === "undefined"
  ) {
    return fallback;
  }
  const parsed = Number(str);
  return isNaN(parsed) ? fallback : parsed;
}

export function parseIntegerValue(val: any, fallback?: number): number | undefined {
  const num = parseNumericValue(val, fallback);
  return num !== undefined ? Math.round(num) : fallback;
}

export function parseBooleanValue(val: any, fallback = true): boolean {
  if (val === null || val === undefined) return fallback;
  if (typeof val === "boolean") return val;
  const str = String(val).trim().toLowerCase();
  if (str === "yes" || str === "true" || str === "1" || str === "active" || str === "y") return true;
  if (str === "no" || str === "false" || str === "0" || str === "inactive" || str === "n") return false;
  return fallback;
}

/** Helper to check if a row contains any of the provided keys */
export function hasRowField(row: Record<string, any>, ...keys: string[]): boolean {
  return keys.some((k) => k in row);
}

/** Helper to extract a trimmed non-empty string value from row matching any key */
export function getRowVal(row: Record<string, any>, ...keys: string[]): string | undefined {
  for (const k of keys) {
    if (k in row && row[k] !== undefined && row[k] !== null && String(row[k]).trim() !== "") {
      return String(row[k]).trim();
    }
  }
  return undefined;
}

/** Quote-aware CSV line tokenizer handling commas inside quotes and escaped quotes */
export function splitCsvLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === "," && !inQuotes) {
      result.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  return result;
}

/** Unified file parser for .xlsx, .xls, and .csv files returning normalized row objects */
export async function parseFileToRows(file: File): Promise<Record<string, any>[]> {
  const lowerName = file.name.toLowerCase();
  const isCsv = lowerName.endsWith(".csv");

  if (isCsv) {
    const text = await file.text();
    const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
    if (lines.length < 2) return [];

    const rawHeaders = splitCsvLine(lines[0]);
    const headers = rawHeaders.map((h) => h.toLowerCase().replace(/[^a-z0-9]/g, ""));

    const rows: Record<string, any>[] = [];
    for (let i = 1; i < lines.length; i++) {
      const vals = splitCsvLine(lines[i]);
      if (vals.every((v) => !v.trim())) continue;
      const obj: Record<string, any> = {};
      headers.forEach((h, idx) => {
        if (h) obj[h] = vals[idx] !== undefined ? vals[idx].trim() : "";
      });
      rows.push(obj);
    }
    return rows;
  }

  // Parse Excel (.xlsx, .xls) using ExcelJS
  const buffer = await file.arrayBuffer();
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(buffer);
  const worksheet = workbook.worksheets[0];
  if (!worksheet || worksheet.rowCount < 2) return [];

  let headerRowNumber = 1;
  let headers: string[] = [];

  for (let r = 1; r <= Math.min(worksheet.rowCount, 5); r++) {
    const row = worksheet.getRow(r);
    const candidateHeaders: string[] = [];
    row.eachCell({ includeEmpty: true }, (cell) => {
      candidateHeaders.push(String(cell.value || "").trim().toLowerCase().replace(/[^a-z0-9]/g, ""));
    });
    const hasMeaningful = candidateHeaders.some((h) =>
      h.includes("sku") ||
      h.includes("name") ||
      h.includes("code") ||
      h.includes("employee") ||
      h.includes("company") ||
      h.includes("ledger")
    );
    if (hasMeaningful) {
      headerRowNumber = r;
      headers = candidateHeaders;
      break;
    }
  }

  if (headers.length === 0) {
    const firstRow = worksheet.getRow(1);
    firstRow.eachCell({ includeEmpty: true }, (cell) => {
      headers.push(String(cell.value || "").trim().toLowerCase().replace(/[^a-z0-9]/g, ""));
    });
  }

  const rows: Record<string, any>[] = [];
  for (let r = headerRowNumber + 1; r <= worksheet.rowCount; r++) {
    const row = worksheet.getRow(r);
    const obj: Record<string, any> = {};
    let hasVal = false;
    headers.forEach((h, idx) => {
      if (!h) return;
      const cell = row.getCell(idx + 1);
      const cellVal = cell.value;
      let textVal = "";
      if (cellVal !== null && cellVal !== undefined) {
        if (typeof cellVal === "object" && "text" in cellVal) {
          textVal = String((cellVal as any).text || "").trim();
        } else if (typeof cellVal === "object" && "result" in cellVal) {
          textVal = String((cellVal as any).result || "").trim();
        } else {
          textVal = String(cellVal).trim();
        }
      }
      if (textVal) hasVal = true;
      obj[h] = textVal;
    });
    if (hasVal) rows.push(obj);
  }

  return rows;
}

/**
 * Download a Blank Template for the given profile
 */
export async function handleDownloadBlankTemplate(profile: ProfileKey) {
  try {
    const today = new Date().toISOString().split("T")[0];

    switch (profile) {
      case "product": {
        const workbook = new ExcelJS.Workbook();
        const sheet = workbook.addWorksheet("Products");
        sheet.columns = [
          { header: "Variant SKU*", key: "sku", width: 25 },
          { header: "Master SKU*", key: "masterSku", width: 25 },
          { header: "Product Name*", key: "productName", width: 30 },
          { header: "Category*", key: "category", width: 20 },
          { header: "Brand", key: "brand", width: 20 },
          { header: "Unit", key: "unit", width: 12 },
          { header: "Color", key: "color", width: 15 },
          { header: "Size", key: "size", width: 12 },
          { header: "Gender", key: "gender", width: 15 },
          { header: "HSN Code", key: "hsnCode", width: 18 },
          { header: "GST %", key: "gstRate", width: 12 },
          { header: "Cost", key: "cost", width: 15 },
          { header: "Sales Rate", key: "salesRate", width: 15 },
          { header: "MRP", key: "mrp", width: 15 },
          { header: "Opening Stock", key: "openingStock", width: 16 },
          { header: "Opening Rate", key: "openingRate", width: 16 },
          { header: "Rack Address", key: "rackAddress", width: 20 },
        ];
        styleHeaderRow(sheet.getRow(1));

        const r1 = sheet.addRow({
          sku: "SHIRT-SLM-BLU-M",
          masterSku: "SHIRT-SLM-BLU",
          productName: "Men Slim Fit Cotton Shirt",
          category: "Apparel",
          brand: "OrderOS Brand",
          unit: "Pcs",
          color: "Blue",
          size: "M",
          gender: "Men",
          hsnCode: "620520",
          gstRate: 5,
          cost: 350,
          salesRate: 799,
          mrp: 1299,
          openingStock: 100,
          openingRate: 350,
          rackAddress: "RACK-A1-01",
        });
        r1.height = 22;

        const buffer = await workbook.xlsx.writeBuffer();
        saveAs(
          new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }),
          `Product_Blank_Template_${today}.xlsx`
        );
        toast.success("Product template downloaded successfully!");
        break;
      }

      case "material": {
        const workbook = new ExcelJS.Workbook();
        const sheet = workbook.addWorksheet("Materials");
        sheet.columns = [
          { header: "Material SKU*", key: "sku", width: 25 },
          { header: "Master SKU*", key: "masterSku", width: 25 },
          { header: "Material Name*", key: "materialName", width: 30 },
          { header: "Category*", key: "category", width: 20 },
          { header: "Sub Category", key: "subCategory", width: 20 },
          { header: "Brand", key: "brand", width: 20 },
          { header: "Unit", key: "unit", width: 12 },
          { header: "Width", key: "width", width: 12 },
          { header: "GSM", key: "gsm", width: 12 },
          { header: "HSN Code", key: "hsnCode", width: 18 },
          { header: "GST %", key: "gstRate", width: 12 },
          { header: "Material Cost", key: "materialCost", width: 15 },
          { header: "Sales Rate", key: "salesRate", width: 15 },
          { header: "Opening Stock", key: "openingStock", width: 16 },
          { header: "Opening Rate", key: "openingRate", width: 16 },
          { header: "Rack Address", key: "rackAddress", width: 20 },
        ];
        styleHeaderRow(sheet.getRow(1));

        const r1 = sheet.addRow({
          sku: "FAB-COT-WHT-01",
          masterSku: "FAB-COT-WHT",
          materialName: "Pure Cotton 60s White Fabric",
          category: "Fabric",
          subCategory: "Cotton",
          brand: "Raymond",
          unit: "Mtr",
          width: 58,
          gsm: 140,
          hsnCode: "520811",
          gstRate: 5,
          materialCost: 120,
          salesRate: 180,
          openingStock: 500,
          openingRate: 120,
          rackAddress: "MAT-RACK-01",
        });
        r1.height = 22;

        const buffer = await workbook.xlsx.writeBuffer();
        saveAs(
          new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }),
          `Material_Blank_Template_${today}.xlsx`
        );
        toast.success("Material template downloaded successfully!");
        break;
      }

      case "ledger": {
        downloadBlankLedgerTemplate();
        toast.success("Ledger Book template downloaded successfully!");
        break;
      }

      case "salaried": {
        downloadBlankAttendanceTemplate();
        toast.success("Attendance template downloaded successfully!");
        break;
      }

      case "company": {
        const workbook = new ExcelJS.Workbook();
        const sheet = workbook.addWorksheet("Companies");
        sheet.columns = [
          { header: "Company Code*", key: "companyCode", width: 18 },
          { header: "Company Name*", key: "companyName", width: 30 },
          { header: "Owner Name*", key: "ownerName", width: 25 },
          { header: "GST Number*", key: "gstNumber", width: 20 },
          { header: "PAN Number", key: "panNumber", width: 18 },
          { header: "Email", key: "email", width: 25 },
          { header: "Phone", key: "phone", width: 18 },
          { header: "Address Line 1", key: "addressLine1", width: 30 },
          { header: "City", key: "city", width: 18 },
          { header: "State", key: "state", width: 18 },
          { header: "Pincode", key: "pincode", width: 14 },
          { header: "Bank Name", key: "bankName", width: 22 },
          { header: "Account Number", key: "accountNumber", width: 22 },
          { header: "IFSC Code", key: "ifscCode", width: 16 },
        ];
        styleHeaderRow(sheet.getRow(1));

        const r1 = sheet.addRow({
          companyCode: "CMP-001",
          companyName: "Acme Enterprises Pvt Ltd",
          ownerName: "Rajesh Kumar",
          gstNumber: "24AAACA1234A1Z5",
          panNumber: "AAACA1234A",
          email: "contact@acme.com",
          phone: "9876543210",
          addressLine1: "Plot 12, GIDC Estate",
          city: "Ahmedabad",
          state: "Gujarat",
          pincode: "380001",
          bankName: "HDFC Bank",
          accountNumber: "50200012345678",
          ifscCode: "HDFC0000123",
        });
        r1.height = 22;

        const buffer = await workbook.xlsx.writeBuffer();
        saveAs(
          new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }),
          `Company_Blank_Template_${today}.xlsx`
        );
        toast.success("Company template downloaded successfully!");
        break;
      }

      case "employee": {
        const workbook = new ExcelJS.Workbook();
        const sheet = workbook.addWorksheet("Employees");
        sheet.columns = [
          { header: "Employee ID*", key: "employeeId", width: 18 },
          { header: "Machine Code", key: "machineCode", width: 18 },
          { header: "Full Name*", key: "fullName", width: 25 },
          { header: "Gender", key: "gender", width: 12 },
          { header: "Department", key: "department", width: 20 },
          { header: "Designation", key: "designation", width: 20 },
          { header: "Mobile No*", key: "mobileNumber", width: 18 },
          { header: "Email", key: "email", width: 25 },
          { header: "Aadhar No", key: "aadharCardNumber", width: 20 },
          { header: "PAN No", key: "panCardNumber", width: 18 },
          { header: "Bank Name", key: "bankName", width: 22 },
          { header: "Account Number", key: "bankAccountNumber", width: 22 },
          { header: "IFSC Code", key: "ifscCode", width: 16 },
        ];
        styleHeaderRow(sheet.getRow(1));

        const r1 = sheet.addRow({
          employeeId: "EMP-001",
          machineCode: "MC-101",
          fullName: "Suresh Sharma",
          gender: "Male",
          department: "Production",
          designation: "Operator",
          mobileNumber: "9898001122",
          email: "suresh@company.com",
          aadharCardNumber: "123456789012",
          panCardNumber: "ABCDE1234F",
          bankName: "State Bank of India",
          accountNumber: "20123456789",
          ifscCode: "SBIN0001234",
        });
        r1.height = 22;

        const buffer = await workbook.xlsx.writeBuffer();
        saveAs(
          new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }),
          `Employee_Blank_Template_${today}.xlsx`
        );
        toast.success("Employee template downloaded successfully!");
        break;
      }
    }
  } catch (err: any) {
    console.error(err);
    toast.error(err.message || "Failed to download blank template.");
  }
}

/**
 * Download Filtered Data for Update sections with custom selected fields
 */
export async function handleDownloadFilteredData({
  profile,
  sectionId,
  selectedFields,
  filters,
}: {
  profile: ProfileKey;
  sectionId: string;
  selectedFields: string[];
  filters: Record<string, string | string[]>;
}) {
  try {
    const isRackAddress = sectionId.includes("rack-address");
    if (!isRackAddress && selectedFields.length === 0) {
      toast.warning("Please select at least one field to export.");
      return;
    }

    const today = new Date().toISOString().split("T")[0];
    const workbook = new ExcelJS.Workbook();
    const sheetName = `${profile.charAt(0).toUpperCase() + profile.slice(1)}_Update`;
    const sheet = workbook.addWorksheet(sheetName);

    const idColumnMap: Record<ProfileKey, { header: string; key: string; width: number }> = {
      product: { header: "SKU*", key: "sku", width: 25 },
      material: { header: "Material SKU*", key: "sku", width: 25 },
      company: { header: "Company Code*", key: "companyCode", width: 20 },
      ledger: { header: "Ledger Name*", key: "ledgerName", width: 25 },
      employee: { header: "Employee ID*", key: "employeeId", width: 20 },
      salaried: { header: "Employee ID*", key: "employeeId", width: 20 },
    };

    const idCol = idColumnMap[profile];
    const columns: Partial<ExcelJS.Column>[] = [idCol];

    if (isRackAddress) {
      columns.push(
        { header: "Master SKU", key: "masterSku", width: 25 },
        { header: "Rack Address", key: "rackAddress", width: 22 }
      );
    } else {
      selectedFields.forEach((field) => {
        if (field.toLowerCase() === idCol.header.toLowerCase().replace("*", "")) return;
        columns.push({
          header: field,
          key: field.toLowerCase().replace(/[^a-z0-9]/g, "_"),
          width: Math.max(field.length + 6, 18),
        });
      });
    }

    sheet.columns = columns as ExcelJS.Column[];
    styleHeaderRow(sheet.getRow(1));

    let rowCount = 0;
    try {
      if (profile === "product") {
        const res = await productService.getAll();
        let items: any[] = res?.data || [];

        // Category multi-select or single
        const selectedCategories = Array.isArray(filters.category)
          ? filters.category
          : typeof filters.category === "string" && filters.category !== "All"
          ? filters.category.split(",").map((s) => s.trim()).filter(Boolean)
          : [];
        if (selectedCategories.length > 0 && !selectedCategories.includes("All")) {
          const catSet = new Set(selectedCategories.map((c) => c.toLowerCase()));
          items = items.filter((p: any) => catSet.has(String(p.category || "").toLowerCase()));
        }

        // Master SKU multi-select or single
        const selectedMasterSkus = Array.isArray(filters.masterSku)
          ? filters.masterSku
          : typeof filters.masterSku === "string" && filters.masterSku !== "All"
          ? filters.masterSku.split(",").map((s) => s.trim()).filter(Boolean)
          : [];
        if (selectedMasterSkus.length > 0 && !selectedMasterSkus.includes("All")) {
          const masterSet = new Set(selectedMasterSkus.map((m) => m.toLowerCase()));
          items = items.filter((p: any) => masterSet.has(String(p.masterSku || "").toLowerCase()));
        }

        // Product filter (All, ACTIVE, INACTIVE, or specific product)
        if (filters.product && filters.product !== "All") {
          const fp = String(filters.product);
          if (fp === "ACTIVE") {
            items = items.filter((p: any) => p.isActive !== false);
          } else if (fp === "INACTIVE") {
            items = items.filter((p: any) => p.isActive === false);
          } else {
            const fpLower = fp.toLowerCase();
            items = items.filter((p: any) =>
              String(p.masterSku || "").toLowerCase() === fpLower ||
              String(p.sku || "").toLowerCase() === fpLower ||
              String(p.productName || "").toLowerCase() === fpLower ||
              String(p.id || "").toLowerCase() === fpLower
            );
          }
        }
        if (filters.status && filters.status !== "All") {
          if (filters.status === "ACTIVE") items = items.filter((p: any) => p.isActive !== false);
          else if (filters.status === "INACTIVE") items = items.filter((p: any) => p.isActive === false);
        }
        items.slice(0, 50).forEach((p: any) => {
          const row = sheet.addRow({
            sku: p.sku || p.masterSku || "",
            master_sku: p.masterSku || "",
            name: p.productName || "",
            category: p.category || "",
            unit: p.unit || "",
            gender: p.gender || "",
            hsn_code: p.hsnCode || "",
            gst__: p.gstRate || 0,
            brand_name: p.brand || "",
            active: p.isActive !== false ? "Yes" : "No",
            opening_stock: p.openingStock || 0,
            opening_rate: p.productCost || 0,
            cost: p.productCost || 0,
            sales_rate: p.salesRate || 0,
            mrp: p.mrp || 0,
            rack_address: p.rackAddress || "",
            rackAddress: p.rackAddress || "",
          });
          row.height = 20;
          rowCount++;
        });
      } else if (profile === "material") {
        const res = await materialService.getAll();
        let items: any[] = res?.data || [];

        // Category multi-select or single
        const selectedCategories = Array.isArray(filters.category)
          ? filters.category
          : typeof filters.category === "string" && filters.category !== "All"
          ? filters.category.split(",").map((s) => s.trim()).filter(Boolean)
          : [];
        if (selectedCategories.length > 0 && !selectedCategories.includes("All")) {
          const catSet = new Set(selectedCategories.map((c) => c.toLowerCase()));
          items = items.filter((m: any) => catSet.has(String(m.category || "").toLowerCase()));
        }

        // Master SKU multi-select or single
        const selectedMasterSkus = Array.isArray(filters.masterSku)
          ? filters.masterSku
          : typeof filters.masterSku === "string" && filters.masterSku !== "All"
          ? filters.masterSku.split(",").map((s) => s.trim()).filter(Boolean)
          : [];
        if (selectedMasterSkus.length > 0 && !selectedMasterSkus.includes("All")) {
          const masterSet = new Set(selectedMasterSkus.map((m) => m.toLowerCase()));
          items = items.filter((m: any) => masterSet.has(String(m.masterSku || "").toLowerCase()));
        }

        // Material filter (All, ACTIVE, INACTIVE, or specific material)
        if (filters.material && filters.material !== "All") {
          const fm = String(filters.material);
          if (fm === "ACTIVE") {
            items = items.filter((m: any) => m.isActive !== false);
          } else if (fm === "INACTIVE") {
            items = items.filter((m: any) => m.isActive === false);
          } else {
            const fmLower = fm.toLowerCase();
            items = items.filter((m: any) =>
              String(m.masterSku || "").toLowerCase() === fmLower ||
              String(m.sku || "").toLowerCase() === fmLower ||
              String(m.materialName || "").toLowerCase() === fmLower ||
              String(m.id || "").toLowerCase() === fmLower
            );
          }
        }
        if (filters.status && filters.status !== "All") {
          if (filters.status === "ACTIVE") items = items.filter((m: any) => m.isActive !== false);
          else if (filters.status === "INACTIVE") items = items.filter((m: any) => m.isActive === false);
        }
        items.slice(0, 50).forEach((m: any) => {
          const row = sheet.addRow({
            sku: m.sku || m.masterSku || "",
            master_sku: m.masterSku || "",
            material_name: m.materialName || "",
            category: m.category || "",
            unit: m.unit || "",
            brand_name: m.brand || "",
            active: m.isActive !== false ? "Yes" : "No",
            opening_stock: m.openingStock || 0,
            opening_rate: m.materialCost || 0,
            material_cost: m.materialCost || 0,
            sales_rate: m.salesRate || 0,
            rack_address: m.rackAddress || "",
            rackAddress: m.rackAddress || "",
          });
          row.height = 20;
          rowCount++;
        });
      } else if (profile === "company") {
        const res = await companyService.getCompanies();
        let items: any[] = res?.data || [];
        if (filters.company && filters.company !== "All") {
          const fc = String(filters.company).toLowerCase();
          items = items.filter((c: any) =>
            String(c.companyCode || "").toLowerCase() === fc ||
            String(c.companyName || "").toLowerCase() === fc ||
            String(c.id || "").toLowerCase() === fc
          );
        }
        if (filters.state && filters.state !== "All") {
          items = items.filter((c: any) => String(c.state || "").toLowerCase() === String(filters.state).toLowerCase());
        }
        if (filters.status && filters.status !== "All") {
          if (filters.status === "ACTIVE") items = items.filter((c: any) => c.isActive !== false);
          else if (filters.status === "INACTIVE") items = items.filter((c: any) => c.isActive === false);
        }
        items.slice(0, 50).forEach((c: any) => {
          const row = sheet.addRow({
            companyCode: c.companyCode || "",
            company_name: c.companyName || "",
            owner_name: c.ownerName || "",
            gstin: c.gstNumber || "",
            pan_number: c.panNumber || "",
            email: c.email || "",
            phone: c.phone || "",
            city: c.city || "",
            state: c.state || "",
            bank_name: c.bankName || "",
            account_number: c.accountNumber || "",
            ifsc_code: c.ifscCode || "",
          });
          row.height = 20;
          rowCount++;
        });
      } else if (profile === "employee") {
        const res = await employeeService.getEmployees({ pageSize: 500 });
        let items: any[] = res?.data || [];
        if (filters.department && filters.department !== "All") {
          items = items.filter((e: any) => String(e.department || "").toLowerCase() === String(filters.department).toLowerCase());
        }
        if (filters.employee && filters.employee !== "All") {
          const fe = String(filters.employee).toLowerCase();
          items = items.filter((e: any) =>
            String(e.employeeId || "").toLowerCase() === fe ||
            String(e.fullName || "").toLowerCase() === fe ||
            String(e.id || "").toLowerCase() === fe
          );
        }
        if (filters.status && filters.status !== "All") {
          if (filters.status === "ACTIVE") items = items.filter((e: any) => e.isActive !== false);
          else if (filters.status === "INACTIVE") items = items.filter((e: any) => e.isActive === false);
        }
        items.slice(0, 50).forEach((e: any) => {
          const row = sheet.addRow({
            employeeId: e.employeeId || "",
            machine_code: e.machineCode || "",
            full_name: e.fullName || "",
            gender: e.gender || "",
            department: e.department || "",
            designation: e.designation || "",
            mobile_no: e.contactNo || "",
            email: e.email || "",
            basic_salary: e.basicSalary || 0,
          });
          row.height = 20;
          rowCount++;
        });
      } else if (profile === "ledger") {
        const res = await ledgerService.getLedgers({ pageSize: 500 });
        let items: any[] = res?.data || [];
        if (filters.accountHead && filters.accountHead !== "All") {
          items = items.filter((l: any) => String(l.accountHead || "").toLowerCase() === String(filters.accountHead).toLowerCase());
        }
        if (filters.status && filters.status !== "All") {
          if (filters.status === "ACTIVE") items = items.filter((l: any) => l.isActive !== false);
          else if (filters.status === "INACTIVE") items = items.filter((l: any) => l.isActive === false);
        }
        items.slice(0, 50).forEach((l: any) => {
          const row = sheet.addRow({
            ledgerName: l.partyName || "",
            account_code: l.accountCode || "",
            account_head: l.accountHead || "",
            gstin: l.gstin || "",
            phone: l.phone || "",
            opening_balance: l.openingBalance || 0,
            credit_limit: l.creditLimit || 0,
          });
          row.height = 20;
          rowCount++;
        });
      } else if (profile === "salaried") {
        const res = await salariedEmployeeService.getSalariedEmployees({ pageSize: 500 });
        let items: any[] = res?.data || [];
        if (filters.department && filters.department !== "All") {
          items = items.filter((s: any) => String(s.department || "").toLowerCase() === String(filters.department).toLowerCase());
        }
        if (filters.employee && filters.employee !== "All") {
          const fe = String(filters.employee).toLowerCase();
          items = items.filter((s: any) =>
            String(s.employeeId || "").toLowerCase() === fe ||
            String(s.employeeName || "").toLowerCase() === fe ||
            String(s.id || "").toLowerCase() === fe
          );
        }
        const selectedMonth = filters.month && filters.month !== "All" ? filters.month : "Current Month";
        items.slice(0, 50).forEach((s: any) => {
          const row = sheet.addRow({
            employeeId: s.employeeId || "",
            employee_name: s.employeeName || "",
            department: s.department || "",
            basic_salary: s.basicSalary || 0,
            current_month: selectedMonth,
            absent_hours: 0,
            overtime_hours: 0,
          });
          row.height = 20;
          rowCount++;
        });
      }
    } catch (_) {
      // Fallback if network or offline
    }

    if (rowCount === 0) {
      const sampleRow: Record<string, any> = { [idCol.key]: "SAMPLE-01" };
      columns.forEach((col) => {
        if (col.key && col.key !== idCol.key) sampleRow[col.key] = "-";
      });
      const r = sheet.addRow(sampleRow);
      r.height = 20;
    }

    const buffer = await workbook.xlsx.writeBuffer();
    saveAs(
      new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }),
      `${sheetName}_${today}.xlsx`
    );
    toast.success(`${profile.toUpperCase()} update sheet downloaded successfully!`);
  } catch (err: any) {
    console.error(err);
    toast.error(err.message || "Failed to download update sheet.");
  }
}

/**
 * Helper to create or update Products from parsed Excel / CSV rows.
 * Resiliently handles variant SKUs, master SKUs, colors, sizes, attributes, pricing and stock.
 */
export async function handleCreateOrUpdateProductsFromRows(
  rows: Record<string, any>[]
): Promise<{ importedCount: number; updatedCount: number; errors: string[] }> {
  if (rows.length === 0) {
    throw new Error("No data rows found in the uploaded product file.");
  }

  let existingProducts: any[] = [];
  try {
    const res = await productService.getAll();
    existingProducts = res?.data || [];
  } catch (_) {}

  // Group rows by masterSku or product identifier
  const groupedProducts = new Map<string, Record<string, any>[]>();

  for (const row of rows) {
    const variantSku = String(row["variantsku"] || row["sku"] || "").trim();
    let masterSku = String(row["mastersku"] || "").trim();
    if (!masterSku && variantSku) {
      const lastDash = variantSku.lastIndexOf("-");
      masterSku = lastDash > 0 ? variantSku.slice(0, lastDash) : variantSku;
    }
    const groupKey = masterSku || variantSku || String(row["productname"] || row["name"] || "").trim();
    if (!groupKey) continue;

    if (!groupedProducts.has(groupKey)) {
      groupedProducts.set(groupKey, []);
    }
    groupedProducts.get(groupKey)!.push(row);
  }

  let importedCount = 0;
  let updatedCount = 0;
  const errors: string[] = [];

  for (const [groupKey, groupRows] of groupedProducts.entries()) {
    try {
      const firstRow = groupRows[0];
      const masterSku = String(firstRow["mastersku"] || groupKey).trim();
      const variantSku = String(firstRow["variantsku"] || firstRow["sku"] || masterSku).trim();
      const rawName = firstRow["productname"] || firstRow["name"] || firstRow["itemname"];
      const productName = rawName ? String(rawName).trim() : "";

      // Collect all unique colors and sizes across the group rows
      const colors = Array.from(
        new Set(
          groupRows
            .map((r) => String(r["color"] || r["colour"] || "").trim())
            .filter(Boolean)
        )
      );

      const sizes = Array.from(
        new Set(
          groupRows
            .map((r) => String(r["size"] || "").trim())
            .filter(Boolean)
        )
      );

      const existing = existingProducts.find((p) =>
        (masterSku && p.masterSku && p.masterSku.toLowerCase() === masterSku.toLowerCase()) ||
        (masterSku && p.sku && p.sku.toLowerCase() === masterSku.toLowerCase()) ||
        (variantSku && p.sku && p.sku.toLowerCase() === variantSku.toLowerCase()) ||
        (productName && p.productName && p.productName.toLowerCase() === productName.toLowerCase())
      );

      if (existing) {
        // UPDATE EXISTING: Preserve unmentioned fields
        const updatePayload: any = {
          productName: productName || existing.productName,
          masterSku: masterSku || existing.masterSku,
          category: getRowVal(firstRow, "category") ?? existing.category,
          brand: getRowVal(firstRow, "brand", "brandname") ?? existing.brand,
          unit: getRowVal(firstRow, "unit", "uom") ?? existing.unit,
          colors: colors.length > 0 ? colors : existing.colors,
          sizeList: sizes.length > 0 ? sizes.join(", ") : existing.sizeList,
          gender: getRowVal(firstRow, "gender") ?? existing.gender,
          hsnCode: getRowVal(firstRow, "hsncode", "hsn") ?? existing.hsnCode,
          gstRate: hasRowField(firstRow, "gstrate", "gst")
            ? parseNumericValue(firstRow["gstrate"] ?? firstRow["gst"], existing.gstRate)
            : existing.gstRate,
          productCost: hasRowField(firstRow, "cost", "productcost", "openingrate")
            ? parseNumericValue(firstRow["cost"] ?? firstRow["productcost"] ?? firstRow["openingrate"], existing.productCost)
            : existing.productCost,
          salesRate: hasRowField(firstRow, "salesrate", "rate")
            ? parseNumericValue(firstRow["salesrate"] ?? firstRow["rate"], existing.salesRate)
            : existing.salesRate,
          mrp: getRowVal(firstRow, "mrp") ?? existing.mrp,
          openingStock: hasRowField(firstRow, "openingstock", "stock", "qty")
            ? parseIntegerValue(firstRow["openingstock"] ?? firstRow["stock"] ?? firstRow["qty"], existing.openingStock)
            : existing.openingStock,
          rackAddress: getRowVal(firstRow, "rackaddress", "rack") ?? existing.rackAddress,
          asin: getRowVal(firstRow, "asin") ?? existing.asin,
          myntraSku: getRowVal(firstRow, "myntrasku", "myntra") ?? existing.myntraSku,
          fsnCode: getRowVal(firstRow, "fsncode", "fsn") ?? existing.fsnCode,
          isActive: hasRowField(firstRow, "active", "isactive")
            ? parseBooleanValue(firstRow["active"] ?? firstRow["isactive"], existing.isActive)
            : existing.isActive,
        };
        await productService.update(existing.id, updatePayload);
        updatedCount++;
      } else {
        // CREATE NEW PRODUCT
        const attributes: Array<{ attributeName: string; attributeValue?: string }> = [];
        if (colors.length > 0) {
          attributes.push({ attributeName: "Colour", attributeValue: colors.join(", ") });
        }
        if (sizes.length > 0) {
          attributes.push({ attributeName: "Size", attributeValue: sizes.join(", ") });
        }
        const genderVal = getRowVal(firstRow, "gender");
        if (genderVal) {
          attributes.push({ attributeName: "Gender", attributeValue: genderVal });
        }

        const createPayload: any = {
          productName: productName || masterSku,
          masterSku,
          sku: variantSku || masterSku,
          category: getRowVal(firstRow, "category") || "General",
          brand: getRowVal(firstRow, "brand", "brandname") || undefined,
          unit: getRowVal(firstRow, "unit", "uom") || "Pcs",
          colors: colors.length > 0 ? colors : undefined,
          sizeList: sizes.length > 0 ? sizes.join(", ") : undefined,
          gender: genderVal || undefined,
          hsnCode: getRowVal(firstRow, "hsncode", "hsn") || undefined,
          gstRate: parseNumericValue(firstRow["gstrate"] ?? firstRow["gst"]),
          productCost: parseNumericValue(firstRow["cost"] ?? firstRow["productcost"] ?? firstRow["openingrate"]),
          salesRate: parseNumericValue(firstRow["salesrate"] ?? firstRow["rate"]),
          mrp: getRowVal(firstRow, "mrp") || undefined,
          openingStock: parseIntegerValue(firstRow["openingstock"] ?? firstRow["stock"] ?? firstRow["qty"], 0),
          rackAddress: getRowVal(firstRow, "rackaddress", "rack") || undefined,
          asin: getRowVal(firstRow, "asin") || undefined,
          myntraSku: getRowVal(firstRow, "myntrasku", "myntra") || undefined,
          fsnCode: getRowVal(firstRow, "fsncode", "fsn") || undefined,
          attributes: attributes.length > 0 ? attributes : undefined,
          isActive: hasRowField(firstRow, "active", "isactive")
            ? parseBooleanValue(firstRow["active"] ?? firstRow["isactive"], true)
            : true,
        };
        await productService.create(createPayload);
        importedCount++;
      }
    } catch (err: any) {
      errors.push(`${groupKey}: ${err.message || "Failed to process"}`);
    }
  }

  return { importedCount, updatedCount, errors };
}

/**
 * Helper to create or update Materials from parsed Excel / CSV rows.
 * Resiliently handles missing optional fields, brand defaults, units, pricing and rack address.
 */
export async function handleCreateOrUpdateMaterialsFromRows(
  rows: Record<string, any>[]
): Promise<{ importedCount: number; updatedCount: number; errors: string[] }> {
  if (rows.length === 0) {
    throw new Error("No data rows found in the uploaded material file.");
  }

  let existingMaterials: any[] = [];
  try {
    const res = await materialService.getAll();
    existingMaterials = res?.data || [];
  } catch (_) {}

  let importedCount = 0;
  let updatedCount = 0;
  const errors: string[] = [];

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const rowNum = i + 2;

    const sku = String(row["sku"] || row["materialsku"] || "").trim();
    let masterSku = String(row["mastersku"] || "").trim();
    if (!masterSku && sku) {
      const lastDash = sku.lastIndexOf("-");
      masterSku = lastDash > 0 ? sku.slice(0, lastDash) : sku;
    }
    const rawName = row["materialname"] || row["name"] || row["itemname"];
    const materialName = rawName ? String(rawName).trim() : (masterSku || sku);

    if (!sku && !masterSku && !materialName) {
      continue;
    }

    const existing = existingMaterials.find((m) =>
      (sku && m.sku && m.sku.toLowerCase() === sku.toLowerCase()) ||
      (masterSku && m.masterSku && m.masterSku.toLowerCase() === masterSku.toLowerCase()) ||
      (materialName && m.materialName && m.materialName.toLowerCase() === materialName.toLowerCase())
    );

    if (existing) {
      // UPDATE EXISTING: Preserve untouched fields
      const updatePayload: any = {
        materialName: materialName || existing.materialName,
        masterSku: masterSku || existing.masterSku,
        sku: sku || existing.sku,
        category: getRowVal(row, "category") ?? existing.category,
        subCategory: getRowVal(row, "subcategory") ?? existing.subCategory,
        brand: getRowVal(row, "brand") ?? existing.brand,
        unit: getRowVal(row, "unit") ?? existing.unit,
        manufacturingGroup: getRowVal(row, "manufacturinggroup") ?? existing.manufacturingGroup,
        costApplyingMode: getRowVal(row, "costapplyingmode") ?? existing.costApplyingMode,
        width: hasRowField(row, "width") ? parseNumericValue(row["width"], existing.width) : existing.width,
        gsm: hasRowField(row, "gsm") ? parseNumericValue(row["gsm"], existing.gsm) : existing.gsm,
        hsnCode: getRowVal(row, "hsncode", "hsn") ?? existing.hsnCode,
        gstRate: hasRowField(row, "gstrate", "gst")
          ? parseNumericValue(row["gstrate"] ?? row["gst"], existing.gstRate)
          : existing.gstRate,
        materialCost: hasRowField(row, "materialcost", "cost", "openingrate")
          ? parseNumericValue(row["materialcost"] ?? row["cost"] ?? row["openingrate"], existing.materialCost)
          : existing.materialCost,
        salesRate: hasRowField(row, "salesrate", "rate")
          ? parseNumericValue(row["salesrate"] ?? row["rate"], existing.salesRate)
          : existing.salesRate,
        openingStock: hasRowField(row, "openingstock", "stock", "qty")
          ? parseIntegerValue(row["openingstock"] ?? row["stock"] ?? row["qty"], existing.openingStock)
          : existing.openingStock,
        rackAddress: getRowVal(row, "rackaddress", "rack") ?? existing.rackAddress,
        isActive: hasRowField(row, "active", "isactive")
          ? parseBooleanValue(row["active"] ?? row["isactive"], existing.isActive)
          : existing.isActive,
      };

      try {
        await materialService.update(existing.id, updatePayload);
        updatedCount++;
      } catch (err: any) {
        errors.push(`Row ${rowNum} (${sku || materialName}): ${err.message || "Failed to update"}`);
      }
    } else {
      // CREATE NEW MATERIAL
      const createPayload: any = {
        materialName: materialName || masterSku || sku,
        masterSku: masterSku || sku,
        sku: sku || masterSku,
        category: getRowVal(row, "category") || "Fabric",
        subCategory: getRowVal(row, "subcategory") || undefined,
        brand: getRowVal(row, "brand") || undefined,
        unit: getRowVal(row, "unit") || "Mtr",
        manufacturingGroup: getRowVal(row, "manufacturinggroup") || "General",
        costApplyingMode: getRowVal(row, "costapplyingmode") || "FIFO",
        width: parseNumericValue(row["width"]),
        gsm: parseNumericValue(row["gsm"]),
        hsnCode: getRowVal(row, "hsncode", "hsn") || undefined,
        gstRate: parseNumericValue(row["gstrate"] ?? row["gst"]),
        materialCost: parseNumericValue(row["materialcost"] ?? row["cost"] ?? row["openingrate"]),
        salesRate: parseNumericValue(row["salesrate"] ?? row["rate"]),
        openingStock: parseIntegerValue(row["openingstock"] ?? row["stock"] ?? row["qty"], 0),
        rackAddress: getRowVal(row, "rackaddress", "rack") || undefined,
        isActive: hasRowField(row, "active", "isactive")
          ? parseBooleanValue(row["active"] ?? row["isactive"], true)
          : true,
      };

      try {
        await materialService.create(createPayload);
        importedCount++;
      } catch (err: any) {
        errors.push(`Row ${rowNum} (${sku || materialName}): ${err.message || "Failed to create"}`);
      }
    }
  }

  return { importedCount, updatedCount, errors };
}

/**
 * Handle File Upload with full validation and support for ADD & UPDATE across all 6 profiles
 */
export async function handleUploadFile({
  profile,
  sectionId,
  file,
}: {
  profile: ProfileKey;
  sectionId: string;
  file: File;
}): Promise<{ success: boolean; message: string }> {
  // Edge Case 1: Null or empty file check
  if (!file) {
    throw new Error("No file selected.");
  }

  // Edge Case 2: Zero byte empty file check
  if (file.size === 0) {
    throw new Error("The uploaded file is empty (0 bytes).");
  }

  // Edge Case 3: File size limit check (25MB)
  if (file.size > 25 * 1024 * 1024) {
    throw new Error("File exceeds maximum allowable size of 25MB.");
  }

  // Edge Case 4: File extension validation
  const lowerName = file.name.toLowerCase();
  const isExcel = lowerName.endsWith(".xlsx") || lowerName.endsWith(".xls");
  const isCsv = lowerName.endsWith(".csv");

  if (!isExcel && !isCsv) {
    throw new Error("Invalid file format. Please upload an Excel (.xlsx, .xls) or CSV (.csv) file.");
  }

  switch (profile) {
    case "product": {
      // If it's the Create section, directly use the row parser & creator
      if (sectionId === "product-create") {
        const rows = await parseFileToRows(file);
        const { importedCount, updatedCount, errors } = await handleCreateOrUpdateProductsFromRows(rows);
        if (importedCount === 0 && updatedCount === 0 && errors.length > 0) {
          throw new Error(`Failed to create products: ${errors[0]}`);
        }
        let message = "";
        if (importedCount > 0 && updatedCount > 0) {
          message = `Successfully created ${importedCount} new product(s) and updated ${updatedCount} existing product(s).`;
        } else if (importedCount > 0) {
          message = `Successfully created ${importedCount} new product(s).`;
        } else if (updatedCount > 0) {
          message = `Successfully updated ${updatedCount} existing product(s).`;
        } else {
          message = "No product rows were processed.";
        }
        return { success: true, message };
      }

      // For update sections: first try importExcel
      try {
        const res = await productService.importExcel(file);
        // If server returns message indicating missing variants or 0 updated
        if (
          res &&
          typeof res.message === "string" &&
          (res.message.includes("None of the") ||
            res.message.includes("Only existing variant SKUs can be updated") ||
            res.message.includes("does not exist in database"))
        ) {
          // Fallback to row parser & creator so new records are created
          const rows = await parseFileToRows(file);
          const { importedCount, updatedCount } = await handleCreateOrUpdateProductsFromRows(rows);
          return {
            success: true,
            message: `Successfully processed ${importedCount + updatedCount} product record(s).`,
          };
        }
        return {
          success: res.success !== false,
          message: res.message || "Products imported/updated successfully!",
        };
      } catch (err: any) {
        const errMsg = err.response?.data?.message || err.message || "";
        if (
          errMsg.includes("None of the") ||
          errMsg.includes("Only existing variant SKUs can be updated") ||
          errMsg.includes("does not exist in database")
        ) {
          // Gracefully fallback to creating/updating the missing records!
          const rows = await parseFileToRows(file);
          const { importedCount, updatedCount, errors } = await handleCreateOrUpdateProductsFromRows(rows);
          if (importedCount > 0 || updatedCount > 0) {
            return {
              success: true,
              message: `Successfully processed ${importedCount + updatedCount} product record(s).`,
            };
          }
          if (errors.length > 0) throw new Error(errors[0]);
        }
        throw new Error(errMsg || "Failed to process product Excel file.");
      }
    }

    case "material": {
      // If it's the Create section, directly use the row parser & creator
      if (sectionId === "material-create") {
        const rows = await parseFileToRows(file);
        const { importedCount, updatedCount, errors } = await handleCreateOrUpdateMaterialsFromRows(rows);
        if (importedCount === 0 && updatedCount === 0 && errors.length > 0) {
          throw new Error(`Failed to create materials: ${errors[0]}`);
        }
        let message = "";
        if (importedCount > 0 && updatedCount > 0) {
          message = `Successfully created ${importedCount} new material(s) and updated ${updatedCount} existing material(s).`;
        } else if (importedCount > 0) {
          message = `Successfully created ${importedCount} new material(s).`;
        } else if (updatedCount > 0) {
          message = `Successfully updated ${updatedCount} existing material(s).`;
        } else {
          message = "No material rows were processed.";
        }
        return { success: true, message };
      }

      // For update sections: first try importExcel
      try {
        const res = await materialService.importExcel(file);
        if (
          res &&
          typeof res.message === "string" &&
          (res.message.includes("None of the") ||
            res.message.includes("does not exist in database") ||
            res.message.includes("Only existing"))
        ) {
          const rows = await parseFileToRows(file);
          const { importedCount, updatedCount } = await handleCreateOrUpdateMaterialsFromRows(rows);
          return {
            success: true,
            message: `Successfully processed ${importedCount + updatedCount} material record(s).`,
          };
        }
        return {
          success: res.success !== false,
          message: res.message || "Materials imported/updated successfully!",
        };
      } catch (err: any) {
        const errMsg = err.response?.data?.message || err.message || "";
        if (
          errMsg.includes("None of the") ||
          errMsg.includes("does not exist in database") ||
          errMsg.includes("Only existing")
        ) {
          const rows = await parseFileToRows(file);
          const { importedCount, updatedCount, errors } = await handleCreateOrUpdateMaterialsFromRows(rows);
          if (importedCount > 0 || updatedCount > 0) {
            return {
              success: true,
              message: `Successfully processed ${importedCount + updatedCount} material record(s).`,
            };
          }
          if (errors.length > 0) throw new Error(errors[0]);
        }
        throw new Error(errMsg || "Failed to process material Excel file.");
      }
    }

    case "employee": {
      try {
        const rows = await parseFileToRows(file);
        if (rows.length === 0) {
          throw new Error("No data rows found in the uploaded employee file.");
        }

        let existingEmployees: any[] = [];
        try {
          const res = await employeeService.getEmployees({ pageSize: 1000 });
          existingEmployees = res?.data || [];
        } catch (_) {}

        let importedCount = 0;
        let updatedCount = 0;
        const errors: string[] = [];

        for (let i = 0; i < rows.length; i++) {
          const row = rows[i];
          const rowNum = i + 2;

          const employeeId = String(row["employeeid"] || row["empid"] || "").trim();
          const machineCode = String(row["machinecode"] || "").trim();
          const fullName = String(row["fullname"] || row["name"] || row["employeename"] || "").trim();
          const firstName = String(row["firstname"] || "").trim();
          const lastName = String(row["lastname"] || "").trim();
          const effectiveName = fullName || (firstName ? `${firstName} ${lastName}`.trim() : "") || employeeId;
          const contactNo = String(row["mobileno"] || row["mobilenumber"] || row["mobile"] || row["phone"] || row["contactno"] || "").trim();
          const email = String(row["email"] || "").trim();
          const department = String(row["department"] || "Production").trim();
          const designation = String(row["designation"] || "Staff").trim();
          const gender = String(row["gender"] || "Male").trim();
          const aadharNo = String(row["aadharno"] || row["aadharcardnumber"] || "").trim();
          const basicSalary = Number(row["basicsalary"] || row["salary"]) || 0;
          const addressLine1 = String(row["addressline1"] || row["address"] || "").trim();
          const city = String(row["city"] || "").trim();
          const state = String(row["state"] || "").trim();
          const pincode = String(row["pincode"] || "").trim();
          const bankName = String(row["bankname"] || "").trim();
          const accountNumber = String(row["accountnumber"] || row["bankaccountnumber"] || "").trim();
          const ifscCode = String(row["ifsccode"] || row["ifsc"] || "").trim();

          if (!employeeId && !effectiveName) {
            errors.push(`Row ${rowNum}: Employee ID or Name is required.`);
            continue;
          }

          const existing = existingEmployees.find((e) =>
            (employeeId && e.employeeId && e.employeeId.toLowerCase() === employeeId.toLowerCase()) ||
            (contactNo && e.contactNo && e.contactNo === contactNo) ||
            (email && e.email && e.email.toLowerCase() === email.toLowerCase())
          );

          if (existing) {
            const updatePayload: any = {
              fullName: effectiveName || existing.fullName,
              firstName: getRowVal(row, "firstname") ?? existing.firstName,
              lastName: getRowVal(row, "lastname") ?? existing.lastName,
              contactNo: getRowVal(row, "mobileno", "mobilenumber", "mobile", "phone", "contactno") ?? existing.contactNo,
              email: getRowVal(row, "email") ?? existing.email,
              machineCode: getRowVal(row, "machinecode") ?? existing.machineCode,
              department: getRowVal(row, "department") ?? existing.department,
              designation: getRowVal(row, "designation") ?? existing.designation,
              gender: getRowVal(row, "gender") ?? existing.gender,
              aadharNo: getRowVal(row, "aadharno", "aadharcardnumber") ?? existing.aadharNo,
              basicSalary: hasRowField(row, "basicsalary", "salary")
                ? parseNumericValue(row["basicsalary"] ?? row["salary"], existing.basicSalary)
                : existing.basicSalary,
              addressLine1: getRowVal(row, "addressline1", "address") ?? existing.addressLine1,
              city: getRowVal(row, "city") ?? existing.city,
              state: getRowVal(row, "state") ?? existing.state,
              pincode: getRowVal(row, "pincode") ?? existing.pincode,
              bankName: getRowVal(row, "bankname") ?? existing.bankName,
              accountNumber: getRowVal(row, "accountnumber", "bankaccountnumber") ?? existing.accountNumber,
              ifscCode: getRowVal(row, "ifsccode", "ifsc") ?? existing.ifscCode,
            };

            try {
              await employeeService.updateEmployee(existing.id, updatePayload);
              updatedCount++;
            } catch (err: any) {
              errors.push(`Row ${rowNum} (${employeeId || effectiveName}): ${err.message || "Failed to update"}`);
            }
          } else {
            const createPayload: any = {
              employeeId: employeeId || `EMP-${Date.now().toString().slice(-4)}`,
              fullName: effectiveName,
              firstName: firstName || effectiveName.split(" ")[0] || "Staff",
              lastName: lastName || effectiveName.split(" ").slice(1).join(" ") || "Member",
              contactNo: contactNo || "9000000000",
              email: getRowVal(row, "email") || undefined,
              machineCode: getRowVal(row, "machinecode") || undefined,
              department: getRowVal(row, "department") || "Production",
              designation: getRowVal(row, "designation") || "Staff",
              gender: getRowVal(row, "gender") || "Male",
              aadharNo: getRowVal(row, "aadharno", "aadharcardnumber") || undefined,
              basicSalary: parseNumericValue(row["basicsalary"] ?? row["salary"], 0) ?? 0,
              addressLine1: getRowVal(row, "addressline1", "address") || undefined,
              city: getRowVal(row, "city") || undefined,
              state: getRowVal(row, "state") || undefined,
              pincode: getRowVal(row, "pincode") || undefined,
              bankName: getRowVal(row, "bankname") || undefined,
              accountNumber: getRowVal(row, "accountnumber", "bankaccountnumber") || undefined,
              ifscCode: getRowVal(row, "ifsccode", "ifsc") || undefined,
            };

            try {
              await employeeService.createEmployee(createPayload);
              importedCount++;
            } catch (err: any) {
              errors.push(`Row ${rowNum} (${employeeId || effectiveName}): ${err.message || "Failed to create"}`);
            }
          }
        }

        if (importedCount === 0 && updatedCount === 0 && errors.length > 0) {
          throw new Error(`Failed to import employees: ${errors[0]}`);
        }

        let message = "";
        if (importedCount > 0 && updatedCount > 0) {
          message = `Successfully imported ${importedCount} new employee(s) and updated ${updatedCount} existing employee(s).`;
        } else if (importedCount > 0) {
          message = `Successfully imported ${importedCount} new employee(s).`;
        } else if (updatedCount > 0) {
          message = `Successfully updated ${updatedCount} existing employee(s).`;
        } else {
          message = "No employee records were processed.";
        }
        return { success: true, message };
      } catch (err: any) {
        throw new Error(err.message || "Failed to process employee file.");
      }
    }

    case "company": {
      try {
        const rows = await parseFileToRows(file);
        if (rows.length === 0) {
          throw new Error("No data rows found in the uploaded company file.");
        }

        let existingCompanies: any[] = [];
        try {
          const res = await companyService.getCompanies();
          existingCompanies = res?.data || [];
        } catch (_) {}

        let importedCount = 0;
        let updatedCount = 0;
        const errors: string[] = [];

        for (let i = 0; i < rows.length; i++) {
          const row = rows[i];
          const rowNum = i + 2;

          const companyCode = String(row["companycode"] || row["code"] || "").trim();
          const companyName = String(row["companyname"] || row["name"] || "").trim();
          const ownerName = String(row["ownername"] || row["owner"] || "").trim();
          const gstNumber = String(row["gstnumber"] || row["gstin"] || row["gst"] || "").trim().toUpperCase();
          const panNumber = String(row["pannumber"] || row["pan"] || "").trim().toUpperCase();
          const email = String(row["email"] || "").trim();
          const phone = String(row["phone"] || row["contactno"] || row["mobile"] || "").trim();
          const legalName = String(row["legalname"] || companyName).trim();
          const brandName = String(row["brandname"] || companyName).trim();
          const businessType = String(row["businesstype"] || "Properiter").trim();
          const addressLine1 = String(row["addressline1"] || row["address"] || "").trim();
          const city = String(row["city"] || "").trim();
          const state = String(row["state"] || "Gujarat").trim();
          const pincode = String(row["pincode"] || "").trim();
          const bankName = String(row["bankname"] || "").trim();
          const accountNumber = String(row["accountnumber"] || row["accountno"] || "").trim();
          const ifscCode = String(row["ifsccode"] || row["ifsc"] || "").trim();
          const taxInvoicePrefix = String(row["taxinvoiceprefix"] || "").trim();
          const retailInvoicePrefix = String(row["retailinvoiceprefix"] || "").trim();

          if (!companyName && !gstNumber && !companyCode) {
            errors.push(`Row ${rowNum}: Company Name or GST Number is required.`);
            continue;
          }

          const existing = existingCompanies.find((c) =>
            (companyCode && c.companyCode && c.companyCode.toLowerCase() === companyCode.toLowerCase()) ||
            (gstNumber && c.gstNumber && c.gstNumber.toUpperCase() === gstNumber) ||
            (companyName && c.companyName && c.companyName.toLowerCase() === companyName.toLowerCase())
          );

          if (existing) {
            const updatePayload: any = {
              companyName: getRowVal(row, "companyname", "name") ?? existing.companyName,
              ownerName: getRowVal(row, "ownername", "owner") ?? existing.ownerName,
              gstNumber: getRowVal(row, "gstnumber", "gstin", "gst") ?? existing.gstNumber,
              panNumber: getRowVal(row, "pannumber", "pan") ?? existing.panNumber,
              email: getRowVal(row, "email") ?? existing.email,
              phone: getRowVal(row, "phone", "contactno", "mobile") ?? existing.phone,
              legalName: getRowVal(row, "legalname") ?? existing.legalName,
              brandName: getRowVal(row, "brandname") ?? existing.brandName,
              businessType: getRowVal(row, "businesstype") ?? existing.businessType,
              addressLine1: getRowVal(row, "addressline1", "address") ?? existing.addressLine1,
              city: getRowVal(row, "city") ?? existing.city,
              state: getRowVal(row, "state") ?? existing.state,
              pincode: getRowVal(row, "pincode") ?? existing.pincode,
              bankName: getRowVal(row, "bankname") ?? existing.bankName,
              accountNumber: getRowVal(row, "accountnumber", "accountno") ?? existing.accountNumber,
              ifscCode: getRowVal(row, "ifsccode", "ifsc") ?? existing.ifscCode,
              taxInvoicePrefix: getRowVal(row, "taxinvoiceprefix") ?? existing.taxInvoicePrefix,
              retailInvoicePrefix: getRowVal(row, "retailinvoiceprefix") ?? existing.retailInvoicePrefix,
            };

            try {
              await companyService.updateCompany(existing.id, updatePayload);
              updatedCount++;
            } catch (err: any) {
              errors.push(`Row ${rowNum} (${companyName || gstNumber}): ${err.message || "Failed to update"}`);
            }
          } else {
            const createPayload: any = {
              companyCode: companyCode || `CMP-${Date.now().toString().slice(-4)}`,
              companyName: companyName || "OrderOS Company",
              ownerName: ownerName || "Business Owner",
              gstNumber: gstNumber || "24AAACA0000A1Z5",
              panNumber: getRowVal(row, "pannumber", "pan") || undefined,
              email: getRowVal(row, "email") || undefined,
              phone: getRowVal(row, "phone", "contactno", "mobile") || undefined,
              legalName: getRowVal(row, "legalname") || companyName || undefined,
              brandName: getRowVal(row, "brandname") || companyName || undefined,
              businessType: getRowVal(row, "businesstype") || "Properiter",
              addressLine1: getRowVal(row, "addressline1", "address") || undefined,
              city: getRowVal(row, "city") || undefined,
              state: getRowVal(row, "state") || "Gujarat",
              pincode: getRowVal(row, "pincode") || undefined,
              bankName: getRowVal(row, "bankname") || undefined,
              accountNumber: getRowVal(row, "accountnumber", "accountno") || undefined,
              ifscCode: getRowVal(row, "ifsccode", "ifsc") || undefined,
              taxInvoicePrefix: getRowVal(row, "taxinvoiceprefix") || undefined,
              retailInvoicePrefix: getRowVal(row, "retailinvoiceprefix") || undefined,
            };

            try {
              await companyService.createCompany(createPayload);
              importedCount++;
            } catch (err: any) {
              errors.push(`Row ${rowNum} (${companyName || gstNumber}): ${err.message || "Failed to create"}`);
            }
          }
        }

        if (importedCount === 0 && updatedCount === 0 && errors.length > 0) {
          throw new Error(`Failed to import companies: ${errors[0]}`);
        }

        let message = "";
        if (importedCount > 0 && updatedCount > 0) {
          message = `Successfully imported ${importedCount} new company profile(s) and updated ${updatedCount} existing profile(s).`;
        } else if (importedCount > 0) {
          message = `Successfully imported ${importedCount} new company profile(s).`;
        } else if (updatedCount > 0) {
          message = `Successfully updated ${updatedCount} existing company profile(s).`;
        } else {
          message = "No company records were processed.";
        }
        return { success: true, message };
      } catch (err: any) {
        throw new Error(err.message || "Failed to process company file.");
      }
    }

    case "ledger": {
      try {
        const rows = await parseFileToRows(file);
        if (rows.length === 0) {
          throw new Error("No data rows found in the uploaded ledger file.");
        }

        let existingLedgers: any[] = [];
        try {
          const res = await ledgerService.getLedgers({ pageSize: 1000 });
          existingLedgers = res?.data || [];
        } catch (_) {}

        let importedCount = 0;
        let updatedCount = 0;
        const errors: string[] = [];

        for (let i = 0; i < rows.length; i++) {
          const row = rows[i];
          const rowNum = i + 2;

          const partyName = String(row["ledgername"] || row["partyname"] || row["name"] || "").trim();
          const accountCode = String(row["accountcode"] || row["code"] || row["alias"] || "").trim();
          const accountHead = String(row["accounthead"] || row["head"] || row["group"] || "Sundry Debtors").trim();
          const contactPerson = String(row["contactperson"] || row["contactname"] || "").trim();
          const gstin = String(row["gstin"] || row["gstnumber"] || row["gst"] || "").trim().toUpperCase();
          const email = String(row["email"] || "").trim();
          const phone = String(row["phone"] || row["contactno"] || "").trim();
          const addressLine1 = String(row["addressline1"] || row["address"] || "").trim();
          const city = String(row["city"] || "").trim();
          const state = String(row["state"] || "").trim();
          const pincode = String(row["pincode"] || "").trim();
          const openingBalance = Number(row["openingbalance"] || row["balance"]) || 0;
          const balanceType = String(row["balancetype"] || "Credit").trim();
          const creditLimit = Number(row["creditlimit"]) || 0;
          const debitLimit = Number(row["debitlimit"]) || 0;
          const bankName = String(row["bankname"] || "").trim();
          const accountNumber = String(row["accountnumber"] || row["accountno"] || "").trim();
          const ifsc = String(row["ifsccode"] || row["ifsc"] || "").trim();

          if (!partyName && !accountCode) {
            errors.push(`Row ${rowNum}: Ledger Name or Account Code is required.`);
            continue;
          }

          const existing = existingLedgers.find((l) =>
            (partyName && l.partyName && l.partyName.toLowerCase() === partyName.toLowerCase()) ||
            (accountCode && l.accountCode && l.accountCode.toLowerCase() === accountCode.toLowerCase()) ||
            (gstin && l.gstin && l.gstin.toUpperCase() === gstin)
          );

          if (existing) {
            const updatePayload: any = {
              partyName: partyName || existing.partyName,
              accountCode: accountCode || existing.accountCode,
              accountHead: getRowVal(row, "accounthead", "head", "group") ?? existing.accountHead,
              contactPerson: getRowVal(row, "contactperson", "contactname") ?? existing.contactPerson,
              gstin: getRowVal(row, "gstin", "gstnumber", "gst") ?? existing.gstin,
              email: getRowVal(row, "email") ?? existing.email,
              phone: getRowVal(row, "phone", "contactno") ?? existing.phone,
              addressLine1: getRowVal(row, "addressline1", "address") ?? existing.addressLine1,
              city: getRowVal(row, "city") ?? existing.city,
              state: getRowVal(row, "state") ?? existing.state,
              pincode: getRowVal(row, "pincode") ?? existing.pincode,
              openingBalance: hasRowField(row, "openingbalance", "balance")
                ? parseNumericValue(row["openingbalance"] ?? row["balance"], existing.openingBalance)
                : existing.openingBalance,
              balanceType: getRowVal(row, "balancetype") ?? existing.balanceType,
              creditLimit: hasRowField(row, "creditlimit")
                ? parseNumericValue(row["creditlimit"], existing.creditLimit)
                : existing.creditLimit,
              debitLimit: hasRowField(row, "debitlimit")
                ? parseNumericValue(row["debitlimit"], existing.debitLimit)
                : existing.debitLimit,
              bankName: getRowVal(row, "bankname") ?? existing.bankName,
              accountNumber: getRowVal(row, "accountnumber", "accountno") ?? existing.accountNumber,
              ifsc: getRowVal(row, "ifsccode", "ifsc") ?? existing.ifsc,
              isActive: hasRowField(row, "active", "isactive")
                ? parseBooleanValue(row["active"] ?? row["isactive"], existing.isActive)
                : existing.isActive,
            };

            try {
              await ledgerService.updateLedger(existing.id, updatePayload);
              updatedCount++;
            } catch (err: any) {
              errors.push(`Row ${rowNum} (${partyName || accountCode}): ${err.message || "Failed to update"}`);
            }
          } else {
            const createPayload: any = {
              partyName: partyName || accountCode,
              accountCode: accountCode || `ACC-${Date.now().toString().slice(-4)}`,
              accountHead: getRowVal(row, "accounthead", "head", "group") || "Sundry Debtors",
              contactPerson: getRowVal(row, "contactperson", "contactname") || undefined,
              gstin: getRowVal(row, "gstin", "gstnumber", "gst") || undefined,
              email: getRowVal(row, "email") || undefined,
              phone: getRowVal(row, "phone", "contactno") || undefined,
              addressLine1: getRowVal(row, "addressline1", "address") || undefined,
              city: getRowVal(row, "city") || undefined,
              state: getRowVal(row, "state") || undefined,
              pincode: getRowVal(row, "pincode") || undefined,
              openingBalance: parseNumericValue(row["openingbalance"] ?? row["balance"], 0) ?? 0,
              balanceType: getRowVal(row, "balancetype") === "Debit" ? "Debit" : "Credit",
              creditLimit: parseNumericValue(row["creditlimit"], 0) ?? 0,
              debitLimit: parseNumericValue(row["debitlimit"], 0) ?? 0,
              bankName: getRowVal(row, "bankname") || undefined,
              accountNumber: getRowVal(row, "accountnumber", "accountno") || undefined,
              ifsc: getRowVal(row, "ifsccode", "ifsc") || undefined,
              isActive: hasRowField(row, "active", "isactive")
                ? parseBooleanValue(row["active"] ?? row["isactive"], true)
                : true,
            };

            try {
              await ledgerService.createLedger(createPayload);
              importedCount++;
            } catch (err: any) {
              errors.push(`Row ${rowNum} (${partyName || accountCode}): ${err.message || "Failed to create"}`);
            }
          }
        }

        if (importedCount === 0 && updatedCount === 0 && errors.length > 0) {
          throw new Error(`Failed to import ledgers: ${errors[0]}`);
        }

        let message = "";
        if (importedCount > 0 && updatedCount > 0) {
          message = `Successfully imported ${importedCount} new ledger(s) and updated ${updatedCount} existing ledger(s).`;
        } else if (importedCount > 0) {
          message = `Successfully imported ${importedCount} new ledger(s).`;
        } else if (updatedCount > 0) {
          message = `Successfully updated ${updatedCount} existing ledger(s).`;
        } else {
          message = "No ledger records were processed.";
        }
        return { success: true, message };
      } catch (err: any) {
        throw new Error(err.message || "Failed to process ledger file.");
      }
    }

    case "salaried": {
      try {
        const rows = await parseFileToRows(file);
        if (rows.length === 0) {
          throw new Error("No data rows found in the uploaded salaried file.");
        }

        let salariedEmployees: any[] = [];
        try {
          const res = await salariedEmployeeService.getSalariedEmployees({ pageSize: 1000 });
          salariedEmployees = res?.data || [];
        } catch (_) {}

        const attendanceRecords: any[] = [];
        let updatedSalaryCount = 0;
        const errors: string[] = [];

        for (let i = 0; i < rows.length; i++) {
          const row = rows[i];
          const rowNum = i + 2;

          const employeeId = String(row["employeeid"] || row["empid"] || "").trim();
          const employeeName = String(row["employeename"] || row["name"] || "").trim();
          const monthName = String(row["monthname"] || row["month"] || "").trim();
          const absentHours = parseNumericValue(row["absenthours"] ?? row["absent"], 0) ?? 0;
          const overtimeHours = parseNumericValue(row["overtimehours"] ?? row["overtime"], 0) ?? 0;
          const basicSalary = parseNumericValue(row["basicsalary"] ?? row["salary"]);

          if (!employeeId && !employeeName) continue;

          const matchedEmp = salariedEmployees.find((e) =>
            (employeeId && e.employeeId && e.employeeId.toLowerCase() === employeeId.toLowerCase()) ||
            (employeeName && e.employeeName && e.employeeName.toLowerCase() === employeeName.toLowerCase())
          );

          if (monthName || absentHours > 0 || overtimeHours > 0) {
            attendanceRecords.push({
              employeeId: matchedEmp?.employeeId || employeeId,
              employeeName: matchedEmp?.employeeName || employeeName,
              monthName: monthName || "October",
              absentHours,
              overtimeHours,
              financialYear: "2026-2027",
            });
          }

          if (matchedEmp && basicSalary !== undefined && basicSalary > 0) {
            try {
              await salariedEmployeeService.updateSalaryDetails(matchedEmp.id, {
                basicSalary,
              });
              updatedSalaryCount++;
            } catch (err: any) {
              errors.push(`Row ${rowNum}: ${err.message}`);
            }
          }
        }

        let importedAttendanceCount = 0;
        if (attendanceRecords.length > 0) {
          try {
            const res = await salariedEmployeeService.uploadAttendance(attendanceRecords);
            importedAttendanceCount = res?.importedCount ?? attendanceRecords.length;
          } catch (err: any) {
            errors.push(err.message || "Failed to upload attendance");
          }
        }

        if (importedAttendanceCount === 0 && updatedSalaryCount === 0 && errors.length > 0) {
          throw new Error(`Salaried processing failed: ${errors[0]}`);
        }

        let message = "";
        if (importedAttendanceCount > 0 && updatedSalaryCount > 0) {
          message = `Processed ${importedAttendanceCount} attendance record(s) and updated ${updatedSalaryCount} salary record(s).`;
        } else if (importedAttendanceCount > 0) {
          message = `Successfully processed ${importedAttendanceCount} attendance record(s).`;
        } else if (updatedSalaryCount > 0) {
          message = `Successfully updated salary details for ${updatedSalaryCount} employee(s).`;
        } else {
          message = "Salaried file processed successfully.";
        }
        return { success: true, message };
      } catch (err: any) {
        throw new Error(err.message || "Failed to process salaried file.");
      }
    }

    default:
      return { success: true, message: "File uploaded successfully." };
  }
}
