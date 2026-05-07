<script>
  import { onDestroy } from 'svelte';

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

<div class="countdown" class:countdown--warning={warnLevel === 'warning'} class:countdown--critical={warnLevel === 'critical'}>
  <span class="countdown__label">Tiempo</span>
  {#if isExpired}
    <strong class="countdown__value">Tiempo agotado</strong>
  {:else}
    <strong class="countdown__value">{display}</strong>
  {/if}
</div>

<style>
  .countdown {
    position: sticky;
    top: 0.85rem;
    margin-left: auto;
    z-index: 120;
    width: fit-content;
    background: rgba(255, 255, 255, 0.92);
    border: 1px solid var(--procto-border, rgba(0, 0, 0, 0.08));
    box-shadow: var(--procto-shadow-card, 0 1px 2px rgba(0, 0, 0, 0.04));
    border-radius: 999px;
    padding: 0.35rem 0.75rem;
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    color: var(--procto-text, #1d1d1f);
    pointer-events: none; /* no tapar controles */
  }

  .countdown__label {
    font-size: 0.72rem;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: var(--procto-text-secondary, #6e6e73);
    font-weight: 600;
  }

  .countdown__value {
    font-variant-numeric: tabular-nums;
    font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace;
    font-size: 0.9rem;
    letter-spacing: 0.02em;
  }

  .countdown--warning {
    color: #b45309;
    border-color: rgba(245, 158, 11, 0.35);
    background: rgba(255, 251, 235, 0.92);
  }

  .countdown--critical {
    color: #b91c1c;
    border-color: rgba(239, 68, 68, 0.35);
    background: rgba(254, 242, 242, 0.92);
    animation: pulse 1.2s ease-in-out infinite;
  }

  @keyframes pulse {
    0%, 100% { transform: translateY(0); }
    50% { transform: translateY(-1px); }
  }
</style>

