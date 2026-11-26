import {
  MaterialOrderParty,
  MaterialPurchaseOrder,
  MaterialRollDetail,
} from "../../Order/types/materialOrder.types";

export interface MaterialPurchaseChallanItem {
  id?: string;
  itemNo: number;
  materialId?: string | null;
  partySku?: string;
  sku: string;
  poNo?: string;
  orderedQty: number;
  receivedQty: number;
  unit: string;
  lessPercent: number;
  rate: number;
  amount: number;
  realQty: number;
  rollDetails?: MaterialRollDetail[];
}

export interface MaterialPurchaseChallan {
  id: string;
  userId: string;
  supplierId?: string | null;
  supplierName: string;
  contactNo?: string | null;
  challanNo: string;
  partyChallanNo?: string | null;
  challanDate: string;
  challanFor: string;
  courierPartner?: string | null;
  lrNo?: string | null;
  receivedBy?: string | null;
  checkedBy?: string | null;
  preparedBy?: string | null;
  additionalExpense: number;
  totalOrderedQty: number;
  totalReceivedQty: number;
  totalRealQty: number;
  totalAmount: number;
  invoiceStatus: string;
  remarks?: string | null;
  createdAt?: string;
  updatedAt?: string;
  supplier?: MaterialOrderParty | null;
  items: MaterialPurchaseChallanItem[];
}

export interface MaterialChallanFiltersState {
  search: string;
  party: string;
  partyChallanNo: string;
  challanFor: string;
  material: string;
  invoiceStatus: string;
  startDate: string;
  endDate: string;
  page: number;
  limit: number;
}

export type PendingMaterialOrder = MaterialPurchaseOrder;

export interface PartySkuOption {
  partySku: string;
  sku?: string;
  materialId?: string | null;
  category?: string;
  unit?: string;
  rate?: number;
}
