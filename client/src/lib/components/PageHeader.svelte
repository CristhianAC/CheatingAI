<script>
  /** Título de página alineado al sistema visual Procto */
  export let title = '';
  /** Subtítulo opcional */
  export let subtitle = '';
</script>

<header class="page-header">
  <div class="page-header__text">
    <h1 class="page-header__title">{title}</h1>
    {#if subtitle}
      <p class="page-header__subtitle">{subtitle}</p>
    {/if}
  </div>
  {#if $$slots.actions}
    <div class="page-header__actions">
      <slot name="actions" />
    </div>
  {/if}
</header>

<style>
  .page-header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 1rem;
    margin-bottom: 1.75rem;
    flex-wrap: wrap;
  }
  .page-header__title {
    font-size: 1.625rem;
    font-weight: 600;
    letter-spacing: -0.03em;
    color: var(--procto-text, #1d1d1f);
    margin: 0 0 0.35rem;
    line-height: 1.15;
  }
  .page-header__subtitle {
    margin: 0;
    font-size: 0.9375rem;
    line-height: 1.45;
    color: var(--procto-text-secondary, #6e6e73);
    max-width: 42rem;
  }
  .page-header__actions {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    flex-shrink: 0;
  }
</style>
