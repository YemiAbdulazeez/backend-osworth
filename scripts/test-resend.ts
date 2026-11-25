/**
 * Smoke-test Resend with the configured EMAIL_FROM / RESEND_API_KEY.
 * Usage: npx tsx scripts/test-resend.ts [to@example.com]
 */
import { Resend } from "resend";
import { env } from "../src/config/env.js";

async function main() {
  const to = process.argv[2]?.trim() || env.OPS_EMAIL;
  if (!env.RESEND_API_KEY) {
    throw new Error("RESEND_API_KEY is missing");
  }
  const resend = new Resend(env.RESEND_API_KEY);
  console.log("from", env.EMAIL_FROM);
  console.log("to", to);
  const { data, error } = await resend.emails.send({
    from: env.EMAIL_FROM,
    to,
    subject: "Osworth Resend test",
    text: "If you received this, Resend is configured correctly for Osworth.",
    html: "<p>If you received this, Resend is configured correctly for Osworth.</p>",
  });
  if (error) {
    console.error("fail", error.message);
    process.exitCode = 1;
    return;
  }
  console.log("ok", data?.id);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
