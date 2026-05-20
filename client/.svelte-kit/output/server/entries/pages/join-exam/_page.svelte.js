import { j as head, e as escape_html } from "../../../chunks/index2.js";
import { g as goto } from "../../../chunks/client.js";
import { P as PageHeader } from "../../../chunks/PageHeader.js";
import { r as request } from "../../../chunks/api.js";
import { e as examStore } from "../../../chunks/exam-store.js";
import { C as Card, a as Card_content } from "../../../chunks/card-content.js";
import "clsx";
import { B as Button } from "../../../chunks/button.js";
import { L as Label, I as Input } from "../../../chunks/label.js";
import { A as Alert } from "../../../chunks/alert.js";
import { A as Alert_description } from "../../../chunks/alert-description.js";
function verifyExamCode(code) {
  return request("POST", "/exams/verify-code", { code });
}
function _page($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let code = "";
    let loading = false;
    let invalidMessage = "";
    let notFoundMessage = "";
    let finishedMessage = "";
    let networkMessage = "";
    let successMessage = "";
    let foundExam = null;
    function normalizeCode(value) {
      return value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 6);
    }
    async function handleVerify() {
      const normalized = normalizeCode(code);
      if (normalized.length !== 6) {
        invalidMessage = "Ingresa un código válido de 6 caracteres.";
        return;
      }
      loading = true;
      invalidMessage = "";
      notFoundMessage = "";
      finishedMessage = "";
      networkMessage = "";
      successMessage = "";
      foundExam = null;
      try {
        const exam = await verifyExamCode(normalized);
        foundExam = exam;
        examStore.set({
          id: exam.id,
          name: exam.name,
          ends_at: exam.ends_at ?? null,
          code: exam.code,
          expired_at: null
        });
        successMessage = `Examen encontrado: ${exam.name}`;
      } catch (e) {
        const msg = e?.message ?? "";
        if (msg.includes("CODE_NOT_FOUND")) {
          notFoundMessage = "Código no encontrado. Verifica el código con tu profesor.";
          code = "";
        } else if (msg.includes("EXAM_FINISHED")) {
          finishedMessage = "Este examen ya finalizó.";
          code = "";
        } else {
          networkMessage = "Error de conexión. Verifica que el servidor esté activo.";
        }
      } finally {
        loading = false;
      }
    }
    function startProctoring() {
      if (!foundExam) return;
      goto();
    }
    head("1hysupz", $$renderer2, ($$renderer3) => {
      $$renderer3.title(($$renderer4) => {
        $$renderer4.push(`<title>Unirse a examen | Procto</title>`);
      });
    });
    $$renderer2.push(`<div class="mx-auto max-w-lg">`);
    PageHeader($$renderer2, {
      focus: "Supervisión",
      title: "Unirse a un examen",
      subtitle: "Ingresa el código del examen para validar tu acceso antes de iniciar la supervisión."
    });
    $$renderer2.push(`<!----> `);
    Card($$renderer2, {
      class: "rounded-xl",
      children: ($$renderer3) => {
        Card_content($$renderer3, {
          class: "space-y-4 pt-6",
          children: ($$renderer4) => {
            $$renderer4.push(`<div class="space-y-2">`);
            Label($$renderer4, {
              for: "examCode",
              children: ($$renderer5) => {
                $$renderer5.push(`<!---->Código de examen`);
              },
              $$slots: { default: true }
            });
            $$renderer4.push(`<!----> `);
            Input($$renderer4, {
              id: "examCode",
              type: "text",
              value: code,
              maxlength: "6",
              placeholder: "ABC123",
              autocomplete: "off",
              class: "h-14 text-center text-2xl font-bold uppercase tracking-[0.2em]"
            });
            $$renderer4.push(`<!----></div> `);
            Button($$renderer4, {
              type: "button",
              class: "w-full",
              onclick: handleVerify,
              disabled: loading,
              children: ($$renderer5) => {
                $$renderer5.push(`<!---->${escape_html(loading ? "Verificando..." : "Verificar código")}`);
              },
              $$slots: { default: true }
            });
            $$renderer4.push(`<!----> `);
            if (invalidMessage) {
              $$renderer4.push("<!--[0-->");
              Alert($$renderer4, {
                variant: "destructive",
                children: ($$renderer5) => {
                  Alert_description($$renderer5, {
                    children: ($$renderer6) => {
                      $$renderer6.push(`<!---->${escape_html(invalidMessage)}`);
                    },
                    $$slots: { default: true }
                  });
                },
                $$slots: { default: true }
              });
            } else {
              $$renderer4.push("<!--[-1-->");
            }
            $$renderer4.push(`<!--]--> `);
            if (notFoundMessage) {
              $$renderer4.push("<!--[0-->");
              Alert($$renderer4, {
                variant: "destructive",
                children: ($$renderer5) => {
                  Alert_description($$renderer5, {
                    children: ($$renderer6) => {
                      $$renderer6.push(`<!---->${escape_html(notFoundMessage)}`);
                    },
                    $$slots: { default: true }
                  });
                },
                $$slots: { default: true }
              });
            } else {
              $$renderer4.push("<!--[-1-->");
            }
            $$renderer4.push(`<!--]--> `);
            if (finishedMessage) {
              $$renderer4.push("<!--[0-->");
              Alert($$renderer4, {
                children: ($$renderer5) => {
                  Alert_description($$renderer5, {
                    children: ($$renderer6) => {
                      $$renderer6.push(`<!---->${escape_html(finishedMessage)}`);
                    },
                    $$slots: { default: true }
                  });
                },
                $$slots: { default: true }
              });
            } else {
              $$renderer4.push("<!--[-1-->");
            }
            $$renderer4.push(`<!--]--> `);
            if (networkMessage) {
              $$renderer4.push("<!--[0-->");
              Alert($$renderer4, {
                variant: "destructive",
                children: ($$renderer5) => {
                  Alert_description($$renderer5, {
                    children: ($$renderer6) => {
                      $$renderer6.push(`<!---->${escape_html(networkMessage)}`);
                    },
                    $$slots: { default: true }
                  });
                },
                $$slots: { default: true }
              });
            } else {
              $$renderer4.push("<!--[-1-->");
            }
            $$renderer4.push(`<!--]--> `);
            if (successMessage) {
              $$renderer4.push("<!--[0-->");
              Alert($$renderer4, {
                class: "border-emerald-500/30 bg-emerald-50 text-emerald-900",
                children: ($$renderer5) => {
                  Alert_description($$renderer5, {
                    children: ($$renderer6) => {
                      $$renderer6.push(`<!---->${escape_html(successMessage)}`);
                    },
                    $$slots: { default: true }
                  });
                },
                $$slots: { default: true }
              });
            } else {
              $$renderer4.push("<!--[-1-->");
            }
            $$renderer4.push(`<!--]--> `);
            if (foundExam) {
              $$renderer4.push("<!--[0-->");
              Button($$renderer4, {
                variant: "secondary",
                class: "w-full",
                onclick: startProctoring,
                children: ($$renderer5) => {
                  $$renderer5.push(`<!---->Iniciar supervisión`);
                },
                $$slots: { default: true }
              });
            } else {
              $$renderer4.push("<!--[-1-->");
            }
            $$renderer4.push(`<!--]-->`);
          },
          $$slots: { default: true }
        });
      },
      $$slots: { default: true }
    });
    $$renderer2.push(`<!----></div>`);
  });
}
export {
  _page as default
};
