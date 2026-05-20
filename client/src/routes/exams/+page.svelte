<script>
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { authStore } from '$lib/auth.js';
  import { createExam, listExams } from '$lib/exams-api.js';
  import PageHeader from '$lib/components/PageHeader.svelte';
  import * as Card from '$lib/components/ui/card';
  import * as Table from '$lib/components/ui/table';
  import { Button } from '$lib/components/ui/button';
  import { Input } from '$lib/components/ui/input';
  import { Label } from '$lib/components/ui/label';
  import { Badge } from '$lib/components/ui/badge';
  import * as Alert from '$lib/components/ui/alert';
  import { Skeleton } from '$lib/components/ui/skeleton';

  let loading = false;
  let saving = false;
  let error = '';
  let exams = [];
  let showCreate = false;

  let name = '';
  let description = '';
  let durationMinutes = '';
  let scheduledAt = '';

  async function loadExams() {
    loading = true;
    error = '';
    try {
      exams = await listExams();
    } catch (e) {
      error = e?.message ?? 'No se pudieron cargar los exámenes';
    } finally {
      loading = false;
    }
  }

  async function submitCreate() {
    saving = true;
    error = '';
    try {
      await createExam({
        name,
        description: description || null,
        duration_minutes: durationMinutes ? Number(durationMinutes) : null,
        scheduled_at: scheduledAt ? new Date(scheduledAt).toISOString() : null
      });
      name = '';
      description = '';
      durationMinutes = '';
      scheduledAt = '';
      showCreate = false;
      await loadExams();
    } catch (e) {
      error = e?.message ?? 'No se pudo crear el examen';
    } finally {
      saving = false;
    }
  }

  function fmtDate(value) {
    if (!value) return '—';
    return new Date(value).toLocaleString('es');
  }

  function openSessions(examId) {
    goto(`/exams/${examId}/sessions`);
  }

  onMount(async () => {
    if ($authStore?.role === 'PROFESSOR') {
      await loadExams();
    }
  });
</script>

<svelte:head>
  <title>Exámenes | Procto</title>
</svelte:head>

{#if $authStore?.role !== 'PROFESSOR'}
  <Card.Root class="rounded-xl">
    <Card.Header>
      <Card.Title>Acceso restringido</Card.Title>
      <Card.Description>Solo los profesores pueden gestionar exámenes.</Card.Description>
    </Card.Header>
    <Card.Footer>
      <Button variant="secondary" onclick={() => goto('/')}>Volver</Button>
    </Card.Footer>
  </Card.Root>
{:else}
  <PageHeader
    focus="Docencia"
    title="Gestión de exámenes"
    subtitle="Crea exámenes y revisa las supervisiones de cada uno."
  >
    <svelte:fragment slot="actions">
      <Button onclick={() => (showCreate = !showCreate)}>
        {showCreate ? 'Cancelar' : 'Crear examen'}
      </Button>
    </svelte:fragment>
  </PageHeader>

  {#if showCreate}
    <Card.Root class="mb-6 rounded-xl">
      <Card.Header>
        <Card.Title class="text-base">Nuevo examen</Card.Title>
      </Card.Header>
      <Card.Content>
        <form on:submit|preventDefault={submitCreate} class="grid gap-4 sm:grid-cols-2">
          <div class="space-y-2 sm:col-span-2">
            <Label for="name">Nombre</Label>
            <Input id="name" type="text" bind:value={name} required />
          </div>
          <div class="space-y-2 sm:col-span-2">
            <Label for="desc">Descripción</Label>
            <textarea
              id="desc"
              rows="3"
              bind:value={description}
              class="flex min-h-[80px] w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
            ></textarea>
          </div>
          <div class="space-y-2">
            <Label for="dur">Duración (min)</Label>
            <Input id="dur" type="number" min="1" bind:value={durationMinutes} />
          </div>
          <div class="space-y-2">
            <Label for="sched">Fecha programada</Label>
            <Input id="sched" type="datetime-local" bind:value={scheduledAt} />
          </div>
          <div class="sm:col-span-2">
            <Button type="submit" disabled={saving}>{saving ? 'Creando...' : 'Guardar examen'}</Button>
          </div>
        </form>
      </Card.Content>
    </Card.Root>
  {/if}

  {#if error}
    <Alert.Root variant="destructive" class="mb-4">
      <Alert.Description>{error}</Alert.Description>
    </Alert.Root>
  {/if}

  <Card.Root class="rounded-xl">
    <Card.Content class="pt-6">
      {#if loading}
        <div class="space-y-2">
          <Skeleton class="h-10 w-full" />
          <Skeleton class="h-10 w-full" />
        </div>
      {:else if exams.length === 0}
        <p class="text-sm text-muted-foreground">No tienes exámenes creados todavía.</p>
      {:else}
        <div class="overflow-x-auto">
          <Table.Root>
            <Table.Header>
              <Table.Row>
                <Table.Head>Nombre</Table.Head>
                <Table.Head>Código</Table.Head>
                <Table.Head>Descripción</Table.Head>
                <Table.Head>Duración</Table.Head>
                <Table.Head>Fecha</Table.Head>
                <Table.Head class="text-right">Acciones</Table.Head>
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {#each exams as exam}
                <Table.Row>
                  <Table.Cell class="font-medium">{exam.name}</Table.Cell>
                  <Table.Cell><Badge variant="outline" class="font-mono tracking-wider">{exam.code}</Badge></Table.Cell>
                  <Table.Cell class="max-w-[200px] truncate text-muted-foreground">{exam.description ?? '—'}</Table.Cell>
                  <Table.Cell>{exam.duration_minutes ? `${exam.duration_minutes} min` : '—'}</Table.Cell>
                  <Table.Cell class="text-muted-foreground">{fmtDate(exam.scheduled_at)}</Table.Cell>
                  <Table.Cell class="text-right">
                    <Button variant="ghost" size="sm" onclick={() => openSessions(exam.id)}>Supervisiones →</Button>
                  </Table.Cell>
                </Table.Row>
              {/each}
            </Table.Body>
          </Table.Root>
        </div>
      {/if}
    </Card.Content>
  </Card.Root>
{/if}
