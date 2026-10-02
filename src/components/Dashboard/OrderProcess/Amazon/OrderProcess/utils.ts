import { StandardFonts, rgb } from "pdf-lib";
import { asinImportService } from "@/components/Dashboard/Products/ManageProducts/services/asinImport.service";
import { productService } from "@/components/Dashboard/Products/ManageProducts/services/product.service";
import { productVariantService } from "@/components/Dashboard/Products/ManageProducts/services/productVariant.service";


/**
 * Clean customer name (original GitHub version without regex trimming).
 */
export function cleanCustomerName(raw: string): string {
  if (!raw || raw === "N/A") return "N/A";
  
  // Clean up any ZPL escape sequences
  let cleaned = raw.replace(/\\&/g, " ").trim();
  
  // Split into lines to extract just the first name line (ignore the rest of the address)
  const lines = cleaned.split(/[\r\n,]+/).map(l => l.trim()).filter(Boolean);
  
  for (const line of lines) {
    const upper = line.toUpperCase();
    // Filter out common false-positives
    if (
      upper.startsWith("SHIP DATE") ||
      upper.startsWith("ORDER DATE") ||
      upper.startsWith("INVOICE") ||
      upper.startsWith("AWB") ||
      upper.startsWith("SHIPPING") ||
      upper.startsWith("DELIVERY") ||
      /^\d{3}-\d{7}-\d{7}/.test(upper) ||
      upper.includes("@")
    ) {
      continue;
    }
    
    // First valid line is considered the customer name
    return line || "N/A";
  }

  return "N/A";
}

/**
 * Enhances Amazon invoice pages in the PDF by clearing intersecting gridlines
 * behind table values (Unit Price, Discount, Qty, Net Amount, Tax Rate, Tax Type,
 * Tax Amount, Total Amount) and redrawing them in crisp, bold, legible font.
 */
