<script>
  import { onDestroy, createEventDispatcher } from 'svelte';
  import {
    startSession,
    endSession,
    analyzeFrame,
    getSessionStats,
    calibrateFrame,
    reportBrowserEvent,
    registerIdentity,
    proctoringHealthCheck,
  } from '$lib/proctoring-api.js';
  import { onMount } from 'svelte';
  import { waitForVideoReady } from '$lib/camera-ready.js';
  import { showToast, showError } from '$lib/stores.js';
  import { Button } from '$lib/components/ui/button';
  import * as Card from '$lib/components/ui/card';
  import * as Alert from '$lib/components/ui/alert';
  import {
    studentViolationLabel,
    studentViolationHint,
    IDENTITY_STEP_MESSAGES,
    identityMessageForReason,
  } from '$lib/proctoring-student-copy.js';

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

  // ── Identity & startup ─────────────────────────────────────────────────────
  // identityStatus: 'none' | 'pending' | 'registered' | 'failed' | 'skipped'
  let identityStatus = 'none';
  let identityError = '';
  let identityRegistering = false;
  let identityFailureCount = 0;
  let identityAutoAttemptsDone = 0;
  let sessionBlocked = false;
  let startingProctoring = false;
  /** Mensaje del paso actual (cámara / rostro / identidad). */
  let startupMessage = '';
  /** Supervisión periódica solo tras identidad OK o skip. */
  let monitoringStarted = false;
  /** @type {'checking' | 'ok' | 'error' | null} */
  let connectionStatus = null;

  const FRAME_INTERVAL_MS = 2000;
  const MAX_STUDENT_SIGNALS = 5;
  const IDENTITY_AUTO_MAX_ATTEMPTS = 3;
  const IDENTITY_MAX_FAILURES_BEFORE_SKIP = 5;
  const IDENTITY_AUTO_RETRY_DELAY_MS = 2000;
  const FACE_PRECHECK_ATTEMPTS = 3;
  const FACE_PRECHECK_DELAY_MS = 500;
  const CAMERA_CONSTRAINTS = {
    video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } },
    audio: false,
  };

  function beginMonitoring() {
    if (monitoringStarted || !sessionId) return;
    monitoringStarted = true;
    startupMessage = '';
    intervalHandle = setInterval(sendFrame, FRAME_INTERVAL_MS);
    document.addEventListener('visibilitychange', onVisibilityChange);
    window.addEventListener('blur', onWindowBlur);
  }

  function onIdentitySuccess() {
    identityStatus = 'registered';
    identityError = '';
    beginMonitoring();
  }

  function maybeSkipIdentityAfterFailures() {
    if (identityFailureCount >= IDENTITY_MAX_FAILURES_BEFORE_SKIP) {
      identityStatus = 'skipped';
      identityError = '';
      showToast('Continuando la supervisión sin verificación facial');
      beginMonitoring();
      return true;
    }
    return false;
  }

  async function waitForSingleFaceInFrame() {
    startupMessage = IDENTITY_STEP_MESSAGES.finding_face;
    for (let i = 0; i < FACE_PRECHECK_ATTEMPTS; i += 1) {
      await waitForVideoReady(videoEl);
      const preview = await analyzeFrame(videoEl, null, 0.75);
      if (preview.person_count === 1) return true;
      if (i < FACE_PRECHECK_ATTEMPTS - 1) {
        await new Promise((r) => setTimeout(r, FACE_PRECHECK_DELAY_MS));
      }
    }
    return false;
  }

  async function runAutoIdentityRegistration() {
    identityStatus = 'pending';
    identityAutoAttemptsDone = 0;
    startupMessage = IDENTITY_STEP_MESSAGES.verifying;

    for (let attempt = 0; attempt < IDENTITY_AUTO_MAX_ATTEMPTS; attempt += 1) {
      if (!isActive || !sessionId || identityStatus === 'registered' || identityStatus === 'skipped') {
        return;
      }
      identityAutoAttemptsDone = attempt + 1;
      if (attempt > 0) {
        startupMessage = IDENTITY_STEP_MESSAGES.verifying_slow;
        await new Promise((r) => setTimeout(r, IDENTITY_AUTO_RETRY_DELAY_MS));
      }
      const ok = await captureIdentity({ isAuto: true });
      if (ok) return;
      if (maybeSkipIdentityAfterFailures()) return;
    }

    identityStatus = 'failed';
  }

  // ── Browser focus / visibility detection ──────────────────────────────────
  // Tracks whether a blur was caused by a tab switch (so we don't double-report)
  let _tabSwitchPending = false;

  function pushConfirmedViolations(violations) {
    if (!violations?.length) return;
    const mapped = violations.map((v) => ({
      violation_type: v.violation_type,
      description: v.description || studentViolationLabel(v.violation_type),
    }));
    recentViolations = [...mapped, ...recentViolations].slice(0, MAX_STUDENT_SIGNALS);
    dispatch('violation', { violations: mapped });
  }

  async function onVisibilityChange() {
    if (!isActive || !sessionId) return;
    if (document.hidden) {
      _tabSwitchPending = true;
      try {
        const res = await reportBrowserEvent(sessionId, 'tab_switch');
        if (res?.recorded) {
          pushConfirmedViolations([
            { violation_type: 'tab_switch', description: studentViolationLabel('tab_switch') },
          ]);
        }
      } catch (err) {
        console.warn('[proctoring] No se pudo registrar cambio de pestaña:', err);
        showToast('No se pudo registrar el cambio de pestaña', 'warning');
      }
    } else {
      _tabSwitchPending = false;
    }
  }

  async function onWindowBlur() {
    if (!isActive || !sessionId) return;
    if (_tabSwitchPending) return;
    try {
      const res = await reportBrowserEvent(sessionId, 'window_blur');
      if (res?.recorded) {
        pushConfirmedViolations([
          { violation_type: 'window_blur', description: studentViolationLabel('window_blur') },
        ]);
      }
    } catch (err) {
      console.warn('[proctoring] No se pudo registrar pérdida de foco:', err);
      showToast('No se pudo registrar el cambio de ventana', 'warning');
    }
  }

  async function startProctoring() {
    if (startingProctoring) return;
    startingProctoring = true;
    startupMessage = IDENTITY_STEP_MESSAGES.preparing_camera;
    identityFailureCount = 0;
    identityAutoAttemptsDone = 0;
    monitoringStarted = false;

    try {
      const stream = await navigator.mediaDevices.getUserMedia(CAMERA_CONSTRAINTS);
      videoEl.srcObject = stream;
      await videoEl.play();
      await waitForVideoReady(videoEl);

      const session = await startSession(examId, studentId);
      sessionId = session.id;
      isActive = true;
      sessionBlocked = false;

      if (session.resumed) {
        showToast('Reanudando tu supervisión en curso');
      }

      dispatch('started', { sessionId });

      if (session.identity_registered) {
        identityStatus = 'registered';
        showToast('Supervisión iniciada');
        beginMonitoring();
        return;
      }

      const faceOk = await waitForSingleFaceInFrame();
      if (!faceOk) {
        identityError =
          'No detectamos un solo rostro. Centra tu cara, mejora la luz y asegúrate de estar solo.';
      }

      await runAutoIdentityRegistration();

      if (identityStatus === 'registered' || identityStatus === 'skipped') {
        showToast('Supervisión iniciada');
      } else if (!monitoringStarted) {
        showToast('Supervisión iniciada. Verifica tu identidad cuando puedas.');
        beginMonitoring();
      }
    } catch (e) {
      if (e?.code === 'SESSION_ALREADY_COMPLETED') {
        sessionBlocked = true;
        dispatch('sessionCompleted', { sessionId: e.existingSessionId });
        showError(e.message ?? 'Ya completaste la supervisión de este examen.');
        return;
      }
      showError(`No se pudo iniciar la supervisión: ${e.message}`);
      if (videoEl?.srcObject) {
        videoEl.srcObject.getTracks().forEach((t) => t.stop());
      }
      isActive = false;
      sessionId = null;
    } finally {
      startingProctoring = false;
      if (identityStatus !== 'pending' || monitoringStarted) {
        startupMessage = '';
      }
    }
  }

  async function sendFrame() {
    if (!videoEl || !isActive || !monitoringStarted) return;
    try {
      if (calibMode) {
        calibData = await calibrateFrame(videoEl);
      } else {
        const result = await analyzeFrame(videoEl, sessionId, 0.7, studentId);
        latestResult = result;
        if (result.violations?.length > 0) {
          pushConfirmedViolations(result.violations);
        }
      }
    } catch (e) {
      console.warn('Frame analysis failed:', e.message);
    }
  }

  /**
   * @param {{ isAuto?: boolean }} [opts]
   * @returns {Promise<boolean>} true si registró identidad
   */
  async function captureIdentity(opts = {}) {
    if (!videoEl || !sessionId || identityRegistering) return false;
    identityRegistering = true;
    if (!opts.isAuto) {
      identityStatus = 'pending';
      startupMessage = IDENTITY_STEP_MESSAGES.verifying;
    }
    identityError = '';
    try {
      await waitForVideoReady(videoEl);
      const res = await registerIdentity(videoEl, sessionId);
      if (res.registered) {
        onIdentitySuccess();
        return true;
      }
      identityFailureCount += 1;
      identityError = identityMessageForReason(res.reason_code, res.message);
      if (!opts.isAuto) {
        identityStatus = 'failed';
        maybeSkipIdentityAfterFailures();
      }
      return false;
    } catch (e) {
      identityFailureCount += 1;
      identityError = e.message ?? identityMessageForReason('default');
      if (!opts.isAuto) {
        identityStatus = 'failed';
        maybeSkipIdentityAfterFailures();
      }
      return false;
    } finally {
      identityRegistering = false;
    }
  }

  async function stopProctoring() {
    clearInterval(intervalHandle);
    monitoringStarted = false;
    startupMessage = '';
    identityFailureCount = 0;
    identityAutoAttemptsDone = 0;
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

  // Maps a gaze value [-0.4, 0.4] to a bar percentage [0, 100] (solo modo calibración)
  function yawToPercent(v) {
    return Math.round(Math.min(Math.max(((v + 0.4) / 0.8) * 100, 0), 100));
  }
  // Maps pitch to bar percentage; negative pitch = looking down = left side of bar
  function pitchToPercent(v) {
    return Math.round(Math.min(Math.max(((v + 0.3) / 0.6) * 100, 0), 100));
  }

  async function checkProctoringConnection() {
    connectionStatus = 'checking';
    try {
      await proctoringHealthCheck();
      connectionStatus = 'ok';
    } catch {
      connectionStatus = 'error';
    }
  }

  onMount(() => {
    if (!isActive) void checkProctoringConnection();
  });

  onDestroy(() => {
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

  {#if !isActive && connectionStatus}
    <Card.Root class="mb-4 rounded-lg border border-border bg-muted/30">
      <Card.Content class="flex items-center justify-between gap-3 py-3">
        <div>
          <p class="text-sm font-medium text-foreground">Conexión con supervisión</p>
          <p class="text-xs text-muted-foreground">
            {#if connectionStatus === 'checking'}
              Comprobando servicio…
            {:else if connectionStatus === 'ok'}
              Servicio disponible. Puedes iniciar cuando estés listo.
            {:else}
              No se pudo contactar el servicio. Revisa tu red o avisa al profesor.
            {/if}
          </p>
        </div>
        {#if connectionStatus === 'error'}
          <Button variant="outline" size="sm" onclick={checkProctoringConnection}>Reintentar</Button>
        {/if}
      </Card.Content>
    </Card.Root>
  {/if}

  <div class="controls mb-4 flex gap-2">
    {#if sessionBlocked}
      <p class="text-sm text-muted-foreground">Ya completaste la supervisión de este examen.</p>
    {:else if !isActive}
      <Button onclick={startProctoring} disabled={!examId || !studentId || startingProctoring}>
        {startingProctoring ? 'Preparando…' : 'Iniciar supervisión'}
      </Button>
    {:else}
      <Button variant="destructive" onclick={stopProctoring}>Detener supervisión</Button>
    {/if}
  </div>

  {#if isActive && startupMessage}
    <p class="mb-3 text-sm text-muted-foreground" role="status">{startupMessage}</p>
  {/if}

  {#if isActive && monitoringStarted}
    <Alert.Root class="mb-4 border-border bg-muted/40">
      <Alert.Title class="text-sm font-medium">Supervisión activa</Alert.Title>
      <Alert.Description class="text-sm text-muted-foreground">
        Solo se registran señales de integridad (mirada, rostro, dispositivos). Mantén la cámara
        encendida hasta finalizar el examen.
      </Alert.Description>
    </Alert.Root>
  {/if}

  {#if isActive && (identityStatus === 'pending' || (identityStatus === 'failed' && !monitoringStarted))}
    <Alert.Root class="mb-4 border-amber-500/40 bg-amber-500/10">
      <Alert.Title class="text-sm font-semibold">
        {identityRegistering ? 'Verificando tu identidad…' : 'Verificación de identidad'}
      </Alert.Title>
      <Alert.Description class="text-sm">
        {#if identityRegistering}
          {IDENTITY_STEP_MESSAGES.verifying_slow}
        {:else if identityError}
          {identityError}
        {:else}
          Centra tu rostro en la cámara con buena luz. Debes estar solo en imagen.
        {/if}
        {#if identityAutoAttemptsDone > 0 && identityStatus === 'pending'}
          <span class="mt-1 block text-xs text-muted-foreground">
            Intento automático {identityAutoAttemptsDone} de {IDENTITY_AUTO_MAX_ATTEMPTS}
          </span>
        {/if}
      </Alert.Description>
      <div class="mt-3">
        <Button size="sm" onclick={() => captureIdentity()} disabled={identityRegistering}>
          {identityRegistering ? 'Verificando…' : 'Verificar ahora'}
        </Button>
      </div>
    </Alert.Root>
  {:else if isActive && identityStatus === 'skipped'}
    <Alert.Root class="mb-4 border-amber-500/40 bg-amber-500/10">
      <Alert.Title class="text-sm font-semibold">Identidad no verificada</Alert.Title>
      <Alert.Description class="text-sm text-muted-foreground">
        No pudimos confirmar tu identidad. Puedes continuar la supervisión; tu profesor verá el
        intento en el informe.
        <div class="mt-3">
          <Button size="sm" variant="outline" onclick={() => captureIdentity()} disabled={identityRegistering}>
            Reintentar verificación
          </Button>
        </div>
      </Alert.Description>
    </Alert.Root>
  {:else if isActive && identityStatus === 'registered'}
    <Alert.Root class="mb-4 border-emerald-500/40 bg-emerald-500/10">
      <Alert.Title class="text-sm font-semibold text-emerald-800 dark:text-emerald-200">
        Identidad verificada
      </Alert.Title>
      <Alert.Description class="text-sm text-muted-foreground">
        Puedes continuar con el examen con normalidad.
      </Alert.Description>
    </Alert.Root>
  {:else if isActive && identityStatus === 'failed'}
    <Alert.Root variant="destructive" class="mb-4">
      <Alert.Title class="text-sm font-semibold">No se pudo verificar tu identidad</Alert.Title>
      <Alert.Description class="text-sm">
        {#if identityError}
          {identityError}
        {:else}
          Centra tu rostro, mejora la iluminación y asegúrate de estar solo en cámara.
        {/if}
      </Alert.Description>
      <div class="mt-3">
        <Button size="sm" variant="outline" onclick={() => captureIdentity()} disabled={identityRegistering}>
          Reintentar
        </Button>
      </div>
    </Alert.Root>
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

  {/if}

  {#if isActive && !calibMode}
    {#if recentViolations.length > 0}
      <div class="space-y-2 rounded-lg border border-border bg-muted/30 p-4">
        <h3 class="text-sm font-semibold">Señales registradas</h3>
        <p class="text-xs text-muted-foreground">
          Solo se muestran avisos confirmados durante esta sesión.
        </p>
        {#each recentViolations as v}
          <div
            class="rounded-lg border border-border bg-card p-3 text-sm violation--{String(v.violation_type).toLowerCase()}"
          >
            <p class="font-medium text-foreground">{studentViolationLabel(v.violation_type)}</p>
            <p class="mt-1 text-muted-foreground">{studentViolationHint(v.violation_type)}</p>
          </div>
        {/each}
      </div>
    {:else}
      <p class="rounded-lg border border-dashed border-border bg-muted/20 p-4 text-center text-sm text-muted-foreground">
        Todo en orden. Mantén la cámara activa y mira la pantalla del examen.
      </p>
    {/if}
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
