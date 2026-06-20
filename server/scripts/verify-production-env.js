#!/usr/bin/env node
/**
 * Validates production environment variables using the same Zod schema as the API.
 * Usage (from server/):
 *   NODE_ENV=production node scripts/verify-production-env.js
 *   NODE_ENV=production node scripts/verify-production-env.js --deep
 */
import "dotenv/config";
import mongoose from "mongoose";
import { getEnv } from "../config/env.js";
import { getHealthReport } from "../services/health.service.js";

const deep = process.argv.includes("--deep");

function check(label, ok, detail = "") {
  const icon = ok ? "✓" : "✗";
  console.log(`${icon} ${label}${detail ? `: ${detail}` : ""}`);
  return ok;
}

async function main() {
  console.log("Findora production environment verification\n");

  let env;
  try {
    env = getEnv();
    check("Zod env schema", true, `NODE_ENV=${env.NODE_ENV}`);
  } catch (err) {
    check("Zod env schema", false, err.message);
    process.exit(1);
  }

  check("MongoDB URI set", Boolean(env.MONGODB_URI));
  check("JWT secret length", env.JWT_SECRET.length >= 32, `${env.JWT_SECRET.length} chars`);
  check("CLIENT_URL (CORS/Socket.IO)", Boolean(env.CLIENT_URL), env.CLIENT_URL);

  const cloudinaryCount = [
    env.CLOUDINARY_CLOUD_NAME,
    env.CLOUDINARY_API_KEY,
    env.CLOUDINARY_API_SECRET,
  ].filter(Boolean).length;
  check(
    "Cloudinary (all 3 or none)",
    cloudinaryCount === 0 || cloudinaryCount === 3,
    cloudinaryCount === 0 ? "disabled (local uploads)" : "configured"
  );

  check(
    "OpenAI",
    env.AI_MATCHING_MODE === "legacy" || Boolean(env.OPENAI_API_KEY),
    env.OPENAI_API_KEY ? "configured" : env.AI_MATCHING_MODE
  );
  check("Hugging Face", true, env.HF_API_KEY ? "configured" : "optional/disabled");
  check("Redis", true, env.REDIS_URL ? "configured" : "optional/disabled");

  if (!deep) {
    console.log("\nPass --deep to run live service health checks (requires network + running DB).");
    return;
  }

  console.log("\nDeep health checks...");
  try {
    await mongoose.connect(env.MONGODB_URI);
    const report = await getHealthReport({ deep: true });
    for (const [name, svc] of Object.entries(report.services)) {
      check(name, svc.status === "up" || svc.status === "disabled" || svc.status === "skipped", svc.status);
    }
    await mongoose.disconnect();
  } catch (err) {
    check("Deep health", false, err.message);
    process.exit(1);
  }

  console.log("\nAll checks passed.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
