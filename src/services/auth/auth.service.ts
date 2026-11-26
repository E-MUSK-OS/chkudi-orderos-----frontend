import { api } from "../api";
import { ensureCsrfToken } from "@/utils/auth";

import {
  ApiResponse,
  ApiResponseWithData,
  SignupRequest,
  LoginRequest,
  LoginResponse,
  SendOtpRequest,
  VerifyOtpRequest,
  ForgotPasswordRequest,
  ResetPasswordRequest,
  RefreshTokenRequest,
  RefreshTokenResponse,
  LogoutRequest,
  User,
  VerifyOtpApiResponse,
  StepUpResponse,
  ActiveDeviceSession,
} from "./auth.types";

export const authService = {
  signup(data: SignupRequest) {
    return api.post<ApiResponse>("/auth/signup", data);
  },

  login(data: LoginRequest) {
    return api.post<ApiResponseWithData<LoginResponse>>("/auth/login", data);
  },

  async rememberLogin() {
    const csrfToken = await ensureCsrfToken();
    return api.post<ApiResponseWithData<LoginResponse>>(
      "/auth/remember-login",
      {},
      undefined,
      csrfToken ? { "X-CSRF-Token": csrfToken } : undefined
    );
  },

  async stepUp(password: string) {
    const csrfToken = await ensureCsrfToken();
    return api.post<ApiResponseWithData<StepUpResponse>>(
      "/auth/step-up",
      { password },
      undefined,
      csrfToken ? { "X-CSRF-Token": csrfToken } : undefined
    );
  },

  getSessions() {
    return api.get<ApiResponseWithData<ActiveDeviceSession[]>>("/auth/sessions");
  },

  async revokeSession(id: string) {
    const csrfToken = await ensureCsrfToken();
    return api.delete<ApiResponse>(
      `/auth/sessions/${encodeURIComponent(id)}`,
      undefined,
      csrfToken ? { "X-CSRF-Token": csrfToken } : undefined
    );
  },

  async revokeAllSessions() {
    const csrfToken = await ensureCsrfToken();
    return api.post<ApiResponse>(
      "/auth/sessions/revoke-all",
      {},
      undefined,
      csrfToken ? { "X-CSRF-Token": csrfToken } : undefined
    );
  },

  sendOtp(data: SendOtpRequest) {
    return api.post<ApiResponse>("/auth/send-otp", data);
  },

  verifyOtp(data: VerifyOtpRequest) {
    return api.post<VerifyOtpApiResponse>("/auth/verify-otp", data);
  },

  forgotPassword(data: ForgotPasswordRequest) {
    return api.post<ApiResponse>("/auth/forgot-password", data);
  },

  resetPassword(data: ResetPasswordRequest) {
    return api.post<ApiResponse>("/auth/reset-password", data);
  },

  resendOtp(data: SendOtpRequest) {
    return api.post<ApiResponse>("/auth/resend-otp", data);
  },

  refreshToken(data: RefreshTokenRequest) {
    return api.post<ApiResponseWithData<RefreshTokenResponse>>(
      "/auth/refresh-token",
      data
    );
  },

  async logout(data: LogoutRequest) {
    const csrfToken = await ensureCsrfToken();
    return api.post<ApiResponse>(
      "/auth/logout",
      data,
      undefined,
      csrfToken ? { "X-CSRF-Token": csrfToken } : undefined
    );
  },

  getMe(token: string) {
    return api.get<ApiResponseWithData<User>>("/auth/me", token);
  },
};
