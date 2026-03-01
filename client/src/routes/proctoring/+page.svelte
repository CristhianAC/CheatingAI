<script>
  import ProctoringMonitor from '$lib/components/ProctoringMonitor.svelte';

  let examId = '';
  let studentId = '';
  let sessionStats = null;
  let violationLog = [];

  function handleViolation(event) {
    const timestamp = new Date().toLocaleTimeString();
    event.detail.violations.forEach(v => {
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
      phone_detected: 'Uso de teléfono',
    };
    return labels[type] ?? type;
  }
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

    <!-- Right: Stats + Log -->
    <div class="layout__right">
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
    </div>
  </div>
</div>

<style>
  .page { max-width: 1200px; margin: 0 auto; padding: 2rem 1.5rem; }

  .page__header { margin-bottom: 2rem; }
  .page__title { font-size: 1.6rem; font-weight: 800; color: #111827; margin: 0 0 0.4rem; }
  .page__subtitle { color: #6b7280; font-size: 0.95rem; margin: 0; }

  .layout { display: grid; grid-template-columns: 1fr 1fr; gap: 2rem; align-items: start; }
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
</style>
