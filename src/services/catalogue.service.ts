import { asJson, bit, emptyToNull, flag, toDateOnly, toIso } from "../db/map.js";
import { database, requireRow, table, updateById, withAudit, type Db, type SqlRow, type TableName } from "../db/sql.js";
import { HttpError } from "../lib/httpError.js";
import type { StaffActor } from "../types/staff.js";
import { uuid } from "../utils/ids.js";
import { likePattern, slugify } from "../utils/slugify.js";

type SlugTable = "products" | "categories" | "news_posts";

function text(value: string | null | undefined): string | null | undefined {
  return emptyToNull(value);
}

function orNull(value: string | null | undefined): string | null {
  return emptyToNull(value) ?? null;
}

async function ensureSlug(db: Db, name: SlugTable, slug: string, ignoreId?: string) {
  const rows = await db.query(
    ignoreId
      ? `SELECT id FROM \`${table(name)}\` WHERE slug = ? AND id <> ? LIMIT 1`
      : `SELECT id FROM \`${table(name)}\` WHERE slug = ? LIMIT 1`,
    ignoreId ? [slug, ignoreId] : [slug],
  );
  if (rows[0]) throw new HttpError(409, "CONFLICT", "That slug is already in use");
}

function buildSlug(explicit: string | undefined, fallback: string): string {
  const slug = slugify(explicit && explicit.length > 0 ? explicit : fallback);
  if (!slug) throw new HttpError(400, "VALIDATION_ERROR", "Could not build a slug from that name");
  return slug;
}

function mapProduct(row: SqlRow) {
  return {
    id: String(row.id),
    name: String(row.name),
    slug: String(row.slug),
    category: String(row.category),
    subcategory: row.subcategory == null ? null : String(row.subcategory),
    active_ingredient: row.active_ingredient == null ? null : String(row.active_ingredient),
    pack_size: row.pack_size == null ? null : String(row.pack_size),
    short_description: row.short_description == null ? null : String(row.short_description),
    full_description: row.full_description == null ? null : String(row.full_description),
    image_url: row.image_url == null ? null : String(row.image_url),
    gallery: asJson<string[]>(row.gallery, []),
    featured: flag(row.featured),
    status: String(row.status),
    sort_order: Number(row.sort_order),
    created_at: toIso(row.created_at),
  };
}

function mapCategory(row: SqlRow) {
  return {
    id: String(row.id),
    name: String(row.name),
    slug: String(row.slug),
    description: row.description == null ? null : String(row.description),
    image_url: row.image_url == null ? null : String(row.image_url),
    icon: row.icon == null ? null : String(row.icon),
    status: String(row.status),
    sort_order: Number(row.sort_order),
    created_at: toIso(row.created_at),
  };
}

function mapHero(row: SqlRow) {
  return {
    id: String(row.id),
    title: String(row.title),
    subtitle: row.subtitle == null ? null : String(row.subtitle),
    description: row.description == null ? null : String(row.description),
    image_url: row.image_url == null ? null : String(row.image_url),
    cta_label: row.cta_label == null ? null : String(row.cta_label),
    cta_url: row.cta_url == null ? null : String(row.cta_url),
    active: flag(row.active),
    sort_order: Number(row.sort_order),
    created_at: toIso(row.created_at),
  };
}

function mapDistributor(row: SqlRow) {
  return {
    id: String(row.id),
    name: String(row.name),
    state: String(row.state),
    region: row.region == null ? null : String(row.region),
    address: row.address == null ? null : String(row.address),
    phone: row.phone == null ? null : String(row.phone),
    email: row.email == null ? null : String(row.email),
    contact_person: row.contact_person == null ? null : String(row.contact_person),
    status: String(row.status),
    created_at: toIso(row.created_at),
  };
}

function mapPage(row: SqlRow) {
  return {
    id: String(row.id),
    page_key: String(row.page_key),
    section_key: String(row.section_key),
    title: row.title == null ? null : String(row.title),
    subtitle: row.subtitle == null ? null : String(row.subtitle),
    description: row.description == null ? null : String(row.description),
    image_url: row.image_url == null ? null : String(row.image_url),
    cta_label: row.cta_label == null ? null : String(row.cta_label),
    cta_url: row.cta_url == null ? null : String(row.cta_url),
    visible: flag(row.visible),
    sort_order: Number(row.sort_order),
    created_at: toIso(row.created_at),
  };
}

