<script>
  export let title = '';
  export let subtitle = '';
  export let focus = '';
</script>

<header class="mb-8 flex flex-wrap items-start justify-between gap-4 border-b border-border pb-6">
  <div class="min-w-[min(100%,280px)] flex-1 border-l-4 border-primary pl-4">
    {#if focus}
      <p class="mb-2 text-xs font-semibold uppercase tracking-widest text-primary">{focus}</p>
    {/if}
    <h1 class="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">{title}</h1>
    {#if subtitle}
      <p class="mt-2 max-w-2xl text-base text-muted-foreground">{subtitle}</p>
    {/if}
  </div>
  {#if $$slots.actions}
    <div class="flex shrink-0 items-center gap-2 pt-1">
      <slot name="actions" />
    </div>
  {/if}
</header>
