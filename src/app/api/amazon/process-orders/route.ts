import { NextRequest, NextResponse } from "next/server";
import http from "http";
import { PDFDocument } from "pdf-lib";
import { extractText } from "unpdf";

export const runtime = "nodejs";
export const maxDuration = 60;

interface ZplLabelData {
  index: number;
  invoiceNumber: string;
  awb: string;
  customer: string;
  rawZpl: string;
}

interface PdfOrderData {
  orderNumber: string;
  sellerInvoice: string;
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
  orderNumber: string;
  awb: string;
  customer: string;
  amount: string;
  date: string;
  pdfPages: number[];
  zplPage: number;
}

/**
 * Convert a chunk of ZPL labels to PDF using Labelary.
 */
async function convertZplChunkToPdf(zplChunk: string): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const postData = Buffer.from(zplChunk, "utf8");

    const options: http.RequestOptions = {
      hostname: "api.labelary.com",
      port: 80,
      path: "/v1/printers/8dpmm/labels/6x9/",
      method: "POST",
      headers: {
        Accept: "application/pdf",
        "Content-Type": "application/x-www-form-urlencoded",
        "Content-Length": postData.length,
      },
      timeout: 30000,
    };

    const request = http.request(options, (response) => {
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
      reject(new Error("Labelary request timed out after 30 seconds"));
    });

    request.write(postData);
    request.end();
  });
}

/**
 * Clean customer name by removing addresses, pin codes, and delivery details.
 */
