import { j as head, h as ensure_array_like, e as escape_html } from "../../../../../chunks/index2.js";
import { g as goto } from "../../../../../chunks/client.js";
import { P as PageHeader } from "../../../../../chunks/PageHeader.js";
import { C as Card, a as Card_content } from "../../../../../chunks/card-content.js";
import "clsx";
import { T as Table, a as Table_header, b as Table_row, c as Table_head, d as Table_body, e as Table_cell } from "../../../../../chunks/table-row.js";
import { B as Button } from "../../../../../chunks/button.js";
import { B as Badge } from "../../../../../chunks/badge.js";
import "../../../../../chunks/alert.js";
function _page($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let sessions = [];
    function statusValue(status) {
      return typeof status === "string" ? status : status?.value ?? status;
    }
    function statusLabel(status) {
      const value = statusValue(status);
      return value === "active" ? "Activo" : "Finalizado";
    }
    function openReport(sessionId) {
      goto();
    }
    function goBack() {
      goto();
    }
    head("14vxrsm", $$renderer2, ($$renderer3) => {
      $$renderer3.title(($$renderer4) => {
        $$renderer4.push(`<title>Supervisiones del examen | Procto</title>`);
      });
    });
    PageHeader($$renderer2, {
      focus: "Supervisión",
      title: "Supervisiones del examen",
      subtitle: "Sesiones de estudiantes vinculadas a este examen.",
      $$slots: {
        actions: ($$renderer3) => {
          {
            Button($$renderer3, {
              variant: "outline",
              size: "sm",
              onclick: goBack,
              children: ($$renderer4) => {
                $$renderer4.push(`<!---->← Volver a exámenes`);
              },
              $$slots: { default: true }
            });
          }
        }
      }
    });
    $$renderer2.push(`<!----> `);
    Card($$renderer2, {
      class: "rounded-xl",
      children: ($$renderer3) => {
        Card_content($$renderer3, {
          class: "pt-6",
          children: ($$renderer4) => {
            {
              $$renderer4.push("<!--[-1-->");
            }
            $$renderer4.push(`<!--]--> `);
            if (sessions.length === 0) {
              $$renderer4.push("<!--[1-->");
              $$renderer4.push(`<p class="text-sm text-muted-foreground">Aún no hay supervisiones para este examen.</p>`);
            } else {
              $$renderer4.push("<!--[-1-->");
              $$renderer4.push(`<div class="overflow-x-auto">`);
              Table($$renderer4, {
                children: ($$renderer5) => {
                  Table_header($$renderer5, {
                    children: ($$renderer6) => {
                      Table_row($$renderer6, {
                        children: ($$renderer7) => {
                          Table_head($$renderer7, {
                            children: ($$renderer8) => {
                              $$renderer8.push(`<!---->Estudiante`);
                            },
                            $$slots: { default: true }
                          });
                          $$renderer7.push(`<!----> `);
                          Table_head($$renderer7, {
                            children: ($$renderer8) => {
                              $$renderer8.push(`<!---->Email`);
                            },
                            $$slots: { default: true }
                          });
                          $$renderer7.push(`<!----> `);
                          Table_head($$renderer7, {
                            children: ($$renderer8) => {
                              $$renderer8.push(`<!---->Inicio`);
                            },
                            $$slots: { default: true }
                          });
                          $$renderer7.push(`<!----> `);
                          Table_head($$renderer7, {
                            children: ($$renderer8) => {
                              $$renderer8.push(`<!---->Fin`);
                            },
                            $$slots: { default: true }
                          });
                          $$renderer7.push(`<!----> `);
                          Table_head($$renderer7, {
                            class: "text-right",
                            children: ($$renderer8) => {
                              $$renderer8.push(`<!---->Estado`);
                            },
                            $$slots: { default: true }
                          });
                          $$renderer7.push(`<!---->`);
                        },
                        $$slots: { default: true }
                      });
                    },
                    $$slots: { default: true }
                  });
                  $$renderer5.push(`<!----> `);
                  Table_body($$renderer5, {
                    children: ($$renderer6) => {
                      $$renderer6.push(`<!--[-->`);
                      const each_array = ensure_array_like(sessions);
                      for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
                        let session = each_array[$$index];
                        Table_row($$renderer6, {
                          children: ($$renderer7) => {
                            Table_cell($$renderer7, {
                              children: ($$renderer8) => {
                                Badge($$renderer8, {
                                  variant: "secondary",
                                  children: ($$renderer9) => {
                                    $$renderer9.push(`<!---->${escape_html(session.student_name ?? session.student_id)}`);
                                  },
                                  $$slots: { default: true }
                                });
                              },
                              $$slots: { default: true }
                            });
                            $$renderer7.push(`<!----> `);
                            Table_cell($$renderer7, {
                              class: "text-muted-foreground",
                              children: ($$renderer8) => {
                                $$renderer8.push(`<!---->${escape_html(session.student_email ?? "—")}`);
                              },
                              $$slots: { default: true }
                            });
                            $$renderer7.push(`<!----> `);
                            Table_cell($$renderer7, {
                              children: ($$renderer8) => {
                                $$renderer8.push(`<!---->${escape_html(new Date(session.started_at).toLocaleString("es"))}`);
                              },
                              $$slots: { default: true }
                            });
                            $$renderer7.push(`<!----> `);
                            Table_cell($$renderer7, {
                              children: ($$renderer8) => {
                                $$renderer8.push(`<!---->${escape_html(session.ended_at ? new Date(session.ended_at).toLocaleString("es") : "—")}`);
                              },
                              $$slots: { default: true }
                            });
                            $$renderer7.push(`<!----> `);
                            Table_cell($$renderer7, {
                              class: "text-right",
                              children: ($$renderer8) => {
                                if (statusValue(session.status) === "ended" || statusValue(session.status) === "finalizado") {
                                  $$renderer8.push("<!--[0-->");
                                  Button($$renderer8, {
                                    variant: "outline",
                                    size: "sm",
                                    onclick: () => openReport(session.id),
                                    children: ($$renderer9) => {
                                      $$renderer9.push(`<!---->${escape_html(statusLabel(session.status))} · Ver reporte`);
                                    },
                                    $$slots: { default: true }
                                  });
                                } else {
                                  $$renderer8.push("<!--[-1-->");
                                  Badge($$renderer8, {
                                    class: "bg-emerald-100 text-emerald-800 hover:bg-emerald-100",
                                    children: ($$renderer9) => {
                                      $$renderer9.push(`<!---->Activo`);
                                    },
                                    $$slots: { default: true }
                                  });
                                }
                                $$renderer8.push(`<!--]-->`);
                              },
                              $$slots: { default: true }
                            });
                            $$renderer7.push(`<!---->`);
                          },
                          $$slots: { default: true }
                        });
                      }
                      $$renderer6.push(`<!--]-->`);
                    },
                    $$slots: { default: true }
                  });
                  $$renderer5.push(`<!---->`);
                },
                $$slots: { default: true }
              });
              $$renderer4.push(`<!----></div>`);
            }
            $$renderer4.push(`<!--]-->`);
          },
          $$slots: { default: true }
        });
      },
      $$slots: { default: true }
    });
    $$renderer2.push(`<!---->`);
  });
}
export {
  _page as default
};
