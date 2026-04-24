<script>
  import { onMount } from 'svelte';
  import { get } from 'svelte/store';
  import PageHeader from '$lib/components/PageHeader.svelte';
  import { authStore } from '$lib/auth.js';

  const API_BASE = '/api/v1';

  let user = null;
  let loading = true;
  let loadError = '';
  let capturing = false;
  let videoEl;
  let stream;
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

  async function startCapture() {
    capturing = true;
    uploadMsg = '';
    stream = await navigator.mediaDevices.getUserMedia({ video: true });
    videoEl.srcObject = stream;
    await videoEl.play();
  }

  async function takePhoto() {
    const canvas = document.createElement('canvas');
    canvas.width = videoEl.videoWidth;
    canvas.height = videoEl.videoHeight;
    canvas.getContext('2d').drawImage(videoEl, 0, 0);

    if (stream) {
      stream.getTracks().forEach((t) => t.stop());
    }
    capturing = false;

    const token = get(authStore)?.token;
    const blob = await new Promise((resolve) =>
      canvas.toBlob((b) => resolve(b), 'image/jpeg', 0.92)
    );
    if (!blob || !token) return;

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
      uploadMsg = '✓ Foto guardada como referencia';
    } else {
      const data = await res.json().catch(() => ({}));
      uploadMsg = `✗ ${data?.detail || 'Error al guardar la foto'}`;
    }
  }

  onMount(loadProfile);
</script>

<svelte:head>
  <title>Mi perfil | Procto</title>
</svelte:head>

<div class="profile-page">
  <PageHeader
    focus="Cuenta"
    title="Mi perfil"
    subtitle="Datos de tu cuenta y foto de referencia para supervisión."
  />

  {#if loading}
    <p class="profile-page__info">Cargando perfil…</p>
  {:else if loadError}
    <p class="profile-page__error">{loadError}</p>
  {:else if user}
    <section class="card profile-card">
      <div class="field">
        <label for="ro-name">Nombre completo</label>
        <p id="ro-name" class="profile-card__value">{user.full_name}</p>
      </div>
      <div class="field">
        <label for="ro-email">Correo electrónico</label>
        <p id="ro-email" class="profile-card__value">{user.email}</p>
      </div>
      <div class="field">
        <label for="ro-role">Rol</label>
        <p id="ro-role" class="profile-card__value">
          {user.role === 'STUDENT' ? 'Estudiante' : 'Profesor'}
        </p>
      </div>

      {#if user.role === 'STUDENT'}
        <hr class="profile-card__rule" />

        <h2 class="profile-card__section-title">Foto de referencia</h2>

        {#if user.photo_url}
          <img
            class="profile-card__avatar"
            src={user.photo_url}
            alt="Foto de referencia"
            width="120"
            height="120"
          />
        {:else}
          <p class="profile-page__hint">Sin foto de referencia aún.</p>
        {/if}

        {#if capturing}
          <!-- svelte-ignore a11y-media-has-caption -->
          <video bind:this={videoEl} class="profile-card__video" muted playsinline />
          <button class="btn btn--primary" type="button" on:click={takePhoto}>📸 Tomar foto</button>
        {:else}
          <button class="btn btn--secondary" type="button" on:click={startCapture}>
            {user.photo_url ? '🔄 Actualizar foto' : '📷 Capturar foto de referencia'}
          </button>
        {/if}

        {#if uploadMsg}
          <p class="profile-card__upload-msg">{uploadMsg}</p>
        {/if}
      {/if}
    </section>
  {/if}
</div>

<style>
  .profile-page {
    max-width: 520px;
    margin: 0 auto;
  }

  .profile-page__info {
    color: var(--procto-text-secondary);
    font-size: 0.95rem;
  }

  .profile-page__error {
    color: #b42318;
    font-size: 0.9rem;
  }

  .profile-page__hint {
    color: var(--procto-text-secondary);
    font-size: 0.85rem;
    margin-bottom: 1rem;
  }

  .profile-card__value {
    margin: 0;
    font-size: 0.95rem;
    color: var(--procto-text);
  }

  .profile-card__rule {
    margin: 1.25rem 0;
    border: none;
    border-top: 1px solid var(--procto-border);
  }

  .profile-card__section-title {
    font-size: 0.95rem;
    font-weight: 600;
    margin: 0 0 1rem;
    color: var(--procto-text);
  }

  .profile-card__avatar {
    border-radius: 50%;
    object-fit: cover;
    display: block;
    margin-bottom: 1rem;
  }

  .profile-card__video {
    width: 100%;
    border-radius: var(--procto-radius-sm);
    margin-bottom: 0.75rem;
    background: #111;
    aspect-ratio: 4 / 3;
  }

  .profile-card__upload-msg {
    margin-top: 0.75rem;
    font-size: 0.85rem;
    color: var(--procto-text-secondary);
  }
</style>