function mapSettings(row: SqlRow) {
  return {
    key: String(row.key),
    company_name: row.company_name == null ? null : String(row.company_name),
    hotline: row.hotline == null ? null : String(row.hotline),
    email: row.email == null ? null : String(row.email),
    address: row.address == null ? null : String(row.address),
    logo_url: row.logo_url == null ? null : String(row.logo_url),
    social_facebook: row.social_facebook == null ? null : String(row.social_facebook),
    social_instagram: row.social_instagram == null ? null : String(row.social_instagram),
    social_linkedin: row.social_linkedin == null ? null : String(row.social_linkedin),
    social_x: row.social_x == null ? null : String(row.social_x),
    newsletter_text: row.newsletter_text == null ? null : String(row.newsletter_text),
    footer_text: row.footer_text == null ? null : String(row.footer_text),
    may_and_baker_url: row.may_and_baker_url == null ? null : String(row.may_and_baker_url),
    seo_title: row.seo_title == null ? null : String(row.seo_title),
    seo_description: row.seo_description == null ? null : String(row.seo_description),
    updated_at: toIso(row.updated_at),
  };
}

function mapNews(row: SqlRow) {
  return {
    id: String(row.id),
    slug: String(row.slug),
    title: String(row.title),
    excerpt: String(row.excerpt),
    body: String(row.body),
    date: toDateOnly(row.published_on),
    category: String(row.category),
    image: String(row.image_url),
    status: String(row.status),
    created_at: toIso(row.created_at),
    updated_at: toIso(row.updated_at),
  };
}

function mapCareer(row: SqlRow) {
  return {
    id: String(row.id),
    title: String(row.title),
    location: String(row.location),
    type: String(row.type),
    summary: String(row.summary),
    status: String(row.status),
    sort_order: Number(row.sort_order),
    created_at: toIso(row.created_at),
  };
}

function mapFaq(row: SqlRow) {
  return {
    id: String(row.id),
    question: String(row.question),
    answer: String(row.answer),
    category: String(row.category),
    status: String(row.status),
    sort_order: Number(row.sort_order),
    created_at: toIso(row.created_at),
  };
}

async function load(name: TableName, id: string, label: string) {
  return requireRow(database, name, id, label);
}

export async function listPublicProducts(query: { q?: string; category?: string; featured?: string; sort?: string }) {
  const where = ["p.status = 'published'"];
  const params: unknown[] = [];
  if (query.q) {
    where.push("(p.name LIKE ? OR IFNULL(p.active_ingredient, '') LIKE ? OR IFNULL(p.short_description, '') LIKE ?)");
    const like = likePattern(query.q);
    params.push(like, like, like);
  }
  if (query.category) {
    where.push("(p.category = ? OR p.category = (SELECT name FROM categories WHERE slug = ? LIMIT 1))");
    params.push(query.category, query.category);
  }
  if (query.featured === "true" || query.featured === "1") where.push("p.featured = 1");
  if (query.featured === "false" || query.featured === "0") where.push("p.featured = 0");
  const order = query.sort === "name" ? "p.name ASC" : query.sort === "newest" ? "p.created_at DESC" : "p.sort_order ASC, p.name ASC";
  const rows = await database.query(`SELECT p.* FROM products p WHERE ${where.join(" AND ")} ORDER BY ${order}`, params);
  return rows.map(mapProduct);
}

export async function getPublicProduct(slug: string) {
  const rows = await database.query(`SELECT * FROM products WHERE slug = ? AND status = 'published' LIMIT 1`, [slug]);
  if (!rows[0]) throw new HttpError(404, "NOT_FOUND", "Product was not found");
  return mapProduct(rows[0]);
}

export async function listAdminProducts(query: { status?: string; q?: string }) {
  const where = ["1=1"];
  const params: unknown[] = [];
  if (query.status) {
    where.push("status = ?");
    params.push(query.status);
  }
  if (query.q) {
    where.push("(name LIKE ? OR slug LIKE ?)");
    const like = likePattern(query.q);
    params.push(like, like);
  }
  const rows = await database.query(`SELECT * FROM products WHERE ${where.join(" AND ")} ORDER BY sort_order ASC, name ASC`, params);
  return rows.map(mapProduct);
}

