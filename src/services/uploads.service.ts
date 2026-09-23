import { v2 as cloudinary } from "cloudinary";
import multer from "multer";
import { env } from "../config/env.js";
import { HttpError } from "../lib/httpError.js";

const ALLOWED = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);
const FOLDERS = new Set(["osworth/products", "osworth/hero", "osworth/news", "osworth/avatars", "osworth/misc"]);

let configured = false;

export const imageUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 4 * 1024 * 1024 },
  fileFilter: (_req, file, callback) => {
    if (!ALLOWED.has(file.mimetype)) {
      callback(new Error("Please choose an image file"));
      return;
    }
    callback(null, true);
  },
});

export function cloudinaryReady(): boolean {
  return Boolean(env.CLOUDINARY_CLOUD_NAME && env.CLOUDINARY_API_KEY && env.CLOUDINARY_API_SECRET);
}

export async function uploadImage(buffer: Buffer, folderInput: string | undefined) {
  if (!cloudinaryReady()) {
    throw new HttpError(503, "UPLOADS_UNAVAILABLE", "Image uploads are not configured. Add Cloudinary credentials.");
  }
  if (!configured) {
    cloudinary.config({
      cloud_name: env.CLOUDINARY_CLOUD_NAME,
      api_key: env.CLOUDINARY_API_KEY,
      api_secret: env.CLOUDINARY_API_SECRET,
    });
    configured = true;
  }
  const folder = folderInput && FOLDERS.has(folderInput) ? folderInput : "osworth/misc";
  const uploaded = await new Promise<{ secure_url: string; public_id: string; width?: number; height?: number }>((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream({ folder, resource_type: "image" }, (error, result) => {
      if (error || !result) reject(error ?? new Error("Upload failed"));
      else resolve(result);
    });
    stream.end(buffer);
  });
  return {
    url: uploaded.secure_url,
    publicId: uploaded.public_id,
    width: uploaded.width ?? null,
    height: uploaded.height ?? null,
    folder,
  };
}
