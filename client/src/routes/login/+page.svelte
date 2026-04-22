<script>
  import { goto } from '$app/navigation';
  import { login } from '$lib/auth.js';

  let email = '';
  let password = '';
  let loading = false;
  let error = '';

  async function onSubmit() {
    error = '';
    loading = true;
    try {
      await login(email, password);
      goto('/');
    } catch (e) {
      error = e?.message ?? 'No se pudo iniciar sesión';
    } finally {
      loading = false;
    }
  }
</script>

<svelte:head>
  <title>Iniciar sesión | Procto</title>
</svelte:head>

<section class="card auth-card">
  <h1 class="card__title">Iniciar sesión</h1>

  <form on:submit|preventDefault={onSubmit} class="auth-form">
    <label class="field">
      <span>Email</span>
      <input type="email" bind:value={email} required />
    </label>

    <label class="field">
      <span>Contraseña</span>
      <input type="password" bind:value={password} required />
    </label>

    {#if error}
      <p class="error">{error}</p>
    {/if}

    <button class="btn btn--primary" type="submit" disabled={loading}>
      {loading ? 'Ingresando...' : 'Iniciar sesión'}
    </button>
  </form>

  <p class="auth-link">
    ¿No tienes cuenta? <a href="/register">Regístrate</a>
  </p>
</section>

<style>
  .auth-card {
    max-width: 460px;
    margin: 2rem auto;
  }
  .auth-form {
    display: flex;
    flex-direction: column;
    gap: 0.85rem;
  }
  .error {
    color: #b42318;
    font-size: 0.9rem;
  }
  .auth-link {
    margin-top: 0.9rem;
    font-size: 0.9rem;
    color: var(--procto-text-secondary);
  }
</style>
