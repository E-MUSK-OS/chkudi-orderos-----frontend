"use client";

import { create } from "zustand";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import {
  AmazonComparisonResult,
  AmazonOrderSummary,
  AmazonProcessFiles,
  AmazonProcessResponse,
} from "../types";
import { cleanCustomerName } from "../utils";

interface AmazonOrderState {
  isProcessing: boolean;
  progress: number;
  currentStage: string;
  summary: AmazonOrderSummary | null;
  results: AmazonComparisonResult[];
  files: AmazonProcessFiles | null;

  // Blob URLs for preview
  convertedZplPdfUrl: string | null;
  combinedPdfUrl: string | null;
  originalPdfUrl: string | null;

  // Actions
  setProcessing: (isProcessing: boolean) => void;
  setProgress: (progress: number, stage?: string) => void;
  setProcessData: (data: AmazonProcessResponse) => void;
  clearProcessData: () => void;
  loadFromSessionStorage: () => boolean;

  // Downloads & Exports
  downloadConvertedZplPdf: () => void;
  downloadCombinedPdf: () => void;
  downloadOriginalPdf: () => void;
  exportToExcel: () => void;
}

const SESSION_STORAGE_KEY = "amazon_order_process_data_v1";

const IDB_NAME = "chkudi_orderos_idb";
const IDB_STORE = "amazon_files";
const IDB_KEY = "latest_files";

function openIDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === "undefined" || !window.indexedDB) {
      return reject("IndexedDB not available");
    }
    const request = indexedDB.open(IDB_NAME, 1);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(IDB_STORE)) {
        db.createObjectStore(IDB_STORE);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function saveFilesToIDB(files: AmazonProcessFiles | null): Promise<void> {
  try {
    const db = await openIDB();
    const tx = db.transaction(IDB_STORE, "readwrite");
    const store = tx.objectStore(IDB_STORE);
    if (files) {
      store.put(files, IDB_KEY);
    } else {
      store.delete(IDB_KEY);
    }
    return new Promise((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch (e) {
    console.warn("Failed to save files to IndexedDB:", e);
  }
}

export async function loadFilesFromIDB(): Promise<AmazonProcessFiles | null> {
  try {
    const db = await openIDB();
    const tx = db.transaction(IDB_STORE, "readonly");
    const store = tx.objectStore(IDB_STORE);
    const request = store.get(IDB_KEY);
    return new Promise((resolve, reject) => {
      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });
  } catch (e) {
    console.warn("Failed to load files from IndexedDB:", e);
    return null;
  }
}

// Helper to convert base64 string to a Blob URL
const base64ToBlobUrl = (base64Data: string, mimeType = "application/pdf"): string => {
  try {
    const byteCharacters = atob(base64Data);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    const blob = new Blob([byteArray], { type: mimeType });
    return URL.createObjectURL(blob);
  } catch (e) {
    console.error("Failed to convert base64 to Blob URL:", e);
    return "";
  }
};

// Helper to download base64 file
const downloadBase64File = (base64Data: string, filename: string, mimeType = "application/pdf") => {
  try {
    const byteCharacters = atob(base64Data);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    const blob = new Blob([byteArray], { type: mimeType });
    saveAs(blob, filename);
  } catch (e) {
    console.error("Failed to download file:", e);
  }
};

export const useAmazonOrderStore = create<AmazonOrderState>((set, get) => ({
  isProcessing: false,
  progress: 0,
  currentStage: "",
  summary: null,
  results: [],
  files: null,
  convertedZplPdfUrl: null,
  combinedPdfUrl: null,
  originalPdfUrl: null,

  setProcessing: (isProcessing) =>
    set({
      isProcessing,
      progress: isProcessing ? 1 : 0,
    }),

  setProgress: (newProgress, stage) =>
    set((state) => {
      const clamped = Math.min(100, Math.max(1, Math.round(newProgress)));
      // When processing, progress can only increase monotonically, never jump backwards
      const nextProgress = state.isProcessing ? Math.max(state.progress, clamped) : clamped;
      return {
        progress: nextProgress,
        currentStage: stage !== undefined ? stage : state.currentStage,
      };
    }),

  setProcessData: async (data) => {
    // Save files base64 payload to IndexedDB for reliable persistence across 5MB quota limits
    if (data.files) {
      await saveFilesToIDB(data.files);
    }

    // Generate blob URLs
    let zplUrl = null;
    let combUrl = null;
    let origUrl = null;

    if (data.files?.convertedZplPdfBase64) {
      zplUrl = base64ToBlobUrl(data.files.convertedZplPdfBase64);
    }
    if (data.files?.combinedPdfBase64) {
      combUrl = base64ToBlobUrl(data.files.combinedPdfBase64);
    }
    if (data.files?.originalPdfBase64) {
      origUrl = base64ToBlobUrl(data.files.originalPdfBase64);
    }

    // Save to sessionStorage (fallback to metadata-only if base64 exceeds quota)
    try {
      if (typeof window !== "undefined") {
        try {
          sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(data));
        } catch {
          // If base64 strings exceed 5MB quota, store only summary & results
          sessionStorage.setItem(
            SESSION_STORAGE_KEY,
            JSON.stringify({
              success: data.success,
              summary: data.summary,
              results: data.results,
            })
          );
        }
      }
    } catch (e) {
      // Storage unavailable or completely full
    }

    set({
      summary: data.summary,
      results: data.results,
      files: data.files,
      convertedZplPdfUrl: zplUrl,
      combinedPdfUrl: combUrl,
      originalPdfUrl: origUrl,
    });
  },

  loadFromSessionStorage: () => {
    try {
      if (typeof window === "undefined") return false;
      const stored = sessionStorage.getItem(SESSION_STORAGE_KEY);
      if (!stored) return false;

      const data: AmazonProcessResponse = JSON.parse(stored);
      if (!data || !data.summary || !data.results) return false;

      const currentFiles = data.files || get().files;

      let zplUrl = null;
      let combUrl = null;
      let origUrl = null;

      if (currentFiles?.convertedZplPdfBase64) {
        zplUrl = base64ToBlobUrl(currentFiles.convertedZplPdfBase64);
      }
      if (currentFiles?.combinedPdfBase64) {
        combUrl = base64ToBlobUrl(currentFiles.combinedPdfBase64);
      }
      if (currentFiles?.originalPdfBase64) {
        origUrl = base64ToBlobUrl(currentFiles.originalPdfBase64);
      }

      set({
        summary: data.summary,
        results: data.results,
        files: currentFiles,
        convertedZplPdfUrl: zplUrl,
        combinedPdfUrl: combUrl,
        originalPdfUrl: origUrl,
      });

      // Asynchronously restore files from IndexedDB if not present in sessionStorage
      if (!currentFiles) {
        loadFilesFromIDB().then((idbFiles) => {
          if (idbFiles) {
            let idbZplUrl = null;
            let idbCombUrl = null;
            let idbOrigUrl = null;

            if (idbFiles.convertedZplPdfBase64) {
              idbZplUrl = base64ToBlobUrl(idbFiles.convertedZplPdfBase64);
            }
            if (idbFiles.combinedPdfBase64) {
              idbCombUrl = base64ToBlobUrl(idbFiles.combinedPdfBase64);
            }
            if (idbFiles.originalPdfBase64) {
              idbOrigUrl = base64ToBlobUrl(idbFiles.originalPdfBase64);
            }

            set({
              files: idbFiles,
              convertedZplPdfUrl: idbZplUrl,
              combinedPdfUrl: idbCombUrl,
              originalPdfUrl: idbOrigUrl,
            });
          }
        });
      }

      return true;
    } catch (e) {
      console.error("Failed to load from sessionStorage:", e);
      return false;
    }
  },

  clearProcessData: () => {
    const { convertedZplPdfUrl, combinedPdfUrl, originalPdfUrl } = get();
    if (convertedZplPdfUrl) URL.revokeObjectURL(convertedZplPdfUrl);
    if (combinedPdfUrl) URL.revokeObjectURL(combinedPdfUrl);
    if (originalPdfUrl) URL.revokeObjectURL(originalPdfUrl);

    try {
      if (typeof window !== "undefined") {
        sessionStorage.removeItem(SESSION_STORAGE_KEY);
      }
    } catch (e) {}

    saveFilesToIDB(null);

    set({
      isProcessing: false,
      progress: 0,
      currentStage: "",
      summary: null,
      results: [],
      files: null,
      convertedZplPdfUrl: null,
      combinedPdfUrl: null,
      originalPdfUrl: null,
    });
  },

  downloadConvertedZplPdf: () => {
    const { files, summary } = get();
    if (!files?.convertedZplPdfBase64) return;
    const filename = `Amazon_ZPL_Converted_Labels_${Date.now()}.pdf`;
    downloadBase64File(files.convertedZplPdfBase64, filename);
  },

  downloadCombinedPdf: () => {
    const { files } = get();
    if (!files?.combinedPdfBase64) return;
    const filename = `Amazon_Matched_Paired_Orders_${Date.now()}.pdf`;
    downloadBase64File(files.combinedPdfBase64, filename);
  },

  downloadOriginalPdf: () => {
    const { files, summary } = get();
    if (!files?.originalPdfBase64) return;
    const filename = summary?.pdfFileName || `Amazon_Original_Invoices_${Date.now()}.pdf`;
    downloadBase64File(files.originalPdfBase64, filename);
  },

  exportToExcel: () => {
    const { results, summary } = get();
    if (!results || results.length === 0) return;

    const exportData = results.map((r) => {
      const invoiceVal =
        r.pdfInvoice && r.pdfInvoice !== "Not Found in PDF"
          ? r.pdfInvoice
          : r.zplInvoice && r.zplInvoice !== "Not Found in ZPL" && r.zplInvoice !== "N/A"
          ? r.zplInvoice
          : "N/A";

      return {
        "Sr No": r.index,
        "Match Status": r.isMatch ? "MATCHED" : "MISMATCH",
        "Invoice #": invoiceVal,
        "Amazon Order Number": r.orderNumber,
        "AWB / Tracking Number": r.awb,
        "ASIN": r.asin || "N/A",
        "Seller SKU": r.sellerSku || "N/A",
        "Customer Name": cleanCustomerName(r.customer),
        "Invoice Amount": r.amount,
        "Invoice Date": r.date,
        "PDF Page(s)": r.pdfPages.join(", ") || "N/A",
        "ZPL Label Page": r.zplPage,
      };
    });

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Order Verification");

    // Auto-fit columns
    const colWidths = [
      { wch: 8 },  // Sr No
      { wch: 14 }, // Match Status
      { wch: 20 }, // Invoice #
      { wch: 24 }, // Order Number
      { wch: 20 }, // AWB
      { wch: 16 }, // ASIN
      { wch: 22 }, // Seller SKU
      { wch: 24 }, // Customer
      { wch: 14 }, // Amount
      { wch: 14 }, // Date
      { wch: 16 }, // PDF Pages
      { wch: 16 }, // ZPL Page
    ];
    worksheet["!cols"] = colWidths;

    const excelBuffer = XLSX.write(workbook, {
      bookType: "xlsx",
      type: "array",
    });

    const blob = new Blob([excelBuffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });

    saveAs(
      blob,
      `Amazon_Order_Verification_Report_${Date.now()}.xlsx`
    );
  },
}));

