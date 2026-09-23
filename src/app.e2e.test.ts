import assert from "node:assert/strict";
import test from "node:test";
import request from "supertest";
import { createApp } from "./app.js";
import { pool } from "./db/pool.js";

const app = createApp();

test.after(async () => {
  await pool.end();
});

test("public reads, auth, intake, audit and analytics are wired", async (t) => {
  const health = await request(app).get("/api/v1/health");
  if (health.body?.db !== "up") {
    t.skip("MySQL is not reachable. Start docker compose, then npm run db:migrate and npm run db:seed.");
    return;
  }

  const products = await request(app).get("/api/v1/products");
  assert.equal(products.status, 200, JSON.stringify(products.body));
  assert.ok(Array.isArray(products.body));
  assert.ok(products.body.length >= 15, "seed products are missing");
  const featured = products.body.find((item: { slug: string }) => item.slug === "tydisil-tablet-250mg");
  assert.equal(featured.featured, true);
  assert.equal(featured.gallery.length, 0);

  const missing = await request(app).get("/api/v1/products/does-not-exist");
  assert.equal(missing.status, 404);

  const news = await request(app).get("/api/v1/news/quality-healthcare-within-reach");
  assert.equal(news.status, 200, JSON.stringify(news.body));
  assert.equal(typeof news.body.date, "string");
  assert.equal(typeof news.body.image, "string");

  const categories = await request(app).get("/api/v1/categories");
  assert.equal(categories.body.length >= 11, true);
  const filtered = await request(app).get("/api/v1/products?category=antifungal&featured=true");
  assert.equal(filtered.status, 200);
  assert.ok(filtered.body.some((item: { slug: string }) => item.slug === "tydisil-tablet-250mg"));

  const login = await request(app).post("/api/v1/auth/login").send({
    email: process.env.SEED_SUPER_ADMIN_EMAIL,
    password: process.env.SEED_SUPER_ADMIN_PASSWORD,
  });
  assert.equal(login.status, 200, JSON.stringify(login.body));
  const token = login.body.accessToken as string;
  const cookie = login.headers["set-cookie"];
  assert.ok(cookie);

  const refresh = await request(app).post("/api/v1/auth/refresh").set("Cookie", cookie);
  assert.equal(refresh.status, 200, JSON.stringify(refresh.body));
  assert.equal(typeof refresh.body.accessToken, "string");

  const auth = { Authorization: `Bearer ${token}` };
  const dashboard = await request(app).get("/api/v1/admin/dashboard").set(auth);
  assert.equal(dashboard.status, 200, JSON.stringify(dashboard.body));
  assert.equal(dashboard.body.products >= 15, true);
  assert.equal(typeof dashboard.body.orders.new, "number");

  const created = await request(app).post("/api/v1/admin/products").set(auth).send({
    name: "E2E Draft Tablet",
    category: "Vitamins",
    status: "draft",
    featured: false,
  });
  assert.equal(created.status, 201, JSON.stringify(created.body));
  const removed = await request(app).delete(`/api/v1/admin/products/${created.body.id}`).set(auth);
  assert.equal(removed.status, 204);

  const order = await request(app).post("/api/v1/orders").send({
    full_name: "Ada Okonkwo",
    organization: "City Pharmacy",
    email: "ada@example.com",
    phone: "08030000000",
    state: "Lagos",
    city: "Ikeja",
    address: "12 Adeola Odeku",
    preferred_contact: "Phone call",
    notes: "Call before noon",
    items: [{ id: featured.id, slug: featured.slug, name: featured.name, packSize: featured.pack_size, quantity: 2 }],
  });
  assert.equal(order.status, 201, JSON.stringify(order.body));
  assert.match(order.body.reference, /^OSW-[A-Z0-9]{8}$/);

  const orders = await request(app).get("/api/v1/admin/orders?status=new").set(auth);
  const saved = orders.body.find((row: { reference: string }) => row.reference === order.body.reference);
  assert.ok(saved, JSON.stringify(orders.body));
  assert.equal(saved.item_count, 2);
  assert.equal(saved.createdAt, saved.created_at);
  const patched = await request(app).patch(`/api/v1/admin/orders/${saved.id}`).set(auth).send({ status: "contacted" });
  assert.equal(patched.body.status, "contacted");

  const email = `e2e-${Date.now()}@example.com`;
  const subscribed = await request(app).post("/api/v1/newsletter").send({ email });
  assert.equal(subscribed.status, 201, JSON.stringify(subscribed.body));
  const duplicate = await request(app).post("/api/v1/newsletter").send({ email });
  assert.equal(duplicate.status, 409);

  const viewed = await request(app).post("/api/v1/analytics/page-view").send({ path: "/e2e-check" });
  assert.equal(viewed.status, 202);
  const pages = await request(app).get("/api/v1/admin/analytics/pages").set(auth);
  assert.ok(pages.body.some((row: { path: string }) => row.path === "/e2e-check"));

  const invite = await request(app).post("/api/v1/admin/users").set(auth).send({
    name: "E2E Admin",
    email: `admin-${Date.now()}@example.com`,
    phone: "",
    address: "",
  });
  assert.equal(invite.status, 201, JSON.stringify(invite.body));
  assert.equal(typeof invite.body.temporaryPassword, "string");
  const invitee = await request(app).post("/api/v1/auth/login").send({
    email: invite.body.user.email,
    password: invite.body.temporaryPassword,
  });
  assert.equal(invitee.status, 200, JSON.stringify(invitee.body));
  const deleted = await request(app).delete(`/api/v1/admin/users/${invite.body.user.id}`).set(auth);
  assert.equal(deleted.status, 204);

  const audit = await request(app).get("/api/v1/admin/audit").set(auth);
  assert.equal(audit.status, 200, JSON.stringify(audit.body));
  assert.ok(audit.body.data.some((row: { summary: string }) => row.summary === "Signed in to the dashboard"));
  const blocked = await request(app).delete("/api/v1/admin/audit").set(auth);
  assert.equal(blocked.status, 405);

  const upload = await request(app).post("/api/v1/admin/uploads").set(auth).attach("file", Buffer.from("not-an-image"), {
    filename: "note.txt",
    contentType: "text/plain",
  });
  assert.equal(upload.status, 400);
  const png = Buffer.from(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
    "base64",
  );
  const missingCloud = await request(app)
    .post("/api/v1/admin/uploads")
    .set(auth)
    .attach("file", png, { filename: "pixel.png", contentType: "image/png" });
  assert.equal(missingCloud.status, 503, JSON.stringify(missingCloud.body));

  const contact = await request(app).post("/api/v1/contact").send({
    name: "Ada Okonkwo",
    email: "ada@example.com",
    phone: "08030000000",
    organization: "",
    state: "Lagos",
    subject: "Availability",
    message: "Do you cover Ikeja?",
  });
  assert.equal(contact.status, 201, JSON.stringify(contact.body));
  assert.equal(contact.body.ok, true);

  await request(app).post("/api/v1/auth/logout").set(auth).set("Cookie", cookie);
});
