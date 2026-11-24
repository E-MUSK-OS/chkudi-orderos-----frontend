export type OrderProcessChannel = "all" | "amazon" | "flipkart";

export interface DailyOrderSummaryCounts {
  total: number;
  scanned: number;
  pending: number;
}

export interface DailyOrderSummaryData {
  date: string | null;
  channel?: OrderProcessChannel;
  totalOrders: number;
  todayOrders?: number;
  scannedOrders: number;
  pendingOrders: number;
  breakdown?: {
    amazon?: DailyOrderSummaryCounts;
    flipkart?: DailyOrderSummaryCounts;
  };
  isLive?: boolean;
  isPermanent?: boolean;
}

export interface GetDailySummaryResponse {
  success: boolean;
  data: DailyOrderSummaryData;
}

export interface BatchProgressItem {
  id: string;
  batchNumber: string;
  channel: "amazon" | "flipkart";
  total: number;
  scanned: number;
  pending: number;
  percentage: number;
  createdAt: string;
}

export interface HourlyVelocityItem {
  hour: string;
  hourNum?: number;
  hourShort?: string;
  timeRange?: string;
  total: number;
  amazon: number;
  flipkart: number;
}

export interface TopDispatchedSkuItem {
  sku: string;
  count: number;
  channel: "all" | "amazon" | "flipkart";
}

export interface DashboardAnalyticsData {
  date: string;
  channel: OrderProcessChannel;
  batches: BatchProgressItem[];
  hourlyVelocity: HourlyVelocityItem[];
  topSkus: TopDispatchedSkuItem[];
}

export interface GetDashboardAnalyticsResponse {
  success: boolean;
  data: DashboardAnalyticsData;
}
