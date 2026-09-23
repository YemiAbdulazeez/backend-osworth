import { Router } from "express";
import { z } from "zod";
import { HttpError } from "../lib/httpError.js";
import { asyncHandler } from "../middleware/asyncHandler.js";
import { requireContentWriter, requireEngagementDelete, requireRole, requireStaff } from "../middleware/auth.js";
import { parseQuery, validateBody } from "../middleware/validate.js";
import { listAudit } from "../services/audit.service.js";
import { dashboard, overview, topPages, topProducts } from "../services/analytics.service.js";
import { changePassword, createAdmin, getProfile, listSessions, listUsers, removeAdmin, revokeSession, updateProfile } from "../services/auth.service.js";
import {
  createCareer,
  createCategory,
  createDistributor,
  createFaq,
  createHero,
  createNews,
  createPage,
  createProduct,
  deleteCareer,
  deleteCategory,
  deleteDistributor,
  deleteFaq,
  deleteHero,
  deleteNews,
  deletePage,
  deleteProduct,
  getAdminProduct,
  getSettings,
  listAdminCareers,
  listAdminCategories,
  listAdminDistributors,
  listAdminFaqs,
  listAdminHero,
  listAdminNews,
  listAdminPages,
  listAdminProducts,
  updateCareer,
  updateCategory,
  updateDistributor,
  updateFaq,
  updateHero,
  updateNews,
  updatePage,
  updateProduct,
  updateSettings,
} from "../services/catalogue.service.js";
import {
  deleteMessage,
  deleteOrder,
  deleteSubscriber,
  listMessages,
  listOrders,
  listSubscribers,
  updateMessageStatus,
  updateOrderStatus,
  updateSubscriber,
} from "../services/engagement.service.js";
import { imageUpload, uploadImage } from "../services/uploads.service.js";
import { withAudit } from "../db/sql.js";
import { clearRefreshCookie } from "../utils/cookies.js";
import {
  analyticsDaysSchema,
  auditQuerySchema,
  careerPatchSchema,
  careerWriteSchema,
  categoryPatchSchema,
  categoryWriteSchema,
  createUserSchema,
  distributorPatchSchema,
  distributorWriteSchema,
  faqPatchSchema,
  faqWriteSchema,
  heroActiveSchema,
  heroPatchSchema,
  heroWriteSchema,
  messageStatusSchema,
  newsPatchSchema,
  newsWriteSchema,
  orderStatusSchema,
  pagePatchSchema,
  pageWriteSchema,
  passwordSchema,
  productPatchSchema,
  productWriteSchema,
  profilePatchSchema,
  settingsPatchSchema,
  statusQuerySchema,
  subscriberStatusSchema,
} from "../validations/schemas.js";

const router = Router();
router.use(requireStaff);

const idSchema = z.string().uuid();

function idOf(value: string | string[] | undefined): string {
  const raw = Array.isArray(value) ? value[0] : value;
  const parsed = idSchema.safeParse(raw);
  if (!parsed.success) throw new HttpError(400, "VALIDATION_ERROR", "Invalid id");
  return parsed.data;
}

router.get("/dashboard", asyncHandler(async (_req, res) => res.json(await dashboard())));

router.get("/profile", asyncHandler(async (req, res) => res.json(await getProfile(req.staff!.id))));
router.patch("/profile", validateBody(profilePatchSchema), asyncHandler(async (req, res) => {
  res.json(await updateProfile(req.staff!, req.body));
}));
router.post("/profile/password", validateBody(passwordSchema), asyncHandler(async (req, res) => {
  await changePassword(req.staff!, req.body.currentPassword, req.body.newPassword);
  res.status(204).end();
}));
router.get("/sessions", asyncHandler(async (req, res) => res.json(await listSessions(req.staff!))));
router.delete("/sessions/:id", asyncHandler(async (req, res) => {
  const result = await revokeSession(req.staff!, idOf(req.params.id));
  if (result.current) clearRefreshCookie(res);
  res.status(204).end();
}));

router.get("/users", requireRole("super_admin"), asyncHandler(async (_req, res) => res.json(await listUsers())));
router.post("/users", requireRole("super_admin"), validateBody(createUserSchema), asyncHandler(async (req, res) => {
  res.status(201).json(await createAdmin(req.staff!, req.body));
}));
router.delete("/users/:id", requireRole("super_admin"), asyncHandler(async (req, res) => {
  await removeAdmin(req.staff!, idOf(req.params.id));
  res.status(204).end();
}));

