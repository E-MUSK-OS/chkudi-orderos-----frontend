import { api } from "@/services/api";
import { FlipkartOrderItem, FlipkartOrderSummary } from "../types";

const BASE_URL = "/flipkart-orders";

export interface FlipkartPrintedOrderPayload {
  orderId: string;
  awb: string;
  fsn: string;
  sku: string;
  customer: string;
  totalQuantity: number;
  packingScanStatus?: "PENDING" | "SCANNED";
  isExplicitPrint?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface SavePrintedOrdersResponse {
  success: boolean;
  message: string;
  data: {
    count: number;
    orders: any[];
  };
}

export interface FlipkartBatchHistoryItem {
  id: string;
  batchNumber: string | null;
  batchDate: string;
  totalOrders: number;
  pdfFileName: string | null;
  summary?: FlipkartOrderSummary & {
    printedCount?: number;
    printedOrderIds?: string[];
    printedAwbs?: string[];
    printedIndices?: number[];
  };
  shippingLabelsPdfUrl?: string | null;
  taxInvoicesPdfUrl?: string | null;
  originalPdfUrl?: string | null;
  createdAt: string;
  expiresAt: string;
}

export interface GetBatchHistoryResponse {
  success: boolean;
  data: FlipkartBatchHistoryItem[];
  count: number;
}

export interface FlipkartBatchDetail {
  id: string;
  batchNumber: string | null;
  batchDate: string;
  totalOrders: number;
  pdfFileName: string | null;
  summary: FlipkartOrderSummary;
  results: FlipkartOrderItem[];
  shippingLabelsPdfUrl: string | null;
  taxInvoicesPdfUrl: string | null;
  originalPdfUrl: string | null;
  createdAt: string;
  expiresAt: string;
}

export interface GetBatchDetailResponse {
  success: boolean;
  data: FlipkartBatchDetail;
}

export interface FlipkartAwbOrderItem {
  id: string;
  orderId: string;
  awb: string;
  fsn: string;
  sku: string;
  customer: string;
  totalQuantity: number;
  packingScanStatus: "PENDING" | "SCANNED";
  userId: string;
  batchId?: string | null;
  createdAt: string;
  updatedAt: string;
  expiresAt?: string;
}

export interface GetFlipkartOrdersResponse {
  success: boolean;
  data: FlipkartAwbOrderItem[];
  total: number;
  summary?: {
    total: number;
    pending: number;
    scanned: number;
  };
  page: number;
  totalPages: number;
}

export interface UpdateFlipkartScanStatusResponse {
  success: boolean;
  message: string;
  data: FlipkartAwbOrderItem;
}

export const flipkartOrderService = {
  /**
   * Save a processed Flipkart batch to the database with 7-day retention (expires at 6 PM on 7th day)
   */
  async saveBatch(
    formData: FormData,
    token?: string
  ): Promise<{ success: boolean; data: FlipkartBatchDetail; message: string }> {
    const userToken =
      token || (typeof window !== "undefined" ? localStorage.getItem("accessToken") ?? "" : "");

    return api.post<{ success: boolean; data: FlipkartBatchDetail; message: string }>(
      `${BASE_URL}/batches`,
      formData,
      userToken
    );
  },

  /**
   * Attach additional files to an existing batch
   */
  async attachBatchFiles(
    batchId: string,
    formData: FormData,
    token?: string
  ): Promise<{ success: boolean; data: any; message: string }> {
    const userToken =
      token || (typeof window !== "undefined" ? localStorage.getItem("accessToken") ?? "" : "");

    return api.post<{ success: boolean; data: any; message: string }>(
      `${BASE_URL}/batches/${encodeURIComponent(batchId)}/files`,
      formData,
      userToken
    );
  },

  /**
   * Get 7-day history list of active processed Flipkart batches
   */
  async getBatchHistory(
    days = 7,
    token?: string
  ): Promise<GetBatchHistoryResponse> {
    const userToken =
      token || (typeof window !== "undefined" ? localStorage.getItem("accessToken") ?? "" : "");

    return api.get<GetBatchHistoryResponse>(
      `${BASE_URL}/batches/history?days=${days}`,
      userToken
    );
  },

  /**
   * Get complete batch details by ID (summary, results, file URLs)
   */
  async getBatchById(
    batchId: string,
    token?: string
  ): Promise<GetBatchDetailResponse> {
    const userToken =
      token || (typeof window !== "undefined" ? localStorage.getItem("accessToken") ?? "" : "");

    return api.get<GetBatchDetailResponse>(
      `${BASE_URL}/batches/${encodeURIComponent(batchId)}`,
      userToken
    );
  },

  /**
   * Fetch a specific PDF file from a batch as a Blob
   */
  async fetchBatchFileBlob(
    batchId: string,
    fileType: "shipping-labels" | "tax-invoices" | "original" | string,
    token?: string
  ): Promise<Blob> {
    const userToken =
      token || (typeof window !== "undefined" ? localStorage.getItem("accessToken") ?? "" : "");

    return api.download(
      `${BASE_URL}/batches/${encodeURIComponent(batchId)}/files/${fileType}`,
      userToken
    );
  },

  /**
   * Delete a specific Flipkart batch and its printed orders
   */
  async deleteFlipkartBatch(
    batchId: string,
    token?: string
  ): Promise<{ success: boolean; message: string; data: any }> {
    const userToken =
      token || (typeof window !== "undefined" ? localStorage.getItem("accessToken") ?? "" : "");

    return api.delete<{ success: boolean; message: string; data: any }>(
      `${BASE_URL}/batches/${encodeURIComponent(batchId)}`,
      userToken
    );
  },

  /**
   * Save printed Flipkart orders to the database (stored with 7-day retention)
   */
  async savePrintedOrders(
    orders: FlipkartPrintedOrderPayload[],
    token?: string,
    batchId?: string
  ): Promise<SavePrintedOrdersResponse> {
    const userToken =
      token || (typeof window !== "undefined" ? localStorage.getItem("accessToken") ?? "" : "");

    return api.post<SavePrintedOrdersResponse>(
      `${BASE_URL}/save-printed`,
      { orders, batchId },
      userToken
    );
  },

  /**
   * Get Flipkart orders from the database
   */
  async getOrders(
    query = "",
    token?: string
  ): Promise<GetFlipkartOrdersResponse> {
    const userToken =
      token || (typeof window !== "undefined" ? localStorage.getItem("accessToken") ?? "" : "");

    return api.get<GetFlipkartOrdersResponse>(
      `${BASE_URL}${query}`,
      userToken
    );
  },

  /**
   * Update packingScanStatus by Flipkart AWB tracking barcode
   */
  async updateScanStatusByAwb(
    awb: string,
    status: "PENDING" | "SCANNED" = "SCANNED",
    token?: string
  ): Promise<UpdateFlipkartScanStatusResponse> {
    const userToken =
      token || (typeof window !== "undefined" ? localStorage.getItem("accessToken") ?? "" : "");

    return api.patch<UpdateFlipkartScanStatusResponse>(
      `${BASE_URL}/scan/${encodeURIComponent(awb)}`,
      { status },
      userToken
    );
  },

  /**
   * Update packingScanStatus by record ID
   */
  async updateScanStatusById(
    id: string,
    status: "PENDING" | "SCANNED" = "SCANNED",
    token?: string
  ): Promise<UpdateFlipkartScanStatusResponse> {
    const userToken =
      token || (typeof window !== "undefined" ? localStorage.getItem("accessToken") ?? "" : "");

    return api.patch<UpdateFlipkartScanStatusResponse>(
      `${BASE_URL}/${encodeURIComponent(id)}/status`,
      { status },
      userToken
    );
  },
};
