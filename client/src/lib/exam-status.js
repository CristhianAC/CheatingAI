/**
 * Deriva el estado visual de un examen para la UI del profesor.
 * @param {{ status?: string, scheduled_at?: string | null, ends_at?: string | null }} exam
 * @returns {'pendiente' | 'activo' | 'finalizado'}
 */
export function deriveExamUiStatus(exam) {
  const status = (exam?.status || 'scheduled').toLowerCase();
  const now = Date.now();
  const endsMs = exam?.ends_at ? new Date(exam.ends_at).getTime() : null;
  const startsMs = exam?.scheduled_at ? new Date(exam.scheduled_at).getTime() : null;

  if (status === 'finished' || (endsMs != null && Number.isFinite(endsMs) && now >= endsMs)) {
    return 'finalizado';
  }

  if (status === 'active') {
    return 'activo';
  }

  if (
    startsMs != null &&
    Number.isFinite(startsMs) &&
    now >= startsMs &&
    (endsMs == null || !Number.isFinite(endsMs) || now < endsMs)
  ) {
    return 'activo';
  }

  return 'pendiente';
}

/** @param {'pendiente' | 'activo' | 'finalizado'} uiStatus */
export function examStatusLabel(uiStatus) {
  const labels = {
    pendiente: 'Pendiente',
    activo: 'En progreso',
    finalizado: 'Finalizado',
  };
  return labels[uiStatus] ?? 'Pendiente';
}

/** Clases Tailwind para Badge según estado */
export function examStatusBadgeClass(uiStatus) {
  switch (uiStatus) {
    case 'activo':
      return 'border-emerald-500/40 bg-emerald-50 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-200';
    case 'finalizado':
      return 'border-border bg-muted text-muted-foreground';
    default:
      return 'border-amber-500/40 bg-amber-50 text-amber-900 dark:bg-amber-950/40 dark:text-amber-100';
  }
}
