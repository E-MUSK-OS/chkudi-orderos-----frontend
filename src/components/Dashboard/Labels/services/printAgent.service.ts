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
  isConnected?: boolean;
  status?: string;
  paperSize?: string;
  paperSizes?: string[];
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

let qzSecurityConfigured = false;
let qzConnectPromise: Promise<any> | null = null;

async function getQzInstance(): Promise<any> {
  if (typeof window === "undefined") {
    throw new Error("QZ Tray is only available in the browser");
  }
  const mod: any = await import("qz-tray");
  const qz = mod?.websocket
    ? mod
    : mod?.default?.websocket
    ? mod.default
    : (window as any).qz;

  if (!qz?.websocket) {
    throw new Error("QZ Tray client library failed to initialize");
  }
  return qz;
}

function getQzApiBase(): string {
  if (process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL.replace(/\/$/, "");
  }
  if (typeof window !== "undefined") {
    const host = window.location.hostname.toLowerCase();
    if (host === "netuorderos.io" || host === "www.netuorderos.io") {
      return "https://api.netuorderos.io/api/v1";
    }
  }
  return "http://localhost:5000/api/v1";
}

async function ensureQzConnected(): Promise<any> {
  const qz = await getQzInstance();

  if (!qzSecurityConfigured) {
    const apiBase = getQzApiBase();

    qz.security.setCertificatePromise((resolve: (cert: string) => void) => {
      fetch(`${apiBase}/qz/certificate`, { cache: "no-store" })
        .then((res) => (res.ok ? res.text() : ""))
        .then((cert) => resolve(cert?.trim() || ""))
        .catch(() => resolve(""));
    });

    qz.security.setSignatureAlgorithm("SHA512");
    qz.security.setSignaturePromise((toSign: string) => (resolve: (sig: string) => void) => {
      fetch(`${apiBase}/qz/sign`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ request: toSign }),
      })
        .then((res) => (res.ok ? res.text() : ""))
        .then((sig) => resolve(sig?.trim() || ""))
        .catch(() => resolve(""));
    });

    qzSecurityConfigured = true;
  }

  if (qz.websocket.isActive()) {
    return qz;
  }

  if (!qzConnectPromise) {
    const isHttps = typeof window !== "undefined" && window.location.protocol === "https:";
    const connectOpts = {
      host: isHttps
        ? ["localhost.qz.io", "localhost", "127.0.0.1"]
        : ["localhost", "127.0.0.1", "localhost.qz.io"],
      usingSecure: isHttps,
      retries: 3,
      delay: 1,
    };

    qzConnectPromise = qz.websocket
      .connect(connectOpts)
      .then(() => qz)
      .catch(async (err: any) => {
        if (qz.websocket.isActive()) {
          return qz;
        }
        const msg = String(err?.message || err || "");
        if (msg.includes("already exists") || msg.includes("has not returned yet")) {
          await new Promise((r) => setTimeout(r, 400));
          if (qz.websocket.isActive()) return qz;
        }
        throw err;
      })
      .finally(() => {
        qzConnectPromise = null;
      });
  }

  return qzConnectPromise;
}

