<script>
  import { onMount } from 'svelte';
  import { get } from 'svelte/store';
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';
  import PageHeader from '$lib/components/PageHeader.svelte';
  import { authStore } from '$lib/auth.js';
  import { getSessionsByExam } from '$lib/proctoring-api.js';
  import * as Card from '$lib/components/ui/card';
  import * as Table from '$lib/components/ui/table';
  import { Button } from '$lib/components/ui/button';
  import { Badge } from '$lib/components/ui/badge';
  import * as Alert from '$lib/components/ui/alert';
  import { Skeleton } from '$lib/components/ui/skeleton';

  let loading = false;
  let error = '';
  let sessions = [];
  let examId = '';

  function statusValue(status) {
    return typeof status === 'string' ? status : status?.value ?? status;
  }

  function statusLabel(status) {
    const value = statusValue(status);
    return value === 'active' ? 'Activo' : 'Finalizado';
  }

  function openReport(sessionId) {
    goto(`/proctoring/report/${sessionId}`);
  }

  function goBack() {
    goto('/exams');
  }

  async function loadSessions() {
    loading = true;
    error = '';
    try {
      sessions = await getSessionsByExam(examId);
    } catch (e) {
      error = e?.message ?? 'No se pudieron cargar las supervisiones';
    } finally {
      loading = false;
    }
  }

  onMount(async () => {
    if ($authStore?.role !== 'PROFESSOR') {
      goto('/');
      return;
    }
    examId = get(page).params.examId;
    await loadSessions();
  });
</script>

<svelte:head>
  <title>Supervisiones del examen | Procto</title>
</svelte:head>

<PageHeader
  focus="Supervisión"
  title="Supervisiones del examen"
  subtitle="Sesiones de estudiantes vinculadas a este examen."
>
  <svelte:fragment slot="actions">
    <Button variant="outline" size="sm" onclick={goBack}>← Volver a exámenes</Button>
  </svelte:fragment>
</PageHeader>

<Card.Root class="rounded-xl">
  <Card.Content class="pt-6">
    {#if error}
      <Alert.Root variant="destructive" class="mb-4">
        <Alert.Description>{error}</Alert.Description>
      </Alert.Root>
    {/if}
    {#if loading}
      <div class="space-y-2">
        <Skeleton class="h-10 w-full" />
        <Skeleton class="h-10 w-full" />
      </div>
    {:else if sessions.length === 0}
      <p class="text-sm text-muted-foreground">Aún no hay supervisiones para este examen.</p>
    {:else}
      <div class="overflow-x-auto">
        <Table.Root>
          <Table.Header>
            <Table.Row>
              <Table.Head>Estudiante</Table.Head>
              <Table.Head>Email</Table.Head>
              <Table.Head>Inicio</Table.Head>
              <Table.Head>Fin</Table.Head>
              <Table.Head class="text-right">Estado</Table.Head>
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {#each sessions as session}
              <Table.Row>
                <Table.Cell>
                  <Badge variant="secondary">{session.student_name ?? session.student_id}</Badge>
                </Table.Cell>
                <Table.Cell class="text-muted-foreground">{session.student_email ?? '—'}</Table.Cell>
                <Table.Cell>{new Date(session.started_at).toLocaleString('es')}</Table.Cell>
                <Table.Cell>{session.ended_at ? new Date(session.ended_at).toLocaleString('es') : '—'}</Table.Cell>
                <Table.Cell class="text-right">
                  {#if statusValue(session.status) === 'ended' || statusValue(session.status) === 'finalizado'}
                    <Button variant="outline" size="sm" onclick={() => openReport(session.id)}>
                      {statusLabel(session.status)} · Ver reporte
                    </Button>
                  {:else}
                    <Badge class="bg-emerald-100 text-emerald-800 hover:bg-emerald-100">Activo</Badge>
                  {/if}
                </Table.Cell>
              </Table.Row>
            {/each}
          </Table.Body>
        </Table.Root>
      </div>
    {/if}
  </Card.Content>
</Card.Root>