export async function getAdminProduct(id: string) {
  return mapProduct(await load("products", id, "Product"));
}

type ProductWrite = {
  name: string;
  slug?: string;
  category: string;
  subcategory?: string | null;
  active_ingredient?: string | null;
  pack_size?: string | null;
  short_description?: string | null;
  full_description?: string | null;
  image_url?: string | null;
  gallery?: string[];
  featured?: boolean;
  status?: string;
  sort_order?: number;
};

export async function createProduct(actor: StaffActor, input: ProductWrite) {
  const slug = buildSlug(input.slug, input.name);
  return withAudit(actor, `Created the product "${input.name}"`, async (tx) => {
    await ensureSlug(tx, "products", slug);
    const id = uuid();
    await tx.exec(
      `INSERT INTO products
        (id, name, slug, category, subcategory, active_ingredient, pack_size, short_description, full_description, image_url, gallery, featured, status, sort_order)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        input.name,
        slug,
        input.category,
        orNull(input.subcategory),
        orNull(input.active_ingredient),
        orNull(input.pack_size),
        orNull(input.short_description),
        orNull(input.full_description),
        orNull(input.image_url),
        JSON.stringify(input.gallery ?? []),
        input.featured ? 1 : 0,
        input.status ?? "published",
        input.sort_order ?? 0,
      ],
    );
    return mapProduct(await requireRow(tx, "products", id, "Product"));
  });
}

export async function updateProduct(actor: StaffActor, id: string, input: Partial<ProductWrite>) {
  const existing = await load("products", id, "Product");
  const name = input.name ?? String(existing.name);
  return withAudit(actor, `Updated the product "${name}"`, async (tx) => {
    const nextSlug = input.slug !== undefined ? buildSlug(input.slug, name) : undefined;
    if (nextSlug) await ensureSlug(tx, "products", nextSlug, id);
    await updateById(tx, "products", id, {
      name: input.name,
      slug: nextSlug,
      category: input.category,
      subcategory: text(input.subcategory),
      active_ingredient: text(input.active_ingredient),
      pack_size: text(input.pack_size),
      short_description: text(input.short_description),
      full_description: text(input.full_description),
      image_url: text(input.image_url),
      gallery: input.gallery !== undefined ? JSON.stringify(input.gallery) : undefined,
      featured: bit(input.featured),
      status: input.status,
      sort_order: input.sort_order,
    });
    return mapProduct(await requireRow(tx, "products", id, "Product"));
  });
}

export async function deleteProduct(actor: StaffActor, id: string) {
  const existing = await load("products", id, "Product");
  await withAudit(actor, `Deleted the product "${String(existing.name)}"`, async (tx) => {
    await tx.exec(`DELETE FROM products WHERE id = ?`, [id]);
  });
}

export async function listPublicCategories() {
  const rows = await database.query(`SELECT * FROM categories WHERE status = 'published' ORDER BY sort_order ASC, name ASC`);
  return rows.map(mapCategory);
}

export async function getPublicCategory(slug: string) {
  const rows = await database.query(`SELECT * FROM categories WHERE slug = ? AND status = 'published' LIMIT 1`, [slug]);
  if (!rows[0]) throw new HttpError(404, "NOT_FOUND", "Category was not found");
  return mapCategory(rows[0]);
}

export async function listAdminCategories() {
  const rows = await database.query(`SELECT * FROM categories ORDER BY sort_order ASC, name ASC`);
  return rows.map(mapCategory);
}

type CategoryWrite = {
  name: string;
  slug?: string;
  description?: string | null;
  image_url?: string | null;
  icon?: string | null;
  status?: string;
  sort_order?: number;
};

export async function createCategory(actor: StaffActor, input: CategoryWrite) {
  const slug = buildSlug(input.slug, input.name);
  return withAudit(actor, `Created the category "${input.name}"`, async (tx) => {
    await ensureSlug(tx, "categories", slug);
    const id = uuid();
    await tx.exec(
      `INSERT INTO categories (id, name, slug, description, image_url, icon, status, sort_order) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, input.name, slug, orNull(input.description), orNull(input.image_url), orNull(input.icon), input.status ?? "published", input.sort_order ?? 0],
    );
    return mapCategory(await requireRow(tx, "categories", id, "Category"));
  });
}

