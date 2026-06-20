import OpenAI from "openai";
import { getEnv } from "../../config/env.js";

let client = null;

function getClient() {
  const env = getEnv();
  if (!env.OPENAI_API_KEY) return null;
  if (!client) client = new OpenAI({ apiKey: env.OPENAI_API_KEY });
  return client;
}

export function buildItemFeatureText(item) {
  return [item.title, item.description, item.category, item.location, item.locationAddress]
    .filter(Boolean)
    .join(" ");
}

export async function embedText(text) {
  const openai = getClient();
  if (!openai || !text?.trim()) return null;

  const env = getEnv();
  const response = await openai.embeddings.create({
    model: env.EMBEDDING_MODEL,
    input: text.slice(0, 8000),
  });

  return {
    vector: response.data[0].embedding,
    model: env.EMBEDDING_MODEL,
  };
}

export async function embedItemText(item) {
  const text = buildItemFeatureText(item);
  return embedText(text);
}
