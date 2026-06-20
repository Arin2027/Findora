import mongoose from "mongoose";

const matchSchema = new mongoose.Schema(
  {
    itemA: { type: mongoose.Schema.Types.ObjectId, ref: "Item", required: true },
    itemB: { type: mongoose.Schema.Types.ObjectId, ref: "Item", required: true },
    score: { type: Number, required: true, min: 0, max: 1 },
    scoreBreakdown: {
      text: { type: Number },
      image: { type: Number },
      location: { type: Number },
      final: { type: Number },
      mode: { type: String },
    },
    initiatorItem: { type: mongoose.Schema.Types.ObjectId, ref: "Item", required: true },
    status: {
      type: String,
      enum: ["pending", "confirmed", "dismissed"],
      default: "pending",
    },
    claim: {
      status: {
        type: String,
        enum: ["none", "requested", "approved", "rejected"],
        default: "none",
      },
      requestedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      note: { type: String, default: "" },
      reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      reviewedAt: { type: Date },
    },
  },
  { timestamps: true }
);

matchSchema.index({ itemA: 1, itemB: 1 }, { unique: true });
matchSchema.index({ score: -1 });

export const Match = mongoose.model("Match", matchSchema);
