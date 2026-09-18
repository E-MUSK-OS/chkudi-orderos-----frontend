import type { PDFDocument } from "pdf-lib";

export interface AmazonDocsCache {
  combinedDoc: PDFDocument | null;
  combinedBytes?: Uint8Array | null;
  origDoc?: PDFDocument | null;
  zplDoc?: PDFDocument | null;
  cacheKey: string;
  batchKey?: string;
  timestamp: number;
}

let docsCache: AmazonDocsCache | null = null;
let isWarmingCache = false;
let loadingCombinedPromise: Promise<PDFDocument | null> | null = null;

export function getDocCacheKey(files: any, batchKey?: string): string {
  if (!files) return "";
  const baseKey = `${files.combinedPdfBase64?.length || 0}_${files.convertedZplPdfBase64?.length || 0}_${files.originalPdfBase64?.length || 0}`;
  return batchKey ? `${batchKey}_${baseKey}` : baseKey;
}

// In-memory cache for individual pre-generated order print PDFs (scoped by `${effectiveBatchKey}_${orderIndex}`)
const orderPrintPdfCache = new Map<string, string>();

function getScopedKey(orderIndex: number, batchKey?: string): string {
  const effectiveBatch = batchKey || docsCache?.batchKey || docsCache?.cacheKey || "active";
  return `${effectiveBatch}_${orderIndex}`;
}

export function setCachedAmazonDocs(cache: {
  combinedDoc: PDFDocument | null;
  combinedBytes?: Uint8Array | null;
  origDoc?: PDFDocument | null;
  zplDoc?: PDFDocument | null;
  cacheKey: string;
  batchKey?: string;
}): void {
  // If the batch or document content changed, purge stale order print cache immediately
  if (docsCache && (docsCache.cacheKey !== cache.cacheKey || docsCache.batchKey !== cache.batchKey)) {
    clearOrderPdfCache();
  }
  docsCache = {
    ...cache,
    timestamp: Date.now(),
  };
}

export function getCachedAmazonDocs(): AmazonDocsCache | null {
  return docsCache;
}

export function getCachedOrderPdf(orderIndex: number, batchKey?: string): string | null {
  const key = getScopedKey(orderIndex, batchKey);
  return orderPrintPdfCache.get(key) || null;
}

export function setCachedOrderPdf(orderIndex: number, base64: string, batchKey?: string): void {
  const key = getScopedKey(orderIndex, batchKey);
  orderPrintPdfCache.set(key, base64);
}

export function clearOrderPdfCache(): void {
  orderPrintPdfCache.clear();
}

export function clearCachedAmazonDocs(): void {
  docsCache = null;
  loadingCombinedPromise = null;
  isWarmingCache = false;
  clearOrderPdfCache();
}

/**
 * Fast single-order 2-page PDF extractor & memoizer.
 * Returns pre-generated base64 in 0ms if cached for this batch, or extracts in ~40ms and caches it.
 */
export async function getOrGenerateSingleOrderPdf(
  item: any,
  combinedDoc: PDFDocument,
  batchKey?: string
): Promise<string | null> {
  if (!item || !combinedDoc) return null;

  const scopedKey = getScopedKey(item.index, batchKey);
  if (orderPrintPdfCache.has(scopedKey)) {
    return orderPrintPdfCache.get(scopedKey)!;
  }

  try {
    const { PDFDocument } = await import("pdf-lib");
    const printDoc = await PDFDocument.create();

    const pageCount = combinedDoc.getPageCount();
    let targetPages: number[] = [];

    if (item.combinedPages && item.combinedPages.length > 0) {
      targetPages = item.combinedPages.filter((p: number) => p >= 0 && p < pageCount);
    }

    if (targetPages.length === 0) {
      return null;
    }

    const copiedPages = await printDoc.copyPages(combinedDoc, targetPages);
    copiedPages.forEach((p) => printDoc.addPage(p));

    const base64 = await printDoc.saveAsBase64();
    orderPrintPdfCache.set(scopedKey, base64);
    return base64;
  } catch (err) {
    console.warn(`Failed to generate single order PDF for index ${item?.index}:`, err);
    return null;
  }
}

