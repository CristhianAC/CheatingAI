<script>
  import '../app.css';
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { get } from 'svelte/store';
  import { Toaster } from '$lib/components/ui/sonner';
  import { Button } from '$lib/components/ui/button';
  import { authStore, initAuth, logout } from '$lib/auth.js';
  import { initTheme, resolveDark, themePreference, toggleTheme } from '$lib/theme.js';
  import { page } from '$app/stores';
  import { cn } from '$lib/utils';
  import Moon from '@lucide/svelte/icons/moon';
  import Sun from '@lucide/svelte/icons/sun';
  /* Pre-bundle accordion icons to avoid Vite full reload on first report visit */
  import '@lucide/svelte/icons/chevron-down';
  import '@lucide/svelte/icons/chevron-up';

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

  $: isDark = resolveDark($themePreference);

  onMount(() => {
    initAuth();
    const cleanupTheme = initTheme();

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
    return () => {
      unsubscribe();
      cleanupTheme?.();
    };
  });
</script>

<div class="min-h-screen bg-background">
  {#if isAuthPage}
    <div class="relative min-h-screen">
      <div class="absolute right-4 top-4 z-10">
        <Button
          variant="ghost"
          size="icon-sm"
          onclick={toggleTheme}
          aria-label={isDark ? 'Activar modo claro' : 'Activar modo oscuro'}
        >
          {#if isDark}
            <Sun class="size-4" />
          {:else}
            <Moon class="size-4" />
          {/if}
        </Button>
      </div>
      <div class="mx-auto grid min-h-screen max-w-6xl lg:grid-cols-2">
        <div
          class="hidden min-h-screen flex-col items-center justify-center border-r border-border bg-muted/30 px-10 py-16 text-center lg:flex lg:px-14"
        >
          <img
            src="/roble_amarillo.png"
            alt=""
            width="256"
            height="256"
            class="mx-auto mb-3 w-full max-w-[min(460px,82%)] aspect-square object-contain drop-shadow-md"
            decoding="async"
          />
          <h1 class="text-4xl font-semibold tracking-tight text-foreground sm:text-5xl">Procto</h1>
          <p class="mt-4 max-w-md text-base leading-relaxed text-muted-foreground">
            Plataforma de evidencia e integridad académica. Supervisión remota y revisión por tu
            profesor.
          </p>
        </div>
        <main class="flex flex-col justify-center px-6 py-12 sm:px-10">
          <div class="mb-10 flex flex-col items-center text-center lg:hidden">
            <img
              src="/roble_amarillo.png"
              alt=""
              class="size-36 object-contain drop-shadow-sm"
              width="144"
              height="144"
            />
            <p class="mt-2 text-2xl font-semibold tracking-tight">Procto</p>
            <p class="mt-1 text-sm text-muted-foreground">Evidencia e integridad académica</p>
          </div>
          <slot />
        </main>
      </div>
    </div>
  {:else}
  <header
    class="sticky top-0 z-50 border-b border-border/80 bg-card/80 backdrop-blur-xl supports-[backdrop-filter]:bg-card/70"
  >
    <div class="mx-auto flex h-[var(--procto-header-h)] max-w-6xl items-center gap-4 px-4 sm:px-6">
      <a
        href="/"
        class="flex shrink-0 items-center gap-1.5 border-r border-border pr-4 max-sm:gap-1 max-sm:pr-3"
        aria-label="Procto, inicio"
      >
        <img
          src="/roble_amarillo.png"
          alt=""
          width="68"
          height="68"
          class="h-[4.25rem] w-auto max-h-[calc(var(--procto-header-h)-0.5rem)] shrink-0 object-contain drop-shadow-sm"
          decoding="async"
        />
        <span class="text-xl font-bold leading-none tracking-tight text-foreground max-sm:hidden sm:inline"
          >Procto</span
        >
      </a>

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
            <Button
              variant="ghost"
              size="icon-sm"
              onclick={toggleTheme}
              aria-label={isDark ? 'Activar modo claro' : 'Activar modo oscuro'}
              title={isDark ? 'Modo claro' : 'Modo oscuro'}
            >
              {#if isDark}
                <Sun class="size-4" />
              {:else}
                <Moon class="size-4" />
              {/if}
            </Button>
            <Button variant="ghost" size="sm" href="/profile" class="max-w-[10rem] truncate font-medium">
              {$authStore.user.full_name}
            </Button>
            <Button variant="outline" size="sm" onclick={handleLogout}>Salir</Button>
          </div>
        {/if}
    </div>
  </header>

  <main class="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
    <slot />
  </main>
  {/if}

  <Toaster richColors closeButton position="bottom-right" />
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
