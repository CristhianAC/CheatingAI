<script>
  import { onDestroy } from 'svelte';
  import { cn } from '$lib/utils';

  export let endsAt = '';
  export let onExpired = null;

  let now = Date.now();
  let timer = null;
  let expiredFired = false;

  function getEndsMs() {
    if (!endsAt) return null;
    const d = new Date(endsAt);
    const ms = d.getTime();
    return Number.isFinite(ms) ? ms : null;
  }

  function tick() {
    now = Date.now();
  }

  function pad2(n) {
    return String(n).padStart(2, '0');
  }

  $: endsMs = getEndsMs();
  $: remainingMs = endsMs == null ? null : Math.max(0, endsMs - now);
  $: remainingSec = remainingMs == null ? null : Math.floor(remainingMs / 1000);
  $: isExpired = remainingSec != null && remainingSec <= 0;
  $: warnLevel =
    remainingSec == null
      ? 'unknown'
      : remainingSec <= 60
        ? 'critical'
        : remainingSec <= 5 * 60
          ? 'warning'
          : 'normal';

  $: display = (() => {
    if (remainingSec == null) return '—';
    const total = remainingSec;
    const h = Math.floor(total / 3600);
    const m = Math.floor((total % 3600) / 60);
    const s = total % 60;
    if (h > 0) return `${pad2(h)}:${pad2(m)}:${pad2(s)}`;
    return `${pad2(m)}:${pad2(s)}`;
  })();

  $: if (isExpired && !expiredFired) {
    expiredFired = true;
    if (typeof onExpired === 'function') {
      try {
        onExpired();
      } catch {
        // ignore
      }
    }
  }

  if (typeof window !== 'undefined') {
    timer = setInterval(tick, 1000);
  }

  onDestroy(() => {
    if (timer) clearInterval(timer);
  });
</script>

<div
  class={cn(
    'sticky top-3 z-[120] ml-auto inline-flex w-fit items-center gap-2 rounded-full border bg-card/95 px-3 py-1.5 shadow-sm backdrop-blur pointer-events-none',
    warnLevel === 'warning' && 'border-amber-300/50 bg-amber-50 text-amber-900',
    warnLevel === 'critical' && 'animate-pulse border-red-300/50 bg-red-50 text-red-900'
  )}
>
  <span class="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Tiempo</span>
  {#if isExpired}
    <strong class="font-mono text-sm">Tiempo agotado</strong>
  {:else}
    <strong class="font-mono text-sm tabular-nums">{display}</strong>
  {/if}
</div>
