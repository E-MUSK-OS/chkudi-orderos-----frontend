import {
  getOrLoadFlipkartShippingDoc,
  getCachedFlipkartDocs,
  getOrGenerateSingleFlipkartOrderPdf,
  getCachedFlipkartOrderPdf,
  setCachedFlipkartOrderPdf,
  fastBase64ToUint8Array,
} from "@/components/Dashboard/OrderProcess/Flipkart/OrderProcess/utils/flipkartPdfCache";
import {
  chromeExtensionPrintService,
  resolveCurrentlyConnectedPrinter,
  isPrinterConnectedAndOnline,
  invalidatePrinterCache,
} from "@/components/Dashboard/Labels/services/printAgent.service";
import {
  flipkartOrderService,
  FlipkartPrintedOrderPayload,
} from "@/components/Dashboard/OrderProcess/Flipkart/OrderProcess/services/flipkartOrder.service";
import { useFlipkartOrderStore } from "@/components/Dashboard/OrderProcess/Flipkart/OrderProcess/store/useFlipkartOrderStore";
import { FlipkartOrderItem, FlipkartProcessFiles } from "@/components/Dashboard/OrderProcess/Flipkart/OrderProcess/types";
import { PDFDocument } from "pdf-lib";
import { toast } from "sonner";

export interface ResolvedPrinterInfo {
  printerName: string;
  isOnline: boolean;
}

/**
 * Resolves the connected thermal printer using PrintBridge.
 */
export async function resolveVmsPrinter(): Promise<string | null> {
  const extCheck = await chromeExtensionPrintService.checkExtension();
  if (!extCheck.ok) {
    toast.error("PrintBridge is not running or not detected. Please setup PrintBridge.", {
      id: "flipkart-vms-print",
      duration: 8000,
      action: {
        label: "Setup PrintBridge",
        onClick: () => window.open("/printbridge", "_blank"),
      },
    });
    return null;
  }

  const detailedPrinters = await chromeExtensionPrintService.getPrintersDetailed();
  const extPrinters = detailedPrinters.map((p) => p.name).filter(Boolean);

  let targetPrinter: string | null =
    (typeof window !== "undefined"
      ? localStorage.getItem("flipkart_selected_printer") ||
      localStorage.getItem("lastUsedPrinter")
      : null);

  if (targetPrinter) {
    const matched = extPrinters.find(
      (p) => p.toLowerCase().trim() === targetPrinter?.toLowerCase().trim()
    );
    if (matched) {
      targetPrinter = matched;
    }
  }

  if (!targetPrinter || !isPrinterConnectedAndOnline(targetPrinter, detailedPrinters)) {
    const { printer: onlineConnected } = resolveCurrentlyConnectedPrinter(
      extPrinters,
      detailedPrinters
    );
    if (onlineConnected && isPrinterConnectedAndOnline(onlineConnected, detailedPrinters)) {
      targetPrinter = onlineConnected;
    } else if (extPrinters.length > 0) {
      targetPrinter = extPrinters[0];
    }
  }

  if (!targetPrinter) {
    toast.error("No printer connected. Print cancelled to avoid queuing.", {
      id: "flipkart-vms-print",
      duration: 8000,
      action: {
        label: "Setup PrintBridge",
        onClick: () => window.open("/printbridge", "_blank"),
      },
    });
    return null;
  }

  if (typeof window !== "undefined") {
    localStorage.setItem("flipkart_selected_printer", targetPrinter);
    localStorage.setItem("lastUsedPrinter", targetPrinter);
  }

  return targetPrinter;
}

/**
 * Renders PDF bytes to PNG images for thermal printer raster fallback.
 */
async function renderPdfBytesToImages(pdfBytes: Uint8Array): Promise<string[]> {
  const pdfjs = await import("pdfjs-dist");
  if (!pdfjs.GlobalWorkerOptions.workerSrc) {
    pdfjs.GlobalWorkerOptions.workerSrc = `https://cdn.jsdelivr.net/npm/pdfjs-dist@${pdfjs.version || "6.3.289"}/build/pdf.worker.min.mjs`;
  }

  const loadingTask = pdfjs.getDocument({ data: pdfBytes });
  const pdf = await loadingTask.promise;
  const images: string[] = [];

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const viewport = page.getViewport({ scale: 3.0 });
    const canvas = document.createElement("canvas");
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    const context = canvas.getContext("2d");
    if (context) {
      context.fillStyle = "#ffffff";
      context.fillRect(0, 0, canvas.width, canvas.height);
      await (page.render as any)({ canvasContext: context, viewport, canvas }).promise;
      const base64 = canvas.toDataURL("image/png").replace(/^data:image\/png;base64,/, "");
      images.push(base64);
    }
  }

  return images;
}

/**
 * Extracts a single-page shipping label in Base64 from cache or memory.
 */
