# Arquitectura del sistema — CheatingAI

Documentación de arquitectura siguiendo el **modelo C4** (Context → Container → Component → Code).

> **Convención de lectura:** cada nivel amplía el detalle del anterior. Si solo necesitas entender qué hace el sistema, lee el Nivel 1. Si necesitas entender cómo está construido, lee hasta el Nivel 3.

---

## Nivel 1 — Contexto del sistema

Muestra quiénes usan el sistema y con qué sistemas externos interactúa.

```mermaid
flowchart TD
    Student(["👤 Estudiante\nRealiza el examen en el navegador\ncon acceso a cámara"])
    Professor(["👤 Profesor\nRevisa reportes de riesgo\nal finalizar el examen"])

    subgraph CheatingAI["🖥️  CheatingAI — Sistema de supervisión académica"]
        direction TB
        Core["Detecta comportamientos sospechosos en tiempo real\ny genera reportes de riesgo para el profesor"]
    end

    Supabase["☁️ Supabase Storage\nAlmacenamiento de capturas\nde fotogramas (externo)"]
    BrowserAPI["🌐 Web APIs del navegador\ngetUserMedia · visibilitychange\nwindow.blur (externo)"]

    Student -->|"HTTPS — activa supervisión y realiza examen"| CheatingAI
    Professor -->|"HTTPS — consulta exámenes y reportes"| CheatingAI
    CheatingAI -->|"HTTPS / SDK — sube capturas de violaciones"| Supabase
    CheatingAI -->|"JavaScript — captura video y escucha eventos"| BrowserAPI

    style Student        fill:#dbeafe,stroke:#3b82f6,color:#1e3a5f
    style Professor      fill:#dbeafe,stroke:#3b82f6,color:#1e3a5f
    style CheatingAI     fill:#f0fdf4,stroke:#22c55e,color:#14532d
    style Core           fill:#f0fdf4,stroke:none,color:#374151
    style Supabase       fill:#fef9c3,stroke:#ca8a04,color:#713f12
    style BrowserAPI     fill:#fef9c3,stroke:#ca8a04,color:#713f12
```

### Actores

| Actor | Rol en el sistema |
|-------|------------------|
| **Estudiante** | Inicia sesión de supervisión, es monitoreado durante el examen |
| **Profesor** | Accede a la vista de actividades y revisa reportes de riesgo por sesión |

### Sistemas externos

| Sistema | Uso |
|---------|-----|
| **Supabase Storage** | Almacena las capturas de fotogramas (`session_id/timestamp.jpg`) cuando se detecta una violación. Opcional: si no está configurado, el sistema funciona sin capturas. |
| **Web APIs del navegador** | `getUserMedia` para acceder a la cámara; `visibilitychange` y `window.blur` para detectar cambios de pestaña y pérdida de foco |

---

## Nivel 2 — Contenedores

Muestra las aplicaciones y procesos que componen CheatingAI.

```mermaid
flowchart TD
    Student(["👤 Estudiante"])
    Professor(["👤 Profesor"])

    subgraph System["CheatingAI"]
        direction TB

        Frontend["🖥️ SvelteKit Web App\n[Container · JavaScript / Svelte]\n─────────────────────────────\nInterfaz de usuario en el navegador.\nMonitoreo en tiempo real,\nconfiguración de sesión\ny visualización de reportes."]

        API["⚙️ Proctoring Service\n[Container · Python 3.11 / FastAPI]\n─────────────────────────────\nAPI REST que recibe fotogramas\ny eventos de navegador, corre los\nmodelos de visión computacional,\npersiste violaciones y genera\nreportes de riesgo."]

        DB[("💾 SQLite\n[Container · Base de datos]\n─────────────────\nSesiones de supervisión\ny eventos de violación\ncon marca de tiempo.")]
    end

    Supabase["☁️ Supabase Storage\n[Sistema externo]"]

    Student -->|"HTTPS"| Frontend
    Professor -->|"HTTPS"| Frontend
    Frontend -->|"HTTP/REST · JSON\nFotogramas y eventos"| API
    API -->|"SQLAlchemy / SQL"| DB
    API -->|"HTTPS / Python SDK\nSube capturas"| Supabase

    style Student    fill:#dbeafe,stroke:#3b82f6,color:#1e3a5f
    style Professor  fill:#dbeafe,stroke:#3b82f6,color:#1e3a5f
    style System     fill:#f8fafc,stroke:#94a3b8
    style Frontend   fill:#ede9fe,stroke:#7c3aed,color:#2e1065
    style API        fill:#ecfdf5,stroke:#059669,color:#064e3b
    style DB         fill:#fff7ed,stroke:#d97706,color:#451a03
    style Supabase   fill:#fef9c3,stroke:#ca8a04,color:#713f12
```

