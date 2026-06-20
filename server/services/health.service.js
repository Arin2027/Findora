import mongoose from "mongoose";
import { v2 as cloudinary } from "cloudinary";
import { getEnv } from "../config/env.js";
import { getRedis } from "./cache.service.js";
import { isCloudinaryEnabled } from "./cloudinary.service.js";

async function checkMongo() {
  const state = mongoose.connection.readyState;
  if (state !== 1) {
    return { status: "down", detail: `readyState=${state}` };
  }
  try {
    await mongoose.connection.db.admin().ping();
    return { status: "up" };
  } catch (err) {
    return { status: "down", detail: err.message };
  }
}

async function checkRedis() {
  const env = getEnv();
  if (!env.REDIS_URL) {
    return { status: "disabled", detail: "REDIS_URL not set" };
  }
  const redis = getRedis();
  if (!redis) {
    return { status: "down", detail: "client not initialized" };
  }
  try {
    if (redis.status !== "ready") {
      await redis.connect();
    }
    const pong = await redis.ping();
    return pong === "PONG" ? { status: "up" } : { status: "down", detail: pong };
  } catch (err) {
    return { status: "down", detail: err.message };
  }
}

async function checkCloudinary() {
  if (!isCloudinaryEnabled()) {
    return { status: "disabled", detail: "Cloudinary credentials not configured" };
  }
  try {
    await cloudinary.api.ping();
    return { status: "up" };
  } catch (err) {
    return { status: "down", detail: err.message };
  }
}

async function checkOpenAI() {
  const env = getEnv();
  if (!env.OPENAI_API_KEY) {
    return { status: "disabled", detail: "OPENAI_API_KEY not set" };
  }
  if (env.AI_MATCHING_MODE === "legacy") {
    return { status: "skipped", detail: "AI_MATCHING_MODE=legacy" };
  }
  try {
    const res = await fetch("https://api.openai.com/v1/models", {
      headers: { Authorization: `Bearer ${env.OPENAI_API_KEY}` },
      signal: AbortSignal.timeout(5000),
    });
    return res.ok ? { status: "up" } : { status: "down", detail: `HTTP ${res.status}` };
  } catch (err) {
    return { status: "down", detail: err.message };
  }
}

async function checkHuggingFace() {
  const env = getEnv();
  if (!env.HF_API_KEY) {
    return { status: "disabled", detail: "HF_API_KEY not set" };
  }
  if (!env.ENABLE_IMAGE_MATCHING) {
    return { status: "skipped", detail: "ENABLE_IMAGE_MATCHING=false" };
  }
  try {
    const res = await fetch(`https://api-inference.huggingface.co/models/${env.HF_CLIP_MODEL}`, {
      method: "HEAD",
      headers: { Authorization: `Bearer ${env.HF_API_KEY}` },
      signal: AbortSignal.timeout(5000),
    });
    if (res.ok || res.status === 405) {
      return { status: "up" };
    }
    return { status: "down", detail: `HTTP ${res.status}` };
  } catch (err) {
    return { status: "down", detail: err.message };
  }
}

export async function getHealthReport({ deep = false } = {}) {
  const env = getEnv();
  const report = {
    ok: true,
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || "1.0.0",
    environment: env.NODE_ENV,
    aiMode: env.AI_MATCHING_MODE,
    services: {},
  };

  if (deep) {
    const [mongo, redis, cloudinarySvc, openai, huggingface] = await Promise.all([
      checkMongo(),
      checkRedis(),
      checkCloudinary(),
      checkOpenAI(),
      checkHuggingFace(),
    ]);
    report.services = { mongo, redis, cloudinary: cloudinarySvc, openai, huggingface };
    const criticalDown = mongo.status === "down";
    report.ok = !criticalDown;
  } else {
    report.services = {
      mongo: {
        status: mongoose.connection.readyState === 1 ? "up" : "down",
      },
      redis: { status: env.REDIS_URL ? "configured" : "disabled" },
      cloudinary: { status: isCloudinaryEnabled() ? "configured" : "disabled" },
      openai: { status: env.OPENAI_API_KEY ? "configured" : "disabled" },
      huggingface: { status: env.HF_API_KEY ? "configured" : "disabled" },
    };
    report.ok = mongoose.connection.readyState === 1;
  }

  return report;
}
