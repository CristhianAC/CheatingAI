# Instalación y despliegue

## 1. Descripción general de la solución

CheatingAI (UI **Procto**) es un sistema distribuido en varios procesos: API de aplicación, servicio de proctoring, worker de plagio, Redis y cliente web. La instalación recomendada para desarrollo y demostración es **Docker Compose** más el cliente SvelteKit en modo desarrollo.

### 1.1 Lenguajes y tecnologías utilizadas

| Tecnología | Versión recomendada | Uso |
|------------|---------------------|-----|
| Python | 3.11+ | APIs FastAPI, Celery, visión |
| Node.js | 20+ | Cliente SvelteKit |
| Docker / Docker Compose | Reciente | Orquestación de servicios |
| PostgreSQL | 15+ (vía Supabase) | Producción / demo con nube |
| SQLite | 3 | Desarrollo local alternativo |
| Redis | 7.2 | Broker Celery |

### 1.2 Componentes de la solución

| Servicio (compose) | Puerto | Función |
|--------------------|--------|---------|
| `redis` | 6379 | Cola para trabajos de plagio |
| `api` | 8000 | Auth, usuarios, exámenes, submissions, jobs |
| `worker` | — | Ejecuta comparaciones Winnowing |
| `flower` | 5555 | Monitor de Celery (opcional) |
| `proctoring` | 8001 | Supervisión, sesiones, visión |
| `client` (npm) | 5173 | Interfaz Procto (desarrollo) |

## 2. Requisitos previos

### 2.1 Software requerido

- **Git** para clonar el repositorio.
- **Docker** y **Docker Compose** (plugin `compose` v2).
- **Node.js** 20+ y **npm** (solo para el cliente web).
- Opcional: **Python 3.11+** y `venv` si se ejecutan pruebas `pytest` del proctoring fuera de Docker.
- Navegador moderno (Chrome, Firefox, Edge) con soporte de cámara para proctoring.

### 2.2 Variables de entorno

Copiar `.env.example` a `.env` en la **raíz del repositorio** (junto a `docker-compose.yml`). No versionar `.env`.

| Variable | Obligatoria | Descripción |
|----------|-------------|-------------|
| `DATABASE_URL` | Sí | SQLite o PostgreSQL (Supabase). Usada por `api` y `proctoring` |
| `JWT_SECRET` | Sí | Secreto para tokens JWT |
| `JWT_ALGORITHM` | No | Por defecto `HS256` |
| `JWT_EXPIRE_MINUTES` | No | Duración del token |
| `SUPABASE_URL` | Para Storage | URL del proyecto Supabase |
| `SUPABASE_SERVICE_KEY` | Para Storage | Clave `service_role` (secreto) |
| `SUPABASE_PROFILE_BUCKET` | Recomendada | p. ej. `profile-photos` |
| `SUPABASE_VIOLATION_CAPTURES_BUCKET` | Recomendada | p. ej. `violation-captures` |
| `REDIS_URL` | Sí (plagio) | En compose: `redis://redis:6379/0` |
| `WINNOWING_K`, `WINNOWING_W`, `DEFAULT_THRESHOLD` | No | Parámetros algoritmo plagio |

Ver comentarios detallados en [.env.example](./.env.example).

## 3. Instalación para ambiente de desarrollo

### 3.1 Desarrollo sin contenedores

No es el camino principal del equipo; se documenta como referencia. Requiere instalar dependencias de `requirements.txt` (API) y `proctoring_service/requirements.txt` por separado, Redis local y configurar `DATABASE_URL` manualmente. **Se recomienda Docker** para evitar discrepancias con MediaPipe y dependencias nativas.

#### 3.1.1 Clonar el repositorio

```bash
git clone https://github.com/CristhianAC/CheatingAI.git
cd CheatingAI
```

#### 3.1.2 Instalar dependencias

Solo cliente (si no usa Docker para backends):

```bash
cd client
npm install
```

#### 3.1.3 Configurar variables de entorno

```bash
cp .env.example .env
# Editar .env con editor de texto
```

#### 3.1.4 Ejecutar servicios requeridos

Levantar Redis, API y proctoring según documentación en [Desarrollo.md](./Desarrollo.md) o usar compose (§3.2).

#### 3.1.5 Iniciar la aplicación

```bash
cd client
npm run dev
```

### 3.2 Desarrollo con contenedores

#### 3.2.1 Construcción de contenedores

Desde la raíz del repositorio:

```bash
docker compose build
```

#### 3.2.2 Ejecución del entorno

**Solo proctoring + API mínima (demo supervisión):**

```bash
docker compose up --build redis api proctoring
```

**Stack completo (auth, exámenes, proctoring, plagio):**

```bash
docker compose up --build redis api proctoring worker
```

En otra terminal, cliente web:

```bash
cd client
npm install
npm run dev
```

#### 3.2.3 Servicios disponibles

| URL | Descripción |
|-----|-------------|
| http://localhost:8000/docs | API principal (OpenAPI) |
| http://localhost:8000/health | Salud API |
| http://localhost:8001/docs | API proctoring |
| http://localhost:8001/health | Salud proctoring |
| http://localhost:5173 | Procto (Vite dev) |
| http://localhost:5555 | Flower (si worker está activo) |

El proxy de Vite en `client/vite.config.js` enruta `/api/v1/proctoring` y `/api/v1/sessions` al puerto **8001**; el resto de `/api` al **8000**.

#### 3.2.4 Apagado del entorno

```bash
docker compose down
```

Para eliminar volúmenes de datos: `docker compose down -v` (borra SQLite/Redis persistidos en volúmenes).

## 4. Despliegue (en caso de ser aplicable)

