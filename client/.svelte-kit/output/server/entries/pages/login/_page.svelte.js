import { c as create_ssr_component, d as add_attribute, e as escape } from "../../../chunks/ssr.js";
import "@sveltejs/kit/internal";
import "../../../chunks/exports.js";
import "../../../chunks/utils.js";
import "@sveltejs/kit/internal/server";
import "../../../chunks/state.svelte.js";
const css = {
  code: ".auth-card.svelte-atffv9{max-width:460px;margin:2rem auto}.auth-form.svelte-atffv9{display:flex;flex-direction:column;gap:0.85rem}.error.svelte-atffv9{color:#b42318;font-size:0.9rem}.auth-link.svelte-atffv9{margin-top:0.9rem;font-size:0.9rem;color:var(--procto-text-secondary)}",
  map: `{"version":3,"file":"+page.svelte","sources":["+page.svelte"],"sourcesContent":["<script>\\n  import { goto } from '$app/navigation';\\n  import { login } from '$lib/auth.js';\\n\\n  let email = '';\\n  let password = '';\\n  let loading = false;\\n  let error = '';\\n\\n  async function onSubmit() {\\n    error = '';\\n    loading = true;\\n    try {\\n      await login(email, password);\\n      goto('/');\\n    } catch (e) {\\n      error = e?.message ?? 'No se pudo iniciar sesión';\\n    } finally {\\n      loading = false;\\n    }\\n  }\\n<\/script>\\n\\n<svelte:head>\\n  <title>Iniciar sesión | Procto</title>\\n</svelte:head>\\n\\n<section class=\\"card auth-card\\">\\n  <h1 class=\\"card__title\\">Iniciar sesión</h1>\\n\\n  <form on:submit|preventDefault={onSubmit} class=\\"auth-form\\">\\n    <label class=\\"field\\">\\n      <span>Email</span>\\n      <input type=\\"email\\" bind:value={email} required />\\n    </label>\\n\\n    <label class=\\"field\\">\\n      <span>Contraseña</span>\\n      <input type=\\"password\\" bind:value={password} required />\\n    </label>\\n\\n    {#if error}\\n      <p class=\\"error\\">{error}</p>\\n    {/if}\\n\\n    <button class=\\"btn btn--primary\\" type=\\"submit\\" disabled={loading}>\\n      {loading ? 'Ingresando...' : 'Iniciar sesión'}\\n    </button>\\n  </form>\\n\\n  <p class=\\"auth-link\\">\\n    ¿No tienes cuenta? <a href=\\"/register\\">Regístrate</a>\\n  </p>\\n</section>\\n\\n<style>\\n  .auth-card {\\n    max-width: 460px;\\n    margin: 2rem auto;\\n  }\\n  .auth-form {\\n    display: flex;\\n    flex-direction: column;\\n    gap: 0.85rem;\\n  }\\n  .error {\\n    color: #b42318;\\n    font-size: 0.9rem;\\n  }\\n  .auth-link {\\n    margin-top: 0.9rem;\\n    font-size: 0.9rem;\\n    color: var(--procto-text-secondary);\\n  }\\n</style>\\n"],"names":[],"mappings":"AAwDE,wBAAW,CACT,SAAS,CAAE,KAAK,CAChB,MAAM,CAAE,IAAI,CAAC,IACf,CACA,wBAAW,CACT,OAAO,CAAE,IAAI,CACb,cAAc,CAAE,MAAM,CACtB,GAAG,CAAE,OACP,CACA,oBAAO,CACL,KAAK,CAAE,OAAO,CACd,SAAS,CAAE,MACb,CACA,wBAAW,CACT,UAAU,CAAE,MAAM,CAClB,SAAS,CAAE,MAAM,CACjB,KAAK,CAAE,IAAI,uBAAuB,CACpC"}`
};
const Page = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let email = "";
  let password = "";
  $$result.css.add(css);
  return `${$$result.head += `<!-- HEAD_svelte-1f8jizq_START -->${$$result.title = `<title>Iniciar sesión | Procto</title>`, ""}<!-- HEAD_svelte-1f8jizq_END -->`, ""} <section class="card auth-card svelte-atffv9"><h1 class="card__title" data-svelte-h="svelte-1dgy8qv">Iniciar sesión</h1> <form class="auth-form svelte-atffv9"><label class="field"><span data-svelte-h="svelte-1bg9cgq">Email</span> <input type="email" required${add_attribute("value", email, 0)}></label> <label class="field"><span data-svelte-h="svelte-17ch52x">Contraseña</span> <input type="password" required${add_attribute("value", password, 0)}></label> ${``} <button class="btn btn--primary" type="submit" ${""}>${escape("Iniciar sesión")}</button></form> <p class="auth-link svelte-atffv9" data-svelte-h="svelte-xjq8vw">¿No tienes cuenta? <a href="/register">Regístrate</a></p> </section>`;
});
export {
  Page as default
};
