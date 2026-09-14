"use client";

import { useEffect, useMemo, useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import MissingSkuModal from "./MissingSkuModal";
import {
  CheckCircle2,
  AlertTriangle,
  Download,
  Search,
  Layers,
  FileText,
  FileSpreadsheet,
  Barcode,
  RotateCcw,
  Sparkles,
  CheckCheck,
  ChevronLeft,
  ChevronRight,
  Printer,
  Zap,
  X,
  Filter,
  Eye,
  EyeOff,
  ShieldAlert,
  Lock,
} from "lucide-react";
import { toast } from "sonner";
import { PDFDocument } from "pdf-lib";
import {
  chromeExtensionPrintService,
  resolveCurrentlyConnectedPrinter,
  isThermalOrLabelPrinter,
  isPrinterConnectedAndOnline,
  invalidatePrinterCache,
} from "@/components/Dashboard/Labels/services/printAgent.service";

import { Checkbox } from "@/components/ui/checkbox";
import Button from "@/components/ui/Button";
import ReactSelect, { SelectOption } from "@/components/ui/ReactSelect";
import { useAmazonOrderStore, loadFilesFromIDB } from "../store/useAmazonOrderStore";
import { cleanCustomerName, mapAsinToSellerSku, drawSkuOnLabelPage, isAmazonTransporterOrFeePage } from "../utils";
import {
  getOrLoadCombinedDoc,
  getCachedAmazonDocs,
  clearCachedAmazonDocs,
  getDocCacheKey,
  getCachedOrderPdf,
  getOrGenerateSingleOrderPdf,
  startBackgroundOrderPdfPrewarming,
} from "../utils/pdfCache";
import { asinImportService } from "@/components/Dashboard/Products/ManageProducts/services/asinImport.service";
import { productService } from "@/components/Dashboard/Products/ManageProducts/services/product.service";
import { productVariantService } from "@/components/Dashboard/Products/ManageProducts/services/productVariant.service";
import { amazonOrderService } from "../services/amazonOrder.service";
import { AmazonOrderType } from "../types";
import {
  generateAmazonPicklist,
  downloadAmazonPicklistExcel,
  openAmazonPicklistTab,
} from "../utils/generateAmazonPicklist";

export type AmazonOrderTypeFilter = AmazonOrderType;

export const getOrderTypeLabel = (type: AmazonOrderType | AmazonOrderTypeFilter | string): string => {
  switch (type) {
    case "single_quantity":
      return "Single Quantity";
    case "multiple_asin":
      return "Multiple ASIN";
    case "multiple_pieces":
      return "Multiple Pieces";
    default:
      return "Single Quantity";
  }
};
export type AmazonPdfViewType =
  | "combined"
  | "zpl"
  | "original"
  | "unmatched_pdf"
  | "unmatched_zpl";

export interface OrderItemRequirement {
  asin: string;
  sku: string;
  requiredQty: number;
  scannedQty: number;
}

function renderItemListCell(val?: string) {
  if (!val || val === "N/A") {
    return <span className="italic text-muted-foreground">N/A</span>;
  }

  const rawItems = val
    .split(/[\r\n]+|\s+\/\s+/)
    .map((s) => s.trim())
    .filter(Boolean);

  const items = Array.from(new Set(rawItems));

  if (items.length <= 1) {
    return items[0] || val;
  }

  return (
    <div className="flex flex-col items-center justify-center gap-0.5 py-0.5">
      {items.map((item, idx) => (
        <div key={idx} className="whitespace-nowrap flex items-center justify-center gap-1">
          <span>{item}</span>
          {idx < items.length - 1 && (
            <span className="font-bold text-slate-400 text-[11px]">/</span>
          )}
        </div>
      ))}
    </div>
  );
}

interface ComparisonResultViewProps {
  isStandaloneTab?: boolean;
  onReset?: () => void;
}

async function generateUnmatchedPdfFromFiles(
  files: any,
  results: any[]
): Promise<string> {
  if (!files?.originalPdfBase64) return "";
  try {
    const { PDFDocument } = await import("pdf-lib");
    const unmatchedDoc = await PDFDocument.create();
    let hasPages = false;

    const origBytes = Uint8Array.from(atob(files.originalPdfBase64), (c) => c.charCodeAt(0));
    const origDoc = await PDFDocument.load(origBytes, { ignoreEncryption: true });

    for (const item of results) {
      if (!item.isMatch && item.pdfPages && item.pdfPages.length > 0) {
        const pageIndices = item.pdfPages
          .map((p: number) => p - 1)
          .filter((idx: number) => idx >= 0 && idx < origDoc.getPageCount());
        if (pageIndices.length > 0) {
          const copied = await unmatchedDoc.copyPages(origDoc, pageIndices);
          copied.forEach((p: any) => unmatchedDoc.addPage(p));
          hasPages = true;
        }
      }
    }

    if (!hasPages) return "";
    const pdfBytes = await unmatchedDoc.save();
    const blob = new Blob([pdfBytes as unknown as BlobPart], { type: "application/pdf" });
    return URL.createObjectURL(blob);
  } catch (err) {
    console.warn("Failed to generate unmatched PDF on the fly:", err);
    return "";
  }
}

function fastBase64ToUint8Array(base64: string): Uint8Array {
  const clean = base64.includes(",") ? base64.split(",")[1] : base64;
  const binary = atob(clean);
  const len = binary.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

async function generateUnmatchedZplFromFiles(
  files: any,
  results: any[]
): Promise<string> {
  if (!files?.convertedZplPdfBase64) return "";
  try {
    const { PDFDocument } = await import("pdf-lib");
    const unmatchedDoc = await PDFDocument.create();
    let hasPages = false;

    const zplBytes = Uint8Array.from(atob(files.convertedZplPdfBase64), (c) => c.charCodeAt(0));
    const zplDoc = await PDFDocument.load(zplBytes, { ignoreEncryption: true });

    for (const item of results) {
      if (!item.isMatch && item.zplPage > 0 && item.zplPage <= zplDoc.getPageCount()) {
        const copied = await unmatchedDoc.copyPages(zplDoc, [item.zplPage - 1]);
        copied.forEach((p: any) => unmatchedDoc.addPage(p));
        hasPages = true;
      }
    }

    if (!hasPages) return "";
    const pdfBytes = await unmatchedDoc.save();
    const blob = new Blob([pdfBytes as unknown as BlobPart], { type: "application/pdf" });
    return URL.createObjectURL(blob);
  } catch (err) {
    console.warn("Failed to generate unmatched ZPL PDF on the fly:", err);
    return "";
  }
}

export default function ComparisonResultView({
  onReset,
}: ComparisonResultViewProps) {
  const {
    summary,
    results,
    files,
    combinedPdfUrl,
    convertedZplPdfUrl,
    originalPdfUrl,
    unmatchedPdfUrl,
    unmatchedZplPdfUrl,
    downloadCombinedPdf,
    downloadConvertedZplPdf,
    downloadOriginalPdf,
    downloadUnmatchedPdf,
    downloadUnmatchedZplPdf,
    restoreProcessData,
    clearProcessData,
  } = useAmazonOrderStore();

  const [activeTab, setActiveTab] = useState<"table" | "pdf">("table");
  const [selectedPdfType, setSelectedPdfType] = useState<AmazonPdfViewType>("combined");

  // Fast in-memory PDF document caching for instant barcode scan printing
  const loadedPdfDocsRef = useRef<{
    zplDoc: PDFDocument;
    origDoc: PDFDocument;
    cacheKey: string;
  } | null>(null);
  const isPreloadingDocsRef = useRef(false);

  const getOrLoadParsedDocs = async (activeFiles: any) => {
    const cached = getCachedAmazonDocs();
    if (cached?.zplDoc && cached?.origDoc) {
      return { zplDoc: cached.zplDoc, origDoc: cached.origDoc, cacheKey: cached.cacheKey };
    }

    const cacheKey = `${activeFiles?.convertedZplPdfBase64?.length || 0}_${activeFiles?.originalPdfBase64?.length || 0}`;
    if (loadedPdfDocsRef.current && loadedPdfDocsRef.current.cacheKey === cacheKey) {
      return loadedPdfDocsRef.current;
    }

    const zplBytes = fastBase64ToUint8Array(activeFiles.convertedZplPdfBase64);
    const pdfBytes = fastBase64ToUint8Array(activeFiles.originalPdfBase64);

    const [zplDoc, origDoc] = await Promise.all([
      PDFDocument.load(zplBytes, { ignoreEncryption: true }),
      PDFDocument.load(pdfBytes, { ignoreEncryption: true }),
    ]);

    loadedPdfDocsRef.current = { zplDoc, origDoc, cacheKey };
    return loadedPdfDocsRef.current;
  };

  // Pre-load combined PDF document & parsed documents in background for instant sub-second printing
  useEffect(() => {
    const existingCache = getCachedAmazonDocs();
    if (existingCache?.combinedDoc && results && results.length > 0) {
      startBackgroundOrderPdfPrewarming(results, existingCache.combinedDoc);
    } else if (files?.combinedPdfBase64) {
      getOrLoadCombinedDoc(files)
        .then((doc) => {
          if (doc && results && results.length > 0) {
            startBackgroundOrderPdfPrewarming(results, doc);
          }
        })
        .catch((e) => console.warn("Background combinedDoc preload error:", e));
    }
  }, [files, results]);

  useEffect(() => {
    if (!files?.convertedZplPdfBase64 || !files?.originalPdfBase64 || isPreloadingDocsRef.current) return;
    const cacheKey = `${files.convertedZplPdfBase64.length}_${files.originalPdfBase64.length}`;
    if (loadedPdfDocsRef.current?.cacheKey === cacheKey) return;

    isPreloadingDocsRef.current = true;
    getOrLoadParsedDocs(files)
      .catch((e) => console.warn("Background PDF preload error:", e))
      .finally(() => {
        isPreloadingDocsRef.current = false;
      });
  }, [files]);

  // Ensure blob preview URLs are generated if files are present in store
  useEffect(() => {
    if (!files) {
      restoreProcessData();
      return;
    }
    const updates: Partial<{
      convertedZplPdfUrl: string;
      combinedPdfUrl: string;
      originalPdfUrl: string;
      unmatchedPdfUrl: string;
      unmatchedZplPdfUrl: string;
    }> = {};

    const base64ToBlobUrl = (base64Data: string, mimeType = "application/pdf"): string => {
      try {
        if (!base64Data) return "";
        const clean = base64Data.includes(",") ? base64Data.split(",")[1] : base64Data;
        const binary = atob(clean);
        const sliceSize = 1024 * 1024;
        const byteArrays: Uint8Array[] = [];

        for (let offset = 0; offset < binary.length; offset += sliceSize) {
          const slice = binary.slice(offset, offset + sliceSize);
          const byteNumbers = new Uint8Array(slice.length);
          for (let i = 0; i < slice.length; i++) {
            byteNumbers[i] = slice.charCodeAt(i);
          }
          byteArrays.push(byteNumbers);
        }

        const blob = new Blob(byteArrays as any[], { type: mimeType });
        return URL.createObjectURL(blob);
      } catch (e) {
        return "";
      }
    };

    if (!convertedZplPdfUrl && files.convertedZplPdfBase64) {
      const url = base64ToBlobUrl(files.convertedZplPdfBase64);
      if (url) updates.convertedZplPdfUrl = url;
    }
    if (!combinedPdfUrl && files.combinedPdfBase64) {
      const url = base64ToBlobUrl(files.combinedPdfBase64);
      if (url) updates.combinedPdfUrl = url;
    }
    if (!originalPdfUrl && files.originalPdfBase64) {
      const url = base64ToBlobUrl(files.originalPdfBase64);
      if (url) updates.originalPdfUrl = url;
    }
    if (!unmatchedPdfUrl) {
      if (files.unmatchedPdfBase64) {
        const url = base64ToBlobUrl(files.unmatchedPdfBase64);
        if (url) updates.unmatchedPdfUrl = url;
      } else if (results.some((r) => !r.isMatch && r.pdfPages && r.pdfPages.length > 0)) {
        generateUnmatchedPdfFromFiles(files, results).then((url) => {
          if (url) useAmazonOrderStore.setState({ unmatchedPdfUrl: url });
        });
      }
    }
    if (!unmatchedZplPdfUrl) {
      if (files.unmatchedZplBase64) {
        const url = base64ToBlobUrl(files.unmatchedZplBase64);
        if (url) updates.unmatchedZplPdfUrl = url;
      } else if (results.some((r) => !r.isMatch && r.zplPage > 0)) {
        generateUnmatchedZplFromFiles(files, results).then((url) => {
          if (url) useAmazonOrderStore.setState({ unmatchedZplPdfUrl: url });
        });
      }
    }

    if (Object.keys(updates).length > 0) {
      useAmazonOrderStore.setState(updates);
    }
  }, [files, convertedZplPdfUrl, combinedPdfUrl, originalPdfUrl, unmatchedPdfUrl, unmatchedZplPdfUrl, results]);

  const unmatchedPdfCount = useMemo(
    () => results.filter((r) => !r.isMatch && r.pdfPages && r.pdfPages.length > 0).length,
    [results]
  );
  const unmatchedZplCount = useMemo(
    () => results.filter((r) => !r.isMatch && r.zplPage > 0).length,
    [results]
  );

  const unmatchedPdfOptions: SelectOption[] = useMemo(
    () => [
      {
        label: `Unmatched PDF Invoices (${unmatchedPdfCount})`,
        value: "unmatched_pdf",
      },
      {
        label: `Unmatched ZPL Labels (${unmatchedZplCount})`,
        value: "unmatched_zpl",
      },
    ],
    [unmatchedPdfCount, unmatchedZplCount]
  );

  const pdfViewOptions: SelectOption[] = useMemo(
    () => [
      {
        label: `Combined Matched Paired PDF (${summary?.matchedCount ?? 0})`,
        value: "combined",
      },
      {
        label: `All Converted ZPL PDF (${summary?.totalZplLabels ?? 0})`,
        value: "zpl",
      },
      {
        label: `Original Uploaded PDF (${summary?.totalPdfOrders ?? summary?.totalPdfPages ?? 0})`,
        value: "original",
      },
    ],
    [summary]
  );

  const currentPdfConfig = useMemo(() => {
    switch (selectedPdfType) {
      case "zpl":
        return {
          title: "All Converted ZPL Labels PDF",
          description: `All Amazon shipping barcode labels converted from ZPL to PDF (${summary?.totalZplLabels ?? 0} labels)`,
          downloadText: "Download Converted ZPL PDF",
          onDownload: downloadConvertedZplPdf,
          url: convertedZplPdfUrl,
          unavailableText: "Converted ZPL PDF preview unavailable. Please use the download button above.",
        };
      case "original":
        return {
          title: "Original Uploaded Invoices PDF",
          description: `Original customer invoice PDF uploaded for processing (${summary?.pdfFileName || "Uploaded PDF"} • ${summary?.totalPdfPages ?? 0} pages)`,
          downloadText: "Download Uploaded PDF",
          onDownload: downloadOriginalPdf,
          url: originalPdfUrl,
          unavailableText: "Original Uploaded PDF preview unavailable. Please use the download button above.",
        };
      case "unmatched_pdf":
        return {
          title: "Unmatched PDF Invoices",
          description: `Customer tax invoices in uploaded PDF with no matching ZPL shipping label (${unmatchedPdfCount} orders)`,
          downloadText: "Download Unmatched Invoices PDF",
          onDownload: downloadUnmatchedPdf,
          url: unmatchedPdfUrl,
          unavailableText: "No unmatched PDF invoices found, or preview unavailable.",
        };
      case "unmatched_zpl":
        return {
          title: "Unmatched ZPL Shipping Labels",
          description: `Amazon shipping barcode labels in ZPL with no matching PDF invoice (${unmatchedZplCount} labels)`,
          downloadText: "Download Unmatched ZPL Labels",
          onDownload: downloadUnmatchedZplPdf,
          url: unmatchedZplPdfUrl,
          unavailableText: "No unmatched ZPL shipping labels found, or preview unavailable.",
        };
      case "combined":
      default:
        return {
          title: "Combined Matched Paired PDF",
          description: `Interleaved dispatch document (Each ZPL barcode label is immediately followed by its matching invoice • ${summary?.matchedCount ?? 0} matched orders)`,
          downloadText: "Download Matched PDF",
          onDownload: downloadCombinedPdf,
          url: combinedPdfUrl,
          unavailableText: "Combined PDF preview unavailable. Please use the download button above.",
        };
    }
  }, [
    selectedPdfType,
    summary,
    unmatchedPdfCount,
    unmatchedZplCount,
    combinedPdfUrl,
    convertedZplPdfUrl,
    originalPdfUrl,
    unmatchedPdfUrl,
    unmatchedZplPdfUrl,
    downloadCombinedPdf,
    downloadConvertedZplPdf,
    downloadOriginalPdf,
    downloadUnmatchedPdf,
    downloadUnmatchedZplPdf,
  ]);
  const [searchQuery, setSearchQuery] = useState("");
  const [autoPrintQuery, setAutoPrintQuery] = useState("");
  const autoPrintInputRef = useRef<HTMLInputElement>(null);
  const orderScanProgressRef = useRef<Map<number, OrderItemRequirement[]>>(new Map());
  const [selectedRows, setSelectedRows] = useState<Set<number>>(new Set());
  const [printedRows, setPrintedRows] = useState<Set<number>>(new Set());
  const printedRowsRef = useRef<Set<number>>(new Set());
  const printQueuePromiseRef = useRef<Promise<void>>(Promise.resolve());
  const orderPrintPdfCacheRef = useRef<Map<number, string>>(new Map());

  const markRowsAsPrinted = useCallback((indices: number[]) => {
    indices.forEach((idx) => printedRowsRef.current.add(idx));
    setPrintedRows(new Set(printedRowsRef.current));
  }, []);

  const unmarkRowsAsPrinted = useCallback((indices: number[]) => {
    indices.forEach((idx) => printedRowsRef.current.delete(idx));
    setPrintedRows(new Set(printedRowsRef.current));
  }, []);

  const [showPrinted, setShowPrinted] = useState(false);
  const [orderTypeFilter, setOrderTypeFilter] = useState<AmazonOrderTypeFilter>("single_quantity");

  // Fetch ASIN to Seller SKU mapping from AsinImport table (primary), products, and variants (fallback)
  const [asinToSkuMap, setAsinToSkuMap] = useState<Map<string, string>>(new Map());
  const [skuDetailsMap, setSkuDetailsMap] = useState<
    Map<string, { rackAddress?: string; generateBarcode?: string }>
  >(new Map());
  const skuDetailsMapRef = useRef<Map<string, { rackAddress?: string; generateBarcode?: string }>>(new Map());
  const [isMappingsLoading, setIsMappingsLoading] = useState(true);

  // Missing SKU modal state
  const [isMissingSkuModalOpen, setIsMissingSkuModalOpen] = useState(false);
  const [modalMissingAsins, setModalMissingAsins] = useState<string[]>([]);

  // Strictly compute unique missing ASINs across all matched orders
  const computeMissingAsins = useCallback((currentMap: Map<string, string>) => {
    const missing = new Set<string>();
    results.forEach((item) => {
      if (!item.isMatch || !item.asin) return;
      const rawAsins = item.asin.split(/[\r\n]+|\s+\/\s+/).map((s) => s.trim()).filter(Boolean);
      rawAsins.forEach((asin) => {
        const norm = asin.toUpperCase();
        if (norm === "N/A" || norm === "-") return;
        const sku = currentMap.get(norm)?.trim();
        if (!sku || sku === "N/A" || sku === "-") {
          missing.add(norm);
        }
      });
    });
    return Array.from(missing);
  }, [results]);

  // Refetch ASIN mappings from database (AsinImport, Products, Variants)
  const fetchAsinMappings = useCallback(async (): Promise<{ success: boolean; remainingCount: number }> => {
    setIsMappingsLoading(true);
    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("accessToken") ?? "" : "";
      const map = new Map<string, string>();
      const detailsMap = new Map<string, { rackAddress?: string; generateBarcode?: string }>();

      const mergeDetails = (key: string, rack?: string | null, barcode?: string | null) => {
        if (!key) return;
        const trimmedKey = String(key).trim();
        const normKey = trimmedKey.toUpperCase();
        if (!normKey) return;

        const cleanRack = rack && typeof rack === "string" ? rack.trim() : "";
        const cleanBarcode = barcode && typeof barcode === "string" ? barcode.trim() : "";

        const existing =
          detailsMap.get(normKey) ||
          detailsMap.get(trimmedKey) ||
          { rackAddress: "", generateBarcode: "" };

        const updated = {
          rackAddress: cleanRack || existing.rackAddress || "",
          generateBarcode: cleanBarcode || existing.generateBarcode || "",
        };

        detailsMap.set(normKey, updated);
        if (trimmedKey !== normKey) {
          detailsMap.set(trimmedKey, updated);
        }
      };

      // 1. Primary: Fetch from AsinImport table
      try {
        const asinRes = await asinImportService.getAll("", token);
        if (asinRes?.data && Array.isArray(asinRes.data)) {
          asinRes.data.forEach((item: any) => {
            const cleanAsin = item.asin ? String(item.asin).trim().toUpperCase() : "";
            const cleanSku = (item.sku ? String(item.sku).trim() : "") || (item.sellerSku ? String(item.sellerSku).trim() : "");
            const rawRack = item.rackAddress || item.rack_address || item.rack || "";
            const rawBarcode = item.generateBarcode || item.generate_barcode || item.generateBarCode || "";

            if (cleanAsin && cleanSku) {
              map.set(cleanAsin, cleanSku);
            }
            if (cleanAsin) {
              mergeDetails(cleanAsin, rawRack, rawBarcode);
            }
            if (cleanSku) {
              mergeDetails(cleanSku, rawRack, rawBarcode);
            }
          });
        }
      } catch (aErr) {
        console.warn("Could not fetch AsinImports:", aErr);
      }

      // 2. Fallback: Check products table (masterSku)
      try {
        const prodRes = await productService.getAll(token);
        if (prodRes?.data && Array.isArray(prodRes.data)) {
          prodRes.data.forEach((prod: any) => {
            const cleanAsin = prod.asin ? String(prod.asin).trim().toUpperCase() : "";
            const cleanSku = (prod.masterSku ? String(prod.masterSku).trim() : "") || (prod.sku ? String(prod.sku).trim() : "");
            const rawRack = prod.rackAddress || prod.rack_address || prod.rack || "";
            const rawBarcode = prod.generateBarcode || prod.generate_barcode || prod.generateBarCode || "";

            if (cleanAsin && !map.has(cleanAsin) && cleanSku) {
              map.set(cleanAsin, cleanSku);
            }
            if (cleanAsin) {
              mergeDetails(cleanAsin, rawRack, rawBarcode);
            }
            if (cleanSku) {
              mergeDetails(cleanSku, rawRack, rawBarcode);
            }

            // Also check nested variants if any
            if (Array.isArray(prod.variants)) {
              prod.variants.forEach((v: any) => {
                const vAsin = v.asin ? String(v.asin).trim().toUpperCase() : "";
                const vSku = (v.variantSku ? String(v.variantSku).trim() : "") || (v.sku ? String(v.sku).trim() : "");
                const vRack = v.rackAddress || v.rack_address || v.rack || "";
                const vBarcode = v.generateBarcode || v.generate_barcode || v.generateBarCode || "";

                if (vAsin && !map.has(vAsin) && vSku) {
                  map.set(vAsin, vSku);
                }
                if (vAsin) {
                  mergeDetails(vAsin, vRack, vBarcode);
                }
                if (vSku) {
                  mergeDetails(vSku, vRack, vBarcode);
                }
              });
            }
          });
        }
      } catch (pErr) {
        console.warn("Could not fetch products for ASIN mapping:", pErr);
      }

      // 3. Fallback: Check product variants table (variantSku)
      try {
        const varRes = await productVariantService.getAll(token);
        if (varRes?.data && Array.isArray(varRes.data)) {
          varRes.data.forEach((variant: any) => {
            const cleanAsin = variant.asin ? String(variant.asin).trim().toUpperCase() : "";
            const cleanSku = (variant.variantSku ? String(variant.variantSku).trim() : "") || (variant.sku ? String(variant.sku).trim() : "");
            const rawRack = variant.rackAddress || variant.rack_address || variant.rack || "";
            const rawBarcode = variant.generateBarcode || variant.generate_barcode || variant.generateBarCode || "";

            if (cleanAsin && !map.has(cleanAsin) && cleanSku) {
              map.set(cleanAsin, cleanSku);
            }
            if (cleanAsin) {
              mergeDetails(cleanAsin, rawRack, rawBarcode);
            }
            if (cleanSku) {
              mergeDetails(cleanSku, rawRack, rawBarcode);
            }
          });
        }
      } catch (vErr) {
        console.warn("Could not fetch product variants for ASIN mapping:", vErr);
      }

      skuDetailsMapRef.current = detailsMap;
      setAsinToSkuMap(map);
      setSkuDetailsMap(detailsMap);

      const stillMissing = computeMissingAsins(map);
      setModalMissingAsins(stillMissing);

      if (stillMissing.length === 0) {
        // Only invalidate cached PDF document if missing SKUs were previously active and resolved
        if (modalMissingAsins.length > 0) {
          clearCachedAmazonDocs();
          orderPrintPdfCacheRef.current.clear();
          loadedPdfDocsRef.current = null;
        }
        setIsMissingSkuModalOpen(false);
        return { success: true, remainingCount: 0 };
      } else {
        setIsMissingSkuModalOpen(true);
        return { success: false, remainingCount: stillMissing.length };
      }
    } catch (err) {
      console.warn("Failed to fetch ASIN mappings:", err);
      return { success: false, remainingCount: modalMissingAsins.length };
    } finally {
      setIsMappingsLoading(false);
    }
  }, [computeMissingAsins, modalMissingAsins.length]);

  useEffect(() => {
    fetchAsinMappings();
  }, [fetchAsinMappings]);

  // Automatically focus and keep scan input ready for handheld barcode scanners
  useEffect(() => {
    if (activeTab === "table") {
      const timer = setTimeout(() => {
        autoPrintInputRef.current?.focus();
      }, 120);
      return () => clearTimeout(timer);
    }
  }, [activeTab]);

  // Global scanner redirect: if operator pulls scanner trigger without clicking input, automatically focus the scan box
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.isContentEditable)
      ) {
        return;
      }

      if (e.ctrlKey || e.altKey || e.metaKey || e.key.length > 1) {
        return;
      }

      if (activeTab === "table" && autoPrintInputRef.current) {
        autoPrintInputRef.current.focus();
      }
    };

    window.addEventListener("keydown", handleGlobalKeyDown);
    return () => window.removeEventListener("keydown", handleGlobalKeyDown);
  }, [activeTab]);

  // Map each order item's ASIN to the corresponding variantSku from DB
  const mappedResults = useMemo(() => {
    if (!asinToSkuMap || asinToSkuMap.size === 0) {
      // Preserve already mapped sellerSku from OrderProcess if available
      return results;
    }

    return results.map((item) => {
      const mappedSku = mapAsinToSellerSku(item.asin, asinToSkuMap);
      return {
        ...item,
        sellerSku: (mappedSku && mappedSku !== "N/A") ? mappedSku : (item.sellerSku && item.sellerSku !== "N/A" ? item.sellerSku : mappedSku),
      };
    });
  }, [results, asinToSkuMap]);

  const router = useRouter();

  // Missing SKU items detection: strictly checks if sellerSku is missing or any part is N/A
  const missingSkuItems = useMemo(() => {
    return mappedResults.filter((item) => {
      if (!item.isMatch) return false;
      if (!item.sellerSku || item.sellerSku === "N/A" || item.sellerSku === "-") return true;
      const parts = item.sellerSku.split(/[\r\n]+|\s+\/\s+/).map((s) => s.trim());
      return parts.some((p) => !p || p === "N/A" || p === "-");
    });
  }, [mappedResults]);

  // Automatically keep modal open as long as genuine missing ASINs exist and mappings are loaded
  useEffect(() => {
    if (!isMappingsLoading && modalMissingAsins.length > 0) {
      setIsMissingSkuModalOpen(true);
    }
  }, [isMappingsLoading, modalMissingAsins.length]);

  // Helper to get item's order type (with client fallback)
  const getOrderTypeForItem = (item: (typeof results)[0]): AmazonOrderType => {
    if (item.orderType) return item.orderType;

    let totalQty = item.totalQuantity || 0;
    let asinsCount = item.asinsCount || 0;
    let skusCount = 1;

    if (item.asin && item.asin !== "N/A") {
      const rawAsins = item.asin.split(/[\r\n]+|\s+\/\s+/).map((s) => s.trim()).filter(Boolean);
      asinsCount = new Set(rawAsins).size;
      if (!totalQty) totalQty = rawAsins.length;
    }

    if (item.sellerSku && item.sellerSku !== "N/A") {
      const rawSkus = item.sellerSku.split(/[\r\n]+|\s+\/\s+/).map((s) => s.trim()).filter(Boolean);
      skusCount = new Set(rawSkus).size;
      if (rawSkus.length > totalQty) totalQty = rawSkus.length;
    }

    if (asinsCount > 1) return "multiple_asin";
    if (skusCount > 1 || totalQty > 1) return "multiple_pieces";
    return "single_quantity";
  };

  // Order composition filter counts
  const orderTypeCounts = useMemo(() => {
    const counts = {
      single_quantity: 0,
      multiple_asin: 0,
      multiple_pieces: 0,
    };
    mappedResults.forEach((item) => {
      if (!item.isMatch) return;
      if (!showPrinted && printedRows.has(item.index)) return;
      const type = getOrderTypeForItem(item);
      counts[type]++;
    });
    return counts;
  }, [mappedResults, printedRows, showPrinted]);

  const remainingMatchedCount = useMemo(() => {
    return mappedResults.filter((i) => i.isMatch && !printedRows.has(i.index)).length;
  }, [mappedResults, printedRows]);

  const orderTypeOptions: SelectOption[] = useMemo(
    () => [
      { label: `Single Quantity (${orderTypeCounts.single_quantity})`, value: "single_quantity" },
      { label: `Multiple ASIN (${orderTypeCounts.multiple_asin})`, value: "multiple_asin" },
      { label: `Multiple Pieces (${orderTypeCounts.multiple_pieces})`, value: "multiple_pieces" },
    ],
    [orderTypeCounts]
  );

  // Printer selection state with persistent local storage retention
  const [availablePrinters, setAvailablePrinters] = useState<string[]>([]);
  const [selectedPrinter, setSelectedPrinter] = useState<string>(() => {
    if (typeof window !== "undefined") {
      return (
        localStorage.getItem("amazon_selected_printer") ||
        localStorage.getItem("lastUsedPrinter") ||
        ""
      );
    }
    return "";
  });
  const lastVerifiedPrinterRef = useRef<{
    printerName: string;
    timestamp: number;
  } | null>(
    typeof window !== "undefined" &&
      (localStorage.getItem("amazon_selected_printer") || localStorage.getItem("lastUsedPrinter"))
      ? {
          printerName: (localStorage.getItem("amazon_selected_printer") || localStorage.getItem("lastUsedPrinter"))!,
          timestamp: Date.now(),
        }
      : null
  );
  const autoScanTimerRef = useRef<NodeJS.Timeout | null>(null);

  const printerOptions: SelectOption[] = useMemo(
    () =>
      availablePrinters.map((p) => ({
        label: p,
        value: p,
      })),
    [availablePrinters]
  );

  useEffect(() => {
    let isMounted = true;
    async function loadPrinters() {
      try {
        const details = await chromeExtensionPrintService.getPrintersDetailed();
        let list = details.map((p) => p.name).filter(Boolean);
        if (!list || list.length === 0) {
          list = await chromeExtensionPrintService.getPrinters();
        }
        if (isMounted && list && list.length > 0) {
          setAvailablePrinters(list);

          const saved = typeof window !== "undefined"
            ? (localStorage.getItem("amazon_selected_printer") || localStorage.getItem("lastUsedPrinter"))
            : null;

          setSelectedPrinter((current) => {
            const candidate = current || saved;
            if (candidate) {
              const matched = list.find(
                (p) => p.toLowerCase().trim() === candidate.toLowerCase().trim()
              );
              if (matched) {
                lastVerifiedPrinterRef.current = {
                  printerName: matched,
                  timestamp: Date.now(),
                };
                if (typeof window !== "undefined") {
                  localStorage.setItem("amazon_selected_printer", matched);
                  localStorage.setItem("lastUsedPrinter", matched);
                }
                return matched;
              }
            }

            const { printer: preferred } = resolveCurrentlyConnectedPrinter(list, details);
            const chosen = preferred && list.includes(preferred) ? preferred : list[0];
            lastVerifiedPrinterRef.current = {
              printerName: chosen,
              timestamp: Date.now(),
            };
            if (typeof window !== "undefined" && chosen) {
              localStorage.setItem("amazon_selected_printer", chosen);
              localStorage.setItem("lastUsedPrinter", chosen);
            }
            return chosen;
          });
        }
      } catch (e) {
        console.warn("Failed to load initial printers:", e);
      }
    }
    loadPrinters();
    const t1 = setTimeout(loadPrinters, 400);
    const t2 = setTimeout(loadPrinters, 1500);

    return () => {
      isMounted = false;
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, []);

  // Pagination state (same as Myntra order)
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

  const handleReset = () => {
    loadedPdfDocsRef.current = null;
    lastVerifiedPrinterRef.current = null;
    clearCachedAmazonDocs();
    orderPrintPdfCacheRef.current.clear();
    printedRowsRef.current.clear();
    setPrintedRows(new Set());
    setShowPrinted(false);
    setOrderTypeFilter("single_quantity");
    setPage(1);
    orderScanProgressRef.current.clear();
    if (onReset) {
      onReset();
    } else {
      clearProcessData();
    }
  };

  useEffect(() => {
    printedRowsRef.current.clear();
    orderPrintPdfCacheRef.current.clear();
    setPrintedRows(new Set());
    setOrderTypeFilter("single_quantity");
    setPage(1);
    orderScanProgressRef.current.clear();
  }, [results]);

  // Background preheating of single-order printable PDF base64 cache for instant < 0.5s barcode scanning prints
  useEffect(() => {
    let isCancelled = false;
    async function preheatOrderCache() {
      if (!files?.combinedPdfBase64) return;
      const combinedDoc = await getOrLoadCombinedDoc(files);
      if (!combinedDoc || isCancelled) return;

      const matchedList = mappedResults.filter((r) => r.isMatch);
      for (const item of matchedList) {
        if (isCancelled) break;
        if (orderPrintPdfCacheRef.current.has(item.index)) continue;

        let pages: number[] = [];
        if (item.combinedPages && item.combinedPages.length > 0) {
          pages = item.combinedPages.filter((p) => p >= 0 && p < combinedDoc.getPageCount());
        } else {
          const mIdx = matchedList.findIndex((r) => r.index === item.index);
          if (mIdx !== -1) {
            const startP = mIdx * 2;
            if (startP + 1 < combinedDoc.getPageCount()) {
              pages = [startP, startP + 1];
            }
          }
        }

        if (pages.length > 0) {
          try {
            const singleDoc = await PDFDocument.create();
            const copied = await singleDoc.copyPages(combinedDoc, pages);
            copied.forEach((p) => singleDoc.addPage(p));
            const b64 = await singleDoc.saveAsBase64();
            if (!isCancelled) {
              orderPrintPdfCacheRef.current.set(item.index, b64);
            }
          } catch {
            // Ignore background preheat errors
          }
          // Yield to UI thread every order so browser remains 100% responsive
          await new Promise((r) => setTimeout(r, 10));
        }
      }
    }

    preheatOrderCache();
    return () => {
      isCancelled = true;
    };
  }, [mappedResults, files]);

  // Filter and search results (Only matched orders are displayed in table)
  const filteredResults = useMemo(() => {
    return mappedResults.filter((item) => {
      // Exclude unmatched items from table (viewed via PDF viewer)
      if (!item.isMatch) return false;

      // Exclude already printed items unless showPrinted is toggled ON
      if (!showPrinted && printedRows.has(item.index)) return false;

      // Filter by order composition type
      const type = getOrderTypeForItem(item);
      if (type !== orderTypeFilter) return false;

      const activeQuery = (autoPrintQuery || searchQuery).trim().toLowerCase();

      // Search query
      if (!activeQuery) return true;
      return (
        item.zplInvoice.toLowerCase().includes(activeQuery) ||
        item.pdfInvoice.toLowerCase().includes(activeQuery) ||
        (item.asin && item.asin.toLowerCase().includes(activeQuery)) ||
        (item.sellerSku && item.sellerSku.toLowerCase().includes(activeQuery)) ||
        item.orderNumber.toLowerCase().includes(activeQuery) ||
        item.awb.toLowerCase().includes(activeQuery) ||
        item.customer.toLowerCase().includes(activeQuery)
      );
    });
  }, [mappedResults, searchQuery, autoPrintQuery, orderTypeFilter, printedRows, showPrinted]);

  // Pagination calculations (exact Myntra logic)
  const totalRecords = filteredResults.length;
  const totalPages = Math.max(1, Math.ceil(totalRecords / limit));
  const currentPage = Math.min(page, totalPages);
  const startIndex = totalRecords === 0 ? 0 : (currentPage - 1) * limit;
  const endIndex = Math.min(startIndex + limit, totalRecords);
  const paginatedResults = filteredResults.slice(startIndex, endIndex);

  const allPageSelected =
    paginatedResults.length > 0 &&
    paginatedResults.every((item) => selectedRows.has(item.index));

  const toggleAllPage = () => {
    const next = new Set(selectedRows);
    if (allPageSelected) {
      paginatedResults.forEach((item) => next.delete(item.index));
    } else {
      paginatedResults.forEach((item) => next.add(item.index));
    }
    setSelectedRows(next);
  };

  const handleSelectRow = (index: number, checked: boolean) => {
    const next = new Set(selectedRows);
    if (checked) {
      next.add(index);
    } else {
      next.delete(index);
    }
    setSelectedRows(next);
  };

  const renderPdfBytesToImages = async (pdfBytes: Uint8Array): Promise<string[]> => {
    const pdfjs = await import("pdfjs-dist");
    if (!pdfjs.GlobalWorkerOptions.workerSrc) {
      pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version || "6.3.289"}/build/pdf.worker.min.mjs`;
    }

    const loadingTask = pdfjs.getDocument({ data: pdfBytes });
    const pdf = await loadingTask.promise;
    const images: string[] = [];

    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const viewport = page.getViewport({ scale: 3.0 });
      const canvas = document.createElement("canvas");
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      const context = canvas.getContext("2d");
      if (context) {
        context.fillStyle = "#ffffff";
        context.fillRect(0, 0, canvas.width, canvas.height);
        await (page.render as any)({ canvasContext: context, viewport, canvas }).promise;
        const base64 = canvas.toDataURL("image/png").replace(/^data:image\/png;base64,/, "");
        images.push(base64);
      }
    }

    return images;
  };

  const executePrintForItems = async (targetResults: typeof mappedResults) => {
    if (modalMissingAsins.length > 0) {
      toast.error(`Cannot print orders: ${modalMissingAsins.length} ASIN(s) are missing Seller SKU. Please resolve missing SKUs first.`);
      setIsMissingSkuModalOpen(true);
      return;
    }

    if (targetResults.length === 0) {
      toast.error('No orders found to print.');
      return;
    }

    let activeFiles = files;
    if (!activeFiles?.combinedPdfBase64 && (!activeFiles?.convertedZplPdfBase64 || !activeFiles?.originalPdfBase64)) {
      const recovered = await loadFilesFromIDB();
      if (recovered?.combinedPdfBase64 || (recovered?.convertedZplPdfBase64 && recovered?.originalPdfBase64)) {
        useAmazonOrderStore.setState({ files: recovered });
        activeFiles = recovered;
      }
    }

    if (!activeFiles?.combinedPdfBase64 && (!activeFiles?.convertedZplPdfBase64 || !activeFiles?.originalPdfBase64)) {
      toast.error('Processed order files are not ready for printing.');
      return;
    }

    // 1. Strictly resolve whichever physical printer is CURRENTLY connected and online on the PC
    const now = Date.now();
    let targetPrinter: string | null =
      selectedPrinter ||
      lastVerifiedPrinterRef.current?.printerName ||
      (typeof window !== "undefined"
        ? localStorage.getItem("amazon_selected_printer") || localStorage.getItem("lastUsedPrinter")
        : null);

    if (targetPrinter) {
      lastVerifiedPrinterRef.current = {
        printerName: targetPrinter,
        timestamp: now,
      };
      if (!selectedPrinter) {
        setSelectedPrinter(targetPrinter);
      }
    } else {
      // Verify PrintBridge extension is reachable
      const extCheck = await chromeExtensionPrintService.checkExtension();
      if (!extCheck.ok) {
        lastVerifiedPrinterRef.current = null;
        toast.error("PrintBridge is not running or not detected. Please setup PrintBridge.", {
          id: 'print-prep',
          duration: 8000,
          action: {
            label: 'Setup PrintBridge',
            onClick: () => window.open('/printbridge', '_blank'),
          },
        });
        return;
      }

      if (extCheck.response?.silentPrinting === false) {
        toast.warning(
          "Silent Printing is OFF in the PrintBridge extension. Click the extension icon in the Chrome toolbar and switch 'Silent Printing' to ON.",
          { duration: 8000 }
        );
      }

      // Fetch live printers directly connected to the PC right now
      const detailedPrinters = await chromeExtensionPrintService.getPrintersDetailed();
      const extPrinters = detailedPrinters.map((p) => p.name);
      if (extPrinters.length > 0) {
        setAvailablePrinters(extPrinters);
      }

      // Strictly resolve target printer
      const saved = typeof window !== 'undefined'
        ? (localStorage.getItem("amazon_selected_printer") || localStorage.getItem("lastUsedPrinter"))
        : null;
      if (saved) {
        const matched = extPrinters.find(p => p.toLowerCase().trim() === saved.toLowerCase().trim());
        if (matched) {
          targetPrinter = matched;
          setSelectedPrinter(matched);
        }
      }
      if (!targetPrinter) {
        const { printer: onlineConnected } = resolveCurrentlyConnectedPrinter(extPrinters, detailedPrinters);
        if (onlineConnected && isPrinterConnectedAndOnline(onlineConnected, detailedPrinters)) {
          targetPrinter = onlineConnected;
          setSelectedPrinter(onlineConnected);
          if (typeof window !== 'undefined') {
            localStorage.setItem('amazon_selected_printer', onlineConnected);
            localStorage.setItem('lastUsedPrinter', onlineConnected);
          }
        } else if (extPrinters.length > 0) {
          targetPrinter = extPrinters[0];
          setSelectedPrinter(extPrinters[0]);
        }
      }

      // STRICT REQUIREMENT: If no physical printer is connected and online, DO NOT SEND TO QUEUE!
      if (!targetPrinter) {
        lastVerifiedPrinterRef.current = null;
        toast.error("No printer connected. Print cancelled to avoid queuing.", {
          id: 'print-prep',
          duration: 8000,
          action: {
            label: 'Setup PrintBridge',
            onClick: () => window.open('/printbridge', '_blank'),
          },
        });
        return;
      }

      lastVerifiedPrinterRef.current = {
        printerName: targetPrinter,
        timestamp: Date.now(),
      };
    }

    // 2. ULTRA-FAST SUB-SECOND PATH FOR SINGLE ORDER (Barcode ASIN scan print):
    if (targetResults.length === 1) {
      const singleItem = targetResults[0];
      let singlePrintBase64 = getCachedOrderPdf(singleItem.index);

      if (!singlePrintBase64) {
        const combinedDoc = await getOrLoadCombinedDoc(activeFiles);
        if (combinedDoc) {
          singlePrintBase64 = await getOrGenerateSingleOrderPdf(singleItem, combinedDoc);
        }
      }

      if (singlePrintBase64) {
        toast.loading(`Printing order on ${targetPrinter}...`, { id: "print-prep" });
        const extRes = await chromeExtensionPrintService.printPdf(singlePrintBase64, targetPrinter, 1, true);
        if (extRes && (extRes.success === false || extRes.error)) {
          throw new Error(extRes.error || `Print failure on ${targetPrinter}`);
        }

        toast.success(`Printed order (4" x 6") directly on ${targetPrinter}!`, { id: "print-prep" });
        setPrintedRows((prev) => {
          const next = new Set(prev);
          next.add(singleItem.index);
          return next;
        });
        setSelectedRows((prev) => {
          const next = new Set(prev);
          next.delete(singleItem.index);
          return next;
        });

        // Background database save
        try {
          const ordersToSave = [{
            invoice: singleItem.pdfInvoice && singleItem.pdfInvoice !== "Not Found in PDF"
              ? singleItem.pdfInvoice
              : singleItem.zplInvoice && singleItem.zplInvoice !== "Not Found in ZPL"
              ? singleItem.zplInvoice
              : "N/A",
            orderId: singleItem.orderNumber || "N/A",
            awb: singleItem.awb || "N/A",
            asin: singleItem.asin || "N/A",
            sellerSku: singleItem.sellerSku || "N/A",
            customer: cleanCustomerName(singleItem.customer) || "N/A",
            packingScanStatus: "PENDING" as const,
          }];
          amazonOrderService.savePrintedOrders(ordersToSave).catch((err) =>
            console.warn("Background order save error:", err)
          );
        } catch (e) {}

        return;
      }
    }

    toast.loading(`Printing ${targetResults.length} order(s) on ${targetPrinter}...`, {
      id: 'print-prep',
    });

    try {
      let currentPrinter = targetPrinter;

      // 0. ULTRA-FAST SUB-SECOND PATH for single order (Barcode scan / single row direct print)
      if (targetResults.length === 1) {
        const singleItem = targetResults[0];
        let singlePdfBase64 = orderPrintPdfCacheRef.current.get(singleItem.index);

        if (!singlePdfBase64) {
          const combinedDoc = await getOrLoadCombinedDoc(activeFiles);
          if (combinedDoc && combinedDoc.getPageCount() > 0) {
            let pages: number[] = [];
            if (singleItem.combinedPages && singleItem.combinedPages.length > 0) {
              pages = singleItem.combinedPages.filter((p) => p >= 0 && p < combinedDoc.getPageCount());
            } else {
              const matchedList = mappedResults.filter((r) => r.isMatch);
              const mIdx = matchedList.findIndex((r) => r.index === singleItem.index);
              if (mIdx !== -1) {
                const startP = mIdx * 2;
                if (startP + 1 < combinedDoc.getPageCount()) {
                  pages = [startP, startP + 1];
                }
              }
            }

            if (pages.length > 0) {
              const singleDoc = await PDFDocument.create();
              const copiedPages = await singleDoc.copyPages(combinedDoc, pages);
              copiedPages.forEach((p) => singleDoc.addPage(p));
              singlePdfBase64 = await singleDoc.saveAsBase64();
              orderPrintPdfCacheRef.current.set(singleItem.index, singlePdfBase64);
            }
          }
        }

        if (singlePdfBase64) {
          const extRes = await chromeExtensionPrintService.printPdf(singlePdfBase64, currentPrinter, 1, true);
          if (extRes && (extRes.success === false || extRes.error)) {
            throw new Error(extRes.error || `Print failure on ${currentPrinter}`);
          }

          toast.success(`Printed order (4" x 6") directly on ${currentPrinter}!`, { id: "print-prep" });
          markRowsAsPrinted([singleItem.index]);
          setSelectedRows((prev) => {
            const next = new Set(prev);
            next.delete(singleItem.index);
            return next;
          });

          // Automatically store printed Amazon orders in backend database (7-day retention)
          try {
            const orderToSave = {
              invoice:
                singleItem.pdfInvoice && singleItem.pdfInvoice !== "Not Found in PDF"
                  ? singleItem.pdfInvoice
                  : singleItem.zplInvoice && singleItem.zplInvoice !== "Not Found in ZPL"
                  ? singleItem.zplInvoice
                  : "N/A",
              orderId: singleItem.orderNumber || "N/A",
              awb: singleItem.awb || "N/A",
              asin: singleItem.asin || "N/A",
              sellerSku: singleItem.sellerSku || "N/A",
              customer: cleanCustomerName(singleItem.customer) || "N/A",
              packingScanStatus: "PENDING" as const,
            };

            amazonOrderService.savePrintedOrders([orderToSave]).catch((saveErr) => {
              console.warn("Background Amazon order save error:", saveErr);
            });
          } catch (savePrepErr) {
            console.warn("Failed to prepare Amazon orders for database saving:", savePrepErr);
          }

          return;
        }
      }

      const printDoc = await PDFDocument.create();
      let builtSuccessfully = false;

      // 1. FAST PATH: Instant page extraction from pre-generated combinedDoc (< 50ms!)
      const combinedDoc = await getOrLoadCombinedDoc(activeFiles);
      if (combinedDoc && combinedDoc.getPageCount() > 0) {
        const targetPageIndices: number[] = [];
        const matchedList = mappedResults.filter((r) => r.isMatch);

        for (const item of targetResults) {
          if (item.combinedPages && item.combinedPages.length > 0) {
            const allExist = item.combinedPages.every(
              (p) => p >= 0 && p < combinedDoc.getPageCount()
            );
            if (allExist) {
              targetPageIndices.push(...item.combinedPages);
              continue;
            }
          }

          // Robust fallback: derived from matched position (2 pages per matched order: invoice, label)
          const mIdx = matchedList.findIndex((r) => r.index === item.index);
          if (mIdx !== -1) {
            const startP = mIdx * 2;
            if (startP + 1 < combinedDoc.getPageCount()) {
              targetPageIndices.push(startP, startP + 1);
            }
          }
        }

        if (targetPageIndices.length > 0) {
          const copiedPages = await printDoc.copyPages(combinedDoc, targetPageIndices);
          copiedPages.forEach((p) => printDoc.addPage(p));
          builtSuccessfully = true;
        }
      }

      // 2. FALLBACK PATH: If combinedDoc is not available or pages couldn't be extracted
      if (!builtSuccessfully) {
        const { zplDoc, origDoc } = await getOrLoadParsedDocs(activeFiles);

        const TARGET_WIDTH = 4 * 72;
        const TARGET_HEIGHT = 6 * 72;

        const addScaledPage = async (srcPage: any, isZpl = false, sellerSku?: string) => {
          const embedded = await printDoc.embedPage(srcPage);
          const { width: srcW, height: srcH } = embedded;

          if (isZpl) {
            const TOP_SPACING = 25;
            const BOTTOM_SPACING = 10;
            const SIDE_SPACING = 8;

            const availW = TARGET_WIDTH - 2 * SIDE_SPACING;
            const availH = TARGET_HEIGHT - TOP_SPACING - BOTTOM_SPACING;

            const scale = Math.min(availW / srcW, availH / srcH);
            const finalW = srcW * scale;
            const finalH = srcH * scale;

            // Perfectly centered horizontally (equal left & right margins)
            const x = (TARGET_WIDTH - finalW) / 2;
            const y = TARGET_HEIGHT - TOP_SPACING - finalH;

            const newPage = printDoc.addPage([TARGET_WIDTH, TARGET_HEIGHT]);
            newPage.drawPage(embedded, { x, y, width: finalW, height: finalH });

            if (sellerSku) {
              await drawSkuOnLabelPage(printDoc, newPage, sellerSku, x, y, finalW, finalH);
            }
          } else {
            const MARGIN = 6;
            const availW = TARGET_WIDTH - 2 * MARGIN;
            const availH = TARGET_HEIGHT - 2 * MARGIN;

            const scale = Math.min(availW / srcW, availH / srcH);
            const finalW = srcW * scale;
            const finalH = srcH * scale;

            // Perfectly centered horizontally (equal left & right margins)
            const x = (TARGET_WIDTH - finalW) / 2;
            const y = (TARGET_HEIGHT - finalH) / 2;

            const newPage = printDoc.addPage([TARGET_WIDTH, TARGET_HEIGHT]);
            newPage.drawPage(embedded, { x, y, width: finalW, height: finalH });
          }
        };

        for (const item of targetResults) {
          if (item.pdfPages && item.pdfPages.length > 0) {
            for (const pageNum of item.pdfPages) {
              const idx = pageNum - 1;
              if (idx >= 0 && idx < origDoc.getPageCount()) {
                await addScaledPage(origDoc.getPage(idx), false);
              }
            }
          }
          if (item.zplPage > 0 && item.zplPage <= zplDoc.getPageCount()) {
            await addScaledPage(zplDoc.getPage(item.zplPage - 1), true, item.sellerSku);
          }
        }
      }

      let printedSuccessfully = false;

      try {
        let currentPrinter = targetPrinter;
        const totalPages = printDoc.getPageCount();

        if (totalPages === 0) {
          throw new Error("No printable pages generated for selected orders.");
        }

        if (totalPages <= 10) {
          // Fast instant single-shot print for barcode scanning and small batches
          const printBase64 = await printDoc.saveAsBase64();
          const extRes = await chromeExtensionPrintService.printPdf(printBase64, currentPrinter, 1, true);
          if (extRes && (extRes.success === false || extRes.error)) {
            throw new Error(extRes.error || `Print failure on ${currentPrinter}`);
          }
        } else {
          // Batch printing for large batches (10 pages per chunk)
          const BATCH_SIZE = 10;
          for (let i = 0; i < totalPages; i += BATCH_SIZE) {
            const endIdx = Math.min(i + BATCH_SIZE, totalPages);
            toast.loading(`Direct printing label ${i + 1} to ${endIdx} of ${totalPages} to ${currentPrinter}...`, { id: 'print-prep' });

            const chunkDoc = await PDFDocument.create();
            const pageIndices = Array.from({ length: endIdx - i }, (_, idx) => i + idx);
            const copiedPages = await chunkDoc.copyPages(printDoc, pageIndices);
            copiedPages.forEach((p) => chunkDoc.addPage(p));

            const chunkBase64 = await chunkDoc.saveAsBase64();
            const extRes = await chromeExtensionPrintService.printPdf(chunkBase64, currentPrinter, 1, true);
            if (extRes && (extRes.success === false || extRes.error)) {
              throw new Error(extRes.error || `Print failure on pages ${i + 1}-${endIdx}`);
            }
          }
        }

        toast.success(
          `Printed ${totalPages} page(s) (4" x 6") directly on ${currentPrinter}!`,
          { id: 'print-prep' }
        );
        printedSuccessfully = true;
        markRowsAsPrinted(targetResults.map((r) => r.index));
        setSelectedRows((prev) => {
          const next = new Set(prev);
          targetResults.forEach((r) => next.delete(r.index));
          return next;
        });

        // Automatically store printed Amazon orders in backend database (7-day retention)
        try {
          const ordersToSave = targetResults.map((item) => ({
            invoice:
              item.pdfInvoice && item.pdfInvoice !== "Not Found in PDF"
                ? item.pdfInvoice
                : item.zplInvoice && item.zplInvoice !== "Not Found in ZPL"
                ? item.zplInvoice
                : "N/A",
            orderId: item.orderNumber || "N/A",
            awb: item.awb || "N/A",
            asin: item.asin || "N/A",
            sellerSku: item.sellerSku || "N/A",
            customer: cleanCustomerName(item.customer) || "N/A",
            packingScanStatus: "PENDING" as const,
          }));

          amazonOrderService.savePrintedOrders(ordersToSave).catch((saveErr) => {
            console.warn("Background Amazon order save error:", saveErr);
          });
        } catch (savePrepErr) {
          console.warn("Failed to prepare Amazon orders for database saving:", savePrepErr);
        }
      } catch (printLoopErr: any) {
        throw printLoopErr;
      }
    } catch (err: any) {
      console.error('Print error:', err);
      lastVerifiedPrinterRef.current = null;
      invalidatePrinterCache();

      const msg = String(err?.message || err || '');
      const isPrintBridgeIssue =
        msg.includes("PrintBridge") ||
        msg.toLowerCase().includes("extension") ||
        msg.includes("Receiving end does not exist") ||
        msg.includes("Could not establish connection") ||
        msg.includes("runtime is not available") ||
        msg.includes("Failed to communicate");

      if (isPrintBridgeIssue) {
        toast.error(
          "PrintBridge is not running or not detected. Please setup PrintBridge.",
          {
            id: 'print-prep',
            duration: 9000,
            action: {
              label: 'Setup PrintBridge',
              onClick: () => window.open('/printbridge', '_blank'),
            },
          }
        );
        return;
      }

      const isConnectionIssue =
        msg.includes("No printer connected") ||
        msg.includes("offline") ||
        msg.includes("not connected") ||
        msg.includes("disconnected") ||
        msg.includes("No connected printer") ||
        msg.includes("not ready") ||
        msg.includes("SumatraPDF");

      toast.error(
        isConnectionIssue
          ? "No printer connected. Print cancelled to avoid queuing."
          : msg || "Print failure occurred. Please check printer.",
        {
          id: 'print-prep',
          duration: 8000,
          action: {
            label: 'Setup PrintBridge',
            onClick: () => window.open('/printbridge', '_blank'),
          },
        }
      );
    }
  };

  const handlePrintSelected = async () => {
    if (modalMissingAsins.length > 0) {
      toast.error(`Cannot print orders: ${modalMissingAsins.length} ASIN(s) are missing Seller SKU.`);
      setIsMissingSkuModalOpen(true);
      return;
    }

    if (selectedRows.size === 0) {
      toast.error('Please select at least one order to print.');
      return;
    }

    const targetResults = mappedResults.filter((r) => selectedRows.has(r.index));
    await executePrintForItems(targetResults);
  };

  const handleGeneratePicklist = async () => {
    if (modalMissingAsins.length > 0) {
      toast.error(`Cannot generate picklist: ${modalMissingAsins.length} ASIN(s) are missing Seller SKU.`);
      setIsMissingSkuModalOpen(true);
      return;
    }

    // If specific rows are selected, use selected rows; otherwise fallback to filtered orders
    const targetSet =
      selectedRows.size > 0
        ? selectedRows
        : new Set(filteredResults.map((item) => item.index));

    if (targetSet.size === 0) {
      toast.error('No matched orders available to generate a picklist.');
      return;
    }

    try {
      let currentDetailsMap = skuDetailsMapRef.current.size > 0 ? skuDetailsMapRef.current : skuDetailsMap;
      if (currentDetailsMap.size === 0) {
        await fetchAsinMappings();
        currentDetailsMap = skuDetailsMapRef.current.size > 0 ? skuDetailsMapRef.current : skuDetailsMap;
      }

      const picklist = generateAmazonPicklist(mappedResults, targetSet, currentDetailsMap);

      // Open Excel picklist spreadsheet view in a new tab
      openAmazonPicklistTab(picklist);

      // Download Excel (.xlsx) picklist
      await downloadAmazonPicklistExcel(picklist);

      if (selectedRows.size > 0) {
        toast.success(
          `Generated picklist for ${selectedRows.size} selected order(s) (${picklist.items.length} unique SKUs, ${picklist.totalQuantity} total qty).`
        );
      } else {
        toast.success(
          `Generated picklist for ALL ${targetSet.size} matched order(s) (${picklist.items.length} unique SKUs, ${picklist.totalQuantity} total qty).`
        );
      }
    } catch (err) {
      console.error("Failed to generate picklist:", err);
      toast.error("Failed to generate Excel picklist.");
    }
  };

  // Helper to construct order requirements for scanning verification
  const buildOrderRequirements = (item: (typeof mappedResults)[0]): OrderItemRequirement[] => {
    const rawAsins = (item.asin && item.asin !== "N/A" ? item.asin : "")
      .split(/[\r\n]+|\s+\/\s+/)
      .map((s) => s.trim().toUpperCase())
      .filter(Boolean);

    const rawSkus = (item.sellerSku && item.sellerSku !== "N/A" && item.sellerSku !== "-" ? item.sellerSku : "")
      .split(/[\r\n]+|\s+\/\s+/)
      .map((s) => s.trim())
      .filter(Boolean);

    const orderType = getOrderTypeForItem(item);
    const totalQty = Math.max(item.totalQuantity || 0, rawAsins.length, rawSkus.length, 1);

    if (orderType === "single_quantity") {
      return [
        {
          asin: rawAsins[0] || (item.asin && item.asin !== "N/A" ? item.asin.trim().toUpperCase() : "") || "N/A",
          sku: rawSkus[0] || (item.sellerSku && item.sellerSku !== "N/A" ? item.sellerSku.trim() : "") || "N/A",
          requiredQty: 1,
          scannedQty: 0,
        },
      ];
    }

    if (orderType === "multiple_pieces" && new Set(rawAsins).size <= 1) {
      const singleAsin = rawAsins[0] || (item.asin && item.asin !== "N/A" ? item.asin.trim().toUpperCase() : "") || "N/A";
      const singleSku = rawSkus[0] || (item.sellerSku && item.sellerSku !== "N/A" ? item.sellerSku.trim() : "") || "N/A";
      return [
        {
          asin: singleAsin,
          sku: singleSku,
          requiredQty: totalQty,
          scannedQty: 0,
        },
      ];
    }

    // Multiple ASINs (or multiple items with distinct ASINs)
    if (rawAsins.length > 0) {
      const asinCounts = new Map<string, number>();
      rawAsins.forEach((a) => {
        asinCounts.set(a, (asinCounts.get(a) || 0) + 1);
      });

      const reqs: OrderItemRequirement[] = [];
      asinCounts.forEach((count, asin) => {
        const asinIdx = rawAsins.indexOf(asin);
        const sku = asinIdx !== -1 && rawSkus[asinIdx] ? rawSkus[asinIdx] : (asinToSkuMap.get(asin) || "N/A");
        reqs.push({
          asin,
          sku,
          requiredQty: count,
          scannedQty: 0,
        });
      });

      const currentSum = reqs.reduce((sum, r) => sum + r.requiredQty, 0);
      if (totalQty > currentSum && reqs.length > 0) {
        reqs[0].requiredQty += totalQty - currentSum;
      }

      return reqs;
    }

    if (rawSkus.length > 0) {
      const skuCounts = new Map<string, number>();
      rawSkus.forEach((s) => {
        skuCounts.set(s, (skuCounts.get(s) || 0) + 1);
      });
      const reqs: OrderItemRequirement[] = [];
      skuCounts.forEach((count, sku) => {
        reqs.push({
          asin: "N/A",
          sku,
          requiredQty: count,
          scannedQty: 0,
        });
      });
      return reqs;
    }

    return [
      {
        asin: "N/A",
        sku: "N/A",
        requiredQty: totalQty,
        scannedQty: 0,
      },
    ];
  };

  const isReqMatch = (req: OrderItemRequirement, query: string): boolean => {
    const qN = query.trim().toUpperCase();
    if (!qN) return false;

    // 1. ASIN match
    if (req.asin && req.asin !== "N/A") {
      if (req.asin.toUpperCase() === qN) return true;
      if (qN.length >= 6 && req.asin.toUpperCase().includes(qN)) return true;
    }

    // 2. Seller SKU match
    if (req.sku && req.sku !== "N/A" && req.sku !== "-") {
      const skuNorm = req.sku.toUpperCase();
      if (skuNorm === qN) return true;
      if (qN.length >= 3 && skuNorm.includes(qN)) return true;
    }

    // 3. Barcode match from skuDetailsMap
    if (req.asin && req.asin !== "N/A") {
      const details = skuDetailsMap.get(req.asin.toUpperCase());
      if (details?.generateBarcode && details.generateBarcode.toUpperCase() === qN) return true;
    }
    if (req.sku && req.sku !== "N/A" && req.sku !== "-") {
      const details = skuDetailsMap.get(req.sku.toUpperCase());
      if (details?.generateBarcode && details.generateBarcode.toUpperCase() === qN) return true;
    }

    return false;
  };

  const isOrderLevelMatch = (item: (typeof mappedResults)[0], query: string): boolean => {
    const qN = query.trim().toUpperCase();
    if (!qN) return false;

    const orderNum = (item.orderNumber || "").trim().toUpperCase();
    const pdfInv = (item.pdfInvoice || "").trim().toUpperCase();
    const zplInv = (item.zplInvoice || "").trim().toUpperCase();
    const awb = (item.awb || "").trim().toUpperCase();

    if (orderNum && (orderNum === qN || (qN.length >= 8 && orderNum.includes(qN)))) return true;
    if (pdfInv && pdfInv !== "N/A" && pdfInv !== "NOT FOUND IN PDF" && (pdfInv === qN || (qN.length >= 6 && pdfInv.includes(qN)))) return true;
    if (zplInv && zplInv !== "N/A" && zplInv !== "NOT FOUND IN ZPL" && (zplInv === qN || (qN.length >= 6 && zplInv.includes(qN)))) return true;
    if (awb && awb !== "N/A" && (awb === qN || (qN.length >= 8 && awb.includes(qN)))) return true;

    return false;
  };

  const doesOrderMatchQuery = (item: (typeof mappedResults)[0], query: string): boolean => {
    const qL = query.trim().toLowerCase();
    if (!qL) return false;

    if (isOrderLevelMatch(item, query)) return true;

    const reqs = orderScanProgressRef.current.get(item.index) || buildOrderRequirements(item);
    if (reqs.some((r) => isReqMatch(r, query))) return true;

    const asinMatch = item.asin && item.asin.toLowerCase().includes(qL);
    const skuMatch = item.sellerSku && item.sellerSku.toLowerCase().includes(qL);
    return !!(asinMatch || skuMatch);
  };

  const enqueuePrint = useCallback(
    (item: (typeof mappedResults)[0]) => {
      // 1. Immediately and synchronously mark row as printed so any subsequent scans
      // (even within milliseconds) see this order as already printed!
      markRowsAsPrinted([item.index]);

      // 2. Chain print execution to serialize printer calls
      const printTask = printQueuePromiseRef.current
        .catch(() => {})
        .then(async () => {
          try {
            await executePrintForItems([item]);
          } catch (err) {
            // If printing threw an error, unmark so the user can re-scan and retry
            unmarkRowsAsPrinted([item.index]);
            throw err;
          }
        });

      printQueuePromiseRef.current = printTask;
      return printTask;
    },
    [markRowsAsPrinted, unmarkRowsAsPrinted, executePrintForItems]
  );

  const handleAutoPrintSearch = async (query: string) => {
    const q = query.trim();
    if (!q) return;

    if (modalMissingAsins.length > 0) {
      toast.error(`Scanning locked: ${modalMissingAsins.length} ASIN(s) are missing Seller SKU. Please resolve SKUs first.`);
      setIsMissingSkuModalOpen(true);
      return;
    }

    // Immediately clear input field to prevent duplicate scans from trailing Enter/carriage return
    setAutoPrintQuery("");
    autoPrintInputRef.current?.focus();

    // 1. Find all matched orders in the uploaded dataset matching query q
    const allMatchingOrders = mappedResults.filter((item) => item.isMatch && doesOrderMatchQuery(item, q));

    if (allMatchingOrders.length === 0) {
      toast.error(`No matching order found for "${query}"`);
      return;
    }

    // 2. Enforce active Order Composition Filter (single_quantity, multiple_asin, multiple_pieces)
    const candidateOrders = allMatchingOrders.filter(
      (item) => getOrderTypeForItem(item) === orderTypeFilter
    );

    if (candidateOrders.length === 0) {
      // Scanned item exists in batch but NOT in the active filter mode
      const otherTypes = Array.from(
        new Set(allMatchingOrders.map((item) => getOrderTypeForItem(item)))
      ).map(getOrderTypeLabel);

      toast.warning(
        `Only ${getOrderTypeLabel(orderTypeFilter)} orders allowed in this mode! Scanned item belongs to a ${otherTypes.join(" / ")} order.`,
        { id: "order-type-mismatch", duration: 6000 }
      );
      return;
    }

    // 3. Filter candidate orders to unprinted ones
    const unprintedCandidates = candidateOrders.filter(
      (item) => !printedRowsRef.current.has(item.index)
    );

    if (unprintedCandidates.length === 0) {
      const otherUnprintedOrders = allMatchingOrders.filter(
        (item) => !printedRowsRef.current.has(item.index) && getOrderTypeForItem(item) !== orderTypeFilter
      );

      if (otherUnprintedOrders.length > 0) {
        const otherTypes = Array.from(
          new Set(otherUnprintedOrders.map((item) => getOrderTypeForItem(item)))
        ).map(getOrderTypeLabel);

        toast.warning(
          `All ${candidateOrders.length} ${getOrderTypeLabel(orderTypeFilter)} order(s) for "${query}" have already been printed! (Item also exists in ${otherTypes.join(" / ")} - switch filter to process).`,
          { id: "auto-print", duration: 6000 }
        );
        return;
      }

      toast.warning(
        `All ${candidateOrders.length} ${getOrderTypeLabel(orderTypeFilter)} order(s) for "${query}" have already been printed and removed!`,
        { id: "auto-print", duration: 4000 }
      );
      return;
    }

    // 4. Check if any unprinted candidate order is currently in-progress (partially scanned)
    let targetItem: (typeof mappedResults)[0] | undefined;
    let seqNotice = "";

    const unprintedIndexes = new Set(unprintedCandidates.map((c) => c.index));
    const inProgressEntries = Array.from(orderScanProgressRef.current.entries()).filter(
      ([index, reqs]) => {
        if (!unprintedIndexes.has(index)) return false;
        const hasScanned = reqs.some((r) => r.scannedQty > 0);
        const hasRemaining = reqs.some((r) => r.scannedQty < r.requiredQty);
        return hasScanned && hasRemaining;
      }
    );

    // Prioritize in-progress candidate order if scanned query matches its remaining requirement or order ID
    for (const [inProgIdx, reqs] of inProgressEntries) {
      const item = mappedResults.find((m) => m.index === inProgIdx);
      if (!item) continue;

      const matchesRemainingReq = reqs.some(
        (r) => r.scannedQty < r.requiredQty && isReqMatch(r, q)
      );
      const matchesAnyReq = reqs.some((r) => isReqMatch(r, q));
      const matchesOrderId = isOrderLevelMatch(item, q);

      if (matchesRemainingReq || matchesAnyReq || matchesOrderId) {
        targetItem = item;
        break;
      }
    }

    // 5. If no in-progress candidate matched, pick via deterministic FIFO sorting by index ascending
    if (!targetItem) {
      unprintedCandidates.sort((a, b) => a.index - b.index);
      targetItem = unprintedCandidates[0];
      const remainingAfterThis = unprintedCandidates.length - 1;
      seqNotice = "";
      if (candidateOrders.length > 1) {
        const currentStep = candidateOrders.length - unprintedCandidates.length + 1;
        seqNotice = `Printed ${currentStep} of ${candidateOrders.length} (${remainingAfterThis} remaining)`;
      }
    }

    if (!targetItem) {
      toast.error(`No matching order found for "${query}"`);
      return;
    }

    // 3. Retrieve or initialize requirement list for this order
    let reqs = orderScanProgressRef.current.get(targetItem.index);
    if (!reqs) {
      reqs = buildOrderRequirements(targetItem);
      orderScanProgressRef.current.set(targetItem.index, reqs);
    }

    const orderType = getOrderTypeForItem(targetItem);

    // 4. If single quantity order, immediately print
    if (orderType === "single_quantity") {
      orderScanProgressRef.current.delete(targetItem.index);
      try {
        await enqueuePrint(targetItem);
        if (seqNotice) {
          toast.info(`${seqNotice} • Customer: ${cleanCustomerName(targetItem.customer)}`, {
            duration: 4000,
          });
        }
      } catch (err) {
        console.error("Auto print error for single_quantity item:", err);
      }
      setTimeout(() => {
        autoPrintInputRef.current?.focus();
        autoPrintInputRef.current?.select();
      }, 50);
      return;
    }

    // 5. For multiple_asin and multiple_pieces:
    // If user scanned an order-level identifier (Invoice #, Order ID, AWB) directly:
    const isOrderScan = isOrderLevelMatch(targetItem, q);
    if (isOrderScan) {
      const allScanned = reqs.every((r) => r.scannedQty >= r.requiredQty);
      if (allScanned) {
        orderScanProgressRef.current.delete(targetItem.index);
        try {
          await enqueuePrint(targetItem);
          if (seqNotice) {
            toast.info(`Sequential Print (${seqNotice}): Customer ${cleanCustomerName(targetItem.customer)}`, {
              duration: 4000,
            });
          }
        } catch (err) {
          console.error("Auto print error for order-level item:", err);
        }
        setTimeout(() => {
          autoPrintInputRef.current?.focus();
          autoPrintInputRef.current?.select();
        }, 50);
        return;
      } else {
        // Invoice scanned, but not all ASINs/pieces are scanned yet -> block print!
        const remainingReqs = reqs.filter((r) => r.scannedQty < r.requiredQty);
        const remainingAsins = remainingReqs
          .map((r) => (r.asin !== "N/A" ? r.asin : r.sku))
          .filter(Boolean);
        const remainingPieces = remainingReqs.reduce(
          (sum, r) => sum + (r.requiredQty - r.scannedQty),
          0
        );

        toast.warning(
          `Cannot print Invoice ${targetItem.pdfInvoice || targetItem.zplInvoice || targetItem.orderNumber}: ASIN is remaining: ${remainingAsins.join(", ")} (${remainingPieces} piece(s) remain). Please scan all ASINs first.`,
          { duration: 7000 }
        );
        return;
      }
    }

    // 6. User scanned an ASIN / SKU / Barcode:
    // Find requirement matching query (preferring one that still needs scans)
    let matchingReq = reqs.find((r) => r.scannedQty < r.requiredQty && isReqMatch(r, q));

    if (!matchingReq) {
      matchingReq = reqs.find((r) => isReqMatch(r, q));
    }

    if (!matchingReq) {
      toast.error(
        `Scanned item "${q}" does not match any ASIN/SKU for Order ${targetItem.orderNumber || targetItem.pdfInvoice}`
      );
      return;
    }

    // Check if this specific item is already fully scanned
    if (matchingReq.scannedQty >= matchingReq.requiredQty) {
      const remainingReqs = reqs.filter((r) => r.scannedQty < r.requiredQty);
      const remainingAsins = remainingReqs
        .map((r) => (r.asin !== "N/A" ? r.asin : r.sku))
        .filter(Boolean);
      const remainingPieces = remainingReqs.reduce(
        (sum, r) => sum + (r.requiredQty - r.scannedQty),
        0
      );

      toast.info(
        `ASIN ${matchingReq.asin} is already fully scanned for this order. ASIN is remaining: ${remainingAsins.join(", ")} (${remainingPieces} piece(s) remain). Please scan remaining ASIN.`,
        { duration: 6000 }
      );
      return;
    }

    // Record the scan for this requirement
    matchingReq.scannedQty++;

    const remainingReqs = reqs.filter((r) => r.scannedQty < r.requiredQty);
    const totalRequired = reqs.reduce((sum, r) => sum + r.requiredQty, 0);
    const totalScanned = reqs.reduce((sum, r) => sum + r.scannedQty, 0);

    // If items still remain, do NOT print -> show toast of remaining ASIN(s)
    if (remainingReqs.length > 0) {
      const remainingAsins = remainingReqs
        .map((r) => (r.asin !== "N/A" ? r.asin : r.sku))
        .filter(Boolean);
      const remainingPieces = remainingReqs.reduce(
        (sum, r) => sum + (r.requiredQty - r.scannedQty),
        0
      );

      if (orderType === "multiple_asin") {
        toast.warning(
          `ASIN is remaining: ${remainingAsins.join(", ")} (${totalScanned}/${totalRequired} scanned for Order ${targetItem.orderNumber || targetItem.pdfInvoice}). Scan remaining ASIN to print.`,
          { duration: 7000 }
        );
      } else {
        // multiple_pieces
        toast.warning(
          `ASIN is remaining: ${remainingAsins.join(", ")} (${remainingPieces} piece(s) remaining, ${totalScanned}/${totalRequired} scanned for Order ${targetItem.orderNumber || targetItem.pdfInvoice}). Scan remaining piece to print.`,
          { duration: 7000 }
        );
      }
      return;
    }

    // ALL items/pieces for this order have been scanned!
    toast.success(
      `All ASINs scanned (${totalScanned}/${totalRequired}) for Order ${targetItem.orderNumber || targetItem.pdfInvoice}! Printing shipping label and invoice...`,
      { duration: 4000 }
    );

    // Clear progress for completed order
    orderScanProgressRef.current.delete(targetItem.index);

    // Trigger print
    try {
      await enqueuePrint(targetItem);
      if (seqNotice) {
        toast.info(`Sequential Print (${seqNotice}): Customer ${cleanCustomerName(targetItem.customer)}`, {
          duration: 4000,
        });
      }
    } catch (err) {
      console.error("Auto print error for multi-item order:", err);
    }
    setTimeout(() => {
      autoPrintInputRef.current?.focus();
      autoPrintInputRef.current?.select();
    }, 50);
  };

  if (!summary || results.length === 0) {
    return (
      <div className="border border-border bg-card p-12 text-center shadow-sm">
        <AlertTriangle className="mx-auto mb-3 h-12 w-12 text-[#E8C16D]" />
        <h3 className="text-xl font-bold text-foreground">No Processed Order Data Found</h3>
        <p className="mx-auto mt-1 mb-6 max-w-md text-sm text-muted-foreground">
          Please upload both Amazon PDF and ZPL files to run conversion and verification.
        </p>
        <Button
          type="button"
          onClick={handleReset}
          className="mx-auto border-[#E8C16D] bg-[#E8C16D] text-[#0A0E1A] hover:bg-[#0A0E1A] hover:text-[#E8C16D]"
        >
          Go to File Upload
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* ===================================================== */}
      {/* AMAZON ORDER VERIFICATION RESULTS SECTION */}
      {/* ===================================================== */}
      <div className="border border-[#E7E0D2] bg-white p-4 sm:p-6 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-1.5">
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-[#0A0E1A]">
              Amazon Order Process Results
            </h2>

            <p className="text-xs sm:text-sm text-slate-500 break-words">
              Files: <strong className="text-slate-800">{summary.pdfFileName}</strong> &{" "}
              <strong className="text-slate-800">{summary.zplFileName}</strong>
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleReset}
              className="flex h-10 sm:h-11 w-full sm:w-auto items-center justify-center gap-2 bg-[#0A0E1A] px-4 sm:px-5 text-xs sm:text-sm font-semibold text-white transition hover:bg-[#161D2E]"
            >
              <RotateCcw size={16} />
              New Batch
            </button>
          </div>
        </div>

        {/* Persistent Warning Banner if any Seller SKU is missing */}
        {modalMissingAsins.length > 0 && (
          <div className="mt-5 rounded-2xl border border-rose-300 bg-rose-50/90 p-4 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-rose-100 text-rose-700">
                <ShieldAlert className="h-5 w-5 animate-pulse" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-rose-900">
                  Strict Guard Active: {modalMissingAsins.length} ASIN(s) Missing Seller SKU
                </h4>
                <p className="text-xs text-rose-700">
                  Order dispatch and label printing are locked until all Seller SKUs are mapped in Products.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setIsMissingSkuModalOpen(true)}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-[#0A0E1A] hover:bg-[#1b253b] px-4 py-2 text-xs font-bold text-[#E8C16D] shadow-sm transition active:scale-95 cursor-pointer"
            >
              <Lock className="h-3.5 w-3.5" />
              <span>Resolve Missing SKUs ({modalMissingAsins.length})</span>
            </button>
          </div>
        )}

        {/* =================================================== */}
        {/* STATS CARDS */}
        {/* =================================================== */}
        <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 border-t border-[#E7E0D2] pt-6">
          {/* Card 1: Total ZPL */}
          <article
            onClick={() => {
              setSelectedPdfType("zpl");
              setActiveTab("pdf");
            }}
            className="cursor-pointer border border-[#E7E0D2] bg-white p-4 sm:p-5 shadow-sm transition-all hover:-translate-y-1 hover:shadow-md"
          >
            <p className="text-xs sm:text-sm font-medium text-slate-500">
              ZPL Labels
            </p>

            <div className="mt-3 sm:mt-4 flex items-end justify-between gap-3">
              <h3 className="text-2xl sm:text-3xl font-bold text-[#0A0E1A]">
                {summary.totalZplLabels}
              </h3>

              <span className="rounded bg-amber-100 px-2 py-1 text-xs font-bold text-amber-800">
                Converted
              </span>
            </div>
          </article>

          {/* Card 2: Total PDF Orders */}
          <article
            onClick={() => {
              setSelectedPdfType("original");
              setActiveTab("pdf");
            }}
            className="cursor-pointer border border-[#E7E0D2] bg-white p-4 sm:p-5 shadow-sm transition-all hover:-translate-y-1 hover:shadow-md"
          >
            <p className="text-xs sm:text-sm font-medium text-slate-500">
              PDF Orders
            </p>

            <div className="mt-3 sm:mt-4 flex items-end justify-between gap-3">
              <h3 className="text-2xl sm:text-3xl font-bold text-[#0A0E1A]">
                {summary.totalPdfOrders}
              </h3>

              <span className="rounded bg-blue-100 px-2 py-1 text-xs font-bold text-blue-700">
                {summary.totalPdfPages} pgs
              </span>
            </div>
          </article>

          {/* Card 3: Matched Rate */}
          <article
            onClick={() => {
              setActiveTab("table");
              setPage(1);
            }}
            className="cursor-pointer border border-[#E7E0D2] bg-white p-4 sm:p-5 shadow-sm transition-all hover:-translate-y-1 hover:shadow-md"
          >
            <div className="flex items-center justify-between">
              <p className="text-xs sm:text-sm font-medium text-slate-500">
                Matched Orders
              </p>
              {summary.mismatchCount > 0 && (
                <span
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedPdfType(unmatchedPdfCount > 0 ? "unmatched_pdf" : "unmatched_zpl");
                    setActiveTab("pdf");
                  }}
                  className="rounded bg-red-100 px-2 py-0.5 text-xs font-bold text-red-700 hover:bg-red-200 cursor-pointer"
                  title="Click to view unmatched documents in PDF viewer"
                >
                  {summary.mismatchCount} Unmatched
                </span>
              )}
            </div>

            <div className="mt-3 sm:mt-4 flex items-end justify-between gap-3">
              <h3 className="text-2xl sm:text-3xl font-bold text-[#0A0E1A]">
                {printedRows.size > 0
                  ? `${remainingMatchedCount} / ${summary.matchedCount}`
                  : summary.matchedCount}
              </h3>

              <span className="rounded bg-green-100 px-2 py-1 text-xs font-bold text-green-700">
                {printedRows.size > 0
                  ? `${printedRows.size} printed`
                  : `${summary.matchPercentage}%`}
              </span>
            </div>
          </article>
        </div>
      </div>

      {/* ===================================================== */}
      {/* TABS & INSTANT AUTO-PRINT SEARCH BAR */}
      {/* ===================================================== */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 border-b border-border pb-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
          <button
            type="button"
            onClick={() => {
              setActiveTab("table");
              setPage(1);
            }}
            className={`inline-flex h-12 sm:h-14 w-full sm:w-56 items-center justify-center gap-2 border text-xs sm:text-sm font-semibold transition-all duration-200 ${
              activeTab === "table"
                ? "border-[#E8C16D] bg-[#E8C16D] text-[#0A0E1A]"
                : "border-border bg-[#0A0E1A] text-[#E8C16D] hover:bg-[#E8C16D] hover:text-[#0A0E1A]"
            }`}
          >
            Matched Orders ({showPrinted ? summary.matchedCount : remainingMatchedCount})
          </button>

          {/* Matched PDF Viewer Dropdown Selector */}
          <div
            className={`w-full sm:w-72 lg:w-80 transition-all ${
              activeTab === "pdf" && !selectedPdfType.startsWith("unmatched") ? "ring-2 ring-[#E8C16D]" : ""
            }`}
            onClick={() => {
              if (activeTab !== "pdf" || selectedPdfType.startsWith("unmatched")) {
                setSelectedPdfType("combined");
                setActiveTab("pdf");
              }
            }}
          >
            <ReactSelect
              options={pdfViewOptions}
              value={
                pdfViewOptions.find((opt) => opt.value === selectedPdfType) ??
                pdfViewOptions[0]
              }
              onChange={(opt) => {
                if (opt?.value) {
                  setSelectedPdfType(opt.value as AmazonPdfViewType);
                  setActiveTab("pdf");
                }
              }}
              height={56}
              borderColor={activeTab === "pdf" && !selectedPdfType.startsWith("unmatched") ? "#E8C16D" : "#0A0E1A"}
              backgroundColor="#0A0E1A"
              textColor="#E8C16D"
              placeholderColor="#E8C16D"
              menuBackgroundColor="#0A0E1A"
              optionHoverColor="#161D2E"
              optionSelectedColor="#E8C16D"
              optionSelectedTextColor="#0A0E1A"
            />
          </div>

          {/* Unmatched Orders Dropdown (1. PDF and 2. ZPL) */}
          {summary.mismatchCount > 0 && (
            <div
              className={`w-full sm:w-64 lg:w-72 transition-all ${
                activeTab === "pdf" && selectedPdfType.startsWith("unmatched") ? "ring-2 ring-[#E8C16D]" : ""
              }`}
            >
              <ReactSelect
                options={unmatchedPdfOptions}
                value={
                  unmatchedPdfOptions.find((opt) => opt.value === selectedPdfType) ??
                  unmatchedPdfOptions[0]
                }
                onChange={(opt) => {
                  if (opt?.value) {
                    setSelectedPdfType(opt.value as AmazonPdfViewType);
                    setActiveTab("pdf");
                  }
                }}
                height={56}
                borderColor={activeTab === "pdf" && selectedPdfType.startsWith("unmatched") ? "#E8C16D" : "#0A0E1A"}
                backgroundColor="#0A0E1A"
                textColor="#E8C16D"
                placeholderColor="#E8C16D"
                menuBackgroundColor="#0A0E1A"
                optionHoverColor="#161D2E"
                optionSelectedColor="#E8C16D"
                optionSelectedTextColor="#0A0E1A"
              />
            </div>
          )}
        </div>

        {/* Rightside Corner: Instant Auto-Print Search Bar */}
        <div className="relative w-full md:w-[480px] lg:w-[560px]">
          <Zap className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#B88728] animate-pulse" />
          <input
            ref={autoPrintInputRef}
            type="text"
            autoFocus
            placeholder={
              orderTypeFilter === "single_quantity"
                ? "Scan Single Quantity ASIN, Order ID, or AWB to print..."
                : orderTypeFilter === "multiple_asin"
                ? "Scan Multiple ASIN items to print..."
                : "Scan Multiple Pieces items to print..."
            }
            value={autoPrintQuery}
            onChange={(e) => {
              const val = e.target.value;
              setAutoPrintQuery(val);
              if (autoScanTimerRef.current) {
                clearTimeout(autoScanTimerRef.current);
              }
              const trimmed = val.trim();
              if (trimmed.length >= 10) {
                autoScanTimerRef.current = setTimeout(() => {
                  const currentInput = autoPrintInputRef.current?.value.trim();
                  if (currentInput && currentInput === trimmed) {
                    autoPrintInputRef.current?.select();
                    handleAutoPrintSearch(currentInput);
                  }
                }, 180);
              }
            }}
            onFocus={(e) => e.target.select()}
            onClick={(e) => e.currentTarget.select()}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                if (autoScanTimerRef.current) {
                  clearTimeout(autoScanTimerRef.current);
                }
                const raw = e.currentTarget.value.trim() || autoPrintQuery.trim();
                if (raw) {
                  autoPrintInputRef.current?.select();
                  handleAutoPrintSearch(raw);
                }
              }
            }}
            className="h-12 sm:h-14 w-full border-2 border-[#E8C16D] bg-[#FFF9EC] dark:bg-[#0A0E1A] pl-10 pr-10 text-xs sm:text-sm font-bold text-[#0A0E1A] dark:text-white placeholder:text-slate-500 placeholder:font-normal outline-none transition focus:ring-2 focus:ring-[#E8C16D]"
          />
          {autoPrintQuery ? (
            <button
              type="button"
              onMouseDown={(e) => {
                e.preventDefault();
                setAutoPrintQuery("");
                setTimeout(() => {
                  autoPrintInputRef.current?.focus();
                }, 10);
              }}
              onClick={() => {
                setAutoPrintQuery("");
                autoPrintInputRef.current?.focus();
              }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1"
            >
              <X className="h-4 w-4" />
            </button>
          ) : null}
        </div>
      </div>

      {/* ===================================================== */}
      {/* TAB 1: COMPARISON TABLE VIEW */}
      {/* ===================================================== */}
      {activeTab === "table" && (
        <div className="space-y-4">
          {/* Table Filters & Search */}
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            {/* Search Box */}
            <div className="relative w-full lg:max-w-md">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search Order ID, Invoice #, ASIN, AWB, Customer..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setPage(1);
                }}
                className="h-11 sm:h-14 w-full border border-border bg-background pl-10 pr-4 text-xs sm:text-sm text-foreground placeholder:text-muted-foreground outline-none transition focus:border-[#E8C16D]"
              />
            </div>

            {/* Action Buttons & Filters */}
            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
              {/* Connected Printer Selection Dropdown */}
              <div className="w-full sm:w-56">
                <ReactSelect
                  options={printerOptions}
                  value={
                    printerOptions.find((opt) => opt.value === selectedPrinter) ??
                    (selectedPrinter ? { label: selectedPrinter, value: selectedPrinter } : null)
                  }
                  onChange={(opt) => {
                    if (opt?.value) {
                      setSelectedPrinter(opt.value);
                      if (typeof window !== "undefined") {
                        localStorage.setItem("amazon_selected_printer", opt.value);
                        localStorage.setItem("lastUsedPrinter", opt.value);
                      }
                      lastVerifiedPrinterRef.current = {
                        printerName: opt.value,
                        timestamp: Date.now(),
                      };
                    }
                  }}
                  placeholder={
                    availablePrinters.length === 0
                      ? "No Printers Found"
                      : "Select Printer"
                  }
                  height={56}
                  borderColor="#0A0E1A"
                  backgroundColor="#0A0E1A"
                  textColor="#E8C16D"
                  placeholderColor="#E8C16D"
                  menuBackgroundColor="#0A0E1A"
                  optionHoverColor="#161D2E"
                  optionSelectedColor="#E8C16D"
                  optionSelectedTextColor="#0A0E1A"
                  optionTextColor="#ffffff"
                  menuPortalTarget={typeof window !== "undefined" ? document.body : undefined}
                />
              </div>

              {/* Order Composition Filter Select Dropdown */}
              <div className="w-full sm:w-60">
                <ReactSelect
                  options={orderTypeOptions}
                  value={
                    orderTypeOptions.find((opt) => opt.value === orderTypeFilter) ??
                    orderTypeOptions[0]
                  }
                  onChange={(opt) => {
                    if (opt?.value) {
                      setOrderTypeFilter(opt.value as AmazonOrderTypeFilter);
                      setPage(1);
                    }
                  }}
                  height={56}
                  borderColor="#0A0E1A"
                  backgroundColor="#0A0E1A"
                  textColor="#E8C16D"
                  placeholderColor="#E8C16D"
                  menuBackgroundColor="#0A0E1A"
                  optionHoverColor="#161D2E"
                  optionSelectedColor="#E8C16D"
                  optionSelectedTextColor="#0A0E1A"
                  menuPortalTarget={typeof window !== "undefined" ? document.body : undefined}
                />
              </div>

              {missingSkuItems.length > 0 && (
                <button
                  type="button"
                  onClick={() => setIsMissingSkuModalOpen(true)}
                  className="inline-flex h-11 sm:h-14 w-full sm:w-auto items-center justify-center border border-red-500/50 bg-red-500/10 px-4 text-xs sm:text-sm font-semibold text-red-600 dark:text-red-400 transition-all duration-200 hover:bg-red-600 hover:text-white cursor-pointer"
                  title="Click to view ASINs missing Seller SKU in database"
                >
                  <span>Missing Sku ({missingSkuItems.length})</span>
                </button>
              )}

              <button
                type="button"
                onClick={handleGeneratePicklist}
                className="inline-flex h-11 sm:h-14 w-full sm:w-auto sm:px-5 cursor-pointer items-center justify-center gap-1.5 border border-[#0A0E1A] bg-[#0A0E1A] text-xs sm:text-sm font-semibold text-[#E8C16D] transition-all duration-200 hover:border-[#E8C16D] hover:bg-[#E8C16D] hover:text-[#0A0E1A]"
                title="Download Excel picklist"
              >
                <FileText className="h-4 w-4" />
                <span>Generate Picklist {selectedRows.size > 0 ? `(${selectedRows.size})` : `(All ${filteredResults.length})`}</span>
              </button>

              {printedRows.size > 0 && (
                <button
                  type="button"
                  onClick={() => setShowPrinted((prev) => !prev)}
                  className={`inline-flex h-11 sm:h-14 w-full sm:w-auto items-center justify-center gap-1.5 border px-3.5 text-xs sm:text-sm font-semibold transition-all duration-200 cursor-pointer ${
                    showPrinted
                      ? "border-blue-500 bg-blue-500/15 text-blue-600 dark:text-blue-400 hover:bg-blue-500/25"
                      : "border-border bg-card text-muted-foreground hover:bg-accent hover:text-foreground"
                  }`}
                  title="Toggle to view or hide already printed orders"
                >
                  {showPrinted ? (
                    <>
                      <EyeOff className="h-4 w-4" />
                      <span>Hide Printed ({printedRows.size})</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                      <span>Show Printed ({printedRows.size})</span>
                    </>
                  )}
                </button>
              )}

              <button
                type="button"
                disabled={selectedRows.size === 0}
                onClick={handlePrintSelected}
                className={`inline-flex h-11 sm:h-14 w-full sm:w-auto sm:px-6 items-center justify-center gap-1.5 border text-xs sm:text-sm font-semibold transition-all duration-200 ${
                  selectedRows.size > 0
                    ? "cursor-pointer border-[#E8C16D] bg-[#E8C16D] text-[#0A0E1A] hover:bg-[#0A0E1A] hover:text-[#E8C16D] hover:border-[#E8C16D]"
                    : "cursor-not-allowed border-[#E8C16D]/50 bg-[#E8C16D]/25 text-[#0A0E1A] font-bold"
                }`}
              >
                <Printer className="h-4 w-4" />
                Print {selectedRows.size > 0 ? `(${selectedRows.size})` : ""}
              </button>
            </div>
          </div>

          {/* =================================================== */}
          {/* MOBILE VIEW: RESPONSIVE ORDER CARDS (< 768px) */}
          {/* =================================================== */}
          <div className="space-y-3 md:hidden">
            {/* Mobile Select All Bar */}
            <div className="flex items-center justify-between rounded-xl border border-border bg-[#0A0E1A] p-3 text-xs font-semibold text-white">
              <label className="flex items-center gap-2 cursor-pointer">
                <Checkbox
                  checked={allPageSelected}
                  onCheckedChange={toggleAllPage}
                />
                <span>Select All Page ({paginatedResults.length})</span>
              </label>
              <span className="text-[#E8C16D]">
                {selectedRows.size} Selected
              </span>
            </div>

            {paginatedResults.length === 0 ? (
              <div className="rounded-xl border border-border bg-card p-8 text-center text-xs text-muted-foreground space-y-2">
                <p>
                  {printedRows.size > 0 && !showPrinted
                    ? `All matched orders in this view have been printed! (${printedRows.size} printed)`
                    : "No orders match your current search or filter."}
                </p>
                {printedRows.size > 0 && !showPrinted && (
                  <button
                    type="button"
                    onClick={() => setShowPrinted(true)}
                    className="font-semibold text-[#B88728] underline underline-offset-4 hover:opacity-80 cursor-pointer"
                  >
                    View printed orders ({printedRows.size})
                  </button>
                )}
              </div>
            ) : (
              paginatedResults.map((item) => (
                <div
                  key={item.index}
                  className={`rounded-2xl border p-4 shadow-2xs transition-all space-y-3 ${
                    selectedRows.has(item.index)
                      ? "border-[#E8C16D] bg-[#FFF9EC]/30 dark:bg-[#E8C16D]/5"
                      : "border-border bg-card"
                  }`}
                >
                  {/* Card Header */}
                  <div className="flex items-center justify-between border-b border-border/60 pb-2.5">
                    <label className="flex items-center gap-2.5 cursor-pointer">
                      <Checkbox
                        checked={selectedRows.has(item.index)}
                        onCheckedChange={(checked) =>
                          handleSelectRow(item.index, Boolean(checked))
                        }
                      />
                      <span className="font-mono text-xs font-bold text-[#0A0E1A] dark:text-white">
                        {item.orderNumber}
                      </span>
                    </label>

                    <div className="flex items-center gap-1.5">
                      {printedRows.has(item.index) && (
                        <span className="rounded-md bg-blue-500/10 px-2 py-0.5 text-[10px] font-bold text-blue-600 dark:text-blue-400 inline-flex items-center gap-1">
                          <CheckCircle2 className="h-3 w-3" /> Printed
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Card Detail Grid */}
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    {/* Invoices */}
                    <div className="col-span-2 rounded-lg bg-muted/40 p-2 space-y-0.5">
                      <span className="text-[10px] font-medium text-muted-foreground block uppercase tracking-wider">
                        Invoice
                      </span>
                      {item.pdfInvoice && item.pdfInvoice !== "Not Found in PDF" ? (
                        <span className="font-semibold text-blue-600 dark:text-blue-400 truncate block">
                          {item.pdfInvoice}
                        </span>
                      ) : item.zplInvoice &&
                        item.zplInvoice !== "Not Found in ZPL" &&
                        item.zplInvoice !== "N/A" ? (
                        <span className="font-semibold text-blue-600 dark:text-blue-400 truncate block">
                          {item.zplInvoice}
                        </span>
                      ) : (
                        <span className="italic text-muted-foreground text-[11px] block">
                          N/A
                        </span>
                      )}
                    </div>

                    {/* Seller SKU */}
                    <div className="rounded-lg bg-muted/40 p-2 space-y-0.5">
                      <span className="text-[10px] font-medium text-muted-foreground block uppercase tracking-wider">
                        Seller SKU
                      </span>
                      {renderItemListCell(item.sellerSku)}
                    </div>

                    {/* ASIN */}
                    <div className="rounded-lg bg-muted/40 p-2 space-y-0.5">
                      <span className="text-[10px] font-medium text-muted-foreground block uppercase tracking-wider">
                        ASIN
                      </span>
                      {renderItemListCell(item.asin)}
                    </div>

                    {/* AWB Tracking */}
                    <div className="rounded-lg bg-muted/40 p-2 space-y-0.5">
                      <span className="text-[10px] font-medium text-muted-foreground block uppercase tracking-wider">
                        AWB Tracking
                      </span>
                      <span className="font-medium text-foreground truncate block">
                        {item.awb || "N/A"}
                      </span>
                    </div>

                    {/* Customer */}
                    <div className="col-span-2 rounded-lg bg-muted/40 p-2 space-y-0.5">
                      <span className="text-[10px] font-medium text-muted-foreground block uppercase tracking-wider">
                        Customer
                      </span>
                      <span className="font-semibold text-foreground truncate block">
                        {cleanCustomerName(item.customer) || "N/A"}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* =================================================== */}
          {/* DESKTOP VIEW: FULL COMPARISON TABLE (>= 768px) */}
          {/* =================================================== */}
          <div className="hidden md:block w-full overflow-hidden border border-border bg-card shadow-2xs">
            <div className="w-full overflow-x-auto">
              <table className="w-full min-w-[1100px] border-collapse text-left">
                <thead className="bg-[#0A0E1A] text-xs sm:text-sm text-[#E8C16D]">
                  <tr className="border-b border-border">
                    <th className="w-12 min-w-[48px] px-3 py-3.5 text-center whitespace-nowrap">
                      <div className="flex items-center justify-center">
                        <Checkbox
                          checked={allPageSelected}
                          onCheckedChange={toggleAllPage}
                        />
                      </div>
                    </th>
                    <th className="w-44 min-w-[160px] px-4 py-3.5 text-center font-semibold whitespace-nowrap">Invoices</th>
                    <th className="w-52 min-w-[190px] px-4 py-3.5 text-center font-semibold whitespace-nowrap">Amazon Order ID</th>
                    <th className="w-44 min-w-[160px] px-4 py-3.5 text-center font-semibold whitespace-nowrap">AWB Tracking</th>
                    <th className="w-36 min-w-[140px] px-4 py-3.5 text-center font-semibold whitespace-nowrap">ASIN</th>
                    <th className="w-44 min-w-[170px] px-4 py-3.5 text-center font-semibold whitespace-nowrap">Seller SKU</th>
                    <th className="w-44 min-w-[160px] px-4 py-3.5 text-center font-semibold whitespace-nowrap">Customer</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border text-xs sm:text-sm">
                  {paginatedResults.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-muted-foreground">
                        <div className="flex flex-col items-center justify-center gap-2">
                          <CheckCircle2 className="h-8 w-8 text-emerald-500" />
                          <p className="font-semibold text-foreground">
                            {printedRows.size > 0 && !showPrinted
                              ? `All matched orders in this view have been printed! (${printedRows.size} printed)`
                              : "No orders match your current search."}
                          </p>
                          {printedRows.size > 0 && !showPrinted && (
                            <button
                              type="button"
                              onClick={() => setShowPrinted(true)}
                              className="text-xs font-semibold text-[#B88728] underline underline-offset-4 hover:opacity-80 cursor-pointer"
                            >
                              Click here to view printed orders ({printedRows.size})
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ) : (
                    paginatedResults.map((item) => (
                      <tr
                        key={item.index}
                        className="transition hover:bg-muted/30"
                      >
                        <td className="w-12 min-w-[48px] px-3 py-3 text-center whitespace-nowrap">
                          <div className="flex items-center justify-center">
                            <Checkbox
                              checked={selectedRows.has(item.index)}
                              onCheckedChange={(checked) =>
                                handleSelectRow(item.index, Boolean(checked))
                              }
                            />
                          </div>
                        </td>
                        <td className="w-44 min-w-[160px] px-4 py-3 text-center font-medium whitespace-nowrap">
                          {item.isMatch ? (
                            item.pdfInvoice && item.pdfInvoice !== "Not Found in PDF" ? (
                              item.pdfInvoice
                            ) : item.zplInvoice &&
                              item.zplInvoice !== "Not Found in ZPL" &&
                              item.zplInvoice !== "N/A" ? (
                              item.zplInvoice
                            ) : (
                              <span className="italic text-muted-foreground">N/A</span>
                            )
                          ) : item.zplInvoice === "Not Found in ZPL" ? (
                            <div className="flex flex-col items-center gap-1">
                              <span className="font-semibold">{item.pdfInvoice || "N/A"}</span>
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300">
                                Missing in ZPL
                              </span>
                            </div>
                          ) : (
                            <div className="flex flex-col items-center gap-1">
                              <span className="font-semibold">{item.zplInvoice || "N/A"}</span>
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300">
                                Missing in PDF
                              </span>
                            </div>
                          )}
                        </td>
                        <td className="w-52 min-w-[190px] px-4 py-3 text-center font-medium whitespace-nowrap">
                          <div className="flex items-center justify-center gap-1.5">
                            <span>{item.orderNumber}</span>
                            {printedRows.has(item.index) && (
                              <span className="inline-flex items-center gap-1 rounded-md bg-blue-500/10 px-2 py-0.5 text-[10px] font-bold text-blue-600 dark:text-blue-400">
                                <CheckCircle2 className="h-3 w-3" /> Printed
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="w-44 min-w-[160px] px-4 py-3 text-center font-medium whitespace-nowrap">
                          {item.awb}
                        </td>
                        <td className="w-36 min-w-[140px] px-4 py-3 text-center font-medium whitespace-nowrap">
                          {renderItemListCell(item.asin)}
                        </td>
                        <td className="w-44 min-w-[170px] px-4 py-3 text-center font-medium whitespace-nowrap">
                          {renderItemListCell(item.sellerSku)}
                        </td>
                        <td className="w-44 min-w-[160px] px-4 py-3 text-center font-medium whitespace-nowrap">
                          {cleanCustomerName(item.customer)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* =================================================== */}
          {/* PAGINATION */}
          {/* =================================================== */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border border-border bg-[#0A0E1A] px-4 sm:px-6 py-4">
            {/* Left */}
            <div className="text-xs sm:text-sm text-white text-center sm:text-left">
              Showing{" "}
              <span className="font-semibold text-white">
                {totalRecords === 0 ? 0 : startIndex + 1}
              </span>
              {" - "}
              <span className="font-semibold text-white">{endIndex}</span>
              {" of "}
              <span className="font-semibold text-white">{totalRecords}</span>{" "}
              records
            </div>

            {/* Right */}
            <div className="flex flex-wrap items-center justify-center sm:justify-end gap-2 sm:gap-3">
              {/* Rows */}
              <div className="flex items-center gap-1.5">
                <span className="whitespace-nowrap text-xs sm:text-sm text-white">Rows</span>

                <select
                  value={limit}
                  onChange={(e) => {
                    setLimit(Number(e.target.value));
                    setPage(1);
                  }}
                  className="h-8 sm:h-9 border border-border bg-background px-2 font-medium text-xs sm:text-sm text-foreground outline-none transition-colors focus:border-primary"
                >
                  {[10, 20, 25, 30, 50, 100].map((size) => (
                    <option key={size} value={size}>
                      {size}
                    </option>
                  ))}
                </select>
              </div>

              {/* Previous */}
              <Button
                variant="outline"
                size="sm"
                fullWidth={false}
                disabled={currentPage <= 1}
                onClick={() => setPage(currentPage - 1)}
                className="h-8 sm:h-9 px-3 border-[#E8C16D] bg-[#E8C16D] text-xs font-semibold text-[#0A0E1A] hover:bg-[#E8C16D]"
              >
                <ChevronLeft className="mr-0.5 h-3.5 w-3.5" />
                Prev
              </Button>

              {/* Page Indicator */}
              <div className="flex h-8 sm:h-9 min-w-[65px] items-center justify-center border border-border bg-muted px-2.5 text-xs font-semibold text-foreground">
                {currentPage} / {totalPages}
              </div>

              {/* Next */}
              <Button
                variant="outline"
                size="sm"
                fullWidth={false}
                disabled={currentPage >= totalPages}
                onClick={() => setPage(currentPage + 1)}
                className="h-8 sm:h-9 px-3 border-[#E8C16D] bg-[#E8C16D] text-xs font-semibold text-[#0A0E1A] hover:bg-[#E8C16D]"
              >
                Next
                <ChevronRight className="ml-0.5 h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 2: PDF VIEWER (COMBINED / CONVERTED ZPL / ORIGINAL UPLOADED) */}
      {/* ======================================================== */}
      {activeTab === "pdf" && (
        <div className="space-y-4 border border-border bg-card p-4 sm:p-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="text-base sm:text-lg font-bold text-foreground flex items-center gap-2">
                {selectedPdfType.startsWith("unmatched") ? (
                  <AlertTriangle className="h-5 w-5 text-red-500" />
                ) : (
                  <FileText className="h-5 w-5 text-[#E8C16D]" />
                )}
                {currentPdfConfig.title}
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                {currentPdfConfig.description}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              {selectedPdfType.startsWith("unmatched") && (
                <div className="w-56 sm:w-64">
                  <ReactSelect
                    options={unmatchedPdfOptions}
                    value={
                      unmatchedPdfOptions.find((opt) => opt.value === selectedPdfType) ??
                      unmatchedPdfOptions[0]
                    }
                    onChange={(opt) => {
                      if (opt?.value) {
                        setSelectedPdfType(opt.value as AmazonPdfViewType);
                      }
                    }}
                    height={44}
                    borderColor="#E8C16D"
                    backgroundColor="#0A0E1A"
                    textColor="#E8C16D"
                    placeholderColor="#E8C16D"
                    menuBackgroundColor="#0A0E1A"
                    optionHoverColor="#161D2E"
                    optionSelectedColor="#E8C16D"
                    optionSelectedTextColor="#0A0E1A"
                  />
                </div>
              )}

              <Button
                type="button"
                onClick={currentPdfConfig.onDownload}
                leftIcon={<Download className="h-4 w-4" />}
                className="w-full sm:w-auto border-[#E8C16D] bg-[#E8C16D] text-xs sm:text-sm font-semibold text-[#0A0E1A] hover:bg-[#0A0E1A] hover:text-[#E8C16D]"
              >
                {currentPdfConfig.downloadText}
              </Button>
            </div>
          </div>

          {currentPdfConfig.url ? (
            <div className="h-[480px] sm:h-[650px] lg:h-[750px] w-full overflow-hidden border border-border bg-[#0A0E1A]">
              <iframe
                src={`${currentPdfConfig.url}#toolbar=1&navpanes=1&statusbar=1`}
                className="h-full w-full border-none"
                title={currentPdfConfig.title}
              />
            </div>
          ) : (
            <div className="py-16 text-center text-xs sm:text-sm text-muted-foreground">
              {currentPdfConfig.unavailableText}
            </div>
          )}
        </div>
      )}

      {/* Missing Seller SKU Modal */}
      <MissingSkuModal
        isOpen={isMissingSkuModalOpen}
        onClose={() => setIsMissingSkuModalOpen(false)}
        missingAsins={modalMissingAsins}
        onRefreshMappings={fetchAsinMappings}
        onReset={handleReset}
      />
    </div>
  );
}