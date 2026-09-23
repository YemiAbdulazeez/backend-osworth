import assert from "node:assert/strict";
import test from "node:test";
import { slugify } from "./slugify.js";

test("slugify matches the frontend catalogue rules", () => {
  assert.equal(slugify("TYDISIL TABLET 250MG"), "tydisil-tablet-250mg");
  assert.equal(slugify("  May & Baker  "), "may-baker");
  assert.equal(slugify("---"), "");
});
