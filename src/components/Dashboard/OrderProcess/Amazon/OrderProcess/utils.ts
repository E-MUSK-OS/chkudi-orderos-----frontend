/**
 * Clean customer name by removing addresses, pin codes, and delivery details.
 */
export function cleanCustomerName(raw: string): string {
  if (!raw || raw === "N/A") return "N/A";

  // 1. Remove common prefixes
  let cleaned = raw
    .replace(/^(Shipping|Billing)\s+Address\s*[:\-]?\s*/i, "")
    .replace(/^Ship\s+To\s*[:\-]?\s*/i, "")
    .replace(/^(Customer\s*Name|Recipient|Name)\s*[:\-]?\s*/i, "")
    .replace(/^C\/O\s*[:\-]?\s*/i, "")
    .trim();

  // 2. Split on common delimiters (commas, newlines, pipes, semicolons, backslash-ampersand for ZPL)
  cleaned = cleaned.split(/\\&|[\r\n|,;]|\s+-\s+/)[0].trim();

  // 3. Remove known address trigger words if stuck to the name without commas
  const addressTrigger =
    /\s+(?:Flat|H\.?No|House|Plot|Room|Shop|Bldg|Building|Apartment|Apt|Tower|Floor|Block|Sector|Opp|Opposite|Near|Behind|Beside|Road|Street|Lane|Nagar|Colony|Enclave|Vihar|Layout|Society|Village|Vill|Post|Taluka|Dist|District|PIN|Pincode|\d{1,5}[A-Za-z]?\b).*$/i;
  cleaned = cleaned.replace(addressTrigger, "").trim();

  // 4. Remove trailing digits, special chars, or postal codes
  cleaned = cleaned.replace(/\s*\b\d{5,6}\b.*$/, "").trim();
  cleaned = cleaned.replace(/[,\-:;.]+$/, "").trim();

  // 5. If it's still excessively long (e.g. over 30 characters or more than 4 words), take the first 3-4 words
  const words = cleaned.split(/\s+/).filter(Boolean);
  if (words.length > 4 && cleaned.length > 30) {
    cleaned = words.slice(0, 3).join(" ");
  }

  return cleaned || "N/A";
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