export async function updateCategory(actor: StaffActor, id: string, input: Partial<CategoryWrite>) {
  const existing = await load("categories", id, "Category");
  const name = input.name ?? String(existing.name);
  return withAudit(actor, `Updated the category "${name}"`, async (tx) => {
    const nextSlug = input.slug !== undefined ? buildSlug(input.slug, name) : undefined;
    if (nextSlug) await ensureSlug(tx, "categories", nextSlug, id);
    await updateById(tx, "categories", id, {
      name: input.name,
      slug: nextSlug,
      description: text(input.description),
      image_url: text(input.image_url),
      icon: text(input.icon),
      status: input.status,
      sort_order: input.sort_order,
    });
    return mapCategory(await requireRow(tx, "categories", id, "Category"));
  });
}

export async function deleteCategory(actor: StaffActor, id: string) {
  const existing = await load("categories", id, "Category");
  await withAudit(actor, `Deleted the category "${String(existing.name)}"`, async (tx) => {
    await tx.exec(`DELETE FROM categories WHERE id = ?`, [id]);
  });
}

export async function listPublicHero() {
  const rows = await database.query(`SELECT * FROM hero_slides WHERE active = 1 ORDER BY sort_order ASC, created_at ASC`);
  return rows.map(mapHero);
}

export async function listAdminHero() {
  const rows = await database.query(`SELECT * FROM hero_slides ORDER BY sort_order ASC, created_at ASC`);
  return rows.map(mapHero);
}

type HeroWrite = {
  title: string;
  subtitle?: string | null;
  description?: string | null;
  image_url?: string | null;
  cta_label?: string | null;
  cta_url?: string | null;
  active?: boolean;
  sort_order?: number;
};

export async function createHero(actor: StaffActor, input: HeroWrite) {
  return withAudit(actor, `Created the hero slide "${input.title}"`, async (tx) => {
    const id = uuid();
    await tx.exec(
      `INSERT INTO hero_slides (id, title, subtitle, description, image_url, cta_label, cta_url, active, sort_order)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, input.title, orNull(input.subtitle), orNull(input.description), orNull(input.image_url), orNull(input.cta_label), orNull(input.cta_url), input.active === false ? 0 : 1, input.sort_order ?? 0],
    );
    return mapHero(await requireRow(tx, "hero_slides", id, "Hero slide"));
  });
}

export async function updateHero(actor: StaffActor, id: string, input: Partial<HeroWrite>) {
  const existing = await load("hero_slides", id, "Hero slide");
  const title = input.title ?? String(existing.title);
  return withAudit(actor, `Updated the hero slide "${title}"`, async (tx) => {
    await updateById(tx, "hero_slides", id, {
      title: input.title,
      subtitle: text(input.subtitle),
      description: text(input.description),
      image_url: text(input.image_url),
      cta_label: text(input.cta_label),
      cta_url: text(input.cta_url),
      active: bit(input.active),
      sort_order: input.sort_order,
    });
    return mapHero(await requireRow(tx, "hero_slides", id, "Hero slide"));
  });
}

export async function deleteHero(actor: StaffActor, id: string) {
  const existing = await load("hero_slides", id, "Hero slide");
  await withAudit(actor, `Deleted the hero slide "${String(existing.title)}"`, async (tx) => {
    await tx.exec(`DELETE FROM hero_slides WHERE id = ?`, [id]);
  });
}

export async function listPublicDistributors(query: { state?: string; region?: string }) {
  const rows = await database.query(
    `SELECT * FROM distributors
     WHERE status = 'published' AND (? IS NULL OR state = ?) AND (? IS NULL OR region = ?)
     ORDER BY state ASC, name ASC`,
    [query.state ?? null, query.state ?? null, query.region ?? null, query.region ?? null],
  );
  return rows.map(mapDistributor);
}

export async function listAdminDistributors() {
  const rows = await database.query(`SELECT * FROM distributors ORDER BY state ASC, name ASC`);
  return rows.map(mapDistributor);
}

type DistributorWrite = {
  name: string;
  state: string;
  region?: string | null;
  address?: string | null;
  phone?: string | null;
  email?: string | null;
  contact_person?: string | null;
  status?: string;
};

export async function createDistributor(actor: StaffActor, input: DistributorWrite) {
  return withAudit(actor, `Created the distributor "${input.name}"`, async (tx) => {
    const id = uuid();
    await tx.exec(
      `INSERT INTO distributors (id, name, state, region, address, phone, email, contact_person, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, input.name, input.state, orNull(input.region), orNull(input.address), orNull(input.phone), orNull(input.email), orNull(input.contact_person), input.status ?? "published"],
    );
    return mapDistributor(await requireRow(tx, "distributors", id, "Distributor"));
  });
}

