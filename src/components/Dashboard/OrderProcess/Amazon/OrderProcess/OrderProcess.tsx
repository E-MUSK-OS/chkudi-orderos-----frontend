"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  UploadCloud,
  FileText,
  Barcode,
  CheckCircle2,
  AlertCircle,
  Trash2,
  ArrowRight,
  FileCheck,
  RotateCcw,
  Info,
  ExternalLink,
  Plus,
} from "lucide-react";
import { toast } from "sonner";
import DashboardLayout from "@/components/Dashboard/layout/DashboardLayout";
import Button from "@/components/ui/Button";
import ProcessingProgressModal from "./components/ProcessingProgressModal";
import ComparisonResultView from "./components/ComparisonResultView";
import { useAmazonOrderStore } from "./store/useAmazonOrderStore";
import { AmazonProcessResponse, AmazonComparisonResult } from "./types";
import {
  enhanceInvoicePages,
  mapAsinToSellerSku,
  loadAsinToSkuMap,
  drawSkuOnLabelPage,
  isAmazonTransporterOrFeePage,
  isTransporterDuplicatePage,
  addInvoicePagesToDoc,
} from "./utils";
import { setCachedAmazonDocs, getDocCacheKey, clearCachedAmazonDocs, startBackgroundOrderPdfPrewarming } from "./utils/pdfCache";
import AmazonProcessHistoryDropdown from "./components/AmazonProcessHistoryDropdown";
import { amazonOrderService } from "./services/amazonOrder.service";
import { parseZplLabels, compareOrdersLocally } from "./utils/clientMatcher";

