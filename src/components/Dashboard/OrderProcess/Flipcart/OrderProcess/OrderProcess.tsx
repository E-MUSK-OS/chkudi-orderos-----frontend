"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  UploadCloud,
  FileText,
  CheckCircle2,
  AlertCircle,
  Trash2,
  ArrowRight,
  FileCheck,
  RotateCcw,
  Plus,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import DashboardLayout from "@/components/Dashboard/layout/DashboardLayout";
import ProcessingProgressModal from "./components/ProcessingProgressModal";
import { useFlipcartOrderStore, saveBatchBlobToIDB } from "./store/useFlipcartOrderStore";
import { processFlipcartPdfs } from "./utils/flipcartPdfProcessor";
import {
  setCachedFlipcartDocs,
  getDocCacheKey,
  startBackgroundFlipcartPdfPrewarming,
} from "./utils/flipcartPdfCache";
import { usePagePermissions } from "@/utils/pagePermissions";
import FlipcartProcessHistoryDropdown from "./components/FlipcartProcessHistoryDropdown";
import { flipcartOrderService } from "./services/flipcartOrder.service";

export default function FlipcartOrderProcess() {
  const router = useRouter();
  const { canCreate } = usePagePermissions("order-process/flipcart/order-process");

  const [pdfFiles, setPdfFiles] = useState<File[]>([]);
  const [pdfError, setPdfError] = useState<string | null>(null);
  const [isDraggingPdf, setIsDraggingPdf] = useState(false);

  const {
    isProcessing,
    progress,
    currentStage,
    summary,
    setProcessing,
    setProgress,
    setProcessData,
    clearProcessData,
    restoreProcessData,
  } = useFlipcartOrderStore();

  const pdfInputRef = useRef<HTMLInputElement>(null);

  // Guard against accidental tab closure during active processing
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isProcessing) {
        e.preventDefault();
        e.returnValue = "Order processing is currently in progress. Are you sure you want to leave?";
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [isProcessing]);

  // Prefetch result page bundle ahead of time
  useEffect(() => {
    router.prefetch("/dashboard/order-process/flipcart/order-process/result");
    return () => {
      setProcessing(false);
    };
  }, [router, setProcessing]);

  // If an active batch already exists, redirect to results (matching Amazon)
  useEffect(() => {
    if (isProcessing) return;
    if (summary) {
      router.push("/dashboard/order-process/flipcart/order-process/result");
      return;
    }
    restoreProcessData().then((hasBatch) => {
      if (hasBatch) {
        router.push("/dashboard/order-process/flipcart/order-process/result");
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

  // Reset all
  const handleResetAll = () => {
    handleRemoveAllPdfs();
    clearProcessData();
    toast.info("Upload form cleared.");
  };

  const isReadyToSubmit = pdfFiles.length > 0;
  const totalPdfSize = pdfFiles.reduce((sum, f) => sum + f.size, 0);

  // Submit Handler: Process Flipcart PDFs and navigate to Results!
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!canCreate) {
      toast.error("Access denied. You do not have permission to process new batches.");
      return;
    }

    if (pdfFiles.length === 0) {
      toast.error("Please upload at least one PDF file before submitting.");
      return;
    }

    setProcessing(true);
    setProgress(10, "Preparing documents...");

    try {
      const result = await processFlipcartPdfs(pdfFiles, (pct, stage) => {
        setProgress(pct, stage);
      });

      const directUrls = {
        shippingLabelsPdfUrl: URL.createObjectURL(result.blobs.shippingLabelsBlob),
        taxInvoicesPdfUrl: URL.createObjectURL(result.blobs.taxInvoicesBlob),
        originalPdfUrl: URL.createObjectURL(result.blobs.originalBlob),
      };

      setProcessData(result.summary, result.files, directUrls);

      // Immediately cache shipping label PDF document and kick off background single-order prewarming
      if (result.shippingDoc) {
        setCachedFlipcartDocs({
          shippingDoc: result.shippingDoc,
          shippingBytes: result.shippingBytes || null,
          cacheKey: getDocCacheKey(result.files),
        });
        if (result.summary.orders && result.summary.orders.length > 0) {
          startBackgroundFlipcartPdfPrewarming(result.summary.orders, result.shippingDoc);
        }
      }

      // NON-BLOCKING BACKGROUND SYNC: Save batch to database in background
      useFlipcartOrderStore.setState({ historySyncStatus: "syncing" });
      (async () => {
        try {
          const fullFormData = new FormData();
          fullFormData.append("summary", JSON.stringify(result.summary));
          fullFormData.append("results", JSON.stringify(result.summary.orders || []));

          if (result.blobs.shippingLabelsBlob) {
            fullFormData.append(
              "shippingLabelsPdf",
              new File([result.blobs.shippingLabelsBlob], "shipping_labels.pdf", {
                type: "application/pdf",
              })
            );
          }
          if (result.blobs.taxInvoicesBlob) {
            fullFormData.append(
              "taxInvoicesPdf",
              new File([result.blobs.taxInvoicesBlob], "tax_invoices.pdf", {
                type: "application/pdf",
              })
            );
          }
          if (result.blobs.originalBlob) {
            fullFormData.append(
              "originalPdf",
              new File([result.blobs.originalBlob], "original_pdf.pdf", {
                type: "application/pdf",
              })
            );
          }

          const saveRes = await flipcartOrderService.saveBatch(fullFormData);

          if (saveRes?.success && saveRes.data?.id) {
            useFlipcartOrderStore.setState({
              activeHistoryBatchId: saveRes.data.id,
              historySyncStatus: "synced",
            });
            if (result.blobs.shippingLabelsBlob) {
              saveBatchBlobToIDB(saveRes.data.id, result.blobs.shippingLabelsBlob);
            }
            useFlipcartOrderStore.getState().fetchHistoryBatches();
            toast.success("Batch data and files successfully saved to 7-day history.");
          } else {
            useFlipcartOrderStore.setState({ historySyncStatus: "error" });
            toast.error("Failed to save to 7-day cloud history.");
          }
        } catch (err: any) {
          console.error("Background batch save error:", err);
          useFlipcartOrderStore.setState({ historySyncStatus: "error" });
        }
      })();

      toast.success(
        `Successfully processed ${result.summary.totalOrders} order(s)! Shipping labels ready.`
      );

      // Navigate directly to result page
      router.push("/dashboard/order-process/flipcart/order-process/result");
    } catch (err: unknown) {
      setProcessing(false);
      const message = err instanceof Error ? err.message : "Processing failed.";
      toast.error(message);
    }
  };

  return (
    <DashboardLayout title="Flipcart Order Process">
      <div className="space-y-4 sm:space-y-6">
        {/* Real-time Progress Modal */}
        <ProcessingProgressModal
          isOpen={isProcessing}
          progress={progress}
          currentStage={currentStage}
        />

        {/* Header Information Banner matching Amazon Order Process */}
        <div className="rounded-3xl border border-[#E7E0D2] dark:border-white/[0.08] bg-white dark:bg-[#0F1626] p-4 sm:p-7 shadow-sm">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="space-y-1.5 min-w-0 max-w-2xl">
              <h1 className="text-xl sm:text-2xl md:text-[26px] font-black tracking-tight text-[#0A0E1A] dark:text-white">
                Flipcart Order Processing
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                Upload PDF documents to automatically organize shipping labels and tax invoices.
              </p>
            </div>

            {/* Progress Badge & 7-Day History Dropdown */}
            <div className="flex flex-wrap items-center gap-2 sm:gap-3 shrink-0 self-start md:self-center">
              <FlipcartProcessHistoryDropdown />
              <div className="inline-flex h-9 sm:h-11 items-center px-3 sm:px-4 rounded-xl sm:rounded-2xl border border-[#E7E0D2] dark:border-white/[0.08] bg-slate-50/80 dark:bg-white/[0.02] shadow-xs">
                <div className="text-xs sm:text-sm font-bold text-[#0A0E1A] dark:text-white whitespace-nowrap">
                  <span className={pdfFiles.length > 0 ? "text-emerald-700 dark:text-emerald-400" : "text-slate-400 dark:text-slate-500"}>
                    {pdfFiles.length} PDF{pdfFiles.length !== 1 ? "s" : ""}
                  </span>
                  {pdfFiles.length > 0 && (
                    <>
                      <span className="text-slate-300 dark:text-slate-700 mx-1.5">•</span>
                      <span className="text-emerald-700 dark:text-emerald-400 font-medium">
                        {formatFileSize(totalPdfSize)}
                      </span>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Single File Upload Section - PDF Only */}
        <div className="grid grid-cols-1">
          <div className="flex flex-col rounded-2xl sm:rounded-3xl border border-[#E7E0D2] dark:border-white/[0.08] bg-white dark:bg-[#0F1626] p-4 sm:p-6 shadow-sm transition-all hover:border-[#E8C16D]/40 hover:shadow-md dark:hover:border-[#F5C451]/50 dark:hover:shadow-[0_8px_30px_rgba(0,0,0,0.5)]">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-white/[0.06] pb-3 sm:pb-3.5 gap-2">
              <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
                <div className="grid h-10 w-10 sm:h-11 sm:w-11 place-items-center rounded-2xl bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 border border-red-200/60 dark:border-red-900/40 shrink-0">
                  <FileText className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <h3 className="font-bold text-[#0A0E1A] dark:text-white text-sm sm:text-base truncate">
                    PDF Orders / Invoices {pdfFiles.length > 0 ? `(${pdfFiles.length})` : ""}
                  </h3>
                  <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 truncate">
                    Upload one or multiple .pdf files containing Flipcart shipping labels and invoices
                  </p>
                </div>
              </div>

              {pdfFiles.length > 0 ? (
                <span className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-0.5 text-xs font-bold text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/40 shrink-0">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  {pdfFiles.length} Ready
                </span>
              ) : (
                <span className="inline-flex items-center rounded-lg bg-amber-50 dark:bg-amber-950/40 px-2.5 py-0.5 text-xs font-bold text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800/40 shrink-0">
                  Required
                </span>
              )}
            </div>

            {/* Upload Box / Selected Files View */}
            <div className="mt-4 sm:mt-5 flex-1 flex flex-col justify-between">
              {pdfFiles.length === 0 ? (
                <div
                  onClick={() => pdfInputRef.current?.click()}
                  onDragOver={handlePdfDragOver}
                  onDragLeave={handlePdfDragLeave}
                  onDrop={handlePdfDrop}
                  className={`group relative flex min-h-[180px] sm:min-h-[220px] xl:min-h-[240px] cursor-pointer flex-col items-center justify-center rounded-2xl sm:rounded-3xl border-2 border-dashed p-4 sm:p-6 text-center transition-all ${
                    isDraggingPdf
                      ? "border-[#E8C16D] bg-[#FFF9EC] dark:bg-[#1A160E]"
                      : "border-[#E7E0D2] dark:border-white/[0.08] bg-[#FAF8F5] dark:bg-white/[0.02] hover:border-[#E8C16D] hover:bg-[#FFFDF5] dark:hover:bg-white/[0.04]"
                  }`}
                >
                  <div className="mb-2 sm:mb-2.5 grid h-11 w-11 sm:h-14 sm:w-14 place-items-center rounded-xl sm:rounded-2xl bg-white dark:bg-[#0A0E1A] text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-white/[0.08] shadow-xs transition-all group-hover:scale-110 group-hover:border-[#E8C16D] group-hover:text-red-600 dark:group-hover:text-red-400">
                    <UploadCloud className="h-5 w-5 sm:h-7 sm:w-7" />
                  </div>

                  <p className="text-xs sm:text-sm font-bold text-[#0A0E1A] dark:text-white">
                    Click to upload or drag & drop PDF(s)
                  </p>
                  <p className="mt-0.5 text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 max-w-xs sm:max-w-none">
                    Select one or multiple Adobe PDF (<code className="font-mono text-red-600 dark:text-red-400 font-semibold">.pdf</code>) files
                  </p>

                  <div className="mt-2.5 sm:mt-3 inline-flex items-center gap-1.5 text-[11px] sm:text-xs font-bold text-[#0A0E1A] dark:text-white bg-white dark:bg-[#0A0E1A] px-3 sm:px-3.5 py-1.5 sm:py-2 rounded-xl border border-slate-200 dark:border-white/[0.08] shadow-2xs group-hover:border-[#E8C16D] transition active:scale-[0.98]">
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
                  className={`flex min-h-[190px] sm:min-h-[220px] xl:min-h-[240px] flex-col justify-between rounded-2xl border-2 p-3 sm:p-4 transition-all cursor-pointer ${
                    isDraggingPdf
                      ? "border-[#E8C16D] bg-[#FFF9EC] dark:bg-[#1A160E]"
                      : "border-emerald-200 dark:border-emerald-800/40 bg-emerald-50/20 dark:bg-emerald-950/10 hover:border-[#E8C16D]/70"
                  }`}
                >
                  <div className="flex-1 flex flex-col min-h-0">
                    {/* Scrollable file cards */}
                    <div
                      onClick={(e) => e.stopPropagation()}
                      className="max-h-48 sm:max-h-56 overflow-y-auto space-y-2 pr-1 cursor-default"
                    >
                      {pdfFiles.map((file, idx) => (
                        <div
                          key={`${file.name}_${idx}`}
                          className="flex items-center justify-between gap-2.5 rounded-xl border border-[#E7E0D2] dark:border-white/[0.08] bg-white dark:bg-[#080B11] p-2.5 sm:p-3 shadow-2xs hover:border-[#E8C16D]/40 transition"
                        >
                          <div className="flex items-center gap-2.5 min-w-0 flex-1">
                            <div className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 border border-red-200/50 dark:border-red-900/40">
                              <FileCheck className="h-4 w-4" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-xs font-bold text-[#0A0E1A] dark:text-white" title={file.name}>
                                {file.name}
                              </p>
                              <p className="text-[10px] sm:text-[11px] text-slate-500 dark:text-slate-400 font-medium">
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
                            className="grid h-7 w-7 shrink-0 place-items-center rounded-lg text-slate-400 hover:bg-red-50 dark:hover:bg-red-950/40 hover:text-red-600 dark:hover:text-red-400 transition cursor-pointer"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Footer summary bar */}
                  <div className="mt-3 pt-2.5 border-t border-emerald-200/70 dark:border-emerald-800/40 flex flex-wrap sm:flex-nowrap items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-900 dark:text-emerald-200 min-w-0 truncate">
                      <span className="whitespace-nowrap">{pdfFiles.length} file{pdfFiles.length > 1 ? "s" : ""}</span>
                      <span className="text-slate-400 dark:text-slate-500">•</span>
                      <span className="text-emerald-700 dark:text-emerald-400 font-medium truncate">{formatFileSize(totalPdfSize)}</span>
                    </div>

                    <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto justify-end">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          pdfInputRef.current?.click();
                        }}
                        className="inline-flex items-center gap-1.5 text-xs font-bold text-[#0A0E1A] dark:text-[#E8C16D] bg-[#FFF9EC] dark:bg-[#1A160E] hover:bg-[#FFF3D6] dark:hover:bg-[#251E11] px-3 py-1.5 rounded-xl border border-[#E8C16D] ring-2 ring-[#E8C16D]/20 shadow-xs transition active:scale-[0.98] cursor-pointer"
                      >
                        <Plus className="h-3.5 w-3.5 text-[#B88728] dark:text-[#E8C16D]" />
                        <span>Add More</span>
                      </button>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemoveAllPdfs();
                        }}
                        className="inline-flex items-center gap-1.5 text-xs font-bold text-red-600 dark:text-red-400 bg-white dark:bg-[#080B11] hover:bg-red-50 dark:hover:bg-red-950/40 px-3 py-1.5 rounded-xl border border-red-200 dark:border-red-900/40 hover:border-red-300 shadow-xs transition active:scale-[0.98] cursor-pointer"
                      >
                        <Trash2 className="h-3.5 w-3.5 text-red-500 dark:text-red-400" />
                        <span>Clear All</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Hidden File Input */}
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
                <div className="mt-3 flex items-center gap-2 rounded-xl bg-red-50 dark:bg-red-950/40 p-2.5 sm:p-3 text-xs text-red-700 dark:text-red-300 border border-red-200 dark:border-red-900/40">
                  <AlertCircle className="h-4 w-4 shrink-0 text-red-600 dark:text-red-400" />
                  <span>{pdfError}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-between gap-3 sm:gap-4 rounded-2xl sm:rounded-3xl border border-[#E7E0D2] dark:border-white/[0.08] bg-white dark:bg-[#0F1626] p-3.5 sm:p-5 shadow-sm">
          <button
            type="button"
            disabled={pdfFiles.length === 0}
            onClick={handleResetAll}
            className="inline-flex h-10 sm:h-12 items-center justify-center gap-2 rounded-xl sm:rounded-2xl border border-slate-200 dark:border-white/[0.08] bg-slate-100 dark:bg-white/[0.04] px-4 sm:px-5 text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-300 hover:bg-red-50 dark:hover:bg-red-950/30 hover:text-red-600 dark:hover:text-red-400 hover:border-red-200 dark:hover:border-red-900/40 transition shadow-xs active:scale-[0.98] cursor-pointer disabled:opacity-40 disabled:hover:bg-slate-100 disabled:hover:text-slate-700"
          >
            <RotateCcw className="h-4 w-4" />
            <span>Clear All</span>
          </button>

          <div className="flex w-full items-center gap-3 sm:w-auto">
            <button
              type="button"
              disabled={!isReadyToSubmit || isProcessing || !canCreate}
              onClick={handleSubmit}
              className="w-full sm:w-auto inline-flex h-10 sm:h-12 items-center justify-center gap-2 rounded-xl sm:rounded-2xl border border-transparent bg-[#E8C16D] px-6 sm:px-8 text-xs sm:text-sm font-bold text-[#0A0E1A] shadow-xs hover:bg-[#d4af5a] transition active:scale-[0.98] cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Processing Files...</span>
                </>
              ) : isReadyToSubmit ? (
                <>
                  <span className="sm:hidden">
                    Process Orders ({pdfFiles.length} File{pdfFiles.length > 1 ? "s" : ""})
                  </span>
                  <span className="hidden sm:inline">
                    Verify & Process ({pdfFiles.length} PDF{pdfFiles.length > 1 ? "s" : ""})
                  </span>
                  <ArrowRight className="h-4 w-4" />
                </>
              ) : (
                <>
                  <span>Upload PDF File</span>
                  <ArrowRight className="h-4 w-4 opacity-50" />
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
