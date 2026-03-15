// Proctoring service (port 8001) proxied via Vite dev server
const SESSION_BASE = '/api/v1/sessions';
const PROCTOR_BASE = '/api/v1/proctoring';

async function request(method, url, body = null) {
  const opts = { method, headers: { 'Content-Type': 'application/json' } };
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

// ── Frame Analysis ────────────────────────────────────────────────────────────

/**
 * Capture a frame from a <video> element and send it for analysis.
 * @param {HTMLVideoElement} videoEl - The live webcam video element
 * @param {string|null} sessionId - Active session ID or null (no persistence)
 * @param {number} quality - JPEG quality 0.0-1.0 (default 0.7)
 */
export async function analyzeFrame(videoEl, sessionId = null, quality = 0.7) {
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
