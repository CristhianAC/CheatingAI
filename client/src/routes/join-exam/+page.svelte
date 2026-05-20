<script>
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { get } from 'svelte/store';
  import PageHeader from '$lib/components/PageHeader.svelte';
  import { verifyExamCode } from '$lib/exams-api.js';
  import { authStore } from '$lib/auth.js';
  import { examStore } from '$lib/exam-store.js';
  import * as Card from '$lib/components/ui/card';
  import { Button } from '$lib/components/ui/button';
  import { Input } from '$lib/components/ui/input';
  import { Label } from '$lib/components/ui/label';
  import * as Alert from '$lib/components/ui/alert';

  let code = '';
  let loading = false;
  let invalidMessage = '';
  let notFoundMessage = '';
  let finishedMessage = '';
  let networkMessage = '';
  let successMessage = '';
  let foundExam = null;

  function normalizeCode(value) {
    return value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6);
  }

  function handleCodeInput(event) {
    code = normalizeCode(event.currentTarget.value);
    invalidMessage = '';
    notFoundMessage = '';
    finishedMessage = '';
    networkMessage = '';
    successMessage = '';
    foundExam = null;
  }

  async function handleVerify() {
    const normalized = normalizeCode(code);
    if (normalized.length !== 6) {
      invalidMessage = 'Ingresa un código válido de 6 caracteres.';
      return;
    }

    loading = true;
    invalidMessage = '';
    notFoundMessage = '';
    finishedMessage = '';
    networkMessage = '';
    successMessage = '';
    foundExam = null;

    try {
      const exam = await verifyExamCode(normalized);
      foundExam = exam;
      examStore.set({
        id: exam.id,
        name: exam.name,
        ends_at: exam.ends_at ?? null,
        code: exam.code,
        expired_at: null,
      });
      successMessage = `Examen encontrado: ${exam.name}`;
    } catch (e) {
      const msg = e?.message ?? '';
      if (msg.includes('CODE_NOT_FOUND')) {
        notFoundMessage = 'Código no encontrado. Verifica el código con tu profesor.';
        code = '';
      } else if (msg.includes('EXAM_FINISHED')) {
        finishedMessage = 'Este examen ya finalizó.';
        code = '';
      } else {
        networkMessage = 'Error de conexión. Verifica que el servidor esté activo.';
      }
    } finally {
      loading = false;
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
  <PageHeader
    focus="Supervisión"
    title="Unirse a un examen"
    subtitle="Ingresa el código del examen para validar tu acceso antes de iniciar la supervisión."
  />

  <Card.Root class="rounded-xl">
    <Card.Content class="space-y-4 pt-6">
      <div class="space-y-2">
        <Label for="examCode">Código de examen</Label>
        <Input
          id="examCode"
          type="text"
          value={code}
          on:input={handleCodeInput}
          maxlength="6"
          placeholder="ABC123"
          autocomplete="off"
          class="h-14 text-center text-2xl font-bold uppercase tracking-[0.2em]"
        />
      </div>

      <Button type="button" class="w-full" onclick={handleVerify} disabled={loading}>
        {loading ? 'Verificando...' : 'Verificar código'}
      </Button>

      {#if invalidMessage}
        <Alert.Root variant="destructive"><Alert.Description>{invalidMessage}</Alert.Description></Alert.Root>
      {/if}
      {#if notFoundMessage}
        <Alert.Root variant="destructive"><Alert.Description>{notFoundMessage}</Alert.Description></Alert.Root>
      {/if}
      {#if finishedMessage}
        <Alert.Root><Alert.Description>{finishedMessage}</Alert.Description></Alert.Root>
      {/if}
      {#if networkMessage}
        <Alert.Root variant="destructive"><Alert.Description>{networkMessage}</Alert.Description></Alert.Root>
      {/if}
      {#if successMessage}
        <Alert.Root class="border-emerald-500/30 bg-emerald-50 text-emerald-900">
          <Alert.Description>{successMessage}</Alert.Description>
        </Alert.Root>
      {/if}

      {#if foundExam}
        <Button variant="secondary" class="w-full" onclick={startProctoring}>Iniciar supervisión</Button>
      {/if}
    </Card.Content>
  </Card.Root>
</div>
