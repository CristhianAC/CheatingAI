<script>
  import { onMount } from 'svelte';
  import { page } from '$app/stores';
  import { getSessionReport } from '$lib/proctoring-api.js';
  import PageHeader from '$lib/components/PageHeader.svelte';
  import * as Card from '$lib/components/ui/card';
  import { Button } from '$lib/components/ui/button';
  import { Badge } from '$lib/components/ui/badge';
  import { Label } from '$lib/components/ui/label';
  import * as Accordion from '$lib/components/ui/accordion';

  let report = null;
  let loading = true;
  let error = '';
  let showAllViolations = false;
  /** Filtro y orden locales sobre la lista de eventos (sin cambiar API). */
  let eventFilterType = '';
  let eventSort = 'time-desc';

  const VIOLATION_LABELS = {
    multiple_persons: 'Varias personas',
    no_person: 'Participante ausente',
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
    bajo:    { label: 'Sin señales relevantes',         bg: '#f0fdf4', border: '#86efac', score_color: '#16a34a', ring: '#bbf7d0' },
    medio:   { label: 'Comportamiento inusual',          bg: '#fefce8', border: '#fde047', score_color: '#ca8a04', ring: '#fef08a' },
    alto:    { label: 'Comportamiento sospechoso',       bg: '#fff7ed', border: '#fdba74', score_color: '#ea580c', ring: '#fed7aa' },
    critico: { label: 'Riesgo crítico para revisión',    bg: '#fef2f2', border: '#fca5a5', score_color: '#dc2626', ring: '#fecaca' },
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

  $: eventTypeOptions = report?.violations?.length
    ? [...new Set(report.violations.map((v) => v.violation_type))].sort()
    : [];

  $: filteredViolations = (() => {
    if (!report?.violations?.length) return [];
    let list = [...report.violations];
    if (eventFilterType) {
      list = list.filter((v) => v.violation_type === eventFilterType);
    }
    if (eventSort === 'time-desc') {
      list.sort((a, b) => new Date(b.detected_at) - new Date(a.detected_at));
    } else if (eventSort === 'time-asc') {
      list.sort((a, b) => new Date(a.detected_at) - new Date(b.detected_at));
    } else if (eventSort === 'conf-desc') {
      list.sort((a, b) => (b.confidence ?? 0) - (a.confidence ?? 0));
    } else if (eventSort === 'conf-asc') {
      list.sort((a, b) => (a.confidence ?? 0) - (b.confidence ?? 0));
    }
    return list;
  })();

  $: visibleViolations = showAllViolations ? filteredViolations : filteredViolations.slice(0, 6);

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
  <title>Reporte de supervisión | Procto</title>
</svelte:head>

<div class="page space-y-6">
  <PageHeader
    focus="Reporte docente"
    title="Reporte de supervisión"
    subtitle={report
      ? `${report.student_name ?? report.student_id}${report.student_email ? ` · ${report.student_email}` : ''} — ${report.exam_name ?? report.exam_id}${report.exam_code ? ` (${report.exam_code})` : ''} · ${fmtDateTime(report.started_at)}`
      : 'Detalle de la sesión supervisada'}
  >
    <svelte:fragment slot="actions">
      <Button variant="outline" size="sm" href="/proctoring">← Volver</Button>
    </svelte:fragment>
  </PageHeader>

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

    <div class="grid gap-4 sm:grid-cols-3">
      <Card.Root class="rounded-xl">
        <Card.Header class="pb-2">
          <Card.Description>Riesgo</Card.Description>
          <Card.Title class="text-2xl">{ra?.score ?? '—'}/100</Card.Title>
        </Card.Header>
        <Card.Content>
          <Badge variant="outline">{ra?.level_label ?? 'Sin evaluar'}</Badge>
        </Card.Content>
      </Card.Root>
      <Card.Root class="rounded-xl">
        <Card.Header class="pb-2">
          <Card.Description>Eventos</Card.Description>
          <Card.Title class="text-2xl">{report.total_violations ?? 0}</Card.Title>
        </Card.Header>
        <Card.Content>
          <p class="text-sm text-muted-foreground">Señales registradas</p>
        </Card.Content>
      </Card.Root>
      <Card.Root class="rounded-xl">
        <Card.Header class="pb-2">
          <Card.Description>Duración</Card.Description>
          <Card.Title class="text-2xl">{fmtDuration(report.duration_seconds)}</Card.Title>
        </Card.Header>
        <Card.Content>
          <p class="text-sm text-muted-foreground">{statusLabel(report.status)}</p>
        </Card.Content>
      </Card.Root>
    </div>

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
            <span class="verdict-level__label">{ra.level_label}</span>
          </div>
          <p class="verdict-summary">{ra.summary}</p>
          <p class="insight-line">
            <strong>Nivel de riesgo: qué indica.</strong> Resume la severidad general de las señales observadas en esta sesión.
          </p>
          <p class="action-line">
            <strong>Siguiente acción sugerida:</strong> revisa primero los hallazgos críticos y luego valida la evidencia de eventos.
          </p>
          {#if ra.critical_findings.length > 0}
            <div class="verdict-findings">
              <strong>Hallazgos clave: por qué importa.</strong>
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

    <section class="card card--compact">
      <h2 class="card__title">Cómo interpretar este reporte</h2>
      <ul class="glossary-list">
        <li><strong>Score (0–100):</strong> lectura general del riesgo en la sesión.</li>
        <li><strong>Nivel (bajo/medio/alto/crítico):</strong> severidad estimada de las señales.</li>
        <li><strong>Alertas:</strong> patrones detectados con su evidencia asociada.</li>
        <li><strong>Clusters o picos:</strong> concentración temporal de señales en una misma ventana.</li>
      </ul>
    </section>

    {#if ra?.alerts?.length > 0}
      <section class="card">
        <h2 class="card__title">Hallazgos críticos para revisión docente</h2>
        <p class="card__desc">
          Cada hallazgo resume un patrón detectado, su severidad y la evidencia temporal disponible.
        </p>
        <p class="insight-line">
          <strong>Qué significa:</strong> la combinación de alertas orienta la prioridad de revisión, pero no implica sanción automática.
        </p>
        <p class="action-line">
          <strong>Qué revisar primero:</strong> comienza por severidad crítica o alta y confirma coincidencia entre descripción y eventos.
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
                  {meta.label}
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
        <h2 class="card__title">Hallazgos críticos para revisión docente</h2>
        <div class="no-alerts">
                    <p>No se generaron alertas. El comportamiento del participante no presentó señales relevantes para revisión adicional.</p>
        </div>
      </section>
    {/if}

    <section class="card">
      <div class="violations-header">
        <h2 class="card__title">Eventos con evidencia</h2>
        <Button variant="ghost" size="sm" onclick={() => (showAllViolations = !showAllViolations)}>
          {showAllViolations ? 'Ocultar' : `Ver todos (${filteredViolations.length})`}
        </Button>
      </div>
      <p class="card__desc">
        Lista cronológica de señales observadas durante la sesión, con confianza estimada y capturas cuando existen.
      </p>
      <p class="insight-line">
        <strong>Qué significa:</strong> cada evento aporta contexto para la evaluación docente de la sesión.
      </p>
      <p class="action-line">
        <strong>Qué revisar primero:</strong> prioriza eventos de mayor confianza y aquellos con evidencia visual asociada.
      </p>

      {#if !report.violations || report.violations.length === 0}
        <p class="muted">No se registraron eventos en esta sesión.</p>
      {:else}
        <div class="events-toolbar mb-4 flex flex-wrap gap-4 rounded-lg border border-border bg-muted/30 p-4">
          <label class="events-toolbar__field min-w-[180px] space-y-1.5">
            <Label class="events-toolbar__label">Tipo de señal</Label>
            <select bind:value={eventFilterType} class="events-toolbar__select flex h-9 w-full rounded-lg border border-input bg-background px-3 text-sm">
              <option value="">Todos</option>
              {#each eventTypeOptions as t}
                <option value={t}>{violationLabel(t)}</option>
              {/each}
            </select>
          </label>
          <label class="events-toolbar__field min-w-[180px] space-y-1.5">
            <Label class="events-toolbar__label">Orden</Label>
            <select bind:value={eventSort} class="events-toolbar__select flex h-9 w-full rounded-lg border border-input bg-background px-3 text-sm">
              <option value="time-desc">Hora: más recientes</option>
              <option value="time-asc">Hora: más antiguos</option>
              <option value="conf-desc">Certeza: mayor primero</option>
              <option value="conf-asc">Certeza: menor primero</option>
            </select>
          </label>
        </div>
        {#if filteredViolations.length === 0}
          <p class="muted">Ningún evento coincide con el filtro actual.</p>
        {:else}
          <div class="violations-list" class:violations-list--expanded={showAllViolations}>
            {#each visibleViolations as v}
              <article class="violation-row">
                <div class="violation-row__left">
                  <span class="violation-time">{fmtTime(v.detected_at)}</span>
                  <span class="violation-type">{violationLabel(v.violation_type)}</span>
                  <span class="violation-conf">{(v.confidence * 100).toFixed(0)}% certeza</span>
                </div>
                {#if v.frame_snapshot}
                  <a href={v.frame_snapshot} target="_blank" rel="noopener" class="snapshot-link">
                    <img src={v.frame_snapshot} alt="Captura del evento" class="snapshot-img" />
                  </a>
                {/if}
              </article>
            {/each}
            {#if !showAllViolations && filteredViolations.length > 6}
              <button type="button" class="show-more-btn" on:click={() => (showAllViolations = true)}>
                Ver {filteredViolations.length - 6} eventos más…
              </button>
            {/if}
          </div>
        {/if}
      {/if}
    </section>

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
              <span class="summary-label">ID participante</span>
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
          <h2 class="card__title">Resumen de señales detectadas</h2>
          <p class="insight-line">
            <strong>Qué significa:</strong> muestra qué tipos de eventos se repiten y su peso relativo en la sesión.
          </p>
          <p class="action-line">
            <strong>Qué revisar primero:</strong> prioriza los tipos con mayor frecuencia y contrástalos con la evidencia visual.
          </p>
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
            <h2 class="card__title">Concentraciones temporales de señales</h2>
            <p class="card__desc">
              Un pico ocurre cuando 3 o más señales se acumulan en menos de 90 segundos.
              Los picos simultáneos tienen mayor peso en la puntuación de riesgo.
            </p>
            <p class="insight-line">
              <strong>Qué significa:</strong> varios eventos juntos en poco tiempo pueden aumentar la necesidad de revisión.
            </p>
            <p class="action-line">
              <strong>Qué revisar primero:</strong> valida los picos con más eventos y la combinación de tipos detectados.
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
        <section class="card card--compact">
          <h2 class="card__title">Guía rápida de revisión</h2>
          <p class="card__desc">
            Usa esta vista para apoyar la evaluación docente con evidencias y contexto temporal, no como decisión automática.
          </p>
          <ul class="glossary-list">
            <li>Compara hallazgos críticos con los eventos detallados.</li>
            <li>Verifica primero eventos con mayor confianza y captura asociada.</li>
            <li>Contrasta picos de señales con el resto del comportamiento de la sesión.</li>
          </ul>
        </section>

      </div>
    </div>

    <Accordion.Root type="single" class="rounded-xl border border-border bg-card px-4">
      <Accordion.Item value="tech">
        <Accordion.Trigger class="py-4 text-sm font-semibold">Datos técnicos</Accordion.Trigger>
        <Accordion.Content>
      <div class="tech-details__body pb-4">
        <div class="tech-row">
          <span class="tech-label">session_id</span>
          <code class="tech-value">{report.id}</code>
        </div>
        <div class="tech-row">
          <span class="tech-label">exam_id</span>
          <code class="tech-value">{report.exam_id}</code>
        </div>
        <div class="tech-row">
          <span class="tech-label">student_id</span>
          <code class="tech-value">{report.student_id}</code>
        </div>
      </div>
        </Accordion.Content>
      </Accordion.Item>
    </Accordion.Root>
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
    margin-bottom: 2.25rem;
    padding-bottom: 1.25rem;
    border-bottom: 1px solid var(--procto-border, rgba(0, 0, 0, 0.08));
  }
  .back-link {
    font-size: 0.8rem;
    color: var(--procto-text-secondary, #6e6e73);
    text-decoration: none;
    display: inline-block;
    margin-bottom: 0.85rem;
  }
  .back-link:hover {
    color: var(--procto-text, #1d1d1f);
  }
  .page__header-focus {
    border-left: 4px solid var(--procto-accent, #0071e3);
    padding-left: 1.125rem;
    margin-left: 2px;
  }
  .page__eyebrow {
    margin: 0 0 0.5rem;
    font-size: 0.6875rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.14em;
    color: var(--procto-accent, #0071e3);
  }
  .page__title {
    font-size: clamp(1.75rem, 4vw, 2.125rem);
    font-weight: 700;
    letter-spacing: -0.045em;
    color: var(--procto-text, #1d1d1f);
    margin: 0 0 0.5rem;
    line-height: 1.08;
  }
  .page__meta {
    font-size: 1rem;
    line-height: 1.5;
    color: var(--procto-text-secondary, #6e6e73);
    margin: 0;
    max-width: 40rem;
  }
  .page__meta-secondary {
    color: var(--procto-text-secondary, #6e6e73);
    font-size: 0.92rem;
    font-weight: 500;
  }
  .page__meta-sep {
    margin: 0 0.35rem;
    opacity: 0.55;
  }

  .code-badge {
    display: inline-block;
    background: var(--procto-accent-muted, rgba(0, 113, 227, 0.12));
    color: var(--procto-accent, #0071e3);
    border: 1px solid rgba(0, 113, 227, 0.25);
    border-radius: 999px;
    padding: 0.12rem 0.5rem;
    font-weight: 700;
    letter-spacing: 0.06em;
    font-size: 0.78rem;
    margin-left: 0.4rem;
    white-space: nowrap;
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
    border-top-color: var(--procto-accent, #0071e3);
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
    border: 1px solid;
    border-radius: var(--procto-radius, 12px);
    padding: 1.5rem 1.75rem;
    margin-bottom: 1.75rem;
    box-shadow: var(--procto-shadow-card, 0 1px 2px rgba(0, 0, 0, 0.04));
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
    font-size: 1.05rem;
    font-weight: 600;
    margin-bottom: 0.4rem;
    letter-spacing: -0.02em;
  }
  .verdict-level__label {
    display: inline-block;
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
  .card--compact { padding-top: 1rem; }
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
  .glossary-list {
    margin: 0;
    padding-left: 1rem;
    display: flex;
    flex-direction: column;
    gap: 0.35rem;
    color: #374151;
    font-size: 0.86rem;
    line-height: 1.45;
  }
  .insight-line,
  .action-line {
    margin: 0 0 0.55rem;
    color: #4b5563;
    font-size: 0.82rem;
    line-height: 1.45;
  }
  .action-line { margin-bottom: 0.8rem; }

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
  .breakdown-bar { height: 100%; background: var(--procto-accent, #0071e3); border-radius: 99px; min-width: 4px; }
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
  .no-alerts p { font-size: 0.88rem; color: #6b7280; max-width: 420px; margin: 0; }

  /* ── Violations log ───────────────────────────────────────────── */
  .violations-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.5rem;
    margin-bottom: 0.75rem;
  }
  .violations-header .card__title { margin: 0; }
  .events-toolbar {
    display: flex;
    flex-wrap: wrap;
    gap: 1rem;
    margin-bottom: 0.85rem;
    align-items: flex-end;
  }
  .events-toolbar__field {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
    min-width: 160px;
    flex: 1;
  }
  .events-toolbar__label {
    font-size: 0.72rem;
    font-weight: 600;
    color: #6b7280;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }
  .events-toolbar__select {
    width: 100%;
    max-width: 280px;
  }
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

  /* Datos técnicos */
  .tech-details {
    margin-top: 1.25rem;
  }
  .tech-details__summary {
    cursor: pointer;
    font-weight: 700;
    color: #374151;
  }
  .tech-details__body {
    margin-top: 0.85rem;
    display: flex;
    flex-direction: column;
    gap: 0.55rem;
  }
  .tech-row {
    display: flex;
    gap: 0.75rem;
    align-items: center;
    justify-content: space-between;
    padding: 0.55rem 0.75rem;
    border: 1px solid #e5e7eb;
    border-radius: 10px;
    background: #f9fafb;
  }
  .tech-label {
    font-size: 0.72rem;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    color: #6b7280;
    font-weight: 700;
  }
  .tech-value {
    font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace;
    font-size: 0.82rem;
    color: #111827;
  }
</style>
