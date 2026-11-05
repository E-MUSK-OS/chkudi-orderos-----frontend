export interface RequestedPOItem {
  id: string;
  lineNo: number;
  sku: string;
  productTitle?: string;
  asin?: string;
  quantity: number;
  initialQuantity?: number;
  scannedQuantity?: number;
  unitPrice?: number;
  taxRate?: number;
  totalAmount?: number;
  hsn?: string;
  rawData?: Record<string, unknown>;
  [key: string]: unknown;
}

export interface RequestedPO {
  id: string;
  storeId: string;
  storeName: string;
  marketplaceName: string;
  poNumber: string;
  poDate: string;
  fileName: string;
  itemsCount: number;
  totalQuantity: number;
  totalAmount: number;
  status: "Uploaded" | "Processed" | "Pending";
  createdAt: string;
  items: RequestedPOItem[];
  columns?: string[];
}

export interface UploadPOFormState {
  poNumber: string;
  poDate: string;
  file: File | null;
  fileName: string;
}
