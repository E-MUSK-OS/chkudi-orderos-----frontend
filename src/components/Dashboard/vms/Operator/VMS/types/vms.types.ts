export interface CameraState {
  connected: boolean;
  permission: boolean;
  deviceName: string;
}

export interface SessionState {
  sessionId: string | null;
  operatorName: string;
  shift: string;
}

export interface UploadState {
  pending: number;
  uploading: number;
  completed: number;
  failed: number;
}

export interface ScanItem {
  trackingId: string;
  scannedAt: string;
}

export interface NetworkState {
  online: boolean;
}

export interface ScannerState {
  connected: boolean;
  lastScan: string | null;
}

export interface CameraDevice {
  id: string;
  label: string;
}

export interface UploadItem {
  id: string;
  trackingId: string;

  blob: Blob;

  status: "pending" | "uploading" | "completed" | "failed";

  progress: number;

  retryCount: number;

  createdAt: number;
}

export interface VMSStore {
  camera: CameraState;
  recording: RecordingState;
  session: SessionState;
  uploads: UploadState;
  uploadQueue: UploadItem[];
  scans: ScanItem[];
  network: NetworkState;
  scanner: ScannerState;

  setCamera: (camera: Partial<CameraState>) => void;
  setRecording: (recording: Partial<RecordingState>) => void;
  setSession: (session: Partial<SessionState>) => void;
  setUploads: (uploads: Partial<UploadState>) => void;
  setNetwork: (network: Partial<NetworkState>) => void;
  setScanner: (scanner: Partial<ScannerState>) => void;

  addScan: (scan: ScanItem) => void;
  addUpload: (item: UploadItem) => void;
  updateUpload: (id: string, data: Partial<UploadItem>) => void;
  removeUpload: (id: string) => void;

  reset: () => void;
}

export interface RecordingState {
  isRecording: boolean;
  trackingId: string | null;
  duration: number;
  blob: Blob | null;
}

export interface ScannerResult {
  success: boolean;
  trackingId: string;
  message: string;
}

export interface ScannerConfig {
  minLength: number;
  duplicateDelay: number;
  scanTimeout: number;
}

export interface ScanHistoryItem {
  trackingId: string;
  scannedAt: number;
  source: "scanner" | "manual";
}

export interface ScannerStatus {
  connected: boolean;
  type: "usb" | "bluetooth" | "wireless" | "manual";
  lastActivity: number;
}
