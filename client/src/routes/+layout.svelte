<script>
  import Toast from '$lib/components/Toast.svelte';
  import { page } from '$app/stores';

  const NAV = [
    { href: '/submissions', label: '📄 Submissions' },
    { href: '/analysis',    label: '🔍 Analysis' },
    { href: '/jobs',        label: '📊 Jobs' },
    { href: '/proctoring',  label: '📷 Supervisión' },
  ];
</script>

<div class="app-shell">
  <header class="header">
    <div class="header-inner">
      <a href="/" class="logo">
        <span class="logo-icon">🕵️</span>
        <span class="logo-text">CheatingAI</span>
        <span class="logo-sub">Detector de Plagio</span>
      </a>

      <nav class="nav">
        {#each NAV as { href, label }}
          <a
            {href}
            class="nav-link"
            class:active={$page.url.pathname.startsWith(href)}
          >
            {label}
          </a>
        {/each}
      </nav>

      <a
        href="http://localhost:8000/docs"
        target="_blank"
        rel="noopener"
        class="api-link"
      >
        📖 API Docs ↗
      </a>
    </div>
  </header>

  <main class="main">
    <slot />
  </main>

  <Toast />
</div>

<style>
  :global(*, *::before, *::after) { box-sizing: border-box; margin: 0; padding: 0; }
  :global(body) {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    background: #f1f5f9;
    color: #1f2937;
    line-height: 1.5;
  }

  /* Inputs, selects, textareas globales */
  :global(input:not([type=range]):not([type=checkbox])),
  :global(select),
  :global(textarea) {
    width: 100%;
    padding: 0.5rem 0.75rem;
    border: 1.5px solid #d1d5db;
    border-radius: 8px;
    font-size: 0.9rem;
    font-family: inherit;
    background: #fff;
    transition: border-color 0.15s;
    color: #1f2937;
  }
  :global(input:focus), :global(select:focus), :global(textarea:focus) {
    outline: none;
    border-color: #6366f1;
    box-shadow: 0 0 0 3px rgba(99,102,241,0.1);
  }
  :global(textarea) { resize: vertical; }

  /* Labels globales */
  :global(label) {
    display: block;
    font-size: 0.83rem;
    font-weight: 600;
    color: #374151;
    margin-bottom: 0.35rem;
  }

  /* Campo global */
  :global(.field) { display: flex; flex-direction: column; margin-bottom: 0.85rem; }

  /* Cards */
  :global(.card) {
    background: #fff;
    border-radius: 14px;
    padding: 1.5rem;
    box-shadow: 0 1px 3px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.04);
    margin-bottom: 1.5rem;
  }
  :global(.card__title) {
    font-size: 1.1rem;
    font-weight: 700;
    color: #1f2937;
    margin-bottom: 1.1rem;
    display: flex;
    align-items: center;
    gap: 0.4rem;
  }

  /* Botones */
  :global(.btn) {
    display: inline-flex; align-items: center; justify-content: center; gap: 0.4rem;
    padding: 0.5rem 1.1rem;
    border-radius: 8px;
    font-size: 0.88rem;
    font-weight: 600;
    cursor: pointer;
    border: none;
    transition: all 0.15s;
    text-decoration: none;
  }
  :global(.btn:disabled) { opacity: 0.55; cursor: not-allowed; }
  :global(.btn--primary)   { background: #6366f1; color: #fff; }
  :global(.btn--primary:hover:not(:disabled)) { background: #4f46e5; }
  :global(.btn--secondary) { background: #e5e7eb; color: #374151; }
  :global(.btn--secondary:hover:not(:disabled)) { background: #d1d5db; }
  :global(.btn--ghost)     { background: transparent; color: #6b7280; border: 1.5px solid #d1d5db; }
  :global(.btn--ghost:hover:not(:disabled)) { background: #f9fafb; }
  :global(.btn--danger)    { background: #fee2e2; color: #991b1b; }
  :global(.btn--danger:hover:not(:disabled)) { background: #fecaca; }
  :global(.btn--sm)        { padding: 0.3rem 0.75rem; font-size: 0.8rem; }

  /* Header */
  .header {
    background: #fff;
    border-bottom: 1px solid #e5e7eb;
    position: sticky; top: 0; z-index: 100;
    box-shadow: 0 1px 3px rgba(0,0,0,0.05);
  }
  .header-inner {
    max-width: 1100px; margin: 0 auto;
    padding: 0 1.5rem;
    display: flex; align-items: center; gap: 1.5rem;
    height: 58px;
  }

  .logo {
    display: flex; align-items: center; gap: 0.5rem;
    text-decoration: none; flex-shrink: 0;
  }
  .logo-icon { font-size: 1.4rem; }
  .logo-text { font-size: 1rem; font-weight: 800; color: #6366f1; }
  .logo-sub { font-size: 0.72rem; color: #9ca3af; display: none; }
  @media (min-width: 640px) { .logo-sub { display: block; } }

  .nav { display: flex; gap: 0.25rem; flex: 1; }
  .nav-link {
    padding: 0.4rem 0.85rem;
    border-radius: 8px;
    font-size: 0.88rem;
    font-weight: 500;
    color: #6b7280;
    text-decoration: none;
    transition: all 0.15s;
  }
  .nav-link:hover { background: #f3f4f6; color: #1f2937; }
  .nav-link.active { background: #eef2ff; color: #6366f1; font-weight: 700; }

  .api-link {
    font-size: 0.8rem; color: #9ca3af; text-decoration: none;
    white-space: nowrap; flex-shrink: 0;
    padding: 0.3rem 0.6rem; border-radius: 6px;
    border: 1px solid #e5e7eb;
    transition: all 0.15s;
  }
  .api-link:hover { color: #6366f1; border-color: #c7d2fe; }

  .main {
    max-width: 1100px; margin: 0 auto;
    padding: 2rem 1.5rem;
  }
</style>