### Decisiones tecnológicas

| Contenedor | Tecnología | Motivo |
|-----------|------------|--------|
| **Frontend** | SvelteKit | Bundle mínimo, reactividad sin framework pesado, acceso directo a Web APIs |
| **Proctoring Service** | FastAPI + Python | Ecosistema de ML (MediaPipe, DeepFace, OpenCV) disponible nativamente en Python |
| **Base de datos** | SQLite | Sin infraestructura adicional en desarrollo; sustituible por PostgreSQL en producción solo cambiando `DATABASE_URL` |
| **Modelos de visión** | MediaPipe (Google) | On-device, sin coste por llamada a API, latencia ~50–100 ms por fotograma |

---

## Nivel 3 — Componentes del Proctoring Service

Muestra los módulos internos del backend y sus responsabilidades.

```mermaid
flowchart TD
    FE(["🖥️ SvelteKit Web App"])
    SUP(["☁️ Supabase Storage"])

    subgraph API["Proctoring Service (FastAPI)"]
        direction TB

        subgraph Routers["Routers  /api/v1"]
            PR["proctoring.py\n/analyze-frame\n/browser-event\n/register-identity\n/check-identity\n/calibrate"]
            SR["sessions.py\n/sessions CRUD\n/sessions/{id}/report\n/sessions/by-exam/{id}"]
        end

        subgraph Services["Services"]
            SS["session_service.py\nCiclo de vida de sesión\nConstruye SessionReport"]
            RS["risk_scorer.py\nPuntuación 0–100\nDetección de picos\nAlertas en lenguaje natural"]
            VS["violation_service.py\nPersiste ViolationEvent"]
            ST["storage.py\nSube capturas a Supabase"]
        end

        subgraph Vision["Vision Pipeline  (instancia única en app.state)"]
            VD["detector.py\nVisionDetector — orquestador"]
            FD["face_detector.py\nMediaPipe BlazeFace\nConteo de personas"]
            GE["gaze_estimator.py\nMediaPipe Face Mesh\n468 landmarks · ratio-based"]
            PD["phone_detector.py\nEfficientDet-Lite0 COCO\nDetección de teléfono"]
            IV["identity_verifier.py\nDeepFace / Facenet\n128-d embeddings coseno"]
        end

        subgraph Data["Data"]
            ORM["models/\nProctoringSession\nViolationEvent"]
            CFG["config.py\nSettings (.env)\nUmbrales de gaze y confianza"]
        end
    end

    DB[("💾 SQLite")]

    FE -->|"POST /analyze-frame\nPOST /browser-event\nPOST /register-identity"| PR
    FE -->|"GET /sessions/{id}/report\nGET /by-exam/{id}"| SR

    PR --> VD
    PR --> VS
    PR --> ST
    PR --> IV
    SR --> SS

    SS --> RS
    SS --> ORM
    VS --> ORM
    ST --> SUP

    VD --> FD
    VD --> GE
    VD --> PD

    ORM --> DB

    style API      fill:#f8fafc,stroke:#94a3b8
    style Routers  fill:#ede9fe,stroke:#7c3aed,color:#2e1065
    style Services fill:#ecfdf5,stroke:#059669,color:#064e3b
    style Vision   fill:#fff7ed,stroke:#d97706,color:#451a03
    style Data     fill:#f0f9ff,stroke:#0284c7,color:#0c4a6e
    style PR fill:#ede9fe,stroke:#7c3aed,color:#1e1b4b
    style SR fill:#ede9fe,stroke:#7c3aed,color:#1e1b4b
    style SS fill:#ecfdf5,stroke:#059669,color:#064e3b
    style RS fill:#ecfdf5,stroke:#059669,color:#064e3b
    style VS fill:#ecfdf5,stroke:#059669,color:#064e3b
    style ST fill:#ecfdf5,stroke:#059669,color:#064e3b
    style VD fill:#fff7ed,stroke:#d97706,color:#451a03
    style FD fill:#fff7ed,stroke:#d97706,color:#451a03
    style GE fill:#fff7ed,stroke:#d97706,color:#451a03
    style PD fill:#fff7ed,stroke:#d97706,color:#451a03
    style IV fill:#fff7ed,stroke:#d97706,color:#451a03
    style ORM fill:#f0f9ff,stroke:#0284c7,color:#0c4a6e
    style CFG fill:#f0f9ff,stroke:#0284c7,color:#0c4a6e
    style FE fill:#dbeafe,stroke:#3b82f6,color:#1e3a5f
    style SUP fill:#fef9c3,stroke:#ca8a04,color:#713f12
    style DB fill:#fff7ed,stroke:#d97706,color:#451a03
```

