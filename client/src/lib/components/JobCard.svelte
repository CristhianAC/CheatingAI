<script>
  export let job;
  export let selected = false;

  const STATUS_ICON = {
    pending:   '⏳',
    running:   '⚙️',
    completed: '✅',
    failed:    '❌'
  };

  function fmt(dt) {
    return dt ? new Date(dt).toLocaleString('es-CO') : '—';
  }

  $: duration = (() => {
    if (!job.started_at || !job.finished_at) return null;
    const ms = new Date(job.finished_at) - new Date(job.started_at);
    return ms < 1000 ? `${ms}ms` : `${(ms/1000).toFixed(1)}s`;
  })();
</script>

<div
  class="job-card mb-3 cursor-pointer rounded-xl border border-border bg-card p-4 shadow-sm transition-shadow hover:shadow-md {selected ? 'ring-2 ring-primary' : ''} {job.status === 'completed' ? 'hover:border-primary/40' : ''}"
  class:selected
  class:completed={job.status === 'completed'}
>
  <div class="job-top">
    <div class="job-left">
      <span class="job-icon">{STATUS_ICON[job.status]}</span>
      <div>
        <div class="job-id">
          <code>{job.id.slice(0,8)}…</code>
          <span class="badge-type badge-type--{job.job_type}">{job.job_type}</span>
        </div>
        <div class="job-scope">
          {#if job.problem_id}📁 {job.problem_id}{/if}
          {#if job.exam_id}📋 {job.exam_id}{/if}
          {#if job.submission_a_id}🔗 Par a par{/if}
        </div>
      </div>
    </div>
    <span class="badge-status badge-status--{job.status}">{job.status}</span>
  </div>

  <div class="job-stats">
    {#if job.total_comparisons > 0}
      <span>🔁 {job.completed_comparisons}/{job.total_comparisons} comparaciones</span>
    {/if}
    {#if duration}
      <span>⏱️ {duration}</span>
    {/if}
    <span>🕐 {fmt(job.created_at)}</span>
  </div>

  {#if job.status === 'running' && job.total_comparisons > 0}
    {@const pct = Math.round((job.completed_comparisons / job.total_comparisons) * 100)}
    <div class="mini-progress">
      <div class="mini-bar" style="width:{pct}%"></div>
    </div>
  {/if}

  {#if job.error_message}
    <p class="job-error">⚠️ {job.error_message}</p>
  {/if}
</div>

<style>
  .job-card {
    padding: 1rem; border-radius: 10px;
    border: 2px solid #e5e7eb;
    cursor: pointer; transition: all 0.15s;
    background: #fff;
  }
  .job-card:hover { border-color: var(--procto-accent, #0071e3); }
  .job-card.selected { border-color: var(--procto-accent, #0071e3); background: rgba(0, 113, 227, 0.08); }
  .job-card.completed { border-color: #10b981; }

  .job-top {
    display: flex; justify-content: space-between;
    align-items: flex-start; margin-bottom: 0.5rem;
  }
  .job-left { display: flex; align-items: flex-start; gap: 0.6rem; }
  .job-icon { font-size: 1.3rem; margin-top: 0.1rem; }

  .job-id { display: flex; align-items: center; gap: 0.4rem; }
  .job-id code { font-family: monospace; font-size: 0.82rem; color: #374151; }

  .job-scope { font-size: 0.78rem; color: #6b7280; margin-top: 0.15rem; }

  .badge-type {
    padding: 0.15rem 0.45rem; border-radius: 999px; font-size: 0.7rem; font-weight: 600;
  }
  .badge-type--batch    { background: #dbeafe; color: #1e40af; }
  .badge-type--pairwise { background: #f3e8ff; color: #6d28d9; }

  .badge-status {
    padding: 0.2rem 0.6rem; border-radius: 999px; font-size: 0.75rem; font-weight: 600;
    white-space: nowrap;
  }
  .badge-status--pending   { background: #fef9c3; color: #713f12; }
  .badge-status--running   { background: #dbeafe; color: #1e40af; }
  .badge-status--completed { background: #d1fae5; color: #065f46; }
  .badge-status--failed    { background: #fee2e2; color: #991b1b; }

  .job-stats {
    display: flex; gap: 1rem; flex-wrap: wrap;
    font-size: 0.78rem; color: #6b7280;
  }

  .mini-progress {
    height: 5px; background: #e5e7eb; border-radius: 999px;
    overflow: hidden; margin-top: 0.5rem;
  }
  .mini-bar {
    height: 100%; border-radius: 999px;
    background: linear-gradient(90deg, var(--procto-accent, #0071e3), #5ac8fa);
    transition: width 0.4s ease;
  }

  .job-error { font-size: 0.8rem; color: #ef4444; margin-top: 0.5rem; }
</style>
