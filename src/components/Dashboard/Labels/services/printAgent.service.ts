

const EXTENSION_ID = (process.env.NEXT_PUBLIC_PRINT_EXTENSION_ID || "nlcjdcpoibicgiejjhfdmfioojaaapng").trim();

export interface ExtensionPingResponse {
  success?: boolean;
  status?: string;
  printers?: Array<{ id: string; name: string } | string>;
  [key: string]: any;
}

export interface ExtensionPrintResponse {
  success?: boolean;
  status?: string;
  jobId?: string;
  error?: string;
  [key: string]: any;
}

export const chromeExtensionPrintService = {
  EXTENSION_ID,

  /**
   * Checks if the Chrome print extension is installed and responding with detailed diagnostic.
   */
  async checkExtension(): Promise<{ ok: boolean; error?: string; response?: any }> {
    if (typeof window === "undefined") {
      return { ok: false, error: "Browser window is not available" };
    }
    const chrome = (window as any).chrome;
    if (!chrome?.runtime?.sendMessage) {
      return { ok: false, error: "chrome.runtime.sendMessage is not supported in this browser" };
    }

    return new Promise((resolve) => {
      try {
        chrome.runtime.sendMessage(
          EXTENSION_ID,
          { type: "PING" },
          (response: any) => {
            if (chrome.runtime.lastError) {
              console.error(`Extension error (Target ID: ${EXTENSION_ID}):`, chrome.runtime.lastError.message);
              resolve({ ok: false, error: chrome.runtime.lastError.message });
            } else {
              console.log("PING RESPONSE:", response);
              resolve({ ok: true, response: response || { success: true } });
            }
          }
        );
      } catch (err: any) {
        resolve({ ok: false, error: err?.message || String(err) });
      }
    });
  },

  /**
   * Checks if the Chrome print extension is installed and responding.
   */
  async ping(): Promise<ExtensionPingResponse | null> {
    const res = await this.checkExtension();
    return res.ok ? res.response : null;
  },

  /**
   * Attempts to get installed printers from the extension.
   */
  async getPrinters(): Promise<string[]> {
    if (typeof window === "undefined") return [];
    const chrome = (window as any).chrome;
    if (!chrome?.runtime?.sendMessage) return [];

    const pingRes = await this.ping();
    if (pingRes?.printers && Array.isArray(pingRes.printers)) {
      return pingRes.printers.map((p: any) => (typeof p === "string" ? p : p.name || p.id));
    }

    return new Promise((resolve) => {
      try {
        chrome.runtime.sendMessage(
          EXTENSION_ID,
          { type: "GET_PRINTERS" },
          (response: any) => {
            if (chrome.runtime.lastError || !response) {
              if (chrome.runtime.lastError) console.warn("Extension lastError:", chrome.runtime.lastError.message);
              resolve([]);
            } else if (response.success === false) {
              console.warn("Print extension error:", response.error || response);
              resolve([]);
            } else {
              const list = Array.isArray(response)
                ? response
                : response.printers || response.data || [];
              resolve(list.map((p: any) => (typeof p === "string" ? p : p.name || p.id)));
            }
          }
        );
      } catch {
        resolve([]);
      }
    });
  },

  /**
   * Sends a PDF base64 string to the Chrome extension (PrintBridge) for direct silent printing without dialogs.
   */
  async printPdf(
    pdfBase64: string,
    printerName: string | null = null,
    copies = 1
  ): Promise<ExtensionPrintResponse> {
    if (typeof window === "undefined") {
      throw new Error("Window is not defined");
    }
    const chrome = (window as any).chrome;
    if (!chrome?.runtime?.sendMessage) {
      throw new Error("Chrome extension runtime is not available");
    }

    const cleanBase64 = pdfBase64.includes(",") ? pdfBase64.split(",")[1] : pdfBase64;
    const requestId =
      typeof crypto !== "undefined" && crypto.randomUUID
        ? crypto.randomUUID()
        : `req-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

    return new Promise((resolve, reject) => {
      try {
        chrome.runtime.sendMessage(
          EXTENSION_ID,
          {
            type: "PRINT_PDF",
            pdf: cleanBase64,
            printer: printerName || null,
            options: {
              copies: copies || 1,
            },
            requestId: requestId,
          },
          (response: any) => {
            if (chrome.runtime.lastError) {
              console.error(
                "Extension error:",
                chrome.runtime.lastError.message
              );
              return reject(
                new Error(
                  chrome.runtime.lastError.message ||
                    "Failed to communicate with Chrome print extension"
                )
              );
            }

            console.log("PrintBridge response:", response);

            if (response && response.success === false && response.error) {
              return reject(new Error(response.error));
            }
            resolve(response || { success: true });
          }
        );
      } catch (err: any) {
        reject(err);
      }
    });
  },
};
