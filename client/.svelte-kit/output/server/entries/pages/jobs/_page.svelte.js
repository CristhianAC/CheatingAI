import { k as fallback, d as attr_class, e as escape_html, l as stringify, m as attr_style, b as bind_props, j as head, h as ensure_array_like } from "../../../chunks/index2.js";
import { l as listJobs } from "../../../chunks/api.js";
import { b as showError } from "../../../chunks/stores.js";
import { o as onDestroy } from "../../../chunks/index-server.js";
import { P as PageHeader } from "../../../chunks/PageHeader.js";
import { B as Button } from "../../../chunks/button.js";
function JobCard($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let duration;
    let job = $$props["job"];
    let selected = fallback($$props["selected"], false);
    const STATUS_ICON = { pending: "⏳", running: "⚙️", completed: "✅", failed: "❌" };
    function fmt(dt) {
      return dt ? new Date(dt).toLocaleString("es-CO") : "—";
    }
    duration = (() => {
      if (!job.started_at || !job.finished_at) return null;
      const ms = new Date(job.finished_at) - new Date(job.started_at);
      return ms < 1e3 ? `${ms}ms` : `${(ms / 1e3).toFixed(1)}s`;
    })();
    $$renderer2.push(`<div${attr_class(`job-card mb-3 cursor-pointer rounded-xl border border-border bg-card p-4 shadow-sm transition-shadow hover:shadow-md ${selected ? "ring-2 ring-primary" : ""} ${job.status === "completed" ? "hover:border-primary/40" : ""}`, "svelte-1vivc5", {
      "selected": selected,
      "completed": job.status === "completed"
    })}><div class="job-top svelte-1vivc5"><div class="job-left svelte-1vivc5"><span class="job-icon svelte-1vivc5">${escape_html(STATUS_ICON[job.status])}</span> <div><div class="job-id svelte-1vivc5"><code class="svelte-1vivc5">${escape_html(job.id.slice(0, 8))}…</code> <span${attr_class(`badge-type badge-type--${stringify(job.job_type)}`, "svelte-1vivc5")}>${escape_html(job.job_type)}</span></div> <div class="job-scope svelte-1vivc5">`);
    if (job.problem_id) {
      $$renderer2.push("<!--[0-->");
      $$renderer2.push(`📁 ${escape_html(job.problem_id)}`);
    } else {
      $$renderer2.push("<!--[-1-->");
    }
    $$renderer2.push(`<!--]--> `);
    if (job.exam_id) {
      $$renderer2.push("<!--[0-->");
      $$renderer2.push(`📋 ${escape_html(job.exam_id)}`);
    } else {
      $$renderer2.push("<!--[-1-->");
    }
    $$renderer2.push(`<!--]--> `);
    if (job.submission_a_id) {
      $$renderer2.push("<!--[0-->");
      $$renderer2.push(`🔗 Par a par`);
    } else {
      $$renderer2.push("<!--[-1-->");
    }
    $$renderer2.push(`<!--]--></div></div></div> <span${attr_class(`badge-status badge-status--${stringify(job.status)}`, "svelte-1vivc5")}>${escape_html(job.status)}</span></div> <div class="job-stats svelte-1vivc5">`);
    if (job.total_comparisons > 0) {
      $$renderer2.push("<!--[0-->");
      $$renderer2.push(`<span>🔁 ${escape_html(job.completed_comparisons)}/${escape_html(job.total_comparisons)} comparaciones</span>`);
    } else {
      $$renderer2.push("<!--[-1-->");
    }
    $$renderer2.push(`<!--]--> `);
    if (duration) {
      $$renderer2.push("<!--[0-->");
      $$renderer2.push(`<span>⏱️ ${escape_html(duration)}</span>`);
    } else {
      $$renderer2.push("<!--[-1-->");
    }
    $$renderer2.push(`<!--]--> <span>🕐 ${escape_html(fmt(job.created_at))}</span></div> `);
    if (job.status === "running" && job.total_comparisons > 0) {
      $$renderer2.push("<!--[0-->");
      const pct = Math.round(job.completed_comparisons / job.total_comparisons * 100);
      $$renderer2.push(`<div class="mini-progress svelte-1vivc5"><div class="mini-bar svelte-1vivc5"${attr_style(`width:${stringify(pct)}%`)}></div></div>`);
    } else {
      $$renderer2.push("<!--[-1-->");
    }
    $$renderer2.push(`<!--]--> `);
    if (job.error_message) {
      $$renderer2.push("<!--[0-->");
      $$renderer2.push(`<p class="job-error svelte-1vivc5">⚠️ ${escape_html(job.error_message)}</p>`);
    } else {
      $$renderer2.push("<!--[-1-->");
    }
    $$renderer2.push(`<!--]--></div>`);
    bind_props($$props, { job, selected });
  });
}
function _page($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let hasRunning;
    let jobs = [];
    let loading = false;
    let selectedJobId = null;
    async function loadJobs() {
      loading = true;
      try {
        jobs = await listJobs({ limit: 50 });
      } catch (e) {
        showError(e.message);
      } finally {
        loading = false;
      }
    }
    onDestroy(() => {
    });
    hasRunning = jobs.some((j) => j.status === "running" || j.status === "pending");
    head("4b134t", $$renderer2, ($$renderer3) => {
      $$renderer3.title(($$renderer4) => {
        $$renderer4.push(`<title>Trabajos en cola | Procto</title>`);
      });
    });
    PageHeader($$renderer2, {
      focus: "Procesamiento",
      title: "Trabajos en cola",
      subtitle: "Historial de análisis por lotes. Elige un trabajo finalizado para ver el detalle de resultados.",
      $$slots: {
        actions: ($$renderer3) => {
          {
            Button($$renderer3, {
              variant: "outline",
              size: "sm",
              onclick: loadJobs,
              disabled: loading,
              children: ($$renderer4) => {
                $$renderer4.push(`<!---->${escape_html(loading ? "Cargando…" : "Actualizar")}`);
              },
              $$slots: { default: true }
            });
          }
        }
      }
    });
    $$renderer2.push(`<!----> `);
    if (hasRunning) {
      $$renderer2.push("<!--[0-->");
      $$renderer2.push(`<div class="mb-6 rounded-xl border border-primary/20 bg-primary/5 p-4 text-sm">Hay análisis en progreso. Esta vista se actualiza sola cada pocos segundos.</div>`);
    } else {
      $$renderer2.push("<!--[-1-->");
    }
    $$renderer2.push(`<!--]--> `);
    if (jobs.length === 0 && !loading) {
      $$renderer2.push("<!--[0-->");
      $$renderer2.push(`<div class="rounded-xl border border-border bg-card p-12 text-center text-muted-foreground">No hay trabajos todavía. Ve a <a href="/analysis" class="font-semibold text-primary hover:underline">Análisis</a> para lanzar uno.</div>`);
    } else {
      $$renderer2.push("<!--[-1-->");
      $$renderer2.push(`<div class="jobs-layout grid gap-6 lg:grid-cols-[380px_1fr] svelte-4b134t"><div class="jobs-list svelte-4b134t"><!--[-->`);
      const each_array = ensure_array_like(jobs);
      for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
        let job = each_array[$$index];
        $$renderer2.push(`<div role="button" tabindex="0">`);
        JobCard($$renderer2, { job, selected: selectedJobId === job.id });
        $$renderer2.push(`<!----></div>`);
      }
      $$renderer2.push(`<!--]--></div> <div class="results-panel">`);
      {
        $$renderer2.push("<!--[-1-->");
        $$renderer2.push(`<div class="rounded-xl border border-dashed border-border bg-muted/20 p-12 text-center text-sm text-muted-foreground"><p>Selecciona un trabajo completado en la lista para ver sus resultados.</p></div>`);
      }
      $$renderer2.push(`<!--]--></div></div>`);
    }
    $$renderer2.push(`<!--]-->`);
  });
}
export {
  _page as default
};