export async function enhanceInvoicePages(
  origDoc: any,
  pdfjsDocOrCache: any
): Promise<void> {
  try {
    const { StandardFonts, rgb } = await import("pdf-lib");
    const helveticaBold = await origDoc.embedFont(StandardFonts.HelveticaBold);

    const numPages = origDoc.getPageCount();

    for (let pageIdx = 0; pageIdx < numPages; pageIdx++) {
      try {
        let items: Array<{
          str: string;
          transform: number[];
          width: number;
          height: number;
        }> = [];

        if (Array.isArray(pdfjsDocOrCache)) {
          items = pdfjsDocOrCache[pageIdx]?.items || [];
        } else if (pdfjsDocOrCache && typeof pdfjsDocOrCache.getPage === "function") {
          const pdfjsPage = await pdfjsDocOrCache.getPage(pageIdx + 1);
          const textContent = await pdfjsPage.getTextContent();
          items = (textContent.items as any) || [];
        }

        if (!items || items.length === 0) continue;

        // Ultra-fast check if page is an invoice
        const isInvoice = items.some((it) => /Invoice|Description/i.test(it.str));
        if (!isInvoice) continue;

        const fullPageText = items.map((it) => it.str).join(" ");
        if (isAmazonTransporterOrFeePage(fullPageText)) continue;

        // Find table header row
        const unitPriceHeader = items.find((it) => {
          const s = it.str.trim();
          return /Unit\s*Price/i.test(s) || (s === "Unit" && it.transform[4] > 200);
        });
        const descHeader = items.find((it) => /^Description/i.test(it.str.trim()));

        const headerItem = unitPriceHeader || descHeader;
        if (!headerItem) continue;

        const headerY = headerItem.transform[5];
        const tableLeft = unitPriceHeader ? unitPriceHeader.transform[4] - 8 : 280;
        const tableRight = 575;

        // Find table bottom
        const totalRowItem = items.find((it) => /^TOTAL\s*:?/i.test(it.str.trim()));
        const wordsItem = items.find((it) => /Amount\s+in\s+Words/i.test(it.str.trim()));
        const tableBottom = totalRowItem
          ? totalRowItem.transform[5] - 8
          : wordsItem
          ? wordsItem.transform[5] + 10
          : headerY - 180;

        const origPage = origDoc.getPage(pageIdx);

        // Filter items in the numeric table area
        const tableDataItems = items.filter((it) => {
          const x = it.transform[4];
          const y = it.transform[5];
          const text = it.str.trim();
          if (!text) return false;

          // X within numeric columns
          if (x < tableLeft || x > tableRight + 10) return false;

          // Y below header and at or above bottom
          if (y >= headerY - 6 || y < tableBottom) return false;

          // Exclude stray header tokens if any
          if (/^(Unit|Price|Discount|Qty|Net|Amount|Tax|Rate|Type|Total)$/i.test(text)) {
            return false;
          }

          return true;
        });

        // Detect and handle any rows that show IGST: convert them to CGST + SGST
        const igstItems = tableDataItems.filter((it) => /^IGST$/i.test(it.str.trim()));
        const handledItemIndices = new Set<number>();

        for (const igstIt of igstItems) {
          const igstY = igstIt.transform[5];

          // Find tax rate and tax amount items in the same row (within ±6pt Y)
          const rowTaxRateIt = tableDataItems.find((it) => {
            if (Math.abs(it.transform[5] - igstY) > 6) return false;
            return /%/.test(it.str);
          });

          const rowTaxAmtIt = tableDataItems.find((it) => {
            if (Math.abs(it.transform[5] - igstY) > 6) return false;
            return it.transform[4] > igstIt.transform[4] && /[\d.]/.test(it.str);
          });

          tableDataItems.forEach((it, idx) => {
            if (it === igstIt || it === rowTaxRateIt || it === rowTaxAmtIt) {
              handledItemIndices.add(idx);
            }
          });

          // 1. Half rate for CGST and SGST
          let halfRateStr = "2.5%";
          if (rowTaxRateIt) {
            const rawRate = rowTaxRateIt.str.trim();
            const m = rawRate.match(/([\d.]+)\s*%/);
            if (m) {
              const val = parseFloat(m[1]);
              halfRateStr = (val / 2).toFixed(1).replace(/\.0$/, "") + "%";
            }
          }

          // 2. Half amount for CGST and SGST
          let halfAmt1 = "";
          let halfAmt2 = "";
          if (rowTaxAmtIt) {
            const rawAmt = rowTaxAmtIt.str.replace(/[\u20B9₹,]/g, "").trim();
            const val = parseFloat(rawAmt);
            if (!isNaN(val)) {
              const h1 = Math.round((val / 2) * 100) / 100;
              const h2 = Math.round((val - h1) * 100) / 100;
              halfAmt1 = h1.toFixed(2);
              halfAmt2 = h2.toFixed(2);
            }
          }

          const fontSize = 6.2;
          const yTop = igstY + 4;
          const yBottom = igstY - 4.5;

          // A. Tax Type: CGST on top, SGST below
          const typeX = igstIt.transform[4];
          const typeBoxW = Math.max(igstIt.width, helveticaBold.widthOfTextAtSize("CGST", fontSize)) + 4;
          origPage.drawRectangle({
            x: typeX - 2,
            y: yBottom - 2,
            width: typeBoxW,
            height: 16,
            color: rgb(1, 1, 1),
          });
          origPage.drawText("CGST", {
            x: typeX,
            y: yTop,
            size: fontSize,
            font: helveticaBold,
            color: rgb(0, 0, 0),
          });
          origPage.drawText("SGST", {
            x: typeX,
            y: yBottom,
            size: fontSize,
            font: helveticaBold,
            color: rgb(0, 0, 0),
          });

          // B. Tax Rate: half rate on top, half rate below
          if (rowTaxRateIt) {
            const rateX = rowTaxRateIt.transform[4];
            const rateBoxW = Math.max(rowTaxRateIt.width, helveticaBold.widthOfTextAtSize(halfRateStr, fontSize)) + 4;
            origPage.drawRectangle({
              x: rateX - 2,
              y: yBottom - 2,
              width: rateBoxW,
              height: 16,
              color: rgb(1, 1, 1),
            });
            origPage.drawText(halfRateStr, {
              x: rateX,
              y: yTop,
              size: fontSize,
              font: helveticaBold,
              color: rgb(0, 0, 0),
            });
            origPage.drawText(halfRateStr, {
              x: rateX,
              y: yBottom,
              size: fontSize,
              font: helveticaBold,
              color: rgb(0, 0, 0),
            });
          }

          // C. Tax Amount: half amount on top, half amount below
          if (rowTaxAmtIt && halfAmt1 && halfAmt2) {
            const amtX = rowTaxAmtIt.transform[4];
            const amtBoxW = Math.max(rowTaxAmtIt.width, helveticaBold.widthOfTextAtSize(halfAmt1, fontSize)) + 4;
            origPage.drawRectangle({
              x: amtX - 2,
              y: yBottom - 2,
              width: amtBoxW,
              height: 16,
              color: rgb(1, 1, 1),
            });
            origPage.drawText(halfAmt1, {
              x: amtX,
              y: yTop,
              size: fontSize,
              font: helveticaBold,
              color: rgb(0, 0, 0),
            });
            origPage.drawText(halfAmt2, {
              x: amtX,
              y: yBottom,
              size: fontSize,
              font: helveticaBold,
              color: rgb(0, 0, 0),
            });
          }
        }

        // Standard item loop for non-IGST items (Unit Price, Discount, Qty, Net Amount, Total Amount, etc.)
        for (let itIdx = 0; itIdx < tableDataItems.length; itIdx++) {
          if (handledItemIndices.has(itIdx)) continue;
          const it = tableDataItems[itIdx];
          const rawText = it.str.trim();
          if (!rawText) continue;

          // Clean currency symbol \u20B9 or ₹
          const cleanText = rawText.replace(/[\u20B9₹]/g, "").trim();

          // Standalone currency symbol: cover with white to remove line intersection
          if (!cleanText) {
            origPage.drawRectangle({
              x: it.transform[4] - 2,
              y: it.transform[5] - 2,
              width: it.width + 4,
              height: it.height + 4,
              color: rgb(1, 1, 1),
            });
            continue;
          }

          const fontSize = Math.min(Math.max(it.height * 0.95, 6.5), 8);
          const textWidth = helveticaBold.widthOfTextAtSize(cleanText, fontSize);

          const padX = 2.5;
          const padY = 2;
          const boxW = Math.max(it.width, textWidth) + padX * 2;
          const boxH = Math.max(it.height, fontSize) + padY * 2;

          // 1. Draw solid white rectangle to erase intersecting vertical/horizontal lines
          origPage.drawRectangle({
            x: it.transform[4] - padX,
            y: it.transform[5] - padY,
            width: boxW,
            height: boxH,
            color: rgb(1, 1, 1),
          });

          // 2. Draw clean, bold, legible value
          origPage.drawText(cleanText, {
            x: it.transform[4],
            y: it.transform[5],
            size: fontSize,
            font: helveticaBold,
            color: rgb(0, 0, 0),
          });
        }
      } catch (pageErr) {
        console.warn(`Could not enhance invoice table for page ${pageIdx + 1}:`, pageErr);
      }
    }
  } catch (err) {
    console.warn("enhanceInvoicePages encountered an error:", err);
  }
}

