<script>
  import { submissions, showToast, showError, scoreColor, scoreLabel } from '$lib/stores.js';
  import { pairwiseAnalysis } from '$lib/api.js';

  let subA = '';
  let subB = '';
  let threshold = 0.7;
  let loading = false;
  let result = null;

  async function handleSubmit() {
    if (!subA || !subB) { showError('Selecciona dos submissions.'); return; }
    if (subA === subB)   { showError('Las submissions deben ser distintas.'); return; }
    loading = true;
    result = null;
    try {
      result = await pairwiseAnalysis({
        submission_a_id: subA,
        submission_b_id: subB,
        threshold
      });
      showToast('Análisis completado');
    } catch (e) {
      showError(e.message);
    } finally {
      loading = false;
    }
  }

  $: color = result ? scoreColor(result.similarity_score, result.is_exact_copy) : null;
  $: label = result ? scoreLabel(result.similarity_score, result.is_exact_copy) : null;
  $: pct   = result ? Math.round(result.similarity_score * 100) : 0;
</script>

<div class="rounded-xl border border-border bg-card p-6 shadow-sm">
  <h2 class="card__title">🔍 Análisis Par a Par <span class="badge-sync">Síncrono</span></h2>
  <p class="card__desc">Compara dos submissions específicas y obtén el resultado inmediatamente.</p>

  <form on:submit|preventDefault={handleSubmit}>
    <div class="grid-2">
      <div class="field">
        <label for="subA">Submission A *</label>
        <select id="subA" bind:value={subA} required>
          <option value="">— Seleccionar —</option>
          {#each $submissions as s}
            <option value={s.id}>{s.student_id} · {s.problem_id} ({s.language})</option>
          {/each}
        </select>
      </div>
      <div class="field">
        <label for="subB">Submission B *</label>
        <select id="subB" bind:value={subB} required>
          <option value="">— Seleccionar —</option>
          {#each $submissions as s}
            <option value={s.id}>{s.student_id} · {s.problem_id} ({s.language})</option>
          {/each}
        </select>
      </div>
    </div>

    <div class="field">
      <label for="threshold">
        Umbral de alerta: <strong>{(threshold * 100).toFixed(0)}%</strong>
      </label>
      <input
        id="threshold"
        type="range" min="0" max="1" step="0.05"
        bind:value={threshold}
        class="slider"
      />
      <div class="slider-labels"><span>0%</span><span>50%</span><span>100%</span></div>
    </div>

    <button class="btn btn--primary" type="submit" disabled={loading || $submissions.length < 2}>
      {loading ? '⏳ Comparando...' : '⚡ Comparar ahora'}
    </button>

    {#if $submissions.length < 2}
      <p class="hint">Necesitas al menos 2 submissions. Ve a la pestaña Submissions.</p>
    {/if}
  </form>

  <!-- Resultado -->
  {#if result}
    <div class="result result--{color}">
      <div class="result-top">
        <div class="score-circle score-circle--{color}">
          <span class="score-num">{pct}%</span>
          <span class="score-sub">similitud</span>
        </div>
        <div class="result-info">
          <div class="result-badges">
            <span class="badge-score badge-score--{color}">{label}</span>
            {#if result.is_flagged}
              <span class="badge-flag">🚨 Flagged</span>
            {:else}
              <span class="badge-ok">✅ OK</span>
            {/if}
            {#if result.is_exact_copy}
              <span class="badge-exact">🟣 Copia exacta</span>
            {/if}
          </div>
          <p class="result-detail">Umbral usado: {(result.threshold_used * 100).toFixed(0)}%</p>
        </div>
      </div>

      {#if result.algorithm_details}
        <details class="algo-details">
          <summary>Detalles del algoritmo Winnowing</summary>
          <div class="algo-grid">
            <div class="algo-item">
              <span class="algo-label">Fingerprints A</span>
              <span class="algo-val">{result.algorithm_details.fingerprints_a}</span>
            </div>
            <div class="algo-item">
              <span class="algo-label">Fingerprints B</span>
              <span class="algo-val">{result.algorithm_details.fingerprints_b}</span>
            </div>
            <div class="algo-item">
              <span class="algo-label">Comunes</span>
              <span class="algo-val">{result.algorithm_details.common_fingerprints}</span>
            </div>
            <div class="algo-item">
              <span class="algo-label">k-gram (k)</span>
              <span class="algo-val">{result.algorithm_details.k}</span>
            </div>
            <div class="algo-item">
              <span class="algo-label">Ventana (w)</span>
              <span class="algo-val">{result.algorithm_details.w}</span>
            </div>
          </div>
        </details>
      {/if}
    </div>
  {/if}
</div>

<style>
  .badge-sync {
    font-size: 0.7rem; background: #d1fae5; color: #065f46;
    padding: 0.15rem 0.5rem; border-radius: 999px; vertical-align: middle;
  }
  .card__desc { color: #6b7280; font-size: 0.88rem; margin-bottom: 1rem; }
  .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem; }
  .slider { width: 100%; accent-color: var(--procto-accent, #0071e3); }
  .slider-labels { display: flex; justify-content: space-between; font-size: 0.75rem; color: #9ca3af; }
  .hint { font-size: 0.8rem; color: #f59e0b; margin-top: 0.5rem; }

  /* Resultado */
  .result {
    margin-top: 1.5rem; padding: 1.25rem;
    border-radius: 10px; border: 2px solid;
  }
  .result--low    { border-color: #10b981; background: #f0fdf4; }
  .result--medium { border-color: #f59e0b; background: #fffbeb; }
  .result--high   { border-color: #ef4444; background: #fef2f2; }
  .result--exact  { border-color: #8b5cf6; background: #f5f3ff; }

  .result-top { display: flex; gap: 1.25rem; align-items: center; }

  .score-circle {
    width: 90px; height: 90px; border-radius: 50%;
    display: flex; flex-direction: column;
    align-items: center; justify-content: center;
    flex-shrink: 0;
  }
  .score-circle--low    { background: #10b981; color: #fff; }
  .score-circle--medium { background: #f59e0b; color: #fff; }
  .score-circle--high   { background: #ef4444; color: #fff; }
  .score-circle--exact  { background: #8b5cf6; color: #fff; }

  .score-num { font-size: 1.4rem; font-weight: 800; line-height: 1; }
  .score-sub { font-size: 0.65rem; opacity: 0.85; }

  .result-badges { display: flex; gap: 0.4rem; flex-wrap: wrap; margin-bottom: 0.4rem; }
  .badge-score, .badge-flag, .badge-ok, .badge-exact {
    padding: 0.2rem 0.6rem; border-radius: 999px; font-size: 0.78rem; font-weight: 600;
  }
  .badge-score--low    { background: #d1fae5; color: #065f46; }
  .badge-score--medium { background: #fef9c3; color: #713f12; }
  .badge-score--high   { background: #fee2e2; color: #991b1b; }
  .badge-score--exact  { background: #ede9fe; color: #5b21b6; }
  .badge-flag  { background: #fee2e2; color: #991b1b; }
  .badge-ok    { background: #d1fae5; color: #065f46; }
  .badge-exact { background: #ede9fe; color: #5b21b6; }
  .result-detail { font-size: 0.8rem; color: #6b7280; margin: 0; }

  /* Detalles algoritmo */
  .algo-details { margin-top: 1rem; }
  .algo-details summary { cursor: pointer; font-size: 0.85rem; color: #6b7280; }
  .algo-grid {
    display: grid; grid-template-columns: repeat(5, 1fr); gap: 0.5rem;
    margin-top: 0.75rem;
  }
  .algo-item {
    background: #fff; border-radius: 8px; padding: 0.5rem;
    text-align: center; border: 1px solid #e5e7eb;
  }
  .algo-label { display: block; font-size: 0.7rem; color: #9ca3af; }
  .algo-val   { display: block; font-size: 1.1rem; font-weight: 700; color: #374151; }

  @media (max-width: 600px) {
    .grid-2 { grid-template-columns: 1fr; }
    .algo-grid { grid-template-columns: repeat(3, 1fr); }
  }
</style>
