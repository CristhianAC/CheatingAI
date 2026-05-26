import { q as fallback, i as escape_html, e as ensure_array_like, a as attr_class, p as bind_props, o as head, c as clsx } from "../../../chunks/index2.js";
import "@sveltejs/kit/internal";
import "../../../chunks/exports.js";
import "../../../chunks/utils.js";
import "@sveltejs/kit/internal/server";
import "../../../chunks/root.js";
import "../../../chunks/state.svelte.js";
import { o as onDestroy, t as tick } from "../../../chunks/index-server2.js";
import { B as Button } from "../../../chunks/button.js";
import { L as Label, C as Card, a as Card_content, I as Input } from "../../../chunks/label.js";
import { C as Card_header, a as Card_title, b as Card_description, c as Card_footer } from "../../../chunks/card-title.js";
import "clsx";
import { B as Badge } from "../../../chunks/badge.js";
import "../../../chunks/alert.js";
function CameraCapture($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let hasFace, singleFace, lightingOk, centeredOk, checks, allOk;
    let required = fallback($$props["required"], false);
    let label = fallback($$props["label"], "Foto de perfil");
    let videoEl;
    let stream = null;
    let permissionError = "";
    let detectorError = "";
    let running = false;
    let checksTimer = null;
    let faceCount = 0;
    let faceBox = null;
    let avgBrightness = null;
    let loadingDetector = false;
    let mpDetector = null;
    let mpInitTried = false;
    const MP_WASM_BASE = "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm";
    const MP_MODEL_URL = "https://storage.googleapis.com/mediapipe-models/face_detector/blaze_face_short_range/float16/1/blaze_face_short_range.tflite";
    async function ensureMediaPipeDetector() {
      if (mpDetector || mpInitTried) return mpDetector;
      mpInitTried = true;
      loadingDetector = true;
      detectorError = "";
      try {
        const { FaceDetector, FilesetResolver } = await import("@mediapipe/tasks-vision");
        const vision = await FilesetResolver.forVisionTasks(MP_WASM_BASE);
        mpDetector = await FaceDetector.createFromOptions(vision, {
          baseOptions: { modelAssetPath: MP_MODEL_URL },
          runningMode: "VIDEO"
        });
        return mpDetector;
      } catch (e) {
        detectorError = "No se pudo cargar la detección de rostro. Verifica tu conexión y recarga la página.";
        return null;
      } finally {
        loadingDetector = false;
      }
    }
    function cameraErrorMessage(e) {
      const name = e?.name ?? "";
      if (name === "NotAllowedError") {
        return "Permiso denegado. Habilita la cámara en tu navegador para continuar.";
      }
      if (name === "NotFoundError") {
        return "No se encontró ninguna cámara en este dispositivo.";
      }
      if (name === "NotReadableError" || name === "TrackStartError") {
        return "La cámara está en uso por otra aplicación. Ciérrala e inténtalo de nuevo.";
      }
      if (name === "OverconstrainedError") {
        return "No se pudo usar la cámara frontal. Prueba con otro dispositivo.";
      }
      if (e?.message?.includes("video") || name === "AbortError") {
        return "No se pudo iniciar la vista previa. Recarga la página e inténtalo de nuevo.";
      }
      return "No se pudo acceder a la cámara. Verifica permisos y dispositivo.";
    }
    function releaseStream() {
      if (stream) {
        stream.getTracks().forEach((t) => t.stop());
        stream = null;
      }
    }
    async function startCamera() {
      permissionError = "";
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" }, audio: false });
        running = true;
        await tick();
        if (!videoEl) {
          throw new Error("No se pudo iniciar la vista previa de la cámara.");
        }
        videoEl.srcObject = stream;
        await videoEl.play();
        void ensureMediaPipeDetector();
        checksTimer = setInterval(
          () => {
            void evaluateFrame();
          },
          500
        );
      } catch (e) {
        releaseStream();
        if (checksTimer) {
          clearInterval(checksTimer);
          checksTimer = null;
        }
        running = false;
        permissionError = cameraErrorMessage(e);
      }
    }
    function stopCamera() {
      if (checksTimer) {
        clearInterval(checksTimer);
        checksTimer = null;
      }
      releaseStream();
      running = false;
      faceCount = 0;
      faceBox = null;
      avgBrightness = null;
    }
    async function evaluateFrame() {
      return;
    }
    function inRange(v, min, max) {
      return v >= min && v <= max;
    }
    async function takePhoto() {
      return;
    }
    onDestroy(stopCamera);
    hasFace = faceCount >= 1;
    singleFace = faceCount === 1;
    lightingOk = avgBrightness != null ? avgBrightness >= 40 : false;
    centeredOk = (() => {
      if (!faceBox || true) return false;
      const cx = (faceBox.x + faceBox.w / 2) / videoEl.videoWidth;
      const cy = (faceBox.y + faceBox.h / 2) / videoEl.videoHeight;
      return inRange(cx, 0.2, 0.8) && inRange(cy, 0.2, 0.8);
    })();
    checks = [
      {
        key: "face",
        label: "Rostro detectado",
        ok: hasFace,
        bad: "No se detecta ningún rostro"
      },
      {
        key: "single",
        label: "Un solo rostro",
        ok: singleFace,
        bad: "Se detecta más de una persona"
      },
      {
        key: "light",
        label: "Iluminación adecuada",
        ok: lightingOk,
        bad: "Muy oscuro, mejora la iluminación"
      },
      {
        key: "center",
        label: "Rostro centrado",
        ok: centeredOk,
        bad: "Centra tu rostro en el encuadre"
      }
    ];
    allOk = running && checks.every((c) => c.ok) && !permissionError && !detectorError;
    $$renderer2.push(`<div class="rounded-xl border border-border bg-card p-4">`);
    Label($$renderer2, {
      class: "text-base font-semibold",
      children: ($$renderer3) => {
        $$renderer3.push(`<!---->${escape_html(label)}${escape_html(required ? " *" : "")}`);
      },
      $$slots: { default: true }
    });
    $$renderer2.push(`<!----> <p class="mt-1 text-sm text-muted-foreground">Se te pedirá permiso al activar la cámara.</p> `);
    if (permissionError) {
      $$renderer2.push("<!--[0-->");
      $$renderer2.push(`<p class="mt-2 text-sm font-medium text-destructive">✗ ${escape_html(permissionError)}</p>`);
    } else {
      $$renderer2.push("<!--[-1-->");
    }
    $$renderer2.push(`<!--]--> `);
    if (detectorError) {
      $$renderer2.push("<!--[0-->");
      $$renderer2.push(`<p class="mt-2 text-sm font-medium text-destructive">✗ ${escape_html(detectorError)}</p>`);
    } else {
      $$renderer2.push("<!--[-1-->");
    }
    $$renderer2.push(`<!--]--> `);
    if (running) {
      $$renderer2.push("<!--[0-->");
      $$renderer2.push(`<video class="mt-3 aspect-[4/3] w-full rounded-lg bg-zinc-900" muted="" playsinline=""></video>`);
    } else {
      $$renderer2.push("<!--[-1-->");
      $$renderer2.push(`<div class="mt-3 flex aspect-[4/3] w-full items-center justify-center rounded-lg bg-zinc-900/90" aria-hidden="true"><span class="rounded-full border border-white/20 bg-black/30 px-3 py-1.5 text-sm font-semibold text-white/90">Cámara apagada</span></div>`);
    }
    $$renderer2.push(`<!--]--> <ul class="mt-3 space-y-2 rounded-lg border border-border bg-muted/40 p-3" aria-live="polite"><!--[-->`);
    const each_array = ensure_array_like(checks);
    for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
      let c = each_array[$$index];
      $$renderer2.push(`<li${attr_class(`flex items-center gap-2 text-sm ${c.ok ? "text-emerald-700" : "text-destructive"}`)}><span${attr_class(`inline-flex size-[18px] shrink-0 items-center justify-center rounded-full text-xs font-bold text-white ${c.ok ? "bg-emerald-600" : "bg-destructive"}`)} aria-hidden="true">${escape_html(c.ok ? "✓" : "✗")}</span> <span>${escape_html(c.ok ? c.label : c.bad)}</span></li>`);
    }
    $$renderer2.push(`<!--]--></ul> <div class="mt-4 flex flex-wrap justify-end gap-2">`);
    if (running) {
      $$renderer2.push("<!--[0-->");
      Button($$renderer2, {
        variant: "secondary",
        type: "button",
        onclick: stopCamera,
        children: ($$renderer3) => {
          $$renderer3.push(`<!---->Apagar cámara`);
        },
        $$slots: { default: true }
      });
      $$renderer2.push(`<!----> `);
      Button($$renderer2, {
        type: "button",
        onclick: takePhoto,
        disabled: !allOk,
        children: ($$renderer3) => {
          $$renderer3.push(`<!---->Tomar foto`);
        },
        $$slots: { default: true }
      });
      $$renderer2.push(`<!---->`);
    } else {
      $$renderer2.push("<!--[-1-->");
      Button($$renderer2, {
        type: "button",
        onclick: startCamera,
        disabled: loadingDetector,
        children: ($$renderer3) => {
          $$renderer3.push(`<!---->${escape_html(loadingDetector ? "Cargando…" : "Activar cámara")}`);
        },
        $$slots: { default: true }
      });
    }
    $$renderer2.push(`<!--]--></div></div>`);
    bind_props($$props, { required, label });
  });
}
function _page($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let rules, isPasswordValid, showPasswordRules, isStudent, canSubmit;
    let fullName = "";
    let email = "";
    let password = "";
    let role = "STUDENT";
    function hasUpper(s) {
      return /[A-Z]/.test(s);
    }
    function hasLower(s) {
      return /[a-z]/.test(s);
    }
    function hasNumber(s) {
      return /[0-9]/.test(s);
    }
    function hasSpecial(s) {
      return /[!@#$%^&*()_+\-=\[\]{}|;':",.\/<>?]/.test(s);
    }
    rules = [
      {
        key: "len",
        label: "Mínimo 8 caracteres",
        ok: (password?.length ?? 0) >= 8
      },
      {
        key: "upper",
        label: "Al menos una mayúscula (A-Z)",
        ok: hasUpper(password)
      },
      {
        key: "lower",
        label: "Al menos una minúscula (a-z)",
        ok: hasLower(password)
      },
      {
        key: "num",
        label: "Al menos un número (0-9)",
        ok: hasNumber(password)
      },
      {
        key: "special",
        label: "Al menos un carácter especial",
        ok: hasSpecial(password)
      }
    ];
    isPasswordValid = rules.every((r) => r.ok);
    showPasswordRules = (password?.length ?? 0) > 0;
    isStudent = role === "STUDENT";
    canSubmit = isPasswordValid && (!isStudent || false);
    let $$settled = true;
    let $$inner_renderer;
    function $$render_inner($$renderer3) {
      head("52fghe", $$renderer3, ($$renderer4) => {
        $$renderer4.title(($$renderer5) => {
          $$renderer5.push(`<title>Registro | Procto</title>`);
        });
      });
      $$renderer3.push(`<div class="mx-auto w-full max-w-md">`);
      Card($$renderer3, {
        class: "rounded-xl border-border/80 shadow-sm",
        children: ($$renderer4) => {
          Card_header($$renderer4, {
            children: ($$renderer5) => {
              Card_title($$renderer5, {
                class: "text-xl",
                children: ($$renderer6) => {
                  $$renderer6.push(`<!---->Crear cuenta`);
                },
                $$slots: { default: true }
              });
              $$renderer5.push(`<!----> `);
              Card_description($$renderer5, {
                children: ($$renderer6) => {
                  $$renderer6.push(`<!---->Regístrate como estudiante o profesor`);
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
                for: "fullName",
                children: ($$renderer6) => {
                  $$renderer6.push(`<!---->Nombre completo`);
                },
                $$slots: { default: true }
              });
              $$renderer5.push(`<!----> `);
              Input($$renderer5, {
                id: "fullName",
                type: "text",
                required: true,
                get value() {
                  return fullName;
                },
                set value($$value) {
                  fullName = $$value;
                  $$settled = false;
                }
              });
              $$renderer5.push(`<!----></div> <div class="space-y-2">`);
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
                minlength: "8",
                required: true,
                get value() {
                  return password;
                },
                set value($$value) {
                  password = $$value;
                  $$settled = false;
                }
              });
              $$renderer5.push(`<!----></div> `);
              if (showPasswordRules) {
                $$renderer5.push("<!--[0-->");
                $$renderer5.push(`<ul class="space-y-2 rounded-lg border border-border bg-muted/40 p-3" aria-live="polite"><!--[-->`);
                const each_array = ensure_array_like(rules);
                for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
                  let r = each_array[$$index];
                  $$renderer5.push(`<li class="flex items-center gap-2 text-sm">`);
                  Badge($$renderer5, {
                    variant: r.ok ? "default" : "destructive",
                    class: "size-5 shrink-0 justify-center p-0 text-xs",
                    children: ($$renderer6) => {
                      $$renderer6.push(`<!---->${escape_html(r.ok ? "✓" : "✗")}`);
                    },
                    $$slots: { default: true }
                  });
                  $$renderer5.push(`<!----> <span${attr_class(clsx(r.ok ? "text-emerald-700" : "text-muted-foreground"))}>${escape_html(r.label)}</span></li>`);
                }
                $$renderer5.push(`<!--]--></ul>`);
              } else {
                $$renderer5.push("<!--[-1-->");
              }
              $$renderer5.push(`<!--]--> <div class="space-y-2">`);
              Label($$renderer5, {
                for: "role",
                children: ($$renderer6) => {
                  $$renderer6.push(`<!---->Rol`);
                },
                $$slots: { default: true }
              });
              $$renderer5.push(`<!----> `);
              $$renderer5.select(
                {
                  id: "role",
                  value: role,
                  class: "flex h-9 w-full rounded-lg border border-input bg-background px-3 py-1 text-sm shadow-xs focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
                },
                ($$renderer6) => {
                  $$renderer6.option({ value: "STUDENT" }, ($$renderer7) => {
                    $$renderer7.push(`Estudiante`);
                  });
                  $$renderer6.option({ value: "PROFESSOR" }, ($$renderer7) => {
                    $$renderer7.push(`Profesor`);
                  });
                }
              );
              $$renderer5.push(`</div> `);
              {
                $$renderer5.push("<!--[0-->");
                $$renderer5.push(`<div class="space-y-3 rounded-lg border border-border p-4" aria-label="Foto de referencia"><p class="text-sm text-muted-foreground">Tu foto se usará para verificar tu identidad durante los exámenes. Buena iluminación y rostro centrado.</p> `);
                CameraCapture($$renderer5, { required: true, label: "Foto de referencia" });
                $$renderer5.push(`<!----> `);
                {
                  $$renderer5.push("<!--[-1-->");
                }
                $$renderer5.push(`<!--]--></div>`);
              }
              $$renderer5.push(`<!--]--> `);
              {
                $$renderer5.push("<!--[-1-->");
              }
              $$renderer5.push(`<!--]--> `);
              Button($$renderer5, {
                type: "submit",
                class: "w-full",
                disabled: !canSubmit,
                children: ($$renderer6) => {
                  $$renderer6.push(`<!---->${escape_html("Crear cuenta")}`);
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
              $$renderer5.push(`<!---->¿Ya tienes cuenta? <a href="/login" class="font-medium text-primary hover:underline">Inicia sesión</a>`);
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
