## Cronograma del Proyecto
---

### Fase 1 — Investigación y definición del proyecto
**Duración estimada: 2 semanas | Estado: Completada**

Objetivo: entender el problema, elegir las tecnologías y dejar por escrito qué se va a construir.

- [x] Definir el problema: los profesores no tienen cómo supervisar visualmente a los estudiantes en exámenes virtuales.
- [x] Escribir la introducción y el planteamiento del problema en el README principal.
- [x] Definir las restricciones del sistema (sin GPU, sin hardware especial, sin guardar video).
- [x] Definir los supuestos de diseño (cámara encendida, iluminación aceptable, fondo estático).
- [x] Definir el alcance: qué va a hacer el sistema y qué NO va a hacer.
- [x] Investigar tecnologías para detección de rostro (OpenCV, MediaPipe, dlib).
- [x] Investigar tecnologías para seguimiento de mirada (MediaPipe Face Mesh, GazeTracking, L2CS-Net).
- [x] Investigar tecnologías para estimación de pose corporal (MediaPipe Pose, OpenPose, MoveNet).
- [x] Investigar tecnologías para detección de objetos sospechosos (YOLOv8, EfficientDet, Roboflow).
- [x] Escribir los documentos de diseño de cada módulo en la carpeta `diseno/`.
- [x] Escribir código de prueba básico para cada módulo de visión.
- [x] Investigar algoritmos de detección de plagio en código (Winnowing, similitud Jaccard).

---

### Fase 2 — Backend: API de detección de plagio
**Duración estimada: 3 semanas | Estado: Parcialmente completada**

Objetivo: construir el servicio que recibe códigos de estudiantes y detecta si son demasiado similares.

- [x] Crear la estructura base del proyecto con FastAPI.
- [x] Implementar el tokenizador de código fuente con Pygments (Python, Java, C++, JavaScript).
- [x] Implementar el normalizador de tokens (reemplazar nombres de variables por etiquetas genéricas).
- [x] Implementar el algoritmo de k-grams (dividir el código en subsecuencias de N tokens).
- [x] Implementar el algoritmo Winnowing (seleccionar huellas digitales del código).
- [x] Implementar la función de similitud Jaccard entre dos conjuntos de huellas.
- [x] Implementar el comparador completo: toma dos códigos y devuelve un puntaje de 0 a 1.
- [x] Implementar detección rápida de copia exacta por hash SHA256.
- [x] Crear el modelo de base de datos para submissions (código de estudiante).
- [x] Crear el endpoint para subir una nueva submission (`POST /api/v1/submissions`).
- [x] Crear el endpoint para listar submissions con filtros (`GET /api/v1/submissions`).
- [x] Crear el endpoint para actualizar una submission (`PUT /api/v1/submissions/{id}`).
- [x] Crear el endpoint para eliminar una submission (`DELETE /api/v1/submissions/{id}`).
- [x] Crear el endpoint de comparación directa entre dos submissions (`POST /api/v1/analysis/pairwise`).
- [x] Crear el modelo de base de datos para jobs de análisis.
- [x] Crear el endpoint para lanzar análisis batch de muchos estudiantes (`POST /api/v1/analysis/batch`).
- [x] Crear el endpoint para ver el estado de un job (`GET /api/v1/jobs/{id}`).
- [x] Crear el endpoint para ver los resultados de un job completado (`GET /api/v1/jobs/{id}/results`).
- [x] Integrar Celery para procesar los análisis batch en segundo plano.
- [x] Integrar Redis como cola de mensajes para Celery.
- [x] Implementar la tarea Celery de análisis batch (compara todos los pares posibles).
- [x] Implementar guardado de resultados en lotes para no saturar la base de datos.
- [x] Implementar actualización de progreso del job durante la ejecución.
- [x] Configurar Flower para monitorear las tareas Celery desde el navegador.
- [x] Escribir tests unitarios para el algoritmo Winnowing.
- [x] Escribir tests unitarios para el comparador de submissions.
- [ ] Escribir tests de integración para los endpoints de la API. *(3 días)*
- [ ] Agregar soporte para más lenguajes de programación (Go, Rust, PHP, etc.). *(2 días por lenguaje)*

