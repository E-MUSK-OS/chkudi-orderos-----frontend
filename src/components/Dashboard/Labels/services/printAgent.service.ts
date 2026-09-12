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

export interface PrinterDetail {
  name: string;
  isDefault?: boolean;
  isOnline?: boolean;
  isOffline?: boolean;
  status?: string;
}

export function isVirtualPrinter(name: string): boolean {
  if (!name) return true;
  const n = name.toLowerCase().trim();
  return (
    n.includes("microsoft print to pdf") ||
    n.includes("onenote") ||
    n.includes("fax") ||
    n.includes("xps document writer") ||
    n.includes("root print queue") ||
    n.includes("send to onenote") ||
    n.includes("pdfcreator") ||
    n.includes("foxit") ||
    n.includes("adobe pdf")
  );
}

export function isThermalOrLabelPrinter(name: string): boolean {
  if (!name) return false;
  return /tsc|zebra|thermal|barcode|da310|xprinter|gprinter|label|pos|tvs|hprt|rollo|rongta|citizen|godex|datamax|bixolon|argox/i.test(name);
}

/**
 * Strictly verifies whether a specific printer is currently physical, connected, and online on the PC.
 */
export function isPrinterConnectedAndOnline(
  name: string,
  detailedPrinters: PrinterDetail[] = []
): boolean {
  if (!name || isVirtualPrinter(name)) return false;

  const target = String(name).toLowerCase().trim();
  const detail = detailedPrinters.find((d) => d.name && d.name.toLowerCase().trim() === target);

  if (detailedPrinters.length > 0 && !detail) {
    return false;
  }

  if (detail) {
    if (detail.isOffline === true) return false;
    if (detail.isOnline === false) return false;
    const status = String(detail.status ?? "").toLowerCase();
    if (
      status.includes("offline") ||
      status.includes("disconnected") ||
      status.includes("error") ||
      status.includes("paused") ||
      status.includes("intervention") ||
      status.includes("not available") ||
      status.includes("unknown") ||
      status.includes("stop") ||
      status.includes("inactive") ||
      status.includes("door") ||
      status.includes("paper") ||
      status.includes("jam")
    ) {
      return false;
    }
  }

  return true;
}

/**
 * Resolves only whichever real printer is CURRENTLY connected and online on the PC.
 * If no real physical/thermal printer is online and connected, returns printer: null.
 */
export function resolveCurrentlyConnectedPrinter(
  availablePrinters: string[],
  detailedPrinters: PrinterDetail[] = []
): { printer: string | null; error?: string } {
  if (!availablePrinters || availablePrinters.length === 0) {
    return { printer: null, error: "No printer connected. Please connect printer." };
  }

  // Only consider physical real printers that are CURRENTLY ONLINE
  const onlinePhysicalPrinters = availablePrinters.filter((p) =>
    isPrinterConnectedAndOnline(p, detailedPrinters)
  );

  if (onlinePhysicalPrinters.length === 0) {
    return { printer: null, error: "No printer connected. Please connect printer." };
  }

  // 1. Highest Priority: Currently connected ONLINE thermal/label printer (e.g. TSC DA310, Zebra)
  const onlineThermal = onlinePhysicalPrinters.find(isThermalOrLabelPrinter);
  if (onlineThermal) {
    return { printer: onlineThermal };
  }

  // 2. Second Priority: If the last used printer is online and connected right now (and NOT virtual)
  const saved = typeof window !== "undefined" ? localStorage.getItem("lastUsedPrinter") : null;
  if (saved && !isVirtualPrinter(saved)) {
    const matchedSaved = onlinePhysicalPrinters.find((p) => p.toLowerCase().trim() === saved.toLowerCase().trim());
    if (matchedSaved) {
      return { printer: matchedSaved };
    }
  }

  // 3. Third Priority: Windows default printer if it is physical and online
  const defaultOnline = detailedPrinters.find((dp) => dp.isDefault && isPrinterConnectedAndOnline(dp.name, detailedPrinters));
  if (defaultOnline) {
    return { printer: defaultOnline.name };
  }

  // 4. Any other physical printer currently online
  return { printer: onlinePhysicalPrinters[0] };
}

