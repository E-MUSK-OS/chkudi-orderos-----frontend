"use client";

import React, { useState, useEffect } from "react";
import DashboardLayout from "@/components/Dashboard/layout/DashboardLayout";
import { motion, AnimatePresence } from "framer-motion";
import { Upload, FileText, Loader2, Printer, RotateCcw, X, ListOrdered } from "lucide-react";
import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import { toast } from "sonner";
import { chromeExtensionPrintService, resolveCurrentlyConnectedPrinter } from "@/components/Dashboard/Labels/services/printAgent.service";

export default function InvoiceFormatter() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [processedPdfDoc, setProcessedPdfDoc] = useState<PDFDocument | null>(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"OPTIONS" | "SELECT">("OPTIONS");
  const [pageInput, setPageInput] = useState("");

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
      const pdfDoc = await PDFDocument.load(arrayBuffer);
      const font = await pdfDoc.embedFont(StandardFonts.Helvetica);

      const pages = pdfDoc.getPages();
      const totalPages = pages.length;

      for (let i = 0; i < pages.length; i++) {
        const page = pages[i];
        const { width, height } = page.getSize();
        
        // Add "Page X of Y" text
        const text = `Page ${i + 1} of ${totalPages}`;
        const fontSize = 8; // Made font size smaller
        const textWidth = font.widthOfTextAtSize(text, fontSize);
        
        // Shifted to the far left side
        page.drawText(text, {
          x: 15, // Bottom left corner with 15pt margin
          y: 10, 
          size: fontSize,
          font: font,
          color: rgb(0, 0, 0),
        });
      }

      setProcessedPdfDoc(pdfDoc);
      const pdfBytes = await pdfDoc.save();
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

  const executePrint = async (pagesToPrint?: number[]) => {
    if (!processedPdfDoc) return;
    
    try {
      let finalBase64 = "";

      if (pagesToPrint && pagesToPrint.length > 0) {
        // Print specific pages
        const newDoc = await PDFDocument.create();
        // PDFDocument page indices are 0-based
        const pageIndices = pagesToPrint.map(p => p - 1);
        const copiedPages = await newDoc.copyPages(processedPdfDoc, pageIndices);
        copiedPages.forEach((page) => newDoc.addPage(page));
        finalBase64 = await newDoc.saveAsBase64();
      } else {
        // Print all pages
        finalBase64 = await processedPdfDoc.saveAsBase64();
      }

      // Auto resolve printer
      toast.loading("Connecting to printer...", { id: "print-toast" });
      const availablePrinters = await chromeExtensionPrintService.getPrinters();
      const detailedPrinters = await chromeExtensionPrintService.getPrintersDetailed();
      const { printer, error } = resolveCurrentlyConnectedPrinter(availablePrinters, detailedPrinters);

      if (!printer || error) {
        toast.error(error || "No connected printer found.", { id: "print-toast" });
        return;
      }

      toast.loading(`Printing to ${printer}...`, { id: "print-toast" });
      await chromeExtensionPrintService.printPdf(finalBase64, printer, 1);
      toast.success("Printed successfully!", { id: "print-toast" });
    } catch (error: any) {
      console.error("Print Error:", error);
      toast.error(error?.message || "Failed to print.", { id: "print-toast" });
    }
  };

  const handlePrintClick = () => {
    if (!processedPdfDoc) return;
    setModalMode("OPTIONS");
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
              <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-[#0A0E1A] dark:text-white">
                Myntra Invoice Page Numbering
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 break-words">
                Upload a merged Myntra Invoice & Label PDF to automatically format page numbers.
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
            <p className="mt-4 text-sm font-medium text-slate-600">Processing PDF and formatting page numbers...</p>
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
                <p className="mb-6 text-xs text-slate-500 max-w-[280px]">
                  Select a Myntra Invoice PDF file (.pdf)
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
              className="relative w-full max-w-md overflow-hidden rounded-3xl border border-[#E7E0D2] bg-white p-6 sm:p-8 shadow-2xl text-slate-900"
            >
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="absolute top-4 right-4 grid h-8 w-8 place-items-center rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition"
              >
                <X className="h-4 w-4" />
              </button>
              
              {/* Subtle Ambient Background Glows */}
              <div className="pointer-events-none absolute -top-16 -left-16 h-44 w-44 rounded-full bg-[#FFF9EC] blur-3xl" />
              <div className="pointer-events-none absolute -bottom-16 -right-16 h-44 w-44 rounded-full bg-amber-500/10 blur-3xl" />
              
              <div className="relative">
                {modalMode === "OPTIONS" ? (
                   <div className="flex flex-col items-center text-center">
                      <div className="mb-4 grid h-14 w-14 place-items-center rounded-full bg-emerald-50 text-emerald-600 ring-1 ring-emerald-500/20">
                        <Printer className="h-6 w-6" />
                      </div>
                      <h3 className="text-xl font-bold text-slate-800">Print Options</h3>
                      <p className="mt-2 text-sm text-slate-500">
                        PDF has {processedPdfDoc?.getPageCount()} pages. What would you like to print?
                      </p>
                      
                      <div className="mt-8 flex w-full flex-col gap-3">
                        <button onClick={() => { setIsModalOpen(false); executePrint(); }} className="w-full rounded-xl bg-[#E8C16D] py-3.5 text-sm font-bold text-[#0A0E1A] shadow-sm transition hover:bg-[#d6ad53] active:scale-[0.98]">
                           Print All Pages
                        </button>
                        <button onClick={() => setModalMode("SELECT")} className="w-full rounded-xl bg-[#0A0E1A] py-3.5 text-sm font-bold text-[#E8C16D] shadow-sm transition hover:bg-black active:scale-[0.98]">
                           Select Pages
                        </button>
                        <button onClick={() => setIsModalOpen(false)} className="w-full rounded-xl bg-slate-100 py-3.5 text-sm font-bold text-slate-600 transition hover:bg-slate-200 active:scale-[0.98]">
                           Cancel
                        </button>
                      </div>
                   </div>
                ) : (
                   <div className="flex flex-col">
                      <div className="mb-6 flex items-center gap-3">
                         <div className="grid h-12 w-12 place-items-center rounded-full bg-blue-50 text-blue-600 ring-1 ring-blue-500/20">
                           <ListOrdered className="h-6 w-6" />
                         </div>
                         <div>
                           <h3 className="text-lg font-bold text-slate-800">Select Pages</h3>
                           <p className="text-xs sm:text-sm text-slate-500">Enter page numbers. Max: {processedPdfDoc?.getPageCount()}</p>
                         </div>
                      </div>
                      
                      <div className="mt-2">
                         <input 
                           type="text" 
                           autoFocus
                           value={pageInput}
                           onChange={(e) => setPageInput(e.target.value)}
                           placeholder="e.g. 1, 3-5" 
                           className="w-full rounded-xl border border-slate-300 px-4 py-3.5 text-sm outline-none transition focus:border-[#E8C16D] focus:ring-1 focus:ring-[#E8C16D] bg-white shadow-sm"
                         />
                      </div>
                      
                      <div className="mt-8 flex gap-3">
                        <button onClick={() => setIsModalOpen(false)} className="flex-1 rounded-xl bg-slate-100 py-3 text-sm font-bold text-slate-600 transition hover:bg-slate-200 active:scale-[0.98]">
                           Cancel
                        </button>
                        <button onClick={handlePrintSelectedPages} className="flex-1 rounded-xl bg-[#0A0E1A] py-3 text-sm font-bold text-[#E8C16D] shadow-sm transition hover:bg-black active:scale-[0.98]">
                           Print Pages
                        </button>
                      </div>
                   </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </DashboardLayout>
  );
}
