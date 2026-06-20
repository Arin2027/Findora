import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: ["user", "admin"], default: "user" },
    emailVerified: { type: Boolean, default: false },
    emailVerifyToken: { type: String },
    emailVerifyExpires: { type: Date },
    resetPasswordToken: { type: String },
    resetPasswordExpires: { type: Date },
    otpCode: { type: String },
    otpExpires: { type: Date },
    banned: { type: Boolean, default: false },
    banReason: { type: String, default: "" },
    lastActiveAt: { type: Date },
  },
  { timestamps: true }
);

export const User = mongoose.model("User", userSchema);
