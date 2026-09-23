import assert from "node:assert/strict";
import test from "node:test";
import { contactSchema, newsletterSchema, orderSchema } from "./schemas.js";

test("order payload matches the checkout form", () => {
  const parsed = orderSchema.parse({
    full_name: "Ada Okonkwo",
    organization: "City Pharmacy",
    email: "ada@example.com",
    phone: "08030000000",
    state: "Lagos",
    city: "Ikeja",
    address: "12 Adeola Odeku",
    preferred_contact: "Phone call",
    notes: "",
    items: [{ id: "p1", slug: "tydisil-tablet-250mg", name: "TYDISIL TABLET 250MG", packSize: "2 x 7 tablets", quantity: 2, notes: "" }],
  });
  assert.equal(parsed.items[0]?.quantity, 2);
});

test("contact requires a message", () => {
  const result = contactSchema.safeParse({ name: "Ada", email: "ada@example.com", message: "" });
  assert.equal(result.success, false);
});

test("newsletter rejects a bad email", () => {
  assert.equal(newsletterSchema.safeParse({ email: "not-an-email" }).success, false);
});
