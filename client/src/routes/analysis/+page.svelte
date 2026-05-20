<script>
  import PairwiseForm from '$lib/components/PairwiseForm.svelte';
  import BatchForm from '$lib/components/BatchForm.svelte';
  import PageHeader from '$lib/components/PageHeader.svelte';
  import { submissions } from '$lib/stores.js';
  import { listSubmissions } from '$lib/api.js';
  import { showError } from '$lib/stores.js';
  import { goto } from '$app/navigation';
  import { onMount } from 'svelte';

  onMount(async () => {
    try {
      const res = await listSubmissions({ limit: 200 });
      submissions.set(res.items);
    } catch (e) {
      showError('No se pudieron cargar las entregas: ' + e.message);
    }
  });

  function goToJobs() {
    goto('/jobs');
  }
</script>

<svelte:head><title>Análisis de similitud | Procto</title></svelte:head>

<PageHeader
  focus="Análisis"
  title="Análisis de similitud"
  subtitle="Compara entregas para detectar similitud. El análisis entre dos entregas es inmediato; el análisis por lote se procesa en segundo plano."
/>

{#if $submissions.length === 0}
  <div class="mb-6 rounded-xl border border-primary/20 bg-primary/5 p-4 text-sm text-foreground">
    No hay entregas cargadas. Ve a <a href="/submissions" class="font-semibold text-primary hover:underline">Entregas</a> para crear algunas primero.
  </div>
{/if}

<div class="analysis-grid grid gap-6 lg:grid-cols-2">
  <PairwiseForm />
  <BatchForm on:completed={goToJobs} on:goToJobs={goToJobs} />
</div>

<style>
  .alert-info { color: #1e40af; background: #eff6ff; border: 1px solid #bfdbfe; }
  .alert-info a { color: var(--procto-accent, #0071e3); font-weight: 600; }

  .analysis-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 1.5rem;
    align-items: start;
  }

  @media (max-width: 768px) {
    .analysis-grid { grid-template-columns: 1fr; }
  }
</style>
