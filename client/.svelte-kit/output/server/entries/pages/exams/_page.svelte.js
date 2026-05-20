import { j as head, s as store_get, e as escape_html, h as ensure_array_like, u as unsubscribe_stores } from "../../../chunks/index2.js";
import { g as goto } from "../../../chunks/client.js";
import { a as authStore } from "../../../chunks/auth.js";
import { P as PageHeader } from "../../../chunks/PageHeader.js";
import { C as Card, a as Card_content } from "../../../chunks/card-content.js";
import { C as Card_header, a as Card_title, b as Card_description, c as Card_footer } from "../../../chunks/card-title.js";
import "clsx";
import { T as Table, a as Table_header, b as Table_row, c as Table_head, d as Table_body, e as Table_cell } from "../../../chunks/table-row.js";
import { B as Button } from "../../../chunks/button.js";
import { L as Label, I as Input } from "../../../chunks/label.js";
import { B as Badge } from "../../../chunks/badge.js";
import "../../../chunks/alert.js";
function _page($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    var $$store_subs;
    let saving = false;
    let exams = [];
    let showCreate = false;
    let name = "";
    let description = "";
    let durationMinutes = "";
    let scheduledAt = "";
    function fmtDate(value) {
      if (!value) return "—";
      return new Date(value).toLocaleString("es");
    }
    function openSessions(examId) {
      goto();
    }
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
                  onclick: () => showCreate = !showCreate,
                  children: ($$renderer5) => {
                    $$renderer5.push(`<!---->${escape_html(showCreate ? "Cancelar" : "Crear examen")}`);
                  },
                  $$slots: { default: true }
                });
              }
            }
          }
        });
        $$renderer3.push(`<!----> `);
        if (showCreate) {
          $$renderer3.push("<!--[0-->");
          Card($$renderer3, {
            class: "mb-6 rounded-xl",
            children: ($$renderer4) => {
              Card_header($$renderer4, {
                children: ($$renderer5) => {
                  Card_title($$renderer5, {
                    class: "text-base",
                    children: ($$renderer6) => {
                      $$renderer6.push(`<!---->Nuevo examen`);
                    },
                    $$slots: { default: true }
                  });
                },
                $$slots: { default: true }
              });
              $$renderer4.push(`<!----> `);
              Card_content($$renderer4, {
                children: ($$renderer5) => {
                  $$renderer5.push(`<form class="grid gap-4 sm:grid-cols-2"><div class="space-y-2 sm:col-span-2">`);
                  Label($$renderer5, {
                    for: "name",
                    children: ($$renderer6) => {
                      $$renderer6.push(`<!---->Nombre`);
                    },
                    $$slots: { default: true }
                  });
                  $$renderer5.push(`<!----> `);
                  Input($$renderer5, {
                    id: "name",
                    type: "text",
                    required: true,
                    get value() {
                      return name;
                    },
                    set value($$value) {
                      name = $$value;
                      $$settled = false;
                    }
                  });
                  $$renderer5.push(`<!----></div> <div class="space-y-2 sm:col-span-2">`);
                  Label($$renderer5, {
                    for: "desc",
                    children: ($$renderer6) => {
                      $$renderer6.push(`<!---->Descripción`);
                    },
                    $$slots: { default: true }
                  });
                  $$renderer5.push(`<!----> <textarea id="desc" rows="3" class="flex min-h-[80px] w-full rounded-lg border border-input bg-background px-3 py-2 text-sm">`);
                  const $$body = escape_html(description);
                  if ($$body) {
                    $$renderer5.push(`${$$body}`);
                  }
                  $$renderer5.push(`</textarea></div> <div class="space-y-2">`);
                  Label($$renderer5, {
                    for: "dur",
                    children: ($$renderer6) => {
                      $$renderer6.push(`<!---->Duración (min)`);
                    },
                    $$slots: { default: true }
                  });
                  $$renderer5.push(`<!----> `);
                  Input($$renderer5, {
                    id: "dur",
                    type: "number",
                    min: "1",
                    get value() {
                      return durationMinutes;
                    },
                    set value($$value) {
                      durationMinutes = $$value;
                      $$settled = false;
                    }
                  });
                  $$renderer5.push(`<!----></div> <div class="space-y-2">`);
                  Label($$renderer5, {
                    for: "sched",
                    children: ($$renderer6) => {
                      $$renderer6.push(`<!---->Fecha programada`);
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
                  $$renderer5.push(`<!----></div> <div class="sm:col-span-2">`);
                  Button($$renderer5, {
                    type: "submit",
                    disabled: saving,
                    children: ($$renderer6) => {
                      $$renderer6.push(`<!---->${escape_html("Guardar examen")}`);
                    },
                    $$slots: { default: true }
                  });
                  $$renderer5.push(`<!----></div></form>`);
                },
                $$slots: { default: true }
              });
              $$renderer4.push(`<!---->`);
            },
            $$slots: { default: true }
          });
        } else {
          $$renderer3.push("<!--[-1-->");
        }
        $$renderer3.push(`<!--]--> `);
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
                if (exams.length === 0) {
                  $$renderer5.push("<!--[1-->");
                  $$renderer5.push(`<p class="text-sm text-muted-foreground">No tienes exámenes creados todavía.</p>`);
                } else {
                  $$renderer5.push("<!--[-1-->");
                  $$renderer5.push(`<div class="overflow-x-auto">`);
                  Table($$renderer5, {
                    children: ($$renderer6) => {
                      Table_header($$renderer6, {
                        children: ($$renderer7) => {
                          Table_row($$renderer7, {
                            children: ($$renderer8) => {
                              Table_head($$renderer8, {
                                children: ($$renderer9) => {
                                  $$renderer9.push(`<!---->Nombre`);
                                },
                                $$slots: { default: true }
                              });
                              $$renderer8.push(`<!----> `);
                              Table_head($$renderer8, {
                                children: ($$renderer9) => {
                                  $$renderer9.push(`<!---->Código`);
                                },
                                $$slots: { default: true }
                              });
                              $$renderer8.push(`<!----> `);
                              Table_head($$renderer8, {
                                children: ($$renderer9) => {
                                  $$renderer9.push(`<!---->Descripción`);
                                },
                                $$slots: { default: true }
                              });
                              $$renderer8.push(`<!----> `);
                              Table_head($$renderer8, {
                                children: ($$renderer9) => {
                                  $$renderer9.push(`<!---->Duración`);
                                },
                                $$slots: { default: true }
                              });
                              $$renderer8.push(`<!----> `);
                              Table_head($$renderer8, {
                                children: ($$renderer9) => {
                                  $$renderer9.push(`<!---->Fecha`);
                                },
                                $$slots: { default: true }
                              });
                              $$renderer8.push(`<!----> `);
                              Table_head($$renderer8, {
                                class: "text-right",
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
                          const each_array = ensure_array_like(exams);
                          for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
                            let exam = each_array[$$index];
                            Table_row($$renderer7, {
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
                                  class: "max-w-[200px] truncate text-muted-foreground",
                                  children: ($$renderer9) => {
                                    $$renderer9.push(`<!---->${escape_html(exam.description ?? "—")}`);
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
                                        $$renderer10.push(`<!---->Supervisiones →`);
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
