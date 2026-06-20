import fs from "fs";
import path from "path";
import multer from "multer";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");

export function ensureUploadDir() {
  const dir = process.env.UPLOAD_DIR || "uploads";
  const abs = path.isAbsolute(dir) ? dir : path.join(root, dir);
  fs.mkdirSync(abs, { recursive: true });
  return abs;
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, ensureUploadDir());
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname) || ".jpg";
    const safe = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}${ext}`;
    cb(null, safe);
  },
});

const maxSize = Number(process.env.MAX_FILE_SIZE) || 5 * 1024 * 1024;

export const uploadItemImage = multer({
  storage,
  limits: { fileSize: maxSize },
  fileFilter: (_req, file, cb) => {
    const ok = /^image\/(jpeg|png|gif|webp)$/i.test(file.mimetype);
    if (!ok) {
      cb(new Error("Only image files are allowed"));
      return;
    }
    cb(null, true);
  },
});
