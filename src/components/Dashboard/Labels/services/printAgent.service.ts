
const PRINT_HELPER_URL = process.env.NEXT_PUBLIC_PRINT_HELPER_URL || "http://127.0.0.1:9999";
const DEFAULT_PRINT_TOKEN = "dev-secret-token-123";
const PRINT_HELPER_TOKEN = process.env.NEXT_PUBLIC_PRINT_HELPER_TOKEN || DEFAULT_PRINT_TOKEN;

export interface PrintJobPayload {
  imageBase64: string; // raw base64, no "data:" prefix
  printerName: string;
  widthMm: number;
  heightMm: number;
}

// Chrome 142+ gates any request from our public domain to 127.0.0.1 behind a
// native "Allow this site to access your local network?" prompt (Local
// Network Access / LNA). It's a real browser security boundary — no amount
// of our own JS can read, pre-fill, or auto-click that dialog, by design.
// What we CAN do is ask Chrome what the current permission state is via the
// standard Permissions API, so the UI can tell the user exactly what's
// happening instead of showing a generic "offline" message for three very
// different situations.
export type LocalNetworkPermissionState = "granted" | "denied" | "prompt" | "unsupported";

export const printAgentService = {
  /**
   * Reads (does NOT request) the current Local Network Access permission
   * state for this origin. "unsupported" covers older Chrome/Edge versions
   * and every non-Chromium browser (Safari, Firefox) — for those we just
   * fall back to treating a failed /printers call as "helper offline".
   */
  async checkLocalNetworkPermission(): Promise<LocalNetworkPermissionState> {
    const nav = navigator as unknown as {
      permissions?: {
        query: (opts: { name: string }) => Promise<{ state: string }>;
      };
    };
    const permissions = nav.permissions;
    if (!permissions?.query) return "unsupported";

    // Chrome has renamed this permission as the spec evolved, and our
    // helper sits on 127.0.0.1 (loopback), not a LAN IP — these are now
    // TWO SEPARATE permissions, not one:
    //   "loopback-network"     -> current name for 127.0.0.1 / localhost
    //   "local-network"        -> current name for private IPs (192.168.x.x)
    //   "local-network-access" -> the original combined name, briefly used
    //                             in Chrome 142–144 before the split
    // We try the one that actually matches our case first, then fall back
    // down the list so this keeps working across the version range your
    // users are actually on. If a name isn't recognized, query() rejects —
    // we just move on to the next candidate.
    const candidateNames = ["loopback-network", "local-network-access", "local-network"];
    for (const name of candidateNames) {
      try {
        const status = await permissions.query({ name });
        if (status?.state) return status.state as LocalNetworkPermissionState;
      } catch {
        // Not a recognized permission name on this browser — try the next one.
      }
    }
    return "unsupported";
  },

  async getPrinters(): Promise<string[]> {
    const controller = new AbortController();
    // 15s, not 3s: on a brand-new browser profile, THIS call is what makes
    // Chrome show its native permission dialog, and the request stays
    // pending until the user responds to it. A short timeout here would
    // abort the request out from under the user mid-decision and misreport
    // "offline" when they just hadn't clicked yet.
    const timer = setTimeout(() => controller.abort(), 15000);
    try {
      const res = await fetch(`${PRINT_HELPER_URL}/printers`, { 
        headers: {
          "X-Print-Token": PRINT_HELPER_TOKEN
        },
        signal: controller.signal,
        targetAddressSpace: "local"
      } as RequestInit & { targetAddressSpace?: string });
      if (!res.ok) {
        if (res.status === 401) throw new Error("PRINT_HELPER_401");
        throw new Error("Print helper responded with an error");
      }
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
        headers: { 
          "Content-Type": "application/json",
          "X-Print-Token": PRINT_HELPER_TOKEN
        },
        body: JSON.stringify(payload),
        signal: controller.signal,
        targetAddressSpace: "local"
      } as RequestInit & { targetAddressSpace?: string });
      if (!res.ok) {
        if (res.status === 401) throw new Error("PRINT_HELPER_401");
        throw new Error(`Print request failed (${res.status})`);
      }
      // NOTE: a 200 here means "the helper accepted and queued the job," not
      // "the label physically printed."
    } finally {
      clearTimeout(timer);
    }
  },

};

const EXTENSION_ID = (process.env.NEXT_PUBLIC_PRINT_EXTENSION_ID || "cmegfllojibhfipdgamnfefilfokeooh").trim();

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
              console.error("Extension error:", chrome.runtime.lastError.message);
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
