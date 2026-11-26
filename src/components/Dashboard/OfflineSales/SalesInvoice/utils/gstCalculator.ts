import { SalesInvoiceItem } from "../types/salesInvoice.types";

export const DEFAULT_COMPANY_STATE_CODE = "24"; // Gujarat

/**
 * Extracts 2-digit state code from GSTIN or state name
 */
export function extractStateCode(gstin?: string | null, stateName?: string | null): string {
  if (gstin && gstin.trim().length >= 2) {
    const firstTwo = gstin.trim().slice(0, 2);
    if (/^\d{2}$/.test(firstTwo)) {
      return firstTwo;
    }
  }

  const STATE_CODE_MAP: Record<string, string> = {
    "jammu and kashmir": "01",
    "himachal pradesh": "02",
    "punjab": "03",
    "chandigarh": "04",
    "uttarakhand": "05",
    "haryana": "06",
    "delhi": "07",
    "rajasthan": "08",
    "uttar pradesh": "09",
    "bihar": "10",
    "sikkim": "11",
    "arunachal pradesh": "12",
    "nagaland": "13",
    "manipur": "14",
    "mizoram": "15",
    "tripura": "16",
    "meghalaya": "17",
    "assam": "18",
    "west bengal": "19",
    "jharkhand": "20",
    "odisha": "21",
    "chhattisgarh": "22",
    "madhya pradesh": "23",
    "gujarat": "24",
    "daman and diu": "25",
    "dadra and nagar haveli": "26",
    "maharashtra": "27",
    "andhra pradesh": "28",
    "karnataka": "29",
    "goa": "30",
    "lakshadweep": "31",
    "kerala": "32",
    "tamil nadu": "33",
    "puducherry": "34",
    "andaman and nicobar islands": "35",
    "telangana": "36",
    "ladakh": "38",
  };

  if (stateName && stateName.trim()) {
    const clean = stateName.toLowerCase().trim();
    if (STATE_CODE_MAP[clean]) {
      return STATE_CODE_MAP[clean];
    }
  }

  return DEFAULT_COMPANY_STATE_CODE;
}

/**
 * Calculates GST rates and amounts for a single line item
 */
export function calculateItemGst(
  item: Partial<SalesInvoiceItem>,
  companyStateCode: string = DEFAULT_COMPANY_STATE_CODE,
  partyStateCode: string = DEFAULT_COMPANY_STATE_CODE
): SalesInvoiceItem {
  const quantity = Number(item.quantity) || 0;
  const rate = Number(item.rate) || 0;
  const amount = Math.round(quantity * rate * 100) / 100;

  const discountPercent = Math.max(Number(item.discountPercent) || 0, 0);
  const discountAmount =
    item.discountAmount !== undefined && Number(item.discountAmount) > 0 && discountPercent === 0
      ? Number(item.discountAmount)
      : Math.round(amount * (discountPercent / 100) * 100) / 100;

  const taxableAmount = Math.round(Math.max(amount - discountAmount, 0) * 100) / 100;

  const isIntraState = !partyStateCode || partyStateCode === companyStateCode;

  // Standard GST rate default (5%) or user specified
  const totalGstRate = Number(item.igstRate) > 0 ? Number(item.igstRate) : 5.0;

  let sgstRate = 0;
  let sgstAmount = 0;
  let cgstRate = 0;
  let cgstAmount = 0;
  let igstRate = 0;
  let igstAmount = 0;

  if (isIntraState) {
    if (item.sgstRate !== undefined && item.sgstRate !== null && item.sgstRate !== "") {
      sgstRate = Math.max(Number(item.sgstRate) || 0, 0);
    } else if (item.sgstRate === "" || item.sgstRate === 0) {
      sgstRate = 0;
    } else {
      sgstRate = Math.round((totalGstRate / 2) * 100) / 100;
    }

    if (item.cgstRate !== undefined && item.cgstRate !== null && item.cgstRate !== "") {
      cgstRate = Math.max(Number(item.cgstRate) || 0, 0);
    } else if (item.cgstRate === "" || item.cgstRate === 0) {
      cgstRate = 0;
    } else {
      cgstRate = Math.round((totalGstRate / 2) * 100) / 100;
    }

    sgstAmount = Math.round(taxableAmount * (sgstRate / 100) * 100) / 100;
    cgstAmount = Math.round(taxableAmount * (cgstRate / 100) * 100) / 100;
    igstRate = 0;
    igstAmount = 0;
  } else {
    if (item.igstRate !== undefined && item.igstRate !== null && item.igstRate !== "") {
      igstRate = Math.max(Number(item.igstRate) || 0, 0);
    } else if (item.igstRate === "" || item.igstRate === 0) {
      igstRate = 0;
    } else {
      igstRate = totalGstRate;
    }
    igstAmount = Math.round(taxableAmount * (igstRate / 100) * 100) / 100;
    sgstRate = 0;
    sgstAmount = 0;
    cgstRate = 0;
    cgstAmount = 0;
  }

  const total = Math.round((taxableAmount + sgstAmount + cgstAmount + igstAmount) * 100) / 100;

  return {
    itemNo: item.itemNo || 1,
    sku: item.sku || "",
    particular: item.particular || item.sku || "",
    size: item.size || "",
    hsn: item.hsn !== undefined ? item.hsn : null,
    quantity,
    rate,
    amount,
    discountPercent,
    discountAmount,
    taxableAmount,
    sgstRate: item.sgstRate !== undefined && item.sgstRate !== null ? item.sgstRate : sgstRate,
    sgstAmount,
    cgstRate: item.cgstRate !== undefined && item.cgstRate !== null ? item.cgstRate : cgstRate,
    cgstAmount,
    igstRate: item.igstRate !== undefined && item.igstRate !== null ? item.igstRate : igstRate,
    igstAmount,
    total,
  };
}

