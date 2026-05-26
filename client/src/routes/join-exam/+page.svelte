<script>
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { get } from 'svelte/store';
  import PageHeader from '$lib/components/PageHeader.svelte';
  import ExamCountdown from '$lib/components/ExamCountdown.svelte';
  import { verifyExamCode } from '$lib/exams-api.js';
  import { authStore } from '$lib/auth.js';
  import { examStore } from '$lib/exam-store.js';
  import * as Card from '$lib/components/ui/card';
  import { Button } from '$lib/components/ui/button';
  import { Input } from '$lib/components/ui/input';
  import { Label } from '$lib/components/ui/label';
  import { Badge } from '$lib/components/ui/badge';
  import * as Alert from '$lib/components/ui/alert';
  import { Separator } from '$lib/components/ui/separator';
  import { cn } from '$lib/utils';
  import Play from '@lucide/svelte/icons/play';
  import CircleCheck from '@lucide/svelte/icons/circle-check';

  let code = '';
  /** @type {HTMLInputElement | null} */
  let examCodeInput = null;
  let loading = false;
  let invalidMessage = '';
  let notFoundMessage = '';
  let finishedMessage = '';
  let notStartedMessage = '';
  let notStartedAt = '';
  let networkMessage = '';
  let successMessage = '';
  let foundExam = null;

  const TXT = {
    focus: 'Supervisi\u00f3n',
    subtitle:
      'Ingresa el c\u00f3digo del examen para validar tu acceso antes de iniciar la supervisi\u00f3n.',
    codeLabel: 'C\u00f3digo de examen',
    verify: 'Verificar c\u00f3digo',
    start: 'Iniciar supervisi\u00f3n',
    otherCode: 'Usar otro c\u00f3digo',
    codeShort: 'C\u00f3digo',
  };

  function normalizeCode(value) {
    return String(value ?? '')
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, '')
      .slice(0, 6);
  }

  function clearFormMessages() {
    invalidMessage = '';
    notFoundMessage = '';
    finishedMessage = '';
    notStartedMessage = '';
    notStartedAt = '';
    networkMessage = '';
    successMessage = '';
    foundExam = null;
  }

  function onCodeInput() {
    code = normalizeCode(code);
    clearFormMessages();
  }

  function resolveCodeForVerify() {
    const fromState = normalizeCode(code);
    const fromDom = examCodeInput?.value != null ? normalizeCode(examCodeInput.value) : '';
    return fromDom.length > fromState.length ? fromDom : fromState;
  }

  function fmtEndsAt(value) {
    if (!value) return null;
    return new Date(value).toLocaleString('es', {
      dateStyle: 'medium',
      timeStyle: 'short',
    });
  }

  async function handleVerify() {
    const normalized = resolveCodeForVerify();
    code = normalized;

    if (normalized.length !== 6) {
      invalidMessage = 'El c\u00f3digo debe tener exactamente 6 caracteres.';
      return;
    }

    loading = true;
    clearFormMessages();

    try {
      const exam = await verifyExamCode(normalized);
      foundExam = exam;
      examStore.set({
        id: exam.id,
        name: exam.name,
        ends_at: exam.ends_at ?? null,
        code: exam.code,
        expired_at: null,
        joinable: true,
      });
      successMessage = `Examen encontrado: ${exam.name}`;
    } catch (e) {
      const msg = e?.message ?? '';
      if (e?.code === 'EXAM_NOT_STARTED') {
        notStartedMessage = msg || 'Este examen a\u00fan no ha comenzado.';
        if (e.scheduledAt) {
          notStartedAt = fmtEndsAt(e.scheduledAt);
        }
        code = '';
      } else if (msg.includes('CODE_NOT_FOUND')) {
        notFoundMessage = 'C\u00f3digo no encontrado. Verifica el c\u00f3digo con tu profesor.';
        code = '';
      } else if (msg.includes('EXAM_FINISHED')) {
        finishedMessage = 'Este examen ya finaliz\u00f3.';
        code = '';
      } else if (msg.trim()) {
        networkMessage = msg;
      } else {
        networkMessage = 'Error de conexi\u00f3n. Verifica que el servidor est\u00e9 activo.';
      }
    } finally {
      loading = false;
    }
  }

  /** @param {KeyboardEvent} event */
  function handleCodeKeydown(event) {
    if (event.key === 'Enter') {
      event.preventDefault();
      handleVerify();
    }
  }

  function startProctoring() {
    if (!foundExam) return;
    goto('/proctoring');
  }

  onMount(() => {
    const auth = get(authStore);
    if (!auth?.token) {
      goto('/login');
      return;
    }
    if (auth.role === 'PROFESSOR') {
      goto('/exams');
    }
  });
