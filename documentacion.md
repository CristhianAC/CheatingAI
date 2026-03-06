# Documentación Técnica — CheatingAI

**Integrantes:** Cristhian Agamez Cervantes y Mateo Guerrero Escobar
**Materia:** Proyecto Final de Grado
**Institución:** Universidad del Norte
**Repositorio:** https://github.com/CristhianAC/CheatingAI
**Inicio del proyecto:** Febrero 2025

---

## Índice

1. [Descripción del sistema](#1-descripción-del-sistema)
2. [Problema que resuelve](#2-problema-que-resuelve)
3. [Alcance del sistema](#3-alcance-del-sistema)
4. [Estructura del repositorio](#4-estructura-del-repositorio)
5. [Arquitectura general](#5-arquitectura-general)
6. [Módulo 1: Detección de plagio en código](#6-módulo-1-detección-de-plagio-en-código)
7. [Módulo 2: Supervisión por cámara](#7-módulo-2-supervisión-por-cámara)
8. [Interfaz web](#8-interfaz-web)
9. [Tecnologías y justificación](#9-tecnologías-y-justificación)
10. [Instrucciones para correr el proyecto](#10-instrucciones-para-correr-el-proyecto)
11. [Referencia de la API con ejemplos](#11-referencia-de-la-api-con-ejemplos)
12. [Decisiones de diseño](#12-decisiones-de-diseño)
13. [Estado actual del proyecto](#13-estado-actual-del-proyecto)
14. [Glosario](#14-glosario)

---

## 1. Descripción del sistema

CheatingAI es un sistema de software que detecta dos tipos de irregularidades
en evaluaciones virtuales:

**Tipo 1 — Similitud entre códigos entregados:**
El sistema recibe los códigos fuente de múltiples estudiantes para un mismo
ejercicio y los compara entre sí. Para cada par de estudiantes, calcula un
puntaje de similitud entre 0.0 (completamente distintos) y 1.0 (idénticos).
Los pares que superan un umbral configurable quedan marcados para revisión.

**Tipo 2 — Comportamientos detectables por cámara durante el examen:**
El sistema recibe fotogramas de la cámara web del estudiante mientras realiza
el examen. Analiza cada fotograma con modelos de visión por computador y
genera alertas cuando detecta condiciones anómalas: ausencia del estudiante,
presencia de más de una persona, mirada fuera de pantalla o teléfono visible.

El sistema sigue el patrón de diseño **API First**: toda la lógica está
expuesta como servicios HTTP independientes. La interfaz web es una capa
adicional que consume esos servicios, pero no es requisito para operar el sistema.

---

## 2. Problema que resuelve

En evaluaciones virtuales, los docentes no disponen de herramientas que analicen
el comportamiento físico del estudiante frente a la cámara, ni que comparen
automáticamente la estructura interna de los códigos entregados.

Las herramientas existentes se limitan a:
- Bloquear pestañas del navegador.
- Grabar la pantalla del estudiante.
- Comparar texto literal entre archivos.

Ninguna de estas opciones detecta:
- Dos códigos estructuralmente iguales con variables renombradas.
- Un estudiante que mira repetidamente fuera de la pantalla.
- Un teléfono visible en el encuadre de la cámara.

CheatingAI cubre estas tres ausencias.

---

## 3. Alcance del sistema

### Dentro del alcance (versión actual):

- Comparación de código fuente en Python y Java.
- Detección de copias exactas por SHA256 (instantáneo).
- Detección de similitud estructural con el algoritmo Winnowing.
- Análisis de un par de estudiantes de forma síncrona (resultado inmediato).
- Análisis de todos los estudiantes de un examen de forma asíncrona (en segundo plano).
- Detección de ausencia de persona frente a la cámara.
- Detección de más de una persona frente a la cámara.
- Detección de mirada horizontal fuera de pantalla (izquierda o derecha).
- Detección de inclinación vertical de la cabeza hacia abajo.
- Detección de teléfono móvil visible en el fotograma.
- Registro de todos los eventos de violación con hora exacta.
- Resumen de violaciones por tipo al terminar una sesión.

### Fuera del alcance (esta versión):

- Identificación de la identidad del estudiante (reconocimiento facial de persona).
- Análisis de audio.
- Integración con plataformas LMS como Moodle o Canvas.
- Análisis del contenido visible en la pantalla del estudiante.
- Almacenamiento de imágenes o video de los estudiantes.

---

## 4. Estructura del repositorio

```
CheatingAI/
│
├── app/                             API de plagio (Python)
│   ├── main.py                      Punto de entrada, configuración de FastAPI
│   ├── config.py                    Variables de entorno y parámetros del algoritmo
│   ├── database.py                  Conexión a SQLite con SQLAlchemy
│   ├── dependencies.py              Inyección de dependencias (sesión de DB)
│   ├── models/                      Tablas de la base de datos
│   │   ├── submission.py            Modelo de código entregado
│   │   ├── analysis_job.py          Modelo de tarea de análisis
│   │   └── comparison_result.py     Modelo de resultado de comparación
│   ├── schemas/                     Formatos de entrada y salida de la API
│   ├── routers/                     Endpoints HTTP
│   │   ├── submissions.py           CRUD de submissions
│   │   ├── analysis.py              Comparación pairwise y batch
│   │   └── jobs.py                  Estado y resultados de tareas
│   ├── services/
│   │   ├── analysis_service.py      Lógica de comparación y creación de jobs
│   │   └── plagiarism/              Algoritmo de detección
│   │       ├── tokenizer.py         Tokenización con Pygments
│   │       ├── normalizer.py        Normalización de variables y literales
│   │       ├── winnowing.py         Algoritmo Winnowing (k-grams + hashes)
│   │       └── comparator.py        Pipeline completo + similitud Jaccard
│   └── tasks/
│       ├── celery_app.py            Configuración de Celery + Redis
│       └── plagiarism_tasks.py      Tarea asíncrona de análisis batch
│
├── proctoring_service/              API de supervisión por cámara (Python)
│   └── app/
│       ├── main.py                  Punto de entrada, carga modelos de IA al inicio
│       ├── config.py                Umbrales de mirada y confianza mínima
│       ├── models/
│       │   ├── session.py           Modelo de sesión de supervisión
│       │   └── violation.py         Modelo de evento de violación
│       ├── routers/
│       │   ├── proctoring.py        Endpoint analyze-frame y calibrate
│       │   └── sessions.py          CRUD de sesiones
│       └── services/
│           ├── session_service.py   Lógica de sesiones y resumen
│           ├── violation_service.py Registro de eventos en base de datos
│           └── vision/
│               ├── detector.py      Orquestador: coordina los 3 detectores
│               ├── face_detector.py MediaPipe BlazeFace (conteo de personas)
│               ├── gaze_estimator.py MediaPipe Face Mesh (dirección de mirada)
│               └── phone_detector.py EfficientDet-Lite0 (detección de teléfono)
│
├── client/                          Interfaz web (SvelteKit / JavaScript)
│   └── src/
│       ├── routes/
│       │   ├── submissions/         Pantalla de gestión de códigos
│       │   ├── analysis/            Pantalla de comparación
│       │   ├── jobs/                Pantalla de seguimiento de tareas
│       │   └── proctoring/          Pantalla de supervisión con cámara
│       └── lib/
│           ├── api.js               Funciones para llamar a las APIs
│           ├── stores.js            Estado compartido entre componentes
│           └── components/          Componentes reutilizables de UI
│
├── diseno/                          Documentación de investigación
│   ├── deteccion_rostro/            Investigación + prototipo de detección de rostro
│   ├── seguimiento_mirada/          Investigación + prototipo de mirada
│   ├── estimacion_pose/             Investigación + prototipo de pose corporal
│   └── deteccion_objetos/           Investigación + prototipo de detección de objetos
│
├── docker/                          Dockerfiles por servicio
│   ├── Dockerfile.api
│   ├── Dockerfile.worker
│   └── Dockerfile.proctoring
│
├── docker-compose.yml               Orquestación de todos los servicios
├── scripts/                         Scripts de conveniencia
│   ├── docker_up.sh                 Levantar todos los servicios
│   ├── docker_down.sh               Apagar todos los servicios
│   └── docker_logs.sh               Ver logs de un servicio
├── tests/                           Pruebas automáticas
│   └── unit/
│       ├── test_winnowing.py
│       ├── test_comparator.py
│       └── test_normalizer.py
├── .env.example                     Variables de entorno documentadas
├── requirements.txt                 Dependencias Python del módulo de plagio
└── cronograma.md                    Cronograma completo del proyecto
```

---

## 5. Arquitectura general

El sistema está compuesto por cinco procesos que corren de forma independiente:

```
┌─────────────────────────────────────────────────────────┐
│                   Navegador del usuario                  │
│              http://localhost:5173  (SvelteKit)          │
└──────────────┬──────────────────────────┬───────────────┘
               │ /api/v1/submissions       │ /api/v1/proctoring
               │ /api/v1/analysis          │ /api/v1/sessions
               │ /api/v1/jobs              │
               ▼                           ▼
┌──────────────────────┐     ┌─────────────────────────────┐
│   API de Plagio       │     │   API de Proctoring          │
│   FastAPI             │     │   FastAPI                    │
│   Puerto 8000         │     │   Puerto 8001                │
│   SQLite: cheating_ai │     │   SQLite: proctoring.db      │
└──────────┬───────────┘     └─────────────────────────────┘
           │ encola tarea
           ▼
┌──────────────────────┐     ┌─────────────────────────────┐
│       Redis           │────▶│   Worker Celery              │
│   Puerto 6379         │     │   Procesa análisis batch     │
└──────────────────────┘     └─────────────────────────────┘
           │
           ▼
┌──────────────────────┐
│   Flower              │
│   Monitor de tareas  │
│   Puerto 5555         │
└──────────────────────┘
```

**Flujo de datos — detección de plagio:**

1. El usuario envía códigos a la API de plagio.
2. Si solicita comparación directa (pairwise), la API responde en el momento.
3. Si solicita análisis de todos los estudiantes (batch), la API crea un job y lo
   pone en cola en Redis.
4. El worker de Celery toma el job, compara todos los pares posibles y guarda
   los resultados en la base de datos.
5. El usuario consulta el estado del job periódicamente hasta que termina.

**Flujo de datos — supervisión por cámara:**

1. El usuario abre la pantalla de supervisión en el navegador.
2. El navegador activa la cámara web.
3. Cada aproximadamente un segundo, el frontend captura un fotograma de la cámara,
   lo convierte a Base64 y lo envía a la API de proctoring.
4. La API analiza el fotograma con los tres detectores de IA.
5. Si hay violaciones, las guarda en la base de datos y las devuelve en la respuesta.
6. El frontend muestra la alerta en pantalla.

---

## 6. Módulo 1: Detección de plagio en código

### 6.1 Visión general del pipeline

Cada vez que se comparan dos códigos, el sistema ejecuta estos pasos en orden:

```
Código fuente A          Código fuente B
      │                        │
      ▼                        ▼
  Tokenización            Tokenización
      │                        │
      ▼                        ▼
  Normalización           Normalización
      │                        │
      ▼                        ▼
  K-grams (K=5)           K-grams (K=5)
      │                        │
      ▼                        ▼
  Hash por k-gram          Hash por k-gram
      │                        │
      ▼                        ▼
  Winnowing (W=4)         Winnowing (W=4)
      │                        │
      └──────────┬─────────────┘
                 ▼
          Similitud Jaccard
                 │
                 ▼
        Puntaje [0.0 – 1.0]
```

Si los dos códigos tienen el mismo hash SHA256, el sistema retorna
`similarity_score = 1.0` e `is_exact_copy = true` sin ejecutar el pipeline.

---

### 6.2 Paso 1: Tokenización

**Archivo:** `app/services/plagiarism/tokenizer.py`

El código fuente se divide en unidades mínimas de significado llamadas tokens.
La herramienta usada es **Pygments**, que conoce la sintaxis de los lenguajes
soportados (Python, Java) y sabe separar el código en sus partes.

Los tokens que se conservan son:
- Palabras clave del lenguaje (`def`, `return`, `if`, `for`, `public`, `void`, etc.)
- Nombres de variables y funciones
- Operadores (`+`, `==`, `!=`, `>`, etc.)
- Puntuación (paréntesis, corchetes, comas, dos puntos)
- Literales de texto y números

Los tokens que se descartan son:
- Comentarios
- Espacios en blanco
- Saltos de línea

**Ejemplo:**

Código fuente:
```python
# Calcula el factorial
def factorial(n):
    if n == 0:
        return 1
    return n * factorial(n - 1)
```

Tokens resultantes:
```
["def", "factorial", "(", "n", ")", ":", "if", "n", "==", "0", ":",
 "return", "1", "return", "n", "*", "factorial", "(", "n", "-", "1", ")"]
```

El comentario fue descartado. Los espacios fueron descartados.

---

### 6.3 Paso 2: Normalización

**Archivo:** `app/services/plagiarism/normalizer.py`

La normalización transforma los tokens para eliminar diferencias superficiales
que no cambian la estructura del código. El objetivo es que dos códigos con
variables renombradas produzcan la misma secuencia de tokens normalizados.

Reglas de normalización:

| Tipo de token | Transformación | Ejemplo |
|---|---|---|
| Palabra clave del lenguaje | Se conserva en minúsculas | `def` → `def` |
| Nombre de variable o función | Se reemplaza por `VAR_0`, `VAR_1`, etc. | `factorial` → `VAR_0` |
| Literal de texto (string) | Se reemplaza por `STR_LIT` | `"hola"` → `STR_LIT` |
| Literal numérico | Se reemplaza por `NUM_LIT` | `42` → `NUM_LIT` |
| Operador | Se conserva sin cambios | `+` → `+` |
| Puntuación | Se conserva sin cambios | `(` → `(` |

Cada variable distinta recibe un número secuencial independiente por submission.
La misma variable siempre recibe el mismo número dentro de una submission.

**Ejemplo con dos códigos distintos:**

Código del estudiante A:
```python
def factorial(n):
    if n == 0:
        return 1
    return n * factorial(n - 1)
```

Código del estudiante B (variables renombradas):
```python
def calcular(numero):
    if numero == 0:
        return 1
    return numero * calcular(numero - 1)
```

Tokens normalizados del estudiante A:
```
["def", "VAR_0", "(", "VAR_1", ")", ":", "if", "VAR_1", "==", "NUM_LIT", ":",
 "return", "NUM_LIT", "return", "VAR_1", "*", "VAR_0", "(", "VAR_1", "-", "NUM_LIT", ")"]
```

Tokens normalizados del estudiante B:
```
["def", "VAR_0", "(", "VAR_1", ")", ":", "if", "VAR_1", "==", "NUM_LIT", ":",
 "return", "NUM_LIT", "return", "VAR_1", "*", "VAR_0", "(", "VAR_1", "-", "NUM_LIT", ")"]
```

Las dos secuencias son idénticas. El sistema los considerará como código
estructuralmente equivalente, aunque los nombres originales eran distintos.

---

### 6.4 Paso 3: K-grams

**Archivo:** `app/services/plagiarism/winnowing.py` — función `build_kgrams`

Un k-gram es una subsecuencia de exactamente K tokens consecutivos.
Se generan desplazando una ventana de tamaño K de uno en uno sobre
la secuencia de tokens normalizados.

El valor de K usado es **5** (configurable con `WINNOWING_K`).

**Ejemplo** con la secuencia `["def", "VAR_0", "(", "VAR_1", ")", ":"]` y K=3:

```
k-gram 1: ("def",   "VAR_0", "(")
k-gram 2: ("VAR_0", "(",     "VAR_1")
k-gram 3: ("(",     "VAR_1", ")")
k-gram 4: ("VAR_1", ")",     ":")
```

Si el código tiene menos tokens que K, se genera un solo k-gram con todos
los tokens disponibles.

---

### 6.5 Paso 4: Hash de k-grams

**Archivo:** `app/services/plagiarism/winnowing.py` — función `hash_kgram`

Cada k-gram se convierte en un número entero usando SHA256 truncado a 32 bits.

El proceso es:
1. Los tokens del k-gram se unen con espacios: `"def VAR_0 ("`.
2. Se codifica en UTF-8.
3. Se aplica SHA256.
4. Se toman los primeros 4 bytes del resultado.
5. Se interpretan como un entero de 32 bits (big-endian).

El resultado es un número determinista: el mismo k-gram siempre produce
el mismo número, en cualquier ejecución.

---

### 6.6 Paso 5: Algoritmo Winnowing

**Archivo:** `app/services/plagiarism/winnowing.py` — función `winnowing`

Winnowing selecciona un subconjunto de los hashes generados en el paso anterior.
Esos hashes seleccionados son las "huellas digitales" del código.

El algoritmo usa una ventana deslizante de tamaño W sobre la lista de hashes.
En cada posición de la ventana, selecciona el hash mínimo como representante.
Si hay hashes empatados, toma el que está más a la derecha. Los hashes
seleccionados se acumulan en un conjunto (sin duplicados).

El valor de W usado es **4** (configurable con `WINNOWING_W`).

**Garantía matemática:** el algoritmo garantiza detectar cualquier subsecuencia
común de longitud mayor o igual a `K + W - 1` tokens (con K=5 y W=4, eso es
8 tokens o más).

**Ejemplo** con hashes `[10, 5, 8, 3, 7, 2, 9]` y W=3:

```
Ventana [10, 5,  8] → mínimo = 5  → seleccionado: 5
Ventana [ 5, 8,  3] → mínimo = 3  → seleccionado: 3
Ventana [ 8, 3,  7] → mínimo = 3  → ya está en el conjunto
Ventana [ 3, 7,  2] → mínimo = 2  → seleccionado: 2
Ventana [ 7, 2,  9] → mínimo = 2  → ya está en el conjunto

Conjunto final de huellas: {5, 3, 2}
```

---

### 6.7 Paso 6: Similitud Jaccard

**Archivo:** `app/services/plagiarism/comparator.py` — función `compare_submissions`

Dados los conjuntos de huellas del código A y del código B, el puntaje de
similitud se calcula con la fórmula de Jaccard:

```
Similitud(A, B) = |A ∩ B| / |A ∪ B|
```

Donde:
- `A ∩ B` = huellas que están en A y también en B (intersección).
- `A ∪ B` = todas las huellas distintas entre A y B (unión).

El resultado es un número entre 0.0 y 1.0, redondeado a 4 decimales.

**Ejemplo:**

- Huellas de A: `{5, 3, 2, 9, 11}`
- Huellas de B: `{3, 2, 9, 14, 7}`
- Intersección: `{3, 2, 9}` → tamaño = 3
- Unión: `{5, 3, 2, 9, 11, 14, 7}` → tamaño = 7
- Similitud = 3 / 7 = **0.4286** (42.86%)

Si el resultado supera el umbral (`DEFAULT_THRESHOLD = 0.7`), el par queda
marcado como `is_flagged = true`.

---

### 6.8 Análisis batch (todos contra todos)

**Archivo:** `app/tasks/plagiarism_tasks.py`

Cuando hay N estudiantes en un examen, el número total de pares posibles es:

```
Total de comparaciones = N × (N - 1) / 2
```

Con 30 estudiantes: 30 × 29 / 2 = **435 comparaciones**.
Con 50 estudiantes: 50 × 49 / 2 = **1225 comparaciones**.

Este volumen no puede procesarse de forma síncrona sin bloquear el servidor.
La solución es usar **Celery**: el análisis se encola y un proceso separado
(el worker) lo ejecuta en segundo plano. El servidor responde al instante con
el ID del job. El usuario puede consultar el progreso en cualquier momento.

Los resultados se guardan en la base de datos en lotes de 50 comparaciones
(constante `BATCH_SAVE_EVERY = 50`) para reducir el número de operaciones de
escritura en disco.

---

## 7. Módulo 2: Supervisión por cámara

### 7.1 Visión general

**Archivos:** `proctoring_service/app/services/vision/`

El servicio de proctoring recibe un fotograma (imagen JPEG en Base64) y lo pasa
por tres detectores en secuencia. Cada detector devuelve su resultado de forma
independiente. El orquestador (`VisionDetector`) consolida los resultados y
produce la lista final de violaciones.

Los tres detectores son instanciados una sola vez cuando el servidor arranca
(no en cada petición). Cargar los modelos de IA desde disco tarda varios
segundos; hacerlo en cada petición haría el sistema inutilizable.

```
Fotograma (bytes JPEG)
        │
        ▼
  Decodificar imagen (OpenCV)
        │
        ▼
  Convertir BGR → RGB
        │
    ┌───┴─────────────────────────────────┐
    │                                     │
    ▼                                     ▼
FaceDetector                       PhoneDetector
(MediaPipe BlazeFace)               (EfficientDet-Lite0)
    │                                     │
    ▼                                     ▼
¿Cuántas personas?             ¿Hay teléfono visible?
    │
    ├── 0 personas → violación NO_PERSON
    ├── >1 persona → violación MULTIPLE_PERSONS
    └── 1 persona → continuar con GazeEstimator
                        │
                        ▼
                 GazeEstimator
                 (MediaPipe Face Mesh)
                        │
                        ▼
              ¿Mira fuera de pantalla?
                        │
                 ├── YAW > umbral → violación LOOKING_AWAY
                 └── PITCH < umbral → violación LOOKING_AWAY
        │
        ▼
  Consolidar violaciones
        │
        ▼
  Guardar en base de datos (si hay sesión activa)
        │
        ▼
  Retornar respuesta JSON
```

---

### 7.2 Detector de rostros: FaceDetector

**Archivo:** `proctoring_service/app/services/vision/face_detector.py`

Usa **MediaPipe Face Detection** con el modelo BlazeFace (rango corto, menor a 2 metros).
Este modelo fue entrenado por Google para detectar rostros humanos en tiempo real
desde cámaras web. Retorna una lista de todos los rostros encontrados en el fotograma.

Configuración:
- `model_selection = 0` (modelo optimizado para cámara web, < 2 metros de distancia)
- `min_detection_confidence = 0.5` (solo cuenta detecciones con al menos 50% de confianza)

Lógica de violaciones:
- 0 rostros detectados → `violation_type: NO_PERSON`, confianza: `0.95`
- 1 rostro detectado → normal, sin violación
- 2 o más rostros → `violation_type: MULTIPLE_PERSONS`, confianza: `0.70 + 0.10 * (N - 2)` hasta máximo `0.99`

---

### 7.3 Estimador de mirada: GazeEstimator

**Archivo:** `proctoring_service/app/services/vision/gaze_estimator.py`

Usa **MediaPipe Face Mesh**, que coloca 468 puntos de referencia sobre el rostro
detectado. De esos 468 puntos, el estimador usa 5:

| Índice | Parte del rostro |
|---|---|
| 1 | Punta de la nariz |
| 10 | Centro de la frente |
| 152 | Mentón |
| 234 | Borde izquierdo de la cara |
| 454 | Borde derecho de la cara |

Con estos 5 puntos se calculan dos valores:

**YAW (rotación horizontal):**

Mide qué tan desplazada está la nariz del centro horizontal de la cara,
normalizado por el ancho de la cara.

```
YAW = (posición_x_nariz - centro_x_cara) / ancho_cara
```

- Valor 0.0: el estudiante mira al frente.
- Valor positivo: el estudiante mira hacia la derecha.
- Valor negativo: el estudiante mira hacia la izquierda.
- Umbral de violación: `|YAW| > 0.12` (configurable con `GAZE_YAW_THRESHOLD`).

**PITCH (inclinación vertical):**

Mide la relación entre la posición de la nariz respecto a la frente y el mentón.

```
PITCH basado en posición de nariz respecto a frente y mentón
```

- Valor 0.0: el estudiante mira al frente.
- Valor negativo: el estudiante inclina la cabeza hacia abajo.
- Umbral de violación: `PITCH < -0.07` (configurable con `GAZE_PITCH_THRESHOLD`).

La confianza de la violación de mirada escala proporcionalmente con qué tanto
supera el umbral el valor medido. Rango: entre 0.60 y 0.98.

Si la cara tiene un ancho menor a 0.01 o una altura menor a 0.01 (en coordenadas
normalizadas), el estimador descarta el resultado por ser poco confiable y retorna
`detected = false`.

---

### 7.4 Detector de teléfono: PhoneDetector

**Archivo:** `proctoring_service/app/services/vision/phone_detector.py`

Usa **EfficientDet-Lite0**, un modelo de detección de objetos entrenado en el
dataset COCO (80 categorías de objetos). El modelo fue descargado durante la
construcción de la imagen Docker y se guarda en `/app/models/efficientdet_lite0.tflite`.

Características del modelo:
- Tamaño: aproximadamente 4 megabytes.
- Formato: TensorFlow Lite INT8 (cuantizado para CPU).
- Categorías detectadas: 80 clases del dataset COCO, incluyendo `cell phone`.

Configuración:
- `score_threshold = 0.45` (confianza mínima para registrar una detección)
- `max_results = 10` (máximo de objetos a detectar por fotograma)

El detector recorre todas las detecciones del modelo. Si alguna corresponde a
`cell phone` y su puntaje supera el umbral, genera `violation_type: PHONE_DETECTED`.

Si el modelo no está disponible en el sistema de archivos, el detector se
deshabilita automáticamente y el servicio sigue funcionando sin detección de teléfono.

---

### 7.5 Gestión de sesiones

**Archivos:** `proctoring_service/app/routers/sessions.py`,
`proctoring_service/app/services/session_service.py`

Una sesión de supervisión tiene los siguientes estados:
- `active`: la sesión está en curso.
- `ended`: la sesión terminó normalmente.

Cada evento de violación guardado en la base de datos incluye:
- `session_id`: a qué sesión pertenece.
- `violation_type`: el tipo de violación detectado.
- `confidence`: la confianza del modelo en esa detección (entre 0.0 y 1.0).
- `detected_at`: la hora exacta en UTC.

Al terminar la sesión, el resumen incluye:
- El total de violaciones registradas.
- El conteo de violaciones separado por tipo.
- La hora de inicio y de finalización.

---

## 8. Interfaz web

**Carpeta:** `client/`
**Framework:** SvelteKit
**Puerto en desarrollo:** 5173

El frontend está configurado con un proxy en Vite que redirige las peticiones
de la interfaz a las APIs correctas según la ruta:

```
/api/v1/proctoring/* → http://localhost:8001
/api/v1/sessions/*   → http://localhost:8001
/api/*               → http://localhost:8000
```

Esto permite que el código del frontend haga peticiones a `/api/...` sin
especificar el puerto, y Vite se encarga de redirigirlas al servicio correcto.

---

### Pantalla 1: Submissions

**Ruta:** `/submissions`

Permite registrar el código fuente de un estudiante.

Campos del formulario:
- `student_id`: identificador del estudiante (texto libre, ej: `student-001`)
- `problem_id`: identificador del ejercicio (ej: `factorial`)
- `exam_id`: identificador del examen (ej: `examen-2025-1`)
- `language`: lenguaje de programación (`python` o `java`)
- `source_code`: el código fuente completo (área de texto)

La lista de submissions muestra todas las entregas guardadas con opciones de
filtrado por examen, por problema o por estudiante. Al seleccionar una fila,
se muestra el código fuente completo.

---

### Pantalla 2: Analysis

**Ruta:** `/analysis`

Contiene dos formularios en paralelo:

**Comparación directa (Pairwise):**
- Selector: submission A
- Selector: submission B
- Campo: umbral de similitud (valor entre 0.0 y 1.0, por defecto 0.7)
- Acción: ejecuta la comparación y muestra el resultado de inmediato

Resultado mostrado:
- Puntaje de similitud en porcentaje
- Indicador de copia exacta (sí/no)
- Indicador de si supera el umbral (marcado/no marcado)
- Detalles del algoritmo: número de huellas de A, de B, en común, y los parámetros K y W

**Análisis de grupo (Batch):**
- Campo: `exam_id` o `problem_id` (el grupo de estudiantes a comparar)
- Campo: umbral de similitud
- Acción: crea un job en segundo plano y redirige a la pantalla de Jobs

---

### Pantalla 3: Jobs

**Ruta:** `/jobs`

Muestra el historial de todos los análisis batch lanzados.

Cada tarjeta de job muestra:
- Estado: `pending`, `running`, `completed` o `failed`
- Comparaciones completadas / comparaciones totales
- Tiempo de inicio y finalización

Mientras hay jobs con estado `running` o `pending`, la pantalla consulta
el servidor cada 3 segundos para actualizar el estado.

Al seleccionar un job completado, se muestra la tabla de resultados con:
- Par de estudiantes comparados
- Puntaje de similitud
- Si la comparación fue marcada como sospechosa

---

### Pantalla 4: Supervisión

**Ruta:** `/proctoring`

Contiene dos zonas:

**Zona izquierda:**
- Campos de configuración: `exam_id` y `student_id`
- El componente `ProctoringMonitor` que contiene:
  - El video de la cámara en vivo (elemento `<video>` del navegador)
  - Botón de inicio: activa la cámara y comienza a enviar fotogramas
  - Botón de finalización: termina la sesión y detiene el envío de fotogramas

**Zona derecha:**
- Lista de alertas en tiempo real con:
  - Hora de la detección
  - Tipo de violación (en español)
  - Porcentaje de confianza
  - Color de fondo por tipo:
    - Amarillo: múltiples personas
    - Rojo: persona ausente
    - Amarillo claro: mirando a otro lado
    - Rosa: uso de teléfono
- Al terminar la sesión: resumen con total de violaciones por tipo

El componente `ProctoringMonitor` captura fotogramas del video con un canvas
HTML, los convierte a imagen JPEG en formato Base64 y los envía al endpoint
`POST /api/v1/proctoring/analyze-frame` del servicio de proctoring.

---

## 9. Tecnologías y justificación

| Tecnología | Versión | Uso en el proyecto | Justificación |
|---|---|---|---|
| Python | 3.12 | Lenguaje de todos los servicios de backend | Ecosistema de IA disponible, tipado estático con anotaciones |
| FastAPI | 0.111 | Framework HTTP para ambas APIs | Genera documentación automática, validación de tipos con Pydantic |
| MediaPipe | 0.10 | Detección de rostros, mirada | Gratuito, sin GPU, modelos preentrenados por Google |
| EfficientDet-Lite0 | COCO | Detección de teléfono | Modelo de 4MB, corre en CPU, incluye clase `cell phone` |
| Pygments | 2.18 | Tokenización de código fuente | Soporta Python, Java, C++ y más de 500 lenguajes |
| SQLAlchemy | 2.0 | ORM para base de datos | Abstracción de SQL compatible con SQLite y PostgreSQL |
| SQLite | 3 | Base de datos en desarrollo | No requiere servidor adicional, archivo único |
| Celery | 5.4 | Ejecución asíncrona de tareas | Estándar para colas de tareas en Python |
| Redis | 7.2 | Broker de mensajes para Celery | Rápido, ampliamente usado con Celery |
| Flower | 2.0 | Monitor web de tareas Celery | Panel visual de estado de jobs en tiempo real |
| SvelteKit | 2.0 | Framework del frontend | Compilado a HTML/JS estático, sin Virtual DOM |
| Vite | 5.0 | Servidor de desarrollo con proxy | Redirige peticiones del frontend a las APIs correctas |
| Docker Compose | 3.9 | Orquestación de servicios | Un solo comando levanta todos los procesos |
| pytest | 8.0 | Tests unitarios | Estándar de facto para pruebas en Python |
| OpenCV | 4.10 | Decodificación de imágenes en el backend | Convierte bytes JPEG a array de píxeles |

---

## 10. Instrucciones para correr el proyecto

### Requisitos:

- Sistema operativo Linux (probado en Endeavour OS, Arch-based)
- Docker con Docker Compose instalado
- Node.js 20 o superior (para el frontend)
- Git

### Paso 1: Instalar Docker (si no está instalado)

```bash
sudo pacman -S docker docker-compose
sudo systemctl start docker
sudo systemctl enable docker
sudo usermod -aG docker $USER
```

Cerrar la sesión y volver a entrar para que el grupo `docker` tome efecto.

Verificar:
```bash
docker --version
docker compose version
```

### Paso 2: Clonar el repositorio

```bash
git clone https://github.com/CristhianAC/CheatingAI.git
cd CheatingAI
```

### Paso 3: Construir y levantar los servicios de backend

```bash
chmod +x scripts/docker_up.sh
./scripts/docker_up.sh --build
```

La primera ejecución descarga las imágenes base de Python y las dependencias,
incluyendo MediaPipe y EfficientDet. Puede tardar entre 5 y 15 minutos.

### Paso 4: Verificar que los servicios estén activos

```bash
docker ps
```

Deben aparecer 5 contenedores:

| Nombre | Puerto | Descripción |
|---|---|---|
| `cheating_ai_redis` | 6379 | Cola de mensajes |
| `cheating_ai_api` | 8000 | API de plagio |
| `cheating_ai_worker` | — | Worker Celery |
| `cheating_ai_flower` | 5555 | Monitor de tareas |
| `cheating_ai_proctoring` | 8001 | API de supervisión |

### Paso 5: Levantar el frontend

```bash
cd client
npm install
npm run dev
```

### Paso 6: URLs disponibles

| Servicio | URL |
|---|---|
| Interfaz web | http://localhost:5173 |
| API de plagio (documentación interactiva) | http://localhost:8000/docs |
| API de proctoring (documentación interactiva) | http://localhost:8001/docs |
| Monitor de tareas Celery | http://localhost:5555 |

### Apagar todos los servicios:

```bash
./scripts/docker_down.sh
```

---

## 11. Referencia de la API con ejemplos

### API de Plagio — Base URL: http://localhost:8000

---

#### GET /health

Verifica que el servidor esté activo.

```bash
curl http://localhost:8000/health
```

Respuesta:
```json
{
  "status": "ok",
  "version": "1.0.0",
  "app": "CheatingAI - Plagiarism Detection API"
}
```

---

#### POST /api/v1/submissions

Registra el código fuente de un estudiante.

```bash
curl -X POST http://localhost:8000/api/v1/submissions \
  -H "Content-Type: application/json" \
  -d '{
    "student_id": "student-001",
    "problem_id": "factorial",
    "exam_id": "examen-2025-1",
    "language": "python",
    "source_code": "def factorial(n):\n    if n == 0:\n        return 1\n    return n * factorial(n-1)"
  }'
```

Respuesta (HTTP 201):
```json
{
  "id": "a3f7c2e1-4b5d-4c1e-8f2a-1b3d5e7f9c0a",
  "student_id": "student-001",
  "problem_id": "factorial",
  "exam_id": "examen-2025-1",
  "language": "python",
  "code_hash": "8f3a2b1c...",
  "created_at": "2025-03-06T14:30:00Z"
}
```

---

#### GET /api/v1/submissions

Lista las submissions con filtros opcionales.

```bash
curl "http://localhost:8000/api/v1/submissions?exam_id=examen-2025-1&limit=50"
```

Respuesta:
```json
{
  "total": 2,
  "items": [
    {
      "id": "a3f7c2e1-...",
      "student_id": "student-001",
      "language": "python"
    },
    {
      "id": "b9d4e5f2-...",
      "student_id": "student-002",
      "language": "python"
    }
  ]
}
```

---

#### POST /api/v1/analysis/pairwise

Compara exactamente dos submissions. Retorna el resultado de inmediato.

```bash
curl -X POST http://localhost:8000/api/v1/analysis/pairwise \
  -H "Content-Type: application/json" \
  -d '{
    "submission_a_id": "a3f7c2e1-...",
    "submission_b_id": "b9d4e5f2-...",
    "threshold": 0.7
  }'
```

Respuesta (HTTP 200):
```json
{
  "similarity_score": 0.8721,
  "is_exact_copy": false,
  "is_flagged": true,
  "threshold_used": 0.7,
  "algorithm_details": {
    "fingerprints_a": 43,
    "fingerprints_b": 41,
    "common_fingerprints": 37,
    "k": 5,
    "w": 4
  }
}
```

Interpretación:
- `similarity_score: 0.8721` → 87.21% de similitud estructural.
- `is_flagged: true` → supera el umbral de 70%, queda marcado para revisión.
- `is_exact_copy: false` → el hash SHA256 de los dos códigos es distinto.
- `common_fingerprints: 37` → de 43 y 41 huellas respectivamente, 37 son iguales.

---

#### POST /api/v1/analysis/batch

Lanza el análisis de todos los pares posibles de un examen o problema.
El servidor responde de inmediato con el ID del job. El análisis corre en segundo plano.

```bash
curl -X POST http://localhost:8000/api/v1/analysis/batch \
  -H "Content-Type: application/json" \
  -d '{
    "exam_id": "examen-2025-1",
    "threshold": 0.7
  }'
```

Respuesta (HTTP 202 — Accepted):
```json
{
  "id": "job-f4a2b1c3-...",
  "status": "pending",
  "job_type": "batch",
  "exam_id": "examen-2025-1",
  "total_comparisons": null,
  "completed_comparisons": 0,
  "created_at": "2025-03-06T14:35:00Z"
}
```

---

#### GET /api/v1/jobs/{job_id}

Consulta el estado de un job.

```bash
curl http://localhost:8000/api/v1/jobs/job-f4a2b1c3-...
```

Respuesta mientras está en progreso:
```json
{
  "id": "job-f4a2b1c3-...",
  "status": "running",
  "total_comparisons": 435,
  "completed_comparisons": 218,
  "progress_percent": 50.1,
  "started_at": "2025-03-06T14:35:01Z"
}
```

Respuesta cuando termina:
```json
{
  "id": "job-f4a2b1c3-...",
  "status": "completed",
  "total_comparisons": 435,
  "completed_comparisons": 435,
  "progress_percent": 100.0,
  "started_at": "2025-03-06T14:35:01Z",
  "finished_at": "2025-03-06T14:35:47Z"
}
```

---

#### GET /api/v1/jobs/{job_id}/results

Obtiene los resultados de un job completado. Opción `flagged_only=true`
para ver solo los pares marcados como sospechosos.

```bash
curl "http://localhost:8000/api/v1/jobs/job-f4a2b1c3-.../results?flagged_only=true"
```

Respuesta:
```json
{
  "job_id": "job-f4a2b1c3-...",
  "total": 3,
  "items": [
    {
      "submission_a_id": "a3f7c2e1-...",
      "submission_b_id": "b9d4e5f2-...",
      "similarity_score": 0.9215,
      "is_exact_copy": false,
      "is_flagged": true,
      "threshold_used": 0.7
    },
    {
      "submission_a_id": "a3f7c2e1-...",
      "submission_b_id": "c5e8f3a1-...",
      "similarity_score": 1.0,
      "is_exact_copy": true,
      "is_flagged": true,
      "threshold_used": 0.7
    }
  ]
}
```

---

### API de Proctoring — Base URL: http://localhost:8001

---

#### GET /health

```bash
curl http://localhost:8001/health
```

Respuesta:
```json
{
  "status": "ok",
  "version": "1.0.0",
  "app": "CheatingAI - Proctoring Service"
}
```

---

#### POST /api/v1/sessions

Inicia una nueva sesión de supervisión.

```bash
curl -X POST http://localhost:8001/api/v1/sessions \
  -H "Content-Type: application/json" \
  -d '{
    "exam_id": "examen-2025-1",
    "student_id": "student-001"
  }'
```

Respuesta (HTTP 201):
```json
{
  "id": "sess-7d3b2a1c-...",
  "exam_id": "examen-2025-1",
  "student_id": "student-001",
  "status": "active",
  "started_at": "2025-03-06T15:00:00Z"
}
```

---

#### POST /api/v1/proctoring/analyze-frame

Analiza un fotograma. El campo `frame_base64` es una imagen JPEG en formato Base64.
El campo `session_id` es opcional: si se incluye, las violaciones se guardan en la
base de datos vinculadas a esa sesión.

```bash
curl -X POST http://localhost:8001/api/v1/proctoring/analyze-frame \
  -H "Content-Type: application/json" \
  -d '{
    "session_id": "sess-7d3b2a1c-...",
    "frame_base64": "/9j/4AAQSkZJRgAB..."
  }'
```

Respuesta cuando hay una violación:
```json
{
  "person_count": 1,
  "gaze_yaw": 0.18,
  "gaze_pitch": -0.02,
  "violations": [
    {
      "violation_type": "looking_away",
      "confidence": 0.76,
      "description": "Mirando a la derecha (yaw=0.180)"
    }
  ],
  "violations_persisted": true,
  "processing_time_ms": 84.3
}
```

Respuesta cuando no hay violaciones:
```json
{
  "person_count": 1,
  "gaze_yaw": 0.03,
  "gaze_pitch": -0.01,
  "violations": [],
  "violations_persisted": false,
  "processing_time_ms": 78.1
}
```

Respuesta cuando el estudiante se fue de la cámara:
```json
{
  "person_count": 0,
  "gaze_yaw": null,
  "gaze_pitch": null,
  "violations": [
    {
      "violation_type": "no_person",
      "confidence": 0.95,
      "description": "No person detected in frame"
    }
  ],
  "violations_persisted": true,
  "processing_time_ms": 41.7
}
```

Tipos de violación posibles:

| Valor | Descripción |
|---|---|
| `no_person` | No se detectó ningún rostro en el fotograma |
| `multiple_persons` | Se detectaron dos o más rostros |
| `looking_away` | La mirada supera el umbral horizontal o vertical |
| `phone_detected` | Un teléfono móvil fue detectado por EfficientDet |

---

#### POST /api/v1/proctoring/calibrate

Retorna los valores crudos de mirada sin aplicar la lógica de violaciones.
Se usa para ajustar los umbrales de `GAZE_YAW_THRESHOLD` y `GAZE_PITCH_THRESHOLD`
para un estudiante o cámara específica.

Respuesta:
```json
{
  "detected": true,
  "gaze_yaw": 0.04,
  "gaze_pitch": -0.02,
  "thresholds": {
    "yaw": 0.12,
    "pitch": 0.07
  },
  "yaw_ok": true,
  "pitch_ok": true,
  "raw": {
    "nose_x": 0.512,
    "nose_y": 0.481,
    "face_height": 0.348
  }
}
```

---

#### PUT /api/v1/sessions/{session_id}/end

Termina una sesión activa.

```bash
curl -X PUT http://localhost:8001/api/v1/sessions/sess-7d3b2a1c-.../end
```

---

#### GET /api/v1/sessions/{session_id}

Obtiene el resumen de una sesión.

```bash
curl http://localhost:8001/api/v1/sessions/sess-7d3b2a1c-...
```

Respuesta:
```json
{
  "id": "sess-7d3b2a1c-...",
  "exam_id": "examen-2025-1",
  "student_id": "student-001",
  "status": "ended",
  "started_at": "2025-03-06T15:00:00Z",
  "ended_at": "2025-03-06T16:30:00Z",
  "total_violations": 14,
  "violations_by_type": {
    "looking_away": 9,
    "no_person": 4,
    "phone_detected": 1
  }
}
```

---

## 12. Decisiones de diseño

### API First

El backend se construyó antes que la interfaz visual. La consecuencia es que
el sistema es independiente de cualquier cliente específico. Las APIs de plagio
y proctoring funcionan de forma completa sin la interfaz web. Cualquier cliente
(una app móvil, otra interfaz web, un script de línea de comandos) puede
consumir los mismos endpoints sin modificar el backend.

### Dos servicios separados (plagio y proctoring)

Los dos módulos tienen requerimientos de recursos distintos. El servicio de
proctoring mantiene tres modelos de IA cargados en memoria de forma permanente.
El servicio de plagio gestiona una cola de tareas con Celery y Redis. Separarlos
permite que un fallo en uno no afecte al otro, y que cada uno escale de forma
independiente si se despliega en producción.

### Sin almacenamiento de imágenes ni video

El servicio de proctoring recibe fotogramas, los analiza y descarta la imagen.
Solo guarda el tipo de evento detectado, la confianza y la hora. Las razones son:
- Evitar requerimientos de almacenamiento masivo.
- Reducir la superficie de riesgo de privacidad.
- No es necesario: el evento en sí es la información relevante, no la imagen.

### SQLite para el prototipo

La base de datos usa SQLite, que guarda todos los datos en un archivo local.
No requiere instalación de un servidor de base de datos adicional. Si en el
futuro se requiere migrar a PostgreSQL, es suficiente con cambiar la variable
de entorno `DATABASE_URL`. El código de acceso a datos no necesita modificarse
porque usa SQLAlchemy como capa de abstracción.

### Por qué Winnowing

Winnowing es el algoritmo usado por MOSS (Measure Of Software Similarity) de
la Universidad de Stanford, que es la herramienta de referencia para detección
de plagio académico. El algoritmo tiene base matemática documentada
(Schleimer, Wilkerson, Aiken, 2003) y garantiza detectar cualquier subsecuencia
común de longitud suficiente, independientemente de los nombres de variables,
porque la normalización se aplica antes del algoritmo.

Alternativas consideradas:
- **Comparación literal de texto:** no detecta variables renombradas.
- **Diff de líneas:** muy sensible a cambios superficiales de formato.
- **Modelos de embeddings de código (ML):** requieren GPU o entrenamiento,
  más difíciles de explicar, sin garantías formales.

---

## 13. Estado actual del proyecto

### Implementado y funcional:

**Módulo de plagio:**
- Tokenización con Pygments para Python y Java.
- Normalización de variables, strings y números.
- Algoritmo k-grams + Winnowing + Jaccard completo.
- Detección de copia exacta por SHA256.
- API REST completa: CRUD de submissions, pairwise, batch, jobs.
- Worker Celery para análisis batch asíncrono.
- Tests unitarios para tokenizador, normalizador, Winnowing y comparador.

**Módulo de proctoring:**
- FaceDetector con MediaPipe BlazeFace.
- GazeEstimator con MediaPipe Face Mesh (YAW y PITCH).
- PhoneDetector con EfficientDet-Lite0.
- Orquestador VisionDetector.
- Gestión de sesiones y registro de violaciones en base de datos.
- Endpoint de calibración.

**Frontend:**
- 4 pantallas completas: Submissions, Analysis, Jobs, Supervisión.
- Pantalla de supervisión con video de cámara en vivo y log de alertas.
- Actualización automática de jobs en progreso.

**Infraestructura:**
- Docker Compose con 5 servicios.
- Scripts de conveniencia.
- Proxy de Vite configurado.
- Variables de entorno documentadas en `.env.example`.

---

### Pendiente de implementar:

- Integración de estimación de pose corporal (MediaPipe Pose) en el
  servicio de proctoring. El prototipo existe en `diseno/estimacion_pose/`
  pero no está integrado al pipeline de producción.
- Detección de auriculares y documentos en cámara.
- Inclusión del frontend en Docker Compose.
- Tests de integración para los endpoints de la API.
- Medición formal de fotogramas por segundo del servicio de proctoring.
- Calibración de umbrales de mirada con pruebas en condiciones reales.
- Guías de uso para docente y para desarrollador.
- Capturas de pantalla del sistema en el README.

---

## 14. Glosario

| Término | Definición en el contexto de este proyecto |
|---|---|
| **API** | Servidor que recibe peticiones HTTP y retorna datos. No tiene interfaz visual propia. |
| **API First** | Patrón de diseño donde la API se construye antes que la interfaz de usuario. |
| **Análisis batch** | Comparación de todos los pares posibles de un conjunto de estudiantes, ejecutada en segundo plano. |
| **Análisis pairwise** | Comparación directa entre exactamente dos submissions. Retorna el resultado de inmediato. |
| **Base64** | Codificación que convierte datos binarios (como una imagen JPEG) en una cadena de texto ASCII. Permite enviar imágenes dentro de un JSON. |
| **BlazeFace** | Modelo de red neuronal de Google para detección de rostros en tiempo real, optimizado para cámara web. |
| **Celery** | Librería Python para ejecutar tareas en procesos separados, sin bloquear el servidor principal. |
| **COCO** | Dataset de 80 categorías de objetos del mundo real, usado para entrenar modelos de detección de objetos. |
| **Docker** | Herramienta que empaqueta un programa y sus dependencias en un contenedor aislado, reproducible en cualquier sistema. |
| **Docker Compose** | Herramienta para definir y correr múltiples contenedores Docker con un solo archivo de configuración. |
| **EfficientDet** | Familia de modelos de detección de objetos. La versión Lite0 es la más pequeña, optimizada para CPU. |
| **Endpoint** | URL específica de una API que realiza una operación determinada. |
| **Face Mesh** | Modelo de MediaPipe que coloca 468 puntos de referencia sobre el rostro en un fotograma. |
| **Fotograma (frame)** | Una imagen individual extraída de un video o de la cámara en un instante dado. |
| **Hash / SHA256** | Función que convierte cualquier entrada en un número de tamaño fijo. La misma entrada siempre produce el mismo número. Una diferencia mínima en la entrada produce un número completamente distinto. |
| **Huella digital (fingerprint)** | Un número entero que representa un k-gram de código. Dos k-grams iguales producen la misma huella. |
| **Job** | Tarea de análisis batch con un estado rastreable: `pending`, `running`, `completed`, `failed`. |
| **JSON** | Formato de texto estructurado para intercambiar datos entre sistemas. |
| **Jaccard** | Medida de similitud entre dos conjuntos. Se calcula como el tamaño de la intersección dividido por el tamaño de la unión. |
| **K-gram** | Subsecuencia de exactamente K elementos consecutivos de una lista. |
| **MediaPipe** | Librería de Google con modelos de IA para visión por computador, distribuida de forma gratuita. |
| **Normalización** | Proceso de reemplazar nombres de variables y literales por etiquetas genéricas, para hacer comparables dos códigos con nombres distintos. |
| **ORM** | Capa de software que permite manipular una base de datos usando objetos de Python, sin escribir SQL directamente. |
| **PITCH** | Ángulo de inclinación vertical de la cabeza. En este sistema: qué tan inclinada está la cabeza hacia abajo. |
| **Proxy** | Componente que redirige peticiones de una dirección a otra. El proxy de Vite redirige peticiones del frontend a las APIs correctas. |
| **Pygments** | Librería Python para análisis sintáctico de código fuente en múltiples lenguajes. |
| **Redis** | Base de datos en memoria usada como intermediario de mensajes entre la API y los workers de Celery. |
| **SQLAlchemy** | ORM para Python compatible con SQLite, PostgreSQL, MySQL y otros motores de base de datos. |
| **SQLite** | Motor de base de datos que guarda todos los datos en un archivo local sin requerir un proceso de servidor separado. |
| **SvelteKit** | Framework de JavaScript para construir interfaces web. Compila los componentes a HTML y JavaScript estático. |
| **Token** | Unidad mínima de significado en un lenguaje de programación (palabra clave, nombre de variable, operador, etc.). |
| **Tokenización** | Proceso de dividir código fuente en una lista de tokens. |
| **Umbral (threshold)** | Valor límite. Si el puntaje de similitud supera el umbral, el par queda marcado como sospechoso. |
| **Violación** | Evento detectado durante la supervisión que corresponde a un comportamiento fuera de las condiciones normales del examen. |
| **Winnowing** | Algoritmo para seleccionar un subconjunto representativo de hashes de una secuencia, usando una ventana deslizante. Publicado por Schleimer, Wilkerson y Aiken en 2003. |
| **Worker** | Proceso independiente que ejecuta tareas tomadas de una cola de Redis. |
| **YAW** | Ángulo de rotación horizontal de la cabeza. En este sistema: qué tanto gira la cabeza hacia la izquierda o la derecha. |