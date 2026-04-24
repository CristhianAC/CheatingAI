<script>
  import { onMount } from 'svelte';
  import { get } from 'svelte/store';
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';
  import PageHeader from '$lib/components/PageHeader.svelte';
  import { authStore } from '$lib/auth.js';
  import { getSessionsByExam } from '$lib/proctoring-api.js';

  let loading = false;
  let error = '';
  let sessions = [];
  let examId = '';

  function statusValue(status) {
    return typeof status === 'string' ? status : status?.value ?? status;
  }

  function statusLabel(status) {
    const value = statusValue(status);
    return value === 'active' ? 'Activo' : 'Finalizado';
  }

  function openReport(sessionId) {
    goto(`/proctoring/report/${sessionId}`);
  }

  function goBack() {
    goto('/exams');
  }

  async function loadSessions() {
    loading = true;
    error = '';
    try {
      sessions = await getSessionsByExam(examId);
    } catch (e) {
      error = e?.message ?? 'No se pudieron cargar las supervisiones';
    } finally {
      loading = false;
    }
  }

  onMount(async () => {
    if ($authStore?.role !== 'PROFESSOR') {
      goto('/');
      return;
    }
    examId = get(page).params.examId;
    await loadSessions();
  });
</script>

<svelte:head>
  <title>Supervisiones del examen | Procto</title>
</svelte:head>

<section class="sessions-page">
  <PageHeader
    focus="Supervisión"
    title="Supervisiones del examen"
    subtitle={`Examen: ${examId || '—'}`}
  >
    <svelte:fragment slot="actions">
      <button class="btn btn--ghost btn--sm" type="button" on:click={goBack}>← Volver a Exámenes</button>
    </svelte:fragment>
  </PageHeader>

  <div class="card">
    {#if error}
      <p class="sessions-error">{error}</p>
    {/if}

    {#if loading}
      <p class="sessions-info">Cargando supervisiones...</p>
    {:else if sessions.length === 0}
      <p class="sessions-info">Aún no hay supervisiones para este examen.</p>
    {:else}
      <div class="table-wrap">
        <table class="sessions-table">
          <thead>
            <tr>
              <th>Participante (ID)</th>
              <th>Inicio</th>
              <th>Fin</th>
              <th>Estado</th>
            </tr>
          </thead>
          <tbody>
            {#each sessions as session}
              <tr>
                <td><span class="badge badge--student">{session.student_id}</span></td>
                <td>{new Date(session.started_at).toLocaleString('es')}</td>
                <td>{session.ended_at ? new Date(session.ended_at).toLocaleString('es') : '—'}</td>
                <td class="sessions-table__status">
                  {#if statusValue(session.status) === 'ended' || statusValue(session.status) === 'finalizado'}
                    <button class="status-pill status-pill--ended" type="button" on:click={() => openReport(session.id)}>
                      {statusLabel(session.status)}
                    </button>
                  {:else}
                    <span class="status-pill status-pill--active">Activo</span>
                  {/if}
                </td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>
    {/if}
  </div>
</section>

<style>
  .sessions-page {
    max-width: 1120px;
    margin: 0 auto;
  }

  .sessions-info {
    color: var(--procto-text-secondary);
    font-size: 0.92rem;
  }

  .sessions-error {
    color: #b42318;
    margin: 0 0 0.75rem;
    font-size: 0.9rem;
  }

  .table-wrap {
    overflow-x: auto;
  }

  .sessions-table {
    width: 100%;
    border-collapse: collapse;
  }

  .sessions-table th,
  .sessions-table td {
    border-bottom: 1px solid var(--procto-border);
    text-align: left;
    padding: 0.65rem 0.5rem;
    font-size: 0.9rem;
  }

  .sessions-table__status {
    text-align: right;
  }

  .badge {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: 0.15rem 0.55rem;
    border-radius: 999px;
    font-size: 0.78rem;
    font-weight: 600;
    white-space: nowrap;
  }

  .badge--student {
    background: #ecfdf3;
    color: #166534;
  }

  .status-pill {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-width: 92px;
    padding: 0.25rem 0.55rem;
    border-radius: 999px;
    font-size: 0.78rem;
    font-weight: 600;
  }

  .status-pill--active {
    background: #ecfdf3;
    color: #15803d;
  }

  .status-pill--ended {
    background: #fee2e2;
    color: #b91c1c;
    border: none;
    cursor: pointer;
  }

  .status-pill--ended:hover {
    background: #fecaca;
  }
</style>
