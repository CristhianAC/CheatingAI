<script>
  import { onMount, onDestroy } from 'svelte';
  import { get } from 'svelte/store';
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';
  import PageHeader from '$lib/components/PageHeader.svelte';
  import { authStore, initAuth } from '$lib/auth.js';
  import { getSessionsByExam, getSessionStats } from '$lib/proctoring-api.js';
  import * as Card from '$lib/components/ui/card';
  import * as Table from '$lib/components/ui/table';
  import { Button } from '$lib/components/ui/button';
  import { Badge } from '$lib/components/ui/badge';
  import * as Alert from '$lib/components/ui/alert';
  import { Skeleton } from '$lib/components/ui/skeleton';
  import { Input } from '$lib/components/ui/input';
  import { Label } from '$lib/components/ui/label';
  import { cn } from '$lib/utils';
  import Users from '@lucide/svelte/icons/users';

  const POLL_MS = 12_000;

  let loading = false;
  let error = '';
  let searchQuery = '';
  let sessions = [];
  let examId = '';
  /** @type {Record<string, { total_violations: number }>} */
  let liveStats = {};
  let pollHandle = null;

  function statusValue(status) {
    return typeof status === 'string' ? status : status?.value ?? status;
  }

  function statusLabel(status) {
    const value = statusValue(status);
    if (value === 'active') return 'En supervisión';
    if (value === 'aborted') return 'Interrumpido';
    return 'Finalizado';
  }

  function isEnded(status) {
    const v = statusValue(status);
    return v === 'ended' || v === 'finalizado';
  }

  function isActive(status) {
    return statusValue(status) === 'active';
  }

  $: filteredSessions = sessions.filter((session) => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return true;
    const name = (session.student_name ?? '').toLowerCase();
    const email = (session.student_email ?? '').toLowerCase();
    return name.includes(q) || email.includes(q);
  });

  $: showNoSearchResults =
    !loading && sessions.length > 0 && filteredSessions.length === 0;

  function openReport(sessionId) {
    goto(`/proctoring/report/${sessionId}`);
  }

  function goBack() {
    goto('/exams');
  }

  async function refreshLiveStats() {
    const active = sessions.filter((s) => isActive(s.status));
    if (active.length === 0) return;

    const results = await Promise.allSettled(
      active.map(async (s) => {
        const stats = await getSessionStats(s.id);
        return [s.id, stats];
      })
    );

    const next = { ...liveStats };
    for (const r of results) {
      if (r.status === 'fulfilled') {
        const [id, stats] = r.value;
        next[id] = { total_violations: stats?.total_violations ?? 0 };
      }
    }
    liveStats = next;
  }

  async function loadSessions() {
    loading = true;
    error = '';
    try {
      sessions = await getSessionsByExam(examId);
      await refreshLiveStats();
    } catch (e) {
      error = e?.message ?? 'No se pudieron cargar las supervisiones';
    } finally {
      loading = false;
    }
  }

  function startPolling() {
    if (pollHandle) clearInterval(pollHandle);
    pollHandle = setInterval(async () => {
      if (!examId) return;
      try {
        sessions = await getSessionsByExam(examId);
        await refreshLiveStats();
      } catch {
        /* ignore background poll errors */
      }
    }, POLL_MS);
  }

  onMount(async () => {
    initAuth();
    if (get(authStore)?.role !== 'PROFESSOR') {
      goto('/');
      return;
    }
    examId = get(page).params.examId;
    await loadSessions();
    startPolling();
  });

  onDestroy(() => {
    if (pollHandle) clearInterval(pollHandle);
  });
</script>

<svelte:head>
  <title>Supervisiones del examen | Procto</title>
</svelte:head>

<PageHeader
  focus="Supervisión"
  title="Supervisiones del examen"
  subtitle="Estudiantes en curso y sesiones finalizadas. El reporte completo está disponible al terminar la supervisión."
