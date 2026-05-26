import { j as derived, t as props_id, l as attributes, p as bind_props, c as clsx, q as fallback, a as attr_class, i as escape_html, f as spread_props, o as head } from "../../../chunks/index2.js";
import { g as goto } from "../../../chunks/client.js";
import { P as PageHeader } from "../../../chunks/PageHeader.js";
import { o as onDestroy } from "../../../chunks/index-server2.js";
import { c as cn, B as Button } from "../../../chunks/button.js";
import { r as request } from "../../../chunks/api.js";
import { e as examStore } from "../../../chunks/exam-store.js";
import { C as Card, a as Card_content, L as Label, I as Input } from "../../../chunks/label.js";
import { B as Badge } from "../../../chunks/badge.js";
import { A as Alert } from "../../../chunks/alert.js";
import { A as Alert_description } from "../../../chunks/alert-description.js";
import { a as attachRef, b as boolToStrTrueOrUndef, c as createBitsAttrs, d as createId, e as boxWith, m as mergeProps } from "../../../chunks/create-id.js";
import { C as Circle_check } from "../../../chunks/circle-check.js";
import { I as Icon } from "../../../chunks/Icon.js";
function verifyExamCode(code) {
  return request("POST", "/exams/verify-code", { code });
}
const separatorAttrs = createBitsAttrs({ component: "separator", parts: ["root"] });
class SeparatorRootState {
  static create(opts) {
    return new SeparatorRootState(opts);
  }
  opts;
  attachment;
  constructor(opts) {
    this.opts = opts;
    this.attachment = attachRef(opts.ref);
  }
  #props = derived(() => ({
    id: this.opts.id.current,
    role: this.opts.decorative.current ? "none" : "separator",
    "aria-orientation": this.opts.orientation.current,
    "aria-hidden": boolToStrTrueOrUndef(this.opts.decorative.current),
    "data-orientation": this.opts.orientation.current,
    [separatorAttrs.root]: "",
    ...this.attachment
  }));
  get props() {
    return this.#props();
  }
  set props($$value) {
    return this.#props($$value);
  }
}
function Separator$1($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    const uid = props_id($$renderer2);
    let {
      id = createId(uid),
      ref = null,
      child,
      children,
      decorative = false,
      orientation = "horizontal",
      $$slots,
      $$events,
      ...restProps
    } = $$props;
    const rootState = SeparatorRootState.create({
      ref: boxWith(() => ref, (v) => ref = v),
      id: boxWith(() => id),
      decorative: boxWith(() => decorative),
      orientation: boxWith(() => orientation)
    });
    const mergedProps = derived(() => mergeProps(restProps, rootState.props));
    if (child) {
      $$renderer2.push("<!--[0-->");
      child($$renderer2, { props: mergedProps() });
      $$renderer2.push(`<!---->`);
    } else {
      $$renderer2.push("<!--[-1-->");
      $$renderer2.push(`<div${attributes({ ...mergedProps() })}>`);
      children?.($$renderer2);
      $$renderer2.push(`<!----></div>`);
    }
    $$renderer2.push(`<!--]-->`);
    bind_props($$props, { ref });
  });
}
function Alert_title($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let {
      ref = null,
      class: className,
      children,
      $$slots,
      $$events,
      ...restProps
    } = $$props;
    $$renderer2.push(`<div${attributes({
      "data-slot": "alert-title",
      class: clsx(cn("font-medium group-has-[>svg]/alert:col-start-2 [&_a]:hover:text-foreground [&_a]:underline [&_a]:underline-offset-3", className)),
      ...restProps
    })}>`);
    children?.($$renderer2);
    $$renderer2.push(`<!----></div>`);
    bind_props($$props, { ref });
  });
}
function ExamCountdown($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let endsMs, remainingMs, remainingSec, isExpired, warnLevel, display;
    let endsAt = fallback($$props["endsAt"], "");
    let onExpired = fallback($$props["onExpired"], null);
    let now = Date.now();
    let timer = null;
    let expiredFired = false;
    function getEndsMs() {
      if (!endsAt) return null;
      const d = new Date(endsAt);
      const ms = d.getTime();
      return Number.isFinite(ms) ? ms : null;
    }
    function tick() {
      now = Date.now();
    }
    function pad2(n) {
      return String(n).padStart(2, "0");
    }
    if (typeof window !== "undefined") {
      timer = setInterval(tick, 1e3);
    }
    onDestroy(() => {
      if (timer) clearInterval(timer);
    });
    endsMs = getEndsMs();
    remainingMs = endsMs == null ? null : Math.max(0, endsMs - now);
    remainingSec = remainingMs == null ? null : Math.floor(remainingMs / 1e3);
    isExpired = remainingSec != null && remainingSec <= 0;
    warnLevel = remainingSec == null ? "unknown" : remainingSec <= 60 ? "critical" : remainingSec <= 5 * 60 ? "warning" : "normal";
    display = (() => {
      if (remainingSec == null) return "—";
      const total = remainingSec;
      const h = Math.floor(total / 3600);
      const m = Math.floor(total % 3600 / 60);
      const s = total % 60;
      if (h > 0) return `${pad2(h)}:${pad2(m)}:${pad2(s)}`;
      return `${pad2(m)}:${pad2(s)}`;
    })();
    if (isExpired && !expiredFired) {
      expiredFired = true;
      if (typeof onExpired === "function") {
        try {
          onExpired();
        } catch {
        }
      }
    }
    $$renderer2.push(`<div${attr_class(clsx(cn("sticky top-3 z-[120] ml-auto inline-flex w-fit items-center gap-2 rounded-full border bg-card/95 px-3 py-1.5 shadow-sm backdrop-blur pointer-events-none", warnLevel === "warning" && "border-amber-300/50 bg-amber-50 text-amber-900", warnLevel === "critical" && "animate-pulse border-red-300/50 bg-red-50 text-red-900")))}><span class="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Tiempo</span> `);
    if (isExpired) {
      $$renderer2.push("<!--[0-->");
      $$renderer2.push(`<strong class="font-mono text-sm">Tiempo agotado</strong>`);
    } else {
      $$renderer2.push("<!--[-1-->");
      $$renderer2.push(`<strong class="font-mono text-sm tabular-nums">${escape_html(display)}</strong>`);
    }
    $$renderer2.push(`<!--]--></div>`);
    bind_props($$props, { endsAt, onExpired });
  });
}
function Separator($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let {
      ref = null,
      class: className,
      "data-slot": dataSlot = "separator",
      $$slots,
      $$events,
      ...restProps
    } = $$props;
    let $$settled = true;
    let $$inner_renderer;
    function $$render_inner($$renderer3) {
      if (Separator$1) {
        $$renderer3.push("<!--[-->");
        Separator$1($$renderer3, spread_props([
          {
            "data-slot": dataSlot,
            class: cn("bg-border shrink-0 data-[orientation=horizontal]:h-px data-[orientation=horizontal]:w-full data-[orientation=vertical]:w-px", "data-[orientation=vertical]:h-full", className)
          },
          restProps,
          {
            get ref() {
              return ref;
            },
            set ref($$value) {
              ref = $$value;
              $$settled = false;
            }
          }
        ]));
        $$renderer3.push("<!--]-->");
      } else {
        $$renderer3.push("<!--[!-->");
        $$renderer3.push("<!--]-->");
      }
    }
    do {
      $$settled = true;
      $$inner_renderer = $$renderer2.copy();
      $$render_inner($$inner_renderer);
    } while (!$$settled);
    $$renderer2.subsume($$inner_renderer);
    bind_props($$props, { ref });
  });
}
function Play($$renderer, $$props) {
  let { $$slots, $$events, ...props } = $$props;
  const iconNode = [
    [
      "path",
      {
        "d": "M5 5a2 2 0 0 1 3.008-1.728l11.997 6.998a2 2 0 0 1 .003 3.458l-12 7A2 2 0 0 1 5 19z"
      }
    ]
  ];
  Icon($$renderer, spread_props([{ name: "play" }, props, { iconNode }]));
}
function _page($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let code = "";
    let examCodeInput = null;
    let loading = false;
    let invalidMessage = "";
    let notFoundMessage = "";
    let finishedMessage = "";
    let notStartedMessage = "";
    let notStartedAt = "";
    let networkMessage = "";
    let successMessage = "";
    let foundExam = null;
    const TXT = {
      focus: "Supervisión",
      subtitle: "Ingresa el código del examen para validar tu acceso antes de iniciar la supervisión.",
      codeLabel: "Código de examen",
      verify: "Verificar código",
      start: "Iniciar supervisión",
      otherCode: "Usar otro código",
      codeShort: "Código"
    };
    function normalizeCode(value) {
      return String(value ?? "").toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 6);
    }
    function clearFormMessages() {
      invalidMessage = "";
      notFoundMessage = "";
      finishedMessage = "";
      notStartedMessage = "";
      notStartedAt = "";
      networkMessage = "";
      successMessage = "";
      foundExam = null;
    }
    function onCodeInput() {
      code = normalizeCode(code);
      clearFormMessages();
    }
    function resolveCodeForVerify() {
      const fromState = normalizeCode(code);
      const fromDom = examCodeInput?.value != null ? normalizeCode(examCodeInput.value) : "";
      return fromDom.length > fromState.length ? fromDom : fromState;
    }
    function fmtEndsAt(value) {
      if (!value) return null;
      return new Date(value).toLocaleString("es", { dateStyle: "medium", timeStyle: "short" });
    }
    async function handleVerify() {
      const normalized = resolveCodeForVerify();
      code = normalized;
      if (normalized.length !== 6) {
        invalidMessage = "El código debe tener exactamente 6 caracteres.";
        return;
      }
      loading = true;
      clearFormMessages();
      try {
        const exam = await verifyExamCode(normalized);
        foundExam = exam;
        examStore.set({
          id: exam.id,
          name: exam.name,
          ends_at: exam.ends_at ?? null,
          code: exam.code,
          expired_at: null,
          joinable: true
        });
        successMessage = `Examen encontrado: ${exam.name}`;
      } catch (e) {
        const msg = e?.message ?? "";
        if (e?.code === "EXAM_NOT_STARTED") {
          notStartedMessage = msg || "Este examen aún no ha comenzado.";
          if (e.scheduledAt) {
            notStartedAt = fmtEndsAt(e.scheduledAt);
          }
          code = "";
        } else if (msg.includes("CODE_NOT_FOUND")) {
          notFoundMessage = "Código no encontrado. Verifica el código con tu profesor.";
          code = "";
        } else if (msg.includes("EXAM_FINISHED")) {
          finishedMessage = "Este examen ya finalizó.";
          code = "";
        } else if (msg.trim()) {
          networkMessage = msg;
        } else {
          networkMessage = "Error de conexión. Verifica que el servidor esté activo.";
        }
      } finally {
        loading = false;
      }
    }
    function handleCodeKeydown(event) {
      if (event.key === "Enter") {
        event.preventDefault();
        handleVerify();
      }
    }
    function startProctoring() {
      if (!foundExam) return;
      goto();
    }
    let $$settled = true;
    let $$inner_renderer;
    function $$render_inner($$renderer3) {
      head("1hysupz", $$renderer3, ($$renderer4) => {
        $$renderer4.title(($$renderer5) => {
          $$renderer5.push(`<title>Unirse a examen | Procto</title>`);
        });
      });
      $$renderer3.push(`<div class="mx-auto max-w-lg">`);
      PageHeader($$renderer3, {
        focus: TXT.focus,
        title: "Unirse a un examen",
        subtitle: TXT.subtitle
      });
      $$renderer3.push(`<!----> `);
      Card($$renderer3, {
        class: "rounded-xl border-border/80 shadow-sm",
        children: ($$renderer4) => {
          Card_content($$renderer4, {
            class: "space-y-5 pt-6",
            children: ($$renderer5) => {
              if (!foundExam) {
                $$renderer5.push("<!--[0-->");
                $$renderer5.push(`<div class="space-y-2">`);
                Label($$renderer5, {
                  for: "examCode",
                  children: ($$renderer6) => {
                    $$renderer6.push(`<!---->${escape_html(TXT.codeLabel)}`);
                  },
                  $$slots: { default: true }
                });
                $$renderer5.push(`<!----> `);
                Input($$renderer5, {
                  id: "examCode",
                  type: "text",
                  oninput: onCodeInput,
                  onkeydown: handleCodeKeydown,
                  maxlength: 6,
                  placeholder: "ABC123",
                  autocomplete: "off",
                  class: "h-14 text-center text-2xl font-bold uppercase tracking-[0.2em]",
                  get ref() {
                    return examCodeInput;
                  },
                  set ref($$value) {
                    examCodeInput = $$value;
                    $$settled = false;
                  },
                  get value() {
                    return code;
                  },
                  set value($$value) {
                    code = $$value;
                    $$settled = false;
                  }
                });
                $$renderer5.push(`<!----> <p class="text-center text-xs text-muted-foreground">6 caracteres, sin espacios</p></div> `);
                Button($$renderer5, {
                  type: "button",
                  class: "w-full",
                  onclick: handleVerify,
                  disabled: loading,
                  children: ($$renderer6) => {
                    $$renderer6.push(`<!---->${escape_html(loading ? "Verificando..." : TXT.verify)}`);
                  },
                  $$slots: { default: true }
                });
                $$renderer5.push(`<!---->`);
              } else {
                $$renderer5.push("<!--[-1-->");
                $$renderer5.push(`<div class="rounded-xl border border-emerald-500/30 bg-emerald-50/80 p-5 dark:border-emerald-500/25 dark:bg-emerald-950/40"><div class="flex items-start gap-3">`);
                Circle_check($$renderer5, {
                  class: "mt-0.5 size-6 shrink-0 text-emerald-600 dark:text-emerald-400"
                });
                $$renderer5.push(`<!----> <div class="min-w-0 flex-1 space-y-2"><p class="text-sm font-medium text-emerald-900 dark:text-emerald-100">Acceso confirmado</p> <p class="text-lg font-semibold leading-tight text-foreground">${escape_html(foundExam.name)}</p> <div class="flex flex-wrap items-center gap-2"><span class="text-xs text-muted-foreground">${escape_html(TXT.codeShort)}</span> `);
                Badge($$renderer5, {
                  variant: "outline",
                  class: "font-mono tracking-wider",
                  children: ($$renderer6) => {
                    $$renderer6.push(`<!---->${escape_html(foundExam.code)}`);
                  },
                  $$slots: { default: true }
                });
                $$renderer5.push(`<!----></div> `);
                if (foundExam.ends_at) {
                  $$renderer5.push("<!--[0-->");
                  $$renderer5.push(`<p class="text-sm text-muted-foreground">Finaliza: ${escape_html(fmtEndsAt(foundExam.ends_at))}</p> `);
                  ExamCountdown($$renderer5, { endsAt: foundExam.ends_at });
                  $$renderer5.push(`<!---->`);
                } else {
                  $$renderer5.push("<!--[-1-->");
                }
                $$renderer5.push(`<!--]--></div></div></div> `);
                Separator($$renderer5, {});
                $$renderer5.push(`<!----> `);
                Button($$renderer5, {
                  type: "button",
                  size: "lg",
                  class: "h-12 w-full gap-2 text-base",
                  onclick: startProctoring,
                  children: ($$renderer6) => {
                    Play($$renderer6, { class: "size-5" });
                    $$renderer6.push(`<!----> ${escape_html(TXT.start)}`);
                  },
                  $$slots: { default: true }
                });
                $$renderer5.push(`<!----> `);
                Button($$renderer5, {
                  type: "button",
                  variant: "ghost",
                  class: "w-full text-muted-foreground",
                  onclick: () => {
                    foundExam = null;
                    successMessage = "";
                    code = "";
                  },
                  children: ($$renderer6) => {
                    $$renderer6.push(`<!---->${escape_html(TXT.otherCode)}`);
                  },
                  $$slots: { default: true }
                });
                $$renderer5.push(`<!---->`);
              }
              $$renderer5.push(`<!--]--> `);
              if (invalidMessage) {
                $$renderer5.push("<!--[0-->");
                Alert($$renderer5, {
                  variant: "destructive",
                  children: ($$renderer6) => {
                    Alert_description($$renderer6, {
                      children: ($$renderer7) => {
                        $$renderer7.push(`<!---->${escape_html(invalidMessage)}`);
                      },
                      $$slots: { default: true }
                    });
                  },
                  $$slots: { default: true }
                });
              } else {
                $$renderer5.push("<!--[-1-->");
              }
              $$renderer5.push(`<!--]--> `);
              if (notFoundMessage) {
                $$renderer5.push("<!--[0-->");
                Alert($$renderer5, {
                  variant: "destructive",
                  children: ($$renderer6) => {
                    Alert_description($$renderer6, {
                      children: ($$renderer7) => {
                        $$renderer7.push(`<!---->${escape_html(notFoundMessage)}`);
                      },
                      $$slots: { default: true }
                    });
                  },
                  $$slots: { default: true }
                });
              } else {
                $$renderer5.push("<!--[-1-->");
              }
              $$renderer5.push(`<!--]--> `);
              if (notStartedMessage) {
                $$renderer5.push("<!--[0-->");
                Alert($$renderer5, {
                  class: "border-amber-500/40 bg-amber-500/10",
                  children: ($$renderer6) => {
                    Alert_title($$renderer6, {
                      class: "text-sm font-semibold",
                      children: ($$renderer7) => {
                        $$renderer7.push(`<!---->Examen no disponible aún`);
                      },
                      $$slots: { default: true }
                    });
                    $$renderer6.push(`<!----> `);
                    Alert_description($$renderer6, {
                      class: "text-sm",
                      children: ($$renderer7) => {
                        $$renderer7.push(`<!---->${escape_html(notStartedMessage)} `);
                        if (notStartedAt) {
                          $$renderer7.push("<!--[0-->");
                          $$renderer7.push(`<span class="mt-1 block">Podrás unirte a partir del ${escape_html(notStartedAt)}.</span>`);
                        } else {
                          $$renderer7.push("<!--[-1-->");
                        }
                        $$renderer7.push(`<!--]-->`);
                      },
                      $$slots: { default: true }
                    });
                    $$renderer6.push(`<!---->`);
                  },
                  $$slots: { default: true }
                });
              } else {
                $$renderer5.push("<!--[-1-->");
              }
              $$renderer5.push(`<!--]--> `);
              if (finishedMessage) {
                $$renderer5.push("<!--[0-->");
                Alert($$renderer5, {
                  children: ($$renderer6) => {
                    Alert_description($$renderer6, {
                      children: ($$renderer7) => {
                        $$renderer7.push(`<!---->${escape_html(finishedMessage)}`);
                      },
                      $$slots: { default: true }
                    });
                  },
                  $$slots: { default: true }
                });
              } else {
                $$renderer5.push("<!--[-1-->");
              }
              $$renderer5.push(`<!--]--> `);
              if (networkMessage) {
                $$renderer5.push("<!--[0-->");
                Alert($$renderer5, {
                  variant: "destructive",
                  children: ($$renderer6) => {
                    Alert_description($$renderer6, {
                      children: ($$renderer7) => {
                        $$renderer7.push(`<!---->${escape_html(networkMessage)}`);
                      },
                      $$slots: { default: true }
                    });
                  },
                  $$slots: { default: true }
                });
              } else {
                $$renderer5.push("<!--[-1-->");
              }
              $$renderer5.push(`<!--]--> `);
              if (successMessage && !foundExam) {
                $$renderer5.push("<!--[0-->");
                Alert($$renderer5, {
                  class: cn("border-emerald-500/30 bg-emerald-50 text-emerald-900", "dark:border-emerald-500/25 dark:bg-emerald-950/40 dark:text-emerald-100"),
                  children: ($$renderer6) => {
                    Alert_description($$renderer6, {
                      children: ($$renderer7) => {
                        $$renderer7.push(`<!---->${escape_html(successMessage)}`);
                      },
                      $$slots: { default: true }
                    });
                  },
                  $$slots: { default: true }
                });
              } else {
                $$renderer5.push("<!--[-1-->");
              }
              $$renderer5.push(`<!--]-->`);
            },
            $$slots: { default: true }
          });
        },
        $$slots: { default: true }
      });
      $$renderer3.push(`<!----></div>`);
    }
    do {
      $$settled = true;
      $$inner_renderer = $$renderer2.copy();
      $$render_inner($$inner_renderer);
    } while (!$$settled);
    $$renderer2.subsume($$inner_renderer);
  });
}
export {
  _page as default
};
