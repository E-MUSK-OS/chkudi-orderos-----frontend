import { api } from "../api";

import {
  ApiResponse,
  ApiResponseWithData,
  SignupRequest,
  LoginRequest,
  LoginResponse,
  SendOtpRequest,
  VerifyOtpRequest,
  VerifyOtpResponse,
  ForgotPasswordRequest,
  ResetPasswordRequest,
  RefreshTokenRequest,
  RefreshTokenResponse,
  LogoutRequest,
  User,
  VerifyOtpApiResponse,
} from "./auth.types";

export const authService = {
  signup(data: SignupRequest) {
    return api.post<ApiResponse>("/auth/signup", data);
  },

  login(data: LoginRequest) {
    return api.post<ApiResponseWithData<LoginResponse>>("/auth/login", data);
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
      data,
    );
  },

  logout(data: LogoutRequest) {
    return api.post<ApiResponse>("/auth/logout", data);
  },

  getMe(token: string) {
    return api.get<ApiResponseWithData<User>>("/auth/me", token);
  },
};
