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
import { amazonOrderService, AmazonBatchHistoryItem } from "../services/amazonOrder.service";

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
  unmatchedPdfUrl: string | null;
  unmatchedZplPdfUrl: string | null;

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
  downloadUnmatchedPdf: () => void;
  downloadUnmatchedZplPdf: () => void;
  exportToExcel: () => void;
  restoreProcessData: () => Promise<boolean>;

  // 7-Day Batch History
  historyBatches: AmazonBatchHistoryItem[];
  isLoadingHistory: boolean;
  activeHistoryBatchId: string | null;
  initialShowPrinted: boolean;
  setInitialShowPrinted: (val: boolean) => void;
  fetchHistoryBatches: () => Promise<AmazonBatchHistoryItem[]>;
  loadBatchFromHistory: (batchId: string, options?: { showPrinted?: boolean }) => Promise<boolean>;
}

const SESSION_STORAGE_KEY = "amazon_order_process_data_v1";
const METADATA_STORAGE_KEY = "amazon_order_process_metadata_v1";
export const AMAZON_PRINTED_STORAGE_KEY = "amazon_order_process_printed_rows_v1";
export const AMAZON_PRINTED_BATCHES_MAP_KEY = "amazon_printed_batches_map_v2";
export const ACTIVE_HISTORY_BATCH_STORAGE_KEY = "amazon_active_history_batch_id_v1";

export interface StoredBatchPrintedRecord {
  indices: number[];
  count: number;
  orderNumbers?: string[];
  awbs?: string[];
  lastUpdated?: string;
}

export const getPrintedBatchesMap = (): Record<string, StoredBatchPrintedRecord> => {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(AMAZON_PRINTED_BATCHES_MAP_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
        return parsed;
      }
    }
  } catch (e) {
    console.warn("Failed to parse printed batches map:", e);
  }
  return {};
};

const IDB_NAME = "chkudi_orderos_idb_v2";
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

// Helper to convert base64 string to Blob safely without hitting array length limits
const base64ToBlob = (base64Data: string, mimeType = "application/pdf"): Blob | null => {
  try {
    if (!base64Data) return null;
    const clean = base64Data.includes(",") ? base64Data.split(",")[1] : base64Data;
    const binary = atob(clean);
    const sliceSize = 1024 * 1024; // 1MB chunks
    const byteArrays: Uint8Array[] = [];

    for (let offset = 0; offset < binary.length; offset += sliceSize) {
      const slice = binary.slice(offset, offset + sliceSize);
      const byteNumbers = new Uint8Array(slice.length);
      for (let i = 0; i < slice.length; i++) {
        byteNumbers[i] = slice.charCodeAt(i);
      }
      byteArrays.push(byteNumbers);
    }

    return new Blob(byteArrays as any[], { type: mimeType });
  } catch (e) {
    console.error("Failed to convert base64 to Blob:", e);
    return null;
  }
};

// Helper to convert base64 string to a Blob URL
const base64ToBlobUrl = (base64Data: string, mimeType = "application/pdf"): string => {
  try {
    const blob = base64ToBlob(base64Data, mimeType);
    return blob ? URL.createObjectURL(blob) : "";
  } catch (e) {
    console.error("Failed to convert base64 to Blob URL:", e);
    return "";
  }
};

