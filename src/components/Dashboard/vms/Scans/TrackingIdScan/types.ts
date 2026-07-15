export interface TrackingScanItem {
  id: string;

  trackingId: string;

  userId: string;

  operatorId?: string | null;

  accountId?: string | null;

  operator?: {
    id: string;
    operatorName: string;
  };

  account?: {
    id: string;
    accountName: string;
  };

  status: "PENDING" | "UPLOADING" | "COMPLETED" | "FAILED";

  packingScanStatus: "PENDING" | "SCANNED";

  createdAt: string;

  updatedAt: string;

  videoUrl?: string | null;

  thumbnailUrl?: string | null;

  duration?: number | null;

  fileSize?: number | null;
}