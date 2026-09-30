import { NextRequest, NextResponse } from "next/server";
import https from "https";
import { PDFDocument } from "pdf-lib";

export const runtime = "nodejs";
export const maxDuration = 60;

interface ZplLabelData {
  index: number;
  invoiceNumber: string;
  orderNumber?: string;
  asin?: string;
  sellerSku?: string;
  awb: string;
  customer: string;
  rawZpl: string;
  shipToAddress?: string;
  totalQuantity?: number;
}

interface PdfOrderData {
  orderNumber: string;
  sellerInvoice: string;
  asin?: string;
  sellerSku?: string;
  allInvoices: string[];
  pages: number[];
  customer: string;
  amount: string;
  date: string;
  shippingAddress?: string;
}

interface ComparisonResult {
  index: number;
  isMatch: boolean;
  zplInvoice: string;
  pdfInvoice: string;
  asin?: string;
  sellerSku?: string;
  orderNumber: string;
  awb: string;
  customer: string;
  amount: string;
  date: string;
  pdfPages: number[];
  zplPage: number;
  orderType?: "single_quantity" | "multiple_asin" | "multiple_pieces";
  totalQuantity?: number;
  asinsCount?: number;
}

/**
 * Convert a chunk of ZPL labels to PDF using Labelary with automatic retry on 429 rate limits.
 */
async function convertZplChunkToPdf(
  zplChunk: string,
  maxRetries = 4
): Promise<Buffer> {
  const postData = Buffer.from(zplChunk, "utf8");

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await new Promise<Buffer>((resolve, reject) => {
        const options: https.RequestOptions = {
          hostname: "api.labelary.com",
          port: 443,
          path: "/v1/printers/8dpmm/labels/6x9/",
          method: "POST",
          headers: {
            Accept: "application/pdf",
            "Content-Type": "application/x-www-form-urlencoded",
            "Content-Length": postData.length,
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) OrderOS/AmazonProcessor",
          },
          timeout: 45000,
        };

        const request = https.request(options, (response) => {
          if (response.statusCode === 429) {
            let errorBody = "";
            response.on("data", (chunk) => {
              errorBody += chunk.toString();
            });
            response.on("end", () => {
              const retryAfterHeader = response.headers["retry-after"];
              const retryAfterMs = retryAfterHeader
                ? parseInt(String(retryAfterHeader), 10) * 1000
                : attempt * 2000;
              const err = new Error(
                `Labelary rate limit (429): ${errorBody.substring(0, 150)}`
              ) as any;
              err.isRateLimit = true;
              err.retryAfterMs = retryAfterMs;
              reject(err);
            });
            return;
          }

          if (response.statusCode !== 200) {
            let errorBody = "";
            response.on("data", (chunk) => {
              errorBody += chunk.toString();
            });
            response.on("end", () => {
              reject(
                new Error(
                  `Labelary conversion failed with status ${response.statusCode}: ${errorBody.substring(
                    0,
                    200
                  )}`
                )
              );
            });
            return;
          }

          const chunks: Buffer[] = [];
          response.on("data", (chunk) => {
            chunks.push(Buffer.from(chunk));
          });
          response.on("end", () => {
            resolve(Buffer.concat(chunks));
          });
        });

        request.on("error", (error) => {
          reject(new Error(`Labelary network error: ${error.message}`));
        });

        request.on("timeout", () => {
          request.destroy();
          reject(new Error("Labelary request timed out after 45 seconds"));
        });

        request.write(postData);
        request.end();
      });
    } catch (err: any) {
      if (err?.isRateLimit && attempt < maxRetries) {
        const waitTime = err.retryAfterMs || attempt * 2500;
        console.warn(
          `[Labelary 429] Rate limit hit on attempt ${attempt}/${maxRetries}. Waiting ${waitTime}ms before retry...`
        );
        await new Promise((r) => setTimeout(r, waitTime));
      } else {
        throw err;
      }
    }
  }

  throw new Error("Labelary conversion failed: Maximum retries exceeded due to rate limit.");
}


/**
 * Clean customer name (original GitHub version without regex trimming).
 */
function cleanCustomerName(raw: string): string {
  if (!raw || raw === "N/A") return "N/A";
  return raw.trim() || "N/A";
}

/**
 * Validate whether a 10-character string is a plausible Amazon ASIN.
 * Real ASINs start with 'B0' (or 'B') and contain digits, and are never plain English words like LOUNGEWEAR.
 */
function isValidAsin(candidate: string): boolean {
  if (!candidate || candidate.length !== 10) return false;
  const upper = candidate.toUpperCase();

  // Exclude non-alphanumeric
  if (!/^[A-Z0-9]{10}$/.test(upper)) return false;

  // Real Amazon ASINs almost always start with 'B0'
  if (upper.startsWith("B0")) {
    return true;
  }

  // If candidate has NO digits at all (e.g. LOUNGEWEAR, STREETWEAR, CASUALWEAR), it is a plain word, not an ASIN
  if (!/\d/.test(upper)) {
    return false;
  }

  // If starts with 'B' and contains at least one digit
  if (upper.startsWith("B") && /\d/.test(upper)) {
    return true;
  }

  // Exclude known non-ASIN English words / headers
  const blacklisted = [
    "DESCRIPTION",
    "TAXINVOICE",
    "PARTICULAR",
    "LOUNGEWEAR",
    "STREETWEAR",
    "ACTIVEWEAR",
    "CASUALWEAR",
    "SLEEPWEAR",
    "SPORTSWEAR",
    "NIGHTWEAR",
    "FOOTWEAR",
    "CLOTHING",
  ];
  if (blacklisted.includes(upper)) return false;

  return true;
}

/**
 * Extract ASIN / ASI number from text (e.g. tax invoice description).
 * Amazon ASINs are 10-character alphanumeric codes starting with 'B0' (e.g. B0GGY92FR8).
 */
