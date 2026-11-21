export type FlipkartPdfViewType =
  | "shipping_labels"
  | "tax_invoices"
  | "original_pdf";

export interface FlipkartOrderLineItem {
  sku: string;
  description?: string;
  quantity: number;
  fsn?: string;
  asin?: string;
  rackAddress?: string;
}

export interface FlipkartOrderItem {
  index: number;
  pageIndex: number;
  orderNumber: number;
  orderId: string;
  invoiceNumber?: string;
  awb: string;
  sku: string;
  description?: string;
  totalQuantity?: number;
  customerName?: string;
  customerAddress?: string;
  // Matched from DB (AsinImport or FlipkartImports)
  fsn?: string;
  asin?: string;
  rackAddress?: string;
  isMatched?: boolean;
  orderType?: "single_quantity" | "multiple_pieces" | "multiple_sku";
  items?: FlipkartOrderLineItem[];
}

export interface FlipkartOrderSummary {
  pdfFileName: string;
  totalOrders: number;
  totalPdfSize: number;
  processedAt: string;
  orders?: FlipkartOrderItem[];
}

export interface FlipkartProcessFiles {
  shippingLabelsPdfBase64: string; // The cropped shipping label data
  taxInvoicesPdfBase64: string;    // The remaining data (Tax invoices) in original form
  originalPdfBase64: string;       // The complete original PDF
}

export interface FlipkartProcessResponse {
  summary: FlipkartOrderSummary;
  files: FlipkartProcessFiles;
}