---

### Fase 3 — Backend: API de supervisión por cámara (Proctoring)
**Duración estimada: 3 semanas | Estado: Parcialmente completada**

Objetivo: construir el servicio que analiza los fotogramas de la cámara del estudiante y detecta comportamientos sospechosos.

- [x] Crear la estructura base del microservicio con FastAPI (`proctoring_service/`).
- [x] Implementar el detector de rostros con MediaPipe Face Detection (BlazeFace).
- [x] Implementar la lógica para detectar ausencia de persona en cámara y generar alerta.
- [x] Implementar la lógica para detectar más de una persona en cámara y generar alerta.
- [x] Implementar el estimador de mirada con MediaPipe Face Mesh (476 puntos faciales).
- [x] Implementar detección de mirada horizontal (el estudiante mira hacia la izquierda o derecha).
- [x] Implementar detección de mirada vertical (el estudiante mira hacia abajo).
- [x] Implementar el detector de teléfono móvil con EfficientDet-Lite0.
- [x] Crear el orquestador `VisionDetector` que combina los tres detectores.
- [x] Crear el endpoint para analizar un fotograma (`POST /api/v1/proctoring/analyze-frame`).
- [x] Crear el endpoint de calibración para ajustar los umbrales de mirada (`POST /api/v1/proctoring/calibrate`).
- [x] Crear el modelo de base de datos para sesiones de supervisión.
- [x] Crear el endpoint para iniciar una sesión (`POST /api/v1/sessions`).
- [x] Crear el endpoint para terminar una sesión (`PUT /api/v1/sessions/{id}/end`).
- [x] Crear el endpoint para ver el resumen de violaciones de una sesión (`GET /api/v1/sessions/{id}`).
- [x] Implementar el guardado automático de violaciones en base de datos durante el análisis.
- [x] Configurar los parámetros de mirada ajustables por variable de entorno (YAW_THRESHOLD, PITCH_THRESHOLD).
- [ ] Registrar cambios de pestaña/ventana durante el examen con timestamp y contexto (modelo y endpoint de eventos de pestaña en el backend). *(3–5 días)*
- [ ] Definir y refinar indicadores de trampa combinados (cambio de pestaña, miradas laterales, audio, ausencia/presencia de rostro, dispositivos externos) y asociarlos a un score de riesgo. *(2–3 días)*
- [ ] Diseñar e implementar estrategia para reducir falsos positivos (calibración de modelos y umbrales, registro de metadatos como iluminación/fps, revisión humana antes de sanción). *(repartido entre Fase 3 y 6)*
- [ ] Integrar la estimación de pose corporal (MediaPipe Pose) al servicio de proctoring. *(1 semana)*
- [ ] Detectar manos fuera del encuadre o por debajo del nivel del escritorio. *(3 días)*
- [ ] Detectar auriculares o audífonos visibles en cámara. *(2 días)*
- [ ] Detectar cierre prolongado de ojos (posible lectura de apuntes en otro soporte). *(3 días)*
- [ ] Agregar umbral de tiempo: generar alerta solo si el comportamiento persiste más de N segundos. *(2 días)*
- [x] **Guardar capturas de pantalla (fotogramas) en el momento en que se detecta una violación.** *(implementado con Supabase Storage, ver Fase 3b)*
- [ ] Escribir tests unitarios para el detector de rostros. *(1 día)*
- [ ] Escribir tests unitarios para el estimador de mirada. *(1 día)*
- [ ] Escribir tests unitarios para el detector de teléfono. *(1 día)*
- [ ] Escribir tests de integración para el endpoint `analyze-frame`. *(2 días)*

