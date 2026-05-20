<script>
  import JobCard from '$lib/components/JobCard.svelte';
  import ResultsTable from '$lib/components/ResultsTable.svelte';
  import PageHeader from '$lib/components/PageHeader.svelte';
  import { Button } from '$lib/components/ui/button';
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

  async function pollRunningJobs() {
    const running = jobs.filter((j) => j.status === 'running' || j.status === 'pending');
    if (running.length === 0) return;

    for (const job of running) {
      try {
        const updated = await getJobStatus(job.id);
        const idx = jobs.findIndex((j) => j.id === job.id);
        if (idx !== -1) {
          jobs[idx] = { ...jobs[idx], ...updated };
          jobs = [...jobs];
        }
      } catch (_) {}
    }
  }

  onMount(async () => {
    await loadJobs();
    pollInterval = setInterval(pollRunningJobs, 3000);
  });

  onDestroy(() => {
    if (pollInterval) clearInterval(pollInterval);
  });

  $: hasRunning = jobs.some((j) => j.status === 'running' || j.status === 'pending');
</script>

<svelte:head><title>Trabajos en cola | Procto</title></svelte:head>

<PageHeader
  focus="Procesamiento"
  title="Trabajos en cola"
  subtitle="Historial de análisis por lotes. Elige un trabajo finalizado para ver el detalle de resultados."
>
  <svelte:fragment slot="actions">
    <Button variant="outline" size="sm" onclick={loadJobs} disabled={loading}>
      {loading ? 'Cargando…' : 'Actualizar'}
    </Button>
  </svelte:fragment>
</PageHeader>

{#if hasRunning}
  <div class="mb-6 rounded-xl border border-primary/20 bg-primary/5 p-4 text-sm">
    Hay análisis en progreso. Esta vista se actualiza sola cada pocos segundos.
  </div>
{/if}

{#if jobs.length === 0 && !loading}
  <div class="rounded-xl border border-border bg-card p-12 text-center text-muted-foreground">
    No hay trabajos todavía. Ve a <a href="/analysis" class="font-semibold text-primary hover:underline">Análisis</a> para lanzar uno.
  </div>
{:else}
  <div class="jobs-layout grid gap-6 lg:grid-cols-[380px_1fr]">
    <div class="jobs-list">
      {#each jobs as job (job.id)}
        <div
          on:click={() => selectJob(job)}
          on:keydown={(e) => e.key === 'Enter' && selectJob(job)}
          role="button"
          tabindex="0"
        >
          <JobCard {job} selected={selectedJobId === job.id} />
        </div>
      {/each}
    </div>

    <div class="results-panel">
      {#if selectedJobId}
        <div class="rounded-xl border border-border bg-card p-6 shadow-sm">
          <h2 class="mb-4 text-lg font-semibold">Resultados</h2>
          <ResultsTable bind:this={resultsRef} jobId={selectedJobId} />
        </div>
      {:else}
        <div class="rounded-xl border border-dashed border-border bg-muted/20 p-12 text-center text-sm text-muted-foreground">
          <p>Selecciona un trabajo completado en la lista para ver sus resultados.</p>
        </div>
      {/if}
    </div>
  </div>
{/if}

<style>
  .alert-running {
    background: #eff6ff;
    border: 1px solid #bfdbfe;
    color: #1e40af;
    margin-bottom: 1.5rem;
    padding: 0.75rem 1rem;
    font-size: 0.9rem;
  }

  .empty {
    text-align: center;
    padding: 3rem;
    color: #9ca3af;
  }
  .empty a {
    color: var(--procto-accent, #0071e3);
    font-weight: 600;
  }

  .jobs-layout {
    display: grid;
    grid-template-columns: 380px 1fr;
    gap: 1.5rem;
    align-items: start;
  }

  .jobs-list {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  .select-hint {
    text-align: center;
    padding: 3rem 1.5rem;
    color: #9ca3af;
    font-size: 0.9rem;
  }

  @media (max-width: 900px) {
    .jobs-layout {
      grid-template-columns: 1fr;
    }
  }
</style>