// Helper to download base64 file
const downloadBase64File = (base64Data: string, filename: string, mimeType = "application/pdf") => {
  try {
    const blob = base64ToBlob(base64Data, mimeType);
    if (blob) {
      saveAs(blob, filename);
    }
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
  unmatchedPdfUrl: null,
  unmatchedZplPdfUrl: null,

  // 7-Day History state
  historyBatches: [],
  isLoadingHistory: false,
  activeHistoryBatchId: null,
  initialShowPrinted: false,
  setInitialShowPrinted: (val: boolean) => set({ initialShowPrinted: val }),

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
    // 1. Save files base64 payload to IndexedDB for reliable persistence across tabs and quota limits
    if (data.files) {
      await saveFilesToIDB(data.files);
    }

    const activeBatchId =
      (data.summary as any)?.id ||
      (data.summary as any)?.batchId ||
      get().activeHistoryBatchId ||
      null;

    const updatedSummary = data.summary
      ? {
          ...data.summary,
          id: activeBatchId || undefined,
          batchId: activeBatchId || undefined,
          batchSessionId:
            activeBatchId ||
            (data.summary as any).batchSessionId ||
            `session_${Date.now()}`,
        }
      : null;

    // 2. Save metadata (summary + results) to localStorage (shared across all browser tabs) & sessionStorage
    try {
      if (typeof window !== "undefined") {
        const metadataPayload = JSON.stringify({
          success: data.success,
          summary: updatedSummary,
          results: data.results,
          activeHistoryBatchId: activeBatchId,
        });
        localStorage.setItem(METADATA_STORAGE_KEY, metadataPayload);
        sessionStorage.setItem(SESSION_STORAGE_KEY, metadataPayload);
        if (activeBatchId) {
          localStorage.setItem(ACTIVE_HISTORY_BATCH_STORAGE_KEY, activeBatchId);
        }
      }
    } catch (e) {
      console.warn("Failed to store process metadata in storage:", e);
    }

    // 3. Generate blob URLs for preview in current tab
    let zplUrl = null;
    let combUrl = null;
    let origUrl = null;
    let unmatchUrl = null;
    let unmatchZplUrl = null;

    if (data.files?.convertedZplPdfBase64) {
      zplUrl = base64ToBlobUrl(data.files.convertedZplPdfBase64);
    }
    if (data.files?.combinedPdfBase64) {
      combUrl = base64ToBlobUrl(data.files.combinedPdfBase64);
    }
    if (data.files?.originalPdfBase64) {
      origUrl = base64ToBlobUrl(data.files.originalPdfBase64);
    }
    if (data.files?.unmatchedPdfBase64) {
      unmatchUrl = base64ToBlobUrl(data.files.unmatchedPdfBase64);
    }
    if (data.files?.unmatchedZplBase64) {
      unmatchZplUrl = base64ToBlobUrl(data.files.unmatchedZplBase64);
    }

    set({
      summary: updatedSummary,
      results: data.results,
      files: data.files,
      convertedZplPdfUrl: zplUrl,
      combinedPdfUrl: combUrl,
      originalPdfUrl: origUrl,
      unmatchedPdfUrl: unmatchUrl,
      unmatchedZplPdfUrl: unmatchZplUrl,
    });
  },

  restoreProcessData: async (): Promise<boolean> => {
    try {
      if (typeof window === "undefined") return false;

      // 1. Check if summary & results are in memory or in localStorage / sessionStorage
      let currentSummary = get().summary;
      let currentResults = get().results;
      let currentFiles = get().files;

      if (!currentSummary || currentResults.length === 0) {
        let stored = localStorage.getItem(METADATA_STORAGE_KEY);
        if (!stored) {
          stored = sessionStorage.getItem(SESSION_STORAGE_KEY);
        }
        if (stored) {
          try {
            const parsed = JSON.parse(stored);
            if (parsed && parsed.summary && parsed.results) {
              currentSummary = parsed.summary;
              currentResults = parsed.results;
              if (parsed.files) {
                currentFiles = parsed.files;
              }
            }
          } catch (e) {
            console.warn("Failed to parse stored process metadata:", e);
          }
        }
      }

      if (!currentSummary || currentResults.length === 0) {
        return false;
      }

      // 2. Asynchronously restore files from IndexedDB if not in memory
      if (!currentFiles || (!currentFiles.originalPdfBase64 && !currentFiles.combinedPdfBase64)) {
        const idbFiles = await loadFilesFromIDB();
        if (idbFiles) {
          currentFiles = idbFiles;
        }
      }

      // 3. Generate Blob URLs for the current document context
      let zplUrl = get().convertedZplPdfUrl;
      let combUrl = get().combinedPdfUrl;
      let origUrl = get().originalPdfUrl;
      let unmatchUrl = get().unmatchedPdfUrl;
      let unmatchZplUrl = get().unmatchedZplPdfUrl;

      if (!zplUrl && currentFiles?.convertedZplPdfBase64) {
        zplUrl = base64ToBlobUrl(currentFiles.convertedZplPdfBase64);
      }
      if (!combUrl && currentFiles?.combinedPdfBase64) {
        combUrl = base64ToBlobUrl(currentFiles.combinedPdfBase64);
      }
      if (!origUrl && currentFiles?.originalPdfBase64) {
        origUrl = base64ToBlobUrl(currentFiles.originalPdfBase64);
      }
      if (!unmatchUrl && currentFiles?.unmatchedPdfBase64) {
        unmatchUrl = base64ToBlobUrl(currentFiles.unmatchedPdfBase64);
      }
      if (!unmatchZplUrl && currentFiles?.unmatchedZplBase64) {
        unmatchZplUrl = base64ToBlobUrl(currentFiles.unmatchedZplBase64);
      }

      let restoredBatchId = get().activeHistoryBatchId;
      if (!restoredBatchId && typeof window !== "undefined") {
        restoredBatchId = localStorage.getItem(ACTIVE_HISTORY_BATCH_STORAGE_KEY);
      }
      if (!restoredBatchId && (currentSummary as any)?.id) {
        restoredBatchId = (currentSummary as any).id;
      }
      if (!restoredBatchId && (currentSummary as any)?.batchId) {
        restoredBatchId = (currentSummary as any).batchId;
      }

      set({
        summary: currentSummary,
        results: currentResults,
        files: currentFiles,
        activeHistoryBatchId: restoredBatchId || null,
        convertedZplPdfUrl: zplUrl,
        combinedPdfUrl: combUrl,
        originalPdfUrl: origUrl,
        unmatchedPdfUrl: unmatchUrl,
        unmatchedZplPdfUrl: unmatchZplUrl,
      });

      return true;
    } catch (e) {
      console.error("Failed to restore process data:", e);
      return false;
    }
  },

  loadFromSessionStorage: () => {
    get().restoreProcessData();
    const hasMem = !!get().summary;
    const hasStorage = typeof window !== "undefined" && (!!localStorage.getItem(METADATA_STORAGE_KEY) || !!sessionStorage.getItem(SESSION_STORAGE_KEY));
    return hasMem || hasStorage;
  },

  clearProcessData: () => {
    const { convertedZplPdfUrl, combinedPdfUrl, originalPdfUrl, unmatchedPdfUrl, unmatchedZplPdfUrl } = get();
    if (convertedZplPdfUrl) URL.revokeObjectURL(convertedZplPdfUrl);
    if (combinedPdfUrl) URL.revokeObjectURL(combinedPdfUrl);
    if (originalPdfUrl) URL.revokeObjectURL(originalPdfUrl);
    if (unmatchedPdfUrl) URL.revokeObjectURL(unmatchedPdfUrl);
    if (unmatchedZplPdfUrl) URL.revokeObjectURL(unmatchedZplPdfUrl);

    try {
      if (typeof window !== "undefined") {
        localStorage.removeItem(METADATA_STORAGE_KEY);
        sessionStorage.removeItem(SESSION_STORAGE_KEY);
        localStorage.removeItem(AMAZON_PRINTED_STORAGE_KEY);
        localStorage.removeItem(ACTIVE_HISTORY_BATCH_STORAGE_KEY);
        sessionStorage.removeItem("amazon_show_printed_active");
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
      unmatchedPdfUrl: null,
      unmatchedZplPdfUrl: null,
      activeHistoryBatchId: null,
    });
  },

  fetchHistoryBatches: async () => {
    set({ isLoadingHistory: true });
    try {
      const res = await amazonOrderService.getBatchHistory(7);
      if (res?.data && Array.isArray(res.data)) {
        set({ historyBatches: res.data, isLoadingHistory: false });
        return res.data;
      }
      set({ historyBatches: [], isLoadingHistory: false });
      return [];
    } catch (err) {
      console.warn("Failed to fetch Amazon batch history:", err);
      set({ historyBatches: [], isLoadingHistory: false });
      return [];
    }
  },

  loadBatchFromHistory: async (batchId: string, options?: { showPrinted?: boolean }) => {
    set({ isProcessing: true, progress: 15, currentStage: "Loading batch from history..." });
    try {
      const res = await amazonOrderService.getBatchById(batchId);
      const batch = res?.data;
      if (!batch || !batch.summary || !batch.results) {
        throw new Error("Invalid batch data received from server");
      }

      set({ progress: 45, currentStage: "Fetching batch documents (PDFs & ZPL)..." });

      const fetchBlobAsBase64 = async (
        fileUrl?: string | null,
        fileType?: "combined" | "zpl" | "original" | "unmatched-pdf" | "unmatched-zpl" | string
      ): Promise<string> => {
        try {
          let blob: Blob | null = null;
          if (fileType) {
            try {
              blob = await amazonOrderService.fetchBatchFileBlob(batchId, fileType);
            } catch (e) {}
          }
          if (!blob && fileUrl) {
            const hostUrl = fileUrl.startsWith("http")
              ? fileUrl
              : `${process.env.NEXT_PUBLIC_API_URL?.replace(/\/api\/v1\/?$/, "") || "http://localhost:5000"}${fileUrl.startsWith("/") ? "" : "/"}${fileUrl}`;
            const r = await fetch(hostUrl);
            if (r.ok) blob = await r.blob();
          }
          if (!blob) return "";

          return new Promise((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => {
              const str = reader.result as string;
              resolve(str || "");
            };
            reader.onerror = () => resolve("");
            reader.readAsDataURL(blob);
          });
        } catch (e) {
          console.warn("Error fetching batch file blob:", e);
          return "";
        }
      };

      const [
        combinedPdfBase64,
        convertedZplPdfBase64,
        originalPdfBase64,
        unmatchedPdfBase64,
        unmatchedZplBase64,
      ] = await Promise.all([
        fetchBlobAsBase64(batch.combinedPdfUrl, "combined"),
        fetchBlobAsBase64(batch.zplPdfUrl, "zpl"),
        fetchBlobAsBase64(batch.originalPdfUrl, "original"),
        fetchBlobAsBase64(batch.unmatchedPdfUrl, "unmatched-pdf"),
        fetchBlobAsBase64(batch.unmatchedZplPdfUrl, "unmatched-zpl"),
      ]);

      set({ progress: 85, currentStage: "Restoring order verification..." });

      const files: AmazonProcessFiles = {
        combinedPdfBase64,
        convertedZplPdfBase64,
        originalPdfBase64,
        unmatchedPdfBase64,
        unmatchedZplBase64,
      };

      await get().setProcessData({
        success: true,
        summary: batch.summary
          ? {
              ...batch.summary,
              id: batch.id,
              batchId: batch.id,
              printedIndices: batch.summary.printedIndices || [],
            }
          : batch.summary,
        results: batch.results,
        files,
      });

      if (typeof window !== "undefined") {
        try {
          localStorage.setItem(ACTIVE_HISTORY_BATCH_STORAGE_KEY, batch.id);
        } catch (e) {}
      }

      set({
        activeHistoryBatchId: batch.id,
        initialShowPrinted: !!options?.showPrinted,
        isProcessing: false,
        progress: 100,
        currentStage: "Loaded!",
      });

      return true;
    } catch (err) {
      console.error("Failed to load batch from history:", err);
      set({ isProcessing: false, progress: 0, currentStage: "" });
      return false;
    }
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

  downloadUnmatchedPdf: () => {
    const { files } = get();
    if (!files?.unmatchedPdfBase64) return;
    const filename = `Amazon_Unmatched_Invoices_${Date.now()}.pdf`;
    downloadBase64File(files.unmatchedPdfBase64, filename);
  },

  downloadUnmatchedZplPdf: () => {
    const { files } = get();
    if (!files?.unmatchedZplBase64) return;
    const filename = `Amazon_Unmatched_ZPL_Labels_${Date.now()}.pdf`;
    downloadBase64File(files.unmatchedZplBase64, filename);
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

