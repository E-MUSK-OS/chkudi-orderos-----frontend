"use client";

import React, { useRef, useState, useMemo, useEffect } from "react";
import {
  UploadCloud,
  CheckCircle2,
  FileSpreadsheet,
  FileCheck,
  AlertCircle,
  RotateCcw,
  ArrowRight,
  Trash2,
  Plus,
  Download,
  Search,
  Copy,
  Check,
  Archive,
  Layers,
  Hash,
  Sparkles,
  AlertTriangle,
  Package,
  ShieldAlert,
  Lock,
} from "lucide-react";
import * as xlsx from "xlsx";
import ExcelJS from "exceljs";
import { saveAs } from "file-saver";
import { toast } from "sonner";
import DashboardLayout from "@/components/Dashboard/layout/DashboardLayout";
import Button from "@/components/ui/Button";
import { getAllMyntraMappings } from "@/components/Dashboard/Products/ManageProducts/services/myntraImport.service";
import type { MyntraMappingRecord } from "@/components/Dashboard/Products/ManageProducts/types/myntraImport.types";
import MyntraMissingSkuModal from "./components/MyntraMissingSkuModal";
import {
  saveMyntraPicklistToIDB,
  loadMyntraPicklistFromIDB,
  clearMyntraPicklistIDB,
} from "./utils/myntraPicklistIDB";

interface PicklistItem {
  id: string;
  myntraSku: string;
  sellerSku: string;
  rack: string;
  qty: number;
  generateBarcode: string;
  status: "MATCHED" | "UNMATCHED";
}

interface PicklistSummary {
  totalOrders: number;
  totalUnits: number;
  uniqueSkus: number;
  matchedSkus: number;
  unmatchedSkus: number;
}

