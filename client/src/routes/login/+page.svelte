<script>
  import { goto } from '$app/navigation';
  import { login } from '$lib/auth.js';
  import * as Card from '$lib/components/ui/card';
  import { Button } from '$lib/components/ui/button';
  import { Input } from '$lib/components/ui/input';
  import { Label } from '$lib/components/ui/label';
  import * as Alert from '$lib/components/ui/alert';

  let email = '';
  let password = '';
  let loading = false;
  let error = '';

  async function onSubmit() {
    error = '';
    loading = true;
    try {
      await login(email, password);
      goto('/');
    } catch (e) {
      error = e?.message ?? 'No se pudo iniciar sesión';
    } finally {
      loading = false;
    }
  }
</script>

<svelte:head>
  <title>Iniciar sesión | Procto</title>
</svelte:head>

<div class="mx-auto max-w-md py-8">
  <Card.Root class="rounded-xl shadow-sm">
    <Card.Header>
      <Card.Title class="text-xl">Iniciar sesión</Card.Title>
      <Card.Description>Accede a tu cuenta de Procto</Card.Description>
    </Card.Header>
    <Card.Content>
      <form on:submit|preventDefault={onSubmit} class="flex flex-col gap-4">
        <div class="space-y-2">
          <Label for="email">Email</Label>
          <Input id="email" type="email" bind:value={email} required autocomplete="email" />
        </div>
        <div class="space-y-2">
          <Label for="password">Contraseña</Label>
          <Input id="password" type="password" bind:value={password} required autocomplete="current-password" />
        </div>
        {#if error}
          <Alert.Root variant="destructive">
            <Alert.Title>Error</Alert.Title>
            <Alert.Description>{error}</Alert.Description>
          </Alert.Root>
        {/if}
        <Button type="submit" class="w-full" disabled={loading}>
          {loading ? 'Ingresando...' : 'Iniciar sesión'}
        </Button>
      </form>
    </Card.Content>
    <Card.Footer class="text-sm text-muted-foreground">
      ¿No tienes cuenta? <a href="/register" class="font-medium text-primary hover:underline">Regístrate</a>
    </Card.Footer>
  </Card.Root>
</div>
