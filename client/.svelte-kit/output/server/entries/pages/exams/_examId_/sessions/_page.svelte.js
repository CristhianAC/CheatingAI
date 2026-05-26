import { f as spread_props, o as head, i as escape_html, e as ensure_array_like, k as stringify } from "../../../../../chunks/index2.js";
import { o as onDestroy } from "../../../../../chunks/index-server2.js";
import { g as goto } from "../../../../../chunks/client.js";
import { P as PageHeader } from "../../../../../chunks/PageHeader.js";
import { C as Card, a as Card_content, L as Label, I as Input } from "../../../../../chunks/label.js";
import { B as Button, c as cn } from "../../../../../chunks/button.js";
import { T as Table, a as Table_header, b as Table_row, c as Table_head, d as Table_body, e as Table_cell } from "../../../../../chunks/table-row.js";
import { B as Badge } from "../../../../../chunks/badge.js";
import { A as Alert } from "../../../../../chunks/alert.js";
import { A as Alert_description } from "../../../../../chunks/alert-description.js";
import { S as Skeleton } from "../../../../../chunks/skeleton.js";
import { I as Icon } from "../../../../../chunks/Icon.js";
const SESSION_BASE = "/api/v1/sessions";
function _getToken() {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem("procto_auth");
    return raw ? JSON.parse(raw)?.token ?? null : null;
  } catch {
    return null;
  }
}
function _parseJsonBody(text) {
  if (!text?.trim()) return null;
  try {
    return JSON.parse(text);
  } catch {
    return void 0;
  }
}
function _httpErrorMessage(res, text) {
  if (res.status >= 500) {
    return "El servicio de supervisión tuvo un error interno. Intenta de nuevo en unos segundos.";
  }
  const snippet = text?.trim().slice(0, 120);
  return snippet ? `Error ${res.status}: ${snippet}` : `Error ${res.status}`;
}
async function request(method, url, body = null) {
  const token = _getToken();
  const headers = { "Content-Type": "application/json" };
  if (token) headers["Authorization"] = `Bearer ${token}`;
  const opts = { method, headers };
  if (body !== null) opts.body = JSON.stringify(body);
  const res = await fetch(url, opts);
  if (res.status === 204) return null;
  const text = await res.text();
  const data = _parseJsonBody(text);
  if (!res.ok) {
    if (data === void 0) {
      const err2 = new Error(_httpErrorMessage(res, text));
      err2.status = res.status;
      throw err2;
    }
    const detail = data?.detail;
    if (detail && typeof detail === "object" && detail.message) {
      const err2 = new Error(detail.message);
      err2.code = detail.code;
      err2.existingSessionId = detail.existing_session_id;
      err2.status = res.status;
      throw err2;
    }
    const msg = detail || `Error ${res.status}`;
    const err = new Error(typeof msg === "string" ? msg : JSON.stringify(msg));
    err.status = res.status;
    throw err;
  }
  return data;
}
function getSessionStats(sessionId) {
  return request("GET", `${SESSION_BASE}/${sessionId}`);
}
function getSessionsByExam(examId) {
  return request("GET", `${SESSION_BASE}/by-exam/${encodeURIComponent(examId)}`);
}
function Users($$renderer, $$props) {
  let { $$slots, $$events, ...props } = $$props;
  const iconNode = [
    ["path", { "d": "M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" }],
    ["path", { "d": "M16 3.128a4 4 0 0 1 0 7.744" }],
    ["path", { "d": "M22 21v-2a4 4 0 0 0-3-3.87" }],
    ["circle", { "cx": "9", "cy": "7", "r": "4" }]
  ];
  Icon($$renderer, spread_props([{ name: "users" }, props, { iconNode }]));
}
function _page($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let filteredSessions, showNoSearchResults;
    let loading = false;
    let error = "";
    let searchQuery = "";
    let sessions = [];
    let examId = "";
    let liveStats = {};
    function statusValue(status) {
      return typeof status === "string" ? status : status?.value ?? status;
    }
    function statusLabel(status) {
      const value = statusValue(status);
      if (value === "active") return "En supervisión";
      if (value === "aborted") return "Interrumpido";
      return "Finalizado";
    }
    function isEnded(status) {
      const v = statusValue(status);
      return v === "ended" || v === "finalizado";
    }
    function isActive(status) {
      return statusValue(status) === "active";
    }
    function goBack() {
      goto();
    }
    async function refreshLiveStats() {
      const active = sessions.filter((s) => isActive(s.status));
      if (active.length === 0) return;
      const results = await Promise.allSettled(active.map(async (s) => {
        const stats = await getSessionStats(s.id);
        return [s.id, stats];
      }));
      const next = { ...liveStats };
      for (const r of results) {
        if (r.status === "fulfilled") {
          const [id, stats] = r.value;
          next[id] = { total_violations: stats?.total_violations ?? 0 };
        }
      }
      liveStats = next;
    }
    async function loadSessions() {
      loading = true;
      error = "";
      try {
        sessions = await getSessionsByExam(examId);
        await refreshLiveStats();
      } catch (e) {
        error = e?.message ?? "No se pudieron cargar las supervisiones";
      } finally {
        loading = false;
      }
    }
    onDestroy(() => {
    });
    filteredSessions = sessions.filter((session) => {
      const q = searchQuery.trim().toLowerCase();
      if (!q) return true;
      const name = (session.student_name ?? "").toLowerCase();
      const email = (session.student_email ?? "").toLowerCase();
      return name.includes(q) || email.includes(q);
    });
    showNoSearchResults = !loading && sessions.length > 0 && filteredSessions.length === 0;
    let $$settled = true;
    let $$inner_renderer;
    function $$render_inner($$renderer3) {
      head("14vxrsm", $$renderer3, ($$renderer4) => {
        $$renderer4.title(($$renderer5) => {
          $$renderer5.push(`<title>Supervisiones del examen | Procto</title>`);
        });
      });
      PageHeader($$renderer3, {
        focus: "Supervisión",
        title: "Supervisiones del examen",
        subtitle: "Estudiantes en curso y sesiones finalizadas. El reporte completo está disponible al terminar la supervisión.",
        $$slots: {
          actions: ($$renderer4) => {
            {
              Button($$renderer4, {
                variant: "outline",
                size: "sm",
                onclick: loadSessions,
                disabled: loading,
                children: ($$renderer5) => {
                  $$renderer5.push(`<!---->Actualizar`);
                },
                $$slots: { default: true }
              });
              $$renderer4.push(`<!----> `);
              Button($$renderer4, {
                variant: "outline",
                size: "sm",
                onclick: goBack,
                children: ($$renderer5) => {
                  $$renderer5.push(`<!---->← Volver a exámenes`);
                },
                $$slots: { default: true }
              });
              $$renderer4.push(`<!---->`);
            }
          }
        }
      });
      $$renderer3.push(`<!----> `);
      Card($$renderer3, {
        class: "rounded-xl",
        children: ($$renderer4) => {
          Card_content($$renderer4, {
            class: "pt-6",
            children: ($$renderer5) => {
              if (error) {
                $$renderer5.push("<!--[0-->");
                Alert($$renderer5, {
                  variant: "destructive",
                  class: "mb-4",
                  children: ($$renderer6) => {
                    Alert_description($$renderer6, {
                      children: ($$renderer7) => {
                        $$renderer7.push(`<!---->${escape_html(error)}`);
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
              if (loading && sessions.length === 0) {
                $$renderer5.push("<!--[0-->");
                $$renderer5.push(`<div class="space-y-2">`);
                Skeleton($$renderer5, { class: "h-10 w-full" });
                $$renderer5.push(`<!----> `);
                Skeleton($$renderer5, { class: "h-10 w-full" });
                $$renderer5.push(`<!----></div>`);
              } else if (sessions.length === 0) {
                $$renderer5.push("<!--[1-->");
                $$renderer5.push(`<div class="flex flex-col items-center gap-4 py-12 text-center">`);
                Users($$renderer5, {
                  class: "size-10 text-muted-foreground/70",
                  "aria-hidden": "true"
                });
                $$renderer5.push(`<!----> <div><p class="font-medium tracking-tight text-foreground">Aún no hay supervisiones</p> <p class="mt-2 max-w-md text-sm text-muted-foreground">Cuando los estudiantes inicien la supervisión aparecerán aquí como <strong class="text-foreground">En supervisión</strong>; al finalizar podrás abrir el reporte.</p></div> `);
                Button($$renderer5, {
                  variant: "outline",
                  onclick: goBack,
                  children: ($$renderer6) => {
                    $$renderer6.push(`<!---->Volver a exámenes`);
                  },
                  $$slots: { default: true }
                });
                $$renderer5.push(`<!----></div>`);
              } else {
                $$renderer5.push("<!--[-1-->");
                if (sessions.some((s) => isActive(s.status))) {
                  $$renderer5.push("<!--[0-->");
                  $$renderer5.push(`<p class="mb-4 text-sm text-muted-foreground">Hay estudiantes en supervisión. El reporte completo estará disponible cuando finalicen la
          sesión. Los eventos en vivo se actualizan cada pocos segundos.</p>`);
                } else {
                  $$renderer5.push("<!--[-1-->");
                }
                $$renderer5.push(`<!--]--> <div class="mb-4 max-w-sm">`);
                Label($$renderer5, {
                  for: "session-search",
                  class: "sr-only",
                  children: ($$renderer6) => {
                    $$renderer6.push(`<!---->Buscar estudiante`);
                  },
                  $$slots: { default: true }
                });
                $$renderer5.push(`<!----> `);
                Input($$renderer5, {
                  id: "session-search",
                  type: "search",
                  placeholder: "Buscar por nombre o email…",
                  get value() {
                    return searchQuery;
                  },
                  set value($$value) {
                    searchQuery = $$value;
                    $$settled = false;
                  }
                });
                $$renderer5.push(`<!----></div> `);
                if (showNoSearchResults) {
                  $$renderer5.push("<!--[0-->");
                  $$renderer5.push(`<p class="py-8 text-center text-sm text-muted-foreground">Ninguna supervisión coincide con «${escape_html(searchQuery.trim())}».</p>`);
                } else {
                  $$renderer5.push("<!--[-1-->");
                  $$renderer5.push(`<div class="overflow-x-auto">`);
                  Table($$renderer5, {
                    class: "text-sm",
                    children: ($$renderer6) => {
                      Table_header($$renderer6, {
                        children: ($$renderer7) => {
                          Table_row($$renderer7, {
                            class: "hover:bg-transparent",
                            children: ($$renderer8) => {
                              Table_head($$renderer8, {
                                children: ($$renderer9) => {
                                  $$renderer9.push(`<!---->Estudiante`);
                                },
                                $$slots: { default: true }
                              });
                              $$renderer8.push(`<!----> `);
                              Table_head($$renderer8, {
                                children: ($$renderer9) => {
                                  $$renderer9.push(`<!---->Email`);
                                },
                                $$slots: { default: true }
                              });
                              $$renderer8.push(`<!----> `);
                              Table_head($$renderer8, {
                                children: ($$renderer9) => {
                                  $$renderer9.push(`<!---->Inicio`);
                                },
                                $$slots: { default: true }
                              });
                              $$renderer8.push(`<!----> `);
                              Table_head($$renderer8, {
                                children: ($$renderer9) => {
                                  $$renderer9.push(`<!---->Fin`);
                                },
                                $$slots: { default: true }
                              });
                              $$renderer8.push(`<!----> `);
                              Table_head($$renderer8, {
                                class: "text-right",
                                children: ($$renderer9) => {
                                  $$renderer9.push(`<!---->Estado`);
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
                          const each_array = ensure_array_like(filteredSessions);
                          for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
                            let session = each_array[$$index];
                            Table_row($$renderer7, {
                              class: "hover:bg-muted/50",
                              children: ($$renderer8) => {
                                Table_cell($$renderer8, {
                                  children: ($$renderer9) => {
                                    Badge($$renderer9, {
                                      variant: "secondary",
                                      children: ($$renderer10) => {
                                        $$renderer10.push(`<!---->${escape_html(session.student_name ?? session.student_id)}`);
                                      },
                                      $$slots: { default: true }
                                    });
                                  },
                                  $$slots: { default: true }
                                });
                                $$renderer8.push(`<!----> `);
                                Table_cell($$renderer8, {
                                  class: "text-muted-foreground",
                                  children: ($$renderer9) => {
                                    $$renderer9.push(`<!---->${escape_html(session.student_email ?? "—")}`);
                                  },
                                  $$slots: { default: true }
                                });
                                $$renderer8.push(`<!----> `);
                                Table_cell($$renderer8, {
                                  children: ($$renderer9) => {
                                    $$renderer9.push(`<!---->${escape_html(new Date(session.started_at).toLocaleString("es"))}`);
                                  },
                                  $$slots: { default: true }
                                });
                                $$renderer8.push(`<!----> `);
                                Table_cell($$renderer8, {
                                  children: ($$renderer9) => {
                                    if (session.ended_at) {
                                      $$renderer9.push("<!--[0-->");
                                      $$renderer9.push(`${escape_html(new Date(session.ended_at).toLocaleString("es"))}`);
                                    } else {
                                      $$renderer9.push("<!--[-1-->");
                                      $$renderer9.push(`<span class="text-muted-foreground">En curso</span>`);
                                    }
                                    $$renderer9.push(`<!--]-->`);
                                  },
                                  $$slots: { default: true }
                                });
                                $$renderer8.push(`<!----> `);
                                Table_cell($$renderer8, {
                                  class: "text-right",
                                  children: ($$renderer9) => {
                                    if (isEnded(session.status)) {
                                      $$renderer9.push("<!--[0-->");
                                      Button($$renderer9, {
                                        variant: "outline",
                                        size: "sm",
                                        href: `/proctoring/report/${stringify(session.id)}`,
                                        "data-sveltekit-preload-data": "hover",
                                        children: ($$renderer10) => {
                                          $$renderer10.push(`<!---->Ver reporte`);
                                        },
                                        $$slots: { default: true }
                                      });
                                    } else if (isActive(session.status)) {
                                      $$renderer9.push("<!--[1-->");
                                      const violations = liveStats[session.id]?.total_violations ?? 0;
                                      $$renderer9.push(`<div class="flex flex-col items-end gap-1">`);
                                      Badge($$renderer9, {
                                        variant: "outline",
                                        class: cn(violations >= 3 ? "border-amber-500/50 bg-amber-500/10 text-amber-900 dark:text-amber-100" : "border-emerald-500/50 bg-emerald-500/10 text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-200"),
                                        children: ($$renderer10) => {
                                          $$renderer10.push(`<!---->En supervisión`);
                                        },
                                        $$slots: { default: true }
                                      });
                                      $$renderer9.push(`<!----> `);
                                      if (liveStats[session.id]) {
                                        $$renderer9.push("<!--[0-->");
                                        $$renderer9.push(`<span class="text-xs text-muted-foreground">${escape_html(violations)} evento${escape_html(violations !== 1 ? "s" : "")} hasta ahora</span>`);
                                      } else {
                                        $$renderer9.push("<!--[-1-->");
                                      }
                                      $$renderer9.push(`<!--]--></div>`);
                                    } else {
                                      $$renderer9.push("<!--[-1-->");
                                      Badge($$renderer9, {
                                        variant: "outline",
                                        class: "font-medium",
                                        children: ($$renderer10) => {
                                          $$renderer10.push(`<!---->${escape_html(statusLabel(session.status))}`);
                                        },
                                        $$slots: { default: true }
                                      });
                                    }
                                    $$renderer9.push(`<!--]-->`);
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
                }
                $$renderer5.push(`<!--]-->`);
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
