import { writable } from 'svelte/store';
import { toast as sonnerToast } from 'svelte-sonner';

// Lista de submissions cargadas (usada por dropdowns en Analysis)
export const submissions = writable([]);

/** @deprecated Legacy store; toasts usan svelte-sonner. */
export const toast = writable(null);

// Job batch activo en progreso (para polling)
export const activeJob = writable(null);
export const selectedExamStore = writable(null);
// Estructura esperada:
// { id: string, code: string, name: string, professor_id: string }

// ── Helpers de toast (svelte-sonner) ─────────────────────────────────────────

export function showToast(message, type = 'success', duration = 3500) {
  const options = { duration };
  if (type === 'error') sonnerToast.error(message, options);
  else if (type === 'info') sonnerToast.info(message, options);
  else sonnerToast.success(message, options);
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
