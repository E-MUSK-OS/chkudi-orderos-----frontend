import { useState, useCallback } from "react";
import { LabelTemplate, PrintQueueItem } from "../types/label.types";
import { chromeExtensionPrintService } from "../services/printAgent.service";
import { labelService } from "../services/label.service";
import { renderLabelToCanvas } from "@/lib/labelRenderer";
import { PDFDocument, degrees } from "pdf-lib";

type Step = "matching" | "review" | "printer" | "printing" | "summary";

export type HelperStatus = 
  | "checking" 
  | "online" 
  | "extension-missing" 
  | "no-printers" 
  | "no-internet" 
  | "unsupported-browser" 
  | "error";


export interface GenerateRow {
  id: number;
  shortSku: string;
  barcodeSku: string;
  ordercookSku: string;
}

export function useLabelPrintJob(template: LabelTemplate | null, rows: GenerateRow[]) {
  const [step, setStep] = useState<Step>("matching");
  const [queue, setQueue] = useState<PrintQueueItem[]>([]);
  const [selectedForPrint, setSelectedForPrint] = useState<Set<number>>(new Set());
  const [printers, setPrinters] = useState<string[]>([]);
  const [helperOnline, setHelperOnline] = useState<boolean>(true);
  const [helperStatus, setHelperStatus] = useState<HelperStatus>("checking");
  const [selectedPrinter, setSelectedPrinter] = useState<string>("");
  const [successfulJobs, setSuccessfulJobs] = useState<PrintQueueItem[]>([]);
  const [failedJobs, setFailedJobs] = useState<PrintQueueItem[]>([]);

  const runMatching = useCallback(async () => {
    setStep("matching");
    const results = await Promise.allSettled(
      rows.map(async (row): Promise<PrintQueueItem> => {
        const query = row.barcodeSku?.trim() || row.shortSku?.trim();
        if (!query) return { rowId: row.id, status: "error", errorMessage: "No SKU to look up", lookupSku: "" };
        try {
          const matches = await labelService.lookupProduct(query);
          if (matches.length === 0) return { rowId: row.id, status: "not_found", lookupSku: query };
          if (matches.length > 1) return { rowId: row.id, status: "multiple_matches", lookupSku: query, product: matches[0] };
          return { rowId: row.id, status: "matched", lookupSku: query, product: matches[0] };
        } catch (err) {
          return { rowId: row.id, status: "not_found", lookupSku: query, errorMessage: (err as Error).message };
        }
      })
    );

    const newQueue = results.map(r => r.status === "fulfilled" ? r.value : null).filter(Boolean) as PrintQueueItem[];
    setQueue(newQueue);

    // Default select rows that were successfully matched (or multiple matches)
    const selected = new Set<number>();
    newQueue.forEach(item => {
      if (item.status === "matched" || item.status === "multiple_matches") {
        selected.add(item.rowId);
      }
    });
    setSelectedForPrint(selected);
    setStep("review");
  }, [rows]);

  const toggleQueueRow = useCallback((rowId: number, checked: boolean) => {
    setSelectedForPrint(prev => {
      const next = new Set(prev);
      if (checked) next.add(rowId);
      else next.delete(rowId);
      return next;
    });
  }, []);

  const refreshPrinters = useCallback(async () => {
    if (typeof navigator !== "undefined" && navigator.onLine === false) {
      setPrinters([]);
      setHelperOnline(false);
      setHelperStatus("no-internet");
      return;
    }

    setHelperStatus("checking");

    try {
      const check = await chromeExtensionPrintService.checkExtension();
      if (!check.ok) {
        setPrinters([]);
        setHelperOnline(false);
        setHelperStatus("extension-missing");
        return;
      }

      const list = await chromeExtensionPrintService.getPrinters();
      const details = await chromeExtensionPrintService.getPrintersDetailed();
      setPrinters(list);
      setHelperOnline(true);
      if (list.length === 0) {
        setHelperStatus("no-printers");
      } else {
        setHelperStatus("online");
        const lastUsed = localStorage.getItem("lastUsedPrinter");
        const offlineMap = new Map<string, boolean>();
        details.forEach((d) => {
          if (d.name) offlineMap.set(d.name.toLowerCase(), !!d.isOffline);
        });

        const isLastUsedOnline = lastUsed && list.includes(lastUsed) && offlineMap.get(lastUsed.toLowerCase()) !== true;

        if (isLastUsedOnline) {
          setSelectedPrinter(lastUsed!);
        } else {
          // Find an online thermal printer or physical printer
          const onlineThermal = list.find((p) => {
            const isThermal = /tsc|zebra|thermal|barcode|da310|xprinter|gprinter|label|pos/i.test(p);
            return isThermal && offlineMap.get(p.toLowerCase()) !== true;
          });
          if (onlineThermal) {
            setSelectedPrinter(onlineThermal);
          } else if (lastUsed && list.includes(lastUsed)) {
            setSelectedPrinter(lastUsed);
          } else {
            setSelectedPrinter(list[0]);
          }
        }
      }
    } catch (err) {
      setPrinters([]);
      setHelperOnline(false);
      setHelperStatus("error");
      console.warn("Chrome print extension check failed:", err);
    }
  }, []);

  const proceedToPrinter = useCallback(() => {
    setStep("printer");
    refreshPrinters();
  }, [refreshPrinters]);

  const startPrinting = useCallback(async (printerName: string) => {
    if (!template) return;
    setStep("printing");
    localStorage.setItem("lastUsedPrinter", printerName);

    const itemsToPrint = queue.filter(q => selectedForPrint.has(q.rowId) && q.status !== "pending");
    // Reset status of jobs to be printed to pending to indicate they are starting
    setQueue(prev => prev.map(q => selectedForPrint.has(q.rowId) ? { ...q, status: "pending" } : q));
    
    const succeeded: PrintQueueItem[] = [];
    const failed: PrintQueueItem[] = [];

    // For thermal printing on portrait roll: swap width and height to match rotated canvas
    const printDimensions = {
      widthMm: template.settings.heightMm || 50,
      heightMm: template.settings.widthMm || 100,
    };

    for (const item of itemsToPrint) {
      try {
        // Render canvas rotated 90° CCW for portrait thermal sticker
        const canvas = await renderLabelToCanvas(template, item.product || {}, undefined, true);
        const dataUrl = canvas.toDataURL("image/png");
        const cleanBase64 = dataUrl.split(",")[1];
        const imageBytes = Uint8Array.from(atob(cleanBase64), (c) => c.charCodeAt(0));

        // Convert canvas image into a PDF document with exact sticker dimensions (points = mm / 25.4 * 72)
        const pdfDoc = await PDFDocument.create();
        const embeddedImage = await pdfDoc.embedPng(imageBytes);
        const widthPoints = (printDimensions.widthMm / 25.4) * 72;
        const heightPoints = (printDimensions.heightMm / 25.4) * 72;
        const page = pdfDoc.addPage([widthPoints, heightPoints]);
        page.drawImage(embeddedImage, {
          x: 0,
          y: 0,
          width: widthPoints,
          height: heightPoints,
        });

        const pdfBase64 = await pdfDoc.saveAsBase64();

        const extRes = await chromeExtensionPrintService.printPdf(pdfBase64, printerName, 1);
        if (extRes && (extRes.success === false || extRes.error)) {
          throw new Error(extRes.error || "Print extension reported print failure");
        }

        succeeded.push(item);
        setQueue(prev => prev.map(q => q.rowId === item.rowId ? { ...q, status: "matched" } : q));
      } catch (err) {
        console.error(err);
        const errorMessage = (err as Error).message || "Print failed";
        const failedItem = { ...item, errorMessage, status: "error" as const };
        failed.push(failedItem);
        setQueue(prev => prev.map(q => q.rowId === item.rowId ? failedItem : q));
      }
    }

    setSuccessfulJobs(prev => [...prev, ...succeeded]);
    setFailedJobs(prev => {
      // replace or add to failed jobs
      const newFailed = prev.filter(p => !succeeded.find(s => s.rowId === p.rowId));
      for (const fail of failed) {
        if (!newFailed.find(f => f.rowId === fail.rowId)) {
          newFailed.push(fail);
        }
      }
      return newFailed;
    });

    // Log the print session
    if (succeeded.length > 0) {
      const itemsMap = new Map<string, number>();
      succeeded.forEach(j => {
        itemsMap.set(j.lookupSku, (itemsMap.get(j.lookupSku) || 0) + 1);
      });
      const items = Array.from(itemsMap.entries()).map(([sku, count]) => ({ sku, count }));
      
      try {
        await labelService.logPrintSession(items);
      } catch (err) {
        console.warn("Failed to log print session", err);
      }
    }

    setStep("summary");
  }, [template, queue, selectedForPrint]);

  const printViaBrowser = useCallback(async () => {
    if (!template) return;
    setStep("printing");

    const itemsToPrint = queue.filter(q => selectedForPrint.has(q.rowId) && q.status !== "pending");
    setQueue(prev => prev.map(q => selectedForPrint.has(q.rowId) ? { ...q, status: "pending" } : q));
    
    const succeeded: PrintQueueItem[] = [];
    const failed: PrintQueueItem[] = [];

    // Create a hidden print container
    const printContainer = document.createElement("div");
    printContainer.id = "browser-print-container";
    printContainer.style.display = "none";
    document.body.appendChild(printContainer);

    // Style for print media
    const style = document.createElement("style");
    style.innerHTML = `
      @media print {
        body * { display: none !important; }
        #browser-print-container, #browser-print-container * { display: block !important; }
        #browser-print-container {
          position: absolute;
          left: 0;
          top: 0;
          margin: 0;
          padding: 0;
          width: 100%;
          /* Force full color output — without this Chrome strips colors for ink saving */
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
          color-adjust: exact !important;
        }
        .print-page {
          page-break-after: always;
          display: flex !important;
          justify-content: center;
          align-items: center;
        }
        .print-page img {
          max-width: 100%;
          max-height: 100vh;
          object-fit: contain;
          /* Ensure the canvas image itself is not desaturated by the browser */
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
        }
      }
    `;
    document.head.appendChild(style);

    try {
      for (const item of itemsToPrint) {
        try {
          const canvas = await renderLabelToCanvas(template, item.product || {});
          
          const pageDiv = document.createElement("div");
          pageDiv.className = "print-page";
          
          const img = document.createElement("img");
          img.src = canvas.toDataURL("image/png");
          
          pageDiv.appendChild(img);
          printContainer.appendChild(pageDiv);
          
          succeeded.push(item);
          setQueue(prev => prev.map(q => q.rowId === item.rowId ? { ...q, status: "matched" } : q));
        } catch (err) {
          console.error(err);
          const errorMessage = (err as Error).message || "Print failed";
          const failedItem = { ...item, errorMessage, status: "error" as const };
          failed.push(failedItem);
          setQueue(prev => prev.map(q => q.rowId === item.rowId ? failedItem : q));
        }
      }

      if (succeeded.length > 0) {
        // Trigger browser print
        window.print();
      }
    } finally {
      // Cleanup DOM
      document.body.removeChild(printContainer);
      document.head.removeChild(style);
    }

    setSuccessfulJobs(prev => [...prev, ...succeeded]);
    setFailedJobs(prev => {
      const newFailed = prev.filter(p => !succeeded.find(s => s.rowId === p.rowId));
      for (const fail of failed) {
        if (!newFailed.find(f => f.rowId === fail.rowId)) {
          newFailed.push(fail);
        }
      }
      return newFailed;
    });

    if (succeeded.length > 0) {
      const itemsMap = new Map<string, number>();
      succeeded.forEach(j => {
        itemsMap.set(j.lookupSku, (itemsMap.get(j.lookupSku) || 0) + 1);
      });
      const items = Array.from(itemsMap.entries()).map(([sku, count]) => ({ sku, count }));
      
      try {
        labelService.logPrintSession(items).catch(console.warn);
      } catch (err) {}
    }

    setStep("summary");
  }, [template, queue, selectedForPrint]);

  const retryFailed = useCallback(() => {
    const failedIds = new Set(failedJobs.map(f => f.rowId));
    setSelectedForPrint(failedIds);
    setFailedJobs([]);
    startPrinting(selectedPrinter);
  }, [failedJobs, selectedPrinter, startPrinting]);

  return {
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
  };
}
