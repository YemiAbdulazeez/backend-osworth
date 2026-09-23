import { asJson, emptyToNull, toIso } from "../db/map.js";
import { database, requireRow, updateById, withAudit, withTx, type SqlRow } from "../db/sql.js";
import { HttpError } from "../lib/httpError.js";
import type { StaffActor } from "../types/staff.js";
import { uuid } from "../utils/ids.js";
import { orderReference } from "../utils/tokens.js";
import { sendContactMails, sendNewsletterMail, sendOrderMails } from "./mail.service.js";

type OrderInput = {
  full_name: string;
  organization: string;
  email: string;
  phone: string;
  state: string;
  city: string;
  address: string;
  preferred_contact: string;
  notes: string;
  items: { id: string; slug: string; name: string; packSize?: string | null; quantity: number; notes?: string }[];
};

function stamp(row: SqlRow) {
  const createdAt = toIso(row.created_at);
  return { created_at: createdAt, createdAt };
}

function mapOrder(row: SqlRow) {
  return {
    id: String(row.id),
    reference: String(row.reference),
    full_name: String(row.full_name),
    organization: row.organization == null ? "" : String(row.organization),
    email: String(row.email),
    phone: String(row.phone),
    state: row.state == null ? "" : String(row.state),
    city: row.city == null ? "" : String(row.city),
    address: row.address == null ? "" : String(row.address),
    preferred_contact: row.preferred_contact == null ? "" : String(row.preferred_contact),
    notes: row.notes == null ? "" : String(row.notes),
    items: asJson<unknown[]>(row.items, []),
    item_count: Number(row.item_count),
    status: String(row.status),
    ...stamp(row),
  };
}

function mapMessage(row: SqlRow) {
  return {
    id: String(row.id),
    name: String(row.name),
    email: String(row.email),
    phone: row.phone == null ? "" : String(row.phone),
    organization: row.organization == null ? "" : String(row.organization),
    state: row.state == null ? "" : String(row.state),
    subject: row.subject == null ? "" : String(row.subject),
    message: String(row.message),
    status: String(row.status),
    ...stamp(row),
  };
}

function mapSubscriber(row: SqlRow) {
  return {
    id: String(row.id),
    email: String(row.email),
    status: String(row.status),
    ...stamp(row),
  };
}

export async function createOrder(input: OrderInput) {
  const items = input.items.map((item) => ({
    id: item.id,
    slug: item.slug,
    name: item.name,
    packSize: item.packSize ?? null,
    quantity: item.quantity,
    ...(item.notes ? { notes: item.notes } : {}),
  }));
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);
  const order = await withTx(async (tx) => {
    let reference = orderReference();
    for (let attempt = 0; attempt < 5; attempt += 1) {
      const clash = await tx.query(`SELECT id FROM order_requests WHERE reference = ? LIMIT 1`, [reference]);
      if (!clash[0]) break;
      reference = orderReference();
    }
    const id = uuid();
    await tx.exec(
      `INSERT INTO order_requests
        (id, reference, full_name, organization, email, phone, state, city, address, preferred_contact, notes, items, item_count, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'new')`,
      [
        id,
        reference,
        input.full_name,
        emptyToNull(input.organization),
        input.email.trim().toLowerCase(),
        input.phone,
        input.state,
        input.city,
        input.address,
        emptyToNull(input.preferred_contact),
        emptyToNull(input.notes),
        JSON.stringify(items),
        itemCount,
      ],
    );
    return mapOrder(await requireRow(tx, "order_requests", id, "Order"));
  });

  await sendOrderMails({
    reference: order.reference,
    fullName: order.full_name,
    email: order.email,
    phone: order.phone,
    state: order.state,
    city: order.city,
    lines: items.map((item) => `${item.quantity} x ${item.name} (${item.packSize ?? "unspecified pack"})`),
  });
  return { reference: order.reference };
}

