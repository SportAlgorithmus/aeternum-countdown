import "@tanstack/react-start/server-only";
import { createHmac, timingSafeEqual } from "node:crypto";
import { deleteCookie, getCookie, getRequest, setCookie } from "@tanstack/react-start/server";

const COOKIE = "aet_vault";
const EMAIL = "palacios.linares.nico@gmail.com";
const PASSWORD = "841005aeternum";
const SECRET = "aeternum-vault-9f3c2e7a6b14d8c0e5f1a2b3c4d5e6f7";
const WEEK = 60 * 60 * 24 * 7;
const LOCK_MS = 15 * 60 * 1000;
const MAX_TRIES = 8;

type Attempt = { n: number; reset: number };
const attempts = new Map<string, Attempt>();

function shaEqual(left: string, right: string): boolean {
  const a = Buffer.from(left);
  const b = Buffer.from(right);
  const len = Math.max(a.length, b.length, 1);
  const aa = Buffer.alloc(len);
  const bb = Buffer.alloc(len);
  a.copy(aa);
  b.copy(bb);
  return timingSafeEqual(aa, bb) && a.length === b.length;
}

function sign(body: string): string {
  const mac = createHmac("sha256", SECRET).update(body).digest("base64url");
  return `${body}.${mac}`;
}

function readToken(token: string | undefined): boolean {
  if (!token) return false;
  const dot = token.lastIndexOf(".");
  if (dot <= 0) return false;
  const body = token.slice(0, dot);
  const mac = token.slice(dot + 1);
  const expected = createHmac("sha256", SECRET).update(body).digest("base64url");
  if (!shaEqual(mac, expected)) return false;
  try {
    const payload = JSON.parse(Buffer.from(body, "base64url").toString("utf8")) as {
      ok?: boolean;
      exp?: number;
    };
    return payload.ok === true && typeof payload.exp === "number" && payload.exp > Date.now();
  } catch {
    return false;
  }
}

function cookieSecure(): boolean {
  try {
    const headers = getRequest().headers;
    const proto = headers.get("x-forwarded-proto")?.split(",")[0]?.trim();
    if (proto) return proto === "https";
    return getRequest().url.startsWith("https:");
  } catch {
    return process.env.NODE_ENV === "production";
  }
}

function cookieBase() {
  return {
    path: "/",
    httpOnly: true,
    sameSite: "lax" as const,
    secure: cookieSecure(),
  };
}

export function clientIp(): string {
  try {
    const headers = getRequest().headers;
    const fwd = headers.get("x-forwarded-for");
    if (fwd) return fwd.split(",")[0]?.trim() || "local";
    return headers.get("x-real-ip") ?? "local";
  } catch {
    return "local";
  }
}

export function isLocked(ip: string): boolean {
  const row = attempts.get(ip);
  return Boolean(row && row.reset > Date.now() && row.n >= MAX_TRIES);
}

export function registerFailure(ip: string): void {
  const now = Date.now();
  const row = attempts.get(ip);
  if (!row || row.reset < now) {
    attempts.set(ip, { n: 1, reset: now + LOCK_MS });
    return;
  }
  row.n += 1;
}

export function clearFailures(ip: string): void {
  attempts.delete(ip);
}

export function credentialsMatch(email: string, password: string): boolean {
  return shaEqual(email.trim().toLowerCase(), EMAIL) && shaEqual(password, PASSWORD);
}

export function isVaultOpen(): boolean {
  return readToken(getCookie(COOKIE));
}

export function openVaultCookie(): void {
  const body = Buffer.from(
    JSON.stringify({ ok: true, exp: Date.now() + WEEK * 1000 }),
    "utf8",
  ).toString("base64url");
  setCookie(COOKIE, sign(body), { ...cookieBase(), maxAge: WEEK });
}

export function closeVaultCookie(): void {
  deleteCookie(COOKIE, cookieBase());
}