export async function updateDistributor(actor: StaffActor, id: string, input: Partial<DistributorWrite>) {
  const existing = await load("distributors", id, "Distributor");
  const name = input.name ?? String(existing.name);
  return withAudit(actor, `Updated the distributor "${name}"`, async (tx) => {
    await updateById(tx, "distributors", id, {
      name: input.name,
      state: input.state,
      region: text(input.region),
      address: text(input.address),
      phone: text(input.phone),
      email: text(input.email),
      contact_person: text(input.contact_person),
      status: input.status,
    });
    return mapDistributor(await requireRow(tx, "distributors", id, "Distributor"));
  });
}

export async function deleteDistributor(actor: StaffActor, id: string) {
  const existing = await load("distributors", id, "Distributor");
  await withAudit(actor, `Deleted the distributor "${String(existing.name)}"`, async (tx) => {
    await tx.exec(`DELETE FROM distributors WHERE id = ?`, [id]);
  });
}

async function ensurePageKeys(db: Db, pageKey: string, sectionKey: string, ignoreId?: string) {
  const rows = await db.query(
    ignoreId
      ? `SELECT id FROM pages WHERE page_key = ? AND section_key = ? AND id <> ? LIMIT 1`
      : `SELECT id FROM pages WHERE page_key = ? AND section_key = ? LIMIT 1`,
    ignoreId ? [pageKey, sectionKey, ignoreId] : [pageKey, sectionKey],
  );
  if (rows[0]) throw new HttpError(409, "CONFLICT", "That page section already exists");
}

export async function listPublicPages(pageKey?: string) {
  const rows = await database.query(
    `SELECT * FROM pages WHERE visible = 1 AND (? IS NULL OR page_key = ?) ORDER BY page_key ASC, sort_order ASC`,
    [pageKey ?? null, pageKey ?? null],
  );
  return rows.map(mapPage);
}

export async function getPublicPage(pageKey: string, sectionKey: string) {
  const rows = await database.query(
    `SELECT * FROM pages WHERE page_key = ? AND section_key = ? AND visible = 1 LIMIT 1`,
    [pageKey, sectionKey],
  );
  if (!rows[0]) throw new HttpError(404, "NOT_FOUND", "Page section was not found");
  return mapPage(rows[0]);
}

export async function listAdminPages() {
  const rows = await database.query(`SELECT * FROM pages ORDER BY page_key ASC, sort_order ASC`);
  return rows.map(mapPage);
}

type PageWrite = {
  page_key: string;
  section_key: string;
  title?: string | null;
  subtitle?: string | null;
  description?: string | null;
  image_url?: string | null;
  cta_label?: string | null;
  cta_url?: string | null;
  visible?: boolean;
  sort_order?: number;
};

