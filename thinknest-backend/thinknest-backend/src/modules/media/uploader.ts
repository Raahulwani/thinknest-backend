import path from "path";
import fs from "fs";
import multer from "multer";

const UPLOAD_DIR = path.resolve(process.cwd(), "uploads");
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

export const upload = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, UPLOAD_DIR),
    filename: (_req, file, cb) => {
      const ts = Date.now();
      const ext = path.extname(file.originalname || "");
      cb(null, `${ts}-${Math.random().toString(36).slice(2)}${ext}`);
    },
  }),
  limits: { fileSize: 30 * 1024 * 1024 },
});
