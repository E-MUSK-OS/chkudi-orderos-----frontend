"use client";

import { create } from "zustand";
import { saveAs } from "file-saver";
import {
  FlipkartOrderSummary,
  FlipkartProcessFiles,
  FlipkartProcessResponse,
  FlipkartOrderItem,
} from "../types";
import {
  flipkartOrderService,
  FlipkartBatchHistoryItem,
} from "../services/flipkartOrder.service";
import { toast } from "sonner";
import {
  clearCachedFlipkartDocs,
  setCachedFlipkartDocs,
  startBackgroundFlipkartPdfPrewarming,
} from "../utils/flipkartPdfCache";

interface FlipkartOrderState {
  isProcessing: boolean;
  progress: number;
  currentStage: string;
  summary: FlipkartOrderSummary | null;
  files: FlipkartProcessFiles | null;

  // Blob URLs for iframe preview
  shippingLabelsPdfUrl: string | null;
  taxInvoicesPdfUrl: string | null;
  originalPdfUrl: string | null;

  // Live printed counter
  printedCount: number;
  setPrintedCount: (val: number | ((prev: number) => number)) => void;

  // Actions
  setProcessing: (isProcessing: boolean) => void;
  setProgress: (progress: number, stage?: string) => void;
  setProcessData: (
    summary: FlipkartOrderSummary,
    files: FlipkartProcessFiles,
    directUrls?: {
      shippingLabelsPdfUrl?: string | null;
      taxInvoicesPdfUrl?: string | null;
      originalPdfUrl?: string | null;
    }
  ) => void;
  clearProcessData: () => void;
  restoreProcessData: () => Promise<boolean>;

  // Downloads
  downloadShippingLabelsPdf: () => void;
  downloadTaxInvoicesPdf: () => void;
  downloadOriginalPdf: () => void;

  // 7-Day Batch History
  historyBatches: FlipkartBatchHistoryItem[];
  isLoadingHistory: boolean;
  activeHistoryBatchId: string | null;
  historySyncStatus: "idle" | "syncing" | "synced" | "error";
  setHistorySyncStatus: (status: "idle" | "syncing" | "synced" | "error") => void;
  initialShowPrinted: boolean;
  setInitialShowPrinted: (val: boolean) => void;
  fetchHistoryBatches: () => Promise<FlipkartBatchHistoryItem[]>;
  loadBatchFromHistory: (batchId: string, options?: { showPrinted?: boolean }) => Promise<boolean>;
}

const SESSION_STORAGE_KEY = "flipkart_order_process_summary_v1";
export const FLIPKART_ACTIVE_HISTORY_BATCH_STORAGE_KEY =
  "flipkart_active_history_batch_id_v1";
const IDB_NAME = "chkudi_orderos_idb_v2";
const IDB_STORE = "flipkart_files";
const IDB_KEY = "latest_flipkart_files";

function openIDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === "undefined" || !window.indexedDB) {
      return reject("IndexedDB not available");
    }
    const request = indexedDB.open(IDB_NAME, 2);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(IDB_STORE)) {
        db.createObjectStore(IDB_STORE);
      }
      if (!db.objectStoreNames.contains("flipkart_batch_blobs")) {
        db.createObjectStore("flipkart_batch_blobs");
      }
      if (!db.objectStoreNames.contains("amazon_files")) {
        db.createObjectStore("amazon_files");
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function saveFilesToIDB(files: FlipkartProcessFiles | null): Promise<void> {
  try {
    const db = await openIDB();
    const tx = db.transaction(IDB_STORE, "readwrite");
    const store = tx.objectStore(IDB_STORE);
    if (files) {
      store.put(files, IDB_KEY);
      store.put(Date.now(), `${IDB_KEY}_saved_at`);
    } else {
      store.delete(IDB_KEY);
      store.delete(`${IDB_KEY}_saved_at`);
    }
    return new Promise((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch (e) {
    console.warn("Failed to save Flipkart files to IndexedDB:", e);
  }
}

async function loadFilesFromIDB(): Promise<FlipkartProcessFiles | null> {
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
    console.warn("Failed to load Flipkart files from IndexedDB:", e);
    return null;
  }
}

export async function saveBatchBlobToIDB(batchId: string, blob: Blob): Promise<void> {
  try {
    const db = await openIDB();
    if (!db.objectStoreNames.contains("flipkart_batch_blobs")) return;
    const tx = db.transaction("flipkart_batch_blobs", "readwrite");
    const store = tx.objectStore("flipkart_batch_blobs");
    store.put(blob, `batch_${batchId}`);
    store.put(Date.now(), `batch_${batchId}_saved_at`);
  } catch (e) {
    console.warn("Notice: Failed to cache Flipkart batch blob in IDB:", e);
  }
}

export async function getBatchBlobFromIDB(batchId: string): Promise<Blob | null> {
  try {
    const db = await openIDB();
    if (!db.objectStoreNames.contains("flipkart_batch_blobs")) return null;
    const tx = db.transaction("flipkart_batch_blobs", "readonly");
    const store = tx.objectStore("flipkart_batch_blobs");
    const request = store.get(`batch_${batchId}`);
    return new Promise((resolve) => {
      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => resolve(null);
    });
  } catch (e) {
    return null;
  }
}

const base64ToBlob = (base64: string, type = "application/pdf"): Blob => {
  const byteChars = atob(base64);
  const byteNumbers = new Array(byteChars.length);
  for (let i = 0; i < byteChars.length; i++) {
    byteNumbers[i] = byteChars.charCodeAt(i);
  }
  return new Blob([new Uint8Array(byteNumbers)], { type });
};

const blobToBase64 = async (b: Blob): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const res = reader.result as string;
      resolve(res.includes(",") ? res.split(",")[1] : res);
    };
    reader.onerror = reject;
    reader.readAsDataURL(b);
  });
};