---

### Fase 3b — Almacenamiento de capturas de momentos sospechosos (Blob Storage)
**Duración estimada: 1 semana | Estado: Completada**

Objetivo: cuando el sistema detecta una violación, guardar la imagen del fotograma en ese instante
para que el profesor pueda verla después como evidencia. Implementado usando **Supabase Storage** como servicio de Blob storage gestionado.

> El sistema ahora guarda el tipo de violación, la hora y una captura de la cámara como evidencia visual, almacenada en Supabase Storage.

- [x] Elegir el servicio de almacenamiento de archivos: **Supabase Storage** como backend de Blob storage. *(medio día)*
- [x] Configurar las credenciales de Supabase (`SUPABASE_URL`, `SUPABASE_SERVICE_KEY`, `SUPABASE_BUCKET`) en el `.env` y en la configuración del servicio de proctoring. *(medio día)*
- [x] Crear el bucket en Supabase donde se guardan las capturas de violaciones. *(medio día)*
- [x] Instalar y configurar el cliente oficial de Supabase en el servicio de proctoring. *(medio día)*
- [x] Implementar la función `upload_violation_frame(session_id, frame_bytes) → url` en el backend. *(1 día)*
- [x] Modificar el endpoint `analyze-frame`: cuando hay violación, subir el fotograma a Supabase Storage y almacenar la URL en el campo `frame_snapshot` de la base de datos. *(1 día)*
- [x] Verificar que las imágenes se guardan correctamente en Supabase y se pueden recuperar desde el frontend (reporte de sesión). *(medio día)*

---

### Fase 3c — Migración a PostgreSQL
**Duración estimada: 4 días | Estado: Parcialmente completada**

Objetivo: reemplazar SQLite por PostgreSQL (gestionado en **Supabase**) para que el sistema soporte múltiples usuarios
al mismo tiempo sin conflictos de escritura en la base de datos.

> SQLite solo permite una escritura a la vez. Cuando varios estudiantes
> están siendo supervisados simultáneamente, SQLite puede generar errores de bloqueo.
> PostgreSQL (en este caso, la instancia gestionada por Supabase) no tiene esa limitación y es el motor estándar para producción.

- [x] Configurar las credenciales de PostgreSQL gestionado en Supabase (usuario, contraseña, nombre de la base de datos) en el `.env`. *(medio día)*
- [x] Cambiar la variable `DATABASE_URL` en ambos servicios para que apunten a PostgreSQL de Supabase en lugar de SQLite. *(medio día)*
- [x] Instalar el driver de PostgreSQL para Python (`psycopg2-binary`) en los servicios correspondientes. *(medio día)*
- [x] Ajustar la creación del motor SQLAlchemy para soportar `postgresql+psycopg2` y mantener compatibilidad con SQLite en desarrollo. *(medio día)*
- [x] Verificar que las tablas se crean correctamente en PostgreSQL al arrancar para la API de plagio y el servicio de proctoring. *(medio día)*
- [x] Probar que el sistema de plagio funciona correctamente con PostgreSQL (inserts, queries, batch básicos). *(medio día)*
- [x] Probar que el sistema de proctoring funciona correctamente con PostgreSQL (sesiones, violaciones y reportes). *(medio día)*
- [ ] Agregar Alembic para manejo de migraciones de base de datos (cuando se cambia la estructura de las tablas). *(1 día)*

---

### Fase 4 — Frontend: interfaz web
**Duración estimada: 3 semanas | Estado: Parcialmente completada**

Objetivo: construir las pantallas que usan los profesores y estudiantes para interactuar con el sistema.

