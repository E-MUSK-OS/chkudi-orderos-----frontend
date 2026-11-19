import { PDFDocument, rgb } from "pdf-lib";
import { FlipcartOrderSummary, FlipcartProcessFiles, FlipcartOrderItem } from "../types";

export interface FlipcartProcessingProgressCallback {
  (progress: number, stage: string): void;
}

export interface ProcessFlipcartPdfResult {
  summary: FlipcartOrderSummary;
  files: FlipcartProcessFiles;
  blobs: {
    shippingLabelsBlob: Blob;
    taxInvoicesBlob: Blob;
    originalBlob: Blob;
  };
  shippingDoc?: PDFDocument;
  shippingBytes?: Uint8Array;
}

export async function processFlipcartPdfs(
  files: File[],
  onProgress?: FlipcartProcessingProgressCallback
): Promise<ProcessFlipcartPdfResult> {
  if (files.length === 0) {
    throw new Error("No PDF files provided for processing.");
  }

  onProgress?.(10, `Reading & Preparing ${files.length} document(s)...`);
  await new Promise((resolve) => setTimeout(resolve, 0));

  // Target standard thermal label size: 4" x 6" (288 pt x 432 pt)
  const TARGET_WIDTH = 4 * 72;  // 288 pt
  const TARGET_HEIGHT = 6 * 72; // 432 pt

  const shippingDoc = await PDFDocument.create();
  const taxDoc = await PDFDocument.create();
  const mergedOriginalDoc = await PDFDocument.create();

  // Pre-load documents to get accurate total page count for smooth progress calculation
  const preparedDocs: { file: File; arrayBuffer: ArrayBuffer; srcDoc: any; pageCount: number }[] = [];
  let totalEstimatedPages = 0;

  for (const file of files) {
    const arrayBuffer = await file.arrayBuffer();
    const srcDoc = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
    const pageCount = srcDoc.getPageCount();
    totalEstimatedPages += pageCount;
    preparedDocs.push({ file, arrayBuffer, srcDoc, pageCount });
  }

  onProgress?.(15, `Processing ${totalEstimatedPages} order${totalEstimatedPages !== 1 ? "s" : ""}...`);
  await new Promise((resolve) => setTimeout(resolve, 0));

  let processedOrders = 0;
  const orderList: FlipcartOrderItem[] = [];

  for (const { arrayBuffer, srcDoc, pageCount } of preparedDocs) {
    // Copy to merged original doc
    const originalPages = await mergedOriginalDoc.copyPages(srcDoc, srcDoc.getPageIndices());
    originalPages.forEach((p) => mergedOriginalDoc.addPage(p));

    // Detect template coordinates once per file on page 1 for ultra-fast processing
    let templateNotForResaleY: number | null = null;
    let templateTaxInvoiceY: number | null = null;
    let pdfJsDoc: any = null;
    let loadingTask: any = null;

    try {
      try {
        const pdfjs = await import("pdfjs-dist");
        if (!pdfjs.GlobalWorkerOptions.workerSrc) {
          const version = pdfjs.version || "6.3.289";
          pdfjs.GlobalWorkerOptions.workerSrc = `https://cdn.jsdelivr.net/npm/pdfjs-dist@${version}/build/pdf.worker.min.mjs`;
        }
        loadingTask = pdfjs.getDocument({ data: new Uint8Array(arrayBuffer) });
        pdfJsDoc = await loadingTask.promise;
        if (pdfJsDoc && pageCount > 0) {
          const firstPage = await pdfJsDoc.getPage(1);
          const textContent = await firstPage.getTextContent();
          for (const item of textContent.items as any[]) {
            const str = (item.str || "").toLowerCase();
            const y = item.transform?.[5];
            if (typeof y === "number") {
              if (
                (str.includes("not for resale") || str.includes("printed at")) &&
                y > 350
              ) {
                if (templateNotForResaleY === null || y < templateNotForResaleY) {
                  templateNotForResaleY = y;
                }
              }
              if (str.includes("tax invoice") || str.includes("taxinvoice")) {
                if (templateTaxInvoiceY === null || y > templateTaxInvoiceY) {
                  templateTaxInvoiceY = y;
                }
              }
            }
          }
        }
      } catch {
        // Fallback to geometric ratios if worker or text extraction fails
      }

      for (let pIdx = 0; pIdx < pageCount; pIdx++) {
        processedOrders++;
        const currentPct = Math.min(88, Math.round(15 + (processedOrders / Math.max(1, totalEstimatedPages)) * 73));
        onProgress?.(
          currentPct,
          `Processing order ${processedOrders} of ${totalEstimatedPages}...`
        );

        // Extract metadata for search, DB matching, and individual scan-printing
        let orderId = "";
        let awb = "";
        let customerName = "";
        const extractedLineItems: { sku: string; description: string; quantity: number }[] = [];

        if (pdfJsDoc) {
          try {
            const jsPage = await pdfJsDoc.getPage(pIdx + 1);
            const content = await jsPage.getTextContent();
            const items = content.items as any[];
            const fullText = items.map((it) => it.str || "").join(" ");

            // 1. Order ID (e.g. OD339158342961689100)
            const odMatch = fullText.match(/\b(OD\d{14,24})\b/i);
            if (odMatch) {
              orderId = odMatch[1];
            }

            // 2. AWB (Ekart FMP..., Shadowfax SFX..., BLR..., Xpressbees XB..., Delhivery, or standard AWB headers)
            const awbMatch =
              fullText.match(/\b(FMP[A-Z0-9]{7,15})\b/i) ||
              fullText.match(/\b(SFX[A-Z0-9]{7,16})\b/i) ||
              fullText.match(/\b(BLR[A-Z0-9]{7,16})\b/i) ||
              fullText.match(/\b(XB[A-Z0-9]{8,16})\b/i) ||
              fullText.match(/AWB\s*(?:No\.?|#)?\s*[:\-]?\s*([A-Za-z0-9]{7,20})/i) ||
              fullText.match(/Tracking\s*(?:ID|No\.?|#)?\s*[:\-]?\s*([A-Za-z0-9]{7,20})/i);
            if (awbMatch) {
              awb = awbMatch[1];
            } else {
              // Fallback for Delhivery / Ecom Express standard 12-14 digit numeric tracking codes
              const numericTracking = fullText.match(/\b(\d{12,14})\b/);
              if (numericTracking && !numericTracking[1].startsWith("00")) {
                awb = numericTracking[1];
              }
            }

          // 3. Customer Name
          const nameMatch = fullText.match(/Name:\s*([^,\n\r]+)/i);
          if (nameMatch) {
            customerName = nameMatch[1].trim();
          }

          // 4. Line Items (SKU, Description, Quantity)
          // Strictly look only within the Shipping Label region on the page (y >= height * 0.42)
          // to never accidentally pick up Tax Invoice table rows, HSN codes, or descriptions below!
          const pageHeight = jsPage.view?.[3] || 841.89;
          const labelMinY = pageHeight * 0.42;

          for (let i = 0; i < items.length; i++) {
            const item = items[i];
            const rawStr = (item.str || "").trim();
            if (!rawStr) continue;

            const itemY = item.transform?.[5];
            // If item has a vertical coordinate and is below the shipping label, ignore it!
            if (typeof itemY === "number" && itemY < labelMinY) {
              continue;
            }

            // Reject anything related to Tax Invoices, HSN, taxes, totals, or logistics headers
            if (
              /sku\s*id|e-kart|logistics|prepaid|cod|ordered through|sold by|gstin|tax\s*invoice|hsn|cgst|sgst|igst|taxable|rate|total\s*amount/i.test(
                rawStr
              )
            ) {
              continue;
            }

            if (rawStr.includes("|")) {
              const parts = rawStr.split("|");
              let part0 = parts[0].trim();
              let desc = parts.slice(1).join("|").trim();

              // If part0 is just a row index (e.g. "1" or "1.") and parts.length > 1, the SKU is in part1
              if (/^\d+[\.\)]?$/.test(part0) && parts.length > 1) {
                part0 = parts[1].trim();
                desc = parts.slice(2).join("|").trim();
              }

              // Strip optional leading row index (e.g. "1 2042-Grey-38" or "1. 2042-Grey-38" -> "2042-Grey-38")
              let cleanSku = part0.replace(/^\s*\d+[\s\.\-]+/, "").trim();
              cleanSku = cleanSku.replace(/[\s\|\/,]+$/, "").trim();
              if (cleanSku.includes("/")) {
                cleanSku = cleanSku.split("/")[0].trim();
              }

              if (
                cleanSku &&
                cleanSku.length >= 2 &&
                !/^(gstin|sold by|hbd|cpd|printed at|not for resale|use transparent|zon|hsn)/i.test(cleanSku)
              ) {
                // Determine item quantity:
                // Strictly avoid confusing garment waist sizes (26, 28, 30, 32, 34, 36, 38, 40, 42, 44, 46) with quantity!
                const isGarmentSizeToken = (n: number) => {
                  const waistSizes = [24, 26, 28, 30, 32, 34, 36, 38, 40, 42, 44, 46, 48];
                  if (waistSizes.includes(n)) {
                    const pattern = new RegExp(`(^|[-_\\s])${n}([-_\\s]|$)`, "i");
                    if (pattern.test(cleanSku) || pattern.test(desc)) {
                      return true;
                    }
                    if (n >= 24) return true;
                  }
                  return false;
                };

                let qty = 1;

                // 1. Check if the pipe-separated string itself ends with QTY in the rightmost column (e.g. "SKU | Desc | 1")
                if (parts.length >= 3) {
                  const lastToken = parts[parts.length - 1].trim();
                  if (/^\d+$/.test(lastToken)) {
                    const candidate = parseInt(lastToken, 10);
                    if (candidate > 0 && candidate <= 50 && !isGarmentSizeToken(candidate)) {
                      qty = candidate;
                    }
                  }
                }

                // 2. If QTY is a separate text item on the exact same horizontal line (within 4pt of itemY):
                // In Flipkart table "SKU ID | Description | QTY", QTY is in the rightmost column (highest X coordinate).
                if (qty === 1 && typeof itemY === "number") {
                  const sameLineNumberItems = items.filter((it) => {
                    const y = it.transform?.[5];
                    const x = it.transform?.[4];
                    if (typeof y !== "number" || typeof x !== "number") return false;
                    if (Math.abs(y - itemY) > 4) return false;
                    if (x <= (item.transform?.[4] || 0)) return false;
                    const s = (it.str || "").trim();
                    return /^\d+$/.test(s);
                  });

                  if (sameLineNumberItems.length > 0) {
                    // Sort by X coordinate ascending; the rightmost is the QTY column
                    sameLineNumberItems.sort(
                      (a, b) => (a.transform?.[4] || 0) - (b.transform?.[4] || 0)
                    );
                    const rightmost = sameLineNumberItems[sameLineNumberItems.length - 1];
                    const candidate = parseInt((rightmost.str || "").trim(), 10);
                    if (candidate > 0 && candidate <= 50 && !isGarmentSizeToken(candidate)) {
                      qty = candidate;
                    }
                  }
                }

                // 3. Fallback: scan next items within small lookahead window
                if (qty === 1) {
                  for (let j = i + 1; j < Math.min(items.length, i + 6); j++) {
                    const nextStr = (items[j].str || "").trim();
                    if (/^\d+$/.test(nextStr)) {
                      const candidate = parseInt(nextStr, 10);
                      if (candidate > 0 && candidate <= 50 && !isGarmentSizeToken(candidate)) {
                        qty = candidate;
                        break;
                      }
                    }
                  }
                }

                // Check if this SKU is already added for this order
                const existing = extractedLineItems.find(
                  (li) => li.sku.toLowerCase() === cleanSku.toLowerCase()
                );
                if (existing) {
                  existing.quantity += qty;
                } else {
                  extractedLineItems.push({
                    sku: cleanSku,
                    description: desc,
                    quantity: qty,
                  });
                }
              }
            }
          }

          // Fallback if no items extracted with pipe: scan within shipping label area for SKU-like tokens
          if (extractedLineItems.length === 0) {
            for (const it of items) {
              const itemY = it.transform?.[5];
              if (typeof itemY === "number" && itemY < labelMinY) continue;

              const str = (it.str || "").trim();
              const skuMatch = str.match(/\b([A-Za-z0-9]+-[A-Za-z0-9_\-]+)\b/);
              if (
                skuMatch &&
                !/^(e-kart|std|cod|prepaid|od\d|fmp|gstin|hsn)/i.test(skuMatch[1])
              ) {
                extractedLineItems.push({
                  sku: skuMatch[1],
                  description: "",
                  quantity: 1,
                });
                break;
              }
            }
          }
        } catch {
          // Ignore
        }
      }

      const primarySku =
        extractedLineItems.map((i) => i.sku).join(" / ") || "";
      const primaryDesc = extractedLineItems[0]?.description || "";
      const totalQty = extractedLineItems.reduce(
        (sum, i) => sum + i.quantity,
        0
      ) || 1;

      const orderType: "single_quantity" | "multiple_pieces" | "multiple_sku" =
        extractedLineItems.length > 1
          ? "multiple_sku"
          : totalQty > 1
          ? "multiple_pieces"
          : "single_quantity";

      orderList.push({
        index: processedOrders - 1,
        pageIndex: processedOrders - 1,
        orderNumber: processedOrders,
        orderId: orderId || `OD${processedOrders}`,
        awb: awb || "",
        sku: primarySku,
        description: primaryDesc,
        totalQuantity: totalQty,
        customerName: customerName || "",
        orderType,
        items: extractedLineItems,
      });

      // Yield event loop every 2 pages so UI animations render at 60 FPS smoothly
      if (pIdx % 2 === 0) {
        await new Promise((resolve) => setTimeout(resolve, 0));
      }

      const srcPage = srcDoc.getPage(pIdx);
      const { width, height } = srcPage.getSize();

      // Check if page is already thermal format (~288 x 432 pt)
      const isAlreadyThermal =
        Math.abs(width - TARGET_WIDTH) <= 25 &&
        Math.abs(height - TARGET_HEIGHT) <= 25;

      if (isAlreadyThermal) {
        // Label is already thermal format: add directly
        const [copiedLabel] = await shippingDoc.copyPages(srcDoc, [pIdx]);
        shippingDoc.addPage(copiedLabel);

        const [copiedTax] = await taxDoc.copyPages(srcDoc, [pIdx]);
        taxDoc.addPage(copiedTax);
      } else {
        // Standard Flipkart invoice page (A4: 595.28 x 841.89 pt)
        // Perfectly centered horizontally with equal margins on left and right
        const boxLeft = Math.max(0, width * 0.316);
        const boxRight = Math.min(width, width * 0.680);
        const boxTop = Math.min(height, height * 0.971);
        const boxBottom = templateNotForResaleY !== null
          ? Math.max(0, templateNotForResaleY - 9.0)
          : Math.max(0, height * 0.548);

        const boxW = Math.max(10, boxRight - boxLeft);
        const boxH = Math.max(10, boxTop - boxBottom);

        const MARGIN = 6;
        const availW = TARGET_WIDTH - 2 * MARGIN;
        const availH = TARGET_HEIGHT - 2 * MARGIN;

        // 1. Embed and draw Shipping Label onto thermal label page
        const embeddedLabel = await shippingDoc.embedPage(srcPage, {
          left: boxLeft,
          bottom: boxBottom,
          right: boxRight,
          top: boxTop,
        });

        const newLabelPage = shippingDoc.addPage([TARGET_WIDTH, TARGET_HEIGHT]);
        const scale = Math.min(availW / boxW, availH / boxH);
        const scaledW = boxW * scale;
        const scaledH = boxH * scale;

        const labelX = (TARGET_WIDTH - scaledW) / 2;
        const labelY = (TARGET_HEIGHT - scaledH) / 2;

        newLabelPage.drawPage(embeddedLabel, {
          x: labelX,
          y: labelY,
          width: scaledW,
          height: scaledH,
        });

        // 2. Embed and draw Tax Invoice
        // Starts strictly below the dotted divider line (excluding the dotted line entirely)
        // Includes top spacing (padding) so user can see and read the header data easily
        const taxTop = templateTaxInvoiceY !== null
          ? Math.min(height, templateTaxInvoiceY + 12)
          : Math.max(10, height * 0.520);
        const taxW = width;
        const taxH = taxTop;

        const embeddedTax = await taxDoc.embedPage(srcPage, {
          left: 0,
          bottom: 0,
          right: width,
          top: taxTop,
        });

        // Add 36 pt top spacing so user can see header data clearly without clipping
        const TOP_SPACING = 36;
        const newTaxPage = taxDoc.addPage([width, taxH + TOP_SPACING]);
        newTaxPage.drawPage(embeddedTax, {
          x: 0,
          y: 0,
          width,
          height: taxH,
        });
      }
    }
  } finally {
    if (pdfJsDoc) {
      try {
        await pdfJsDoc.destroy();
      } catch {}
    }
    if (loadingTask) {
      try {
        await loadingTask.destroy();
      } catch {}
    }
  }
}

  onProgress?.(92, "Finalizing documents & rendering previews...");
  await new Promise((resolve) => setTimeout(resolve, 0));

  const shippingBytes = await shippingDoc.save({ useObjectStreams: true });
  const taxBytes = await taxDoc.save({ useObjectStreams: true });

  // If a single file was uploaded, use the exact raw bytes for 100% fidelity
  // Otherwise save the merged original document containing both shipping label and tax invoice
  let originalBlob: Blob;
  if (files.length === 1) {
    const rawBuffer = await files[0].arrayBuffer();
    originalBlob = new Blob([rawBuffer], { type: "application/pdf" });
  } else {
    const originalBytes = await mergedOriginalDoc.save({ useObjectStreams: true });
    originalBlob = new Blob([originalBytes as unknown as BlobPart], { type: "application/pdf" });
  }

  const shippingLabelsBlob = new Blob([shippingBytes as unknown as BlobPart], { type: "application/pdf" });
  const taxInvoicesBlob = new Blob([taxBytes as unknown as BlobPart], { type: "application/pdf" });

  const totalSize = files.reduce((acc, f) => acc + f.size, 0);

  const summary: FlipcartOrderSummary = {
    pdfFileName: files.length === 1 ? files[0].name : `${files.length}_Flipcart_Invoices_Merged.pdf`,
    totalOrders: processedOrders || totalEstimatedPages,
    totalPdfSize: totalSize,
    processedAt: new Date().toISOString(),
    orders: orderList,
  };

  const toBase64 = async (b: Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const res = reader.result as string;
        resolve(res.includes(",") ? res.split(",")[1] : res);
      };
      reader.onerror = reject;
      reader.readAsDataURL(b);
    });
  };

  const filesPayload: FlipcartProcessFiles = {
    shippingLabelsPdfBase64: await toBase64(shippingLabelsBlob),
    taxInvoicesPdfBase64: await toBase64(taxInvoicesBlob),
    originalPdfBase64: await toBase64(originalBlob),
  };

  onProgress?.(100, "Processing complete! Opening Results...");

  return {
    summary,
    files: filesPayload,
    blobs: {
      shippingLabelsBlob,
      taxInvoicesBlob,
      originalBlob,
    },
    shippingDoc,
    shippingBytes,
  };
}
