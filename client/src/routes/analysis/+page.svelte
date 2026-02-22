<script>
  import PairwiseForm from '$lib/components/PairwiseForm.svelte';
  import BatchForm from '$lib/components/BatchForm.svelte';
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
      showError('No se pudieron cargar las submissions: ' + e.message);
    }
  });

  function goToJobs() {
    goto('/jobs');
  }
</script>

<svelte:head><title>Analysis — CheatingAI</title></svelte:head>

<div class="page-header">
  <h1>🔍 Analysis</h1>
  <p>Lanza comparaciones de plagio entre submissions. El análisis par a par es inmediato; el batch se procesa en background.</p>
</div>

{#if $submissions.length === 0}
  <div class="alert-info card">
    ℹ️ No hay submissions cargadas. Ve a <a href="/submissions">Submissions</a> para crear algunas primero.
  </div>
{/if}

<div class="analysis-grid">
  <PairwiseForm />
  <BatchForm on:completed={goToJobs} on:goToJobs={goToJobs} />
</div>

<style>
  .page-header { margin-bottom: 1.5rem; }
  .page-header h1 { font-size: 1.6rem; font-weight: 800; margin-bottom: 0.25rem; }
  .page-header p  { color: #6b7280; font-size: 0.9rem; }

  .alert-info { color: #1e40af; background: #eff6ff; border: 1.5px solid #bfdbfe; }
  .alert-info a { color: #6366f1; font-weight: 600; }

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
