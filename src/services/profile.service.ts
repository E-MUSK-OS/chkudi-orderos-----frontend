import { api } from "@/services/api";
import type { User } from "@/services/auth/auth.types";

export interface ProfileApiResponse {
  success: boolean;
  message: string;
  data: User;
}

export const profileService = {
  async getProfile(): Promise<User> {
    const res = await api.get<ProfileApiResponse>("/profile");
    if (res?.data) {
      if (typeof window !== "undefined") {
        const existing = localStorage.getItem("user");
        const parsed = existing ? JSON.parse(existing) : {};
        const merged = { ...parsed, ...res.data };
        localStorage.setItem("user", JSON.stringify(merged));
        window.dispatchEvent(new Event("storage"));
        window.dispatchEvent(new Event("user_profile_updated"));
      }
      return res.data;
    }
    throw new Error(res?.message || "Failed to fetch profile");
  },

  async updateProfile(payload: {
    fullName?: string;
    email?: string;
    phone?: string | null;
    avatar?: string | null;
    dob?: string | null;
    gender?: string | null;
  }): Promise<User> {
    const res = await api.patch<ProfileApiResponse>("/profile", payload);
    if (res?.data) {
      if (typeof window !== "undefined") {
        const existing = localStorage.getItem("user");
        const parsed = existing ? JSON.parse(existing) : {};
        const merged = { ...parsed, ...res.data };
        localStorage.setItem("user", JSON.stringify(merged));
        window.dispatchEvent(new Event("storage"));
        window.dispatchEvent(new Event("user_profile_updated"));
      }
      return res.data;
    }
    throw new Error(res?.message || "Failed to update profile");
  },
};
