export interface TagLoop {
  id: string;
  prefix: string;
  startTag: string;
  endTag: string;
  total: number;
  available: number;
  used: number;
  createdAt: string;
}

export interface GetTagLoopsResponse {
  success: boolean;
  message: string;
  data: TagLoop[];
}

export interface CreateTagLoopPayload {
  startTag: string;
  total: number;
}

export interface CreateTagLoopResponse {
  success: boolean;
  message: string;
  data: TagLoop;
}

export interface TagLoopDashboard {
  totalLoops: number;
  totalTags: number;
  availableTags: number;
  usedTags: number;
}

export interface TagLoopDashboardResponse {
  success: boolean;
  message: string;
  data: TagLoopDashboard;
}
