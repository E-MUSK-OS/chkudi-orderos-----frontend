/**
 * Detects whether a scanned string is a 2D QR Code / DataMatrix payload
 * rather than a standard 1D logistics linear barcode (Tracking ID / AWB).
 */
export function isQrCode(str: string): boolean {
  if (!str) return false;
  const val = str.trim();

  // 1. Pipe separator (courier routing QR codes like Myntra/Flipkart)
  // e.g. 5|\M2965642789|O|MYN/R10|S|E|03|E|S|F|CE or E|S|F|CC
  if (val.includes("|")) return true;

  // 2. URLs / Web links / URI schemes (UPI, mailto, etc.)
  if (/^(https?:\/\/|www\.|upi:\/\/|mailto:|tel:)/i.test(val) || val.includes("://")) {
    return true;
  }

  // 3. JSON or XML format
  if (
    (val.startsWith("{") && val.endsWith("}")) ||
    (val.startsWith("<") && val.endsWith(">")) ||
    val.includes('":"') ||
    val.includes("': '") ||
    val.includes('":')
  ) {
    return true;
  }

  // 4. Backslashes or multiple slashes (e.g. 5|\M... or /HYD/POC/)
  if (val.includes("\\") || (val.match(/\//g) || []).length >= 2) {
    return true;
  }

  // 5. Query strings, delimiters, semicolons, commas, tabs or newlines
  if (
    val.includes("?") ||
    val.includes("&") ||
    val.includes(";") ||
    val.includes(",") ||
    val.includes("\n") ||
    val.includes("\r") ||
    val.includes("\t")
  ) {
    return true;
  }

  // 6. Contains any whitespace
  if (/\s/.test(val)) return true;

  // 7. Non-standard tracking ID characters (valid barcodes are strictly alphanumeric + optional single hyphen/underscore)
  if (!/^[A-Za-z0-9_-]+$/.test(val)) return true;

  // 8. Length check: valid linear barcodes / tracking IDs are <= 32 characters
  if (val.length > 32) return true;

  return false;
}

export interface ValidationResult {
  isValid: boolean;
  isQr: boolean;
  message: string;
}

export function validateTrackingId(trackingId: string, minLength = 5): ValidationResult {
  const value = trackingId.trim();

  if (!value) {
    return {
      isValid: false,
      isQr: false,
      message: "Tracking ID is required.",
    };
  }

  if (isQrCode(value)) {
    return {
      isValid: false,
      isQr: true,
      message: "Not valid QR code",
    };
  }

  if (value.length < minLength) {
    return {
      isValid: false,
      isQr: false,
      message: `Tracking ID must be at least ${minLength} characters.`,
    };
  }

  return {
    isValid: true,
    isQr: false,
    message: "Valid tracking ID.",
  };
}
