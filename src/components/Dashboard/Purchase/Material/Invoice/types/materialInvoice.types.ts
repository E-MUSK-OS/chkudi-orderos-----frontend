import { MaterialOrderParty } from "../../Order/types/materialOrder.types";
import { MaterialPurchaseChallan } from "../../Challan/types/materialChallan.types";
import { OtherExpenseItem } from "@/components/Dashboard/common/OtherExpensesModal";

export interface MaterialPurchaseInvoiceItem {
  id?: string;
  itemNo: number;
  challanId?: string | null;
  challanNo?: string | null;
  materialId?: string | null;
  sku: string;
  partySku?: string;
  hsnCode?: string;
  qty: number;
  unit: string;
  rate: number;
  amount: number;
  discPercent: number;
  discAmount: number;
  taxableAmount: number;
  sgstPercent: number;
  sgstAmount: number;
  cgstPercent: number;
  cgstAmount: number;
  igstPercent: number;
  igstAmount: number;
  netAmount: number;
}

export interface MaterialPurchaseInvoice {
  id: string;
  userId: string;
  supplierId?: string | null;
  supplierName: string;
  contactNo?: string | null;
  invoiceNo: string;
  invoiceDate: string;
  invoiceType: string;
  partyBillNo?: string | null;
  partyChallanNo?: string | null;
  challanIds?: string[];
  brokerName?: string | null;
  consigneeName?: string | null;
  preparedBy?: string | null;
  remarks?: string | null;
  totalQty: number;
  grossAmount: number;
  discountAmount: number;
  beforeTaxAmount: number;
  sgstAmount: number;
  cgstAmount: number;
  igstAmount: number;
  afterTaxAmount: number;
  tdsPercent: number;
  tdsAmount: number;
  tcsPercent: number;
  tcsAmount: number;
  otherExpense: number;
  otherExpenses?: OtherExpenseItem[];
  roundOff: number;
  roundOffValue: number;
  netAmount: number;
  debitNoteAmount: number;
  discDebitNoteAmount: number;
  paidAmount: number;
  balanceAmount: number;
  paymentStatus: string;
  dnStatus: string;
  createdAt?: string;
  updatedAt?: string;
  supplier?: (MaterialOrderParty & { billDueDays?: number }) | null;
  items: MaterialPurchaseInvoiceItem[];
}

export interface MaterialInvoiceFiltersState {
  search: string;
  party: string;
  partyChallanNo: string;
  partyBillNo: string;
  invoiceType: string;
  material: string;
  startDate: string;
  endDate: string;
}

export type PendingMaterialChallan = MaterialPurchaseChallan;
