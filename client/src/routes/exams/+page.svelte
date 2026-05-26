<script>
  import { onMount } from 'svelte';
  import { browser } from '$app/environment';
  import { afterNavigate } from '$app/navigation';
  import { goto } from '$app/navigation';
  import { get } from 'svelte/store';
  import { authStore, initAuth } from '$lib/auth.js';
  import { createExam, listExams } from '$lib/exams-api.js';
  import {
    deriveExamUiStatus,
    examStatusBadgeClass,
    examStatusLabel,
  } from '$lib/exam-status.js';
  import { showToast } from '$lib/stores.js';
  import PageHeader from '$lib/components/PageHeader.svelte';
  import * as Card from '$lib/components/ui/card';
  import * as Table from '$lib/components/ui/table';
  import * as Dialog from '$lib/components/ui/dialog';
  import { Button } from '$lib/components/ui/button';
  import { Input } from '$lib/components/ui/input';
  import { Label } from '$lib/components/ui/label';
  import { Badge } from '$lib/components/ui/badge';
  import * as Alert from '$lib/components/ui/alert';
  import { Skeleton } from '$lib/components/ui/skeleton';
  import { cn } from '$lib/utils';
  import ClipboardList from '@lucide/svelte/icons/clipboard-list';

  const DURATION_PRESETS = [30, 45, 60, 90, 120];
  const DESCRIPTION_MAX = 500;
  const DESCRIPTION_PREVIEW_MAX = 60;

  let descriptionDialogOpen = false;
  let descriptionDialogText = '';
  let descriptionDialogTitle = '';

  let loading = false;
  let saving = false;
  let error = '';
  let exams = [];
  let createDialogOpen = false;
  let initialAuthResolved = false;
  let hasLoadedOnce = false;
  let searchQuery = '';

  let name = '';
  let description = '';
  let durationPreset = 60;
  let customDuration = '';
  let useCustomDuration = false;
  let scheduledAt = defaultScheduledLocal();

  function pad2(n) {
    return String(n).padStart(2, '0');
  }

  function defaultScheduledLocal() {
    const d = new Date();
    d.setMinutes(d.getMinutes() + 15);
    d.setSeconds(0, 0);
    return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}T${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
  }

  function resetCreateForm() {
    name = '';
    description = '';
    durationPreset = 60;
    customDuration = '';
    useCustomDuration = false;
    scheduledAt = defaultScheduledLocal();
  }

  function openCreateDialog() {
    resetCreateForm();
    createDialogOpen = true;
  }

  $: professorReady = $authStore?.role === 'PROFESSOR' && !!$authStore?.token;
  $: authPending = browser && !initialAuthResolved;
  $: filteredExams = exams.filter((exam) => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return true;
    return (
      (exam.name ?? '').toLowerCase().includes(q) ||
      (exam.code ?? '').toLowerCase().includes(q)
    );
  });
  $: showEmptyState = hasLoadedOnce && !loading && exams.length === 0;
  $: showNoSearchResults =
    hasLoadedOnce && !loading && exams.length > 0 && filteredExams.length === 0;
  $: showTable = hasLoadedOnce && !loading && filteredExams.length > 0;
  $: showLoadingState = loading || authPending || (professorReady && !hasLoadedOnce);

  async function loadExams() {
    if (!professorReady) return;
    loading = true;
    error = '';
    try {
      exams = await listExams();
      hasLoadedOnce = true;
    } catch (e) {
      error = e?.message ?? 'No se pudieron cargar los exámenes';
      hasLoadedOnce = true;
    } finally {
      loading = false;
    }
  }

  function resolvedDurationMinutes() {
    if (useCustomDuration) {
      const n = Number(customDuration);
      return Number.isFinite(n) && n > 0 ? n : null;
    }
    return durationPreset;
  }

  async function submitCreate() {
    const trimmedName = name.trim();
    if (!trimmedName) {
      error = 'El nombre del examen es obligatorio.';
      return;
    }
    const minutes = resolvedDurationMinutes();
    if (useCustomDuration && !minutes) {
      error = 'Indica una duración válida en minutos.';
      return;
    }
    const descTrim = description.trim();
    if (descTrim.length > DESCRIPTION_MAX) {
      error = `La descripción no puede superar ${DESCRIPTION_MAX} caracteres.`;
      return;
    }

    saving = true;
    error = '';
    try {
      await createExam({
        name: trimmedName,
        description: descTrim || null,
        duration_minutes: minutes,
        scheduled_at: scheduledAt ? new Date(scheduledAt).toISOString() : null,
      });
      createDialogOpen = false;
      resetCreateForm();
      showToast('Examen creado correctamente.', 'success');
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

  function openDescriptionDialog(exam) {
    if (!exam?.description?.trim()) return;
    descriptionDialogTitle = exam.name;
    descriptionDialogText = exam.description;
    descriptionDialogOpen = true;
  }

  function descriptionPreview(text) {
    if (!text?.trim()) return '';
    const t = text.trim();
    return t.length > DESCRIPTION_PREVIEW_MAX
      ? `${t.slice(0, DESCRIPTION_PREVIEW_MAX)}…`
      : t;
  }

  function needsDescriptionMore(text) {
    return (text?.trim()?.length ?? 0) > DESCRIPTION_PREVIEW_MAX;
  }

  async function copyDescription() {
    if (!descriptionDialogText || typeof navigator === 'undefined') return;
    try {
      await navigator.clipboard.writeText(descriptionDialogText);
      showToast('Descripción copiada.', 'success');
    } catch {
      showToast('No se pudo copiar el texto.', 'error');
    }
  }

  function selectPreset(minutes) {
    useCustomDuration = false;
    durationPreset = minutes;
  }

  onMount(() => {
    initAuth();
    initialAuthResolved = true;

    const tryLoad = () => {
      if (get(authStore)?.role === 'PROFESSOR' && get(authStore)?.token) {
        void loadExams();
        return true;
      }
      return false;
    };

    if (!tryLoad()) {
      const unsub = authStore.subscribe(() => {
        if (tryLoad()) unsub();
      });
      return unsub;
    }
  });

  afterNavigate(({ to }) => {
    if (to?.url.pathname === '/exams' && get(authStore)?.role === 'PROFESSOR') {
      void loadExams();
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
      <Button onclick={openCreateDialog}>Crear examen</Button>
    </svelte:fragment>
  </PageHeader>

  <Dialog.Root bind:open={createDialogOpen}>
    <Dialog.Content class="sm:max-w-md">
      <Dialog.Header>
        <Dialog.Title>Nuevo examen</Dialog.Title>
        <Dialog.Description>
          Los estudiantes usarán un código de 6 caracteres para unirse desde «Unirse a examen».
        </Dialog.Description>
      </Dialog.Header>

      <form
        class="grid gap-4"
        onsubmit={(e) => {
          e.preventDefault();
          submitCreate();
        }}
      >
        <div class="space-y-2">
          <Label for="name">Nombre del examen</Label>
          <Input id="name" type="text" bind:value={name} placeholder="Ej. Parcial 1" required />
        </div>

        <div class="space-y-2">
          <Label for="desc">Descripción <span class="font-normal text-muted-foreground">(opcional)</span></Label>
          <textarea
            id="desc"
            rows="2"
            bind:value={description}
            maxlength={DESCRIPTION_MAX}
            placeholder="Instrucciones o tema del examen"
            class="flex min-h-[72px] w-full rounded-lg border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          ></textarea>
          <p class="text-right text-xs text-muted-foreground">
            {description.length}/{DESCRIPTION_MAX}
          </p>
        </div>

        <div class="space-y-2">
          <Label>Duración</Label>
          <div class="flex flex-wrap gap-2">
            {#each DURATION_PRESETS as minutes}
              <Button
                type="button"
                size="sm"
                variant={!useCustomDuration && durationPreset === minutes ? 'default' : 'outline'}
                onclick={() => selectPreset(minutes)}
              >
                {minutes} min
              </Button>
            {/each}
            <Button
              type="button"
              size="sm"
              variant={useCustomDuration ? 'default' : 'outline'}
              onclick={() => {
                useCustomDuration = true;
              }}
            >
              Personalizado
            </Button>
          </div>
          {#if useCustomDuration}
            <Input
              type="number"
              min="1"
              bind:value={customDuration}
              placeholder="Minutos"
              class="mt-2 max-w-[8rem]"
            />
          {/if}
        </div>

        <div class="space-y-2">
          <Label for="sched">Inicio programado</Label>
          <Input id="sched" type="datetime-local" bind:value={scheduledAt} />
        </div>

        {#if error}
          <Alert.Root variant="destructive">
            <Alert.Description>{error}</Alert.Description>
          </Alert.Root>
        {/if}

        <Dialog.Footer class="gap-2 sm:gap-0">
          <Button type="button" variant="outline" onclick={() => (createDialogOpen = false)}>Cancelar</Button>
          <Button type="submit" disabled={saving}>{saving ? 'Creando...' : 'Crear examen'}</Button>
        </Dialog.Footer>
      </form>
    </Dialog.Content>
  </Dialog.Root>

  <Dialog.Root bind:open={descriptionDialogOpen}>
    <Dialog.Content class="max-w-lg">
      <Dialog.Header>
        <Dialog.Title>Descripción del examen</Dialog.Title>
        <Dialog.Description>{descriptionDialogTitle}</Dialog.Description>
      </Dialog.Header>
      <div class="max-h-[min(50vh,20rem)] overflow-y-auto rounded-lg border border-border bg-muted/20 p-4">
        <p class="whitespace-pre-wrap break-words text-sm leading-relaxed text-foreground">
          {descriptionDialogText}
        </p>
      </div>
      <Dialog.Footer class="gap-2 sm:gap-0">
        <Button type="button" variant="ghost" onclick={copyDescription}>Copiar texto</Button>
        <Button type="button" variant="outline" onclick={() => (descriptionDialogOpen = false)}>
          Cerrar
        </Button>
      </Dialog.Footer>
    </Dialog.Content>
  </Dialog.Root>

  {#if error && !createDialogOpen}
    <Alert.Root variant="destructive" class="mb-4">
      <Alert.Description>{error}</Alert.Description>
    </Alert.Root>
  {/if}

  <Card.Root class="rounded-xl">
    <Card.Content class="pt-6">
      {#if showLoadingState}
        <div class="space-y-2">
          <Skeleton class="h-10 w-full" />
          <Skeleton class="h-10 w-full" />
          <Skeleton class="h-10 w-full" />
        </div>
      {:else if showEmptyState}
        <div class="flex flex-col items-center gap-4 py-12 text-center">
          <ClipboardList class="size-10 text-muted-foreground/70" aria-hidden="true" />
          <div>
            <p class="font-medium tracking-tight text-foreground">Aún no has creado exámenes</p>
            <p class="mt-1 text-sm text-muted-foreground">
              Crea uno y comparte el código de 6 caracteres con tus estudiantes.
            </p>
          </div>
          <Button onclick={openCreateDialog}>Crear examen</Button>
        </div>
      {:else if showNoSearchResults}
        <p class="py-8 text-center text-sm text-muted-foreground">
          Ningún examen coincide con «{searchQuery.trim()}».
        </p>
      {:else if showTable}
        <div class="mb-4 max-w-sm">
          <Label for="exam-search" class="sr-only">Buscar examen</Label>
          <Input
            id="exam-search"
            type="search"
            placeholder="Buscar por nombre o código…"
            bind:value={searchQuery}
          />
        </div>
        <div class="overflow-x-auto">
          <Table.Root class="table-fixed w-full min-w-[720px] text-sm">
            <Table.Header>
              <Table.Row>
                <Table.Head class="w-[18%]">Nombre</Table.Head>
                <Table.Head class="w-[10%]">Código</Table.Head>
                <Table.Head class="w-[12%]">Estado</Table.Head>
                <Table.Head class="w-[22%]">Descripción</Table.Head>
                <Table.Head class="w-[10%]">Duración</Table.Head>
                <Table.Head class="w-[14%]">Fecha</Table.Head>
                <Table.Head class="w-[14%] text-right">Acciones</Table.Head>
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {#each filteredExams as exam}
                {@const uiStatus = deriveExamUiStatus(exam)}
                <Table.Row class="hover:bg-muted/50">
                  <Table.Cell class="font-medium">{exam.name}</Table.Cell>
                  <Table.Cell>
                    <Badge variant="outline" class="font-mono tracking-wider">{exam.code}</Badge>
                  </Table.Cell>
                  <Table.Cell>
                    <Badge variant="outline" class={cn('font-medium', examStatusBadgeClass(uiStatus))}>
                      {examStatusLabel(uiStatus)}
                    </Badge>
                  </Table.Cell>
                  <Table.Cell class="min-w-0 align-top">
                    {#if exam.description?.trim()}
                      <div class="min-w-0 max-w-full space-y-1">
                        <p
                          class="line-clamp-2 break-all text-sm text-muted-foreground"
                          title={exam.description}
                        >
                          {descriptionPreview(exam.description)}
                        </p>
                        {#if needsDescriptionMore(exam.description)}
                          <Button
                            type="button"
                            variant="link"
                            size="sm"
                            class="h-auto p-0 text-xs"
                            aria-label="Ver descripción completa de {exam.name}"
                            onclick={() => openDescriptionDialog(exam)}
                          >
                            Ver más
                          </Button>
                        {/if}
                      </div>
                    {:else}
                      <span class="text-muted-foreground">—</span>
                    {/if}
                  </Table.Cell>
                  <Table.Cell>{exam.duration_minutes ? `${exam.duration_minutes} min` : '—'}</Table.Cell>
                  <Table.Cell class="text-muted-foreground">{fmtDate(exam.scheduled_at)}</Table.Cell>
                  <Table.Cell class="text-right">
                    <Button variant="ghost" size="sm" onclick={() => openSessions(exam.id)}>
                      {uiStatus === 'finalizado' ? 'Ver supervisiones' : 'Supervisiones'} →
                    </Button>
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
