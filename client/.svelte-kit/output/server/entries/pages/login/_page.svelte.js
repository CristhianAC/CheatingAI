import { j as head, e as escape_html } from "../../../chunks/index2.js";
import "@sveltejs/kit/internal";
import "../../../chunks/exports.js";
import "../../../chunks/utils.js";
import "@sveltejs/kit/internal/server";
import "../../../chunks/root.js";
import "../../../chunks/state.svelte.js";
import { C as Card, a as Card_content } from "../../../chunks/card-content.js";
import { C as Card_header, a as Card_title, b as Card_description, c as Card_footer } from "../../../chunks/card-title.js";
import "clsx";
import { B as Button } from "../../../chunks/button.js";
import { L as Label, I as Input } from "../../../chunks/label.js";
import "../../../chunks/alert.js";
function _page($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let email = "";
    let password = "";
    let loading = false;
    let $$settled = true;
    let $$inner_renderer;
    function $$render_inner($$renderer3) {
      head("1x05zx6", $$renderer3, ($$renderer4) => {
        $$renderer4.title(($$renderer5) => {
          $$renderer5.push(`<title>Iniciar sesión | Procto</title>`);
        });
      });
      $$renderer3.push(`<div class="mx-auto max-w-md py-8">`);
      Card($$renderer3, {
        class: "rounded-xl shadow-sm",
        children: ($$renderer4) => {
          Card_header($$renderer4, {
            children: ($$renderer5) => {
              Card_title($$renderer5, {
                class: "text-xl",
                children: ($$renderer6) => {
                  $$renderer6.push(`<!---->Iniciar sesión`);
                },
                $$slots: { default: true }
              });
              $$renderer5.push(`<!----> `);
              Card_description($$renderer5, {
                children: ($$renderer6) => {
                  $$renderer6.push(`<!---->Accede a tu cuenta de Procto`);
                },
                $$slots: { default: true }
              });
              $$renderer5.push(`<!---->`);
            },
            $$slots: { default: true }
          });
          $$renderer4.push(`<!----> `);
          Card_content($$renderer4, {
            children: ($$renderer5) => {
              $$renderer5.push(`<form class="flex flex-col gap-4"><div class="space-y-2">`);
              Label($$renderer5, {
                for: "email",
                children: ($$renderer6) => {
                  $$renderer6.push(`<!---->Email`);
                },
                $$slots: { default: true }
              });
              $$renderer5.push(`<!----> `);
              Input($$renderer5, {
                id: "email",
                type: "email",
                required: true,
                autocomplete: "email",
                get value() {
                  return email;
                },
                set value($$value) {
                  email = $$value;
                  $$settled = false;
                }
              });
              $$renderer5.push(`<!----></div> <div class="space-y-2">`);
              Label($$renderer5, {
                for: "password",
                children: ($$renderer6) => {
                  $$renderer6.push(`<!---->Contraseña`);
                },
                $$slots: { default: true }
              });
              $$renderer5.push(`<!----> `);
              Input($$renderer5, {
                id: "password",
                type: "password",
                required: true,
                autocomplete: "current-password",
                get value() {
                  return password;
                },
                set value($$value) {
                  password = $$value;
                  $$settled = false;
                }
              });
              $$renderer5.push(`<!----></div> `);
              {
                $$renderer5.push("<!--[-1-->");
              }
              $$renderer5.push(`<!--]--> `);
              Button($$renderer5, {
                type: "submit",
                class: "w-full",
                disabled: loading,
                children: ($$renderer6) => {
                  $$renderer6.push(`<!---->${escape_html("Iniciar sesión")}`);
                },
                $$slots: { default: true }
              });
              $$renderer5.push(`<!----></form>`);
            },
            $$slots: { default: true }
          });
          $$renderer4.push(`<!----> `);
          Card_footer($$renderer4, {
            class: "text-sm text-muted-foreground",
            children: ($$renderer5) => {
              $$renderer5.push(`<!---->¿No tienes cuenta? <a href="/register" class="font-medium text-primary hover:underline">Regístrate</a>`);
            },
            $$slots: { default: true }
          });
          $$renderer4.push(`<!---->`);
        },
        $$slots: { default: true }
      });
      $$renderer3.push(`<!----></div>`);
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