### 4.1 Arquitectura de despliegue

En producción se sugiere:

- **Supabase** (PostgreSQL + Storage) para datos y capturas.
- Contenedores `api`, `proctoring`, `worker`, `redis` en VM o orquestador (Kubernetes opcional).
- Cliente **build estático** (`npm run build` en `client/`) servido por Nginx o CDN.
- HTTPS terminado en reverse proxy (Nginx, Caddy, load balancer).

### 4.2 Proceso de actualización

1. Obtener nueva versión del código (`git pull`).
2. Reconstruir imágenes: `docker compose build`.
3. Reiniciar con rolling: `docker compose up -d` (estrategia según entorno).
4. Ejecutar migraciones Supabase si existen en `supabase/migrations/`.
5. Verificar `/health` y flujo de login.

### 4.3 Despliegue sin contenedores

#### 4.3.1 Preparación del servidor

Servidor Linux con Python 3.11, Node para build del cliente, Redis instalado, acceso saliente a Supabase.

#### 4.3.2 Instalación de dependencias

Instalar paquetes Python desde `requirements.txt` y `proctoring_service/requirements.txt`; build del cliente con `npm run build`.

#### 4.3.3 Configuración de la aplicación

`.env` de producción con secretos fuertes (`JWT_SECRET`, `SUPABASE_SERVICE_KEY`), `DEBUG=false`, `DATABASE_URL` de pooler o conexión directa según Supabase.

#### 4.3.4 Ejecución de la aplicación

- API: Uvicorn según `docker/Dockerfile.api` (referencia).
- Proctoring: **un worker** Uvicorn (requisito MediaPipe).
- Worker Celery: cola `plagiarism`.
- Servir carpeta `client/build` como sitio estático.

#### 4.3.5 Actualización de versiones

Detener procesos, actualizar código, reinstalar dependencias si cambian, reiniciar servicios y validar health.

### 4.4 Despliegue con contenedores

#### 4.4.1 Construcción de imágenes

```bash
docker compose -f docker-compose.yml build
```

Dockerfiles en `docker/Dockerfile.api`, `docker/Dockerfile.worker`, `docker/Dockerfile.proctoring`.

#### 4.4.2 Ejecución en servidor

```bash
docker compose up -d
```

#### 4.4.3 Variables de entorno y secretos

Inyectar `.env` o secretos del orquestador; nunca incluir claves en la imagen. Rotar `JWT_SECRET` implica invalidar sesiones activas.

#### 4.4.4 Persistencia y redes

Volúmenes `redis_data`, `db_data`, `proctoring_data` en `docker-compose.yml`. Red por defecto de compose; exponer solo puertos necesarios al proxy.

#### 4.4.5 Actualización del despliegue

`docker compose pull` (si hay registry), `build`, `up -d --force-recreate` para servicios modificados.

## 5. Verificación de funcionamiento

```bash
# Salud APIs
curl -s -o /dev/null -w "%{http_code}" http://localhost:8000/health   # esperado: 200
curl -s -o /dev/null -w "%{http_code}" http://localhost:8001/health   # esperado: 200

# Cliente
cd client && npm run build   # debe completar sin errores
```

Flujo manual: abrir http://localhost:5173 → login → (profesor) exámenes o (estudiante) unirse a examen → supervisión con activación manual de cámara → reporte de sesión.

Pruebas automatizadas proctoring:

```bash
cd proctoring_service
pip install -r requirements.txt -r requirements-dev.txt
pytest tests/ -v
```

## 6. Solución de problemas frecuentes

### Error `tenant/user postgres.xxx not found` al arrancar API/proctoring

**Causa:** `DATABASE_URL` en `.env` no coincide con el proyecto Supabase (ref incorrecto, pooler mal configurado o proyecto pausado).

**Solución:**

1. Supabase Dashboard → Settings → Database → copiar URI de conexión.
2. Desarrollo: conexión **directa** `db.[ref].supabase.co`, usuario `postgres`, puerto `5432`.
3. Pooler: usuario `postgres.[PROJECT-REF]`, host y puerto del dashboard (Session 5432 / Transaction 6543).
4. Reiniciar: `docker compose down && docker compose up --build redis api proctoring`.
5. Alternativa local: `DATABASE_URL=sqlite:///./data/cheating_ai.db` (datos distintos a la nube).

### Login falla con “error de conexión” en el cliente

Verificar que `cheating_ai_api` y `cheating_ai_proctoring` muestren `Application startup complete` en logs. Si la API no arranca por BD, el frontend no puede autenticar.

### Cámara no inicia en registro/perfil

El navegador debe otorgar permisos; usar botón **Activar cámara** (no hay auto-start). En Brave, la validación usa MediaPipe en el cliente.

### Jobs de plagio no avanzan

Comprobar que el contenedor `worker` está en ejecución y que Redis responde (`redis-cli ping`).

## 7. Mantenimiento y actualización

- Revisar periódicamente dependencias (`npm audit`, actualizaciones Python).
- Mantener buckets Supabase y políticas RLS acordes a privacidad institucional.
- Respaldar `DATABASE_URL` y políticas de retención de capturas en `violation-captures`.
- Documentación técnica viva en [Desarrollo.md](./Desarrollo.md) e [Informe.md](./Informe.md).

## 8. Referencias relacionadas

- [Readme.md](./Readme.md) — entrada al proyecto
- [Informe.md](./Informe.md) — informe académico
- [Desarrollo.md](./Desarrollo.md) — manual del desarrollador
- [ARCHITECTURE.md](./ARCHITECTURE.md) — diagramas C4
- [documentacion.md](./documentacion.md) — referencia técnica ampliada (API, ejemplos)
