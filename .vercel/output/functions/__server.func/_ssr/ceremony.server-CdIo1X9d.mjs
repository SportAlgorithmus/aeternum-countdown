import { a as getCookie, i as deleteCookie$1, o as getRequest, s as setCookie$1 } from "./ssr.mjs";
import { i as mergeCeremony, l as withInstant, n as defaultCeremony, t as ceremonySchema } from "./ceremony-CVl8IeRj.mjs";
import { createHmac, timingSafeEqual } from "node:crypto";
//#region node_modules/.nitro/vite/services/ssr/assets/ceremony.server-CdIo1X9d.js
var _0002_ceremony_default = "create table if not exists ceremony_settings (\n  id integer primary key,\n  payload jsonb not null,\n  updated_at timestamptz not null default now()\n);\n";
/**
* Migration bookkeeping shared by the two appliers — `scripts/migrate.mjs`
* (deploy, `readdir`) and `src/lib/db.ts` (PGLite preview, `import.meta.glob`).
*
* Applied files are keyed by BASENAME, so the same file applies once no matter
* which directory it is globbed from. That is what makes the auth schema safe to
* copy from `migrations/auth/` into `migrations/` when an app turns sign-in on:
* a database that already has `0001_auth.sql` will not re-run it.
*
* Neither applier descends into subdirectories, so `migrations/auth/*.sql` is
* out of scope for both until it is copied up.
*/
/**
* The `_migrations` key for a migration path (or bare filename).
* @param {string} path
* @returns {string}
*/
function migrationName(path) {
	return path.split("/").pop() ?? path;
}
/**
* @param {string} path
* @returns {boolean}
*/
function isMigrationFile(path) {
	return path.endsWith(".sql");
}
/**
* Migrations in `paths` that are not yet in `applied`, in apply order.
* Non-`.sql` entries (a `readdir` also yields `migrations/auth/`) are dropped.
* @param {Iterable<string>} paths
* @param {Iterable<string>} applied
* @returns {Array<{ name: string, path: string }>}
*/
function pendingMigrations(paths, applied) {
	const done = new Set(applied);
	return [...paths].filter(isMigrationFile).map((path) => ({
		name: migrationName(path),
		path
	})).sort((a, b) => a.name.localeCompare(b.name)).filter(({ name }) => !done.has(name));
}
var rawDatabaseUrl = typeof process !== "undefined" ? process.env.DATABASE_URL : void 0;
var databaseUrl = rawDatabaseUrl && rawDatabaseUrl.trim() ? rawDatabaseUrl : void 0;
/**
* Active backend: real **Neon** when `DATABASE_URL` is set (deployed / configured
* sandbox), otherwise a local embedded **PGLite** (Postgres compiled to WASM) so
* the app has a working database even with nothing configured — the live preview
* included. Swap in Neon later by just setting `DATABASE_URL`; no code changes.
*/
var dbSource = databaseUrl ? "neon" : "pglite";
/**
* Init state lives on globalThis as promises: dev HMR creates new instances of
* this module, and two instances racing module-level state would open a second
* pool or run two concurrent PGLite migration passes (whose duplicate
* `_migrations` insert rejects — and would get memoized, poisoning every later
* `getSql()`). A failed init clears its slot so the next call retries.
*/
var globalRef = globalThis;
/**
* Result-type parity: Postgres sends every value as text plus a type OID — the
* JS value is the DRIVER's parsing choice, and pg and PGLite disagree (pg:
* int8 -> string, date -> local-midnight Date; PGLite: int8 -> BigInt, which
* JSON.stringify rejects, date -> UTC Date). Normalize both so preview and
* production return identical, JSON-safe shapes:
*   int8/bigint (incl. count(*)) -> number (past 2^53 loses precision — cast
*                                   `::text` if you ever need huge integers)
*   date                         -> 'YYYY-MM-DD' string
*   interval                     -> Postgres interval text
* numeric already comes back as a string on both (arbitrary precision).
*/
var OID_INT8 = 20;
var OID_DATE = 1082;
var OID_INTERVAL = 1186;
var identity = (v) => v;
/** Wrap a query runner in the tagged-template + `.query()` `Sql` surface. */
function toSql(run) {
	const sql = (async (strings, ...values) => {
		let text = strings[0];
		for (let i = 0; i < values.length; i += 1) text += `$${i + 1}${strings[i + 1]}`;
		return run(text, values);
	});
	sql.query = (text, params = []) => run(text, params);
	return sql;
}
function createNeonSql() {
	globalRef.__pgSqlPromise__ ??= (async () => {
		const { Pool, types } = await import("../_libs/pg.mjs").then((n) => n.t);
		types.setTypeParser(OID_INT8, Number);
		types.setTypeParser(OID_DATE, identity);
		types.setTypeParser(OID_INTERVAL, identity);
		const pool = new Pool({ connectionString: databaseUrl });
		return toSql(async (text, params) => {
			return (await pool.query(text, params)).rows;
		});
	})().catch((err) => {
		globalRef.__pgSqlPromise__ = void 0;
		throw err;
	});
	return globalRef.__pgSqlPromise__;
}
async function createPgliteSql() {
	globalRef.__pgliteInstance__ ??= (async () => {
		const { PGlite } = await import("../_libs/electric-sql__pglite.mjs").then((n) => n.t);
		const pg = new PGlite({ parsers: {
			[OID_INT8]: Number,
			[OID_DATE]: identity,
			[OID_INTERVAL]: identity
		} });
		await pg.waitReady;
		await pg.exec("create table if not exists _migrations (name text primary key, applied_at timestamptz not null default now())");
		return pg;
	})().catch((err) => {
		globalRef.__pgliteInstance__ = void 0;
		throw err;
	});
	const pg = await globalRef.__pgliteInstance__;
	const migrate = async () => {
		const migrations = /* #__PURE__ */ Object.assign({ "/migrations/0002_ceremony.sql": _0002_ceremony_default });
		const done = (await pg.query("select name from _migrations")).rows.map((r) => r.name);
		for (const { name, path } of pendingMigrations(Object.keys(migrations), done)) await pg.transaction(async (tx) => {
			await tx.exec(migrations[path]);
			await tx.query("insert into _migrations (name) values ($1)", [name]);
		});
	};
	const pass = (globalRef.__pgliteMigrateChain__ ?? Promise.resolve()).catch(() => void 0).then(migrate);
	globalRef.__pgliteMigrateChain__ = pass;
	await pass;
	return toSql(async (text, params) => {
		return (await pg.query(text, params)).rows;
	});
}
var sqlPromise = null;
async function createSql() {
	if (typeof window !== "undefined") throw new Error("@/lib/db is server-only — call getSql() from a createServerFn handler or a server route loader, never from client code.");
	return dbSource === "neon" ? createNeonSql() : createPgliteSql();
}
/**
* Get the shared, **server-only** SQL client. Neon when `DATABASE_URL` is set,
* otherwise the local PGLite fallback. Memoized — safe to call per request.
*
* Schema comes from `migrations/*.sql`, auto-applied before the first query on
* both backends — define tables there, never inline in server functions.
*/
function getSql() {
	sqlPromise ??= createSql().catch((err) => {
		sqlPromise = null;
		throw err;
	});
	return sqlPromise;
}
/**
* Finish DB bootstrap before the server handles traffic.
*
* - **PGLite** (preview / no `DATABASE_URL`): open the in-memory DB and apply
*   `migrations/*.sql`. Idempotent — concurrent callers share one promise.
* - **Neon**: no-op (pool is created lazily on first query).
*
* Vite `configureServer` awaits this at dev startup; production imports of this
* module kick it off immediately (see bottom of file).
*/
function ensureDbReady() {
	if (dbSource !== "pglite") return Promise.resolve();
	return getSql().then(() => void 0);
}
var globalBoot = globalThis;
if (typeof window === "undefined" && dbSource === "pglite") globalBoot.__pgBootstrapPromise__ ??= ensureDbReady().catch((err) => {
	globalBoot.__pgBootstrapPromise__ = void 0;
	console.error("[db] PGLite bootstrap failed:", err);
	throw err;
});
var COOKIE = "aet_vault";
var EMAIL = "palacios.linares.nico@gmail.com";
var PASSWORD = "841005aeternum";
var SECRET = "aeternum-vault-9f3c2e7a6b14d8c0e5f1a2b3c4d5e6f7";
var WEEK = 604800;
var LOCK_MS = 9e5;
var MAX_TRIES = 8;
var attempts = /* @__PURE__ */ new Map();
function shaEqual(left, right) {
	const a = Buffer.from(left);
	const b = Buffer.from(right);
	const len = Math.max(a.length, b.length, 1);
	const aa = Buffer.alloc(len);
	const bb = Buffer.alloc(len);
	a.copy(aa);
	b.copy(bb);
	return timingSafeEqual(aa, bb) && a.length === b.length;
}
function sign(body) {
	return `${body}.${createHmac("sha256", SECRET).update(body).digest("base64url")}`;
}
function readToken(token) {
	if (!token) return false;
	const dot = token.lastIndexOf(".");
	if (dot <= 0) return false;
	const body = token.slice(0, dot);
	if (!shaEqual(token.slice(dot + 1), createHmac("sha256", SECRET).update(body).digest("base64url"))) return false;
	try {
		const payload = JSON.parse(Buffer.from(body, "base64url").toString("utf8"));
		return payload.ok === true && typeof payload.exp === "number" && payload.exp > Date.now();
	} catch {
		return false;
	}
}
function cookieSecure() {
	try {
		const proto = getRequest().headers.get("x-forwarded-proto")?.split(",")[0]?.trim();
		if (proto) return proto === "https";
		return getRequest().url.startsWith("https:");
	} catch {
		return true;
	}
}
function cookieBase() {
	return {
		path: "/",
		httpOnly: true,
		sameSite: "lax",
		secure: cookieSecure()
	};
}
function clientIp() {
	try {
		const headers = getRequest().headers;
		const fwd = headers.get("x-forwarded-for");
		if (fwd) return fwd.split(",")[0]?.trim() || "local";
		return headers.get("x-real-ip") ?? "local";
	} catch {
		return "local";
	}
}
function isLocked(ip) {
	const row = attempts.get(ip);
	return Boolean(row && row.reset > Date.now() && row.n >= MAX_TRIES);
}
function registerFailure(ip) {
	const now = Date.now();
	const row = attempts.get(ip);
	if (!row || row.reset < now) {
		attempts.set(ip, {
			n: 1,
			reset: now + LOCK_MS
		});
		return;
	}
	row.n += 1;
}
function clearFailures(ip) {
	attempts.delete(ip);
}
function credentialsMatch(email, password) {
	return shaEqual(email.trim().toLowerCase(), EMAIL) && shaEqual(password, PASSWORD);
}
function isVaultOpen() {
	return readToken(getCookie(COOKIE));
}
function openVaultCookie() {
	const body = Buffer.from(JSON.stringify({
		ok: true,
		exp: Date.now() + WEEK * 1e3
	}), "utf8").toString("base64url");
	setCookie$1(COOKIE, sign(body), {
		...cookieBase(),
		maxAge: WEEK
	});
}
function closeVaultCookie() {
	deleteCookie$1(COOKIE, cookieBase());
}
function asPayload(value) {
	if (typeof value === "string") try {
		return JSON.parse(value);
	} catch {
		return {};
	}
	return value ?? {};
}
function stamp(value) {
	if (value instanceof Date) return value.toISOString();
	if (typeof value === "string" && value) return value;
	return null;
}
async function readHome() {
	try {
		const rows = await (await getSql())`
      select payload, updated_at from ceremony_settings where id = 1
    `;
		if (!rows.length) return {
			ceremony: defaultCeremony(),
			admin: isVaultOpen(),
			updatedAt: null
		};
		return {
			ceremony: mergeCeremony(asPayload(rows[0].payload)),
			admin: isVaultOpen(),
			updatedAt: stamp(rows[0].updated_at)
		};
	} catch (error) {
		console.error("ceremony read failed", error);
		return {
			ceremony: defaultCeremony(),
			admin: false,
			updatedAt: null
		};
	}
}
async function enterVault(email, password) {
	const ip = clientIp();
	if (isLocked(ip)) return {
		ok: false,
		error: "Demasiados intentos. Espera un momento."
	};
	if (!credentialsMatch(email, password)) {
		registerFailure(ip);
		return {
			ok: false,
			error: "Esos datos no coinciden."
		};
	}
	clearFailures(ip);
	openVaultCookie();
	return { ok: true };
}
async function leaveVault() {
	closeVaultCookie();
	return { ok: true };
}
async function saveCeremony(input) {
	if (!isVaultOpen()) return {
		ok: false,
		error: "La sesión no es válida."
	};
	const parsed = ceremonySchema.safeParse(input);
	if (!parsed.success) return {
		ok: false,
		error: "Revisa los campos e inténtalo de nuevo."
	};
	const ceremony = withInstant(parsed.data);
	await (await getSql()).query(`insert into ceremony_settings (id, payload, updated_at)
     values (1, $1::jsonb, now())
     on conflict (id) do update set payload = excluded.payload, updated_at = now()`, [JSON.stringify(ceremony)]);
	return {
		ok: true,
		ceremony
	};
}
//#endregion
export { enterVault, leaveVault, readHome, saveCeremony };