export const qzTrayPrintService = {
  /**
   * Explicitly connects to the local QZ Tray desktop app over WebSocket.
   */
  async connect(): Promise<boolean> {
    if (typeof window === "undefined") return false;
    await ensureQzConnected();
    return true;
  },
  /**
   * Checks if QZ Tray desktop service is running and connected via WebSocket.
   */
  async checkConnection(): Promise<{ ok: boolean; error?: string; response?: any }> {
    if (typeof window === "undefined") {
      return { ok: false, error: "Browser window is not available" };
    }
    try {
      await ensureQzConnected();
      return { ok: true, response: { success: true, silentPrinting: true, qzTray: true } };
    } catch (err: any) {
      return {
        ok: false,
        error: err?.message || "QZ Tray is not running or not detected. Please launch QZ Tray.",
      };
    }
  },

  /**
   * Returns available printer names from QZ Tray.
   */
  async getPrinters(): Promise<string[]> {
    if (typeof window === "undefined") return [];
    try {
      const qz = await ensureQzConnected();
      const printers = await qz.printers.find();
      return Array.isArray(printers) ? printers : [];
    } catch (err) {
      console.warn("QZ Tray getPrinters error:", err);
      return [];
    }
  },

  /**
   * Returns detailed printer status list from QZ Tray (cached for 10m unless forceRefresh=true).
   */
  async getPrintersDetailed(forceRefresh = false): Promise<PrinterDetail[]> {
    if (typeof window === "undefined") return [];
    if (!forceRefresh && cachedPrintersDetailed && Date.now() - cachedPrintersDetailed.timestamp < PRINTER_CACHE_TTL_MS) {
      return cachedPrintersDetailed.data;
    }

    try {
      const qz = await ensureQzConnected();
      let parsed: PrinterDetail[] = [];

      if (typeof qz.printers?.details === "function") {
        const details = await qz.printers.details();
        if (Array.isArray(details)) {
          parsed = details.map((p: any) => ({
            name: p.name || String(p),
            isDefault: !!p.default,
            isConnected: true,
            status: "Ready",
            isOnline: true,
            isOffline: false,
            paperSizes: [],
          }));
        }
      }

      if (parsed.length === 0) {
        const names = await qz.printers.find();
        let defaultName: string | null = null;
        try {
          defaultName = await qz.printers.getDefault();
        } catch {
          defaultName = null;
        }
        parsed = (Array.isArray(names) ? names : []).map((name: string) => ({
          name,
          isDefault: !!defaultName && name === defaultName,
          isConnected: true,
          status: "Ready",
          isOnline: true,
          isOffline: false,
          paperSizes: [],
        }));
      }

      cachedPrintersDetailed = { data: parsed, timestamp: Date.now() };
      return parsed;
    } catch (err) {
      console.warn("QZ Tray getPrintersDetailed error:", err);
      return [];
    }
  },

  /**
   * Sends a PDF base64 string to QZ Tray for direct silent printing without browser dialogs.
   */
  async printPdf(
    pdfBase64: string,
    printerName: string | null = null,
    copies = 1,
    skipOnlineVerification = false,
    widthMm?: number,
    heightMm?: number
  ): Promise<ExtensionPrintResponse> {
    if (typeof window === "undefined") {
      throw new Error("Window is not defined");
    }

    if (!printerName || isVirtualPrinter(printerName)) {
      throw new Error("No printer connected. Please connect printer.");
    }

    const qz = await ensureQzConnected();

    if (!skipOnlineVerification) {
      const livePrinters = await this.getPrintersDetailed();
      if (livePrinters.length > 0 && !isPrinterConnectedAndOnline(printerName, livePrinters)) {
        invalidatePrinterCache();
        throw new Error(`Printer "${printerName}" is offline or not connected. Print cancelled to avoid queuing.`);
      }
    }

    const cleanBase64 = pdfBase64.includes(",") ? pdfBase64.split(",")[1] : pdfBase64;
    const configOptions: Record<string, any> = {
      copies: copies || 1,
      scaleContent: true,
      rasterize: false,
      margins: 0,
    };

    if (widthMm && heightMm) {
      configOptions.size = { width: widthMm, height: heightMm };
      configOptions.units = "mm";
    } else {
      configOptions.size = { width: 4, height: 6 };
      configOptions.units = "in";
    }

    const config = qz.configs.create(printerName, configOptions);
    const data = [
      {
        type: "pixel",
        format: "pdf",
        flavor: "base64",
        data: cleanBase64,
      },
    ];

    console.log("🖨️ [QZ Tray] Dispatching Print Request:", {
      printer: printerName,
      size: configOptions.size,
      units: configOptions.units,
      copies: copies || 1,
    });

    await qz.print(config, data);
    return { success: true, status: "sent" };
  },
};

