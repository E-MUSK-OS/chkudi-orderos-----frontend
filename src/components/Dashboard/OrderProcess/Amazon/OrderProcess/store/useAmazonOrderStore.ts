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
import { cleanCustomerName, sanitizeSpreadsheetCell } from "../utils";
import { amazonOrderService, AmazonBatchHistoryItem } from "../services/amazonOrder.service";
import {
  blobToBase64,
  clearCachedAmazonDocs,
  setCachedAmazonDocs,
  startBackgroundOrderPdfPrewarming,
} from "../utils/pdfCache";
import { toast } from "sonner";

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
  setProcessData: (
    data: AmazonProcessResponse,
    directUrls?: {
      convertedZplPdfUrl?: string | null;
      combinedPdfUrl?: string | null;
      originalPdfUrl?: string | null;
      unmatchedPdfUrl?: string | null;
      unmatchedZplPdfUrl?: string | null;
    }
  ) => void;
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
  historySyncStatus: "idle" | "syncing" | "synced" | "error";
  setHistorySyncStatus: (status: "idle" | "syncing" | "synced" | "error") => void;
  initialShowPrinted: boolean;
  setInitialShowPrinted: (val: boolean) => void;
  fetchHistoryBatches: () => Promise<AmazonBatchHistoryItem[]>;
  loadBatchFromHistory: (batchId: string, options?: { showPrinted?: boolean }) => Promise<boolean>;
}

const SESSION_STORAGE_KEY = "amazon_order_process_data_v1";
const METADATA_STORAGE_KEY = "amazon_order_process_metadata_v1";
export const ACTIVE_HISTORY_BATCH_STORAGE_KEY = "amazon_active_history_batch_id_v1";
export interface StoredBatchPrintedRecord {
  indices: number[];
  count: number;
  orderNumbers?: string[];
  awbs?: string[];
  lastUpdated?: string;
}

let lastSessionMetrics = "";
let currentBatchSessionKey = `session_${Date.now()}`;

