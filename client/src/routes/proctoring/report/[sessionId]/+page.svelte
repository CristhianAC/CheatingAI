<script>
  import { onMount } from 'svelte';
  import { get } from 'svelte/store';
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';
  import { getSessionReport } from '$lib/proctoring-api.js';
  import { authStore, initAuth } from '$lib/auth.js';
  import PageHeader from '$lib/components/PageHeader.svelte';
  import * as Card from '$lib/components/ui/card';
  import { Button } from '$lib/components/ui/button';
  import { Badge } from '$lib/components/ui/badge';
  import { Label } from '$lib/components/ui/label';
  import * as Accordion from '$lib/components/ui/accordion';
  import * as Dialog from '$lib/components/ui/dialog';
  import { cn } from '$lib/utils';
  import {
    SEVERITY_STYLES,
    LEVEL_STYLES,
    VIOLATION_LABELS,
    professorRecommendation,
    evidenceHint,
  } from '$lib/report-ui.js';

  let report = null;
  let loading = true;
  let error = '';
  let showAllViolations = false;
  let eventFilterType = '';
  let eventSort = 'time-desc';
  /** @type {'visual' | 'all'} */
  let eventEvidenceFilter = 'visual';
  let reportTab = 'general';
  let snapshotPreviewOpen = false;
  let snapshotPreviewUrl = '';
  let snapshotPreviewTitle = '';

  function statusValue(status) {
    return typeof status === 'string' ? status : status?.value ?? status;
  }

  function violationLabel(type) {
    return VIOLATION_LABELS[type] ?? type;
  }

  function statusLabel(status) {
    const v = statusValue(status);
    if (v === 'active') return 'En supervisión';
    if (v === 'aborted') return 'Interrumpido';
    return 'Finalizado';
  }

  function fmtTime(iso) {
    if (!iso) return '—';
    return new Date(iso).toLocaleTimeString('es', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
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
  $: levelStyle = ra ? (LEVEL_STYLES[ra.level] ?? LEVEL_STYLES.bajo) : null;
  $: sessionActive = report && statusValue(report.status) === 'active';
  $: backHref = report?.exam_id
    ? `/exams/${report.exam_id}/sessions`
    : '/exams';

  $: eventTypeOptions = report?.violations?.length
    ? [...new Set(report.violations.map((v) => v.violation_type))].sort()
    : [];

  $: filteredViolations = (() => {
    if (!report?.violations?.length) return [];
    let list = [...report.violations];
    if (eventEvidenceFilter === 'visual') {
      list = list.filter((v) => v.frame_snapshot);
    }
    if (eventFilterType) {
      list = list.filter((v) => v.violation_type === eventFilterType);
    }
    list.sort((a, b) => {
      const aSnap = a.frame_snapshot ? 1 : 0;
      const bSnap = b.frame_snapshot ? 1 : 0;
      if (bSnap !== aSnap) return bSnap - aSnap;
      if (eventSort === 'time-asc') {
        return new Date(a.detected_at) - new Date(b.detected_at);
      }
      return new Date(b.detected_at) - new Date(a.detected_at);
    });
    return list;
  })();

  function openSnapshotPreview(url, title) {
    snapshotPreviewUrl = url;
    snapshotPreviewTitle = title;
    snapshotPreviewOpen = true;
  }

  $: visibleViolations = showAllViolations
    ? filteredViolations
    : filteredViolations.slice(0, 6);

  $: topTypes = report?.violations_by_type
    ? Object.entries(report.violations_by_type)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
    : [];

  onMount(async () => {
    initAuth();
    if (get(authStore)?.role !== 'PROFESSOR') {
      goto('/exams');
      return;
    }

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

<div class="mx-auto max-w-5xl space-y-6 px-4 py-8 sm:px-6">
  <PageHeader
    focus="Reporte docente"
    title="Reporte de supervisión"
    subtitle={report
      ? `${report.student_name ?? report.student_id}${report.student_email ? ` · ${report.student_email}` : ''} — ${report.exam_name ?? report.exam_id}${report.exam_code ? ` (${report.exam_code})` : ''}`
      : 'Detalle de la sesión supervisada'}
  >
    <svelte:fragment slot="actions">
      <Button variant="outline" size="sm" href={backHref}>← Volver a supervisiones</Button>
    </svelte:fragment>
  </PageHeader>

  {#if loading}
    <div class="flex flex-col items-center gap-3 py-16 text-muted-foreground">
      <span class="report-spinner" aria-hidden="true"></span>
      <p class="text-sm">Cargando reporte…</p>
    </div>
  {:else if error}
    <Card.Root class="rounded-xl border-destructive/40">
      <Card.Content class="pt-6">
        <p class="text-sm text-destructive">{error}</p>
      </Card.Content>
    </Card.Root>
  {:else if !report}
    <Card.Root class="rounded-xl">
      <Card.Content class="pt-6">
        <p class="text-sm text-muted-foreground">No se encontró información para esta sesión.</p>
      </Card.Content>
    </Card.Root>
  {:else if sessionActive}
    <Card.Root class="rounded-xl border-amber-500/30 bg-amber-500/5 dark:bg-amber-500/10">
      <Card.Header>
        <Card.Title>Sesión en curso</Card.Title>
        <Card.Description>
          El estudiante aún está en supervisión. El reporte completo estará disponible cuando finalice
          la sesión.
        </Card.Description>
      </Card.Header>
      <Card.Content class="space-y-3 text-sm">
        <p>
          <span class="text-muted-foreground">Inicio:</span>
          {fmtDateTime(report.started_at)}
        </p>
        <p>
          <span class="text-muted-foreground">Eventos registrados hasta ahora:</span>
          <strong class="ml-1">{report.total_violations ?? 0}</strong>
        </p>
        <Button variant="outline" size="sm" href={backHref}>Volver a supervisiones</Button>
      </Card.Content>
    </Card.Root>
  {:else}
    <!-- Meta row -->
    <div class="flex flex-wrap gap-2 text-sm text-muted-foreground">
      <span>{fmtDateTime(report.started_at)}</span>
      <span aria-hidden="true">·</span>
      <span>Fin: {fmtDateTime(report.ended_at)}</span>
      <span aria-hidden="true">·</span>
      <span>Duración: {fmtDuration(report.duration_seconds)}</span>
      <Badge variant="outline">{statusLabel(report.status)}</Badge>
    </div>

    <!-- Tabs -->
    <div
      class="flex gap-1 rounded-lg border border-border bg-muted/40 p-1"
      role="tablist"
      aria-label="Secciones del reporte"
    >
      <button
        type="button"
        role="tab"
        aria-selected={reportTab === 'general'}
        class={cn(
          'flex-1 rounded-md px-4 py-2 text-sm font-medium transition-colors',
          reportTab === 'general'
            ? 'bg-card text-foreground shadow-sm'
            : 'text-muted-foreground hover:text-foreground'
        )}
        onclick={() => (reportTab = 'general')}
      >
        General
      </button>
      <button
        type="button"
        role="tab"
        aria-selected={reportTab === 'specific'}
        class={cn(
          'flex-1 rounded-md px-4 py-2 text-sm font-medium transition-colors',
          reportTab === 'specific'
            ? 'bg-card text-foreground shadow-sm'
            : 'text-muted-foreground hover:text-foreground'
        )}
        onclick={() => (reportTab = 'specific')}
      >
        Específico
      </button>
    </div>

    {#if reportTab === 'general'}
      {#if ra}
        <section
          class={cn(
            'flex flex-col gap-4 rounded-xl border p-5 sm:flex-row sm:items-start sm:gap-6',
            levelStyle.card
          )}
        >
          <div
            class={cn(
              'flex h-24 w-24 shrink-0 flex-col items-center justify-center rounded-full border-4 bg-card',
              levelStyle.ring
            )}
          >
            <span class={cn('text-3xl font-black leading-none', levelStyle.score)}>{ra.score}</span>
            <span class={cn('text-xs font-semibold opacity-80', levelStyle.score)}>/ 100</span>
          </div>
          <div class="min-w-0 flex-1 space-y-3">
            <p class={cn('text-lg font-semibold', levelStyle.score)}>{ra.level_label}</p>
            <p class="text-sm leading-relaxed text-foreground">{ra.summary}</p>
            <p class="rounded-lg border border-border/60 bg-card/60 p-3 text-sm text-muted-foreground">
              <strong class="text-foreground">Recomendación:</strong>
              {professorRecommendation(ra.level)}
            </p>
            {#if ra.critical_findings?.length > 0}
              <div class="space-y-2">
                <p class="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Hallazgos clave
                </p>
                <div class="flex flex-wrap gap-2">
                  {#each ra.critical_findings as f}
                    <Badge variant="destructive" class="font-normal">{f}</Badge>
                  {/each}
                </div>
              </div>
            {/if}
            {#if ra.behavioral_notes?.length > 0}
              <div class="flex flex-wrap gap-2">
                {#each ra.behavioral_notes as n}
                  <Badge variant="secondary" class="font-normal">{n}</Badge>
                {/each}
              </div>
            {/if}
          </div>
        </section>
      {/if}

      <div class="grid gap-4 sm:grid-cols-3">
        <Card.Root class="rounded-xl">
          <Card.Header class="pb-2">
            <Card.Description>Eventos totales</Card.Description>
            <Card.Title class="text-2xl">{report.total_violations ?? 0}</Card.Title>
          </Card.Header>
        </Card.Root>
        <Card.Root class="rounded-xl">
          <Card.Header class="pb-2">
            <Card.Description>Tipos distintos</Card.Description>
            <Card.Title class="text-2xl">{Object.keys(report.violations_by_type ?? {}).length}</Card.Title>
          </Card.Header>
        </Card.Root>
        <Card.Root class="rounded-xl">
          <Card.Header class="pb-2">
            <Card.Description>Picos temporales</Card.Description>
            <Card.Title class="text-2xl">{ra?.suspicious_clusters?.length ?? 0}</Card.Title>
          </Card.Header>
        </Card.Root>
      </div>

      {#if topTypes.length > 0}
        <Card.Root class="rounded-xl">
          <Card.Header>
            <Card.Title class="text-base">Señales más frecuentes</Card.Title>
          </Card.Header>
          <Card.Content class="space-y-2">
            {#each topTypes as [type, count]}
              <div class="flex items-center justify-between text-sm">
                <span>{violationLabel(type)}</span>
                <Badge variant="secondary">{count}</Badge>
              </div>
            {/each}
          </Card.Content>
        </Card.Root>
      {/if}

      {#if ra?.alerts?.length > 0}
        <Card.Root class="rounded-xl">
          <Card.Header>
            <Card.Title class="text-base">Alertas resumidas</Card.Title>
            <Card.Description>
              Vista rápida. El detalle completo está en la pestaña Específico.
            </Card.Description>
          </Card.Header>
          <Card.Content class="space-y-3">
            {#each ra.alerts.slice(0, 5) as alert}
              {@const meta = SEVERITY_STYLES[alert.severity] ?? SEVERITY_STYLES.bajo}
              <article class={cn('rounded-lg border p-3', meta.card)}>
                <div class="mb-1 flex items-center justify-between gap-2">
                  <Badge class={meta.badge}>{meta.label}</Badge>
                  {#if alert.evidence_count > 0}
                    <span class="text-xs text-muted-foreground">{evidenceHint(alert.evidence_count)}</span>
                  {/if}
                </div>
                <h3 class={cn('text-sm font-semibold', meta.text)}>{alert.title}</h3>
                <p class="mt-1 line-clamp-2 text-sm text-muted-foreground">{alert.description}</p>
              </article>
            {/each}
            {#if ra.alerts.length > 5}
              <Button variant="ghost" size="sm" class="w-full" onclick={() => (reportTab = 'specific')}>
                Ver {ra.alerts.length - 5} alertas más en Específico →
              </Button>
            {/if}
          </Card.Content>
        </Card.Root>
      {:else if ra}
        <Card.Root class="rounded-xl">
          <Card.Content class="pt-6">
            <p class="text-sm text-muted-foreground">
              No se generaron alertas. El comportamiento no presentó señales relevantes para revisión
              adicional.
            </p>
          </Card.Content>
        </Card.Root>
      {/if}

      <p class="text-center text-sm text-muted-foreground">
        ¿Necesitas evidencia detallada?
        <button
          type="button"
          class="font-medium text-primary underline-offset-4 hover:underline"
          onclick={() => (reportTab = 'specific')}
        >
          Abrir apartado Específico
        </button>
      </p>
    {:else}
      <!-- Específico -->
      <Card.Root class="rounded-xl">
        <Card.Header>
          <Card.Title class="text-base">Cómo interpretar este reporte</Card.Title>
        </Card.Header>
        <Card.Content>
          <ul class="list-inside list-disc space-y-1 text-sm text-muted-foreground">
            <li><strong class="text-foreground">Score (0–100):</strong> lectura general del riesgo.</li>
            <li><strong class="text-foreground">Alertas:</strong> patrones con evidencia asociada.</li>
            <li><strong class="text-foreground">Eventos:</strong> registro cronológico con capturas cuando existen.</li>
            <li><strong class="text-foreground">Picos:</strong> concentración de señales en poco tiempo.</li>
          </ul>
        </Card.Content>
      </Card.Root>

      {#if ra?.alerts?.length > 0}
        <Card.Root class="rounded-xl">
          <Card.Header>
            <Card.Title class="text-base">Todas las alertas</Card.Title>
          </Card.Header>
          <Card.Content class="space-y-3">
            {#each ra.alerts as alert}
              {@const meta = SEVERITY_STYLES[alert.severity] ?? SEVERITY_STYLES.bajo}
              <article class={cn('rounded-lg border p-4', meta.card)}>
                <div class="mb-2 flex items-center justify-between gap-2">
                  <Badge class={meta.badge}>{meta.label}</Badge>
                  {#if alert.evidence_count > 0}
                    <span class="text-xs text-muted-foreground">{evidenceHint(alert.evidence_count)}</span>
                  {/if}
                </div>
                <h3 class={cn('font-semibold', meta.text)}>{alert.title}</h3>
                <p class="mt-2 text-sm leading-relaxed text-foreground">{alert.description}</p>
                {#if alert.first_at}
                  <p class="mt-2 text-xs text-muted-foreground">
                    Primera: {fmtTime(alert.first_at)}
                    {#if alert.last_at && alert.last_at !== alert.first_at}
                      · Última: {fmtTime(alert.last_at)}
                    {/if}
                  </p>
                {/if}
              </article>
            {/each}
          </Card.Content>
        </Card.Root>
      {/if}

      {#if ra?.suspicious_clusters?.length > 0}
        <Card.Root class="rounded-xl">
          <Card.Header>
            <Card.Title class="text-base">Concentraciones temporales</Card.Title>
            <Card.Description>3 o más señales en menos de 90 segundos.</Card.Description>
          </Card.Header>
          <Card.Content class="divide-y divide-border">
            {#each ra.suspicious_clusters as cluster, i}
              <div class="flex gap-3 py-3 first:pt-0 last:pb-0">
                <span
                  class="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-bold text-muted-foreground"
                >
                  {i + 1}
                </span>
                <div class="min-w-0 flex-1">
                  <p class="text-sm font-medium">
                    {fmtTime(cluster.window_start)} – {fmtTime(cluster.window_end)}
                  </p>
                  <p class="text-xs text-muted-foreground">{cluster.violation_count} eventos</p>
                  <div class="mt-2 flex flex-wrap gap-1">
                    {#each cluster.violation_types as t}
                      <Badge variant="outline" class="text-xs">{violationLabel(t)}</Badge>
                    {/each}
                  </div>
                </div>
              </div>
            {/each}
          </Card.Content>
        </Card.Root>
      {/if}

      <Card.Root class="rounded-xl">
        <Card.Header>
          <Card.Title class="text-base">Desglose por tipo</Card.Title>
        </Card.Header>
        <Card.Content>
          {#if Object.keys(report.violations_by_type ?? {}).length === 0}
            <p class="text-sm text-muted-foreground">No se registraron eventos.</p>
          {:else}
            {@const maxCount = Math.max(...Object.values(report.violations_by_type))}
            <div class="space-y-3">
              {#each Object.entries(report.violations_by_type).sort((a, b) => b[1] - a[1]) as [type, count]}
                <div class="grid grid-cols-[1fr_auto] items-center gap-3 text-sm">
                  <div>
                    <span class="font-medium">{violationLabel(type)}</span>
                    <div class="mt-1 h-2 overflow-hidden rounded-full bg-muted">
                      <div
                        class="h-full rounded-full bg-primary transition-all"
                        style="width: {Math.min((count / maxCount) * 100, 100)}%"
                      ></div>
                    </div>
                  </div>
                  <span class="font-semibold tabular-nums">{count}</span>
                </div>
              {/each}
            </div>
          {/if}
        </Card.Content>
      </Card.Root>

      <Card.Root class="rounded-xl">
        <Card.Header class="flex flex-row items-center justify-between gap-2">
          <Card.Title class="text-base">Eventos con evidencia</Card.Title>
          {#if filteredViolations.length > 6}
            <Button variant="ghost" size="sm" onclick={() => (showAllViolations = !showAllViolations)}>
              {showAllViolations ? 'Ocultar' : `Ver todos (${filteredViolations.length})`}
            </Button>
          {/if}
        </Card.Header>
        <Card.Content class="space-y-4">
          {#if !report.violations?.length}
            <p class="text-sm text-muted-foreground">No se registraron eventos en esta sesión.</p>
          {:else}
            <div class="flex flex-wrap gap-4 rounded-lg border border-border bg-muted/30 p-4">
              <div class="flex flex-wrap gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant={eventEvidenceFilter === 'visual' ? 'default' : 'outline'}
                  onclick={() => (eventEvidenceFilter = 'visual')}
                >
                  Con evidencia visual
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant={eventEvidenceFilter === 'all' ? 'default' : 'outline'}
                  onclick={() => (eventEvidenceFilter = 'all')}
                >
                  Todos los eventos
                </Button>
              </div>
              <label class="min-w-[160px] flex-1 space-y-1.5">
                <Label>Tipo de señal</Label>
                <select
                  bind:value={eventFilterType}
                  class="flex h-9 w-full rounded-lg border border-input bg-background px-3 text-sm"
                >
                  <option value="">Todos</option>
                  {#each eventTypeOptions as t}
                    <option value={t}>{violationLabel(t)}</option>
                  {/each}
                </select>
              </label>
              <label class="min-w-[160px] flex-1 space-y-1.5">
                <Label>Orden</Label>
                <select
                  bind:value={eventSort}
                  class="flex h-9 w-full rounded-lg border border-input bg-background px-3 text-sm"
                >
                  <option value="time-desc">Hora: más recientes</option>
                  <option value="time-asc">Hora: más antiguos</option>
                </select>
              </label>
            </div>
            {#if filteredViolations.length === 0}
              <p class="text-sm text-muted-foreground">
                {#if eventEvidenceFilter === 'visual'}
                  Todo en orden en este tramo (sin capturas en el filtro actual). Prueba «Todos los
                  eventos» si esperabas más evidencia.
                {:else}
                  Ningún evento coincide con el filtro actual.
                {/if}
              </p>
            {:else}
              <div class="relative space-y-0 border-l border-border pl-6">
                {#each visibleViolations as v, i}
                  <article class="relative pb-8 last:pb-0">
                    <span
                      class="absolute -left-[1.55rem] top-1.5 size-2.5 rounded-full border-2 border-background bg-primary ring-2 ring-primary/20"
                      aria-hidden="true"
                    ></span>
                    <div class="mb-3 flex flex-wrap items-center gap-2 text-sm">
                      <span class="tabular-nums text-muted-foreground">{fmtTime(v.detected_at)}</span>
                      <span class="font-semibold text-foreground">{violationLabel(v.violation_type)}</span>
                    </div>
                    {#if v.frame_snapshot}
                      <button
                        type="button"
                        class="block w-full overflow-hidden rounded-xl border border-border bg-muted/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        onclick={() =>
                          openSnapshotPreview(
                            v.frame_snapshot,
                            violationLabel(v.violation_type)
                          )}
                      >
                        <img
                          src={v.frame_snapshot}
                          alt="Evidencia: {violationLabel(v.violation_type)}"
                          class="aspect-video w-full object-cover"
                        />
                      </button>
                      <p class="mt-2 text-xs text-muted-foreground">Clic para ampliar la captura</p>
                    {:else}
                      <p class="text-sm text-muted-foreground">Sin captura en este momento</p>
                    {/if}
                  </article>
                {/each}
                {#if !showAllViolations && filteredViolations.length > 6}
                  <Button
                    variant="outline"
                    size="sm"
                    class="w-full"
                    onclick={() => (showAllViolations = true)}
                  >
                    Ver {filteredViolations.length - 6} eventos más…
                  </Button>
                {/if}
              </div>
            {/if}
          {/if}
        </Card.Content>
      </Card.Root>

      <Accordion.Root type="single" class="rounded-xl border border-border bg-card px-4">
        <Accordion.Item value="tech">
          <Accordion.Trigger class="py-4 text-sm font-semibold">Datos técnicos</Accordion.Trigger>
          <Accordion.Content>
            <div class="space-y-2 pb-4 font-mono text-xs">
              <div class="flex justify-between gap-4 rounded-lg border border-border bg-muted/30 p-2">
                <span class="text-muted-foreground">session_id</span>
                <code class="break-all text-foreground">{report.id}</code>
              </div>
              <div class="flex justify-between gap-4 rounded-lg border border-border bg-muted/30 p-2">
                <span class="text-muted-foreground">exam_id</span>
                <code class="break-all text-foreground">{report.exam_id}</code>
              </div>
              <div class="flex justify-between gap-4 rounded-lg border border-border bg-muted/30 p-2">
                <span class="text-muted-foreground">student_id</span>
                <code class="break-all text-foreground">{report.student_id}</code>
              </div>
            </div>
          </Accordion.Content>
        </Accordion.Item>
      </Accordion.Root>
    {/if}
  {/if}
</div>

<Dialog.Root bind:open={snapshotPreviewOpen}>
  <Dialog.Content class="max-w-3xl">
    <Dialog.Header>
      <Dialog.Title>{snapshotPreviewTitle}</Dialog.Title>
      <Dialog.Description>Evidencia visual del evento</Dialog.Description>
    </Dialog.Header>
    {#if snapshotPreviewUrl}
      <img
        src={snapshotPreviewUrl}
        alt={snapshotPreviewTitle}
        class="max-h-[70vh] w-full rounded-lg border border-border object-contain bg-muted/30"
      />
    {:else}
      <p class="text-sm text-muted-foreground">Captura no disponible en este entorno.</p>
    {/if}
    <Dialog.Footer>
      <Button type="button" variant="outline" onclick={() => (snapshotPreviewOpen = false)}>
        Cerrar
      </Button>
    </Dialog.Footer>
  </Dialog.Content>
</Dialog.Root>

<style>
  .report-spinner {
    width: 1.5rem;
    height: 1.5rem;
    border: 3px solid var(--border);
    border-top-color: var(--primary);
    border-radius: 50%;
    animation: report-spin 0.7s linear infinite;
  }
  @keyframes report-spin {
    to {
      transform: rotate(360deg);
    }
  }
</style>
