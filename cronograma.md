---

## Cronograma del Proyecto

Este cronograma muestra todo lo que se planificó hacer, lo que ya está hecho y lo que falta.
Cada tarea tiene una casilla: **[x]** significa completado, **[ ]** significa pendiente.

---

### Fase 1 — Investigación y definición del proyecto
> Objetivo: entender el problema, elegir las tecnologías y dejar por escrito qué se va a construir.

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
> Objetivo: construir el servicio que recibe códigos de estudiantes y detecta si son demasiado similares.

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
- [x] Implementar la tarea Celery de análisis batch (compara todos los pares posibles, O(n²)).
- [x] Implementar guardado de resultados en lotes para no saturar la base de datos.
- [x] Implementar actualización de progreso del job durante la ejecución.
- [x] Configurar Flower para monitorear las tareas Celery desde el navegador.
- [x] Escribir tests unitarios para el algoritmo Winnowing.
- [x] Escribir tests unitarios para el comparador de submissions.
- [ ] Escribir tests de integración para los endpoints de la API.
- [ ] Agregar soporte para más lenguajes de programación (Go, Rust, PHP, etc.).

---

### Fase 3 — Servicio de supervisión en tiempo real (Proctoring)
> Objetivo: construir el servicio que analiza los fotogramas de la cámara del estudiante y detecta comportamientos sospechosos.

- [x] Crear la estructura base del microservicio con FastAPI (carpeta `proctoring_service/`).
- [x] Implementar el detector de rostros con MediaPipe Face Detection.
- [x] Implementar la lógica para detectar "no hay nadie en cámara" y generar alerta.
- [x] Implementar la lógica para detectar "hay más de una persona en cámara" y generar alerta.
- [x] Implementar el estimador de mirada con MediaPipe Face Mesh (476 puntos faciales).
- [x] Implementar detección de mirada horizontal (el estudiante mira hacia la izquierda o derecha).
- [x] Implementar detección de mirada vertical (el estudiante mira hacia abajo).
- [x] Implementar el detector de teléfono móvil con EfficientDet-Lite0 (modelo de 4 MB).
- [x] Crear el orquestador principal `VisionDetector` que combina todos los detectores en uno solo.
- [x] Crear el endpoint para analizar un fotograma (`POST /api/v1/proctoring/analyze-frame`).
- [x] Crear el endpoint de calibración para ajustar los umbrales de mirada (`POST /api/v1/proctoring/calibrate`).
- [x] Crear el modelo de base de datos para sesiones de supervisión.
- [x] Crear el endpoint para iniciar una sesión de supervisión (`POST /api/v1/sessions`).
- [x] Crear el endpoint para terminar una sesión (`PUT /api/v1/sessions/{id}/end`).
- [x] Crear el endpoint para ver el resumen de violaciones de una sesión (`GET /api/v1/sessions/{id}`).
- [x] Implementar el guardado automático de violaciones en base de datos durante el análisis.
- [x] Configurar los parámetros ajustables (umbrales de mirada, confianza mínima) por variable de entorno.
- [ ] Integrar la estimación de pose corporal (MediaPipe Pose) al servicio real de proctoring.
- [ ] Implementar detección de manos fuera del encuadre (posible lectura de apuntes debajo del escritorio).
- [ ] Implementar detección de auriculares y audífonos como objeto sospechoso.
- [ ] Implementar detección de cierre prolongado de ojos.
- [ ] Agregar umbral de tiempo: solo generar alerta si el comportamiento persiste más de N segundos.
- [ ] Escribir tests unitarios para el detector de rostros.
- [ ] Escribir tests unitarios para el estimador de mirada.
- [ ] Escribir tests unitarios para el detector de teléfono.
- [ ] Escribir tests de integración para el endpoint `analyze-frame`.

---

### Fase 4 — Frontend: interfaz web
> Objetivo: construir la pantalla que usan los profesores y estudiantes para interactuar con el sistema.

- [x] Crear el proyecto con SvelteKit (carpeta `client/`).
- [x] Crear el layout general con navegación: Submissions, Analysis, Jobs, Supervisión.
- [x] Crear la página de Submissions: ver, subir, editar y eliminar códigos de estudiantes.
- [x] Crear la página de Analysis: comparar dos submissions o lanzar un análisis de todo un grupo.
- [x] Crear la página de Jobs: ver el historial de análisis con actualización automática cada 3 segundos.
- [x] Crear la tabla de resultados para ver los pares de código con sus puntajes de similitud.
- [x] Crear la página de Supervisión con acceso a la cámara web del navegador.
- [x] Conectar la cámara al endpoint `analyze-frame` del servicio de proctoring.
- [x] Mostrar las alertas de violación en tiempo real en la pantalla de supervisión.
- [x] Implementar sistema de notificaciones (Toast) para errores y confirmaciones.
- [ ] Mostrar los marcadores visuales de MediaPipe sobre la imagen de la cámara en tiempo real (puntos de rostro, mirada, etc.).
- [ ] Agregar pantalla de inicio de sesión de supervisión: ingresar ID del estudiante e ID del examen.
- [ ] Mostrar un resumen al final de la sesión: total de alertas por tipo.
- [ ] Agregar filtros en la tabla de resultados: ordenar por puntaje, filtrar solo los marcados como plagio.
- [ ] Agregar paginación en la lista de submissions y resultados.
- [ ] Hacer la interfaz responsiva para pantallas pequeñas.
- [ ] Agregar modo oscuro.

