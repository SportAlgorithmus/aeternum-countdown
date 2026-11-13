import { z } from "zod";

export const TIME_ZONES = [
  { id: "America/Bogota", label: "Colombia (Bogotá)" },
  { id: "America/Lima", label: "Perú (Lima)" },
  { id: "America/Mexico_City", label: "México (Ciudad de México)" },
  { id: "America/Chicago", label: "Centro de EE.UU. / México norte" },
  { id: "America/New_York", label: "Este de EE.UU." },
  { id: "America/Santiago", label: "Chile (Santiago)" },
  { id: "America/Argentina/Buenos_Aires", label: "Argentina (Buenos Aires)" },
  { id: "Europe/Madrid", label: "España (Madrid)" },
] as const;

const zoneIds = TIME_ZONES.map((zone) => zone.id) as [
  (typeof TIME_ZONES)[number]["id"],
  ...(typeof TIME_ZONES)[number]["id"][],
];

export const ceremonySchema = z.object({
  promotion: z.string().trim().min(1).max(40),
  grade: z.string().trim().min(1).max(40),
  headline: z.string().trim().min(1).max(32),
  comingLine: z.string().trim().min(1).max(48),
  venue: z.string().trim().max(80),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  time: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/),
  timeZone: z.enum(zoneIds),
  lines: z.array(z.string().trim().min(1).max(48)).min(1).max(8),
  finaleKicker: z.string().trim().max(80),
  finaleTitle: z.string().trim().min(1).max(80),
  finaleBody: z.string().trim().min(1).max(2500),
  finaleSign: z.string().trim().max(160),
  accent: z.enum(["emerald", "crimson", "auto"]),
});

export type CeremonyInput = z.infer<typeof ceremonySchema>;
export type Ceremony = CeremonyInput & { whenIso: string };

export type Remain = {
  months: number;
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  done: boolean;
  totalMs: number;
};

const MONTHS_ES = [
  "enero",
  "febrero",
  "marzo",
  "abril",
  "mayo",
  "junio",
  "julio",
  "agosto",
  "septiembre",
  "octubre",
  "noviembre",
  "diciembre",
];

const MONTH_SECONDS = 30 * 24 * 60 * 60;

function wallParts(date: Date, timeZone: string) {
  const fmt = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
  const map: Record<string, string> = {};
  for (const part of fmt.formatToParts(date)) map[part.type] = part.value;
  return {
    year: Number(map.year),
    month: Number(map.month),
    day: Number(map.day),
    hour: Number(map.hour) % 24,
    minute: Number(map.minute),
    second: Number(map.second),
  };
}

/** Wall-clock date and time in an IANA zone, as a UTC instant. */
export function zonedTimeToUtc(date: string, time: string, timeZone: string): string {
  const [y, m, d] = date.split("-").map(Number);
  const [hh, mm] = time.split(":").map(Number);
  const wantedUtc = Date.UTC(y, m - 1, d, hh, mm, 0);
  let utc = wantedUtc;
  for (let i = 0; i < 4; i += 1) {
    const parts = wallParts(new Date(utc), timeZone);
    const asUtc = Date.UTC(
      parts.year,
      parts.month - 1,
      parts.day,
      parts.hour,
      parts.minute,
      parts.second,
    );
    const delta = wantedUtc - asUtc;
    utc += delta;
    if (delta === 0) break;
  }
  const instant = new Date(utc);
  if (Number.isNaN(instant.getTime())) throw new Error("Fecha inválida");
  return instant.toISOString();
}

export function withInstant(input: CeremonyInput): Ceremony {
  return { ...input, whenIso: zonedTimeToUtc(input.date, input.time, input.timeZone) };
}

export function defaultInput(): CeremonyInput {
  return {
    promotion: "Aeternum",
    grade: "Grado 11",
    headline: "Aeternum",
    comingLine: "Se acerca",
    venue: "Ceremonia de grado",
    date: "2026-12-05",
    time: "10:00",
    timeZone: "America/Bogota",
    lines: ["5 de diciembre", "10:00 a.m.", "Un año nuestro", "Más allá del aula"],
    finaleKicker: "Promoción Aeternum",
    finaleTitle: "Gracias.",
    finaleBody: [
      "Este año no cabe en una nota, ni en un diploma, ni en la foto del grupo.",
      "Gracias por los recreos que se hicieron largos, por las risas que solo nosotros entendemos y por los días pesados que pesaron menos porque estábamos juntos. Gracias por lo que ninguna clase tenía en el programa: insistir, cuidar, quedarse.",
      "Que Aeternum no se quede en un nombre bonito. Que lo que vivimos siga cuando este reloj llegue a cero. Más allá de lo académico, este año fue nuestro.",
    ].join("\n\n"),
    finaleSign: "A cada uno de mis compañeros, con todo lo que este año me dejó.",
    accent: "auto",
  };
}

export function defaultCeremony(): Ceremony {
  return withInstant(defaultInput());
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function mergeCeremony(value: unknown): Ceremony {
  const base = defaultInput();
  if (!isRecord(value)) return withInstant(base);
  const lines = Array.isArray(value.lines)
    ? value.lines.filter((line): line is string => typeof line === "string" && line.trim().length > 0)
    : base.lines;
  const candidate = {
    ...base,
    ...value,
    lines: lines.length ? lines : base.lines,
  };
  const parsed = ceremonySchema.safeParse(candidate);
  if (!parsed.success) return withInstant(base);
  return withInstant(parsed.data);
}

export function remain(whenIso: string, nowMs: number): Remain {
  const target = new Date(whenIso).getTime();
  if (!Number.isFinite(target) || nowMs >= target) {
    return { months: 0, days: 0, hours: 0, minutes: 0, seconds: 0, done: true, totalMs: 0 };
  }
  const totalMs = target - nowMs;
  let left = Math.floor(totalMs / 1000);
  const months = Math.min(99, Math.floor(left / MONTH_SECONDS));
  left -= months * MONTH_SECONDS;
  const days = Math.floor(left / 86400);
  left -= days * 86400;
  const hours = Math.floor(left / 3600);
  left -= hours * 3600;
  const minutes = Math.floor(left / 60);
  const seconds = left - minutes * 60;
  return { months, days, hours, minutes, seconds, done: false, totalMs };
}

export function pad2(n: number): string {
  return String(Math.max(0, n)).padStart(2, "0");
}

export function prettyWhen(date: string, time: string): string {
  const month = Number(date.slice(5, 7));
  const day = Number(date.slice(8, 10));
  const hour = Number(time.slice(0, 2));
  const minute = time.slice(3, 5);
  const h12 = hour % 12 || 12;
  const suffix = hour < 12 ? "a.m." : "p.m.";
  const name = MONTHS_ES[month - 1] ?? "";
  return `${day} de ${name} · ${h12}:${minute} ${suffix}`;
}

export function paragraphs(body: string): string[] {
  return body
    .split(/\n\s*\n/)
    .map((part) => part.trim())
    .filter(Boolean);
}

export function heatFor(accent: Ceremony["accent"], totalMs: number, done: boolean): "emerald" | "crimson" {
  if (done) return "emerald";
  if (accent === "crimson") return "crimson";
  if (accent === "emerald") return "emerald";
  if (totalMs > 0 && totalMs <= 24 * 60 * 60 * 1000) return "crimson";
  return "emerald";
}