export async function createPage(actor: StaffActor, input: PageWrite) {
  return withAudit(actor, `Created the page section ${input.page_key}/${input.section_key}`, async (tx) => {
    await ensurePageKeys(tx, input.page_key, input.section_key);
    const id = uuid();
    await tx.exec(
      `INSERT INTO pages (id, page_key, section_key, title, subtitle, description, image_url, cta_label, cta_url, visible, sort_order)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        input.page_key,
        input.section_key,
        orNull(input.title),
        orNull(input.subtitle),
        orNull(input.description),
        orNull(input.image_url),
        orNull(input.cta_label),
        orNull(input.cta_url),
        input.visible === false ? 0 : 1,
        input.sort_order ?? 0,
      ],
    );
    return mapPage(await requireRow(tx, "pages", id, "Page"));
  });
}

export async function updatePage(actor: StaffActor, id: string, input: Partial<PageWrite>) {
  const existing = await load("pages", id, "Page");
  const pageKey = input.page_key ?? String(existing.page_key);
  const sectionKey = input.section_key ?? String(existing.section_key);
  return withAudit(actor, `Updated the page section ${pageKey}/${sectionKey}`, async (tx) => {
    if (input.page_key !== undefined || input.section_key !== undefined) {
      await ensurePageKeys(tx, pageKey, sectionKey, id);
    }
    await updateById(tx, "pages", id, {
      page_key: input.page_key,
      section_key: input.section_key,
      title: text(input.title),
      subtitle: text(input.subtitle),
      description: text(input.description),
      image_url: text(input.image_url),
      cta_label: text(input.cta_label),
      cta_url: text(input.cta_url),
      visible: bit(input.visible),
      sort_order: input.sort_order,
    });
    return mapPage(await requireRow(tx, "pages", id, "Page"));
  });
}

export async function deletePage(actor: StaffActor, id: string) {
  const existing = await load("pages", id, "Page");
  await withAudit(actor, `Deleted the page section ${String(existing.page_key)}/${String(existing.section_key)}`, async (tx) => {
    await tx.exec(`DELETE FROM pages WHERE id = ?`, [id]);
  });
}

export async function getSettings() {
  const rows = await database.query("SELECT * FROM site_settings WHERE `key` = 'global' LIMIT 1");
  if (!rows[0]) throw new HttpError(404, "NOT_FOUND", "Site settings are not seeded");
  return mapSettings(rows[0]);
}

export async function updateSettings(actor: StaffActor, input: Record<string, string | null | undefined>) {
  await getSettings();
  const allowed = [
    "company_name",
    "hotline",
    "email",
    "address",
    "logo_url",
    "social_facebook",
    "social_instagram",
    "social_linkedin",
    "social_x",
    "newsletter_text",
    "footer_text",
    "may_and_baker_url",
    "seo_title",
    "seo_description",
  ];
  const fields: Record<string, unknown> = {};
  for (const key of allowed) {
    if (input[key] !== undefined) fields[key] = text(input[key]);
  }
  if (Object.keys(fields).length === 0) throw new HttpError(400, "EMPTY_PATCH", "No fields to update");
  await withAudit(actor, "Updated site settings", async (tx) => {
    const keys = Object.keys(fields);
    const assignments = keys.map((key) => `\`${key}\` = ?`).join(", ");
    await tx.exec(`UPDATE site_settings SET ${assignments} WHERE \`key\` = 'global'`, keys.map((key) => fields[key]));
  });
  return getSettings();
}

export async function listPublicNews() {
  const rows = await database.query(`SELECT * FROM news_posts WHERE status = 'published' ORDER BY published_on DESC, title ASC`);
  return rows.map(mapNews);
}

export async function getPublicNews(slug: string) {
  const rows = await database.query(`SELECT * FROM news_posts WHERE slug = ? AND status = 'published' LIMIT 1`, [slug]);
  if (!rows[0]) throw new HttpError(404, "NOT_FOUND", "News article was not found");
  return mapNews(rows[0]);
}

export async function listAdminNews() {
  const rows = await database.query(`SELECT * FROM news_posts ORDER BY published_on DESC, title ASC`);
  return rows.map(mapNews);
}

type NewsWrite = {
  title: string;
  slug?: string;
  excerpt: string;
  body: string;
  date: string;
  category: string;
  image: string;
  status?: string;
};

