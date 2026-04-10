<script>
  import { getJobResults } from '$lib/api.js';
  import { showError, scoreColor, scoreLabel } from '$lib/stores.js';

  export let jobId;

  let flaggedOnly = false;
  let minScore = 0;
  let skip = 0;
  const limit = 20;

  let data = null;
  let loading = false;

  export async function load() {
    loading = true;
    try {
      data = await getJobResults(jobId, {
        flagged_only: flaggedOnly,
        min_score: minScore,
        skip,
        limit
      });
    } catch (e) {
      showError(e.message);
    } finally {
      loading = false;
    }
  }

  function prevPage() { skip = Math.max(0, skip - limit); load(); }
  function nextPage() { skip += limit; load(); }

  $: hasNext = data ? (skip + limit) < data.total_comparisons : false;
  $: hasPrev = skip > 0;

  import { onMount } from 'svelte';
  onMount(load);
</script>

<div class="results-wrap">
  <!-- Header con resumen -->
  {#if data}
    <div class="results-header">
      <div class="results-stats">
        <div class="stat">
          <span class="stat-num">{data.total_comparisons}</span>
          <span class="stat-label">comparaciones</span>
        </div>
        <div class="stat stat--red">
          <span class="stat-num">{data.flagged_count}</span>
          <span class="stat-label">sospechosos</span>
        </div>
        <div class="stat">
          <span class="stat-num">{(data.threshold_used * 100).toFixed(0)}%</span>
          <span class="stat-label">umbral</span>
        </div>
      </div>
    </div>
  {/if}

  <!-- Filtros -->
  <div class="filters">
    <label class="toggle">
      <input type="checkbox" bind:checked={flaggedOnly} on:change={() => { skip=0; load(); }} />
      <span>Solo sospechosos 🚨</span>
    </label>
    <div class="score-filter">
      <span>Score mínimo: <strong>{(minScore * 100).toFixed(0)}%</strong></span>
      <input
        type="range" min="0" max="1" step="0.05"
        bind:value={minScore}
        on:change={() => { skip=0; load(); }}
        class="slider"
      />
    </div>
  </div>

  {#if loading}
    <div class="loading">⏳ Cargando resultados…</div>
  {:else if data && data.results.length === 0}
    <div class="empty">No hay resultados con los filtros actuales.</div>
  {:else if data}
    <div class="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Estudiante A</th>
            <th>Estudiante B</th>
            <th>Similitud</th>
            <th>Estado</th>
            <th>Detalles</th>
          </tr>
        </thead>
        <tbody>
          {#each data.results as r (r.id)}
            {@const color = scoreColor(r.similarity_score, r.is_exact_copy)}
            {@const pct   = Math.round(r.similarity_score * 100)}
            <tr class:flagged={r.is_flagged}>
              <td class="mono">{r.submission_a_id.slice(0,8)}…</td>
              <td class="mono">{r.submission_b_id.slice(0,8)}…</td>
              <td>
                <div class="score-bar-wrap">
                  <div class="score-bar score-bar--{color}" style="width:{pct}%"></div>
                  <span class="score-text score-text--{color}">{pct}%</span>
                </div>
              </td>
              <td>
                <div class="badges">
                  {#if r.is_exact_copy}
                    <span class="badge badge--exact">🟣 Exacta</span>
                  {/if}
                  {#if r.is_flagged}
                    <span class="badge badge--flagged">🚨 Flagged</span>
                  {:else}
                    <span class="badge badge--ok">✅ OK</span>
                  {/if}
                </div>
              </td>
              <td>
                {#if r.algorithm_details}
                  <span class="algo-mini" title="Fingerprints comunes / total A">
                    {r.algorithm_details.common_fingerprints}/{r.algorithm_details.fingerprints_a}
                  </span>
                {:else}
                  <span class="algo-mini">—</span>
                {/if}
              </td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>

    <!-- Paginación -->
    {#if hasPrev || hasNext}
      <div class="pagination">
        <button class="btn btn--ghost btn--sm" on:click={prevPage} disabled={!hasPrev}>← Anterior</button>
        <span class="page-info">{skip + 1}–{Math.min(skip + limit, data.total_comparisons)} de {data.total_comparisons}</span>
        <button class="btn btn--ghost btn--sm" on:click={nextPage} disabled={!hasNext}>Siguiente →</button>
      </div>
    {/if}
  {/if}
</div>

<style>
  .results-header { margin-bottom: 1rem; }
  .results-stats { display: flex; gap: 1rem; }
  .stat {
    text-align: center; padding: 0.6rem 1.2rem;
    background: #f9fafb; border-radius: 8px; border: 1px solid #e5e7eb;
  }
  .stat--red { border-color: #fca5a5; background: #fef2f2; }
  .stat-num { display: block; font-size: 1.4rem; font-weight: 800; color: #1f2937; }
  .stat--red .stat-num { color: #dc2626; }
  .stat-label { font-size: 0.75rem; color: #6b7280; }

  .filters {
    display: flex; gap: 1.5rem; align-items: center;
    flex-wrap: wrap; margin-bottom: 1rem;
    padding: 0.75rem; background: #f9fafb; border-radius: 8px;
  }
  .toggle { display: flex; align-items: center; gap: 0.4rem; cursor: pointer; font-size: 0.88rem; }
  .score-filter { display: flex; flex-direction: column; gap: 0.2rem; font-size: 0.85rem; }
  .score-filter .slider { width: 180px; accent-color: var(--procto-accent, #0071e3); }

  .table-wrap { overflow-x: auto; }
  table { width: 100%; border-collapse: collapse; font-size: 0.86rem; }
  th { background: #f3f4f6; text-align: left; padding: 0.6rem 0.8rem; font-weight: 600; color: #374151; }
  td { padding: 0.55rem 0.8rem; border-bottom: 1px solid #f3f4f6; vertical-align: middle; }
  tr.flagged { background: #fff5f5; }
  .mono { font-family: monospace; font-size: 0.8rem; color: #6b7280; }

  /* Barra de score */
  .score-bar-wrap {
    position: relative; height: 22px;
    background: #f3f4f6; border-radius: 999px; overflow: hidden;
    min-width: 100px;
  }
  .score-bar {
    position: absolute; left: 0; top: 0; height: 100%;
    border-radius: 999px; transition: width 0.3s;
  }
  .score-bar--low    { background: #10b981; }
  .score-bar--medium { background: #f59e0b; }
  .score-bar--high   { background: #ef4444; }
  .score-bar--exact  { background: #8b5cf6; }

  .score-text {
    position: absolute; right: 6px; top: 50%; transform: translateY(-50%);
    font-size: 0.75rem; font-weight: 700;
  }
  .score-text--low    { color: #065f46; }
  .score-text--medium { color: #713f12; }
  .score-text--high   { color: #991b1b; }
  .score-text--exact  { color: #5b21b6; }

  .badges { display: flex; gap: 0.3rem; flex-wrap: wrap; }
  .badge { padding: 0.15rem 0.45rem; border-radius: 999px; font-size: 0.72rem; font-weight: 600; }
  .badge--flagged { background: #fee2e2; color: #991b1b; }
  .badge--ok      { background: #d1fae5; color: #065f46; }
  .badge--exact   { background: #ede9fe; color: #5b21b6; }

  .algo-mini { font-size: 0.78rem; color: #9ca3af; font-family: monospace; }

  .loading, .empty { text-align: center; padding: 2rem; color: #9ca3af; }

  .pagination {
    display: flex; justify-content: center; align-items: center;
    gap: 1rem; margin-top: 1rem;
  }
  .page-info { font-size: 0.82rem; color: #6b7280; }
</style>
