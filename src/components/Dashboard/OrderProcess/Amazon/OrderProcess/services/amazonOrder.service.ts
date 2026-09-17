import { api } from "@/services/api";
import { AmazonComparisonResult, AmazonOrderSummary } from "../types";

const BASE_URL = "/amazon-orders";

export interface AmazonPrintedOrderPayload {
  invoice: string;
  orderId: string;
  awb: string;
  asin: string;
  sellerSku: string;
  customer: string;
  packingScanStatus?: "PENDING" | "SCANNED";
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

export interface AmazonOrderItem {
  id: string;
  invoice: string;
  orderId: string;
  awb: string;
  asin: string;
  sellerSku: string;
  customer: string;
  packingScanStatus: "PENDING" | "SCANNED";
  userId: string;
  createdAt: string;
  updatedAt: string;
  expiresAt: string;
}

export interface GetAmazonOrdersResponse {
  success: boolean;
  data: AmazonOrderItem[];
  total: number;
  summary?: {
    total: number;
    pending: number;
    scanned: number;
  };
  page: number;
  totalPages: number;
}

export interface UpdateScanStatusResponse {
  success: boolean;
  message: string;
  data: AmazonOrderItem;
}

// 7-Day History Interfaces
export interface AmazonBatchHistoryItem {
  id: string;
  batchNumber: string | null;
  batchDate: string;
  totalOrders: number;
  matchedCount: number;
  mismatchCount: number;
  matchPercentage: number;
  pdfFileName: string | null;
  zplFileName: string | null;
  summary?: AmazonOrderSummary & {
    printedCount?: number;
    printedOrderIds?: string[];
    printedAwbs?: string[];
    printedIndices?: number[];
  };
  combinedPdfUrl?: string | null;
  zplPdfUrl?: string | null;
  originalPdfUrl?: string | null;
  unmatchedPdfUrl?: string | null;
  unmatchedZplPdfUrl?: string | null;
  createdAt: string;
  expiresAt: string;
}

export interface GetBatchHistoryResponse {
  success: boolean;
  data: AmazonBatchHistoryItem[];
  count: number;
}

export interface AmazonBatchDetail {
  id: string;
  batchNumber: string | null;
  batchDate: string;
  totalOrders: number;
  matchedCount: number;
  mismatchCount: number;
  matchPercentage: number;
  pdfFileName: string | null;
  zplFileName: string | null;
  summary: AmazonOrderSummary;
  results: AmazonComparisonResult[];
  combinedPdfUrl: string | null;
  zplPdfUrl: string | null;
  originalPdfUrl: string | null;
  unmatchedPdfUrl?: string | null;
  unmatchedZplPdfUrl?: string | null;
  createdAt: string;
  expiresAt: string;
}

export interface GetBatchDetailResponse {
  success: boolean;
  data: AmazonBatchDetail;
}

export const amazonOrderService = {
  /**
   * Save a processed Amazon batch to the database with 7-day retention (expires at 6 PM on 7th day)
   */
  async saveBatch(
    formData: FormData,
    token?: string
  ): Promise<{ success: boolean; data: AmazonBatchDetail; message: string }> {
    const userToken =
      token || (typeof window !== "undefined" ? localStorage.getItem("accessToken") ?? "" : "");

    return api.post<{ success: boolean; data: AmazonBatchDetail; message: string }>(
      `${BASE_URL}/batches`,
      formData,
      userToken
    );
  },

  /**
   * Get 7-day history list of active processed batches
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
    fileType: "combined" | "zpl" | "original" | "unmatched-pdf" | "unmatched-zpl" | string,
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
   * Delete a specific Amazon batch and its printed orders
   */
  async deleteAmazonBatch(
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
   * Save printed Amazon orders to the database (stored with 7-day retention)
   */
  async savePrintedOrders(
    orders: AmazonPrintedOrderPayload[],
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
   * Get Amazon orders from the database
   */
  async getOrders(
    query = "",
    token?: string
  ): Promise<GetAmazonOrdersResponse> {
    const userToken =
      token || (typeof window !== "undefined" ? localStorage.getItem("accessToken") ?? "" : "");

    return api.get<GetAmazonOrdersResponse>(
      `${BASE_URL}${query}`,
      userToken
    );
  },

  /**
   * Update packingScanStatus by AWB/Tracking ID
   */
  async updateScanStatusByAwb(
    awb: string,
    status: "PENDING" | "SCANNED" = "SCANNED",
    token?: string
  ): Promise<UpdateScanStatusResponse> {
    const userToken =
      token || (typeof window !== "undefined" ? localStorage.getItem("accessToken") ?? "" : "");

    return api.patch<UpdateScanStatusResponse>(
      `${BASE_URL}/scan/${encodeURIComponent(awb)}`,
      { status },
      userToken
    );
  },
};
