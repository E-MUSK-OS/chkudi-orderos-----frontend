import { useState, useCallback } from "react";
import { LabelTemplate, PrintQueueItem } from "../types/label.types";
import { printAgentService } from "../services/printAgent.service";
import { labelService } from "../services/label.service";
import { renderLabelToCanvas } from "@/lib/labelRenderer";

type Step = "matching" | "review" | "printer" | "printing" | "summary";

// "checking"            -> we're probing right now
// "online"              -> helper reachable, printers loaded, fully silent
// "needs-permission"    -> Chrome hasn't asked the user yet; the next click
//                          on "Allow Printer Access" IS the click that makes
//                          Chrome show its native local-network prompt
// "permission-blocked"  -> user (or someone) previously clicked "Block";
//                          only fixable from Chrome's own site settings
// "helper-down"         -> permission is fine, helper genuinely isn't running
// "helper-error"        -> helper is reachable but returned an error/bad response
// "no-internet"         -> computer has no network connection at all
// "unsupported-browser" -> browser is not Chromium-based and doesn't support the permission
export type HelperStatus = "checking" | "online" | "needs-permission" | "permission-blocked" | "helper-down" | "helper-error" | "no-internet" | "unsupported-browser" | "unauthorized";


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

    // Read (don't request) the current permission state first. If Chrome
    // has this blocked outright, there's no point firing the fetch below —
    // it'll just fail, and we can point the user straight at the fix.
    const permission = await printAgentService.checkLocalNetworkPermission();
    if (permission === "denied") {
      setPrinters([]);
      setHelperOnline(false);
      setHelperStatus("permission-blocked");
      return;
    }

    try {
      // NOTE: on a fresh browser profile (permission === "prompt"), THIS is
      // the exact call that makes Chrome show its native "Allow [site] to
      // access your local network?" dialog. It only ever appears once per
      // browser — Chrome remembers the choice the same way it remembers
      // camera/mic grants, so every visit after the first is fully silent.
      const list = await printAgentService.getPrinters();
      setPrinters(list);
      setHelperOnline(true);
      setHelperStatus("online");
      if (list.length > 0) {
        const lastUsed = localStorage.getItem("lastUsedPrinter");
        if (lastUsed && list.includes(lastUsed)) {
          setSelectedPrinter(lastUsed);
        } else {
          setSelectedPrinter(list[0]);
        }
      }
    } catch (err) {
      setPrinters([]);
      setHelperOnline(false);
      
      if (err instanceof Error && err.message === "PRINT_HELPER_401") {
        console.error("Print Helper 401: Invalid NEXT_PUBLIC_PRINT_HELPER_TOKEN configured.");
        setHelperStatus("unauthorized");
        return;
      }
      if (err instanceof Error && err.message === "Print helper responded with an error") {
        setHelperStatus("helper-error");
        return;
      }
      if (err instanceof SyntaxError) {
        setHelperStatus("helper-error");
        return;
      }

      const isChromium = /Chrome|Chromium|Edg|OPR|Brave/i.test(navigator.userAgent);

      // A fetch to 127.0.0.1 can fail for two very different reasons and,
      // by design, browsers don't hand JS a clean way to tell them apart.
      // We use the permission state we already read as our best signal:
      // "prompt" means the user almost certainly just dismissed/ignored
      // the dialog that just appeared; anything else means the helper
      // process itself isn't running on this PC.
      if (permission === "prompt") {
        setHelperStatus("needs-permission");
      } else if (permission === "unsupported" && !isChromium) {
        setHelperStatus("unsupported-browser");
      } else {
        setHelperStatus("helper-down");
      }
      console.warn("Print helper is offline or unreachable.", err);
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

    const isPortrait = template.settings.orientation === "portrait";
    const printDimensions = isPortrait
      ? { widthMm: template.settings.heightMm, heightMm: template.settings.widthMm }
      : { widthMm: template.settings.widthMm, heightMm: template.settings.heightMm };

    for (const item of itemsToPrint) {
      try {
        const canvas = await renderLabelToCanvas(template, item.product || {}); // no third argument for full res
        const dataUrl = canvas.toDataURL("image/png");
        const imageBase64 = dataUrl.split(",")[1];

        await printAgentService.sendPrintJob({
          imageBase64,
          printerName,
          ...printDimensions
        });

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