>
  <svelte:fragment slot="actions">
    <Button variant="outline" size="sm" onclick={loadSessions} disabled={loading}>Actualizar</Button>
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
    {#if loading && sessions.length === 0}
      <div class="space-y-2">
        <Skeleton class="h-10 w-full" />
        <Skeleton class="h-10 w-full" />
      </div>
    {:else if sessions.length === 0}
      <div class="flex flex-col items-center gap-4 py-12 text-center">
        <Users class="size-10 text-muted-foreground/70" aria-hidden="true" />
        <div>
          <p class="font-medium tracking-tight text-foreground">Aún no hay supervisiones</p>
          <p class="mt-2 max-w-md text-sm text-muted-foreground">
            Cuando los estudiantes inicien la supervisión aparecerán aquí como
            <strong class="text-foreground">En supervisión</strong>; al finalizar podrás abrir el reporte.
          </p>
        </div>
        <Button variant="outline" onclick={goBack}>Volver a exámenes</Button>
      </div>
    {:else}
      {#if sessions.some((s) => isActive(s.status))}
        <p class="mb-4 text-sm text-muted-foreground">
          Hay estudiantes en supervisión. El reporte completo estará disponible cuando finalicen la
          sesión. Los eventos en vivo se actualizan cada pocos segundos.
        </p>
      {/if}
      <div class="mb-4 max-w-sm">
        <Label for="session-search" class="sr-only">Buscar estudiante</Label>
        <Input
          id="session-search"
          type="search"
          placeholder="Buscar por nombre o email…"
          bind:value={searchQuery}
        />
      </div>
      {#if showNoSearchResults}
        <p class="py-8 text-center text-sm text-muted-foreground">
          Ninguna supervisión coincide con «{searchQuery.trim()}».
        </p>
      {:else}
      <div class="overflow-x-auto">
        <Table.Root class="text-sm">
          <Table.Header>
            <Table.Row class="hover:bg-transparent">
              <Table.Head>Estudiante</Table.Head>
              <Table.Head>Email</Table.Head>
              <Table.Head>Inicio</Table.Head>
              <Table.Head>Fin</Table.Head>
              <Table.Head class="text-right">Estado</Table.Head>
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {#each filteredSessions as session}
              <Table.Row class="hover:bg-muted/50">
                <Table.Cell>
                  <Badge variant="secondary">{session.student_name ?? session.student_id}</Badge>
                </Table.Cell>
                <Table.Cell class="text-muted-foreground">{session.student_email ?? '—'}</Table.Cell>
                <Table.Cell>{new Date(session.started_at).toLocaleString('es')}</Table.Cell>
                <Table.Cell>
                  {#if session.ended_at}
                    {new Date(session.ended_at).toLocaleString('es')}
                  {:else}
                    <span class="text-muted-foreground">En curso</span>
                  {/if}
                </Table.Cell>
                <Table.Cell class="text-right">
                  {#if isEnded(session.status)}
                    <Button
                      variant="outline"
                      size="sm"
                      href="/proctoring/report/{session.id}"
                      data-sveltekit-preload-data="hover"
                    >
                      Ver reporte
                    </Button>
                  {:else if isActive(session.status)}
                    {@const violations = liveStats[session.id]?.total_violations ?? 0}
                    <div class="flex flex-col items-end gap-1">
                      <Badge
                        variant="outline"
                        class={cn(
                          violations >= 3
                            ? 'border-amber-500/50 bg-amber-500/10 text-amber-900 dark:text-amber-100'
                            : 'border-emerald-500/50 bg-emerald-500/10 text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-200'
                        )}
                      >
                        En supervisión
                      </Badge>
                      {#if liveStats[session.id]}
                        <span class="text-xs text-muted-foreground">
                          {violations} evento{violations !== 1 ? 's' : ''} hasta ahora
                        </span>
                      {/if}
                    </div>
                  {:else}
                    <Badge variant="outline" class="font-medium">
                      {statusLabel(session.status)}
                    </Badge>
                  {/if}
                </Table.Cell>
              </Table.Row>
            {/each}
          </Table.Body>
        </Table.Root>
      </div>
      {/if}
    {/if}
  </Card.Content>
</Card.Root>
