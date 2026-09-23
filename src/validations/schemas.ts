import { z } from "zod";

const optionalText = (max: number) => z.string().trim().max(max).nullable().optional();
const optionalQuery = z
  .string()
  .trim()
  .optional()
  .transform((value) => (value ? value : undefined));

export const loginSchema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(1).max(200),
  rememberMe: z.boolean().optional().default(false),
});

export const profilePatchSchema = z
  .object({
    name: z.string().trim().min(1).max(255).optional(),
    phone: z.string().trim().max(64).optional(),
    address: z.string().trim().max(5000).optional(),
    avatarUrl: z.string().trim().max(2000).optional(),
    avatar_url: z.string().trim().max(2000).optional(),
    email: z.string().trim().email().max(255).optional(),
  })
  .refine((value) => Object.values(value).some((item) => item !== undefined), {
    message: "No fields to update",
  });

export const passwordSchema = z.object({
  currentPassword: z.string().min(1).max(200),
  newPassword: z.string().min(8).max(200),
});

export const createUserSchema = z.object({
  name: z.string().trim().min(1).max(255),
  email: z.string().trim().email().max(255),
  phone: z.string().trim().max(64).optional().default(""),
  address: z.string().trim().max(5000).optional().default(""),
});

export const productWriteSchema = z.object({
  name: z.string().trim().min(1).max(255),
  slug: z.string().trim().max(255).optional(),
  category: z.string().trim().min(1).max(255),
  subcategory: optionalText(255),
  active_ingredient: optionalText(5000),
  pack_size: optionalText(128),
  short_description: optionalText(5000),
  full_description: z.string().max(200_000).nullable().optional(),
  image_url: optionalText(2000),
  gallery: z.array(z.string().trim().min(1).max(2000)).max(20).optional(),
  featured: z.boolean().optional(),
  status: z.string().trim().min(1).max(32).optional(),
  sort_order: z.number().int().min(0).max(100_000).optional(),
});

export const productPatchSchema = productWriteSchema.partial().refine((value) => Object.keys(value).length > 0, {
  message: "No fields to update",
});

export const categoryWriteSchema = z.object({
  name: z.string().trim().min(1).max(255),
  slug: z.string().trim().max(255).optional(),
  description: optionalText(5000),
  image_url: optionalText(2000),
  icon: optionalText(64),
  status: z.string().trim().min(1).max(32).optional(),
  sort_order: z.number().int().min(0).max(100_000).optional(),
});
export const categoryPatchSchema = categoryWriteSchema.partial().refine((value) => Object.keys(value).length > 0, {
  message: "No fields to update",
});

export const heroWriteSchema = z.object({
  title: z.string().trim().min(1).max(512),
  subtitle: optionalText(512),
  description: optionalText(5000),
  image_url: optionalText(2000),
  cta_label: optionalText(255),
  cta_url: optionalText(512),
  active: z.boolean().optional(),
  sort_order: z.number().int().min(0).max(100_000).optional(),
});
export const heroPatchSchema = heroWriteSchema.partial().refine((value) => Object.keys(value).length > 0, {
  message: "No fields to update",
});
export const heroActiveSchema = z.object({ active: z.boolean() });

export const distributorWriteSchema = z.object({
  name: z.string().trim().min(1).max(255),
  state: z.string().trim().min(1).max(128),
  region: optionalText(128),
  address: optionalText(5000),
  phone: optionalText(64),
  email: z.string().trim().email().max(255).nullable().optional().or(z.literal("")),
  contact_person: optionalText(255),
  status: z.string().trim().min(1).max(32).optional(),
});
export const distributorPatchSchema = distributorWriteSchema.partial().refine((value) => Object.keys(value).length > 0, {
  message: "No fields to update",
});

export const pageWriteSchema = z.object({
  page_key: z.string().trim().min(1).max(64).regex(/^[a-z0-9-]+$/),
  section_key: z.string().trim().min(1).max(64).regex(/^[a-z0-9-]+$/),
  title: optionalText(512),
  subtitle: optionalText(512),
  description: optionalText(20000),
  image_url: optionalText(2000),
  cta_label: optionalText(255),
  cta_url: optionalText(512),
  visible: z.boolean().optional(),
  sort_order: z.number().int().min(0).max(100_000).optional(),
});
export const pagePatchSchema = pageWriteSchema.partial().refine((value) => Object.keys(value).length > 0, {
  message: "No fields to update",
});

export const newsWriteSchema = z.object({
  title: z.string().trim().min(1).max(512),
  slug: z.string().trim().max(255).optional(),
  excerpt: z.string().trim().min(1).max(5000),
  body: z.string().min(1).max(500_000),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  category: z.string().trim().min(1).max(128),
  image: z.string().trim().min(1).max(2000),
  status: z.string().trim().min(1).max(32).optional(),
});
export const newsPatchSchema = newsWriteSchema.partial().refine((value) => Object.keys(value).length > 0, {
  message: "No fields to update",
});

