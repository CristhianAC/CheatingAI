<script>
  import { onDestroy, createEventDispatcher } from 'svelte';
  import { startSession, endSession, analyzeFrame, getSessionStats, calibrateFrame, reportBrowserEvent, registerIdentity } from '$lib/proctoring-api.js';
  import { showToast, showError } from '$lib/stores.js';
  import { Button } from '$lib/components/ui/button';
  import { Badge } from '$lib/components/ui/badge';

  export let examId = '';
  export let studentId = '';

  const dispatch = createEventDispatcher();

  let videoEl;
  let sessionId = null;
  let isActive = false;
  let latestResult = null;
  let calibData = null;      // raw values from /calibrate
  let recentViolations = [];
  let intervalHandle = null;
  let calibMode = false;     // toggle: show raw calibration view

  // ── Identity state ─────────────────────────────────────────────────────────
  // 'none' | 'pending' | 'registered' | 'failed'
  let identityStatus = 'none';
  let identityError = '';
  let identityRegistering = false;
  /** Registro automático de identidad ~2.5 s tras iniciar (si no hay violaciones graves). */
  const IDENTITY_AUTO_DELAY_MS = 2500;
  /** Un segundo intento automático si el primero se pospuso por señales bloqueantes. */
  const IDENTITY_DEFERRED_RETRY_MS = 4000;
  let identityAutoTimerId = null;
  let identityDeferredRetryId = null;
  /** Cuántas veces se pospuso por bloqueo (máx. 1 reintento diferido). */
  let identityAutoDeferCount = 0;
  /** Evita un segundo disparo tras captura exitosa; el manual sigue disponible. */
  let identityAutoAttempted = false;

  const FRAME_INTERVAL_MS = 2000;

  /** Tipos que impiden un registro facial fiable en ese momento. */
  const BLOCKING_VIOLATION_TYPES = new Set([
    'multiple_persons',
    'no_person',
    'phone_detected',
    'identity_mismatch',
  ]);

  function clearIdentityDeferredRetry() {
    if (identityDeferredRetryId != null) {
      clearTimeout(identityDeferredRetryId);
      identityDeferredRetryId = null;
    }
  }

  function clearIdentityAutoTimer() {
    if (identityAutoTimerId != null) {
      clearTimeout(identityAutoTimerId);
      identityAutoTimerId = null;
    }
    clearIdentityDeferredRetry();
  }

  function hasBlockingViolationsForIdentity() {
    return recentViolations.some((v) => BLOCKING_VIOLATION_TYPES.has(v.violation_type));
  }

  async function attemptAutoIdentityRegistration() {
    identityAutoTimerId = null;
    identityDeferredRetryId = null;
    if (!isActive || !sessionId || identityStatus !== 'pending' || identityRegistering || identityAutoAttempted) {
      return;
    }
    if (hasBlockingViolationsForIdentity()) {
      if (identityAutoDeferCount < 1) {
        identityAutoDeferCount += 1;
        identityDeferredRetryId = setTimeout(() => {
          identityDeferredRetryId = null;
          void attemptAutoIdentityRegistration();
        }, IDENTITY_DEFERRED_RETRY_MS);
      }
      return;
    }
    identityAutoAttempted = true;
    await captureIdentity();
  }

  // ── Browser focus / visibility detection ──────────────────────────────────
  // Tracks whether a blur was caused by a tab switch (so we don't double-report)
  let _tabSwitchPending = false;

  function onVisibilityChange() {
    if (!isActive || !sessionId) return;
    if (document.hidden) {
      _tabSwitchPending = true;
      const violation = { violation_type: 'tab_switch', confidence: 1.0, description: 'Cambio de pestaña del navegador' };
      recentViolations = [violation, ...recentViolations].slice(0, 20);
      dispatch('violation', { violations: [violation] });
      reportBrowserEvent(sessionId, 'tab_switch').catch(() => {});
    } else {
      _tabSwitchPending = false;
    }
  }

  function onWindowBlur() {
    if (!isActive || !sessionId) return;
    // If visibility also changed, it's a tab switch — already reported above
    if (_tabSwitchPending) return;
    const violation = { violation_type: 'window_blur', confidence: 1.0, description: 'Pérdida de foco: otra ventana o aplicación activa' };
    recentViolations = [violation, ...recentViolations].slice(0, 20);
    dispatch('violation', { violations: [violation] });
    reportBrowserEvent(sessionId, 'window_blur').catch(() => {});
  }

  async function startProctoring() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
      videoEl.srcObject = stream;
      await videoEl.play();

      const session = await startSession(examId, studentId);
      sessionId = session.id;
      isActive = true;

      intervalHandle = setInterval(sendFrame, FRAME_INTERVAL_MS);

      document.addEventListener('visibilitychange', onVisibilityChange);
      window.addEventListener('blur', onWindowBlur);

      identityStatus = 'pending';
      clearIdentityAutoTimer();
      identityAutoAttempted = false;
      identityAutoDeferCount = 0;
      identityAutoTimerId = setTimeout(() => {
        void attemptAutoIdentityRegistration();
      }, IDENTITY_AUTO_DELAY_MS);

      showToast('Supervisión iniciada');
      dispatch('started', { sessionId });
    } catch (e) {
      showError(`No se pudo iniciar la supervisión: ${e.message}`);
    }
  }

  async function sendFrame() {
    if (!videoEl || !isActive) return;
    try {
      if (calibMode) {
        calibData = await calibrateFrame(videoEl);
      } else {
        const result = await analyzeFrame(videoEl, sessionId, 0.7, studentId);
        latestResult = result;
        if (result.violations.length > 0) {
          recentViolations = [...result.violations, ...recentViolations].slice(0, 20);
          dispatch('violation', { violations: result.violations });
        }
      }
    } catch (e) {
      console.warn('Frame analysis failed:', e.message);
    }
  }

  async function captureIdentity() {
    if (!videoEl || !sessionId) return;
    clearIdentityAutoTimer();
    identityRegistering = true;
    identityError = '';
    try {
      const res = await registerIdentity(videoEl, sessionId);
      if (res.registered) {
        identityStatus = 'registered';
      } else {
        identityStatus = 'failed';
        identityError = res.message;
      }
    } catch (e) {
      identityStatus = 'failed';
      identityError = e.message;
    } finally {
      identityRegistering = false;
    }
  }

  async function stopProctoring() {
    clearInterval(intervalHandle);
    clearIdentityAutoTimer();
    identityAutoAttempted = false;
    identityAutoDeferCount = 0;
    isActive = false;
    identityStatus = 'none';

    document.removeEventListener('visibilitychange', onVisibilityChange);
    window.removeEventListener('blur', onWindowBlur);

    if (videoEl?.srcObject) {
      videoEl.srcObject.getTracks().forEach(t => t.stop());
    }

    if (sessionId) {
      try {
        await endSession(sessionId);
        const stats = await getSessionStats(sessionId);
        dispatch('ended', { stats });
        showToast('Sesión de supervisión finalizada');
      } catch (e) {
        showError(`Error al finalizar sesión: ${e.message}`);
      }
    }

    latestResult = null;
    calibData = null;
    sessionId = null;
  }

  function violationLabel(type) {
    return {
      multiple_persons: 'Varias personas',
      no_person: 'Participante ausente',
      looking_away: 'Mirando a otro lado',
      phone_detected: 'Uso de teléfono',
      tab_switch: 'Cambio de pestaña',
      window_blur: 'Cambio de ventana/app',
      identity_mismatch: 'Posible sustitución de persona',
    }[type] ?? type;
  }

  // Maps a gaze value [-0.4, 0.4] to a bar percentage [0, 100]
  function yawToPercent(v) {
    return Math.round(Math.min(Math.max(((v + 0.4) / 0.8) * 100, 0), 100));
  }
  // Maps pitch to bar percentage; negative pitch = looking down = left side of bar
  function pitchToPercent(v) {
    return Math.round(Math.min(Math.max(((v + 0.3) / 0.6) * 100, 0), 100));
  }

  onDestroy(() => {
    clearIdentityAutoTimer();
    if (isActive) stopProctoring();
  });
