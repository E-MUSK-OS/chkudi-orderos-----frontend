import { NextRequest, NextResponse } from "next/server";
import https from "https";
import { PDFDocument } from "pdf-lib";

export const runtime = "nodejs";
export const maxDuration = 60;

interface ZplLabelData {
  index: number;
  invoiceNumber: string;
  asin?: string;
  sellerSku?: string;
  awb: string;
  customer: string;
  rawZpl: string;
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
function cleanCustomerName(raw: string): string {
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
      // Get text segment immediately preceding the ASIN (up to 250 characters before)
      const beforeText = targetText.substring(Math.max(0, m.index - 250), m.index);

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
      const beforeText = targetText.substring(Math.max(0, m.index - 250), m.index);
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
    rawSellerSkus.push(extractedSku || asinCandidate);
  }

  // Deduplicate consecutive identical ASIN & SKU pairs resulting from duplicate matches on the same line item
  const asins: string[] = [];
  const sellerSkus: string[] = [];

  for (let i = 0; i < rawAsins.length; i++) {
    const curAsin = rawAsins[i];
    const curSku = rawSellerSkus[i];
    const prevAsin = asins[asins.length - 1];
    const prevSku = sellerSkus[sellerSkus.length - 1];

    if (curAsin === prevAsin && curSku === prevSku) {
      continue;
    }
    asins.push(curAsin);
    sellerSkus.push(curSku);
  }