---

### Fase 5 — Infraestructura y despliegue
> Objetivo: empaquetar todo para que cualquiera pueda levantar el proyecto con un solo comando.

- [x] Escribir el `Dockerfile` para la API de plagio (`docker/Dockerfile.api`).
- [x] Escribir el `Dockerfile` para el worker de Celery (`docker/Dockerfile.worker`).
- [x] Escribir el `Dockerfile` para el servicio de proctoring (`docker/Dockerfile.proctoring`).
- [x] Escribir el `docker-compose.yml` con todos los servicios: Redis, API, worker, Flower, proctoring.
- [x] Configurar volúmenes de Docker para que los datos persistan entre reinicios.
- [x] Configurar healthchecks para que los servicios esperen a que Redis esté listo antes de arrancar.
- [x] Crear el archivo `.env.example` con todas las variables de entorno documentadas.
- [x] Crear el script `docker_up.sh` para levantar todos los servicios con un comando.
- [x] Crear el script `docker_down.sh` para apagar los servicios (con opción de borrar datos).
- [x] Crear el script `docker_logs.sh` para ver los logs de cualquier servicio.
- [x] Crear el script `dev_worker.sh` para correr el worker Celery en modo desarrollo sin Docker.
- [ ] Agregar Dockerfile para el frontend (client/) dentro del Docker Compose.
- [ ] Configurar un servidor web (Nginx) que sirva el frontend y redirija las peticiones a las APIs.
- [ ] Escribir instrucciones de despliegue en un servidor real (VPS, nube, etc.).
- [ ] Configurar variables de entorno para producción (base de datos PostgreSQL en lugar de SQLite).
- [ ] Agregar HTTPS con certificado SSL para producción.

---

### Fase 6 — Pruebas generales y ajuste fino
> Objetivo: verificar que todo funciona bien junto, medir el rendimiento y corregir errores.

- [x] Verificar que el análisis de plagio detecta correctamente copias exactas.
- [x] Verificar que el análisis de plagio detecta código similar con variables renombradas.
- [x] Verificar que el análisis de plagio da puntajes bajos para código completamente diferente.
- [x] Verificar que la similitud es simétrica (comparar A con B da el mismo resultado que B con A).
- [ ] Medir cuántos fotogramas por segundo procesa el servicio de proctoring (meta: mínimo 15 FPS).
- [ ] Probar el sistema con iluminación baja para ver si sigue detectando el rostro correctamente.
- [ ] Probar el sistema con distintas cámaras web (calidades diferentes).
- [ ] Probar el análisis batch con 50 o más estudiantes y verificar que completa sin errores.
- [ ] Ajustar los umbrales de mirada (yaw y pitch) para reducir falsas alarmas.
- [ ] Probar que al cerrar el navegador la sesión de supervisión se cierra correctamente.
- [ ] Hacer pruebas con múltiples usuarios a la vez para verificar que el sistema no se cae.
- [ ] Revisar y corregir cualquier memory leak en los modelos de MediaPipe durante sesiones largas.

---

### Fase 7 — Documentación final
> Objetivo: dejar todo documentado para que otra persona pueda entender y usar el proyecto.

- [x] Documentar el problema, restricciones y alcance en el README principal.
- [x] Documentar los módulos de investigación en la carpeta `diseno/` con código de prueba.
- [x] Documentar las variables de entorno en `.env.example`.
- [x] La API genera documentación interactiva automática en `http://localhost:8000/docs`.
- [x] La API de proctoring genera documentación interactiva en `http://localhost:8001/docs`.
- [ ] Completar el README principal con instrucciones de instalación y uso paso a paso.
- [ ] Agregar el cronograma completo al README principal (este documento).
- [ ] Documentar cómo agregar soporte para un nuevo lenguaje de programación al tokenizador.
- [ ] Documentar cómo ajustar los umbrales de detección de mirada y confianza.
- [ ] Escribir una guía de uso para el profesor: cómo crear una sesión, ver alertas y ver resultados.
- [ ] Escribir una guía de uso para el desarrollador: cómo correr el proyecto localmente.
- [ ] Agregar capturas de pantalla del sistema funcionando al README.
- [ ] Escribir el informe final del proyecto de grado.

---

### Fase 8 — Entrega y presentación final
> Objetivo: demostrar que el sistema funciona y cumple los objetivos del proyecto de grado.


---