export async function getSingleOrderPdfBase64(
  pageIndex: number,
  files: FlipkartProcessFiles | null,
  activeBatchKey: string
): Promise<string> {
  const cached = getCachedFlipkartOrderPdf(pageIndex, activeBatchKey);
  if (cached) return cached;

  const shippingDoc = await getOrLoadFlipkartShippingDoc(files, activeBatchKey);
  if (!shippingDoc) {
    throw new Error("Shipping labels PDF document is not loaded.");
  }

  const singleBase64 = await getOrGenerateSingleFlipkartOrderPdf(
    pageIndex,
    shippingDoc,
    activeBatchKey
  );
  if (!singleBase64) {
    throw new Error(`Failed to generate shipping label for page index ${pageIndex}`);
  }

  setCachedFlipkartOrderPdf(pageIndex, singleBase64, activeBatchKey);
  return singleBase64;
}

/**
 * Prints a single Flipkart shipping label with vector and raster fallback.
 */
export async function printSingleFlipkartOrder(
  order: FlipkartOrderItem,
  files: FlipkartProcessFiles | null,
  activeBatchKey: string,
  printerName: string
): Promise<void> {
  const singleBase64 = await getSingleOrderPdfBase64(order.pageIndex, files, activeBatchKey);

  try {
    const extRes = await chromeExtensionPrintService.printPdf(
      singleBase64,
      printerName,
      1,
      true
    );
    if (extRes && (extRes.success === false || extRes.error)) {
      throw new Error(extRes.error || `Direct print failed on ${printerName}`);
    }
  } catch (vectorErr: any) {
    console.warn("Vector PDF print failed, attempting raster fallback...", vectorErr);
    try {
      const rawBytes = fastBase64ToUint8Array(singleBase64);
      const images = await renderPdfBytesToImages(rawBytes);
      if (images.length > 0) {
        const rasterDoc = await PDFDocument.create();
        for (const imgBase64 of images) {
          const imgBytes = fastBase64ToUint8Array(imgBase64);
          const pngImg = await rasterDoc.embedPng(imgBytes);
          const page = rasterDoc.addPage([4 * 72, 6 * 72]);
          page.drawImage(pngImg, {
            x: 0,
            y: 0,
            width: 4 * 72,
            height: 6 * 72,
          });
        }
        const rasterBase64 = await rasterDoc.saveAsBase64();
        const fallbackRes = await chromeExtensionPrintService.printPdf(
          rasterBase64,
          printerName,
          1,
          true
        );
        if (fallbackRes && (fallbackRes.success === false || fallbackRes.error)) {
          throw new Error(fallbackRes.error || `Raster print fallback failed on ${printerName}`);
        }
      } else {
        throw vectorErr;
      }
    } catch {
      throw vectorErr;
    }
  }
}

/**
 * Synchronizes an order marked as printed to:
 * 1. Zustand `useFlipkartOrderStore` (so FlipkartResultView reflects it immediately)
 * 2. `sessionStorage` (for page refresh persistence)
 * 3. Database `FlipkartOrders` (for AWB Scan)
 */
export async function syncOrderPrinted(
  order: FlipkartOrderItem,
  activeBatchId?: string | null
): Promise<void> {
  // 1. Update Zustand store
  const storeState = useFlipkartOrderStore.getState();
  const existingIndices = new Set(
    Array.isArray((storeState.summary as any)?.printedIndices)
      ? (storeState.summary as any).printedIndices
      : []
  );
  existingIndices.add(order.pageIndex);

  const updatedIndices = Array.from(existingIndices);
  useFlipkartOrderStore.setState((state) => ({
    printedCount: updatedIndices.length,
    summary: state.summary
      ? {
        ...state.summary,
        printedIndices: updatedIndices,
        printedCount: updatedIndices.length,
      }
      : state.summary,
  }));

  // 2. Update sessionStorage
  try {
    if (typeof window !== "undefined") {
      const raw = sessionStorage.getItem("flipkart_order_process_summary_v1");
      if (raw) {
        const parsed = JSON.parse(raw);
        parsed.printedIndices = updatedIndices;
        parsed.printedCount = updatedIndices.length;
        sessionStorage.setItem("flipkart_order_process_summary_v1", JSON.stringify(parsed));
      }
    }
  } catch (err) {
    console.warn("Failed to sync printed indices to sessionStorage:", err);
  }

  // 3. Persist to DB for AWB Scan
  try {
    const payload: FlipkartPrintedOrderPayload[] = [
      {
        orderId: (order.orderId || "N/A").trim(),
        awb: (order.awb || "N/A").trim(),
        fsn: (order.fsn || "N/A").trim(),
        sku: (order.sku || "N/A").trim(),
        customer: (order.customerName || "N/A").trim(),
        totalQuantity: order.totalQuantity || 1,
        packingScanStatus: "PENDING",
        isExplicitPrint: true,
      },
    ];

    await flipkartOrderService.savePrintedOrders(
      payload,
      undefined,
      activeBatchId || undefined
    );
  } catch (dbErr) {
    console.warn("Could not sync printed order to DB:", dbErr);
  }
}
