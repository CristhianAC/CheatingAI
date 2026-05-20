import { i as attr, e as escape_html, h as ensure_array_like, d as attr_class, l as stringify, b as bind_props, j as head } from "../../../chunks/index2.js";
import { c as createEventDispatcher } from "../../../chunks/index-server.js";
import { a as listSubmissions } from "../../../chunks/api.js";
import { b as showError } from "../../../chunks/stores.js";
import { P as PageHeader } from "../../../chunks/PageHeader.js";
function SubmissionForm($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let form = {
      student_id: "",
      problem_id: "",
      exam_id: "",
      language: "python",
      source_code: ""
    };
    let loading = false;
    $$renderer2.push(`<form class="mb-6 rounded-xl border border-border bg-card p-6 shadow-sm"><h2 class="mb-4 text-lg font-semibold">Nueva entrega</h2> <div class="grid-2 svelte-1xn7aei"><div class="field"><label for="student_id">Student ID *</label> <input id="student_id"${attr("value", form.student_id)} placeholder="est-001" required=""/></div> <div class="field"><label for="problem_id">Problem ID *</label> <input id="problem_id"${attr("value", form.problem_id)} placeholder="prob-fibonacci" required=""/></div> <div class="field"><label for="exam_id">Exam ID (opcional)</label> <input id="exam_id"${attr("value", form.exam_id)} placeholder="parcial-1"/></div> <div class="field"><label for="language">Lenguaje *</label> `);
    $$renderer2.select({ id: "language", value: form.language }, ($$renderer3) => {
      $$renderer3.option({ value: "python" }, ($$renderer4) => {
        $$renderer4.push(`Python`);
      });
      $$renderer3.option({ value: "java" }, ($$renderer4) => {
        $$renderer4.push(`Java`);
      });
    });
    $$renderer2.push(`</div></div> <div class="field"><div class="code-header svelte-1xn7aei"><label for="source_code" class="svelte-1xn7aei">Código fuente *</label> <button type="button" class="btn btn--ghost btn--sm">📋 Cargar ejemplo</button></div> <textarea id="source_code" rows="10" placeholder="Pega el código aquí..." spellcheck="false" required="" class="svelte-1xn7aei">`);
    const $$body = escape_html(form.source_code);
    if ($$body) {
      $$renderer2.push(`${$$body}`);
    }
    $$renderer2.push(`</textarea></div> <button class="btn btn--primary" type="submit"${attr("disabled", loading, true)}>${escape_html("📤 Crear Submission")}</button></form>`);
  });
}
function SubmissionList($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    const dispatch = createEventDispatcher();
    let filters = { problem_id: "", exam_id: "", language: "" };
    let items = [];
    let total = 0;
    let loading = false;
    async function reload() {
      loading = true;
      try {
        const res = await listSubmissions(filters);
        items = res.items;
        total = res.total;
        dispatch("loaded", items);
      } catch (e) {
        showError(e.message);
      } finally {
        loading = false;
      }
    }
    $$renderer2.push(`<div class="rounded-xl border border-border bg-card p-6 shadow-sm"><div class="filters svelte-wtx1co"><input${attr("value", filters.problem_id)} placeholder="Filtrar por problem_id" class="svelte-wtx1co"/> <input${attr("value", filters.exam_id)} placeholder="Filtrar por exam_id" class="svelte-wtx1co"/> `);
    $$renderer2.select(
      { value: filters.language, class: "" },
      ($$renderer3) => {
        $$renderer3.option({ value: "" }, ($$renderer4) => {
          $$renderer4.push(`Todos los lenguajes`);
        });
        $$renderer3.option({ value: "python" }, ($$renderer4) => {
          $$renderer4.push(`Python`);
        });
        $$renderer3.option({ value: "java" }, ($$renderer4) => {
          $$renderer4.push(`Java`);
        });
      },
      "svelte-wtx1co"
    );
    $$renderer2.push(` <button type="button" class="btn btn--secondary"${attr("disabled", loading, true)}>${escape_html(loading ? "Buscando…" : "Buscar")}</button></div> <div class="table-meta svelte-wtx1co"><span>${escape_html(total)} entrega${escape_html(total !== 1 ? "s" : "")} encontrada${escape_html(total !== 1 ? "s" : "")}</span></div> `);
    if (items.length === 0 && !loading) {
      $$renderer2.push("<!--[0-->");
      $$renderer2.push(`<div class="empty svelte-wtx1co">No hay entregas aún. Crea una con el formulario superior.</div>`);
    } else {
      $$renderer2.push("<!--[-1-->");
      $$renderer2.push(`<div class="table-wrap svelte-wtx1co"><table class="svelte-wtx1co"><thead><tr><th class="svelte-wtx1co">ID</th><th class="svelte-wtx1co">Participante</th><th class="svelte-wtx1co">Problema</th><th class="svelte-wtx1co">Examen</th><th class="svelte-wtx1co">Lenguaje</th><th class="svelte-wtx1co">Creado</th><th class="svelte-wtx1co">Acciones</th></tr></thead><tbody><!--[-->`);
      const each_array = ensure_array_like(items);
      for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
        let sub = each_array[$$index];
        $$renderer2.push(`<tr class="row-hover svelte-wtx1co"><td class="mono svelte-wtx1co">${escape_html(sub.id.slice(0, 8))}…</td><td class="svelte-wtx1co">${escape_html(sub.student_id)}</td><td class="svelte-wtx1co">${escape_html(sub.problem_id)}</td><td class="svelte-wtx1co">${escape_html(sub.exam_id ?? "—")}</td><td class="svelte-wtx1co"><span${attr_class(`badge badge--${stringify(sub.language)}`, "svelte-wtx1co")}>${escape_html(sub.language)}</span></td><td class="date svelte-wtx1co">${escape_html(new Date(sub.created_at).toLocaleString("es-CO"))}</td><td class="svelte-wtx1co"><button type="button" class="btn btn--danger btn--sm" aria-label="Eliminar entrega">Eliminar</button></td></tr>`);
      }
      $$renderer2.push(`<!--]--></tbody></table></div>`);
    }
    $$renderer2.push(`<!--]--></div> `);
    {
      $$renderer2.push("<!--[-1-->");
    }
    $$renderer2.push(`<!--]--> `);
    {
      $$renderer2.push("<!--[-1-->");
    }
    $$renderer2.push(`<!--]-->`);
    bind_props($$props, { reload });
  });
}
function _page($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    head("6yqrsq", $$renderer2, ($$renderer3) => {
      $$renderer3.title(($$renderer4) => {
        $$renderer4.push(`<title>Entregas de código | Procto</title>`);
      });
    });
    PageHeader($$renderer2, {
      focus: "Plagio",
      title: "Entregas de código",
      subtitle: "Gestiona las entregas de los participantes. Pulsa una fila para ver el código fuente."
    });
    $$renderer2.push(`<!----> `);
    SubmissionForm($$renderer2);
    $$renderer2.push(`<!----> `);
    SubmissionList($$renderer2, {});
    $$renderer2.push(`<!---->`);
  });
}
export {
  _page as default
};
