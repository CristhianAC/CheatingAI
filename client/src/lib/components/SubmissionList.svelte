<script>
  import { createEventDispatcher, onMount } from 'svelte';
  import { listSubmissions, getSubmission, deleteSubmission } from '$lib/api.js';
  import { showToast, showError } from '$lib/stores.js';

  const dispatch = createEventDispatcher();

  let filters = { problem_id: '', exam_id: '', language: '' };
  let items = [];
  let total = 0;
  let loading = false;

  let modalSub = null;
  let modalLoading = false;

  export async function reload() {
    loading = true;
    try {
      const res = await listSubmissions(filters);
      items = res.items;
      total = res.total;
      dispatch('loaded', items);
    } catch (e) {
      showError(e.message);
    } finally {
      loading = false;
    }
  }

  async function handleDelete(id) {
    if (!confirm('¿Eliminar esta entrega?')) return;
    try {
      await deleteSubmission(id);
      showToast('Entrega eliminada');
      reload();
    } catch (e) {
      showError(e.message);
    }
  }

  async function openModal(sub) {
    modalSub = null;
    modalLoading = true;
    try {
      const full = await getSubmission(sub.id);
      modalSub = full;
    } catch (e) {
      showError(e.message);
    } finally {
      modalLoading = false;
    }
  }

  function closeModal() {
    modalSub = null;
  }

  function onModalKeydown(e) {
    if (!modalSub || e.key !== 'Escape') return;
    closeModal();
  }

  onMount(reload);
</script>

<svelte:window on:keydown={onModalKeydown} />

<div class="rounded-xl border border-border bg-card p-6 shadow-sm">
  <div class="filters">
    <input bind:value={filters.problem_id} placeholder="Filtrar por problem_id" />
    <input bind:value={filters.exam_id} placeholder="Filtrar por exam_id" />
    <select bind:value={filters.language}>
      <option value="">Todos los lenguajes</option>
      <option value="python">Python</option>
      <option value="java">Java</option>
    </select>
    <button type="button" class="btn btn--secondary" on:click={reload} disabled={loading}>
      {loading ? 'Buscando…' : 'Buscar'}
    </button>
  </div>

  <div class="table-meta">
    <span>{total} entrega{total !== 1 ? 's' : ''} encontrada{total !== 1 ? 's' : ''}</span>
  </div>

  {#if items.length === 0 && !loading}
    <div class="empty">No hay entregas aún. Crea una con el formulario superior.</div>
  {:else}
    <div class="table-wrap">
      <table>
        <thead>
          <tr>
            <th>ID</th>
            <th>Participante</th>
            <th>Problema</th>
            <th>Examen</th>
            <th>Lenguaje</th>
            <th>Creado</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {#each items as sub (sub.id)}
            <tr class="row-hover" on:click={() => openModal(sub)}>
              <td class="mono">{sub.id.slice(0, 8)}…</td>
              <td>{sub.student_id}</td>
              <td>{sub.problem_id}</td>
              <td>{sub.exam_id ?? '—'}</td>
              <td><span class="badge badge--{sub.language}">{sub.language}</span></td>
              <td class="date">{new Date(sub.created_at).toLocaleString('es-CO')}</td>
              <td>
                <button
                  type="button"
                  class="btn btn--danger btn--sm"
                  on:click|stopPropagation={() => handleDelete(sub.id)}
                  aria-label="Eliminar entrega"
                >
                  Eliminar
                </button>
              </td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
  {/if}
</div>

{#if modalLoading}
  <div class="overlay">
    <div class="modal modal--loading"><p>Cargando código…</p></div>
  </div>
{/if}

{#if modalSub}
  <div class="overlay">
    <button type="button" class="overlay-backdrop" aria-label="Cerrar" on:click={closeModal}></button>
    <div class="modal" role="dialog" aria-modal="true" aria-labelledby="modal-code-title">
      <div class="modal-header">
        <div>
          <h3 id="modal-code-title">Código fuente</h3>
          <p class="modal-meta">
            {modalSub.student_id} · {modalSub.problem_id} · {modalSub.language}
          </p>
        </div>
        <button type="button" class="btn btn--ghost btn--sm" on:click={closeModal}>Cerrar</button>
      </div>
      <pre class="code-block">{modalSub.source_code}</pre>
      <p class="hash-line">SHA256: <code>{modalSub.code_hash}</code></p>
    </div>
  </div>
{/if}

<style>
  .filters {
    display: flex;
    gap: 0.6rem;
    flex-wrap: wrap;
    margin-bottom: 1rem;
  }
  .filters input,
  .filters select {
    flex: 1;
    min-width: 150px;
  }

  .table-meta {
    font-size: 0.82rem;
    color: #6b7280;
    margin-bottom: 0.5rem;
  }

  .table-wrap {
    overflow-x: auto;
  }
  table {
    width: 100%;
    border-collapse: collapse;
    font-size: 0.88rem;
  }
  th {
    background: #f3f4f6;
    text-align: left;
    padding: 0.6rem 0.8rem;
    font-weight: 600;
    color: #374151;
  }
  td {
    padding: 0.55rem 0.8rem;
    border-bottom: 1px solid #f3f4f6;
    vertical-align: middle;
  }
  .row-hover:hover {
    background: #f9fafb;
    cursor: pointer;
  }
  .mono {
    font-family: monospace;
    font-size: 0.8rem;
  }
  .date {
    font-size: 0.78rem;
    color: #6b7280;
  }

  .badge {
    padding: 0.2rem 0.55rem;
    border-radius: 999px;
    font-size: 0.75rem;
    font-weight: 600;
  }
  .badge--python {
    background: #dbeafe;
    color: #1e40af;
  }
  .badge--java {
    background: #fef9c3;
    color: #713f12;
  }

  .empty {
    text-align: center;
    color: #9ca3af;
    padding: 2rem;
  }

  .overlay {
    position: fixed;
    inset: 0;
    z-index: 200;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 1rem;
  }
  .overlay-backdrop {
    position: absolute;
    inset: 0;
    border: none;
    padding: 0;
    margin: 0;
    background: rgba(0, 0, 0, 0.45);
    cursor: pointer;
  }
  .modal {
    position: relative;
    z-index: 1;
    background: #fff;
    border-radius: 12px;
    padding: 1.5rem;
    max-width: 700px;
    width: 100%;
    max-height: 80vh;
    overflow-y: auto;
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.25);
    pointer-events: auto;
  }
  .modal--loading {
    max-width: 320px;
    text-align: center;
  }
  .modal-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 1rem;
  }
  .modal-header h3 {
    margin: 0 0 0.2rem;
    font-size: 1rem;
  }
  .modal-meta {
    font-size: 0.8rem;
    color: #6b7280;
    margin: 0;
  }
  .code-block {
    background: #1e1e2e;
    color: #cdd6f4;
    padding: 1rem;
    border-radius: 8px;
    font-size: 0.82rem;
    line-height: 1.5;
    overflow-x: auto;
    white-space: pre;
    margin: 0;
  }
  .hash-line {
    font-size: 0.75rem;
    color: #9ca3af;
    margin-top: 0.75rem;
    word-break: break-all;
  }
  .hash-line code {
    font-family: monospace;
  }
</style>
