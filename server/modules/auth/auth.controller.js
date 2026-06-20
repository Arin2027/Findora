import { asyncHandler } from "../../utils/asyncHandler.js";
import * as authService from "./auth.service.js";

export const register = asyncHandler(async (req, res) => {
  const data = await authService.register(req);
  res.status(201).json(data);
});

export const login = asyncHandler(async (req, res) => {
  res.json(await authService.login(req));
});

export const me = asyncHandler(async (req, res) => {
  res.json(await authService.me(req.user.id));
});

export const refresh = asyncHandler(async (req, res) => {
  res.json(await authService.refresh(req));
});

export const verifyEmail = asyncHandler(async (req, res) => {
  res.json(await authService.verifyEmail(req));
});

export const forgotPassword = asyncHandler(async (req, res) => {
  res.json(await authService.forgotPassword(req));
});

export const resetPassword = asyncHandler(async (req, res) => {
  res.json(await authService.resetPassword(req));
});

export const resendVerification = asyncHandler(async (req, res) => {
  res.json(await authService.resendVerification(req));
});
