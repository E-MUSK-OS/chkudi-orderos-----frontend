import { Party } from "@/components/Dashboard/OfflineSales/SalesChallan/types/challan.types";

export interface SalesOrderItem {
  id?: string;
  itemNo: number;
  sku: string;
  particular: string;
  size?: string | null;
  quantity: number | string;
  deliveredQty?: number | string;
  pendingQty?: number | string;
  rate: number | string;
  amount: number | string;
}

export interface SalesOrder {
  id: string;
  userId: string;
  partyId?: string | null;
  orderNo: string;
  orderDate: string;
  salesFor: string;
  poNo?: string | null;
  poDate?: string | null;
  partyName: string;
  contactNo?: string | null;
  partyGstn?: string | null;
  stateCode?: string | null;
  orderQty: number;
  deliveredQty: number;
  pendingQty: number;
  totalAmount: number;
  deliveryStatus: string;
  fulfillmentPlan: string;
  expRequiredDays: number;
  expDeliveryDate?: string | null;
  soDays: number;
  preparedBy?: string | null;
  remarks?: string | null;
  createdAt: string;
  updatedAt: string;
  items: SalesOrderItem[];
  party?: Party | null;
}

export interface SalesOrderFormData {
  partyId?: string | null;
  orderNo: string;
  orderDate: string;
  salesFor: string;
  poNo?: string | null;
  poDate?: string | null;
  partyName: string;
  contactNo?: string | null;
  partyGstn?: string | null;
  stateCode?: string | null;
  deliveryStatus: string;
  fulfillmentPlan?: string;
  expRequiredDays: number;
  expDeliveryDate?: string | null;
  soDays: number;
  preparedBy?: string | null;
  remarks?: string | null;
  items: SalesOrderItem[];
}

export interface SalesOrderFilterState {
  search: string;
  party: string;
  status: string;
  fulfillmentPlan?: string;
  startDate: string;
  endDate: string;
  page?: number;
  limit?: number;
}
