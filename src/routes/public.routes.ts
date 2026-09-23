import { Router } from "express";
import { database } from "../db/sql.js";
import { asyncHandler } from "../middleware/asyncHandler.js";
import { parseQuery, validateBody } from "../middleware/validate.js";
import { publicWriteLimit } from "../middleware/rateLimit.js";
import { trackPage, trackProduct } from "../services/analytics.service.js";
import {
  getPublicCategory,
  getPublicNews,
  getPublicPage,
  getPublicProduct,
  getSettings,
  listPublicCareers,
  listPublicCategories,
  listPublicDistributors,
  listPublicFaqs,
  listPublicHero,
  listPublicNews,
  listPublicPages,
  listPublicProducts,
} from "../services/catalogue.service.js";
import { createContact, createOrder, subscribe } from "../services/engagement.service.js";
import {
  contactSchema,
  distributorQuerySchema,
  faqQuerySchema,
  newsletterSchema,
  orderSchema,
  pageQuerySchema,
  pageViewSchema,
  productListQuerySchema,
  productViewSchema,
} from "../validations/schemas.js";

const router = Router();

router.get(
  "/health",
  asyncHandler(async (_req, res) => {
    try {
      await database.query("SELECT 1 AS ok");
      res.json({ ok: true, db: "up" });
    } catch {
      res.status(503).json({ ok: false, db: "down" });
    }
  }),
);

router.get(
  "/products",
  asyncHandler(async (req, res) => {
    res.json(await listPublicProducts(parseQuery(productListQuerySchema, req.query)));
  }),
);
router.get("/products/:slug", asyncHandler(async (req, res) => res.json(await getPublicProduct(String(req.params.slug)))));
router.get("/categories", asyncHandler(async (_req, res) => res.json(await listPublicCategories())));
router.get("/categories/:slug", asyncHandler(async (req, res) => res.json(await getPublicCategory(String(req.params.slug)))));
router.get("/hero-slides", asyncHandler(async (_req, res) => res.json(await listPublicHero())));
router.get(
  "/distributors",
  asyncHandler(async (req, res) => res.json(await listPublicDistributors(parseQuery(distributorQuerySchema, req.query)))),
);
router.get(
  "/pages",
  asyncHandler(async (req, res) => {
    const query = parseQuery(pageQuerySchema, req.query);
    res.json(await listPublicPages(query.page_key));
  }),
);
router.get(
  "/pages/:pageKey/:sectionKey",
  asyncHandler(async (req, res) => res.json(await getPublicPage(String(req.params.pageKey), String(req.params.sectionKey)))),
);
router.get("/settings", asyncHandler(async (_req, res) => res.json(await getSettings())));
router.get("/news", asyncHandler(async (_req, res) => res.json(await listPublicNews())));
router.get("/news/:slug", asyncHandler(async (req, res) => res.json(await getPublicNews(String(req.params.slug)))));
router.get("/careers", asyncHandler(async (_req, res) => res.json(await listPublicCareers())));
router.get(
  "/faqs",
  asyncHandler(async (req, res) => {
    const query = parseQuery(faqQuerySchema, req.query);
    res.json(await listPublicFaqs(query.category));
  }),
);

router.post("/orders", publicWriteLimit, validateBody(orderSchema), asyncHandler(async (req, res) => {
  res.status(201).json(await createOrder(req.body));
}));
router.post("/contact", publicWriteLimit, validateBody(contactSchema), asyncHandler(async (req, res) => {
  res.status(201).json(await createContact(req.body));
}));
router.post("/newsletter", publicWriteLimit, validateBody(newsletterSchema), asyncHandler(async (req, res) => {
  res.status(201).json(await subscribe(req.body.email));
}));
router.post("/analytics/page-view", publicWriteLimit, validateBody(pageViewSchema), asyncHandler(async (req, res) => {
  await trackPage(req.body.path);
  res.status(202).json({ ok: true });
}));
router.post("/analytics/product-view", publicWriteLimit, validateBody(productViewSchema), asyncHandler(async (req, res) => {
  await trackProduct(req.body.slug);
  res.status(202).json({ ok: true });
}));

export const publicRouter = router;
