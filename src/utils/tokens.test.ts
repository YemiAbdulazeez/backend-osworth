import assert from "node:assert/strict";
import test from "node:test";
import { hashToken, orderReference, ttlToMs } from "./tokens.js";

test("order references are OSW- plus 8 uppercase letters or digits", () => {
  const reference = orderReference();
  assert.match(reference, /^OSW-[A-Z0-9]{8}$/);
});

test("refresh hashes are sha256 hex", () => {
  assert.equal(hashToken("abc"), hashToken("abc"));
  assert.equal(hashToken("abc").length, 64);
});

test("ttl strings become milliseconds", () => {
  assert.equal(ttlToMs("15m"), 15 * 60 * 1000);
  assert.equal(ttlToMs("7d"), 7 * 24 * 60 * 60 * 1000);
});
