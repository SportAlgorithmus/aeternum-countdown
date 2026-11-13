import "@tanstack/react-start/server-only";
import { getSql } from "@/lib/db";
import { ceremonySchema, defaultCeremony, mergeCeremony, withInstant, type Ceremony } from "@/lib/ceremony";
import {
  clearFailures,
  clientIp,
  closeVaultCookie,
  credentialsMatch,
  isLocked,
  isVaultOpen,
  openVaultCookie,
  registerFailure,
} from "@/lib/vault.server";

export type HomePayload = {
  ceremony: Ceremony;
  admin: boolean;
  updatedAt: string | null;
};

function asPayload(value: unknown): unknown {
  if (typeof value === "string") {
    try {
      return JSON.parse(value) as unknown;
    } catch {
      return {};
    }
  }
  return value ?? {};
}

function stamp(value: unknown): string | null {
  if (value instanceof Date) return value.toISOString();
  if (typeof value === "string" && value) return value;
  return null;
}

export async function readHome(): Promise<HomePayload> {
  try {
    const sql = await getSql();
    const rows = await sql<{ payload: unknown; updated_at: unknown }>`
      select payload, updated_at from ceremony_settings where id = 1
    `;
    if (!rows.length) {
      return { ceremony: defaultCeremony(), admin: isVaultOpen(), updatedAt: null };
    }
    return {
      ceremony: mergeCeremony(asPayload(rows[0].payload)),
      admin: isVaultOpen(),
      updatedAt: stamp(rows[0].updated_at),
    };
  } catch (error) {
    console.error("ceremony read failed", error);
    return { ceremony: defaultCeremony(), admin: false, updatedAt: null };
  }
}

export async function enterVault(email: string, password: string): Promise<{ ok: true } | { ok: false; error: string }> {
  const ip = clientIp();
  if (isLocked(ip)) return { ok: false, error: "Demasiados intentos. Espera un momento." };
  if (!credentialsMatch(email, password)) {
    registerFailure(ip);
    return { ok: false, error: "Esos datos no coinciden." };
  }
  clearFailures(ip);
  openVaultCookie();
  return { ok: true };
}

export async function leaveVault(): Promise<{ ok: true }> {
  closeVaultCookie();
  return { ok: true };
}

export async function saveCeremony(input: unknown): Promise<{ ok: true; ceremony: Ceremony } | { ok: false; error: string }> {
  if (!isVaultOpen()) return { ok: false, error: "La sesión no es válida." };
  const parsed = ceremonySchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Revisa los campos e inténtalo de nuevo." };
  const ceremony = withInstant(parsed.data);
  const sql = await getSql();
  await sql.query(
    `insert into ceremony_settings (id, payload, updated_at)
     values (1, $1::jsonb, now())
     on conflict (id) do update set payload = excluded.payload, updated_at = now()`,
    [JSON.stringify(ceremony)],
  );
  return { ok: true, ceremony };
}