const inFlightBatchBlobs = new Set<string>();

export const useFlipkartOrderStore = create<FlipkartOrderState>((set, get) => ({
  isProcessing: false,
  progress: 0,
  currentStage: "",
  summary: null,
  files: null,

  shippingLabelsPdfUrl: null,
  taxInvoicesPdfUrl: null,
  originalPdfUrl: null,

  printedCount: 0,
  setPrintedCount: (val) =>
    set((state) => ({
      printedCount: typeof val === "function" ? val(state.printedCount) : val,
    })),

  setProcessing: (isProcessing) => set({ isProcessing }),
  setProgress: (progress, stage) =>
    set((state) => ({
      progress,
      currentStage: stage !== undefined ? stage : state.currentStage,
    })),

  // 7-Day History state
  historyBatches: [],
  isLoadingHistory: false,
  activeHistoryBatchId: null,
  historySyncStatus: "idle",
  setHistorySyncStatus: (historySyncStatus) => set({ historySyncStatus }),
  initialShowPrinted: false,
  setInitialShowPrinted: (initialShowPrinted) => set({ initialShowPrinted }),

  setProcessData: (summary, files, directUrls) => {
    let shippingLabelsUrl = directUrls?.shippingLabelsPdfUrl || null;
    let taxInvoicesUrl = directUrls?.taxInvoicesPdfUrl || null;
    let originalUrl = directUrls?.originalPdfUrl || null;

    if (!shippingLabelsUrl && files.shippingLabelsPdfBase64) {
      shippingLabelsUrl = URL.createObjectURL(
        base64ToBlob(files.shippingLabelsPdfBase64)
      );
    }
    if (!taxInvoicesUrl && files.taxInvoicesPdfBase64) {
      taxInvoicesUrl = URL.createObjectURL(
        base64ToBlob(files.taxInvoicesPdfBase64)
      );
    }
    if (!originalUrl && files.originalPdfBase64) {
      originalUrl = URL.createObjectURL(
        base64ToBlob(files.originalPdfBase64)
      );
    }

    try {
      if (typeof window !== "undefined") {
        sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(summary));
      }
    } catch (e) {
      console.warn("Could not save Flipkart summary to sessionStorage:", e);
    }

    saveFilesToIDB(files);

    set({
      summary,
      files,
      shippingLabelsPdfUrl: shippingLabelsUrl,
      taxInvoicesPdfUrl: taxInvoicesUrl,
      originalPdfUrl: originalUrl,
      isProcessing: false,
      progress: 100,
      currentStage: "Completed",
      printedCount: 0,
    });
  },

  clearProcessData: () => {
    const { shippingLabelsPdfUrl, taxInvoicesPdfUrl, originalPdfUrl } = get();
    if (shippingLabelsPdfUrl) URL.revokeObjectURL(shippingLabelsPdfUrl);
    if (taxInvoicesPdfUrl) URL.revokeObjectURL(taxInvoicesPdfUrl);
    if (originalPdfUrl) URL.revokeObjectURL(originalPdfUrl);

    try {
      if (typeof window !== "undefined") {
        sessionStorage.removeItem(SESSION_STORAGE_KEY);
        localStorage.removeItem(FLIPKART_ACTIVE_HISTORY_BATCH_STORAGE_KEY);
      }
    } catch { }

    saveFilesToIDB(null);
    clearCachedFlipkartDocs();

    set({
      isProcessing: false,
      progress: 0,
      currentStage: "",
      summary: null,
      files: null,
      shippingLabelsPdfUrl: null,
      taxInvoicesPdfUrl: null,
      originalPdfUrl: null,
      printedCount: 0,
      activeHistoryBatchId: null,
    });
  },

  restoreProcessData: async () => {
    if (get().summary && get().files) return true;
    if (get().summary && get().activeHistoryBatchId) return true;

    try {
      if (typeof window === "undefined") return false;
      const rawSummary = sessionStorage.getItem(SESSION_STORAGE_KEY);
      if (!rawSummary) return false;

      const summary: FlipkartOrderSummary = JSON.parse(rawSummary);
      const restoredBatchId =
        localStorage.getItem(FLIPKART_ACTIVE_HISTORY_BATCH_STORAGE_KEY) ||
        (summary as any)?.id ||
        (summary as any)?.batchId ||
        null;

      const files = await loadFilesFromIDB();

      let shippingLabelsUrl = files?.shippingLabelsPdfBase64
        ? URL.createObjectURL(base64ToBlob(files.shippingLabelsPdfBase64))
        : null;
      let taxInvoicesUrl = files?.taxInvoicesPdfBase64
        ? URL.createObjectURL(base64ToBlob(files.taxInvoicesPdfBase64))
        : null;
      let originalUrl = files?.originalPdfBase64
        ? URL.createObjectURL(base64ToBlob(files.originalPdfBase64))
        : null;

      set({
        summary,
        files: files || null,
        shippingLabelsPdfUrl: shippingLabelsUrl,
        taxInvoicesPdfUrl: taxInvoicesUrl,
        originalPdfUrl: originalUrl,
        activeHistoryBatchId: restoredBatchId,
        isProcessing: false,
      });

      // Background re-hydration for historical batches on refresh if files are missing
      if (
        restoredBatchId &&
        !files?.shippingLabelsPdfBase64 &&
        !inFlightBatchBlobs.has(restoredBatchId)
      ) {
        inFlightBatchBlobs.add(restoredBatchId);
        flipkartOrderService
          .fetchBatchFileBlob(restoredBatchId, "shipping-labels")
          .then(async (blob) => {
            if (blob && blob.size > 0) {
              const base64 = await blobToBase64(blob);
              const url = URL.createObjectURL(blob);
              set((prev) => ({
                shippingLabelsPdfUrl: url,
                files: {
                  ...prev.files,
                  shippingLabelsPdfBase64: base64,
                } as any,
              }));
              saveBatchBlobToIDB(restoredBatchId, blob);

              try {
                const buf = await blob.arrayBuffer();
                const { PDFDocument } = await import("pdf-lib");
                const doc = await PDFDocument.load(buf, { ignoreEncryption: true });
                const bKey = `batch_${restoredBatchId}`;
                setCachedFlipkartDocs({
                  shippingDoc: doc,
                  shippingBytes: new Uint8Array(buf),
                  cacheKey: `batch_${restoredBatchId}`,
                  batchKey: bKey,
                });
                const currentSummary = get().summary;
                if (currentSummary?.orders && currentSummary.orders.length > 0) {
                  startBackgroundFlipkartPdfPrewarming(
                    currentSummary.orders,
                    doc,
                    bKey,
                    (currentSummary as any)?.printedIndices
                  );
                }
              } catch (loadErr) {
                console.warn("Notice: Failed to pre-warm shippingDoc on restore:", loadErr);
              }
            }
          })
          .catch((err) =>
            console.warn("Notice: Failed to restore Flipkart batch PDF:", err)
          )
          .finally(() => {
            inFlightBatchBlobs.delete(restoredBatchId);
          });
      }

      return true;
    } catch (e) {
      console.warn("Failed to restore Flipkart process data:", e);
      return false;
    }
  },

  fetchHistoryBatches: async () => {
    set({ isLoadingHistory: true });
    try {
      const res = await flipkartOrderService.getBatchHistory(7);
      if (res?.data && Array.isArray(res.data)) {
        set({ historyBatches: res.data, isLoadingHistory: false });
        return res.data;
      }
      set({ historyBatches: [], isLoadingHistory: false });
      return [];
    } catch (err) {
      console.warn("Failed to fetch Flipkart batch history:", err);
      set({ historyBatches: [], isLoadingHistory: false });
      return [];
    }
  },

  loadBatchFromHistory: async (batchId: string, options?: { showPrinted?: boolean }) => {
    set({
      isProcessing: true,
      progress: 20,
      currentStage: "Loading Flipkart batch details...",
    });
    try {
      const res = await flipkartOrderService.getBatchById(batchId);
      const batch = res?.data;
      if (!batch || !batch.summary) {
        throw new Error("Invalid batch data received from server");
      }

      const ordersList: FlipkartOrderItem[] = Array.isArray(batch.results)
        ? batch.results
        : Array.isArray(batch.summary?.orders)
          ? batch.summary.orders
          : [];

      const updatedSummary: FlipkartOrderSummary = {
        ...batch.summary,
        orders: ordersList,
        totalOrders: batch.totalOrders || ordersList.length,
        pdfFileName: batch.pdfFileName || batch.summary.pdfFileName || "Flipkart_Batch.pdf",
      };
      (updatedSummary as any).id = batch.id;
      (updatedSummary as any).batchId = batch.id;
      (updatedSummary as any).printedIndices =
        (batch.summary as any)?.printedIndices || [];

      // 1. INSTANT RESULT RENDERING: Set summary & results immediately into state
      set({
        summary: updatedSummary,
        files: null,
        activeHistoryBatchId: batch.id,
        initialShowPrinted: !!options?.showPrinted,
        isProcessing: false,
        progress: 100,
        currentStage: "Loaded!",
      });

      // Synchronize to sessionStorage and localStorage for fast refresh retention
      try {
        if (typeof window !== "undefined") {
          sessionStorage.setItem(
            SESSION_STORAGE_KEY,
            JSON.stringify(updatedSummary)
          );
          localStorage.setItem(
            FLIPKART_ACTIVE_HISTORY_BATCH_STORAGE_KEY,
            batch.id
          );
        }
      } catch (sessErr) {
        console.warn("Storage notice during history load:", sessErr);
      }

      // 2. BACKGROUND STREAMING: Fetch shipping labels PDF
      let cachedBlob = await getBatchBlobFromIDB(batch.id);
      if (!cachedBlob) {
        try {
          cachedBlob = await flipkartOrderService.fetchBatchFileBlob(
            batch.id,
            "shipping-labels"
          );
          if (cachedBlob && cachedBlob.size > 0) {
            saveBatchBlobToIDB(batch.id, cachedBlob);
          }
        } catch (fetchErr) {
          console.warn("Failed to fetch shipping labels blob:", fetchErr);
        }
      }

      if (cachedBlob && cachedBlob.size > 0) {
        const base64 = await blobToBase64(cachedBlob);
        const url = URL.createObjectURL(cachedBlob);
        set((prev) => ({
          shippingLabelsPdfUrl: url,
          files: {
            shippingLabelsPdfBase64: base64,
            taxInvoicesPdfBase64: "",
            originalPdfBase64: "",
          },
        }));

        try {
          const buf = await cachedBlob.arrayBuffer();
          const { PDFDocument } = await import("pdf-lib");
          const doc = await PDFDocument.load(buf, { ignoreEncryption: true });
          const bKey = batch.id;
          setCachedFlipkartDocs({
            shippingDoc: doc,
            shippingBytes: new Uint8Array(buf),
            cacheKey: `batch_${batch.id}`,
            batchKey: bKey,
          });
          startBackgroundFlipkartPdfPrewarming(
            ordersList,
            doc,
            bKey,
            (batch.summary as any)?.printedIndices
          );
        } catch (loadErr) {
          console.warn("Notice: Failed to pre-warm shippingDoc on history load:", loadErr);
        }
      }

      toast.success(
        `Loaded Batch ${batch.batchNumber || batch.id.slice(0, 8)} (${updatedSummary.totalOrders} Orders)`
      );
      return true;
    } catch (err: any) {
      console.error("Failed to load Flipkart batch from history:", err);
      toast.error(err?.message || "Failed to load batch from history");
      set({ isProcessing: false, progress: 0, currentStage: "" });
      return false;
    }
  },

  downloadShippingLabelsPdf: () => {
    const { files } = get();
    if (!files?.shippingLabelsPdfBase64) {
      toast.error("Shipping labels PDF is not available.");
      return;
    }
    const blob = base64ToBlob(files.shippingLabelsPdfBase64);
    const dateStr = new Date().toISOString().slice(0, 10);
    saveAs(blob, `Flipkart_Shipping_Orders_${dateStr}.pdf`);
    toast.success("Downloaded Shipping Labels PDF.");
  },

  downloadTaxInvoicesPdf: () => {
    const { files } = get();
    if (!files?.taxInvoicesPdfBase64) {
      toast.error("Tax invoices PDF is not available.");
      return;
    }
    const blob = base64ToBlob(files.taxInvoicesPdfBase64);
    const dateStr = new Date().toISOString().slice(0, 10);
    saveAs(blob, `Flipkart_Tax_Invoices_${dateStr}.pdf`);
    toast.success("Downloaded Tax Invoices PDF.");
  },

  downloadOriginalPdf: () => {
    const { files, summary } = get();
    if (!files?.originalPdfBase64) {
      toast.error("Original PDF is not available.");
      return;
    }
    const blob = base64ToBlob(files.originalPdfBase64);
    saveAs(blob, summary?.pdfFileName || "Flipkart_Original_Uploaded.pdf");
    toast.success("Downloaded Original Uploaded PDF.");
  },
}));