  if (asins.length === 0) {
    const singleAsin = extractAsin(text);
    const singleSku = extractSellerSku(text);
    if (singleAsin) asins.push(singleAsin);
    if (singleSku) sellerSkus.push(singleSku);
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
     * ^FOx,y...^FDtext^FS
     */
    const fieldRegex =
      /\^FO(\d+),(\d+).*?\^FD([^^]+)\^FS/gi;

    const fields: Array<{
      x: number;
      y: number;
      text: string;
    }> = [];

    let fm: RegExpExecArray | null;

    while ((fm = fieldRegex.exec(decoded)) !== null) {
      fields.push({
        x: parseInt(fm[1], 10),
        y: parseInt(fm[2], 10),
        text: fm[3].trim(),
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
    // STEP 5: Extract customer / recipient.
    // ---------------------------------------------------------

    let customer = "";

    const customerMatch =
      decoded.match(/\^FO50,360.*?\^FD(.*?)\^FS/i) ||
      decoded.match(/\^FO40,445.*?\^FD(.*?)\^FS/i) ||
      decoded.match(/Ship To:[\s\S]*?\^FD(.*?)\^FS/i);

    if (customerMatch?.[1]) {
      customer = cleanCustomerName(customerMatch[1]);
    }

    // ---------------------------------------------------------
    // STEP 6: Extract ASIN / ASI number.
    // ---------------------------------------------------------

    const asin = extractAsin(decoded);
    const sellerSku = extractSellerSku(decoded);

    // ---------------------------------------------------------
    // Logging.
    // ---------------------------------------------------------

    if (invoiceNumber) {
      console.log(
        `[ZPL Parse] Label ${
          labels.length + 1
        }: Invoice="${invoiceNumber}", ASIN="${asin}", SKU="${sellerSku}", AWB="${awb}"`
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
      asin,
      sellerSku,
      awb,
      customer,
      rawZpl: fullLabel,
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
 * Categorize order composition into:
 * - "single_quantity": Exactly 1 ASIN and 1 piece/quantity total in invoice
 * - "multiple_asin": Multiple different ASINs in invoice
 * - "multiple_pieces": Multiple pieces (qty > 1) for the same ASIN
 */
function classifyOrderType(
  text: string,
  extractedAsins?: string[],
  extractedSkus?: string[]
): {
  orderType: "single_quantity" | "multiple_asin" | "multiple_pieces";
  totalQuantity: number;
  asinsCount: number;
} {
  if (!text && (!extractedAsins || extractedAsins.length === 0)) {
    return { orderType: "single_quantity", totalQuantity: 1, asinsCount: 1 };
  }

  let asinsCount = 1;
  let skusCount = 1;
  let totalQty = 1;

  if (extractedAsins && extractedAsins.length > 0) {
    const uniqueAsins = new Set(extractedAsins);
    asinsCount = uniqueAsins.size;
    totalQty = extractedAsins.length;
  } else {
    const asinMatches = Array.from(text.matchAll(/\b(B0[A-Z0-9]{8})\b/gi)).map((m) => m[1].toUpperCase());
    const uniqueAsins = new Set(asinMatches);
    asinsCount = uniqueAsins.size || 1;
    if (asinMatches.length > totalQty) totalQty = asinMatches.length;
  }

  if (extractedSkus && extractedSkus.length > 0) {
    const uniqueSkus = new Set(extractedSkus);
    skusCount = uniqueSkus.size;
    if (extractedSkus.length > totalQty) totalQty = extractedSkus.length;
  }

  const qtyMatch = text.match(/(?:TOTAL\s*QTY|Quantity|Qty|QTY)\s*[:\-#]?\s*(\d+)/i);
  if (qtyMatch?.[1]) {
    const parsed = parseInt(qtyMatch[1], 10);
    if (!isNaN(parsed) && parsed > 0 && parsed < 500) {
      totalQty = Math.max(totalQty, parsed);
    }
  }

  let orderType: "single_quantity" | "multiple_asin" | "multiple_pieces" = "single_quantity";

  if (asinsCount > 1) {
    orderType = "multiple_asin";
  } else if (skusCount > 1 || totalQty > 1 || (extractedSkus && extractedSkus.length > 1)) {
    orderType = "multiple_pieces";
  } else {
    orderType = "single_quantity";
  }

  return {
    orderType,
    totalQuantity: Math.max(totalQty, 1),
    asinsCount,
  };
}

/**
 * Main POST handler.
 */
/**
 * Helper to build comparison results from parsed ZPL labels and PDF text.
 */
function buildComparisonResponse(
  zplLabels: ZplLabelData[],
  convertedZplPdfBase64: string,
  pagesArray: string[],
  zplFileName = "labels.zpl"
) {
  const invoiceMap = new Map<string, PdfOrderData & { fullText?: string }>();
  const pdfOrdersList: (PdfOrderData & { fullText?: string })[] = [];

  for (let index = 0; index < pagesArray.length; index++) {
    const pageNumber = index + 1;
    const text = pagesArray[index] || "";

    // Order number
    const orderMatch =
      text.match(/Order Number:\s*([0-9-]{17,19})/i) ||
      text.match(/\b(\d{3}-\d{7}-\d{7})\b/);
    const orderNumber = orderMatch ? orderMatch[1] || orderMatch[0] : "";

    // Invoice number
    const invoiceNumber = extractPdfInvoiceNumber(text);

    // ASIN / ASI number
    const asin = extractAsin(text);

    // Seller SKU
    const sellerSku = extractSellerSku(text);

    // Amount
    const amountMatch =
      text.match(/TOTAL:\s*₹?\s*([0-9.,]+)/i) ||
      text.match(/Invoice Value:\s*([0-9.,]+)/i) ||
      text.match(/Grand Total\s*:?\s*₹?\s*([0-9.,]+)/i);
    const amount = amountMatch?.[1]?.trim() || "";

    // Date
    const dateMatch =
      text.match(/Invoice Date\s*:\s*([0-9./-]+)/i) ||
      text.match(/Order Date:\s*([0-9./-]+)/i);
    const date = dateMatch?.[1]?.trim() || "";

    // Customer
    const billingMatch =
      text.match(/Shipping Address\s*:\s*([^|]+)/i) ||
      text.match(/Billing Address\s*:\s*([^|]+)/i);
    let customer = "";
    if (billingMatch?.[1]) {
      customer = cleanCustomerName(billingMatch[1]);
    }

    const orderRecord = {
      orderNumber,
      sellerInvoice: invoiceNumber,
      asin,
      sellerSku,
      allInvoices: invoiceNumber ? [invoiceNumber] : [],
      pages: [pageNumber],
      customer,
      amount,
      date,
      fullText: text,
    };

    pdfOrdersList.push(orderRecord);

    if (invoiceNumber) {
      const key = normalizeInvoice(invoiceNumber);
      if (invoiceMap.has(key)) {
        const existing = invoiceMap.get(key)!;
        existing.pages.push(pageNumber);
        existing.fullText = (existing.fullText || "") + "\n" + text;
        if (!existing.orderNumber && orderNumber) existing.orderNumber = orderNumber;
        if (!existing.asin && asin) existing.asin = asin;
        if (!existing.sellerSku && sellerSku) existing.sellerSku = sellerSku;
        if (!existing.amount && amount) existing.amount = amount;
        if (!existing.date && date) existing.date = date;
        if (!existing.customer && customer) existing.customer = customer;
        if (!existing.allInvoices.includes(invoiceNumber)) {
          existing.allInvoices.push(invoiceNumber);
        }
      } else {
        invoiceMap.set(key, { ...orderRecord });
      }
    }
  }

  // Compare ZPL labels with PDF invoices
  const matchedResults: ComparisonResult[] = [];
  const mismatchedZplResults: ComparisonResult[] = [];
  const matchedPdfKeys = new Set<string>();

  for (let i = 0; i < zplLabels.length; i++) {
    const label = zplLabels[i];
    let matchedOrder: (PdfOrderData & { fullText?: string }) | null = null;

    if (label.invoiceNumber) {
      const key = normalizeInvoice(label.invoiceNumber);
      matchedOrder = invoiceMap.get(key) || null;
    }

    if (matchedOrder) {
      matchedPdfKeys.add(normalizeInvoice(matchedOrder.sellerInvoice));

      const extractedItems = extractAllItemsFromPdfText(matchedOrder.fullText || "");
      const classification = classifyOrderType(
        matchedOrder.fullText || "",
        extractedItems.asins,
        extractedItems.sellerSkus
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
        orderNumber: matchedOrder.orderNumber || "N/A",
        awb: label.awb || "N/A",
        customer: matchedOrder.customer || label.customer || "N/A",
        amount: matchedOrder.amount ? `₹${matchedOrder.amount}` : "N/A",
        date: matchedOrder.date || "N/A",
        pdfPages: matchedOrder.pages || [],
        zplPage: label.index,
        orderType: classification.orderType,
        totalQuantity: classification.totalQuantity,
        asinsCount: classification.asinsCount,
      });
    } else {
      mismatchedZplResults.push({
        index: 0,
        isMatch: false,
        pdfInvoice: "Not Found in PDF",
        zplInvoice: label.invoiceNumber || "Not Found in ZPL",
        asin: label.asin || "N/A",
        sellerSku: label.sellerSku || "N/A",
        orderNumber: "N/A",
        awb: label.awb || "N/A",
        customer: label.customer || "N/A",
        amount: "N/A",
        date: "N/A",
        pdfPages: [],
        zplPage: label.index,
      });
    }
  }

  const mismatchedPdfResults: ComparisonResult[] = [];
  const seenPdfKeys = new Set<string>();

  for (const pdfOrder of pdfOrdersList) {
    const key = normalizeInvoice(pdfOrder.sellerInvoice);
    if (!key || seenPdfKeys.has(key)) continue;
    seenPdfKeys.add(key);

    if (!matchedPdfKeys.has(key)) {
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
        customer: pdfOrder.customer || "N/A",
        amount: pdfOrder.amount ? `₹${pdfOrder.amount}` : "N/A",
        date: pdfOrder.date || "N/A",
        pdfPages: pdfOrder.pages || [],
        zplPage: 0,
      });
    }
  }

  const comparisonResults: ComparisonResult[] = [
    ...matchedResults,
    ...mismatchedZplResults,
    ...mismatchedPdfResults,
  ].map((res, idx) => ({ ...res, index: idx + 1 }));

  const matchCount = matchedResults.length;
  const mismatchCount = mismatchedZplResults.length + mismatchedPdfResults.length;
  const matchPercentage = zplLabels.length > 0 ? Math.round((matchCount / zplLabels.length) * 100) : 0;

  return NextResponse.json({
    success: true,
    summary: {
      totalZplLabels: zplLabels.length,
      totalPdfOrders: invoiceMap.size,
      totalPdfPages: pagesArray.length,
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

/**
 * Main POST handler with Streamlined Network Pipeline support.
 */
export async function POST(req: NextRequest) {
  try {
    const contentType = req.headers.get("content-type") || "";

    // 1. JSON Request (Action: "compare")
    if (contentType.includes("application/json")) {
      const body = await req.json();
      const { action, zplLabels, convertedZplPdfBase64, pdfTextArray, zplFileName } = body;

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

      const convertedZplPdfBytes = await mergedZplPdf.save();
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

    const convertedZplPdfBytes = await mergedZplPdf.save();
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