---

## Nivel 3 — Componentes del Frontend (SvelteKit)

```mermaid
flowchart TD
    API(["⚙️ Proctoring Service"])

    subgraph FE["SvelteKit Web App"]
        direction TB

        PP["routes/proctoring/+page.svelte\n──────────────────────────────\nPágina principal con dos pestañas:\n· Monitor en vivo (log de violaciones)\n· Actividades (lista de exámenes\n  y sesiones para el profesor)"]

        RP["routes/proctoring/report/[sessionId]/+page.svelte\n──────────────────────────────\nReporte de riesgo para el profesor.\nVeredicto · puntuación · alertas\npicos simultáneos · log completo"]

        MON["components/ProctoringMonitor.svelte\n──────────────────────────────\nCaptura fotogramas cada 2 s.\nEnvía al backend y muestra\nviolaciones en tiempo real.\nGestiona identidad y calibración."]

        CLI["lib/proctoring-api.js\n──────────────────────────────\nCliente HTTP que abstrae\ntodas las llamadas REST:\nstartSession · analyzeFrame\nreportBrowserEvent · registerIdentity\ncheckIdentity · getSessionReport"]
    end

    PP -->|"monta componente con\nexamId + studentId"| MON
    PP -->|"getExamsSummary()\ngetSessionsByExam()"| CLI
    RP -->|"getSessionReport(sessionId)"| CLI
    MON -->|"startSession() · analyzeFrame()\nbrowserEvent() · registerIdentity()\ncheckIdentity() · endSession()"| CLI
    CLI -->|"fetch() HTTP/REST"| API

    style FE   fill:#f8fafc,stroke:#94a3b8
    style PP   fill:#ede9fe,stroke:#7c3aed,color:#1e1b4b
    style RP   fill:#ede9fe,stroke:#7c3aed,color:#1e1b4b
    style MON  fill:#ecfdf5,stroke:#059669,color:#064e3b
    style CLI  fill:#f0f9ff,stroke:#0284c7,color:#0c4a6e
    style API  fill:#ecfdf5,stroke:#059669,color:#064e3b
```

---

## Nivel 4 — Código: estructuras clave

### Modelos de datos (SQLAlchemy)

