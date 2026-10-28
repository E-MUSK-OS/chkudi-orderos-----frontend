import { Party } from "@/components/Dashboard/OfflineSales/SalesChallan/types/challan.types";

export interface PurchaseChallanItem {
  id?: string;
  itemNo: number;
  sku: string;
  name: string;
  orderedQty: number;
  receivedQty: number;
  rate: number;
  amount?: number;
  poNo?: string;
  partyChallanNo?: string;
  receivedDate?: string;
  remarks?: string;
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
  challanDate: string;
  partyChallanDate?: string | null;
  challanFor: string;
  stockIn: string;
  courierPartner?: string | null;
  lrNo?: string | null;
  receivedBy?: string | null;
  checkedBy?: string | null;
  preparedBy?: string | null;
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
  challanNo: string;
  partyChallanNo: string;
  supplierName: string;
  productSku: string;
  startDate: string;
  endDate: string;
  invoiceStatus: string;
  challanFor: string;
  stockIn: string;
}

export interface ProductSkuSuggestion {
  sku: string;
  name: string;
  rate: number;
}

export { type Party };
