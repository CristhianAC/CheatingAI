<script>
  import { onMount } from 'svelte';
  import { get } from 'svelte/store';
  import PageHeader from '$lib/components/PageHeader.svelte';
  import { authStore } from '$lib/auth.js';
  import CameraCapture from '$lib/components/CameraCapture.svelte';
  import * as Card from '$lib/components/ui/card';
  import { Label } from '$lib/components/ui/label';
  import { Badge } from '$lib/components/ui/badge';
  import { Separator } from '$lib/components/ui/separator';
  import { Skeleton } from '$lib/components/ui/skeleton';
  import * as Alert from '$lib/components/ui/alert';

  const API_BASE = '/api/v1';

  let user = null;
  let loading = true;
  let loadError = '';
  let uploadMsg = '';

  async function loadProfile() {
    loading = true;
    loadError = '';
    const token = get(authStore)?.token;
    if (!token) {
      loadError = 'No hay sesión activa.';
      loading = false;
      return;
    }
    try {
      const res = await fetch(`${API_BASE}/users/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.detail || `Error ${res.status}`);
      }
      user = await res.json();
    } catch (e) {
      loadError = e?.message ?? 'No se pudo cargar el perfil';
    } finally {
      loading = false;
    }
  }

  async function uploadBlob(blob) {
    uploadMsg = '';
    const token = get(authStore)?.token;
    if (!token) {
      uploadMsg = '✗ No hay sesión activa.';
      return;
    }

    const fd = new FormData();
    fd.append('file', blob, 'profile.jpg');
    const res = await fetch(`${API_BASE}/users/me/photo`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: fd,
    });

    if (res.ok) {
      const data = await res.json();
      user = { ...user, photo_url: data.photo_url };
      uploadMsg = '✓ Foto guardada';
    } else {
      const data = await res.json().catch(() => ({}));
      uploadMsg = `✗ ${data?.detail || 'Error al guardar la foto'}`;
    }
  }

  function onCapture(e) {
    const blob = e?.detail?.blob;
    if (!blob) return;
    void uploadBlob(blob);
  }

  onMount(loadProfile);
</script>

<svelte:head>
  <title>Mi perfil | Procto</title>
</svelte:head>

<div class="mx-auto max-w-lg">
  <PageHeader
    focus="Cuenta"
    title="Mi perfil"
    subtitle="Datos de tu cuenta y foto de referencia para supervisión."
  />

  {#if loading}
    <div class="space-y-3">
      <Skeleton class="h-8 w-3/4" />
      <Skeleton class="h-24 w-full" />
    </div>
  {:else if loadError}
    <Alert.Root variant="destructive">
      <Alert.Title>Error</Alert.Title>
      <Alert.Description>{loadError}</Alert.Description>
    </Alert.Root>
  {:else if user}
    <Card.Root class="rounded-xl">
      <Card.Content class="space-y-4 pt-6">
        <div class="space-y-1">
          <Label>Nombre completo</Label>
          <p class="text-sm font-medium">{user.full_name}</p>
        </div>
        <div class="space-y-1">
          <Label>Correo electrónico</Label>
          <p class="text-sm font-medium">{user.email}</p>
        </div>
        <div class="space-y-1">
          <Label>Rol</Label>
          <Badge variant="secondary">{user.role === 'STUDENT' ? 'Estudiante' : 'Profesor'}</Badge>
        </div>

        <Separator />

        <div class="space-y-3">
          <h2 class="text-sm font-semibold">Foto</h2>
          {#if user.photo_url}
            <img
              class="size-28 rounded-full object-cover ring-2 ring-border"
              src={user.photo_url}
              alt="Foto de perfil"
              width="112"
              height="112"
            />
          {:else}
            <p class="text-sm text-muted-foreground">Sin foto aún.</p>
          {/if}
          <p class="text-sm text-muted-foreground">
            {user.role === 'STUDENT'
              ? 'Esta foto se usa como referencia para validar tu identidad durante los exámenes.'
              : 'La foto no es obligatoria para profesores.'}
          </p>
          <CameraCapture
            required={user.role === 'STUDENT'}
            label={user.role === 'STUDENT' ? 'Foto de referencia' : 'Foto de perfil'}
            on:capture={onCapture}
          />
          {#if uploadMsg}
            <p class="text-sm text-muted-foreground">{uploadMsg}</p>
          {/if}
        </div>
      </Card.Content>
    </Card.Root>
  {/if}
</div>
