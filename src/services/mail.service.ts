import { Resend } from "resend";
import { env } from "../config/env.js";
import { database } from "../db/sql.js";
import {
  adminInviteEmail,
  contactAckEmail,
  contactOpsEmail,
  newsletterEmail,
  orderCustomerEmail,
  orderOpsEmail,
  passwordChangedEmail,
} from "../emails/templates.js";

const resend = env.RESEND_API_KEY ? new Resend(env.RESEND_API_KEY) : null;

async function send(input: { to: string; subject: string; html: string; text: string; replyTo?: string }) {
  if (!input.to.trim()) return false;
  if (!resend) {
    console.info(`[mail] not sent (RESEND_API_KEY missing): to=${input.to} subject=${input.subject}`);
    return false;
  }
  try {
    const { data, error } = await resend.emails.send({
      from: env.EMAIL_FROM,
      to: input.to,
      subject: input.subject,
      html: input.html,
      text: input.text,
      replyTo: input.replyTo,
    });
    if (error) {
      console.error("[mail] Resend rejected", {
        to: input.to,
        subject: input.subject,
        from: env.EMAIL_FROM,
        message: error.message,
      });
      return false;
    }
    console.info(`[mail] sent via Resend id=${data?.id ?? "unknown"} to=${input.to}`);
    return true;
  } catch (error) {
    console.error("[mail] failed", { to: input.to, subject: input.subject, error });
    return false;
  }
}

export async function opsInbox(): Promise<string> {
  const rows = await database.query("SELECT email FROM site_settings WHERE `key` = 'global' LIMIT 1");
  const configured = String(rows[0]?.email ?? "").trim();
  return configured || env.OPS_EMAIL;
}

export async function sendAdminInvite(input: { name: string; email: string; password: string }) {
  return send(adminInviteEmail(input));
}

export async function sendOrderMails(input: {
  reference: string;
  fullName: string;
  email: string;
  phone: string;
  state: string;
  city: string;
  lines: string[];
}) {
  const ops = await opsInbox();
  await send(orderCustomerEmail({ name: input.fullName, email: input.email, reference: input.reference }));
  await send(orderOpsEmail({ to: ops, reference: input.reference, fullName: input.fullName, email: input.email, phone: input.phone, state: input.state, city: input.city, lines: input.lines }));
}

export async function sendContactMails(input: { name: string; email: string; subject: string; message: string }) {
  const ops = await opsInbox();
  await send(contactOpsEmail({ to: ops, ...input }));
  await send(contactAckEmail({ name: input.name, email: input.email }));
}

export async function sendNewsletterMail(email: string) {
  await send(newsletterEmail(email));
}

export async function sendPasswordChanged(input: { name: string; email: string }) {
  await send(passwordChangedEmail(input));
}
