import { o as head, i as escape_html } from "../../../../../chunks/index2.js";
import "@sveltejs/kit/internal";
import "../../../../../chunks/exports.js";
import "../../../../../chunks/utils.js";
import "@sveltejs/kit/internal/server";
import "../../../../../chunks/root.js";
import "../../../../../chunks/state.svelte.js";
import { P as PageHeader } from "../../../../../chunks/PageHeader.js";
import "clsx";
import { B as Button } from "../../../../../chunks/button.js";
import "../../../../../chunks/badge.js";
import { D as Dialog, a as Dialog_content, b as Dialog_header, c as Dialog_title, d as Dialog_description, e as Dialog_footer } from "../../../../../chunks/dialog-description.js";
const LEVEL_STYLES = {
  bajo: {
    card: "border-emerald-500/40 bg-emerald-500/10 dark:bg-emerald-500/15",
    score: "text-emerald-600 dark:text-emerald-400",
    ring: "border-emerald-400/60"
  },
  medio: {
    card: "border-yellow-500/40 bg-yellow-500/10 dark:bg-yellow-500/15",
    score: "text-yellow-700 dark:text-yellow-300",
    ring: "border-yellow-400/60"
  },
  alto: {
    card: "border-orange-500/40 bg-orange-500/10 dark:bg-orange-500/15",
    score: "text-orange-700 dark:text-orange-300",
    ring: "border-orange-400/60"
  },
  critico: {
    card: "border-destructive/50 bg-destructive/10 dark:bg-destructive/15",
    score: "text-destructive",
    ring: "border-destructive/50"
  }
};
function _page($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let ra, backHref, filteredViolations;
    let report = null;
    let snapshotPreviewOpen = false;
    let snapshotPreviewTitle = "";
    ra = report?.risk_assessment;
    ra ? LEVEL_STYLES[ra.level] ?? LEVEL_STYLES.bajo : null;
    backHref = "/exams";
    filteredViolations = /* @__PURE__ */ (() => {
      return [];
    })();
    filteredViolations.slice(0, 6);
    let $$settled = true;
    let $$inner_renderer;
    function $$render_inner($$renderer3) {
      head("1noy1an", $$renderer3, ($$renderer4) => {
        $$renderer4.title(($$renderer5) => {
          $$renderer5.push(`<title>Reporte de supervisión | Procto</title>`);
        });
      });
      $$renderer3.push(`<div class="mx-auto max-w-5xl space-y-6 px-4 py-8 sm:px-6">`);
      PageHeader($$renderer3, {
        focus: "Reporte docente",
        title: "Reporte de supervisión",
        subtitle: "Detalle de la sesión supervisada",
        $$slots: {
          actions: ($$renderer4) => {
            {
              Button($$renderer4, {
                variant: "outline",
                size: "sm",
                href: backHref,
                children: ($$renderer5) => {
                  $$renderer5.push(`<!---->← Volver a supervisiones`);
                },
                $$slots: { default: true }
              });
            }
          }
        }
      });
      $$renderer3.push(`<!----> `);
      {
        $$renderer3.push("<!--[0-->");
        $$renderer3.push(`<div class="flex flex-col items-center gap-3 py-16 text-muted-foreground"><span class="report-spinner svelte-1noy1an" aria-hidden="true"></span> <p class="text-sm">Cargando reporte…</p></div>`);
      }
      $$renderer3.push(`<!--]--></div> `);
      Dialog($$renderer3, {
        get open() {
          return snapshotPreviewOpen;
        },
        set open($$value) {
          snapshotPreviewOpen = $$value;
          $$settled = false;
        },
        children: ($$renderer4) => {
          Dialog_content($$renderer4, {
            class: "max-w-3xl",
            children: ($$renderer5) => {
              Dialog_header($$renderer5, {
                children: ($$renderer6) => {
                  Dialog_title($$renderer6, {
                    children: ($$renderer7) => {
                      $$renderer7.push(`<!---->${escape_html(snapshotPreviewTitle)}`);
                    },
                    $$slots: { default: true }
                  });
                  $$renderer6.push(`<!----> `);
                  Dialog_description($$renderer6, {
                    children: ($$renderer7) => {
                      $$renderer7.push(`<!---->Evidencia visual del evento`);
                    },
                    $$slots: { default: true }
                  });
                  $$renderer6.push(`<!---->`);
                },
                $$slots: { default: true }
              });
              $$renderer5.push(`<!----> `);
              {
                $$renderer5.push("<!--[-1-->");
                $$renderer5.push(`<p class="text-sm text-muted-foreground">Captura no disponible en este entorno.</p>`);
              }
              $$renderer5.push(`<!--]--> `);
              Dialog_footer($$renderer5, {
                children: ($$renderer6) => {
                  Button($$renderer6, {
                    type: "button",
                    variant: "outline",
                    onclick: () => snapshotPreviewOpen = false,
                    children: ($$renderer7) => {
                      $$renderer7.push(`<!---->Cerrar`);
                    },
                    $$slots: { default: true }
                  });
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
