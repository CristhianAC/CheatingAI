# Manual de desarrollo

## 1. Propósito del documento

Este documento tiene como objetivo servir de guía técnica para comprender, mantener, extender y dar continuidad al desarrollo del proyecto. Está dirigido a futuros equipos de trabajo que necesiten familiarizarse rápidamente con la estructura del repositorio, la organización de la solución, los contenedores, los scripts, las variables de entorno y el flujo de trabajo del sistema.

## 2. Descripción general del proyecto desde la perspectiva de desarrollo

CheatingAI es una solución **API-first** con cliente web **Procto** (SvelteKit). Dos backends FastAPI coexisten: la **API principal** (`app/`, puerto 8000) para autenticación, exámenes y plagio; el **servicio de proctoring** (`proctoring_service/`, puerto 8001) para visión por computador, sesiones y reportes. Redis y un worker Celery procesan trabajos de similitud de código de forma asíncrona.

### 2.1 Tecnologías principales

- **Frontend:** SvelteKit 5, Vite 5, shadcn-svelte, Tailwind CSS v4, MediaPipe Tasks Vision (validación cámara en cliente)
- **Backend API:** Python 3.11, FastAPI, SQLAlchemy, Pydantic, Celery, Redis
- **Proctoring:** FastAPI, MediaPipe, OpenCV, DeepFace (Facenet), almacenamiento Supabase
- **Base de datos:** PostgreSQL (Supabase) o SQLite según `DATABASE_URL`
- **Contenedores:** Docker, Docker Compose
- **Infraestructura adicional:** Supabase Storage, Flower (monitor Celery)

### 2.2 Componentes principales

- **Cliente web (`client/`):** UI Procto — rutas por rol, proxy a APIs, componentes en `$lib/components/ui` (shadcn-svelte).
- **API principal (`app/`):** Routers `auth`, `users`, `exams`, submissions y jobs; lógica de plagio en `app/services/plagiarism/`.
- **Servicio proctoring (`proctoring_service/`):** Routers `proctoring`, `sessions`; pipeline en `app/services/` (detector, gaze, phone, identity); `risk_scorer` para reportes.
- **Base de datos:** Modelos SQLAlchemy en cada servicio; migraciones Supabase en `supabase/migrations/` cuando aplica.
- **Servicios externos:** Supabase (Postgres + Storage), Redis (broker).

## 3. Estructura del repositorio

### 3.1 Árbol general del repositorio

```text
CheatingAI/
├── app/                    # API principal (:8000)
│   ├── routers/
│   ├── services/
│   ├── models/
│   └── tasks/                # Celery
├── proctoring_service/       # API proctoring (:8001)
│   ├── app/
│   └── tests/
├── client/                   # Frontend Procto (SvelteKit)
│   ├── src/routes/
│   └── src/lib/
├── docker/                   # Dockerfiles
├── diseno/                   # Documentación experimentos CV
├── supabase/migrations/
├── scripts/
├── docker-compose.yml
├── .env.example
├── Readme.md
├── Informe.md
├── Instalación.md
├── Desarrollo.md
├── ARCHITECTURE.md
└── CRITERIOS_DE_RIESGO.md
```

### 3.2 Descripción de directorios y archivos relevantes

- **`app/`:** API de plagio, autenticación JWT, usuarios, exámenes; tareas Celery.
- **`proctoring_service/`:** Microservicio de supervisión; **no importar** lógica de plagio aquí.
- **`client/`:** Única aplicación frontend; `vite.config.js` define proxies.
- **`docker/`:** `Dockerfile.api`, `Dockerfile.proctoring`, `Dockerfile.worker`.
- **`diseno/`:** Notas y experimentos (rostro, mirada, pose, objetos).
- **`supabase/migrations/`:** SQL para esquema en Supabase.
- **`tests/`:** Pruebas unitarias/integración del API principal.
- **`proctoring_service/tests/`:** Pruebas del servicio de proctoring.
- **`.cursor/skills/`:** Skills de agente (p. ej. shadcn-ux-expert) — no requerido en runtime.