export default function OrderProcess() {
  const router = useRouter();
  const [pdfFiles, setPdfFiles] = useState<File[]>([]);
  const [zplFiles, setZplFiles] = useState<File[]>([]);

  const [pdfError, setPdfError] = useState<string | null>(null);
  const [zplError, setZplError] = useState<string | null>(null);

  const [isDraggingPdf, setIsDraggingPdf] = useState(false);
  const [isDraggingZpl, setIsDraggingZpl] = useState(false);

  const pdfInputRef = useRef<HTMLInputElement>(null);
  const zplInputRef = useRef<HTMLInputElement>(null);

  const {
    isProcessing,
    progress,
    currentStage,
    summary,
    restoreProcessData,
    setProcessing,
    setProgress,
    setProcessData,
    clearProcessData,
    historySyncStatus,
  } = useAmazonOrderStore();

  // Guard against accidental tab closure during active processing
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isProcessing || historySyncStatus === "syncing") {
        e.preventDefault();
        e.returnValue = "Order processing is currently in progress. Are you sure you want to leave?";
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [isProcessing, historySyncStatus]);

  // Prefetch result page bundle ahead of time for instantaneous route transition
  useEffect(() => {
    router.prefetch("/dashboard/order-process/amazon/order-process/result");
    return () => {
      setProcessing(false);
    };
  }, [router, setProcessing]);

  // If an active batch already exists (or is restored from storage), redirect to results!
  useEffect(() => {
    if (isProcessing) return;
    if (summary) {
      router.push("/dashboard/order-process/amazon/order-process/result");
      return;
    }
    restoreProcessData().then((hasBatch) => {
      if (hasBatch) {
        router.push("/dashboard/order-process/amazon/order-process/result");
      }
    });
  }, [summary, isProcessing, restoreProcessData, router]);

  // Helper to format file sizes
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  // Validate and handle multiple PDF files
  const handlePdfSelection = (selectedFiles: FileList | File[]) => {
    const validPdfs: File[] = [];
    const invalidNames: string[] = [];

    Array.from(selectedFiles).forEach((file) => {
      const isPdf =
        file.name.toLowerCase().endsWith(".pdf") ||
        file.type === "application/pdf";

      if (isPdf) {
        validPdfs.push(file);
      } else {
        invalidNames.push(file.name);
      }
    });

    if (invalidNames.length > 0) {
      toast.error(`Ignored ${invalidNames.length} non-PDF file(s). Only .pdf files are accepted.`);
    }

    if (validPdfs.length > 0) {
      setPdfFiles((prev) => {
        const existingKeys = new Set(prev.map((f) => `${f.name}_${f.size}`));
        const newUnique = validPdfs.filter((f) => !existingKeys.has(`${f.name}_${f.size}`));
        if (newUnique.length < validPdfs.length) {
          toast.info("Duplicate PDF file(s) were skipped.");
        }
        return [...prev, ...newUnique];
      });
      setPdfError(null);
      toast.success(`Added ${validPdfs.length} PDF file(s).`);
    }
  };

  // Validate and handle multiple ZPL files
  const handleZplSelection = (selectedFiles: FileList | File[]) => {
    const validZpls: File[] = [];
    const invalidNames: string[] = [];

    Array.from(selectedFiles).forEach((file) => {
      const lower = file.name.toLowerCase();
      const isZpl = lower.endsWith(".zpl");

      if (isZpl) {
        validZpls.push(file);
      } else {
        invalidNames.push(file.name);
      }
    });

    if (invalidNames.length > 0) {
      toast.error(`Ignored ${invalidNames.length} non-ZPL file(s).`);
    }

    if (validZpls.length > 0) {
      setZplFiles((prev) => {
        const existingKeys = new Set(prev.map((f) => `${f.name}_${f.size}`));
        const newUnique = validZpls.filter((f) => !existingKeys.has(`${f.name}_${f.size}`));
        if (newUnique.length < validZpls.length) {
          toast.info("Duplicate ZPL file(s) were skipped.");
        }
        return [...prev, ...newUnique];
      });
      setZplError(null);
      toast.success(`Added ${validZpls.length} ZPL file(s).`);
    }
  };

  // Drag & drop handlers for PDF
  const handlePdfDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingPdf(true);
  };

  const handlePdfDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingPdf(false);
  };

  const handlePdfDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingPdf(false);
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      handlePdfSelection(files);
    }
  };

  // Drag & drop handlers for ZPL
  const handleZplDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingZpl(true);
  };

  const handleZplDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingZpl(false);
  };

  const handleZplDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingZpl(false);
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      handleZplSelection(files);
    }
  };

  // Remove individual files
  const handleRemoveSinglePdf = (index: number) => {
    setPdfFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleRemoveAllPdfs = () => {
    setPdfFiles([]);
    setPdfError(null);
    if (pdfInputRef.current) {
      pdfInputRef.current.value = "";
    }
  };

  const handleRemoveSingleZpl = (index: number) => {
    setZplFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleRemoveAllZpls = () => {
    setZplFiles([]);
    setZplError(null);
    if (zplInputRef.current) {
      zplInputRef.current.value = "";
    }
  };

  // Reset all
  const handleResetAll = () => {
    handleRemoveAllPdfs();
    handleRemoveAllZpls();
    clearProcessData();
    clearCachedAmazonDocs();
    toast.info("Upload form cleared.");
  };

  // Check if both file types have at least one file
  const isReadyToSubmit = pdfFiles.length > 0 && zplFiles.length > 0;
  const uploadedCount = (pdfFiles.length > 0 ? 1 : 0) + (zplFiles.length > 0 ? 1 : 0);
  const totalPdfSize = pdfFiles.reduce((sum, f) => sum + f.size, 0);
  const totalZplSize = zplFiles.reduce((sum, f) => sum + f.size, 0);

  // Submit & Real-Time Processing Handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (pdfFiles.length === 0 || zplFiles.length === 0) {
      toast.error("Please upload at least one PDF file and one ZPL file before submitting.");
      return;
    }

    clearCachedAmazonDocs();
    setProcessing(true);
    useAmazonOrderStore.setState({ activeHistoryBatchId: null, initialShowPrinted: false });
    if (typeof window !== "undefined") {
      try {
        sessionStorage.removeItem("amazon_show_printed_active");
        localStorage.removeItem("amazon_active_history_batch_id_v1");
      } catch (e) {}
    }

    let currentPct = 1;
    let targetCeiling = 20;

    setProgress(currentPct, `1. Reading & Preparing ${pdfFiles.length} PDF(s)...`);

    // Smooth real-time progress interval: strictly ticks forward from 1 to 100
    const progressInterval = setInterval(() => {
      if (currentPct < targetCeiling) {
        currentPct += 1;
        setProgress(currentPct);
      }
    }, 40);

    try {
      // Helper to safely convert File or Blob to Base64 without touching detached ArrayBuffers
      const fileToBase64 = (file: File | Blob): Promise<string> => {
        return new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => {
            const result = reader.result as string;
            const base64 = result.includes(",") ? result.split(",")[1] : result;
            resolve(base64 || "");
          };
          reader.onerror = (err) => reject(err);
          reader.readAsDataURL(file);
        });
      };

      // ----------------------------------------------------------------------
      // 1. CLIENT PIPELINE: Parse ZPL text into labels
      // ----------------------------------------------------------------------
      const zplTexts = await Promise.all(zplFiles.map((f) => f.text()));
      const combinedZplText = zplTexts.join("\n");
      const combinedZplFile = new File([combinedZplText], zplFiles[0]?.name || "combined.zpl", {
        type: "text/plain",
      });

      const zplLabels = parseZplLabels(combinedZplText);
      if (zplLabels.length === 0) {
        throw new Error("No valid ZPL label definitions found in the uploaded ZPL file(s).");
      }

      const { PDFDocument } = await import("pdf-lib");

      // ----------------------------------------------------------------------
      // 2. TRUE PARALLEL PIPELINE: Run ZPL Conversion AND PDF Text Extraction Simultaneously!
      // Chunk size 30 labels + Concurrency 3 = Blazing fast speeds while 95% under 4.5MB limit
      // ----------------------------------------------------------------------
      const CHUNK_SIZE = 30;
      const zplChunks: { index: number; rawZplText: string }[] = [];
      for (let i = 0; i < zplLabels.length; i += CHUNK_SIZE) {
        const slice = zplLabels.slice(i, i + CHUNK_SIZE);
        zplChunks.push({
          index: i,
          rawZplText: slice.map((l) => l.rawZpl).join("\n"),
        });
      }

      const convertChunkWithRetry = async (chunkText: string, maxRetries = 5): Promise<Uint8Array> => {
        for (let attempt = 1; attempt <= maxRetries; attempt++) {
          try {
            const userToken =
              typeof window !== "undefined"
                ? localStorage.getItem("accessToken") || ""
                : "";
            const res = await fetch("/api/amazon/process-orders", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                ...(userToken ? { Authorization: `Bearer ${userToken}` } : {}),
              },
              body: JSON.stringify({
                action: "convert-zpl-chunk",
                zplChunk: chunkText,
              }),
            });

            if (res.ok) {
              const arrayBuf = await res.arrayBuffer();
              return new Uint8Array(arrayBuf);
            }

            if (res.status === 429 && attempt < maxRetries) {
              const retryAfterHeader = res.headers.get("Retry-After");
              const parsedHeader = retryAfterHeader ? parseInt(retryAfterHeader, 10) * 1000 : 0;
              const expWait = Math.min(12000, Math.pow(2, attempt) * 1000 + Math.floor(Math.random() * 600));
              const waitMs = parsedHeader > 0 ? parsedHeader : expWait;
              console.warn(`[ZPL Chunk Rate Limit 429] Backing off chunk conversion for ${waitMs}ms (Attempt ${attempt}/${maxRetries})...`);
              await new Promise((r) => setTimeout(r, waitMs));
              continue;
            }

            const errText = await res.text();
            throw new Error(
              res.status === 413
                ? "ZPL chunk exceeded server limit."
                : `ZPL conversion error (${res.status}): ${errText.slice(0, 150)}`
            );
          } catch (err: any) {
            if (attempt === maxRetries) throw err;
            const fallbackWait = Math.min(8000, attempt * 1200 + Math.floor(Math.random() * 400));
            await new Promise((r) => setTimeout(r, fallbackWait));
          }
        }
        throw new Error("Failed to convert ZPL chunk after retries.");
      };

      // Background Pipeline 1: Parallel ZPL Micro-Chunk Conversion
      const zplConversionPromise = (async () => {
        const CONCURRENCY = 3;
        let completedChunks = 0;
        const chunkPdfResults: Uint8Array[] = new Array(zplChunks.length);

        for (let i = 0; i < zplChunks.length; i += CONCURRENCY) {
          const batch = zplChunks.slice(i, i + CONCURRENCY);
          await Promise.all(
            batch.map(async (c, batchOffset) => {
              const chunkIndex = i + batchOffset;
              const pdfBytes = await convertChunkWithRetry(c.rawZplText);
              chunkPdfResults[chunkIndex] = pdfBytes;
              completedChunks++;
              const pctVal = Math.round(20 + (completedChunks / zplChunks.length) * 50);
              currentPct = Math.max(currentPct, pctVal);
              setProgress(
                currentPct,
                `Converting Barcode Labels (${Math.min(completedChunks * CHUNK_SIZE, zplLabels.length)}/${zplLabels.length})...`
              );
            })
          );
        }

        const mergedZplDoc = await PDFDocument.create();
        for (const pdfBytes of chunkPdfResults) {
          if (pdfBytes) {
            const chunkDoc = await PDFDocument.load(pdfBytes, { ignoreEncryption: true });
            const pages = await mergedZplDoc.copyPages(chunkDoc, chunkDoc.getPageIndices());
            pages.forEach((p) => mergedZplDoc.addPage(p));
          }
        }
        const mergedZplBytes = await mergedZplDoc.save({ useObjectStreams: true });
        return {
          mergedZplDoc,
          convertedZplPdfBase64: Buffer.from(mergedZplBytes).toString("base64"),
          mergedZplBytes,
        };
      })();

      // Background Pipeline 2: Concurrent PDF Merging & Text Extraction
      const pdfExtractionPromise = (async () => {
        let mergedPdfBytes: Uint8Array;
        if (pdfFiles.length === 1) {
          mergedPdfBytes = new Uint8Array(await pdfFiles[0].arrayBuffer());
          currentPct = Math.max(currentPct, 15);
          setProgress(currentPct, "1. Validated & Prepared PDF File");
        } else {
          const mergedDoc = await PDFDocument.create();
          for (let i = 0; i < pdfFiles.length; i++) {
            const fileBuf = await pdfFiles[i].arrayBuffer();
            const doc = await PDFDocument.load(fileBuf, { ignoreEncryption: true });
            const pages = await mergedDoc.copyPages(doc, doc.getPageIndices());
            pages.forEach((p) => mergedDoc.addPage(p));
          }
          mergedPdfBytes = await mergedDoc.save({ useObjectStreams: true });
          currentPct = Math.max(currentPct, 18);
          setProgress(currentPct, "1. Merged All PDF Files");
        }

        const pdfjs = await import("pdfjs-dist");
        if (!pdfjs.GlobalWorkerOptions.workerSrc) {
          const version = pdfjs.version || "6.3.289";
          pdfjs.GlobalWorkerOptions.workerSrc = `https://cdn.jsdelivr.net/npm/pdfjs-dist@${version}/build/pdf.worker.min.mjs`;
        }

        const loadingTask = pdfjs.getDocument({ data: new Uint8Array(mergedPdfBytes) });
        const pdf = await loadingTask.promise;

        const pageIndices = Array.from({ length: pdf.numPages }, (_, i) => i + 1);
        const pageTextData: Array<{ text: string; items: any[] }> = new Array(pdf.numPages);

        const BATCH_SIZE = 15;
        for (let b = 0; b < pageIndices.length; b += BATCH_SIZE) {
          const batch = pageIndices.slice(b, b + BATCH_SIZE);
          await Promise.all(
            batch.map(async (pageNum) => {
              const page = await pdf.getPage(pageNum);
              const textContent = await page.getTextContent();
              let pageText = "";
              for (const item of textContent.items as any[]) {
                pageText += (item.str || "") + (item.hasEOL ? "\n" : " ");
              }
              pageTextData[pageNum - 1] = {
                text: pageText,
                items: textContent.items,
              };
            })
          );
          const totalPages = Math.max(pdf.numPages || 1, 1);
          const stepPct = Math.round(18 + ((b + batch.length) / totalPages) * 35);
          currentPct = Math.max(currentPct, stepPct);
          setProgress(
            currentPct,
            `2. Extracted Invoices (${Math.min(b + batch.length, totalPages)}/${totalPages})...`
          );
        }

        return {
          mergedPdfBytes,
          pageTextData,
          pdfTextArray: pageTextData.map((d) => d.text),
        };
      })();

      // Join point: Wait for BOTH parallel pipelines to complete
      const [{ mergedZplDoc, convertedZplPdfBase64, mergedZplBytes }, { mergedPdfBytes, pageTextData, pdfTextArray }] =
        await Promise.all([zplConversionPromise, pdfExtractionPromise]);

      // ----------------------------------------------------------------------
      // 3. Ultra-Fast In-Memory Cross-Verification (Runs in ~15ms!)
      // ----------------------------------------------------------------------
      targetCeiling = 85;
      currentPct = Math.max(currentPct, 78);
      setProgress(currentPct, "3. Cross-Verifying Orders & Matching Invoices...");

      const processResponse = compareOrdersLocally(zplLabels, pdfTextArray, combinedZplFile.name);
      processResponse.files = {
        convertedZplPdfBase64,
        combinedPdfBase64: "",
        originalPdfBase64: "",
      };

      // Resolve Seller SKU mapping from AsinImport, Products, and Variants table
      let asinToSkuMap = new Map<string, string>();
      try {
        const token = typeof window !== "undefined" ? localStorage.getItem("accessToken") ?? "" : "";
        asinToSkuMap = await loadAsinToSkuMap(token);
      } catch (err) {
        console.warn("Could not resolve ASIN to Seller SKU in OrderProcess:", err);
      }

      if (processResponse.results) {
        processResponse.results = processResponse.results.map((item: AmazonComparisonResult) => ({
          ...item,
          pdfPages: (item.pdfPages || []).filter(
            (p) => !pageTextData[p - 1]?.text || !isAmazonTransporterOrFeePage(pageTextData[p - 1].text)
          ),
          sellerSku: mapAsinToSellerSku(item.asin, asinToSkuMap, item.sellerSku),
        }));
      }

      // 5. Enhance invoice pages in-memory & generate dispatch documents (Instant in-memory execution)
      targetCeiling = 95;
      currentPct = Math.max(currentPct, 80);
      setProgress(currentPct, "4. Enhancing Invoice Table Readability...");

      // Load original document once directly
      const origDoc = await PDFDocument.load(mergedPdfBytes);

      try {
        await enhanceInvoicePages(origDoc, pageTextData);
      } catch (enhErr) {
        console.warn("Could not enhance invoice table clarity:", enhErr);
      }

      currentPct = Math.max(currentPct, 88);
      setProgress(currentPct, "5. Generating Matched Dispatch PDF...");

      let combinedPromise: Promise<Uint8Array> | null = null;
      let unmatchedPdfPromise: Promise<Uint8Array> | null = null;
      let unmatchedZplPromise: Promise<Uint8Array> | null = null;
      let combinedDocInstance: any = null;
      let zplDocInstance: any = null;
      let unmatchedPdfPageCount = 0;
      let unmatchedZplPageCount = 0;

      if (mergedZplDoc) {
        try {
          const zplDoc = mergedZplDoc;
          const combinedDoc = await PDFDocument.create();
          zplDocInstance = zplDoc;
          combinedDocInstance = combinedDoc;
          const unmatchedPdfDoc = await PDFDocument.create();
          const unmatchedZplDoc = await PDFDocument.create();
          let hasUnmatchedPdf = false;
          let hasUnmatchedZpl = false;

          const TARGET_WIDTH = 4 * 72; // 288 pt
          const TARGET_HEIGHT = 6 * 72; // 432 pt
          const MARGIN = 6;
          const AVAIL_WIDTH = TARGET_WIDTH - 2 * MARGIN;
          const AVAIL_HEIGHT = TARGET_HEIGHT - 2 * MARGIN;

          const addScaledPageToDoc = async (
            targetDoc: any,
            srcPage: any,
            isZpl = false,
            sellerSku?: string,
            totalQuantity?: number
          ) => {
            const embedded = await targetDoc.embedPage(srcPage);
            const { width: srcW, height: srcH } = embedded;

            if (isZpl) {
              // Equalize top and bottom whitespace so barcode at top and SKU at bottom have equal margins
              const TOP_SPACING = 8;
              const BOTTOM_SPACING = 20;
              const SIDE_SPACING = 8;
              const availW = TARGET_WIDTH - 2 * SIDE_SPACING;
              const availH = TARGET_HEIGHT - TOP_SPACING - BOTTOM_SPACING;

              const scale = Math.min(availW / srcW, availH / srcH);
              const finalW = srcW * scale;
              const finalH = srcH * scale;

              const x = (TARGET_WIDTH - finalW) / 2;
              const y = TARGET_HEIGHT - TOP_SPACING - finalH;

              const newPage = targetDoc.addPage([TARGET_WIDTH, TARGET_HEIGHT]);
              newPage.drawPage(embedded, { x, y, width: finalW, height: finalH });

              if (sellerSku) {
                await drawSkuOnLabelPage(targetDoc, newPage, sellerSku, x, y, finalW, finalH, totalQuantity);
              }
            } else {
              const availW = TARGET_WIDTH - 2 * MARGIN;
              const availH = TARGET_HEIGHT - 2 * MARGIN;

              const scale = Math.min(availW / srcW, availH / srcH);
              const finalW = srcW * scale;
              const finalH = srcH * scale;

              const x = (TARGET_WIDTH - finalW) / 2;
              const y = (TARGET_HEIGHT - finalH) / 2;

              const newPage = targetDoc.addPage([TARGET_WIDTH, TARGET_HEIGHT]);
              newPage.drawPage(embedded, { x, y, width: finalW, height: finalH });
            }
          };

          for (const item of processResponse.results) {
            const itemCount = Math.max(
              item.asinsCount || 0,
              item.totalQuantity || 0,
              item.asin ? new Set(item.asin.split(/[\r\n]+|\s+\/\s+/).filter(Boolean)).size : 0,
              1
            );

            if (item.isMatch) {
              const startPage = combinedDoc.getPageCount();

              // USER REQUIREMENT:
              // "this type of page not goes inside matched combined pdf but it goes into unmatched pdf
              //  and only for more than 4+ order and needed then page 2 came other than that no need of page 2"
              if (item.pdfPages && item.pdfPages.length > 0) {
                // Separate fee pages just in case they snuck into the item's pages
                const validPages = item.pdfPages.filter((p) => {
                  const txt = pageTextData[p - 1]?.text || "";
                  return !isAmazonTransporterOrFeePage(txt);
                });

                const feePages = item.pdfPages.filter((p) => {
                  const txt = pageTextData[p - 1]?.text || "";
                  return isAmazonTransporterOrFeePage(txt);
                });

                let lastNeededIndex = 0;
                for (let i = 0; i < validPages.length; i++) {
                  const txt = pageTextData[validPages[i] - 1]?.text || "";
                  // The end of an Amazon invoice always contains the grand total and signature
                  if (
                    txt.includes("Authorized Signatory") ||
                    txt.toLowerCase().includes("amount in words") ||
                    /\bTOTAL\s*(?::|₹|$)/i.test(txt) ||
                    /\bGrand Total\b/i.test(txt)
                  ) {
                    lastNeededIndex = i;
                    break; // Stop at the FIRST footer we find, ignoring duplicate copies that follow
                  }
                }

                const pagesToKeep = Math.max(lastNeededIndex + 1, 1);
                let matchedPages = validPages.slice(0, pagesToKeep);
                let unneededPages = [...feePages];
                
                if (validPages.length > pagesToKeep) {
                  unneededPages.push(...validPages.slice(pagesToKeep));
                }

                if (matchedPages.length > 0) {
                  await addInvoicePagesToDoc(
                    combinedDoc,
                    origDoc,
                    matchedPages,
                    pageTextData,
                    { totalAmount: item.amount, itemCount }
                  );
                }

                // Any excluded transporter or unneeded pages for this matched order go into unmatched PDF!
                if (unneededPages.length > 0) {
                  const added = await addInvoicePagesToDoc(
                    unmatchedPdfDoc,
                    origDoc,
                    unneededPages,
                    pageTextData,
                    { totalAmount: item.amount, itemCount, allowTransporter: true }
                  );
                  if (added) {
                    hasUnmatchedPdf = true;
                  }
                }
              }

              // 2. ZPL barcode label second (EXACTLY ONE 4" x 6" page)
              if (item.zplPage > 0 && item.zplPage <= zplDoc.getPageCount()) {
                await addScaledPageToDoc(combinedDoc, zplDoc.getPage(item.zplPage - 1), true, item.sellerSku, item.totalQuantity);
              }
              const endPage = combinedDoc.getPageCount();
              item.combinedPages = Array.from({ length: endPage - startPage }, (_, i) => startPage + i);
            } else {
              // Unmatched documents
              // 1. Unmatched PDF invoices (Missing in ZPL)
              if (item.pdfPages && item.pdfPages.length > 0) {
                const added = await addInvoicePagesToDoc(
                  unmatchedPdfDoc,
                  origDoc,
                  item.pdfPages,
                  pageTextData,
                  { totalAmount: item.amount, itemCount, allowTransporter: true }
                );
                if (added) {
                  hasUnmatchedPdf = true;
                }
              }
              // 2. Unmatched ZPL labels (Missing in PDF)
              if (item.zplPage > 0 && item.zplPage <= zplDoc.getPageCount()) {
                await addScaledPageToDoc(unmatchedZplDoc, zplDoc.getPage(item.zplPage - 1), true, item.sellerSku);
                hasUnmatchedZpl = true;
              }
            }
          }

          combinedPromise = combinedDoc.save({ useObjectStreams: true });
          if (hasUnmatchedPdf) {
            unmatchedPdfPageCount = unmatchedPdfDoc.getPageCount();
            unmatchedPdfPromise = unmatchedPdfDoc.save({ useObjectStreams: true });
          }
          if (hasUnmatchedZpl) {
            unmatchedZplPageCount = unmatchedZplDoc.getPageCount();
            unmatchedZplPromise = unmatchedZplDoc.save({ useObjectStreams: true });
          }
        } catch (genErr) {
          console.warn("Could not generate combined preview PDF client-side:", genErr);
        }
      }

      // Save documents concurrently in parallel with object stream compression
      const [enhancedBytes, combinedBytes, unmatchedPdfBytes, unmatchedZplBytes] = await Promise.all([
        origDoc.save({ useObjectStreams: true }),
        combinedPromise ? combinedPromise : Promise.resolve(null),
        unmatchedPdfPromise ? unmatchedPdfPromise : Promise.resolve(null),
        unmatchedZplPromise ? unmatchedZplPromise : Promise.resolve(null),
      ]);

      // Fast native Buffer base64 conversion (~15ms instead of 3000ms FileReader lockup)
      const uint8ToBase64 = (bytes: Uint8Array | null): string => {
        if (!bytes) return "";
        try {
          return Buffer.from(bytes).toString("base64");
        } catch {
          let binary = "";
          const len = bytes.byteLength;
          for (let i = 0; i < len; i++) {
            binary += String.fromCharCode(bytes[i]);
          }
          return btoa(binary);
        }
      };

      const originalPdfBase64 = uint8ToBase64(enhancedBytes);
      const combinedPdfBase64 = combinedBytes ? uint8ToBase64(combinedBytes) : "";
      const unmatchedPdfBase64 = unmatchedPdfBytes ? uint8ToBase64(unmatchedPdfBytes) : "";
      const unmatchedZplBase64 = unmatchedZplBytes ? uint8ToBase64(unmatchedZplBytes) : "";

      if (!processResponse.files) {
        processResponse.files = {
          convertedZplPdfBase64: "",
          combinedPdfBase64: "",
          originalPdfBase64: "",
          unmatchedPdfBase64: "",
          unmatchedZplBase64: "",
        };
      }
      processResponse.files.originalPdfBase64 = originalPdfBase64;
      processResponse.files.combinedPdfBase64 = combinedPdfBase64;
      processResponse.files.unmatchedPdfBase64 = unmatchedPdfBase64;
      processResponse.files.unmatchedZplBase64 = unmatchedZplBase64;

      if (processResponse.summary) {
        processResponse.summary.pdfFileName =
          pdfFiles.length === 1 ? pdfFiles[0].name : `${pdfFiles.length}_PDF_Invoices_Merged.pdf`;
        processResponse.summary.zplFileName =
          zplFiles.length === 1 ? zplFiles[0].name : `${zplFiles.length}_ZPL_Labels_Combined.zpl`;
        processResponse.summary.unmatchedPdfPagesCount = unmatchedPdfPageCount;
        processResponse.summary.unmatchedZplPagesCount = unmatchedZplPageCount;
      }

      if (processResponse.files?.combinedPdfBase64 && combinedDocInstance) {
        setCachedAmazonDocs({
          combinedDoc: combinedDocInstance,
          combinedBytes: combinedBytes || null,
          origDoc,
          zplDoc: zplDocInstance,
          cacheKey: getDocCacheKey(processResponse.files),
        });
        startBackgroundOrderPdfPrewarming(processResponse.results, combinedDocInstance);
      }

      // Prepare FormData for saving batch to backend database with 7-day retention
      // MULTI-STEP CLOUDFLARE-SAFE UPLOAD:
      // Step 1: Create batch with summary, results, and combinedPdf (~3-5MB, strictly under Cloudflare Tunnel limit)
      // Step 2 & 3: Attach originalPdf, zplPdf, and unmatched files concurrently in lightweight follow-up background requests
      try {
        const initialFormData = new FormData();
        initialFormData.append("summary", JSON.stringify(processResponse.summary));
        initialFormData.append("results", JSON.stringify(processResponse.results));

        if (combinedBytes) {
          const combinedFile = new File([combinedBytes as unknown as BlobPart], "combined_match.pdf", {
            type: "application/pdf",
          });
          initialFormData.append("combinedPdf", combinedFile);
        }

        // NON-BLOCKING BACKGROUND SYNC: Save batch to database quietly in background with Chunked Uploads
        useAmazonOrderStore.setState({ historySyncStatus: "syncing" });
        (async () => {
          try {
            const fullFormData = new FormData();
            fullFormData.append("summary", JSON.stringify(processResponse.summary));
            fullFormData.append("results", JSON.stringify(processResponse.results));

            if (combinedBytes) {
              fullFormData.append("combinedPdf", new File([combinedBytes as unknown as BlobPart], "combined_match.pdf", { type: "application/pdf" }));
            }
            if (enhancedBytes) {
              fullFormData.append("originalPdf", new File([enhancedBytes as unknown as BlobPart], "original_invoices.pdf", { type: "application/pdf" }));
            }
            if (mergedZplBytes) {
              fullFormData.append("zplPdf", new File([mergedZplBytes as unknown as BlobPart], "converted_zpl.pdf", { type: "application/pdf" }));
            }
            if (unmatchedPdfBytes) {
              fullFormData.append("unmatchedPdf", new File([unmatchedPdfBytes as unknown as BlobPart], "unmatched_invoices.pdf", { type: "application/pdf" }));
            }
            if (unmatchedZplBytes) {
              fullFormData.append("unmatchedZplPdf", new File([unmatchedZplBytes as unknown as BlobPart], "unmatched_zpl.pdf", { type: "application/pdf" }));
            }

            const saveRes = await amazonOrderService.uploadBatchChunks(
              fullFormData,
              (prog, status) => {
                // Optional: We can log background progress here if needed
                // console.log(`Background Sync: ${prog}% - ${status}`);
              }
            );

            if (saveRes?.success && saveRes.data?.id) {
              useAmazonOrderStore.setState({
                activeHistoryBatchId: saveRes.data.id,
                historySyncStatus: "synced",
              });
              useAmazonOrderStore.getState().fetchHistoryBatches();
              toast.success("Batch data and files successfully saved to 7-day history.");
            } else {
              useAmazonOrderStore.setState({ historySyncStatus: "error" });
              toast.error("Failed to save to 7-day cloud history. Your data is not stored.");
            }
          } catch (err: any) {
            console.error("Background batch chunked save error:", err);
            useAmazonOrderStore.setState({ historySyncStatus: "error" });
            toast.error(`Failed to save batch to cloud history: ${err.message || "Network or timeout error"}`);
          }
        })();
      } catch (prepErr) {
        console.warn("Could not prepare batch form data for background save:", prepErr);
      }

      // Create fast direct Blob URLs without base64 decoding overhead
      const directUrls = {
        combinedPdfUrl: combinedBytes
          ? URL.createObjectURL(new Blob([combinedBytes as unknown as BlobPart], { type: "application/pdf" }))
          : null,
        originalPdfUrl: enhancedBytes
          ? URL.createObjectURL(new Blob([enhancedBytes as unknown as BlobPart], { type: "application/pdf" }))
          : null,
        convertedZplPdfUrl: mergedZplBytes
          ? URL.createObjectURL(new Blob([mergedZplBytes as unknown as BlobPart], { type: "application/pdf" }))
          : null,
        unmatchedPdfUrl: unmatchedPdfBytes
          ? URL.createObjectURL(new Blob([unmatchedPdfBytes as unknown as BlobPart], { type: "application/pdf" }))
          : null,
        unmatchedZplPdfUrl: unmatchedZplBytes
          ? URL.createObjectURL(new Blob([unmatchedZplBytes as unknown as BlobPart], { type: "application/pdf" }))
          : null,
      };

      clearInterval(progressInterval);
      setProgress(100, "5. Processing Complete! Opening Results...");
      setProcessData(processResponse, directUrls);

      toast.success(
        `Successfully processed ${processResponse.summary.totalZplLabels} labels & ${processResponse.summary.totalPdfOrders} invoices (${processResponse.summary.matchPercentage}% matched)!`
      );

      // Navigate immediately to the prefetched result page
      router.push("/dashboard/order-process/amazon/order-process/result");
    } catch (err: unknown) {
      clearInterval(progressInterval);
      setProcessing(false);
      const message = err instanceof Error ? err.message : "Processing failed.";
      toast.error(message);
    }
  };

  return (
    <DashboardLayout title="Amazon Order Process">
      <div className="space-y-4 sm:space-y-6">
        {/* Real-time Progress Modal */}
        <ProcessingProgressModal
          isOpen={isProcessing}
          progress={progress}
          currentStage={currentStage}
        />

        {/* Upload Form */}
        <>
          {/* Header Information Banner */}
          <div className="rounded-2xl sm:rounded-3xl border border-[#E7E0D2] bg-white p-3.5 sm:p-5 lg:p-6 xl:p-7 shadow-sm">
            <div className="flex flex-col gap-3.5 sm:gap-4 xl:flex-row xl:items-center xl:justify-between">
              <div className="space-y-1 sm:space-y-1.5 min-w-0 max-w-2xl">
                <h2 className="text-lg sm:text-xl lg:text-2xl font-bold tracking-tight text-[#0A0E1A]">
                  Upload Required Amazon Order Files
                </h2>
                <p className="text-xs sm:text-sm text-slate-500">
                  Upload PDF tax invoices and ZPL barcode labels to automatically convert, cross-verify, and match orders.
                </p>
              </div>

              {/* Progress Badge & 7-Day History Dropdown */}
              <div className="flex items-center justify-between sm:justify-start xl:justify-end gap-2.5 sm:gap-3 w-full sm:w-auto shrink-0">
                <AmazonProcessHistoryDropdown className="flex-1 sm:flex-initial" />
                <div className="rounded-xl sm:rounded-2xl border border-slate-200 bg-slate-50 px-2.5 sm:px-3.5 xl:px-4 py-2 sm:py-2.5 text-center sm:text-right shadow-2xs shrink-0 whitespace-nowrap">
                  <div className="text-xs sm:text-sm xl:text-base font-black text-[#0A0E1A] whitespace-nowrap">
                    <span className={pdfFiles.length > 0 ? "text-emerald-600" : "text-slate-400"}>
                      {pdfFiles.length} PDF{pdfFiles.length !== 1 ? "s" : ""}
                    </span>
                    <span className="text-slate-300 mx-1 sm:mx-1.5">•</span>
                    <span className={zplFiles.length > 0 ? "text-emerald-600" : "text-slate-400"}>
                      {zplFiles.length} ZPL{zplFiles.length !== 1 ? "s" : ""}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Side-by-Side Upload Sections */}
          <div className="grid grid-cols-1 gap-4 sm:gap-5 xl:gap-6 lg:grid-cols-2">
            {/* ======================================================== */}
            {/* SECTION 1: PDF FILE UPLOAD */}
            {/* ======================================================== */}
            <div className="flex flex-col rounded-2xl sm:rounded-3xl border border-[#E7E0D2] bg-white p-3.5 sm:p-5 xl:p-6 shadow-sm transition-all hover:shadow-md">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3 sm:pb-3.5 gap-2">
                <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
                  <div className="grid h-9 w-9 sm:h-10 sm:w-10 xl:h-11 xl:w-11 place-items-center rounded-xl sm:rounded-2xl bg-red-50 text-red-600 border border-red-100 shrink-0">
                    <FileText className="h-4 w-4 sm:h-5 sm:w-5" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-bold text-[#0A0E1A] text-xs sm:text-sm xl:text-base truncate">
                      1. PDF Invoices {pdfFiles.length > 0 ? `(${pdfFiles.length})` : ""}
                    </h3>
                    <p className="text-[11px] sm:text-xs text-slate-500 truncate">Upload one or multiple .pdf files</p>
                  </div>
                </div>

                {pdfFiles.length > 0 ? (
                  <span className="inline-flex items-center gap-1 sm:gap-1.5 rounded-full bg-emerald-50 px-2 sm:px-2.5 py-0.5 sm:py-1 text-[11px] sm:text-xs font-semibold text-emerald-700 border border-emerald-200 shrink-0">
                    <CheckCircle2 className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                    {pdfFiles.length} Ready
                  </span>
                ) : (
                  <span className="inline-flex items-center rounded-full bg-amber-50 px-2 sm:px-2.5 py-0.5 sm:py-1 text-[11px] sm:text-xs font-semibold text-amber-700 border border-amber-200 shrink-0">
                    Required
                  </span>
                )}
              </div>

              {/* Upload Box / Selected Files View */}
              <div className="mt-3.5 sm:mt-5 flex-1 flex flex-col justify-between">
                {pdfFiles.length === 0 ? (
                  <div
                    onClick={() => pdfInputRef.current?.click()}
                    onDragOver={handlePdfDragOver}
                    onDragLeave={handlePdfDragLeave}
                    onDrop={handlePdfDrop}
                    className={`group relative flex min-h-[185px] sm:min-h-[200px] xl:min-h-[220px] cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed p-3 sm:p-5 text-center transition-all ${
                      isDraggingPdf
                        ? "border-[#E8C16D] bg-[#FFF9EC]"
                        : "border-slate-300 bg-slate-50/50 hover:border-[#E8C16D] hover:bg-[#FFF9EC]/40"
                    }`}
                  >
                    <div className="mb-2 sm:mb-2.5 grid h-10 w-10 sm:h-11 sm:w-11 xl:h-12 xl:w-12 place-items-center rounded-full bg-white text-slate-500 shadow-sm transition-transform group-hover:scale-110 group-hover:text-red-500">
                      <UploadCloud className="h-5 w-5 sm:h-6 sm:w-6" />
                    </div>

                    <p className="text-xs sm:text-sm font-bold text-[#0A0E1A]">
                      Click to upload or drag & drop PDF(s)
                    </p>
                    <p className="mt-0.5 text-[11px] sm:text-xs text-slate-500 max-w-xs sm:max-w-none">
                      Select one or multiple Adobe PDF (<code className="font-mono text-red-600 font-semibold">.pdf</code>) files
                    </p>

                    <div className="mt-2.5 sm:mt-3 inline-flex items-center gap-1.5 text-xs font-bold text-[#0A0E1A] bg-white px-3 sm:px-3.5 py-1.5 rounded-xl border border-slate-200 shadow-2xs group-hover:border-[#E8C16D]">
                      <FileText className="h-3.5 w-3.5 text-red-500" />
                      Browse PDF Files
                    </div>
                  </div>
                ) : (
                  <div
                    onClick={() => pdfInputRef.current?.click()}
                    onDragOver={handlePdfDragOver}
                    onDragLeave={handlePdfDragLeave}
                    onDrop={handlePdfDrop}
                    className={`flex min-h-[185px] sm:min-h-[200px] xl:min-h-[220px] flex-col justify-between rounded-2xl border-2 p-2.5 sm:p-3 xl:p-3.5 transition-all cursor-pointer ${
                      isDraggingPdf
                        ? "border-[#E8C16D] bg-[#FFF9EC]"
                        : "border-emerald-200 bg-emerald-50/20 hover:border-[#E8C16D]/70"
                    }`}
                  >
                    <div className="flex-1 flex flex-col min-h-0">
                      {/* Scrollable file cards */}
                      <div
                        onClick={(e) => e.stopPropagation()}
                        className="max-h-36 sm:max-h-44 overflow-y-auto space-y-1.5 pr-1 cursor-default"
                      >
                        {pdfFiles.map((file, idx) => (
                          <div
                            key={`${file.name}_${idx}`}
                            className="flex items-center justify-between gap-2 rounded-xl border border-emerald-200/60 bg-white p-2 sm:p-2.5 shadow-2xs"
                          >
                            <div className="flex items-center gap-2 min-w-0 flex-1">
                              <div className="grid h-7 w-7 sm:h-8 sm:w-8 shrink-0 place-items-center rounded-lg bg-red-50 text-red-600">
                                <FileCheck className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
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
                                handleRemoveSinglePdf(idx);
                              }}
                              title="Remove this PDF"
                              className="grid h-7 w-7 shrink-0 place-items-center rounded-lg text-slate-400 transition hover:bg-red-50 hover:text-red-600 cursor-pointer"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Footer summary bar */}
                    <div className="mt-2 sm:mt-2.5 xl:mt-3 pt-2 sm:pt-2.5 border-t border-emerald-200/70 flex items-center justify-between gap-1.5 sm:gap-2">
                      <div className="flex items-center gap-1 sm:gap-1.5 text-[11px] sm:text-xs font-semibold text-emerald-900 min-w-0 truncate">
                        <span className="whitespace-nowrap">{pdfFiles.length} file{pdfFiles.length > 1 ? "s" : ""}</span>
                        <span className="text-slate-400">•</span>
                        <span className="text-emerald-700 font-medium truncate">{formatFileSize(totalPdfSize)}</span>
                      </div>

                      <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            pdfInputRef.current?.click();
                          }}
                          className="inline-flex items-center gap-1 text-xs xl:text-sm font-bold text-[#0A0E1A] bg-white hover:bg-[#FFF9EC] px-2.5 sm:px-3 xl:px-4 py-1.5 sm:py-1.5 xl:py-2 rounded-xl border-2 border-[#E8C16D] shadow-xs transition hover:scale-[1.02] cursor-pointer"
                        >
                          <Plus className="h-3.5 w-3.5 text-[#B88728]" />
                          <span>Add More</span>
                        </button>

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRemoveAllPdfs();
                          }}
                          className="inline-flex items-center gap-1 text-xs xl:text-sm font-bold text-red-600 bg-white hover:bg-red-50 px-2.5 sm:px-3 xl:px-4 py-1.5 sm:py-1.5 xl:py-2 rounded-xl border-2 border-red-200 hover:border-red-300 shadow-xs transition hover:scale-[1.02] cursor-pointer"
                        >
                          <Trash2 className="h-3.5 w-3.5 text-red-500" />
                          <span>Clear All</span>
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Hidden File Input with multiple enabled */}
                <input
                  ref={pdfInputRef}
                  type="file"
                  multiple
                  hidden
                  accept=".pdf,application/pdf"
                  onChange={(e) => {
                    if (e.target.files && e.target.files.length > 0) {
                      handlePdfSelection(e.target.files);
                    }
                  }}
                />

                {/* PDF Error Display */}
                {pdfError && (
                  <div className="mt-3 flex items-center gap-2 rounded-xl bg-red-50 p-2.5 sm:p-3 text-xs text-red-700 border border-red-200">
                    <AlertCircle className="h-4 w-4 shrink-0 text-red-600" />
                    <span>{pdfError}</span>
                  </div>
                )}
              </div>
            </div>

            {/* ======================================================== */}
            {/* SECTION 2: ZPL FILE UPLOAD */}
            {/* ======================================================== */}
            <div className="flex flex-col rounded-2xl sm:rounded-3xl border border-[#E7E0D2] bg-white p-3.5 sm:p-5 xl:p-6 shadow-sm transition-all hover:shadow-md">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3 sm:pb-3.5 gap-2">
                <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
                  <div className="grid h-9 w-9 sm:h-10 sm:w-10 xl:h-11 xl:w-11 place-items-center rounded-xl sm:rounded-2xl bg-amber-50 text-amber-600 border border-amber-100 shrink-0">
                    <Barcode className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-bold text-[#0A0E1A] text-xs sm:text-sm xl:text-base truncate">
                      2. ZPL Barcodes {zplFiles.length > 0 ? `(${zplFiles.length})` : ""}
                    </h3>
                    <p className="text-[11px] sm:text-xs text-slate-500 truncate">Upload one or multiple .zpl files</p>
                  </div>
                </div>

                {zplFiles.length > 0 ? (
                  <span className="inline-flex items-center gap-1 sm:gap-1.5 rounded-full bg-emerald-50 px-2 sm:px-2.5 py-0.5 sm:py-1 text-[11px] sm:text-xs font-semibold text-emerald-700 border border-emerald-200 shrink-0">
                    <CheckCircle2 className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                    {zplFiles.length} Ready
                  </span>
                ) : (
                  <span className="inline-flex items-center rounded-full bg-amber-50 px-2 sm:px-2.5 py-0.5 sm:py-1 text-[11px] sm:text-xs font-semibold text-amber-700 border border-amber-200 shrink-0">
                    Required
                  </span>
                )}
              </div>

              {/* Upload Box / Selected Files View */}
              <div className="mt-3.5 sm:mt-5 flex-1 flex flex-col justify-between">
                {zplFiles.length === 0 ? (
                  <div
                    onClick={() => zplInputRef.current?.click()}
                    onDragOver={handleZplDragOver}
                    onDragLeave={handleZplDragLeave}
                    onDrop={handleZplDrop}
                    className={`group relative flex min-h-[185px] sm:min-h-[200px] xl:min-h-[220px] cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed p-3 sm:p-5 text-center transition-all ${
                      isDraggingZpl
                        ? "border-[#E8C16D] bg-[#FFF9EC]"
                        : "border-slate-300 bg-slate-50/50 hover:border-[#E8C16D] hover:bg-[#FFF9EC]/40"
                    }`}
                  >
                    <div className="mb-2 sm:mb-2.5 grid h-10 w-10 sm:h-11 sm:w-11 xl:h-12 xl:w-12 place-items-center rounded-full bg-white text-slate-500 shadow-sm transition-transform group-hover:scale-110 group-hover:text-amber-500">
                      <UploadCloud className="h-5 w-5 sm:h-6 sm:w-6" />
                    </div>

                    <p className="text-xs sm:text-sm font-bold text-[#0A0E1A]">
                      Click to upload or drag & drop ZPL(s)
                    </p>
                    <p className="mt-0.5 text-[11px] sm:text-xs text-slate-500 max-w-xs sm:max-w-none">
                      Select one or multiple Zebra Barcode (<code className="font-mono text-amber-600 font-semibold">.zpl</code>) files
                    </p>

                    <div className="mt-2.5 sm:mt-3 inline-flex items-center gap-1.5 text-xs font-bold text-[#0A0E1A] bg-white px-3 sm:px-3.5 py-1.5 rounded-xl border border-slate-200 shadow-2xs group-hover:border-[#E8C16D]">
                      <Barcode className="h-3.5 w-3.5 text-amber-500" />
                      Browse ZPL Files
                    </div>
                  </div>
                ) : (
                  <div
                    onClick={() => zplInputRef.current?.click()}
                    onDragOver={handleZplDragOver}
                    onDragLeave={handleZplDragLeave}
                    onDrop={handleZplDrop}
                    className={`flex min-h-[185px] sm:min-h-[200px] xl:min-h-[220px] flex-col justify-between rounded-2xl border-2 p-2.5 sm:p-3 xl:p-3.5 transition-all cursor-pointer ${
                      isDraggingZpl
                        ? "border-[#E8C16D] bg-[#FFF9EC]"
                        : "border-emerald-200 bg-emerald-50/20 hover:border-[#E8C16D]/70"
                    }`}
                  >
                    <div className="flex-1 flex flex-col min-h-0">
                      {/* Scrollable file cards */}
                      <div
                        onClick={(e) => e.stopPropagation()}
                        className="max-h-36 sm:max-h-44 overflow-y-auto space-y-1.5 pr-1 cursor-default"
                      >
                        {zplFiles.map((file, idx) => (
                          <div
                            key={`${file.name}_${idx}`}
                            className="flex items-center justify-between gap-2 rounded-xl border border-emerald-200/60 bg-white p-2 sm:p-2.5 shadow-2xs"
                          >
                            <div className="flex items-center gap-2 min-w-0 flex-1">
                              <div className="grid h-7 w-7 sm:h-8 sm:w-8 shrink-0 place-items-center rounded-lg bg-amber-100 text-amber-700">
                                <Barcode className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
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
                                handleRemoveSingleZpl(idx);
                              }}
                              title="Remove this ZPL"
                              className="grid h-7 w-7 shrink-0 place-items-center rounded-lg text-slate-400 transition hover:bg-red-50 hover:text-red-600 cursor-pointer"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Footer summary bar */}
                    <div className="mt-2 sm:mt-2.5 xl:mt-3 pt-2 sm:pt-2.5 border-t border-emerald-200/70 flex items-center justify-between gap-1.5 sm:gap-2">
                      <div className="flex items-center gap-1 sm:gap-1.5 text-[11px] sm:text-xs font-semibold text-emerald-900 min-w-0 truncate">
                        <span className="whitespace-nowrap">{zplFiles.length} file{zplFiles.length > 1 ? "s" : ""}</span>
                        <span className="text-slate-400">•</span>
                        <span className="text-emerald-700 font-medium truncate">{formatFileSize(totalZplSize)}</span>
                      </div>

                      <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            zplInputRef.current?.click();
                          }}
                          className="inline-flex items-center gap-1 text-xs xl:text-sm font-bold text-[#0A0E1A] bg-white hover:bg-[#FFF9EC] px-2.5 sm:px-3 xl:px-4 py-1.5 sm:py-1.5 xl:py-2 rounded-xl border-2 border-[#E8C16D] shadow-xs transition hover:scale-[1.02] cursor-pointer"
                        >
                          <Plus className="h-3.5 w-3.5 text-[#B88728]" />
                          <span>Add More</span>
                        </button>

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRemoveAllZpls();
                          }}
                          className="inline-flex items-center gap-1 text-xs xl:text-sm font-bold text-red-600 bg-white hover:bg-red-50 px-2.5 sm:px-3 xl:px-4 py-1.5 sm:py-1.5 xl:py-2 rounded-xl border-2 border-red-200 hover:border-red-300 shadow-xs transition hover:scale-[1.02] cursor-pointer"
                        >
                          <Trash2 className="h-3.5 w-3.5 text-red-500" />
                          <span>Clear All</span>
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Hidden File Input with multiple enabled */}
                <input
                  ref={zplInputRef}
                  type="file"
                  multiple
                  hidden
                  accept=".zpl"
                  onChange={(e) => {
                    if (e.target.files && e.target.files.length > 0) {
                      handleZplSelection(e.target.files);
                    }
                  }}
                />

                {/* ZPL Error Display */}
                {zplError && (
                  <div className="mt-3 flex items-center gap-2 rounded-xl bg-red-50 p-2.5 sm:p-3 text-xs text-red-700 border border-red-200">
                    <AlertCircle className="h-4 w-4 shrink-0 text-red-600" />
                    <span>{zplError}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Action Controls */}
          <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-between gap-2.5 sm:gap-4 rounded-2xl sm:rounded-3xl border border-[#E7E0D2] bg-white p-3 sm:p-4 xl:p-5 shadow-sm">
            <Button
              type="button"
              variant="outline"
              size="md"
              fullWidth={false}
              disabled={pdfFiles.length === 0 && zplFiles.length === 0}
              onClick={handleResetAll}
              leftIcon={<RotateCcw className="h-4 w-4" />}
              className="w-full sm:w-auto text-xs sm:text-sm py-2.5 font-bold rounded-2xl border-2 border-slate-300 hover:border-red-300 hover:bg-red-50 hover:text-red-600 transition shadow-2xs"
            >
              Clear All
            </Button>

            <div className="flex w-full items-center gap-3 sm:w-auto">
              <Button
                type="button"
                variant="secondary"
                size="md"
                fullWidth={false}
                loading={isProcessing}
                disabled={!isReadyToSubmit || isProcessing}
                onClick={handleSubmit}
                rightIcon={<ArrowRight className="h-4 w-4" />}
                className="w-full sm:w-auto min-w-0 sm:min-w-[200px] text-xs sm:text-sm py-2.5 font-bold rounded-2xl border-2 border-[#D4A343] bg-[#E8C16D] text-[#0A0E1A] hover:bg-[#ddb75d] shadow-sm hover:shadow transition"
              >
                {isProcessing ? (
                  "Processing Files..."
                ) : isReadyToSubmit ? (
                  <>
                    <span className="sm:hidden">
                      Process Orders ({pdfFiles.length + zplFiles.length} Files)
                    </span>
                    <span className="hidden sm:inline xl:hidden">
                      Verify & Process ({pdfFiles.length + zplFiles.length} Files)
                    </span>
                    <span className="hidden xl:inline">
                      Convert, Verify & Process ({pdfFiles.length} PDF{pdfFiles.length > 1 ? "s" : ""}, {zplFiles.length} ZPL{zplFiles.length > 1 ? "s" : ""})
                    </span>
                  </>
                ) : (
                  "Upload Files"
                )}
              </Button>
            </div>
          </div>
        </>
      </div>
    </DashboardLayout>
  );
}
