const BASE = '/api/v1';

async function request(method, path, body = null) {
  const opts = {
    method,
    headers: { 'Content-Type': 'application/json' }
  };
  if (body !== null) opts.body = JSON.stringify(body);

  const res = await fetch(`${BASE}${path}`, opts);

  if (res.status === 204) return null;

  const data = await res.json();
  if (!res.ok) {
    const msg = data?.detail || `Error ${res.status}`;
    throw new Error(typeof msg === 'string' ? msg : JSON.stringify(msg));
  }
  return data;
}

// ── Submissions ───────────────────────────────────────────────────────────────

export function createSubmission(payload) {
  return request('POST', '/submissions/', payload);
}

export function listSubmissions(filters = {}) {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([k, v]) => { if (v) params.set(k, v); });
  const qs = params.toString();
  return request('GET', `/submissions/${qs ? '?' + qs : ''}`);
}

export function getSubmission(id) {
  return request('GET', `/submissions/${id}`);
}

export function deleteSubmission(id) {
  return request('DELETE', `/submissions/${id}`);
}

// ── Analysis ──────────────────────────────────────────────────────────────────

export function pairwiseAnalysis(payload) {
  return request('POST', '/analysis/pairwise', payload);
}

export function batchAnalysis(payload) {
  return request('POST', '/analysis/batch', payload);
}

// ── Jobs ──────────────────────────────────────────────────────────────────────

export function listJobs(filters = {}) {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([k, v]) => { if (v) params.set(k, v); });
  const qs = params.toString();
  return request('GET', `/jobs/${qs ? '?' + qs : ''}`);
}

export function getJobStatus(jobId) {
  return request('GET', `/jobs/${jobId}`);
}

export function getJobResults(jobId, filters = {}) {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([k, v]) => {
    if (v !== null && v !== undefined && v !== '') params.set(k, v);
  });
  const qs = params.toString();
  return request('GET', `/jobs/${jobId}/results${qs ? '?' + qs : ''}`);
}

// ── Health ────────────────────────────────────────────────────────────────────

export function healthCheck() {
  return fetch('/health').then(r => r.json());
}
