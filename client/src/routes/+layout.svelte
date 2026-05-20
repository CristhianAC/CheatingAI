<script>
  import '../app.css';
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { get } from 'svelte/store';
  import Toast from '$lib/components/Toast.svelte';
  import { Button } from '$lib/components/ui/button';
  import { authStore, initAuth, logout } from '$lib/auth.js';
  import { page } from '$app/stores';
  import { cn } from '$lib/utils';

  function isPublicAuthPath(pathname) {
    return pathname === '/login' || pathname === '/register';
  }

  function handleLogout() {
    logout();
    goto('/login');
  }

  function navClass(active) {
    return cn(
      'rounded-full px-3 py-1.5 text-sm font-medium transition-colors',
      active
        ? 'bg-foreground/8 text-foreground'
        : 'text-muted-foreground hover:bg-muted hover:text-foreground'
    );
  }

  $: isAuthPage = $page.url.pathname === '/login' || $page.url.pathname === '/register';
  $: path = $page.url.pathname;

  onMount(() => {
    initAuth();

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

<div class="min-h-screen bg-background">
  <header
    class="sticky top-0 z-50 border-b border-border/80 bg-card/80 backdrop-blur-xl supports-[backdrop-filter]:bg-card/70"
  >
    <div class="mx-auto flex h-[var(--procto-header-h)] max-w-6xl items-center gap-4 px-4 sm:px-6">
      <a
        href="/"
        class="flex shrink-0 items-center gap-3 border-r border-border pr-4"
        aria-label="Procto, inicio"
      >
        <img
          src="/roble_amarillo.png"
          alt=""
          width="48"
          height="48"
          class="size-12 object-contain"
          decoding="async"
        />
        <span class="text-2xl font-bold tracking-tight text-foreground">Procto</span>
      </a>

      {#if !isAuthPage}
        <nav class="flex flex-1 flex-wrap items-center justify-center gap-1 overflow-x-auto max-sm:justify-start max-sm:pb-1" aria-label="Principal">
          {#if $authStore?.role === 'PROFESSOR'}
            <a href="/exams" class={navClass(path.startsWith('/exams'))}>Exámenes</a>
          {/if}
          {#if $authStore?.role === 'STUDENT'}
            <a href="/join-exam" class={navClass(path.startsWith('/join-exam'))}>Unirse a examen</a>
          {/if}
          {#if $authStore?.user}
            <a href="/submissions" class={navClass(path.startsWith('/submissions'))}>Entregas</a>
            <a href="/analysis" class={navClass(path.startsWith('/analysis'))}>Análisis</a>
            <a href="/jobs" class={navClass(path.startsWith('/jobs'))}>Trabajos</a>
          {/if}
        </nav>

        {#if $authStore?.user}
          <div class="ml-auto flex shrink-0 items-center gap-2">
            <Button variant="ghost" size="sm" href="/profile" class="max-w-[10rem] truncate font-medium">
              {$authStore.user.full_name}
            </Button>
            <Button variant="outline" size="sm" onclick={handleLogout}>Salir</Button>
          </div>
        {/if}
      {/if}
    </div>
  </header>

  <main class="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
    <slot />
  </main>

  <Toast />
</div>

<style>
  /* Utilidades globales legacy (páginas en migración F2–F5) */
  :global(input:not([type='range']):not([type='checkbox'])),
  :global(select),
  :global(textarea) {
    width: 100%;
    padding: 0.5rem 0.75rem;
    border: 1px solid var(--procto-border-strong, hsl(240 5.9% 90%));
    border-radius: var(--procto-radius-sm, 0.5rem);
    font-size: 0.9rem;
    font-family: inherit;
    background: var(--procto-surface, #fff);
    color: var(--procto-text);
    transition: border-color 0.18s ease, box-shadow 0.18s ease;
  }
  :global(input:focus-visible),
  :global(select:focus-visible),
  :global(textarea:focus-visible) {
    outline: none;
    border-color: var(--procto-accent);
    box-shadow: 0 0 0 3px var(--procto-accent-muted);
  }
  :global(textarea) {
    resize: vertical;
  }
  :global(label) {
    display: block;
    font-size: 0.83rem;
    font-weight: 600;
    color: var(--procto-text-secondary);
    margin-bottom: 0.35rem;
  }
  :global(.field) {
    display: flex;
    flex-direction: column;
    margin-bottom: 0.85rem;
  }
  :global(.card) {
    background: var(--card);
    border-radius: var(--procto-radius);
    padding: 1.5rem;
    box-shadow: var(--procto-shadow-card, 0 1px 2px rgba(0, 0, 0, 0.04));
    border: 1px solid var(--border);
    margin-bottom: 1.5rem;
  }
  :global(.card__title) {
    font-size: 1.05rem;
    font-weight: 600;
    margin-bottom: 1.1rem;
    letter-spacing: -0.02em;
  }
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
    text-decoration: none;
    transition: background 0.18s ease, color 0.18s ease;
  }
  :global(.btn:disabled) {
    opacity: 0.5;
    cursor: not-allowed;
  }
  :global(.btn--primary) {
    background: var(--primary);
    color: var(--primary-foreground);
  }
  :global(.btn--primary:hover:not(:disabled)) {
    opacity: 0.9;
  }
  :global(.btn--secondary) {
    background: var(--secondary);
    color: var(--secondary-foreground);
  }
  :global(.btn--ghost) {
    background: transparent;
    color: var(--muted-foreground);
    border: 1px solid var(--border);
  }
  :global(.btn--danger) {
    background: var(--destructive);
    color: var(--destructive-foreground);
  }
  :global(.btn--sm) {
    padding: 0.3rem 0.75rem;
    font-size: 0.8rem;
  }
</style>
