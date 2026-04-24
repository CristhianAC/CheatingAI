<script>
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { get } from 'svelte/store';
  import Toast from '$lib/components/Toast.svelte';
  import { authStore, initAuth, logout } from '$lib/auth.js';
  import { page } from '$app/stores';

  const NAV = [
    { href: '/submissions', label: 'Entregas' },
    { href: '/analysis', label: 'Análisis' },
    { href: '/jobs', label: 'Trabajos' },
  ];

  function isPublicAuthPath(pathname) {
    return pathname === '/login' || pathname === '/register';
  }

  function handleLogout() {
    logout();
    goto('/login');
  }

  $: isAuthPage = $page.url.pathname === '/login' || $page.url.pathname === '/register';

  onMount(() => {
    initAuth();

    // Redirigir usuario autenticado fuera de páginas públicas
    const currentPath = $page.url.pathname;
    const currentToken = get(authStore)?.token ?? null;
    if (isPublicAuthPath(currentPath) && currentToken) {
      goto('/');
    }

    const enforceAuth = (token) => {
      const pathname = $page.url.pathname;
      if (!isPublicAuthPath(pathname) && !token) {
        goto('/login');
      }
    };

    enforceAuth(get(authStore)?.token ?? null);
    const unsubscribe = authStore.subscribe((value) => enforceAuth(value?.token ?? null));
    return unsubscribe;
  });
</script>

