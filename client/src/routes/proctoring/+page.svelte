<script>
  import { onMount, onDestroy, tick } from 'svelte';
  import { get } from 'svelte/store';
  import { goto } from '$app/navigation';
  import ProctoringMonitor from '$lib/components/ProctoringMonitor.svelte';
  import ExamCountdown from '$lib/components/ExamCountdown.svelte';
  import PageHeader from '$lib/components/PageHeader.svelte';
  import { authStore } from '$lib/auth.js';
  import { examStore } from '$lib/exam-store.js';
  import { endSession, getExamsSummary, getSessionsByExam } from '$lib/proctoring-api.js';

  let examId = '';
  let studentId = '';
  let selectedExam = null;
  let sessionStats = null;
  let violationLog = [];
  let sessionId = null;
  let hasExpired = false;
  let expiredAt = null;

  // Tabs on the right panel: 'monitor' | 'activities'
  let activeTab = 'monitor';

  // Data for "Actividades" (teacher view)
  let exams = [];
  let examsLoading = false;
  let examsError = '';

  let selectedExamId = null;
  let sessions = [];
  let sessionsLoading = false;
  let sessionsError = '';
  $: isProfessor = $authStore?.role === 'PROFESSOR';

  let pollHandle = null;

  function handleViolation(event) {
    const timestamp = new Date().toLocaleTimeString();
    event.detail.violations.forEach((v) => {
      violationLog = [{ ...v, timestamp }, ...violationLog].slice(0, 50);
    });
  }

  function handleEnded(event) {
    sessionStats = event.detail.stats;
    if (!isProfessor) {
      // Si terminó normalmente, limpiar el examen activo.
      examStore.set(null);
      selectedExam = null;
      examId = '';
    }
  }

  function handleStarted(event) {
    sessionId = event.detail.sessionId;
  }

  async function handleExpired() {
    if (hasExpired) return;
    hasExpired = true;
    expiredAt = new Date().toISOString();

    const current = get(examStore);
    if (current) {
      examStore.set({ ...current, expired_at: expiredAt });
    }

    // Unmount del monitor -> su onDestroy detiene cámara.
    // Extra: intentar cerrar sesión de proctoring si ya existe sessionId.
    if (sessionId) {
      try {
        await endSession(sessionId);
      } catch {
        // ignore (puede ya estar terminada por el propio monitor)
      }
    }
  }

  function violationLabel(type) {
    const labels = {
      multiple_persons: 'Varias personas',
      no_person: 'Persona ausente',
      looking_away: 'Mirando a otro lado',
      phone_detected: 'Uso de teléfono',
      tab_switch: 'Cambio de pestaña',
      window_blur: 'Pérdida de foco',
      identity_mismatch: 'Posible sustitución de persona',
    };
    return labels[type] ?? type;
  }

  function statusLabel(status) {
    if (!status) return '';
    const v = typeof status === 'string' ? status : status.value ?? status;
    return v === 'active' ? 'Activo' : 'Finalizado';
  }

  async function loadExams() {
    try {
      examsLoading = true;
      examsError = '';
      exams = await getExamsSummary();
    } catch (e) {
      examsError = e.message ?? 'No se pudo cargar la lista de actividades';
    } finally {
      examsLoading = false;
    }
  }

  async function loadSessionsForExam(examIdToLoad) {
    if (!examIdToLoad) return;
    try {
      sessionsLoading = true;
      sessionsError = '';
      sessions = await getSessionsByExam(examIdToLoad);
    } catch (e) {
      sessionsError = e.message ?? 'No se pudieron cargar las sesiones';
    } finally {
      sessionsLoading = false;
    }
  }

  function handleSelectExam(examIdToSelect) {
    selectedExamId = examIdToSelect;
    loadSessionsForExam(examIdToSelect);
  }

  function switchTab(tab) {
    activeTab = tab;
    if (tab === 'activities' && exams.length === 0 && !examsLoading) {
      loadExams();
    }
  }

  async function tickPolling() {
    if (activeTab !== 'activities') return;
    await loadExams();
    if (selectedExamId) {
      await loadSessionsForExam(selectedExamId);
    }
  }

  function openReport(sessionId) {
    goto(`/proctoring/report/${sessionId}`);
  }

  onMount(async () => {
    await tick();

    const auth = get(authStore);

    if (!auth?.token) {
      goto('/login');
      return;
    }

    if (auth.role === 'PROFESSOR') {
      goto('/exams');
      return;
    }

    if (auth.role !== 'STUDENT') {
      goto('/');
      return;
    }

    studentId = auth?.user?.id ?? '';
    const exam = get(examStore);
    if (!exam?.id) {
      goto('/join-exam');
      return;
    }
    // Si ya expiró previamente (persistido), mostrar pantalla final.
    if (exam?.expired_at) {
      selectedExam = exam;
      examId = exam.id;
      hasExpired = true;
      expiredAt = exam.expired_at;
      return;
    }
    selectedExam = exam;
    examId = exam.id;

    pollHandle = setInterval(tickPolling, 5000);
  });

  onDestroy(() => {
    if (pollHandle) clearInterval(pollHandle);
  });
