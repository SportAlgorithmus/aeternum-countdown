import { o as __toESM } from "../_runtime.mjs";
import { U as isRedirect, b as require_jsx_runtime, q as require_react, y as useRouter } from "../_libs/@tanstack/react-router+[...].mjs";
import { a as pad2, c as remain, o as paragraphs, r as heatFor, s as prettyWhen } from "./ceremony-CVl8IeRj.mjs";
import { t as X } from "../_libs/lucide-react.mjs";
import { a as saveCeremony, i as leaveVault, n as Route, r as enterVault } from "./router-Cg7rwZgV.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/routes-dDdfpHC-.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function useServerFn(serverFn) {
	const router = useRouter();
	return import_react.useCallback(async (...args) => {
		try {
			const res = await serverFn(...args);
			if (isRedirect(res)) throw res;
			return res;
		} catch (err) {
			if (isRedirect(err)) {
				err.options._fromLocation = router.stores.location.get();
				return router.navigate(router.resolveRedirect(err).options);
			}
			throw err;
		}
	}, [router, serverFn]);
}
var SECRET = "841005";
var BINARY = "01000001 01000101 01010100 01000101 01010010 01001110 01010101 01001101   ";
var SKY_A = [
	18,
	34,
	22,
	48,
	28,
	60,
	36,
	44,
	24,
	70,
	32,
	40,
	20,
	54,
	26,
	38
];
var SKY_B = [
	26,
	16,
	42,
	30,
	64,
	22,
	50,
	18,
	36,
	58,
	28,
	46,
	20,
	34,
	52,
	24
];
function AeternumClock({ initial }) {
	const router = useRouter();
	const enter = useServerFn(enterVault);
	const leave = useServerFn(leaveVault);
	const save = useServerFn(saveCeremony);
	const [ceremony, setCeremony] = (0, import_react.useState)(initial.ceremony);
	const [admin, setAdmin] = (0, import_react.useState)(initial.admin);
	const [updatedAt, setUpdatedAt] = (0, import_react.useState)(initial.updatedAt);
	const [now, setNow] = (0, import_react.useState)(null);
	const [lineIndex, setLineIndex] = (0, import_react.useState)(0);
	const [vaultOpen, setVaultOpen] = (0, import_react.useState)(false);
	const [draft, setDraft] = (0, import_react.useState)(initial.ceremony);
	const [email, setEmail] = (0, import_react.useState)("");
	const [password, setPassword] = (0, import_react.useState)("");
	const [formError, setFormError] = (0, import_react.useState)("");
	const [formNote, setFormNote] = (0, import_react.useState)("");
	const [busy, setBusy] = (0, import_react.useState)(false);
	const [forceFinale, setForceFinale] = (0, import_react.useState)(false);
	const emailRef = (0, import_react.useRef)(null);
	const holdRef = (0, import_react.useRef)(null);
	(0, import_react.useEffect)(() => {
		setCeremony(initial.ceremony);
		setAdmin(initial.admin);
		setUpdatedAt(initial.updatedAt);
	}, [initial]);
	(0, import_react.useEffect)(() => {
		const tick = () => setNow(Date.now());
		tick();
		const id = window.setInterval(tick, 250);
		return () => window.clearInterval(id);
	}, []);
	(0, import_react.useEffect)(() => {
		const id = window.setInterval(() => {
			setLineIndex((index) => index + 1);
		}, 4500);
		return () => window.clearInterval(id);
	}, []);
	(0, import_react.useEffect)(() => {
		let buffer = "";
		let clearId = 0;
		const onKey = (event) => {
			const target = event.target;
			if (target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable)) return;
			if (event.key === "Escape") {
				setVaultOpen(false);
				setForceFinale(false);
				return;
			}
			if (!/^\d$/.test(event.key)) return;
			buffer = (buffer + event.key).slice(-6);
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
	(0, import_react.useEffect)(() => {
		if (!vaultOpen) return;
		const id = window.setTimeout(() => emailRef.current?.focus(), 40);
		return () => window.clearTimeout(id);
	}, [vaultOpen, admin]);
	const clock = (0, import_react.useMemo)(() => now === null ? null : remain(ceremony.whenIso, now), [ceremony.whenIso, now]);
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
	async function onEnter(event) {
		event.preventDefault();
		setBusy(true);
		setFormError("");
		try {
			const result = await enter({ data: {
				email,
				password
			} });
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
	async function onSave(event) {
		event.preventDefault();
		setBusy(true);
		setFormError("");
		setFormNote("");
		const lines = draft.lines.map((line) => line.trim()).filter(Boolean).slice(0, 8);
		const payload = {
			...draft,
			lines: lines.length ? lines : ceremony.lines
		};
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
	const spoken = clock ? clock.done ? "La ceremonia ya comenzó." : `Faltan ${clock.months} meses, ${clock.days} días, ${clock.hours} horas, ${clock.minutes} minutos y ${clock.seconds} segundos.` : "Cargando la cuenta regresiva.";
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("main", {
		className: "stage",
		"data-heat": showFinale ? "emerald" : heat,
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "atmosphere",
				"aria-hidden": "true",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(StainedGlass, {}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "shafts" }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Skyline, {}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Motes, {}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Grain, {})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "corners",
				"aria-hidden": "true",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("header", {
				className: "topbar",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "side",
						children: ceremony.grade
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "rotator",
						children: line
					}, line),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "side side-right",
						children: prettyWhen(ceremony.date, ceremony.time)
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				className: "hero",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "kicker",
						children: "Promoción"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
						className: "wordmark",
						onPointerDown: startHold,
						onPointerUp: endHold,
						onPointerLeave: endHold,
						onPointerCancel: endHold,
						onContextMenu: (event) => event.preventDefault(),
						children: ceremony.headline
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "coming",
						children: ceremony.comingLine
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Guardian, {}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "clock",
						role: "timer",
						"aria-label": spoken,
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Unit, {
								label: "Meses",
								value: clock ? pad2(clock.months) : "00"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Unit, {
								label: "Días",
								value: clock ? pad2(clock.days) : "00"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Unit, {
								label: "Horas",
								value: clock ? pad2(clock.hours) : "00"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Unit, {
								label: "Minutos",
								value: clock ? pad2(clock.minutes) : "00"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Unit, {
								label: "Segundos",
								value: clock ? pad2(clock.seconds) : "00"
							})
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "sr-only",
						children: spoken
					}),
					ceremony.venue ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "meta",
						children: [
							prettyWhen(ceremony.date, ceremony.time),
							" · ",
							ceremony.venue
						]
					}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "meta",
						children: prettyWhen(ceremony.date, ceremony.time)
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "binary",
				"aria-hidden": "true",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "binary-track",
					children: BINARY.repeat(4)
				})
			}),
			showFinale ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Finale, {
				ceremony: finaleSource,
				preview: forceFinale,
				onBack: forceFinale ? () => setForceFinale(false) : void 0
			}) : null,
			vaultOpen ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "vault-back",
				onMouseDown: (event) => {
					if (event.target === event.currentTarget) setVaultOpen(false);
				},
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("aside", {
					className: "vault",
					role: "dialog",
					"aria-modal": "true",
					"aria-labelledby": "vault-title",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "vault-head",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
							id: "vault-title",
							children: admin ? "Editar" : "Acceso"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "button",
							className: "icon-btn",
							"aria-label": "Cerrar",
							onClick: () => setVaultOpen(false),
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(X, { size: 18 })
						})]
					}), admin ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Editor, {
						draft,
						setDraft,
						busy,
						formError,
						formNote,
						updatedAt,
						onSave,
						onPreview: () => {
							setForceFinale(true);
							setVaultOpen(false);
						},
						onLeave: () => void onLeave()
					}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
						className: "stack",
						onSubmit: (event) => void onEnter(event),
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
								className: "field",
								children: ["Correo", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
									ref: emailRef,
									type: "email",
									name: "email",
									autoComplete: "username",
									inputMode: "email",
									value: email,
									onChange: (event) => setEmail(event.target.value),
									required: true
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
								className: "field",
								children: ["Contraseña", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
									type: "password",
									name: "password",
									autoComplete: "current-password",
									value: password,
									onChange: (event) => setPassword(event.target.value),
									required: true
								})]
							}),
							formError ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "form-error",
								children: formError
							}) : null,
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "vault-actions",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
									className: "btn btn-primary",
									type: "submit",
									disabled: busy,
									children: busy ? "Entrando" : "Entrar"
								})
							})
						]
					})]
				})
			}) : null,
			admin && !vaultOpen && !showFinale ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
				type: "button",
				className: "reopen",
				onClick: openVault,
				children: "Editar"
			}) : null
		]
	});
}
function Unit({ label, value }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "unit",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
			className: "digits",
			suppressHydrationWarning: true,
			children: value.split("").map((ch, index) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: "digit",
				children: ch
			}, `${index}-${ch}`))
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
			className: "unit-label",
			children: label
		})]
	});
}
function Finale({ ceremony, preview, onBack }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "finale",
		role: "status",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "finale-inner",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "finale-kicker",
					children: ceremony.finaleKicker || ceremony.promotion
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
					className: "finale-title",
					children: ceremony.finaleTitle
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "finale-rule" }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "finale-copy",
					children: paragraphs(ceremony.finaleBody).map((paragraph) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: paragraph }, paragraph.slice(0, 24)))
				}),
				ceremony.finaleSign ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "finale-sign",
					children: ceremony.finaleSign
				}) : null,
				preview && onBack ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "button",
					className: "finale-back",
					onClick: onBack,
					children: "Volver al reloj"
				}) : null
			]
		})
	});
}
function Editor({ draft, setDraft, busy, formError, formNote, updatedAt, onSave, onPreview, onLeave }) {
	function patch(partial) {
		setDraft({
			...draft,
			...partial
		});
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
		className: "stack",
		onSubmit: onSave,
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
				className: "form-note",
				children: ["Lo que guardes cambia la página para todos.", updatedAt ? ` Último cambio: ${updatedAt.slice(0, 16).replace("T", " ")}.` : ""]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
				className: "field",
				children: ["Promoción", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
					value: draft.promotion,
					maxLength: 40,
					onChange: (event) => patch({ promotion: event.target.value }),
					required: true
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "row-2",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
					className: "field",
					children: ["Grado", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
						value: draft.grade,
						maxLength: 40,
						onChange: (event) => patch({ grade: event.target.value }),
						required: true
					})]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
					className: "field",
					children: ["Titular", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
						value: draft.headline,
						maxLength: 32,
						onChange: (event) => patch({ headline: event.target.value }),
						required: true
					})]
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
				className: "field",
				children: ["Línea central", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
					value: draft.comingLine,
					maxLength: 48,
					onChange: (event) => patch({ comingLine: event.target.value }),
					required: true
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
				className: "field",
				children: ["Lugar", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
					value: draft.venue,
					maxLength: 80,
					onChange: (event) => patch({ venue: event.target.value })
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "row-2",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
					className: "field",
					children: ["Fecha", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
						type: "date",
						value: draft.date,
						onChange: (event) => patch({ date: event.target.value }),
						required: true
					})]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
					className: "field",
					children: ["Hora", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
						type: "time",
						value: draft.time,
						onChange: (event) => patch({ time: event.target.value }),
						required: true
					})]
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
				className: "field",
				children: ["Zona horaria", /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("select", {
					value: draft.timeZone,
					onChange: (event) => patch({ timeZone: event.target.value }),
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
							value: "America/Bogota",
							children: "Colombia (Bogotá)"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
							value: "America/Lima",
							children: "Perú (Lima)"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
							value: "America/Mexico_City",
							children: "México (Ciudad de México)"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
							value: "America/Chicago",
							children: "Centro de EE.UU."
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
							value: "America/New_York",
							children: "Este de EE.UU."
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
							value: "America/Santiago",
							children: "Chile (Santiago)"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
							value: "America/Argentina/Buenos_Aires",
							children: "Argentina (Buenos Aires)"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
							value: "Europe/Madrid",
							children: "España (Madrid)"
						})
					]
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
				className: "field",
				children: ["Color del reloj", /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("select", {
					value: draft.accent,
					onChange: (event) => patch({ accent: event.target.value }),
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
							value: "auto",
							children: "Esmeralda, carmesí el último día"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
							value: "emerald",
							children: "Siempre esmeralda"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
							value: "crimson",
							children: "Siempre carmesí"
						})
					]
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
				className: "field",
				children: ["Frases que rotan", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("textarea", {
					value: draft.lines.join("\n"),
					rows: 4,
					onChange: (event) => {
						const lines = event.target.value.split("\n").slice(0, 8).map((line) => line.slice(0, 48));
						patch({ lines: lines.length ? lines : [""] });
					}
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
				className: "field",
				children: ["Encabezado del mensaje", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
					value: draft.finaleKicker,
					maxLength: 80,
					onChange: (event) => patch({ finaleKicker: event.target.value })
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
				className: "field",
				children: ["Título del mensaje", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
					value: draft.finaleTitle,
					maxLength: 80,
					onChange: (event) => patch({ finaleTitle: event.target.value }),
					required: true
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
				className: "field",
				children: ["Mensaje al llegar a cero", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("textarea", {
					value: draft.finaleBody,
					maxLength: 2500,
					onChange: (event) => patch({ finaleBody: event.target.value }),
					required: true
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
				className: "field",
				children: ["Firma", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
					value: draft.finaleSign,
					maxLength: 160,
					onChange: (event) => patch({ finaleSign: event.target.value })
				})]
			}),
			formError ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "form-error",
				children: formError
			}) : null,
			formNote ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "form-note",
				children: formNote
			}) : null,
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "vault-actions",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						className: "btn btn-primary",
						type: "submit",
						disabled: busy,
						children: busy ? "Guardando" : "Guardar"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						className: "btn btn-ghost",
						type: "button",
						onClick: onPreview,
						children: "Ver el mensaje"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						className: "btn btn-ghost",
						type: "button",
						onClick: onLeave,
						disabled: busy,
						children: "Salir"
					})
				]
			})
		]
	});
}
function StainedGlass() {
	const uid = (0, import_react.useId)().replace(/:/g, "");
	const panes = [];
	const count = 18;
	for (let i = 0; i < count; i += 1) {
		const a0 = i / count * Math.PI * 2 - Math.PI / 2 + .02;
		const a1 = (i + 1) / count * Math.PI * 2 - Math.PI / 2 - .02;
		const tone = i % 5 === 0 ? "pane pane-bright" : i % 2 === 0 ? "pane pane-mid" : "pane";
		panes.push(/* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", {
			className: tone,
			d: annulus(50, 50, 16, 46, a0, a1),
			style: { animationDelay: `${i * .25}s` }
		}, i));
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("svg", {
		className: "glass",
		viewBox: "0 0 100 100",
		role: "presentation",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("defs", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("radialGradient", {
				id: `${uid}-g`,
				cx: "50%",
				cy: "46%",
				r: "50%",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("stop", {
						offset: "0%",
						stopColor: "#143222"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("stop", {
						offset: "70%",
						stopColor: "#07140d"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("stop", {
						offset: "100%",
						stopColor: "#030504"
					})
				]
			}) }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("circle", {
				cx: "50",
				cy: "50",
				r: "49",
				fill: `url(#${uid}-g)`
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("g", {
				className: "glass-ring",
				children: panes
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("circle", {
				className: "pane-core",
				cx: "50",
				cy: "50",
				r: "15.2"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", {
				className: "lemniscate",
				d: "M50 50 C 50 44, 42 42, 38 46 C 34 50, 40 54, 50 50 C 60 46, 66 50, 62 54 C 58 58, 50 56, 50 50 Z"
			}),
			Array.from({ length: 48 }, (_, i) => {
				const a = i / 48 * Math.PI * 2;
				const inner = i % 4 === 0 ? 46.4 : 47.3;
				return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("line", {
					x1: 50 + Math.cos(a) * inner,
					y1: 50 + Math.sin(a) * inner,
					x2: 50 + Math.cos(a) * 48.6,
					y2: 50 + Math.sin(a) * 48.6,
					stroke: "#9bb5a4",
					strokeWidth: "0.25"
				}, i);
			})
		]
	});
}
function annulus(cx, cy, r0, r1, a0, a1) {
	const p = (r, a) => `${cx + Math.cos(a) * r} ${cy + Math.sin(a) * r}`;
	const large = a1 - a0 > Math.PI ? 1 : 0;
	return `M ${p(r0, a0)} A ${r0} ${r0} 0 ${large} 1 ${p(r0, a1)} L ${p(r1, a1)} A ${r1} ${r1} 0 ${large} 0 ${p(r1, a0)} Z`;
}
function Guardian() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("svg", {
		className: "guardian",
		viewBox: "0 0 400 460",
		"aria-hidden": "true",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("defs", { children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("linearGradient", {
					id: "cloth",
					x1: "0",
					y1: "0",
					x2: "0",
					y2: "1",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("stop", {
							offset: "0%",
							stopColor: "#123628"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("stop", {
							offset: "55%",
							stopColor: "#07140e"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("stop", {
							offset: "100%",
							stopColor: "#030504",
							stopOpacity: "0"
						})
					]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("linearGradient", {
					id: "metal",
					x1: "0",
					y1: "0",
					x2: "0",
					y2: "1",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("stop", {
							offset: "0%",
							stopColor: "#e7f2ea"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("stop", {
							offset: "42%",
							stopColor: "#8ea396"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("stop", {
							offset: "100%",
							stopColor: "#24342c"
						})
					]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("linearGradient", {
					id: "hood",
					x1: "0",
					y1: "0",
					x2: "0",
					y2: "1",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("stop", {
						offset: "0%",
						stopColor: "#1a4a32"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("stop", {
						offset: "100%",
						stopColor: "#06140e"
					})]
				})
			] }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", {
				fill: "url(#cloth)",
				d: "M200 168 C 120 210 48 300 12 460 L 388 460 C 352 300 280 210 200 168 Z"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", {
				fill: "url(#hood)",
				d: "M200 28 C 118 28 78 108 86 196 C 104 150 146 124 200 124 C 254 124 296 150 314 196 C 322 108 282 28 200 28 Z"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", {
				fill: "#06140e",
				d: "M132 168 C 150 118 250 118 268 168 C 250 142 150 142 132 168 Z"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", {
				fill: "url(#metal)",
				d: "M158 132 C 158 104 176 86 200 86 C 224 86 242 104 242 132 L 248 214 C 248 252 228 274 200 274 C 172 274 152 252 152 214 Z"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("rect", {
				className: "visor",
				x: "168",
				y: "156",
				width: "64",
				height: "11",
				rx: "1.5"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", {
				fill: "none",
				stroke: "#1c3a2c",
				strokeWidth: "3",
				d: "M176 214 C 184 236 216 236 224 214"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", {
				fill: "none",
				stroke: "currentColor",
				strokeWidth: "2.2",
				opacity: "0.85",
				d: "M186 248 C 186 240 194 236 200 240 C 206 244 214 240 214 248 C 214 256 206 260 200 256 C 194 252 186 256 186 248 Z"
			})
		]
	});
}
function Skyline() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("svg", {
		className: "skyline",
		viewBox: "0 0 1600 260",
		preserveAspectRatio: "none",
		"aria-hidden": "true",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Buildings, { heights: SKY_A }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Buildings, {
			heights: SKY_B,
			className: "skyline-b"
		})]
	});
}
function Buildings({ heights, className }) {
	const width = 1600 / heights.length;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("g", {
		className,
		fill: "#03110b",
		children: heights.map((height, index) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("rect", {
			x: index * width,
			y: 260 - height * 3.2,
			width: width - 6,
			height: height * 3.2
		}, index))
	});
}
function Motes() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_jsx_runtime.Fragment, { children: [
		[12, 70],
		[22, 40],
		[38, 80],
		[54, 30],
		[68, 62],
		[80, 44],
		[88, 74],
		[46, 58]
	].map(([left, delay]) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
		className: "mote",
		style: {
			left: `${left}%`,
			bottom: "8%",
			animationDelay: `${delay / 12}s`
		}
	}, `${left}-${delay}`)) });
}
function Grain() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("svg", {
		className: "grain",
		"aria-hidden": "true",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("filter", {
			id: "grain-filter",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("feTurbulence", {
				type: "fractalNoise",
				baseFrequency: "0.85",
				numOctaves: "2",
				stitchTiles: "stitch"
			})
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("rect", {
			width: "100%",
			height: "100%",
			filter: "url(#grain-filter)"
		})]
	});
}
function Home() {
	const initial = Route.useLoaderData();
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AeternumClock, { initial });
}
//#endregion
export { Home as component };
