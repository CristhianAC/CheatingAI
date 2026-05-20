<script>
  import { goto } from '$app/navigation';
  import { register } from '$lib/auth.js';
  import CameraCapture from '$lib/components/CameraCapture.svelte';
  import * as Card from '$lib/components/ui/card';
  import { Button } from '$lib/components/ui/button';
  import { Input } from '$lib/components/ui/input';
  import { Label } from '$lib/components/ui/label';
  import { Badge } from '$lib/components/ui/badge';
  import * as Alert from '$lib/components/ui/alert';

  let fullName = '';
  let email = '';
  let password = '';
  let role = 'STUDENT';
  let loading = false;
  let error = '';
  let passwordFocused = false;
  let capturedBlob = null;
  let photoMsg = '';

  function hasUpper(s) { return /[A-Z]/.test(s); }
  function hasLower(s) { return /[a-z]/.test(s); }
  function hasNumber(s) { return /[0-9]/.test(s); }
  function hasSpecial(s) { return /[!@#$%^&*()_+\-=\[\]{}|;':",.\/<>?]/.test(s); }

  $: rules = [
    { key: 'len', label: 'Mínimo 8 caracteres', ok: (password?.length ?? 0) >= 8 },
    { key: 'upper', label: 'Al menos una mayúscula (A-Z)', ok: hasUpper(password) },
    { key: 'lower', label: 'Al menos una minúscula (a-z)', ok: hasLower(password) },
    { key: 'num', label: 'Al menos un número (0-9)', ok: hasNumber(password) },
    { key: 'special', label: 'Al menos un carácter especial', ok: hasSpecial(password) },
  ];
  $: isPasswordValid = rules.every((r) => r.ok);
  $: showPasswordRules = passwordFocused || (password?.length ?? 0) > 0;
  $: isStudent = role === 'STUDENT';
  $: canSubmit = !loading && isPasswordValid && (!isStudent || !!capturedBlob);

  function onCapture(e) {
    capturedBlob = e?.detail?.blob ?? null;
    photoMsg = capturedBlob ? '✓ Foto capturada' : '';
    error = '';
  }

  async function uploadReferencePhoto(token, userId, blob) {
    const fd = new FormData();
    fd.append('file', blob, `${userId}.jpg`);
    const res = await fetch('/api/v1/users/me/photo', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: fd,
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(data?.detail || 'No se pudo subir la foto');
    }
    return data;
  }

  async function onSubmit() {
    error = '';
    photoMsg = '';
    loading = true;
    try {
      const auth = await register(email, password, fullName, role);
      if (role === 'STUDENT') {
        if (!capturedBlob) {
          throw new Error('Debes capturar tu foto antes de completar el registro.');
        }
        try {
          await uploadReferencePhoto(auth.token, auth.user?.id, capturedBlob);
          photoMsg = '✓ Foto guardada como referencia';
        } catch (e) {
          photoMsg =
            `✗ ${e?.message ?? 'No se pudo subir la foto'}. ` +
            'Tu cuenta fue creada; reintenta subir la foto desde tu perfil.';
        }
      }
      goto('/');
    } catch (e) {
      error = e?.message ?? 'No se pudo crear la cuenta';
    } finally {
      loading = false;
    }
  }
</script>

<svelte:head>
  <title>Registro | Procto</title>
</svelte:head>

<div class="mx-auto max-w-md py-8">
  <Card.Root class="rounded-xl shadow-sm">
    <Card.Header>
      <Card.Title class="text-xl">Crear cuenta</Card.Title>
      <Card.Description>Regístrate como estudiante o profesor</Card.Description>
    </Card.Header>
    <Card.Content>
      <form on:submit|preventDefault={onSubmit} class="flex flex-col gap-4">
        <div class="space-y-2">
          <Label for="fullName">Nombre completo</Label>
          <Input id="fullName" type="text" bind:value={fullName} required />
        </div>
        <div class="space-y-2">
          <Label for="email">Email</Label>
          <Input id="email" type="email" bind:value={email} required autocomplete="email" />
        </div>
        <div class="space-y-2">
          <Label for="password">Contraseña</Label>
          <Input
            id="password"
            type="password"
            bind:value={password}
            minlength="8"
            required
            on:focus={() => (passwordFocused = true)}
            on:blur={() => (passwordFocused = false)}
          />
        </div>
        {#if showPasswordRules}
          <ul class="space-y-2 rounded-lg border border-border bg-muted/40 p-3" aria-live="polite">
            {#each rules as r (r.key)}
              <li class="flex items-center gap-2 text-sm">
                <Badge variant={r.ok ? 'default' : 'destructive'} class="size-5 shrink-0 justify-center p-0 text-xs">
                  {r.ok ? '✓' : '✗'}
                </Badge>
                <span class={r.ok ? 'text-emerald-700' : 'text-muted-foreground'}>{r.label}</span>
              </li>
            {/each}
          </ul>
        {/if}
        <div class="space-y-2">
          <Label for="role">Rol</Label>
          <select
            id="role"
            bind:value={role}
            class="flex h-9 w-full rounded-lg border border-input bg-background px-3 py-1 text-sm shadow-xs focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
          >
            <option value="STUDENT">Estudiante</option>
            <option value="PROFESSOR">Profesor</option>
          </select>
        </div>
        {#if role === 'STUDENT'}
          <div class="space-y-3 rounded-lg border border-border p-4" aria-label="Foto de referencia">
            <p class="text-sm text-muted-foreground">
              Tu foto se usará para verificar tu identidad durante los exámenes. Buena iluminación y rostro centrado.
            </p>
            <CameraCapture required={true} label="Foto de referencia" on:capture={onCapture} />
            {#if photoMsg}
              <p class="text-sm text-muted-foreground">{photoMsg}</p>
            {/if}
          </div>
        {/if}
        {#if error}
          <Alert.Root variant="destructive">
            <Alert.Title>Error</Alert.Title>
            <Alert.Description>{error}</Alert.Description>
          </Alert.Root>
        {/if}
        <Button type="submit" class="w-full" disabled={!canSubmit}>
          {loading ? 'Creando...' : 'Crear cuenta'}
        </Button>
      </form>
    </Card.Content>
    <Card.Footer class="text-sm text-muted-foreground">
      ¿Ya tienes cuenta? <a href="/login" class="font-medium text-primary hover:underline">Inicia sesión</a>
    </Card.Footer>
  </Card.Root>
</div>
