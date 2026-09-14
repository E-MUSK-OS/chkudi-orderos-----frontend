import type { PDFDocument } from "pdf-lib";

export interface AmazonDocsCache {
  combinedDoc: PDFDocument | null;
  combinedBytes?: Uint8Array | null;
  origDoc?: PDFDocument | null;
  zplDoc?: PDFDocument | null;
  cacheKey: string;
  timestamp: number;
}

let docsCache: AmazonDocsCache | null = null;
export function getDocCacheKey(files: any): string {
  if (!files) return "";
  return `${files.combinedPdfBase64?.length || 0}_${files.convertedZplPdfBase64?.length || 0}_${files.originalPdfBase64?.length || 0}`;
}

export function setCachedAmazonDocs(cache: {
  combinedDoc: PDFDocument | null;
  combinedBytes?: Uint8Array | null;
  origDoc?: PDFDocument | null;
  zplDoc?: PDFDocument | null;
  cacheKey: string;
}): void {
  docsCache = {
    ...cache,
    timestamp: Date.now(),
  };
}

export function getCachedAmazonDocs(): AmazonDocsCache | null {
  return docsCache;
}

// In-memory cache for individual pre-generated order print PDFs (indexed by item.index)
const orderPrintPdfCache = new Map<number, string>();

export function getCachedOrderPdf(orderIndex: number): string | null {
  return orderPrintPdfCache.get(orderIndex) || null;
}

export function setCachedOrderPdf(orderIndex: number, base64: string): void {
  orderPrintPdfCache.set(orderIndex, base64);
}

export function clearOrderPdfCache(): void {
  orderPrintPdfCache.clear();
}

export function clearCachedAmazonDocs(): void {
  docsCache = null;
  clearOrderPdfCache();
}

/**
 * Fast single-order 2-page PDF extractor & memoizer.
 * Returns pre-generated base64 in 0ms if cached, or extracts in ~40ms and caches it.
 */
export async function getOrGenerateSingleOrderPdf(
  item: any,
  combinedDoc: PDFDocument
): Promise<string | null> {
  if (!item || !combinedDoc) return null;

  if (orderPrintPdfCache.has(item.index)) {
    return orderPrintPdfCache.get(item.index)!;
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
    orderPrintPdfCache.set(item.index, base64);
    return base64;
  } catch (err) {
    console.warn(`Failed to generate single order PDF for index ${item?.index}:`, err);
    return null;
  }
}

let isWarmingCache = false;

/**
 * Pre-warms individual order PDFs in idle time batches of 5 so that by the time
 * the operator scans an ASIN, the printable 2-page PDF base64 is already sitting in RAM.
 */
export function startBackgroundOrderPdfPrewarming(
  results: any[],
  combinedDoc: PDFDocument
): void {
  if (isWarmingCache || !combinedDoc || !results || results.length === 0) return;
  isWarmingCache = true;

  const matched = results.filter((r) => r.isMatch && r.combinedPages && r.combinedPages.length > 0);
  let idx = 0;

  const processNextBatch = () => {
    if (!docsCache?.combinedDoc && !combinedDoc) {
      isWarmingCache = false;
      return;
    }

    const end = Math.min(idx + 5, matched.length);
    const promises: Promise<any>[] = [];

    for (let i = idx; i < end; i++) {
      const item = matched[i];
      if (!orderPrintPdfCache.has(item.index)) {
        promises.push(getOrGenerateSingleOrderPdf(item, combinedDoc));
      }
    }

    idx = end;
    Promise.all(promises).then(() => {
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
    });
  };

  if (typeof window !== "undefined" && "requestIdleCallback" in window) {
    (window as any).requestIdleCallback(processNextBatch, { timeout: 500 });
  } else {
    setTimeout(processNextBatch, 100);
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

let loadingCombinedPromise: Promise<PDFDocument | null> | null = null;

export async function getOrLoadCombinedDoc(activeFiles: any): Promise<PDFDocument | null> {
  const currentKey = getDocCacheKey(activeFiles);
  if (docsCache?.combinedDoc && docsCache.cacheKey === currentKey) {
    return docsCache.combinedDoc;
  }

  if (!activeFiles?.combinedPdfBase64) {
    return null;
  }

  if (loadingCombinedPromise) {
    return loadingCombinedPromise;
  }

  loadingCombinedPromise = (async () => {
    try {
      const { PDFDocument } = await import("pdf-lib");
      const bytes = fastBase64ToUint8Array(activeFiles.combinedPdfBase64);
      const doc = await PDFDocument.load(bytes, { ignoreEncryption: true });
      setCachedAmazonDocs({
        combinedDoc: doc,
        combinedBytes: bytes,
        origDoc: docsCache?.origDoc || null,
        zplDoc: docsCache?.zplDoc || null,
        cacheKey: currentKey,
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

