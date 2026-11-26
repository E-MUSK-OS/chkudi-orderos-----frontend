export interface PurchaseOrderItem {
  id?: string;
  orderId?: string;
  itemNo: number;
  sku: string;
  name: string;
  lotNo?: string | null;
  size?: string | null;
  orderedQty: number | string;
  receivedQty?: number | string;
  pendingQty?: number | string;
  rate: number | string;
  amount: number | string;
  remarks?: string | null;
}

export interface PurchaseOrder {
  id: string;
  userId: string;
  supplierId?: string | null;
  supplierName: string;
  contactNo?: string | null;
  orderNo: string;
  orderDate: string;
  deliveryDate?: string | null;
  lotNo?: string | null;
  status: "Pending" | "Partial" | "Received" | "Cancelled" | string;
  totalOrderedQty: number;
  totalReceivedQty: number;
  totalPendingQty: number;
  totalAmount: number;
  remarks?: string | null;
  items?: PurchaseOrderItem[];
  createdAt: string;
  updatedAt: string;
}

export interface PurchaseOrderFiltersState {
  search: string;
  sku: string;
  lotNo: string;
  party: string;
  status: string;
  startDate: string;
  endDate: string;
  page: number;
  limit: number;
}

export interface Party {
  id: string;
  partyName: string;
  phone?: string | null;
  whatsapp?: string | null;
  city?: string | null;
  state?: string | null;
  gstin?: string | null;
}
