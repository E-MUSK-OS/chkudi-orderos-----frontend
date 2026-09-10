import {
  DiagnosticRow,
  GetPrintersResponse,
  HostTestResponse,
  PingResponse,
  Verdict,
} from "../types";

export const DEFAULT_EXTENSION_ID = (process.env.NEXT_PUBLIC_PRINT_EXTENSION_ID || "nlcjdcpoibicgiejjhfdmfioojaaapng").trim();
export const INSTALLER_URL = "/downloads/PrintBridge-Setup.exe";
export const STORE_URL = `https://chromewebstore.google.com/detail/printbridge/${DEFAULT_EXTENSION_ID}`;
const PROBE_TIMEOUT_MS = 5000;

export const VIRTUAL_PRINTERS = [
  "microsoft print to pdf",
  "onenote",
  "fax",
  "xps",
  "send to onenote",
];

export function isValidExtensionId(value: string): boolean {
  return typeof value === "string" && /^[a-p]{32}$/.test(value.trim().toLowerCase());
}

export function looksLikeWindows(): boolean {
  if (typeof window === "undefined" || typeof navigator === "undefined") return true;
  const ua = navigator.userAgent || "";
  const platform =
    (navigator as any).userAgentData && (navigator as any).userAgentData.platform
      ? (navigator as any).userAgentData.platform
      : "";
  return /Windows/i.test(ua) || /Windows/i.test(platform);
}

export function hasExtensionMessaging(): boolean {
  if (typeof window === "undefined") return false;
  return (
    typeof (window as any).chrome !== "undefined" &&
    (window as any).chrome.runtime &&
    typeof (window as any).chrome.runtime.sendMessage === "function"
  );
}

export function askExtension<T = any>(extensionId: string, message: any): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    if (!hasExtensionMessaging()) {
      reject(new Error("NO_BROWSER_SUPPORT"));
      return;
    }

    let settled = false;
    const timer = setTimeout(() => {
      if (settled) return;
      settled = true;
      reject(new Error("TIMEOUT"));
    }, PROBE_TIMEOUT_MS);

    const finish = (fn: (val: any) => void, value: any) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      fn(value);
    };

    try {
      (window as any).chrome.runtime.sendMessage(
        extensionId,
        message,
        (response: T) => {
          const lastError = (window as any).chrome.runtime.lastError;
          if (lastError) {
            finish(reject, new Error("NO_EXTENSION"));
            return;
          }
          if (!response) {
            finish(reject, new Error("EMPTY_RESPONSE"));
            return;
          }
          finish(resolve, response);
        }
      );
    } catch (error) {
      finish(reject, error);
    }
  });
}

