import { a as attributes, c as clsx, b as bind_props, s as store_get, e as escape_html, u as unsubscribe_stores, g as getContext, d as attr_class, f as slot } from "../../chunks/index2.js";
import { g as goto } from "../../chunks/client.js";
import { t as toast } from "../../chunks/stores.js";
import { A as Alert } from "../../chunks/alert.js";
import { A as Alert_description } from "../../chunks/alert-description.js";
import { c as cn, B as Button } from "../../chunks/button.js";
import { l as logout, a as authStore } from "../../chunks/auth.js";
import "clsx";
import "@sveltejs/kit/internal";
import "../../chunks/exports.js";
import "../../chunks/utils.js";
import "@sveltejs/kit/internal/server";
import "../../chunks/root.js";
import "../../chunks/state.svelte.js";
function Alert_title($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let {
      ref = null,
      class: className,
      children,
      $$slots,
      $$events,
      ...restProps
    } = $$props;
    $$renderer2.push(`<div${attributes({
      "data-slot": "alert-title",
      class: clsx(cn("font-medium group-has-[>svg]/alert:col-start-2 [&_a]:hover:text-foreground [&_a]:underline [&_a]:underline-offset-3", className)),
      ...restProps
    })}>`);
    children?.($$renderer2);
    $$renderer2.push(`<!----></div>`);
    bind_props($$props, { ref });
  });
}
function Toast($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    var $$store_subs;
    const variantClass = {
      success: "border-emerald-500/40 bg-emerald-50 text-emerald-900",
      error: "border-destructive/40 bg-destructive/10 text-destructive",
      info: "border-primary/30 bg-primary/5 text-foreground"
    };
    if (store_get($$store_subs ??= {}, "$toast", toast)) {
      $$renderer2.push("<!--[0-->");
      $$renderer2.push(`<div class="pointer-events-none fixed bottom-6 right-6 z-[1000] max-w-sm animate-in slide-in-from-right-4">`);
      Alert($$renderer2, {
        class: cn("pointer-events-auto shadow-lg", variantClass[store_get($$store_subs ??= {}, "$toast", toast).type] ?? variantClass.info),
        children: ($$renderer3) => {
          Alert_title($$renderer3, {
            class: "text-sm font-semibold",
            children: ($$renderer4) => {
              if (store_get($$store_subs ??= {}, "$toast", toast).type === "success") {
                $$renderer4.push("<!--[0-->");
                $$renderer4.push(`Éxito`);
              } else if (store_get($$store_subs ??= {}, "$toast", toast).type === "error") {
                $$renderer4.push("<!--[1-->");
                $$renderer4.push(`Error`);
              } else {
                $$renderer4.push("<!--[-1-->");
                $$renderer4.push(`Aviso`);
              }
              $$renderer4.push(`<!--]-->`);
            },
            $$slots: { default: true }
          });
          $$renderer3.push(`<!----> `);
          Alert_description($$renderer3, {
            children: ($$renderer4) => {
              $$renderer4.push(`<!---->${escape_html(store_get($$store_subs ??= {}, "$toast", toast).message)}`);
            },
            $$slots: { default: true }
          });
          $$renderer3.push(`<!---->`);
        },
        $$slots: { default: true }
      });
      $$renderer2.push(`<!----></div>`);
    } else {
      $$renderer2.push("<!--[-1-->");
    }
    $$renderer2.push(`<!--]-->`);
    if ($$store_subs) unsubscribe_stores($$store_subs);
  });
}
const getStores = () => {
  const stores$1 = getContext("__svelte__");
  return {
    /** @type {typeof page} */
    page: {
      subscribe: stores$1.page.subscribe
    },
    /** @type {typeof navigating} */
    navigating: {
      subscribe: stores$1.navigating.subscribe
    },
    /** @type {typeof updated} */
    updated: stores$1.updated
  };
};
const page = {
  subscribe(fn) {
    const store = getStores().page;
    return store.subscribe(fn);
  }
};
function _layout($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    var $$store_subs;
    let isAuthPage, path;
    function handleLogout() {
      logout();
      goto();
    }
    function navClass(active) {
      return cn("rounded-full px-3 py-1.5 text-sm font-medium transition-colors", active ? "bg-foreground/8 text-foreground" : "text-muted-foreground hover:bg-muted hover:text-foreground");
    }
    isAuthPage = store_get($$store_subs ??= {}, "$page", page).url.pathname === "/login" || store_get($$store_subs ??= {}, "$page", page).url.pathname === "/register";
    path = store_get($$store_subs ??= {}, "$page", page).url.pathname;
    $$renderer2.push(`<div class="min-h-screen bg-background"><header class="sticky top-0 z-50 border-b border-border/80 bg-card/80 backdrop-blur-xl supports-[backdrop-filter]:bg-card/70"><div class="mx-auto flex h-[var(--procto-header-h)] max-w-6xl items-center gap-4 px-4 sm:px-6"><a href="/" class="flex shrink-0 items-center gap-3 border-r border-border pr-4" aria-label="Procto, inicio"><img src="/roble_amarillo.png" alt="" width="48" height="48" class="size-12 object-contain" decoding="async"/> <span class="text-2xl font-bold tracking-tight text-foreground">Procto</span></a> `);
    if (!isAuthPage) {
      $$renderer2.push("<!--[0-->");
      $$renderer2.push(`<nav class="flex flex-1 flex-wrap items-center justify-center gap-1 overflow-x-auto max-sm:justify-start max-sm:pb-1" aria-label="Principal">`);
      if (store_get($$store_subs ??= {}, "$authStore", authStore)?.role === "PROFESSOR") {
        $$renderer2.push("<!--[0-->");
        $$renderer2.push(`<a href="/exams"${attr_class(clsx(navClass(path.startsWith("/exams"))))}>Exámenes</a>`);
      } else {
        $$renderer2.push("<!--[-1-->");
      }
      $$renderer2.push(`<!--]--> `);
      if (store_get($$store_subs ??= {}, "$authStore", authStore)?.role === "STUDENT") {
        $$renderer2.push("<!--[0-->");
        $$renderer2.push(`<a href="/join-exam"${attr_class(clsx(navClass(path.startsWith("/join-exam"))))}>Unirse a examen</a>`);
      } else {
        $$renderer2.push("<!--[-1-->");
      }
      $$renderer2.push(`<!--]--> `);
      if (store_get($$store_subs ??= {}, "$authStore", authStore)?.user) {
        $$renderer2.push("<!--[0-->");
        $$renderer2.push(`<a href="/submissions"${attr_class(clsx(navClass(path.startsWith("/submissions"))))}>Entregas</a> <a href="/analysis"${attr_class(clsx(navClass(path.startsWith("/analysis"))))}>Análisis</a> <a href="/jobs"${attr_class(clsx(navClass(path.startsWith("/jobs"))))}>Trabajos</a>`);
      } else {
        $$renderer2.push("<!--[-1-->");
      }
      $$renderer2.push(`<!--]--></nav> `);
      if (store_get($$store_subs ??= {}, "$authStore", authStore)?.user) {
        $$renderer2.push("<!--[0-->");
        $$renderer2.push(`<div class="ml-auto flex shrink-0 items-center gap-2">`);
        Button($$renderer2, {
          variant: "ghost",
          size: "sm",
          href: "/profile",
          class: "max-w-[10rem] truncate font-medium",
          children: ($$renderer3) => {
            $$renderer3.push(`<!---->${escape_html(store_get($$store_subs ??= {}, "$authStore", authStore).user.full_name)}`);
          },
          $$slots: { default: true }
        });
        $$renderer2.push(`<!----> `);
        Button($$renderer2, {
          variant: "outline",
          size: "sm",
          onclick: handleLogout,
          children: ($$renderer3) => {
            $$renderer3.push(`<!---->Salir`);
          },
          $$slots: { default: true }
        });
        $$renderer2.push(`<!----></div>`);
      } else {
        $$renderer2.push("<!--[-1-->");
      }
      $$renderer2.push(`<!--]-->`);
    } else {
      $$renderer2.push("<!--[-1-->");
    }
    $$renderer2.push(`<!--]--></div></header> <main class="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10"><!--[-->`);
    slot($$renderer2, $$props, "default", {});
    $$renderer2.push(`<!--]--></main> `);
    Toast($$renderer2);
    $$renderer2.push(`<!----></div>`);
    if ($$store_subs) unsubscribe_stores($$store_subs);
  });
}
export {
  _layout as default
};
