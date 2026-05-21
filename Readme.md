# Procto — Supervisión académica y detección de irregularidades

## Resumen ejecutivo

La evaluación académica en modalidad virtual se ha consolidado como una alternativa flexible, pero reduce la capacidad de supervisión presencial del docente. En ese contexto aumentan conductas de riesgo: consulta de materiales no autorizados, uso de dispositivos móviles, presencia de terceros o sustitución de identidad frente a la cámara. Las herramientas que solo bloquean el navegador o graban pantalla no analizan de forma sistemática el comportamiento visual del estudiante ni entregan evidencia estructurada para la revisión académica.

**CheatingAI** es el sistema desarrollado en este proyecto final; la interfaz web se presenta bajo la marca **Procto**. La solución integra dos líneas de trabajo en un mismo repositorio: (1) **supervisión por cámara y navegador (proctoring)**, con análisis de fotogramas mediante visión por computador (MediaPipe, detección de objetos, verificación de identidad con DeepFace/Facenet), registro de eventos del navegador y generación de reportes de riesgo con evidencia puntual; y (2) **detección de similitud entre entregas de código**, mediante el algoritmo Winnowing y procesamiento asíncrono con Redis y Celery.

El prototipo entregado es funcional de extremo a extremo: autenticación por roles (profesor y estudiante), gestión de exámenes, unión por código, sesión de supervisión en tiempo real, reportes docentes con puntuación 0–100 y capturas en Supabase Storage, además del flujo de entregas, análisis y trabajos en cola para plagio. La arquitectura sigue un enfoque **API-first** (FastAPI en los puertos 8000 y 8001, cliente SvelteKit 5 con diseño shadcn-svelte), desplegable con Docker Compose y base de datos configurable (SQLite en desarrollo o PostgreSQL/Supabase en entornos gestionados).

El valor para la institución y el docente consiste en convertir señales dispersas en **evidencia con marca de tiempo**, alertas interpretables y un score de riesgo que prioriza la revisión humana sin sustituir la decisión académica ni almacenar video completo de los participantes. La documentación detallada del diseño, instalación y desarrollo se encuentra en los archivos enlazados a continuación.

## Documentación del repositorio

| Documento | Descripción |
|---|---|
| [Informe.md](./Informe.md) | Documento principal del proyecto |
| [Instalación.md](./Instalación.md) | Guía de instalación, desarrollo y despliegue |
| [Desarrollo.md](./Desarrollo.md) | Detalles técnicos del desarrollo |
| [ARCHITECTURE.md](./ARCHITECTURE.md) | Arquitectura ampliada (modelo C4) — material de apoyo |
| [CRITERIOS_DE_RIESGO.md](./CRITERIOS_DE_RIESGO.md) | Criterios del motor de evaluación de riesgo — material de apoyo |

## Estudiantes

| Nombre | GitHub |
|---|---|
| Cristhian Agamez Cervantes | [@CristhianAC](https://github.com/CristhianAC) |
| Mateo Guerrero Escobar | [@MateoGE01](https://github.com/MateoGE01) |

## Tutores

- Daniel José Romero Martínez
