"use client";

import React, { useEffect } from "react";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";
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
      <p className="text-lg text-[#0A0E1A]">Looking up products...</p>
    </div>
  );

  const renderReview = () => {
    const readyCount = selectedForPrint.size;

    return (
      <div className="flex flex-col h-full space-y-4">
        <p className="text-[#0A0E1A]">Review matched products. Uncheck any rows you do not wish to print.</p>
        <div className="overflow-x-auto border rounded">
          <table className="w-full text-left border-collapse">
            <thead className="bg-[#0A0E1A] text-white">
              <tr>
                <th className="px-4 py-2 border w-12 text-center">Print</th>
                <th className="px-4 py-2 border">SKU</th>
                <th className="px-4 py-2 border w-48">Status</th>
                <th className="px-4 py-2 border w-40">Preview</th>
              </tr>
            </thead>
            <tbody>
              {queue.map((item) => (
                <tr key={item.rowId} className="hover:bg-slate-50 border-b">
                  <td className="px-4 py-2 text-center border-r">
                    <input
                      type="checkbox"
                      checked={selectedForPrint.has(item.rowId)}
                      onChange={(e) => toggleQueueRow(item.rowId, e.target.checked)}
                      disabled={item.status === "not_found" || item.status === "error"}
                      className="w-4 h-4 cursor-pointer"
                    />
                  </td>
                  <td className="px-4 py-2 border-r font-medium text-slate-800">
                    {item.lookupSku || "-"}
                  </td>
                  <td className="px-4 py-2 border-r">
                    {item.status === "matched" && (
                      <span className="flex items-center text-green-700">
                        <CheckCircle2 className="w-4 h-4 mr-1" /> Matched
                      </span>
                    )}
                    {item.status === "multiple_matches" && (
                      <span className="flex items-center text-yellow-600 font-medium">
                        <AlertTriangle className="w-4 h-4 mr-1" /> Multiple Matches (Using 1st)
                      </span>
                    )}
                    {item.status === "not_found" && (
                      <span className="flex items-center text-red-600">
                        <XCircle className="w-4 h-4 mr-1" /> Not Found
                      </span>
                    )}
                    {item.status === "error" && (
                      <span className="flex items-center text-red-600 text-sm">
                        <XCircle className="w-4 h-4 mr-1" /> {item.errorMessage}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-2 flex justify-center">
                    {(item.status === "matched" || item.status === "multiple_matches") ? (
                      <LabelPreviewThumbnail template={template} data={item.product} />
                    ) : (
                      <div className="text-slate-400 text-sm">-</div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="flex justify-between items-center pt-4">
          <span className="text-[#0A0E1A] font-medium">{readyCount} of {queue.length} ready to print</span>
          <Button variant="primary" onClick={proceedToPrinter} disabled={readyCount === 0}>
            Continue
          </Button>
        </div>
      </div>
    );
  };

  const renderPrinter = () => {
    const labelCount = selectedForPrint.size > 0 ? selectedForPrint.size : queue.length;

    return (
      <div className="flex flex-col space-y-6">
        <p className="text-[#0A0E1A]">Select a printer to send {labelCount} labels to.</p>
        
        <div className="flex items-center space-x-3 p-4 bg-slate-100 rounded border">
          <div className={`w-3 h-3 rounded-full ${helperOnline ? "bg-green-500" : helperStatus === "checking" ? "bg-yellow-400 animate-pulse" : "bg-red-500"}`} />
          <span className="font-medium text-[#0A0E1A]">
            Chrome Print Extension: {helperOnline ? "Active" : helperStatus === "checking" ? "Checking..." : "Offline / Not Found"}
          </span>
          {!helperOnline && helperStatus !== "checking" && (
            <Button
              variant="ghost"
              size="sm"
              onClick={refreshPrinters}
              className="ml-auto text-[#0A0E1A]"
            >
              Retry Connection
            </Button>
          )}
        </div>

        {helperStatus === "extension-missing" && (
          <div className="bg-amber-900/20 border border-amber-900/50 text-amber-400 p-4 rounded text-sm space-y-1">
            <p className="font-semibold">Chrome Print Extension (PrintBridge) Not Detected</p>
            <p>
              Please make sure the PrintBridge Chrome extension is installed and enabled in Google Chrome or Microsoft Edge.
            </p>
          </div>
        )}

        {helperStatus === "no-printers" && (
          <div className="bg-amber-900/20 border border-amber-900/50 text-amber-400 p-4 rounded text-sm space-y-1">
            <p className="font-semibold">No Printers Found</p>
            <p>
              The print extension is active, but no system printers were returned. Ensure your printer is connected and powered on.
            </p>
          </div>
        )}

        {helperStatus === "no-internet" && (
          <div className="bg-red-900/20 border border-red-900/50 text-red-400 p-4 rounded text-sm">
            Your computer has no network connection. Please reconnect and click Retry Connection.
          </div>
        )}

        {helperStatus === "unsupported-browser" && (
          <div className="bg-stone-800 border border-stone-700 text-stone-300 p-4 rounded text-sm">
            Your browser does not support silent extension printing. Please switch to Google Chrome or Microsoft Edge for the best experience.
          </div>
        )}

        {helperStatus === "error" && (
          <div className="bg-red-900/20 border border-red-900/50 text-red-400 p-4 rounded text-sm">
            Failed to connect to the Chrome Print extension. Click Retry Connection to try again.
          </div>
        )}

        <div className="space-y-2">
          <label className="text-sm font-semibold text-[#0A0E1A]">Printer</label>
          <select
            value={selectedPrinter}
            onChange={(e) => setSelectedPrinter(e.target.value)}
            disabled={!helperOnline || printers.length === 0}
            className="w-full border rounded p-2 bg-white disabled:bg-slate-100 text-[#0A0E1A]"
          >
            {printers.length > 0 ? (
              printers.map((p) => (
                <option key={p} value={p}>{p}</option>
              ))
            ) : (
              <option value="">{helperOnline ? "No printers found" : "Offline"}</option>
            )}
          </select>
        </div>

        <div className="flex justify-end space-x-3 pt-4">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button
            variant="secondary"
            onClick={() => startPrinting(selectedPrinter)}
            disabled={labelCount === 0}
            leftIcon={<Printer className="w-4 h-4" />}
          >
            Silent Print (Extension)
          </Button>
          <Button
            variant="primary"
            onClick={printViaBrowser}
            disabled={labelCount === 0}
            leftIcon={<Printer className="w-4 h-4" />}
          >
            Browser Print (Default)
          </Button>
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
          <h3 className="text-xl font-semibold text-[#0A0E1A]">
            Printing {completed} of {total}...
          </h3>
        </div>

        <div className="overflow-x-auto border rounded max-h-64">
          <table className="w-full text-left border-collapse text-sm">
            <tbody>
              {queue.filter(q => (selectedForPrint.size > 0 ? selectedForPrint.has(q.rowId) : true)).map(item => (
                <tr key={item.rowId} className="border-b hover:bg-slate-50">
                  <td className="px-4 py-2 font-medium">{item.lookupSku}</td>
                  <td className="px-4 py-2 text-right">
                    {item.status === "pending" && <span className="text-slate-500">Sending...</span>}
                    {item.status === "matched" && <span className="text-green-600 flex justify-end items-center"><CheckCircle2 className="w-4 h-4 mr-1"/> Sent</span>}
                    {item.status === "error" && <span className="text-red-600 flex justify-end items-center"><XCircle className="w-4 h-4 mr-1"/> Failed</span>}
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
          <AlertTriangle className="w-12 h-12 text-yellow-500" />
        ) : (
          <CheckCircle2 className="w-12 h-12 text-green-500" />
        )}
        
        <div className="text-center">
          <h3 className="text-2xl font-bold text-[#0A0E1A] mb-2">Print Job Complete</h3>
          <p className="text-lg text-slate-700">
            {success} of {total} labels sent successfully. {failed > 0 && <span className="text-red-600">{failed} failed.</span>}
          </p>
          <p className="text-sm text-slate-500 mt-2">
            Note: &quot;Sent successfully&quot; means the job was handed to the Windows print spooler.
          </p>
        </div>

        <div className="flex space-x-4 pt-4">
          {failed > 0 && (
            <Button variant="secondary" onClick={retryFailed}>
              Retry Failed
            </Button>
          )}
          <Button variant="primary" onClick={handleDone}>
            Done
          </Button>
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
    <div className="border shadow-sm p-1 bg-white inline-block">
      <canvas ref={canvasRef} className="max-w-[120px] max-h-[80px]" />
    </div>
  );
}