## 4. Organización de la solución a nivel de código

### 4.1 Organización por módulos o capas

**Backend (ambos servicios):**

- **Routers:** validación HTTP, delegación a servicios.
- **Services:** lógica de negocio, visión, scoring, storage.
- **Models / schemas:** persistencia y contratos Pydantic.
- **Config:** `config.py` + variables de entorno.

**Frontend:**

- **Capa de presentación:** `src/routes/**/+page.svelte`.
- **Capa de integración:** `src/lib/api.js`, `proctoring-api.js`, `auth.js`, `exams-api.js`.
- **Estado:** `authStore`, `examStore`, `stores.js`.
- **Componentes UI:** `$lib/components/ui/*` (shadcn), componentes de dominio (`ProctoringMonitor`, `CameraCapture`, etc.).

### 4.2 Relación entre componentes del sistema y código fuente

| Componente sistema | Ubicación |
|--------------------|-----------|
| Auth / usuarios | `app/routers/auth.py`, `users.py`; `client/src/lib/auth.js` |
| Exámenes | `app/routers/` (exams); `client/src/routes/exams/` |
| Proctoring API | `proctoring_service/app/routers/proctoring.py` |
| Sesiones / reportes | `proctoring_service/app/routers/` + `session_service.py`, `risk_scorer.py` |
| UI supervisión | `client/src/routes/proctoring/`, `ProctoringMonitor.svelte` |
| Plagio | `app/services/plagiarism/`; `client/src/routes/submissions|analysis|jobs/` |

## 5. Contenedores

### 5.1 Contenedores utilizados

| Contenedor | Imagen / build | Función |
|------------|----------------|---------|
| `cheating_ai_redis` | redis:7.2-alpine | Broker Celery |
| `cheating_ai_api` | docker/Dockerfile.api | API :8000 |
| `cheating_ai_worker` | docker/Dockerfile.worker | Worker plagio |
| `cheating_ai_flower` | mismo worker | UI Celery :5555 |
| `cheating_ai_proctoring` | docker/Dockerfile.proctoring | Proctoring :8001 |

### 5.2 Archivos relacionados con contenedores

- `docker-compose.yml` — orquestación y volúmenes
- `docker/Dockerfile.api`
- `docker/Dockerfile.proctoring`
- `docker/Dockerfile.worker`

### 5.3 Construcción y ejecución de contenedores

```bash
docker compose build
docker compose up -d redis api proctoring worker
```

Solo proctoring para desarrollo frontend:

```bash
docker compose up --build redis api proctoring
```

### 5.4 Redes, puertos y volúmenes

| Puerto | Servicio |
|--------|----------|
| 6379 | Redis |
| 8000 | API |
| 8001 | Proctoring |
| 5555 | Flower |
| 5173 | Vite (host, no contenedor) |

Volúmenes: `redis_data`, `db_data`, `proctoring_data` — persisten datos entre reinicios.

### 5.5 Recomendaciones para modificar contenedores

- No aumentar workers de Uvicorn en **proctoring** sin validar fork-safety de MediaPipe.
- Tras cambiar `DATABASE_URL`, recrear contenedores que usan `env_file`.
- Mantener `env_file: .env` en compose; no hardcodear secretos en Dockerfiles.

## 6. Scripts y automatizaciones

### 6.1 Scripts principales

**Cliente (`client/package.json`):**

| Script | Propósito |
|--------|-----------|
| `npm run dev` | Servidor desarrollo Vite (:5173) |
| `npm run build` | Build producción en `client/build` |
| `npm run preview` | Preview del build |

**Proctoring:**

| Comando | Propósito |
|---------|-----------|
| `pytest tests/ -v` | Pruebas automatizadas (desde `proctoring_service/`) |

**Compose:**

