export type RowState = "busy" | "ok" | "fail" | "warn";

export interface DiagnosticRow {
  state: RowState;
  note: string;
}

export type VerdictState = "busy" | "ok" | "fail" | "warn";

export interface Verdict {
  state: VerdictState;
  title: string;
  foot: string;
}

export interface PrinterInfo {
  name: string;
  isDefault?: boolean;
}

export interface PingResponse {
  version?: string;
  silentPrinting?: boolean;
  success?: boolean;
  error?: string;
}

export interface HostTestResponse {
  version?: string;
  success?: boolean;
  error?: string;
}

export interface GetPrintersResponse {
  printers?: PrinterInfo[];
  success?: boolean;
  error?: string;
}

