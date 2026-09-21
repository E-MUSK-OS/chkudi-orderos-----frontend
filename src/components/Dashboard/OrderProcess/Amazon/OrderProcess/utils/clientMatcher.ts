import { cleanCustomerName } from "../utils";
import {
  AmazonOrderType,
  AmazonComparisonResult,
  AmazonOrderSummary,
  AmazonProcessFiles,
  AmazonProcessResponse,
} from "../types";

export type {
  AmazonOrderType,
  AmazonComparisonResult,
  AmazonOrderSummary,
  AmazonProcessFiles,
  AmazonProcessResponse,
};

export type ComparisonResult = AmazonComparisonResult;

/**
 * Validate whether a 10-character string is a plausible Amazon ASIN.
 */
export function isValidAsin(candidate: string): boolean {
  if (!candidate || candidate.length !== 10) return false;
  const upper = candidate.toUpperCase();

  if (!/^[A-Z0-9]{10}$/.test(upper)) return false;

  if (upper.startsWith("B0")) {
    return true;
  }

  if (!/\d/.test(upper)) {
    return false;
  }

  if (upper.startsWith("B") && /\d/.test(upper)) {
    return true;
  }

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
 * Extract ASIN / ASI number from text.
 */
export function extractAsin(text: string): string {
  if (!text) return "";

  const labelMatch = text.match(/(?:ASIN|ASI|ASIN\s*NO|ASIN\s*NUMBER)\s*[:\-#]?\s*([A-Z0-9]{10})/i);
  if (labelMatch?.[1] && isValidAsin(labelMatch[1])) {
    return labelMatch[1].toUpperCase();
  }

  const b0Matches = Array.from(text.matchAll(/\b(B0[A-Z0-9]{8})\b/gi));
  for (const match of b0Matches) {
    const candidate = match[1];
    if (isValidAsin(candidate)) {
      return candidate.toUpperCase();
    }
  }

  const hsnMatches = Array.from(text.matchAll(/\b([A-Z0-9]{10})\b[\s\S]{0,100}?\bHSN/gi));
  for (const match of hsnMatches) {
    const candidate = match[1];
    if (isValidAsin(candidate)) {
      return candidate.toUpperCase();
    }
  }

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
 */
export function cleanExtractedSku(raw: string): string {
  if (!raw) return "";
  let sku = raw.trim();

  if (sku.includes("|")) {
    sku = sku.split("|")[0].trim();
  }

  sku = sku.replace(/^[\\"']+|[\\"'.\-:]+$/g, "").trim();
  return sku;
}

/**
 * Extract Seller SKU from PDF tax invoice / ZPL text.
 */
export function extractSellerSku(text: string): string {
  if (!text) return "";

  let targetText = text;
  const descMatch = text.match(/(?:Description\s+of\s+Goods|Description|Particulars|Item\s+Details|Product\s+Details)[\s\S]*/i);
  if (descMatch?.[0]) {
    targetText = descMatch[0];
  }

  const asinMatches = Array.from(targetText.matchAll(/\b(B0[A-Z0-9]{8})\b/gi));

  for (const m of asinMatches) {
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
          return cleaned;
        }
      }
    }
  }

  const doubleParenMatch = targetText.match(/\(([^()]{2,100})\)\s*\(?\s*B0[A-Z0-9]{8}/i);
  if (doubleParenMatch?.[1]) {
    const cleaned = cleanExtractedSku(doubleParenMatch[1]);
    if (cleaned && !cleaned.toUpperCase().startsWith("B0") && !/^\d{3}-\d{7}-\d{7}$/.test(cleaned)) {
      return cleaned;
    }
  }

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
export function extractAllItemsFromPdfText(text: string): {
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
    if (curSku) {
      sellerSkus.push(curSku);
    }
  }

  if (asins.length === 0) {
    const singleAsin = extractAsin(text);
    const singleSku = extractSellerSku(text);
    if (singleAsin) asins.push(singleAsin);
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

export interface ZplLabelData {
  index: number;
  invoiceNumber: string;
  orderNumber?: string;
  asin?: string;
  sellerSku?: string;
  awb: string;
  customer: string;
  rawZpl: string;
  shipToAddress?: string;
}

export interface PdfOrderData {
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

export interface ConsolidatedOrder extends PdfOrderData {
  fullText?: string;
  totalPages?: number;
  hasCompletedFooter?: boolean;
}

/**
 * Extract complete address following "Ship To:" from ZPL fields or decoded text.
 */
export function extractZplShipToAddress(
  decoded: string,
  fields: Array<{ x: number; y: number; text: string }>
): string {
  // Strategy 1: Find field containing "Ship To"
  const shipToField = fields.find((f) => /Ship\s*To/i.test(f.text));

  if (shipToField) {
    const afterShipTo = shipToField.text.replace(/Ship\s*To\s*[:\-]?\s*/i, "").trim();

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

  // Strategy 3: Multi-line match across ^FD tags after "Ship To"
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
 * Parse ZPL content into individual label objects.
 */
export function parseZplLabels(zplText: string): ZplLabelData[] {
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

    // STEP 1: Find INVOICE# header.
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

    // STEP 2: Inline invoice extraction.
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

    // STEP 3: Search all ^FD values for invoice-like patterns.
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

    // STEP 4: Extract AWB / tracking number.
    let awb = "";
    const awbMatch =
      decoded.match(/AWB[#\s:]*([0-9A-Z]+)/i) ||
      decoded.match(/\^BC.*?\^FD([0-9A-Z]+)\^FS/i);

    if (awbMatch?.[1]) {
      awb = awbMatch[1].trim();
    }

    // STEP 5: Extract customer / recipient & Ship To address.
    const shipToAddress = extractZplShipToAddress(decoded, fields);

    let customer = "";
    const customerMatch =
      decoded.match(/\^(?:FO|FT)50,360[\s\S]*?\^FD([\s\S]*?)\^FS/i) ||
      decoded.match(/\^(?:FO|FT)40,445[\s\S]*?\^FD([\s\S]*?)\^FS/i) ||
      decoded.match(/Ship To:[\s\S]*?\^FD([\s\S]*?)\^FS/i);

    if (customerMatch?.[1]) {
      customer = cleanCustomerName(customerMatch[1].replace(/\\&/g, " "));
    }
    if (!customer && shipToAddress) {
      customer = cleanCustomerName(shipToAddress);
    }

    // STEP 6: Extract ASIN / ASI number and Order Number.
    const asin = extractAsin(decoded);
    const sellerSku = extractSellerSku(decoded);

    const orderMatch =
      decoded.match(/ORDER[#\s:]*([0-9-]{17,19}(?:-[A-Z0-9]+)?)/i) ||
      decoded.match(/\b(\d{3}-\d{7}-\d{7}(?:-[A-Z0-9]+)?)\b/i);
    const orderNumber = orderMatch ? (orderMatch[1] || orderMatch[0]).trim() : "";

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
    });
  }

  return labels;
}

/**
 * Extract the invoice number from a PDF page's text.
 */
export function extractPdfInvoiceNumber(text: string): string {
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
 */
export function normalizeInvoice(value: string): string {
  return value
    .trim()
    .toUpperCase()
    .replace(/\s+/g, "");
}

/**
 * Extract complete address following "Shipping Address :" from PDF text.
 */
export function extractPdfShippingAddress(text: string): string {
  if (!text) return "";

  const delimiterPattern =
    /(?=(?:\bBilling\s+Address\b|\bState(?:\/|\s*)UT\s+Code\b|\bPlace\s+of\s+(?:supply|delivery)\b|\bInvoice\s+(?:Number|No|Date|Details)\b|\bOrder\s+(?:Number|No|Date)\b|\bTax\s+Invoice\b|\bGSTIN\b|\bCIN\b|\bPAN\s*(?:No\.?)?[:\s]|\bPAN\b|\bDescription\s+of\s+Goods\b|\bSl\.?\s*No\b|$))/i;

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
export function normalizeAddress(addr: string): {
  normalized: string;
  tokens: Set<string>;
  pinCode: string;
} {
  if (!addr) {
    return { normalized: "", tokens: new Set(), pinCode: "" };
  }

  let cleaned = addr.toUpperCase();

  cleaned = cleaned
    .replace(/^[\s\S]*?(?:Shipping\s+Address|Ship\s+To)\s*[:\-]?\s*/gi, "")
    .replace(/\b(?:INDIA|IND|IN)\b/gi, " ")
    .replace(/\b(?:PH|PHONE|TEL|MOB|MOBILE)\s*[:\-#]?\s*\d{10,12}\b/gi, " ");

  const pinMatch = cleaned.match(/\b([1-9][0-9]{5})\b/);
  const pinCode = pinMatch ? pinMatch[1] : "";

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
 */
export function computeAddressSimilarity(pdfAddr: string, zplAddr: string): number {
  if (!pdfAddr || !zplAddr) return 0;

  const pdf = normalizeAddress(pdfAddr);
  const zpl = normalizeAddress(zplAddr);

  if (pdf.tokens.size === 0 || zpl.tokens.size === 0) return 0;

  if (pdf.pinCode && zpl.pinCode && pdf.pinCode !== zpl.pinCode) {
    return 0;
  }

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

  if (pdf.pinCode && zpl.pinCode && pdf.pinCode === zpl.pinCode) {
    score += 0.30;
  }

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
 * Categorize order composition into single_quantity, multiple_asin, or multiple_pieces.
 */
export function classifyOrderType(
  text: string,
  extractedAsins?: string[],
  extractedSkus?: string[]
): {
  orderType: "single_quantity" | "multiple_asin" | "multiple_pieces";
  totalQuantity: number;
  asinsCount: number;
} {
  const validAsins = (extractedAsins || []).filter((a) => a && a !== "N/A");
  const validSkus = (extractedSkus || []).filter((s) => s && s !== "N/A" && s !== "-");

  const uniqueAsins = new Set(validAsins);
  const uniqueSkus = new Set(validSkus);

  const asinsCount = uniqueAsins.size || 1;
  const skusCount = uniqueSkus.size || 1;

  let totalQty = 1;

  const totalQtyMatch = text.match(/TOTAL\s*(?:QTY|QUANTITY|ITEMS)\s*[:\-#]?\s*(\d+)/i);
  if (totalQtyMatch?.[1]) {
    const parsed = parseInt(totalQtyMatch[1], 10);
    if (!isNaN(parsed) && parsed > 0 && parsed < 500) {
      totalQty = parsed;
    }
  } else {
    const qtyMatch = text.match(/(?:Quantity|Qty)\s*[:\-#]?\s*(\d+)/i);
    if (qtyMatch?.[1]) {
      const parsed = parseInt(qtyMatch[1], 10);
      if (!isNaN(parsed) && parsed > 0 && parsed < 500) {
        totalQty = parsed;
      }
    }
  }

  let orderType: "single_quantity" | "multiple_asin" | "multiple_pieces" = "single_quantity";

  if (asinsCount > 1 || skusCount > 1) {
    orderType = "multiple_asin";
    totalQty = Math.max(totalQty, asinsCount, skusCount);
  } else if (totalQty >= 2) {
    orderType = "multiple_pieces";
  } else {
    orderType = "single_quantity";
    totalQty = 1;
  }

  return {
    orderType,
    totalQuantity: totalQty,
    asinsCount,
  };
}

/**
 * Detects whether a PDF page is an Amazon Transporter Duplicate or Marketplace Fee invoice.
 */
export function isAmazonTransporterOrFeePage(text?: string): boolean {
  if (!text) return false;
  const upper = text.toUpperCase();

  if (upper.includes("MARKETPLACE FEES") || upper.includes("MARKETPLACE FEE")) {
    return true;
  }

  if (upper.includes("DUPLICATE FOR TRANSPORTER")) {
    if (
      /SOLD\s+BY\s*:\s*AMAZON\s+SELLER\s+SERVICES/i.test(text) ||
      upper.includes("AMAZON SELLER SERVICES PRIVATE LIMITED") ||
      upper.includes("MKT-")
    ) {
      return true;
    }
  }

  if (
    /SOLD\s+BY\s*:\s*AMAZON\s+SELLER\s+SERVICES/i.test(text) &&
    upper.includes("MKT-")
  ) {
    return true;
  }

  return false;
}

/**
 * Checks if a PDF page contains actual product line items.
 */
export function hasInvoiceLineItems(text?: string): boolean {
  if (!text) return false;
  if (/\bB0[A-Z0-9]{8}\b/i.test(text)) return true;
  if (
    /(?:Description|Unit\s*Price|Gross\s*Amount|Taxable\s*Value|Item\s*Description)/i.test(text) &&
    /(?:HSN|SAC|\b\d+\s*\|\s*₹|\bQty\b|\bQuantity\b|Rate)/i.test(text)
  ) {
    return true;
  }
  return false;
}

/**
 * Detects whether a page is an empty transporter copy / signature overflow page.
 */
export function isTransporterDuplicatePage(text?: string): boolean {
  if (!text) return false;
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
 * Consolidates raw PDF pages into logical multi-page orders.
 */
export function consolidatePdfPages(pagesArray: string[]): ConsolidatedOrder[] {
  const consolidatedPdfOrders: ConsolidatedOrder[] = [];
  const invoiceToPdfIndices = new Map<string, number[]>();
  const orderNumToPdfIndices = new Map<string, number[]>();
  let lastValidPageNumber = 0;

  for (let index = 0; index < pagesArray.length; index++) {
    const pageNumber = index + 1;
    const text = pagesArray[index] || "";

    if (isAmazonTransporterOrFeePage(text)) {
      continue;
    }

    const orderMatch =
      text.match(/Order Number:\s*([0-9-]{17,19}(?:-[A-Z0-9]+)?)/i) ||
      text.match(/\b(\d{3}-\d{7}-\d{7}(?:-[A-Z0-9]+)?)\b/i);
    const orderNumber = orderMatch ? (orderMatch[1] || orderMatch[0]).trim() : "";

    const invoiceNumber = extractPdfInvoiceNumber(text);
    const shippingAddress = extractPdfShippingAddress(text);
    const asin = extractAsin(text);
    const sellerSku = extractSellerSku(text);

    const amountMatch =
      text.match(/TOTAL:\s*₹?\s*([0-9.,]+)/i) ||
      text.match(/Invoice Value:\s*([0-9.,]+)/i) ||
      text.match(/Grand Total\s*:?\s*₹?\s*([0-9.,]+)/i);
    const amount = amountMatch?.[1]?.trim() || "";

    const dateMatch =
      text.match(/Invoice Date\s*:\s*([0-9./-]+)/i) ||
      text.match(/Order Date:\s*([0-9./-]+)/i);
    const date = dateMatch?.[1]?.trim() || "";

    const billingMatch =
      text.match(/Shipping Address\s*:\s*([^|]+)/i) ||
      text.match(/Billing Address\s*:\s*([^|]+)/i);
    let customer = "";
    if (billingMatch?.[1]) {
      customer = cleanCustomerName(billingMatch[1]);
    }
    if (!customer && shippingAddress) {
      customer = cleanCustomerName(shippingAddress);
    }

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

    const hasStandaloneHeader =
      /Tax\s+Invoice/i.test(text) &&
      (/Sold\s+By/i.test(text) || /Billing\s+Address/i.test(text) || /PAN\s+No/i.test(text) || /GST/i.test(text));

    const hasCompletedFooter =
      /TOTAL\s*:/i.test(text) ||
      /Invoice\s+Value\s*:/i.test(text) ||
      /Grand\s+Total/i.test(text) ||
      /Amount\s+in\s+Words/i.test(text) ||
      /Authorized\s+Signatory/i.test(text);

    let existingIdx = -1;

    const isTransporterDup = isTransporterDuplicatePage(text);
    const hasLineItems = hasInvoiceLineItems(text);

    const matchesOpenOrder = Boolean(
      (orderKey && orderNumToPdfIndices.has(orderKey)) ||
      (invKey && invoiceToPdfIndices.has(invKey))
    );

    const canBeContinuation =
      !isTransporterDup &&
      (hasLineItems || hasCompletedFooter || docPageNum > 1 || matchesOpenOrder) &&
      docPageNum !== 1 &&
      (docPageNum > 1 || !hasStandaloneHeader || matchesOpenOrder);

    if (canBeContinuation) {
      const candidateIndices = [
        ...(orderKey && orderNumToPdfIndices.has(orderKey) ? orderNumToPdfIndices.get(orderKey)! : []),
        ...(invKey && invoiceToPdfIndices.has(invKey) ? invoiceToPdfIndices.get(invKey)! : []),
      ];
      const uniqueCandidates = Array.from(new Set(candidateIndices));

      for (const cIdx of uniqueCandidates) {
        const existing = consolidatedPdfOrders[cIdx];
        if (!existing) continue;

        if (existing.totalPages && existing.pages.length >= existing.totalPages) {
          continue;
        }

        if (docPageNum > 1 && existing.pages.length !== docPageNum - 1) {
          continue;
        }

        if (
          docPageNum > 1 ||
          (existing.totalPages && existing.pages.length < existing.totalPages) ||
          (!existing.hasCompletedFooter && (orderKey || invKey))
        ) {
          existingIdx = cIdx;
          break;
        }
      }

      if (existingIdx === -1 && consolidatedPdfOrders.length > 0) {
        const lastOrderIdx = consolidatedPdfOrders.length - 1;
        const lastOrder = consolidatedPdfOrders[lastOrderIdx];
        const isConsecutive = lastOrder && lastOrder.pages[lastOrder.pages.length - 1] === lastValidPageNumber;

        if (isConsecutive) {
          const orderMatches = !orderKey || !lastOrder.orderNumber || orderKey === lastOrder.orderNumber;
          const invoiceMatches = !invKey || !lastOrder.sellerInvoice || invKey === normalizeInvoice(lastOrder.sellerInvoice);

          if (orderMatches && invoiceMatches) {
            const canContinueLast =
              (docPageNum > 1 && docPageNum === lastOrder.pages.length + 1) ||
              (lastOrder.totalPages && lastOrder.totalPages > 1 && lastOrder.pages.length < lastOrder.totalPages) ||
              (!lastOrder.hasCompletedFooter && (orderKey || invKey));

            if (canContinueLast) {
              existingIdx = lastOrderIdx;
            }
          }
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
      if (!existing.shippingAddress && shippingAddress) existing.shippingAddress = shippingAddress;
      if (!existing.customer && customer) existing.customer = customer;
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
      if (amount) {
        existing.amount = amount;
      }
      if (!existing.date && date) existing.date = date;
      if (invoiceNumber && !existing.allInvoices.includes(invoiceNumber)) {
        existing.allInvoices.push(invoiceNumber);
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
      const newOrder: ConsolidatedOrder = {
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
        shippingAddress,
        totalPages: docTotalPages > 0 ? docTotalPages : undefined,
        hasCompletedFooter,
      };
      consolidatedPdfOrders.push(newOrder);

      if (invKey) {
        const list = invoiceToPdfIndices.get(invKey) || [];
        list.push(newIdx);
        invoiceToPdfIndices.set(invKey, list);
      }
      if (orderKey) {
        const list = orderNumToPdfIndices.get(orderKey) || [];
        list.push(newIdx);
        orderNumToPdfIndices.set(orderKey, list);
      }
    }

    lastValidPageNumber = pageNumber;
  }

  return consolidatedPdfOrders;
}

/**
 * 4-Pass Order Cross-Verification Engine running 100% in client memory.
 * Preserves 100% exact matching rules, prioritization, address similarity, and metrics.
 */
export function compareOrdersLocally(
  zplLabels: ZplLabelData[],
  pagesArray: string[],
  zplFileName = "labels.zpl"
): AmazonProcessResponse {
  const consolidatedPdfOrders = consolidatePdfPages(pagesArray);

  // PASS 1: PRIORITY 1 - INVOICE NUMBER MATCHING
  const matchedZplIndices = new Set<number>();
  const matchedPdfIndices = new Set<number>();
  const matchedResults: ComparisonResult[] = [];

  for (let i = 0; i < zplLabels.length; i++) {
    const label = zplLabels[i];
    if (!label.invoiceNumber) continue;

    const zplKey = normalizeInvoice(label.invoiceNumber);
    if (!zplKey) continue;

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
        orderNumber: matchedOrder.orderNumber || label.orderNumber || "N/A",
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
    }
  }

  // PASS 2: PRIORITY 2 - ADDRESS MATCHING (FALLBACK)
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
        extractedItems.sellerSkus
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
        customer: matchedOrder.customer || label.customer || "N/A",
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

  // PASS 3: COLLECT REMAINING UNMATCHED ZPL LABELS
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
        customer: label.customer || "N/A",
        amount: "N/A",
        date: "N/A",
        pdfPages: [],
        zplPage: label.index,
      });
    }
  }

  // PASS 4: COLLECT REMAINING UNMATCHED PDF ORDERS
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
        customer: pdfOrder.customer || "N/A",
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

  return {
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
      convertedZplPdfBase64: "",
      combinedPdfBase64: "",
      originalPdfBase64: "",
    },
  };
}
