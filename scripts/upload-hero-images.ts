/**
 * Upload local hero images to Cloudinary and set hero_slides.image_url.
 *
 * Usage: npx tsx scripts/upload-hero-images.ts
 */
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { v2 as cloudinary } from "cloudinary";
import { env } from "../src/config/env.js";
import { database } from "../src/db/sql.js";
import { pool } from "../src/db/pool.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FRONTEND_ASSETS = path.resolve(__dirname, "../../osworth-health-hub/src/assets");

/** sort_order → relative path under frontend assets (matches site fallbacks: slides 2 & 3 = African pharmacist) */
const SLIDES: { sort_order: number; file: string; publicId: string }[] = [
  { sort_order: 1, file: "products/all-products.jpeg", publicId: "osworth/hero/slide-1-products" },
  { sort_order: 2, file: "hero-pharmacist.jpg", publicId: "osworth/hero/slide-2-pharmacist" },
  { sort_order: 3, file: "hero-pharmacist.jpg", publicId: "osworth/hero/slide-3-pharmacist" },
  { sort_order: 4, file: "mandbota.jpg", publicId: "osworth/hero/slide-4-may-and-baker" },
];

async function uploadOne(file: string, publicId: string) {
  const filePath = path.join(FRONTEND_ASSETS, file);
  const buffer = await readFile(filePath);

  return new Promise<{ secure_url: string }>((resolve, reject) => {
    cloudinary.uploader
      .upload_stream(
        {
          public_id: publicId,
          overwrite: true,
          invalidate: true,
          resource_type: "image",
        },
        (error, uploaded) => {
          if (error || !uploaded?.secure_url) reject(error ?? new Error("Upload failed"));
          else resolve(uploaded as { secure_url: string });
        },
      )
      .end(buffer);
  });
}

async function main() {
  if (!env.CLOUDINARY_CLOUD_NAME || !env.CLOUDINARY_API_KEY || !env.CLOUDINARY_API_SECRET) {
    throw new Error("Cloudinary env vars are missing");
  }

  cloudinary.config({
    cloud_name: env.CLOUDINARY_CLOUD_NAME,
    api_key: env.CLOUDINARY_API_KEY,
    api_secret: env.CLOUDINARY_API_SECRET,
  });

  console.log("assets", FRONTEND_ASSETS);
  let ok = 0;
  let failed = 0;

  for (const slide of SLIDES) {
    try {
      const { secure_url } = await uploadOne(slide.file, slide.publicId);
      await database.exec(`UPDATE hero_slides SET image_url = ? WHERE sort_order = ?`, [
        secure_url,
        slide.sort_order,
      ]);
      console.log("ok", `slide ${slide.sort_order}`, secure_url);
      ok += 1;
    } catch (error) {
      failed += 1;
      console.error(
        "fail",
        `slide ${slide.sort_order}`,
        error instanceof Error ? error.message : error,
      );
    }
  }

  console.log("done", { ok, failed });
  if (failed > 0) process.exitCode = 1;
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await pool.end();
  });