- [x] Crear el proyecto con SvelteKit (carpeta `client/`).
- [x] Crear el layout general con navegación (Submissions, Analysis, Jobs, Supervisión).
- [x] Crear la página de Submissions: ver, subir, editar y eliminar códigos de estudiantes.
- [x] Crear la página de Analysis: comparar dos submissions o lanzar un análisis de todo un grupo.
- [x] Crear la página de Jobs: ver el historial de análisis con actualización automática cada 3 segundos.
- [x] Crear la tabla de resultados para ver los pares de código con sus puntajes de similitud.
- [x] Crear la página de Supervisión con acceso a la cámara web del navegador.
- [x] Conectar la cámara al endpoint `analyze-frame` del servicio de proctoring.
- [x] Mostrar las alertas de violación en tiempo real en la pantalla de supervisión.
- [x] Implementar sistema de notificaciones (Toast) para errores y confirmaciones.
- [x] Mostrar las capturas de pantalla de violaciones en la vista de reporte de sesión con miniatura e imagen ampliable. *(1 día — depende de Fase 3b)*
- [x] Añadir subpestañas en la vista de Supervisión para separar **Monitor en vivo** y **Actividades** (vista de profesor). *(1 día)*
- [x] Mostrar una tabla de exámenes en Actividades con columnas "ID Examen" y "# Estudiantes" basada en el endpoint `exams-summary`. *(1 día)*
- [x] Mostrar una tabla de sesiones por examen con columnas "ID estudiante", "Inicio", "Fin" y "Status", con actualización casi en tiempo real mediante polling. *(2 días)*
- [x] Crear la vista de reporte detallado de sesión (`/proctoring/report/[sessionId]`) con resumen de la sesión y lista de violaciones con imágenes. *(2 días)*
- [ ] Integrar en el frontend la detección de cambio de pestaña/ventana (listeners `visibilitychange`/focus) y envío de eventos al backend para el informe del profesor. *(2 días)*
- [ ] Mejorar el informe para el profesor en la UI: resumen ejecutivo (Normal/Revisar/Alto riesgo), score de riesgo, timeline visual de eventos y filtros por riesgo/estudiante/franja horaria. *(6 días)*
- [ ] Mostrar los marcadores visuales de MediaPipe sobre la imagen de la cámara en tiempo real (puntos de rostro, mirada). *(1 semana)*
- [ ] Mostrar un resumen al final de la sesión: total de alertas por tipo con gráfico de barras. *(2 días)*
- [ ] Agregar filtros en la tabla de resultados: ordenar por puntaje, filtrar solo los marcados como plagio. *(1 día)*
- [ ] Agregar paginación en la lista de submissions y en los resultados de jobs. *(1 día)*
- [ ] Hacer la interfaz responsiva para pantallas pequeñas (teléfonos y tablets). *(2 días)*
- [ ] Agregar modo oscuro. *(1 día)*

---

### Fase 5 — Infraestructura y despliegue
**Duración estimada: 2 semanas | Estado: Parcialmente completada**

Objetivo: empaquetar todo el sistema para que cualquiera pueda levantarlo con pocos comandos.

- [x] Escribir el Dockerfile para la API de plagio (`docker/Dockerfile.api`).
- [x] Escribir el Dockerfile para el worker de Celery (`docker/Dockerfile.worker`).
- [x] Escribir el Dockerfile para el servicio de proctoring (`docker/Dockerfile.proctoring`).
- [x] Escribir el `docker-compose.yml` con todos los servicios (Redis, API, worker, Flower, proctoring).
- [x] Configurar volúmenes de Docker para que los datos persistan entre reinicios.
- [x] Configurar healthchecks para que los servicios esperen a que Redis esté listo antes de arrancar.
- [x] Crear el archivo `.env.example` con todas las variables de entorno documentadas.
- [x] Crear el script `docker_up.sh` para levantar todos los servicios con un comando.
- [x] Crear el script `docker_down.sh` para apagar los servicios.
- [x] Crear el script `docker_logs.sh` para ver los logs de cualquier servicio.
- [x] Crear el script `dev_worker.sh` para correr el worker Celery en modo desarrollo sin Docker.
- [ ] Agregar el Dockerfile para el frontend e incluirlo en el Docker Compose. *(1 día)*
- [ ] Agregar MinIO al Docker Compose para el almacenamiento de capturas (Fase 3b), en caso de querer una alternativa auto-hosteada a Supabase Storage. *(medio día, opcional)*
- [ ] Agregar PostgreSQL al Docker Compose (Fase 3c), en caso de migrar desde la base de datos gestionada de Supabase a una instancia propia. *(1 día, opcional)*
- [ ] Configurar Nginx como servidor web: sirve el frontend y redirige las peticiones a las APIs. *(1 día)*
- [ ] Escribir instrucciones de despliegue en un servidor real (VPS o nube). *(1 día)*
- [ ] Agregar HTTPS con certificado SSL para producción. *(1 día)*