router.get("/products", asyncHandler(async (req, res) => {
  res.json(await listAdminProducts(parseQuery(statusQuerySchema, req.query)));
}));
router.post("/products", requireContentWriter, validateBody(productWriteSchema), asyncHandler(async (req, res) => {
  res.status(201).json(await createProduct(req.staff!, req.body));
}));
router.get("/products/:id", asyncHandler(async (req, res) => res.json(await getAdminProduct(idOf(req.params.id)))));
router.patch("/products/:id", requireContentWriter, validateBody(productPatchSchema), asyncHandler(async (req, res) => {
  res.json(await updateProduct(req.staff!, idOf(req.params.id), req.body));
}));
router.delete("/products/:id", requireContentWriter, asyncHandler(async (req, res) => {
  await deleteProduct(req.staff!, idOf(req.params.id));
  res.status(204).end();
}));

router.get("/categories", asyncHandler(async (_req, res) => res.json(await listAdminCategories())));
router.post("/categories", requireContentWriter, validateBody(categoryWriteSchema), asyncHandler(async (req, res) => {
  res.status(201).json(await createCategory(req.staff!, req.body));
}));
router.patch("/categories/:id", requireContentWriter, validateBody(categoryPatchSchema), asyncHandler(async (req, res) => {
  res.json(await updateCategory(req.staff!, idOf(req.params.id), req.body));
}));
router.delete("/categories/:id", requireContentWriter, asyncHandler(async (req, res) => {
  await deleteCategory(req.staff!, idOf(req.params.id));
  res.status(204).end();
}));

router.get("/hero-slides", asyncHandler(async (_req, res) => res.json(await listAdminHero())));
router.post("/hero-slides", requireContentWriter, validateBody(heroWriteSchema), asyncHandler(async (req, res) => {
  res.status(201).json(await createHero(req.staff!, req.body));
}));
router.patch("/hero-slides/:id/active", requireContentWriter, validateBody(heroActiveSchema), asyncHandler(async (req, res) => {
  res.json(await updateHero(req.staff!, idOf(req.params.id), { active: req.body.active }));
}));
router.patch("/hero-slides/:id", requireContentWriter, validateBody(heroPatchSchema), asyncHandler(async (req, res) => {
  res.json(await updateHero(req.staff!, idOf(req.params.id), req.body));
}));
router.delete("/hero-slides/:id", requireContentWriter, asyncHandler(async (req, res) => {
  await deleteHero(req.staff!, idOf(req.params.id));
  res.status(204).end();
}));

router.get("/distributors", asyncHandler(async (_req, res) => res.json(await listAdminDistributors())));
router.post("/distributors", requireContentWriter, validateBody(distributorWriteSchema), asyncHandler(async (req, res) => {
  res.status(201).json(await createDistributor(req.staff!, req.body));
}));
router.patch("/distributors/:id", requireContentWriter, validateBody(distributorPatchSchema), asyncHandler(async (req, res) => {
  res.json(await updateDistributor(req.staff!, idOf(req.params.id), req.body));
}));
router.delete("/distributors/:id", requireContentWriter, asyncHandler(async (req, res) => {
  await deleteDistributor(req.staff!, idOf(req.params.id));
  res.status(204).end();
}));

router.get("/pages", asyncHandler(async (_req, res) => res.json(await listAdminPages())));
router.post("/pages", requireContentWriter, validateBody(pageWriteSchema), asyncHandler(async (req, res) => {
  res.status(201).json(await createPage(req.staff!, req.body));
}));
router.patch("/pages/:id", requireContentWriter, validateBody(pagePatchSchema), asyncHandler(async (req, res) => {
  res.json(await updatePage(req.staff!, idOf(req.params.id), req.body));
}));
router.delete("/pages/:id", requireContentWriter, asyncHandler(async (req, res) => {
  await deletePage(req.staff!, idOf(req.params.id));
  res.status(204).end();
}));

router.get("/settings", asyncHandler(async (_req, res) => res.json(await getSettings())));
router.patch("/settings", requireContentWriter, validateBody(settingsPatchSchema), asyncHandler(async (req, res) => {
  res.json(await updateSettings(req.staff!, req.body));
}));

router.get("/news", asyncHandler(async (_req, res) => res.json(await listAdminNews())));
router.post("/news", requireContentWriter, validateBody(newsWriteSchema), asyncHandler(async (req, res) => {
  res.status(201).json(await createNews(req.staff!, req.body));
}));
router.patch("/news/:id", requireContentWriter, validateBody(newsPatchSchema), asyncHandler(async (req, res) => {
  res.json(await updateNews(req.staff!, idOf(req.params.id), req.body));
}));
router.delete("/news/:id", requireContentWriter, asyncHandler(async (req, res) => {
  await deleteNews(req.staff!, idOf(req.params.id));
  res.status(204).end();
}));