/**
 * Maps extracted ASINs in Amazon orders to internal seller SKUs (variantSku) stored in DB ProductVariant model.
 * Rules:
 * - If ASIN matches in DB and has variantSku -> returns variantSku
 * - If ASIN matches in DB but variantSku is empty/null -> returns "-"
 * - If ASIN does not match in DB (or missing/N/A) -> returns "N/A"
 */
export function getCleanSkuList(sellerSku?: string): string[] {
  if (
    !sellerSku ||
    sellerSku === "N/A" ||
    sellerSku === "-" ||
    sellerSku === "[ N/A ]" ||
    sellerSku === "[ NA ]" ||
    sellerSku === "[ - ]"
  ) {
    return [];
  }

  const rawTokens = sellerSku
    .split(/[\r\n]+|\s+\/\s+|,\s+/)
    .map((s) => s.trim().replace(/^\[\s*|\s*\]$/g, "").trim())
    .filter((s) => s && !/^(?:N\/?A|-)$/i.test(s) && !/^B0[A-Z0-9]{8}$/i.test(s));

  const uniqueSkus: string[] = [];
  const seen = new Set<string>();
  for (const t of rawTokens) {
    const upper = t.toUpperCase();
    if (!seen.has(upper)) {
      seen.add(upper);
      uniqueSkus.push(t);
    }
  }

  return uniqueSkus;
}

/**
 * Loads the complete ASIN-to-SellerSKU mapping from database.
 * Combines AsinImport (primary), Products (masterSku & variants), and ProductVariants table.
 * Strictly ignores any values that are ASINs, "N/A", or empty, ensuring exact matching.
 */
