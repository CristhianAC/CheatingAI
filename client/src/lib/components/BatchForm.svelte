<script>
  import { createEventDispatcher } from 'svelte';
  import { batchAnalysis, getJobStatus } from '$lib/api.js';
  import { activeJob, showToast, showError } from '$lib/stores.js';
  import ProgressBar from './ProgressBar.svelte';

  const dispatch = createEventDispatcher();

  let mode = 'problem_id'; // 'problem_id' | 'exam_id'
  let scopeValue = '';
  let threshold = 0.7;
  let loading = false;
  let jobId = null;
  let jobData = null;
  let pollInterval = null;

  function stopPolling() {
    if (pollInterval) { clearInterval(pollInterval); pollInterval = null; }
    activeJob.set(null);
  }

  async function startPolling(id) {
    jobId = id;
    activeJob.set(id);

    pollInterval = setInterval(async () => {
      try {
        jobData = await getJobStatus(id);
        if (jobData.status === 'completed') {
          stopPolling();
          showToast('¡Análisis batch completado!');
          dispatch('completed', jobId);
        } else if (jobData.status === 'failed') {
          stopPolling();
          showError('El análisis falló: ' + (jobData.message || 'error desconocido'));
        }
      } catch (e) {
        stopPolling();
        showError(e.message);
      }
    }, 2000);
  }

  async function handleSubmit() {
    if (!scopeValue.trim()) {
      showError(`Ingresa un ${mode === 'problem_id' ? 'Problem ID' : 'Exam ID'}.`);
      return;
    }
    loading = true;
    jobData = null;
    try {
      const payload = { threshold };
      payload[mode] = scopeValue.trim();
      const job = await batchAnalysis(payload);
      jobData = { ...job, progress_percent: 0, message: 'Tarea encolada...' };
      loading = false;
      showToast('Análisis batch encolado', 'info');
      await startPolling(job.id);
    } catch (e) {
      showError(e.message);
      loading = false;
    }
  }

  import { onDestroy } from 'svelte';
  onDestroy(stopPolling);
</script>

<div class="rounded-xl border border-border bg-card p-6 shadow-sm">
  <h2 class="card__title">📊 Análisis Batch <span class="badge-async">Asíncrono</span></h2>
  <p class="card__desc">Compara todas las submissions de un problema o examen. Se ejecuta en background.</p>

  <form on:submit|preventDefault={handleSubmit}>
    <div class="scope-tabs">
      <button
        type="button"
        class="scope-tab"
        class:active={mode === 'problem_id'}
        on:click={() => { mode = 'problem_id'; scopeValue = ''; }}
      >Por Problema</button>
      <button
        type="button"
        class="scope-tab"
        class:active={mode === 'exam_id'}
        on:click={() => { mode = 'exam_id'; scopeValue = ''; }}
      >Por Examen</button>
    </div>

    <div class="field">
      <label for="scope">
        {mode === 'problem_id' ? 'Problem ID' : 'Exam ID'} *
      </label>
      <input
        id="scope"
        bind:value={scopeValue}
        placeholder={mode === 'problem_id' ? 'prob-fibonacci' : 'parcial-1'}
        required
      />
    </div>

    <div class="field">
      <label for="batchThreshold">
        Umbral de alerta: <strong>{(threshold * 100).toFixed(0)}%</strong>
      </label>
      <input
        id="batchThreshold"
        type="range" min="0" max="1" step="0.05"
        bind:value={threshold}
        class="slider"
      />
      <div class="slider-labels"><span>0%</span><span>50%</span><span>100%</span></div>
    </div>

    <button
      class="btn btn--primary"
      type="submit"
      disabled={loading || (jobData && jobData.status === 'running')}
    >
      {loading ? '⏳ Encolando...' : '🚀 Lanzar análisis batch'}
    </button>
  </form>

  <!-- Progreso -->
  {#if jobData}
    <div class="job-progress">
      <div class="job-id">
        Job ID: <code>{jobData.id?.slice(0,8)}…</code>
      </div>
      <ProgressBar
        percent={jobData.progress_percent ?? 0}
        message={jobData.message ?? ''}
        status={jobData.status ?? 'pending'}
      />
      {#if jobData.status === 'completed'}
        <div class="completed-action">
          <p>✅ {jobData.total_comparisons} comparaciones realizadas.</p>
          <button
            class="btn btn--secondary btn--sm"
            on:click={() => dispatch('goToJobs')}
          >
            Ver resultados en Jobs →
          </button>
        </div>
      {/if}
    </div>
  {/if}
</div>

<style>
  .badge-async {
    font-size: 0.7rem; background: #dbeafe; color: #1e40af;
    padding: 0.15rem 0.5rem; border-radius: 999px; vertical-align: middle;
  }
  .card__desc { color: #6b7280; font-size: 0.88rem; margin-bottom: 1rem; }

  .scope-tabs { display: flex; gap: 0; margin-bottom: 1rem; border-radius: 8px; overflow: hidden; border: 1px solid #e5e7eb; width: fit-content; }
  .scope-tab {
    padding: 0.4rem 1rem; font-size: 0.85rem; cursor: pointer;
    background: #f9fafb; border: none; color: #6b7280; font-weight: 500;
    transition: background 0.15s;
  }
  .scope-tab.active { background: var(--procto-accent, #0071e3); color: #fff; }

  .slider { width: 100%; accent-color: var(--procto-accent, #0071e3); }
  .slider-labels { display: flex; justify-content: space-between; font-size: 0.75rem; color: #9ca3af; }

  .job-progress { margin-top: 1.25rem; padding: 1rem; background: #f9fafb; border-radius: 10px; }
  .job-id { font-size: 0.8rem; color: #9ca3af; margin-bottom: 0.5rem; }
  .job-id code { font-family: monospace; }

  .completed-action { margin-top: 0.75rem; }
  .completed-action p { font-size: 0.88rem; color: #065f46; margin-bottom: 0.5rem; }
</style>
