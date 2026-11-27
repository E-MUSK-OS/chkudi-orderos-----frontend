import { MaterialOrderParty, MaterialRollDetail } from "../../Order/types/materialOrder.types";
import { OtherExpenseItem } from "@/components/Dashboard/common/OtherExpensesModal";

export interface MaterialPurchaseDebitNoteItem {
  id?: string;
  itemNo: number;
  materialId?: string | null;
  sku: string;
  hsnCode?: string;
  refInvoiceId?: string | null;
  refInvoiceNo?: string | null;
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
  rollDetails?: MaterialRollDetail[];
}

export interface MaterialPurchaseDebitNote {
  id: string;
  userId: string;
  supplierId?: string | null;
  supplierName: string;
  contactNo?: string | null;
  debitNoteNo: string;
  debitNoteDate: string;
  debitNoteType: string;
  invoiceType: string;
  partyBillNo?: string | null;
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
  roundOff?: number;
  roundOffValue?: number;
  netAmount: number;
  createdAt?: string;
  updatedAt?: string;
  supplier?: MaterialOrderParty | null;
  items: MaterialPurchaseDebitNoteItem[];
}

export interface MaterialDebitNoteFiltersState {
  search: string;
  supplier: string;
  debitNoteNo: string;
  debitNoteType: string;
  invoiceType: string;
  material: string;
  startDate: string;
  endDate: string;
}
