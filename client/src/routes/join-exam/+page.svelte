<script>
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { get } from 'svelte/store';
  import PageHeader from '$lib/components/PageHeader.svelte';
  import { verifyExamCode } from '$lib/exams-api.js';
  import { authStore } from '$lib/auth.js';
  import { examStore } from '$lib/exam-store.js';

  let code = '';
  let loading = false;
  let invalidMessage = '';
  let notFoundMessage = '';
  let finishedMessage = '';
  let networkMessage = '';
  let successMessage = '';
  let foundExam = null;

  function normalizeCode(value) {
    return value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6);
  }

  function handleCodeInput(event) {
    code = normalizeCode(event.currentTarget.value);
    invalidMessage = '';
    notFoundMessage = '';
    finishedMessage = '';
    networkMessage = '';
    successMessage = '';
    foundExam = null;
  }

  async function handleVerify() {
    const normalized = normalizeCode(code);
    if (normalized.length !== 6) {
      invalidMessage = 'Ingresa un código válido de 6 caracteres.';
      return;
    }

    loading = true;
    invalidMessage = '';
    notFoundMessage = '';
    finishedMessage = '';
    networkMessage = '';
    successMessage = '';
    foundExam = null;

    try {
      const exam = await verifyExamCode(normalized);
      foundExam = exam;
      examStore.set({
        id: exam.id,
        name: exam.name,
        ends_at: exam.ends_at ?? null,
        code: exam.code,
        expired_at: null,
      });
      successMessage = `✓ Examen encontrado: ${exam.name}`;
    } catch (e) {
      const msg = e?.message ?? '';
      if (msg.includes('CODE_NOT_FOUND')) {
        notFoundMessage = 'Código no encontrado. Verifica el código con tu profesor.';
        code = '';
      } else if (msg.includes('EXAM_FINISHED')) {
        finishedMessage = 'Este examen ya finalizó.';
        code = '';
      } else {
        networkMessage = 'Error de conexión. Verifica que el servidor esté activo.';
      }
    } finally {
      loading = false;
    }
  }

  function startProctoring() {
    if (!foundExam) return;
    goto('/proctoring');
  }

  onMount(() => {
    const auth = get(authStore);
    if (!auth?.token) {
      goto('/login');
      return;
    }
    if (auth.role === 'PROFESSOR') {
      goto('/exams');
    }
  });
</script>

<svelte:head>
  <title>Unirse a examen | Procto</title>
</svelte:head>

<div class="join-page">
  <PageHeader
    focus="Supervisión"
    title="Unirse a un examen"
    subtitle="Ingresa el código del examen para validar tu acceso antes de iniciar la supervisión."
  />

  <section class="card join-card">
    <div class="field">
      <label for="examCode">Código de examen</label>
      <input
        id="examCode"
        class="join-card__input"
        type="text"
        value={code}
        on:input={handleCodeInput}
        maxlength="6"
        placeholder="ABC123"
        autocomplete="off"
      />
    </div>

    <button class="btn btn--primary" type="button" on:click={handleVerify} disabled={loading}>
      {#if loading}
        Verificando...
      {:else}
        Verificar código
      {/if}
    </button>

    {#if invalidMessage}
      <p class="join-card__feedback join-card__feedback--error">⚠ {invalidMessage}</p>
    {/if}

    {#if notFoundMessage}
      <p class="join-card__feedback join-card__feedback--error">🔎 {notFoundMessage}</p>
    {/if}

    {#if finishedMessage}
      <p class="join-card__feedback join-card__feedback--finished">⏱ {finishedMessage}</p>
    {/if}

    {#if networkMessage}
      <p class="join-card__feedback join-card__feedback--error">✗ {networkMessage}</p>
    {/if}

    {#if successMessage}
      <p class="join-card__feedback join-card__feedback--success">{successMessage}</p>
    {/if}

    {#if foundExam}
      <button class="btn btn--secondary" type="button" on:click={startProctoring}>
        Iniciar supervisión
      </button>
    {/if}
  </section>
</div>

<style>
  .join-page {
    max-width: 760px;
    margin: 0 auto;
  }

  .join-card {
    display: flex;
    flex-direction: column;
    gap: 0.85rem;
    max-width: 520px;
  }

  .join-card__input {
    text-transform: uppercase;
    letter-spacing: 0.08em;
    font-weight: 600;
  }

  .join-card__feedback {
    margin: 0;
    font-size: 0.9rem;
    font-weight: 500;
  }

  .join-card__feedback--error {
    color: #b91c1c;
  }

  .join-card__feedback--success {
    color: #15803d;
  }

  .join-card__feedback--finished {
    color: #92400e;
  }
</style>