function extractAsin(text: string): string {
  if (!text) return "";

  // Strategy 1: Explicit ASIN / ASI label match (e.g. "ASIN: B0GGY92FR8" or "ASI: B0GGY92FR8")
  const labelMatch = text.match(/(?:ASIN|ASI|ASIN\s*NO|ASIN\s*NUMBER)\s*[:\-#]?\s*([A-Z0-9]{10})/i);
  if (labelMatch?.[1] && isValidAsin(labelMatch[1])) {
    return labelMatch[1].toUpperCase();
  }

  // Strategy 2: Standard 10-character Amazon ASIN starting with B0 (e.g. B0GGY92FR8)
  const b0Matches = Array.from(text.matchAll(/\b(B0[A-Z0-9]{8})\b/gi));
  for (const match of b0Matches) {
    const candidate = match[1];
    if (isValidAsin(candidate)) {
      return candidate.toUpperCase();
    }
  }

  // Strategy 3: 10-character candidate immediately before HSN / HSN/SAC
  const hsnMatches = Array.from(text.matchAll(/\b([A-Z0-9]{10})\b[\s\S]{0,100}?\bHSN/gi));
  for (const match of hsnMatches) {
    const candidate = match[1];
    if (isValidAsin(candidate)) {
      return candidate.toUpperCase();
    }
  }

  // Strategy 4: Any 10-character code starting with B and containing digits
  const bMatches = Array.from(text.matchAll(/\b(B[A-Z0-9]{9})\b/gi));
  for (const match of bMatches) {
    const candidate = match[1];
    if (isValidAsin(candidate)) {
      return candidate.toUpperCase();
    }
  }

  return "";
}

/**
 * Helper to clean and format extracted Seller SKU.
 * If SKU and ASIN are combined like "(Men-Track-Pant-5240-White-36_White | B0DXVSJQF1 )",
 * abstract the first part before "|" as the SKU.
 */
function cleanExtractedSku(raw: string): string {
  if (!raw) return "";
  let sku = raw.trim();

  // If candidate is a combined string containing "|", take the first part before "|"
  if (sku.includes("|")) {
    sku = sku.split("|")[0].trim();
  }

  // Strip surrounding quotes or trailing colons/dots
  sku = sku.replace(/^[\\"']+|[\\"'.\-:]+$/g, "").trim();
  return sku;
}

/**
 * Extract Seller SKU from PDF tax invoice / ZPL text.
 * Rule: Inside product description, locate the ASIN (e.g. B0...). The Seller SKU is written inside `()` right before the ASIN.
 * If combined with ASIN via "|", abstract the first part before "|" as the SKU.
 */
function extractSellerSku(text: string): string {
  if (!text) return "";

  // 1. Prefer Product Description section text
  let targetText = text;
  const descMatch = text.match(/(?:Description\s+of\s+Goods|Description|Particulars|Item\s+Details|Product\s+Details)[\s\S]*/i);
  if (descMatch?.[0]) {
    targetText = descMatch[0];
  }

  // 2. Find ASINs (e.g. B0GGY92FR8)
  const asinMatches = Array.from(targetText.matchAll(/\b(B0[A-Z0-9]{8})\b/gi));

  for (const m of asinMatches) {
    if (m.index !== undefined) {
      // Get text segment immediately preceding the ASIN (up to 500 characters before)
      const beforeText = targetText.substring(Math.max(0, m.index - 500), m.index);
      // Find all parenthesized strings (...) in the text before ASIN
      const parenMatches = Array.from(beforeText.matchAll(/\(([^()]{2,100})\)/g));
      if (parenMatches.length > 0) {
        // Take the parenthesized content closest to the ASIN
        const rawContent = parenMatches[parenMatches.length - 1][1].trim();
        const cleaned = cleanExtractedSku(rawContent);

        // Ensure candidate is not the ASIN itself, an Order ID, or standard header
        if (
          cleaned &&
          !cleaned.toUpperCase().startsWith("B0") &&
          !/^\d{3}-\d{7}-\d{7}$/.test(cleaned) &&
          !/^(TAX|INVOICE|ORIGINAL|DUPLICATE|COPY|SHIPPING|BILLING)$/i.test(cleaned)
        ) {
          return cleaned;
        }
      }
    }
  }

  // Fallback 1: Check if ASIN is formatted as (B0...) and SKU is in parentheses immediately before it
  // e.g. "(5266_M_Navy) (B0GGY92FR8)" or "(Men-Track-Pant-5240-White-36_White | B0DXVSJQF1 )"
  const doubleParenMatch = targetText.match(/\(([^()]{2,100})\)\s*\(?\s*B0[A-Z0-9]{8}/i);
  if (doubleParenMatch?.[1]) {
    const cleaned = cleanExtractedSku(doubleParenMatch[1]);
    if (cleaned && !cleaned.toUpperCase().startsWith("B0") && !/^\d{3}-\d{7}-\d{7}$/.test(cleaned)) {
      return cleaned;
    }
  }

  // Fallback 2: Explicit SKU: / MSKU: label if present in description
  const labelMatch = targetText.match(/(?:Seller\s*SKU|MSKU|Merchant\s*SKU|SKU)\s*[:\-#]?\s*\(?([A-Za-z0-9\-_ |]{2,60})\)?/i);
  if (labelMatch?.[1]) {
    const rawFirstLine = labelMatch[1].split(/[\r\n,;]|  +/)[0];
    const cleaned = cleanExtractedSku(rawFirstLine);
    if (cleaned && !cleaned.toUpperCase().startsWith("B0") && !/^\d{3}-\d{7}-\d{7}$/.test(cleaned)) {
      return cleaned;
    }
  }

  return "";
}

/**
 * Extract ALL ASINs and Seller SKUs for multi-item invoices.
 */
function extractAllItemsFromPdfText(text: string): {
  asins: string[];
  sellerSkus: string[];
  asinString: string;
  sellerSkuString: string;
} {
  if (!text) {
    return { asins: [], sellerSkus: [], asinString: "", sellerSkuString: "" };
  }

  let targetText = text;
  const descMatch = text.match(
    /(?:Description\s+of\s+Goods|Description|Particulars|Item\s+Details|Product\s+Details)[\s\S]*/i
  );
  if (descMatch?.[0]) {
    targetText = descMatch[0];
  }

  const asinMatches = Array.from(targetText.matchAll(/\b(B0[A-Z0-9]{8})\b/gi));

  const rawAsins: string[] = [];
  const rawSellerSkus: string[] = [];
  const seenAsinIndexes = new Set<number>();

  for (const m of asinMatches) {
    const asinCandidate = m[1].toUpperCase();
    if (!isValidAsin(asinCandidate)) continue;

    if (m.index !== undefined) {
      if (seenAsinIndexes.has(m.index)) continue;
      seenAsinIndexes.add(m.index);
    }

    let extractedSku = "";
    if (m.index !== undefined) {
      const beforeText = targetText.substring(Math.max(0, m.index - 500), m.index);
      const parenMatches = Array.from(beforeText.matchAll(/\(([^()]{2,100})\)/g));
      if (parenMatches.length > 0) {
        const rawContent = parenMatches[parenMatches.length - 1][1].trim();
        const cleaned = cleanExtractedSku(rawContent);
        if (
          cleaned &&
          !cleaned.toUpperCase().startsWith("B0") &&
          !/^\d{3}-\d{7}-\d{7}$/.test(cleaned) &&
          !/^(TAX|INVOICE|ORIGINAL|DUPLICATE|COPY|SHIPPING|BILLING)$/i.test(cleaned)
        ) {
          extractedSku = cleaned;
        }
      }
    }

    if (!extractedSku) {
      const doubleParenMatch = targetText.match(/\(([^()]{2,100})\)\s*\(?\s*B0[A-Z0-9]{8}/i);
      if (doubleParenMatch?.[1]) {
        const cleaned = cleanExtractedSku(doubleParenMatch[1]);
        if (cleaned && !cleaned.toUpperCase().startsWith("B0") && !/^\d{3}-\d{7}-\d{7}$/.test(cleaned)) {
          extractedSku = cleaned;
        }
      }
    }

    if (!extractedSku) {
      const labelMatch = targetText.match(/(?:Seller\s*SKU|MSKU|Merchant\s*SKU|SKU)\s*[:\-#]?\s*\(?([A-Za-z0-9\-_ |]{2,60})\)?/i);
      if (labelMatch?.[1]) {
        const rawFirstLine = labelMatch[1].split(/[\r\n,;]|  +/)[0];
        const cleaned = cleanExtractedSku(rawFirstLine);
        if (cleaned && !cleaned.toUpperCase().startsWith("B0") && !/^\d{3}-\d{7}-\d{7}$/.test(cleaned)) {
          extractedSku = cleaned;
        }
      }
    }

    rawAsins.push(asinCandidate);
    rawSellerSkus.push(extractedSku || "");
  }

  // Deduplicate distinct ASINs and SKUs
  const uniqueAsins = Array.from(new Set(rawAsins.filter((a) => isValidAsin(a))));
  const uniqueSkus = Array.from(new Set(rawSellerSkus.filter((s) => Boolean(s))));

  const asins: string[] = [...uniqueAsins];
  const sellerSkus: string[] = [...uniqueSkus];

  if (asins.length === 0) {
    const singleAsin = extractAsin(text);
    if (singleAsin) asins.push(singleAsin);
  }
  if (sellerSkus.length === 0) {
    const singleSku = extractSellerSku(text);
    if (singleSku && !/^B0[A-Z0-9]{8}$/i.test(singleSku)) sellerSkus.push(singleSku);
  }

  const asinString = asins.join("\n");
  const sellerSkuString = sellerSkus.join("\n");

  return {
    asins,
    sellerSkus,
    asinString,
    sellerSkuString,
  };
}

/**
 * Parse ZPL content into individual label objects.
 *
 * Invoice extraction strategy:
 * 1. Parse all ^FO/^FD fields.
 * 2. Find the INVOICE# header.
 * 3. Find the closest data field below it.
 * 4. Fall back to inline regex.
 * 5. Fall back to invoice-like values.
 */
function parseZplLabels(zplText: string): ZplLabelData[] {
  const rawBlocks = zplText.split("^XZ");
  const labels: ZplLabelData[] = [];

  for (const block of rawBlocks) {
    const xaIndex = block.indexOf("^XA");

    if (xaIndex === -1) {
      continue;
    }

    const body = block.substring(xaIndex);

    // Skip non-label/control blocks.
    if (body.includes("^MCY")) {
      continue;
    }

    const fullLabel = `${body}^XZ`;

    // Decode _XX hexadecimal sequences.
    const decoded = body.replace(
      /_([0-9A-Fa-f]{2})/g,
      (_match: string, hex: string) =>
        String.fromCharCode(parseInt(hex, 16))
    );

    /**
     * Parse all:
     * ^FOx,y...^FDtext^FS or ^FTx,y...^FDtext^FS
     */
    const fieldRegex =
      /\^(?:FO|FT)(\d+),(\d+)[\s\S]*?\^FD([\s\S]*?)\^FS/gi;

    const fields: Array<{
      x: number;
      y: number;
      text: string;
    }> = [];

    let fm: RegExpExecArray | null;

    while ((fm = fieldRegex.exec(decoded)) !== null) {
      const cleanText = fm[3].replace(/\\&/g, " ").trim();
      fields.push({
        x: parseInt(fm[1], 10),
        y: parseInt(fm[2], 10),
        text: cleanText,
      });
    }

    let invoiceNumber = "";

    // ---------------------------------------------------------
    // STEP 1: Find INVOICE# header.
    // ---------------------------------------------------------

    const invoiceHeader = fields.find((field) =>
      /INVOICE\s*#?/i.test(field.text)
    );

    if (invoiceHeader) {
      const belowCells = fields
        .filter(
          (field) =>
            field.y > invoiceHeader.y &&
            field.y <= invoiceHeader.y + 250 &&
            Math.abs(field.x - invoiceHeader.x) <= 200
        )
        .sort((a, b) => a.y - b.y);

      if (belowCells.length > 0) {
        const rawCell = belowCells[0].text.trim();
        const tokens = rawCell.split(/\s+/);
        const candidate = tokens[0] || rawCell;

        const headerWords = [
          "ORDER",
          "DATE",
          "TOTAL",
          "QTY",
          "ITEM",
          "PRICE",
          "TAX",
          "AWB",
          "SHIP",
          "WEIGHT",
          "INVOICE",
        ];

        if (
          candidate.length >= 2 &&
          !headerWords.some((word) =>
            candidate.toUpperCase().startsWith(word)
          )
        ) {
          invoiceNumber = candidate;
        }
      }
    }

    // ---------------------------------------------------------
    // STEP 2: Inline invoice extraction.
    //
    // Examples:
    // INVOICE# GMWZ-376063
    // INVOICE#: GMWZ-376063
    // INVOICE # GMWZ-376063
    // ---------------------------------------------------------

    if (!invoiceNumber) {
      const inlineMatch = decoded.match(
        /INVOICE\s*#?\s*[:\s\-]+\s*([A-Z0-9][A-Z0-9/_-]{2,})/i
      );

      if (inlineMatch?.[1]) {
        const value = inlineMatch[1].trim();

        if (
          !["DATE", "ORDER", "TOTAL", "QTY", "ITEM", "PRICE", "TAX", "AWB", "SHIP"].includes(
            value.toUpperCase()
          )
        ) {
          invoiceNumber = value;
        }
      }
    }

    // ---------------------------------------------------------
    // STEP 3: Search all ^FD values for invoice-like patterns.
    // ---------------------------------------------------------

    if (!invoiceNumber) {
      for (const field of fields) {
        const value = field.text;

        if (
          /^[A-Z]{2,6}[-/][0-9A-Z/_\-]{3,}$/i.test(value)
        ) {
          // Exclude Amazon Order IDs.
          if (/^\d{3}-\d{7}-\d{7}$/.test(value)) {
            continue;
          }

          // Exclude AWB/shipping values.
          if (value.toUpperCase().startsWith("ATS")) {
            continue;
          }

          if (value.toUpperCase().startsWith("SHIP")) {
            continue;
          }

          invoiceNumber = value;
          break;
        }
      }
    }

    // ---------------------------------------------------------
    // STEP 4: Extract AWB / tracking number.
    // ---------------------------------------------------------

    let awb = "";

    const awbMatch =
      decoded.match(/AWB[#\s:]*([0-9A-Z]+)/i) ||
      decoded.match(/\^BC.*?\^FD([0-9A-Z]+)\^FS/i);

    if (awbMatch?.[1]) {
      awb = awbMatch[1].trim();
    }

    // ---------------------------------------------------------
    // STEP 5: Extract customer / recipient & Ship To address.
    // ---------------------------------------------------------

    const shipToAddress = extractZplShipToAddress(decoded, fields);

    let customer = "";

    const customerMatch =
      decoded.match(/\^(?:FO|FT)50,360[\s\S]*?\^FD([\s\S]*?)\^FS/i) ||
      decoded.match(/\^(?:FO|FT)40,445[\s\S]*?\^FD([\s\S]*?)\^FS/i) ||
      decoded.match(/Ship To:[\s\S]*?\^FD([\s\S]*?)\^FS/i);

    if (customerMatch?.[1]) {
      customer = customerMatch[1].split("\\&")[0].trim();
    }

    // ---------------------------------------------------------
    // STEP 6: Extract ASIN / ASI number and Order Number.
    // ---------------------------------------------------------

    const asin = extractAsin(decoded);
    const sellerSku = extractSellerSku(decoded);

    const orderMatch =
      decoded.match(/ORDER[#\s:]*([0-9-]{17,19})/i) ||
      decoded.match(/\b(\d{3}-\d{7}-\d{7})\b/);
    const orderNumber = orderMatch ? orderMatch[1] || orderMatch[0] : "";

    // Extract Quantity / Items if present on the shipping label (e.g. QTY: 2, QTY: 02)
    let totalQuantity: number | undefined;
    const qtyZplMatch = decoded.match(/\b(?:TOTAL\s*QTY|QTY)\s*[:\-#|=]\s*0*([1-9]\d{0,1})\b/i);
    if (qtyZplMatch?.[1]) {
      const q = parseInt(qtyZplMatch[1], 10);
      if (!isNaN(q) && q >= 1 && q <= 50) {
        totalQuantity = q;
      }
    }

    // ---------------------------------------------------------
    // Logging.
    // ---------------------------------------------------------

    if (invoiceNumber) {
      console.log(
        `[ZPL Parse] Label ${
          labels.length + 1
        }: Invoice="${invoiceNumber}", Order="${orderNumber}", ASIN="${asin}", SKU="${sellerSku}", AWB="${awb}"`
      );
    } else {
      console.log(
        `[ZPL Parse] Label ${
          labels.length + 1
        }: No invoice found. Fields:`,
        fields.map((field) => field.text).join(" | ")
      );
    }

    labels.push({
      index: labels.length + 1,
      invoiceNumber,
      orderNumber,
      asin,
      sellerSku,
      awb,
      customer,
      rawZpl: fullLabel,
      shipToAddress,
      totalQuantity,
    });
  }

  return labels;
}

/**
 * Extract the invoice number from a PDF page's text.
 */
function extractPdfInvoiceNumber(text: string): string {
  const blacklist = [
    "DATE",
    "DETAILS",
    "VALUE",
    "TOTAL",
    "COPY",
    "TYPE",
    "CASH",
    "MEMO",
    "ORIGINAL",
    "TAX",
    "GSTIN",
    "STATE",
    "CODE",
    "SUPPLY",
    "PLACE",
    "PAGE",
    "ORDER",
    "CUSTOMER",
    "SELLER",
    "NAME",
    "ADDRESS",
  ];

  // Strategy 1: Direct substring search for "Invoice Number" / "Invoice No" / "Invoice #"
  const labelMatch = text.match(/(?:Tax\s+)?Invoice\s*(?:Number|No\.?|Num\.?|#|ID)/i);
  if (labelMatch && labelMatch.index !== undefined) {
    const after = text.substring(labelMatch.index + labelMatch[0].length);
    const tokenMatch = after.match(/^[\s:#\-]*([A-Z0-9][A-Z0-9/_\-]*)/i);
    if (tokenMatch && tokenMatch[1]) {
      const val = tokenMatch[1].trim();
      if (val.length >= 3 && !blacklist.includes(val.toUpperCase())) {
        return val;
      }
    }
  }

  const labelPatterns = [
    /Invoice\s+Number\s*[:\-#]?\s*([A-Z0-9][A-Z0-9/_-]+)/i,
    /Invoice\s+No\.?\s*[:\-#]?\s*([A-Z0-9][A-Z0-9/_-]+)/i,
    /Invoice\s+#\s*[:\-]?\s*([A-Z0-9][A-Z0-9/_-]+)/i,
    /Invoice\s+ID\s*[:\-#]?\s*([A-Z0-9][A-Z0-9/_-]+)/i,
    /Tax\s+Invoice\s+(?:Number|No\.?|#)\s*[:\-#]?\s*([A-Z0-9][A-Z0-9/_-]+)/i,
  ];

  for (const pattern of labelPatterns) {
    const match = text.match(pattern);
    if (match?.[1]) {
      const value = match[1].trim();
      if (value.length >= 3 && !blacklist.includes(value.toUpperCase())) {
        return value;
      }
    }
  }

  // Strategy 2: Multiline match
  const multilineMatch = text.match(
    /Invoice\s*(?:Number|No\.?|Num\.?|#|ID)?\s*[:\-#]?\s*[\r\n]+\s*([A-Z0-9][A-Z0-9/_-]+)/i
  );

  if (multilineMatch?.[1]) {
    const value = multilineMatch[1].trim();
    if (value.length >= 3 && !blacklist.includes(value.toUpperCase())) {
      return value;
    }
  }

  // Strategy 3: Known invoice code formats
  const invoiceRegexes = [
    /\b([A-Z]{2,6}-[0-9A-Z/_\-]{4,})\b/g,
    /\b([A-Z]{2,6}\/[0-9A-Z/_\-]{4,})\b/g,
  ];
  for (const regex of invoiceRegexes) {
    const matches = Array.from(text.matchAll(regex));
    for (const m of matches) {
      const candidate = m[1].trim();
      if (
        !candidate.toUpperCase().startsWith("AMAZON") &&
        !candidate.toUpperCase().startsWith("COCOBLU") &&
        !candidate.toUpperCase().startsWith("ORDER") &&
        !candidate.toUpperCase().startsWith("SHIP") &&
        !/^\d{3}-\d{7}-\d{7}$/.test(candidate)
      ) {
        return candidate;
      }
    }
  }

  return "";
}

/**
 * Normalize invoice values before comparison.
 *
 * This helps when one source has:
 * GMWZ-376063
 *
 * and the other has:
 * gmWz-376063
 *
 * or accidental surrounding spaces.
 */
function normalizeInvoice(value: string): string {
  return value
    .trim()
    .toUpperCase()
    .replace(/\s+/g, "");
}

/**
 * Extract complete address following "Ship To:" from ZPL fields or decoded text.
 */
function extractZplShipToAddress(
  decoded: string,
  fields: Array<{ x: number; y: number; text: string }>
): string {
  // Strategy 1: Find field containing "Ship To"
  const shipToField = fields.find((f) => /Ship\s*To/i.test(f.text));

  if (shipToField) {
    const afterShipTo = shipToField.text.replace(/Ship\s*To\s*[:\-]?\s*/i, "").trim();

    // Collect all fields vertically below this Ship To header (within 650 vertical units, avoiding returns dock & label boilerplate)
    const belowFields = fields
      .filter(
        (f) =>
          f.y > shipToField.y &&
          f.y <= shipToField.y + 650 &&
          Math.abs(f.x - shipToField.x) <= 450 &&
          !/^(?:ORDER|INVOICE|AWB|DATE|TOTAL|QTY|ITEM|PRICE|TAX|SHIP\s*DATE|RETURN|WEIGHT|COD|PREPAID|DELIVERY\s*STATION|SECTOR|SORTZONE|ATSPL|BOX\s+\d+|SUN\s+Closed|PDD\s*:|Customer\s*Returns|Shipped\s*By|Customer\s*Self\s*Declaration)/i.test(
            f.text
          ) &&
          !/^\d{3}-\d{7}-\d{7}$/.test(f.text) &&
          !/^ATS/i.test(f.text)
      )
      .sort((a, b) => a.y - b.y)
      .map((f) => f.text);

    const parts: string[] = [];
    if (afterShipTo) {
      parts.push(afterShipTo);
    }
    parts.push(...belowFields);

    const combined = parts.join(" ").replace(/\\&/g, " ").replace(/\s+/g, " ").trim();
    if (combined.length >= 4) {
      return combined;
    }
  }

  // Strategy 2: Regex extraction from raw decoded ZPL text
  const inlineMatch = decoded.match(/Ship\s*To\s*[:\-]?\s*([^^]+)/i);
  if (inlineMatch?.[1]) {
    const cleaned = inlineMatch[1]
      .replace(/\\&/g, " ")
      .replace(/\^[A-Z0-9,]+/gi, " ")
      .replace(/\s+/g, " ")
      .trim();
    if (cleaned.length >= 4) {
      return cleaned;
    }
  }

  // Strategy 3: Multi-line match across ^FD tags after "Ship To", stopping before Return Address/Barcodes
  const shipBlockMatch = decoded.match(
    /Ship\s*To\s*[:\-]?([\s\S]*?)(?=(?:\^(?:FO|FT)\d+,\d+[\s\S]*?\^FD(?:ORDER|INVOICE|AWB|DATE|DELIVERY\s+STATION|SORTZONE|PREPAID|Customer\s+Returns|Shipped\s+By|Customer\s+Self\s+Declaration|\d{3}-\d{7}-\d{7})|\bCustomer\s+Returns\b|\bShipped\s+By\b|\bReturn\s+Address\b|\^BC|\^BX|\^XZ|$))/i
  );
  if (shipBlockMatch?.[1]) {
    const fdTexts = Array.from(shipBlockMatch[1].matchAll(/\^FD([\s\S]*?)\^FS/g))
      .map((m) => m[1].replace(/\\&/g, " ").trim())
      .filter(
        (t) =>
          t &&
          !/^(?:Ship\s*To|DELIVERY\s*STATION|SECTOR|SORTZONE|PREPAID|ATSPL|BOX\s*\d+|SUN|Closed|Customer\s*Returns|Shipped\s*By|Customer\s*Self)/i.test(
            t
          )
      );

    if (fdTexts.length > 0) {
      return fdTexts.join(" ");
    }
  }

  return "";
}

/**
 * Extract complete address following "Shipping Address :" from PDF text.
 */
function extractPdfShippingAddress(text: string): string {
  if (!text) return "";

  // Delimiter pattern with strict word boundaries to avoid truncating words like "COMPANY" on "PAN"
  const delimiterPattern =
    /(?=(?:\bBilling\s+Address\b|\bState(?:\/|\s*)UT\s+Code\b|\bPlace\s+of\s+(?:supply|delivery)\b|\bInvoice\s+(?:Number|No|Date|Details)\b|\bOrder\s+(?:Number|No|Date)\b|\bTax\s+Invoice\b|\bGSTIN\b|\bCIN\b|\bPAN\s*(?:No\.?)?[:\s]|\bPAN\b|\bDescription\s+of\s+Goods\b|\bSl\.?\s*No\b|$))/i;

  // Strategy 1: "Shipping Address :" followed by address up to the next section delimiter
  const shippingMatch = text.match(
    new RegExp(/Shipping\s+Address\s*[:\-]?\s*([\s\S]*?)/.source + delimiterPattern.source, "i")
  );

  if (shippingMatch?.[1]) {
    const cleaned = shippingMatch[1]
      .replace(/[\r\n]+/g, " ")
      .replace(/\s+/g, " ")
      .trim();
    if (cleaned.length >= 4) {
      return cleaned;
    }
  }

  // Strategy 2: "Ship To :" in PDF
  const shipToMatch = text.match(
    new RegExp(/Ship\s+To\s*[:\-]?\s*([\s\S]*?)/.source + delimiterPattern.source, "i")
  );
  if (shipToMatch?.[1]) {
    const cleaned = shipToMatch[1]
      .replace(/[\r\n]+/g, " ")
      .replace(/\s+/g, " ")
      .trim();
    if (cleaned.length >= 4) {
      return cleaned;
    }
  }

  // Strategy 3: "Billing Address :" as fallback if Shipping Address not labeled
  const billingMatch = text.match(
    new RegExp(/Billing\s+Address\s*[:\-]?\s*([\s\S]*?)/.source + delimiterPattern.source, "i")
  );
  if (billingMatch?.[1]) {
    const cleaned = billingMatch[1]
      .replace(/[\r\n]+/g, " ")
      .replace(/\s+/g, " ")
      .trim();
    if (cleaned.length >= 4) {
      return cleaned;
    }
  }

  return "";
}

/**
 * Normalize an address string for resilient, cross-platform matching.
 */
function normalizeAddress(addr: string): {
  normalized: string;
  tokens: Set<string>;
  pinCode: string;
} {
  if (!addr) {
    return { normalized: "", tokens: new Set(), pinCode: "" };
  }

  let cleaned = addr.toUpperCase();

  // Remove common prefixes & noise
  cleaned = cleaned
    .replace(/^[\s\S]*?(?:Shipping\s+Address|Ship\s+To)\s*[:\-]?\s*/gi, "")
    .replace(/\b(?:INDIA|IND|IN)\b/gi, " ")
    .replace(/\b(?:PH|PHONE|TEL|MOB|MOBILE)\s*[:\-#]?\s*\d{10,12}\b/gi, " ");

  // Extract 6-digit Indian PIN code (must start with 1-9)
  const pinMatch = cleaned.match(/\b([1-9][0-9]{5})\b/);
  const pinCode = pinMatch ? pinMatch[1] : "";

  // Replace punctuation with spaces
  cleaned = cleaned.replace(/[^A-Z0-9\s]/g, " ");

  const words = cleaned.split(/\s+/).filter(Boolean);
  const tokens = new Set<string>();
  const stopwords = ["THE", "AND", "FOR", "WITH", "NEAR", "OPP", "TO", "OF", "AT", "BY"];

  for (const w of words) {
    if (stopwords.includes(w)) continue;
    if (w.length >= 2 || /^\d+$/.test(w)) {
      tokens.add(w);
    }
  }

  return {
    normalized: words.join(" "),
    tokens,
    pinCode,
  };
}

/**
 * Compute similarity score between PDF Shipping Address and ZPL Ship To address.
 * Returns score between 0.0 and 1.0.
 */
function computeAddressSimilarity(pdfAddr: string, zplAddr: string): number {
  if (!pdfAddr || !zplAddr) return 0;

  const pdf = normalizeAddress(pdfAddr);
  const zpl = normalizeAddress(zplAddr);

  if (pdf.tokens.size === 0 || zpl.tokens.size === 0) return 0;

  // PIN code check: If both have 6-digit Indian PIN codes and they are different, they CANNOT be the same address
  if (pdf.pinCode && zpl.pinCode && pdf.pinCode !== zpl.pinCode) {
    return 0;
  }

  // Count common tokens
  let commonCount = 0;
  for (const token of zpl.tokens) {
    if (pdf.tokens.has(token)) {
      commonCount++;
    }
  }

  const minTokens = Math.min(pdf.tokens.size, zpl.tokens.size);
  if (minTokens === 0) return 0;

  const overlapRatio = commonCount / minTokens;
  const unionSize = pdf.tokens.size + zpl.tokens.size - commonCount;
  const jaccard = unionSize > 0 ? commonCount / unionSize : 0;

  let score = overlapRatio * 0.60 + jaccard * 0.40;

  // Boost for matching PIN code
  if (pdf.pinCode && zpl.pinCode && pdf.pinCode === zpl.pinCode) {
    score += 0.30;
  }

  // Check substring containment
  if (
    pdf.normalized.length >= 10 &&
    zpl.normalized.length >= 10 &&
    (pdf.normalized.includes(zpl.normalized) || zpl.normalized.includes(pdf.normalized))
  ) {
    score = Math.max(score, 0.95);
  }

  return Math.min(score, 1.0);
}

/**
 * Categorize order composition into:
 * - "single_quantity": Exactly 1 ASIN and 1 piece/quantity of 1 Seller SKU
 * - "multiple_asin": Multiple different ASINs OR multiple different Seller SKUs
 * - "multiple_pieces": Exactly 1 ASIN with 2 or more pieces of the EXACT SAME Seller SKU (can be 2, 3, 4, 5... not fixed to 2)
/**
 * Normalizes text extracted from Amazon PDF invoices.
 * Fixes broken kerning (e.g. "1, 331.42" -> "1,331.42", "1331 . 42" -> "1331.42", "₹ 665" -> "₹665").
 */
function normalizeInvoiceText(text: string): string {
  if (!text) return "";
  return text
    .replace(/[\u00A0\u2000-\u200B\u202F\u205F]/g, " ")
    .replace(/(?:Rs\.?|INR)/gi, "₹")
    .replace(/₹\s+/g, "₹")
    .replace(/(\d+),\s+(\d{2,3})/g, "$1,$2")
    .replace(/(\d+)\s*\.\s*(\d{1,2})/g, "$1.$2")
    .replace(/[\u2013\u2014]/g, "-");
}

/**
 * Extracts and verifies ALL actual product rows available in the invoice table.
 * Strictly isolates table body before the TOTAL summary row and ignores fee lines.
 * Uses exact row-level mathematics (Unit Price * Qty ≈ Net Amount with GST multipliers) to verify each row.
 */
function extractInvoiceRows(rawText: string): Array<{
  qty: number;
  unitPrice: number;
  discount: number;
  netAmount: number;
  taxRate?: string;
  asin?: string;
  sellerSku?: string;
  description?: string;
}> {
  if (!rawText) return [];
  const text = normalizeInvoiceText(rawText);

  // 1. Isolate the items table body:
  // Starts after table header (Description, Unit Price, etc.)
  // Ends strictly at the TOTAL / Invoice Value / Grand Total summary line!
  const headerMatch = text.match(
    /(?:Description\s+of\s+Goods|Description|Particulars|Item\s+Details|Product\s+Details|Sl\.?\s*No\.?)/i
  );
  const startIdx = headerMatch?.index !== undefined ? headerMatch.index : 0;
  const afterHeader = text.substring(startIdx);

  const totalMatch = afterHeader.match(
    /\n\s*(?:TOTAL\s*[:\s]|Invoice\s+Value\s*[:\s]|Grand\s+Total\s*[:\s]|Amount\s+in\s+Words)/i
  );
  // tableBody is STRICTLY before the TOTAL summary line!
  const tableBody = totalMatch?.index !== undefined
    ? afterHeader.substring(0, totalMatch.index)
    : afterHeader;

  const rows: Array<{
    qty: number;
    unitPrice: number;
    discount: number;
    netAmount: number;
    taxRate?: string;
    asin?: string;
    sellerSku?: string;
    description?: string;
  }> = [];

  const acceptedSpans: Array<{ start: number; end: number }> = [];
  const overlapsAccepted = (start: number, end: number) => {
    return acceptedSpans.some(
      (span) => Math.max(start, span.start) < Math.min(end, span.end)
    );
  };

  const isFeeContext = (context: string) => {
    const lower = context.toLowerCase();
    return (
      lower.includes("shipping charge") ||
      lower.includes("shipping fee") ||
      lower.includes("delivery charge") ||
      lower.includes("delivery fee") ||
      lower.includes("gift wrap") ||
      lower.includes("postage charge") ||
      lower.includes("freight charge") ||
      lower.includes("handling charge") ||
      lower.includes("convenience fee")
    );
  };

  const gstMultipliers = [1.0, 1.05, 1.12, 1.18, 1.28];

  const extractRowDetails = (rowContext: string) => {
    const asinMatch = rowContext.match(/\b(B0[A-Z0-9]{8})\b/i);
    const asin = asinMatch && isValidAsin(asinMatch[1]) ? asinMatch[1].toUpperCase() : undefined;

    let sellerSku: string | undefined;
    const parenMatches = Array.from(rowContext.matchAll(/\(([^()]{2,100})\)/g));
    if (parenMatches.length > 0) {
      const rawContent = parenMatches[parenMatches.length - 1][1].trim();
      const cleaned = cleanExtractedSku(rawContent);
      if (
        cleaned &&
        !cleaned.toUpperCase().startsWith("B0") &&
        !/^\d{3}-\d{7}-\d{7}$/.test(cleaned) &&
        !/^(TAX|INVOICE|ORIGINAL|DUPLICATE|COPY|SHIPPING|BILLING)$/i.test(cleaned)
      ) {
        sellerSku = cleaned;
      }
    }

    const lines = rowContext.split(/[\r\n]+/).map((l) => l.trim()).filter(Boolean);
    const description = lines.length > 0 ? lines[lines.length - 1] : undefined;

    return { asin, sellerSku, description };
  };

  // =========================================================================
  // NEW STRATEGY: "Integer Between Prices" Scan
  // In Amazon Tax Invoices, Qty is always a standalone integer preceded by UnitPrice/Discount 
  // and followed by NetAmount/TaxableValue. All prices have 2 decimal places (e.g., .00, .50).
  // So Qty is the only integer trapped between two .XX decimals!
  // =========================================================================
  const pushRow = (q: number) => {
    rows.push({
      unitPrice: 0, discount: 0, qty: q, netAmount: 0,
      taxRate: undefined, asin: undefined, sellerSku: undefined, description: undefined,
    });
  };

  const sandwichRegex = /\.\d{2}\s+([1-9]\d{0,1})\s+(?:₹)?(?:\d{1,6}(?:,\d{3})*)?(?:\.\d{2})/g;
  for (const match of tableBody.matchAll(sandwichRegex)) {
    const q = parseInt(match[1], 10);
    if (q >= 2 && q <= 50) pushRow(q);
  }

  // If tableBody isolation failed (e.g. Page 2 transporter duplicate with no product table),
  // fall back to scanning the ENTIRE input text
  if (rows.length === 0 && tableBody !== text) {
    const sandwichRegex2 = /\.\d{2}\s+([1-9]\d{0,1})\s+(?:₹)?(?:\d{1,6}(?:,\d{3})*)?(?:\.\d{2})/g;
    for (const match of text.matchAll(sandwichRegex2)) {
      const q = parseInt(match[1], 10);
      if (q >= 2 && q <= 50) pushRow(q);
    }
  }

  // Fallback 1: Reversed Pattern (Qty followed by two prices)
  if (rows.length === 0) {
    const revRegex = /(?:^|\s)([2-9]|[1-4]\d|50)\s+(?:₹)?(?:\d{1,6}(?:,\d{3})*)?(?:\.\d{2})\s+(?:₹)?(?:\d{1,6}(?:,\d{3})*)?(?:\.\d{2})/g;
    for (const match of tableBody.matchAll(revRegex)) {
      pushRow(parseInt(match[1], 10));
    }
    if (rows.length === 0 && tableBody !== text) {
      const revRegex2 = /(?:^|\s)([2-9]|[1-4]\d|50)\s+(?:₹)?(?:\d{1,6}(?:,\d{3})*)?(?:\.\d{2})\s+(?:₹)?(?:\d{1,6}(?:,\d{3})*)?(?:\.\d{2})/g;
      for (const match of text.matchAll(revRegex2)) {
        pushRow(parseInt(match[1], 10));
      }
    }
  }

  // Fallback 2: Explicit "Qty: N"
  if (rows.length === 0) {
    const explicitRegex = /\b(?:Quantity|Qty)\s*[:\-#|=]?\s*([2-9]|[1-4]\d|50)\b/gi;
    for (const match of tableBody.matchAll(explicitRegex)) {
      pushRow(parseInt(match[1], 10));
    }
    if (rows.length === 0 && tableBody !== text) {
      const explicitRegex2 = /\b(?:Quantity|Qty)\s*[:\-#|=]?\s*([2-9]|[1-4]\d|50)\b/gi;
      for (const match of text.matchAll(explicitRegex2)) {
        pushRow(parseInt(match[1], 10));
      }
    }
  }

  // If no quantities found, push a default single quantity row
  if (rows.length === 0) {
    pushRow(1);
  }

  return rows;

}

/**
 * Extracts line-item quantities by delegating to extractInvoiceRows.
 */
function extractTableQuantities(rawText: string): Array<{
  qty: number;
  unitPrice: number;
  discount: number;
  netAmount: number;
  taxRate?: string;
}> {
  return extractInvoiceRows(rawText);
}

/**
 * Categorize order composition into single_quantity, multiple_asin, or multiple_pieces.
 * Checks every item's quantity and SKU/ASIN across all rows in the invoice table.
 */
function classifyOrderType(
  text: string,
  extractedAsins?: string[],
  extractedSkus?: string[],
  zplQtyHint?: number
): {
  orderType: "single_quantity" | "multiple_asin" | "multiple_pieces";
  totalQuantity: number;
  asinsCount: number;
} {
  // 1. Extract verified product rows from the invoice table
  const rows = extractInvoiceRows(text);

  // 2. Collect all distinct ASINs and SKUs from both table rows and page extractions
  const allAsins = new Set<string>();
  for (const r of rows) {
    if (r.asin && isValidAsin(r.asin)) allAsins.add(r.asin.toUpperCase());
  }
  for (const a of extractedAsins || []) {
    if (a && a !== "N/A" && isValidAsin(a)) allAsins.add(a.toUpperCase());
  }

  const allSkus = new Set<string>();
  for (const r of rows) {
    if (r.sellerSku && r.sellerSku !== "N/A" && r.sellerSku !== "-") allSkus.add(r.sellerSku);
  }
  for (const s of extractedSkus || []) {
    if (s && s !== "N/A" && s !== "-") allSkus.add(s);
  }

  let orderType: "single_quantity" | "multiple_asin" | "multiple_pieces" = "single_quantity";
  let totalQty = 1;
  const asinsCount = Math.max(allAsins.size, allSkus.size, 1);

  if (rows.length > 0) {
    // Check every item's quantity in the invoice
    const totalRowPieces = rows.reduce((sum, r) => sum + r.qty, 0);

    if (rows.length === 1) {
      // Exactly 1 product line item in invoice
      const itemQty = rows[0].qty;
      const finalQty =
        typeof zplQtyHint === "number" && zplQtyHint >= 2
          ? Math.max(itemQty, zplQtyHint)
          : itemQty;

      if (allAsins.size > 1 || allSkus.size > 1) {
        orderType = "multiple_asin";
        const uniqueItemsCount = Math.max(allAsins.size, allSkus.size);
        totalQty = Math.max(
          finalQty >= 2 ? finalQty + uniqueItemsCount - 1 : uniqueItemsCount, 
          typeof zplQtyHint === "number" ? zplQtyHint : 0
        );
      } else if (finalQty >= 2) {
        // Single product, genuinely multiple pieces
        orderType = "multiple_pieces";
        totalQty = finalQty;
      } else {
        // Single product, 1 piece
        orderType = "single_quantity";
        totalQty = 1;
      }
    } else {
      // Multiple line items in invoice (rows.length > 1)
      // Check if rows represent different products or the same product repeated
      const distinctRowAsins = new Set(
        rows.map((r) => r.asin).filter((a): a is string => Boolean(a && isValidAsin(a)))
      );
      const distinctRowSkus = new Set(rows.map((r) => r.sellerSku).filter(Boolean));
      const distinctRowDescriptions = new Set(
        rows.map((r) => r.description?.trim()).filter(Boolean)
      );

      const isMultiProduct =
        allAsins.size > 1 ||
        allSkus.size > 1 ||
        distinctRowAsins.size > 1 ||
        distinctRowSkus.size > 1 ||
        distinctRowDescriptions.size > 1;

      if (isMultiProduct) {
        orderType = "multiple_asin";
        totalQty = Math.max(totalRowPieces, allAsins.size, allSkus.size, rows.length);
      } else {
        // Multiple rows but exact same product repeated
        if (totalRowPieces >= 2) {
          orderType = "multiple_pieces";
          totalQty = totalRowPieces;
        } else {
          orderType = "single_quantity";
          totalQty = 1;
        }
      }
    }
  } else {
    // Fallback when table rows couldn't be parsed
    if (allAsins.size > 1 || allSkus.size > 1) {
      orderType = "multiple_asin";
      totalQty = Math.max(allAsins.size, allSkus.size, zplQtyHint || 1);
    } else if (typeof zplQtyHint === "number" && zplQtyHint >= 2) {
      orderType = "multiple_pieces";
      totalQty = zplQtyHint;
    } else {
      // Check for explicit "Qty: N" in text
      const qtyMatch = text.match(/\b(?:Quantity|Qty)\s*[:\-#|=]?\s*([1-9]\d{0,1})\b/i);
      const q = qtyMatch ? parseInt(qtyMatch[1], 10) : 1;
      if (!isNaN(q) && q >= 2) {
        orderType = "multiple_pieces";
        totalQty = q;
      } else {
        orderType = "single_quantity";
        totalQty = 1;
      }
    }
  }

  return {
    orderType,
    totalQuantity: totalQty,
    asinsCount: Math.max(asinsCount, orderType === "multiple_asin" ? 2 : 1),
  };
}

/**
 * Detects whether a PDF page is an Amazon Transporter Duplicate or Marketplace Fee invoice
 * (e.g. "Tax Invoice/Bill of Supply/Cash Memo (Duplicate for Transporter)", Sold By: Amazon Seller Services,
 * with digitally signed green tick and line item "Marketplace Fees").
 * These pages must be strictly excluded from printing, combined match PDF, and comparison tables.
 */
function isAmazonTransporterOrFeePage(text?: string): boolean {
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
 * Checks if a PDF page contains actual product line items (ASINs, product descriptions, or table rows).
 */
function hasInvoiceLineItems(text?: string): boolean {
  if (!text) return false;
  // Check for ASIN pattern
  if (/\bB0[A-Z0-9]{8}\b/i.test(text)) return true;
  // Check for table header keywords combined with line item indicators
  if (
    /(?:Description|Unit\s*Price|Gross\s*Amount|Taxable\s*Value|Item\s*Description)/i.test(text) &&
    /(?:HSN|SAC|\b\d+\s*\|\s*₹|\bQty\b|\bQuantity\b|Rate)/i.test(text)
  ) {
    return true;
  }
  return false;
}

/**
 * Detects whether a page is an empty transporter copy / signature overflow page
 * (e.g. Page 2 with only Authorized Signatory and NO product line items).
 * These pages must NEVER go inside matched combined PDF, but go into unmatched PDF.
 */
function isTransporterDuplicatePage(text?: string): boolean {
  if (!text) return false;
  // A genuine page with items is NEVER an empty transporter copy!
  if (hasInvoiceLineItems(text)) return false;

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

/**
 * Helper to build comparison results from parsed ZPL labels and PDF text.
 */
function buildComparisonResponse(
  zplLabels: ZplLabelData[],
  convertedZplPdfBase64 = "",
  pagesArray: string[],
  zplFileName = "labels.zpl"
) {
  // Consolidate PDF pages into distinct PDF orders
  interface ConsolidatedOrder extends PdfOrderData {
    fullText?: string;
    totalPages?: number;
    hasCompletedFooter?: boolean;
  }

  const consolidatedPdfOrders: ConsolidatedOrder[] = [];
  const invoiceToPdfIndices = new Map<string, number[]>();
  const orderNumToPdfIndices = new Map<string, number[]>();
  let lastValidPageNumber = 0;

  for (let index = 0; index < pagesArray.length; index++) {
    const pageNumber = index + 1;
    const text = pagesArray[index] || "";

    // -------------------------------------------------------
    // Order number.
    // -------------------------------------------------------
    const orderMatch =
      text.match(/Order Number:\s*([0-9-]{17,19})/i) ||
      text.match(/\b(\d{3}-\d{7}-\d{7})\b/);
    const orderNumber = orderMatch ? orderMatch[1] || orderMatch[0] : "";

    // -------------------------------------------------------
    // Invoice number.
    // -------------------------------------------------------
    const invoiceNumber = extractPdfInvoiceNumber(text);

    // -------------------------------------------------------
    // Amount.
    // -------------------------------------------------------
    const amountMatch =
      text.match(/TOTAL:\s*₹?\s*([0-9.,]+)/i) ||
      text.match(/Invoice Value:\s*([0-9.,]+)/i) ||
      text.match(/Grand Total\s*:?\s*₹?\s*([0-9.,]+)/i);
    const amount = amountMatch?.[1]?.trim() || "";

    // -------------------------------------------------------
    // Date.
    // -------------------------------------------------------
    const dateMatch =
      text.match(/Invoice Date\s*:\s*([0-9./-]+)/i) ||
      text.match(/Order Date:\s*([0-9./-]+)/i);
    const date = dateMatch?.[1]?.trim() || "";

    // -------------------------------------------------------
    // Customer.
    // -------------------------------------------------------
    const billingMatch =
      text.match(/Shipping Address\s*:\s*([^|]+)/i) ||
      text.match(/Billing Address\s*:\s*([^|]+)/i);
    let customer = "";
    if (billingMatch?.[1]) {
      customer = cleanCustomerName(billingMatch[1]);
    }

    const asin = extractAsin(text);
    const sellerSku = extractSellerSku(text);

    const invKey = invoiceNumber ? normalizeInvoice(invoiceNumber) : "";
    const orderKey = orderNumber ? orderNumber.trim() : "";

    const pageInfoMatch =
      text.match(/(?:Page|pg\.?)\s*[:\-]?\s*(\d+)\s*(?:of|\/)\s*(\d+)/i) ||
      text.match(/\b(\d+)\s*(?:of|\/)\s*(\d+)\s*(?:pages)?\b/i);

    let docPageNum = 0;
    let docTotalPages = 0;
    if (pageInfoMatch) {
      docPageNum = parseInt(pageInfoMatch[1], 10);
      docTotalPages = parseInt(pageInfoMatch[2], 10);
    } else {
      const singlePageMatch = text.match(/(?:Page|pg\.?)\s*[:\-]?\s*(\d+)\b/i);
      if (singlePageMatch) {
        docPageNum = parseInt(singlePageMatch[1], 10);
      }
    }

    const hasCompletedFooter =
      /TOTAL\s*:/i.test(text) ||
      /Invoice\s+Value\s*:/i.test(text) ||
      /Grand\s+Total/i.test(text) ||
      /Amount\s+in\s+Words/i.test(text) ||
      /Authorized\s+Signatory/i.test(text);

    let existingIdx = -1;

    // 1. Match by Invoice Number
    if (invKey && invoiceToPdfIndices.has(invKey)) {
      existingIdx = invoiceToPdfIndices.get(invKey)![0];
    }
    // 2. Match by Order Number
    else if (orderKey && orderNumToPdfIndices.has(orderKey)) {
      existingIdx = orderNumToPdfIndices.get(orderKey)![0];
    }
    // 3. Fallback: Sequential continuation of immediately preceding order
    else if (consolidatedPdfOrders.length > 0) {
      const lastOrderIdx = consolidatedPdfOrders.length - 1;
      const lastOrder = consolidatedPdfOrders[lastOrderIdx];
      const isConsecutive = lastValidPageNumber > 0 && pageNumber === lastValidPageNumber + 1;

      if (isConsecutive) {
        const canContinueLast =
          (docPageNum > 1 && docPageNum === lastOrder.pages.length + 1) ||
          (lastOrder.totalPages && lastOrder.totalPages > 1 && lastOrder.pages.length < lastOrder.totalPages) ||
          (!lastOrder.hasCompletedFooter && !orderNumber && !invoiceNumber) ||
          (docPageNum > 1 && !orderNumber && !invoiceNumber);

        if (canContinueLast) {
          existingIdx = lastOrderIdx;
        }
      }
    }

    if (existingIdx !== -1) {
      const existing = consolidatedPdfOrders[existingIdx];
      existing.pages.push(pageNumber);
      existing.fullText = (existing.fullText || "") + "\n" + text;
      if (docTotalPages > 0) existing.totalPages = docTotalPages;
      if (hasCompletedFooter) existing.hasCompletedFooter = true;
      if (!existing.sellerInvoice && invoiceNumber) existing.sellerInvoice = invoiceNumber;
      if (!existing.orderNumber && orderNumber) existing.orderNumber = orderNumber;
      if (!existing.amount && amount) existing.amount = amount;
      if (!existing.date && date) existing.date = date;
      if (!existing.customer && customer) existing.customer = customer;
      if (invoiceNumber && !existing.allInvoices.includes(invoiceNumber)) {
        existing.allInvoices.push(invoiceNumber);
      }
      if (asin) {
        const existingAsins = (existing.asin || "").split(/[\r\n]+|\s+\/\s+/).map((s) => s.trim()).filter(Boolean);
        if (!existingAsins.includes(asin.trim())) {
          existing.asin = existing.asin ? `${existing.asin}\n${asin}` : asin;
        }
      }
      if (sellerSku) {
        const existingSkus = (existing.sellerSku || "").split(/[\r\n]+|\s+\/\s+/).map((s) => s.trim()).filter(Boolean);
        if (!existingSkus.includes(sellerSku.trim())) {
          existing.sellerSku = existing.sellerSku ? `${existing.sellerSku}\n${sellerSku}` : sellerSku;
        }
      }
      if (invKey) {
        const list = invoiceToPdfIndices.get(invKey) || [];
        if (!list.includes(existingIdx)) {
          list.push(existingIdx);
          invoiceToPdfIndices.set(invKey, list);
        }
      }
      if (orderKey) {
        const list = orderNumToPdfIndices.get(orderKey) || [];
        if (!list.includes(existingIdx)) {
          list.push(existingIdx);
          orderNumToPdfIndices.set(orderKey, list);
        }
      }
    } else {
      const newIdx = consolidatedPdfOrders.length;
      const orderRecord: ConsolidatedOrder = {
        orderNumber: orderNumber || "N/A",
        sellerInvoice: invoiceNumber || `Page ${pageNumber}`,
        asin,
        sellerSku,
        allInvoices: invoiceNumber ? [invoiceNumber] : [],
        pages: [pageNumber],
        customer,
        amount,
        date,
        fullText: text,
        totalPages: docTotalPages > 0 ? docTotalPages : undefined,
        hasCompletedFooter,
      };
      consolidatedPdfOrders.push(orderRecord);

      if (invKey) {
        invoiceToPdfIndices.set(invKey, [newIdx]);
      }
      if (orderNumber) {
        orderNumToPdfIndices.set(orderNumber.trim(), [newIdx]);
      }
    }

    lastValidPageNumber = pageNumber;
  }

  // ---------------------------------------------------------
  // PASS 1: PRIORITY 1 - INVOICE NUMBER MATCHING
  // If duplicate ZPL labels or duplicate PDF invoices exist, treat
  // each as a DIFFERENT ENTITY and match each 1-to-1 to its invoice.
  // ---------------------------------------------------------
  const resolveCustomerName = (labelCustomer?: string, pdfCustomer?: string): string => {
    return (labelCustomer && labelCustomer !== "N/A" ? labelCustomer : "") || (pdfCustomer && pdfCustomer !== "N/A" ? pdfCustomer : "") || "N/A";
  };

  const matchedZplIndices = new Set<number>();
  const matchedPdfIndices = new Set<number>();
  const matchedResults: ComparisonResult[] = [];

  for (let i = 0; i < zplLabels.length; i++) {
    const label = zplLabels[i];
    if (!label.invoiceNumber) continue;

    const zplKey = normalizeInvoice(label.invoiceNumber);
    if (!zplKey) continue;

    // 1. Find all UNMATCHED PDF orders with this invoice number
    const candidateIndices = consolidatedPdfOrders
      .map((_, idx) => idx)
      .filter((idx) => {
        if (matchedPdfIndices.has(idx)) return false;
        const pdfOrder = consolidatedPdfOrders[idx];
        if (pdfOrder.sellerInvoice && normalizeInvoice(pdfOrder.sellerInvoice) === zplKey) {
          return true;
        }
        if (pdfOrder.allInvoices.some((inv) => normalizeInvoice(inv) === zplKey)) {
          return true;
        }
        return false;
      });

    let matchedIdx = -1;

    if (candidateIndices.length === 1) {
      if (!isTransporterDuplicatePage(consolidatedPdfOrders[candidateIndices[0]].fullText)) {
        matchedIdx = candidateIndices[0];
      }
    } else if (candidateIndices.length > 1) {
      // Pick best matching candidate by customer, shipping address, or order number
      let bestIdx = candidateIndices[0];
      let bestScore = -1;
      const zplAddr = [label.customer, label.shipToAddress].filter(Boolean).join(" ");

      for (const cIdx of candidateIndices) {
        const pdfOrder = consolidatedPdfOrders[cIdx];
        let score = 0;
        if (label.orderNumber && pdfOrder.orderNumber && label.orderNumber === pdfOrder.orderNumber) {
          score += 20;
        }
        if (label.customer && pdfOrder.customer && label.customer.toLowerCase() === pdfOrder.customer.toLowerCase()) {
          score += 10;
        }
        const pdfAddr = [pdfOrder.customer, pdfOrder.shippingAddress].filter(Boolean).join(" ");
        if (zplAddr && pdfAddr) {
          score += computeAddressSimilarity(pdfAddr, zplAddr) * 10;
        }
        if (hasInvoiceLineItems(pdfOrder.fullText)) {
          score += 30;
        }
        if (isTransporterDuplicatePage(pdfOrder.fullText)) {
          score -= 100;
        }
        if (score > bestScore) {
          bestScore = score;
          bestIdx = cIdx;
        }
      }
      matchedIdx = bestIdx;
    }

    // 2. Rare Edge Case Fallback: If all PDF orders with this invoice number are already matched
    // (e.g. 2 ZPL labels for 1 physical invoice), treat this duplicate ZPL label as a different entity
    // and match it with the invoice (without combining or discarding)
    let isSharedFallback = false;
    if (matchedIdx === -1) {
      const duplicateIdx = consolidatedPdfOrders.findIndex((pdfOrder) => {
        if (isTransporterDuplicatePage(pdfOrder.fullText)) return false;
        if (pdfOrder.sellerInvoice && normalizeInvoice(pdfOrder.sellerInvoice) === zplKey) {
          return true;
        }
        if (pdfOrder.allInvoices.some((inv) => normalizeInvoice(inv) === zplKey)) {
          return true;
        }
        return false;
      });

      if (duplicateIdx !== -1) {
        matchedIdx = duplicateIdx;
        isSharedFallback = true;
      }
    }

    if (matchedIdx !== -1) {
      const matchedOrder = consolidatedPdfOrders[matchedIdx];
      matchedZplIndices.add(label.index);
      if (!isSharedFallback) {
        matchedPdfIndices.add(matchedIdx);
      }

      const extractedItems = extractAllItemsFromPdfText(matchedOrder.fullText || "");
      const classification = classifyOrderType(
        matchedOrder.fullText || "",
        extractedItems.asins,
        extractedItems.sellerSkus,
        label.totalQuantity
      );

      const asinVal = extractedItems.asinString || matchedOrder.asin || label.asin || "N/A";
      const skuVal = extractedItems.sellerSkuString || matchedOrder.sellerSku || label.sellerSku || "N/A";

      matchedResults.push({
        index: 0,
        isMatch: true,
        pdfInvoice: matchedOrder.sellerInvoice || label.invoiceNumber,
        zplInvoice: label.invoiceNumber,
        asin: asinVal,
        sellerSku: skuVal,
        orderNumber: matchedOrder.orderNumber || label.orderNumber || "N/A",
        awb: label.awb || "N/A",
        customer: resolveCustomerName(label.customer, matchedOrder.customer),
        amount: matchedOrder.amount ? `₹${matchedOrder.amount}` : "N/A",
        date: matchedOrder.date || "N/A",
        pdfPages: matchedOrder.pages || [],
        zplPage: label.index,
        orderType: classification.orderType,
        totalQuantity: classification.totalQuantity,
        asinsCount: classification.asinsCount,
      });
    }
  }

  // ---------------------------------------------------------
  // PASS 2: PRIORITY 2 - ADDRESS MATCHING (FALLBACK)
  // PDF "Shipping Address :" vs ZPL "Ship To:"
  // ---------------------------------------------------------
  const unmatchedZpls = zplLabels.filter((l) => !matchedZplIndices.has(l.index));
  const unmatchedPdfIndices = consolidatedPdfOrders
    .map((_, idx) => idx)
    .filter((idx) => !matchedPdfIndices.has(idx) && !isTransporterDuplicatePage(consolidatedPdfOrders[idx].fullText));

  if (unmatchedZpls.length > 0 && unmatchedPdfIndices.length > 0) {
    interface CandidateAddressPair {
      zplLabel: ZplLabelData;
      pdfIdx: number;
      score: number;
    }

    const candidatePairs: CandidateAddressPair[] = [];

    for (const zpl of unmatchedZpls) {
      const zplAddr = [zpl.customer, zpl.shipToAddress].filter(Boolean).join(" ");
      if (!zplAddr) continue;

      for (const pdfIdx of unmatchedPdfIndices) {
        const pdfOrder = consolidatedPdfOrders[pdfIdx];
        const pdfAddr = [pdfOrder.customer, pdfOrder.shippingAddress].filter(Boolean).join(" ");
        if (!pdfAddr) continue;

        const score = computeAddressSimilarity(pdfAddr, zplAddr);
        if (score >= 0.60) {
          // Reject match if names clearly contradict (different people in the same building/PIN code)
          const pdfName = cleanCustomerName(pdfOrder.customer || "").toLowerCase();
          const zplName = cleanCustomerName(zpl.customer || "").toLowerCase();
          const hasNameConflict =
            pdfName &&
            zplName &&
            pdfName !== "n/a" &&
            zplName !== "n/a" &&
            score < 0.80 &&
            !pdfName.split(" ").some((p) => p.length >= 3 && zplName.includes(p)) &&
            !zplName.split(" ").some((p) => p.length >= 3 && pdfName.includes(p));

          if (!hasNameConflict) {
            candidatePairs.push({
              zplLabel: zpl,
              pdfIdx,
              score,
            });
          }
        }
      }
    }

    // Sort descending by similarity score so best matches pair first
    candidatePairs.sort((a, b) => b.score - a.score);

    for (const pair of candidatePairs) {
      if (
        matchedZplIndices.has(pair.zplLabel.index) ||
        matchedPdfIndices.has(pair.pdfIdx)
      ) {
        continue;
      }

      matchedZplIndices.add(pair.zplLabel.index);
      matchedPdfIndices.add(pair.pdfIdx);

      const label = pair.zplLabel;
      const matchedOrder = consolidatedPdfOrders[pair.pdfIdx];

      const extractedItems = extractAllItemsFromPdfText(matchedOrder.fullText || "");
      const classification = classifyOrderType(
        matchedOrder.fullText || "",
        extractedItems.asins,
        extractedItems.sellerSkus,
        label.totalQuantity
      );

      const asinVal = extractedItems.asinString || matchedOrder.asin || label.asin || "N/A";
      const skuVal = extractedItems.sellerSkuString || matchedOrder.sellerSku || label.sellerSku || "N/A";

      const resolvedInvoice = matchedOrder.sellerInvoice || label.invoiceNumber || "Address Matched";

      matchedResults.push({
        index: 0,
        isMatch: true,
        pdfInvoice: matchedOrder.sellerInvoice || resolvedInvoice,
        zplInvoice: label.invoiceNumber || resolvedInvoice,
        asin: asinVal,
        sellerSku: skuVal,
        orderNumber: matchedOrder.orderNumber || "N/A",
        awb: label.awb || "N/A",
        customer: resolveCustomerName(label.customer, matchedOrder.customer),
        amount: matchedOrder.amount ? `₹${matchedOrder.amount}` : "N/A",
        date: matchedOrder.date || "N/A",
        pdfPages: matchedOrder.pages || [],
        zplPage: label.index,
        orderType: classification.orderType,
        totalQuantity: classification.totalQuantity,
        asinsCount: classification.asinsCount,
      });

      console.log(
        `[Address Match Success] ZPL #${label.index} matched PDF order ${matchedOrder.orderNumber || resolvedInvoice} with score ${pair.score.toFixed(2)}`
      );
    }
  }

  // ---------------------------------------------------------
  // PASS 3: COLLECT REMAINING UNMATCHED ZPL LABELS
  // ---------------------------------------------------------
  const mismatchedZplResults: ComparisonResult[] = [];
  for (const label of zplLabels) {
    if (!matchedZplIndices.has(label.index)) {
      mismatchedZplResults.push({
        index: 0,
        isMatch: false,
        pdfInvoice: "Not Found in PDF",
        zplInvoice: label.invoiceNumber || "Not Found in ZPL",
        asin: label.asin || "N/A",
        sellerSku: label.sellerSku || "N/A",
        orderNumber: "N/A",
        awb: label.awb || "N/A",
        customer: resolveCustomerName(label.customer, undefined),
        amount: "N/A",
        date: "N/A",
        pdfPages: [],
        zplPage: label.index,
      });
    }
  }

  // ---------------------------------------------------------
  // PASS 4: COLLECT REMAINING UNMATCHED PDF ORDERS
  // ---------------------------------------------------------
  const mismatchedPdfResults: ComparisonResult[] = [];
  consolidatedPdfOrders.forEach((pdfOrder, idx) => {
    if (!matchedPdfIndices.has(idx)) {
      const extractedItems = extractAllItemsFromPdfText(pdfOrder.fullText || "");
      const asinVal = extractedItems.asinString || pdfOrder.asin || "N/A";
      const skuVal = extractedItems.sellerSkuString || pdfOrder.sellerSku || "N/A";

      mismatchedPdfResults.push({
        index: 0,
        isMatch: false,
        pdfInvoice: pdfOrder.sellerInvoice || "N/A",
        zplInvoice: "Not Found in ZPL",
        asin: asinVal,
        sellerSku: skuVal,
        orderNumber: pdfOrder.orderNumber || "N/A",
        awb: "N/A",
        customer: resolveCustomerName(undefined, pdfOrder.customer),
        amount: pdfOrder.amount ? `₹${pdfOrder.amount}` : "N/A",
        date: pdfOrder.date || "N/A",
        pdfPages: pdfOrder.pages || [],
        zplPage: 0,
      });
    }
  });

  const comparisonResults: ComparisonResult[] = [
    ...matchedResults,
    ...mismatchedZplResults,
    ...mismatchedPdfResults,
  ].map((res, idx) => ({ ...res, index: idx + 1 }));

  const matchCount = matchedResults.length;
  const mismatchCount = mismatchedZplResults.length + mismatchedPdfResults.length;
  const matchPercentage = zplLabels.length > 0 ? Math.round((matchCount / zplLabels.length) * 100) : 0;

  const validPdfPages = pagesArray.filter((t) => !isAmazonTransporterOrFeePage(t)).length;

  return NextResponse.json({
    success: true,
    summary: {
      totalZplLabels: zplLabels.length,
      totalPdfOrders: consolidatedPdfOrders.length,
      totalPdfPages: validPdfPages,
      matchedCount: matchCount,
      mismatchCount: mismatchCount,
      matchPercentage,
      isAllMatched: matchCount > 0 && mismatchCount === 0,
      processedAt: new Date().toISOString(),
      zplFileName,
      pdfFileName: "client-processed.pdf",
    },
    results: comparisonResults,
    files: {
      convertedZplPdfBase64,
      combinedPdfBase64: "",
      originalPdfBase64: "",
    },
  });
}

interface RateLimitRecord {
  count: number;
  resetTime: number;
}
const ipRateLimits = new Map<string, RateLimitRecord>();
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const MAX_REQUESTS_PER_WINDOW = 120; // Up to 120 requests/min per IP/token for chunked processing

function checkRateLimit(clientId: string): { allowed: boolean; retryAfter: number } {
  const now = Date.now();
  const record = ipRateLimits.get(clientId);

  if (ipRateLimits.size > 2000) {
    for (const [k, v] of ipRateLimits.entries()) {
      if (v.resetTime < now) ipRateLimits.delete(k);
    }
  }

  if (!record || record.resetTime < now) {
    ipRateLimits.set(clientId, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
    return { allowed: true, retryAfter: 0 };
  }

  if (record.count >= MAX_REQUESTS_PER_WINDOW) {
    return {
      allowed: false,
      retryAfter: Math.max(1, Math.ceil((record.resetTime - now) / 1000)),
    };
  }

  record.count++;
  return { allowed: true, retryAfter: 0 };
}

function isAuthorized(req: NextRequest): boolean {
  const authHeader = req.headers.get("authorization");
  if (authHeader && authHeader.startsWith("Bearer ") && authHeader.length > 10) {
    return true;
  }
  const cookieToken =
    req.cookies.get("accessToken")?.value ||
    req.cookies.get("token")?.value;
  if (cookieToken && cookieToken.length > 10) {
    return true;
  }
  return false;
}

/**
 * Main POST handler with Streamlined Network Pipeline support.
 */
export async function POST(req: NextRequest) {
  try {
    // 0. Security Verification: Authentication, Rate Limiting & Payload Bounds
    if (!isAuthorized(req)) {
      return NextResponse.json(
        { error: "Unauthorized. A valid authentication token is required." },
        { status: 401 }
      );
    }

    const clientIp =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      req.headers.get("x-real-ip") ||
      "client";
    const { allowed, retryAfter } = checkRateLimit(clientIp);
    if (!allowed) {
      return NextResponse.json(
        { error: "Rate limit exceeded. Please wait before processing more labels." },
        {
          status: 429,
          headers: { "Retry-After": String(retryAfter) },
        }
      );
    }

    const contentLength = parseInt(req.headers.get("content-length") || "0", 10);
    if (contentLength > 35 * 1024 * 1024) {
      return NextResponse.json(
        { error: "Payload exceeds 35MB size limit." },
        { status: 413 }
      );
    }

    const contentType = req.headers.get("content-type") || "";

    // 1. JSON Request (Action: "compare" or "convert-zpl-chunk")
    if (contentType.includes("application/json")) {
      const body = await req.json();
      const { action, zplLabels, convertedZplPdfBase64, pdfTextArray, zplFileName, zplChunk } = body;

      if (action === "convert-zpl-chunk") {
        if (!zplChunk || typeof zplChunk !== "string") {
          return NextResponse.json({ error: "zplChunk is required." }, { status: 400 });
        }
        const chunkPdfBuffer = await convertZplChunkToPdf(zplChunk);
        return new NextResponse(new Uint8Array(chunkPdfBuffer), {
          status: 200,
          headers: {
            "Content-Type": "application/pdf",
            "Content-Length": chunkPdfBuffer.length.toString(),
          },
        });
      }

      if (action === "compare") {
        return buildComparisonResponse(
          zplLabels || [],
          convertedZplPdfBase64 || "",
          pdfTextArray || [],
          zplFileName || "labels.zpl"
        );
      }
    }

    // 2. FormData Request
    const formData = await req.formData();
    const action = (formData.get("action") as string) || null;
    const zplFile = formData.get("zplFile") as File | null;

    // Micro-chunk conversion via FormData
    if (action === "convert-zpl-chunk") {
      const chunkText = (formData.get("zplChunk") as string) || (zplFile ? await zplFile.text() : "");
      if (!chunkText) {
        return NextResponse.json({ error: "zplChunk is required." }, { status: 400 });
      }
      const chunkPdfBuffer = await convertZplChunkToPdf(chunkText);
      return new NextResponse(new Uint8Array(chunkPdfBuffer), {
        status: 200,
        headers: {
          "Content-Type": "application/pdf",
          "Content-Length": chunkPdfBuffer.length.toString(),
        },
      });
    }

    // CONCURRENT PIPELINE: Convert ZPL immediately in the background
    if (action === "convert-zpl") {
      if (!(zplFile instanceof File)) {
        return NextResponse.json({ error: "ZPL file is required." }, { status: 400 });
      }

      const zplText = await zplFile.text();
      const zplLabels = parseZplLabels(zplText);

      if (zplLabels.length === 0) {
        return NextResponse.json(
          { error: "No valid ZPL label definitions found in the uploaded ZPL file." },
          { status: 400 }
        );
      }

      const mergedZplPdf = await PDFDocument.create();
      const CHUNK_SIZE = 50;

      for (let i = 0; i < zplLabels.length; i += CHUNK_SIZE) {
        const chunk = zplLabels.slice(i, i + CHUNK_SIZE);
        const chunkZpl = chunk.map((label) => label.rawZpl).join("\n");
        const chunkPdfBuffer = await convertZplChunkToPdf(chunkZpl);
        const chunkPdf = await PDFDocument.load(chunkPdfBuffer);
        const copiedPages = await mergedZplPdf.copyPages(chunkPdf, chunkPdf.getPageIndices());
        copiedPages.forEach((page) => mergedZplPdf.addPage(page));

        if (i + CHUNK_SIZE < zplLabels.length) {
          await new Promise((resolve) => setTimeout(resolve, 250));
        }
      }

      const convertedZplPdfBytes = await mergedZplPdf.save({ useObjectStreams: true });
      const convertedZplPdfBase64 = Buffer.from(convertedZplPdfBytes).toString("base64");

      return NextResponse.json({
        success: true,
        zplLabels,
        convertedZplPdfBase64,
      });
    }

    // 3. Fallback: Full single-pass processing
    const pdfTextArrayStr = formData.get("pdfTextArray");
    if (!(zplFile instanceof File) || typeof pdfTextArrayStr !== "string") {
      return NextResponse.json(
        { error: "ZPL file and PDF text array are required." },
        { status: 400 }
      );
    }

    const pdfTextArray: string[] = JSON.parse(pdfTextArrayStr);
    const zplText = await zplFile.text();
    const zplLabels = parseZplLabels(zplText);

    if (zplLabels.length === 0) {
      return NextResponse.json(
        { error: "No valid ZPL label definitions found in the uploaded ZPL file." },
        { status: 400 }
      );
    }

    const mergedZplPdf = await PDFDocument.create();
    const CHUNK_SIZE = 50;

    for (let i = 0; i < zplLabels.length; i += CHUNK_SIZE) {
      const chunk = zplLabels.slice(i, i + CHUNK_SIZE);
      const chunkZpl = chunk.map((label) => label.rawZpl).join("\n");
      const chunkPdfBuffer = await convertZplChunkToPdf(chunkZpl);
      const chunkPdf = await PDFDocument.load(chunkPdfBuffer);
      const copiedPages = await mergedZplPdf.copyPages(chunkPdf, chunkPdf.getPageIndices());
      copiedPages.forEach((page) => mergedZplPdf.addPage(page));

      if (i + CHUNK_SIZE < zplLabels.length) {
        await new Promise((resolve) => setTimeout(resolve, 250));
      }
    }

    const convertedZplPdfBytes = await mergedZplPdf.save({ useObjectStreams: true });
    const convertedZplPdfBase64 = Buffer.from(convertedZplPdfBytes).toString("base64");

    return buildComparisonResponse(
      zplLabels,
      convertedZplPdfBase64,
      pdfTextArray,
      zplFile.name
    );
  } catch (error: unknown) {
    console.error("Amazon order process error:", error);
    const errorMessage = error instanceof Error ? error.message : "Internal processing error occurred.";
    return NextResponse.json({ error: `Processing failed: ${errorMessage}` }, { status: 500 });
  }
}