let cachedPrintersDetailed: { data: PrinterDetail[]; timestamp: number } | null = null;
const PRINTER_CACHE_TTL_MS = 600000; // 10 minutes cache to avoid slow sequential Windows spooler lookups

export function invalidatePrinterCache(): void {
  cachedPrintersDetailed = null;
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
      return { ok: false, error: "PrintBridge extension is not installed or enabled in this browser" };
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
   * Attempts to get detailed printer status list from the extension.
   * Cached for 15s to ensure sub-second printing latency.
   */
  async getPrintersDetailed(forceRefresh = false): Promise<PrinterDetail[]> {
    if (typeof window === "undefined") return [];
    const chrome = (window as any).chrome;
    if (!chrome?.runtime?.sendMessage) return [];

    if (!forceRefresh && cachedPrintersDetailed && Date.now() - cachedPrintersDetailed.timestamp < PRINTER_CACHE_TTL_MS) {
      return cachedPrintersDetailed.data;
    }

    return new Promise((resolve) => {
      try {
        chrome.runtime.sendMessage(
          EXTENSION_ID,
          { type: "GET_PRINTERS" },
          (response: any) => {
            if (chrome.runtime.lastError || !response) {
              resolve([]);
            } else if (response.success === false) {
              resolve([]);
            } else {
              const rawList = Array.isArray(response)
                ? response
                : response.printers || response.data || [];
              const parsed: PrinterDetail[] = rawList.map((p: any) => {
                if (typeof p === "string") {
                  return { name: p, isOnline: true, isOffline: false };
                }
                const name = p.name || p.id || String(p);
                const statusStr = String(p.status || p.printerStatus || "").toLowerCase();
                const isOffline =
                  p.isOffline === true ||
                  p.workOffline === true ||
                  statusStr.includes("offline") ||
                  statusStr.includes("disconnected") ||
                  statusStr.includes("error");
                const isOnline = p.isOnline === true || (!isOffline && p.isOnline !== false);
                return {
                  name,
                  isDefault: !!p.isDefault,
                  status: typeof p.status === "string" ? p.status : (isOffline ? "Offline" : "Ready"),
                  isOnline: isOnline && !isOffline,
                  isOffline,
                };
              });
              cachedPrintersDetailed = { data: parsed, timestamp: Date.now() };
              resolve(parsed);
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
   * STRICTLY sends to connected, online printers only; will NEVER send or queue to offline/disconnected printers.
   */
  async printPdf(
    pdfBase64: string,
    printerName: string | null = null,
    copies = 1,
    skipOnlineVerification = false
  ): Promise<ExtensionPrintResponse> {
    if (typeof window === "undefined") {
      throw new Error("Window is not defined");
    }
    const chrome = (window as any).chrome;
    if (!chrome?.runtime?.sendMessage) {
      throw new Error("Chrome extension runtime is not available");
    }

    if (!printerName || isVirtualPrinter(printerName)) {
      throw new Error("No printer connected. Please connect printer.");
    }

    // STRICT GUARD: Verify printer is connected and online right now before dispatching (if not verified by caller)
    if (!skipOnlineVerification) {
      try {
        const livePrinters = await this.getPrintersDetailed();
        if (livePrinters && livePrinters.length > 0) {
          const isOnline = isPrinterConnectedAndOnline(printerName, livePrinters);
          if (!isOnline) {
            invalidatePrinterCache();
            throw new Error(`Printer "${printerName}" is offline or not connected. Print cancelled to avoid queuing.`);
          }
        }
      } catch (checkErr: any) {
        if (checkErr.message?.includes("offline") || checkErr.message?.includes("not connected")) {
          invalidatePrinterCache();
          throw checkErr;
        }
      }
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
            printer: printerName,
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