<script>
  import { toast } from '$lib/stores.js';
</script>

{#if $toast}
  <div class="toast toast--{$toast.type}" role="alert">
    <span class="toast__icon">
      {#if $toast.type === 'success'}✅{:else if $toast.type === 'error'}❌{:else}ℹ️{/if}
    </span>
    <span class="toast__message">{$toast.message}</span>
  </div>
{/if}

<style>
  .toast {
    position: fixed;
    bottom: 1.5rem;
    right: 1.5rem;
    display: flex;
    align-items: center;
    gap: 0.6rem;
    padding: 0.85rem 1.25rem;
    border-radius: 10px;
    font-size: 0.9rem;
    font-weight: 500;
    box-shadow: 0 4px 20px rgba(0,0,0,0.15);
    z-index: 1000;
    animation: slideIn 0.25s ease;
    max-width: 380px;
  }
  .toast--success { background: #d1fae5; color: #065f46; border-left: 4px solid #10b981; }
  .toast--error   { background: #fee2e2; color: #991b1b; border-left: 4px solid #ef4444; }
  .toast--info    { background: #dbeafe; color: #1e40af; border-left: 4px solid #3b82f6; }

  @keyframes slideIn {
    from { transform: translateX(120%); opacity: 0; }
    to   { transform: translateX(0);    opacity: 1; }
  }
</style>