| Comando | Propósito |
|---------|-----------|
| `docker compose up --build` | Levantar stack |
| `docker compose down -v` | Bajar y borrar volúmenes |

**shadcn-svelte (UI):**

```bash
cd client
npx shadcn-svelte@latest add button -y
```

Requiere Svelte 5 y `components.json` en `client/`.

### 6.2 Ubicación de scripts auxiliares

- `scripts/` — utilidades del repositorio (revisar contenido antes de ejecutar).
- Migraciones SQL en `supabase/migrations/`.

### 6.3 Consideraciones para su uso

- Ejecutar `npm run build` tras cambios grandes en el cliente antes de integrar.
- `pytest` del proctoring descarga modelos; primera ejecución lenta.
- CLI `shadcn-svelte init` puede ser interactivo; preferir `add <component> -y` con `components.json` existente.

## 7. Variables de entorno

### 7.1 Variables requeridas

| Variable | Servicios | Descripción |
|----------|-----------|-------------|
| `DATABASE_URL` | api, proctoring | Cadena SQLAlchemy |
| `JWT_SECRET` | api | Firma JWT |
| `REDIS_URL` | api, worker | Broker Celery |
| `SUPABASE_URL`, `SUPABASE_SERVICE_KEY` | api, proctoring | Storage (capturas, fotos) |

### 7.2 Variables por ambiente

| Ambiente | DATABASE_URL | Notas |
|----------|--------------|-------|
| Desarrollo local | SQLite o Supabase directa | Ver `.env.example` |
| Docker compose | Misma `.env` raíz | Host `redis` en URL Redis |
| Producción | Supabase pooler/directa | `DEBUG=false` |

### 7.3 Archivos de configuración

- **`.env`** — local, no commitear
- **`.env.example`** — plantilla documentada en raíz
- **`client/components.json`** — configuración shadcn-svelte (no secretos)

### 7.4 Manejo seguro de secretos

Nunca commitear: `JWT_SECRET`, `SUPABASE_SERVICE_KEY`, contraseñas en `DATABASE_URL`. Usar variables del CI/CD en despliegue. La clave `service_role` de Supabase solo en backend.

## 8. Flujo de trabajo de desarrollo

### 8.1 Preparación del entorno

1. Clonar repositorio.
2. `cp .env.example .env` y configurar Supabase o SQLite.
3. `docker compose up --build redis api proctoring` (añadir `worker` si se trabaja plagio).
4. `cd client && npm install && npm run dev`.
5. Abrir http://localhost:5173 y documentación API en `/docs`.

### 8.2 Desarrollo de nuevas funcionalidades

- Crear rama desde `main` (o convención del equipo).
- Cambios de API: actualizar routers + schemas + tests si aplica.
- Cambios UI: solo `client/`; preservar lógica en `<script>` al rediseñar (ver skill shadcn-ux-expert).
- Proctoring sensible: no alterar guards en `proctoring/+page.svelte`, `+page.ts` (`ssr = false`), ni intervalos de `analyzeFrame` sin revisión.

### 8.3 Ejecución de pruebas y validaciones

```bash
cd proctoring_service && pytest tests/ -v
cd client && npm run build
```

### 8.4 Integración de cambios

Pull request con descripción, capturas si es UI, confirmación de build y pruebas. Revisión por par antes de merge a rama principal.

## 9. Dependencias y servicios externos

### 9.1 Servicios externos integrados

- **Supabase:** PostgreSQL + Storage (fotos perfil, capturas violación).
- **MediaPipe / DeepFace:** modelos descargados en runtime (CDN / primera carga).
- **Redis:** cola interna (no servicio cloud obligatorio en dev).

### 9.2 Requisitos de acceso

- Proyecto Supabase con buckets `profile-photos` y `violation-captures` (o nombres en `.env`).
- `service_role` key para subidas desde backend.
- Cámara y HTTPS/localhost para pruebas de `getUserMedia`.

### 9.3 Consideraciones de desarrollo y pruebas

