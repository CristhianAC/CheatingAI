<script>
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { authStore } from '$lib/auth.js';
  import { createExam, listExams } from '$lib/exams-api.js';

  let loading = false;
  let saving = false;
  let error = '';
  let exams = [];
  let showCreate = false;

  let name = '';
  let description = '';
  let durationMinutes = '';
  let scheduledAt = '';

  async function loadExams() {
    loading = true;
    error = '';
    try {
      exams = await listExams();
    } catch (e) {
      error = e?.message ?? 'No se pudieron cargar los exámenes';
    } finally {
      loading = false;
    }
  }

  async function submitCreate() {
    saving = true;
    error = '';
    try {
      await createExam({
        name,
        description: description || null,
        duration_minutes: durationMinutes ? Number(durationMinutes) : null,
        scheduled_at: scheduledAt ? new Date(scheduledAt).toISOString() : null
      });
      name = '';
      description = '';
      durationMinutes = '';
      scheduledAt = '';
      showCreate = false;
      await loadExams();
    } catch (e) {
      error = e?.message ?? 'No se pudo crear el examen';
    } finally {
      saving = false;
    }
  }

  function fmtDate(value) {
    if (!value) return '—';
    return new Date(value).toLocaleString('es');
  }

  function openSessions(examId) {
    goto(`/exams/${examId}/sessions`);
  }

  onMount(async () => {
    if ($authStore?.role === 'PROFESSOR') {
      await loadExams();
    }
  });
</script>

<svelte:head>
  <title>Exámenes | Procto</title>
</svelte:head>

{#if $authStore?.role !== 'PROFESSOR'}
  <section class="card exams-page__restricted">
    <h1 class="card__title">Acceso restringido</h1>
    <p>Solo los profesores pueden gestionar exámenes.</p>
    <button class="btn btn--secondary" type="button" on:click={() => goto('/')}>Volver</button>
  </section>
{:else}
  <section class="card exams-page">
    <div class="exams-page__top">
      <h1 class="card__title">Gestión de exámenes</h1>
      <button class="btn btn--primary" type="button" on:click={() => (showCreate = !showCreate)}>
        {showCreate ? 'Cancelar' : 'Crear Examen'}
      </button>
    </div>

    {#if showCreate}
      <form class="exams-form" on:submit|preventDefault={submitCreate}>
        <label class="field">
          <span>Nombre</span>
          <input type="text" bind:value={name} required />
        </label>

        <label class="field">
          <span>Descripción</span>
          <textarea rows="3" bind:value={description}></textarea>
        </label>

        <label class="field">
          <span>Duración (min)</span>
          <input type="number" min="1" bind:value={durationMinutes} />
        </label>

        <label class="field">
          <span>Fecha programada</span>
          <input type="datetime-local" bind:value={scheduledAt} />
        </label>

        <div class="exams-form__actions">
          <button class="btn btn--primary" type="submit" disabled={saving}>
            {saving ? 'Creando...' : 'Guardar examen'}
          </button>
        </div>
      </form>
    {/if}

    {#if error}
      <p class="exams-error">{error}</p>
    {/if}

    {#if loading}
      <p>Cargando exámenes...</p>
    {:else if exams.length === 0}
      <p>No tienes exámenes creados todavía.</p>
    {:else}
      <div class="table-wrap">
        <table class="exams-table">
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Código</th>
              <th>Descripción</th>
              <th>Duración</th>
              <th>Fecha</th>
              <th>Supervisiones</th>
            </tr>
          </thead>
          <tbody>
            {#each exams as exam}
              <tr>
                <td>{exam.name}</td>
                <td><span class="code-badge">{exam.code}</span></td>
                <td>{exam.description ?? '—'}</td>
                <td>{exam.duration_minutes ? `${exam.duration_minutes} min` : '—'}</td>
                <td>{fmtDate(exam.scheduled_at)}</td>
                <td>
                  <button class="btn btn--ghost btn--sm" type="button" on:click={() => openSessions(exam.id)}>
                    Ver →
                  </button>
                </td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>
    {/if}
  </section>
{/if}

<style>
  .exams-page__top {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
    margin-bottom: 1rem;
  }
  .exams-form {
    border: 1px solid var(--procto-border);
    border-radius: var(--procto-radius-sm);
    padding: 1rem;
    margin-bottom: 1rem;
  }
  .exams-form__actions {
    margin-top: 0.75rem;
  }
  .table-wrap {
    overflow-x: auto;
  }
  .exams-table {
    width: 100%;
    border-collapse: collapse;
  }
  .exams-table th,
  .exams-table td {
    border-bottom: 1px solid var(--procto-border);
    text-align: left;
    padding: 0.65rem 0.5rem;
    font-size: 0.9rem;
  }
  .code-badge {
    display: inline-block;
    background: var(--procto-accent-muted);
    color: var(--procto-accent);
    border: 1px solid rgba(0, 113, 227, 0.25);
    border-radius: 999px;
    padding: 0.2rem 0.55rem;
    font-weight: 700;
    letter-spacing: 0.06em;
  }
  .exams-error {
    color: #b42318;
    margin: 0 0 0.75rem;
  }
  .exams-page__restricted p {
    margin-bottom: 0.75rem;
  }
</style>
