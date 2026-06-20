import fs from "fs/promises";
import { isCloudinaryEnabled, uploadBuffer } from "../services/cloudinary.service.js";

export async function cloudinaryUploadMiddleware(req, res, next) {
  if (!req.file || !isCloudinaryEnabled()) return next();
  try {
    const buffer = await fs.readFile(req.file.path);
    const result = await uploadBuffer(buffer);
    if (result?.secure_url) {
      req.cloudinaryUrl = result.secure_url;
    }
  } catch (e) {
    console.warn("[cloudinary] upload failed, using local:", e.message);
  }
  next();
}
