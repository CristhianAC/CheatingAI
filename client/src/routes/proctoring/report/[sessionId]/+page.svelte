<script>
  import { onMount } from 'svelte';
  import { page } from '$app/stores';
  import { getSessionReport } from '$lib/proctoring-api.js';

  let report = null;
  let loading = true;
  let error = '';

  function violationLabel(type) {
    const labels = {
      multiple_persons: 'Varias personas',
      no_person: 'Persona ausente',
      looking_away: 'Mirando a otro lado',
      phone_detected: 'Uso de teléfono'
    };
    return labels[type] ?? type;
  }

  function statusLabel(status) {
    if (!status) return '';
    const v = typeof status === 'string' ? status : status.value ?? status;
    return v === 'active' ? 'Activo' : 'Finalizado';
  }

  onMount(async () => {
    const sessionId = $page.params.sessionId;
    try {
      loading = true;
      error = '';
      report = await getSessionReport(sessionId);
    } catch (e) {
      error = e.message ?? 'No se pudo cargar el reporte';
    } finally {
      loading = false;
    }
  });
</script>

<svelte:head>
  <title>Reporte de Supervisión | CheatingAI</title>
</svelte:head>

<div class="page">
  <header class="page__header">
    <h1 class="page__title">Reporte de Supervisión</h1>
    <p class="page__subtitle">
      Resumen de la sesión y lista de comportamientos sospechosos detectados por la cámara.
    </p>
  </header>

  {#if loading}
    <p class="info">Cargando reporte…</p>
  {:else if error}
    <p class="error">{error}</p>
  {:else if !report}
    <p class="info">No se encontró información para esta sesión.</p>
  {:else}
    <div class="layout">
      <section class="card">
        <h2 class="card__title">Resumen de la sesión</h2>
        <div class="summary-grid">
          <div class="summary-item">
            <span class="summary-label">ID examen</span>
            <span class="summary-value">{report.exam_id}</span>
          </div>
          <div class="summary-item">
            <span class="summary-label">ID estudiante</span>
            <span class="summary-value">{report.student_id}</span>
          </div>
          <div class="summary-item">
            <span class="summary-label">Estado</span>
            <span class="summary-value summary-value--pill">
              {statusLabel(report.status)}
            </span>
          </div>
          <div class="summary-item">
            <span class="summary-label">Duración aproximada</span>
            <span class="summary-value">
              {Math.round(report.duration_seconds / 60)} min
            </span>
          </div>
          <div class="summary-item">
            <span class="summary-label">Inicio</span>
            <span class="summary-value">
              {new Date(report.started_at).toLocaleString()}
            </span>
          </div>
          <div class="summary-item">
            <span class="summary-label">Fin</span>
            <span class="summary-value">
              {#if report.ended_at}
                {new Date(report.ended_at).toLocaleString()}
              {:else}
                —
              {/if}
            </span>
          </div>
        </div>

        <div class="stats-row">
          <div class="stats-card">
            <span class="stats-label">Total de violaciones</span>
            <span class="stats-value">{report.total_violations}</span>
          </div>
          <div class="stats-breakdown">
            {#if Object.keys(report.violations_by_type || {}).length === 0}
              <span class="stats-empty">No se registraron violaciones en esta sesión.</span>
            {:else}
              {#each Object.entries(report.violations_by_type) as [type, count]}
                <span class="stats-chip">
                  {violationLabel(type)} · <strong>{count}</strong>
                </span>
              {/each}
            {/if}
          </div>
        </div>
      </section>

      <section class="card">
        <div class="violations-header">
          <h2 class="card__title">Lista de violaciones</h2>
          <a href="/proctoring" class="btn btn--secondary btn--sm">
            Volver a Supervisión
          </a>
        </div>

        {#if !report.violations || report.violations.length === 0}
          <p class="info">No se registraron eventos sospechosos en esta sesión.</p>
        {:else}
          <div class="violations-list">
            {#each report.violations as v}
              <article class="violation-card">
                <header class="violation-card__header">
                  <div>
                    <h3 class="violation-card__title">
                      {violationLabel(v.violation_type)}
                    </h3>
                    <p class="violation-card__meta">
                      {new Date(v.detected_at).toLocaleTimeString()} ·
                      {(v.confidence * 100).toFixed(0)}% confianza
                    </p>
                  </div>
                </header>

                {#if v.frame_snapshot}
                  <div class="violation-card__body">
                    <a href={v.frame_snapshot} target="_blank" rel="noopener" class="snapshot-link">
                      <!-- svelte-ignore a11y-img-redundant-alt -->
                      <img
                        src={v.frame_snapshot}
                        alt="Captura del momento detectado"
                        class="snapshot-img"
                      />
                      <span class="snapshot-hint">Abrir imagen en pestaña nueva</span>
                    </a>
                  </div>
                {:else}
                  <p class="violation-card__note">
                    No hay imagen asociada a este evento.
                  </p>
                {/if}
              </article>
            {/each}
          </div>
        {/if}
      </section>
    </div>
  {/if}
</div>

<style>
  .page {
    max-width: 1100px;
    margin: 0 auto;
    padding: 2rem 1.5rem;
  }
  .page__header {
    margin-bottom: 1.5rem;
  }
  .page__title {
    font-size: 1.5rem;
    font-weight: 800;
    color: #111827;
    margin: 0 0 0.3rem;
  }
  .page__subtitle {
    font-size: 0.95rem;
    color: #6b7280;
    margin: 0;
  }

  .info {
    font-size: 0.9rem;
    color: #6b7280;
  }
  .error {
    font-size: 0.9rem;
    color: #b91c1c;
  }

  .layout {
    display: grid;
    grid-template-columns: 1.1fr 1.2fr;
    gap: 1.5rem;
    align-items: flex-start;
  }
  @media (max-width: 900px) {
    .layout {
      grid-template-columns: 1fr;
    }
  }

  .summary-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 0.75rem 1rem;
    margin-bottom: 1.25rem;
  }
  .summary-item {
    display: flex;
    flex-direction: column;
    gap: 0.15rem;
  }
  .summary-label {
    font-size: 0.78rem;
    color: #9ca3af;
    text-transform: uppercase;
    letter-spacing: 0.06em;
  }
  .summary-value {
    font-size: 0.92rem;
    color: #111827;
    font-weight: 500;
  }
  .summary-value--pill {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: 0.16rem 0.6rem;
    border-radius: 999px;
    background: #ecfdf3;
    color: #15803d;
    font-size: 0.8rem;
    font-weight: 600;
    align-self: flex-start;
  }

  .stats-row {
    display: flex;
    gap: 1rem;
    align-items: center;
    flex-wrap: wrap;
  }
  .stats-card {
    min-width: 150px;
    padding: 0.7rem 1rem;
    border-radius: 10px;
    background: #eef2ff;
  }
  .stats-label {
    font-size: 0.8rem;
    color: #4b5563;
  }
  .stats-value {
    font-size: 1.2rem;
    font-weight: 800;
    color: #4338ca;
    display: block;
  }
  .stats-breakdown {
    display: flex;
    flex-wrap: wrap;
    gap: 0.4rem;
  }
  .stats-chip {
    font-size: 0.8rem;
    padding: 0.2rem 0.5rem;
    border-radius: 999px;
    background: #f3f4f6;
    color: #374151;
  }
  .stats-empty {
    font-size: 0.8rem;
    color: #6b7280;
  }

  .violations-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
    margin-bottom: 0.5rem;
  }

  .violations-list {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
    max-height: 540px;
    overflow-y: auto;
  }
  .violation-card {
    border-radius: 10px;
    border: 1px solid #e5e7eb;
    padding: 0.75rem 0.9rem;
    background: #f9fafb;
  }
  .violation-card__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.75rem;
    margin-bottom: 0.4rem;
  }
  .violation-card__title {
    font-size: 0.95rem;
    font-weight: 700;
    color: #111827;
    margin: 0;
  }
  .violation-card__meta {
    font-size: 0.8rem;
    color: #6b7280;
    margin: 0.1rem 0 0;
  }
  .violation-card__body {
    margin-top: 0.35rem;
  }
  .violation-card__note {
    font-size: 0.8rem;
    color: #6b7280;
    margin: 0.3rem 0 0;
  }

  .snapshot-link {
    display: inline-flex;
    flex-direction: column;
    gap: 0.25rem;
    text-decoration: none;
  }
  .snapshot-img {
    width: 220px;
    max-width: 100%;
    border-radius: 8px;
    border: 1px solid #e5e7eb;
    box-shadow: 0 6px 18px rgba(15,23,42,0.18);
    background: #020617;
  }
  .snapshot-hint {
    font-size: 0.78rem;
    color: #6b7280;
  }
</style>

