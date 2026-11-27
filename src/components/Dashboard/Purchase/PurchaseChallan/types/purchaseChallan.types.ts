import { Party } from "@/components/Dashboard/OfflineSales/SalesChallan/types/challan.types";

export interface PurchaseChallanItem {
  id?: string;
  itemNo: number;
  sku: string;
  lotNo?: string | null;
  name: string;
  size?: string | null;
  orderedQty: number | string;
  pendingQty?: number | string;
  receivedQty: number | string;
  rate: number | string;
  amount?: number;
  poNo?: string | null;
  partyChallanNo?: string | null;
  receivedDate?: string | null;
  remarks?: string | null;
  printBarcode?: boolean;
}

export interface PurchaseChallan {
  id: string;
  userId: string;
  supplierId?: string | null;
  supplierName: string;
  contactNo?: string | null;
  challanNo: string;
  partyChallanNo?: string | null;
  lotNo?: string | null;
  challanDate: string;
  partyChallanDate?: string | null;
  challanFor: string;
  stockIn: string;
  companyId?: string | null;
  companyName?: string | null;
  branchId?: string | null;
  branchName?: string | null;
  additionalExpense?: number;
  additionalExpenses?: Array<{
    itemNo?: number;
    particulars: string;
    serviceProviderName: string;
    serviceProviderId?: string | null;
    lrNo: string;
    amount: number | string;
  }> | null;
  courierPartner?: string | null;
  lrNo?: string | null;
  receivedBy?: string | null; 
  checkedBy?: string | null;
  preparedBy?: string | null;
  remarks?: string | null;
  totalOrderedQty: number;
  totalReceivedQty: number;
  totalAmount: number;
  invoiceStatus: string;
  isStockIn: boolean;
  items: PurchaseChallanItem[];
  supplier?: Party | null;
  createdAt: string;
  updatedAt: string;
}

export interface PurchaseChallanFiltersState {
  search?: string;
  productSku?: string;
  lotNo?: string;
  party?: string;
  partyChallanNo?: string;
  challanFor?: string;
  invoiceStatus?: string;
  startDate?: string;
  endDate?: string;
  selectedSku?: string;
  challanNo?: string;
  supplierName?: string;
  stockIn?: string;
}

export interface ProductSkuSuggestion {
  sku: string;
  name: string;
  rate: number;
}

export interface SupplierPendingOrder {
  id: string;
  no: number;
  lotNo?: string | null;
  orderNo?: string | null;
  poNo?: string | null;
  totalQty: number;
  pendingQty?: number;
  sku?: string;
  size?: string;
  rate?: number;
  detail?: string;
}

export { type Party };