/**
 * Pre-warms individual order PDFs in idle time batches of 5 so that by the time
 * the operator scans an ASIN, the printable 2-page PDF base64 is already sitting in RAM.
 */
export function startBackgroundOrderPdfPrewarming(
  results: any[],
  combinedDoc: PDFDocument,
  batchKey?: string
): void {
  if (isWarmingCache || !combinedDoc || !results || results.length === 0) return;
  isWarmingCache = true;

  const currentBatchKey = batchKey || docsCache?.batchKey || docsCache?.cacheKey;
  const matched = results.filter((r) => r.isMatch && r.combinedPages && r.combinedPages.length > 0);
  let idx = 0;

  const processNextBatch = () => {
    // If cache was destroyed or switched to another batch, abort prewarming immediately
    if (!docsCache?.combinedDoc && !combinedDoc) {
      isWarmingCache = false;
      return;
    }
    const activeKey = batchKey || docsCache?.batchKey || docsCache?.cacheKey;
    if (activeKey !== currentBatchKey) {
      isWarmingCache = false;
      return;
    }

    const end = Math.min(idx + 5, matched.length);
    const promises: Promise<any>[] = [];

    for (let i = idx; i < end; i++) {
      const item = matched[i];
      const scopedKey = getScopedKey(item.index, batchKey);
      if (!orderPrintPdfCache.has(scopedKey)) {
        promises.push(getOrGenerateSingleOrderPdf(item, combinedDoc, batchKey));
      }
    }

    idx = end;
    Promise.all(promises)
      .then(() => {
        if (idx < matched.length) {
          if (typeof window !== "undefined" && "requestIdleCallback" in window) {
            (window as any).requestIdleCallback(processNextBatch, { timeout: 1000 });
          } else {
            setTimeout(processNextBatch, 50);
          }
        } else {
          isWarmingCache = false;
          console.log(`⚡ All ${matched.length} Amazon order PDFs pre-warmed in cache for instant (<1s) printing!`);
        }
      })
      .catch(() => {
        isWarmingCache = false;
      });
  };

  if (typeof window !== "undefined" && "requestIdleCallback" in window) {
    (window as any).requestIdleCallback(processNextBatch, { timeout: 500 });
  } else {
    setTimeout(processNextBatch, 100);
  }
}

export async function fastBase64ToUint8ArrayAsync(base64: string): Promise<Uint8Array> {
  const clean = base64.includes(",") ? base64.split(",")[1] : base64;
  try {
    // Native browser C++ decoding is orders of magnitude faster than JS loops for 10MB-50MB strings
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

export async function getOrLoadCombinedDoc(activeFiles: any, batchKey?: string): Promise<PDFDocument | null> {
  const currentKey = getDocCacheKey(activeFiles, batchKey);
  if (docsCache?.combinedDoc && docsCache.cacheKey === currentKey) {
    return docsCache.combinedDoc;
  }

  if (!activeFiles?.combinedPdfBase64) {
    return null;
  }

  // If previous cache existed with a different key, clear old single order cache
  if (docsCache && docsCache.cacheKey !== currentKey) {
    clearCachedAmazonDocs();
  }

  if (loadingCombinedPromise) {
    return loadingCombinedPromise;
  }

  loadingCombinedPromise = (async () => {
    try {
      const { PDFDocument } = await import("pdf-lib");
      let bytes = docsCache?.combinedBytes;
      if (!bytes || docsCache?.cacheKey !== currentKey) {
        bytes = await fastBase64ToUint8ArrayAsync(activeFiles.combinedPdfBase64);
      }
      const doc = await PDFDocument.load(bytes, { ignoreEncryption: true });
      setCachedAmazonDocs({
        combinedDoc: doc,
        combinedBytes: bytes,
        origDoc: docsCache?.origDoc || null,
        zplDoc: docsCache?.zplDoc || null,
        cacheKey: currentKey,
        batchKey,
      });
      return doc;
    } catch (err) {
      console.warn("Failed to load combinedDoc from base64:", err);
      return null;
    } finally {
      loadingCombinedPromise = null;
    }
  })();

  return loadingCombinedPromise;
}


