/** Textos para el estudiante (alineados con violation_messages.py del backend). */

export const STUDENT_VIOLATION_LABELS = {
  multiple_persons: 'Varias personas en cámara',
  no_person: 'Rostro no visible',
  looking_away: 'Mirada desviada',
  phone_detected: 'Posible uso de teléfono',
  tab_switch: 'Cambio de pestaña',
  window_blur: 'Cambio de ventana',
  identity_mismatch: 'Verificación de identidad',
};

export const STUDENT_VIOLATION_HINTS = {
  multiple_persons: 'Debes estar solo durante la prueba.',
  no_person: 'Colócate frente a la cámara con buena luz.',
  looking_away: 'Mira de nuevo hacia la pantalla del examen.',
  phone_detected: 'Guarda el teléfono y mantén las manos visibles.',
  tab_switch: 'Permanece en la pestaña del examen.',
  window_blur: 'Vuelve a la ventana del examen.',
  identity_mismatch: 'Asegúrate de ser tú quien realiza el examen.',
};

/** Normaliza LOOKING_AWAY / looking_away → clave de mapa. */
export function normalizeViolationType(type) {
  if (!type || typeof type !== 'string') return '';
  return type.toLowerCase();
}

export function studentViolationLabel(type) {
  const key = normalizeViolationType(type);
  return STUDENT_VIOLATION_LABELS[key] ?? 'Señal detectada';
}

export function studentViolationHint(type) {
  const key = normalizeViolationType(type);
  return STUDENT_VIOLATION_HINTS[key] ?? 'Revisa tu postura y el entorno.';
}

/** Mensajes de verificación de identidad al iniciar supervisión. */
export const IDENTITY_STEP_MESSAGES = {
  preparing_camera: 'Preparando cámara…',
  finding_face: 'Buscando tu rostro…',
  verifying: 'Verificando identidad…',
  verifying_slow:
    'La primera verificación puede tardar unos segundos. Mantén el rostro centrado.',
};

export const IDENTITY_REASON_MESSAGES = {
  no_face: 'No vimos tu rostro. Centra la cara, mejora la luz y quita objetos delante.',
  multiple_faces: 'Debe aparecer solo una persona. Retira a quien esté detrás o al lado.',
  model_error: 'No pudimos leer tu rostro con claridad. Intenta de nuevo con mejor luz.',
  default: 'No se pudo verificar tu identidad. Revisa la cámara e inténtalo otra vez.',
};

export function identityMessageForReason(reasonCode, serverMessage) {
  if (serverMessage?.trim()) return serverMessage;
  return IDENTITY_REASON_MESSAGES[reasonCode] ?? IDENTITY_REASON_MESSAGES.default;
}
