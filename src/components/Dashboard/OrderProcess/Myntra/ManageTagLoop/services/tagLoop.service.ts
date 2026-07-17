import { api } from "@/services/api";

import {
  GetTagLoopsResponse,
  CreateTagLoopPayload,
  CreateTagLoopResponse,
  TagLoopDashboardResponse,
} from "../types";

export const getTagLoops = () => {
  const token = localStorage.getItem("accessToken");

  return api.get<GetTagLoopsResponse>(
    "/tag-loops",
    token || undefined,
  );
};

export const createTagLoop = (
  body: CreateTagLoopPayload,
): Promise<CreateTagLoopResponse> => {
  const token = localStorage.getItem("accessToken");

  return api.post<CreateTagLoopResponse>(
    "/tag-loops",
    body,
    token || undefined,
  );
};

export const getTagLoopDashboard = () => {
  const token = localStorage.getItem("accessToken");

  return api.get<TagLoopDashboardResponse>(
    "/tag-loops/dashboard",
    token || undefined,
  );
};