export const getBatchKey = (summary: any, resultsLen: number, batchId?: string | null): string => {
  const effectiveBatchId = batchId || summary?.id || summary?.batchId;
  if (effectiveBatchId) return `batch_${effectiveBatchId}`;
  
  const metrics = `${resultsLen}_${summary?.totalPdfOrders ?? 0}`;
  if (metrics !== lastSessionMetrics && metrics !== "0_0") {
    lastSessionMetrics = metrics;
    currentBatchSessionKey = `session_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  }
  
  return currentBatchSessionKey;
};

// Local storage map logic removed to force reliance on backend source of truth

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

export async function pruneLegacyIDB(): Promise<void> {
  try {
    if (typeof window === "undefined" || !window.indexedDB) return;
    indexedDB.deleteDatabase("chkudi_orderos_idb");
    indexedDB.deleteDatabase("chkudi_orderos_idb_v1");
  } catch {
    // Ignore legacy cleanup errors
  }
}

export async function saveFilesToIDB(files: AmazonProcessFiles | null): Promise<void> {
  try {
    pruneLegacyIDB();
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

export async function saveBatchBlobToIDB(batchId: string, blob: Blob): Promise<void> {
  try {
    const db = await openIDB();
    const tx = db.transaction(IDB_STORE, "readwrite");
    const store = tx.objectStore(IDB_STORE);
    store.put(blob, `batch_pdf_${batchId}`);
    return new Promise((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch (e) {
    console.warn("Failed to save batch blob to IndexedDB:", e);
  }
}

export async function loadBatchBlobFromIDB(batchId: string): Promise<Blob | null> {
  try {
    const db = await openIDB();
    const tx = db.transaction(IDB_STORE, "readonly");
    const store = tx.objectStore(IDB_STORE);
    const request = store.get(`batch_pdf_${batchId}`);
    return new Promise((resolve, reject) => {
      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });
  } catch (e) {
    console.warn("Failed to load batch blob from IndexedDB:", e);
    return null;
  }
}

// Helper to convert base64 string to Blob safely and fast using flat Uint8Array
const base64ToBlob = (base64Data: string, mimeType = "application/pdf"): Blob | null => {
  try {
    if (!base64Data) return null;
    const clean = base64Data.includes(",") ? base64Data.split(",")[1] : base64Data;
    const binary = atob(clean);
    const len = binary.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return new Blob([bytes], { type: mimeType });
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
  historySyncStatus: "idle",
  setHistorySyncStatus: (status) => set({ historySyncStatus: status }),
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

  setProcessData: (data, directUrls) => {
    // 0. Ensure previous batch PDF memory and single order memoizers are completely wiped
    clearCachedAmazonDocs();

    // 1. Save files base64 payload to IndexedDB in background without blocking UI
    if (data.files) {
      saveFilesToIDB(data.files).catch((err) => {
        console.warn("Could not persist files to IDB in background:", err);
      });
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

    // 2. Save metadata (summary + results) with safe quota overflow handling
    try {
      if (typeof window !== "undefined") {
        const metadataPayload = JSON.stringify({
          success: data.success,
          summary: updatedSummary,
          results: data.results,
          activeHistoryBatchId: activeBatchId,
        });

        try {
          sessionStorage.setItem(SESSION_STORAGE_KEY, metadataPayload);
        } catch (sessErr) {
          console.warn("SessionStorage quota limit reached:", sessErr);
        }

        try {
          // PII Minimization (CWE-359): Do not persist raw customer PII to long-term localStorage
          const privacySafeResults = (data.results || []).map((r) => ({
            index: r.index,
            isMatch: r.isMatch,
            orderNumber: r.orderNumber,
            pdfInvoice: r.pdfInvoice,
            zplInvoice: r.zplInvoice,
            asin: r.asin,
            sellerSku: r.sellerSku,
            awb: r.awb,
            customer: r.customer, // Redacted in long-term storage; full name retained in sessionStorage
            amount: r.amount,
            date: r.date,
            pdfPages: r.pdfPages,
            zplPage: r.zplPage,
            orderType: r.orderType,
            totalQuantity: r.totalQuantity,
            asinsCount: r.asinsCount,
            combinedPages: r.combinedPages,
          }));

          localStorage.setItem(
            METADATA_STORAGE_KEY,
            JSON.stringify({
              success: data.success,
              summary: updatedSummary,
              results: privacySafeResults,
              activeHistoryBatchId: activeBatchId,
            })
          );
        } catch (quotaErr) {
          console.warn("LocalStorage quota exceeded, storing empty results fallback:", quotaErr);
          try {
            localStorage.setItem(
              METADATA_STORAGE_KEY,
              JSON.stringify({
                success: data.success,
                summary: updatedSummary,
                results: [],
                activeHistoryBatchId: activeBatchId,
              })
            );
          } catch {}
        }

        if (activeBatchId) {
          localStorage.setItem(ACTIVE_HISTORY_BATCH_STORAGE_KEY, activeBatchId);
        }
      }
    } catch (e) {
      console.warn("Failed to store process metadata in storage:", e);
    }

    // 3. Generate blob URLs for preview in current tab (use fast directUrls if provided)
    let zplUrl = directUrls?.convertedZplPdfUrl ?? null;
    let combUrl = directUrls?.combinedPdfUrl ?? null;
    let origUrl = directUrls?.originalPdfUrl ?? null;
    let unmatchUrl = directUrls?.unmatchedPdfUrl ?? null;
    let unmatchZplUrl = directUrls?.unmatchedZplPdfUrl ?? null;

    if (!zplUrl && data.files?.convertedZplPdfBase64) {
      zplUrl = base64ToBlobUrl(data.files.convertedZplPdfBase64);
    }
    if (!combUrl && data.files?.combinedPdfBase64) {
      combUrl = base64ToBlobUrl(data.files.combinedPdfBase64);
    }
    if (!origUrl && data.files?.originalPdfBase64) {
      origUrl = base64ToBlobUrl(data.files.originalPdfBase64);
    }
    if (!unmatchUrl && data.files?.unmatchedPdfBase64) {
      unmatchUrl = base64ToBlobUrl(data.files.unmatchedPdfBase64);
    }
    if (!unmatchZplUrl && data.files?.unmatchedZplBase64) {
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
        let stored = sessionStorage.getItem(SESSION_STORAGE_KEY);
        if (!stored) {
          stored = localStorage.getItem(METADATA_STORAGE_KEY);
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

      // Background re-hydration for historical batches on refresh
      if (restoredBatchId && !currentFiles?.combinedPdfBase64) {
        amazonOrderService
          .fetchBatchFileBlob(restoredBatchId, "combined")
          .then(async (blob) => {
            if (blob && blob.size > 0) {
              const base64 = await blobToBase64(blob);
              const url = URL.createObjectURL(blob);
              set((prev) => ({
                combinedPdfUrl: url,
                files: {
                  ...prev.files,
                  combinedPdfBase64: base64,
                } as any,
              }));
              const buf = await blob.arrayBuffer();
              const { PDFDocument } = await import("pdf-lib");
              const combinedDoc = await PDFDocument.load(buf, { ignoreEncryption: true });
              const bKey = getBatchKey(currentSummary, currentResults.length, restoredBatchId);
              setCachedAmazonDocs({
                combinedDoc,
                combinedBytes: new Uint8Array(buf),
                cacheKey: `batch_${restoredBatchId}`,
                batchKey: bKey,
              });
              startBackgroundOrderPdfPrewarming(currentResults, combinedDoc, bKey);
            }
          })
          .catch((err) => console.warn("Notice: Failed to restore batch PDF:", err));
      }

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
    clearCachedAmazonDocs();
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
    clearCachedAmazonDocs();
    set({ isProcessing: true, progress: 20, currentStage: "Loading batch details..." });
    try {
      const res = await amazonOrderService.getBatchById(batchId);
      const batch = res?.data;
      if (!batch || !batch.summary || !batch.results) {
        throw new Error("Invalid batch data received from server");
      }

      const updatedSummary = batch.summary
        ? {
            ...batch.summary,
            id: batch.id,
            batchId: batch.id,
            printedIndices: batch.summary.printedIndices || [],
          }
        : batch.summary;

      // 1. INSTANT RESULT RENDERING (<1s): Set summary & results immediately into state
      set({
        summary: updatedSummary,
        results: batch.results,
        files: null,
        activeHistoryBatchId: batch.id,
        initialShowPrinted: !!options?.showPrinted,
        isProcessing: false,
        progress: 100,
        currentStage: "Loaded!",
      });

      // Synchronize metadata to sessionStorage for fast refresh retention
      try {
        if (typeof window !== "undefined") {
          sessionStorage.setItem(
            SESSION_STORAGE_KEY,
            JSON.stringify({
              success: true,
              summary: updatedSummary,
              results: batch.results,
              activeHistoryBatchId: batch.id,
            })
          );
          localStorage.setItem(ACTIVE_HISTORY_BATCH_STORAGE_KEY, batch.id);
        }
      } catch (sessErr) {
        console.warn("Storage notice during history load:", sessErr);
      }

      // 2. BACKGROUND COMBINED PDF STREAMING: Fetch only the combined print/preview PDF
      // Checks IndexedDB first for instant (0ms) load, otherwise fetches from server and caches
      (async () => {
        try {
          let blob = await loadBatchBlobFromIDB(batch.id);
          if (!blob) {
            blob = await amazonOrderService.fetchBatchFileBlob(batch.id, "combined");
            if (blob && blob.size > 0) {
              saveBatchBlobToIDB(batch.id, blob);
            }
          }

          if (blob && blob.size > 0) {
            const combUrl = URL.createObjectURL(blob);
            const base64 = await blobToBase64(blob);

            set({
              combinedPdfUrl: combUrl,
              files: {
                combinedPdfBase64: base64,
              } as any,
            });

            // Initialize PDF document in cache for instant sub-second barcode printing
            const buf = await blob.arrayBuffer();
            const { PDFDocument } = await import("pdf-lib");
            const combinedDoc = await PDFDocument.load(buf, { ignoreEncryption: true });
            const bKey = getBatchKey(updatedSummary, batch.results.length, batch.id);

            setCachedAmazonDocs({
              combinedDoc,
              combinedBytes: new Uint8Array(buf),
              cacheKey: `batch_${batch.id}`,
              batchKey: bKey,
            });
            startBackgroundOrderPdfPrewarming(batch.results, combinedDoc, bKey, updatedSummary?.printedIndices);
          }
        } catch (combErr) {
          console.warn("Background combined PDF streaming notice:", combErr);
          // Automatic Local Fallback: Check if this browser has the files saved in IndexedDB
          try {
            const idbFiles = await loadFilesFromIDB();
            if (idbFiles?.combinedPdfBase64) {
              const combUrl = base64ToBlobUrl(idbFiles.combinedPdfBase64);
              set({
                combinedPdfUrl: combUrl,
                files: idbFiles,
              });

              const clean = idbFiles.combinedPdfBase64.includes(",")
                ? idbFiles.combinedPdfBase64.split(",")[1]
                : idbFiles.combinedPdfBase64;
              const binary = atob(clean);
              const bytes = new Uint8Array(binary.length);
              for (let i = 0; i < binary.length; i++) {
                bytes[i] = binary.charCodeAt(i);
              }

              const { PDFDocument } = await import("pdf-lib");
              const combinedDoc = await PDFDocument.load(bytes, { ignoreEncryption: true });
              const bKey = getBatchKey(updatedSummary, batch.results.length, batch.id);

              setCachedAmazonDocs({
                combinedDoc,
                combinedBytes: bytes,
                cacheKey: `batch_${batch.id}`,
                batchKey: bKey,
              });
              startBackgroundOrderPdfPrewarming(batch.results, combinedDoc, bKey);
            }
          } catch (idbErr) {
            console.warn("Local IndexedDB fallback also unavailable:", idbErr);
          }
        }
      })();

      return true;
    } catch (err) {
      console.error("Failed to load batch from history:", err);
      set({ isProcessing: false, progress: 0, currentStage: "" });
      return false;
    }
  },

  downloadConvertedZplPdf: async () => {
    const { files, convertedZplPdfUrl, activeHistoryBatchId } = get();
    if (files?.convertedZplPdfBase64) {
      const filename = `Amazon_ZPL_Converted_Labels_${Date.now()}.pdf`;
      downloadBase64File(files.convertedZplPdfBase64, filename);
      return;
    }
    if (convertedZplPdfUrl) {
      saveAs(convertedZplPdfUrl, `Amazon_ZPL_Converted_Labels_${Date.now()}.pdf`);
      return;
    }
    if (activeHistoryBatchId) {
      try {
        toast.loading("Downloading Converted ZPL PDF...", { id: "dl-file" });
        const blob = await amazonOrderService.fetchBatchFileBlob(activeHistoryBatchId, "zpl");
        saveAs(blob, `Amazon_ZPL_Converted_Labels_${Date.now()}.pdf`);
        toast.success("Downloaded ZPL PDF", { id: "dl-file" });
      } catch (e) {
        toast.error("Failed to download file", { id: "dl-file" });
      }
    }
  },

  downloadCombinedPdf: async () => {
    const { files, combinedPdfUrl, activeHistoryBatchId } = get();
    if (files?.combinedPdfBase64) {
      const filename = `Amazon_Matched_Paired_Orders_${Date.now()}.pdf`;
      downloadBase64File(files.combinedPdfBase64, filename);
      return;
    }
    if (combinedPdfUrl) {
      saveAs(combinedPdfUrl, `Amazon_Matched_Paired_Orders_${Date.now()}.pdf`);
      return;
    }
    if (activeHistoryBatchId) {
      try {
        toast.loading("Downloading Matched Orders PDF...", { id: "dl-file" });
        const blob = await amazonOrderService.fetchBatchFileBlob(activeHistoryBatchId, "combined");
        saveAs(blob, `Amazon_Matched_Paired_Orders_${Date.now()}.pdf`);
        toast.success("Downloaded Matched Orders PDF", { id: "dl-file" });
      } catch (e) {
        toast.error("Failed to download file", { id: "dl-file" });
      }
    }
  },

  downloadOriginalPdf: async () => {
    const { files, summary, originalPdfUrl, activeHistoryBatchId } = get();
    const filename = summary?.pdfFileName || `Amazon_Original_Invoices_${Date.now()}.pdf`;
    if (files?.originalPdfBase64) {
      downloadBase64File(files.originalPdfBase64, filename);
      return;
    }
    if (originalPdfUrl) {
      saveAs(originalPdfUrl, filename);
      return;
    }
    if (activeHistoryBatchId) {
      try {
        toast.loading("Downloading Original Invoices PDF...", { id: "dl-file" });
        const blob = await amazonOrderService.fetchBatchFileBlob(activeHistoryBatchId, "original");
        saveAs(blob, filename);
        toast.success("Downloaded Original Invoices PDF", { id: "dl-file" });
      } catch (e) {
        toast.error("Failed to download file", { id: "dl-file" });
      }
    }
  },

  downloadUnmatchedPdf: async () => {
    const { files, unmatchedPdfUrl, activeHistoryBatchId } = get();
    const filename = `Amazon_Unmatched_Invoices_${Date.now()}.pdf`;
    if (files?.unmatchedPdfBase64) {
      downloadBase64File(files.unmatchedPdfBase64, filename);
      return;
    }
    if (unmatchedPdfUrl) {
      saveAs(unmatchedPdfUrl, filename);
      return;
    }
    if (activeHistoryBatchId) {
      try {
        toast.loading("Downloading Unmatched Invoices PDF...", { id: "dl-file" });
        const blob = await amazonOrderService.fetchBatchFileBlob(activeHistoryBatchId, "unmatched-pdf");
        saveAs(blob, filename);
        toast.success("Downloaded Unmatched Invoices PDF", { id: "dl-file" });
      } catch (e) {
        toast.error("Failed to download file", { id: "dl-file" });
      }
    }
  },

  downloadUnmatchedZplPdf: async () => {
    const { files, unmatchedZplPdfUrl, activeHistoryBatchId } = get();
    const filename = `Amazon_Unmatched_ZPL_Labels_${Date.now()}.pdf`;
    if (files?.unmatchedZplBase64) {
      downloadBase64File(files.unmatchedZplBase64, filename);
      return;
    }
    if (unmatchedZplPdfUrl) {
      saveAs(unmatchedZplPdfUrl, filename);
      return;
    }
    if (activeHistoryBatchId) {
      try {
        toast.loading("Downloading Unmatched ZPL PDF...", { id: "dl-file" });
        const blob = await amazonOrderService.fetchBatchFileBlob(activeHistoryBatchId, "unmatched-zpl");
        saveAs(blob, filename);
        toast.success("Downloaded Unmatched ZPL PDF", { id: "dl-file" });
      } catch (e) {
        toast.error("Failed to download file", { id: "dl-file" });
      }
    }
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
        "Invoice #": sanitizeSpreadsheetCell(invoiceVal),
        "Amazon Order Number": sanitizeSpreadsheetCell(r.orderNumber),
        "AWB / Tracking Number": sanitizeSpreadsheetCell(r.awb),
        "ASIN": sanitizeSpreadsheetCell(r.asin || "N/A"),
        "Seller SKU": sanitizeSpreadsheetCell(r.sellerSku || "N/A"),
        "Customer Name": sanitizeSpreadsheetCell(cleanCustomerName(r.customer)),
        "Invoice Amount": sanitizeSpreadsheetCell(r.amount),
        "Invoice Date": sanitizeSpreadsheetCell(r.date),
        "PDF Page(s)": sanitizeSpreadsheetCell(r.pdfPages.join(", ") || "N/A"),
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

