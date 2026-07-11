export interface VMSItem {
  id: string;

  trackingId: string;

  userId: string;

  operatorId?: string | null;

  operator?: {
  id: string;
  operatorName: string;
  employeeCode: string;
  isActive: boolean;
  isLoggedIn: boolean;
  sessionId: string | null;
  lastSeen: string | null;
};

  videoUrl?: string | null;

  thumbnailUrl?: string | null;

  publicId?: string | null;

  status: "PENDING" | "UPLOADING" | "COMPLETED" | "FAILED";

  duration?: number | null;

  fileSize?: number | null;

  cameraName?: string | null;

  uploadedAt?: string | null;

  createdAt: string;

  updatedAt: string;
}

export interface GetVMSResponse {
  success: boolean;

  message?: string;

  total: number;

  data: VMSItem[];
}