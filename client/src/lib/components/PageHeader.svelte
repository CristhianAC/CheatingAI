<script>
  /** Título de página alineado al sistema visual Procto */
  export let title = '';
  /** Subtítulo opcional */
  export let subtitle = '';
  /**
   * Etiqueta corta que ancla el foco del contexto (ej. área del producto).
   */
  export let focus = '';
</script>

<header class="page-header">
  <div class="page-header__focus">
    {#if focus}
      <p class="page-header__eyebrow">{focus}</p>
    {/if}
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
    gap: 1.25rem;
    margin-bottom: 2.25rem;
    flex-wrap: wrap;
    padding-bottom: 1.25rem;
    border-bottom: 1px solid var(--procto-border, rgba(0, 0, 0, 0.08));
  }

  .page-header__focus {
    flex: 1;
    min-width: min(100%, 280px);
    border-left: 4px solid var(--procto-accent, #0071e3);
    padding-left: 1.125rem;
    margin-left: 2px;
  }

  .page-header__eyebrow {
    margin: 0 0 0.5rem;
    font-size: 0.6875rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.14em;
    color: var(--procto-accent, #0071e3);
  }

  .page-header__title {
    font-size: clamp(1.75rem, 4vw, 2.125rem);
    font-weight: 700;
    letter-spacing: -0.045em;
    color: var(--procto-text, #1d1d1f);
    margin: 0 0 0.5rem;
    line-height: 1.08;
  }

  .page-header__subtitle {
    margin: 0;
    font-size: 1rem;
    line-height: 1.5;
    color: var(--procto-text-secondary, #6e6e73);
    max-width: 40rem;
  }

  .page-header__actions {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    flex-shrink: 0;
    padding-top: 0.15rem;
  }
</style>