function cleanCustomerName(raw: string): string {
  if (!raw || raw === "N/A") return "N/A";

  let cleaned = raw
    .replace(/^(Shipping|Billing)\s+Address\s*[:\-]?\s*/i, "")
    .replace(/^Ship\s+To\s*[:\-]?\s*/i, "")
    .replace(/^(Customer\s*Name|Recipient|Name)\s*[:\-]?\s*/i, "")
    .replace(/^C\/O\s*[:\-]?\s*/i, "")
    .trim();

  // Split on common delimiters (commas, newlines, pipes, semicolons, backslash-ampersand for ZPL)
  cleaned = cleaned.split(/\\&|[\r\n|,;]|\s+-\s+/)[0].trim();

  // Remove known address trigger words if stuck to the name without commas
  const addressTrigger =
    /\s+(?:Flat|H\.?No|House|Plot|Room|Shop|Bldg|Building|Apartment|Apt|Tower|Floor|Block|Sector|Opp|Opposite|Near|Behind|Beside|Road|Street|Lane|Nagar|Colony|Enclave|Vihar|Layout|Society|Village|Vill|Post|Taluka|Dist|District|PIN|Pincode|\d{1,5}[A-Za-z]?\b).*$/i;
  cleaned = cleaned.replace(addressTrigger, "").trim();

  // Remove trailing digits, special chars, or postal codes
  cleaned = cleaned.replace(/\s*\b\d{5,6}\b.*$/, "").trim();
  cleaned = cleaned.replace(/[,\-:;.]+$/, "").trim();

  // If still excessively long (e.g. over 30 characters or more than 4 words), take the first 3 words
  const words = cleaned.split(/\s+/).filter(Boolean);
  if (words.length > 4 && cleaned.length > 30) {
    cleaned = words.slice(0, 3).join(" ");
  }

  return cleaned || "N/A";
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
          /^[A-Z]{2,6}[-/][0-9A-Z/_-]{3,}$/i.test(value)
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
    // Logging.
    // ---------------------------------------------------------

    if (invoiceNumber) {
      console.log(
        `[ZPL Parse] Label ${
          labels.length + 1
        }: Invoice="${invoiceNumber}", AWB="${awb}"`
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
 * Main POST handler.
 */
export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const zplFile = formData.get("zplFile");
    const pdfTextArrayStr = formData.get("pdfTextArray");

    if (!(zplFile instanceof File) || typeof pdfTextArrayStr !== "string") {
      return NextResponse.json(
        { error: "ZPL file and PDF text array are required." },
        { status: 400 }
      );
    }

    const pdfTextArray: string[] = JSON.parse(pdfTextArrayStr);

    // ---------------------------------------------------------
    // 1. Read uploaded files.
    // ---------------------------------------------------------

    const zplText = await zplFile.text();

    // ---------------------------------------------------------
    // 2. Parse ZPL labels.
    // ---------------------------------------------------------

    const zplLabels = parseZplLabels(zplText);

    if (zplLabels.length === 0) {
      return NextResponse.json(
        {
          error:
            "No valid ZPL label definitions found in the uploaded ZPL file.",
        },
        { status: 400 }
      );
    }

    console.log(
      `[ZPL] Parsed ${zplLabels.length} labels`
    );

    // ---------------------------------------------------------
    // 3. Convert ZPL to PDF in batches.
    // ---------------------------------------------------------

    const mergedZplPdf = await PDFDocument.create();

    const CHUNK_SIZE = 20;

    for (
      let i = 0;
      i < zplLabels.length;
      i += CHUNK_SIZE
    ) {
      const chunk = zplLabels.slice(
        i,
        i + CHUNK_SIZE
      );

      const chunkZpl = chunk
        .map((label) => label.rawZpl)
        .join("\n");

      console.log(
        `[Labelary] Converting labels ${
          i + 1
        }-${i + chunk.length}`
      );

      const chunkPdfBuffer =
        await convertZplChunkToPdf(chunkZpl);

      const chunkPdf =
        await PDFDocument.load(chunkPdfBuffer);

      const copiedPages =
        await mergedZplPdf.copyPages(
          chunkPdf,
          chunkPdf.getPageIndices()
        );

      copiedPages.forEach((page) => {
        mergedZplPdf.addPage(page);
      });
    }

    const convertedZplPdfBytes =
      await mergedZplPdf.save();

    const convertedZplPdfBase64 =
      Buffer.from(convertedZplPdfBytes).toString(
        "base64"
      );



    // ---------------------------------------------------------
    // 4. Parse Amazon invoice PDF using provided text array
    // ---------------------------------------------------------

    const invoiceMap = new Map<string, PdfOrderData>();
    const pdfOrdersList: PdfOrderData[] = [];
    const pagesArray = pdfTextArray;

    if (pagesArray.length > 0) {
      console.log(
        "[PDF Debug] First page text (500 chars):",
        pagesArray[0].substring(0, 500)
      );
    }

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

      console.log(`[PDF Parse] Page ${pageNumber}: Invoice="${invoiceNumber}", Order="${orderNumber}"`);

      const orderRecord: PdfOrderData = {
        orderNumber,
        sellerInvoice: invoiceNumber,
        allInvoices: invoiceNumber ? [invoiceNumber] : [],
        pages: [pageNumber],
        customer,
        amount,
        date,
      };

      pdfOrdersList.push(orderRecord);

      if (invoiceNumber) {
        const key = normalizeInvoice(invoiceNumber);
        if (invoiceMap.has(key)) {
          const existing = invoiceMap.get(key)!;
          existing.pages.push(pageNumber);
          if (!existing.orderNumber && orderNumber) existing.orderNumber = orderNumber;
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

    // ---------------------------------------------------------
    // 5. Compare ZPL labels with PDF invoices
    // ---------------------------------------------------------
    const matchedResults: ComparisonResult[] = [];
    const mismatchedZplResults: ComparisonResult[] = [];
    const matchedPdfKeys = new Set<string>();

    for (let i = 0; i < zplLabels.length; i++) {
      const label = zplLabels[i];
      let matchedOrder: PdfOrderData | null = null;

      if (label.invoiceNumber) {
        const key = normalizeInvoice(label.invoiceNumber);
        matchedOrder = invoiceMap.get(key) || null;
      }

      if (matchedOrder) {
        matchedPdfKeys.add(normalizeInvoice(matchedOrder.sellerInvoice));
        matchedResults.push({
          index: 0,
          isMatch: true,
          pdfInvoice: matchedOrder.sellerInvoice || label.invoiceNumber,
          zplInvoice: label.invoiceNumber,
          orderNumber: matchedOrder.orderNumber || "N/A",
          awb: label.awb || "N/A",
          customer: matchedOrder.customer || label.customer || "N/A",
          amount: matchedOrder.amount ? `₹${matchedOrder.amount}` : "N/A",
          date: matchedOrder.date || "N/A",
          pdfPages: matchedOrder.pages || [],
          zplPage: label.index,
        });
      } else {
        mismatchedZplResults.push({
          index: 0,
          isMatch: false,
          pdfInvoice: "Not Found in PDF",
          zplInvoice: label.invoiceNumber || "Not Found in ZPL",
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
        mismatchedPdfResults.push({
          index: 0,
          isMatch: false,
          pdfInvoice: pdfOrder.sellerInvoice || "N/A",
          zplInvoice: "Not Found in ZPL",
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
        zplFileName: zplFile.name,
        pdfFileName: "client-processed.pdf",
      },
      results: comparisonResults,
      files: {
        convertedZplPdfBase64,
        combinedPdfBase64: "", // No longer generated on server
        originalPdfBase64: "", // No longer sent back from server
      },
    });
  } catch (error: unknown) {
    console.error("Amazon order process error:", error);
    const errorMessage = error instanceof Error ? error.message : "Internal processing error occurred.";
    return NextResponse.json({ error: `Processing failed: ${errorMessage}` }, { status: 500 });
  }
}