/**
 * Espera a que el <video> tenga dimensiones reales antes de capturar frames.
 * Evita enviar JPEG vacíos (videoWidth === 0) justo tras play().
 */

const DEFAULT_TIMEOUT_MS = 8000;
const DEFAULT_MIN_WIDTH = 320;
const POLL_MS = 80;

/**
 * @param {HTMLVideoElement} videoEl
 * @param {{ timeoutMs?: number, minWidth?: number }} [opts]
 * @returns {Promise<void>}
 */
export function waitForVideoReady(videoEl, opts = {}) {
  const timeoutMs = opts.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const minWidth = opts.minWidth ?? DEFAULT_MIN_WIDTH;

  if (!videoEl) {
    return Promise.reject(new Error('No hay elemento de vídeo.'));
  }

  const isReady = () =>
    videoEl.readyState >= 2 && videoEl.videoWidth >= minWidth && videoEl.videoHeight > 0;

  if (isReady()) {
    return Promise.resolve();
  }

  return new Promise((resolve, reject) => {
    const onReady = () => {
      if (isReady()) {
        cleanup();
        resolve();
      }
    };

    const cleanup = () => {
      clearTimeout(timer);
      clearInterval(poll);
      videoEl.removeEventListener('loadedmetadata', onReady);
      videoEl.removeEventListener('playing', onReady);
      videoEl.removeEventListener('resize', onReady);
    };

    videoEl.addEventListener('loadedmetadata', onReady);
    videoEl.addEventListener('playing', onReady);
    videoEl.addEventListener('resize', onReady);

    const poll = setInterval(onReady, POLL_MS);

    const timer = setTimeout(() => {
      cleanup();
      reject(
        new Error(
          'La cámara no está lista. Comprueba los permisos, que ninguna otra app use la cámara y recarga la página.'
        )
      );
    }, timeoutMs);
  });
}

/**
 * @param {HTMLVideoElement} videoEl
 * @param {number} [quality]
 * @param {{ timeoutMs?: number, minWidth?: number }} [opts]
 * @returns {Promise<string>} base64 JPEG sin prefijo data:
 */
export async function captureVideoFrameBase64(videoEl, quality = 0.85, opts = {}) {
  await waitForVideoReady(videoEl, opts);
  const canvas = document.createElement('canvas');
  canvas.width = videoEl.videoWidth;
  canvas.height = videoEl.videoHeight;
  canvas.getContext('2d').drawImage(videoEl, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL('image/jpeg', quality).split(',')[1];
}
