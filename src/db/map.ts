export function toIso(value: unknown): string {
  if (value instanceof Date) return value.toISOString();
  const raw = String(value ?? "").trim();
  if (!raw) return new Date(0).toISOString();
  if (raw.endsWith("Z")) {
    const dated = new Date(raw);
    return Number.isNaN(dated.getTime()) ? raw : dated.toISOString();
  }
  const normalised = raw.includes("T") ? raw : raw.replace(" ", "T");
  const dated = new Date(normalised.endsWith("Z") ? normalised : `${normalised}Z`);
  return Number.isNaN(dated.getTime()) ? raw : dated.toISOString();
}

export function toDateOnly(value: unknown): string {
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  return String(value ?? "").slice(0, 10);
}

export function flag(value: unknown): boolean {
  return value === true || value === 1 || value === "1";
}

export function asJson<T>(value: unknown, fallback: T): T {
  if (value == null) return fallback;
  if (typeof value === "string") {
    try {
      return JSON.parse(value) as T;
    } catch {
      return fallback;
    }
  }
  return value as T;
}

export function emptyToNull(value: string | null | undefined): string | null | undefined {
  if (value === undefined) return undefined;
  if (value === null) return null;
  const trimmed = value.trim();
  return trimmed.length ? trimmed : null;
}

export function bit(value: boolean | undefined): number | undefined {
  if (value === undefined) return undefined;
  return value ? 1 : 0;
}
