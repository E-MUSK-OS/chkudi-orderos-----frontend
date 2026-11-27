export interface MaterialOrderParty {
  id: string;
  partyName: string;
  accountHead?: string;
  phone?: string;
  whatsapp?: string;
  gstNumber?: string;
  addressLine1?: string;
  city?: string;
  state?: string;
  pincode?: string;
}

export interface MaterialCatalogOption {
  id: string;
  materialName: string;
  masterSku: string;
  sku?: string;
  category?: string;
  unit?: string;
  materialCost?: number;
  dealerRate?: number;
  retailRate?: number;
  salesRate?: number;
  hsnCode?: string;
  gstRate?: number;
}

export interface MaterialRollDetail {
  itemNo: number;
  rolls: number;
  qty: number;
  rate: number;
  realQty: number;
}

export interface MaterialPurchaseOrderItem {
  id?: string;
  itemNo: number;
  category: string;
  materialId?: string | null;
  sku: string;
  partySku?: string;
  detail?: string;
  orderedQty: number;
  receivedQty?: number;
  pendingQty?: number;
  unit: string;
  refNo?: string;
  rate: number;
  amount: number;
  rollDetails?: MaterialRollDetail[];
}

export interface MaterialPurchaseOrder {
  id: string;
  userId: string;
  supplierId?: string | null;
  supplierName: string;
  contactNo?: string | null;
  partyGstn?: string | null;
  partyAddress?: string | null;
  orderNo: string;
  orderDate: string;
  expRequiredDays: number;
  expRequiredDate?: string | null;
  poDays: number;
  preparedBy?: string | null;
  status: string;
  totalOrderedQty: number;
  totalReceivedQty: number;
  totalPendingQty: number;
  totalAmount: number;
  remarks?: string | null;
  createdAt?: string;
  updatedAt?: string;
  supplier?: MaterialOrderParty | null;
  items: MaterialPurchaseOrderItem[];
}

export interface MaterialOrderFiltersState {
  search: string;
  party: string;
  status: string;
  startDate: string;
  endDate: string;
  page: number;
  limit: number;
}
