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
  Loader2,
  X,
} from "lucide-react";
import * as xlsx from "xlsx";
import ExcelJS from "exceljs";
import { saveAs } from "file-saver";
import { toast } from "sonner";
import DashboardLayout from "@/components/Dashboard/layout/DashboardLayout";
import Button from "@/components/ui/Button";
import Pagination from "@/components/ui/Pagination";
import { getAllMyntraMappings } from "@/components/Dashboard/Products/ManageProducts/services/myntraImport.service";
import type { MyntraMappingRecord } from "@/components/Dashboard/Products/ManageProducts/types/myntraImport.types";
import MyntraMissingSkuModal from "./components/MyntraMissingSkuModal";
import ProcessingProgressModal from "./components/ProcessingProgressModal";
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
  const [progress, setProgress] = useState(0);
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
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
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
    setCurrentPage(1);
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
    setProgress(15);
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
        const stepProgress = Math.min(50, Math.round(15 + ((i + 1) / excelFiles.length) * 35));
        setProgress(stepProgress);
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
      setProgress(65);
      setProcessingStep("Fetching Myntra product mappings...");
      const token = typeof window !== "undefined" ? localStorage.getItem("accessToken") || undefined : undefined;
      const mappingResponse = await getAllMyntraMappings(token);
      const mappings: Record<string, MyntraMappingRecord> = mappingResponse.mappings || {};

      // 3. Cross-reference aggregated SKUs
      setProgress(85);
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

      setProgress(100);
      setProcessingStep("Picklist generated successfully!");
      setCurrentPage(1);
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
      setTimeout(() => {
        setIsProcessing(false);
        setProgress(0);
        setProcessingStep("");
      }, 500);
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

  // Computed pagination
  const totalPages = Math.max(1, Math.ceil(filteredItems.length / itemsPerPage));
  const paginatedItems = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredItems.slice(start, start + itemsPerPage);
  }, [filteredItems, currentPage, itemsPerPage]);

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
        left: 0.2,
        right: 0.2,
        top: 0.25,
        bottom: 0.25,
        header: 0.1,
        footer: 0.1,
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

    const MAX_ROWS_PER_COLUMN = 52;
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
    dateRow.height = 20;
    worksheet.mergeCells(dateRow.number, 1, dateRow.number, hasRightColumn ? 9 : 4);
    const dateCell = dateRow.getCell(1);
    dateCell.font = { bold: true, size: 12, name: "Calibri", color: { argb: "FF0F172A" } };
    dateCell.alignment = { vertical: "middle", horizontal: "center" };
    worksheet.addRow([]).height = 5; // spacer row

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
      headerRow.height = 18;

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
        dataRow.height = 14.5;

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
      <div className="space-y-4 sm:space-y-6">
        {/* ===================================================== */}
        {/* HEADER SECTION matching Amazon Order Process */}
        {/* ===================================================== */}
        <div className="rounded-3xl border border-[#E7E0D2] bg-white p-4 sm:p-7 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="space-y-1.5 min-w-0 max-w-2xl">
              <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-[#0A0E1A] dark:text-white">
                {hasResults ? "Myntra Picklist Results" : "Myntra Picklist"}
              </h1>

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

            <div className="flex items-center gap-2.5 sm:gap-3 w-full sm:w-auto shrink-0 self-start lg:self-center">
              {hasResults ? (
                <>
                  <button
                    type="button"
                    onClick={handleResetAll}
                    className="inline-flex h-11 sm:h-12 w-full sm:w-auto items-center justify-center gap-2 rounded-2xl border border-[#0A0E1A] bg-[#0A0E1A] px-4 sm:px-5 text-xs sm:text-sm font-bold text-[#E8C16D] transition-all hover:bg-[#E8C16D] hover:text-[#0A0E1A] hover:border-[#E8C16D] cursor-pointer shadow-xs active:scale-[0.98]"
                  >
                    <RotateCcw className="h-4 w-4" />
                    <span>New Batch</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleDownloadExcel}
                    disabled={isDownloading}
                    className="inline-flex h-11 sm:h-12 w-full sm:w-auto items-center justify-center gap-2 rounded-2xl border border-transparent bg-[#E8C16D] hover:bg-[#d4af5a] px-5 sm:px-6 text-xs sm:text-sm font-bold text-[#0A0E1A] shadow-xs transition active:scale-[0.98] cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Download className="h-4 w-4 stroke-[2.5]" />
                    <span>{isDownloading ? "Downloading..." : "Download Picklist"}</span>
                  </button>
                </>
              ) : (
                <div className="inline-flex h-10 sm:h-11 items-center px-3.5 sm:px-4 rounded-2xl border border-[#E7E0D2] bg-slate-50/80 shadow-xs">
                  <div className="text-xs sm:text-sm font-bold text-[#0A0E1A] whitespace-nowrap">
                    <span className={excelFiles.length > 0 ? "text-emerald-700" : "text-slate-400"}>
                      {excelFiles.length} Excel File{excelFiles.length !== 1 ? "s" : ""}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Persistent Warning Banner identical to Amazon Order Process */}
          {hasResults && missingMyntraSkus.length > 0 && (
            <div className="mt-5 rounded-2xl sm:rounded-3xl border border-rose-300 bg-rose-50/90 p-4 sm:p-5 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-rose-100 text-rose-700 border border-rose-200/60">
                  <ShieldAlert className="h-5 w-5 animate-pulse" />
                </div>
                <div>
                  <h4 className="text-xs sm:text-sm font-bold text-rose-900">
                    Strict Guard Active: {missingMyntraSkus.length} Myntra SKU(s) Missing Seller SKU
                  </h4>
                  <p className="text-[11px] sm:text-xs text-rose-700">
                    Picklist export is locked until all Myntra SKUs are mapped in Products.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsMissingSkuModalOpen(true)}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-2xl bg-[#0A0E1A] hover:bg-slate-900 px-4 py-2.5 text-xs font-bold text-[#E8C16D] shadow-xs transition active:scale-95 cursor-pointer"
              >
                <Lock className="h-3.5 w-3.5" />
                <span>Resolve Missing SKUs ({missingMyntraSkus.length})</span>
              </button>
            </div>
          )}

          {/* KPI Stats Cards */}
          {hasResults && (
            <div className="mt-5 sm:mt-6 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4 border-t border-[#E7E0D2] pt-5 sm:pt-6">
              {/* Total Orders */}
              <article className="rounded-2xl sm:rounded-3xl border border-[#E7E0D2] bg-white p-4 sm:p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md hover:border-[#E8C16D]/40 flex flex-col justify-between">
                <p className="text-xs sm:text-sm font-bold text-slate-500 uppercase tracking-wider">Total Orders</p>
                <div className="mt-3 sm:mt-4 flex items-end justify-between gap-2">
                  <h3 className="text-2xl sm:text-3xl font-black text-[#0A0E1A]">
                    {summary.totalOrders.toLocaleString()}
                  </h3>
                  <span className="rounded-xl border border-blue-200/60 bg-blue-50 px-2.5 py-1 text-xs font-bold text-blue-700">
                    Orders
                  </span>
                </div>
              </article>

              {/* Total Units */}
              <article className="rounded-2xl sm:rounded-3xl border border-[#E7E0D2] bg-white p-4 sm:p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md hover:border-[#E8C16D]/40 flex flex-col justify-between">
                <p className="text-xs sm:text-sm font-bold text-slate-500 uppercase tracking-wider">Total Units</p>
                <div className="mt-3 sm:mt-4 flex items-end justify-between gap-2">
                  <h3 className="text-2xl sm:text-3xl font-black text-[#0A0E1A]">
                    {summary.totalUnits.toLocaleString()}
                  </h3>
                  <span className="rounded-xl border border-indigo-200/60 bg-indigo-50 px-2.5 py-1 text-xs font-bold text-indigo-700">
                    Units
                  </span>
                </div>
              </article>

              {/* Unique SKUs */}
              <article className="rounded-2xl sm:rounded-3xl border border-[#E7E0D2] bg-white p-4 sm:p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md hover:border-[#E8C16D]/40 flex flex-col justify-between">
                <p className="text-xs sm:text-sm font-bold text-slate-500 uppercase tracking-wider">Unique SKUs</p>
                <div className="mt-3 sm:mt-4 flex items-end justify-between gap-2">
                  <h3 className="text-2xl sm:text-3xl font-black text-[#0A0E1A]">
                    {summary.uniqueSkus.toLocaleString()}
                  </h3>
                  <span className="rounded-xl border border-amber-200/60 bg-amber-50 px-2.5 py-1 text-xs font-bold text-amber-800">
                    SKUs
                  </span>
                </div>
              </article>

              {/* Matched SKUs */}
              <article className="rounded-2xl sm:rounded-3xl border border-[#E7E0D2] bg-white p-4 sm:p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md hover:border-[#E8C16D]/40 flex flex-col justify-between">
                <p className="text-xs sm:text-sm font-bold text-slate-500 uppercase tracking-wider">Matched SKUs</p>
                <div className="mt-3 sm:mt-4 flex items-end justify-between gap-2">
                  <h3 className="text-2xl sm:text-3xl font-black text-emerald-700">
                    {summary.matchedSkus.toLocaleString()}
                  </h3>
                  <span className="rounded-xl border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-700">
                    Matched
                  </span>
                </div>
              </article>

              {/* Unmatched SKUs */}
              <article className="rounded-2xl sm:rounded-3xl border border-[#E7E0D2] bg-white p-4 sm:p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md hover:border-[#E8C16D]/40 flex flex-col justify-between col-span-2 sm:col-span-1">
                <p className="text-xs sm:text-sm font-bold text-slate-500 uppercase tracking-wider">Unmatched SKUs</p>
                <div className="mt-3 sm:mt-4 flex items-end justify-between gap-2">
                  <h3 className="text-2xl sm:text-3xl font-black text-rose-700">
                    {summary.unmatchedSkus.toLocaleString()}
                  </h3>
                  <span className="rounded-xl border border-rose-200 bg-rose-50 px-2.5 py-1 text-xs font-bold text-rose-700">
                    Unmatched
                  </span>
                </div>
              </article>
            </div>
          )}
        </div>

        {/* Processing State Indicator */}
        {isProcessing && (
          <div className="rounded-2xl sm:rounded-3xl border border-[#E7E0D2] bg-white p-8 sm:p-12 shadow-sm text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#FFF9EC] border border-[#E8C16D]/40 text-[#B88728] animate-pulse mb-3">
              <Sparkles className="h-7 w-7 animate-spin" />
            </div>
            <h3 className="text-lg font-bold text-[#0A0E1A]">Processing Your Picklist...</h3>
            <p className="text-sm font-medium text-slate-500 mt-1">{processingStep}</p>
            <div className="w-full max-w-md mx-auto bg-slate-100 rounded-full h-2.5 mt-4 overflow-hidden border border-slate-200">
              <div className="bg-[#E8C16D] h-full w-2/3 animate-[pulse_1s_ease-in-out_infinite] rounded-full" />
            </div>
          </div>
        )}

        {/* Upload Section (Shown when no results or when user is preparing files) */}
        {!hasResults && !isProcessing && (
          <>
            <div className="grid grid-cols-1 gap-6">
              <div className="flex flex-col rounded-2xl sm:rounded-3xl border border-[#E7E0D2] bg-white p-4 sm:p-6 shadow-sm transition-all hover:border-[#E8C16D]/40 hover:shadow-md">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3 sm:pb-3.5 gap-2">
                  <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
                    <div className="grid h-10 w-10 sm:h-11 sm:w-11 place-items-center rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-200/60 shrink-0">
                      <FileSpreadsheet className="h-5 w-5" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-bold text-[#0A0E1A] text-sm sm:text-base truncate">
                        Excel Order Files {excelFiles.length > 0 ? `(${excelFiles.length})` : ""}
                      </h3>
                      <p className="text-[11px] sm:text-xs text-slate-500 truncate">
                        Upload one or multiple .xlsx, .xls, .csv files
                      </p>
                    </div>
                  </div>

                  {excelFiles.length > 0 ? (
                    <span className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-50 px-2.5 py-0.5 text-xs font-bold text-emerald-700 border border-emerald-200 shrink-0">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      {excelFiles.length} Ready
                    </span>
                  ) : (
                    <span className="inline-flex items-center rounded-lg bg-amber-50 px-2.5 py-0.5 text-xs font-bold text-amber-800 border border-amber-200 shrink-0">
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
                      className={`group relative flex min-h-[190px] sm:min-h-[210px] xl:min-h-[230px] cursor-pointer flex-col items-center justify-center rounded-2xl sm:rounded-3xl border-2 border-dashed p-4 sm:p-6 text-center transition-all ${
                        isDragging
                          ? "border-[#E8C16D] bg-[#FFF9EC]"
                          : "border-[#E7E0D2] bg-[#FAF8F5] hover:border-[#E8C16D] hover:bg-[#FFFDF5]"
                      }`}
                    >
                      <div className="mb-2.5 grid h-12 w-12 sm:h-14 sm:w-14 place-items-center rounded-2xl bg-white text-slate-500 border border-slate-200 shadow-xs transition-all group-hover:scale-110 group-hover:border-[#E8C16D] group-hover:text-emerald-600">
                        <UploadCloud className="h-6 w-6 sm:h-7 sm:w-7" />
                      </div>

                      <p className="text-xs sm:text-sm font-bold text-[#0A0E1A]">
                        Click to upload or drag & drop Excel(s)
                      </p>
                      <p className="mt-0.5 text-[11px] sm:text-xs text-slate-500 max-w-xs sm:max-w-none">
                        Select one or multiple Myntra Order Excel (<code className="font-mono text-emerald-600 font-semibold">.xlsx, .xls, .csv</code>) files
                      </p>

                      <div className="mt-3 inline-flex items-center gap-1.5 text-xs font-bold text-[#0A0E1A] bg-white px-3.5 py-2 rounded-xl border border-slate-200 shadow-2xs group-hover:border-[#E8C16D] transition active:scale-[0.98]">
                        <FileSpreadsheet className="h-3.5 w-3.5 text-emerald-500" />
                        Browse Excel Files
                      </div>
                    </div>
                  ) : (
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      onDragOver={handleDragOver}
                      onDragLeave={handleDragLeave}
                      onDrop={handleDrop}
                      className={`flex min-h-[190px] sm:min-h-[210px] xl:min-h-[230px] flex-col justify-between rounded-2xl border-2 p-3 sm:p-4 transition-all cursor-pointer ${
                        isDragging
                          ? "border-[#E8C16D] bg-[#FFF9EC]"
                          : "border-emerald-200 bg-emerald-50/20 hover:border-[#E8C16D]/70"
                      }`}
                    >
                      <div className="flex-1 flex flex-col min-h-0">
                        {/* Scrollable file cards */}
                        <div
                          onClick={(e) => e.stopPropagation()}
                          className="max-h-36 sm:max-h-44 overflow-y-auto space-y-2 pr-1 cursor-default"
                        >
                          {excelFiles.map((file, idx) => (
                            <div
                              key={`${file.name}_${idx}`}
                              className="flex items-center justify-between gap-2.5 rounded-xl border border-[#E7E0D2] bg-white p-2.5 sm:p-3 shadow-2xs hover:border-[#E8C16D]/40 transition"
                            >
                              <div className="flex items-center gap-2.5 min-w-0 flex-1">
                                <div className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-200/50">
                                  <FileSpreadsheet className="h-4 w-4" />
                                </div>
                                <div className="min-w-0 flex-1">
                                  <p className="truncate text-xs font-bold text-[#0A0E1A]" title={file.name}>
                                    {file.name}
                                  </p>
                                  <p className="text-[10px] sm:text-[11px] text-slate-500 font-medium">
                                    {formatFileSize(file.size)}
                                  </p>
                                </div>
                              </div>

                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleRemoveSingleFile(idx);
                                }}
                                title="Remove this file"
                                className="grid h-7 w-7 shrink-0 place-items-center rounded-lg text-slate-400 transition hover:bg-red-50 hover:text-red-600 cursor-pointer"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Footer summary bar */}
                      <div className="mt-3 pt-2.5 border-t border-emerald-200/70 flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-900 min-w-0 truncate">
                          <span className="whitespace-nowrap">
                            {excelFiles.length} file{excelFiles.length > 1 ? "s" : ""}
                          </span>
                          <span className="text-slate-400">•</span>
                          <span className="text-emerald-700 font-medium truncate">
                            {formatFileSize(totalExcelSize)}
                          </span>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              fileInputRef.current?.click();
                            }}
                            className="inline-flex items-center gap-1.5 text-xs font-bold text-[#0A0E1A] bg-[#FFF9EC] hover:bg-[#FFF3D6] px-3 py-1.5 rounded-xl border border-[#E8C16D] ring-2 ring-[#E8C16D]/20 shadow-xs transition active:scale-[0.98] cursor-pointer"
                          >
                            <Plus className="h-3.5 w-3.5 text-[#B88728]" />
                            <span>Add More</span>
                          </button>

                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRemoveAllFiles();
                            }}
                            className="inline-flex items-center gap-1.5 text-xs font-bold text-red-600 bg-white hover:bg-red-50 px-3 py-1.5 rounded-xl border border-red-200 hover:border-red-300 shadow-xs transition active:scale-[0.98] cursor-pointer"
                          >
                            <Trash2 className="h-3.5 w-3.5 text-red-500" />
                            <span>Clear All</span>
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
                    <div className="mt-3 flex items-center gap-2 rounded-xl bg-red-50 p-2.5 sm:p-3 text-xs text-red-700 border border-red-200">
                      <AlertCircle className="h-4 w-4 shrink-0 text-red-600" />
                      <span>{fileError}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Action Controls Bar */}
            <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-between gap-3 sm:gap-4 rounded-2xl sm:rounded-3xl border border-[#E7E0D2] bg-white p-3.5 sm:p-5 shadow-sm">
              <button
                type="button"
                disabled={excelFiles.length === 0}
                onClick={handleResetAll}
                className="inline-flex h-11 sm:h-12 items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-slate-100 px-4 sm:px-5 text-xs sm:text-sm font-bold text-slate-700 hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition shadow-xs active:scale-[0.98] cursor-pointer disabled:opacity-40 disabled:hover:bg-slate-100 disabled:hover:text-slate-700"
              >
                <RotateCcw className="h-4 w-4" />
                <span>Clear Files</span>
              </button>

              <div className="flex w-full items-center gap-3 sm:w-auto">
                <button
                  type="button"
                  disabled={!isReadyToSubmit || isProcessing}
                  onClick={handleGeneratePicklist}
                  className="w-full sm:w-auto inline-flex h-11 sm:h-12 items-center justify-center gap-2 rounded-2xl border border-transparent bg-[#E8C16D] px-6 sm:px-8 text-xs sm:text-sm font-bold text-[#0A0E1A] shadow-xs hover:bg-[#d4af5a] transition active:scale-[0.98] cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Processing Files...</span>
                    </>
                  ) : isReadyToSubmit ? (
                    <>
                      <span>
                        Upload & Generate ({excelFiles.length} Excel{excelFiles.length > 1 ? "s" : ""})
                      </span>
                      <ArrowRight className="h-4 w-4" />
                    </>
                  ) : (
                    <>
                      <span>Upload Required Files</span>
                      <ArrowRight className="h-4 w-4 opacity-50" />
                    </>
                  )}
                </button>
              </div>
            </div>
          </>
        )}

        {/* ===================================================== */}
        {/* RESULTS SECTION: Interactive Table Preview */}
        {/* ===================================================== */}
        {hasResults && !isProcessing && (
          <div className="rounded-2xl sm:rounded-3xl border border-[#E7E0D2] bg-white p-4 sm:p-6 shadow-sm space-y-4">
            {/* Table Toolbar: Search (Left) & Filter Tabs (Right) */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-[#E7E0D2]">
              {/* Search Box (Left) */}
              <div className="group flex items-center gap-2.5 rounded-2xl border border-[#E7E0D2] bg-white px-3.5 sm:px-4 h-11 shadow-xs transition-all hover:border-[#E8C16D] hover:bg-slate-50/50 focus-within:border-[#E8C16D] focus-within:ring-2 focus-within:ring-[#E8C16D]/30 focus-within:bg-white w-full sm:w-80 md:w-96">
                <div className="grid h-6 w-6 place-items-center rounded-md bg-[#FFF9EC] text-[#B88728] shrink-0 border border-[#E8C16D]/30">
                  <Search className="h-3.5 w-3.5" />
                </div>
                <input
                  type="text"
                  placeholder="Search Rack, SKU, Barcode..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full bg-transparent text-xs sm:text-sm font-semibold text-[#0A0E1A] placeholder:font-normal placeholder:text-slate-400 outline-none"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => {
                      setSearchQuery("");
                      setCurrentPage(1);
                    }}
                    className="grid h-5 w-5 place-items-center rounded-full text-slate-400 hover:text-red-500 hover:bg-red-50 transition cursor-pointer shrink-0"
                    title="Clear search"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>

              {/* Status Filter Tabs & Missing SKU Button (Right) */}
              <div className="flex flex-wrap items-center gap-2 sm:gap-2.5 shrink-0">
                <div className="inline-flex h-11 items-center rounded-2xl border border-[#E7E0D2] bg-slate-50/80 p-1 shadow-xs">
                  <button
                    type="button"
                    onClick={() => {
                      setStatusFilter("ALL");
                      setCurrentPage(1);
                    }}
                    className={`h-full px-3.5 sm:px-4 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                      statusFilter === "ALL"
                        ? "bg-[#0A0E1A] text-[#E8C16D] shadow-xs"
                        : "text-slate-600 hover:text-[#0A0E1A] hover:bg-white/60"
                    }`}
                  >
                    <span>All</span>
                    <span
                      className={`inline-flex items-center justify-center px-1.5 py-0.5 rounded-md text-[11px] font-bold ${
                        statusFilter === "ALL"
                          ? "bg-[#FFF9EC]/15 text-[#E8C16D]"
                          : "bg-slate-200/70 text-slate-700"
                      }`}
                    >
                      {picklistItems.length}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setStatusFilter("MATCHED");
                      setCurrentPage(1);
                    }}
                    className={`h-full px-3.5 sm:px-4 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                      statusFilter === "MATCHED"
                        ? "bg-[#0A0E1A] text-[#E8C16D] shadow-xs"
                        : "text-slate-600 hover:text-[#0A0E1A] hover:bg-white/60"
                    }`}
                  >
                    <span>Matched</span>
                    <span
                      className={`inline-flex items-center justify-center px-1.5 py-0.5 rounded-md text-[11px] font-bold ${
                        statusFilter === "MATCHED"
                          ? "bg-emerald-500/20 text-emerald-400"
                          : "bg-emerald-50 text-emerald-700 border border-emerald-200/60"
                      }`}
                    >
                      {summary.matchedSkus}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setStatusFilter("UNMATCHED");
                      setCurrentPage(1);
                    }}
                    className={`h-full px-3.5 sm:px-4 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                      statusFilter === "UNMATCHED"
                        ? "bg-[#0A0E1A] text-[#E8C16D] shadow-xs"
                        : "text-slate-600 hover:text-[#0A0E1A] hover:bg-white/60"
                    }`}
                  >
                    <span>Unmatched</span>
                    <span
                      className={`inline-flex items-center justify-center px-1.5 py-0.5 rounded-md text-[11px] font-bold ${
                        statusFilter === "UNMATCHED"
                          ? "bg-rose-500/20 text-rose-300"
                          : "bg-rose-50 text-rose-700 border border-rose-200/60"
                      }`}
                    >
                      {summary.unmatchedSkus}
                    </span>
                  </button>
                </div>

                {missingMyntraSkus.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setIsMissingSkuModalOpen(true)}
                    className="inline-flex h-11 items-center justify-center rounded-2xl border border-red-200 bg-red-50 hover:bg-red-100 text-red-600 px-3.5 sm:px-4 text-xs sm:text-sm font-bold transition-all shadow-xs active:scale-[0.98] cursor-pointer"
                    title="Click to view Myntra SKUs missing Seller SKU in database"
                  >
                    <span className="whitespace-nowrap">Missing Sku ({missingMyntraSkus.length})</span>
                  </button>
                )}
              </div>
            </div>            {/* Table View */}
            <div className="overflow-hidden rounded-2xl sm:rounded-3xl border border-[#E7E0D2] bg-white shadow-sm flex flex-col">
              <div className="w-full overflow-x-auto" style={{ WebkitOverflowScrolling: "touch" }}>
                <table className="w-full min-w-[750px] border-collapse text-left font-sans">
                  <thead className="bg-[#0A0E1A] text-xs sm:text-sm font-semibold tracking-wider text-[#E8C16D] border-b border-[#E7E0D2]">
                    <tr>
                      <th className="px-3 sm:px-4 py-3.5 text-center font-semibold whitespace-nowrap min-w-[120px]">Rack</th>
                      <th className="px-3 sm:px-4 py-3.5 text-center font-semibold whitespace-nowrap min-w-[160px]">Seller SKU</th>
                      <th className="px-3 sm:px-4 py-3.5 text-center font-semibold whitespace-nowrap w-24">Qty</th>
                      <th className="px-3 sm:px-4 py-3.5 text-center font-semibold whitespace-nowrap min-w-[150px]">Generate Barcode</th>
                      <th className="px-3 sm:px-4 py-3.5 text-center font-semibold whitespace-nowrap min-w-[150px]">Myntra SKU</th>
                      <th className="px-3 sm:px-4 py-3.5 text-center font-semibold whitespace-nowrap w-28">Status</th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-[#E7E0D2] bg-white text-xs sm:text-sm font-sans">
                    {filteredItems.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-4 py-12 text-center text-slate-500">
                          <div className="flex flex-col items-center justify-center gap-2">
                            <Search className="h-8 w-8 text-slate-300" />
                            <p className="font-bold text-[#0A0E1A]">No matching picklist records found</p>
                            <p className="text-xs text-slate-400">Try adjusting your search query or filter tab.</p>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      paginatedItems.map((item) => (
                        <tr
                          key={item.id}
                          className={`transition-colors ${
                            item.status === "UNMATCHED" ? "bg-rose-50/40 hover:bg-rose-50/70" : "hover:bg-slate-50/80"
                          }`}
                        >
                          {/* Rack Badge */}
                          <td className="px-3 sm:px-4 py-3.5 text-center">
                            {item.rack === "-" || item.rack === "Unassigned" || !item.rack ? (
                              <span className="text-slate-400 font-normal italic">-</span>
                            ) : (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs sm:text-sm font-semibold bg-[#FFF9EC] text-[#0A0E1A] border border-[#E8C16D]/40">
                                <Archive className="h-3.5 w-3.5 text-[#B88728]" />
                                {item.rack}
                              </span>
                            )}
                          </td>

                          {/* Seller SKU */}
                          <td className="px-3 sm:px-4 py-3.5 text-center">
                            <div className="inline-flex items-center justify-center gap-2">
                              <span className="text-xs sm:text-sm font-semibold text-slate-900">
                                {item.sellerSku}
                              </span>
                              {item.sellerSku !== "Not Mapped" && (
                                <button
                                  type="button"
                                  onClick={() => copyToClipboard(item.sellerSku)}
                                  title="Copy Seller SKU"
                                  className="text-slate-400 hover:text-slate-600 transition cursor-pointer"
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
                          <td className="px-3 sm:px-4 py-3.5 text-center">
                            <span className="text-xs sm:text-sm font-semibold text-slate-900">
                              {item.qty}
                            </span>
                          </td>

                          {/* Generate Barcode */}
                          <td className="px-3 sm:px-4 py-3.5 text-center">
                            <span className="text-xs sm:text-sm font-semibold text-slate-800">
                              {item.generateBarcode || "-"}
                            </span>
                          </td>

                          {/* Myntra SKU */}
                          <td className="px-3 sm:px-4 py-3.5 text-center">
                            <span className="text-xs sm:text-sm font-semibold text-slate-800">
                              {item.myntraSku}
                            </span>
                          </td>

                          {/* Status Badge */}
                          <td className="px-3 sm:px-4 py-3.5 text-center">
                            {item.status === "MATCHED" ? (
                              <span className="inline-flex items-center gap-1 rounded-lg bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 border border-emerald-200">
                                <CheckCircle2 className="h-3.5 w-3.5" /> Matched
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 rounded-lg bg-rose-50 px-2.5 py-0.5 text-xs font-semibold text-rose-700 border border-rose-200">
                                <AlertCircle className="h-3.5 w-3.5" /> Unmatched
                              </span>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Footer Pagination Bar */}
              {filteredItems.length > 0 && (
                <Pagination
                  page={currentPage}
                  totalPages={totalPages}
                  total={filteredItems.length}
                  limit={itemsPerPage}
                  itemName="records"
                  variant="dark"
                  className="bg-[#0A0E1A] px-4 py-3.5 sm:py-4 mt-auto border-t border-slate-800"
                  onPageChange={setCurrentPage}
                  onLimitChange={(newLimit) => {
                    setItemsPerPage(newLimit);
                    setCurrentPage(1);
                  }}
                />
              )}
            </div>
          </div>
        )}
      </div>

      {/* Real-time Processing Progress Modal */}
      <ProcessingProgressModal
        isOpen={isProcessing}
        progress={progress}
        currentStage={processingStep}
      />

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
