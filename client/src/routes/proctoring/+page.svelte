<script>
  import { onMount, onDestroy } from 'svelte';
  import ProctoringMonitor from '$lib/components/ProctoringMonitor.svelte';
  import { getExamsSummary, getSessionsByExam } from '$lib/proctoring-api.js';

  let examId = '';
  let studentId = '';
  let sessionStats = null;
  let violationLog = [];

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

  let pollHandle = null;

  function handleViolation(event) {
    const timestamp = new Date().toLocaleTimeString();
    event.detail.violations.forEach((v) => {
      violationLog = [{ ...v, timestamp }, ...violationLog].slice(0, 50);
    });
  }

  function handleEnded(event) {
    sessionStats = event.detail.stats;
  }

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
    // Navega a la vista de reporte detallado
    window.location.href = `/proctoring/report/${sessionId}`;
  }

  onMount(() => {
    pollHandle = setInterval(tickPolling, 5000);
  });

  onDestroy(() => {
    if (pollHandle) clearInterval(pollHandle);
  });
</script>

<svelte:head>
  <title>Supervisión de Examen | CheatingAI</title>
</svelte:head>

<div class="page">
  <header class="page__header">
    <h1 class="page__title">Supervisión de Examen por Cámara</h1>
    <p class="page__subtitle">
      Detección en tiempo real de comportamientos sospechosos mediante MediaPipe.
    </p>
  </header>

  <div class="layout">
    <!-- Left: Config + Monitor -->
    <div class="layout__left">
      <div class="config-card">
        <h2 class="config-card__title">Configuración de sesión</h2>
        <label class="field">
          <span class="field__label">ID del Examen</span>
          <input
            class="field__input"
            type="text"
            bind:value={examId}
            placeholder="ej. exam-2024-01"
          />
        </label>
        <label class="field">
          <span class="field__label">ID del Estudiante</span>
          <input
            class="field__input"
            type="text"
            bind:value={studentId}
            placeholder="ej. student-001"
          />
        </label>
      </div>

      <ProctoringMonitor
        {examId}
        {studentId}
        on:violation={handleViolation}
        on:ended={handleEnded}
      />
    </div>

    <!-- Right: Monitor / Activities -->
    <div class="layout__right">
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
                  Vista pensada para profesores: cuántos estudiantes se han supervisado por examen.
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
                Aún no hay supervisiones registradas. Cuando un estudiante inicie una sesión,
                aparecerá aquí.
              </p>
            {:else}
              <div class="table table--exams">
                <div class="table__head">
                  <div class="table__row">
                    <div class="table__cell table__cell--header">ID Examen</div>
                    <div class="table__cell table__cell--header table__cell--center"># Estudiantes</div>
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
                    Sesiones por estudiante
                  {/if}
                </h2>
                <p class="activities__subtitle">
                  Para ver el detalle de los estudiantes supervisados, elige primero un examen.
                </p>
              </div>
            </div>

            {#if !selectedExamId}
              <p class="activities__info">
                Selecciona un examen en la tabla superior para ver sus estudiantes.
              </p>
            {:else if sessionsLoading && sessions.length === 0}
              <p class="activities__info">Cargando sesiones…</p>
            {:else if sessionsError}
              <p class="activities__error">{sessionsError}</p>
            {:else if sessions.length === 0}
              <p class="activities__info">
                Aún no hay estudiantes registrados para este examen.
              </p>
            {:else}
              <div class="table table--sessions">
                <div class="table__head">
                  <div class="table__row">
                    <div class="table__cell table__cell--header">ID estudiante</div>
                    <div class="table__cell table__cell--header">Inicio</div>
                    <div class="table__cell table__cell--header">Fin</div>
                    <div class="table__cell table__cell--header table__cell--right">Status</div>
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
    </div>
  </div>
</div>

<style>
  .page { max-width: 1200px; margin: 0 auto; padding: 2rem 1.5rem; }

  .page__header { margin-bottom: 2rem; }
  .page__title { font-size: 1.6rem; font-weight: 800; color: #111827; margin: 0 0 0.4rem; }
  .page__subtitle { color: #6b7280; font-size: 0.95rem; margin: 0; }

  .layout { display: grid; grid-template-columns: 1fr 1.15fr; gap: 2rem; align-items: start; }
  @media (max-width: 768px) { .layout { grid-template-columns: 1fr; } }

  .config-card {
    background: #fff;
    border-radius: 12px;
    padding: 1.25rem 1.5rem;
    box-shadow: 0 2px 12px rgba(0,0,0,0.08);
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
  .field__input:focus { border-color: #4f46e5; }

  .stats-card, .log-card {
    background: #fff;
    border-radius: 12px;
    padding: 1.25rem 1.5rem;
    box-shadow: 0 2px 12px rgba(0,0,0,0.08);
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
    color: #4f46e5;
    box-shadow: 0 1px 3px rgba(0,0,0,0.12);
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
    background: #eef2ff;
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
