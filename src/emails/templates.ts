import { env } from "../config/env.js";

type Mail = { to: string; subject: string; html: string; text: string; replyTo?: string };

function layout(title: string, body: string): string {
  return `<div style="font-family:Arial,sans-serif;line-height:1.5;color:#1f2933"><h1 style="font-size:18px">${title}</h1>${body}<p style="color:#667">Osworth Nigeria Limited</p></div>`;
}

export function adminInviteEmail(input: { name: string; email: string; password: string }): Mail {
  const login = `${env.APP_URL}/login`;
  return {
    to: input.email,
    subject: "Your Osworth admin login details",
    text: `Hello ${input.name},\n\nAn Osworth dashboard account has been created for you.\n\nEmail: ${input.email}\nTemporary password: ${input.password}\n\nSign in at: ${login}\n\nPlease change your password after your first login.`,
    html: layout(
      "Your Osworth admin login",
      `<p>Hello ${escapeHtml(input.name)},</p><p>An Osworth dashboard account has been created for you.</p><p>Email: ${escapeHtml(input.email)}<br>Temporary password: ${escapeHtml(input.password)}</p><p><a href="${login}">Sign in</a> and change your password after your first login.</p>`,
    ),
  };
}

export function orderCustomerEmail(input: { name: string; email: string; reference: string }): Mail {
  return {
    to: input.email,
    subject: `We received your order request ${input.reference}`,
    text: `Hello ${input.name},\n\nWe received your order request. Your reference is ${input.reference}. An Osworth representative will contact you. No payment has been taken.`,
    html: layout(
      "Order request received",
      `<p>Hello ${escapeHtml(input.name)},</p><p>We received your order request. Your reference is <strong>${escapeHtml(input.reference)}</strong>.</p><p>An Osworth representative will contact you. No payment has been taken.</p>`,
    ),
  };
}

export function orderOpsEmail(input: {
  to: string;
  reference: string;
  fullName: string;
  email: string;
  phone: string;
  state: string;
  city: string;
  lines: string[];
}): Mail {
  return {
    to: input.to,
    replyTo: input.email,
    subject: `New order request ${input.reference}`,
    text: `Reference: ${input.reference}\nName: ${input.fullName}\nEmail: ${input.email}\nPhone: ${input.phone}\nLocation: ${input.city}, ${input.state}\n\n${input.lines.join("\n")}`,
    html: layout(
      `New order request ${escapeHtml(input.reference)}`,
      `<p>${escapeHtml(input.fullName)} · ${escapeHtml(input.email)} · ${escapeHtml(input.phone)}</p><p>${escapeHtml(input.city)}, ${escapeHtml(input.state)}</p><ul>${input.lines.map((line) => `<li>${escapeHtml(line)}</li>`).join("")}</ul>`,
    ),
  };
}

export function contactOpsEmail(input: { to: string; name: string; email: string; subject: string; message: string }): Mail {
  return {
    to: input.to,
    replyTo: input.email,
    subject: `New contact message from ${input.name}`,
    text: `From: ${input.name} <${input.email}>\nSubject: ${input.subject}\n\n${input.message}`,
    html: layout(
      "New contact message",
      `<p>${escapeHtml(input.name)} · ${escapeHtml(input.email)}</p><p><strong>${escapeHtml(input.subject || "No subject")}</strong></p><p>${escapeHtml(input.message)}</p>`,
    ),
  };
}

export function contactAckEmail(input: { name: string; email: string }): Mail {
  return {
    to: input.email,
    subject: "We received your message",
    text: `Hello ${input.name},\n\nWe received your message and an Osworth representative will follow up.`,
    html: layout("Message received", `<p>Hello ${escapeHtml(input.name)},</p><p>We received your message and an Osworth representative will follow up.</p>`),
  };
}

export function newsletterEmail(email: string): Mail {
  return {
    to: email,
    subject: "You are subscribed to Osworth updates",
    text: "You are subscribed to product, healthcare and company updates from Osworth Nigeria Limited.",
    html: layout("Subscription confirmed", "<p>You are subscribed to product, healthcare and company updates from Osworth Nigeria Limited.</p>"),
  };
}

export function passwordChangedEmail(input: { name: string; email: string }): Mail {
  return {
    to: input.email,
    subject: "Your Osworth password was changed",
    text: `Hello ${input.name},\n\nThe password on your Osworth dashboard account was just changed. If this was not you, contact the super admin.`,
    html: layout("Password changed", `<p>Hello ${escapeHtml(input.name)},</p><p>The password on your Osworth dashboard account was just changed. If this was not you, contact the super admin.</p>`),
  };
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}
