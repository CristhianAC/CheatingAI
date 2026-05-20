<script>
  import { createEventDispatcher, onDestroy, tick } from 'svelte';
  import { Button } from '$lib/components/ui/button';
  import { Label } from '$lib/components/ui/label';

  export let required = false;
  export let label = 'Foto de perfil';

  const dispatch = createEventDispatcher();

  let videoEl;
  let stream = null;
  let permissionError = '';
  let detectorError = '';
  let running = false;
  let checksTimer = null;

  let faceCount = 0;
  let faceBox = null; // { x, y, w, h }
  let avgBrightness = null;
  let loadingDetector = false;
  let mpDetector = null;
  let mpInitTried = false;
  const MP_WASM_BASE =
    'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm';
  const MP_MODEL_URL =
    'https://storage.googleapis.com/mediapipe-models/face_detector/blaze_face_short_range/float16/1/blaze_face_short_range.tflite';

  function hasFaceDetector() {
    return typeof window !== 'undefined' && typeof window.FaceDetector !== 'undefined';
  }

  async function ensureMediaPipeDetector() {
    if (mpDetector || mpInitTried) return mpDetector;
    mpInitTried = true;
    loadingDetector = true;
    detectorError = '';
    try {
      const { FaceDetector, FilesetResolver } = await import('@mediapipe/tasks-vision');
      const vision = await FilesetResolver.forVisionTasks(MP_WASM_BASE);
      mpDetector = await FaceDetector.createFromOptions(vision, {
        baseOptions: { modelAssetPath: MP_MODEL_URL },
        runningMode: 'VIDEO',
      });
      return mpDetector;
    } catch (e) {
      detectorError =
        'No se pudo cargar la detección de rostro. Verifica tu conexión y recarga la página.';
      return null;
    } finally {
      loadingDetector = false;
    }
  }

  function cameraErrorMessage(e) {
    const name = e?.name ?? '';
    if (name === 'NotAllowedError') {
      return 'Permiso denegado. Habilita la cámara en tu navegador para continuar.';
    }
    if (name === 'NotFoundError') {
      return 'No se encontró ninguna cámara en este dispositivo.';
    }
    if (name === 'NotReadableError' || name === 'TrackStartError') {
      return 'La cámara está en uso por otra aplicación. Ciérrala e inténtalo de nuevo.';
    }
    if (name === 'OverconstrainedError') {
      return 'No se pudo usar la cámara frontal. Prueba con otro dispositivo.';
    }
    if (e?.message?.includes('video') || name === 'AbortError') {
      return 'No se pudo iniciar la vista previa. Recarga la página e inténtalo de nuevo.';
    }
    return 'No se pudo acceder a la cámara. Verifica permisos y dispositivo.';
  }

  function releaseStream() {
    if (stream) {
      stream.getTracks().forEach((t) => t.stop());
      stream = null;
    }
  }

  async function startCamera() {
    permissionError = '';
    try {
      stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user' },
        audio: false,
      });
      // Montar <video> antes de asignar srcObject (solo existe si running === true)
      running = true;
      await tick();
      if (!videoEl) {
        throw new Error('No se pudo iniciar la vista previa de la cámara.');
      }
      videoEl.srcObject = stream;
      await videoEl.play();
      void ensureMediaPipeDetector();
      checksTimer = setInterval(() => {
        void evaluateFrame();
      }, 500);
    } catch (e) {
      releaseStream();
      if (checksTimer) {
        clearInterval(checksTimer);
        checksTimer = null;
      }
      running = false;
      permissionError = cameraErrorMessage(e);
    }
  }

  function stopCamera() {
    if (checksTimer) {
      clearInterval(checksTimer);
      checksTimer = null;
    }
    releaseStream();
    running = false;
    faceCount = 0;
    faceBox = null;
    avgBrightness = null;
  }

  function computeBrightness(canvas) {
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    const { width, height } = canvas;
    const img = ctx.getImageData(0, 0, width, height);
    const data = img.data;
    let sum = 0;
    // muestreo simple: 1 de cada 8 pixeles
    for (let i = 0; i < data.length; i += 4 * 8) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      // luminancia aproximada
      sum += 0.2126 * r + 0.7152 * g + 0.0722 * b;
    }
    const samples = data.length / (4 * 8);
    return Math.round(sum / Math.max(1, samples));
  }

  async function evaluateFrame() {
    if (!videoEl || !running) return;
    if (!videoEl.videoWidth || !videoEl.videoHeight) return;

    const canvas = document.createElement('canvas');
    canvas.width = videoEl.videoWidth;
    canvas.height = videoEl.videoHeight;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(videoEl, 0, 0, canvas.width, canvas.height);

    avgBrightness = computeBrightness(canvas);

    faceCount = 0;
    faceBox = null;
    // Face detection:
    // 1) Native FaceDetector if available
    // 2) MediaPipe Tasks Vision (works on Brave/Firefox/Safari)
    try {
      if (hasFaceDetector()) {
        const detector = new window.FaceDetector({ fastMode: true, maxDetectedFaces: 5 });
        const faces = await detector.detect(canvas);
        faceCount = faces?.length ?? 0;
        if (faceCount >= 1 && faces[0]?.boundingBox) {
          const b = faces[0].boundingBox;
          faceBox = { x: b.x, y: b.y, w: b.width, h: b.height };
        }
        detectorError = '';
        return;
      }

      const d = mpDetector ?? (await ensureMediaPipeDetector());
      if (!d) return;
      const res = d.detectForVideo(videoEl, performance.now());
      const dets = res?.detections ?? [];
      faceCount = dets.length;
      if (faceCount >= 1) {
        const bb = dets[0]?.boundingBox;
        if (bb) {
          faceBox = { x: bb.originX, y: bb.originY, w: bb.width, h: bb.height };
        }
      }
      detectorError = '';
    } catch (e) {
      detectorError = 'No se pudo evaluar el rostro. Intenta recargar la página.';
    }
  }

  function inRange(v, min, max) {
    return v >= min && v <= max;
  }

  $: hasFace = faceCount >= 1;
  $: singleFace = faceCount === 1;
  $: lightingOk = avgBrightness != null ? avgBrightness >= 40 : false;
  $: centeredOk = (() => {
    if (!faceBox || !videoEl?.videoWidth || !videoEl?.videoHeight) return false;
    const cx = (faceBox.x + faceBox.w / 2) / videoEl.videoWidth;
    const cy = (faceBox.y + faceBox.h / 2) / videoEl.videoHeight;
    return inRange(cx, 0.2, 0.8) && inRange(cy, 0.2, 0.8);
  })();

  $: checks = [
    { key: 'face', label: 'Rostro detectado', ok: hasFace, bad: 'No se detecta ningún rostro' },
    { key: 'single', label: 'Un solo rostro', ok: singleFace, bad: 'Se detecta más de una persona' },
    { key: 'light', label: 'Iluminación adecuada', ok: lightingOk, bad: 'Muy oscuro, mejora la iluminación' },
    { key: 'center', label: 'Rostro centrado', ok: centeredOk, bad: 'Centra tu rostro en el encuadre' },
  ];
  $: allOk = running && checks.every((c) => c.ok) && !permissionError && !detectorError;

  async function takePhoto() {
    if (!allOk || !videoEl?.videoWidth || !videoEl?.videoHeight) return;

    const canvas = document.createElement('canvas');
    canvas.width = videoEl.videoWidth;
    canvas.height = videoEl.videoHeight;
    canvas.getContext('2d').drawImage(videoEl, 0, 0, canvas.width, canvas.height);

    const blob = await new Promise((resolve) =>
      canvas.toBlob((b) => resolve(b), 'image/jpeg', 0.92)
    );
    if (!blob) return;

    dispatch('capture', { blob });
  }

  onDestroy(stopCamera);
