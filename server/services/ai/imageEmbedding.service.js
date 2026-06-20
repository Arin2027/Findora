import { getEnv } from "../../config/env.js";
import { readFile } from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * CLIP image embeddings via HuggingFace Inference API (Phase 4).
 * Returns null if HF_API_KEY missing or request fails — orchestrator reweights scores.
 */
export async function embedImageFromPath(filePath) {
  const env = getEnv();
  if (!env.HF_API_KEY || !env.ENABLE_IMAGE_MATCHING) return null;

  const abs = path.isAbsolute(filePath)
    ? filePath
    : path.join(__dirname, "../../", filePath.replace(/^\//, ""));

  let buffer;
  try {
    buffer = await readFile(abs);
  } catch {
    return null;
  }

  const base64 = buffer.toString("base64");
  const res = await fetch(`https://api-inference.huggingface.co/models/${env.HF_CLIP_MODEL}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.HF_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ inputs: { image: base64 } }),
  });

  if (!res.ok) {
    console.warn("[imageEmbedding] HF API error:", res.status, await res.text().catch(() => ""));
    return null;
  }

  const data = await res.json();
  const vector = Array.isArray(data) ? data[0] : data?.embeddings?.[0] || data;
  if (!Array.isArray(vector)) return null;

  return { vector, model: env.HF_CLIP_MODEL };
}

export async function embedImageFromUrl(imageUrl) {
  if (!imageUrl?.startsWith("http")) return embedImageFromPath(imageUrl);
  const env = getEnv();
  if (!env.HF_API_KEY) return null;
  try {
    const res = await fetch(imageUrl);
    if (!res.ok) return null;
    const buffer = Buffer.from(await res.arrayBuffer());
    const base64 = buffer.toString("base64");
    const hf = await fetch(`https://api-inference.huggingface.co/models/${env.HF_CLIP_MODEL}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.HF_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ inputs: { image: base64 } }),
    });
    if (!hf.ok) return null;
    const data = await hf.json();
    const vector = Array.isArray(data) ? data[0] : data?.embeddings?.[0] || data;
    if (!Array.isArray(vector)) return null;
    return { vector, model: env.HF_CLIP_MODEL };
  } catch (e) {
    console.warn("[imageEmbedding] URL fetch failed:", e.message);
    return null;
  }
}
