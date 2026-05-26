import { m as store_get, o as head, u as unsubscribe_stores } from "../../../chunks/index2.js";
import { o as onDestroy } from "../../../chunks/index-server2.js";
import "@sveltejs/kit/internal";
import "../../../chunks/exports.js";
import "../../../chunks/utils.js";
import "@sveltejs/kit/internal/server";
import "../../../chunks/root.js";
import "../../../chunks/state.svelte.js";
import "../../../chunks/button.js";
import "clsx";
import "../../../chunks/alert.js";
import "../../../chunks/badge.js";
import { a as authStore } from "../../../chunks/auth.js";
import "../../../chunks/exam-store.js";
function _page($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    var $$store_subs;
    onDestroy(() => {
    });
    store_get($$store_subs ??= {}, "$authStore", authStore)?.role === "PROFESSOR";
    store_get($$store_subs ??= {}, "$authStore", authStore)?.user?.full_name?.trim() || "Estudiante";
    head("1xz0qk", $$renderer2, ($$renderer3) => {
      $$renderer3.title(($$renderer4) => {
        $$renderer4.push(`<title>Supervisión | Procto</title>`);
      });
    });
    {
      $$renderer2.push("<!--[-1-->");
      $$renderer2.push(`<div class="proctoring-skeleton svelte-1xz0qk"></div>`);
    }
    $$renderer2.push(`<!--]-->`);
    if ($$store_subs) unsubscribe_stores($$store_subs);
  });
}
export {
  _page as default
};
