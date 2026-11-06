"use client";

import React, { useEffect } from "react";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";
import ReactSelect, { SelectOption } from "@/components/ui/ReactSelect";
import { Loader2, Printer, CheckCircle2, XCircle, AlertTriangle } from "lucide-react";
import { LabelTemplate, ProductLookupResult } from "../types/label.types";
import { GenerateRow, useLabelPrintJob } from "../hooks/useLabelPrintJob";
import { renderLabelToCanvas } from "@/lib/labelRenderer";

interface PrintExecutionModalProps {
  open: boolean;
  onClose: () => void;
  template: LabelTemplate | null;
  rows: GenerateRow[];
  onComplete: (succeededRowIds: Set<number>) => void;
}

export default function PrintExecutionModal({
  open,
  onClose,
  template,
  rows,
  onComplete,
}: PrintExecutionModalProps) {
  const {
    step,
    queue,
    selectedForPrint,
    printers,
    helperOnline,
    helperStatus,
    selectedPrinter,
    setSelectedPrinter,
    successfulJobs,
    failedJobs,
    runMatching,
    toggleQueueRow,
    proceedToPrinter,
    refreshPrinters,
    startPrinting,
    printViaBrowser,
    retryFailed,
  } = useLabelPrintJob(template, rows);

  useEffect(() => {
    if (open) {
      runMatching();
    }
  }, [open, runMatching]);

  const handleDone = () => {
    const succeededIds = new Set(successfulJobs.map(j => j.rowId));
    onComplete(succeededIds);
    onClose();
  };

  const renderMatching = () => (
    <div className="flex flex-col items-center justify-center py-12">
      <Loader2 className="h-10 w-10 animate-spin text-[#E8C16D] mb-4" />
      <p className="text-lg text-[#0A0E1A] dark:text-white">Looking up products...</p>
    </div>
  );

  const renderReview = () => {
    const readyCount = selectedForPrint.size;

    return (
      <div className="flex flex-col h-full space-y-4">
        <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 font-medium">Review matched products. Uncheck any rows you do not wish to print.</p>
        <div className="overflow-x-auto rounded-2xl border border-[#E7E0D2] dark:border-white/[0.08] bg-white dark:bg-[#0F1626] shadow-xs">
          <table className="w-full text-left border-collapse font-sans text-xs sm:text-sm">
            <thead className="bg-[#FEFAEE] dark:bg-none dark:bg-[#080B11] text-xs sm:text-sm font-bold tracking-wider text-[#6A4D1D] dark:text-[#E8C16D] border-b border-[#F5E6BE] dark:border-white/[0.08]">
              <tr>
                <th className="px-4 py-3 border-r border-slate-800 dark:border-white/[0.08] w-12 text-center">Print</th>
                <th className="px-4 py-3 border-r border-slate-800 dark:border-white/[0.08]">SKU</th>
                <th className="px-4 py-3 border-r border-slate-800 dark:border-white/[0.08] w-48">Status</th>
                <th className="px-4 py-3 w-40 text-center">Preview</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E7E0D2] dark:divide-white/[0.06]">
              {queue.map((item) => (
                <tr key={item.rowId} className="hover:bg-slate-50/80 dark:hover:bg-white/[0.06] transition-colors">
                  <td className="px-4 py-3 text-center border-r border-[#E7E0D2] dark:border-white/[0.06]">
                    <input
                      type="checkbox"
                      checked={selectedForPrint.has(item.rowId)}
                      onChange={(e) => toggleQueueRow(item.rowId, e.target.checked)}
                      disabled={item.status === "not_found" || item.status === "error"}
                      className="w-4 h-4 rounded cursor-pointer accent-[#0A0E1A] dark:accent-[#E8C16D]"
                    />
                  </td>
                  <td className="px-4 py-3 border-r border-[#E7E0D2] dark:border-white/[0.06] font-semibold text-slate-900 dark:text-white">
                    {item.lookupSku || "-"}
                  </td>
                  <td className="px-4 py-3 border-r border-[#E7E0D2] dark:border-white/[0.06]">
                    {item.status === "matched" && (
                      <span className="flex items-center text-emerald-700 dark:text-emerald-400 font-medium">
                        <CheckCircle2 className="w-4 h-4 mr-1 text-emerald-600 dark:text-emerald-400" /> Matched
                      </span>
                    )}
                    {item.status === "multiple_matches" && (
                      <span className="flex items-center text-amber-700 dark:text-amber-400 font-medium">
                        <AlertTriangle className="w-4 h-4 mr-1 text-amber-600 dark:text-amber-400" /> Multiple Matches (Using 1st)
                      </span>
                    )}
                    {item.status === "not_found" && (
                      <span className="flex items-center text-rose-600 dark:text-rose-400 font-medium">
                        <XCircle className="w-4 h-4 mr-1" /> Not Found
                      </span>
                    )}
                    {item.status === "error" && (
                      <span className="flex items-center text-rose-600 dark:text-rose-400 text-xs font-medium">
                        <XCircle className="w-4 h-4 mr-1" /> {item.errorMessage}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 flex justify-center">
                    {(item.status === "matched" || item.status === "multiple_matches") ? (
                      <LabelPreviewThumbnail template={template} data={item.product} />
                    ) : (
                      <div className="text-slate-400 dark:text-slate-500 text-xs">-</div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="flex flex-col sm:flex-row sm:justify-between items-stretch sm:items-center gap-2 pt-3">
          <span className="text-[#0A0E1A] dark:text-white font-semibold text-xs sm:text-sm">{readyCount} of {queue.length} ready to print</span>
          <button
            type="button"
            onClick={proceedToPrinter}
            disabled={readyCount === 0}
            className="w-full sm:w-auto h-10.5 sm:h-11 inline-flex items-center justify-center rounded-2xl border border-transparent bg-[#E8C16D] px-6 text-xs sm:text-sm font-bold text-[#0A0E1A] hover:bg-[#d4af5a] shadow-xs active:scale-[0.98] transition cursor-pointer disabled:opacity-50"
          >
            Continue
          </button>
        </div>
      </div>
    );
  };

  const renderPrinter = () => {
    const labelCount = selectedForPrint.size > 0 ? selectedForPrint.size : queue.length;
    const printerOptions: SelectOption[] = printers.map((p) => ({
      label: p,
      value: p,
    }));
    const currentPrinterOption =
      printerOptions.find((p) => p.value === selectedPrinter) ??
      (selectedPrinter ? { label: selectedPrinter, value: selectedPrinter } : null);

    return (
      <div className="flex flex-col space-y-6">
        <p className="text-[#0A0E1A] dark:text-slate-200">Select a printer to send {labelCount} labels to.</p>
        
        <div className="flex items-center space-x-3 p-4 bg-slate-100 dark:bg-[#080B11] rounded-2xl border border-slate-200 dark:border-white/[0.08]">
          <div className={`w-3 h-3 rounded-full ${helperOnline ? "bg-green-500" : helperStatus === "checking" ? "bg-yellow-400 animate-pulse" : "bg-red-500"}`} />
          <span className="font-medium text-[#0A0E1A] dark:text-white">
            Chrome Print Extension: {helperOnline ? "Active" : helperStatus === "checking" ? "Checking..." : "Offline / Not Found"}
          </span>
          {!helperOnline && helperStatus !== "checking" && (
            <Button
              variant="ghost"
              size="sm"
              onClick={refreshPrinters}
              className="ml-auto text-[#0A0E1A] dark:text-[#E8C16D]"
            >
              Retry Connection
            </Button>
          )}
        </div>

        {helperStatus === "extension-missing" && (
          <div className="bg-amber-900/20 border border-amber-900/50 text-amber-400 p-4 rounded-2xl text-sm space-y-1">
            <p className="font-semibold">Chrome Print Extension (PrintBridge) Not Detected</p>
            <p>
              Please make sure the PrintBridge Chrome extension is installed and enabled in Google Chrome or Microsoft Edge.
            </p>
          </div>
        )}

        {helperStatus === "no-printers" && (
          <div className="bg-amber-900/20 border border-amber-900/50 text-amber-400 p-4 rounded-2xl text-sm space-y-1">
            <p className="font-semibold">No Printers Found</p>
            <p>
              The print extension is active, but no system printers were returned. Ensure your printer is connected and powered on.
            </p>
          </div>
        )}

        {helperStatus === "no-internet" && (
          <div className="bg-red-900/20 border border-red-900/50 text-red-400 p-4 rounded-2xl text-sm">
            Your computer has no network connection. Please reconnect and click Retry Connection.
          </div>
        )}

        {helperStatus === "unsupported-browser" && (
          <div className="bg-stone-800 border border-stone-700 text-stone-300 p-4 rounded-2xl text-sm">
            Your browser does not support silent extension printing. Please switch to Google Chrome or Microsoft Edge for the best experience.
          </div>
        )}

        {helperStatus === "error" && (
          <div className="bg-red-900/20 border border-red-900/50 text-red-400 p-4 rounded-2xl text-sm">
            Failed to connect to the Chrome Print extension. Click Retry Connection to try again.
          </div>
        )}

        <div className="space-y-2">
          <label className="text-sm font-semibold text-[#0A0E1A] dark:text-white">Printer</label>
          <ReactSelect
            menuPortalTarget={typeof window !== "undefined" ? document.body : undefined}
            options={printerOptions}
            value={currentPrinterOption}
            onChange={(opt) => setSelectedPrinter(opt?.value ?? "")}
            isDisabled={!helperOnline || printers.length === 0}
            placeholder={
              !helperOnline
                ? "Offline"
                : printers.length === 0
                ? "No printers found"
                : "Select a printer..."
            }
            borderRadius={14}
            height={42}
          />
        </div>

        <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2.5 sm:gap-3 pt-4">
          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto h-10.5 sm:h-11 inline-flex items-center justify-center rounded-2xl border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-[#080B11] px-5 text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-white/[0.04] transition active:scale-[0.98] cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={printViaBrowser}
            disabled={labelCount === 0}
            className="w-full sm:w-auto h-10.5 sm:h-11 inline-flex items-center justify-center gap-2 rounded-2xl border border-[#E8C16D] dark:border-[#E8C16D]/40 bg-[#FFF9EC] dark:bg-[#1A160E] px-5 text-xs sm:text-sm font-bold text-[#0A0E1A] dark:text-[#E8C16D] hover:bg-[#FFF3D6] dark:hover:bg-[#251F14] ring-1 ring-[#E8C16D]/30 transition active:scale-[0.98] cursor-pointer disabled:opacity-50"
          >
            <Printer className="w-4 h-4 text-[#B88728] dark:text-[#E8C16D]" />
            <span>Browser Print (Default)</span>
          </button>
          <button
            type="button"
            onClick={() => startPrinting(selectedPrinter)}
            disabled={labelCount === 0 || !selectedPrinter}
            className="w-full sm:w-auto h-10.5 sm:h-11 inline-flex items-center justify-center gap-2 rounded-2xl border border-transparent bg-[#E8C16D] px-5 text-xs sm:text-sm font-bold text-[#0A0E1A] hover:bg-[#d4af5a] shadow-xs active:scale-[0.98] transition cursor-pointer disabled:opacity-50"
          >
            <Printer className="w-4 h-4" />
            <span>Silent Print (Extension)</span>
          </button>
        </div>
      </div>
    );
  };

  const renderPrinting = () => {
    const total = selectedForPrint.size > 0 ? selectedForPrint.size : queue.length;
    const completed = queue.filter(q => (selectedForPrint.size > 0 ? selectedForPrint.has(q.rowId) : true) && q.status !== "pending").length;

    return (
      <div className="flex flex-col h-full space-y-6">
        <div className="flex flex-col items-center justify-center space-y-4 py-8">
          <Loader2 className="w-10 h-10 animate-spin text-[#E8C16D]" />
          <h3 className="text-xl font-bold text-[#0A0E1A] dark:text-white">
            Printing {completed} of {total}...
          </h3>
        </div>

        <div className="overflow-x-auto rounded-2xl border border-[#E7E0D2] dark:border-white/[0.08] bg-white dark:bg-[#0F1626] shadow-xs max-h-64">
          <table className="w-full text-left border-collapse text-xs sm:text-sm font-sans">
            <tbody className="divide-y divide-[#E7E0D2] dark:divide-white/[0.06]">
              {queue.filter(q => (selectedForPrint.size > 0 ? selectedForPrint.has(q.rowId) : true)).map(item => (
                <tr key={item.rowId} className="hover:bg-slate-50/80 dark:hover:bg-white/[0.06] transition-colors">
                  <td className="px-4 py-2.5 font-semibold text-slate-900 dark:text-white">{item.lookupSku}</td>
                  <td className="px-4 py-2.5 text-right">
                    {item.status === "pending" && <span className="text-slate-500 dark:text-slate-400 font-medium">Sending...</span>}
                    {item.status === "matched" && <span className="text-emerald-600 dark:text-emerald-400 font-medium inline-flex items-center"><CheckCircle2 className="w-4 h-4 mr-1"/> Sent</span>}
                    {item.status === "error" && <span className="text-rose-600 dark:text-rose-400 font-medium inline-flex items-center"><XCircle className="w-4 h-4 mr-1"/> Failed</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const renderSummary = () => {
    const total = selectedForPrint.size > 0 ? selectedForPrint.size : queue.length;
    const failed = failedJobs.length;
    const success = successfulJobs.length;

    return (
      <div className="flex flex-col items-center justify-center space-y-6 py-6">
        {failed > 0 ? (
          <AlertTriangle className="w-12 h-12 text-amber-500" />
        ) : (
          <CheckCircle2 className="w-12 h-12 text-emerald-500" />
        )}
        
        <div className="text-center">
          <h3 className="text-2xl font-bold text-[#0A0E1A] dark:text-white mb-2">Print Job Complete</h3>
          <p className="text-base text-slate-700 dark:text-slate-300">
            {success} of {total} labels sent successfully. {failed > 0 && <span className="text-rose-600 dark:text-rose-400 font-bold">{failed} failed.</span>}
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
            Note: &quot;Sent successfully&quot; means the job was handed to the Windows print spooler.
          </p>
        </div>

        <div className="flex items-center gap-3 pt-4">
          {failed > 0 && (
            <button
              type="button"
              onClick={retryFailed}
              className="h-10.5 sm:h-11 inline-flex items-center justify-center rounded-2xl border border-[#E8C16D] dark:border-[#E8C16D]/40 bg-[#FFF9EC] dark:bg-[#1A160E] px-5 text-xs sm:text-sm font-bold text-[#0A0E1A] dark:text-[#E8C16D] hover:bg-[#FFF3D6] dark:hover:bg-[#251F14] ring-1 ring-[#E8C16D]/30 transition active:scale-[0.98] cursor-pointer"
            >
              Retry Failed
            </button>
          )}
          <button
            type="button"
            onClick={handleDone}
            className="h-10.5 sm:h-11 inline-flex items-center justify-center rounded-2xl border border-transparent bg-[#E8C16D] px-6 text-xs sm:text-sm font-bold text-[#0A0E1A] hover:bg-[#d4af5a] shadow-xs active:scale-[0.98] transition cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    );
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Print Labels"
      size="lg"
    >
      {step === "matching" && renderMatching()}
      {step === "review" && renderReview()}
      {step === "printer" && renderPrinter()}
      {step === "printing" && renderPrinting()}
      {step === "summary" && renderSummary()}
    </Modal>
  );
}

function LabelPreviewThumbnail({ template, data }: { template: LabelTemplate | null; data?: Partial<ProductLookupResult> }) {
  const canvasRef = React.useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!template || !canvasRef.current) return;
    renderLabelToCanvas(template, data || {}, 1).then((canvas) => {
      if (canvasRef.current) {
        const ctx = canvasRef.current.getContext("2d");
        if (ctx) {
          canvasRef.current.width = canvas.width;
          canvasRef.current.height = canvas.height;
          ctx.drawImage(canvas, 0, 0);
        }
      }
    });
  }, [template, data]);

  return (
    <div className="border border-slate-200 dark:border-white/[0.08] shadow-sm p-1 bg-white dark:bg-[#111827] inline-block rounded">
      <canvas ref={canvasRef} className="max-w-[120px] max-h-[80px]" />
    </div>
  );
}
