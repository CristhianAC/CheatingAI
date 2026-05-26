import { writable, get } from 'svelte/store';
import { browser } from '$app/environment';

const STORAGE_KEY = 'procto_theme';

/** @typedef {'light' | 'dark' | 'system'} ThemePreference */

/** @type {import('svelte/store').Writable<ThemePreference>} */
export const themePreference = writable('system');

function systemPrefersDark() {
  if (!browser) return false;
  return window.matchMedia('(prefers-color-scheme: dark)').matches;
}

/** @param {ThemePreference} pref */
export function resolveDark(pref) {
  if (pref === 'dark') return true;
  if (pref === 'light') return false;
  return systemPrefersDark();
}

/** @param {boolean} isDark */
export function applyThemeToDocument(isDark) {
  if (!browser) return;
  document.documentElement.classList.toggle('dark', isDark);
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) {
    meta.setAttribute('content', isDark ? '#18181b' : '#f5f5f7');
  }
}

/** @param {ThemePreference} pref */
export function setThemePreference(pref) {
  themePreference.set(pref);
  if (browser) {
    localStorage.setItem(STORAGE_KEY, pref);
    applyThemeToDocument(resolveDark(pref));
  }
}

export function toggleTheme() {
  const current = get(themePreference);
  const isDark = resolveDark(current);
  setThemePreference(isDark ? 'light' : 'dark');
}

export function initTheme() {
  if (!browser) return;
  let pref = /** @type {ThemePreference} */ ('system');
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === 'light' || stored === 'dark' || stored === 'system') {
      pref = stored;
    }
  } catch {
    /* ignore */
  }
  themePreference.set(pref);
  applyThemeToDocument(resolveDark(pref));

  const mq = window.matchMedia('(prefers-color-scheme: dark)');
  const onChange = () => {
    if (get(themePreference) === 'system') {
      applyThemeToDocument(systemPrefersDark());
    }
  };
  mq.addEventListener('change', onChange);
  return () => mq.removeEventListener('change', onChange);
}