export const chromeExtensionPrintService = {
  EXTENSION_ID,

  /**
   * Checks if QZ Tray is connected (PrintBridge extension check is commented out).
   */
  async checkExtension(): Promise<{ ok: boolean; error?: string; response?: any }> {
    // [COMMENTED OUT - PrintBridge Silent Printing Disabled]
    // if (typeof window === "undefined") {
    //   return { ok: false, error: "Browser window is not available" };
    // }
    // const chrome = (window as any).chrome;
    // if (!chrome?.runtime?.sendMessage) {
    //   return { ok: false, error: "PrintBridge extension is not installed or enabled in this browser" };
    // }
    //
    // return new Promise((resolve) => {
    //   try {
    //     chrome.runtime.sendMessage(
    //       EXTENSION_ID,
    //       { type: "PING" },
    //       (response: any) => {
    //         if (chrome.runtime.lastError) {
    //           console.error(`Extension error (Target ID: ${EXTENSION_ID}):`, chrome.runtime.lastError.message);
    //           resolve({ ok: false, error: chrome.runtime.lastError.message });
    //         } else {
    //           console.log("PING RESPONSE:", response);
    //           resolve({ ok: true, response: response || { success: true } });
    //         }
    //       }
    //     );
    //   } catch (err: any) {
    //     resolve({ ok: false, error: err?.message || String(err) });
    //   }
    // });
    return qzTrayPrintService.checkConnection();
  },

  /**
   * Checks if QZ Tray is connected and responding.
   */
  async ping(): Promise<ExtensionPingResponse | null> {
    const res = await this.checkExtension();
    return res.ok ? res.response : null;
  },

  /**
   * Gets installed printers via QZ Tray (PrintBridge extension logic is commented out).
   */
  async getPrinters(): Promise<string[]> {
    // [COMMENTED OUT - PrintBridge Silent Printing Disabled]
    // if (typeof window === "undefined") return [];
    // const chrome = (window as any).chrome;
    // if (!chrome?.runtime?.sendMessage) return [];
    //
    // const pingRes = await this.ping();
    // if (pingRes?.printers && Array.isArray(pingRes.printers)) {
    //   return pingRes.printers.map((p: any) => (typeof p === "string" ? p : p.name || p.id));
    // }
    //
    // return new Promise((resolve) => {
    //   try {
    //     chrome.runtime.sendMessage(
    //       EXTENSION_ID,
    //       { type: "GET_PRINTERS" },
    //       (response: any) => {
    //         if (chrome.runtime.lastError || !response) {
    //           if (chrome.runtime.lastError) console.warn("Extension lastError:", chrome.runtime.lastError.message);
    //           resolve([]);
    //         } else if (response.success === false) {
    //           console.warn("Print extension error:", response.error || response);
    //           resolve([]);
    //         } else {
    //           const list = Array.isArray(response)
    //             ? response
    //             : response.printers || response.data || [];
    //           resolve(list.map((p: any) => (typeof p === "string" ? p : p.name || p.id)));
    //         }
    //       }
    //     );
    //   } catch {
    //     resolve([]);
    //   }
    // });
    return qzTrayPrintService.getPrinters();
  },

  /**
   * Gets detailed printer status list via QZ Tray (PrintBridge extension logic is commented out).
   */
  async getPrintersDetailed(forceRefresh = false): Promise<PrinterDetail[]> {
    // [COMMENTED OUT - PrintBridge Silent Printing Disabled]
    // if (typeof window === "undefined") return [];
    // const chrome = (window as any).chrome;
    // if (!chrome?.runtime?.sendMessage) return [];
    //
    // if (!forceRefresh && cachedPrintersDetailed && Date.now() - cachedPrintersDetailed.timestamp < PRINTER_CACHE_TTL_MS) {
    //   return cachedPrintersDetailed.data;
    // }
    //
    // return new Promise((resolve) => {
    //   try {
    //     chrome.runtime.sendMessage(
    //       EXTENSION_ID,
    //       { type: "GET_PRINTERS" },
    //       (response: any) => {
    //         if (chrome.runtime.lastError || !response) {
    //           resolve([]);
    //         } else if (response.success === false) {
    //           resolve([]);
    //         } else {
    //           const rawList = Array.isArray(response)
    //             ? response
    //             : response.printers || response.data || [];
    //           const parsed: PrinterDetail[] = rawList.map((p: any) => {
    //             if (typeof p === "string") {
    //               return { name: p, isOnline: true, isOffline: false, isConnected: true, paperSizes: [] };
    //             }
    //             const name = p.name || p.id || String(p);
    //             const statusStr = String(p.status || p.printerStatus || "").toLowerCase();
    //             const isOffline =
    //               p.isOffline === true ||
    //               p.workOffline === true ||
    //               statusStr.includes("offline") ||
    //               statusStr.includes("disconnected") ||
    //               statusStr.includes("error");
    //             const isOnline = p.isOnline === true || (!isOffline && p.isOnline !== false);
    //             return {
    //               name,
    //               isDefault: !!p.isDefault,
    //               isConnected: p.isConnected !== undefined ? p.isConnected : (isOnline && !isOffline),
    //               status: typeof p.status === "string" ? p.status : (isOffline ? "Offline" : "Ready"),
    //               isOnline: isOnline && !isOffline,
    //               isOffline,
    //               paperSize: p.paperSize,
    //               paperSizes: Array.isArray(p.paperSizes) ? p.paperSizes : [],
    //             };
    //           });
    //           console.log("🖨️ [PrintBridge] Detected Printers & Paper Sizes:", parsed);
    //           cachedPrintersDetailed = { data: parsed, timestamp: Date.now() };
    //           resolve(parsed);
    //         }
    //       }
    //     );
    //   } catch {
    //     resolve([]);
    //   }
    // });
    return qzTrayPrintService.getPrintersDetailed(forceRefresh);
  },

  /**
   * Sends a PDF base64 string to QZ Tray for direct silent printing without dialogs.
   * (PrintBridge extension logic is commented out.)
   */
  async printPdf(
    pdfBase64: string,
    printerName: string | null = null,
    copies = 1,
    skipOnlineVerification = false,
    widthMm?: number,
    heightMm?: number
  ): Promise<ExtensionPrintResponse> {
    // [COMMENTED OUT - PrintBridge Silent Printing Disabled]
    // if (typeof window === "undefined") {
    //   throw new Error("Window is not defined");
    // }
    // const chrome = (window as any).chrome;
    // if (!chrome?.runtime?.sendMessage) {
    //   throw new Error("Chrome extension runtime is not available");
    // }
    //
    // if (!printerName || isVirtualPrinter(printerName)) {
    //   throw new Error("No printer connected. Please connect printer.");
    // }
    //
    // // STRICT GUARD: Verify printer is connected and online right now before dispatching (if not verified by caller)
    // if (!skipOnlineVerification) {
    //   try {
    //     const livePrinters = await this.getPrintersDetailed();
    //     if (livePrinters && livePrinters.length > 0) {
    //       const isOnline = isPrinterConnectedAndOnline(printerName, livePrinters);
    //       if (!isOnline) {
    //         invalidatePrinterCache();
    //         throw new Error(`Printer "${printerName}" is offline or not connected. Print cancelled to avoid queuing.`);
    //       }
    //     }
    //   } catch (checkErr: any) {
    //     if (checkErr.message?.includes("offline") || checkErr.message?.includes("not connected")) {
    //       invalidatePrinterCache();
    //       throw checkErr;
    //     }
    //   }
    // }
    //
    // const cleanBase64 = pdfBase64.includes(",") ? pdfBase64.split(",")[1] : pdfBase64;
    // const requestId =
    //   typeof crypto !== "undefined" && crypto.randomUUID
    //     ? crypto.randomUUID()
    //     : `req-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    //
    // const formattedPaperSize = widthMm && heightMm ? `${widthMm}x${heightMm}mm` : undefined;
    //
    // console.log("🖨️ [PrintBridge] Dispatching Print Request:", {
    //   printer: printerName,
    //   paperSize: formattedPaperSize || "4x6 (Default Thermal)",
    //   copies: copies || 1,
    //   requestId,
    // });
    //
    // return new Promise((resolve, reject) => {
    //   try {
    //     chrome.runtime.sendMessage(
    //       EXTENSION_ID,
    //       {
    //         type: "PRINT_PDF",
    //         pdf: cleanBase64,
    //         printer: printerName,
    //         options: {
    //           copies: copies || 1,
    //           paperSize: formattedPaperSize,
    //           ...(widthMm && heightMm ? { scale: "fit", rasterize: false } : {}),
    //         },
    //         requestId: requestId,
    //       },
    //       (response: any) => {
    //         if (chrome.runtime.lastError) {
    //           console.error(
    //             "Extension error:",
    //             chrome.runtime.lastError.message
    //           );
    //           return reject(
    //             new Error(
    //               chrome.runtime.lastError.message ||
    //               "Failed to communicate with Chrome print extension"
    //             )
    //           );
    //         }
    //
    //         console.log("PrintBridge response:", response);
    //
    //         if (response && response.success === false && response.error) {
    //           return reject(new Error(response.error));
    //         }
    //         resolve(response || { success: true });
    //       }
    //     );
    //   } catch (err: any) {
    //     reject(err);
    //   }
    // });
    return qzTrayPrintService.printPdf(
      pdfBase64,
      printerName,
      copies,
      skipOnlineVerification,
      widthMm,
      heightMm
    );
  },
};