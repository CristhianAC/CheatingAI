import { h as ensure_array_like, s as store_get, e as escape_html, i as attr, u as unsubscribe_stores, d as attr_class, j as head } from "../../../chunks/index2.js";
import { s as submissions, a as activeJob } from "../../../chunks/stores.js";
import { o as onDestroy } from "../../../chunks/index-server.js";
import { P as PageHeader } from "../../../chunks/PageHeader.js";
import "@sveltejs/kit/internal";
import "../../../chunks/exports.js";
import "../../../chunks/utils.js";
import "@sveltejs/kit/internal/server";
import "../../../chunks/root.js";
import "../../../chunks/state.svelte.js";
function PairwiseForm($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    var $$store_subs;
    let subA = "";
    let subB = "";
    let threshold = 0.7;
    $$renderer2.push(`<div class="rounded-xl border border-border bg-card p-6 shadow-sm"><h2 class="card__title">🔍 Análisis Par a Par <span class="badge-sync svelte-qyvq8a">Síncrono</span></h2> <p class="card__desc svelte-qyvq8a">Compara dos submissions específicas y obtén el resultado inmediatamente.</p> <form><div class="grid-2 svelte-qyvq8a"><div class="field"><label for="subA">Submission A *</label> `);
    $$renderer2.select({ id: "subA", value: subA, required: true }, ($$renderer3) => {
      $$renderer3.option({ value: "" }, ($$renderer4) => {
        $$renderer4.push(`— Seleccionar —`);
      });
      $$renderer3.push(`<!--[-->`);
      const each_array = ensure_array_like(store_get($$store_subs ??= {}, "$submissions", submissions));
      for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
        let s = each_array[$$index];
        $$renderer3.option({ value: s.id }, ($$renderer4) => {
          $$renderer4.push(`${escape_html(s.student_id)} · ${escape_html(s.problem_id)} (${escape_html(s.language)})`);
        });
      }
      $$renderer3.push(`<!--]-->`);
    });
    $$renderer2.push(`</div> <div class="field"><label for="subB">Submission B *</label> `);
    $$renderer2.select({ id: "subB", value: subB, required: true }, ($$renderer3) => {
      $$renderer3.option({ value: "" }, ($$renderer4) => {
        $$renderer4.push(`— Seleccionar —`);
      });
      $$renderer3.push(`<!--[-->`);
      const each_array_1 = ensure_array_like(store_get($$store_subs ??= {}, "$submissions", submissions));
      for (let $$index_1 = 0, $$length = each_array_1.length; $$index_1 < $$length; $$index_1++) {
        let s = each_array_1[$$index_1];
        $$renderer3.option({ value: s.id }, ($$renderer4) => {
          $$renderer4.push(`${escape_html(s.student_id)} · ${escape_html(s.problem_id)} (${escape_html(s.language)})`);
        });
      }
      $$renderer3.push(`<!--]-->`);
    });
    $$renderer2.push(`</div></div> <div class="field"><label for="threshold">Umbral de alerta: <strong>${escape_html((threshold * 100).toFixed(0))}%</strong></label> <input id="threshold" type="range" min="0" max="1" step="0.05"${attr("value", threshold)} class="slider svelte-qyvq8a"/> <div class="slider-labels svelte-qyvq8a"><span>0%</span><span>50%</span><span>100%</span></div></div> <button class="btn btn--primary" type="submit"${attr("disabled", store_get($$store_subs ??= {}, "$submissions", submissions).length < 2, true)}>${escape_html("⚡ Comparar ahora")}</button> `);
    if (store_get($$store_subs ??= {}, "$submissions", submissions).length < 2) {
      $$renderer2.push("<!--[0-->");
      $$renderer2.push(`<p class="hint svelte-qyvq8a">Necesitas al menos 2 submissions. Ve a la pestaña Submissions.</p>`);
    } else {
      $$renderer2.push("<!--[-1-->");
    }
    $$renderer2.push(`<!--]--></form> `);
    {
      $$renderer2.push("<!--[-1-->");
    }
    $$renderer2.push(`<!--]--></div>`);
    if ($$store_subs) unsubscribe_stores($$store_subs);
  });
}
function BatchForm($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let mode = "problem_id";
    let scopeValue = "";
    let threshold = 0.7;
    let jobData = null;
    function stopPolling() {
      activeJob.set(null);
    }
    onDestroy(stopPolling);
    $$renderer2.push(`<div class="rounded-xl border border-border bg-card p-6 shadow-sm"><h2 class="card__title">📊 Análisis Batch <span class="badge-async svelte-8ou9a2">Asíncrono</span></h2> <p class="card__desc svelte-8ou9a2">Compara todas las submissions de un problema o examen. Se ejecuta en background.</p> <form><div class="scope-tabs svelte-8ou9a2"><button type="button"${attr_class("scope-tab svelte-8ou9a2", void 0, { "active": mode === "problem_id" })}>Por Problema</button> <button type="button"${attr_class("scope-tab svelte-8ou9a2", void 0, { "active": mode === "exam_id" })}>Por Examen</button></div> <div class="field"><label for="scope">${escape_html("Problem ID")} *</label> <input id="scope"${attr("value", scopeValue)}${attr("placeholder", "prob-fibonacci")} required=""/></div> <div class="field"><label for="batchThreshold">Umbral de alerta: <strong>${escape_html((threshold * 100).toFixed(0))}%</strong></label> <input id="batchThreshold" type="range" min="0" max="1" step="0.05"${attr("value", threshold)} class="slider svelte-8ou9a2"/> <div class="slider-labels svelte-8ou9a2"><span>0%</span><span>50%</span><span>100%</span></div></div> <button class="btn btn--primary" type="submit"${attr("disabled", jobData, true)}>${escape_html("🚀 Lanzar análisis batch")}</button></form> `);
    {
      $$renderer2.push("<!--[-1-->");
    }
    $$renderer2.push(`<!--]--></div>`);
  });
}
function _page($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    var $$store_subs;
    head("8pceb3", $$renderer2, ($$renderer3) => {
      $$renderer3.title(($$renderer4) => {
        $$renderer4.push(`<title>Análisis de similitud | Procto</title>`);
      });
    });
    PageHeader($$renderer2, {
      focus: "Análisis",
      title: "Análisis de similitud",
      subtitle: "Compara entregas para detectar similitud. El análisis entre dos entregas es inmediato; el análisis por lote se procesa en segundo plano."
    });
    $$renderer2.push(`<!----> `);
    if (store_get($$store_subs ??= {}, "$submissions", submissions).length === 0) {
      $$renderer2.push("<!--[0-->");
      $$renderer2.push(`<div class="mb-6 rounded-xl border border-primary/20 bg-primary/5 p-4 text-sm text-foreground">No hay entregas cargadas. Ve a <a href="/submissions" class="font-semibold text-primary hover:underline">Entregas</a> para crear algunas primero.</div>`);
    } else {
      $$renderer2.push("<!--[-1-->");
    }
    $$renderer2.push(`<!--]--> <div class="analysis-grid grid gap-6 lg:grid-cols-2 svelte-8pceb3">`);
    PairwiseForm($$renderer2);
    $$renderer2.push(`<!----> `);
    BatchForm($$renderer2);
    $$renderer2.push(`<!----></div>`);
    if ($$store_subs) unsubscribe_stores($$store_subs);
  });
}
export {
  _page as default
};
