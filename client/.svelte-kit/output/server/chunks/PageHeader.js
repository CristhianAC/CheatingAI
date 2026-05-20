import { ao as sanitize_slots, k as fallback, e as escape_html, f as slot, b as bind_props } from "./index2.js";
function PageHeader($$renderer, $$props) {
  const $$slots = sanitize_slots($$props);
  let title = fallback($$props["title"], "");
  let subtitle = fallback($$props["subtitle"], "");
  let focus = fallback($$props["focus"], "");
  $$renderer.push(`<header class="mb-8 flex flex-wrap items-start justify-between gap-4 border-b border-border pb-6"><div class="min-w-[min(100%,280px)] flex-1 border-l-4 border-primary pl-4">`);
  if (focus) {
    $$renderer.push("<!--[0-->");
    $$renderer.push(`<p class="mb-2 text-xs font-semibold uppercase tracking-widest text-primary">${escape_html(focus)}</p>`);
  } else {
    $$renderer.push("<!--[-1-->");
  }
  $$renderer.push(`<!--]--> <h1 class="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">${escape_html(title)}</h1> `);
  if (subtitle) {
    $$renderer.push("<!--[0-->");
    $$renderer.push(`<p class="mt-2 max-w-2xl text-base text-muted-foreground">${escape_html(subtitle)}</p>`);
  } else {
    $$renderer.push("<!--[-1-->");
  }
  $$renderer.push(`<!--]--></div> `);
  if ($$slots.actions) {
    $$renderer.push("<!--[0-->");
    $$renderer.push(`<div class="flex shrink-0 items-center gap-2 pt-1"><!--[-->`);
    slot($$renderer, $$props, "actions", {});
    $$renderer.push(`<!--]--></div>`);
  } else {
    $$renderer.push("<!--[-1-->");
  }
  $$renderer.push(`<!--]--></header>`);
  bind_props($$props, { title, subtitle, focus });
}
export {
  PageHeader as P
};
