import { env } from "../config/env.js";
import { database } from "./sql.js";
import { pool } from "./pool.js";
import { verifyPassword } from "../utils/passwords.js";

const expected: Record<string, number> = {
  products: 15,
  categories: 11,
  hero_slides: 4,
  distributors: 8,
  pages: 5,
  news_posts: 7,
  career_roles: 3,
  faqs: 6,
};

try {
  const failures: string[] = [];
  for (const [tableName, count] of Object.entries(expected)) {
    const rows = await database.query(`SELECT COUNT(*) AS c FROM \`${tableName}\``);
    const actual = Number(rows[0]?.c ?? 0);
    if (actual < count) failures.push(`${tableName} has ${actual}, expected at least ${count}`);
  }
  const settings = await database.query("SELECT `key` FROM site_settings WHERE `key` = 'global'");
  if (!settings[0]) failures.push("site settings row global is missing");
  const admins = await database.query(
    `SELECT password_hash FROM users WHERE email = ? AND role = 'super_admin' LIMIT 1`,
    [env.SEED_SUPER_ADMIN_EMAIL.trim().toLowerCase()],
  );
  const hash = admins[0]?.password_hash;
  if (!hash || !(await verifyPassword(env.SEED_SUPER_ADMIN_PASSWORD, String(hash)))) {
    failures.push("super admin password does not match SEED_SUPER_ADMIN_PASSWORD");
  }
  if (failures.length) {
    console.error(failures.join("\n"));
    process.exitCode = 1;
  } else {
    console.log("Database verification passed");
  }
} catch (error) {
  console.error("Database verification failed. Start MySQL, then run npm run db:migrate and npm run db:seed.");
  console.error(error);
  process.exitCode = 1;
} finally {
  await pool.end();
}
