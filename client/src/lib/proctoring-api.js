// Proctoring service (port 8001) proxied via Vite dev server
const SESSION_BASE = '/api/v1/sessions';
const PROCTOR_BASE = '/api/v1/proctoring';

function _getToken() {
  if (typeof window === 'undefined') return null;
  try {
    const raw = sessionStorage.getItem('procto_auth');
    return raw ? JSON.parse(raw)?.token ?? null : null;
  } catch {
    return null;
  }
}

async function request(method, url, body = null) {
  const token = _getToken();
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const opts = { method, headers };
  if (body !== null) opts.body = JSON.stringify(body);

  const res = await fetch(url, opts);
  if (res.status === 204) return null;

  const data = await res.json();
  if (!res.ok) {
    const msg = data?.detail || `Error ${res.status}`;
    throw new Error(typeof msg === 'string' ? msg : JSON.stringify(msg));
  }
  return data;
}

// ── Sessions ──────────────────────────────────────────────────────────────────

export function startSession(examId, studentId) {
  return request('POST', `${SESSION_BASE}/`, { exam_id: examId, student_id: studentId });
}

export function getSessionStats(sessionId) {
  return request('GET', `${SESSION_BASE}/${sessionId}`);
}

export function endSession(sessionId) {
  return request('PUT', `${SESSION_BASE}/${sessionId}/end`);
}

// ── Teacher / reporting views ──────────────────────────────────────────────────

// Summary of exams with number of students and last activity
export function getExamsSummary() {
  return request('GET', `${SESSION_BASE}/exams-summary`);
}

// List of sessions for a given exam
export function getSessionsByExam(examId) {
  return request('GET', `${SESSION_BASE}/by-exam/${encodeURIComponent(examId)}`);
}

// Detailed report for a finished session (used in next step)
export function getSessionReport(sessionId) {
  return request('GET', `${SESSION_BASE}/${sessionId}/report`);
}

// ── Browser events ────────────────────────────────────────────────────────────

/**
 * Report a browser focus/visibility event as a proctoring violation.
 * @param {string} sessionId - Active session ID
 * @param {'tab_switch'|'window_blur'} eventType
 */
export function reportBrowserEvent(sessionId, eventType) {
  return request('POST', `${PROCTOR_BASE}/browser-event`, {
    session_id: sessionId,
    event_type: eventType,
  });
}

// ── Identity verification ─────────────────────────────────────────────────────

function _captureBase64(videoEl, quality = 0.85) {
  const canvas = document.createElement('canvas');
  canvas.width = videoEl.videoWidth || 640;
  canvas.height = videoEl.videoHeight || 480;
  canvas.getContext('2d').drawImage(videoEl, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL('image/jpeg', quality).split(',')[1];
}

/**
 * Capture a reference face embedding at session start.
 * @param {HTMLVideoElement} videoEl
 * @param {string} sessionId
 */
export function registerIdentity(videoEl, sessionId) {
  return request('POST', `${PROCTOR_BASE}/register-identity`, {
    session_id: sessionId,
    frame_base64: _captureBase64(videoEl),
  });
}

/**
 * Compare the current face against the registered identity.
 * Records a violation automatically if mismatch is detected.
 * @param {HTMLVideoElement} videoEl
 * @param {string} sessionId
 */
export function checkIdentity(videoEl, sessionId) {
  return request('POST', `${PROCTOR_BASE}/check-identity`, {
    session_id: sessionId,
    frame_base64: _captureBase64(videoEl),
  });
}

// ── Frame Analysis ────────────────────────────────────────────────────────────

/**
 * Capture a frame from a <video> element and send it for analysis.
 * @param {HTMLVideoElement} videoEl - The live webcam video element
 * @param {string|null} sessionId - Active session ID or null (no persistence)
 * @param {number} quality - JPEG quality 0.0-1.0 (default 0.7)
 */
export async function analyzeFrame(videoEl, sessionId = null, quality = 0.7, studentId = null) {
  const canvas = document.createElement('canvas');
  canvas.width = videoEl.videoWidth || 640;
  canvas.height = videoEl.videoHeight || 480;
  const ctx = canvas.getContext('2d');
  ctx.drawImage(videoEl, 0, 0, canvas.width, canvas.height);

  // canvas.toDataURL returns "data:image/jpeg;base64,<data>"
  // The field_validator in FrameAnalysisRequest strips the prefix automatically
  const dataUrl = canvas.toDataURL('image/jpeg', quality);
  const base64 = dataUrl.split(',')[1];

  return request('POST', `${PROCTOR_BASE}/analyze-frame`, {
    session_id: sessionId,
    student_id: studentId || null,
    frame_base64: base64,
  });
}

/**
 * Calibration call: returns raw gaze values without violation logic.
 * @param {HTMLVideoElement} videoEl
 */
export async function calibrateFrame(videoEl) {
  const canvas = document.createElement('canvas');
  canvas.width = videoEl.videoWidth || 640;
  canvas.height = videoEl.videoHeight || 480;
  canvas.getContext('2d').drawImage(videoEl, 0, 0, canvas.width, canvas.height);
  const base64 = canvas.toDataURL('image/jpeg', 0.7).split(',')[1];
  return request('POST', `${PROCTOR_BASE}/calibrate`, { frame_base64: base64 });
}
