import { env } from "../config/env.js";
import { database } from "./sql.js";
import { pool } from "./pool.js";
import { hashPassword } from "../utils/passwords.js";
import { CAREERS, CATEGORIES, DISTRIBUTORS, FAQS, HERO, NEWS, PAGES, PRODUCTS, SETTINGS, SUPER_ADMIN_ID } from "./seed-data.js";

async function insertIgnore(tableName: string, row: Record<string, unknown>) {
  const keys = Object.keys(row);
  const sql = `INSERT IGNORE INTO \`${tableName}\` (${keys.map((key) => `\`${key}\``).join(", ")}) VALUES (${keys.map(() => "?").join(", ")})`;
  await database.exec(sql, keys.map((key) => row[key]));
}

try {
  const passwordHash = await hashPassword(env.SEED_SUPER_ADMIN_PASSWORD);
  await insertIgnore("users", {
    id: SUPER_ADMIN_ID,
    name: env.SEED_SUPER_ADMIN_NAME,
    email: env.SEED_SUPER_ADMIN_EMAIL.trim().toLowerCase(),
    password_hash: passwordHash,
    phone: "+234 800 000 0000",
    address: "Lagos, Nigeria",
    avatar_url: null,
    role: "super_admin",
  });
  await insertIgnore("site_settings", SETTINGS);
  for (const row of CATEGORIES) await insertIgnore("categories", row);
  for (const row of PRODUCTS) {
    await insertIgnore("products", { ...row, image_url: null, gallery: JSON.stringify([]), status: "published", created_at: "2008-09-01 00:00:00.000" });
  }
  for (const row of HERO) await insertIgnore("hero_slides", row);
  for (const row of DISTRIBUTORS) await insertIgnore("distributors", row);
  for (const row of PAGES) await insertIgnore("pages", row);
  for (const row of NEWS) await insertIgnore("news_posts", row);
  // Refresh seeded news fields for existing rows (insertIgnore skips updates)
  for (const row of NEWS) {
    await database.exec(
      `UPDATE news_posts SET body = ?, excerpt = ?, title = ?, image_url = ? WHERE slug = ?`,
      [row.body, row.excerpt, row.title, row.image_url, row.slug],
    );
  }
  for (const row of CAREERS) await insertIgnore("career_roles", row);
  for (const row of FAQS) await insertIgnore("faqs", row);
  const counts = await database.query(
    `SELECT
      (SELECT COUNT(*) FROM products) AS products,
      (SELECT COUNT(*) FROM categories) AS categories,
      (SELECT COUNT(*) FROM users WHERE role = 'super_admin') AS admins`,
  );
  console.log("Seed complete", counts[0]);
  console.log(`Super admin: ${env.SEED_SUPER_ADMIN_EMAIL}`);
} finally {
  await pool.end();
}