</script>

<svelte:head>
  <title>Unirse a examen | Procto</title>
</svelte:head>

<div class="mx-auto max-w-lg">
  <PageHeader focus={TXT.focus} title="Unirse a un examen" subtitle={TXT.subtitle} />

  <Card.Root class="rounded-xl border-border/80 shadow-sm">
    <Card.Content class="space-y-5 pt-6">
      {#if !foundExam}
        <div class="space-y-2">
          <Label for="examCode">{TXT.codeLabel}</Label>
          <Input
            bind:ref={examCodeInput}
            id="examCode"
            type="text"
            bind:value={code}
            oninput={onCodeInput}
            onkeydown={handleCodeKeydown}
            maxlength={6}
            placeholder="ABC123"
            autocomplete="off"
            class="h-14 text-center text-2xl font-bold uppercase tracking-[0.2em]"
          />
          <p class="text-center text-xs text-muted-foreground">6 caracteres, sin espacios</p>
        </div>

        <Button type="button" class="w-full" onclick={handleVerify} disabled={loading}>
          {loading ? 'Verificando...' : TXT.verify}
        </Button>
      {:else}
        <div
          class="rounded-xl border border-emerald-500/30 bg-emerald-50/80 p-5 dark:border-emerald-500/25 dark:bg-emerald-950/40"
        >
          <div class="flex items-start gap-3">
            <CircleCheck class="mt-0.5 size-6 shrink-0 text-emerald-600 dark:text-emerald-400" />
            <div class="min-w-0 flex-1 space-y-2">
              <p class="text-sm font-medium text-emerald-900 dark:text-emerald-100">Acceso confirmado</p>
              <p class="text-lg font-semibold leading-tight text-foreground">{foundExam.name}</p>
              <div class="flex flex-wrap items-center gap-2">
                <span class="text-xs text-muted-foreground">{TXT.codeShort}</span>
                <Badge variant="outline" class="font-mono tracking-wider">{foundExam.code}</Badge>
              </div>
              {#if foundExam.ends_at}
                <p class="text-sm text-muted-foreground">
                  Finaliza: {fmtEndsAt(foundExam.ends_at)}
                </p>
                <ExamCountdown endsAt={foundExam.ends_at} />
              {/if}
            </div>
          </div>
        </div>

        <Separator />

        <Button type="button" size="lg" class="h-12 w-full gap-2 text-base" onclick={startProctoring}>
          <Play class="size-5" />
          {TXT.start}
        </Button>

        <Button
          type="button"
          variant="ghost"
          class="w-full text-muted-foreground"
          onclick={() => {
            foundExam = null;
            successMessage = '';
            code = '';
          }}
        >
          {TXT.otherCode}
        </Button>
      {/if}

      {#if invalidMessage}
        <Alert.Root variant="destructive"><Alert.Description>{invalidMessage}</Alert.Description></Alert.Root>
      {/if}
      {#if notFoundMessage}
        <Alert.Root variant="destructive"><Alert.Description>{notFoundMessage}</Alert.Description></Alert.Root>
      {/if}
      {#if notStartedMessage}
        <Alert.Root class="border-amber-500/40 bg-amber-500/10">
          <Alert.Title class="text-sm font-semibold">Examen no disponible a&uacute;n</Alert.Title>
          <Alert.Description class="text-sm">
            {notStartedMessage}
            {#if notStartedAt}
              <span class="mt-1 block">Podr&aacute;s unirte a partir del {notStartedAt}.</span>
            {/if}
          </Alert.Description>
        </Alert.Root>
      {/if}
      {#if finishedMessage}
        <Alert.Root><Alert.Description>{finishedMessage}</Alert.Description></Alert.Root>
      {/if}
      {#if networkMessage}
        <Alert.Root variant="destructive"><Alert.Description>{networkMessage}</Alert.Description></Alert.Root>
      {/if}
      {#if successMessage && !foundExam}
        <Alert.Root
          class={cn(
            'border-emerald-500/30 bg-emerald-50 text-emerald-900',
            'dark:border-emerald-500/25 dark:bg-emerald-950/40 dark:text-emerald-100'
          )}
        >
          <Alert.Description>{successMessage}</Alert.Description>
        </Alert.Root>
      {/if}
    </Card.Content>
  </Card.Root>
</div>
