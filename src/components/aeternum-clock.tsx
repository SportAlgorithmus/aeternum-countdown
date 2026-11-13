import { useEffect, useId, useMemo, useRef, useState, type FormEvent } from "react";
import { useRouter } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { X } from "lucide-react";
import {
  heatFor,
  paragraphs,
  pad2,
  prettyWhen,
  remain,
  type Ceremony,
  type CeremonyInput,
} from "@/lib/ceremony";
import { enterVault, leaveVault, saveCeremony, type loadHome } from "@/lib/ceremony.functions";

type Home = Awaited<ReturnType<typeof loadHome>>;

const SECRET = "841005";
const BINARY =
  "01000001 01000101 01010100 01000101 01010010 01001110 01010101 01001101   ";

const SKY_A = [18, 34, 22, 48, 28, 60, 36, 44, 24, 70, 32, 40, 20, 54, 26, 38];
const SKY_B = [26, 16, 42, 30, 64, 22, 50, 18, 36, 58, 28, 46, 20, 34, 52, 24];

export function AeternumClock({ initial }: { initial: Home }) {
  const router = useRouter();
  const enter = useServerFn(enterVault);
  const leave = useServerFn(leaveVault);
  const save = useServerFn(saveCeremony);

  const [ceremony, setCeremony] = useState(initial.ceremony);
  const [admin, setAdmin] = useState(initial.admin);
  const [updatedAt, setUpdatedAt] = useState(initial.updatedAt);
  const [now, setNow] = useState<number | null>(null);
  const [lineIndex, setLineIndex] = useState(0);
  const [vaultOpen, setVaultOpen] = useState(false);
  const [draft, setDraft] = useState<CeremonyInput>(initial.ceremony);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [formError, setFormError] = useState("");
  const [formNote, setFormNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [forceFinale, setForceFinale] = useState(false);
  const emailRef = useRef<HTMLInputElement>(null);
  const holdRef = useRef<number | null>(null);

  useEffect(() => {
    setCeremony(initial.ceremony);
    setAdmin(initial.admin);
    setUpdatedAt(initial.updatedAt);
  }, [initial]);

  useEffect(() => {
    const tick = () => setNow(Date.now());
    tick();
    const id = window.setInterval(tick, 250);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    const id = window.setInterval(() => {
      setLineIndex((index) => index + 1);
    }, 4500);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    let buffer = "";
    let clearId = 0;
    const onKey = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable)) {
        return;
      }
      if (event.key === "Escape") {
        setVaultOpen(false);
        setForceFinale(false);
        return;
      }
      if (!/^\d$/.test(event.key)) return;
      buffer = (buffer + event.key).slice(-SECRET.length);
      window.clearTimeout(clearId);
      clearId = window.setTimeout(() => {
        buffer = "";
      }, 2500);
      if (buffer === SECRET) {
        buffer = "";
        setDraft(ceremony);
        setFormError("");
        setFormNote("");
        setVaultOpen(true);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [ceremony]);

  useEffect(() => {
    if (!vaultOpen) return;
    const id = window.setTimeout(() => emailRef.current?.focus(), 40);
    return () => window.clearTimeout(id);
  }, [vaultOpen, admin]);

  const clock = useMemo(
    () => (now === null ? null : remain(ceremony.whenIso, now)),
    [ceremony.whenIso, now],
  );
  const heat = heatFor(ceremony.accent, clock?.totalMs ?? Number.POSITIVE_INFINITY, Boolean(clock?.done));
  const line = ceremony.lines[lineIndex % ceremony.lines.length] ?? ceremony.promotion;
  const showFinale = forceFinale || Boolean(clock?.done);
  const finaleSource = forceFinale ? draft : ceremony;

  function openVault() {
    setDraft(ceremony);
    setFormError("");
    setFormNote("");
    setPassword("");
    setVaultOpen(true);
  }

  function startHold() {
    if (holdRef.current) window.clearTimeout(holdRef.current);
    holdRef.current = window.setTimeout(() => openVault(), 4200);
  }

  function endHold() {
    if (holdRef.current) window.clearTimeout(holdRef.current);
    holdRef.current = null;
  }

  async function onEnter(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setFormError("");
    try {
      const result = await enter({ data: { email, password } });
      if (!result.ok) {
        setFormError(result.error);
        return;
      }
      setAdmin(true);
      setPassword("");
      setDraft(ceremony);
      await router.invalidate();
    } catch {
      setFormError("No se pudo entrar. Inténtalo otra vez.");
    } finally {
      setBusy(false);
    }
  }

  async function onSave(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setFormError("");
    setFormNote("");
    const lines = draft.lines.map((line) => line.trim()).filter(Boolean).slice(0, 8);
    const payload: CeremonyInput = { ...draft, lines: lines.length ? lines : ceremony.lines };
    try {
      const result = await save({ data: payload });
      if (!result.ok) {
        setFormError(result.error);
        return;
      }
      setCeremony(result.ceremony);
      setDraft(result.ceremony);
      setFormNote("Guardado. Quien abra la página verá esto.");
      await router.invalidate();
    } catch {
      setFormError("No se pudo guardar.");
    } finally {
      setBusy(false);
    }
  }

  async function onLeave() {
    setBusy(true);
    try {
      await leave();
      setAdmin(false);
      setVaultOpen(false);
      setForceFinale(false);
      await router.invalidate();
    } finally {
      setBusy(false);
    }
  }

  const spoken = clock
    ? clock.done
      ? "La ceremonia ya comenzó."
      : `Faltan ${clock.months} meses, ${clock.days} días, ${clock.hours} horas, ${clock.minutes} minutos y ${clock.seconds} segundos.`
    : "Cargando la cuenta regresiva.";

  return (
    <main className="stage" data-heat={showFinale ? "emerald" : heat}>
      <div className="atmosphere" aria-hidden="true">
        <StainedGlass />
        <div className="shafts" />
        <Skyline />
        <Motes />
        <Grain />
      </div>
      <div className="corners" aria-hidden="true">
        <span /><span /><span /><span />
      </div>

      <header className="topbar">
        <span className="side">{ceremony.grade}</span>
        <span className="rotator" key={line}>{line}</span>
        <span className="side side-right">{prettyWhen(ceremony.date, ceremony.time)}</span>
      </header>

      <section className="hero">
        <p className="kicker">Promoción</p>
        <h1
          className="wordmark"
          onPointerDown={startHold}
          onPointerUp={endHold}
          onPointerLeave={endHold}
          onPointerCancel={endHold}
          onContextMenu={(event) => event.preventDefault()}
        >
          {ceremony.headline}
        </h1>
        <p className="coming">{ceremony.comingLine}</p>
        <Guardian />
        <div className="clock" role="timer" aria-label={spoken}>
          <Unit label="Meses" value={clock ? pad2(clock.months) : "00"} />
          <Unit label="Días" value={clock ? pad2(clock.days) : "00"} />
          <Unit label="Horas" value={clock ? pad2(clock.hours) : "00"} />
          <Unit label="Minutos" value={clock ? pad2(clock.minutes) : "00"} />
          <Unit label="Segundos" value={clock ? pad2(clock.seconds) : "00"} />
        </div>
        <p className="sr-only">{spoken}</p>
        {ceremony.venue ? <p className="meta">{prettyWhen(ceremony.date, ceremony.time)} · {ceremony.venue}</p> : <p className="meta">{prettyWhen(ceremony.date, ceremony.time)}</p>}
      </section>

      <div className="binary" aria-hidden="true">
        <span className="binary-track">{BINARY.repeat(4)}</span>
      </div>

      {showFinale ? (
        <Finale
          ceremony={finaleSource}
          preview={forceFinale}
          onBack={forceFinale ? () => setForceFinale(false) : undefined}
        />
      ) : null}

      {vaultOpen ? (
        <div className="vault-back" onMouseDown={(event) => {
          if (event.target === event.currentTarget) setVaultOpen(false);
        }}>
          <aside className="vault" role="dialog" aria-modal="true" aria-labelledby="vault-title">
            <div className="vault-head">
              <h2 id="vault-title">{admin ? "Editar" : "Acceso"}</h2>
              <button type="button" className="icon-btn" aria-label="Cerrar" onClick={() => setVaultOpen(false)}>
                <X size={18} />
              </button>
            </div>
            {admin ? (
              <Editor
                draft={draft}
                setDraft={setDraft}
                busy={busy}
                formError={formError}
                formNote={formNote}
                updatedAt={updatedAt}
                onSave={onSave}
                onPreview={() => {
                  setForceFinale(true);
                  setVaultOpen(false);
                }}
                onLeave={() => void onLeave()}
              />
            ) : (
              <form className="stack" onSubmit={(event) => void onEnter(event)}>
                <label className="field">
                  Correo
                  <input
                    ref={emailRef}
                    type="email"
                    name="email"
                    autoComplete="username"
                    inputMode="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    required
                  />
                </label>
                <label className="field">
                  Contraseña
                  <input
                    type="password"
                    name="password"
                    autoComplete="current-password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    required
                  />
                </label>
                {formError ? <p className="form-error">{formError}</p> : null}
                <div className="vault-actions">
                  <button className="btn btn-primary" type="submit" disabled={busy}>
                    {busy ? "Entrando" : "Entrar"}
                  </button>
                </div>
              </form>
            )}
          </aside>
        </div>
      ) : null}

      {admin && !vaultOpen && !showFinale ? (
        <button type="button" className="reopen" onClick={openVault}>
          Editar
        </button>
      ) : null}
    </main>
  );
}

function Unit({ label, value }: { label: string; value: string }) {
  return (
    <div className="unit">
      <span className="digits" suppressHydrationWarning>
        {value.split("").map((ch, index) => (
          <span key={`${index}-${ch}`} className="digit">{ch}</span>
        ))}
      </span>
      <span className="unit-label">{label}</span>
    </div>
  );
}

function Finale({
  ceremony,
  preview,
  onBack,
}: {
  ceremony: Pick<Ceremony, "finaleKicker" | "finaleTitle" | "finaleBody" | "finaleSign" | "promotion">;
  preview: boolean;
  onBack?: () => void;
}) {
  return (
    <div className="finale" role="status">
      <div className="finale-inner">
        <p className="finale-kicker">{ceremony.finaleKicker || ceremony.promotion}</p>
        <h2 className="finale-title">{ceremony.finaleTitle}</h2>
        <div className="finale-rule" />
        <div className="finale-copy">
          {paragraphs(ceremony.finaleBody).map((paragraph) => (
            <p key={paragraph.slice(0, 24)}>{paragraph}</p>
          ))}
        </div>
        {ceremony.finaleSign ? <p className="finale-sign">{ceremony.finaleSign}</p> : null}
        {preview && onBack ? (
          <button type="button" className="finale-back" onClick={onBack}>
            Volver al reloj
          </button>
        ) : null}
      </div>
    </div>
  );
}

function Editor({
  draft,
  setDraft,
  busy,
  formError,
  formNote,
  updatedAt,
  onSave,
  onPreview,
  onLeave,
}: {
  draft: CeremonyInput;
  setDraft: (next: CeremonyInput) => void;
  busy: boolean;
  formError: string;
  formNote: string;
  updatedAt: string | null;
  onSave: (event: FormEvent) => void;
  onPreview: () => void;
  onLeave: () => void;
}) {
  function patch(partial: Partial<CeremonyInput>) {
    setDraft({ ...draft, ...partial });
  }

  return (
    <form className="stack" onSubmit={onSave}>
      <p className="form-note">
        Lo que guardes cambia la página para todos.
        {updatedAt ? ` Último cambio: ${updatedAt.slice(0, 16).replace("T", " ")}.` : ""}
      </p>
      <label className="field">
        Promoción
        <input value={draft.promotion} maxLength={40} onChange={(event) => patch({ promotion: event.target.value })} required />
      </label>
      <div className="row-2">
        <label className="field">
          Grado
          <input value={draft.grade} maxLength={40} onChange={(event) => patch({ grade: event.target.value })} required />
        </label>
        <label className="field">
          Titular
          <input value={draft.headline} maxLength={32} onChange={(event) => patch({ headline: event.target.value })} required />
        </label>
      </div>
      <label className="field">
        Línea central
        <input value={draft.comingLine} maxLength={48} onChange={(event) => patch({ comingLine: event.target.value })} required />
      </label>
      <label className="field">
        Lugar
        <input value={draft.venue} maxLength={80} onChange={(event) => patch({ venue: event.target.value })} />
      </label>
      <div className="row-2">
        <label className="field">
          Fecha
          <input type="date" value={draft.date} onChange={(event) => patch({ date: event.target.value })} required />
        </label>
        <label className="field">
          Hora
          <input type="time" value={draft.time} onChange={(event) => patch({ time: event.target.value })} required />
        </label>
      </div>
      <label className="field">
        Zona horaria
        <select value={draft.timeZone} onChange={(event) => patch({ timeZone: event.target.value as CeremonyInput["timeZone"] })}>
          <option value="America/Bogota">Colombia (Bogotá)</option>
          <option value="America/Lima">Perú (Lima)</option>
          <option value="America/Mexico_City">México (Ciudad de México)</option>
          <option value="America/Chicago">Centro de EE.UU.</option>
          <option value="America/New_York">Este de EE.UU.</option>
          <option value="America/Santiago">Chile (Santiago)</option>
          <option value="America/Argentina/Buenos_Aires">Argentina (Buenos Aires)</option>
          <option value="Europe/Madrid">España (Madrid)</option>
        </select>
      </label>
      <label className="field">
        Color del reloj
        <select value={draft.accent} onChange={(event) => patch({ accent: event.target.value as CeremonyInput["accent"] })}>
          <option value="auto">Esmeralda, carmesí el último día</option>
          <option value="emerald">Siempre esmeralda</option>
          <option value="crimson">Siempre carmesí</option>
        </select>
      </label>
      <label className="field">
        Frases que rotan
        <textarea
          value={draft.lines.join("\n")}
          rows={4}
          onChange={(event) => {
            const lines = event.target.value.split("\n").slice(0, 8).map((line) => line.slice(0, 48));
            patch({ lines: lines.length ? lines : [""] });
          }}
        />
      </label>
      <label className="field">
        Encabezado del mensaje
        <input value={draft.finaleKicker} maxLength={80} onChange={(event) => patch({ finaleKicker: event.target.value })} />
      </label>
      <label className="field">
        Título del mensaje
        <input value={draft.finaleTitle} maxLength={80} onChange={(event) => patch({ finaleTitle: event.target.value })} required />
      </label>
      <label className="field">
        Mensaje al llegar a cero
        <textarea
          value={draft.finaleBody}
          maxLength={2500}
          onChange={(event) => patch({ finaleBody: event.target.value })}
          required
        />
      </label>
      <label className="field">
        Firma
        <input value={draft.finaleSign} maxLength={160} onChange={(event) => patch({ finaleSign: event.target.value })} />
      </label>
      {formError ? <p className="form-error">{formError}</p> : null}
      {formNote ? <p className="form-note">{formNote}</p> : null}
      <div className="vault-actions">
        <button className="btn btn-primary" type="submit" disabled={busy}>
          {busy ? "Guardando" : "Guardar"}
        </button>
        <button className="btn btn-ghost" type="button" onClick={onPreview}>
          Ver el mensaje
        </button>
        <button className="btn btn-ghost" type="button" onClick={onLeave} disabled={busy}>
          Salir
        </button>
      </div>
    </form>
  );
}

function StainedGlass() {
  const uid = useId().replace(/:/g, "");
  const panes = [];
  const count = 18;
  for (let i = 0; i < count; i += 1) {
    const a0 = (i / count) * Math.PI * 2 - Math.PI / 2 + 0.02;
    const a1 = ((i + 1) / count) * Math.PI * 2 - Math.PI / 2 - 0.02;
    const tone = i % 5 === 0 ? "pane pane-bright" : i % 2 === 0 ? "pane pane-mid" : "pane";
    panes.push(
      <path key={i} className={tone} d={annulus(50, 50, 16, 46, a0, a1)} style={{ animationDelay: `${i * 0.25}s` }} />,
    );
  }
  return (
    <svg className="glass" viewBox="0 0 100 100" role="presentation">
      <defs>
        <radialGradient id={`${uid}-g`} cx="50%" cy="46%" r="50%">
          <stop offset="0%" stopColor="#143222" />
          <stop offset="70%" stopColor="#07140d" />
          <stop offset="100%" stopColor="#030504" />
        </radialGradient>
      </defs>
      <circle cx="50" cy="50" r="49" fill={`url(#${uid}-g)`} />
      <g className="glass-ring">{panes}</g>
      <circle className="pane-core" cx="50" cy="50" r="15.2" />
      <path
        className="lemniscate"
        d="M50 50 C 50 44, 42 42, 38 46 C 34 50, 40 54, 50 50 C 60 46, 66 50, 62 54 C 58 58, 50 56, 50 50 Z"
      />
      {Array.from({ length: 48 }, (_, i) => {
        const a = (i / 48) * Math.PI * 2;
        const inner = i % 4 === 0 ? 46.4 : 47.3;
        const x1 = r(50 + Math.cos(a) * inner);
        const y1 = r(50 + Math.sin(a) * inner);
        const x2 = r(50 + Math.cos(a) * 48.6);
        const y2 = r(50 + Math.sin(a) * 48.6);
        return (
          <line
            key={i}
            x1={x1}
            y1={y1}
            x2={x2}
            y2={y2}
            stroke="#9bb5a4"
            strokeWidth="0.25"
          />
        );
      })}
    </svg>
  );
}

function r(n: number) {
  return Math.round(n * 100) / 100;
}

function annulus(cx: number, cy: number, r0: number, r1: number, a0: number, a1: number) {
  const p = (radius: number, angle: number) => `${r(cx + Math.cos(angle) * radius)} ${r(cy + Math.sin(angle) * radius)}`;
  const large = a1 - a0 > Math.PI ? 1 : 0;
  return `M ${p(r0, a0)} A ${r0} ${r0} 0 ${large} 1 ${p(r0, a1)} L ${p(r1, a1)} A ${r1} ${r1} 0 ${large} 0 ${p(r1, a0)} Z`;
}

function Guardian() {
  return (
    <svg className="guardian" viewBox="0 0 400 460" aria-hidden="true">
      <defs>
        <linearGradient id="cloth" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#123628" />
          <stop offset="55%" stopColor="#07140e" />
          <stop offset="100%" stopColor="#030504" stopOpacity="0" />
        </linearGradient>
        <linearGradient id="metal" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#e7f2ea" />
          <stop offset="42%" stopColor="#8ea396" />
          <stop offset="100%" stopColor="#24342c" />
        </linearGradient>
        <linearGradient id="hood" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#1a4a32" />
          <stop offset="100%" stopColor="#06140e" />
        </linearGradient>
      </defs>
      <path
        fill="url(#cloth)"
        d="M200 168 C 120 210 48 300 12 460 L 388 460 C 352 300 280 210 200 168 Z"
      />
      <path
        fill="url(#hood)"
        d="M200 28 C 118 28 78 108 86 196 C 104 150 146 124 200 124 C 254 124 296 150 314 196 C 322 108 282 28 200 28 Z"
      />
      <path
        fill="#06140e"
        d="M132 168 C 150 118 250 118 268 168 C 250 142 150 142 132 168 Z"
      />
      <path
        fill="url(#metal)"
        d="M158 132 C 158 104 176 86 200 86 C 224 86 242 104 242 132 L 248 214 C 248 252 228 274 200 274 C 172 274 152 252 152 214 Z"
      />
      <rect className="visor" x="168" y="156" width="64" height="11" rx="1.5" />
      <path
        fill="none"
        stroke="#1c3a2c"
        strokeWidth="3"
        d="M176 214 C 184 236 216 236 224 214"
      />
      <path
        fill="none"
        stroke="currentColor"
        strokeWidth="2.2"
        opacity="0.85"
        d="M186 248 C 186 240 194 236 200 240 C 206 244 214 240 214 248 C 214 256 206 260 200 256 C 194 252 186 256 186 248 Z"
      />
    </svg>
  );
}

function Skyline() {
  return (
    <svg className="skyline" viewBox="0 0 1600 260" preserveAspectRatio="none" aria-hidden="true">
      <Buildings heights={SKY_A} />
      <Buildings heights={SKY_B} className="skyline-b" />
    </svg>
  );
}

function Buildings({ heights, className }: { heights: number[]; className?: string }) {
  const width = 1600 / heights.length;
  return (
    <g className={className} fill="#03110b">
      {heights.map((height, index) => (
        <rect
          key={index}
          x={index * width}
          y={260 - height * 3.2}
          width={width - 6}
          height={height * 3.2}
        />
      ))}
    </g>
  );
}

function Motes() {
  const spots = [
    [12, 70],
    [22, 40],
    [38, 80],
    [54, 30],
    [68, 62],
    [80, 44],
    [88, 74],
    [46, 58],
  ];
  return (
    <>
      {spots.map(([left, delay]) => (
        <span
          key={`${left}-${delay}`}
          className="mote"
          style={{ left: `${left}%`, bottom: "8%", animationDelay: `${delay / 12}s` }}
        />
      ))}
    </>
  );
}

function Grain() {
  return (
    <svg className="grain" aria-hidden="true">
      <filter id="grain-filter">
        <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="2" stitchTiles="stitch" />
      </filter>
      <rect width="100%" height="100%" filter="url(#grain-filter)" />
    </svg>
  );
}
