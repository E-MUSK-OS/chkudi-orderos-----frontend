import { api } from "@/services/api";

const BASE_URL = "/amazon-orders";

export interface AmazonPrintedOrderPayload {
  invoice: string;
  orderId: string;
  awb: string;
  asin: string;
  sellerSku: string;
  customer: string;
  packingScanStatus?: "PENDING" | "SCANNED";
}

export interface SavePrintedOrdersResponse {
  success: boolean;
  message: string;
  data: {
    count: number;
    orders: any[];
  };
}

export interface GetAmazonOrdersResponse {
  success: boolean;
  data: any[];
  total: number;
  page: number;
  totalPages: number;
}

export const amazonOrderService = {
  /**
   * Save printed Amazon orders to the database (stored with 7-day retention)
   */
  async savePrintedOrders(
    orders: AmazonPrintedOrderPayload[],
    token?: string
  ): Promise<SavePrintedOrdersResponse> {
    const userToken =
      token || (typeof window !== "undefined" ? localStorage.getItem("accessToken") ?? "" : "");

    return api.post<SavePrintedOrdersResponse>(
      `${BASE_URL}/save-printed`,
      { orders },
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
  ) {
    const userToken =
      token || (typeof window !== "undefined" ? localStorage.getItem("accessToken") ?? "" : "");

    return api.patch(
      `${BASE_URL}/scan/${encodeURIComponent(awb)}`,
      { status },
      userToken
    );
  },
};
