<script>
  export let percent = 0;      // 0–100
  export let message = '';
  export let status = 'running'; // pending | running | completed | failed
</script>

<div class="progress-wrap">
  <div class="progress-header">
    <span class="progress-status status--{status}">
      {#if status === 'pending'}⏳ En cola
      {:else if status === 'running'}⚙️ Procesando
      {:else if status === 'completed'}✅ Completado
      {:else}❌ Error{/if}
    </span>
    <span class="progress-pct">{percent.toFixed(1)}%</span>
  </div>

  <div class="progress-track">
    <div
      class="progress-fill progress-fill--{status}"
      style="width: {percent}%"
    ></div>
  </div>

  {#if message}
    <p class="progress-msg">{message}</p>
  {/if}
</div>

<style>
  .progress-wrap { margin: 1rem 0; }

  .progress-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 0.4rem;
  }

  .progress-status {
    font-size: 0.85rem;
    font-weight: 600;
    padding: 0.2rem 0.6rem;
    border-radius: 999px;
  }
  .status--pending   { background: #fef9c3; color: #713f12; }
  .status--running   { background: #dbeafe; color: #1e40af; }
  .status--completed { background: #d1fae5; color: #065f46; }
  .status--failed    { background: #fee2e2; color: #991b1b; }

  .progress-pct { font-size: 0.85rem; color: #6b7280; font-weight: 600; }

  .progress-track {
    height: 10px;
    background: #e5e7eb;
    border-radius: 999px;
    overflow: hidden;
  }

  .progress-fill {
    height: 100%;
    border-radius: 999px;
    transition: width 0.4s ease;
  }
  .progress-fill--running   { background: linear-gradient(90deg, var(--procto-accent, #0071e3), #5ac8fa); }
  .progress-fill--completed { background: #10b981; }
  .progress-fill--failed    { background: #ef4444; }
  .progress-fill--pending   { background: #d1d5db; }

  .progress-msg {
    font-size: 0.8rem;
    color: #6b7280;
    margin-top: 0.4rem;
  }
</style>
