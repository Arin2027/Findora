import { api } from "./http.js";

export const authApi = {
  register: (data) => api.post("/api/auth/register", data),
  login: (data) => api.post("/api/auth/login", data),
  me: () => api.get("/api/auth/me"),
  refresh: (refreshToken) => api.post("/api/auth/refresh", { refreshToken }),
  verifyEmail: (token) => api.post("/api/auth/verify-email", { token }),
  forgotPassword: (email) => api.post("/api/auth/forgot-password", { email }),
  resetPassword: (data) => api.post("/api/auth/reset-password", data),
  resendVerification: () => api.post("/api/auth/resend-verification"),
};
