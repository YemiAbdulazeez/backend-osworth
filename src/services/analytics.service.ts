import { toDateOnly } from "../db/map.js";
import { database } from "../db/sql.js";

export async function trackPage(path: string) {
  await database.exec(
    `INSERT INTO analytics_page_daily (day, path, views) VALUES (UTC_DATE(), ?, 1)
     ON DUPLICATE KEY UPDATE views = views + 1`,
    [path],
  );
}

export async function trackProduct(slug: string) {
  await database.exec(
    `INSERT INTO analytics_product_daily (day, product_slug, views) VALUES (UTC_DATE(), ?, 1)
     ON DUPLICATE KEY UPDATE views = views + 1`,
    [slug],
  );
}

function utcDay(offset: number): string {
  const date = new Date();
  date.setUTCHours(0, 0, 0, 0);
  date.setUTCDate(date.getUTCDate() - offset);
  return date.toISOString().slice(0, 10);
}

export async function overview(daysInput?: number) {
  const days = daysInput ?? 14;
  const [pageTotal, productTotal, pageDays, productDays, topPages, topProducts] = await Promise.all([
    database.query(`SELECT COALESCE(SUM(views), 0) AS views FROM analytics_page_daily`),
    database.query(`SELECT COALESCE(SUM(views), 0) AS views FROM analytics_product_daily`),
    database.query(
      `SELECT day, SUM(views) AS views FROM analytics_page_daily WHERE day >= DATE_SUB(UTC_DATE(), INTERVAL ? DAY) GROUP BY day`,
      [days - 1],
    ),
    database.query(
      `SELECT day, SUM(views) AS views FROM analytics_product_daily WHERE day >= DATE_SUB(UTC_DATE(), INTERVAL ? DAY) GROUP BY day`,
      [days - 1],
    ),
    database.query(`SELECT path, SUM(views) AS views FROM analytics_page_daily GROUP BY path ORDER BY views DESC LIMIT 8`),
    database.query(
      `SELECT product_slug AS slug, SUM(views) AS views FROM analytics_product_daily GROUP BY product_slug ORDER BY views DESC LIMIT 8`,
    ),
  ]);
  const pageMap = new Map(pageDays.map((row) => [toDateOnly(row.day), Number(row.views)]));
  const productMap = new Map(productDays.map((row) => [toDateOnly(row.day), Number(row.views)]));
  const series = Array.from({ length: days }, (_, index) => {
    const day = utcDay(days - 1 - index);
    return { day, pageViews: pageMap.get(day) ?? 0, productViews: productMap.get(day) ?? 0 };
  });
  return {
    totals: {
      pageViews: Number(pageTotal[0]?.views ?? 0),
      productViews: Number(productTotal[0]?.views ?? 0),
    },
    series,
    topPages: topPages.map((row) => ({ path: String(row.path), views: Number(row.views) })),
    topProducts: topProducts.map((row) => ({ slug: String(row.slug), views: Number(row.views) })),
  };
}

export async function topPages() {
  const rows = await database.query(
    `SELECT path, SUM(views) AS views FROM analytics_page_daily GROUP BY path ORDER BY views DESC LIMIT 50`,
  );
  return rows.map((row) => ({ path: String(row.path), views: Number(row.views) }));
}

export async function topProducts() {
  const rows = await database.query(
    `SELECT product_slug AS slug, SUM(views) AS views FROM analytics_product_daily GROUP BY product_slug ORDER BY views DESC LIMIT 50`,
  );
  return rows.map((row) => ({ slug: String(row.slug), views: Number(row.views) }));
}

export async function dashboard() {
  const [products, categories, ordersTotal, ordersNew, messagesTotal, messagesNew, subscribers, news, careers] = await Promise.all([
    count("products"),
    count("categories"),
    count("order_requests"),
    count("order_requests", "status = 'new'"),
    count("contact_messages"),
    count("contact_messages", "status = 'new'"),
    count("newsletter_subscribers", "status = 'subscribed'"),
    count("news_posts"),
    count("career_roles"),
  ]);
  return {
    products,
    categories,
    orders: { total: ordersTotal, new: ordersNew },
    messages: { total: messagesTotal, unread: messagesNew },
    subscribers,
    news,
    careers,
  };
}

async function count(tableName: string, where = "1=1") {
  const allowed = new Set([
    "products",
    "categories",
    "order_requests",
    "contact_messages",
    "newsletter_subscribers",
    "news_posts",
    "career_roles",
  ]);
  if (!allowed.has(tableName)) throw new Error("Unexpected count table");
  const rows = await database.query(`SELECT COUNT(*) AS c FROM \`${tableName}\` WHERE ${where}`);
  return Number(rows[0]?.c ?? 0);
}
