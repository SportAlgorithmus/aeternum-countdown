import { a as object, n as array, o as string, t as _enum } from "../_libs/zod.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/ceremony-CVl8IeRj.js
var zoneIds = [
	{
		id: "America/Bogota",
		label: "Colombia (Bogotá)"
	},
	{
		id: "America/Lima",
		label: "Perú (Lima)"
	},
	{
		id: "America/Mexico_City",
		label: "México (Ciudad de México)"
	},
	{
		id: "America/Chicago",
		label: "Centro de EE.UU. / México norte"
	},
	{
		id: "America/New_York",
		label: "Este de EE.UU."
	},
	{
		id: "America/Santiago",
		label: "Chile (Santiago)"
	},
	{
		id: "America/Argentina/Buenos_Aires",
		label: "Argentina (Buenos Aires)"
	},
	{
		id: "Europe/Madrid",
		label: "España (Madrid)"
	}
].map((zone) => zone.id);
var ceremonySchema = object({
	promotion: string().trim().min(1).max(40),
	grade: string().trim().min(1).max(40),
	headline: string().trim().min(1).max(32),
	comingLine: string().trim().min(1).max(48),
	venue: string().trim().max(80),
	date: string().regex(/^\d{4}-\d{2}-\d{2}$/),
	time: string().regex(/^([01]\d|2[0-3]):[0-5]\d$/),
	timeZone: _enum(zoneIds),
	lines: array(string().trim().min(1).max(48)).min(1).max(8),
	finaleKicker: string().trim().max(80),
	finaleTitle: string().trim().min(1).max(80),
	finaleBody: string().trim().min(1).max(2500),
	finaleSign: string().trim().max(160),
	accent: _enum([
		"emerald",
		"crimson",
		"auto"
	])
});
var MONTHS_ES = [
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
	"diciembre"
];
var MONTH_SECONDS = 2592e3;
function wallParts(date, timeZone) {
	const fmt = new Intl.DateTimeFormat("en-US", {
		timeZone,
		hourCycle: "h23",
		year: "numeric",
		month: "2-digit",
		day: "2-digit",
		hour: "2-digit",
		minute: "2-digit",
		second: "2-digit"
	});
	const map = {};
	for (const part of fmt.formatToParts(date)) map[part.type] = part.value;
	return {
		year: Number(map.year),
		month: Number(map.month),
		day: Number(map.day),
		hour: Number(map.hour) % 24,
		minute: Number(map.minute),
		second: Number(map.second)
	};
}
/** Wall-clock date and time in an IANA zone, as a UTC instant. */
function zonedTimeToUtc(date, time, timeZone) {
	const [y, m, d] = date.split("-").map(Number);
	const [hh, mm] = time.split(":").map(Number);
	const wantedUtc = Date.UTC(y, m - 1, d, hh, mm, 0);
	let utc = wantedUtc;
	for (let i = 0; i < 4; i += 1) {
		const parts = wallParts(new Date(utc), timeZone);
		const delta = wantedUtc - Date.UTC(parts.year, parts.month - 1, parts.day, parts.hour, parts.minute, parts.second);
		utc += delta;
		if (delta === 0) break;
	}
	const instant = new Date(utc);
	if (Number.isNaN(instant.getTime())) throw new Error("Fecha inválida");
	return instant.toISOString();
}
function withInstant(input) {
	return {
		...input,
		whenIso: zonedTimeToUtc(input.date, input.time, input.timeZone)
	};
}
function defaultInput() {
	return {
		promotion: "Aeternum",
		grade: "Grado 11",
		headline: "Aeternum",
		comingLine: "Se acerca",
		venue: "Ceremonia de grado",
		date: "2026-12-05",
		time: "10:00",
		timeZone: "America/Bogota",
		lines: [
			"Grado 11",
			"5 de diciembre",
			"10:00 a.m.",
			"Promoción Aeternum"
		],
		finaleKicker: "Promoción Aeternum",
		finaleTitle: "Gracias.",
		finaleBody: [
			"Este año no cabe en una nota, ni en un diploma, ni en la foto del grupo.",
			"Gracias por los recreos que se hicieron largos, por las risas que solo nosotros entendemos y por los días pesados que pesaron menos porque estábamos juntos. Gracias por lo que ninguna clase tenía en el programa: insistir, cuidar, quedarse.",
			"Que Aeternum no se quede en un nombre bonito. Que lo que vivimos siga cuando este reloj llegue a cero. Más allá de lo académico, este año fue nuestro."
		].join("\n\n"),
		finaleSign: "A cada uno de mis compañeros, con todo lo que este año me dejó.",
		accent: "auto"
	};
}
function defaultCeremony() {
	return withInstant(defaultInput());
}
function isRecord(value) {
	return typeof value === "object" && value !== null && !Array.isArray(value);
}
function mergeCeremony(value) {
	const base = defaultInput();
	if (!isRecord(value)) return withInstant(base);
	const lines = Array.isArray(value.lines) ? value.lines.filter((line) => typeof line === "string" && line.trim().length > 0) : base.lines;
	const candidate = {
		...base,
		...value,
		lines: lines.length ? lines : base.lines
	};
	const parsed = ceremonySchema.safeParse(candidate);
	if (!parsed.success) return withInstant(base);
	return withInstant(parsed.data);
}
function remain(whenIso, nowMs) {
	const target = new Date(whenIso).getTime();
	if (!Number.isFinite(target) || nowMs >= target) return {
		months: 0,
		days: 0,
		hours: 0,
		minutes: 0,
		seconds: 0,
		done: true,
		totalMs: 0
	};
	const totalMs = target - nowMs;
	let left = Math.floor(totalMs / 1e3);
	const months = Math.min(99, Math.floor(left / MONTH_SECONDS));
	left -= months * MONTH_SECONDS;
	const days = Math.floor(left / 86400);
	left -= days * 86400;
	const hours = Math.floor(left / 3600);
	left -= hours * 3600;
	const minutes = Math.floor(left / 60);
	return {
		months,
		days,
		hours,
		minutes,
		seconds: left - minutes * 60,
		done: false,
		totalMs
	};
}
function pad2(n) {
	return String(Math.max(0, n)).padStart(2, "0");
}
function prettyWhen(date, time) {
	const month = Number(date.slice(5, 7));
	const day = Number(date.slice(8, 10));
	const hour = Number(time.slice(0, 2));
	const minute = time.slice(3, 5);
	const h12 = hour % 12 || 12;
	const suffix = hour < 12 ? "a.m." : "p.m.";
	return `${day} de ${MONTHS_ES[month - 1] ?? ""} · ${h12}:${minute} ${suffix}`;
}
function paragraphs(body) {
	return body.split(/\n\s*\n/).map((part) => part.trim()).filter(Boolean);
}
function heatFor(accent, totalMs, done) {
	if (done) return "emerald";
	if (accent === "crimson") return "crimson";
	if (accent === "emerald") return "emerald";
	if (totalMs > 0 && totalMs <= 864e5) return "crimson";
	return "emerald";
}
//#endregion
export { pad2 as a, remain as c, mergeCeremony as i, withInstant as l, defaultCeremony as n, paragraphs as o, heatFor as r, prettyWhen as s, ceremonySchema as t };
