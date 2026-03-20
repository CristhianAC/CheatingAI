<script>
  import { onMount } from 'svelte';
  import { page } from '$app/stores';
  import { getSessionReport } from '$lib/proctoring-api.js';

  let report = null;
  let loading = true;
  let error = '';
  let showAllViolations = false;

  const VIOLATION_LABELS = {
    multiple_persons: 'Varias personas',
    no_person: 'Estudiante ausente',
    looking_away: 'Mirada desviada',
    phone_detected: 'Uso de teléfono',
    tab_switch: 'Cambio de pestaña',
    window_blur: 'Pérdida de foco',
    identity_mismatch: 'Persona diferente',
  };

  const SEVERITY_META = {
    critico: { label: 'Crítico', icon: '⛔', bg: '#fef2f2', border: '#fca5a5', text: '#991b1b', badge: '#dc2626' },
    alto:    { label: 'Alto',    icon: '⚠️', bg: '#fff7ed', border: '#fdba74', text: '#92400e', badge: '#ea580c' },
    medio:   { label: 'Medio',   icon: '🔶', bg: '#fefce8', border: '#fde047', text: '#713f12', badge: '#ca8a04' },
    bajo:    { label: 'Bajo',    icon: 'ℹ️', bg: '#f0f9ff', border: '#7dd3fc', text: '#0c4a6e', badge: '#0284c7' },
  };

  const LEVEL_META = {
    bajo:    { label: 'Sin señales de trampa',          bg: '#f0fdf4', border: '#86efac', score_color: '#16a34a', ring: '#bbf7d0' },
    medio:   { label: 'Comportamiento inusual',          bg: '#fefce8', border: '#fde047', score_color: '#ca8a04', ring: '#fef08a' },
    alto:    { label: 'Comportamiento sospechoso',       bg: '#fff7ed', border: '#fdba74', score_color: '#ea580c', ring: '#fed7aa' },
    critico: { label: 'Alta probabilidad de trampa',     bg: '#fef2f2', border: '#fca5a5', score_color: '#dc2626', ring: '#fecaca' },
  };

  function violationLabel(type) {
    return VIOLATION_LABELS[type] ?? type;
  }

  function statusLabel(status) {
    if (!status) return '';
    const v = typeof status === 'string' ? status : status.value ?? status;
    return v === 'active' ? 'Activo' : 'Finalizado';
  }

  function fmtTime(iso) {
    if (!iso) return '—';
    return new Date(iso).toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  }

  function fmtDateTime(iso) {
    if (!iso) return '—';
    return new Date(iso).toLocaleString('es');
  }

  function fmtDuration(secs) {
    if (!secs) return '—';
    const m = Math.floor(secs / 60);
    const s = Math.round(secs % 60);
    return m > 0 ? `${m} min ${s} s` : `${s} s`;
  }

  $: ra = report?.risk_assessment;
  $: levelMeta = ra ? (LEVEL_META[ra.level] ?? LEVEL_META.bajo) : null;

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
    <div class="page__header-left">
      <a href="/proctoring" class="back-link">← Volver a supervisión</a>
      <h1 class="page__title">Reporte de Supervisión</h1>
      {#if report}
        <p class="page__meta">
          Estudiante <strong>{report.student_id}</strong> ·
          Examen <strong>{report.exam_id}</strong> ·
          {fmtDateTime(report.started_at)}
        </p>
      {/if}
    </div>
  </header>

  {#if loading}
    <div class="state-box">
      <span class="spinner"></span>
      <p>Cargando reporte…</p>
    </div>
  {:else if error}
    <div class="state-box state-box--error">
      <p>{error}</p>
    </div>
  {:else if !report}
    <div class="state-box">
      <p>No se encontró información para esta sesión.</p>
    </div>
  {:else}

    <!-- ── VERDICT HERO ─────────────────────────────────────────── -->
    {#if ra}
      <section
        class="verdict-card"
        style="background:{levelMeta.bg}; border-color:{levelMeta.border};"
      >
        <div class="verdict-score-ring" style="border-color:{levelMeta.ring};">
          <span class="verdict-score" style="color:{levelMeta.score_color};">{ra.score}</span>
          <span class="verdict-score-label" style="color:{levelMeta.score_color};">/ 100</span>
        </div>
        <div class="verdict-body">
          <div class="verdict-level" style="color:{levelMeta.score_color};">
            {#if ra.level === 'critico'}⛔{:else if ra.level === 'alto'}⚠️{:else if ra.level === 'medio'}🔶{:else}✅{/if}
            {ra.level_label}
          </div>
          <p class="verdict-summary">{ra.summary}</p>
          {#if ra.critical_findings.length > 0}
            <div class="verdict-findings">
              <strong>Hallazgos críticos:</strong>
              {#each ra.critical_findings as f}
                <span class="finding-chip finding-chip--critico">{f}</span>
              {/each}
            </div>
          {/if}
          {#if ra.behavioral_notes.length > 0}
            <div class="verdict-findings">
              <strong>Señales adicionales:</strong>
              {#each ra.behavioral_notes as n}
                <span class="finding-chip finding-chip--alto">{n}</span>
              {/each}
            </div>
          {/if}
        </div>
      </section>
    {/if}

    <div class="layout">
      <!-- ── LEFT COLUMN ────────────────────────────────────────── -->
      <div class="col-left">

        <!-- Session metadata -->
        <section class="card">
          <h2 class="card__title">Datos de la sesión</h2>
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
              <span class="summary-value pill pill--ok">{statusLabel(report.status)}</span>
            </div>
            <div class="summary-item">
              <span class="summary-label">Duración</span>
              <span class="summary-value">{fmtDuration(report.duration_seconds)}</span>
            </div>
            <div class="summary-item">
              <span class="summary-label">Inicio</span>
              <span class="summary-value">{fmtDateTime(report.started_at)}</span>
            </div>
            <div class="summary-item">
              <span class="summary-label">Fin</span>
              <span class="summary-value">{fmtDateTime(report.ended_at)}</span>
            </div>
          </div>
        </section>

        <!-- Violation counts breakdown -->
        <section class="card">
          <h2 class="card__title">Resumen de eventos detectados</h2>
          {#if Object.keys(report.violations_by_type ?? {}).length === 0}
            <p class="muted">No se registraron eventos sospechosos.</p>
          {:else}
            <div class="breakdown-list">
              {#each Object.entries(report.violations_by_type).sort((a,b) => b[1]-a[1]) as [type, count]}
                <div class="breakdown-row">
                  <span class="breakdown-label">{violationLabel(type)}</span>
                  <div class="breakdown-bar-wrap">
                    <div
                      class="breakdown-bar"
                      style="width: {Math.min(count / Math.max(...Object.values(report.violations_by_type)) * 100, 100)}%"
                    ></div>
                  </div>
                  <span class="breakdown-count">{count}</span>
                </div>
              {/each}
              <div class="breakdown-row breakdown-row--total">
                <span class="breakdown-label"><strong>Total</strong></span>
                <div class="breakdown-bar-wrap"></div>
                <span class="breakdown-count"><strong>{report.total_violations}</strong></span>
              </div>
            </div>
          {/if}
        </section>

        <!-- Suspicious clusters -->
        {#if ra?.suspicious_clusters?.length > 0}
          <section class="card">
            <h2 class="card__title">Concentraciones de comportamiento sospechoso</h2>
            <p class="card__desc">
              Un pico ocurre cuando 3 o más señales se acumulan en menos de 90 segundos.
              Los picos simultáneos tienen mayor peso en la puntuación de riesgo.
            </p>
            {#each ra.suspicious_clusters as cluster, i}
              <div class="cluster-row">
                <span class="cluster-index">#{i + 1}</span>
                <div class="cluster-body">
                  <span class="cluster-time">
                    {fmtTime(cluster.window_start)} – {fmtTime(cluster.window_end)}
                  </span>
                  <span class="cluster-count">{cluster.violation_count} eventos</span>
                  <div class="cluster-types">
                    {#each cluster.violation_types as t}
                      <span class="chip chip--sm">{violationLabel(t)}</span>
                    {/each}
                  </div>
                </div>
              </div>
            {/each}
          </section>
        {/if}

      </div>

      <!-- ── RIGHT COLUMN ───────────────────────────────────────── -->
      <div class="col-right">

        <!-- Alerts -->
        {#if ra?.alerts?.length > 0}
          <section class="card">
            <h2 class="card__title">Alertas para el profesor</h2>
            <p class="card__desc">
              Cada alerta describe un patrón de comportamiento específico con su
              nivel de riesgo y evidencia asociada.
            </p>
            <div class="alerts-list">
              {#each ra.alerts as alert}
                {@const meta = SEVERITY_META[alert.severity] ?? SEVERITY_META.bajo}
                <article
                  class="alert-card"
                  style="background:{meta.bg}; border-color:{meta.border};"
                >
                  <div class="alert-card__header">
                    <span class="alert-badge" style="background:{meta.badge};">
                      {meta.icon} {meta.label}
                    </span>
                    <span class="alert-evidence" style="color:{meta.text};">
                      {alert.evidence_count} evento{alert.evidence_count !== 1 ? 's' : ''}
                    </span>
                  </div>
                  <h3 class="alert-title" style="color:{meta.text};">{alert.title}</h3>
                  <p class="alert-desc">{alert.description}</p>
                  {#if alert.first_at}
                    <p class="alert-time">
                      Primera detección: {fmtTime(alert.first_at)}
                      {#if alert.last_at && alert.last_at !== alert.first_at}
                        · Última: {fmtTime(alert.last_at)}
                      {/if}
                    </p>
                  {/if}
                </article>
              {/each}
            </div>
          </section>
        {:else if ra}
          <section class="card">
            <h2 class="card__title">Alertas para el profesor</h2>
            <div class="no-alerts">
              <span class="no-alerts__icon">✅</span>
              <p>No se generaron alertas. El comportamiento del estudiante no presentó señales de trampa.</p>
            </div>
          </section>
        {/if}

        <!-- Full violation log (collapsible) -->
        <section class="card">
          <div class="violations-header">
            <h2 class="card__title">Registro completo de eventos</h2>
            <button
              class="btn btn--ghost btn--sm"
              on:click={() => showAllViolations = !showAllViolations}
            >
              {showAllViolations ? 'Ocultar' : `Ver todos (${report.violations?.length ?? 0})`}
            </button>
          </div>

          {#if !report.violations || report.violations.length === 0}
            <p class="muted">No se registraron eventos en esta sesión.</p>
          {:else}
            <div class="violations-list" class:violations-list--expanded={showAllViolations}>
              {#each (showAllViolations ? report.violations : report.violations.slice(0, 6)) as v}
                <article class="violation-row">
                  <div class="violation-row__left">
                    <span class="violation-time">{fmtTime(v.detected_at)}</span>
                    <span class="violation-type">{violationLabel(v.violation_type)}</span>
                    <span class="violation-conf">{(v.confidence * 100).toFixed(0)}% certeza</span>
                  </div>
                  {#if v.frame_snapshot}
                    <a href={v.frame_snapshot} target="_blank" rel="noopener" class="snapshot-link">
                      <img src={v.frame_snapshot} alt="Captura" class="snapshot-img" />
                    </a>
                  {/if}
                </article>
              {/each}
              {#if !showAllViolations && report.violations.length > 6}
                <button class="show-more-btn" on:click={() => showAllViolations = true}>
                  Ver {report.violations.length - 6} eventos más…
                </button>
              {/if}
            </div>
          {/if}
        </section>

      </div>
    </div>
  {/if}
</div>

<style>
  /* ── Page shell ───────────────────────────────────────────────── */
  .page {
    max-width: 1180px;
    margin: 0 auto;
    padding: 2rem 1.5rem 3rem;
  }
  .page__header {
    margin-bottom: 1.75rem;
  }
  .back-link {
    font-size: 0.8rem;
    color: #6b7280;
    text-decoration: none;
    display: inline-block;
    margin-bottom: 0.4rem;
  }
  .back-link:hover { color: #111827; }
  .page__title {
    font-size: 1.6rem;
    font-weight: 800;
    color: #111827;
    margin: 0 0 0.25rem;
  }
  .page__meta {
    font-size: 0.88rem;
    color: #6b7280;
    margin: 0;
  }

  /* ── State boxes ──────────────────────────────────────────────── */
  .state-box {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.75rem;
    padding: 3rem 1.5rem;
    color: #6b7280;
    font-size: 0.9rem;
  }
  .state-box--error { color: #b91c1c; }
  .spinner {
    width: 24px; height: 24px;
    border: 3px solid #e5e7eb;
    border-top-color: #6366f1;
    border-radius: 50%;
    animation: spin 0.7s linear infinite;
    display: inline-block;
  }
  @keyframes spin { to { transform: rotate(360deg); } }

  /* ── Verdict hero ─────────────────────────────────────────────── */
  .verdict-card {
    display: flex;
    align-items: flex-start;
    gap: 1.5rem;
    border: 2px solid;
    border-radius: 16px;
    padding: 1.5rem 1.75rem;
    margin-bottom: 1.75rem;
  }
  .verdict-score-ring {
    flex-shrink: 0;
    width: 90px; height: 90px;
    border-radius: 50%;
    border: 4px solid;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    background: #fff;
  }
  .verdict-score {
    font-size: 2rem;
    font-weight: 900;
    line-height: 1;
  }
  .verdict-score-label {
    font-size: 0.7rem;
    font-weight: 600;
    opacity: 0.7;
  }
  .verdict-body { flex: 1; }
  .verdict-level {
    font-size: 1.1rem;
    font-weight: 800;
    margin-bottom: 0.4rem;
  }
  .verdict-summary {
    font-size: 0.95rem;
    color: #374151;
    margin: 0 0 0.75rem;
    line-height: 1.5;
  }
  .verdict-findings {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 0.4rem;
    font-size: 0.82rem;
    color: #374151;
    margin-top: 0.4rem;
  }
  .finding-chip {
    padding: 0.2rem 0.6rem;
    border-radius: 999px;
    font-size: 0.78rem;
    font-weight: 600;
  }
  .finding-chip--critico { background: #fee2e2; color: #991b1b; }
  .finding-chip--alto    { background: #ffedd5; color: #92400e; }

  /* ── Layout ───────────────────────────────────────────────────── */
  .layout {
    display: grid;
    grid-template-columns: 1fr 1.1fr;
    gap: 1.5rem;
    align-items: flex-start;
  }
  .col-left, .col-right {
    display: flex;
    flex-direction: column;
    gap: 1.25rem;
  }
  @media (max-width: 900px) {
    .layout { grid-template-columns: 1fr; }
    .verdict-card { flex-direction: column; align-items: center; text-align: center; }
    .verdict-findings { justify-content: center; }
  }

  /* ── Cards ────────────────────────────────────────────────────── */
  .card {
    background: #fff;
    border: 1px solid #e5e7eb;
    border-radius: 14px;
    padding: 1.25rem 1.4rem;
  }
  .card__title {
    font-size: 1rem;
    font-weight: 700;
    color: #111827;
    margin: 0 0 0.75rem;
  }
  .card__desc {
    font-size: 0.82rem;
    color: #6b7280;
    margin: -0.25rem 0 0.85rem;
    line-height: 1.5;
  }
  .muted { font-size: 0.87rem; color: #9ca3af; margin: 0; }

  /* ── Summary grid ─────────────────────────────────────────────── */
  .summary-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 0.7rem 1rem;
  }
  .summary-item { display: flex; flex-direction: column; gap: 0.1rem; }
  .summary-label {
    font-size: 0.73rem;
    color: #9ca3af;
    text-transform: uppercase;
    letter-spacing: 0.06em;
  }
  .summary-value { font-size: 0.9rem; color: #111827; font-weight: 500; }
  .pill {
    display: inline-flex; align-items: center;
    padding: 0.15rem 0.55rem;
    border-radius: 999px;
    font-size: 0.78rem;
    font-weight: 600;
    align-self: flex-start;
  }
  .pill--ok { background: #ecfdf3; color: #15803d; }

  /* ── Breakdown bars ───────────────────────────────────────────── */
  .breakdown-list {
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
  }
  .breakdown-row {
    display: grid;
    grid-template-columns: 160px 1fr 36px;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.84rem;
  }
  .breakdown-row--total {
    border-top: 1px solid #e5e7eb;
    margin-top: 0.3rem;
    padding-top: 0.4rem;
  }
  .breakdown-label { color: #374151; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .breakdown-bar-wrap { height: 8px; background: #f3f4f6; border-radius: 99px; overflow: hidden; }
  .breakdown-bar { height: 100%; background: #6366f1; border-radius: 99px; min-width: 4px; }
  .breakdown-count { text-align: right; font-weight: 600; color: #374151; }

  /* ── Clusters ─────────────────────────────────────────────────── */
  .cluster-row {
    display: flex;
    gap: 0.75rem;
    align-items: flex-start;
    padding: 0.6rem 0;
    border-bottom: 1px solid #f3f4f6;
  }
  .cluster-row:last-child { border-bottom: none; }
  .cluster-index {
    flex-shrink: 0;
    width: 24px; height: 24px;
    background: #f3f4f6;
    border-radius: 50%;
    font-size: 0.75rem;
    font-weight: 700;
    color: #6b7280;
    display: flex; align-items: center; justify-content: center;
  }
  .cluster-body { flex: 1; }
  .cluster-time { font-size: 0.83rem; font-weight: 600; color: #374151; display: block; }
  .cluster-count { font-size: 0.78rem; color: #6b7280; display: block; margin-bottom: 0.35rem; }
  .cluster-types { display: flex; flex-wrap: wrap; gap: 0.3rem; }

  /* ── Chips ────────────────────────────────────────────────────── */
  .chip { padding: 0.15rem 0.5rem; border-radius: 999px; font-size: 0.75rem; background: #f3f4f6; color: #374151; }
  .chip--sm { font-size: 0.72rem; }

  /* ── Alert cards ──────────────────────────────────────────────── */
  .alerts-list { display: flex; flex-direction: column; gap: 0.85rem; }
  .alert-card {
    border: 1.5px solid;
    border-radius: 12px;
    padding: 0.9rem 1rem;
  }
  .alert-card__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 0.4rem;
  }
  .alert-badge {
    display: inline-flex;
    align-items: center;
    gap: 0.25rem;
    color: #fff;
    font-size: 0.72rem;
    font-weight: 700;
    padding: 0.15rem 0.55rem;
    border-radius: 999px;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }
  .alert-evidence { font-size: 0.78rem; font-weight: 600; }
  .alert-title { font-size: 0.93rem; font-weight: 700; margin: 0 0 0.4rem; }
  .alert-desc { font-size: 0.84rem; color: #374151; margin: 0 0 0.35rem; line-height: 1.55; }
  .alert-time { font-size: 0.75rem; color: #9ca3af; margin: 0; }

  /* ── No alerts ────────────────────────────────────────────────── */
  .no-alerts {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.5rem;
    padding: 1.5rem 0;
    text-align: center;
  }
  .no-alerts__icon { font-size: 2rem; }
  .no-alerts p { font-size: 0.88rem; color: #6b7280; max-width: 340px; margin: 0; }

  /* ── Violations log ───────────────────────────────────────────── */
  .violations-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.5rem;
    margin-bottom: 0.75rem;
  }
  .violations-header .card__title { margin: 0; }
  .violations-list { display: flex; flex-direction: column; gap: 0.5rem; }
  .violation-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.75rem;
    padding: 0.55rem 0.7rem;
    border-radius: 8px;
    background: #f9fafb;
    border: 1px solid #e5e7eb;
  }
  .violation-row__left {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 0.5rem;
    flex: 1;
  }
  .violation-time { font-size: 0.78rem; color: #9ca3af; font-variant-numeric: tabular-nums; white-space: nowrap; }
  .violation-type { font-size: 0.84rem; font-weight: 600; color: #374151; }
  .violation-conf { font-size: 0.75rem; color: #6b7280; }
  .show-more-btn {
    background: none;
    border: 1px dashed #d1d5db;
    border-radius: 8px;
    padding: 0.55rem;
    font-size: 0.82rem;
    color: #6b7280;
    cursor: pointer;
    text-align: center;
    width: 100%;
  }
  .show-more-btn:hover { border-color: #9ca3af; color: #374151; }
  .snapshot-link { display: inline-block; flex-shrink: 0; }
  .snapshot-img {
    width: 64px; height: 48px;
    object-fit: cover;
    border-radius: 6px;
    border: 1px solid #e5e7eb;
    display: block;
  }

  /* ── Buttons ──────────────────────────────────────────────────── */
  .btn { display: inline-flex; align-items: center; gap: 0.3rem; padding: 0.4rem 0.8rem; border-radius: 8px; font-size: 0.82rem; font-weight: 600; cursor: pointer; border: none; }
  .btn--ghost { background: transparent; border: 1px solid #d1d5db; color: #374151; }
  .btn--ghost:hover { background: #f3f4f6; }
  .btn--sm { padding: 0.3rem 0.65rem; font-size: 0.78rem; }
</style>