/**
 * Calculates aggregate invoice summary totals from line items
 */
export function calculateInvoiceTotals(
  items: SalesInvoiceItem[],
  customRoundOff?: number,
  expenseOnSales: number = 0,
  applyRoundOff: boolean = true
) {
  const totalQuantity = items.reduce((sum, it) => sum + (Number(it.quantity) || 0), 0);
  const totalAmount = Math.round(
    items.reduce((sum, it) => sum + (Number(it.amount) || 0), 0) * 100
  ) / 100;
  const totalDiscount = Math.round(
    items.reduce((sum, it) => sum + (Number(it.discountAmount) || 0), 0) * 100
  ) / 100;
  const amountBeforeTax = Math.round(
    items.reduce((sum, it) => sum + (Number(it.taxableAmount) || 0), 0) * 100
  ) / 100;

  const sgstAmount = Math.round(
    items.reduce((sum, it) => sum + (Number(it.sgstAmount) || 0), 0) * 100
  ) / 100;
  const cgstAmount = Math.round(
    items.reduce((sum, it) => sum + (Number(it.cgstAmount) || 0), 0) * 100
  ) / 100;
  const igstAmount = Math.round(
    items.reduce((sum, it) => sum + (Number(it.igstAmount) || 0), 0) * 100
  ) / 100;

  const totalGst = Math.round((sgstAmount + cgstAmount + igstAmount) * 100) / 100;
  const amountAfterTax = Math.round((amountBeforeTax + totalGst) * 100) / 100;

  const netBeforeRoundOff = Math.round((amountAfterTax + (Number(expenseOnSales) || 0)) * 100) / 100;

  let roundOff = 0;
  if (applyRoundOff) {
    roundOff =
      customRoundOff !== undefined
        ? customRoundOff
        : Math.round((Math.round(netBeforeRoundOff) - netBeforeRoundOff) * 100) / 100;
  }

  const netAmount = Math.round((netBeforeRoundOff + roundOff) * 100) / 100;

  return {
    totalQuantity,
    totalAmount,
    totalDiscount,
    amountBeforeTax,
    sgstAmount,
    cgstAmount,
    igstAmount,
    totalGst,
    amountAfterTax,
    roundOff,
    netAmount,
  };
}
