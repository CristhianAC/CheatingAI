# Procto — UX roadmap (inventario)

## Componentes shadcn instalados

alert, badge, button, card, dialog, table, accordion, skeleton, separator, tooltip, input, label, **sonner**

## Logo (tamaños objetivo)

| Zona | Implementación |
|------|----------------|
| Auth desktop (panel izquierdo) | `max-w-[min(280px,70%)]` aspect-square, título `text-4xl`–`5xl` |
| Auth móvil | `size-28` (112px) centrado |
| Header autenticado | `h-[4.25rem]` sin cambiar `--procto-header-h` (5rem) |

## Por área

| Área | Archivos | Notas |
|------|----------|--------|
| Layout | `client/src/routes/+layout.svelte`, `app.css` | Auth split + toggle tema; sonner Toaster |
| Auth | `login/`, `register/` | Card + inputs; branding grande en panel izquierdo |
| Estudiante | `join-exam/`, `proctoring/`, `ProctoringMonitor.svelte` | Conexión `/proctoring-health`, sesión única, identidad |
| Profesor | `exams/`, `exams/[examId]/sessions/`, `proctoring/report/[sessionId]/` | Búsqueda local, timeline eventos |
| API examen | `app/routers/exams.py`, `app/services/exam_access.py`, `exam-status.js` | `EXAM_NOT_STARTED` en verify-code |

## Fuera de alcance (fases futuras)

- Reproductor de video con seek por timestamp
- Heatmap de atención
- recharts / índice de integridad de clase
- DataTable TanStack completo
- Filtros backend "más de 3 alertas"
- **Sidebar** (header mejorado es suficiente)
- **Sheet** en reporte (Dialog de capturas cubre el caso)
