<script>
  import JobCard from '$lib/components/JobCard.svelte';
  import ResultsTable from '$lib/components/ResultsTable.svelte';
  import { listJobs, getJobStatus } from '$lib/api.js';
  import { showError } from '$lib/stores.js';
  import { onMount, onDestroy } from 'svelte';

  let jobs = [];
  let loading = false;
  let selectedJobId = null;
  let resultsRef;
  let pollInterval = null;

  async function loadJobs() {
    loading = true;
    try {
      jobs = await listJobs({ limit: 50 });
    } catch (e) {
      showError(e.message);
    } finally {
      loading = false;
    }
  }

  function selectJob(job) {
    if (job.status !== 'completed') return;
    selectedJobId = job.id;
  }

  // Polling automático si hay jobs en running/pending
  async function pollRunningJobs() {
    const running = jobs.filter(j => j.status === 'running' || j.status === 'pending');
    if (running.length === 0) return;

    for (const job of running) {
      try {
        const updated = await getJobStatus(job.id);
        const idx = jobs.findIndex(j => j.id === job.id);
        if (idx !== -1) {
          jobs[idx] = { ...jobs[idx], ...updated };
          jobs = [...jobs]; // trigger reactivity
        }
      } catch (_) {}
    }
  }

  onMount(async () => {
    await loadJobs();
    pollInterval = setInterval(pollRunningJobs, 3000);
  });

  onDestroy(() => { if (pollInterval) clearInterval(pollInterval); });

  $: hasRunning = jobs.some(j => j.status === 'running' || j.status === 'pending');
</script>

<svelte:head><title>Jobs — CheatingAI</title></svelte:head>

<div class="page-header">
  <div>
    <h1>📊 Jobs</h1>
    <p>Historial de análisis. Haz click en un job completado para ver los resultados.</p>
  </div>
  <button class="btn btn--secondary" on:click={loadJobs} disabled={loading}>
    {loading ? '⏳' : '🔄 Actualizar'}
  </button>
</div>

{#if hasRunning}
  <div class="alert-running card">
    ⚙️ Hay análisis en progreso. Actualizando automáticamente cada 3 segundos…
  </div>
{/if}

{#if jobs.length === 0 && !loading}
  <div class="card empty">
    No hay jobs todavía. Ve a <a href="/analysis">Analysis</a> para lanzar un análisis.
  </div>
{:else}
  <div class="jobs-layout">
    <!-- Lista de jobs -->
    <div class="jobs-list">
      {#each jobs as job (job.id)}
        <div on:click={() => selectJob(job)} on:keydown={(e) => e.key === 'Enter' && selectJob(job)} role="button" tabindex="0">
          <JobCard {job} selected={selectedJobId === job.id} />
        </div>
      {/each}
    </div>

    <!-- Panel de resultados -->
    <div class="results-panel">
      {#if selectedJobId}
        <div class="card">
          <h2 class="card__title">📋 Resultados</h2>
          <ResultsTable bind:this={resultsRef} jobId={selectedJobId} />
        </div>
      {:else}
        <div class="card select-hint">
          <p>👆 Selecciona un job completado de la lista para ver sus resultados.</p>
        </div>
      {/if}
    </div>
  </div>
{/if}

<style>
  .page-header {
    display: flex; justify-content: space-between;
    align-items: flex-start; margin-bottom: 1.5rem;
  }
  .page-header h1 { font-size: 1.6rem; font-weight: 800; margin-bottom: 0.25rem; }
  .page-header p  { color: #6b7280; font-size: 0.9rem; }

  .alert-running {
    background: #eff6ff; border: 1.5px solid #bfdbfe;
    color: #1e40af; margin-bottom: 1.5rem;
    padding: 0.75rem 1rem;
  }

  .empty { text-align: center; padding: 3rem; color: #9ca3af; }
  .empty a { color: #6366f1; font-weight: 600; }

  .jobs-layout {
    display: grid;
    grid-template-columns: 380px 1fr;
    gap: 1.5rem;
    align-items: start;
  }

  .jobs-list { display: flex; flex-direction: column; gap: 0.75rem; }

  .select-hint {
    text-align: center; padding: 3rem 1.5rem;
    color: #9ca3af;
  }

  @media (max-width: 900px) {
    .jobs-layout { grid-template-columns: 1fr; }
  }
</style>