export async function loadAsinToSkuMap(token: string): Promise<Map<string, string>> {
  const map = new Map<string, string>();

  const [asinSettled, prodSettled, varSettled] = await Promise.allSettled([
    asinImportService.getAll("", token),
    productService.getAll(token),
    productVariantService.getAll(token),
  ]);

  // 1. Primary: Fetch from AsinImport table
  if (asinSettled.status === "fulfilled") {
    const asinRes = asinSettled.value;
    if (asinRes?.data && Array.isArray(asinRes.data)) {
      asinRes.data.forEach((item: any) => {
        const cleanAsin = item.asin ? String(item.asin).trim().toUpperCase() : "";
        const cleanSku =
          (item.sku ? String(item.sku).trim() : "") ||
          (item.sellerSku ? String(item.sellerSku).trim() : "");
        if (
          cleanAsin &&
          cleanSku &&
          !/^B0[A-Z0-9]{8}$/i.test(cleanSku) &&
          cleanSku !== "N/A" &&
          cleanSku !== "-"
        ) {
          map.set(cleanAsin, cleanSku);
        }
      });
    }
  } else {
    console.warn("Could not fetch AsinImports for mapping:", asinSettled.reason);
  }

  // 2. Fallback: Check products table (masterSku & nested variants)
  if (prodSettled.status === "fulfilled") {
    const prodRes = prodSettled.value;
    if (prodRes?.data && Array.isArray(prodRes.data)) {
      prodRes.data.forEach((prod: any) => {
        const cleanAsin = prod.asin ? String(prod.asin).trim().toUpperCase() : "";
        const cleanSku =
          (prod.masterSku ? String(prod.masterSku).trim() : "") ||
          (prod.sku ? String(prod.sku).trim() : "");
        if (
          cleanAsin &&
          !map.has(cleanAsin) &&
          cleanSku &&
          !/^B0[A-Z0-9]{8}$/i.test(cleanSku) &&
          cleanSku !== "N/A" &&
          cleanSku !== "-"
        ) {
          map.set(cleanAsin, cleanSku);
        }

        if (Array.isArray(prod.variants)) {
          prod.variants.forEach((v: any) => {
            const vAsin = v.asin ? String(v.asin).trim().toUpperCase() : "";
            const vSku =
              (v.variantSku ? String(v.variantSku).trim() : "") ||
              (v.sku ? String(v.sku).trim() : "");
            if (
              vAsin &&
              !map.has(vAsin) &&
              vSku &&
              !/^B0[A-Z0-9]{8}$/i.test(vSku) &&
              vSku !== "N/A" &&
              vSku !== "-"
            ) {
              map.set(vAsin, vSku);
            }
          });
        }
      });
    }
  } else {
    console.warn("Could not fetch products for ASIN mapping:", prodSettled.reason);
  }

  // 3. Fallback: Check product variants table (variantSku & sku)
  if (varSettled.status === "fulfilled") {
    const varRes = varSettled.value;
    if (varRes?.data && Array.isArray(varRes.data)) {
      varRes.data.forEach((variant: any) => {
        const cleanAsin = variant.asin ? String(variant.asin).trim().toUpperCase() : "";
        const cleanSku =
          (variant.variantSku ? String(variant.variantSku).trim() : "") ||
          (variant.sku ? String(variant.sku).trim() : "");
        if (
          cleanAsin &&
          !map.has(cleanAsin) &&
          cleanSku &&
          !/^B0[A-Z0-9]{8}$/i.test(cleanSku) &&
          cleanSku !== "N/A" &&
          cleanSku !== "-"
        ) {
          map.set(cleanAsin, cleanSku);
        }
      });
    }
  } else {
    console.warn("Could not fetch product variants for ASIN mapping:", varSettled.reason);
  }

  return map;
}

/**
 * Maps extracted ASINs in Amazon orders to internal seller SKUs (variantSku) stored in DB.
 * Never allows an ASIN to be returned as a Seller SKU.
 */
export function mapAsinToSellerSku(
  asinValue?: string,
  asinToSkuMap?: Map<string, string>,
  fallbackSku?: string
): string {
  const fallbackList = (fallbackSku && fallbackSku !== "N/A" && fallbackSku !== "-")
    ? Array.from(
        new Set(
          fallbackSku
            .split(/[\r\n]+|\s+\/\s+|\s*,\s+/)
            .map((s) => s.trim())
            .filter((s) => s && s !== "N/A" && s !== "-" && !/^B0[A-Z0-9]{8}$/i.test(s))
        )
      )
    : [];

  const rawAsins = (asinValue && asinValue !== "N/A")
    ? Array.from(
        new Set(
          asinValue.split(/[\r\n]+|\s+\/\s+|\s*,\s+/).map((s) => s.trim().toUpperCase()).filter(Boolean)
        )
      )
    : [];

  const resultSkus: string[] = [];

  if (rawAsins.length > 0) {
    for (let i = 0; i < rawAsins.length; i++) {
      const asin = rawAsins[i];
      let sku = "";

      if (asin && asinToSkuMap && asinToSkuMap.size > 0) {
        const normAsin = asin.toUpperCase().trim();
        if (asinToSkuMap.has(normAsin)) {
          const val = asinToSkuMap.get(normAsin)?.trim();
          if (val && val !== "N/A" && val !== "-" && !/^B0[A-Z0-9]{8}$/i.test(val)) {
            sku = val;
          }
        }
      }

      // Fallback to invoice-extracted SKU only if mapping failed
      if (!sku) {
        if (fallbackList[i] && !/^B0[A-Z0-9]{8}$/i.test(fallbackList[i])) {
          sku = fallbackList[i];
        } else if (fallbackList.length === 1 && !/^B0[A-Z0-9]{8}$/i.test(fallbackList[0])) {
          sku = fallbackList[0];
        }
      }

      if (sku && sku !== "N/A" && sku !== "-" && !/^B0[A-Z0-9]{8}$/i.test(sku)) {
        resultSkus.push(sku);
      }
    }
    
    // If we only had 1 ASIN but mapping failed and we have multiple fallback SKUs,
    // we might want to include them just in case, but usually we just want a 1:1 mapping.
    // For now, we stick to the 1:1 mapping to avoid extra garbage SKUs.
  } else if (fallbackList.length > 0) {
    // If no ASINs were found, just use the fallback list
    const validFallback = fallbackList.filter((s) => !/^B0[A-Z0-9]{8}$/i.test(s));
    resultSkus.push(...validFallback);
  }

  const uniqueResultSkus = Array.from(new Set(resultSkus));

  return uniqueResultSkus.length > 0 ? uniqueResultSkus.join("\n") : "N/A";
}

