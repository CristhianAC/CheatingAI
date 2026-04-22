import { writable } from 'svelte/store';

const BASE = '/api/v1';
const STORAGE_KEY = 'procto_auth';

export const authStore = writable({
  token: null,
  user: null,
  role: null
});

function setAuthFromTokenResponse(data) {
  const next = {
    token: data.access_token,
    user: {
      id: data.user_id,
      full_name: data.full_name
    },
    role: data.role
  };
  authStore.set(next);
  if (typeof window !== 'undefined') {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  }
  return next;
}

export async function login(email, password) {
  const res = await fetch(`${BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data?.detail || 'No se pudo iniciar sesión');
  }
  return setAuthFromTokenResponse(data);
}

export async function register(email, password, full_name, role = 'STUDENT') {
  const res = await fetch(`${BASE}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, full_name, role })
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data?.detail || 'No se pudo registrar la cuenta');
  }
  return setAuthFromTokenResponse(data);
}

export function logout() {
  authStore.set({ token: null, user: null, role: null });
  if (typeof window !== 'undefined') {
    sessionStorage.removeItem(STORAGE_KEY);
  }
}

export function initAuth() {
  if (typeof window === 'undefined') return;
  const raw = sessionStorage.getItem(STORAGE_KEY);
  if (!raw) return;
  try {
    const parsed = JSON.parse(raw);
    if (parsed?.token) {
      authStore.set({
        token: parsed.token,
        user: parsed.user ?? null,
        role: parsed.role ?? null
      });
    }
  } catch {
    sessionStorage.removeItem(STORAGE_KEY);
  }
}
