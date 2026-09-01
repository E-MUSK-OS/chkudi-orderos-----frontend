import { useState, useCallback } from "react";
import { LabelTemplate, PrintQueueItem } from "../types/label.types";
import { printAgentService } from "../services/printAgent.service";
import { labelService } from "../services/label.service";
import { renderLabelToCanvas } from "@/lib/labelRenderer";

type Step = "matching" | "review" | "printer" | "printing" | "summary";

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
    try {
      const list = await printAgentService.getPrinters();
      setPrinters(list);
      setHelperOnline(true);
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
      console.warn("Print helper is offline or unreachable.");
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

  const printViaWebUsb = useCallback(async () => {
    if (!template) return;
    setStep("printing");

    const itemsToPrint = queue.filter(q => selectedForPrint.has(q.rowId) && q.status !== "pending");
    setQueue(prev => prev.map(q => selectedForPrint.has(q.rowId) ? { ...q, status: "pending" } : q));
    
    const succeeded: PrintQueueItem[] = [];
    const failed: PrintQueueItem[] = [];

    for (const item of itemsToPrint) {
      try {
        const canvas = await renderLabelToCanvas(template, item.product || {});
        await printAgentService.printViaWebUsb(canvas);
        succeeded.push(item);
        setQueue(prev => prev.map(q => q.rowId === item.rowId ? { ...q, status: "matched" } : q));
      } catch (err) {
        console.error(err);
        const errorMessage = (err as Error).message || "Print failed";
        const failedItem = { ...item, errorMessage, status: "error" as const };
        failed.push(failedItem);
        setQueue(prev => prev.map(q => q.rowId === item.rowId ? failedItem : q));
        
        // Stop if user cancels USB prompt
        if (errorMessage.toLowerCase().includes("no device selected")) {
           break;
        }
      }
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
    selectedPrinter,
    setSelectedPrinter,
    successfulJobs,
    failedJobs,
    runMatching,
    toggleQueueRow,
    proceedToPrinter,
    refreshPrinters,
    startPrinting,
    printViaWebUsb,
    retryFailed,
  };
}