</script>

<div class="proctor-card rounded-xl border border-border bg-card p-5 shadow-sm">
  <div class="proctor-card__header mb-4 flex flex-wrap items-center justify-between gap-3">
    <h2 class="proctor-card__title text-lg font-semibold">Supervisión por cámara</h2>
    {#if isActive}
      <label class="toggle">
        <input type="checkbox" bind:checked={calibMode} />
        <span>Modo calibración</span>
      </label>
    {/if}
  </div>

  <!-- svelte-ignore a11y-media-has-caption -->
  <video bind:this={videoEl} class="webcam mb-4 aspect-video w-full rounded-lg bg-zinc-900 object-cover" muted playsinline></video>

  <div class="controls mb-4 flex gap-2">
    {#if !isActive}
      <Button onclick={startProctoring} disabled={!examId || !studentId}>Iniciar supervisión</Button>
    {:else}
      <Button variant="destructive" onclick={stopProctoring}>Detener supervisión</Button>
    {/if}
  </div>

  {#if isActive && sessionId}
    <p class="session-id">Sesión: <code>{sessionId}</code></p>
  {/if}

  <!-- ── Identity registration banner ── -->
  {#if isActive && identityStatus === 'pending'}
    <div class="identity-banner identity-banner--pending">
      <span class="identity-banner__icon">🪪</span>
      <span>
        Se intentará el registro automático en unos segundos si la imagen es válida.
        También puedes capturar ahora.
      </span>
      <button class="btn btn--primary btn--sm" on:click={captureIdentity} disabled={identityRegistering}>
        {identityRegistering ? 'Capturando…' : 'Capturar foto'}
      </button>
    </div>
  {:else if isActive && identityStatus === 'registered'}
    <div class="identity-banner identity-banner--ok">
      <span class="identity-banner__icon">✓</span>
      <span>Identidad registrada — verificando cada 30 s</span>
    </div>
  {:else if isActive && identityStatus === 'failed'}
    <div class="identity-banner identity-banner--error">
      <span class="identity-banner__icon">✗</span>
      <span>
        No se pudo registrar la identidad.
        {#if identityError}<br><small>{identityError}</small>{/if}
      </span>
      <button class="btn btn--primary btn--sm" on:click={captureIdentity} disabled={identityRegistering}>
        Reintentar
      </button>
    </div>
  {/if}

  <!-- ── Calibration view ── -->
  {#if calibMode && calibData}
    <div class="calib-panel">
      <h3 class="calib-panel__title">Valores brutos (calibración de mirada)</h3>

      <div class="gauge-row">
        <span class="gauge-label">Yaw horizontal (izq ← → der)</span>
        <div class="gauge-track">
          <div class="gauge-center"></div>
          <div class="gauge-fill" style="left:{yawToPercent(calibData.gaze_yaw ?? 0)}%"></div>
        </div>
        <span class="gauge-value" class:gauge-value--warn={!calibData.yaw_ok}>
          {(calibData.gaze_yaw ?? 0).toFixed(3)}
          {#if !calibData.yaw_ok}⚠{/if}
        </span>
      </div>

      <div class="gauge-row">
        <span class="gauge-label">Pitch vertical (abajo ← → arriba)</span>
        <div class="gauge-track">
          <div class="gauge-center"></div>
          <div class="gauge-fill gauge-fill--pitch" style="left:{pitchToPercent(calibData.gaze_pitch ?? 0)}%"></div>
        </div>
        <span class="gauge-value" class:gauge-value--warn={!calibData.pitch_ok}>
          {(calibData.gaze_pitch ?? 0).toFixed(3)}
          {#if !calibData.pitch_ok}⚠{/if}
        </span>
      </div>

      <div class="calib-thresholds">
        <span>Umbral yaw: <strong>±{calibData.thresholds.yaw_threshold}</strong></span>
        <span>Umbral pitch: <strong>-{calibData.thresholds.pitch_threshold}</strong></span>
      </div>
      <p class="calib-hint">
        Mira al frente → yaw y pitch deben estar cerca de <strong>0.000</strong>.<br>
        Mira a la derecha → yaw sube. Mira abajo → pitch baja (negativo).<br>
        Ajusta los umbrales en <code>config.py</code> según los valores que veas.
      </p>
    </div>

  <!-- ── Normal detection view ── -->
  {:else if latestResult && !calibMode}
    <div class="status-grid">
      <div class="stat">
        <span class="stat__label">Personas</span>
        <span class="stat__value" class:stat__value--warn={latestResult.person_count !== 1}>
          {latestResult.person_count}
        </span>
      </div>
      {#if latestResult.gaze_yaw !== null}
        <div class="stat">
          <span class="stat__label">Yaw (H)</span>
          <span class="stat__value">{latestResult.gaze_yaw.toFixed(3)}</span>
        </div>
        <div class="stat">
          <span class="stat__label">Pitch (V)</span>
          <span class="stat__value">{latestResult.gaze_pitch.toFixed(3)}</span>
        </div>
      {/if}
      <div class="stat">
        <span class="stat__label">Tiempo</span>
        <span class="stat__value">{latestResult.processing_time_ms.toFixed(0)}ms</span>
      </div>
    </div>
  {/if}

  {#if recentViolations.length > 0 && !calibMode}
    <div class="violations space-y-2 rounded-lg border border-border bg-muted/30 p-4">
      <h3 class="violations__title mb-2 text-sm font-semibold">Señales recientes</h3>
      {#each recentViolations.slice(0, 8) as v}
        <div class="violation violation--{v.violation_type} rounded-lg border border-border bg-card p-3 text-sm">
          <strong class="violation__type">{violationLabel(v.violation_type)}</strong>
          <span class="violation__conf">{(v.confidence * 100).toFixed(0)}% confianza</span>
          <span class="violation__desc">{v.description}</span>
        </div>
      {/each}
    </div>
  {/if}
</div>

<style>
  .proctor-card {
    background: var(--procto-surface, #fff);
    border-radius: var(--procto-radius, 12px);
    padding: 1.5rem;
    box-shadow: var(--procto-shadow-card, 0 1px 2px rgba(0, 0, 0, 0.04));
    border: 1px solid var(--procto-border, rgba(0, 0, 0, 0.08));
    max-width: 640px;
  }

  .proctor-card__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 1rem;
  }

  .proctor-card__title {
    font-size: 1.15rem;
    font-weight: 700;
    margin: 0;
    color: #111827;
  }

  .toggle {
    display: flex;
    align-items: center;
    gap: 0.4rem;
    font-size: 0.8rem;
    color: #6b7280;
    cursor: pointer;
  }
  .toggle input { cursor: pointer; }

  .webcam {
    width: 100%;
    border-radius: 8px;
    background: #111;
    aspect-ratio: 4/3;
    display: block;
  }

  .controls { margin-top: 1rem; display: flex; gap: 0.75rem; }

  .btn {
    padding: 0.55rem 1.2rem;
    border-radius: 8px;
    border: none;
    font-size: 0.9rem;
    font-weight: 600;
    cursor: pointer;
    transition: opacity 0.15s;
  }
  .btn:disabled { opacity: 0.45; cursor: not-allowed; }
  .btn--primary { background: var(--procto-accent, #0071e3); color: #fff; }
  .btn--primary:hover:not(:disabled) { background: var(--procto-accent-hover, #0077ed); }
  .btn--danger  { background: #dc2626; color: #fff; }
  .btn--danger:hover  { background: #b91c1c; }

  .session-id { font-size: 0.78rem; color: #6b7280; margin: 0.5rem 0 0; }
  .session-id code {
    font-family: monospace;
    background: #f3f4f6;
    padding: 0.1rem 0.3rem;
    border-radius: 4px;
    font-size: 0.75rem;
  }

  /* ── Calibration panel ── */
  .calib-panel {
    margin-top: 1rem;
    padding: 1rem;
    background: #f0f9ff;
    border: 1px solid #bae6fd;
    border-radius: 8px;
  }
  .calib-panel__title { font-size: 0.9rem; font-weight: 700; margin: 0 0 0.85rem; color: #0369a1; }

  .gauge-row {
    display: grid;
    grid-template-columns: 160px 1fr 70px;
    align-items: center;
    gap: 0.6rem;
    margin-bottom: 0.65rem;
  }
  .gauge-label { font-size: 0.78rem; color: #374151; }
  .gauge-track {
    position: relative;
    height: 10px;
    background: #e5e7eb;
    border-radius: 99px;
    overflow: visible;
  }
  .gauge-center {
    position: absolute;
    left: 50%;
    top: -2px;
    width: 2px;
    height: 14px;
    background: #9ca3af;
    border-radius: 1px;
  }
  .gauge-fill {
    position: absolute;
    top: 50%;
    transform: translate(-50%, -50%);
    width: 14px;
    height: 14px;
    background: var(--procto-accent, #0071e3);
    border-radius: 50%;
    border: 2px solid #fff;
    box-shadow: 0 0 0 2px var(--procto-accent, #0071e3);
    transition: left 0.25s ease;
  }
  .gauge-fill--pitch { background: #f59e0b; box-shadow: 0 0 0 2px #f59e0b; }
  .gauge-value { font-size: 0.8rem; font-weight: 700; font-family: monospace; color: #111827; text-align: right; }
  .gauge-value--warn { color: #dc2626; }

  .calib-thresholds {
    display: flex;
    gap: 1.5rem;
    font-size: 0.78rem;
    color: #6b7280;
    margin-top: 0.75rem;
  }
  .calib-hint {
    margin-top: 0.65rem;
    font-size: 0.78rem;
    color: #6b7280;
    line-height: 1.6;
  }
  .calib-hint code { background: #e0f2fe; padding: 0.1rem 0.3rem; border-radius: 3px; font-size: 0.75rem; }

  /* ── Status grid ── */
  .status-grid {
    display: flex;
    gap: 1.25rem;
    flex-wrap: wrap;
    margin-top: 1rem;
    padding: 0.75rem 1rem;
    background: #f9fafb;
    border-radius: 8px;
  }
  .stat { display: flex; flex-direction: column; align-items: center; gap: 0.15rem; }
  .stat__label { font-size: 0.72rem; color: #9ca3af; text-transform: uppercase; letter-spacing: 0.05em; }
  .stat__value { font-size: 1rem; font-weight: 700; color: #111827; font-family: monospace; }
  .stat__value--warn { color: #dc2626; }

  /* ── Violations ── */
  .violations { margin-top: 1.25rem; }
  .violations__title { font-size: 0.9rem; font-weight: 700; margin: 0 0 0.6rem; color: #374151; }
  .violation {
    display: flex; flex-direction: column; gap: 0.15rem;
    padding: 0.5rem 0.75rem; border-radius: 6px; margin-bottom: 0.4rem; font-size: 0.83rem;
  }
  .violation--multiple_persons { background: #fef3c7; border-left: 3px solid #f59e0b; }
  .violation--no_person        { background: #fee2e2; border-left: 3px solid #ef4444; }
  .violation--looking_away     { background: #fef9c3; border-left: 3px solid #eab308; }
  .violation--phone_detected   { background: #fce7f3; border-left: 3px solid #ec4899; }
  .violation--tab_switch        { background: #ede9fe; border-left: 3px solid #7c3aed; }
  .violation--window_blur       { background: #e0f2fe; border-left: 3px solid #0284c7; }
  .violation--identity_mismatch { background: #fff1f2; border-left: 3px solid #e11d48; }

  /* ── Identity banner ── */
  .identity-banner {
    display: flex;
    align-items: center;
    gap: 0.6rem;
    margin-top: 0.75rem;
    padding: 0.6rem 0.9rem;
    border-radius: 8px;
    font-size: 0.83rem;
  }
  .identity-banner--pending { background: #fefce8; border: 1px solid #fde047; color: #713f12; }
  .identity-banner--ok      { background: #f0fdf4; border: 1px solid #86efac; color: #14532d; }
  .identity-banner--error   { background: #fff1f2; border: 1px solid #fda4af; color: #881337; }
  .identity-banner__icon    { font-size: 1rem; flex-shrink: 0; }
  .identity-banner span:nth-child(2) { flex: 1; }
  .btn--sm { padding: 0.3rem 0.7rem; font-size: 0.78rem; flex-shrink: 0; }
  .violation__type { font-weight: 700; color: #111827; }
  .violation__conf { font-size: 0.78rem; color: #6b7280; }
  .violation__desc { font-size: 0.78rem; color: #6b7280; font-style: italic; }
</style>
