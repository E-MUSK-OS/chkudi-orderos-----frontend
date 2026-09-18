import { useState, useCallback } from "react";
import { LabelTemplate, PrintQueueItem } from "../types/label.types";
import { chromeExtensionPrintService } from "../services/printAgent.service";
import { labelService } from "../services/label.service";
import { renderLabelToCanvas, renderLabelToVectorPdf, printLabelsViaBrowser } from "@/lib/labelRenderer";

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
  quantity?: number | string;
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
        let defaultPrinterName = "";

        details.forEach((d) => {
          if (d.name) {
            offlineMap.set(d.name.toLowerCase(), !!d.isOffline);
            if (d.isDefault) {
              defaultPrinterName = d.name;
            }
          }
        });

        const isThermal = (name: string) => /tsc|zebra|thermal|barcode|da310|xprinter|gprinter|label|pos/i.test(name);

        const defaultIsThermalAndOnline = defaultPrinterName && isThermal(defaultPrinterName) && offlineMap.get(defaultPrinterName.toLowerCase()) !== true;
        const isLastUsedOnline = lastUsed && list.includes(lastUsed) && offlineMap.get(lastUsed.toLowerCase()) !== true;

        if (defaultIsThermalAndOnline) {
          setSelectedPrinter(defaultPrinterName);
        } else if (isLastUsedOnline) {
          setSelectedPrinter(lastUsed!);
        } else {
          // Find an online thermal printer or physical printer
          const onlineThermal = list.find((p) => isThermal(p) && offlineMap.get(p.toLowerCase()) !== true);
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
  const runMatching = useCallback(async () => {
    setStep("matching");
    const results = await Promise.allSettled(
      rows.map(async (row): Promise<PrintQueueItem> => {
        const query = row.barcodeSku?.trim() || row.shortSku?.trim() || row.ordercookSku?.trim() || "";
        const rowQuantity = Math.max(Number(row.quantity) || 1, 1);
        if (!query) {
          return {
            rowId: row.id,
            status: "matched",
            lookupSku: String(row.id),
            product: { sku: String(row.id), title: "Label" },
            quantity: rowQuantity,
          };
        }
        try {
          const matches = await labelService.lookupProduct(query);
          if (!matches || matches.length === 0) {
            return {
              rowId: row.id,
              status: "matched",
              lookupSku: query,
              product: { sku: query, masterSku: query, title: query },
              quantity: rowQuantity,
            };
          }
          return {
            rowId: row.id,
            status: matches.length > 1 ? "multiple_matches" : "matched",
            lookupSku: query,
            product: matches[0],
            quantity: rowQuantity,
          };
        } catch (err) {
          return {
            rowId: row.id,
            status: "matched",
            lookupSku: query,
            product: { sku: query, masterSku: query, title: query },
            quantity: rowQuantity,
          };
        }
      })
    );

    const newQueue = results.map(r => r.status === "fulfilled" ? r.value : null).filter(Boolean) as PrintQueueItem[];
    setQueue(newQueue);

    // Default select all valid rows so they are immediately ready to print
    const selected = new Set<number>();
    newQueue.forEach(item => {
      selected.add(item.rowId);
    });
    setSelectedForPrint(selected);
    setStep("printer");
    refreshPrinters();
  }, [rows, refreshPrinters]);

  const toggleQueueRow = useCallback((rowId: number, checked: boolean) => {
    setSelectedForPrint(prev => {
      const next = new Set(prev);
      if (checked) next.add(rowId);
      else next.delete(rowId);
      return next;
    });
  }, []);


  const proceedToPrinter = useCallback(() => {
    setStep("printer");
    refreshPrinters();
  }, [refreshPrinters]);

  const startPrinting = useCallback(async (printerName: string) => {
    if (!template) return;
    setStep("printing");
    localStorage.setItem("lastUsedPrinter", printerName);

    const targetIds = selectedForPrint.size > 0 ? selectedForPrint : new Set(queue.map(q => q.rowId));
    const itemsToPrint = queue.filter(q => targetIds.has(q.rowId));
    setQueue(prev => prev.map(q => targetIds.has(q.rowId) ? { ...q, status: "pending" } : q));
    
    const succeeded: PrintQueueItem[] = [];
    const failed: PrintQueueItem[] = [];

    for (const item of itemsToPrint) {
      try {
        const productData = item.product || {
          sku: item.lookupSku,
          masterSku: item.lookupSku,
          title: item.lookupSku,
        };
        const pdfBase64 = await renderLabelToVectorPdf(template, productData);

        const effectiveWidthMm = template.settings.widthMm || 100;
        const effectiveHeightMm = template.settings.heightMm || 50;

        const copies = item.quantity && item.quantity > 0 ? item.quantity : 1;
        const extRes = await chromeExtensionPrintService.printPdf(
          pdfBase64,
          printerName,
          copies,
          false,
          effectiveWidthMm,
          effectiveHeightMm
        );
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

    const targetIds = selectedForPrint.size > 0 ? selectedForPrint : new Set(queue.map(q => q.rowId));
    const itemsToPrint = queue.filter(q => targetIds.has(q.rowId));
    setQueue(prev => prev.map(q => targetIds.has(q.rowId) ? { ...q, status: "pending" } : q));
    
    const succeeded: PrintQueueItem[] = [];
    const failed: PrintQueueItem[] = [];
    const dataUrls: string[] = [];

    const widthMm = template.settings.widthMm || 100;
    const heightMm = template.settings.heightMm || 50;

    for (const item of itemsToPrint) {
      try {
        const productData = item.product || {
          sku: item.lookupSku,
          masterSku: item.lookupSku,
          title: item.lookupSku,
        };
        const baseCanvas = await renderLabelToCanvas(template, productData, undefined, false);
        const dataUrl = baseCanvas.toDataURL("image/png");
        
        const count = item.quantity && item.quantity > 0 ? item.quantity : 1;
        for (let c = 0; c < count; c++) {
          dataUrls.push(dataUrl);
        }

        succeeded.push(item);
        setQueue(prev => prev.map(q => q.rowId === item.rowId ? { ...q, status: "matched" } : q));
      } catch (err) {
        console.error("Browser print label render error:", err);
        const errorMessage = (err as Error).message || "Print render failed";
        const failedItem = { ...item, errorMessage, status: "error" as const };
        failed.push(failedItem);
        setQueue(prev => prev.map(q => q.rowId === item.rowId ? failedItem : q));
      }
    }

    if (dataUrls.length > 0) {
      try {
        await printLabelsViaBrowser(dataUrls, {
          widthMm,
          heightMm,
          title: `Print ${dataUrls.length} Labels`,
        });
      } catch (err) {
        console.error("Browser print execution failed:", err);
      }

      const itemsMap = new Map<string, number>();
      succeeded.forEach(j => {
        itemsMap.set(j.lookupSku, (itemsMap.get(j.lookupSku) || 0) + (j.quantity || 1));
      });
      const items = Array.from(itemsMap.entries()).map(([sku, count]) => ({ sku, count }));
      
      try {
        labelService.logPrintSession(items).catch(console.warn);
      } catch (err) {}
    }

    setStep("printer");
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
