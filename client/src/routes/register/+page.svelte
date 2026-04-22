<script>
  import { goto } from '$app/navigation';
  import { register } from '$lib/auth.js';

  let fullName = '';
  let email = '';
  let password = '';
  let role = 'STUDENT';
  let loading = false;
  let error = '';

  async function onSubmit() {
    error = '';
    loading = true;
    try {
      await register(email, password, fullName, role);
      goto('/');
    } catch (e) {
      error = e?.message ?? 'No se pudo crear la cuenta';
    } finally {
      loading = false;
    }
  }
</script>

<svelte:head>
  <title>Registro | Procto</title>
</svelte:head>

<section class="card auth-card">
  <h1 class="card__title">Crear cuenta</h1>

  <form on:submit|preventDefault={onSubmit} class="auth-form">
    <label class="field">
      <span>Nombre completo</span>
      <input type="text" bind:value={fullName} required />
    </label>

    <label class="field">
      <span>Email</span>
      <input type="email" bind:value={email} required />
    </label>

    <label class="field">
      <span>Contraseña</span>
      <input type="password" bind:value={password} minlength="8" required />
    </label>

    <label class="field">
      <span>Rol</span>
      <select bind:value={role}>
        <option value="STUDENT">Estudiante</option>
        <option value="PROFESSOR">Profesor</option>
      </select>
    </label>

    {#if error}
      <p class="error">{error}</p>
    {/if}

    <button class="btn btn--primary" type="submit" disabled={loading}>
      {loading ? 'Creando...' : 'Crear cuenta'}
    </button>
  </form>
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
</style>