```
ProctoringSession                    ViolationEvent
─────────────────────────────        ──────────────────────────────────
id              : UUID (PK)          id              : UUID (PK)
exam_id         : str                session_id      : FK → ProctoringSession
student_id      : str                violation_type  : ViolationType (enum)
status          : SessionStatus      confidence      : float  [0.0 – 1.0]
started_at      : datetime (UTC)     frame_snapshot  : str?  (Supabase URL)
ended_at        : datetime? (UTC)    detected_at     : datetime (UTC)
reference_embedding : str? (JSON)
                                     ↑ relación 1-N
```

**ViolationType (enum)**
```
IDENTITY_MISMATCH | PHONE_DETECTED | MULTIPLE_PERSONS
TAB_SWITCH        | NO_PERSON      | WINDOW_BLUR       | LOOKING_AWAY
```

---

### Pipeline de visión (por fotograma)

```mermaid
flowchart TD
    A(["frame_bytes JPEG\ndel navegador"])
    B["Decodificar JPEG\nOpenCV → frame_rgb"]
    C["FaceDetector.detect\nMediaPipe BlazeFace\numbral conf: 0.5"]

    A --> B --> C

    C -->|"face_count == 0"| D["⚠️ NO_PERSON\nconf: 0.95"]
    C -->|"face_count > 1"| E["⚠️ MULTIPLE_PERSONS\nconf: 0.70–0.99"]
    C -->|"face_count == 1"| F["GazeEstimator.estimate\nMediaPipe Face Mesh\n468 landmarks"]

    F -->|"yaw > 0.12\no pitch > 0.07"| G["⚠️ LOOKING_AWAY\nconf: 0.60–0.98\n(escala con desvío)"]
    F --> H["PhoneDetector.detect\nEfficientDet-Lite0 COCO\numbral score: 0.45"]
    H -->|"'cell phone' detectado"| I["⚠️ PHONE_DETECTED\nconf: score del modelo"]

    J(["Evento navegador\nvisibilitychange\nwindow.blur"])
    K["⚠️ TAB_SWITCH\nWINDOW_BLUR\nconf: 1.0"]
    J --> K

    L(["Cada 30 s\nsi identidad registrada"])
    M["IdentityVerifier.compare\nDeepFace / Facenet 128-d\ndistancia coseno ≥ 0.40"]
    N["⚠️ IDENTITY_MISMATCH\nconf: 1 − similitud_coseno"]
    L --> M -->|"distancia ≥ 0.40"| N

    style D fill:#fef2f2,stroke:#dc2626,color:#7f1d1d
    style E fill:#fef2f2,stroke:#dc2626,color:#7f1d1d
    style G fill:#fef2f2,stroke:#dc2626,color:#7f1d1d
    style I fill:#fef2f2,stroke:#dc2626,color:#7f1d1d
    style K fill:#fef2f2,stroke:#dc2626,color:#7f1d1d
    style N fill:#fef2f2,stroke:#dc2626,color:#7f1d1d
```

---

### Motor de riesgo (RiskScorer)

