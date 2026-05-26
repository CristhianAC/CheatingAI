/**
 * Parsea respuestas fetch de la API. Evita "Unexpected end of JSON input"
 * cuando el proxy/backend devuelve body vacío (ECONNRESET, backend caído).
 *
 * Dev local: levantar API en puerto 8000, p.ej. `docker compose up redis api`
 */

const CONNECTION_MSG =
  'No se pudo conectar con el servidor. Verifica que el backend esté activo (puerto 8000).';

export function networkErrorMessage(err) {
  if (err instanceof TypeError) return CONNECTION_MSG;
  return err?.message ?? CONNECTION_MSG;
}

/**
 * @param {Response} res
 * @returns {Promise<unknown>}
 */
export async function parseJsonResponse(res) {
  const text = await res.text();
  if (!text || !text.trim()) {
    if (!res.ok) {
      throw new Error(
        res.status >= 500
          ? `Error del servidor (${res.status}). ${CONNECTION_MSG}`
          : CONNECTION_MSG
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
    if (detail && typeof detail === 'object' && detail.message) {
      const err = new Error(detail.message);
      err.code = detail.code;
      err.scheduledAt = detail.scheduled_at;
      err.status = res.status;
      throw err;
    }
    const msg =
      typeof detail === 'string'
        ? detail
        : detail != null
          ? JSON.stringify(detail)
          : `Error ${res.status}`;
    throw new Error(msg);
  }

  return data;
}
