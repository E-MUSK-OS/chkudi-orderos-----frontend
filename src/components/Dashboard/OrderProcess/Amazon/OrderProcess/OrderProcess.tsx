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
} from "lucide-react";
import { toast } from "sonner";
import DashboardLayout from "@/components/Dashboard/layout/DashboardLayout";
import Button from "@/components/ui/Button";
import ProcessingProgressModal from "./components/ProcessingProgressModal";
import ComparisonResultView from "./components/ComparisonResultView";
import { useAmazonOrderStore } from "./store/useAmazonOrderStore";
import { AmazonProcessResponse } from "./types";

export default function OrderProcess() {
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [zplFile, setZplFile] = useState<File | null>(null);

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

  // Validate and handle PDF file
  const handlePdfSelection = (file: File) => {
    const isPdf =
      file.name.toLowerCase().endsWith(".pdf") ||
      file.type === "application/pdf";

    if (!isPdf) {
      setPdfError("Invalid file type. Only .pdf files are accepted.");
      toast.error("Invalid file format. Please upload a PDF (.pdf) file.");
      return;
    }

    setPdfFile(file);
    setPdfError(null);
    toast.success(`PDF file "${file.name}" added successfully.`);
  };

  // Validate and handle ZPL file
  const handleZplSelection = (file: File) => {
    const isZpl = file.name.toLowerCase().endsWith(".zpl");

    if (!isZpl) {
      setZplError("Invalid file type. Only .zpl files are accepted.");
      toast.error("Invalid file format. Please upload a ZPL (.zpl) file.");
      return;
    }

    setZplFile(file);
    setZplError(null);
    toast.success(`ZPL file "${file.name}" added successfully.`);
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
    const file = e.dataTransfer.files?.[0];
    if (file) {
      handlePdfSelection(file);
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
    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleZplSelection(file);
    }
  };

  // Clear PDF
  const handleRemovePdf = () => {
    setPdfFile(null);
    setPdfError(null);
    if (pdfInputRef.current) {
      pdfInputRef.current.value = "";
    }
  };

  // Clear ZPL
  const handleRemoveZpl = () => {
    setZplFile(null);
    setZplError(null);
    if (zplInputRef.current) {
      zplInputRef.current.value = "";
    }
  };

  // Reset all
  const handleResetAll = () => {
    handleRemovePdf();
    handleRemoveZpl();
    clearProcessData();
    toast.info("Upload form cleared.");
  };

  // Check if both files are present
  const isReadyToSubmit = Boolean(pdfFile && zplFile);

  // Submit & Real-Time Processing Handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!pdfFile || !zplFile) {
      toast.error("Please upload both PDF and ZPL files before submitting.");
      return;
    }

    setProcessing(true);
    setProgress(5, "Reading & Validating Files...");

    // Smooth real-time progress interval
    let currentPct = 5;
    const progressInterval = setInterval(() => {
      if (currentPct < 90) {
        currentPct += Math.random() * 8 + 2;
        if (currentPct > 90) currentPct = 90;

        let stageText = "Processing...";
        if (currentPct < 20) {
          stageText = "1. Reading & Validating Files...";
        } else if (currentPct < 55) {
          stageText = "2. Converting ZPL Barcode Labels to PDF...";
        } else if (currentPct < 80) {
          stageText = "3. Extracting Amazon Invoices & Order IDs...";
        } else {
          stageText = "4. Comparing & Cross-Verifying Invoice Numbers...";
        }

        setProgress(Math.floor(currentPct), stageText);
      }
    }, 450);

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

      // 1. Start converting original PDF to base64 in parallel using FileReader
      const originalPdfBase64Promise = fileToBase64(pdfFile);

      // 2. Extract text from PDF on the client-side to bypass Vercel 4.5MB upload limit
      setProgress(15, "Extracting Amazon Invoices locally (bypassing size limits)...");
      const pdfjs = await import("pdfjs-dist");
      if (!pdfjs.GlobalWorkerOptions.workerSrc) {
        pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version || "6.3.289"}/build/pdf.worker.min.mjs`;
      }
      
      const pdfBytesForExtraction = new Uint8Array(await pdfFile.arrayBuffer());
      const loadingTask = pdfjs.getDocument({ data: pdfBytesForExtraction });
      const pdf = await loadingTask.promise;
      
      const pdfTextArray: string[] = [];
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        const strings = textContent.items.map((item: any) => item.str);
        pdfTextArray.push(strings.join(" "));
      }

      setProgress(50, "Converting ZPL Barcode Labels to PDF & Verifying...");
      const formData = new FormData();
      formData.append("zplFile", zplFile);
      formData.append("pdfTextArray", JSON.stringify(pdfTextArray));

      const response = await fetch("/api/amazon/process-orders", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || "Failed to process Amazon order files.");
      }

      clearInterval(progressInterval);
      setProgress(90, "5. Finalizing Paired Dispatch Documents...");

      const processResponse = data as AmazonProcessResponse;
      
      // Inject the original PDF base64 using the FileReader result
      const originalPdfBase64 = await originalPdfBase64Promise;
      if (!processResponse.files) {
        processResponse.files = {
          convertedZplPdfBase64: "",
          combinedPdfBase64: "",
          originalPdfBase64: "",
        };
      }
      processResponse.files.originalPdfBase64 = originalPdfBase64;
      if (processResponse.summary) {
        processResponse.summary.pdfFileName = pdfFile.name;
      }

      // 3. Generate Combined Matched PDF client-side for Preview & Download
      try {
        if (processResponse.files.convertedZplPdfBase64 && originalPdfBase64) {
          setProgress(95, "Generating Combined Matched PDF...");
          const { PDFDocument } = await import("pdf-lib");
          const zplBytes = Uint8Array.from(atob(processResponse.files.convertedZplPdfBase64), (c) =>
            c.charCodeAt(0)
          );
          const origPdfBytes = Uint8Array.from(atob(originalPdfBase64), (c) =>
            c.charCodeAt(0)
          );

          const zplDoc = await PDFDocument.load(zplBytes);
          const origDoc = await PDFDocument.load(origPdfBytes);
          const combinedDoc = await PDFDocument.create();

          const TARGET_WIDTH = 3.5 * 72; // 252 pt
          const TARGET_HEIGHT = 5.5 * 72; // 396 pt
          const MARGIN = 6;
          const AVAIL_WIDTH = TARGET_WIDTH - 2 * MARGIN;
          const AVAIL_HEIGHT = TARGET_HEIGHT - 2 * MARGIN;

          const addScaledPage = async (srcPage: any) => {
            const embedded = await combinedDoc.embedPage(srcPage);
            const { width: srcW, height: srcH } = embedded;
            const scale = Math.min(AVAIL_WIDTH / srcW, AVAIL_HEIGHT / srcH);
            const finalW = srcW * scale;
            const finalH = srcH * scale;
            const x = (TARGET_WIDTH - finalW) / 2;
            const y = (TARGET_HEIGHT - finalH) / 2;
            const newPage = combinedDoc.addPage([TARGET_WIDTH, TARGET_HEIGHT]);
            newPage.drawPage(embedded, { x, y, width: finalW, height: finalH });
          };

          // Matched only (interleaved)
          for (const item of processResponse.results) {
            if (item.isMatch) {
              if (item.zplPage > 0 && item.zplPage <= zplDoc.getPageCount()) {
                await addScaledPage(zplDoc.getPage(item.zplPage - 1));
              }
              if (item.pdfPages && item.pdfPages.length > 0) {
                for (const p of item.pdfPages) {
                  const idx = p - 1;
                  if (idx >= 0 && idx < origDoc.getPageCount()) {
                    await addScaledPage(origDoc.getPage(idx));
                  }
                }
              }
            }
          }

          const combinedBytes = await combinedDoc.save();
          const combinedBlob = new Blob([combinedBytes as unknown as BlobPart], { type: "application/pdf" });
          const combinedBase64 = await fileToBase64(combinedBlob);
          processResponse.files.combinedPdfBase64 = combinedBase64;
        }
      } catch (genErr) {
        console.warn("Could not generate combined preview PDF client-side:", genErr);
      }

      setProgress(100, "Processing Complete!");
      await new Promise((r) => setTimeout(r, 250));

      setProcessData(processResponse);

      toast.success(
        `Successfully processed ${processResponse.summary.totalZplLabels} labels & ${processResponse.summary.totalPdfOrders} invoices (${processResponse.summary.matchPercentage}% matched)!`
      );
    } catch (err: unknown) {
      clearInterval(progressInterval);
      const message = err instanceof Error ? err.message : "Processing failed.";
      toast.error(message);
    } finally {
      setProcessing(false);
    }
  };

  const uploadedCount = (pdfFile ? 1 : 0) + (zplFile ? 1 : 0);

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
                      Files Uploaded
                    </div>
                    <div className="text-2xl font-black text-[#0A0E1A]">
                      <span
                        className={
                          uploadedCount === 2 ? "text-emerald-600" : "text-[#B88728]"
                        }
                      >
                        {uploadedCount}
                      </span>
                      <span className="text-slate-400"> / 2</span>
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
                      <h3 className="font-bold text-[#0A0E1A]">1. PDF Invoices File</h3>
                      <p className="text-xs text-slate-500">Accepts only .pdf files</p>
                    </div>
                  </div>

                  {pdfFile ? (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 border border-emerald-200">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      PDF Ready
                    </span>
                  ) : (
                    <span className="inline-flex items-center rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700 border border-amber-200">
                      Required
                    </span>
                  )}
                </div>

                {/* Upload Box / Selected File View */}
                <div className="mt-5 flex-1">
                  {!pdfFile ? (
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
                        Click to upload or drag & drop PDF
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
                        Strictly accepts standard Adobe PDF (<code className="font-mono text-red-600">.pdf</code>)
                      </p>

                      <div className="mt-4 inline-flex items-center gap-1 text-xs font-semibold text-[#0A0E1A] bg-white px-3.5 py-1.5 rounded-xl border border-slate-200 shadow-2xs group-hover:border-[#E8C16D]">
                        <FileText className="h-3.5 w-3.5 text-red-500" />
                        Browse PDF File
                      </div>
                    </div>
                  ) : (
                    <div className="flex min-h-[220px] flex-col justify-between rounded-2xl border border-emerald-200 bg-emerald-50/30 p-5">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-red-100 text-red-600">
                            <FileCheck className="h-6 w-6" />
                          </div>
                          <div className="min-w-0">
                            <p className="truncate font-semibold text-[#0A0E1A]" title={pdfFile.name}>
                              {pdfFile.name}
                            </p>
                            <p className="text-xs text-slate-500 mt-0.5">
                              {formatFileSize(pdfFile.size)} • PDF Document
                            </p>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={handleRemovePdf}
                          title="Remove PDF"
                          className="grid h-8 w-8 place-items-center rounded-lg text-slate-400 transition hover:bg-red-100 hover:text-red-600"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>

                      <div className="mt-4 pt-4 border-t border-emerald-200/60 flex items-center justify-between">
                        <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700">
                          <CheckCircle2 className="h-4 w-4" /> File validated (.pdf)
                        </span>
                        <button
                          type="button"
                          onClick={() => pdfInputRef.current?.click()}
                          className="text-xs font-semibold text-slate-600 hover:text-[#0A0E1A] hover:underline"
                        >
                          Replace file
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Hidden File Input */}
                  <input
                    ref={pdfInputRef}
                    type="file"
                    hidden
                    accept=".pdf,application/pdf"
                    onChange={(e) => {
                      const selected = e.target.files?.[0];
                      if (selected) {
                        handlePdfSelection(selected);
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
              {/* SECTION 2: ZPL FILE UPLOAD */}
              {/* ======================================================== */}
              <div className="flex flex-col rounded-3xl border border-[#E7E0D2] bg-white p-6 shadow-sm transition-all hover:shadow-md">
                <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="grid h-11 w-11 place-items-center rounded-2xl bg-amber-50 text-amber-600 border border-amber-100">
                      <Barcode className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-[#0A0E1A]">2. ZPL Barcode File</h3>
                      <p className="text-xs text-slate-500">Accepts only .zpl files</p>
                    </div>
                  </div>

                  {zplFile ? (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 border border-emerald-200">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      ZPL Ready
                    </span>
                  ) : (
                    <span className="inline-flex items-center rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700 border border-amber-200">
                      Required
                    </span>
                  )}
                </div>

                {/* Upload Box / Selected File View */}
                <div className="mt-5 flex-1">
                  {!zplFile ? (
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
                        Click to upload or drag & drop ZPL
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
                        Strictly accepts Zebra Barcode file (<code className="font-mono text-amber-600">.zpl</code>)
                      </p>

                      <div className="mt-4 inline-flex items-center gap-1 text-xs font-semibold text-[#0A0E1A] bg-white px-3.5 py-1.5 rounded-xl border border-slate-200 shadow-2xs group-hover:border-[#E8C16D]">
                        <Barcode className="h-3.5 w-3.5 text-amber-500" />
                        Browse ZPL File
                      </div>
                    </div>
                  ) : (
                    <div className="flex min-h-[220px] flex-col justify-between rounded-2xl border border-emerald-200 bg-emerald-50/30 p-5">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-amber-100 text-amber-700">
                            <Barcode className="h-6 w-6" />
                          </div>
                          <div className="min-w-0">
                            <p className="truncate font-semibold text-[#0A0E1A]" title={zplFile.name}>
                              {zplFile.name}
                            </p>
                            <p className="text-xs text-slate-500 mt-0.5">
                              {formatFileSize(zplFile.size)} • Zebra Print File (.zpl)
                            </p>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={handleRemoveZpl}
                          title="Remove ZPL"
                          className="grid h-8 w-8 place-items-center rounded-lg text-slate-400 transition hover:bg-red-100 hover:text-red-600"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>

                      <div className="mt-4 pt-4 border-t border-emerald-200/60 flex items-center justify-between">
                        <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700">
                          <CheckCircle2 className="h-4 w-4" /> File validated (.zpl)
                        </span>
                        <button
                          type="button"
                          onClick={() => zplInputRef.current?.click()}
                          className="text-xs font-semibold text-slate-600 hover:text-[#0A0E1A] hover:underline"
                        >
                          Replace file
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Hidden File Input */}
                  <input
                    ref={zplInputRef}
                    type="file"
                    hidden
                    accept=".zpl"
                    onChange={(e) => {
                      const selected = e.target.files?.[0];
                      if (selected) {
                        handleZplSelection(selected);
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
                      ? "Both files uploaded & ready for conversion & verification"
                      : "Both PDF and ZPL files are mandatory to proceed"}
                  </h4>
                  <p className="text-xs opacity-90">
                    {isReadyToSubmit
                      ? "All requirements are satisfied. Click 'Convert, Verify & Process' below to run real-time ZPL to PDF conversion and invoice comparison."
                      : !pdfFile && !zplFile
                      ? "You must select both a .pdf document and a .zpl label file. The submit action remains disabled until both are uploaded."
                      : !pdfFile
                      ? "You have uploaded the ZPL file. Please also upload the corresponding PDF file to enable submission."
                      : "You have uploaded the PDF file. Please also upload the corresponding ZPL file to enable submission."}
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
                disabled={!pdfFile && !zplFile}
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
                    ? "Convert, Verify & Process"
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