<div class="app-shell">
  <header class="header">
    <div class="header-inner">
      <a href="/" class="brand-lockup" aria-label="Procto, inicio">
        <span class="brand-lockup__mark" aria-hidden="true">
          <img
            class="logo-img"
            src="/roble_amarillo.png"
            alt=""
            width="56"
            height="56"
            decoding="async"
          />
        </span>
        <span class="brand-lockup__wordmark">Procto</span>
      </a>

      {#if !isAuthPage}
        <nav class="nav" aria-label="Principal">
          {#each NAV as { href, label }}
            <a
              {href}
              class="nav-link"
              class:active={$page.url.pathname.startsWith(href)}
            >
              {label}
            </a>
          {/each}
          {#if $authStore?.role === 'PROFESSOR'}
            <a href="/exams" class="nav-link" class:active={$page.url.pathname.startsWith('/exams')}>
              Exámenes
            </a>
          {/if}
          {#if $authStore?.role === 'STUDENT'}
            <a href="/join-exam" class="nav-link" class:active={$page.url.pathname.startsWith('/join-exam')}>
              Unirse a examen
            </a>
          {/if}
        </nav>

        {#if $authStore?.user}
          <div class="user-chip">
            <span class="user-chip__name">{$authStore.user.full_name}</span>
            <span class="user-chip__sep" aria-hidden="true">·</span>
            <button class="user-chip__logout" on:click={handleLogout}>Salir</button>
          </div>
        {/if}
      {/if}
    </div>
  </header>

  <main class="main">
    <slot />
  </main>

  <Toast />
</div>

<style>
  /* Tokens Procto: referencia var(--procto-*) en páginas y componentes */
  :global(:root) {
    --procto-bg: #f5f5f7;
    --procto-surface: #ffffff;
    --procto-text: #1d1d1f;
    --procto-text-secondary: #6e6e73;
    --procto-border: rgba(0, 0, 0, 0.08);
    --procto-border-strong: rgba(0, 0, 0, 0.12);
    --procto-accent: #0071e3;
    --procto-accent-hover: #0077ed;
    --procto-accent-muted: rgba(0, 113, 227, 0.12);
    --procto-radius: 12px;
    --procto-radius-sm: 8px;
    --procto-shadow-card: 0 1px 2px rgba(0, 0, 0, 0.04), 0 4px 24px rgba(0, 0, 0, 0.06);
    --procto-font: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
    --procto-header-h: 76px;
  }

  :global(*, *::before, *::after) {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
  }

  :global(body) {
    font-family: var(--procto-font);
    background: var(--procto-bg);
    color: var(--procto-text);
    line-height: 1.5;
    -webkit-font-smoothing: antialiased;
  }

  /* Inputs, selects, textareas globales */
  :global(input:not([type='range']):not([type='checkbox'])),
  :global(select),
  :global(textarea) {
    width: 100%;
    padding: 0.5rem 0.75rem;
    border: 1px solid var(--procto-border-strong);
    border-radius: var(--procto-radius-sm);
    font-size: 0.9rem;
    font-family: inherit;
    background: var(--procto-surface);
    transition: border-color 0.18s ease, box-shadow 0.18s ease;
    color: var(--procto-text);
  }
  :global(input:focus),
  :global(select:focus),
  :global(textarea:focus) {
    outline: none;
    border-color: var(--procto-accent);
    box-shadow: 0 0 0 3px var(--procto-accent-muted);
  }
  :global(textarea) {
    resize: vertical;
  }

  /* Labels globales */
  :global(label) {
    display: block;
    font-size: 0.83rem;
    font-weight: 600;
    color: #424245;
    margin-bottom: 0.35rem;
  }

  :global(.field) {
    display: flex;
    flex-direction: column;
    margin-bottom: 0.85rem;
  }

  /* Cards */
  :global(.card) {
    background: var(--procto-surface);
    border-radius: var(--procto-radius);
    padding: 1.5rem;
    box-shadow: var(--procto-shadow-card);
    border: 1px solid var(--procto-border);
    margin-bottom: 1.5rem;
  }
  :global(.card__title) {
    font-size: 1.05rem;
    font-weight: 600;
    color: var(--procto-text);
    margin-bottom: 1.1rem;
    display: flex;
    align-items: center;
    gap: 0.4rem;
    letter-spacing: -0.02em;
  }

  /* Botones */
  :global(.btn) {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 0.4rem;
    padding: 0.5rem 1.1rem;
    border-radius: var(--procto-radius-sm);
    font-size: 0.88rem;
    font-weight: 600;
    cursor: pointer;
    border: none;
    transition: background 0.18s ease, color 0.18s ease, border-color 0.18s ease, opacity 0.18s ease;
    text-decoration: none;
  }
  :global(.btn:disabled) {
    opacity: 0.5;
    cursor: not-allowed;
  }
  :global(.btn--primary) {
    background: var(--procto-accent);
    color: #fff;
  }
  :global(.btn--primary:hover:not(:disabled)) {
    background: var(--procto-accent-hover);
  }
  :global(.btn--secondary) {
    background: #e8e8ed;
    color: var(--procto-text);
  }
  :global(.btn--secondary:hover:not(:disabled)) {
    background: #d2d2d7;
  }
  :global(.btn--ghost) {
    background: transparent;
    color: var(--procto-text-secondary);
    border: 1px solid var(--procto-border-strong);
  }
  :global(.btn--ghost:hover:not(:disabled)) {
    background: rgba(0, 0, 0, 0.04);
    color: var(--procto-text);
  }
  :global(.btn--danger) {
    background: #ff3b30;
    color: #fff;
  }
  :global(.btn--danger:hover:not(:disabled)) {
    background: #e6352b;
  }
  :global(.btn--sm) {
    padding: 0.3rem 0.75rem;
    font-size: 0.8rem;
  }

  /* Header */
  .header {
    background: rgba(255, 255, 255, 0.82);
    backdrop-filter: saturate(180%) blur(16px);
    -webkit-backdrop-filter: saturate(180%) blur(16px);
    border-bottom: 1px solid var(--procto-border);
    position: sticky;
    top: 0;
    z-index: 100;
  }
  .header-inner {
    max-width: 1120px;
    margin: 0 auto;
    padding: 0 1.25rem;
    display: flex;
    align-items: center;
    gap: 1.25rem;
    height: var(--procto-header-h);
  }

  .brand-lockup {
    display: flex;
    align-items: center;
    gap: 0.85rem;
    text-decoration: none;
    flex-shrink: 0;
    padding-right: 1.15rem;
    margin-right: 0.35rem;
    border-right: 1px solid var(--procto-border);
    min-height: calc(var(--procto-header-h) - 16px);
  }
  .brand-lockup__mark {
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }
  .logo-img {
    height: 56px;
    width: 56px;
    object-fit: contain;
    display: block;
  }
  .brand-lockup__wordmark {
    font-size: 1.5rem;
    font-weight: 700;
    letter-spacing: -0.042em;
    color: var(--procto-text);
    font-family: var(--procto-font);
    line-height: 1;
  }

  .nav {
    display: flex;
    gap: 0.2rem;
    flex: 1;
    justify-content: center;
    flex-wrap: wrap;
  }
  .nav-link {
    padding: 0.4rem 0.75rem;
    border-radius: 999px;
    font-size: 0.8125rem;
    font-weight: 500;
    color: var(--procto-text-secondary);
    text-decoration: none;
    transition: color 0.18s ease, background 0.18s ease;
  }
  .nav-link:hover {
    background: rgba(0, 0, 0, 0.05);
    color: var(--procto-text);
  }
  .nav-link.active {
    background: rgba(0, 0, 0, 0.07);
    color: var(--procto-text);
    font-weight: 600;
  }

  .main {
    max-width: 1120px;
    margin: 0 auto;
    padding: 2.25rem 1.5rem 3rem;
  }

  /* User chip */
  .user-chip {
    display: flex;
    align-items: center;
    gap: 0.35rem;
    flex-shrink: 0;
    margin-left: auto;
  }
  .user-chip__name {
    font-size: 0.8125rem;
    font-weight: 500;
    color: var(--procto-text-secondary);
    white-space: nowrap;
    max-width: 160px;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .user-chip__sep {
    font-size: 0.8125rem;
    color: var(--procto-text-secondary);
    opacity: 0.5;
  }
  .user-chip__logout {
    font-size: 0.8125rem;
    font-weight: 500;
    color: var(--procto-text-secondary);
    background: none;
    border: none;
    cursor: pointer;
    padding: 0.25rem 0.4rem;
    border-radius: 6px;
    transition: color 0.18s ease, background 0.18s ease;
    white-space: nowrap;
    font-family: inherit;
  }
  .user-chip__logout:hover {
    color: var(--procto-text);
    background: rgba(0, 0, 0, 0.05);
  }
</style>
