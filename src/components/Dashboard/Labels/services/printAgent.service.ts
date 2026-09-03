
// GUARDRAIL: this file talks to the local print helper only
// (127.0.0.1, via PRINT_HELPER_URL below) and must never import or call
// anything that depends on API_BASE_URL / the backend. The backend runs
// behind ngrok, whose URL rotates on its own — the print flow is
// deliberately built so it keeps working even when the backend/ngrok
// tunnel is completely down. Do not "fix" a print issue by routing
// anything here through the backend.
const PRINT_HELPER_URL = process.env.NEXT_PUBLIC_PRINT_HELPER_URL || "http://127.0.0.1:9999";

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
          "X-Print-Token": process.env.NEXT_PUBLIC_PRINT_HELPER_TOKEN || ""
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
          "X-Print-Token": process.env.NEXT_PUBLIC_PRINT_HELPER_TOKEN || ""
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
