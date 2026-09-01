const PRINT_HELPER_URL = process.env.NEXT_PUBLIC_PRINT_HELPER_URL || "http://127.0.0.1:9999";

export interface PrintJobPayload {
  imageBase64: string; // raw base64, no "data:" prefix
  printerName: string;
  widthMm: number;
  heightMm: number;
}

export const printAgentService = {
  async getPrinters(): Promise<string[]> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 3000);
    try {
      const res = await fetch(`${PRINT_HELPER_URL}/printers`, { signal: controller.signal });
      if (!res.ok) throw new Error("Print helper responded with an error");
      const data = await res.json();
      return Array.isArray(data) ? data : (data.printers || []);
    } finally {
      clearTimeout(timer);
    }
  },

  async sendPrintJob(payload: PrintJobPayload): Promise<void> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 8000);
    try {
      const res = await fetch(`${PRINT_HELPER_URL}/print`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });
      if (!res.ok) throw new Error(`Print request failed (${res.status})`);
      // NOTE: a 200 here means "the helper accepted and queued the job," not
      // "the label physically printed."
    } finally {
      clearTimeout(timer);
    }
  },
};
