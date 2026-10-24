export type DatePreset = "today" | "yesterday" | "7d" | "30d" | "custom";

export type Marketplace = "amazon" | "myntra";

export interface AmazonDashboardStats {
  kpis: {
    totalOrdersProcessed: number;
    scannedOrders: number;
    pendingOrders: number;
    scanRatePercentage: number;
    totalBatches: number;
    totalMatched: number;
    totalMismatched: number;
    averageMatchRate: number;
  };
  dailyBreakdown: Array<{
    date: string;
    totalOrders: number;
    scanned: number;
    pending: number;
    batchesCount: number;
  }>;
  recentBatches: Array<{
    id: string;
    batchNumber: string | null;
    batchDate: string;
    totalOrders: number;
    matchedCount: number;
    mismatchCount: number;
    matchPercentage: number;
    summary?: any;
    combinedPdfUrl: string | null;
    zplPdfUrl: string | null;
    originalPdfUrl: string | null;
    createdAt: string;
  }>;
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
  batchId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface GetOrdersResponse {
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
