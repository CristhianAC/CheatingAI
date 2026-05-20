import { a as attributes, c as clsx, b as bind_props, j as head } from "../../../chunks/index2.js";
import { P as PageHeader } from "../../../chunks/PageHeader.js";
import { c as cn } from "../../../chunks/button.js";
import "clsx";
import "../../../chunks/badge.js";
import "../../../chunks/alert.js";
function Skeleton($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let {
      ref = null,
      class: className,
      $$slots,
      $$events,
      ...restProps
    } = $$props;
    $$renderer2.push(`<div${attributes({
      "data-slot": "skeleton",
      class: clsx(cn("bg-muted rounded-md animate-pulse", className)),
      ...restProps
    })}></div>`);
    bind_props($$props, { ref });
  });
}
function _page($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    head("maq4gq", $$renderer2, ($$renderer3) => {
      $$renderer3.title(($$renderer4) => {
        $$renderer4.push(`<title>Mi perfil | Procto</title>`);
      });
    });
    $$renderer2.push(`<div class="mx-auto max-w-lg">`);
    PageHeader($$renderer2, {
      focus: "Cuenta",
      title: "Mi perfil",
      subtitle: "Datos de tu cuenta y foto de referencia para supervisión."
    });
    $$renderer2.push(`<!----> `);
    {
      $$renderer2.push("<!--[0-->");
      $$renderer2.push(`<div class="space-y-3">`);
      Skeleton($$renderer2, { class: "h-8 w-3/4" });
      $$renderer2.push(`<!----> `);
      Skeleton($$renderer2, { class: "h-24 w-full" });
      $$renderer2.push(`<!----></div>`);
    }
    $$renderer2.push(`<!--]--></div>`);
  });
}
export {
  _page as default
};
