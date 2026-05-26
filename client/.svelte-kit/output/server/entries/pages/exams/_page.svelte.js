import { f as spread_props, m as store_get, u as unsubscribe_stores, o as head, b as attr, i as escape_html, e as ensure_array_like, k as stringify } from "../../../chunks/index2.js";
import { b as browser } from "../../../chunks/false.js";
import { g as goto } from "../../../chunks/client.js";
import { a as authStore } from "../../../chunks/auth.js";
import { b as showToast } from "../../../chunks/stores.js";
import { P as PageHeader } from "../../../chunks/PageHeader.js";
import { C as Card, L as Label, I as Input, a as Card_content } from "../../../chunks/label.js";
import { C as Card_header, a as Card_title, b as Card_description, c as Card_footer } from "../../../chunks/card-title.js";
import { B as Button, c as cn } from "../../../chunks/button.js";
import { T as Table, a as Table_header, b as Table_row, c as Table_head, d as Table_body, e as Table_cell } from "../../../chunks/table-row.js";
import { D as Dialog, a as Dialog_content, b as Dialog_header, c as Dialog_title, d as Dialog_description, e as Dialog_footer } from "../../../chunks/dialog-description.js";
import { B as Badge } from "../../../chunks/badge.js";
import "../../../chunks/alert.js";
import { S as Skeleton } from "../../../chunks/skeleton.js";
import { I as Icon } from "../../../chunks/Icon.js";
function deriveExamUiStatus(exam) {
  const status = (exam?.status || "scheduled").toLowerCase();
  const now = Date.now();
  const endsMs = exam?.ends_at ? new Date(exam.ends_at).getTime() : null;
  const startsMs = exam?.scheduled_at ? new Date(exam.scheduled_at).getTime() : null;
  if (status === "finished" || endsMs != null && Number.isFinite(endsMs) && now >= endsMs) {
    return "finalizado";
  }
  if (status === "active") {
    return "activo";
  }
  if (startsMs != null && Number.isFinite(startsMs) && now >= startsMs && (endsMs == null || !Number.isFinite(endsMs) || now < endsMs)) {
    return "activo";
  }
  return "pendiente";
}
function examStatusLabel(uiStatus) {
  const labels = {
    pendiente: "Pendiente",
    activo: "En progreso",
    finalizado: "Finalizado"
  };
  return labels[uiStatus] ?? "Pendiente";
}
function examStatusBadgeClass(uiStatus) {
  switch (uiStatus) {
    case "activo":
      return "border-emerald-500/40 bg-emerald-50 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-200";
    case "finalizado":
      return "border-border bg-muted text-muted-foreground";
    default:
      return "border-amber-500/40 bg-amber-50 text-amber-900 dark:bg-amber-950/40 dark:text-amber-100";
  }
}
function Clipboard_list($$renderer, $$props) {
  let { $$slots, $$events, ...props } = $$props;
  const iconNode = [
    [
      "rect",
      {
        "width": "8",
        "height": "4",
        "x": "8",
        "y": "2",
        "rx": "1",
        "ry": "1"
      }
    ],
    [
      "path",
      {
        "d": "M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"
      }
    ],
    ["path", { "d": "M12 11h4" }],
    ["path", { "d": "M12 16h4" }],
    ["path", { "d": "M8 11h.01" }],
    ["path", { "d": "M8 16h.01" }]
  ];
  Icon($$renderer, spread_props([{ name: "clipboard-list" }, props, { iconNode }]));
}
function _page($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    var $$store_subs;
    let professorReady, authPending, filteredExams, showEmptyState, showNoSearchResults, showTable, showLoadingState;
    const DURATION_PRESETS = [30, 45, 60, 90, 120];
    const DESCRIPTION_MAX = 500;
    const DESCRIPTION_PREVIEW_MAX = 60;
    let descriptionDialogOpen = false;
    let descriptionDialogText = "";
    let descriptionDialogTitle = "";
    let saving = false;
    let exams = [];
    let createDialogOpen = false;
    let hasLoadedOnce = false;
    let searchQuery = "";
    let name = "";
    let description = "";
    let durationPreset = 60;
    let customDuration = "";
    let useCustomDuration = false;
    let scheduledAt = defaultScheduledLocal();
    function pad2(n) {
      return String(n).padStart(2, "0");
    }
    function defaultScheduledLocal() {
      const d = /* @__PURE__ */ new Date();
      d.setMinutes(d.getMinutes() + 15);
      d.setSeconds(0, 0);
      return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}T${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
    }
    function resetCreateForm() {
      name = "";
      description = "";
      durationPreset = 60;
      customDuration = "";
      useCustomDuration = false;
      scheduledAt = defaultScheduledLocal();
    }
    function openCreateDialog() {
      resetCreateForm();
      createDialogOpen = true;
    }
    function fmtDate(value) {
      if (!value) return "—";
      return new Date(value).toLocaleString("es");
    }
    function openSessions(examId) {
      goto();
    }
    function openDescriptionDialog(exam) {
      if (!exam?.description?.trim()) return;
      descriptionDialogTitle = exam.name;
      descriptionDialogText = exam.description;
      descriptionDialogOpen = true;
    }
    function descriptionPreview(text) {
      if (!text?.trim()) return "";
      const t = text.trim();
      return t.length > DESCRIPTION_PREVIEW_MAX ? `${t.slice(0, DESCRIPTION_PREVIEW_MAX)}…` : t;
    }
    function needsDescriptionMore(text) {
      return (text?.trim()?.length ?? 0) > DESCRIPTION_PREVIEW_MAX;
    }
    async function copyDescription() {
      if (!descriptionDialogText || typeof navigator === "undefined") return;
      try {
        await navigator.clipboard.writeText(descriptionDialogText);
        showToast("Descripción copiada.", "success");
      } catch {
        showToast("No se pudo copiar el texto.", "error");
      }
    }
    function selectPreset(minutes) {
      useCustomDuration = false;
      durationPreset = minutes;
    }
    professorReady = store_get($$store_subs ??= {}, "$authStore", authStore)?.role === "PROFESSOR" && !!store_get($$store_subs ??= {}, "$authStore", authStore)?.token;
    authPending = browser;
    filteredExams = exams.filter((exam) => {
      const q = searchQuery.trim().toLowerCase();
      if (!q) return true;
      return (exam.name ?? "").toLowerCase().includes(q) || (exam.code ?? "").toLowerCase().includes(q);
    });
    showEmptyState = hasLoadedOnce;
    showNoSearchResults = hasLoadedOnce;
    showTable = hasLoadedOnce;
    showLoadingState = authPending || professorReady && !hasLoadedOnce;
    let $$settled = true;
    let $$inner_renderer;
    function $$render_inner($$renderer3) {
      head("xt3a3", $$renderer3, ($$renderer4) => {
        $$renderer4.title(($$renderer5) => {
          $$renderer5.push(`<title>Exámenes | Procto</title>`);
        });
      });
      if (store_get($$store_subs ??= {}, "$authStore", authStore)?.role !== "PROFESSOR") {
        $$renderer3.push("<!--[0-->");
        Card($$renderer3, {
          class: "rounded-xl",
          children: ($$renderer4) => {
            Card_header($$renderer4, {
              children: ($$renderer5) => {
                Card_title($$renderer5, {
                  children: ($$renderer6) => {
                    $$renderer6.push(`<!---->Acceso restringido`);
                  },
                  $$slots: { default: true }
                });
                $$renderer5.push(`<!----> `);
                Card_description($$renderer5, {
                  children: ($$renderer6) => {
                    $$renderer6.push(`<!---->Solo los profesores pueden gestionar exámenes.`);
                  },
                  $$slots: { default: true }
                });
                $$renderer5.push(`<!---->`);
              },
              $$slots: { default: true }
            });
            $$renderer4.push(`<!----> `);
            Card_footer($$renderer4, {
              children: ($$renderer5) => {
                Button($$renderer5, {
                  variant: "secondary",
                  onclick: () => goto(),
                  children: ($$renderer6) => {
                    $$renderer6.push(`<!---->Volver`);
                  },
                  $$slots: { default: true }
                });
              },
              $$slots: { default: true }
            });
            $$renderer4.push(`<!---->`);
          },
          $$slots: { default: true }
        });
      } else {
        $$renderer3.push("<!--[-1-->");
        PageHeader($$renderer3, {
          focus: "Docencia",
          title: "Gestión de exámenes",
          subtitle: "Crea exámenes y revisa las supervisiones de cada uno.",
          $$slots: {
            actions: ($$renderer4) => {
              {
                Button($$renderer4, {
                  onclick: openCreateDialog,
                  children: ($$renderer5) => {
                    $$renderer5.push(`<!---->Crear examen`);
                  },
                  $$slots: { default: true }
                });
              }
            }
          }
        });
        $$renderer3.push(`<!----> `);
        Dialog($$renderer3, {
          get open() {
            return createDialogOpen;
          },
          set open($$value) {
            createDialogOpen = $$value;
            $$settled = false;
          },
          children: ($$renderer4) => {
            Dialog_content($$renderer4, {
              class: "sm:max-w-md",
              children: ($$renderer5) => {
                Dialog_header($$renderer5, {
                  children: ($$renderer6) => {
                    Dialog_title($$renderer6, {
                      children: ($$renderer7) => {
                        $$renderer7.push(`<!---->Nuevo examen`);
                      },
                      $$slots: { default: true }
                    });
                    $$renderer6.push(`<!----> `);
                    Dialog_description($$renderer6, {
                      children: ($$renderer7) => {
                        $$renderer7.push(`<!---->Los estudiantes usarán un código de 6 caracteres para unirse desde «Unirse a examen».`);
                      },
                      $$slots: { default: true }
                    });
                    $$renderer6.push(`<!---->`);
                  },
                  $$slots: { default: true }
                });
                $$renderer5.push(`<!----> <form class="grid gap-4"><div class="space-y-2">`);
                Label($$renderer5, {
                  for: "name",
                  children: ($$renderer6) => {
                    $$renderer6.push(`<!---->Nombre del examen`);
                  },
                  $$slots: { default: true }
                });
                $$renderer5.push(`<!----> `);
                Input($$renderer5, {
                  id: "name",
                  type: "text",
                  placeholder: "Ej. Parcial 1",
                  required: true,
                  get value() {
                    return name;
                  },
                  set value($$value) {
                    name = $$value;
                    $$settled = false;
                  }
                });
                $$renderer5.push(`<!----></div> <div class="space-y-2">`);
                Label($$renderer5, {
                  for: "desc",
                  children: ($$renderer6) => {
                    $$renderer6.push(`<!---->Descripción <span class="font-normal text-muted-foreground">(opcional)</span>`);
                  },
                  $$slots: { default: true }
                });
                $$renderer5.push(`<!----> <textarea id="desc" rows="2"${attr("maxlength", DESCRIPTION_MAX)} placeholder="Instrucciones o tema del examen" class="flex min-h-[72px] w-full rounded-lg border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">`);
                const $$body = escape_html(description);
                if ($$body) {
                  $$renderer5.push(`${$$body}`);
                }
                $$renderer5.push(`</textarea> <p class="text-right text-xs text-muted-foreground">${escape_html(description.length)}/500</p></div> <div class="space-y-2">`);
                Label($$renderer5, {
                  children: ($$renderer6) => {
                    $$renderer6.push(`<!---->Duración`);
                  },
                  $$slots: { default: true }
                });
                $$renderer5.push(`<!----> <div class="flex flex-wrap gap-2"><!--[-->`);
                const each_array = ensure_array_like(DURATION_PRESETS);
                for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
                  let minutes = each_array[$$index];
                  Button($$renderer5, {
                    type: "button",
                    size: "sm",
                    variant: !useCustomDuration && durationPreset === minutes ? "default" : "outline",
                    onclick: () => selectPreset(minutes),
                    children: ($$renderer6) => {
                      $$renderer6.push(`<!---->${escape_html(minutes)} min`);
                    },
                    $$slots: { default: true }
                  });
                }
                $$renderer5.push(`<!--]--> `);
                Button($$renderer5, {
                  type: "button",
                  size: "sm",
                  variant: useCustomDuration ? "default" : "outline",
                  onclick: () => {
                    useCustomDuration = true;
                  },
                  children: ($$renderer6) => {
                    $$renderer6.push(`<!---->Personalizado`);
                  },
                  $$slots: { default: true }
                });
                $$renderer5.push(`<!----></div> `);
                if (useCustomDuration) {
                  $$renderer5.push("<!--[0-->");
                  Input($$renderer5, {
                    type: "number",
                    min: "1",
                    placeholder: "Minutos",
                    class: "mt-2 max-w-[8rem]",
                    get value() {
                      return customDuration;
                    },
                    set value($$value) {
                      customDuration = $$value;
                      $$settled = false;
                    }
                  });
                } else {
                  $$renderer5.push("<!--[-1-->");
                }
                $$renderer5.push(`<!--]--></div> <div class="space-y-2">`);
                Label($$renderer5, {
                  for: "sched",
                  children: ($$renderer6) => {
                    $$renderer6.push(`<!---->Inicio programado`);
                  },
                  $$slots: { default: true }
                });
                $$renderer5.push(`<!----> `);
                Input($$renderer5, {
                  id: "sched",
                  type: "datetime-local",
                  get value() {
                    return scheduledAt;
                  },
                  set value($$value) {
                    scheduledAt = $$value;
                    $$settled = false;
                  }
                });
                $$renderer5.push(`<!----></div> `);
                {
                  $$renderer5.push("<!--[-1-->");
                }
                $$renderer5.push(`<!--]--> `);
                Dialog_footer($$renderer5, {
                  class: "gap-2 sm:gap-0",
                  children: ($$renderer6) => {
                    Button($$renderer6, {
                      type: "button",
                      variant: "outline",
                      onclick: () => createDialogOpen = false,
                      children: ($$renderer7) => {
                        $$renderer7.push(`<!---->Cancelar`);
                      },
                      $$slots: { default: true }
                    });
                    $$renderer6.push(`<!----> `);
                    Button($$renderer6, {
                      type: "submit",
                      disabled: saving,
                      children: ($$renderer7) => {
                        $$renderer7.push(`<!---->${escape_html("Crear examen")}`);
                      },
                      $$slots: { default: true }
                    });
                    $$renderer6.push(`<!---->`);
                  },
                  $$slots: { default: true }
                });
                $$renderer5.push(`<!----></form>`);
              },
              $$slots: { default: true }
            });
          },
          $$slots: { default: true }
        });
        $$renderer3.push(`<!----> `);
        Dialog($$renderer3, {
          get open() {
            return descriptionDialogOpen;
          },
          set open($$value) {
            descriptionDialogOpen = $$value;
            $$settled = false;
          },
          children: ($$renderer4) => {
            Dialog_content($$renderer4, {
              class: "max-w-lg",
              children: ($$renderer5) => {
                Dialog_header($$renderer5, {
                  children: ($$renderer6) => {
                    Dialog_title($$renderer6, {
                      children: ($$renderer7) => {
                        $$renderer7.push(`<!---->Descripción del examen`);
                      },
                      $$slots: { default: true }
                    });
                    $$renderer6.push(`<!----> `);
                    Dialog_description($$renderer6, {
                      children: ($$renderer7) => {
                        $$renderer7.push(`<!---->${escape_html(descriptionDialogTitle)}`);
                      },
                      $$slots: { default: true }
                    });
                    $$renderer6.push(`<!---->`);
                  },
                  $$slots: { default: true }
                });
                $$renderer5.push(`<!----> <div class="max-h-[min(50vh,20rem)] overflow-y-auto rounded-lg border border-border bg-muted/20 p-4"><p class="whitespace-pre-wrap break-words text-sm leading-relaxed text-foreground">${escape_html(descriptionDialogText)}</p></div> `);
                Dialog_footer($$renderer5, {
                  class: "gap-2 sm:gap-0",
                  children: ($$renderer6) => {
                    Button($$renderer6, {
                      type: "button",
                      variant: "ghost",
                      onclick: copyDescription,
                      children: ($$renderer7) => {
                        $$renderer7.push(`<!---->Copiar texto`);
                      },
                      $$slots: { default: true }
                    });
                    $$renderer6.push(`<!----> `);
                    Button($$renderer6, {
                      type: "button",
                      variant: "outline",
                      onclick: () => descriptionDialogOpen = false,
                      children: ($$renderer7) => {
                        $$renderer7.push(`<!---->Cerrar`);
                      },
                      $$slots: { default: true }
                    });
                    $$renderer6.push(`<!---->`);
                  },
                  $$slots: { default: true }
                });
                $$renderer5.push(`<!---->`);
              },
              $$slots: { default: true }
            });
          },
          $$slots: { default: true }
        });
        $$renderer3.push(`<!----> `);
        {
          $$renderer3.push("<!--[-1-->");
        }
        $$renderer3.push(`<!--]--> `);
        Card($$renderer3, {
          class: "rounded-xl",
          children: ($$renderer4) => {
            Card_content($$renderer4, {
              class: "pt-6",
              children: ($$renderer5) => {
                if (showLoadingState) {
                  $$renderer5.push("<!--[0-->");
                  $$renderer5.push(`<div class="space-y-2">`);
                  Skeleton($$renderer5, { class: "h-10 w-full" });
                  $$renderer5.push(`<!----> `);
                  Skeleton($$renderer5, { class: "h-10 w-full" });
                  $$renderer5.push(`<!----> `);
                  Skeleton($$renderer5, { class: "h-10 w-full" });
                  $$renderer5.push(`<!----></div>`);
                } else if (showEmptyState) {
                  $$renderer5.push("<!--[1-->");
                  $$renderer5.push(`<div class="flex flex-col items-center gap-4 py-12 text-center">`);
                  Clipboard_list($$renderer5, {
                    class: "size-10 text-muted-foreground/70",
                    "aria-hidden": "true"
                  });
                  $$renderer5.push(`<!----> <div><p class="font-medium tracking-tight text-foreground">Aún no has creado exámenes</p> <p class="mt-1 text-sm text-muted-foreground">Crea uno y comparte el código de 6 caracteres con tus estudiantes.</p></div> `);
                  Button($$renderer5, {
                    onclick: openCreateDialog,
                    children: ($$renderer6) => {
                      $$renderer6.push(`<!---->Crear examen`);
                    },
                    $$slots: { default: true }
                  });
                  $$renderer5.push(`<!----></div>`);
                } else if (showNoSearchResults) {
                  $$renderer5.push("<!--[2-->");
                  $$renderer5.push(`<p class="py-8 text-center text-sm text-muted-foreground">Ningún examen coincide con «${escape_html(searchQuery.trim())}».</p>`);
                } else if (showTable) {
                  $$renderer5.push("<!--[3-->");
                  $$renderer5.push(`<div class="mb-4 max-w-sm">`);
                  Label($$renderer5, {
                    for: "exam-search",
                    class: "sr-only",
                    children: ($$renderer6) => {
                      $$renderer6.push(`<!---->Buscar examen`);
                    },
                    $$slots: { default: true }
                  });
                  $$renderer5.push(`<!----> `);
                  Input($$renderer5, {
                    id: "exam-search",
                    type: "search",
                    placeholder: "Buscar por nombre o código…",
                    get value() {
                      return searchQuery;
                    },
                    set value($$value) {
                      searchQuery = $$value;
                      $$settled = false;
                    }
                  });
                  $$renderer5.push(`<!----></div> <div class="overflow-x-auto">`);
                  Table($$renderer5, {
                    class: "table-fixed w-full min-w-[720px] text-sm",
                    children: ($$renderer6) => {
                      Table_header($$renderer6, {
                        children: ($$renderer7) => {
                          Table_row($$renderer7, {
                            children: ($$renderer8) => {
                              Table_head($$renderer8, {
                                class: "w-[18%]",
                                children: ($$renderer9) => {
                                  $$renderer9.push(`<!---->Nombre`);
                                },
                                $$slots: { default: true }
                              });
                              $$renderer8.push(`<!----> `);
                              Table_head($$renderer8, {
                                class: "w-[10%]",
                                children: ($$renderer9) => {
                                  $$renderer9.push(`<!---->Código`);
                                },
                                $$slots: { default: true }
                              });
                              $$renderer8.push(`<!----> `);
                              Table_head($$renderer8, {
                                class: "w-[12%]",
                                children: ($$renderer9) => {
                                  $$renderer9.push(`<!---->Estado`);
                                },
                                $$slots: { default: true }
                              });
                              $$renderer8.push(`<!----> `);
                              Table_head($$renderer8, {
                                class: "w-[22%]",
                                children: ($$renderer9) => {
                                  $$renderer9.push(`<!---->Descripción`);
                                },
                                $$slots: { default: true }
                              });
                              $$renderer8.push(`<!----> `);
                              Table_head($$renderer8, {
                                class: "w-[10%]",
                                children: ($$renderer9) => {
                                  $$renderer9.push(`<!---->Duración`);
                                },
                                $$slots: { default: true }
                              });
                              $$renderer8.push(`<!----> `);
                              Table_head($$renderer8, {
                                class: "w-[14%]",
                                children: ($$renderer9) => {
                                  $$renderer9.push(`<!---->Fecha`);
                                },
                                $$slots: { default: true }
                              });
                              $$renderer8.push(`<!----> `);
                              Table_head($$renderer8, {
                                class: "w-[14%] text-right",
                                children: ($$renderer9) => {
                                  $$renderer9.push(`<!---->Acciones`);
                                },
                                $$slots: { default: true }
                              });
                              $$renderer8.push(`<!---->`);
                            },
                            $$slots: { default: true }
                          });
                        },
                        $$slots: { default: true }
                      });
                      $$renderer6.push(`<!----> `);
                      Table_body($$renderer6, {
                        children: ($$renderer7) => {
                          $$renderer7.push(`<!--[-->`);
                          const each_array_1 = ensure_array_like(filteredExams);
                          for (let $$index_1 = 0, $$length = each_array_1.length; $$index_1 < $$length; $$index_1++) {
                            let exam = each_array_1[$$index_1];
                            const uiStatus = deriveExamUiStatus(exam);
                            Table_row($$renderer7, {
                              class: "hover:bg-muted/50",
                              children: ($$renderer8) => {
                                Table_cell($$renderer8, {
                                  class: "font-medium",
                                  children: ($$renderer9) => {
                                    $$renderer9.push(`<!---->${escape_html(exam.name)}`);
                                  },
                                  $$slots: { default: true }
                                });
                                $$renderer8.push(`<!----> `);
                                Table_cell($$renderer8, {
                                  children: ($$renderer9) => {
                                    Badge($$renderer9, {
                                      variant: "outline",
                                      class: "font-mono tracking-wider",
                                      children: ($$renderer10) => {
                                        $$renderer10.push(`<!---->${escape_html(exam.code)}`);
                                      },
                                      $$slots: { default: true }
                                    });
                                  },
                                  $$slots: { default: true }
                                });
                                $$renderer8.push(`<!----> `);
                                Table_cell($$renderer8, {
                                  children: ($$renderer9) => {
                                    Badge($$renderer9, {
                                      variant: "outline",
                                      class: cn("font-medium", examStatusBadgeClass(uiStatus)),
                                      children: ($$renderer10) => {
                                        $$renderer10.push(`<!---->${escape_html(examStatusLabel(uiStatus))}`);
                                      },
                                      $$slots: { default: true }
                                    });
                                  },
                                  $$slots: { default: true }
                                });
                                $$renderer8.push(`<!----> `);
                                Table_cell($$renderer8, {
                                  class: "min-w-0 align-top",
                                  children: ($$renderer9) => {
                                    if (exam.description?.trim()) {
                                      $$renderer9.push("<!--[0-->");
                                      $$renderer9.push(`<div class="min-w-0 max-w-full space-y-1"><p class="line-clamp-2 break-all text-sm text-muted-foreground"${attr("title", exam.description)}>${escape_html(descriptionPreview(exam.description))}</p> `);
                                      if (needsDescriptionMore(exam.description)) {
                                        $$renderer9.push("<!--[0-->");
                                        Button($$renderer9, {
                                          type: "button",
                                          variant: "link",
                                          size: "sm",
                                          class: "h-auto p-0 text-xs",
                                          "aria-label": `Ver descripción completa de ${stringify(exam.name)}`,
                                          onclick: () => openDescriptionDialog(exam),
                                          children: ($$renderer10) => {
                                            $$renderer10.push(`<!---->Ver más`);
                                          },
                                          $$slots: { default: true }
                                        });
                                      } else {
                                        $$renderer9.push("<!--[-1-->");
                                      }
                                      $$renderer9.push(`<!--]--></div>`);
                                    } else {
                                      $$renderer9.push("<!--[-1-->");
                                      $$renderer9.push(`<span class="text-muted-foreground">—</span>`);
                                    }
                                    $$renderer9.push(`<!--]-->`);
                                  },
                                  $$slots: { default: true }
                                });
                                $$renderer8.push(`<!----> `);
                                Table_cell($$renderer8, {
                                  children: ($$renderer9) => {
                                    $$renderer9.push(`<!---->${escape_html(exam.duration_minutes ? `${exam.duration_minutes} min` : "—")}`);
                                  },
                                  $$slots: { default: true }
                                });
                                $$renderer8.push(`<!----> `);
                                Table_cell($$renderer8, {
                                  class: "text-muted-foreground",
                                  children: ($$renderer9) => {
                                    $$renderer9.push(`<!---->${escape_html(fmtDate(exam.scheduled_at))}`);
                                  },
                                  $$slots: { default: true }
                                });
                                $$renderer8.push(`<!----> `);
                                Table_cell($$renderer8, {
                                  class: "text-right",
                                  children: ($$renderer9) => {
                                    Button($$renderer9, {
                                      variant: "ghost",
                                      size: "sm",
                                      onclick: () => openSessions(exam.id),
                                      children: ($$renderer10) => {
                                        $$renderer10.push(`<!---->${escape_html(uiStatus === "finalizado" ? "Ver supervisiones" : "Supervisiones")} →`);
                                      },
                                      $$slots: { default: true }
                                    });
                                  },
                                  $$slots: { default: true }
                                });
                                $$renderer8.push(`<!---->`);
                              },
                              $$slots: { default: true }
                            });
                          }
                          $$renderer7.push(`<!--]-->`);
                        },
                        $$slots: { default: true }
                      });
                      $$renderer6.push(`<!---->`);
                    },
                    $$slots: { default: true }
                  });
                  $$renderer5.push(`<!----></div>`);
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
        $$renderer3.push(`<!---->`);
      }
      $$renderer3.push(`<!--]-->`);
    }
    do {
      $$settled = true;
      $$inner_renderer = $$renderer2.copy();
      $$render_inner($$inner_renderer);
    } while (!$$settled);
    $$renderer2.subsume($$inner_renderer);
    if ($$store_subs) unsubscribe_stores($$store_subs);
  });
}
export {
  _page as default
};