- Sin Supabase Storage: eventos se registran pero pueden carecer de `frame_snapshot`.
- SQLite local: datos no compartidos con compañeros ni con Supabase dashboard.
- Flower en :5555 solo informativo para Celery.

## 10. Convenciones del proyecto

### 10.1 Convenciones de código

- **Python:** PEP 8 habitual; routers delgados; configuración vía `Settings`.
- **Svelte/JS:** componentes en `PascalCase`; stores en `*Store`; imports desde `$lib`.
- **UI:** español en textos visibles; tokens `--procto-*` y tema shadcn en `app.css`.
- **Commits:** mensajes descriptivos en español o inglés según acuerdo del equipo.

### 10.2 Convenciones de repositorio

- No commitear `.env`, `client/node_modules`, `client/build`, `.svelte-kit`.
- Punto de entrada documentación: `Readme.md` (no duplicar README largo en raíz).
- Issues/PRs en GitHub: https://github.com/CristhianAC/CheatingAI

### 10.3 Convenciones de documentación

- Cambios de arquitectura → actualizar `ARCHITECTURE.md` o `Informe.md`.
- Cambios de instalación → `Instalación.md`.
- Criterios de riesgo → `CRITERIOS_DE_RIESGO.md`.

## 11. Problemas frecuentes y recomendaciones

### 11.1 Problemas frecuentes

- **`DATABASE_URL` incorrecta** → API no arranca; ver Instalación §6.
- **Puerto 8000/8001 ocupado** → ajustar compose o procesos locales.
- **Cámara bloqueada** → permisos del navegador; botón Activar cámara.
- **pnpm en CLI shadcn** falla → usar `npm` para instalar deps de componentes.
- **Svelte 4 vs 5** — el cliente requiere Svelte 5 para shadcn-svelte 1.x.

### 11.2 Deuda técnica conocida

- CSS legacy en página de reporte (`proctoring/report/[sessionId]`).
- `informe2.md` vs alcance dual plagio+proctoring (documentación consolidada en `Informe.md`).
- Init interactivo de shadcn-svelte no automatizado en CI.
- Un worker Uvicorn en proctoring limita escalado horizontal.

### 11.3 Recomendaciones para continuidad

- Leer [ARCHITECTURE.md](./ARCHITECTURE.md) antes de refactorizar proctoring.
- Mantener separación estricta entre puertos 8000 y 8001.
- Calibrar umbrales de mirada en `config.py` del proctoring con datos reales del aula.
- Considerar tests e2e (Playwright) para flujos críticos de UI.

## 12. Historial de decisiones técnicas relevantes

| Decisión | Razón |
|----------|-------|
| Microservicio proctoring en :8001 | Aislar ML y dependencias pesadas |
| SvelteKit + proxy Vite | Un solo origen en dev para APIs |
| Supabase Storage para evidencia | Evitar operar MinIO en PFG |
| Verificación identidad en backend (`analyze-frame`) | Una sola fuente de verdad; evita duplicar con polling cliente |
| Upgrade a Svelte 5 | Requisito shadcn-svelte 1.x / Tailwind v4 |
| MediaPipe en cliente para registro | Compatibilidad Brave sin `FaceDetector` nativo |
| JWT compartido entre APIs | UX single sign-on en Procto |
| Winnowing + Celery para plagio | Análisis batch sin bloquear API |

## 13. Referencias relacionadas

- [Readme.md](./Readme.md)
- [Informe.md](./Informe.md)
- [Instalación.md](./Instalación.md)
- [ARCHITECTURE.md](./ARCHITECTURE.md)
- [CRITERIOS_DE_RIESGO.md](./CRITERIOS_DE_RIESGO.md)
- [documentacion.md](./documentacion.md)
- FastAPI: https://fastapi.tiangolo.com/
- SvelteKit: https://svelte.dev/docs/kit
- shadcn-svelte: https://www.shadcn-svelte.com/
- Supabase: https://supabase.com/docs