```mermaid
flowchart TD
    IN(["violations: list\nduration_seconds: float"])

    IN --> CRIT
    IN --> RATE
    IN --> CLUST

    subgraph CRIT["Señales críticas (no se normalizan por duración)"]
        C1["IDENTITY_MISMATCH → 45 pts base"]
        C2["PHONE_DETECTED    → 38 pts base"]
        C3["MULTIPLE_PERSONS  → 30 pts base"]
        C4["Rendimientos decrecientes:\n1ª × 1.00 · 2ª × 0.65\n3ª × 0.40 · 4ª+ × 0.25"]
    end

    subgraph RATE["Señales de frecuencia (normalizadas por duración)"]
        R1["LOOKING_AWAY → 6 pts base\nTAB_SWITCH   → 22 pts base\nWINDOW_BLUR  → 10 pts base\nNO_PERSON    → 14 pts base"]
        R2["factor = 1800 ÷ duration_s\nclampeado: 0.4× – 2.0×\nmáx. aporte: 40 pts"]
    end

    subgraph CLUST["Picos simultáneos"]
        CL1["Ventana: 90 s · mínimo 3 eventos\n+6 pts por pico · máx. 18 pts"]
    end

    CRIT --> SUM
    RATE --> SUM
    CLUST --> SUM

    SUM["score = crítico + frecuencia + picos"]
    FLOOR["Si IDENTITY_MISMATCH AND PHONE_DETECTED\nscore = max(score, 88)"]
    CAP["score = min(score, 100)"]

    SUM --> FLOOR --> CAP --> LEVEL

    subgraph LEVEL["Nivel de riesgo"]
        L1["0 – 22  🟢 BAJO\nSin señales de trampa"]
        L2["23 – 48 🟡 MEDIO\nRevisión recomendada"]
        L3["49 – 72 🟠 ALTO\nRequiere atención"]
        L4["73 – 100 🔴 CRÍTICO\nIntervención recomendada"]
    end

    LEVEL --> OUT(["RiskAssessment\nscore · level · summary\nalerts[] · clusters[]"])

    style CRIT   fill:#fef2f2,stroke:#dc2626,color:#7f1d1d
    style RATE   fill:#fff7ed,stroke:#d97706,color:#451a03
    style CLUST  fill:#fef9c3,stroke:#ca8a04,color:#713f12
    style L1     fill:#f0fdf4,stroke:#16a34a,color:#14532d
    style L2     fill:#fefce8,stroke:#ca8a04,color:#713f12
    style L3     fill:#fff7ed,stroke:#ea580c,color:#431407
    style L4     fill:#fef2f2,stroke:#dc2626,color:#7f1d1d
```

---

## Flujos principales

### Flujo de monitoreo (estudiante)

```mermaid
sequenceDiagram
    actor S as Estudiante
    participant UI as ProctoringMonitor
    participant API as Proctoring Service
    participant DB as SQLite
    participant SUP as Supabase

    S->>UI: Ingresa examId + studentId
    S->>UI: Clic "Iniciar supervisión"
    UI->>API: POST /sessions
    API->>DB: INSERT proctoring_sessions
    API-->>UI: { session_id }

    S->>UI: Clic "Capturar foto" (registro identidad)
    UI->>API: POST /register-identity (frame_base64)
    API->>API: DeepFace.extract_embedding()
    API->>DB: UPDATE reference_embedding
    API-->>UI: { registered: true }

    loop Cada 2 segundos
        UI->>UI: Captura fotograma JPEG (quality 0.7)
        UI->>API: POST /analyze-frame (frame_base64, session_id)
        API->>API: VisionDetector.analyze_frame()
        alt Violaciones detectadas
            API->>SUP: upload_violation_frame()
            API->>DB: INSERT violation_events
        end
        API-->>UI: { violations, gaze_yaw, gaze_pitch }
        UI->>S: Muestra alertas en tiempo real
    end

    loop Cada 30 segundos
        UI->>API: POST /check-identity (frame_base64)
        API->>API: IdentityVerifier.compare()
        alt Persona diferente
            API->>DB: INSERT IDENTITY_MISMATCH
        end
        API-->>UI: { identity_verified, similarity }
    end

    Note over UI,API: Eventos instantáneos del navegador
    UI->>API: POST /browser-event (tab_switch | window_blur)
    API->>DB: INSERT violation_events (conf=1.0)

    S->>UI: Clic "Detener supervisión"
    UI->>API: PUT /sessions/{id}/end
    API->>DB: UPDATE status=ENDED, ended_at=now()
    API-->>UI: { status: ended }
```

---

### Flujo de reporte (profesor)

