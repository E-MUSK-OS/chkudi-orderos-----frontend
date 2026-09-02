import { convertCanvasToZPL } from "@/lib/zplConverter";

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

  async printViaWebUsb(canvas: HTMLCanvasElement): Promise<void> {
    const nav = navigator as any;
    if (!nav.usb) {
      throw new Error("WebUSB is not supported by your browser. Please use Chrome or Edge.");
    }

    // Prompt user to select a printer (classCode 7)
    const device = await nav.usb.requestDevice({ filters: [{ classCode: 7 }] });
    
    await device.open();
    if (device.configuration === null) {
      await device.selectConfiguration(1);
    }

    let printerInterface: any | undefined;
    for (const iface of device.configuration?.interfaces || []) {
      // Some devices have multiple interfaces, look for the printer class (7)
      if (iface.alternate.interfaceClass === 7) {
        printerInterface = iface;
        break;
      }
    }
    if (!printerInterface) {
      printerInterface = device.configuration?.interfaces[0];
    }
    if (!printerInterface) {
      throw new Error("Could not find printer interface");
    }

    await device.claimInterface(printerInterface.interfaceNumber);

    const endpoint = printerInterface.alternate.endpoints.find((e: any) => e.direction === "out");
    if (!endpoint) {
      throw new Error("Could not find USB output endpoint");
    }

    const zplString = convertCanvasToZPL(canvas);
    const encoder = new TextEncoder();
    const data = encoder.encode(zplString);

    await device.transferOut(endpoint.endpointNumber, data);
    await device.close();
  },
};
