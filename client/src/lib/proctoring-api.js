// Proctoring service (port 8001) proxied via Vite dev server

import { captureVideoFrameBase64 } from '$lib/camera-ready.js';



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



function _parseJsonBody(text) {
  if (!text?.trim()) return null;
  try {
    return JSON.parse(text);
  } catch {
    return undefined;
  }
}

function _httpErrorMessage(res, text) {
  if (res.status >= 500) {
    return 'El servicio de supervisión tuvo un error interno. Intenta de nuevo en unos segundos.';
  }
  const snippet = text?.trim().slice(0, 120);
  return snippet ? `Error ${res.status}: ${snippet}` : `Error ${res.status}`;
}

async function request(method, url, body = null) {
  const token = _getToken();
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const opts = { method, headers };
  if (body !== null) opts.body = JSON.stringify(body);

  const res = await fetch(url, opts);
  if (res.status === 204) return null;

  const text = await res.text();
  const data = _parseJsonBody(text);

  if (!res.ok) {
    if (data === undefined) {
      const err = new Error(_httpErrorMessage(res, text));
      err.status = res.status;
      throw err;
    }
    const detail = data?.detail;
    if (detail && typeof detail === 'object' && detail.message) {
      const err = new Error(detail.message);
      err.code = detail.code;
      err.existingSessionId = detail.existing_session_id;
      err.status = res.status;
      throw err;
    }
    const msg = detail || `Error ${res.status}`;
    const err = new Error(typeof msg === 'string' ? msg : JSON.stringify(msg));
    err.status = res.status;
    throw err;
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



export function getExamsSummary() {

  return request('GET', `${SESSION_BASE}/exams-summary`);

}



export function getSessionsByExam(examId) {

  return request('GET', `${SESSION_BASE}/by-exam/${encodeURIComponent(examId)}`);

}



export function getSessionReport(sessionId) {

  return request('GET', `${SESSION_BASE}/${sessionId}/report`);

}



// ── Browser events ────────────────────────────────────────────────────────────



export function reportBrowserEvent(sessionId, eventType) {

  return request('POST', `${PROCTOR_BASE}/browser-event`, {

    session_id: sessionId,

    event_type: eventType,

  });

}



// ── Identity verification ─────────────────────────────────────────────────────



/**

 * @param {HTMLVideoElement} videoEl

 * @param {string} sessionId

 */

export async function registerIdentity(videoEl, sessionId) {

  const frame_base64 = await captureVideoFrameBase64(videoEl, 0.9);

  return request('POST', `${PROCTOR_BASE}/register-identity`, {

    session_id: sessionId,

    frame_base64,

  });

}



export async function checkIdentity(videoEl, sessionId) {

  const frame_base64 = await captureVideoFrameBase64(videoEl, 0.9);

  return request('POST', `${PROCTOR_BASE}/check-identity`, {

    session_id: sessionId,

    frame_base64,

  });

}



// ── Frame Analysis ────────────────────────────────────────────────────────────



/**

 * @param {HTMLVideoElement} videoEl

 * @param {string|null} sessionId

 * @param {number} quality

 * @param {string|null} studentId

 */

export async function analyzeFrame(videoEl, sessionId = null, quality = 0.7, studentId = null) {

  const frame_base64 = await captureVideoFrameBase64(videoEl, quality);

  return request('POST', `${PROCTOR_BASE}/analyze-frame`, {

    session_id: sessionId,

    student_id: studentId || null,

    frame_base64,

  });

}



export async function calibrateFrame(videoEl) {

  const frame_base64 = await captureVideoFrameBase64(videoEl, 0.7);

  return request('POST', `${PROCTOR_BASE}/calibrate`, { frame_base64 });

}

/** Comprueba disponibilidad del servicio de supervisión (proxied en dev). */
export async function proctoringHealthCheck() {
  const res = await fetch('/proctoring-health', { method: 'GET' });
  if (!res.ok) throw new Error('Servicio de supervisión no disponible');
  return res.json();
}