export default function MyntraPicklist() {
  const [excelFiles, setExcelFiles] = useState<File[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [fileError, setFileError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStep, setProcessingStep] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Results State
  const [hasResults, setHasResults] = useState(false);
  const [picklistItems, setPicklistItems] = useState<PicklistItem[]>([]);
  const [summary, setSummary] = useState<PicklistSummary>({
    totalOrders: 0,
    totalUnits: 0,
    uniqueSkus: 0,
    matchedSkus: 0,
    unmatchedSkus: 0,
  });

  // Table Preview State
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "MATCHED" | "UNMATCHED">("ALL");
  const [copiedSku, setCopiedSku] = useState<string | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isMissingSkuModalOpen, setIsMissingSkuModalOpen] = useState(false);
  const [isIDBLoaded, setIsIDBLoaded] = useState(false);

  // 1. Restore temporary batch from IndexedDB on page load/reload
  useEffect(() => {
    let isMounted = true;
    loadMyntraPicklistFromIDB().then((cached) => {
      if (!isMounted) return;
      if (cached) {
        if (cached.files && cached.files.length > 0) {
          setExcelFiles(cached.files);
        }
        if (cached.hasResults && cached.picklistItems && cached.picklistItems.length > 0) {
          const sanitizedItems = (cached.picklistItems || []).map((item: PicklistItem) => ({
            ...item,
            rack: item.rack === "Unassigned" || !item.rack ? "-" : item.rack,
          }));
          setPicklistItems(sanitizedItems);
          setSummary(cached.summary);
          setHasResults(true);
        }
      }
      setIsIDBLoaded(true);
    });
    return () => {
      isMounted = false;
    };
  }, []);

  // 2. Automatically sync state to IndexedDB whenever files or results change (after initial IDB load)
  useEffect(() => {
    if (!isIDBLoaded) return;
    if (excelFiles.length > 0 || hasResults) {
      saveMyntraPicklistToIDB(excelFiles, hasResults, picklistItems, summary);
    }
  }, [isIDBLoaded, excelFiles, hasResults, picklistItems, summary]);

  // Compute missing Myntra SKUs (status === "UNMATCHED")
  const missingMyntraSkus = useMemo(() => {
    return picklistItems
      .filter((item) => item.status === "UNMATCHED")
      .map((item) => item.myntraSku);
  }, [picklistItems]);

  // Helper to format file sizes
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const totalExcelSize = excelFiles.reduce((acc, f) => acc + f.size, 0);
  const isReadyToSubmit = excelFiles.length > 0;

  // Validate and handle multiple Excel files
  const handleFileSelection = (selectedFiles: FileList | File[]) => {
    const validFiles: File[] = [];
    const invalidNames: string[] = [];

    Array.from(selectedFiles).forEach((file) => {
      const lower = file.name.toLowerCase();
      const isExcel =
        lower.endsWith(".xlsx") ||
        lower.endsWith(".xls") ||
        lower.endsWith(".csv") ||
        file.type === "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" ||
        file.type === "application/vnd.ms-excel" ||
        file.type === "text/csv";

      if (isExcel) {
        validFiles.push(file);
      } else {
        invalidNames.push(file.name);
      }
    });

    if (invalidNames.length > 0) {
      toast.error(`Ignored ${invalidNames.length} non-Excel file(s). Only .xlsx, .xls, .csv accepted.`);
    }

    if (validFiles.length > 0) {
      setExcelFiles((prev) => {
        const existingKeys = new Set(prev.map((f) => `${f.name}_${f.size}`));
        const newUnique = validFiles.filter((f) => !existingKeys.has(`${f.name}_${f.size}`));
        if (newUnique.length < validFiles.length) {
          toast.info("Duplicate Excel file(s) were skipped.");
        }
        return [...prev, ...newUnique];
      });
      setFileError(null);
      toast.success(`Added ${validFiles.length} Excel file(s).`);
    }
  };

  // Drag & drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      handleFileSelection(files);
    }
  };

  const handleRemoveSingleFile = (index: number) => {
    setExcelFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleRemoveAllFiles = () => {
    setExcelFiles([]);
    setFileError(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
    clearMyntraPicklistIDB();
    toast.info("Cleared all files.");
  };

  const handleResetAll = () => {
    handleRemoveAllFiles();
    setHasResults(false);
    setPicklistItems([]);
    setProcessingStep("");
    setSearchQuery("");
    setStatusFilter("ALL");
    setIsMissingSkuModalOpen(false);
    clearMyntraPicklistIDB();
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSku(text);
    toast.success(`Copied: ${text}`);
    setTimeout(() => {
      setCopiedSku(null);
    }, 2000);
  };

  // Re-check database mappings without losing uploaded orders
  const handleRefreshMappings = async (): Promise<{ success: boolean; remainingCount: number }> => {
    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("accessToken") || undefined : undefined;
      const mappingResponse = await getAllMyntraMappings(token);
      const freshMappings = mappingResponse.mappings || {};
      let matchedCount = 0;
      let unmatchedCount = 0;

      const updatedResults: PicklistItem[] = picklistItems.map((item) => {
        const key = item.myntraSku.trim().toLowerCase();
        const mapping = freshMappings[key];
        if (mapping) {
          matchedCount++;
          return {
            ...item,
            sellerSku: mapping.sellerSku?.trim() || "N/A",
            rack: mapping.rackAddress?.trim() || "-",
            generateBarcode: mapping.generateBarcode?.trim() || (mapping as any).generatedBarcode?.trim() || mapping.sellerSku?.trim() || "-",
            status: "MATCHED",
          };
        } else {
          unmatchedCount++;
          return {
            ...item,
            sellerSku: "Not Mapped",
            rack: "-",
            generateBarcode: "-",
            status: "UNMATCHED",
          };
        }
      });

      // Re-sort with new rack/sellerSku data
      updatedResults.sort((a, b) => {
        const aIsUnassigned = !a.rack || a.rack === "-" || a.rack === "Unassigned";
        const bIsUnassigned = !b.rack || b.rack === "-" || b.rack === "Unassigned";

        if (aIsUnassigned && !bIsUnassigned) return 1;
        if (!aIsUnassigned && bIsUnassigned) return -1;
        if (aIsUnassigned && bIsUnassigned) {
          return a.myntraSku.localeCompare(b.myntraSku);
        }

        const rackCompare = a.rack.localeCompare(b.rack, undefined, {
          numeric: true,
          sensitivity: "base",
        });
        if (rackCompare !== 0) return rackCompare;

        return a.sellerSku.localeCompare(b.sellerSku);
      });

      setPicklistItems(updatedResults);
      setSummary((prev) => ({
        ...prev,
        matchedSkus: matchedCount,
        unmatchedSkus: unmatchedCount,
      }));

      if (unmatchedCount === 0) {
        setIsMissingSkuModalOpen(false);
        return { success: true, remainingCount: 0 };
      }
      return { success: false, remainingCount: unmatchedCount };
    } catch (err) {
      console.error("Failed to re-check Myntra mappings:", err);
      throw err;
    }
  };

  // Parse order files, aggregate by myntrasku, and cross-match with Myntra product mappings
  const handleGeneratePicklist = async () => {
    if (excelFiles.length === 0) {
      setFileError("Please upload at least one Excel file before generating picklist.");
      toast.error("Please upload at least one Excel file before generating picklist.");
      return;
    }

    setIsProcessing(true);
    setProcessingStep("Reading uploaded order files...");

    try {
      // 1. Parse all files and aggregate quantities by myntraSku
      const aggregatedMap: Record<string, { myntraSku: string; qty: number }> = {};
      let orderRowCount = 0;

      const skuAliases = [
        "myntrasku",
        "myntraskucode",
        "platformsku",
        "sku",
        "sellersku",
        "itemsku",
        "productsku",
        "fsn",
      ];
      const qtyAliases = [
        "quantity",
        "qty",
        "count",
        "itemquantity",
        "units",
        "orderedqty",
        "orderqty",
      ];

      for (let i = 0; i < excelFiles.length; i++) {
        const file = excelFiles[i];
        setProcessingStep(`Parsing file ${i + 1} of ${excelFiles.length}: ${file.name}...`);

        const arrayBuffer = await file.arrayBuffer();
        const workbook = xlsx.read(arrayBuffer, { type: "array" });

        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        if (!worksheet) continue;

        const rows: any[][] = xlsx.utils.sheet_to_json(worksheet, { header: 1, defval: "" });
        if (rows.length < 2) continue;

        // Detect headers
        const headerRow = rows[0];
        const headerMap: Record<string, number> = {};

        headerRow.forEach((cellVal, colIndex) => {
          const raw = String(cellVal || "").trim().toLowerCase();
          const clean = raw.replace(/[^a-z0-9]/g, "");
          if (clean) {
            headerMap[clean] = colIndex;
          }
        });

        // Find SKU column
        let skuColIndex: number | undefined = undefined;
        for (const alias of skuAliases) {
          if (headerMap[alias] !== undefined) {
            skuColIndex = headerMap[alias];
            break;
          }
        }

        // If no direct alias found, inspect header strings for substring 'sku'
        if (skuColIndex === undefined) {
          for (let col = 0; col < headerRow.length; col++) {
            const h = String(headerRow[col] || "").toLowerCase();
            if (h.includes("sku")) {
              skuColIndex = col;
              break;
            }
          }
        }

        // Positional fallback: default to column 0 if nothing matched
        if (skuColIndex === undefined) {
          skuColIndex = 0;
        }

        // Find Qty column
        let qtyColIndex: number | undefined = undefined;
        for (const alias of qtyAliases) {
          if (headerMap[alias] !== undefined) {
            qtyColIndex = headerMap[alias];
            break;
          }
        }

        // Parse data rows
        for (let r = 1; r < rows.length; r++) {
          const row = rows[r];
          if (!row || !Array.isArray(row)) continue;

          const rawSku = String(row[skuColIndex] ?? "").trim();
          if (!rawSku) continue;

          let parsedQty = 1;
          if (qtyColIndex !== undefined) {
            const rawQty = row[qtyColIndex];
            const num = parseInt(String(rawQty).replace(/[^0-9]/g, ""), 10);
            if (!isNaN(num) && num > 0) {
              parsedQty = num;
            }
          }

          orderRowCount++;
          const lowerSku = rawSku.toLowerCase();

          if (!aggregatedMap[lowerSku]) {
            aggregatedMap[lowerSku] = {
              myntraSku: rawSku,
              qty: parsedQty,
            };
          } else {
            aggregatedMap[lowerSku].qty += parsedQty;
          }
        }
      }

      const uniqueSkuKeys = Object.keys(aggregatedMap);
      if (uniqueSkuKeys.length === 0) {
        throw new Error("No order SKUs could be extracted from the uploaded files. Please check the file formats.");
      }

      // 2. Fetch Myntra mappings dictionary from backend
      setProcessingStep("Fetching Myntra product mappings...");
      const token = typeof window !== "undefined" ? localStorage.getItem("accessToken") || undefined : undefined;
      const mappingResponse = await getAllMyntraMappings(token);
      const mappings: Record<string, MyntraMappingRecord> = mappingResponse.mappings || {};

      // 3. Cross-reference aggregated SKUs
      setProcessingStep("Cross-referencing SKU mappings & building picklist...");
      const results: PicklistItem[] = [];
      let matchedCount = 0;
      let unmatchedCount = 0;
      let totalUnitsCount = 0;

      uniqueSkuKeys.forEach((key, idx) => {
        const item = aggregatedMap[key];
        totalUnitsCount += item.qty;

        const mapping = mappings[key];
        if (mapping) {
          matchedCount++;
          results.push({
            id: `item-${idx}`,
            myntraSku: item.myntraSku,
            sellerSku: mapping.sellerSku?.trim() || "N/A",
            rack: mapping.rackAddress?.trim() || "-",
            qty: item.qty,
            generateBarcode: mapping.generateBarcode?.trim() || (mapping as any).generatedBarcode?.trim() || mapping.sellerSku?.trim() || "-",
            status: "MATCHED",
          });
        } else {
          unmatchedCount++;
          results.push({
            id: `item-${idx}`,
            myntraSku: item.myntraSku,
            sellerSku: "Not Mapped",
            rack: "-",
            qty: item.qty,
            generateBarcode: "-",
            status: "UNMATCHED",
          });
        }
      });

      // 4. Sort rows primarily by rack ascending (alphanumeric shelf order)
      results.sort((a, b) => {
        const aIsUnassigned = !a.rack || a.rack === "-" || a.rack === "Unassigned";
        const bIsUnassigned = !b.rack || b.rack === "-" || b.rack === "Unassigned";

        if (aIsUnassigned && !bIsUnassigned) return 1;
        if (!aIsUnassigned && bIsUnassigned) return -1;
        if (aIsUnassigned && bIsUnassigned) {
          return a.myntraSku.localeCompare(b.myntraSku);
        }

        const rackCompare = a.rack.localeCompare(b.rack, undefined, {
          numeric: true,
          sensitivity: "base",
        });
        if (rackCompare !== 0) return rackCompare;

        return a.sellerSku.localeCompare(b.sellerSku);
      });

      setPicklistItems(results);
      setSummary({
        totalOrders: orderRowCount,
        totalUnits: totalUnitsCount,
        uniqueSkus: uniqueSkuKeys.length,
        matchedSkus: matchedCount,
        unmatchedSkus: unmatchedCount,
      });

      setHasResults(true);

      if (unmatchedCount > 0) {
        setIsMissingSkuModalOpen(true);
        toast.warning(
          `Picklist generated with ${unmatchedCount} unmapped Myntra SKU(s). Review missing SKUs to unlock export.`,
          { duration: 5000 }
        );
      } else {
        toast.success(
          `Picklist generated successfully! All ${matchedCount} SKUs matched.`
        );
      }
    } catch (err: any) {
      console.error(err);
      toast.error(err?.message || "Failed to generate picklist.");
    } finally {
      setIsProcessing(false);
      setProcessingStep("");
    }
  };

  // Filtered picklist items for preview table
  const filteredItems = useMemo(() => {
    return picklistItems.filter((item) => {
      // Status filter
      if (statusFilter === "MATCHED" && item.status !== "MATCHED") return false;
      if (statusFilter === "UNMATCHED" && item.status !== "UNMATCHED") return false;

      // Search filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchRack = item.rack.toLowerCase().includes(q);
        const matchSeller = item.sellerSku.toLowerCase().includes(q);
        const matchMyntra = item.myntraSku.toLowerCase().includes(q);
        const matchBarcode = item.generateBarcode.toLowerCase().includes(q);
        return matchRack || matchSeller || matchMyntra || matchBarcode;
      }

      return true;
    });
  }, [picklistItems, statusFilter, searchQuery]);

  // Helper to sanitize spreadsheet cells against CSV/formula injection
  const sanitizeSpreadsheetCell = (value: unknown): string => {
    if (value === null || value === undefined) return "";
    const str = String(value);
    const trimmed = str.trim();
    // Standalone dashes like "-" or "--" are safe placeholder values, do not prepend apostrophe
    if (/^[-]{1,3}$/.test(trimmed)) {
      return trimmed;
    }
    if (/^[=+@\-\t\r]/.test(trimmed)) {
      return `'${trimmed}`;
    }
    return str;
  };

  // Populate worksheet identically to Amazon order process picklist (without single/multi format grouping)
  const populateMyntraPicklistWorksheet = (
    worksheet: ExcelJS.Worksheet,
    items: PicklistItem[],
    totalQuantity: number,
    emptyMessage: string = "No items found in this picklist",
    forceSingleColumn: boolean = false
  ) => {
    // Page setup to fit perfectly onto A4 portrait sheet when printing
    worksheet.pageSetup = {
      paperSize: 9, // A4
      orientation: "portrait",
      fitToPage: true,
      fitToWidth: 1,
      fitToHeight: 0,
      margins: {
        left: 0.25,
        right: 0.25,
        top: 0.35,
        bottom: 0.35,
        header: 0.2,
        footer: 0.2,
      },
    };

    if (items.length === 0) {
      const emptyRow = worksheet.addRow([emptyMessage]);
      worksheet.mergeCells(emptyRow.number, 1, emptyRow.number, 4);
      emptyRow.height = 24;
      const cell = emptyRow.getCell(1);
      cell.font = { italic: true, size: 10.5, color: { argb: "FF64748B" } };
      cell.alignment = { vertical: "middle", horizontal: "center" };
      worksheet.getColumn(1).width = 15;
      worksheet.getColumn(2).width = 30;
      worksheet.getColumn(3).width = 10;
      worksheet.getColumn(4).width = 14;
      return;
    }

    const MAX_ROWS_PER_COLUMN = 50;
    const hasRightColumn = !forceSingleColumn && items.length > 1;

    const itemsPerPage = hasRightColumn ? MAX_ROWS_PER_COLUMN * 2 : MAX_ROWS_PER_COLUMN;
    const totalPages = Math.max(1, Math.ceil(items.length / itemsPerPage));

    // 1. Add Date/Time Header at the top (Row 1)
    const formattedDate = new Date().toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
    const dateRow = worksheet.addRow([`Picklist Generated on: ${formattedDate}`]);
    dateRow.height = 25;
    worksheet.mergeCells(dateRow.number, 1, dateRow.number, hasRightColumn ? 9 : 4);
    const dateCell = dateRow.getCell(1);
    dateCell.font = { bold: true, size: 12, name: "Calibri", color: { argb: "FF0F172A" } };
    dateCell.alignment = { vertical: "middle", horizontal: "center" };
    worksheet.addRow([]).height = 10; // spacer row

    // 2. Header styling: Strictly Black and White (No background fill)
    const styleHeaderCell = (cell: ExcelJS.Cell, isLeft = false) => {
      cell.font = { bold: true, color: { argb: "FF000000" }, size: 10, name: "Calibri" };
      cell.alignment = { vertical: "middle", horizontal: isLeft ? "left" : "center" };
      // No background fill for headers (Black & White)
      cell.border = {
        top: { style: "thin", color: { argb: "FF000000" } },
        left: { style: "thin", color: { argb: "FF000000" } },
        bottom: { style: "medium", color: { argb: "FF000000" } },
        right: { style: "thin", color: { argb: "FF000000" } },
      };
    };

    // Item cells styling
    const styleItemCells = (
      row: ExcelJS.Row,
      startCol: number,
      item: PicklistItem
    ) => {
      const rackCell = row.getCell(startCol);
      const skuCell = row.getCell(startCol + 1);
      const qtyCell = row.getCell(startCol + 2);
      const barcodeCell = row.getCell(startCol + 3);

      const displayRack = item.rack && item.rack !== "Unassigned" ? item.rack : "-";
      rackCell.value = sanitizeSpreadsheetCell(displayRack);
      skuCell.value = sanitizeSpreadsheetCell(item.sellerSku || "--");
      qtyCell.value = item.qty;
      barcodeCell.value = sanitizeSpreadsheetCell(item.generateBarcode || "No");

      [rackCell, skuCell, qtyCell, barcodeCell].forEach((c, idx) => {
        c.border = {
          top: { style: "thin", color: { argb: "FFE2E8F0" } },
          left: { style: "thin", color: { argb: "FFE2E8F0" } },
          bottom: { style: "thin", color: { argb: "FFE2E8F0" } },
          right: { style: "thin", color: { argb: "FFE2E8F0" } },
        };
        c.font = { size: 10, name: "Calibri", color: { argb: "FF000000" } };
        c.alignment = { vertical: "middle", horizontal: idx === 1 ? "left" : "center" };
      });

      skuCell.font = { bold: true, size: 10, name: "Calibri", color: { argb: "FF000000" } };

      if (item.generateBarcode === "Yes") {
        barcodeCell.font = { bold: true, size: 10, name: "Calibri", color: { argb: "FF16A34A" } };
      } else {
        barcodeCell.font = { size: 10, name: "Calibri", color: { argb: "FF64748B" } };
      }
    };

    // Add balanced items onto pages
    for (let pageIdx = 0; pageIdx < totalPages; pageIdx++) {
      if (pageIdx > 0) {
        const lastRow = worksheet.lastRow;
        if (lastRow) {
          lastRow.addPageBreak();
        }
      }

      const startIdx = pageIdx * itemsPerPage;
      const pageItems = items.slice(startIdx, startIdx + itemsPerPage);
      const numRowsOnPage = hasRightColumn ? Math.ceil(pageItems.length / 2) : pageItems.length;
      const leftItems = pageItems.slice(0, numRowsOnPage);
      const rightItems = hasRightColumn ? pageItems.slice(numRowsOnPage) : [];

      // Page Table Header Row
      const headerRow = worksheet.addRow([]);
      headerRow.height = 20;

      // Left Column Headers (Cols 1 to 4)
      headerRow.getCell(1).value = "Rack";
      headerRow.getCell(2).value = "SKU";
      headerRow.getCell(3).value = "Qty";
      headerRow.getCell(4).value = "Barcode";

      styleHeaderCell(headerRow.getCell(1), false);
      styleHeaderCell(headerRow.getCell(2), true);
      styleHeaderCell(headerRow.getCell(3), false);
      styleHeaderCell(headerRow.getCell(4), false);

      // Right Column Headers (Cols 6 to 9)
      if (hasRightColumn) {
        headerRow.getCell(5).value = "";
        headerRow.getCell(6).value = "Rack";
        headerRow.getCell(7).value = "SKU";
        headerRow.getCell(8).value = "Qty";
        headerRow.getCell(9).value = "Barcode";

        styleHeaderCell(headerRow.getCell(6), false);
        styleHeaderCell(headerRow.getCell(7), true);
        styleHeaderCell(headerRow.getCell(8), false);
        styleHeaderCell(headerRow.getCell(9), false);
      }

      // Add data rows side-by-side
      for (let r = 0; r < numRowsOnPage; r++) {
        const dataRow = worksheet.addRow([]);
        dataRow.height = 16;

        const leftItem = leftItems[r];
        const rightItem = rightItems[r];

        if (leftItem) {
          styleItemCells(dataRow, 1, leftItem);
        }

        if (hasRightColumn) {
          dataRow.getCell(5).value = "";
          if (rightItem) {
            styleItemCells(dataRow, 6, rightItem);
          }
        }
      }
    }

    // 3. Summary Row across bottom of sheet
    const totalRow = worksheet.addRow([]);
    totalRow.height = 24;

    if (!hasRightColumn) {
      totalRow.getCell(1).value = "";
      totalRow.getCell(2).value = "TOTAL QUANTITY";
      totalRow.getCell(3).value = totalQuantity;
      totalRow.getCell(4).value = `${items.length} Unique SKUs`;

      for (let c = 1; c <= 4; c++) {
        const cell = totalRow.getCell(c);
        cell.border = {
          top: { style: "thin", color: { argb: "FF000000" } },
          bottom: { style: "double", color: { argb: "FF000000" } },
          left: { style: "thin", color: { argb: "FFE2E8F0" } },
          right: { style: "thin", color: { argb: "FFE2E8F0" } },
        };
        cell.font = { bold: true, size: 10, name: "Calibri", color: { argb: "FF000000" } };
        cell.alignment = {
          vertical: "middle",
          horizontal: c === 2 ? "right" : "center",
          shrinkToFit: true,
        };
      }
    } else {
      totalRow.getCell(1).value = `TOTAL QUANTITY: ${totalQuantity}`;
      totalRow.getCell(6).value = `TOTAL SKUs: ${items.length} Unique SKUs`;

      worksheet.mergeCells(totalRow.number, 1, totalRow.number, 4);
      worksheet.mergeCells(totalRow.number, 6, totalRow.number, 9);

      [1, 6].forEach((c) => {
        const cell = totalRow.getCell(c);
        cell.border = {
          top: { style: "thin", color: { argb: "FF000000" } },
          bottom: { style: "double", color: { argb: "FF000000" } },
        };
        cell.font = { bold: true, size: 10, name: "Calibri", color: { argb: "FF000000" } };
        cell.alignment = { vertical: "middle", horizontal: "center" };
      });
    }

    // 4. Time and Signature Fields at the bottom
    worksheet.addRow([]).height = 20; // spacer

    const signRow = worksheet.addRow([]);
    signRow.height = 30;

    if (!hasRightColumn) {
      signRow.getCell(1).value = "Time: _______________________";
      worksheet.mergeCells(signRow.number, 1, signRow.number, 2);
      signRow.getCell(1).font = { bold: true, size: 11, name: "Calibri", color: { argb: "FF000000" } };
      signRow.getCell(1).alignment = { vertical: "bottom", horizontal: "center" };

      signRow.getCell(3).value = "Signature: _______________________";
      worksheet.mergeCells(signRow.number, 3, signRow.number, 4);
      signRow.getCell(3).font = { bold: true, size: 11, name: "Calibri", color: { argb: "FF000000" } };
      signRow.getCell(3).alignment = { vertical: "bottom", horizontal: "center" };
    } else {
      signRow.getCell(1).value = "Time: _______________________";
      worksheet.mergeCells(signRow.number, 1, signRow.number, 4);
      signRow.getCell(1).font = { bold: true, size: 11, name: "Calibri", color: { argb: "FF000000" } };
      signRow.getCell(1).alignment = { vertical: "bottom", horizontal: "center" };

      signRow.getCell(6).value = "Signature: _______________________";
      worksheet.mergeCells(signRow.number, 6, signRow.number, 9);
      signRow.getCell(6).font = { bold: true, size: 11, name: "Calibri", color: { argb: "FF000000" } };
      signRow.getCell(6).alignment = { vertical: "bottom", horizontal: "center" };
    }

    // 5. Column widths fitted snugly for A4 Portrait paper
    const maxRackLen = items.reduce(
      (max, i) => Math.max(max, (i.rack && i.rack !== "--" && i.rack !== "-" && i.rack !== "Unassigned" ? i.rack : "").length),
      "Rack".length
    );
    const maxSkuLen = items.reduce(
      (max, i) => Math.max(max, (i.sellerSku || "").length),
      "SKU".length
    );
    const totalSkuSummaryText = `${items.length} Unique SKUs`;
    const barcodeColWidth = Math.max(18, totalSkuSummaryText.length + 3);

    if (!hasRightColumn) {
      const singleRackWidth = Math.min(Math.max(maxRackLen + 3, 16), 26);
      const singleSkuWidth = Math.min(Math.max(maxSkuLen + 3, 30), 55);

      worksheet.getColumn(1).width = singleRackWidth;
      worksheet.getColumn(2).width = singleSkuWidth;
      worksheet.getColumn(3).width = 10;
      worksheet.getColumn(4).width = Math.max(barcodeColWidth, 20);
    } else {
      const rackWidth = Math.min(Math.max(maxRackLen + 1, 8), 12);
      const skuWidth = Math.min(Math.max(maxSkuLen + 1, 20), 28);
      const qtyWidth = 6;
      const barcodeW = 10;

      worksheet.getColumn(1).width = rackWidth;
      worksheet.getColumn(2).width = skuWidth;
      worksheet.getColumn(3).width = qtyWidth;
      worksheet.getColumn(4).width = barcodeW;
      worksheet.getColumn(5).width = 2; // Spacer
      worksheet.getColumn(6).width = rackWidth;
      worksheet.getColumn(7).width = skuWidth;
      worksheet.getColumn(8).width = qtyWidth;
      worksheet.getColumn(9).width = barcodeW;
    }
  };

  // Download Picklist as Excel formatted identically to Amazon order process picklist
  const handleDownloadExcel = async () => {
    if (picklistItems.length === 0) {
      toast.error("No picklist items to export.");
      return;
    }

    if (missingMyntraSkus.length > 0) {
      setIsMissingSkuModalOpen(true);
      toast.warning(
        `Cannot export picklist while ${missingMyntraSkus.length} Myntra SKU(s) are missing from database.`
      );
      return;
    }

    setIsDownloading(true);
    try {
      const workbook = new ExcelJS.Workbook();
      const now = new Date();
      const picklistNo = `PL${Date.now()}`;

      // Configure workbook views so Sheet 1 ("Myntra Picklist") is explicitly active
      workbook.views = [
        {
          x: 0,
          y: 0,
          width: 10000,
          height: 20000,
          firstSheet: 0,
          activeTab: 0,
          visibility: "visible",
        },
      ];

      // Sheet 1: Main Picklist (unified, sorted primarily by Rack Address)
      const sheet1 = workbook.addWorksheet("Myntra Picklist");
      sheet1.views = [{ state: "normal", activeCell: "A1" }];
      populateMyntraPicklistWorksheet(
        sheet1,
        picklistItems,
        summary.totalUnits,
        "No items found in this picklist"
      );

      // Sheet 2: If there are items with Generate Barcode === "Yes"
      const barcodeYesItems = picklistItems.filter(
        (item) => item.generateBarcode?.toLowerCase() === "yes"
      );
      if (barcodeYesItems.length > 0) {
        const barcodeYesTotalQty = barcodeYesItems.reduce((acc, item) => acc + item.qty, 0);
        const sheet2 = workbook.addWorksheet("Barcode Yes");
        sheet2.views = [{ state: "normal", activeCell: "A1" }];
        populateMyntraPicklistWorksheet(
          sheet2,
          barcodeYesItems,
          barcodeYesTotalQty,
          "No Barcode Yes items found in this batch",
          true // forceSingleColumn for Barcode Yes sheet
        );
      }

      const buffer = await workbook.xlsx.writeBuffer();
      const fileName = `Myntra_Picklist_${picklistNo}_${now.toISOString().slice(0, 10)}.xlsx`;

      saveAs(
        new Blob([buffer], {
          type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        }),
        fileName
      );

      toast.success(`Exported ${picklistItems.length} picklist records to ${fileName}!`);
    } catch (err) {
      console.error(err);
      toast.error("Failed to generate Excel picklist.");
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <DashboardLayout title="Myntra Picklist">
      <div className="space-y-6">
        {/* ===================================================== */}
        {/* HEADER SECTION (Themed with rounded corner borders) */}
        {/* ===================================================== */}
        <div className="rounded-2xl border border-[#E7E0D2] bg-white p-4 sm:p-6 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="space-y-1">
              <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-[#0A0E1A]">
                {hasResults ? "Myntra Picklist Results" : "Myntra Picklist"}
              </h2>

              <p className="text-xs sm:text-sm text-slate-500 break-words">
                {hasResults ? (
                  <>
                    Files:{" "}
                    <strong className="text-slate-800">
                      {excelFiles.map((f) => f.name).join(", ") || "Myntra Orders"}
                    </strong>
                  </>
                ) : (
                  "Upload Myntra order Excel files (.xlsx, .xls, .csv) to aggregate SKUs and generate picklist."
                )}
              </p>
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto">
              {hasResults ? (
                <>
                  <button
                    type="button"
                    onClick={handleResetAll}
                    className="flex h-11 sm:h-12 w-full sm:w-auto items-center justify-center gap-2 rounded-xl bg-[#0A0E1A] px-4 sm:px-5 text-xs sm:text-sm font-semibold text-white transition hover:bg-[#161D2E]"
                  >
                    <RotateCcw size={16} />
                    New Batch
                  </button>

                  <button
                    type="button"
                    onClick={handleDownloadExcel}
                    disabled={isDownloading}
                    className="flex h-11 sm:h-12 w-full sm:w-auto items-center justify-center gap-2 rounded-xl bg-[#E8C16D] hover:bg-[#dfb45b] px-4 sm:px-5 text-xs sm:text-sm font-semibold text-[#0A0E1A] transition shadow-sm"
                  >
                    <Download size={16} />
                    {isDownloading ? "Downloading..." : "Download Excel"}
                  </button>
                </>
              ) : (
                <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-right">
                  <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                    Files Ready
                  </div>
                  <div className="text-sm font-bold text-[#0A0E1A]">
                    <span className={excelFiles.length > 0 ? "text-emerald-600" : "text-slate-400"}>
                      {excelFiles.length} File{excelFiles.length !== 1 ? "s" : ""}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Persistent Warning Banner identical to Amazon Order Process */}
          {hasResults && missingMyntraSkus.length > 0 && (
            <div className="mt-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4 rounded-xl border border-rose-200 dark:border-rose-900/50 bg-rose-50/90 dark:bg-rose-950/30 p-3 sm:p-4 text-rose-900 dark:text-rose-200">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-rose-100 dark:bg-rose-900/50 text-rose-600 dark:text-rose-400">
                  <ShieldAlert className="h-5 w-5 animate-pulse" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-rose-900 dark:text-rose-200">
                    Strict Guard Active: {missingMyntraSkus.length} Myntra SKU(s) Missing Seller SKU
                  </h4>
                  <p className="text-xs text-rose-700 dark:text-rose-400">
                    Picklist export is locked until all Myntra SKUs are mapped in Products.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsMissingSkuModalOpen(true)}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-[#0A0E1A] hover:bg-[#1b253b] px-4 py-2 text-xs font-bold text-[#E8C16D] shadow-sm transition active:scale-95 cursor-pointer"
              >
                <Lock className="h-3.5 w-3.5" />
                <span>Resolve Missing SKUs ({missingMyntraSkus.length})</span>
              </button>
            </div>
          )}

          {/* KPI Stats Cards - Integrated when results are available */}
          {hasResults && (
            <div className="mt-5 sm:mt-6 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4 border-t border-[#E7E0D2] pt-5 sm:pt-6">
              {/* Total Orders */}
              <article className="rounded-xl border border-[#E7E0D2] bg-white p-3.5 sm:p-4 shadow-sm flex flex-col justify-between">
                <p className="text-xs sm:text-sm font-medium text-slate-500">Total Orders</p>
                <div className="mt-2 sm:mt-3 flex items-end justify-between gap-2">
                  <h3 className="text-xl sm:text-2xl font-bold text-[#0A0E1A]">
                    {summary.totalOrders.toLocaleString()}
                  </h3>
                  <span className="rounded bg-blue-100 px-2 py-0.5 text-xs font-bold text-blue-700">
                    Orders
                  </span>
                </div>
              </article>

              {/* Total Units */}
              <article className="rounded-xl border border-[#E7E0D2] bg-white p-3.5 sm:p-4 shadow-sm flex flex-col justify-between">
                <p className="text-xs sm:text-sm font-medium text-slate-500">Total Units</p>
                <div className="mt-2 sm:mt-3 flex items-end justify-between gap-2">
                  <h3 className="text-xl sm:text-2xl font-bold text-[#0A0E1A]">
                    {summary.totalUnits.toLocaleString()}
                  </h3>
                  <span className="rounded bg-indigo-100 px-2 py-0.5 text-xs font-bold text-indigo-700">
                    Units
                  </span>
                </div>
              </article>

              {/* Unique SKUs */}
              <article className="rounded-xl border border-[#E7E0D2] bg-white p-3.5 sm:p-4 shadow-sm flex flex-col justify-between">
                <p className="text-xs sm:text-sm font-medium text-slate-500">Unique SKUs</p>
                <div className="mt-2 sm:mt-3 flex items-end justify-between gap-2">
                  <h3 className="text-xl sm:text-2xl font-bold text-[#0A0E1A]">
                    {summary.uniqueSkus.toLocaleString()}
                  </h3>
                  <span className="rounded bg-amber-100 px-2 py-0.5 text-xs font-bold text-amber-800">
                    SKUs
                  </span>
                </div>
              </article>

              {/* Matched SKUs */}
              <article className="rounded-xl border border-[#E7E0D2] bg-white p-3.5 sm:p-4 shadow-sm flex flex-col justify-between">
                <p className="text-xs sm:text-sm font-medium text-slate-500">Matched SKUs</p>
                <div className="mt-2 sm:mt-3 flex items-end justify-between gap-2">
                  <h3 className="text-xl sm:text-2xl font-bold text-emerald-700">
                    {summary.matchedSkus.toLocaleString()}
                  </h3>
                  <span className="rounded bg-emerald-100 px-2 py-0.5 text-xs font-bold text-emerald-700">
                    Matched
                  </span>
                </div>
              </article>

              {/* Unmatched SKUs */}
              <article className="rounded-xl border border-[#E7E0D2] bg-white p-3.5 sm:p-4 shadow-sm flex flex-col justify-between col-span-2 sm:col-span-1">
                <p className="text-xs sm:text-sm font-medium text-slate-500">Unmatched SKUs</p>
                <div className="mt-2 sm:mt-3 flex items-end justify-between gap-2">
                  <h3 className="text-xl sm:text-2xl font-bold text-rose-700">
                    {summary.unmatchedSkus.toLocaleString()}
                  </h3>
                  <span className="rounded bg-rose-100 px-2 py-0.5 text-xs font-bold text-rose-700">
                    Unmatched
                  </span>
                </div>
              </article>
            </div>
          )}
        </div>

        {/* Processing State Indicator */}
        {isProcessing && (
          <div className="rounded-2xl border border-[#E8C16D]/40 bg-[#FFF9EC]/50 p-6 sm:p-8 shadow-sm text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded bg-amber-100 text-amber-700 animate-pulse mb-3">
              <Sparkles className="h-7 w-7 animate-spin" />
            </div>
            <h3 className="text-lg font-bold text-[#0A0E1A]">Processing Your Picklist...</h3>
            <p className="text-sm font-medium text-amber-800 mt-1">{processingStep}</p>
            <div className="w-full max-w-md mx-auto bg-amber-200/50 rounded-full h-2 mt-4 overflow-hidden">
              <div className="bg-[#B88728] h-full w-2/3 animate-[pulse_1s_ease-in-out_infinite]" />
            </div>
          </div>
        )}

        {/* Upload Section (Shown when no results or when user is preparing files) */}
        {!hasResults && !isProcessing && (
          <>
            <div className="grid grid-cols-1 gap-6">
              <div className="flex flex-col rounded-2xl border border-[#E7E0D2] bg-white p-4 sm:p-6 shadow-sm">
                <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="grid h-10 w-10 sm:h-11 sm:w-11 place-items-center rounded bg-emerald-50 text-emerald-600 border border-emerald-100 shrink-0">
                      <FileSpreadsheet className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-[#0A0E1A] text-sm sm:text-base">
                        Excel Order Files {excelFiles.length > 0 ? `(${excelFiles.length})` : ""}
                      </h3>
                      <p className="text-xs text-slate-500">Upload one or multiple .xlsx, .xls, .csv files</p>
                    </div>
                  </div>

                  {excelFiles.length > 0 ? (
                    <span className="inline-flex items-center gap-1.5 rounded bg-emerald-50 px-2.5 sm:px-3 py-1 text-xs font-semibold text-emerald-700 border border-emerald-200">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      {excelFiles.length} Ready
                    </span>
                  ) : (
                    <span className="inline-flex items-center rounded bg-amber-50 px-2.5 sm:px-3 py-1 text-xs font-semibold text-amber-700 border border-amber-200">
                      Required
                    </span>
                  )}
                </div>

                {/* Upload Box / Selected Files View */}
                <div className="mt-4 sm:mt-5 flex-1 flex flex-col justify-between">
                  {excelFiles.length === 0 ? (
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      onDragOver={handleDragOver}
                      onDragLeave={handleDragLeave}
                      onDrop={handleDrop}
                      className={`group relative flex min-h-[180px] sm:min-h-[220px] cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed p-4 sm:p-6 text-center transition-all ${
                        isDragging
                          ? "border-[#E8C16D] bg-[#FFF9EC]"
                          : "border-slate-300 bg-slate-50/50 hover:border-[#E8C16D] hover:bg-[#FFF9EC]/40"
                      }`}
                    >
                      <div className="mb-2 sm:mb-3 grid h-12 w-12 sm:h-14 sm:w-14 place-items-center rounded-full bg-white text-slate-500 shadow-sm transition-transform group-hover:scale-110 group-hover:text-emerald-500">
                        <UploadCloud className="h-6 w-6 sm:h-7 sm:w-7" />
                      </div>

                      <p className="text-xs sm:text-sm font-semibold text-[#0A0E1A]">
                        Click to upload or drag & drop Excel(s)
                      </p>
                      <p className="mt-1 text-[11px] sm:text-xs text-slate-500">
                        Select one or multiple Myntra Order Excel (<code className="font-mono text-emerald-600">.xlsx, .xls, .csv</code>) files
                      </p>

                      <div className="mt-3 sm:mt-4 inline-flex items-center gap-1 text-xs font-semibold text-[#0A0E1A] bg-white px-3 sm:px-3.5 py-1.5 rounded-lg border border-slate-200 shadow-2xs group-hover:border-[#E8C16D]">
                        <FileSpreadsheet className="h-3.5 w-3.5 text-emerald-500" />
                        Browse Excel Files
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col justify-between rounded-xl border border-emerald-200 bg-emerald-50/20 p-3 sm:p-4">
                      <div className="max-h-56 overflow-y-auto space-y-2 pr-1">
                        {excelFiles.map((file, idx) => (
                          <div
                            key={`${file.name}_${idx}`}
                            className="flex items-center justify-between gap-2 rounded-lg border border-emerald-200/60 bg-white p-2 sm:p-2.5 shadow-2xs"
                          >
                            <div className="flex items-center gap-2 min-w-0 flex-1">
                              <div className="grid h-7 w-7 sm:h-8 sm:w-8 shrink-0 place-items-center rounded bg-emerald-50 text-emerald-600">
                                <FileCheck className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                              </div>
                              <div className="min-w-0 flex-1">
                                <p className="truncate text-xs font-semibold text-[#0A0E1A]" title={file.name}>
                                  {file.name}
                                </p>
                                <p className="text-[10px] sm:text-[11px] text-slate-500">
                                  {formatFileSize(file.size)}
                                </p>
                              </div>
                            </div>

                            <button
                              type="button"
                              onClick={() => handleRemoveSingleFile(idx)}
                              title="Remove this file"
                              className="grid h-7 w-7 shrink-0 place-items-center rounded text-slate-400 transition hover:bg-red-100 hover:text-red-600"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        ))}
                      </div>

                      <div className="mt-3 sm:mt-4 pt-3 border-t border-emerald-200/60 flex items-center justify-between">
                        <span className="text-xs font-medium text-emerald-800">
                          Total: {excelFiles.length} file{excelFiles.length > 1 ? "s" : ""} ({formatFileSize(totalExcelSize)})
                        </span>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            className="inline-flex items-center gap-1 text-xs font-semibold text-[#0A0E1A] bg-white px-2.5 py-1 rounded-md border border-slate-200 hover:border-[#E8C16D] shadow-2xs"
                          >
                            <Plus className="h-3 w-3" /> Add More
                          </button>
                          <button
                            type="button"
                            onClick={handleRemoveAllFiles}
                            className="text-xs font-medium text-red-600 hover:underline px-1"
                          >
                            Clear
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Hidden File Input */}
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    hidden
                    accept=".xlsx,.xls,.csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel,text/csv"
                    onChange={(e) => {
                      if (e.target.files && e.target.files.length > 0) {
                        handleFileSelection(e.target.files);
                      }
                      e.target.value = "";
                    }}
                  />

                  {/* File Error Display */}
                  {fileError && (
                    <div className="mt-3 flex items-center gap-2 rounded-xl bg-red-50 p-3 text-xs text-red-700 border border-red-200">
                      <AlertCircle className="h-4 w-4 shrink-0 text-red-600" />
                      <span>{fileError}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Action Controls Bar */}
            <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-between gap-3 sm:gap-4 rounded-2xl border border-[#E7E0D2] bg-white p-4 sm:p-5 shadow-sm">
              <Button
                type="button"
                variant="outline"
                size="md"
                fullWidth={false}
                disabled={excelFiles.length === 0}
                onClick={handleResetAll}
                leftIcon={<RotateCcw className="h-4 w-4" />}
                className="w-full sm:w-auto rounded-xl"
              >
                Clear Files
              </Button>

              <div className="flex w-full items-center gap-3 sm:w-auto">
                <Button
                  type="button"
                  variant="secondary"
                  size="md"
                  fullWidth={false}
                  loading={isProcessing}
                  disabled={!isReadyToSubmit || isProcessing}
                  onClick={handleGeneratePicklist}
                  rightIcon={<ArrowRight className="h-4 w-4" />}
                  className="w-full sm:w-auto min-w-0 sm:min-w-[220px] text-xs sm:text-sm rounded-xl"
                >
                  {isReadyToSubmit
                    ? `Upload & Generate (${excelFiles.length} Excel${excelFiles.length > 1 ? "s" : ""})`
                    : "Upload Files"}
                </Button>
              </div>
            </div>
          </>
        )}

        {/* ===================================================== */}
        {/* RESULTS SECTION: Interactive Table Preview */}
        {/* ===================================================== */}
        {hasResults && !isProcessing && (
          <div className="rounded-2xl border border-[#E7E0D2] bg-white p-4 sm:p-6 shadow-sm space-y-4">
            {/* Table Filter Tabs & Search */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#E7E0D2]">
              {/* Filter Tabs */}
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => setStatusFilter("ALL")}
                  className={`inline-flex h-9 sm:h-10 px-3.5 items-center justify-center gap-1.5 rounded-lg border text-xs font-semibold transition ${
                    statusFilter === "ALL"
                      ? "border-[#E8C16D] bg-[#E8C16D] text-[#0A0E1A]"
                      : "border-slate-200 bg-white text-slate-700 hover:border-[#E8C16D]"
                  }`}
                >
                  All ({picklistItems.length})
                </button>

                <button
                  type="button"
                  onClick={() => setStatusFilter("MATCHED")}
                  className={`inline-flex h-9 sm:h-10 px-3.5 items-center justify-center gap-1.5 rounded-lg border text-xs font-semibold transition ${
                    statusFilter === "MATCHED"
                      ? "border-emerald-600 bg-emerald-600 text-white"
                      : "border-slate-200 bg-white text-slate-700 hover:border-emerald-500 hover:text-emerald-700"
                  }`}
                >
                  Matched ({summary.matchedSkus})
                </button>

                <button
                  type="button"
                  onClick={() => setStatusFilter("UNMATCHED")}
                  className={`inline-flex h-9 sm:h-10 px-3.5 items-center justify-center gap-1.5 rounded-lg border text-xs font-semibold transition ${
                    statusFilter === "UNMATCHED"
                      ? "border-rose-600 bg-rose-600 text-white"
                      : "border-slate-200 bg-white text-slate-700 hover:border-rose-500 hover:text-rose-700"
                  }`}
                >
                  Unmatched ({summary.unmatchedSkus})
                </button>

                {missingMyntraSkus.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setIsMissingSkuModalOpen(true)}
                    className="inline-flex h-9 sm:h-10 items-center justify-center rounded-lg border border-red-500/50 bg-red-500/10 px-3.5 text-xs font-semibold text-red-600 dark:text-red-400 transition-all duration-200 hover:bg-red-600 hover:text-white cursor-pointer"
                    title="Click to view Myntra SKUs missing Seller SKU in database"
                  >
                    <span className="whitespace-nowrap">Missing Sku ({missingMyntraSkus.length})</span>
                  </button>
                )}
              </div>

              {/* Search Box */}
              <div className="relative w-full sm:w-72">
                <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search Rack, SKU..."
                  className="h-9 sm:h-10 w-full rounded-lg border border-slate-200 bg-slate-50/50 pl-9 pr-3 text-xs font-medium text-[#0A0E1A] outline-none transition focus:border-[#E8C16D] focus:bg-white"
                />
              </div>
            </div>

            {/* Table View */}
            <div className="overflow-hidden rounded-xl border border-[#E7EAF0]">
              <div className="overflow-x-auto max-h-[550px]">
                <table className="w-full min-w-[750px] text-left border-collapse">
                  <thead className="sticky top-0 z-10 bg-[#0A0E1A] text-white text-xs font-bold uppercase tracking-wider">
                    <tr>
                      <th className="px-4 py-3.5 w-36">Rack</th>
                      <th className="px-4 py-3.5">Seller SKU</th>
                      <th className="px-4 py-3.5 text-center w-24">Qty</th>
                      <th className="px-4 py-3.5">Generate Barcode</th>
                      <th className="px-4 py-3.5">Myntra SKU</th>
                      <th className="px-4 py-3.5 text-center w-28">Status</th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-[#E7EAF0] text-xs">
                    {filteredItems.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-4 py-12 text-center text-slate-500">
                          No matching picklist records found.
                        </td>
                      </tr>
                    ) : (
                      filteredItems.map((item) => (
                        <tr
                          key={item.id}
                          className={`transition-colors hover:bg-slate-50/80 ${
                            item.status === "UNMATCHED" ? "bg-rose-50/40" : ""
                          }`}
                        >
                          {/* Rack Badge */}
                          <td className="px-4 py-3 font-semibold text-[#0A0E1A]">
                            {item.rack === "-" || item.rack === "Unassigned" || !item.rack ? (
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-600 border border-slate-200">
                                -
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-bold bg-amber-50 text-amber-900 border border-amber-200">
                                <Archive className="h-3 w-3 text-[#B88728]" />
                                {item.rack}
                              </span>
                            )}
                          </td>

                          {/* Seller SKU */}
                          <td className="px-4 py-3 font-medium text-[#0A0E1A]">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-xs">
                                {item.sellerSku}
                              </span>
                              {item.sellerSku !== "Not Mapped" && (
                                <button
                                  type="button"
                                  onClick={() => copyToClipboard(item.sellerSku)}
                                  title="Copy Seller SKU"
                                  className="text-slate-400 hover:text-slate-600 transition"
                                >
                                  {copiedSku === item.sellerSku ? (
                                    <Check className="h-3.5 w-3.5 text-emerald-600" />
                                  ) : (
                                    <Copy className="h-3.5 w-3.5" />
                                  )}
                                </button>
                              )}
                            </div>
                          </td>

                          {/* Qty */}
                          <td className="px-4 py-3 text-center">
                            <span className="inline-flex items-center justify-center min-w-[32px] px-2.5 py-0.5 rounded text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                              {item.qty}
                            </span>
                          </td>

                          {/* Generate Barcode */}
                          <td className="px-4 py-3 text-slate-600 font-mono text-[11px]">
                            {item.generateBarcode}
                          </td>

                          {/* Myntra SKU */}
                          <td className="px-4 py-3 text-slate-500 font-mono text-[11px]">
                            {item.myntraSku}
                          </td>

                          {/* Status Badge */}
                          <td className="px-4 py-3 text-center">
                            {item.status === "MATCHED" ? (
                              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700 border border-emerald-200">
                                <CheckCircle2 className="h-3 w-3" /> Matched
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-2 py-0.5 text-[10px] font-bold text-rose-700 border border-rose-200">
                                <AlertCircle className="h-3 w-3" /> Unmatched
                              </span>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              <div className="bg-slate-50 px-4 py-3 border-t border-[#E7EAF0] flex items-center justify-between text-xs text-slate-500">
                <span>
                  Showing {filteredItems.length} of {picklistItems.length} unique SKU records
                </span>
                <span className="font-semibold text-slate-800">
                  Total Units: {filteredItems.reduce((acc, i) => acc + i.qty, 0).toLocaleString()}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Missing SKU Modal (Identical to Amazon Order Process) */}
      <MyntraMissingSkuModal
        isOpen={isMissingSkuModalOpen}
        onClose={() => setIsMissingSkuModalOpen(false)}
        missingSkus={missingMyntraSkus}
        onRefreshMappings={handleRefreshMappings}
        onReset={handleResetAll}
      />
    </DashboardLayout>
  );
}
