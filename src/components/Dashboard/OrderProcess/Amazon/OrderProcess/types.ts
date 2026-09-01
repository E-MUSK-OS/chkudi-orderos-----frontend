export interface AmazonComparisonResult {
  index: number;
  isMatch: boolean;
  zplInvoice: string;
  pdfInvoice: string;
  orderNumber: string;
  awb: string;
  customer: string;
  amount: string;
  date: string;
  pdfPages: number[];
  zplPage: number;
}

export interface AmazonOrderSummary {
  totalZplLabels: number;
  totalPdfOrders: number;
  totalPdfPages: number;
  matchedCount: number;
  mismatchCount: number;
  matchPercentage: number;
  isAllMatched: boolean;
  processedAt: string;
  zplFileName: string;
  pdfFileName: string;
}

export interface AmazonProcessFiles {
  convertedZplPdfBase64: string;
  combinedPdfBase64: string;
  originalPdfBase64: string;
}

export interface AmazonProcessResponse {
  success: boolean;
  summary: AmazonOrderSummary;
  results: AmazonComparisonResult[];
  files: AmazonProcessFiles;
}