---

### Fase 5b — Seguridad y endurecimiento para producción
**Duración estimada: 1–2 semanas | Estado: No iniciada**

Objetivo: reforzar la seguridad y robustez del sistema cuando se ejecute en entornos cercanos a producción (especialmente usando servicios gestionados como Supabase).

Base de datos (PostgreSQL/Supabase):
- [ ] Configurar Row Level Security (RLS) en Supabase para limitar el acceso a filas de la base de datos según rol/usuario. *(1 día)*
- [ ] Asegurar que la conexión a PostgreSQL en producción use SSL (`sslmode=require` u opción equivalente). *(medio día)*
- [ ] Definir una política de backups y prueba de restauración periódica para la base de datos. *(medio día)*
- [ ] Documentar la rotación de credenciales (passwords, claves de servicio) y reforzar que el archivo `.env` nunca se sube al repositorio. *(medio día, coordinado con Fase 7)*

Blob Storage (Supabase Storage):
- [ ] Pasar el bucket de capturas a modo privado y servir las imágenes únicamente mediante URLs firmadas con expiración generadas en el backend. *(1 día)*
- [ ] Definir políticas de acceso al bucket y de retención/borrado de capturas antiguas (por ejemplo, borrar después de N días o al cerrar el curso). *(medio día)*

Backend (APIs):
- [ ] Añadir autenticación y autorización a los endpoints de supervisión para profesores (`exams-summary`, `by-exam`, `report`), de forma que solo roles autorizados puedan acceder a estos datos. *(2–3 días)*
- [ ] Añadir rate limiting a las APIs de proctoring para evitar abuso o scraping masivo. *(1 día)*
- [ ] Revisar y ajustar los logs para no registrar información personal identificable (PII) en claro más allá de lo estrictamente necesario para depurar. *(medio día)*

Frontend:
- [ ] Alinear la vista de Supervisión/Actividades con el modelo de roles cuando exista autenticación (por ejemplo, solo rol profesor puede ver la pestaña Actividades). *(2 días, depende de auth backend)*

Rendimiento y UX:
- [ ] Añadir índices y/o paginación en endpoints que listan muchas sesiones o violaciones para evitar respuestas lentas. *(1 día)*
- [ ] Mantener o mejorar los mensajes de carga y error, y la accesibilidad de botones y enlaces (por ejemplo, etiquetas claras como “Ver reporte”). *(1 día, coordinado con Fase 4 y 6)*

---

### Fase 6 — Pruebas generales y ajuste fino
**Duración estimada: 2 semanas | Estado: Parcialmente completada**

Objetivo: verificar que todo funciona correctamente junto, medir el rendimiento y corregir errores.

