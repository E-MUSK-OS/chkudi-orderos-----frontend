"use client";

import React, { useState, useEffect } from "react";
import DashboardLayout from "@/components/Dashboard/layout/DashboardLayout";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Upload, 
  FileText, 
  Loader2, 
  Printer, 
  RotateCcw, 
  X, 
  ListOrdered, 
  Download, 
  Layers, 
  Play, 
  Pause, 
  Square, 
  FastForward, 
  CheckCircle2, 
  AlertCircle, 
  Sparkles,
} from "lucide-react";
import { PDFDocument, rgb, StandardFonts, degrees } from "pdf-lib";
import { toast } from "sonner";
import { chromeExtensionPrintService, resolveCurrentlyConnectedPrinter } from "@/components/Dashboard/Labels/services/printAgent.service";

export default function InvoiceFormatter() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [processedPdfDoc, setProcessedPdfDoc] = useState<PDFDocument | null>(null);

  // Modal & Batch Configuration State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalTab, setModalTab] = useState<"ALL" | "BATCHES" | "CUSTOM">("ALL");
  const [batchSize, setBatchSize] = useState<number>(20);
  const [customBatchInput, setCustomBatchInput] = useState<string>("20");
  const [pageInput, setPageInput] = useState("");

  // Live Printing State
  const [isPrinting, setIsPrinting] = useState(false);
  const [printProgress, setPrintProgress] = useState<{
    currentBatch: number;
    totalBatches: number;
    currentRange: string;
    sentPages: number;
    totalPages: number;
    statusText: string;
    isPaused: boolean;
    countdown: number;
    printerName: string;
  } | null>(null);

  // Print Loop Control Refs
  const isPrintAbortedRef = React.useRef(false);
  const isPrintPausedRef = React.useRef(false);
  const skipWaitResolverRef = React.useRef<(() => void) | null>(null);
  const pauseResolverRef = React.useRef<(() => void) | null>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      if (file.type !== "application/pdf") {
        toast.error("Please upload a valid PDF file.");
        return;
      }
      setSelectedFile(file);
      await processPDF(file);
    }
  };

  const processPDF = async (file: File) => {
    setIsProcessing(true);
    try {
      const arrayBuffer = await file.arrayBuffer();
      const srcDoc = await PDFDocument.load(arrayBuffer);
      const formattedDoc = await PDFDocument.create();
      const font = await formattedDoc.embedFont(StandardFonts.Helvetica);

      const totalPages = srcDoc.getPageCount();

      // Standard 4" x 6" label printer paper size in PDF points (72 pt / inch)
      const TARGET_WIDTH = 4 * 72;  // 288 pt
      const TARGET_HEIGHT = 6 * 72; // 432 pt

      // Margins for oversized pages (e.g. A4 / Letter invoices)
      const MARGIN_X = 2;       // 2 pt side margins (~0.7mm) to minimize left/right whitespace
      const TOP_MARGIN = 6;     // 6 pt top margin
      const BOTTOM_MARGIN = 18; // 18 pt bottom margin gives clear spacing for "Page X of Y"
      const availInvoiceW = TARGET_WIDTH - 2 * MARGIN_X;                // 284 pt
      const availInvoiceH = TARGET_HEIGHT - TOP_MARGIN - BOTTOM_MARGIN; // 408 pt

      for (let i = 0; i < totalPages; i++) {
        const srcPage = srcDoc.getPage(i);
        const rot = (srcPage.getRotation().angle || 0) % 360;

        const newPage = formattedDoc.addPage([TARGET_WIDTH, TARGET_HEIGHT]);

        try {
          const embedded = await formattedDoc.embedPage(srcPage);

          // Calculate effective visual width & height according to page rotation
          const isSideways = rot === 90 || rot === 270;
          const visualW = isSideways ? embedded.height : embedded.width;
          const visualH = isSideways ? embedded.width : embedded.height;

          // Check if page is already ~4x6 (e.g. Myntra shipping label ~288x432 pt or 100x150 mm)
          const isAlready4x6 = Math.abs(visualW - TARGET_WIDTH) <= 25 && Math.abs(visualH - TARGET_HEIGHT) <= 25;

          let scale: number;
          let scaledVisualW: number;
          let scaledVisualH: number;
          let targetX: number;
          let targetY: number;

          if (isAlready4x6) {
            // Label is already 4x6: fit 1:1 without extra shrinking to keep barcodes sharp
            scale = Math.min(TARGET_WIDTH / visualW, TARGET_HEIGHT / visualH);
            scaledVisualW = visualW * scale;
            scaledVisualH = visualH * scale;
            targetX = (TARGET_WIDTH - scaledVisualW) / 2;
            targetY = (TARGET_HEIGHT - scaledVisualH) / 2;
          } else {
            // Invoice (A4, Letter, etc.): scale down to fit comfortably in 4x6 paper area
            scale = Math.min(availInvoiceW / visualW, availInvoiceH / visualH);
            scaledVisualW = visualW * scale;
            scaledVisualH = visualH * scale;
            targetX = (TARGET_WIDTH - scaledVisualW) / 2;
            targetY = BOTTOM_MARGIN + (availInvoiceH - scaledVisualH) / 2;
          }

          const drawW = embedded.width * scale;
          const drawH = embedded.height * scale;

          let drawX = targetX;
          let drawY = targetY;

          if (rot === 90) {
            drawX = targetX + scaledVisualW;
            drawY = targetY;
          } else if (rot === 180) {
            drawX = targetX + scaledVisualW;
            drawY = targetY + scaledVisualH;
          } else if (rot === 270) {
            drawX = targetX;
            drawY = targetY + scaledVisualH;
          }

          if (rot !== 0) {
            newPage.drawPage(embedded, {
              x: drawX,
              y: drawY,
              width: drawW,
              height: drawH,
              rotate: degrees(rot),
            });
          } else {
            newPage.drawPage(embedded, {
              x: drawX,
              y: drawY,
              width: drawW,
              height: drawH,
            });
          }
        } catch (embedError) {
          console.warn(`Could not embed page ${i + 1}:`, embedError);
        }

        // Draw uniform "Page X of Y" text at bottom left
        const text = `Page ${i + 1} of ${totalPages}`;
        newPage.drawText(text, {
          x: 14,
          y: 8,
          size: 8.5,
          font: font,
          color: rgb(0, 0, 0),
        });
      }

      setProcessedPdfDoc(formattedDoc);
      const pdfBytes = await formattedDoc.save();
      const blob = new Blob([new Uint8Array(pdfBytes)], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      setPdfUrl(url);

    } catch (error) {
      console.error("Error processing PDF:", error);
      toast.error("Failed to process the PDF.");
    } finally {
      setIsProcessing(false);
    }
  };

  const parsePageNumbers = (input: string, maxPages: number): number[] => {
    const pages = new Set<number>();
    const parts = input.split(",").map((s) => s.trim());
    
    for (const part of parts) {
      if (!part) continue;
      if (part.includes("-")) {
        const [start, end] = part.split("-").map((num) => parseInt(num, 10));
        if (!isNaN(start) && !isNaN(end) && start <= end) {
          for (let i = start; i <= end; i++) {
            if (i >= 1 && i <= maxPages) pages.add(i);
          }
        }
      } else {
        const num = parseInt(part, 10);
        if (!isNaN(num) && num >= 1 && num <= maxPages) {
          pages.add(num);
        }
      }
    }
    return Array.from(pages).sort((a, b) => a - b);
  };

  const getBatchList = (total: number, size: number) => {
    if (total <= 0 || size <= 0) return [];
    const list: { batchNumber: number; startPage: number; endPage: number; pageCount: number; pages: number[] }[] = [];
    const count = Math.ceil(total / size);
    for (let i = 0; i < count; i++) {
      const start = i * size + 1;
      const end = Math.min((i + 1) * size, total);
      const pages = Array.from({ length: end - start + 1 }, (_, idx) => start + idx);
      list.push({
        batchNumber: i + 1,
        startPage: start,
        endPage: end,
        pageCount: pages.length,
        pages,
      });
    }
    return list;
  };

  const waitWithCountdown = (seconds: number) => {
    return new Promise<void>((resolve) => {
      let remaining = seconds;
      
      const interval = setInterval(() => {
        if (isPrintAbortedRef.current) {
          clearInterval(interval);
          skipWaitResolverRef.current = null;
          resolve();
          return;
        }

        if (isPrintPausedRef.current) {
          return;
        }

        remaining -= 1;
        setPrintProgress((prev) => (prev ? { ...prev, countdown: Math.max(0, remaining) } : null));

        if (remaining <= 0) {
          clearInterval(interval);
          skipWaitResolverRef.current = null;
          resolve();
        }
      }, 1000);

      skipWaitResolverRef.current = () => {
        clearInterval(interval);
        skipWaitResolverRef.current = null;
        resolve();
      };
    });
  };

  const checkPauseStatus = async () => {
    while (isPrintPausedRef.current && !isPrintAbortedRef.current) {
      await new Promise<void>((resolve) => {
        pauseResolverRef.current = resolve;
      });
    }
  };

  const handleTogglePause = () => {
    if (isPrintPausedRef.current) {
      isPrintPausedRef.current = false;
      setPrintProgress((prev) => (prev ? { ...prev, isPaused: false } : null));
      if (pauseResolverRef.current) {
        pauseResolverRef.current();
        pauseResolverRef.current = null;
      }
    } else {
      isPrintPausedRef.current = true;
      setPrintProgress((prev) => (prev ? { ...prev, isPaused: true } : null));
    }
  };

  const handleStopPrint = () => {
    isPrintAbortedRef.current = true;
    if (skipWaitResolverRef.current) {
      skipWaitResolverRef.current();
      skipWaitResolverRef.current = null;
    }
    if (pauseResolverRef.current) {
      pauseResolverRef.current();
      pauseResolverRef.current = null;
    }
    setIsPrinting(false);
    setPrintProgress(null);
    toast.info("Print job stopped. Any remaining batches were cancelled.");
  };

  const handleSkipWait = () => {
    if (skipWaitResolverRef.current) {
      skipWaitResolverRef.current();
      skipWaitResolverRef.current = null;
    }
  };

  const executePrint = async (pagesToPrint?: number[], customBatch?: number) => {
    if (!processedPdfDoc) return;
    
    const activeBatchSize = customBatch || batchSize || 20;

    try {
      // Auto resolve printer first
      toast.loading("Connecting to printer...", { id: "print-toast" });
      const availablePrinters = await chromeExtensionPrintService.getPrinters();
      const detailedPrinters = await chromeExtensionPrintService.getPrintersDetailed();
      const { printer, error } = resolveCurrentlyConnectedPrinter(availablePrinters, detailedPrinters);

      if (!printer || error) {
        toast.error(error || "No connected printer found.", { id: "print-toast" });
        return;
      }
      toast.dismiss("print-toast");

      // Determine pages to print (0-indexed)
      const totalPagesInDoc = processedPdfDoc.getPageCount();
      const targetPages = (pagesToPrint && pagesToPrint.length > 0) 
         ? pagesToPrint.map(p => p - 1) 
         : Array.from({ length: totalPagesInDoc }, (_, i) => i);

      const totalBatches = Math.ceil(targetPages.length / activeBatchSize);

      // Reset loop control flags
      isPrintAbortedRef.current = false;
      isPrintPausedRef.current = false;
      setIsPrinting(true);
      setIsModalOpen(false);

      setPrintProgress({
        currentBatch: 1,
        totalBatches,
        currentRange: "",
        sentPages: 0,
        totalPages: targetPages.length,
        statusText: `Preparing batch 1 of ${totalBatches}...`,
        isPaused: false,
        countdown: 0,
        printerName: printer,
      });

      for (let i = 0; i < totalBatches; i++) {
        if (isPrintAbortedRef.current) break;

        // If paused, wait until user resumes
        await checkPauseStatus();
        if (isPrintAbortedRef.current) break;

        const chunkIndices = targetPages.slice(i * activeBatchSize, (i + 1) * activeBatchSize);
        const startPageNum = chunkIndices[0] + 1;
        const endPageNum = chunkIndices[chunkIndices.length - 1] + 1;
        const rangeStr = `Pages ${startPageNum}–${endPageNum}`;

        setPrintProgress((prev) => prev ? {
          ...prev,
          currentBatch: i + 1,
          currentRange: rangeStr,
          statusText: `Printing Batch ${i + 1} of ${totalBatches} (${rangeStr})...`,
          countdown: 0,
        } : null);

        const newDoc = await PDFDocument.create();
        const copiedPages = await newDoc.copyPages(processedPdfDoc, chunkIndices);
        copiedPages.forEach((page) => newDoc.addPage(page));
        const base64Chunk = await newDoc.saveAsBase64();

        if (isPrintAbortedRef.current) break;

        await chromeExtensionPrintService.printPdf(base64Chunk, printer, 1);

        const cumulativeSent = Math.min((i + 1) * activeBatchSize, targetPages.length);
        setPrintProgress((prev) => prev ? {
          ...prev,
          sentPages: cumulativeSent,
        } : null);

        // Safe spacing delay between batches to let TSC DA310 printer buffer clear
        if (i < totalBatches - 1 && !isPrintAbortedRef.current) {
          setPrintProgress((prev) => prev ? {
            ...prev,
            statusText: `Batch ${i + 1} sent. Pausing 6s to prevent printer memory buffer overload...`,
            countdown: 6,
          } : null);

          await waitWithCountdown(6);
        }
      }

      if (isPrintAbortedRef.current) {
        toast.info("Printing cancelled. Remaining batches were not sent.");
      } else {
        toast.success(`Printed all ${targetPages.length} pages in ${totalBatches} batches to ${printer}!`);
      }
    } catch (error: any) {
      console.error("Print Error:", error);
      toast.error(error?.message || "Failed to print.", { id: "print-toast" });
    } finally {
      setIsPrinting(false);
      setPrintProgress(null);
    }
  };

  const handlePrintClick = () => {
    if (!processedPdfDoc) return;
    setModalTab("ALL");
    setPageInput("");
    setIsModalOpen(true);
  };

  const handlePrintSelectedPages = async () => {
    if (!pageInput) {
      toast.error("Please enter page numbers!");
      return;
    }
    const totalPages = processedPdfDoc?.getPageCount() || 0;
    const pagesToPrint = parsePageNumbers(pageInput, totalPages);
    
    if (pagesToPrint.length === 0) {
      toast.error("Invalid page range specified.");
      return;
    }
    
    setIsModalOpen(false);
    await executePrint(pagesToPrint);
  };

  const handleDownloadPdf = () => {
    if (!pdfUrl || !selectedFile) return;
    const a = document.createElement("a");
    a.href = pdfUrl;
    a.download = `Formatted_4x6_${selectedFile.name}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleResetAll = () => {
    setSelectedFile(null);
    setPdfUrl(null);
    setProcessedPdfDoc(null);
  };

  return (
    <DashboardLayout title="Invoice Formatter">
      <div className="space-y-4 sm:space-y-6">
        {/* HEADER SECTION matching Amazon Order Process */}
        <div className="rounded-3xl border border-[#E7E0D2] bg-white p-4 sm:p-7 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="space-y-1.5 min-w-0 max-w-2xl">
              <div className="flex flex-wrap items-center gap-2.5">
                <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-[#0A0E1A] dark:text-white">
                  Myntra Invoice & Label 4×6 Formatter
                </h1>
                <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 border border-amber-200/80 px-2.5 py-1 text-xs font-bold text-amber-800">
                  <Sparkles className="h-3.5 w-3.5 text-amber-600" />
                  Auto 4×6 Thermal Fit
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-500 break-words">
                Upload merged Myntra Invoice & Label PDF. Labels & A4 Invoices are automatically fitted to 4×6 thermal printer paper with page numbering.
              </p>
            </div>

            <div className="flex items-center gap-2.5 sm:gap-3 w-full sm:w-auto shrink-0 self-start lg:self-center">
              {pdfUrl ? (
                <>
                  <button
                    onClick={handleResetAll}
                    className="inline-flex h-11 sm:h-12 w-full sm:w-auto items-center justify-center gap-2 rounded-2xl border border-[#0A0E1A] bg-[#0A0E1A] px-4 sm:px-5 text-xs sm:text-sm font-bold text-[#E8C16D] transition-all hover:bg-[#E8C16D] hover:text-[#0A0E1A] hover:border-[#E8C16D] cursor-pointer shadow-xs active:scale-[0.98]"
                  >
                    <RotateCcw className="h-4 w-4" />
                    <span>New Batch</span>
                  </button>
                  <button
                    onClick={handleDownloadPdf}
                    className="inline-flex h-11 sm:h-12 w-full sm:w-auto items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white hover:bg-slate-50 px-4 sm:px-5 text-xs sm:text-sm font-bold text-slate-700 shadow-xs transition active:scale-[0.98] cursor-pointer"
                  >
                    <Download className="h-4 w-4 stroke-[2.5]" />
                    <span>Download</span>
                  </button>
                  <button
                    onClick={handlePrintClick}
                    className="inline-flex h-11 sm:h-12 w-full sm:w-auto items-center justify-center gap-2 rounded-2xl border border-transparent bg-[#E8C16D] hover:bg-[#d4af5a] px-5 sm:px-6 text-xs sm:text-sm font-bold text-[#0A0E1A] shadow-xs transition active:scale-[0.98] cursor-pointer"
                  >
                    <Printer className="h-4 w-4 stroke-[2.5]" />
                    <span>Print PDF</span>
                  </button>
                </>
              ) : (
                <div className="inline-flex h-10 sm:h-11 items-center px-3.5 sm:px-4 rounded-2xl border border-[#E7E0D2] bg-slate-50/80 shadow-xs">
                  <span className="text-xs sm:text-sm font-semibold text-slate-500">0 PDF Files</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* CONTENT SECTION */}
        {isProcessing ? (
          <div className="flex min-h-[400px] flex-col items-center justify-center rounded-3xl border border-[#E7E0D2] bg-white p-8">
            <Loader2 className="h-10 w-10 animate-spin text-[#E8C16D]" />
            <p className="mt-4 text-sm font-medium text-slate-600">Formatting pages to 4×6 thermal size and adding page numbers...</p>
          </div>
        ) : !pdfUrl ? (
          <div className="rounded-3xl border border-[#E7E0D2] bg-white p-4 sm:p-7 shadow-sm">
            <div className="mb-4 sm:mb-6 flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 shadow-sm ring-1 ring-emerald-500/20">
                    <FileText className="h-5 w-5 sm:h-6 sm:w-6" />
                  </div>
                  <div>
                    <h2 className="text-base sm:text-lg font-bold text-slate-800">PDF Order File</h2>
                    <p className="text-xs sm:text-sm text-slate-500">Upload one .pdf file</p>
                  </div>
                </div>
                <span className="inline-flex items-center rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700 ring-1 ring-amber-600/20">
                  Required
                </span>
              </div>
            </div>

            <div className="relative group flex min-h-[220px] w-full flex-col items-center justify-center rounded-3xl border-2 border-dashed border-[#E8C16D]/60 bg-[#E8C16D]/[0.02] hover:bg-[#E8C16D]/5 hover:border-[#E8C16D] p-6 sm:p-8 text-center transition-all duration-300">
              <input
                type="file"
                accept=".pdf"
                onChange={handleFileChange}
                className="peer absolute inset-0 h-full w-full cursor-pointer opacity-0"
              />
              <div className="flex flex-col items-center justify-center">
                <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-[#E8C16D] shadow-sm ring-1 ring-black/5 group-hover:scale-110 transition-transform">
                  <Upload className="h-6 w-6" />
                </div>
                <h3 className="mb-1 text-sm sm:text-base font-bold text-slate-800">
                  Click to upload or drag & drop PDF
                </h3>
                <p className="mb-6 text-xs text-slate-500 max-w-[320px]">
                  Select a Myntra Invoice & Label PDF file (.pdf). Labels and Invoices will be automatically formatted to 4×6.
                </p>
                <div className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition-colors group-hover:border-[#E8C16D] group-hover:text-[#E8C16D]">
                  <FileText className="h-4 w-4" />
                  <span>Browse PDF File</span>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex-1 rounded-3xl border border-[#E7E0D2] bg-white shadow-sm overflow-hidden flex flex-col min-h-[70vh]">
            <iframe src={pdfUrl} className="w-full h-[70vh] border-none" title="PDF Viewer" />
          </div>
        )}
      </div>

      {/* PRINT OPTIONS MODAL */}
      <AnimatePresence>
        {isModalOpen && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-md select-none"
            onClick={() => setIsModalOpen(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.94, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.94, y: 12 }}
              transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
              onClick={(e) => e.stopPropagation()}
              className="relative w-full max-w-lg overflow-hidden rounded-3xl border border-[#E7E0D2] bg-white p-6 sm:p-7 shadow-2xl text-slate-900"
            >
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="absolute top-4 right-4 grid h-8 w-8 place-items-center rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition"
              >
                <X className="h-4 w-4" />
              </button>
              
              {/* Ambient Glows */}
              <div className="pointer-events-none absolute -top-16 -left-16 h-44 w-44 rounded-full bg-[#FFF9EC] blur-3xl" />
              <div className="pointer-events-none absolute -bottom-16 -right-16 h-44 w-44 rounded-full bg-amber-500/10 blur-3xl" />
              
              <div className="relative">
                {/* Header */}
                <div className="flex items-center gap-3 mb-5">
                  <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-amber-50 text-amber-700 ring-1 ring-amber-500/20">
                    <Printer className="h-6 w-6 stroke-[2.2]" />
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-slate-800">Print Options</h3>
                    <p className="text-xs text-slate-500">
                      Total <strong>{processedPdfDoc?.getPageCount() || 0} pages</strong> loaded in PDF
                    </p>
                  </div>
                </div>

                {/* Tabs */}
                <div className="mb-5 flex rounded-2xl border border-slate-200 bg-slate-50 p-1">
                  <button
                    type="button"
                    onClick={() => setModalTab("ALL")}
                    className={`flex-1 rounded-xl py-2 text-xs sm:text-sm font-bold transition ${
                      modalTab === "ALL"
                        ? "bg-white text-slate-900 shadow-sm"
                        : "text-slate-500 hover:text-slate-800"
                    }`}
                  >
                    All Pages (Batched)
                  </button>
                  <button
                    type="button"
                    onClick={() => setModalTab("BATCHES")}
                    className={`flex-1 rounded-xl py-2 text-xs sm:text-sm font-bold transition ${
                      modalTab === "BATCHES"
                        ? "bg-white text-slate-900 shadow-sm"
                        : "text-slate-500 hover:text-slate-800"
                    }`}
                  >
                    Quick Batches
                  </button>
                  <button
                    type="button"
                    onClick={() => setModalTab("CUSTOM")}
                    className={`flex-1 rounded-xl py-2 text-xs sm:text-sm font-bold transition ${
                      modalTab === "CUSTOM"
                        ? "bg-white text-slate-900 shadow-sm"
                        : "text-slate-500 hover:text-slate-800"
                    }`}
                  >
                    Select Pages
                  </button>
                </div>

                {/* Batch Size Selector (Shown in ALL and BATCHES tabs) */}
                {modalTab !== "CUSTOM" && (
                  <div className="mb-5 rounded-2xl border border-amber-200/70 bg-amber-50/40 p-3.5 sm:p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold text-amber-950 flex items-center gap-1.5">
                        <Layers className="h-3.5 w-3.5 text-amber-600" />
                        Batch Size (Pages per Print Job)
                      </span>
                      <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-100/70 px-2 py-0.5 rounded-full">
                        ⚡ Recommended: 20
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      {[10, 20, 30, 50].map((sz) => (
                        <button
                          key={sz}
                          type="button"
                          onClick={() => {
                            setBatchSize(sz);
                            setCustomBatchInput(String(sz));
                          }}
                          className={`flex-1 py-1.5 rounded-xl text-xs font-bold border transition ${
                            batchSize === sz
                              ? "bg-[#0A0E1A] text-[#E8C16D] border-[#0A0E1A] shadow-xs"
                              : "bg-white text-slate-700 border-slate-200 hover:bg-slate-100"
                          }`}
                        >
                          {sz}
                        </button>
                      ))}
                      <div className="relative w-16">
                        <input
                          type="number"
                          min="1"
                          max="200"
                          value={customBatchInput}
                          onChange={(e) => {
                            setCustomBatchInput(e.target.value);
                            const val = parseInt(e.target.value, 10);
                            if (!isNaN(val) && val > 0) {
                              setBatchSize(val);
                            }
                          }}
                          className="w-full text-center py-1.5 rounded-xl text-xs font-bold border border-slate-200 bg-white focus:outline-none focus:border-amber-500"
                          title="Custom batch size"
                        />
                      </div>
                    </div>

                    <p className="mt-2 text-[11px] leading-relaxed text-amber-900/80">
                      Keeps print spooler file small (~2 MB) so the <strong>TSC DA310</strong> printer buffer memory doesn&apos;t overflow or reprint duplicate labels.
                    </p>
                  </div>
                )}

                {/* TAB 1: ALL PAGES BATCHED */}
                {modalTab === "ALL" && (
                  <div className="flex flex-col">
                    {(() => {
                      const total = processedPdfDoc?.getPageCount() || 0;
                      const totalBatches = Math.ceil(total / batchSize);
                      return (
                        <>
                          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 mb-5 space-y-2">
                            <div className="flex justify-between text-xs text-slate-600">
                              <span>Total Pages:</span>
                              <strong className="text-slate-800">{total} Pages</strong>
                            </div>
                            <div className="flex justify-between text-xs text-slate-600">
                              <span>Batch Strategy:</span>
                              <strong className="text-amber-700">{totalBatches} Batches ({batchSize} pages each)</strong>
                            </div>
                            <div className="flex justify-between text-xs text-slate-600">
                              <span>Buffer Cooldown:</span>
                              <span className="text-slate-700 font-semibold">6s spacing between batches</span>
                            </div>
                          </div>

                          <div className="flex gap-3">
                            <button
                              type="button"
                              onClick={() => setIsModalOpen(false)}
                              className="flex-1 rounded-xl bg-slate-100 py-3.5 text-xs sm:text-sm font-bold text-slate-600 transition hover:bg-slate-200 active:scale-[0.98]"
                            >
                              Cancel
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setIsModalOpen(false);
                                executePrint(undefined, batchSize);
                              }}
                              className="flex-[2] inline-flex items-center justify-center gap-2 rounded-xl bg-[#E8C16D] py-3.5 text-xs sm:text-sm font-bold text-[#0A0E1A] shadow-sm transition hover:bg-[#d6ad53] active:scale-[0.98]"
                            >
                              <Printer className="h-4 w-4" />
                              <span>Print All ({totalBatches} Batches)</span>
                            </button>
                          </div>
                        </>
                      );
                    })()}
                  </div>
                )}

                {/* TAB 2: QUICK BATCHES */}
                {modalTab === "BATCHES" && (
                  <div className="flex flex-col">
                    {(() => {
                      const total = processedPdfDoc?.getPageCount() || 0;
                      const batchList = getBatchList(total, batchSize);

                      return (
                        <>
                          <p className="text-xs text-slate-500 mb-3">
                            Click any batch to print immediately (helpful if a previous label jammed or needs reprint):
                          </p>
                          <div className="grid grid-cols-2 gap-2 max-h-56 overflow-y-auto pr-1 mb-5">
                            {batchList.map((b) => (
                              <button
                                key={b.batchNumber}
                                type="button"
                                onClick={() => {
                                  setIsModalOpen(false);
                                  executePrint(b.pages, b.pageCount);
                                }}
                                className="group flex flex-col items-start p-2.5 rounded-xl border border-slate-200 bg-white hover:border-[#E8C16D] hover:bg-amber-50/30 transition text-left cursor-pointer"
                              >
                                <div className="flex items-center justify-between w-full">
                                  <span className="text-xs font-bold text-slate-800 group-hover:text-amber-800">
                                    Batch {b.batchNumber}
                                  </span>
                                  <span className="text-[10px] font-semibold text-slate-400 group-hover:text-amber-600">
                                    {b.pageCount} pgs
                                  </span>
                                </div>
                                <span className="text-[11px] text-slate-500 mt-0.5">
                                  Pages {b.startPage} – {b.endPage}
                                </span>
                              </button>
                            ))}
                          </div>

                          <div className="flex justify-end">
                            <button
                              type="button"
                              onClick={() => setIsModalOpen(false)}
                              className="w-full rounded-xl bg-slate-100 py-3 text-xs sm:text-sm font-bold text-slate-600 transition hover:bg-slate-200 active:scale-[0.98]"
                            >
                              Close
                            </button>
                          </div>
                        </>
                      );
                    })()}
                  </div>
                )}

                {/* TAB 3: CUSTOM SELECT PAGES */}
                {modalTab === "CUSTOM" && (
                  <div className="flex flex-col">
                    <div className="mb-4">
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">
                        Page Numbers or Range
                      </label>
                      <input 
                        type="text" 
                        autoFocus
                        value={pageInput}
                        onChange={(e) => setPageInput(e.target.value)}
                        placeholder="e.g. 1-20, 45, 60-80" 
                        className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-[#E8C16D] focus:ring-1 focus:ring-[#E8C16D] bg-white shadow-xs font-medium"
                      />
                      <p className="mt-1.5 text-[11px] text-slate-400">
                        Total PDF pages: {processedPdfDoc?.getPageCount() || 0}. If more than {batchSize} pages are selected, they will automatically be safely batched.
                      </p>
                    </div>
                    
                    <div className="mt-4 flex gap-3">
                      <button 
                        type="button"
                        onClick={() => setIsModalOpen(false)} 
                        className="flex-1 rounded-xl bg-slate-100 py-3 text-xs sm:text-sm font-bold text-slate-600 transition hover:bg-slate-200 active:scale-[0.98]"
                      >
                        Cancel
                      </button>
                      <button 
                        type="button"
                        onClick={handlePrintSelectedPages} 
                        className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl bg-[#0A0E1A] py-3 text-xs sm:text-sm font-bold text-[#E8C16D] shadow-sm transition hover:bg-black active:scale-[0.98]"
                      >
                        <Printer className="h-4 w-4" />
                        <span>Print Pages</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* LIVE BATCH PRINTING PROGRESS MODAL */}
      <AnimatePresence>
        {isPrinting && printProgress && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 p-4 backdrop-blur-md select-none">
            <motion.div
              initial={{ opacity: 0, scale: 0.94, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.94, y: 12 }}
              transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
              className="relative w-full max-w-md overflow-hidden rounded-3xl border border-[#E7E0D2] bg-white p-6 sm:p-8 shadow-2xl text-slate-900"
            >
              <div className="flex flex-col items-center text-center">
                {/* Status Indicator Icon */}
                <div className="relative mb-4">
                  <div className={`grid h-16 w-16 place-items-center rounded-2xl ring-1 transition-all ${
                    printProgress.isPaused
                      ? "bg-amber-50 text-amber-600 ring-amber-500/20"
                      : "bg-emerald-50 text-emerald-600 ring-emerald-500/20 animate-pulse"
                  }`}>
                    {printProgress.isPaused ? (
                      <Pause className="h-7 w-7" />
                    ) : (
                      <Printer className="h-7 w-7 stroke-[2.2]" />
                    )}
                  </div>
                  <span className="absolute -top-1.5 -right-1.5 flex h-4 w-4">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-4 w-4 bg-amber-500"></span>
                  </span>
                </div>

                <div className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700 mb-2">
                  <span>🖨️ Printer:</span>
                  <strong className="text-slate-900">{printProgress.printerName}</strong>
                </div>

                <h3 className="text-xl font-black text-slate-800">
                  {printProgress.isPaused ? "Printing Paused" : "Printing in Progress"}
                </h3>

                <p className="mt-1 text-sm font-bold text-amber-700">
                  Batch {printProgress.currentBatch} of {printProgress.totalBatches}
                  {printProgress.currentRange ? ` (${printProgress.currentRange})` : ""}
                </p>

                {/* Progress Bar */}
                <div className="w-full mt-5">
                  {(() => {
                    const pct = printProgress.totalPages > 0
                      ? Math.min(100, Math.round((printProgress.sentPages / printProgress.totalPages) * 100))
                      : 0;
                    return (
                      <>
                        <div className="h-3 w-full rounded-full bg-slate-100 overflow-hidden ring-1 ring-slate-200/50">
                          <motion.div
                            className="h-full bg-gradient-to-r from-[#E8C16D] to-amber-500 rounded-full"
                            initial={{ width: 0 }}
                            animate={{ width: `${pct}%` }}
                            transition={{ duration: 0.35, ease: "easeOut" }}
                          />
                        </div>
                        <div className="mt-2 flex justify-between text-xs font-semibold text-slate-500">
                          <span>{printProgress.sentPages} of {printProgress.totalPages} pages sent</span>
                          <span className="text-amber-700">{pct}%</span>
                        </div>
                      </>
                    );
                  })()}
                </div>

                {/* Cooldown / Waiting Banner */}
                {printProgress.countdown > 0 && !printProgress.isPaused && (
                  <div className="w-full mt-4 flex items-center justify-between rounded-2xl border border-amber-200/80 bg-amber-50/70 px-4 py-2.5 text-xs text-amber-950">
                    <div className="flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin text-amber-600" />
                      <span>Next batch in <strong>{printProgress.countdown}s</strong> (buffer cooldown)</span>
                    </div>
                    <button
                      type="button"
                      onClick={handleSkipWait}
                      className="inline-flex items-center gap-1 font-bold text-amber-700 hover:text-amber-900 cursor-pointer hover:underline"
                    >
                      <span>Send Now</span>
                      <FastForward className="h-3.5 w-3.5" />
                    </button>
                  </div>
                )}

                {printProgress.isPaused && (
                  <div className="w-full mt-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-2.5 text-xs text-amber-900 font-medium">
                    ⏸️ Printing paused. Printer buffer is clearing. Click Resume to continue.
                  </div>
                )}

                {/* Action Controls */}
                <div className="mt-6 flex gap-3 w-full">
                  <button
                    type="button"
                    onClick={handleTogglePause}
                    className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 py-3 text-xs sm:text-sm font-bold text-slate-700 transition active:scale-[0.98] shadow-xs cursor-pointer"
                  >
                    {printProgress.isPaused ? (
                      <>
                        <Play className="h-4 w-4 text-emerald-600 fill-emerald-600" />
                        <span>Resume</span>
                      </>
                    ) : (
                      <>
                        <Pause className="h-4 w-4 text-amber-600 fill-amber-600" />
                        <span>Pause</span>
                      </>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={handleStopPrint}
                    className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl border border-rose-200 bg-rose-50 hover:bg-rose-100 py-3 text-xs sm:text-sm font-bold text-rose-700 transition active:scale-[0.98] shadow-xs cursor-pointer"
                  >
                    <Square className="h-4 w-4 fill-rose-700" />
                    <span>Stop Print</span>
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </DashboardLayout>
  );
}