</script>

<div class="rounded-xl border border-border bg-card p-4">
  <Label class="text-base font-semibold">{label}{required ? ' *' : ''}</Label>
  <p class="mt-1 text-sm text-muted-foreground">Se te pedirá permiso al activar la cámara.</p>

  {#if permissionError}
    <p class="mt-2 text-sm font-medium text-destructive">✗ {permissionError}</p>
  {/if}
  {#if detectorError}
    <p class="mt-2 text-sm font-medium text-destructive">✗ {detectorError}</p>
  {/if}

  {#if running}
    <!-- svelte-ignore a11y-media-has-caption -->
    <video bind:this={videoEl} class="mt-3 aspect-[4/3] w-full rounded-lg bg-zinc-900" muted playsinline></video>
  {:else}
    <div
      class="mt-3 flex aspect-[4/3] w-full items-center justify-center rounded-lg bg-zinc-900/90"
      aria-hidden="true"
    >
      <span class="rounded-full border border-white/20 bg-black/30 px-3 py-1.5 text-sm font-semibold text-white/90">
        Cámara apagada
      </span>
    </div>
  {/if}

  <ul class="mt-3 space-y-2 rounded-lg border border-border bg-muted/40 p-3" aria-live="polite">
    {#each checks as c (c.key)}
      <li class="flex items-center gap-2 text-sm {c.ok ? 'text-emerald-700' : 'text-destructive'}">
        <span
          class="inline-flex size-[18px] shrink-0 items-center justify-center rounded-full text-xs font-bold text-white {c.ok ? 'bg-emerald-600' : 'bg-destructive'}"
          aria-hidden="true"
        >{c.ok ? '✓' : '✗'}</span>
        <span>{c.ok ? c.label : c.bad}</span>
      </li>
    {/each}
  </ul>

  <div class="mt-4 flex flex-wrap justify-end gap-2">
    {#if running}
      <Button variant="secondary" type="button" onclick={stopCamera}>Apagar cámara</Button>
      <Button type="button" onclick={takePhoto} disabled={!allOk}>Tomar foto</Button>
    {:else}
      <Button type="button" onclick={startCamera} disabled={loadingDetector}>
        {loadingDetector ? 'Cargando…' : 'Activar cámara'}
      </Button>
    {/if}
  </div>
</div>