/**
 * Formats Seller SKUs for display on labels: each SKU is displayed in [ <seller_sku> ].
 * Never displays [NA] or [N/A].
 */
export function formatSkuForLabel(sellerSku?: string): string {
  const skus = getCleanSkuList(sellerSku);
  if (skus.length === 0) {
    return "";
  }
  return skus.map((s) => `[ ${s} ]`).join(" ");
}

function formatSkuForLabelWithTotal(skus: string[], totalQuantity?: number): string {
  if (skus.length === 0) return "";
  let qtyPerSku = 1;
  let remainder = 0;
  if (totalQuantity !== undefined && totalQuantity > 0) {
    qtyPerSku = Math.floor(totalQuantity / skus.length);
    remainder = totalQuantity % skus.length;
  }

  return skus
    .map((s, idx) => {
      const q = qtyPerSku + (idx < remainder ? 1 : 0);
      return `[${s}][${q}]`;
    })
    .join(" ");
}

/**
 * Extracts exact line-item quantities for each SKU from Amazon invoice page text.
 * Avoids false remainder distributions by inspecting table quantity tokens near each ASIN.
 * Returns formatted string: e.g. "[sku a][1] [sku b][2]".
 */
export function extractSkuQtyPairsFromInvoice(
  invoiceText: string,
  asinToSkuMap: Map<string, string>,
  sellerSkuStr?: string,
  asinStr?: string,
  totalQuantity?: number
): string {
  const fallbackSkus = getCleanSkuList(sellerSkuStr);

  // If no text or only single SKU with single qty
  if (!invoiceText || invoiceText.trim().length === 0) {
    if (fallbackSkus.length === 1) {
      return `[${fallbackSkus[0]}][${totalQuantity || 1}]`;
    }
    return formatSkuForLabelWithTotal(fallbackSkus, totalQuantity);
  }

  // 1. Locate all unique ASIN occurrences in the invoice text in order of appearance
  const asinRegex = /\b(B0[A-Z0-9]{8})\b/gi;
  const matches = Array.from(invoiceText.matchAll(asinRegex));
  const seenAsins = new Set<string>();
  const uniqueAsins: Array<{ asin: string; index: number }> = [];

  for (const m of matches) {
    const a = m[1].toUpperCase();
    if (!seenAsins.has(a)) {
      seenAsins.add(a);
      uniqueAsins.push({ asin: a, index: m.index ?? 0 });
    }
  }

  const rawAsinsList = (asinStr && asinStr !== "N/A" ? asinStr : "")
    .split(/[\r\n]+|\s+\/\s+/)
    .map((s) => s.trim().toUpperCase())
    .filter(Boolean);

  // Case A: Multiple unique ASINs found in the invoice text
  if (uniqueAsins.length > 1) {
    const pairs: Array<{ sku: string; qty: number }> = [];

    for (let i = 0; i < uniqueAsins.length; i++) {
      const { asin, index } = uniqueAsins[i];
      const nextIndex = uniqueAsins[i + 1]?.index ?? Math.min(index + 1500, invoiceText.length);
      const section = invoiceText.substring(index, nextIndex);

      // In Indian GST invoice tables, Qty is trapped between price decimals (e.g. "499.00  1  499.00" or ".24  2  950.48")
      let qty = 1;
      const priceQtyMatch = section.match(/(?:\.\d{2}|₹\s*\d+)\s+([1-9]\d{0,1})\s+(?:₹\s*)?(?:\d{1,6}(?:,\d{3})*)?\.\d{2}/);
      if (priceQtyMatch?.[1]) {
        const parsed = parseInt(priceQtyMatch[1], 10);
        if (parsed >= 1 && parsed <= 50) qty = parsed;
      } else {
        const explicitQtyMatch = section.match(/\b(?:Qty|Quantity)\s*[:\-#|=]?\s*([1-9]\d{0,1})\b/i);
        if (explicitQtyMatch?.[1]) {
          const parsed = parseInt(explicitQtyMatch[1], 10);
          if (parsed >= 1 && parsed <= 50) qty = parsed;
        }
      }

      let sku = asinToSkuMap.get(asin);
      if (!sku || sku === "N/A" || sku === "-") {
        sku = fallbackSkus[i] || fallbackSkus[0] || asin;
      }

      pairs.push({ sku, qty });
    }

    // Combine same SKU if duplicated
    const consolidated = new Map<string, number>();
    for (const p of pairs) {
      consolidated.set(p.sku, (consolidated.get(p.sku) || 0) + p.qty);
    }

    return Array.from(consolidated.entries())
      .map(([s, q]) => `[${s}][${q}]`)
      .join(" ");
  }

  // Case B: Only 1 unique ASIN (or single item repeated)
  if (uniqueAsins.length === 1 || rawAsinsList.length <= 1) {
    const singleAsin = uniqueAsins[0]?.asin || rawAsinsList[0] || "";
    let singleSku = singleAsin ? asinToSkuMap.get(singleAsin) : "";
    if (!singleSku || singleSku === "N/A" || singleSku === "-") {
      singleSku = fallbackSkus[0] || singleAsin || "N/A";
    }
    const finalQty = totalQuantity !== undefined && totalQuantity >= 1 ? totalQuantity : 1;
    return `[${singleSku}][${finalQty}]`;
  }

  // Case C: Multiple fallback SKUs without ASIN matches in text (e.g. non-ASIN invoices)
  if (fallbackSkus.length > 1) {
    const pairs: Array<{ sku: string; qty: number }> = [];
    for (let i = 0; i < fallbackSkus.length; i++) {
      const s = fallbackSkus[i];
      const pos = invoiceText.indexOf(s);
      let qty = 1;
      if (pos !== -1) {
        const nextPos = i + 1 < fallbackSkus.length ? invoiceText.indexOf(fallbackSkus[i + 1]) : pos + 1000;
        const section = invoiceText.substring(pos, nextPos > pos ? nextPos : pos + 1000);
        const m = section.match(/(?:\.\d{2}|₹\s*\d+)\s+([1-9]\d{0,1})\s+(?:₹\s*)?(?:\d{1,6}(?:,\d{3})*)?\.\d{2}/);
        if (m?.[1]) {
          qty = parseInt(m[1], 10);
        }
      }
      pairs.push({ sku: s, qty });
    }

    const consolidated = new Map<string, number>();
    for (const p of pairs) {
      consolidated.set(p.sku, (consolidated.get(p.sku) || 0) + p.qty);
    }

    return Array.from(consolidated.entries())
      .map(([s, q]) => `[${s}][${q}]`)
      .join(" ");
  }

  return formatSkuForLabelWithTotal(fallbackSkus, totalQuantity);
}

/**
 * Draws formatted Seller SKUs on a 4" x 6" label page below "Sold on : www.amazon.in".
 * - Every SKU is shown inside [ ... ].
 * - Never prints [NA] or [N/A].
 * - If more than 3 SKUs come, adjusts font size according to count and wraps cleanly across 2 lines.
 */
export async function drawSkuOnLabelPage(
  doc: any,
  page: any,
  sellerSku: string,
  labelX: number,
  labelY: number,
  labelW: number,
  labelH: number,
  totalQuantity?: number
): Promise<void> {
  if (!sellerSku) return;

  // 1. Check if sellerSku already has explicit [SKU][QTY] pairs: e.g. "[sku a][1] [sku b][2]"
  const preformattedPairs = Array.from(
    sellerSku.matchAll(/\[\s*([^\]]+?)\s*\]\s*\[\s*(\d+)\s*\]/g)
  );

  let formattedSkus: string[] = [];
  if (preformattedPairs.length > 0) {
    formattedSkus = preformattedPairs.map((m) => `[${m[1].trim()}][${m[2].trim()}]`);
  } else {
    const skus = getCleanSkuList(sellerSku);
    if (skus.length === 0) return; // Do NOT print [NA] or [N/A]!

    let qtyPerSku = 1;
    let remainder = 0;
    if (totalQuantity !== undefined && totalQuantity > 0) {
      qtyPerSku = Math.floor(totalQuantity / skus.length);
      remainder = totalQuantity % skus.length;
    }

    formattedSkus = skus.map((s, idx) => {
      const q = qtyPerSku + (idx < remainder ? 1 : 0);
      return `[${s}][${q}]`;
    });
  }

  const count = formattedSkus.length;

  try {
    const font = await doc.embedFont(StandardFonts.HelveticaBold);
    const skuX = labelX + 16;
    const maxAvailableW = labelW - 28;

    if (count <= 3) {
      const fullText = formattedSkus.join(" ");
      let fontSize = count === 1 ? 7.5 : count === 2 ? 6.8 : 5.8;

      const textWidth = font.widthOfTextAtSize(fullText, fontSize);
      if (textWidth > maxAvailableW) {
        fontSize = Math.max(4.5, (maxAvailableW / textWidth) * fontSize);
      }

      page.drawText(fullText, {
        x: skuX,
        y: labelY + 2.5,
        size: fontSize,
        font: font,
        color: rgb(0, 0, 0),
      });
    } else {
      // More than 3 SKUs (e.g. 4, 5, 6+):
      // Adjust size according to how many SKUs come, and wrap onto 2 compact lines
      const half = Math.ceil(count / 2);
      const line1Tokens = formattedSkus.slice(0, half);
      const line2Tokens = formattedSkus.slice(half);

      const line1Text = line1Tokens.join(" ");
      const line2Text = line2Tokens.join(" ");

      let fontSize = count === 4 ? 5.2 : count === 5 ? 4.7 : 4.2;

      const w1 = font.widthOfTextAtSize(line1Text, fontSize);
      const w2 = font.widthOfTextAtSize(line2Text, fontSize);
      const maxW = Math.max(w1, w2);
      if (maxW > maxAvailableW) {
        fontSize = Math.max(3.8, (maxAvailableW / maxW) * fontSize);
      }

      page.drawText(line1Text, {
        x: skuX,
        y: labelY + 6.5,
        size: fontSize,
        font: font,
        color: rgb(0, 0, 0),
      });

      page.drawText(line2Text, {
        x: skuX,
        y: labelY + 1.0,
        size: fontSize,
        font: font,
        color: rgb(0, 0, 0),
      });
    }
  } catch (err) {
    console.warn("Could not draw SKU on label page:", err);
  }
}

/**
 * Detects whether a PDF page is an Amazon Transporter Duplicate or Marketplace Fee invoice
 * (e.g. "Tax Invoice/Bill of Supply/Cash Memo (Duplicate for Transporter)", Sold By: Amazon Seller Services,
 * with digitally signed green tick and line item "Marketplace Fees").
 * These pages must be strictly excluded from printing, combined match PDF, and comparison tables.
 */
export function isAmazonTransporterOrFeePage(text?: string): boolean {
  if (!text) return false;
  const upper = text.toUpperCase();

  // 1. Must contain "MARKETPLACE FEES" or "MARKETPLACE FEE" (unique to this fee invoice)
  if (upper.includes("MARKETPLACE FEES") || upper.includes("MARKETPLACE FEE")) {
    return true;
  }

  // 2. Must be specifically "(Duplicate for Transporter)" AND sold by Amazon Seller Services / MKT- invoice
  if (upper.includes("DUPLICATE FOR TRANSPORTER")) {
    if (
      /SOLD\s+BY\s*:\s*AMAZON\s+SELLER\s+SERVICES/i.test(text) ||
      upper.includes("AMAZON SELLER SERVICES PRIVATE LIMITED") ||
      upper.includes("MKT-")
    ) {
      return true;
    }
  }

  // 3. Specifically Sold By Amazon Seller Services with MKT- invoice (never the merchant)
  if (
    /SOLD\s+BY\s*:\s*AMAZON\s+SELLER\s+SERVICES/i.test(text) &&
    upper.includes("MKT-")
  ) {
    return true;
  }

  return false;
}

/**
 * Detects whether a page is a Transporter Duplicate / Delivery copy
 * (e.g. "Tax Invoice/Bill of Supply/Cash Memo (Duplicate for Transporter)").
 * These pages must NEVER go inside matched combined PDF, but go into unmatched PDF.
 */
export function isTransporterDuplicatePage(text?: string): boolean {
  if (!text) return false;
  // A genuine page with items is NEVER an empty transporter copy!
  const hasItems =
    /\bB0[A-Z0-9]{8}\b/i.test(text) ||
    (/(?:Description|Unit\s*Price|Gross\s*Amount|Taxable\s*Value)/i.test(text) &&
      /(?:HSN|SAC|\b\d+\s*\|\s*₹|\bQty\b|\bQuantity\b)/i.test(text));
  if (hasItems) return false;

  // A page containing the final total / amount in words is an invoice footer page, NOT an empty duplicate!
  const hasInvoiceTotal =
    /\bTOTAL\s*(?::|₹|$)/i.test(text) ||
    /\bGrand Total\b/i.test(text) ||
    /Amount in Words/i.test(text);
  if (hasInvoiceTotal) return false;

  const upper = text.toUpperCase();
  return (
    upper.includes("DUPLICATE FOR TRANSPORTER") ||
    upper.includes("TRANSPORTER COPY") ||
    upper.includes("DELIVERY COPY") ||
    upper.includes("CARRIER COPY") ||
    upper.includes("FOR CARRIER USE")
  );
}

export interface AddInvoicePageOptions {
  targetWidth?: number;
  targetHeight?: number;
  margin?: number;
  totalAmount?: string;
  itemCount?: number;
  allowTransporter?: boolean;
}

/**
 * Adds an Amazon Tax Invoice to a target PDFDocument, guaranteeing that the entire invoice
 * (including header, all line items, and the TOTAL price footer) fits onto
 * EXACTLY ONE 4" x 6" page.
 *
 * - If the invoice is 1 page: scales and centers it neatly onto a 4" x 6" page.
 * - If the invoice has multiple pages and order has MORE THAN 3 items (itemCount > 3):
 *   intelligently crops out duplicated headers and whitespace, stacking the sections
 *   vertically so all line items and the TOTAL price block fit onto the single 4" x 6" page.
 * - If the order has <= 3 items: does NOT combine pages, rendering each page individually.
 */
export async function addInvoicePagesToDoc(
  targetDoc: any,
  origDoc: any,
  pdfPages: number[],
  pageTextData?: Array<{ text: string; items: any[] }>,
  options: AddInvoicePageOptions = {}
): Promise<any> {
  const TARGET_WIDTH = options.targetWidth || 4 * 72; // 288 pt
  const TARGET_HEIGHT = options.targetHeight || 6 * 72; // 432 pt
  const MARGIN = options.margin !== undefined ? options.margin : 5; // 5 pt margin
  const availW = TARGET_WIDTH - 2 * MARGIN;
  const availH = TARGET_HEIGHT - 2 * MARGIN;

  const validPageNumbers = (pdfPages || []).filter((p) => {
    const idx = p - 1;
    if (idx < 0 || idx >= origDoc.getPageCount()) return false;
    const txt = pageTextData && pageTextData[idx]?.text;
    if (txt && isAmazonTransporterOrFeePage(txt)) {
      return false;
    }
    if (!options.allowTransporter && txt && isTransporterDuplicatePage(txt)) {
      return false;
    }
    return true;
  });

  if (validPageNumbers.length === 0) return null;

  // Resolve item count to determine whether multi-page combination is allowed
  let resolvedItemCount = options.itemCount;
  if (pageTextData) {
    const combinedText = validPageNumbers.map((p) => pageTextData[p - 1]?.text || "").join("\n");
    const asinMatches = combinedText.match(/\bB0[A-Z0-9]{8}\b/g);
    const asinCount = asinMatches ? asinMatches.length : 0;
    const uniqueAsinCount = asinMatches ? new Set(asinMatches).size : 0;
    const textCount = Math.max(asinCount, uniqueAsinCount);
    if (textCount > 0) {
      resolvedItemCount = Math.max(resolvedItemCount || 0, textCount);
    }
  }

  // Render each page individually as a standard 4" x 6" page
  let lastAddedPage = null;
  const pagesToRender = validPageNumbers;
    for (const pageNum of pagesToRender) {
      const pageIdx = pageNum - 1;
      const srcPage = origDoc.getPage(pageIdx);
      const embedded = await targetDoc.embedPage(srcPage);
      const { width: srcW, height: srcH } = embedded;

      const scale = Math.min(availW / srcW, availH / srcH);
      const finalW = srcW * scale;
      const finalH = srcH * scale;

      const x = (TARGET_WIDTH - finalW) / 2;
      const y = (TARGET_HEIGHT - finalH) / 2;

      const newPage = targetDoc.addPage([TARGET_WIDTH, TARGET_HEIGHT]);
      newPage.drawPage(embedded, { x, y, width: finalW, height: finalH });
      lastAddedPage = newPage;
    }
    return lastAddedPage;
}

/**
 * Sanitizes cell values to prevent Formula / CSV Injection (CWE-1236).
 * If a string begins with formula trigger characters (=, +, -, @, \t, \r),
 * it prepends a single quote (') so spreadsheet engines (Excel, LibreOffice, Google Sheets)
 * treat it strictly as literal text instead of executable formulas or DDE commands.
 */
export function sanitizeSpreadsheetCell(value: unknown): string {
  if (value === null || value === undefined) return "";
  const str = String(value);
  const trimmed = str.trim();
  if (/^[=+@\-\t\r]/.test(trimmed)) {
    return `'${trimmed}`;
  }
  return str;
}

