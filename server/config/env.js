import { z } from "zod";

const envSchema = z
  .object({
    NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
    PORT: z.coerce.number().default(5001),
    MONGODB_URI: z.string().min(1, "MONGODB_URI is required"),
    JWT_SECRET: z.string().min(8, "JWT_SECRET must be at least 8 characters"),
    JWT_EXPIRES_IN: z.string().default("15m"),
    JWT_REFRESH_EXPIRES_IN: z.string().default("7d"),
    CLIENT_URL: z.string().url("CLIENT_URL must be a valid URL").default("http://localhost:5173"),
    UPLOAD_DIR: z.string().default("uploads"),
    MAX_FILE_SIZE: z.coerce.number().default(5 * 1024 * 1024),
    MATCH_THRESHOLD: z.coerce.number().min(0).max(1).default(0.75),
    MATCH_DEBUG: z
      .string()
      .optional()
      .transform((v) => v === "true"),
    AI_MATCHING_MODE: z.enum(["semantic", "legacy", "hybrid"]).default("hybrid"),
    OPENAI_API_KEY: z.string().optional(),
    EMBEDDING_MODEL: z.string().default("text-embedding-3-small"),
    HF_API_KEY: z.string().optional(),
    HF_CLIP_MODEL: z.string().default("openai/clip-vit-base-patch32"),
    ENABLE_IMAGE_MATCHING: z
      .string()
      .optional()
      .transform((v) => v !== "false"),
    TEXT_MATCH_WEIGHT: z.coerce.number().default(0.4),
    IMAGE_MATCH_WEIGHT: z.coerce.number().default(0.4),
    LOCATION_MATCH_WEIGHT: z.coerce.number().default(0.2),
    LOCATION_MAX_KM: z.coerce.number().default(25),
    CLOUDINARY_CLOUD_NAME: z.string().optional(),
    CLOUDINARY_API_KEY: z.string().optional(),
    CLOUDINARY_API_SECRET: z.string().optional(),
    REDIS_URL: z.string().optional(),
    SMTP_HOST: z.string().optional(),
    SMTP_PORT: z.coerce.number().optional(),
    SMTP_USER: z.string().optional(),
    SMTP_PASS: z.string().optional(),
    SMTP_FROM: z.string().optional(),
    APP_URL: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    const cloudinaryVars = [
      data.CLOUDINARY_CLOUD_NAME,
      data.CLOUDINARY_API_KEY,
      data.CLOUDINARY_API_SECRET,
    ];
    const cloudinarySet = cloudinaryVars.filter(Boolean).length;
    if (cloudinarySet > 0 && cloudinarySet < 3) {
      ctx.addIssue({
        code: "custom",
        message: "Cloudinary requires CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET together",
        path: ["CLOUDINARY_CLOUD_NAME"],
      });
    }

    if (data.NODE_ENV === "production") {
      if (data.JWT_SECRET.length < 32) {
        ctx.addIssue({
          code: "custom",
          message: "JWT_SECRET must be at least 32 characters in production",
          path: ["JWT_SECRET"],
        });
      }
      if (data.JWT_SECRET === "change-me-to-a-long-random-string") {
        ctx.addIssue({
          code: "custom",
          message: "JWT_SECRET must not use the example default in production",
          path: ["JWT_SECRET"],
        });
      }
      if (data.AI_MATCHING_MODE !== "legacy" && !data.OPENAI_API_KEY) {
        ctx.addIssue({
          code: "custom",
          message: "OPENAI_API_KEY is required when AI_MATCHING_MODE is semantic or hybrid in production",
          path: ["OPENAI_API_KEY"],
        });
      }
    }
  });

let cached = null;

export function getEnv() {
  if (!cached) {
    const parsed = envSchema.safeParse(process.env);
    if (!parsed.success) {
      const msg = parsed.error.issues.map((e) => `${e.path.join(".")}: ${e.message}`).join("; ");
      throw new Error(`Environment validation failed: ${msg}`);
    }
    cached = parsed.data;
  }
  return cached;
}
