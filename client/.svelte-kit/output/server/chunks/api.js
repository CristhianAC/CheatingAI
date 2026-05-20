import { g as get } from "./index.js";
import { a as authStore } from "./auth.js";
const CONNECTION_MSG = "No se pudo conectar con el servidor. Verifica que el backend esté activo (puerto 8000).";
function networkErrorMessage(err) {
  if (err instanceof TypeError) return CONNECTION_MSG;
  return err?.message ?? CONNECTION_MSG;
}
async function parseJsonResponse(res) {
  const text = await res.text();
  if (!text || !text.trim()) {
    if (!res.ok) {
      throw new Error(
        res.status >= 500 ? `Error del servidor (${res.status}). ${CONNECTION_MSG}` : CONNECTION_MSG
      );
    }
    return null;
  }
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    const snippet = text.length > 120 ? `${text.slice(0, 120)}…` : text;
    throw new Error(
      `Respuesta inválida del servidor (${res.status}): ${snippet}`
    );
  }
  if (!res.ok) {
    const detail = data?.detail;
    const msg = typeof detail === "string" ? detail : detail != null ? JSON.stringify(detail) : `Error ${res.status}`;
    throw new Error(msg);
  }
  return data;
}
const BASE = "/api/v1";
async function request(method, path, body = null) {
  const auth = get(authStore);
  const headers = { "Content-Type": "application/json" };
  if (auth?.token) {
    headers.Authorization = `Bearer ${auth.token}`;
  }
  const opts = {
    method,
    headers
  };
  if (body !== null) opts.body = JSON.stringify(body);
  try {
    const res = await fetch(`${BASE}${path}`, opts);
    if (res.status === 204) return null;
    return await parseJsonResponse(res);
  } catch (e) {
    if (e instanceof TypeError) throw new Error(networkErrorMessage(e));
    if (e instanceof Error) throw e;
    throw new Error(networkErrorMessage(e));
  }
}
function listSubmissions(filters = {}) {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([k, v]) => {
    if (v) params.set(k, v);
  });
  const qs = params.toString();
  return request("GET", `/submissions/${qs ? "?" + qs : ""}`);
}
function listJobs(filters = {}) {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([k, v]) => {
    if (v) params.set(k, v);
  });
  const qs = params.toString();
  return request("GET", `/jobs/${qs ? "?" + qs : ""}`);
}
export {
  listSubmissions as a,
  listJobs as l,
  request as r
};
