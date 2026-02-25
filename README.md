# CheatingAI - Modelos de Visión por Computador para Detección de Trampa

**Integrantes:** Cristhian Agamez Cervantes y Mateo Guerrero Escobar  
**Materia:** Proyecto Final de Grado  
**Institución:** Universidad del Norte  
**Fecha de inicio:** Febrero 2025  

---

## Introducción

La expansión de los exámenes en línea como modalidad de evaluación académica ha
generado nuevos desafíos en la verificación de la integridad estudiantil. A diferencia
de los exámenes presenciales, los entornos virtuales reducen significativamente la
capacidad de supervisión directa de los docentes, lo que facilita comportamientos
fraudulentos como la consulta de materiales no autorizados, el uso de dispositivos
móviles o la comunicación con terceros durante la evaluación.

Este proyecto propone el desarrollo de un sistema basado en modelos de visión por
computador capaz de analizar el comportamiento de los estudiantes durante exámenes
en línea a través de la cámara web, identificando patrones visuales que puedan estar
asociados a prácticas de trampa.

---

## Planteamiento del Problema

Los docentes que aplican evaluaciones en modalidad virtual no cuentan con herramientas
automatizadas confiables para supervisar el comportamiento visual de los estudiantes
en tiempo real. Las soluciones existentes dependen principalmente de restricciones de
software (bloqueo de pestañas, grabación de pantalla) pero no analizan el comportamiento
físico del estudiante frente a la cámara.

La pregunta de investigación que orienta este proyecto es:

*¿Es posible construir un sistema de visión por computador que detecte, con suficiente
precisión y en tiempo real, comportamientos potencialmente asociados a trampa académica
durante exámenes en línea?*

---

## Restricciones y Supuestos de Diseño

### Restricciones

- El sistema opera exclusivamente con la cámara web del dispositivo del estudiante,
  sin requerir hardware especializado.
- El procesamiento debe poder ejecutarse en tiempo real (mínimo 15 fotogramas por segundo)
  en un equipo de consumo estándar, idealmente sin requerir GPU dedicada.
- El sistema no almacena video de los estudiantes; solo genera eventos y alertas.
- No se realizará identificación biométrica ni reconocimiento de identidad.

### Supuestos

- El estudiante cuenta con una cámara web funcional y encendida durante todo el examen.
- La cámara está ubicada de frente al estudiante, con iluminación aceptable.
- El examen se realiza en un entorno con un fondo relativamente estático.
- Las alertas generadas son probabilísticas; el docente es quien toma la decisión final
  sobre si un comportamiento constituye trampa.

---

## Alcance

### Dentro del alcance

- Detección de ausencia o multiplicidad de rostros en el encuadre.
- Análisis de la dirección de la mirada del estudiante.
- Estimación de pose corporal para identificar movimientos sospechosos.
- Detección de objetos no autorizados visibles en cámara (teléfono, auriculares, papeles).
- Generación de un registro de eventos sospechosos por sesión.

### Fuera del alcance

- Identificación de la identidad del estudiante (quién es).
- Análisis de audio.
- Integración con plataformas LMS (Moodle, Canvas, etc.) en esta fase del proyecto.
- Detección de comportamiento en la pantalla del estudiante.

---