export const careerWriteSchema = z.object({
  title: z.string().trim().min(1).max(255),
  location: z.string().trim().min(1).max(255),
  type: z.string().trim().min(1).max(128),
  summary: z.string().trim().min(1).max(5000),
  status: z.string().trim().min(1).max(32).optional(),
  sort_order: z.number().int().min(0).max(100_000).optional(),
});
export const careerPatchSchema = careerWriteSchema.partial().refine((value) => Object.keys(value).length > 0, {
  message: "No fields to update",
});

export const faqWriteSchema = z.object({
  question: z.string().trim().min(1).max(5000),
  answer: z.string().trim().min(1).max(200_000),
  category: z.string().trim().min(1).max(128),
  status: z.string().trim().min(1).max(32).optional(),
  sort_order: z.number().int().min(0).max(100_000).optional(),
});
export const faqPatchSchema = faqWriteSchema.partial().refine((value) => Object.keys(value).length > 0, {
  message: "No fields to update",
});

export const settingsPatchSchema = z
  .object({
    company_name: optionalText(255),
    hotline: optionalText(64),
    email: z.string().trim().email().max(255).nullable().optional().or(z.literal("")),
    address: optionalText(5000),
    logo_url: optionalText(2000),
    social_facebook: optionalText(512),
    social_instagram: optionalText(512),
    social_linkedin: optionalText(512),
    social_x: optionalText(512),
    newsletter_text: optionalText(5000),
    footer_text: optionalText(512),
    may_and_baker_url: optionalText(512),
    seo_title: optionalText(512),
    seo_description: optionalText(5000),
  })
  .refine((value) => Object.values(value).some((item) => item !== undefined), { message: "No fields to update" });

const orderItemSchema = z.object({
  id: z.string().trim().min(1).max(64),
  slug: z.string().trim().min(1).max(255),
  name: z.string().trim().min(1).max(255),
  packSize: z.string().trim().max(128).nullable().optional(),
  quantity: z.number().int().min(1).max(999),
  notes: z.string().trim().max(2000).optional(),
});

export const orderSchema = z.object({
  full_name: z.string().trim().min(1).max(255),
  organization: z.string().trim().max(255).optional().default(""),
  email: z.string().trim().email().max(255),
  phone: z.string().trim().min(1).max(64),
  state: z.string().trim().min(1).max(128),
  city: z.string().trim().min(1).max(128),
  address: z.string().trim().min(1).max(5000),
  preferred_contact: z.string().trim().max(64).optional().default(""),
  notes: z.string().trim().max(5000).optional().default(""),
  items: z.array(orderItemSchema).min(1).max(50),
});

export const contactSchema = z.object({
  name: z.string().trim().min(1).max(255),
  email: z.string().trim().email().max(255),
  phone: z.string().trim().max(64).optional().default(""),
  organization: z.string().trim().max(255).optional().default(""),
  state: z.string().trim().max(128).optional().default(""),
  subject: z.string().trim().max(512).optional().default(""),
  message: z.string().trim().min(1).max(10000),
});

export const newsletterSchema = z.object({
  email: z.string().trim().email().max(255),
});

export const pageViewSchema = z.object({
  path: z.string().trim().min(1).max(512).regex(/^\/[A-Za-z0-9/_-]*$/),
});

export const productViewSchema = z.object({
  slug: z.string().trim().min(1).max(255).regex(/^[a-z0-9-]+$/),
});

export const orderStatusSchema = z.object({ status: z.enum(["new", "contacted", "closed"]) });
export const messageStatusSchema = z.object({ status: z.enum(["new", "read"]) });
export const subscriberStatusSchema = z.object({ status: z.enum(["subscribed", "unsubscribed"]) });

export const productListQuerySchema = z.object({
  q: optionalQuery,
  category: optionalQuery,
  featured: z.enum(["true", "false", "1", "0"]).optional(),
  sort: z.enum(["sort_order", "name", "newest"]).optional(),
});

export const distributorQuerySchema = z.object({
  state: optionalQuery,
  region: optionalQuery,
});

export const pageQuerySchema = z.object({
  page_key: optionalQuery,
});

export const faqQuerySchema = z.object({
  category: optionalQuery,
});

export const statusQuerySchema = z.object({
  status: optionalQuery,
  q: optionalQuery,
});

export const auditQuerySchema = z.object({
  user: optionalQuery,
  from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  limit: z.coerce.number().int().min(1).max(500).optional(),
  cursor: optionalQuery,
});

export const analyticsDaysSchema = z.object({
  days: z.coerce.number().int().min(1).max(90).optional(),
});

export const uploadFolderSchema = z.object({
  folder: z
    .enum(["osworth/products", "osworth/hero", "osworth/news", "osworth/avatars", "osworth/misc"])
    .optional(),
});