export async function createNews(actor: StaffActor, input: NewsWrite) {
  const slug = buildSlug(input.slug, input.title);
  return withAudit(actor, `Created the news article "${input.title}"`, async (tx) => {
    await ensureSlug(tx, "news_posts", slug);
    const id = uuid();
    await tx.exec(
      `INSERT INTO news_posts (id, slug, title, excerpt, body, published_on, category, image_url, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, slug, input.title, input.excerpt, input.body, input.date, input.category, input.image, input.status ?? "published"],
    );
    return mapNews(await requireRow(tx, "news_posts", id, "News article"));
  });
}

export async function updateNews(actor: StaffActor, id: string, input: Partial<NewsWrite>) {
  const existing = await load("news_posts", id, "News article");
  const title = input.title ?? String(existing.title);
  return withAudit(actor, `Updated the news article "${title}"`, async (tx) => {
    const nextSlug = input.slug !== undefined ? buildSlug(input.slug, title) : undefined;
    if (nextSlug) await ensureSlug(tx, "news_posts", nextSlug, id);
    await updateById(tx, "news_posts", id, {
      title: input.title,
      slug: nextSlug,
      excerpt: input.excerpt,
      body: input.body,
      published_on: input.date,
      category: input.category,
      image_url: input.image,
      status: input.status,
    });
    return mapNews(await requireRow(tx, "news_posts", id, "News article"));
  });
}

export async function deleteNews(actor: StaffActor, id: string) {
  const existing = await load("news_posts", id, "News article");
  await withAudit(actor, `Deleted the news article "${String(existing.title)}"`, async (tx) => {
    await tx.exec(`DELETE FROM news_posts WHERE id = ?`, [id]);
  });
}

export async function listPublicCareers() {
  const rows = await database.query(`SELECT * FROM career_roles WHERE status = 'published' ORDER BY sort_order ASC, title ASC`);
  return rows.map(mapCareer);
}

export async function listAdminCareers() {
  const rows = await database.query(`SELECT * FROM career_roles ORDER BY sort_order ASC, title ASC`);
  return rows.map(mapCareer);
}

type CareerWrite = { title: string; location: string; type: string; summary: string; status?: string; sort_order?: number };

export async function createCareer(actor: StaffActor, input: CareerWrite) {
  return withAudit(actor, `Created the career role "${input.title}"`, async (tx) => {
    const id = uuid();
    await tx.exec(
      `INSERT INTO career_roles (id, title, location, type, summary, status, sort_order) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [id, input.title, input.location, input.type, input.summary, input.status ?? "published", input.sort_order ?? 0],
    );
    return mapCareer(await requireRow(tx, "career_roles", id, "Career"));
  });
}

export async function updateCareer(actor: StaffActor, id: string, input: Partial<CareerWrite>) {
  const existing = await load("career_roles", id, "Career");
  const title = input.title ?? String(existing.title);
  return withAudit(actor, `Updated the career role "${title}"`, async (tx) => {
    await updateById(tx, "career_roles", id, input);
    return mapCareer(await requireRow(tx, "career_roles", id, "Career"));
  });
}

export async function deleteCareer(actor: StaffActor, id: string) {
  const existing = await load("career_roles", id, "Career");
  await withAudit(actor, `Deleted the career role "${String(existing.title)}"`, async (tx) => {
    await tx.exec(`DELETE FROM career_roles WHERE id = ?`, [id]);
  });
}

export async function listPublicFaqs(category?: string) {
  const rows = await database.query(
    `SELECT * FROM faqs WHERE status = 'published' AND (? IS NULL OR category = ?) ORDER BY sort_order ASC, question ASC`,
    [category ?? null, category ?? null],
  );
  return rows.map(mapFaq);
}

export async function listAdminFaqs() {
  const rows = await database.query(`SELECT * FROM faqs ORDER BY sort_order ASC, question ASC`);
  return rows.map(mapFaq);
}

type FaqWrite = { question: string; answer: string; category: string; status?: string; sort_order?: number };

export async function createFaq(actor: StaffActor, input: FaqWrite) {
  return withAudit(actor, `Created an FAQ in ${input.category}`, async (tx) => {
    const id = uuid();
    await tx.exec(
      `INSERT INTO faqs (id, question, answer, category, status, sort_order) VALUES (?, ?, ?, ?, ?, ?)`,
      [id, input.question, input.answer, input.category, input.status ?? "published", input.sort_order ?? 0],
    );
    return mapFaq(await requireRow(tx, "faqs", id, "FAQ"));
  });
}

export async function updateFaq(actor: StaffActor, id: string, input: Partial<FaqWrite>) {
  await load("faqs", id, "FAQ");
  return withAudit(actor, "Updated an FAQ", async (tx) => {
    await updateById(tx, "faqs", id, input);
    return mapFaq(await requireRow(tx, "faqs", id, "FAQ"));
  });
}

export async function deleteFaq(actor: StaffActor, id: string) {
  await load("faqs", id, "FAQ");
  await withAudit(actor, "Deleted an FAQ", async (tx) => {
    await tx.exec(`DELETE FROM faqs WHERE id = ?`, [id]);
  });
}
