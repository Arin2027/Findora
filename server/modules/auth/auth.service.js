import bcrypt from "bcryptjs";
import crypto from "crypto";
import { validationResult } from "express-validator";
import { User } from "../../models/User.js";
import { AppError } from "../../utils/AppError.js";
import { signAccessToken, signRefreshToken, verifyToken } from "../../utils/jwt.js";
import { sendEmail } from "../../services/email.service.js";
import { getEnv } from "../../config/env.js";
import { AuditLog } from "../../models/AuditLog.js";

function userDto(user) {
  return {
    id: user._id,
    email: user.email,
    role: user.role,
    emailVerified: user.emailVerified,
  };
}

export function validateRequest(req) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) throw AppError.badRequest("Validation failed", errors.array());
}

export async function register(req) {
  validateRequest(req);
  const { email, password } = req.body;
  const existing = await User.findOne({ email: email.toLowerCase() });
  if (existing) throw AppError.conflict("Email already registered");

  const verifyToken = crypto.randomBytes(32).toString("hex");
  const passwordHash = await bcrypt.hash(password, 12);
  const user = await User.create({
    email: email.toLowerCase(),
    passwordHash,
    role: "user",
    emailVerifyToken: verifyToken,
    emailVerifyExpires: new Date(Date.now() + 24 * 60 * 60 * 1000),
  });

  await sendVerificationEmail(user.email, verifyToken);

  const token = signAccessToken(user._id.toString(), user.role);
  const refreshToken = signRefreshToken(user._id.toString(), user.role);
  return { token, refreshToken, user: userDto(user) };
}

export async function login(req) {
  validateRequest(req);
  const { email, password } = req.body;
  const user = await User.findOne({ email: email.toLowerCase() });
  if (!user || user.banned) throw AppError.unauthorized("Invalid email or password");
  if (!(await bcrypt.compare(password, user.passwordHash))) {
    throw AppError.unauthorized("Invalid email or password");
  }
  user.lastActiveAt = new Date();
  await user.save();

  return {
    token: signAccessToken(user._id.toString(), user.role),
    refreshToken: signRefreshToken(user._id.toString(), user.role),
    user: userDto(user),
  };
}

export async function me(userId) {
  const user = await User.findById(userId).select("email role emailVerified banned").lean();
  if (!user || user.banned) throw AppError.notFound("User not found");
  return userDto(user);
}

export async function refresh(req) {
  const { refreshToken } = req.body;
  if (!refreshToken) throw AppError.badRequest("refreshToken required");
  const payload = verifyToken(refreshToken);
  if (payload.type !== "refresh") throw AppError.unauthorized("Invalid refresh token");
  const user = await User.findById(payload.sub);
  if (!user || user.banned) throw AppError.unauthorized("User not found");
  return {
    token: signAccessToken(user._id.toString(), user.role),
    refreshToken: signRefreshToken(user._id.toString(), user.role),
  };
}

export async function verifyEmail(req) {
  const { token } = req.body;
  const user = await User.findOne({
    emailVerifyToken: token,
    emailVerifyExpires: { $gt: new Date() },
  });
  if (!user) throw AppError.badRequest("Invalid or expired verification token");
  user.emailVerified = true;
  user.emailVerifyToken = undefined;
  user.emailVerifyExpires = undefined;
  await user.save();
  return { ok: true, message: "Email verified" };
}

export async function forgotPassword(req) {
  const { email } = req.body;
  const user = await User.findOne({ email: email?.toLowerCase() });
  if (!user) return { ok: true, message: "If that email exists, a reset link was sent" };

  const resetToken = crypto.randomBytes(32).toString("hex");
  user.resetPasswordToken = crypto.createHash("sha256").update(resetToken).digest("hex");
  user.resetPasswordExpires = new Date(Date.now() + 60 * 60 * 1000);
  const otp = String(Math.floor(100000 + Math.random() * 900000));
  user.otpCode = otp;
  user.otpExpires = new Date(Date.now() + 15 * 60 * 1000);
  await user.save();

  const env = getEnv();
  const base = env.APP_URL || env.CLIENT_URL;
  await sendEmail({
    to: user.email,
    subject: "Reset your Findora password",
    text: `Reset link: ${base}/reset-password?token=${resetToken}\nOTP: ${otp} (expires in 15 min)`,
    html: `<p>Reset: <a href="${base}/reset-password?token=${resetToken}">Click here</a></p><p>OTP: <strong>${otp}</strong></p>`,
  });

  return { ok: true, message: "If that email exists, a reset link was sent" };
}

export async function resetPassword(req) {
  const { token, otp, password } = req.body;
  if (!password || password.length < 8) throw AppError.badRequest("Password must be at least 8 characters");

  let user;
  if (otp) {
    user = await User.findOne({ otpCode: otp, otpExpires: { $gt: new Date() } });
  } else if (token) {
    const hashed = crypto.createHash("sha256").update(token).digest("hex");
    user = await User.findOne({
      resetPasswordToken: hashed,
      resetPasswordExpires: { $gt: new Date() },
    });
  }
  if (!user) throw AppError.badRequest("Invalid or expired reset token/OTP");

  user.passwordHash = await bcrypt.hash(password, 12);
  user.resetPasswordToken = undefined;
  user.resetPasswordExpires = undefined;
  user.otpCode = undefined;
  user.otpExpires = undefined;
  await user.save();
  return { ok: true, message: "Password updated" };
}

async function sendVerificationEmail(email, token) {
  const env = getEnv();
  const base = env.APP_URL || env.CLIENT_URL;
  await sendEmail({
    to: email,
    subject: "Verify your Findora email",
    text: `Verify: ${base}/verify-email?token=${token}`,
    html: `<p>Welcome to Findora! <a href="${base}/verify-email?token=${token}">Verify email</a></p>`,
  });
}

export async function resendVerification(req) {
  const user = await User.findById(req.user.id);
  if (!user) throw AppError.notFound("User not found");
  if (user.emailVerified) return { ok: true, message: "Already verified" };
  const verifyToken = crypto.randomBytes(32).toString("hex");
  user.emailVerifyToken = verifyToken;
  user.emailVerifyExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);
  await user.save();
  await sendVerificationEmail(user.email, verifyToken);
  return { ok: true, message: "Verification email sent" };
}

export async function logAudit(actorId, action, targetType, targetId, metadata) {
  await AuditLog.create({ actor: actorId, action, targetType, targetId, metadata });
}
