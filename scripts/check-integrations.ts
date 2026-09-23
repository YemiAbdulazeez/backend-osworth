import { env } from "../src/config/env.js";
import { v2 as cloudinary } from "cloudinary";
import { Resend } from "resend";

async function main() {
  console.log("resend_key_set", Boolean(env.RESEND_API_KEY));
  console.log("cloudinary_set", Boolean(env.CLOUDINARY_CLOUD_NAME && env.CLOUDINARY_API_KEY && env.CLOUDINARY_API_SECRET));
  console.log("email_from", env.EMAIL_FROM);
  console.log("ops_email", env.OPS_EMAIL);

  cloudinary.config({
    cloud_name: env.CLOUDINARY_CLOUD_NAME,
    api_key: env.CLOUDINARY_API_KEY,
    api_secret: env.CLOUDINARY_API_SECRET,
  });

  try {
    await cloudinary.api.ping();
    console.log("cloudinary_ping", "ok");
  } catch (error) {
    const message =
      typeof error === "object" && error && "error" in error
        ? String((error as { error?: { message?: string } }).error?.message)
        : error instanceof Error
          ? error.message
          : String(error);
    console.log("cloudinary_ping", "fail", message);
  }

  const resend = new Resend(env.RESEND_API_KEY);
  const domains = await resend.domains.list();
  console.log("resend_api", domains.error ? `fail: ${domains.error.message}` : "ok");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
