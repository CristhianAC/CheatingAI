<script>
  import { createEventDispatcher } from 'svelte';
  import { createSubmission } from '$lib/api.js';
  import { showToast, showError } from '$lib/stores.js';

  const dispatch = createEventDispatcher();

  let form = {
    student_id: '',
    problem_id: '',
    exam_id: '',
    language: 'python',
    source_code: ''
  };

  let loading = false;

  const EXAMPLES = {
    python: `def fibonacci(n):
    if n <= 1:
        return n
    return fibonacci(n - 1) + fibonacci(n - 2)`,
    java: `public class Solution {
    public int fibonacci(int n) {
        if (n <= 1) return n;
        return fibonacci(n - 1) + fibonacci(n - 2);
    }
}`
  };

  function fillExample() {
    form.source_code = EXAMPLES[form.language];
  }

  async function handleSubmit() {
    if (!form.student_id || !form.problem_id || !form.source_code.trim()) {
      showError('Completa student_id, problem_id y source_code.');
      return;
    }
    loading = true;
    try {
      const payload = { ...form };
      if (!payload.exam_id) delete payload.exam_id;
      const result = await createSubmission(payload);
      showToast(`Submission creada: ${result.id.slice(0, 8)}…`);
      form = { student_id: '', problem_id: '', exam_id: '', language: 'python', source_code: '' };
      dispatch('created', result);
    } catch (e) {
      showError(e.message);
    } finally {
      loading = false;
    }
  }
</script>

<form class="card" on:submit|preventDefault={handleSubmit}>
  <h2 class="card__title">Nueva Submission</h2>

  <div class="grid-2">
    <div class="field">
      <label for="student_id">Student ID *</label>
      <input id="student_id" bind:value={form.student_id} placeholder="est-001" required />
    </div>
    <div class="field">
      <label for="problem_id">Problem ID *</label>
      <input id="problem_id" bind:value={form.problem_id} placeholder="prob-fibonacci" required />
    </div>
    <div class="field">
      <label for="exam_id">Exam ID (opcional)</label>
      <input id="exam_id" bind:value={form.exam_id} placeholder="parcial-1" />
    </div>
    <div class="field">
      <label for="language">Lenguaje *</label>
      <select id="language" bind:value={form.language}>
        <option value="python">Python</option>
        <option value="java">Java</option>
      </select>
    </div>
  </div>

  <div class="field">
    <div class="code-header">
      <label for="source_code">Código fuente *</label>
      <button type="button" class="btn btn--ghost btn--sm" on:click={fillExample}>
        📋 Cargar ejemplo
      </button>
    </div>
    <textarea
      id="source_code"
      bind:value={form.source_code}
      rows="10"
      placeholder="Pega el código aquí..."
      spellcheck="false"
      required
    ></textarea>
  </div>

  <button class="btn btn--primary" type="submit" disabled={loading}>
    {loading ? '⏳ Enviando...' : '📤 Crear Submission'}
  </button>
</form>

<style>
  .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem; }
  .code-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.35rem; }
  .code-header label { margin-bottom: 0; }
  textarea { font-family: 'Courier New', monospace; font-size: 0.85rem; }
  @media (max-width: 600px) { .grid-2 { grid-template-columns: 1fr; } }
</style>
