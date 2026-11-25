/**
 * Upload local pack shots to Cloudinary and set products.image_url.
 * Source: sibling frontend repo src/assets/products.
 *
 * Usage: npx tsx scripts/upload-product-images.ts
 */
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { v2 as cloudinary } from "cloudinary";
import { env } from "../src/config/env.js";
import { database } from "../src/db/sql.js";
import { pool } from "../src/db/pool.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ASSETS = path.resolve(
  __dirname,
  "../../osworth-health-hub/src/assets/products",
);

/** slug → filename under frontend assets/products */
const FILES: Record<string, string> = {
  "tydisil-tablet-250mg": "tydisil-tablet.jpeg",
  "osworth-ciprofloxacin-500mg-tablet": "ciprofloxacin-tablet.jpeg",
  "osworth-metformin-500mg-tablet": "metformin-tablet.jpeg",
  "osworth-diclofenac-75mg-3ml-ampoule": "diclofenac-injection.jpeg",
  "osworth-artemether-80mg-ampoule": "arthemether-injection.jpeg",
  "osworth-gentamicin-injection-80mg-2ml-ampoule": "gentamycin-injection.jpeg",
  "tydineal-cream": "tydineal-cream.jpeg",
  "tydisil-cream": "tydisil-cream.jpeg",
  "tydibact-plus-cream": "tydibact-cream.jpeg",
  "tydiclear-cream": "tydiclear-cream.jpeg",
  "borocare-neem-cream": "borocare-cream.jpeg",
  "anofast-gel": "anofast-cream.jpeg",
  "klaract-cream": "klaract-cream.jpeg",
  "osworth-vitamin-c-syrup": "vitaminc-syrup.jpeg",
  "mb-isopropyl-alcohol": "isoproyl-alcohol.jpeg",
};

async function uploadOne(slug: string, filename: string) {
  const filePath = path.join(ASSETS, filename);
  const buffer = await readFile(filePath);
  const publicId = `osworth/products/${slug}`;

  const result = await new Promise<{ secure_url: string }>((resolve, reject) => {
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

  await database.exec(`UPDATE products SET image_url = ? WHERE slug = ?`, [result.secure_url, slug]);
  return result.secure_url;
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

  console.log("assets", ASSETS);
  let ok = 0;
  let failed = 0;

  for (const [slug, filename] of Object.entries(FILES)) {
    try {
      const url = await uploadOne(slug, filename);
      console.log("ok", slug, url);
      ok += 1;
    } catch (error) {
      failed += 1;
      console.error(
        "fail",
        slug,
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