- [x] Verificar que el análisis de plagio detecta correctamente copias exactas.
- [x] Verificar que el análisis de plagio detecta código similar con variables renombradas.
- [x] Verificar que el análisis de plagio da puntajes bajos para código completamente diferente.
- [x] Verificar que la similitud es simétrica (comparar A con B da el mismo resultado que B con A).
- [ ] Medir cuántos fotogramas por segundo procesa el servicio de proctoring (meta: mínimo 15 FPS). *(1 día)*
- [ ] Probar el sistema con iluminación baja para ver si sigue detectando el rostro. *(1 día)*
- [ ] Probar el sistema con distintas cámaras web de diferentes calidades. *(1 día)*
- [ ] Probar el análisis batch con 50 o más estudiantes y verificar que completa sin errores. *(1 día)*
- [ ] Ajustar los umbrales de mirada (yaw y pitch) para reducir falsas alarmas. *(2 días)*
- [ ] Probar que al cerrar el navegador la sesión de supervisión se cierra correctamente. *(medio día)*
- [ ] Probar el sistema con múltiples usuarios supervisados al mismo tiempo (con PostgreSQL). *(1 día)*
- [ ] Verificar que las capturas de violaciones se guardan y se pueden recuperar desde el frontend. *(medio día)*
- [ ] Revisar y corregir posibles fugas de memoria en los modelos de MediaPipe durante sesiones largas. *(1-2 días)*
- [ ] Evaluar y ajustar los umbrales de los indicadores de trampa (cambio de pestaña, miradas laterales, ausencia/presencia de rostro, audio, etc.) para reducir falsos positivos, con ciclos de prueba y feedback humano. *(3–5 días)*
- [ ] Probar y validar el registro de cambios de pestaña/ventana y eventos de dispositivos externos en el informe de supervisión. *(2 días)*

---

### Fase 7 — Documentación final
**Duración estimada: 1–2 semanas | Estado: Parcialmente completada**

Objetivo: dejar todo documentado para que otra persona pueda entender, usar y continuar el proyecto.

- [x] Documentar el problema, restricciones y alcance en el README principal.
- [x] Documentar los módulos de investigación en la carpeta `diseno/` con código de prueba.
- [x] Documentar las variables de entorno en `.env.example`.
- [x] La API genera documentación interactiva automática en `http://localhost:8000/docs`.
- [x] La API de proctoring genera documentación interactiva en `http://localhost:8001/docs`.
- [ ] Completar el README principal con instrucciones de instalación y uso paso a paso. *(1 día)*
- [ ] Agregar el cronograma completo al README principal. *(medio día)*
- [ ] Documentar cómo funciona el almacenamiento de capturas y cómo configurar MinIO. *(1 día)*
- [ ] Documentar cómo funciona el almacenamiento de capturas y cómo configurar Supabase Storage (y opcionalmente MinIO). *(1 día)*
- [ ] Documentar cómo migrar de SQLite a PostgreSQL (incluyendo el uso de Supabase) y cómo hacer backups de la base de datos. *(1 día)*
- [ ] Documentar cómo ajustar los umbrales de detección de mirada y confianza. *(medio día)*
- [ ] Escribir una guía de uso para el profesor: cómo crear una sesión, ver alertas, ver capturas y ver resultados. *(1 día)*
- [ ] Escribir una guía de uso para el desarrollador: cómo correr el proyecto localmente. *(1 día)*
- [ ] Agregar capturas de pantalla del sistema funcionando al README. *(medio día)*
- [ ] Escribir el informe final del proyecto de grado. *(1-2 semanas dependiendo del formato)*
- [ ] Documentar la arquitectura del sistema usando diagramas C4 (contexto, contenedores, componentes) y describir el flujo de datos, puntos críticos (biometría, cifrado) y mecanismos de escalabilidad, tolerancia a fallos y privacidad. *(2–3 días)*

---

### Fase 8 — Entrega y presentación final
**Duración estimada: 1 semana | Estado: No iniciada**

Objetivo: demostrar que el sistema funciona y cumple los objetivos del proyecto de grado.

- [ ] Preparar la demo en vivo del sistema completo (plagio + proctoring + capturas). 
- [ ] Grabar un video corto mostrando el sistema en funcionamiento.
- [ ] Entregar el informe escrito del proyecto de grado.