router.get("/careers", asyncHandler(async (_req, res) => res.json(await listAdminCareers())));
router.post("/careers", requireContentWriter, validateBody(careerWriteSchema), asyncHandler(async (req, res) => {
  res.status(201).json(await createCareer(req.staff!, req.body));
}));
router.patch("/careers/:id", requireContentWriter, validateBody(careerPatchSchema), asyncHandler(async (req, res) => {
  res.json(await updateCareer(req.staff!, idOf(req.params.id), req.body));
}));
router.delete("/careers/:id", requireContentWriter, asyncHandler(async (req, res) => {
  await deleteCareer(req.staff!, idOf(req.params.id));
  res.status(204).end();
}));

router.get("/faqs", asyncHandler(async (_req, res) => res.json(await listAdminFaqs())));
router.post("/faqs", requireContentWriter, validateBody(faqWriteSchema), asyncHandler(async (req, res) => {
  res.status(201).json(await createFaq(req.staff!, req.body));
}));
router.patch("/faqs/:id", requireContentWriter, validateBody(faqPatchSchema), asyncHandler(async (req, res) => {
  res.json(await updateFaq(req.staff!, idOf(req.params.id), req.body));
}));
router.delete("/faqs/:id", requireContentWriter, asyncHandler(async (req, res) => {
  await deleteFaq(req.staff!, idOf(req.params.id));
  res.status(204).end();
}));

router.get("/orders", asyncHandler(async (req, res) => {
  const query = parseQuery(statusQuerySchema, req.query);
  res.json(await listOrders(query.status));
}));
router.patch("/orders/:id", validateBody(orderStatusSchema), asyncHandler(async (req, res) => {
  res.json(await updateOrderStatus(req.staff!, idOf(req.params.id), req.body.status));
}));
router.delete("/orders/:id", requireEngagementDelete, asyncHandler(async (req, res) => {
  await deleteOrder(req.staff!, idOf(req.params.id));
  res.status(204).end();
}));

router.get("/messages", asyncHandler(async (_req, res) => res.json(await listMessages())));
router.patch("/messages/:id", validateBody(messageStatusSchema), asyncHandler(async (req, res) => {
  res.json(await updateMessageStatus(req.staff!, idOf(req.params.id), req.body.status));
}));
router.delete("/messages/:id", requireEngagementDelete, asyncHandler(async (req, res) => {
  await deleteMessage(req.staff!, idOf(req.params.id));
  res.status(204).end();
}));

router.get("/subscribers", asyncHandler(async (_req, res) => res.json(await listSubscribers())));
router.patch("/subscribers/:id", validateBody(subscriberStatusSchema), asyncHandler(async (req, res) => {
  res.json(await updateSubscriber(req.staff!, idOf(req.params.id), req.body.status));
}));
router.delete("/subscribers/:id", requireEngagementDelete, asyncHandler(async (req, res) => {
  await deleteSubscriber(req.staff!, idOf(req.params.id));
  res.status(204).end();
}));

router.get("/analytics/overview", asyncHandler(async (req, res) => {
  const query = parseQuery(analyticsDaysSchema, req.query);
  res.json(await overview(query.days));
}));
router.get("/analytics/pages", asyncHandler(async (_req, res) => res.json(await topPages())));
router.get("/analytics/products", asyncHandler(async (_req, res) => res.json(await topProducts())));

router.get("/audit", asyncHandler(async (req, res) => {
  res.json(await listAudit(parseQuery(auditQuerySchema, req.query)));
}));
router.delete("/audit", (_req, res) => {
  res.status(405).json({ error: { code: "METHOD_NOT_ALLOWED", message: "Audit logs are permanent and cannot be deleted." } });
});

router.post(
  "/uploads",
  imageUpload.single("file"),
  asyncHandler(async (req, res) => {
    if (!req.file) throw new HttpError(400, "VALIDATION_ERROR", "Choose an image file");
    const folder = typeof req.body?.folder === "string" ? req.body.folder : undefined;
    const uploaded = await uploadImage(req.file.buffer, folder);
    await withAudit(req.staff!, `Uploaded an image to ${uploaded.folder}`, async () => uploaded);
    res.status(201).json({ url: uploaded.url, publicId: uploaded.publicId, width: uploaded.width, height: uploaded.height });
  }),
);

export const adminRouter = router;
