"use client";

import React, { useState, useEffect } from "react";
import DashboardLayout from "@/components/Dashboard/layout/DashboardLayout";
import { Upload, FileText, Loader2, Printer, RotateCcw } from "lucide-react";
import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import { toast } from "sonner";
import Swal from "sweetalert2";
import { chromeExtensionPrintService, resolveCurrentlyConnectedPrinter } from "@/components/Dashboard/Labels/services/printAgent.service";

export default function InvoiceFormatter() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [processedPdfDoc, setProcessedPdfDoc] = useState<PDFDocument | null>(null);

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
      const blob = new Blob([pdfBytes], { type: "application/pdf" });
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

  const handlePrintClick = async () => {
    if (!processedPdfDoc) return;

    const totalPages = processedPdfDoc.getPageCount();

    const result = await Swal.fire({
      title: "Print Options",
      text: `PDF has ${totalPages} pages. What would you like to print?`,
      icon: "question",
      showDenyButton: true,
      showCancelButton: true,
      confirmButtonText: "All Pages",
      denyButtonText: "Select Pages",
      cancelButtonText: "Cancel",
      confirmButtonColor: "#10b981", // emerald-500
      denyButtonColor: "#3b82f6", // blue-500
    });

    if (result.isConfirmed) {
      // All Pages
      await executePrint();
    } else if (result.isDenied) {
      // Select Pages
      const { value: pageInput } = await Swal.fire({
        title: "Select Pages",
        input: "text",
        inputLabel: `Enter page numbers (e.g. 1, 3-5). Max: ${totalPages}`,
        inputPlaceholder: "1, 3-5",
        showCancelButton: true,
        inputValidator: (value) => {
          if (!value) return "You need to enter page numbers!";
        }
      });

      if (pageInput) {
        const pagesToPrint = parsePageNumbers(pageInput, totalPages);
        if (pagesToPrint.length === 0) {
          toast.error("Invalid page range specified.");
          return;
        }
        await executePrint(pagesToPrint);
      }
    }
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
    </DashboardLayout>
  );
}
