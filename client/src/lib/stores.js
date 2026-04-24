import { writable } from 'svelte/store';

// Lista de submissions cargadas (usada por dropdowns en Analysis)
export const submissions = writable([]);

// Notificación toast global: { message, type: 'success'|'error'|'info' }
export const toast = writable(null);

// Job batch activo en progreso (para polling)
export const activeJob = writable(null);
export const selectedExamStore = writable(null);
// Estructura esperada:
// { id: string, code: string, name: string, professor_id: string }

// ── Helpers de toast ──────────────────────────────────────────────────────────

let toastTimer;

export function showToast(message, type = 'success', duration = 3500) {
  clearTimeout(toastTimer);
  toast.set({ message, type });
  toastTimer = setTimeout(() => toast.set(null), duration);
}

export function showError(message) {
  showToast(message, 'error', 5000);
}

// ── Helper de colores por score ───────────────────────────────────────────────

export function scoreColor(score, isExactCopy = false) {
  if (isExactCopy || score >= 1.0) return 'exact';
  if (score >= 0.75) return 'high';
  if (score >= 0.5)  return 'medium';
  return 'low';
}

export function scoreLabel(score, isExactCopy = false) {
  if (isExactCopy || score >= 1.0) return 'Copia exacta';
  if (score >= 0.75) return 'Alto';
  if (score >= 0.5)  return 'Moderado';
  return 'Bajo';
}
