/** Tailwind class sets for report severity/level (dark-mode safe). */

export const SEVERITY_STYLES = {
  critico: {
    label: 'Crítico',
    card: 'border-destructive/50 bg-destructive/10 dark:bg-destructive/15',
    badge: 'bg-destructive text-destructive-foreground',
    text: 'text-destructive',
  },
  alto: {
    label: 'Alto',
    card: 'border-orange-500/40 bg-orange-500/10 dark:bg-orange-500/15',
    badge: 'bg-orange-600 text-white dark:bg-orange-500',
    text: 'text-orange-700 dark:text-orange-300',
  },
  medio: {
    label: 'Medio',
    card: 'border-yellow-500/40 bg-yellow-500/10 dark:bg-yellow-500/15',
    badge: 'bg-yellow-600 text-white dark:bg-yellow-500',
    text: 'text-yellow-800 dark:text-yellow-200',
  },
  bajo: {
    label: 'Bajo',
    card: 'border-sky-500/40 bg-sky-500/10 dark:bg-sky-500/15',
    badge: 'bg-sky-600 text-white dark:bg-sky-500',
    text: 'text-sky-800 dark:text-sky-200',
  },
};

export const LEVEL_STYLES = {
  bajo: {
    card: 'border-emerald-500/40 bg-emerald-500/10 dark:bg-emerald-500/15',
    score: 'text-emerald-600 dark:text-emerald-400',
    ring: 'border-emerald-400/60',
  },
  medio: {
    card: 'border-yellow-500/40 bg-yellow-500/10 dark:bg-yellow-500/15',
    score: 'text-yellow-700 dark:text-yellow-300',
    ring: 'border-yellow-400/60',
  },
  alto: {
    card: 'border-orange-500/40 bg-orange-500/10 dark:bg-orange-500/15',
    score: 'text-orange-700 dark:text-orange-300',
    ring: 'border-orange-400/60',
  },
  critico: {
    card: 'border-destructive/50 bg-destructive/10 dark:bg-destructive/15',
    score: 'text-destructive',
    ring: 'border-destructive/50',
  },
};

export const VIOLATION_LABELS = {
  multiple_persons: 'Varias personas',
  no_person: 'Participante ausente',
  looking_away: 'Mirada desviada',
  phone_detected: 'Uso de teléfono',
  tab_switch: 'Cambio de pestaña',
  window_blur: 'Pérdida de foco',
  identity_mismatch: 'Persona diferente',
};

export function normalizeViolationType(type) {
  if (!type || typeof type !== 'string') return '';
  return type.toLowerCase();
}

export function violationLabel(type) {
  const key = normalizeViolationType(type);
  return VIOLATION_LABELS[key] ?? type ?? 'Evento';
}

/** Texto humano para cantidad de evidencias en alertas (sin números crudos). */
export function evidenceHint(count) {
  if (!count || count <= 0) return '';
  if (count === 1) return 'Una detección';
  return 'Varias detecciones';
}

export function professorRecommendation(level) {
  switch (level) {
    case 'critico':
      return 'Revisa de inmediato las alertas críticas, la evidencia visual y considera contactar al estudiante antes de calificar.';
    case 'alto':
      return 'Prioriza las alertas de alta severidad y contrasta los eventos con capturas y ventanas de tiempo.';
    case 'medio':
      return 'Revisa los hallazgos señalados y confirma si el patrón es puntual o se repite durante la sesión.';
    default:
      return 'No se requiere acción inmediata. Puedes archivar este reporte o revisarlo brevemente por registro.';
  }
}
