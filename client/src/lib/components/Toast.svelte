<script>
  import { toast } from '$lib/stores.js';
  import * as Alert from '$lib/components/ui/alert';
  import { cn } from '$lib/utils';

  const variantClass = {
    success: 'border-emerald-500/40 bg-emerald-50 text-emerald-900',
    error: 'border-destructive/40 bg-destructive/10 text-destructive',
    info: 'border-primary/30 bg-primary/5 text-foreground',
  };
</script>

{#if $toast}
  <div class="pointer-events-none fixed bottom-6 right-6 z-[1000] max-w-sm animate-in slide-in-from-right-4">
    <Alert.Root class={cn('pointer-events-auto shadow-lg', variantClass[$toast.type] ?? variantClass.info)}>
      <Alert.Title class="text-sm font-semibold">
        {#if $toast.type === 'success'}Éxito{:else if $toast.type === 'error'}Error{:else}Aviso{/if}
      </Alert.Title>
      <Alert.Description>{$toast.message}</Alert.Description>
    </Alert.Root>
  </div>
{/if}
