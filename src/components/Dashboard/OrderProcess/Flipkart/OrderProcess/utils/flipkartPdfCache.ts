import type { PDFDocument } from "pdf-lib";

export interface FlipkartDocsCache {
  shippingDoc: PDFDocument | null;
  shippingBytes?: Uint8Array | null;
  cacheKey: string;
  batchKey?: string;
  timestamp: number;
}

let docsCache: FlipkartDocsCache | null = null;
let isWarmingCache = false;
let loadingShippingPromise: Promise<PDFDocument | null> | null = null;

let lastLengths = "";
let currentDocSessionKey = "flipkart_active_process_" + Date.now();

export function getDocCacheKey(files: any, batchKey?: string): string {
  if (batchKey) return batchKey;
  if (!files) return currentDocSessionKey;
  const sLen = files.shippingLabelsPdfBase64?.length || 0;
  const tLen = files.taxInvoicesPdfBase64?.length || 0;
  const oLen = files.originalPdfBase64?.length || 0;
  const lengths = `${sLen}_${tLen}_${oLen}`;

  if (lengths !== lastLengths && lengths !== "0_0_0") {
    lastLengths = lengths;
    currentDocSessionKey = `flipkart_active_process_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  }

  return currentDocSessionKey;
}

export function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const dataUrl = reader.result as string;
      const base64 = dataUrl.includes(",") ? dataUrl.split(",")[1] : dataUrl;
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

// In-memory cache for individual pre-generated order shipping label PDFs (scoped by `${effectiveBatchKey}_${pageIndex}`)
const orderPrintPdfCache = new Map<string, string>();

function getScopedKey(pageIndex: number, batchKey?: string): string {
  const effectiveBatch = batchKey || docsCache?.batchKey || docsCache?.cacheKey || "active";
  return `${effectiveBatch}_${pageIndex}`;
}

export function setCachedFlipkartDocs(cache: {
  shippingDoc: PDFDocument | null;
  shippingBytes?: Uint8Array | null;
  cacheKey: string;
  batchKey?: string;
}): void {
  // If the batch or document content changed, purge stale order print cache immediately
  if (docsCache && (docsCache.cacheKey !== cache.cacheKey || docsCache.batchKey !== cache.batchKey)) {
    clearFlipkartOrderPdfCache();
  }
  docsCache = {
    ...cache,
    timestamp: Date.now(),
  };
}

export function getCachedFlipkartDocs(): FlipkartDocsCache | null {
  return docsCache;
}

export function getCachedFlipkartOrderPdf(pageIndex: number, batchKey?: string): string | null {
  const key = getScopedKey(pageIndex, batchKey);
  return orderPrintPdfCache.get(key) || null;
}

const MAX_ORDER_CACHE_SIZE = 2000;

export function setCachedFlipkartOrderPdf(pageIndex: number, base64: string, batchKey?: string): void {
  const key = getScopedKey(pageIndex, batchKey);
  if (orderPrintPdfCache.size >= MAX_ORDER_CACHE_SIZE && !orderPrintPdfCache.has(key)) {
    const oldestKey = orderPrintPdfCache.keys().next().value;
    if (oldestKey) {
      orderPrintPdfCache.delete(oldestKey);
    }
  }
  orderPrintPdfCache.set(key, base64);
}

export function clearFlipkartOrderPdfCache(): void {
  orderPrintPdfCache.clear();
}

export function clearCachedFlipkartDocs(): void {
  docsCache = null;
  loadingShippingPromise = null;
  isWarmingCache = false;
  clearFlipkartOrderPdfCache();
}

/**
 * Fast single-order shipping label PDF extractor & memoizer.
 * Returns pre-generated base64 in 0ms if cached for this batch, or extracts single page in ~30ms and caches it.
 */
export async function getOrGenerateSingleFlipkartOrderPdf(
  pageIndex: number,
  shippingDoc: PDFDocument,
  batchKey?: string
): Promise<string | null> {
  if (pageIndex === undefined || pageIndex === null || !shippingDoc) return null;

  const scopedKey = getScopedKey(pageIndex, batchKey);
  if (orderPrintPdfCache.has(scopedKey)) {
    return orderPrintPdfCache.get(scopedKey)!;
  }

  try {
    const pageCount = shippingDoc.getPageCount();
    if (pageIndex < 0 || pageIndex >= pageCount) {
      console.warn(`Invalid Flipkart pageIndex ${pageIndex} (total pages: ${pageCount})`);
      return null;
    }

    const { PDFDocument } = await import("pdf-lib");
    const singleDoc = await PDFDocument.create();
    const [copiedPage] = await singleDoc.copyPages(shippingDoc, [pageIndex]);
    singleDoc.addPage(copiedPage);

    const base64 = await singleDoc.saveAsBase64();
    orderPrintPdfCache.set(scopedKey, base64);
    return base64;
  } catch (err) {
    console.warn(`Failed to generate single Flipkart order PDF for pageIndex ${pageIndex}:`, err);
    return null;
  }
}

/**
 * Pre-warms individual Flipkart order shipping label PDFs in the background.
 * Priority Queue: All printed orders + first 10 unprinted orders are warmed immediately (<250ms).
 * Once completed, the remaining orders are warmed smoothly in idle time without blocking or showing loading.
 */
export function startBackgroundFlipkartPdfPrewarming(
  orders: any[],
  shippingDoc: PDFDocument,
  batchKey?: string,
  printedIndices?: Set<number> | number[]
): void {
  if (isWarmingCache || !shippingDoc || !orders || orders.length === 0) return;
  isWarmingCache = true;

  const currentBatchKey = batchKey || docsCache?.batchKey || docsCache?.cacheKey;

  const printedSet = new Set<number>(
    Array.isArray(printedIndices) ? printedIndices : printedIndices ? Array.from(printedIndices) : []
  );

  const printedOrders: any[] = [];
  const unprintedOrders: any[] = [];

  for (const item of orders) {
    const pIdx = item.pageIndex !== undefined ? item.pageIndex : item.index;
    if (printedSet.has(pIdx) || item.isPrinted) {
      printedOrders.push(item);
    } else {
      unprintedOrders.push(item);
    }
  }

  // Priority queue: All printed orders + first 10 unprinted orders
  const first10Unprinted = unprintedOrders.slice(0, 10);
  const remainingUnprinted = unprintedOrders.slice(10);
  const priorityOrders = [...printedOrders, ...first10Unprinted];

  // Warm priority queue first (fast, <250ms without blocking UI)
  const warmPriorityAndContinue = async () => {
    for (const item of priorityOrders) {
      if (!docsCache?.shippingDoc && !shippingDoc) {
        isWarmingCache = false;
        return;
      }
      const activeKey = batchKey || docsCache?.batchKey || docsCache?.cacheKey;
      if (activeKey !== currentBatchKey) {
        isWarmingCache = false;
        return;
      }
      const pIdx = item.pageIndex !== undefined ? item.pageIndex : item.index;
      const scopedKey = getScopedKey(pIdx, batchKey);
      if (!orderPrintPdfCache.has(scopedKey)) {
        await getOrGenerateSingleFlipkartOrderPdf(pIdx, shippingDoc, batchKey);
      }
    }

    // After priority queue completes, smoothly warm the remaining unprinted orders
    // in background idle time without any UI blocking or loading indicators
    let remIdx = 0;
    const processRemaining = () => {
      if (!docsCache?.shippingDoc && !shippingDoc) {
        isWarmingCache = false;
        return;
      }
      const activeKey = batchKey || docsCache?.batchKey || docsCache?.cacheKey;
      if (activeKey !== currentBatchKey) {
        isWarmingCache = false;
        return;
      }

      const end = Math.min(remIdx + 10, remainingUnprinted.length);
      const promises: Promise<any>[] = [];
      for (let i = remIdx; i < end; i++) {
        const item = remainingUnprinted[i];
        const pIdx = item.pageIndex !== undefined ? item.pageIndex : item.index;
        const scopedKey = getScopedKey(pIdx, batchKey);
        if (!orderPrintPdfCache.has(scopedKey)) {
          promises.push(getOrGenerateSingleFlipkartOrderPdf(pIdx, shippingDoc, batchKey));
        }
      }

      remIdx = end;
      Promise.all(promises)
        .then(() => {
          if (remIdx < remainingUnprinted.length) {
            if (typeof window !== "undefined" && "requestIdleCallback" in window) {
              (window as any).requestIdleCallback(processRemaining, { timeout: 1000 });
            } else {
              setTimeout(processRemaining, 40);
            }
          } else {
            isWarmingCache = false;
            console.log(`⚡ All ${orders.length} Flipkart order PDFs pre-warmed in background!`);
          }
        })
        .catch(() => {
          isWarmingCache = false;
        });
    };

    if (remainingUnprinted.length > 0) {
      if (typeof window !== "undefined" && "requestIdleCallback" in window) {
        (window as any).requestIdleCallback(processRemaining, { timeout: 500 });
      } else {
        setTimeout(processRemaining, 50);
      }
    } else {
      isWarmingCache = false;
    }
  };

  warmPriorityAndContinue().catch(() => {
    isWarmingCache = false;
  });
}

export async function fastBase64ToUint8ArrayAsync(base64: string): Promise<Uint8Array> {
  const clean = base64.includes(",") ? base64.split(",")[1] : base64;
  try {
    // Native browser C++ decoding is orders of magnitude faster than JS loops for multi-megabyte strings
    const res = await fetch(`data:application/octet-stream;base64,${clean}`);
    const buffer = await res.arrayBuffer();
    return new Uint8Array(buffer);
  } catch {
    return fastBase64ToUint8Array(clean);
  }
}

export function fastBase64ToUint8Array(base64: string): Uint8Array {
  const clean = base64.includes(",") ? base64.split(",")[1] : base64;
  const binary = atob(clean);
  const len = binary.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

export async function getOrLoadFlipkartShippingDoc(
  activeFiles: any,
  batchKey?: string
): Promise<PDFDocument | null> {
  const currentKey = getDocCacheKey(activeFiles, batchKey);
  if (
    docsCache?.shippingDoc &&
    (docsCache.cacheKey === currentKey ||
      (batchKey && (docsCache.batchKey === batchKey || docsCache.cacheKey === batchKey)))
  ) {
    return docsCache.shippingDoc;
  }

  if (!activeFiles?.shippingLabelsPdfBase64) {
    // Fallback: Check local IndexedDB first, then backend
    try {
      const {
        useFlipkartOrderStore,
        getBatchBlobFromIDB,
        saveBatchBlobToIDB,
      } = await import("../store/useFlipkartOrderStore");
      const activeBatchId = useFlipkartOrderStore.getState().activeHistoryBatchId;
      if (activeBatchId) {
        let blob = await getBatchBlobFromIDB(activeBatchId);
        if (!blob) {
          const { flipkartOrderService } = await import("../services/flipkartOrder.service");
          blob = await flipkartOrderService.fetchBatchFileBlob(activeBatchId, "shipping-labels");
          if (blob && blob.size > 0) {
            saveBatchBlobToIDB(activeBatchId, blob);
          }
        }
        if (blob && blob.size > 0) {
          const base64 = await blobToBase64(blob);
          const buf = await blob.arrayBuffer();
          const { PDFDocument } = await import("pdf-lib");
          const doc = await PDFDocument.load(buf, { ignoreEncryption: true });
          const bKey = batchKey || `batch_${activeBatchId}`;
          setCachedFlipkartDocs({
            shippingDoc: doc,
            shippingBytes: new Uint8Array(buf),
            cacheKey: `batch_${activeBatchId}`,
            batchKey: bKey,
          });
          useFlipkartOrderStore.setState((prev) => ({
            files: {
              ...(prev.files || {
                taxInvoicesPdfBase64: "",
                originalPdfBase64: "",
              }),
              shippingLabelsPdfBase64: base64,
            } as any,
            shippingLabelsPdfUrl: prev.shippingLabelsPdfUrl || URL.createObjectURL(blob),
          }));
          const currentSummary = useFlipkartOrderStore.getState().summary;
          if (currentSummary?.orders && currentSummary.orders.length > 0) {
            startBackgroundFlipkartPdfPrewarming(
              currentSummary.orders,
              doc,
              bKey,
              (currentSummary as any)?.printedIndices
            );
          }
          return doc;
        }
      }
    } catch (streamErr) {
      console.warn("Notice: Flipkart shipping labels PDF on-demand streaming notice:", streamErr);
    }
    return null;
  }

  // If previous cache existed with a different key, clear old single order cache
  if (docsCache && docsCache.cacheKey !== currentKey && (!batchKey || docsCache.batchKey !== batchKey)) {
    clearCachedFlipkartDocs();
  }

  if (loadingShippingPromise) {
    return loadingShippingPromise;
  }

  loadingShippingPromise = (async () => {
    try {
      const { PDFDocument } = await import("pdf-lib");
      let bytes = docsCache?.shippingBytes;
      if (!bytes || docsCache?.cacheKey !== currentKey) {
        bytes = await fastBase64ToUint8ArrayAsync(activeFiles.shippingLabelsPdfBase64);
      }
      const doc = await PDFDocument.load(bytes, { ignoreEncryption: true });
      setCachedFlipkartDocs({
        shippingDoc: doc,
        shippingBytes: bytes,
        cacheKey: currentKey,
        batchKey,
      });
      return doc;
    } catch (err) {
      console.warn("Failed to load Flipkart shippingDoc from base64:", err);
      return null;
    } finally {
      loadingShippingPromise = null;
    }
  })();

  return loadingShippingPromise;
}
