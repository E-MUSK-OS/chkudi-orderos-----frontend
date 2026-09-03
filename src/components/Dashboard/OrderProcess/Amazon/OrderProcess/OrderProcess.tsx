"use client";

import { useState, useRef, useEffect } from "react";
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
import { AmazonProcessResponse } from "./types";
import { enhanceInvoicePages } from "./utils";

export default function OrderProcess() {
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
    setProcessing,
    setProgress,
    setProcessData,
    clearProcessData,
  } = useAmazonOrderStore();

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

  // Validate and handle multiple ZPL / JPL files
  const handleZplSelection = (selectedFiles: FileList | File[]) => {
    const validZpls: File[] = [];
    const invalidNames: string[] = [];

    Array.from(selectedFiles).forEach((file) => {
      const lower = file.name.toLowerCase();
      const isZpl =
        lower.endsWith(".zpl") ||
        lower.endsWith(".txt") ||
        lower.endsWith(".jpl");

      if (isZpl) {
        validZpls.push(file);
      } else {
        invalidNames.push(file.name);
      }
    });

    if (invalidNames.length > 0) {
      toast.error(`Ignored ${invalidNames.length} non-ZPL/JPL file(s).`);
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

    setProcessing(true);

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
      // 1. STREAMLINED NETWORK PIPELINE: Start ZPL conversion concurrently NOW!
      // While the backend converts ZPL to PDF, the client extracts PDF text in parallel!
      // ----------------------------------------------------------------------
      const zplTexts = await Promise.all(zplFiles.map((f) => f.text()));
      const combinedZplText = zplTexts.join("\n");
      const combinedZplFile = new File([combinedZplText], zplFiles[0]?.name || "combined.zpl", {
        type: "text/plain",
      });

      const zplFormData = new FormData();
      zplFormData.append("action", "convert-zpl");
      zplFormData.append("zplFile", combinedZplFile);

      const zplConversionPromise = fetch("/api/amazon/process-orders", {
        method: "POST",
        body: zplFormData,
      }).then(async (res) => {
        const data = await res.json();
        if (!res.ok || !data.success) {
          throw new Error(data.error || "Failed to convert ZPL barcode labels.");
        }
        return data as {
          zplLabels: any[];
          convertedZplPdfBase64: string;
        };
      });

      // ----------------------------------------------------------------------
      // 2. CONCURRENT CLIENT PIPELINE: Merge PDFs & extract text simultaneously!
      // ----------------------------------------------------------------------
      const { PDFDocument } = await import("pdf-lib");

      let mergedPdfBytes: Uint8Array;
      if (pdfFiles.length === 1) {
        mergedPdfBytes = new Uint8Array(await pdfFiles[0].arrayBuffer());
        currentPct = Math.max(currentPct, 15);
        setProgress(currentPct, "1. Validated & Prepared PDF File");
      } else {
        const buffers = await Promise.all(pdfFiles.map((f) => f.arrayBuffer()));
        const mergedDoc = await PDFDocument.create();
        for (let i = 0; i < buffers.length; i++) {
          const doc = await PDFDocument.load(buffers[i], { ignoreEncryption: true });
          const pages = await mergedDoc.copyPages(doc, doc.getPageIndices());
          pages.forEach((p) => mergedDoc.addPage(p));
        }
        mergedPdfBytes = await mergedDoc.save();
        currentPct = Math.max(currentPct, 18);
        setProgress(currentPct, "1. Merged All PDF Files");
      }

      // Extract text and table layout items in parallel chunks (up to 10 pages concurrently)
      targetCeiling = 50;
      currentPct = Math.max(currentPct, 20);
      setProgress(currentPct, "2. Extracting Amazon Invoices in parallel...");
      const pdfjs = await import("pdfjs-dist");
      if (!pdfjs.GlobalWorkerOptions.workerSrc) {
        pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version || "6.3.289"}/build/pdf.worker.min.mjs`;
      }

      const loadingTask = pdfjs.getDocument({ data: new Uint8Array(mergedPdfBytes) });
      const pdf = await loadingTask.promise;

      const pageIndices = Array.from({ length: pdf.numPages }, (_, i) => i + 1);
      const pageTextData: Array<{ text: string; items: any[] }> = new Array(pdf.numPages);

      // Process in concurrent batches of 10 pages for maximum speed
      const BATCH_SIZE = 10;
      for (let b = 0; b < pageIndices.length; b += BATCH_SIZE) {
        const batch = pageIndices.slice(b, b + BATCH_SIZE);
        await Promise.all(
          batch.map(async (pageNum) => {
            const page = await pdf.getPage(pageNum);
            const textContent = await page.getTextContent();
            const strings = textContent.items.map((item: any) => item.str);
            pageTextData[pageNum - 1] = {
              text: strings.join(" "),
              items: textContent.items,
            };
          })
        );
        const stepPct = Math.round(20 + ((b + batch.length) / pdf.numPages) * 28);
        currentPct = Math.max(currentPct, stepPct);
        setProgress(
          currentPct,
          `2. Extracted Invoices (${Math.min(b + batch.length, pdf.numPages)}/${pdf.numPages})...`
        );
      }

      const pdfTextArray = pageTextData.map((d) => d.text);

      // ----------------------------------------------------------------------
      // 3. JOIN POINT: Await the concurrent ZPL conversion
      // (Already executed in parallel on backend while client extracted PDF text!)
      // ----------------------------------------------------------------------
      targetCeiling = 75;
      currentPct = Math.max(currentPct, 52);
      setProgress(currentPct, "3. Synchronizing Labels & Cross-Verifying Orders...");

      const zplResult = await zplConversionPromise;

      // ----------------------------------------------------------------------
      // 4. Ultra-Fast In-Memory Cross-Verification (Takes ~10ms)
      // ----------------------------------------------------------------------
      const compareRes = await fetch("/api/amazon/process-orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "compare",
          zplLabels: zplResult.zplLabels,
          convertedZplPdfBase64: zplResult.convertedZplPdfBase64,
          pdfTextArray,
          zplFileName: combinedZplFile.name,
        }),
      });

      const compareData = await compareRes.json();
      if (!compareRes.ok || !compareData.success) {
        throw new Error(compareData.error || "Failed to cross-verify orders.");
      }

      const processResponse = compareData as AmazonProcessResponse;

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

      if (processResponse.files?.convertedZplPdfBase64) {
        try {
          const zplBytes = Uint8Array.from(atob(processResponse.files.convertedZplPdfBase64), (c) =>
            c.charCodeAt(0)
          );
          const zplDoc = await PDFDocument.load(zplBytes);
          const combinedDoc = await PDFDocument.create();

          const TARGET_WIDTH = 4 * 72; // 288 pt
          const TARGET_HEIGHT = 6 * 72; // 432 pt
          const MARGIN = 6;
          const AVAIL_WIDTH = TARGET_WIDTH - 2 * MARGIN;
          const AVAIL_HEIGHT = TARGET_HEIGHT - 2 * MARGIN;

          const addScaledPage = async (srcPage: any, isZpl = false) => {
            const embedded = await combinedDoc.embedPage(srcPage);
            const { width: srcW, height: srcH } = embedded;

            if (isZpl) {
              // Adjust top spacing for ZPL barcode label so the top barcode has clean breathing room
              const TOP_SPACING = 25; // 25 pt (~8.8 mm) top margin
              const BOTTOM_SPACING = 10;
              const SIDE_SPACING = 8;

              const availW = TARGET_WIDTH - 2 * SIDE_SPACING;
              const availH = TARGET_HEIGHT - TOP_SPACING - BOTTOM_SPACING;

              const scale = Math.min(availW / srcW, availH / srcH);
              const finalW = srcW * scale;
              const finalH = srcH * scale;

              // Shift slightly right to perfectly balance left and right margins (centers visual content)
              const X_OFFSET_ZPL = 5.5;
              const x = (TARGET_WIDTH - finalW) / 2 + X_OFFSET_ZPL;
              // In PDF coordinates (0,0 is bottom-left), distance from top edge is TOP_SPACING
              const y = TARGET_HEIGHT - TOP_SPACING - finalH;

              const newPage = combinedDoc.addPage([TARGET_WIDTH, TARGET_HEIGHT]);
              newPage.drawPage(embedded, { x, y, width: finalW, height: finalH });
            } else {
              const MARGIN = 6;
              const availW = TARGET_WIDTH - 2 * MARGIN;
              const availH = TARGET_HEIGHT - 2 * MARGIN;

              const scale = Math.min(availW / srcW, availH / srcH);
              const finalW = srcW * scale;
              const finalH = srcH * scale;

              // Shift slightly right to perfectly balance left and right margins of the invoice
              const X_OFFSET_INVOICE = 4.5;
              const x = (TARGET_WIDTH - finalW) / 2 + X_OFFSET_INVOICE;
              const y = (TARGET_HEIGHT - finalH) / 2;

              const newPage = combinedDoc.addPage([TARGET_WIDTH, TARGET_HEIGHT]);
              newPage.drawPage(embedded, { x, y, width: finalW, height: finalH });
            }
          };

          // Matched only (interleaved: Tax Invoice FIRST, ZPL/JPL SECOND)
          for (const item of processResponse.results) {
            if (item.isMatch) {
              // 1. Tax Invoice first
              if (item.pdfPages && item.pdfPages.length > 0) {
                for (const p of item.pdfPages) {
                  const idx = p - 1;
                  if (idx >= 0 && idx < origDoc.getPageCount()) {
                    await addScaledPage(origDoc.getPage(idx), false);
                  }
                }
              }
              // 2. ZPL / JPL barcode label second
              if (item.zplPage > 0 && item.zplPage <= zplDoc.getPageCount()) {
                await addScaledPage(zplDoc.getPage(item.zplPage - 1), true);
              }
            }
          }

          combinedPromise = combinedDoc.save();
        } catch (genErr) {
          console.warn("Could not generate combined preview PDF client-side:", genErr);
        }
      }

      // Save documents concurrently in parallel
      const [enhancedBytes, combinedBytes] = await Promise.all([
        origDoc.save(),
        combinedPromise ? combinedPromise : Promise.resolve(null),
      ]);

      // Convert to base64 concurrently
      const [originalPdfBase64, combinedPdfBase64] = await Promise.all([
        fileToBase64(new Blob([enhancedBytes as unknown as BlobPart], { type: "application/pdf" })),
        combinedBytes
          ? fileToBase64(new Blob([combinedBytes as unknown as BlobPart], { type: "application/pdf" }))
          : Promise.resolve(""),
      ]);

      if (!processResponse.files) {
        processResponse.files = {
          convertedZplPdfBase64: "",
          combinedPdfBase64: "",
          originalPdfBase64: "",
        };
      }
      processResponse.files.originalPdfBase64 = originalPdfBase64;
      processResponse.files.combinedPdfBase64 = combinedPdfBase64;

      if (processResponse.summary) {
        processResponse.summary.pdfFileName =
          pdfFiles.length === 1 ? pdfFiles[0].name : `${pdfFiles.length}_PDF_Invoices_Merged.pdf`;
        processResponse.summary.zplFileName =
          zplFiles.length === 1 ? zplFiles[0].name : `${zplFiles.length}_ZPL_Labels_Combined.zpl`;
      }

      clearInterval(progressInterval);
      setProgress(100, "5. Processing Complete!");
      await new Promise((r) => setTimeout(r, 40));

      setProcessData(processResponse);

      toast.success(
        `Successfully processed ${processResponse.summary.totalZplLabels} labels & ${processResponse.summary.totalPdfOrders} invoices (${processResponse.summary.matchPercentage}% matched)!`
      );
    } catch (err: unknown) {
      clearInterval(progressInterval);
      const message = err instanceof Error ? err.message : "Processing failed.";
      toast.error(message);
    } finally {
      clearInterval(progressInterval);
      setProcessing(false);
    }
  };

  return (
    <DashboardLayout title="Amazon Order Process">
      <div className="space-y-6">
        {/* Real-time Progress Modal */}
        <ProcessingProgressModal
          isOpen={isProcessing}
          progress={progress}
          currentStage={currentStage}
        />

        {/* If results exist, show the interactive Comparison Result View */}
        {summary ? (
          <ComparisonResultView onReset={handleResetAll} />
        ) : (
          <>
            {/* Header Information Banner */}
            <div className="rounded-3xl border border-[#E7E0D2] bg-white p-7 shadow-sm">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center rounded-md bg-[#FFF9EC] px-2.5 py-1 text-xs font-semibold text-[#B88728] border border-[#E8C16D]/30">
                      Amazon Order Processing
                    </span>
                    <span className="text-xs text-slate-500 font-medium">
                      Dual File Ingestion & Auto-Verification
                    </span>
                  </div>
                  <h2 className="text-2xl font-bold tracking-tight text-[#0A0E1A]">
                    Upload Required Amazon Order Files
                  </h2>
                  <p className="text-sm text-slate-500 max-w-2xl">
                    Please upload both the <strong className="text-slate-700">PDF file</strong> (tax invoices) and the <strong className="text-slate-700">ZPL file</strong> (zebra barcode labels). The system will convert ZPL to high-resolution PDF, cross-verify all invoice and order numbers, and display matched results.
                  </p>
                </div>

                {/* Progress Badge */}
                <div className="flex items-center gap-3 self-start md:self-center">
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 px-5 py-3.5 text-right shadow-2xs">
                    <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      Files Ready
                    </div>
                    <div className="text-lg font-black text-[#0A0E1A] mt-0.5">
                      <span className={pdfFiles.length > 0 ? "text-emerald-600" : "text-slate-400"}>
                        {pdfFiles.length} PDF{pdfFiles.length !== 1 ? "s" : ""}
                      </span>
                      <span className="text-slate-300 mx-1.5">•</span>
                      <span className={zplFiles.length > 0 ? "text-emerald-600" : "text-slate-400"}>
                        {zplFiles.length} ZPL{zplFiles.length !== 1 ? "s" : ""}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Side-by-Side Upload Sections */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              {/* ======================================================== */}
              {/* SECTION 1: PDF FILE UPLOAD */}
              {/* ======================================================== */}
              <div className="flex flex-col rounded-3xl border border-[#E7E0D2] bg-white p-6 shadow-sm transition-all hover:shadow-md">
                <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="grid h-11 w-11 place-items-center rounded-2xl bg-red-50 text-red-600 border border-red-100">
                      <FileText className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-[#0A0E1A]">
                        1. PDF Invoices {pdfFiles.length > 0 ? `(${pdfFiles.length})` : ""}
                      </h3>
                      <p className="text-xs text-slate-500">Upload one or multiple .pdf files</p>
                    </div>
                  </div>

                  {pdfFiles.length > 0 ? (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 border border-emerald-200">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      {pdfFiles.length} Ready
                    </span>
                  ) : (
                    <span className="inline-flex items-center rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700 border border-amber-200">
                      Required
                    </span>
                  )}
                </div>

                {/* Upload Box / Selected Files View */}
                <div className="mt-5 flex-1 flex flex-col justify-between">
                  {pdfFiles.length === 0 ? (
                    <div
                      onClick={() => pdfInputRef.current?.click()}
                      onDragOver={handlePdfDragOver}
                      onDragLeave={handlePdfDragLeave}
                      onDrop={handlePdfDrop}
                      className={`group relative flex min-h-[220px] cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed p-6 text-center transition-all ${
                        isDraggingPdf
                          ? "border-[#E8C16D] bg-[#FFF9EC]"
                          : "border-slate-300 bg-slate-50/50 hover:border-[#E8C16D] hover:bg-[#FFF9EC]/40"
                      }`}
                    >
                      <div className="mb-3 grid h-14 w-14 place-items-center rounded-full bg-white text-slate-500 shadow-sm transition-transform group-hover:scale-110 group-hover:text-red-500">
                        <UploadCloud className="h-7 w-7" />
                      </div>

                      <p className="text-sm font-semibold text-[#0A0E1A]">
                        Click to upload or drag & drop PDF(s)
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
                        Select one or multiple Adobe PDF (<code className="font-mono text-red-600">.pdf</code>) files
                      </p>

                      <div className="mt-4 inline-flex items-center gap-1 text-xs font-semibold text-[#0A0E1A] bg-white px-3.5 py-1.5 rounded-xl border border-slate-200 shadow-2xs group-hover:border-[#E8C16D]">
                        <FileText className="h-3.5 w-3.5 text-red-500" />
                        Browse PDF Files
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col justify-between rounded-2xl border border-emerald-200 bg-emerald-50/20 p-4">
                      <div className="max-h-56 overflow-y-auto space-y-2 pr-1">
                        {pdfFiles.map((file, idx) => (
                          <div
                            key={`${file.name}_${idx}`}
                            className="flex items-center justify-between gap-2 rounded-xl border border-emerald-200/60 bg-white p-2.5 shadow-2xs"
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <div className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-red-50 text-red-600">
                                <FileCheck className="h-4 w-4" />
                              </div>
                              <div className="min-w-0">
                                <p className="truncate text-xs font-semibold text-[#0A0E1A]" title={file.name}>
                                  {file.name}
                                </p>
                                <p className="text-[11px] text-slate-500">
                                  {formatFileSize(file.size)}
                                </p>
                              </div>
                            </div>

                            <button
                              type="button"
                              onClick={() => handleRemoveSinglePdf(idx)}
                              title="Remove this PDF"
                              className="grid h-7 w-7 shrink-0 place-items-center rounded-lg text-slate-400 transition hover:bg-red-100 hover:text-red-600"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        ))}
                      </div>

                      <div className="mt-4 pt-3 border-t border-emerald-200/60 flex items-center justify-between">
                        <span className="text-xs font-medium text-emerald-800">
                          Total: {pdfFiles.length} file{pdfFiles.length > 1 ? "s" : ""} ({formatFileSize(totalPdfSize)})
                        </span>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => pdfInputRef.current?.click()}
                            className="inline-flex items-center gap-1 text-xs font-semibold text-[#0A0E1A] bg-white px-2.5 py-1 rounded-lg border border-slate-200 hover:border-[#E8C16D] shadow-2xs"
                          >
                            <Plus className="h-3 w-3" /> Add More
                          </button>
                          <button
                            type="button"
                            onClick={handleRemoveAllPdfs}
                            className="text-xs font-medium text-red-600 hover:underline px-1"
                          >
                            Clear
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
                    <div className="mt-3 flex items-center gap-2 rounded-xl bg-red-50 p-3 text-xs text-red-700 border border-red-200">
                      <AlertCircle className="h-4 w-4 shrink-0 text-red-600" />
                      <span>{pdfError}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* ======================================================== */}
              {/* SECTION 2: ZPL / JPL FILE UPLOAD */}
              {/* ======================================================== */}
              <div className="flex flex-col rounded-3xl border border-[#E7E0D2] bg-white p-6 shadow-sm transition-all hover:shadow-md">
                <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="grid h-11 w-11 place-items-center rounded-2xl bg-amber-50 text-amber-600 border border-amber-100">
                      <Barcode className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-[#0A0E1A]">
                        2. ZPL / JPL Barcodes {zplFiles.length > 0 ? `(${zplFiles.length})` : ""}
                      </h3>
                      <p className="text-xs text-slate-500">Upload one or multiple .zpl / .txt / .jpl files</p>
                    </div>
                  </div>

                  {zplFiles.length > 0 ? (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 border border-emerald-200">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      {zplFiles.length} Ready
                    </span>
                  ) : (
                    <span className="inline-flex items-center rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700 border border-amber-200">
                      Required
                    </span>
                  )}
                </div>

                {/* Upload Box / Selected Files View */}
                <div className="mt-5 flex-1 flex flex-col justify-between">
                  {zplFiles.length === 0 ? (
                    <div
                      onClick={() => zplInputRef.current?.click()}
                      onDragOver={handleZplDragOver}
                      onDragLeave={handleZplDragLeave}
                      onDrop={handleZplDrop}
                      className={`group relative flex min-h-[220px] cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed p-6 text-center transition-all ${
                        isDraggingZpl
                          ? "border-[#E8C16D] bg-[#FFF9EC]"
                          : "border-slate-300 bg-slate-50/50 hover:border-[#E8C16D] hover:bg-[#FFF9EC]/40"
                      }`}
                    >
                      <div className="mb-3 grid h-14 w-14 place-items-center rounded-full bg-white text-slate-500 shadow-sm transition-transform group-hover:scale-110 group-hover:text-amber-500">
                        <UploadCloud className="h-7 w-7" />
                      </div>

                      <p className="text-sm font-semibold text-[#0A0E1A]">
                        Click to upload or drag & drop ZPL/JPL(s)
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
                        Select one or multiple Zebra Barcode (<code className="font-mono text-amber-600">.zpl, .txt, .jpl</code>) files
                      </p>

                      <div className="mt-4 inline-flex items-center gap-1 text-xs font-semibold text-[#0A0E1A] bg-white px-3.5 py-1.5 rounded-xl border border-slate-200 shadow-2xs group-hover:border-[#E8C16D]">
                        <Barcode className="h-3.5 w-3.5 text-amber-500" />
                        Browse ZPL Files
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col justify-between rounded-2xl border border-emerald-200 bg-emerald-50/20 p-4">
                      <div className="max-h-56 overflow-y-auto space-y-2 pr-1">
                        {zplFiles.map((file, idx) => (
                          <div
                            key={`${file.name}_${idx}`}
                            className="flex items-center justify-between gap-2 rounded-xl border border-emerald-200/60 bg-white p-2.5 shadow-2xs"
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <div className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-amber-100 text-amber-700">
                                <Barcode className="h-4 w-4" />
                              </div>
                              <div className="min-w-0">
                                <p className="truncate text-xs font-semibold text-[#0A0E1A]" title={file.name}>
                                  {file.name}
                                </p>
                                <p className="text-[11px] text-slate-500">
                                  {formatFileSize(file.size)}
                                </p>
                              </div>
                            </div>

                            <button
                              type="button"
                              onClick={() => handleRemoveSingleZpl(idx)}
                              title="Remove this ZPL"
                              className="grid h-7 w-7 shrink-0 place-items-center rounded-lg text-slate-400 transition hover:bg-red-100 hover:text-red-600"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        ))}
                      </div>

                      <div className="mt-4 pt-3 border-t border-emerald-200/60 flex items-center justify-between">
                        <span className="text-xs font-medium text-emerald-800">
                          Total: {zplFiles.length} file{zplFiles.length > 1 ? "s" : ""} ({formatFileSize(totalZplSize)})
                        </span>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => zplInputRef.current?.click()}
                            className="inline-flex items-center gap-1 text-xs font-semibold text-[#0A0E1A] bg-white px-2.5 py-1 rounded-lg border border-slate-200 hover:border-[#E8C16D] shadow-2xs"
                          >
                            <Plus className="h-3 w-3" /> Add More
                          </button>
                          <button
                            type="button"
                            onClick={handleRemoveAllZpls}
                            className="text-xs font-medium text-red-600 hover:underline px-1"
                          >
                            Clear
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
                    accept=".zpl,.txt,.jpl"
                    onChange={(e) => {
                      if (e.target.files && e.target.files.length > 0) {
                        handleZplSelection(e.target.files);
                      }
                    }}
                  />

                  {/* ZPL Error Display */}
                  {zplError && (
                    <div className="mt-3 flex items-center gap-2 rounded-xl bg-red-50 p-3 text-xs text-red-700 border border-red-200">
                      <AlertCircle className="h-4 w-4 shrink-0 text-red-600" />
                      <span>{zplError}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Status / Requirement Callout */}
            <div
              className={`rounded-3xl border p-5 transition-all ${
                isReadyToSubmit
                  ? "border-emerald-200 bg-emerald-50 text-emerald-900"
                  : "border-amber-200 bg-amber-50/70 text-amber-900"
              }`}
            >
              <div className="flex items-start gap-3.5">
                {isReadyToSubmit ? (
                  <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
                ) : (
                  <Info className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
                )}
                <div className="space-y-1">
                  <h4 className="font-semibold text-sm">
                    {isReadyToSubmit
                      ? `${pdfFiles.length} PDF and ${zplFiles.length} ZPL file(s) ready for conversion & verification`
                      : "Both PDF and ZPL file(s) are mandatory to proceed"}
                  </h4>
                  <p className="text-xs opacity-90">
                    {isReadyToSubmit
                      ? "All requirements are satisfied. Click 'Convert, Verify & Process' below to merge the files, convert ZPL to high-resolution PDF, and cross-verify invoice numbers."
                      : pdfFiles.length === 0 && zplFiles.length === 0
                      ? "Please upload at least one .pdf document and one .zpl barcode file. You can upload multiple files of each type."
                      : pdfFiles.length === 0
                      ? `You have uploaded ${zplFiles.length} ZPL file(s). Please also upload at least one PDF invoice file to proceed.`
                      : `You have uploaded ${pdfFiles.length} PDF file(s). Please also upload at least one ZPL barcode file to proceed.`}
                  </p>
                </div>
              </div>
            </div>

            {/* Action Controls */}
            <div className="flex flex-col-reverse items-center justify-between gap-4 rounded-3xl border border-[#E7E0D2] bg-white p-5 shadow-sm sm:flex-row">
              <Button
                type="button"
                variant="outline"
                size="md"
                fullWidth={false}
                disabled={pdfFiles.length === 0 && zplFiles.length === 0}
                onClick={handleResetAll}
                leftIcon={<RotateCcw className="h-4 w-4" />}
                className="w-full sm:w-auto"
              >
                Clear Files
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
                  className="w-full sm:w-auto min-w-[260px]"
                >
                  {isProcessing
                    ? "Processing Files..."
                    : isReadyToSubmit
                    ? `Convert, Verify & Process (${pdfFiles.length} PDF${pdfFiles.length > 1 ? "s" : ""}, ${zplFiles.length} ZPL${zplFiles.length > 1 ? "s" : ""})`
                    : "Upload Both Files to Submit"}
                </Button>
              </div>
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
