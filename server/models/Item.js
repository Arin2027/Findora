import mongoose from "mongoose";

const itemSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, default: "" },
    category: { type: String, required: true, trim: true },
    location: { type: String, required: true, trim: true },
    locationAddress: { type: String, default: "" },
    locationGeo: {
      type: { type: String, enum: ["Point"], default: "Point" },
      coordinates: { type: [Number] },
    },
    date: { type: Date, required: true },
    imageUrl: { type: String, default: "" },
    type: { type: String, enum: ["lost", "found"], required: true },
    status: {
      type: String,
      enum: ["open", "matched", "closed"],
      default: "open",
    },
    postedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    flagged: { type: Boolean, default: false },
    flagReason: { type: String, default: "" },
    textEmbedding: { type: [Number], select: false },
    imageEmbedding: { type: [Number], select: false },
    embeddingModel: { type: String },
    imageEmbeddingModel: { type: String },
    embeddingUpdatedAt: { type: Date },
  },
  { timestamps: true }
);

itemSchema.index({ title: "text", description: "text", location: "text" });
itemSchema.index({ category: 1, type: 1, location: 1 });
itemSchema.index({ postedBy: 1 });
itemSchema.index({ locationGeo: "2dsphere" });
itemSchema.index({ status: 1, type: 1 });

export const Item = mongoose.model("Item", itemSchema);
