<script>
  import SubmissionForm from '$lib/components/SubmissionForm.svelte';
  import SubmissionList from '$lib/components/SubmissionList.svelte';
  import { submissions } from '$lib/stores.js';

  let listRef;

  function onCreated() {
    listRef?.reload();
  }

  function onLoaded(event) {
    submissions.set(event.detail);
  }
</script>

<svelte:head><title>Submissions — CheatingAI</title></svelte:head>

<div class="page-header">
  <h1>📄 Submissions</h1>
  <p>Gestiona las entregas de código de los estudiantes. Haz click en una fila para ver el código fuente.</p>
</div>

<SubmissionForm on:created={onCreated} />
<SubmissionList bind:this={listRef} on:loaded={onLoaded} />

<style>
  .page-header { margin-bottom: 1.5rem; }
  .page-header h1 { font-size: 1.6rem; font-weight: 800; margin-bottom: 0.25rem; }
  .page-header p  { color: #6b7280; font-size: 0.9rem; }
</style>
