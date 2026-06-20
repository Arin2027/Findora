import mongoose from "mongoose";
import { getEnv } from "./env.js";
import { getLogger } from "../utils/logger.js";

export async function connectDB() {
  const { MONGODB_URI } = getEnv();
  mongoose.set("strictQuery", true);
  await mongoose.connect(MONGODB_URI);
  getLogger().info("MongoDB connected");
}
