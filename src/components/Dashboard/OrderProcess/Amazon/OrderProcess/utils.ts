import { StandardFonts, rgb } from "pdf-lib";
import { asinImportService } from "@/components/Dashboard/Products/ManageProducts/services/asinImport.service";
import { productService } from "@/components/Dashboard/Products/ManageProducts/services/product.service";
import { productVariantService } from "@/components/Dashboard/Products/ManageProducts/services/productVariant.service";

/**
 * Check whether a word is a valid name token.
 * Valid name tokens contain ONLY alphabetic letters (no digits like A602, O9ff) and are not address keywords.
 */
function isValidNameWord(word: string): boolean {
  if (!word || word.length < 2) return false;

  // Must consist ONLY of alphabetic letters (no numbers)
  if (!/^[A-Za-z]+$/.test(word)) return false;

  const upper = word.toUpperCase();
  const addressKeywords = [
    "FLAT",
    "HNO",
    "HOUSE",
    "PLOT",
    "ROOM",
    "SHOP",
    "BLDG",
    "BUILDING",
    "APARTMENT",
    "APT",
    "TOWER",
    "FLOOR",
    "BLOCK",
    "SECTOR",
    "OPP",
    "OPPOSITE",
    "NEAR",
    "BEHIND",
    "BESIDE",
    "ROAD",
    "STREET",
    "LANE",
    "NAGAR",
    "COLONY",
    "ENCLAVE",
    "VIHAR",
    "LAYOUT",
    "SOCIETY",
    "VILLAGE",
    "VILL",
    "POST",
    "TALUKA",
    "DIST",
    "DISTRICT",
    "PIN",
    "PINCODE",
    "NO",
    "NUM",
    "NUMBER",
    "PH",
    "PHONE",
    "MOB",
    "MOBILE",
    "TEL",
    "SHIPPING",
    "BILLING",
    "ADDRESS",
    "SHIP",
    "NAME",
    "RECIPIENT",
    "CUSTOMER",
  ];

  if (addressKeywords.includes(upper)) return false;

  return true;
}

/**
 * Clean customer name by removing addresses, pin codes, and delivery details.
 */
