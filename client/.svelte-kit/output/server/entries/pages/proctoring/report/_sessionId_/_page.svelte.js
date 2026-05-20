import { j as head } from "../../../../../chunks/index2.js";
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
function _page($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let ra, filteredViolations;
    let report = null;
    const LEVEL_META = {
      bajo: {
        label: "Sin señales relevantes",
        bg: "#f0fdf4",
        border: "#86efac",
        score_color: "#16a34a",
        ring: "#bbf7d0"
      },
      medio: {
        label: "Comportamiento inusual",
        bg: "#fefce8",
        border: "#fde047",
        score_color: "#ca8a04",
        ring: "#fef08a"
      },
      alto: {
        label: "Comportamiento sospechoso",
        bg: "#fff7ed",
        border: "#fdba74",
        score_color: "#ea580c",
        ring: "#fed7aa"
      },
      critico: {
        label: "Riesgo crítico para revisión",
        bg: "#fef2f2",
        border: "#fca5a5",
        score_color: "#dc2626",
        ring: "#fecaca"
      }
    };
    ra = report?.risk_assessment;
    ra ? LEVEL_META[ra.level] ?? LEVEL_META.bajo : null;
    filteredViolations = /* @__PURE__ */ (() => {
      return [];
    })();
    filteredViolations.slice(0, 6);
    head("1noy1an", $$renderer2, ($$renderer3) => {
      $$renderer3.title(($$renderer4) => {
        $$renderer4.push(`<title>Reporte de supervisión | Procto</title>`);
      });
    });
    $$renderer2.push(`<div class="page space-y-6 svelte-1noy1an">`);
    PageHeader($$renderer2, {
      focus: "Reporte docente",
      title: "Reporte de supervisión",
      subtitle: "Detalle de la sesión supervisada",
      $$slots: {
        actions: ($$renderer3) => {
          {
            Button($$renderer3, {
              variant: "outline",
              size: "sm",
              href: "/proctoring",
              children: ($$renderer4) => {
                $$renderer4.push(`<!---->← Volver`);
              },
              $$slots: { default: true }
            });
          }
        }
      }
    });
    $$renderer2.push(`<!----> `);
    {
      $$renderer2.push("<!--[0-->");
      $$renderer2.push(`<div class="state-box svelte-1noy1an"><span class="spinner svelte-1noy1an"></span> <p>Cargando reporte…</p></div>`);
    }
    $$renderer2.push(`<!--]--></div>`);
  });
}
export {
  _page as default
};
