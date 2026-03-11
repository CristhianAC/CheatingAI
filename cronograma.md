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
**Duración estimada: 3 semanas | Estado: Completada**

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
- [ ] Integrar la estimación de pose corporal (MediaPipe Pose) al servicio de proctoring. *(1 semana)*
- [ ] Detectar manos fuera del encuadre o por debajo del nivel del escritorio. *(3 días)*
- [ ] Detectar auriculares o audífonos visibles en cámara. *(2 días)*
- [ ] Detectar cierre prolongado de ojos (posible lectura de apuntes en otro soporte). *(3 días)*
- [ ] Agregar umbral de tiempo: generar alerta solo si el comportamiento persiste más de N segundos. *(2 días)*
- [ ] **Guardar capturas de pantalla (fotogramas) en el momento en que se detecta una violación.** *(ver Fase 3b)*
- [ ] Escribir tests unitarios para el detector de rostros. *(1 día)*
- [ ] Escribir tests unitarios para el estimador de mirada. *(1 día)*
- [ ] Escribir tests unitarios para el detector de teléfono. *(1 día)*
- [ ] Escribir tests de integración para el endpoint `analyze-frame`. *(2 días)*

---

### Fase 3b — Almacenamiento de capturas de momentos sospechosos (Blob Storage)
**Duración estimada: 1 semana | Estado: No iniciada**

Objetivo: cuando el sistema detecta una violación, guardar la imagen del fotograma en ese instante
para que el profesor pueda verla después como evidencia.

> Actualmente el sistema guarda el tipo de violación y la hora, pero descarta
> la imagen. Con esta fase, el profesor puede ver exactamente qué había en cámara cuando se disparó la alerta.

- [ ] Elegir el servicio de almacenamiento de archivos: **MinIO** (auto-hosteable, gratuito) como primera opción. *(medio día)*
- [ ] Agregar el contenedor de MinIO al `docker-compose.yml` con su volumen de datos. *(medio día)*
- [ ] Configurar las credenciales de MinIO en el `.env` y en la configuración del servicio de proctoring. *(medio día)*
- [ ] Crear el bucket (carpeta) en MinIO donde se guardarán las capturas. *(medio día)*
- [ ] Instalar el cliente de MinIO/S3 en el servicio de proctoring (`boto3` o `miniopy-async`). *(medio día)*
- [ ] Implementar la función `save_frame_to_storage(frame_bytes) → url` en el backend. *(1 día)*
- [ ] Modificar el endpoint `analyze-frame`: cuando hay violación, guardar el fotograma y almacenar la URL en la base de datos junto al evento. *(1 día)*
- [ ] Agregar el campo `snapshot_url` al modelo de violación en la base de datos. *(medio día)*
- [ ] Crear un endpoint para obtener las capturas de una sesión (`GET /api/v1/sessions/{id}/snapshots`). *(1 día)*
- [ ] Mostrar las capturas en el frontend: en el log de violaciones, agregar un link o miniatura que abra la imagen. *(1 día)*
- [ ] Verificar que las imágenes se guardan y se pueden recuperar correctamente. *(medio día)*

---

### Fase 3c — Migración a PostgreSQL
**Duración estimada: 4 días | Estado: No iniciada**

Objetivo: reemplazar SQLite por PostgreSQL para que el sistema soporte múltiples usuarios
al mismo tiempo sin conflictos de escritura en la base de datos.

> SQLite solo permite una escritura a la vez. Cuando varios estudiantes
> están siendo supervisados simultáneamente, SQLite puede generar errores de bloqueo.
> PostgreSQL no tiene esa limitación y es el motor estándar para producción.

- [ ] Agregar el contenedor de PostgreSQL al `docker-compose.yml` (dos instancias: una para plagio, otra para proctoring). *(1 día)*
- [ ] Configurar las credenciales de PostgreSQL (usuario, contraseña, nombre de la base de datos) en el `.env`. *(medio día)*
- [ ] Cambiar la variable `DATABASE_URL` en ambos servicios para que apunten a PostgreSQL en lugar de SQLite. *(medio día)*
- [ ] Instalar el driver de PostgreSQL para Python (`psycopg2-binary`) en los Dockerfiles correspondientes. *(medio día)*
- [ ] Verificar que las tablas se crean correctamente en PostgreSQL al arrancar (SQLAlchemy lo hace automático). *(medio día)*
- [ ] Agregar Alembic para manejo de migraciones de base de datos (cuando se cambia la estructura de las tablas). *(1 día)*
- [ ] Probar que el sistema de plagio funciona correctamente con PostgreSQL (inserts, queries, batch). *(medio día)*
- [ ] Probar que el sistema de proctoring funciona correctamente con PostgreSQL (sesiones, violaciones). *(medio día)*

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
- [ ] Mostrar las capturas de pantalla de violaciones en el log de alertas (thumbnail + link). *(1 día — depende de Fase 3b)*
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
- [ ] Agregar MinIO al Docker Compose para el almacenamiento de capturas (Fase 3b). *(medio día)*
- [ ] Agregar PostgreSQL al Docker Compose (Fase 3c). *(1 día)*
- [ ] Configurar Nginx como servidor web: sirve el frontend y redirige las peticiones a las APIs. *(1 día)*
- [ ] Escribir instrucciones de despliegue en un servidor real (VPS o nube). *(1 día)*
- [ ] Agregar HTTPS con certificado SSL para producción. *(1 día)*

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

---

### Fase 7 — Documentación final
**Duración estimada: 1 semana | Estado: Parcialmente completada**

Objetivo: dejar todo documentado para que otra persona pueda entender, usar y continuar el proyecto.

- [x] Documentar el problema, restricciones y alcance en el README principal.
- [x] Documentar los módulos de investigación en la carpeta `diseno/` con código de prueba.
- [x] Documentar las variables de entorno en `.env.example`.
- [x] La API genera documentación interactiva automática en `http://localhost:8000/docs`.
- [x] La API de proctoring genera documentación interactiva en `http://localhost:8001/docs`.
- [ ] Completar el README principal con instrucciones de instalación y uso paso a paso. *(1 día)*
- [ ] Agregar el cronograma completo al README principal. *(medio día)*
- [ ] Documentar cómo funciona el almacenamiento de capturas y cómo configurar MinIO. *(1 día)*
- [ ] Documentar cómo migrar de SQLite a PostgreSQL y cómo hacer backups de la base de datos. *(1 día)*
- [ ] Documentar cómo ajustar los umbrales de detección de mirada y confianza. *(medio día)*
- [ ] Escribir una guía de uso para el profesor: cómo crear una sesión, ver alertas, ver capturas y ver resultados. *(1 día)*
- [ ] Escribir una guía de uso para el desarrollador: cómo correr el proyecto localmente. *(1 día)*
- [ ] Agregar capturas de pantalla del sistema funcionando al README. *(medio día)*
- [ ] Escribir el informe final del proyecto de grado. *(1-2 semanas dependiendo del formato)*

---

### Fase 8 — Entrega y presentación final
**Duración estimada: 1 semana | Estado: No iniciada**

Objetivo: demostrar que el sistema funciona y cumple los objetivos del proyecto de grado.

- [ ] Preparar la demo en vivo del sistema completo (plagio + proctoring + capturas). 
- [ ] Grabar un video corto mostrando el sistema en funcionamiento.
- [ ] Entregar el informe escrito del proyecto de grado.
