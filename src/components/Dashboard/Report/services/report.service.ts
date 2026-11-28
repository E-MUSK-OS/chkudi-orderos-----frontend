import { API_BASE_URL } from "@/lib/config";
import { fetchWithAuth } from "@/lib/fetchWithAuth";

export type ReportMarketplace = "amazon";

export type AccountReportType =
  | "remuneration-salary"
  | "tally-export"
  | "profit-loss"
  | "purchase-report"
  | "sales-report";

export interface ReportAccountOption {
  id: string;
  sellerName: string;
  displayName?: string | null;
  sellerCode: string;
}

export interface AmazonReportAnalytics {
  top8Skus: {
    sellerSku: string;
    asin: string;
    masterSku: string;
    category: string;
    ordersCount: number;
    scannedCount: number;
    pendingCount: number;
    sharePct: number;
  }[];
  categoryShare: {
    category: string;
    ordersCount: number;
    sharePct: number;
  }[];
  dailyTop5: {
    dates: string[];
    series: {
      sellerSku: string;
      counts: number[];
    }[];
  };
  rankMovers: {
    sellerSku: string;
    subtitle: string;
    currentRank: number;
    prevRank: number;
    rankDelta: number;
  }[];
}

export interface PurchaseReportPartyGroup {
  partyName: string;
  count: number;
  qty: number;
  taxableAmount: number;
  sgst: number;
  cgst: number;
  igst: number;
  beforeTds: number;
  tds: number;
  netAmount: number;
  paidAmount: number;
  balanceAmount: number;
  items: Record<string, any>[];
}

export interface ProfitLossResponse extends Omit<ReportResponse, "accounts"> {
  parties?: PurchaseReportPartyGroup[];
  grandTotal?: Record<string, number>;
  filterOptions?: {
    categories: string[];
    masterSkus: string[];
    productSkus: string[];
  };
  summary?: {
    totalUnits: number;
    totalSalesAmount: number;
    totalCostAmount: number;
    totalPlAmount: number;
    totalPlPercent: number;
    totalPlPerPcs: number;
  };
}
export interface ReportResponse {
  accounts: ReportAccountOption[];
  kpis: Record<string, string | number>;
  analytics?: AmazonReportAnalytics;
  rows: Record<string, any>[];
  total: number;
  page: number;
  limit: number;
}

export interface ReportQueryParams {
  tab: string;
  search?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
  accountId?: string;
  page?: number;
  limit?: number;
}

export const reportService = {
  async getReport(
    marketplace: ReportMarketplace,
    params: ReportQueryParams
  ): Promise<ReportResponse> {
    const qs = new URLSearchParams();
    qs.set("tab", params.tab);
    if (params.search) qs.set("search", params.search);
    if (params.status) qs.set("status", params.status);
    if (params.startDate) qs.set("startDate", params.startDate);
    if (params.endDate) qs.set("endDate", params.endDate);
    if (params.accountId) qs.set("accountId", params.accountId);
    if (params.page) qs.set("page", String(params.page));
    if (params.limit) qs.set("limit", String(params.limit));

    const res = await fetchWithAuth(
      `${API_BASE_URL}/reports/${marketplace}?${qs.toString()}`
    );
    const json = await res.json();
    if (!res.ok) {
      throw new Error(json?.message || `Failed to load ${marketplace} report`);
    }
    return json.data;
  },

  async getAccountReport(
    type: AccountReportType,
    params: Omit<ReportQueryParams, "tab"> & {
      reportKey?: string;
      category?: string;
      masterSku?: string;
      productSku?: string;
      missingCost?: string;
      includeAllCompany?: boolean;
    }
  ): Promise<ProfitLossResponse> {
    const qs = new URLSearchParams();
    if (params.reportKey) qs.set("reportKey", params.reportKey);
    if (params.category) qs.set("category", params.category);
    if (params.masterSku) qs.set("masterSku", params.masterSku);
    if (params.productSku) qs.set("productSku", params.productSku);
    if (params.missingCost) qs.set("missingCost", params.missingCost);
    if (params.includeAllCompany !== undefined) {
      qs.set("includeAllCompany", String(params.includeAllCompany));
    }
    if (params.search) qs.set("search", params.search);
    if (params.status) qs.set("status", params.status);
    if (params.startDate) qs.set("startDate", params.startDate);
    if (params.endDate) qs.set("endDate", params.endDate);
    if (params.page) qs.set("page", String(params.page));
    if (params.limit) qs.set("limit", String(params.limit));

    const res = await fetchWithAuth(
      `${API_BASE_URL}/reports/account/${type}?${qs.toString()}`
    );
    const json = await res.json();
    if (!res.ok) {
      throw new Error(json?.message || `Failed to load ${type} report`);
    }
    return json.data;
  },
};
