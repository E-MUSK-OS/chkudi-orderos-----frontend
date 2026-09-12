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

export function clearCachedAmazonDocs(): void {
  docsCache = null;
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
