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

