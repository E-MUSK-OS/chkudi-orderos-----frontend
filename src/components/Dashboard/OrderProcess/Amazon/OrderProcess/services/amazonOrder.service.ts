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
   * Chunked upload process:
   * 1. init batch -> 2. upload chunks -> 3. process -> 4. poll status
   */
  async uploadBatchChunks(
    formData: FormData,
    onProgress?: (progress: number, status: string) => void,
    token?: string
  ): Promise<{ success: boolean; data: AmazonBatchDetail; message: string }> {
    const userToken = token || (typeof window !== "undefined" ? localStorage.getItem("accessToken") ?? "" : "");

    const fileFields = ["combinedPdf", "zplPdf", "originalPdf", "unmatchedPdf", "unmatchedZplPdf", "combined_match", "converted_zpl", "original_invoices", "unmatched_invoices", "unmatched_zpl"];
    const CHUNK_SIZE = 10 * 1024 * 1024; // 10MB chunks

    try {
      onProgress?.(0, "Initializing batch...");
      const initRes = await api.post<{ success: boolean; batchId: string }>(`${BASE_URL}/batch-chunks/init`, {}, userToken);
      const batchId = initRes.batchId;

      // Extract and upload files
      let filesToUpload = [];
      for (const [key, value] of formData.entries()) {
        if (value instanceof File && fileFields.includes(key)) {
          filesToUpload.push({ fieldName: key, file: value });
        }
      }

      let totalSize = filesToUpload.reduce((acc, f) => acc + f.file.size, 0);
      let uploadedBytes = 0;

      for (const { fieldName, file } of filesToUpload) {
        const totalChunks = Math.ceil(file.size / CHUNK_SIZE);
        for (let chunkIndex = 0; chunkIndex < totalChunks; chunkIndex++) {
          const start = chunkIndex * CHUNK_SIZE;
          const end = Math.min(start + CHUNK_SIZE, file.size);
          const chunk = file.slice(start, end);

          const chunkFormData = new FormData();
          chunkFormData.append("fileName", fieldName); // sending fieldName as fileName, backend maps it
          chunkFormData.append("chunkIndex", chunkIndex.toString());
          chunkFormData.append("totalChunks", totalChunks.toString());
          chunkFormData.append("chunk", chunk, file.name);

          let chunkSuccess = false;
          let chunkAttempts = 0;
          while (!chunkSuccess && chunkAttempts < 3) {
            try {
              chunkAttempts++;
              await api.post(`${BASE_URL}/batch-chunks/${batchId}/chunk`, chunkFormData, userToken);
              chunkSuccess = true;
            } catch (chunkErr: any) {
              if (chunkAttempts >= 3) {
                throw new Error(`Failed to upload chunk ${chunkIndex + 1} of ${file.name} after 3 attempts. Please check your connection.`);
              }
              // Wait 1s, 2s before retrying
              await new Promise(r => setTimeout(r, chunkAttempts * 1000));
            }
          }
          
          uploadedBytes += chunk.size;
          if (totalSize > 0) {
            onProgress?.(Math.round((uploadedBytes / totalSize) * 100), `Uploading files...`);
          }
        }
      }

      onProgress?.(100, "Starting background processing...");
      // Extract non-file fields to send to process
      const processPayload = {
        summary: formData.get("summary") as string,
        results: formData.get("results") as string,
        batchNumber: formData.get("batchNumber") as string,
        batchDate: formData.get("batchDate") as string,
      };

      await api.post(`${BASE_URL}/batch-chunks/${batchId}/process`, processPayload, userToken);

      // Polling loop
      while (true) {
        onProgress?.(100, "Processing database records (this may take a few minutes)...");
        await new Promise((resolve) => setTimeout(resolve, 5000)); // wait 5 seconds

        const statusRes = await api.get<{ success: boolean; status: string; data?: AmazonBatchDetail; error?: string }>(
          `${BASE_URL}/batch-chunks/${batchId}/status`,
          userToken
        );

        if (statusRes.status === "completed") {
          return { success: true, data: statusRes.data!, message: "Batch processed successfully" };
        } else if (statusRes.status === "failed") {
          throw new Error(statusRes.error || "Background processing failed");
        } else if (statusRes.status === "unknown") {
          throw new Error("Job status lost on server. Processing may have failed or server restarted.");
        }
      }
    } catch (error) {
      throw error;
    }
  },

  /**
   * Attach additional files (originalPdf, zplPdf, unmatched) to an existing batch
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