export function cleanCustomerName(raw: string): string {
  if (!raw || raw === "N/A") return "N/A";

  // 1. Remove Shipping Address / Billing Address / Ship To headers & prefixes
  let cleaned = raw
    .replace(/^[\s\S]*?(?:Shipping|Billing)\s+Address\s*[:\-]?\s*/i, "")
    .replace(/^[\s\S]*?Ship\s+To\s*[:\-]?\s*/i, "")
    .replace(/^(Customer\s*Name|Recipient|Name)\s*[:\-]?\s*/i, "")
    .trim();

  // 2. Extract ONLY the very first non-empty line of the address block
  const lines = cleaned.split(/[\r\n]+/);
  const firstLine = lines.find((l) => l.trim().length > 0) || cleaned;

  // 3. Split first line by comma, pipe, semicolon, ZPL newline (\\&), or dash
  cleaned = firstLine.split(/\\&|[,|;]|\s+-\s+/)[0].trim();

  // 4. Remove C/O prefix if present
  cleaned = cleaned.replace(/^C\/O\s*[:\-]?\s*/i, "").trim();

  // 5. Remove known address trigger words if stuck to the name without commas
  const addressTrigger =
    /\s+(?:Flat|H\.?No|House|Plot|Room|Shop|Bldg|Building|Apartment|Apt|Tower|Floor|Block|Sector|Opp|Opposite|Near|Behind|Beside|Road|Street|Lane|Nagar|Colony|Enclave|Vihar|Layout|Society|Village|Vill|Post|Taluka|Dist|District|PIN|Pincode|\d{1,5}[A-Za-z]?\b).*$/i;
  cleaned = cleaned.replace(addressTrigger, "").trim();

  // 6. Remove trailing digits, postal codes, or punctuation
  cleaned = cleaned.replace(/\s*\b\d{5,6}\b.*$/, "").trim();
  cleaned = cleaned.replace(/[,\-:;.]+$/, "").trim();

  // 7. Tokenize into words and filter for valid human name words ONLY
  const rawWords = cleaned
    .split(/\s+/)
    .map((w) => w.replace(/[^A-Za-z0-9]/g, ""))
    .filter(Boolean);

  const uniqueWords: string[] = [];
  const seenLower = new Set<string>();

  for (const word of rawWords) {
    if (!isValidNameWord(word)) continue;
    const lower = word.toLowerCase();
    if (!seenLower.has(lower)) {
      seenLower.add(lower);
      uniqueWords.push(word);
    }
  }

  // 8. Keep at most 2 valid name words (Firstname + Middlename / Firstname + Lastname)
  const finalWords = uniqueWords.slice(0, 2);

  // Capitalize properly if ALL CAPS
  const formatted = finalWords
    .map((w) =>
      w === w.toUpperCase() && w.length > 1
        ? w.charAt(0) + w.slice(1).toLowerCase()
        : w
    )
    .join(" ");

  return formatted || "N/A";
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

  // 1. Primary: Fetch from AsinImport table
  try {
    const asinRes = await asinImportService.getAll("", token);
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
  } catch (aErr) {
    console.warn("Could not fetch AsinImports for mapping:", aErr);
  }

  // 2. Fallback: Check products table (masterSku & nested variants)
  try {
    const prodRes = await productService.getAll(token);
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
  } catch (pErr) {
    console.warn("Could not fetch products for ASIN mapping:", pErr);
  }

  // 3. Fallback: Check product variants table (variantSku & sku)
  try {
    const varRes = await productVariantService.getAll(token);
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
  } catch (vErr) {
    console.warn("Could not fetch product variants for ASIN mapping:", vErr);
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
  const maxLen = Math.max(rawAsins.length, fallbackList.length, 1);

  for (let i = 0; i < maxLen; i++) {
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

    // Fallback to invoice-extracted SKU only if valid and not an ASIN
    if (!sku && fallbackList[i] && !/^B0[A-Z0-9]{8}$/i.test(fallbackList[i])) {
      sku = fallbackList[i];
    } else if (!sku && fallbackList.length === 1 && !/^B0[A-Z0-9]{8}$/i.test(fallbackList[0])) {
      sku = fallbackList[0];
    }

    if (sku && sku !== "N/A" && sku !== "-" && !/^B0[A-Z0-9]{8}$/i.test(sku)) {
      resultSkus.push(sku);
    }
  }

  const uniqueResultSkus = Array.from(new Set(resultSkus));

  if (uniqueResultSkus.length === 0 && fallbackList.length > 0) {
    const validFallback = fallbackList.filter((s) => !/^B0[A-Z0-9]{8}$/i.test(s));
    if (validFallback.length > 0) return validFallback.join("\n");
  }

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
  labelH: number
): Promise<void> {
  const skus = getCleanSkuList(sellerSku);
  if (skus.length === 0) return; // Do NOT print [NA] or [N/A]!

  const formattedSkus = skus.map((s) => `[ ${s} ]`);
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

  const upper = text.toUpperCase();
  return (
    upper.includes("DUPLICATE FOR TRANSPORTER") ||
    upper.includes("TRANSPORTER COPY") ||
    upper.includes("DELIVERY COPY") ||
    upper.includes("CARRIER COPY") ||
    upper.includes("FOR CARRIER USE") ||
    (upper.includes("AUTHORIZED SIGNATORY") && (upper.includes("REVERSE CHARGE") || upper.includes("DEMAND FOR PAYMENT")))
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

  // CRITICAL USER REQUIREMENT:
  // "this type of page not goes inside matched combined pdf but it goes into unmatched pdf
  //  and only for more than 4+ order and needed then page 2 came other than that no need of page 2"
  const shouldCombine = false;

  // If only 1 page OR order has <= 4 items OR > 4 items:
  // Render each page individually as a standard 4" x 6" page!
  if (!shouldCombine) {
    let lastAddedPage = null;
    // For <= 4 items, only 1 page is rendered; for > 4 items, up to 2 pages are rendered
    let pagesToRender = validPageNumbers;
    if (resolvedItemCount !== undefined && resolvedItemCount <= 4 && !options.allowTransporter) {
      pagesToRender = validPageNumbers.slice(0, 1);
    } else if (validPageNumbers.length > 2) {
      pagesToRender = validPageNumbers.slice(0, 2);
    }
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

  // --------------------------------------------------------------------------
  // CASE 2: Multi-page invoice (5+ items spanning 2 or more pages)
  // Dynamically compress and stack all pages into EXACTLY ONE 4" x 6" page
  // showing all line items from Page 1 through Page 2 down to the TOTAL price!
  // --------------------------------------------------------------------------
  try {
    const sections: Array<{
      embedded: any;
      cropW: number;
      cropH: number;
    }> = [];

    for (let i = 0; i < validPageNumbers.length; i++) {
      const pageNum = validPageNumbers[i];
      const pageIdx = pageNum - 1;
      const srcPage = origDoc.getPage(pageIdx);
      const srcW = srcPage.getWidth();
      const srcH = srcPage.getHeight();

      const isFirst = i === 0;
      const isLast = i === validPageNumbers.length - 1;

      const items = pageTextData && pageTextData[pageIdx]?.items ? pageTextData[pageIdx].items : [];

      let top = srcH;
      let bottom = 0;

      if (items.length > 0) {
        if (isFirst) {
          // Page 1: Keep from top header through table items.
          // Cut off EXACTLY at the bottom line of the last line item table row on Page 1!
          top = srcH;

          const tableHeaderIt = items.find((it: any) =>
            /^(?:Description|Unit\s*Price|Sl\.?\s*No)$/i.test(it.str?.trim() || "")
          );
          const headerY = tableHeaderIt?.transform ? tableHeaderIt.transform[5] : 620;

          // Collect valid line item elements
          const lineItemElements = items.filter((it: any) => {
            const y = it.transform ? it.transform[5] : 0;
            const x = it.transform ? it.transform[4] : 0;
            const s = it.str ? it.str.trim() : "";
            if (!s) return false;
            if (y >= headerY - 4) return false;
            if (y < 130) return false; // Line items are always above y = 130; disclaimer is below y = 130
            if (/ASSPL|Amazon Retail|Seller Services|fulfillment center|availing input GST|Business account|Page\s*\d+|Continued/i.test(s)) {
              return false;
            }
            if (x < 25 || x > 575) return false;
            return true;
          });

          if (lineItemElements.length > 0) {
            const minLineItemY = Math.min(...lineItemElements.map((it: any) => it.transform[5]));
            bottom = Math.max(120, minLineItemY - 3.5);
          } else {
            const validItems = items.filter((it: any) => {
              const y = it.transform ? it.transform[5] : 0;
              const s = it.str ? it.str.trim() : "";
              if (y < 130 || y >= headerY - 4) return false;
              if (/ASSPL|Seller Services|GST credit|Business account/i.test(s)) return false;
              return true;
            });
            if (validItems.length > 0) {
              bottom = Math.max(120, Math.min(...validItems.map((it: any) => it.transform[5])) - 3.5);
            } else {
              bottom = srcH * 0.40;
            }
          }
        } else {
          // Continuation page (Page 2+):
          // Check if Page 2 has continuation line items (e.g. Item 6) or starts directly at TOTAL
          const tableHeaderIt2 = items.find((it: any) =>
            /^(?:Description|Unit\s*Price|Sl\.?\s*No)$/i.test(it.str?.trim() || "")
          );
          const headerBottomY2 = tableHeaderIt2?.transform ? tableHeaderIt2.transform[5] - 3.5 : 0;

          // Check if there are line items below this table header on Page 2
          const page2LineItems = items.filter((it: any) => {
            const y = it.transform ? it.transform[5] : 0;
            const s = it.str ? it.str.trim() : "";
            if (!s) return false;
            if (headerBottomY2 > 0 && y >= headerBottomY2) return false;
            if (y < 130) return false;
            if (/^TOTAL/i.test(s) || /Amount\s+in\s+Words/i.test(s) || /Signatory/i.test(s)) return false;
            if (/ASSPL|Seller Services|GST credit/i.test(s)) return false;
            return true;
          });

          if (page2LineItems.length > 0 && headerBottomY2 > 0) {
            // Continuation items exist (e.g. Item 6).
            // Start right at the bottom gridline of the duplicate table header,
            // so Item 6 connects directly to Item 5 without repeating the table header row!
            top = headerBottomY2;
          } else {
            // Starts directly at the TOTAL row (e.g. 4-item orders where TOTAL was pushed to Page 2).
            const totalRowIt = items.find((it: any) =>
              /^(?:TOTAL|Total|Invoice\s*Total|Grand\s*Total)/i.test(it.str?.trim() || "")
            );
            if (totalRowIt?.transform) {
              top = totalRowIt.transform[5] + (totalRowIt.height || 12) + 6;
            } else {
              top = headerBottomY2 > 0 ? headerBottomY2 : srcH * 0.85;
            }
          }

          // Cut off exactly below the bottom-most invoice footer table (Payment Transaction box / Reverse charge / Signatory)
          // Exclude only the faint disclaimer at the bottom of Page 2!
          const bottomFooterElements = items.filter((it: any) => {
            const y = it.transform ? it.transform[5] : 0;
            const s = it.str ? it.str.trim() : "";
            if (!s) return false;
            // Exclude disclaimer text at very bottom
            if (/ASSPL|Amazon Retail|Seller Services|fulfillment center|availing input GST|Business account|Page\s*\d+|Continued/i.test(s)) {
              return false;
            }
            // Must be footer tokens or in the lower section
            if (
              /Payment\s+Transaction/i.test(s) ||
              /Mode\s+of\s+Payment/i.test(s) ||
              /Invoice\s+Value/i.test(s) ||
              /reverse\s+charge/i.test(s) ||
              /tax\s+is\s+payable/i.test(s) ||
              /Authorized\s+Signatory/i.test(s) ||
              /Signatory/i.test(s) ||
              /Amount\s+in\s+Words/i.test(s) ||
              /TOTAL/i.test(s) ||
              (y > 30 && y < 350)
            ) {
              return true;
            }
            return false;
          });

          if (bottomFooterElements.length > 0) {
            const minFooterY = Math.min(...bottomFooterElements.map((it: any) => it.transform[5]));
            bottom = Math.max(30, minFooterY - 8);
          } else {
            bottom = 40;
          }
        }
      } else {
        if (isFirst) {
          top = srcH;
          bottom = srcH * 0.40;
        } else {
          top = srcH * 0.85;
          bottom = 40;
        }
      }

      if (top <= bottom + 40) {
        top = Math.min(srcH, bottom + 120);
      }

      const cropBox = { left: 0, bottom, right: srcW, top };
      const embedded = await targetDoc.embedPage(srcPage, cropBox);
      sections.push({
        embedded,
        cropW: srcW,
        cropH: top - bottom,
      });
    }

    const GAP = 0; // ZERO GAP between sections!
    const totalCropH = sections.reduce((sum, s) => sum + s.cropH, 0);
    const maxCropW = Math.max(...sections.map((s) => s.cropW));
    // Scale to our exact regular full-width size
    const scale = Math.min(availW / maxCropW, availH / totalCropH);
    const finalW = maxCropW * scale;
    const totalDrawnH = totalCropH * scale;

    const x = (TARGET_WIDTH - finalW) / 2;
    // Align neatly from top margin so size and layout match regular 1-page invoice exactly
    let currentY = TARGET_HEIGHT - MARGIN;

    const newPage = targetDoc.addPage([TARGET_WIDTH, TARGET_HEIGHT]);

    for (let i = 0; i < sections.length; i++) {
      const sec = sections[i];
      const drawnH = sec.cropH * scale;
      const drawY = currentY - drawnH;

      newPage.drawPage(sec.embedded, {
        x,
        y: drawY,
        width: finalW,
        height: drawnH,
      });

      currentY = drawY; // Next section connects seamlessly with 0 gap!
    }

    return newPage;
  } catch (compressErr) {
    console.warn("Error compressing multi-page invoice, falling back to 2 pages:", compressErr);
    let lastAddedPage = null;
    const pagesToRender = validPageNumbers.length > 2 ? validPageNumbers.slice(0, 2) : validPageNumbers;
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
}