export async function createContact(input: {
  name: string;
  email: string;
  phone: string;
  organization: string;
  state: string;
  subject: string;
  message: string;
}) {
  const id = uuid();
  await database.exec(
    `INSERT INTO contact_messages (id, name, email, phone, organization, state, subject, message, status)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'new')`,
    [
      id,
      input.name,
      input.email.trim().toLowerCase(),
      emptyToNull(input.phone),
      emptyToNull(input.organization),
      emptyToNull(input.state),
      emptyToNull(input.subject),
      input.message,
    ],
  );
  await sendContactMails({ name: input.name, email: input.email.trim().toLowerCase(), subject: input.subject, message: input.message });
  return { ok: true as const };
}

export async function subscribe(emailRaw: string) {
  const email = emailRaw.trim().toLowerCase();
  const existing = await database.query(`SELECT id, status FROM newsletter_subscribers WHERE LOWER(email) = ? LIMIT 1`, [email]);
  const row = existing[0];
  if (row && String(row.status) === "subscribed") {
    throw new HttpError(409, "CONFLICT", "This email is already subscribed.");
  }
  if (row) {
    await database.exec(`UPDATE newsletter_subscribers SET status = 'subscribed' WHERE id = ?`, [row.id]);
  } else {
    await database.exec(
      `INSERT INTO newsletter_subscribers (id, email, status) VALUES (?, ?, 'subscribed')`,
      [uuid(), email],
    );
  }
  await sendNewsletterMail(email);
  return { ok: true as const };
}

export async function listOrders(status?: string) {
  const rows = status
    ? await database.query(`SELECT * FROM order_requests WHERE status = ? ORDER BY created_at DESC`, [status])
    : await database.query(`SELECT * FROM order_requests ORDER BY created_at DESC`);
  return rows.map(mapOrder);
}

export async function updateOrderStatus(actor: StaffActor, id: string, status: string) {
  const existing = await requireRow(database, "order_requests", id, "Order request");
  await withAudit(actor, `Marked order request ${String(existing.reference)} as ${status}`, async (tx) => {
    await updateById(tx, "order_requests", id, { status });
  });
  return mapOrder(await requireRow(database, "order_requests", id, "Order request"));
}

export async function deleteOrder(actor: StaffActor, id: string) {
  const existing = await requireRow(database, "order_requests", id, "Order request");
  await withAudit(actor, `Deleted order request ${String(existing.reference)}`, async (tx) => {
    await tx.exec(`DELETE FROM order_requests WHERE id = ?`, [id]);
  });
}

export async function listMessages() {
  const rows = await database.query(`SELECT * FROM contact_messages ORDER BY created_at DESC`);
  return rows.map(mapMessage);
}

export async function updateMessageStatus(actor: StaffActor, id: string, status: string) {
  const existing = await requireRow(database, "contact_messages", id, "Message");
  await withAudit(actor, `Marked contact message from ${String(existing.name)} as ${status}`, async (tx) => {
    await updateById(tx, "contact_messages", id, { status });
  });
  return mapMessage(await requireRow(database, "contact_messages", id, "Message"));
}

export async function deleteMessage(actor: StaffActor, id: string) {
  const existing = await requireRow(database, "contact_messages", id, "Message");
  await withAudit(actor, `Deleted contact message from ${String(existing.name)}`, async (tx) => {
    await tx.exec(`DELETE FROM contact_messages WHERE id = ?`, [id]);
  });
}

export async function listSubscribers() {
  const rows = await database.query(`SELECT * FROM newsletter_subscribers ORDER BY created_at DESC`);
  return rows.map(mapSubscriber);
}

export async function updateSubscriber(actor: StaffActor, id: string, status: string) {
  const existing = await requireRow(database, "newsletter_subscribers", id, "Subscriber");
  await withAudit(actor, `Updated subscriber ${String(existing.email)} to ${status}`, async (tx) => {
    await updateById(tx, "newsletter_subscribers", id, { status });
  });
  return mapSubscriber(await requireRow(database, "newsletter_subscribers", id, "Subscriber"));
}

export async function deleteSubscriber(actor: StaffActor, id: string) {
  const existing = await requireRow(database, "newsletter_subscribers", id, "Subscriber");
  await withAudit(actor, `Removed subscriber ${String(existing.email)}`, async (tx) => {
    await tx.exec(`DELETE FROM newsletter_subscribers WHERE id = ?`, [id]);
  });
}