</script>

<svelte:head>
  <title>Supervisión | Procto</title>
</svelte:head>

<div class="page">
  <PageHeader
    focus="Supervisión"
    title="Examen supervisado"
    subtitle="Activa la cámara para esta sesión y revisa las señales mientras dura la prueba."
  />

  {#if !isProfessor && selectedExam?.ends_at}
    <div class="countdown-wrap" aria-label="Tiempo restante">
      <ExamCountdown endsAt={selectedExam.ends_at} onExpired={handleExpired} />
    </div>
  {/if}

  <div class="layout">
    <!-- Left: Config + Monitor -->
    <div class="layout__left">
      <div class="config-card">
        <h2 class="config-card__title">Configuración de sesión</h2>
        {#if isProfessor}
          <label class="field">
            <span class="field__label">Código de examen</span>
            <input
              class="field__input"
              type="text"
              bind:value={examId}
              placeholder="ej. ABC123"
            />
          </label>
          <label class="field">
            <span class="field__label">Identificador del participante</span>
            <input
              class="field__input"
              type="text"
              bind:value={studentId}
              placeholder="Tu nombre o email"
            />
          </label>
        {:else}
          <div class="field">
            <span class="field__label">Examen seleccionado</span>
            <p class="field__readonly">
              {selectedExam?.name ?? 'Sin examen'} · Código {selectedExam?.code ?? '—'}
            </p>
          </div>
          <div class="field">
            <span class="field__label">Participante</span>
            <p class="field__readonly">{studentId || 'No identificado'}</p>
          </div>
        {/if}
      </div>

      {#if hasExpired}
        <section class="card finished-card">
          <h2 class="card__title">Examen finalizado</h2>
          <p class="finished-card__meta">
            <strong>{selectedExam?.name ?? 'Examen'}</strong>
            {#if expiredAt}
              · Finalizado: {new Date(expiredAt).toLocaleString()}
            {/if}
          </p>
          <p class="finished-card__hint">
            El tiempo de la prueba se agotó. Esta sesión quedó cerrada y ya no es posible continuar.
          </p>
        </section>
      {:else}
        <ProctoringMonitor
          {examId}
          {studentId}
          on:started={handleStarted}
          on:violation={handleViolation}
          on:ended={handleEnded}
        />
      {/if}
    </div>

    <!-- Right: Monitor / Activities -->
    <div class="layout__right">
      {#if isProfessor}
        <div class="tabs">
          <button
            class="tabs__tab"
            class:tabs__tab--active={activeTab === 'monitor'}
            type="button"
            on:click={() => switchTab('monitor')}
          >
            Monitor en vivo
          </button>
          <button
            class="tabs__tab"
            class:tabs__tab--active={activeTab === 'activities'}
            type="button"
            on:click={() => switchTab('activities')}
          >
            Actividades
          </button>
        </div>

        {#if activeTab === 'monitor'}
          {#if sessionStats}
            <div class="stats-card">
              <h2 class="stats-card__title">Resumen de sesión</h2>
              <p class="stat-row">
                <span>Total violaciones:</span>
                <strong>{sessionStats.total_violations}</strong>
              </p>
              {#each Object.entries(sessionStats.violations_by_type) as [type, count]}
                <p class="stat-row">
                  <span>{violationLabel(type)}:</span>
                  <strong>{count}</strong>
                </p>
              {/each}
            </div>
          {/if}

          {#if violationLog.length > 0}
            <div class="log-card">
              <h2 class="log-card__title">Registro de violaciones</h2>
              <div class="log-list">
                {#each violationLog as entry}
                  <div class="log-entry log-entry--{entry.violation_type}">
                    <span class="log-entry__time">{entry.timestamp}</span>
                    <span class="log-entry__type">{violationLabel(entry.violation_type)}</span>
                    <span class="log-entry__conf">{(entry.confidence * 100).toFixed(0)}%</span>
                  </div>
                {/each}
              </div>
            </div>
          {:else}
            <div class="empty-log">
              <p>No se han detectado violaciones aún.</p>
              <p class="empty-log__hint">Inicia la supervisión para comenzar el monitoreo.</p>
            </div>
          {/if}
        {:else}
          <div class="activities">
            <div class="card activities__card">
              <div class="activities__header">
                <div>
                  <h2 class="activities__title">Actividades por examen</h2>
                  <p class="activities__subtitle">
                    Resumen por examen: cantidad de participantes supervisados y última actividad.
                  </p>
                </div>
                <button
                  class="btn btn--ghost btn--sm"
                  type="button"
                  on:click={loadExams}
                  disabled={examsLoading}
                >
                  Recargar
                </button>
              </div>

              {#if examsLoading && exams.length === 0}
                <p class="activities__info">Cargando actividades…</p>
              {:else if examsError}
                <p class="activities__error">{examsError}</p>
              {:else if exams.length === 0}
                <p class="activities__info">
                  Aún no hay supervisiones registradas. Cuando se inicie una sesión desde el monitor en vivo,
                  aparecerá aquí.
                </p>
              {:else}
                <div class="table table--exams">
                  <div class="table__head">
                    <div class="table__row">
                      <div class="table__cell table__cell--header">ID Examen</div>
                      <div class="table__cell table__cell--header table__cell--center"># Participantes</div>
                      <div class="table__cell table__cell--header table__cell--right">Última actividad</div>
                      <div class="table__cell table__cell--header table__cell--icon"></div>
                    </div>
                  </div>
                  <div class="table__body">
                    {#each exams as exam}
                      <button
                        type="button"
                        class="table__row table__row--clickable"
                        on:click={() => handleSelectExam(exam.exam_id)}
                      >
                        <div class="table__cell">
                          <span class="badge badge--exam">{exam.exam_id}</span>
                        </div>
                        <div class="table__cell table__cell--center">
                          <strong>{exam.students_count}</strong>
                        </div>
                        <div class="table__cell table__cell--right">
                          {#if exam.last_activity}
                            {new Date(exam.last_activity).toLocaleString()}
                          {:else}
                            —
                          {/if}
                        </div>
                        <div class="table__cell table__cell--icon">
                          <span class="row-arrow">➜</span>
                        </div>
                      </button>
                    {/each}
                  </div>
                </div>
              {/if}
            </div>

            <div class="card activities__card">
              <div class="activities__header">
                <div>
                  <h2 class="activities__title">
                    {#if selectedExamId}
                      Sesiones del examen <span class="badge badge--exam-inline">{selectedExamId}</span>
                    {:else}
                      Sesiones por participante
                    {/if}
                  </h2>
                  <p class="activities__subtitle">
                    Para ver el detalle por participante, selecciona primero un examen en la tabla superior.
                  </p>
                </div>
              </div>

              {#if !selectedExamId}
                <p class="activities__info">
                  Selecciona un examen en la tabla superior para ver sus sesiones.
                </p>
              {:else if sessionsLoading && sessions.length === 0}
                <p class="activities__info">Cargando sesiones…</p>
              {:else if sessionsError}
                <p class="activities__error">{sessionsError}</p>
              {:else if sessions.length === 0}
                <p class="activities__info">
                  Aún no hay sesiones registradas para este examen.
                </p>
              {:else}
                <div class="table table--sessions">
                  <div class="table__head">
                    <div class="table__row">
                      <div class="table__cell table__cell--header">ID participante</div>
                      <div class="table__cell table__cell--header">Inicio</div>
                      <div class="table__cell table__cell--header">Fin</div>
                      <div class="table__cell table__cell--header table__cell--right">Estado</div>
                    </div>
                  </div>
                  <div class="table__body">
                    {#each sessions as s}
                      <div class="table__row">
                        <div class="table__cell">
                          <span class="badge badge--student">{s.student_id}</span>
                        </div>
                        <div class="table__cell">
                          {new Date(s.started_at).toLocaleString()}
                        </div>
                        <div class="table__cell">
                          {#if s.ended_at}
                            {new Date(s.ended_at).toLocaleString()}
                          {:else}
                            —
                          {/if}
                        </div>
                        <div class="table__cell table__cell--right">
                          {#if (typeof s.status === 'string' ? s.status : s.status.value ?? s.status) === 'ended'}
                            <button
                              type="button"
                              class="status-pill status-pill--clickable"
                              on:click={() => openReport(s.id)}
                            >
                              {statusLabel(s.status)}
                            </button>
                          {:else}
                            <span class="status-pill status-pill--active">
                              {statusLabel(s.status)}
                            </span>
                          {/if}
                        </div>
                      </div>
                    {/each}
                  </div>
                </div>
              {/if}
            </div>
          </div>
        {/if}
      {:else}
        {#if sessionStats}
          <div class="stats-card">
            <h2 class="stats-card__title">Resumen de sesión</h2>
            <p class="stat-row">
              <span>Total violaciones:</span>
              <strong>{sessionStats.total_violations}</strong>
            </p>
            {#each Object.entries(sessionStats.violations_by_type) as [type, count]}
              <p class="stat-row">
                <span>{violationLabel(type)}:</span>
                <strong>{count}</strong>
              </p>
            {/each}
          </div>
        {/if}

        {#if violationLog.length > 0}
          <div class="log-card">
            <h2 class="log-card__title">Registro de violaciones</h2>
            <div class="log-list">
              {#each violationLog as entry}
                <div class="log-entry log-entry--{entry.violation_type}">
                  <span class="log-entry__time">{entry.timestamp}</span>
                  <span class="log-entry__type">{violationLabel(entry.violation_type)}</span>
                  <span class="log-entry__conf">{(entry.confidence * 100).toFixed(0)}%</span>
                </div>
              {/each}
            </div>
          </div>
        {:else}
          <div class="empty-log">
            <p>No se han detectado violaciones aún.</p>
            <p class="empty-log__hint">Inicia la supervisión para comenzar el monitoreo.</p>
          </div>
        {/if}
      {/if}
    </div>
  </div>
</div>

<style>
  .page { max-width: 1200px; margin: 0 auto; padding: 0 0 2rem; }

  .countdown-wrap {
    display: flex;
    justify-content: flex-end;
    margin: 0 0 1rem;
  }

  .finished-card {
    max-width: 640px;
  }

  .finished-card__meta {
    margin: 0 0 0.6rem;
    color: var(--procto-text);
  }

  .finished-card__hint {
    margin: 0;
    color: var(--procto-text-secondary);
    font-size: 0.92rem;
    line-height: 1.6;
  }

  .layout { display: grid; grid-template-columns: 1fr 1.15fr; gap: 2rem; align-items: start; }
  @media (max-width: 768px) { .layout { grid-template-columns: 1fr; } }

  .config-card {
    background: var(--procto-surface, #fff);
    border-radius: var(--procto-radius, 12px);
    padding: 1.25rem 1.5rem;
    box-shadow: var(--procto-shadow-card, 0 1px 2px rgba(0, 0, 0, 0.04));
    border: 1px solid var(--procto-border, rgba(0, 0, 0, 0.08));
    margin-bottom: 1.25rem;
  }
  .config-card__title { font-size: 1rem; font-weight: 700; margin: 0 0 1rem; color: #374151; }

  .field { display: flex; flex-direction: column; gap: 0.35rem; margin-bottom: 0.85rem; }
  .field__label { font-size: 0.82rem; font-weight: 600; color: #374151; }
  .field__input {
    padding: 0.5rem 0.75rem;
    border: 1px solid #d1d5db;
    border-radius: 7px;
    font-size: 0.9rem;
    outline: none;
    transition: border-color 0.15s;
  }
  .field__input:focus { border-color: var(--procto-accent, #0071e3); }
  .field__readonly {
    margin: 0;
    padding: 0.55rem 0.75rem;
    border: 1px solid #e5e7eb;
    border-radius: 7px;
    font-size: 0.9rem;
    background: #f9fafb;
    color: #374151;
  }

  .stats-card, .log-card {
    background: var(--procto-surface, #fff);
    border-radius: var(--procto-radius, 12px);
    padding: 1.25rem 1.5rem;
    box-shadow: var(--procto-shadow-card);
    border: 1px solid var(--procto-border);
    margin-bottom: 1.25rem;
  }
  .stats-card__title, .log-card__title {
    font-size: 1rem;
    font-weight: 700;
    margin: 0 0 1rem;
    color: #374151;
  }

  .stat-row {
    display: flex;
    justify-content: space-between;
    font-size: 0.9rem;
    color: #374151;
    margin: 0.4rem 0;
    padding-bottom: 0.4rem;
    border-bottom: 1px solid #f3f4f6;
  }

  .log-list { max-height: 420px; overflow-y: auto; }

  .log-entry {
    display: grid;
    grid-template-columns: auto 1fr auto;
    gap: 0.5rem;
    align-items: center;
    padding: 0.4rem 0.6rem;
    border-radius: 6px;
    margin-bottom: 0.3rem;
    font-size: 0.82rem;
  }
  .log-entry--multiple_persons { background: #fef3c7; }
  .log-entry--no_person        { background: #fee2e2; }
  .log-entry--looking_away     { background: #fef9c3; }
  .log-entry--phone_detected   { background: #fce7f3; }

  .log-entry__time { color: #9ca3af; font-size: 0.75rem; white-space: nowrap; }
  .log-entry__type { font-weight: 600; color: #111827; }
  .log-entry__conf { color: #6b7280; font-size: 0.75rem; white-space: nowrap; }

  .empty-log {
    background: #f9fafb;
    border-radius: 12px;
    padding: 2rem;
    text-align: center;
    color: #6b7280;
  }
  .empty-log p { margin: 0.25rem 0; }
  .empty-log__hint { font-size: 0.83rem; }

  /* Tabs right panel */
  .tabs {
    display: inline-flex;
    background: #e5e7eb;
    border-radius: 999px;
    padding: 0.18rem;
    margin-bottom: 1rem;
  }
  .tabs__tab {
    border: none;
    background: transparent;
    border-radius: 999px;
    padding: 0.32rem 0.9rem;
    font-size: 0.8rem;
    font-weight: 600;
    color: #6b7280;
    cursor: pointer;
    transition: all 0.15s;
  }
  .tabs__tab--active {
    background: #fff;
    color: var(--procto-accent, #0071e3);
    box-shadow: 0 1px 3px rgba(0,0,0,0.08);
  }

  /* Activities panel */
  .activities {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }
  .activities__card {
    margin-bottom: 0;
    padding: 1rem 1.1rem;
  }
  .activities__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
    margin-bottom: 0.75rem;
  }
  .activities__title {
    font-size: 0.98rem;
    font-weight: 700;
    color: #111827;
    margin: 0 0 0.1rem;
  }
  .activities__subtitle {
    font-size: 0.82rem;
    color: #6b7280;
    margin: 0;
  }
  .activities__info {
    font-size: 0.84rem;
    color: #6b7280;
  }
  .activities__error {
    font-size: 0.84rem;
    color: #b91c1c;
  }

  /* Reusable table styles */
  .table {
    width: 100%;
    border-radius: 10px;
    border: 1px solid #e5e7eb;
    overflow: hidden;
    background: #fff;
  }
  .table__head {
    background: #f9fafb;
    border-bottom: 1px solid #e5e7eb;
  }
  .table__row {
    display: grid;
    grid-template-columns: 2fr 1fr 1.5fr auto;
    align-items: center;
    gap: 0.5rem;
    padding: 0.55rem 0.85rem;
    font-size: 0.84rem;
  }
  .table--sessions .table__row {
    grid-template-columns: 1.5fr 1.7fr 1.7fr 1fr;
  }
  .table__row:nth-child(even) .table__cell:not(.table__cell--header) {
    background: #fcfcff;
  }
  .table__row--clickable {
    border: none;
    background: transparent;
    width: 100%;
    text-align: left;
    cursor: pointer;
  }
  .table__row--clickable:hover {
    background: rgba(0, 113, 227, 0.06);
  }
  .table__cell {
    padding: 0.1rem 0.15rem;
  }
  .table__cell--header {
    font-size: 0.78rem;
    font-weight: 600;
    color: #6b7280;
    text-transform: uppercase;
    letter-spacing: 0.04em;
  }
  .table__cell--center {
    text-align: center;
  }
  .table__cell--right {
    text-align: right;
  }
  .table__cell--icon {
    width: 26px;
    text-align: right;
  }

  .row-arrow {
    font-size: 0.9rem;
    color: #9ca3af;
  }

  .badge {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: 0.12rem 0.5rem;
    border-radius: 999px;
    font-size: 0.78rem;
    font-weight: 600;
    white-space: nowrap;
  }
  .badge--exam {
    background: #eef2ff;
    color: #4338ca;
  }
  .badge--exam-inline {
    background: #eef2ff;
    color: #4338ca;
    padding-inline: 0.4rem;
  }
  .badge--student {
    background: #ecfdf3;
    color: #166534;
  }

  .status-pill {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-width: 90px;
    padding: 0.22rem 0.5rem;
    border-radius: 999px;
    font-size: 0.78rem;
    font-weight: 600;
  }
  .status-pill--active {
    background: #ecfdf3;
    color: #15803d;
  }
  .status-pill--clickable {
    background: #fee2e2;
    color: #b91c1c;
    border: none;
    cursor: pointer;
  }
  .status-pill--clickable:hover {
    background: #fecaca;
  }
</style>
