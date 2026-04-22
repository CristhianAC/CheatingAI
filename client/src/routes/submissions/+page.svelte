<script>
  import SubmissionForm from '$lib/components/SubmissionForm.svelte';
  import SubmissionList from '$lib/components/SubmissionList.svelte';
  import PageHeader from '$lib/components/PageHeader.svelte';
  import { submissions } from '$lib/stores.js';

  let listRef;

  function onCreated() {
    listRef?.reload();
  }

  function onLoaded(event) {
    submissions.set(event.detail);
  }
</script>

<svelte:head><title>Entregas de código | Procto</title></svelte:head>

<PageHeader
  focus="Plagio"
  title="Entregas de código"
  subtitle="Gestiona las entregas de los participantes. Pulsa una fila para ver el código fuente."
/>

<SubmissionForm on:created={onCreated} />
<SubmissionList bind:this={listRef} on:loaded={onLoaded} />