```mermaid
sequenceDiagram
    actor P as Profesor
    participant UI as SvelteKit App
    participant API as Proctoring Service
    participant DB as SQLite

    P->>UI: Abre /proctoring → pestaña "Actividades"
    UI->>API: GET /sessions/exams-summary
    API->>DB: GROUP BY exam_id
    API-->>UI: [{ exam_id, students_count, last_activity }]
    UI->>P: Tabla de exámenes

    P->>UI: Clic en un examen
    UI->>API: GET /sessions/by-exam/{examId}
    API-->>UI: [{ id, student_id, status, started_at }]
    UI->>P: Tabla de sesiones

    P->>UI: Clic en sesión "Finalizado"
    UI->>UI: Navega a /proctoring/report/{sessionId}
    UI->>API: GET /sessions/{sessionId}/report
    API->>DB: SELECT violations ORDER BY detected_at ASC
    API->>API: RiskScorer(violations, duration).compute()
    Note right of API: Pondera violaciones<br/>Detecta picos<br/>Genera alertas
    API-->>UI: SessionReport { risk_assessment, violations[] }

    UI->>P: Veredicto + puntuación + alertas\nen lenguaje natural
```

---

## Configuración y variables de entorno

El servicio se configura con un archivo `.env` en `proctoring_service/`:

| Variable | Valor por defecto | Descripción |
|----------|------------------|-------------|
| `DATABASE_URL` | `sqlite:///./data/proctoring.db` | Conexión a la base de datos |
| `SUPABASE_URL` | `""` | URL del proyecto Supabase (opcional) |
| `SUPABASE_SERVICE_KEY` | `""` | Service role key de Supabase (opcional) |
| `SUPABASE_BUCKET` | `proctoring-violations` | Nombre del bucket de Storage |
| `GAZE_YAW_THRESHOLD` | `0.12` | Desviación horizontal máxima (fracción del ancho de cara) |
| `GAZE_PITCH_THRESHOLD` | `0.07` | Desviación vertical máxima (fracción de la altura de cara) |
| `FACE_DETECTION_CONFIDENCE` | `0.5` | Umbral de confianza de BlazeFace |
| `FACE_MESH_CONFIDENCE` | `0.5` | Umbral de confianza de Face Mesh |

---

## Estructura de directorios

```
CheatingAI/
├── client/                              # SvelteKit Web App
│   └── src/
│       ├── lib/
│       │   ├── proctoring-api.js        # Cliente HTTP
│       │   └── components/
│       │       └── ProctoringMonitor.svelte
│       └── routes/
│           └── proctoring/
│               ├── +page.svelte         # Monitor + Actividades
│               └── report/[sessionId]/
│                   └── +page.svelte     # Reporte de riesgo
│
├── proctoring_service/                  # FastAPI Backend
│   ├── requirements.txt
│   └── app/
│       ├── main.py                      # Entrypoint FastAPI
│       ├── config.py                    # Settings (.env)
│       ├── database.py                  # SQLAlchemy engine
│       ├── dependencies.py              # get_db()
│       ├── models/
│       │   ├── session.py               # ORM: ProctoringSession
│       │   └── violation.py             # ORM: ViolationEvent
│       ├── schemas/
│       │   ├── session.py               # Pydantic: SessionReport, RiskAssessmentSchema
│       │   ├── violation.py             # Pydantic: ViolationWithSnapshot
│       │   └── frame.py                 # Pydantic: FrameAnalysisRequest/Response
│       ├── routers/
│       │   ├── proctoring.py            # /analyze-frame, /browser-event, /identity
│       │   └── sessions.py              # /sessions CRUD + /report
│       └── services/
│           ├── session_service.py       # Lógica de sesiones y reportes
│           ├── risk_scorer.py           # Motor de puntuación de riesgo
│           ├── violation_service.py     # Persistencia de violaciones
│           ├── storage.py               # Upload a Supabase
│           └── vision/
│               ├── detector.py          # VisionDetector (orquestador)
│               ├── face_detector.py     # MediaPipe BlazeFace
│               ├── gaze_estimator.py    # MediaPipe Face Mesh
│               ├── phone_detector.py    # EfficientDet-Lite0
│               └── identity_verifier.py # DeepFace / Facenet
│
├── ARCHITECTURE.md                      # Este documento
└── CRITERIOS_DE_RIESGO.md               # Criterios de evaluación de trampa
```
