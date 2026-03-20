# Criterios de evaluación de riesgo de trampa

Este documento explica cómo CheatingAI evalúa el comportamiento de un estudiante durante un examen supervisado y genera la puntuación de riesgo que ve el profesor en el reporte.

---

## 1. Qué se detecta

El sistema monitorea siete tipos de comportamiento a través de la cámara y el navegador:

| Señal | Fuente | Descripción |
|-------|--------|-------------|
| **Persona diferente al registrado** | Cámara | La cara detectada no coincide con la del estudiante que inició la sesión |
| **Uso de teléfono móvil** | Cámara | Se identifica un dispositivo móvil en el encuadre |
| **Varias personas** | Cámara | Dos o más rostros aparecen frente a la cámara |
| **Cambio de pestaña / ventana** | Navegador | El estudiante navega fuera de la aplicación del examen |
| **Estudiante ausente** | Cámara | No se detecta ningún rostro durante un intervalo de captura |
| **Pérdida de foco en la app** | Navegador | La ventana del examen pierde el foco sin un cambio explícito de pestaña |
| **Mirada alejada de la pantalla** | Cámara | La dirección de la mirada supera los umbrales de desviación horizontal o vertical |

Cada detección queda registrada con una **marca de tiempo** y un **porcentaje de certeza** (0–100 %) que indica la confianza del modelo en esa detección concreta.

---

## 2. Niveles de severidad por señal

No todas las señales tienen el mismo peso. El sistema las clasifica en dos categorías:

### Señales críticas

Son indicadores graves por sí solos. **Un único evento de este tipo puede elevar significativamente la puntuación de riesgo**, independientemente de la duración del examen.

| Señal | Peso máximo | Por qué es crítica |
|-------|------------|--------------------|
| Persona diferente al registrado | 45 pts | Sugiere que otra persona completó el examen en lugar del estudiante |
| Uso de teléfono móvil | 38 pts | Indica consulta activa de recursos externos durante el examen |
| Varias personas en el encuadre | 30 pts | Sugiere asistencia de un tercero no autorizado |

### Señales de frecuencia

Son señales que se evalúan en relación con la duración del examen. Un evento aislado puede ser accidental; un patrón sostenido es indicativo de trampa.

| Señal | Peso base | Por qué importa la frecuencia |
|-------|-----------|-------------------------------|
| Cambio de pestaña | 22 pts | Consultar apuntes o buscadores en otra pestaña requiere cambiarla repetidamente |
| Estudiante ausente | 14 pts | Ausencias breves son normales; ausencias largas o repetidas sugieren evasión de la cámara |
| Pérdida de foco en la app | 10 pts | Poco significativo aislado; un patrón frecuente indica alternancia con otra aplicación |
| Mirada desviada | 6 pts | Desvíos ocasionales son normales; una frecuencia alta sugiere consulta de apuntes físicos |

---

## 3. Cómo se calcula la puntuación de riesgo (0–100)

La puntuación final combina tres componentes:

### 3.1 Componente crítico

Suma los puntos de las señales críticas (identidad, teléfono, múltiples personas) aplicando **rendimientos decrecientes**: cada evento adicional del mismo tipo contribuye progresivamente menos, para evitar que un fallo técnico repetido infle artificialmente el score.

| Ocurrencia | Peso aplicado |
|------------|--------------|
| 1.ª | 100 % del peso base |
| 2.ª | 65 % |
| 3.ª | 40 % |
| 4.ª en adelante | 25 % |

Este componente **no se normaliza por duración**: detectar un teléfono en el minuto 5 de un examen es igual de grave que en el minuto 55.

### 3.2 Componente de frecuencia

Suma los puntos de las señales de frecuencia (mirada, cambios de pestaña, ausencia, pérdida de foco) y los ajusta según la duración del examen. El punto de referencia es **30 minutos**:

- Examen de 15 min → los eventos pesan el doble (el factor de normalización sube hasta 2×)
- Examen de 60 min → los eventos pesan la mitad (el factor baja hasta ~0.5×)
- El factor está limitado entre 0.4× y 2× para evitar extremos

Este componente aporta **como máximo 40 puntos** al total, de modo que las señales de frecuencia nunca superan en relevancia a las críticas.

### 3.3 Bono por picos simultáneos

Cuando el sistema detecta **3 o más eventos en menos de 90 segundos**, considera que ese momento concentra comportamiento altamente sospechoso y añade hasta 18 puntos adicionales. Un pico simultáneo es más indicativo de trampa activa que eventos dispersos a lo largo del examen.

### 3.4 Caso especial: combinación crítica

Si en una misma sesión aparecen tanto una detección de teléfono como una de persona diferente, la puntuación tiene un **piso mínimo de 88/100**, ya que la coexistencia de ambas señales indica casi con certeza una situación fraudulenta grave.

---

## 4. Niveles de riesgo

| Puntuación | Nivel | Interpretación para el profesor |
|-----------|-------|----------------------------------|
| 0 – 22 | 🟢 **Bajo** | El comportamiento del estudiante no presentó señales significativas de trampa. No se requiere revisión adicional. |
| 23 – 48 | 🟡 **Medio** | Se detectaron irregularidades moderadas. Se recomienda revisar los eventos para confirmar si el comportamiento fue accidental o intencional. |
| 49 – 72 | 🟠 **Alto** | El estudiante mostró señales claras de comportamiento sospechoso. Se recomienda una revisión formal del caso. |
| 73 – 100 | 🔴 **Crítico** | Existen indicadores fuertes de trampa. Se recomienda intervención y verificación de identidad. |

---

## 5. Alertas generadas para el profesor

El reporte no solo muestra la puntuación: genera **alertas en lenguaje natural** que explican qué ocurrió, cuántas veces, y con qué nivel de certeza. Las alertas tienen su propio nivel de severidad:

| Severidad | Color | Cuándo se genera |
|-----------|-------|------------------|
| **Crítico** | Rojo | Teléfono detectado, persona diferente al registrado |
| **Alto** | Naranja | Varias personas, cambios frecuentes de pestaña (≥5 o ≥2 por cada 10 min), ausencias prolongadas, pico de eventos simultáneos |
| **Medio** | Amarillo | Pocos cambios de pestaña, pérdida de foco recurrente (≥3 eventos), mirada desviada con frecuencia moderada |

Las alertas se suprimen cuando el nivel es trivialmente bajo para **no generar falsas alarmas**. Por ejemplo, 1–2 pérdidas de foco no generan alerta, ni tampoco 1–2 desvíos de mirada aislados.

---

## 6. Picos de comportamiento simultáneo

Cuando el sistema detecta 3 o más eventos de cualquier tipo en una ventana de 90 segundos, lo marca como un **pico sospechoso**. El reporte muestra:

- La hora exacta del pico
- Cuántos eventos ocurrieron
- Qué tipos de señales se concentraron

Los picos son especialmente relevantes porque las personas que intentan copiar tienden a tener ráfagas de comportamiento anómalo (p. ej., mirar al costado mientras cambian de pestaña) en lugar de eventos dispersos y accidentales.

---

## 7. Certeza de detección

Cada evento registrado incluye un porcentaje de certeza que refleja la confianza del modelo de visión computacional:

| Señal | Cómo se calcula la certeza |
|-------|---------------------------|
| Mirada desviada | Escala entre 60 % (en el umbral) y 98 % (desviación extrema) |
| Persona diferente | `1 − similitud_coseno` entre el embedding registrado y el detectado |
| Teléfono | Confianza directa del detector de objetos (EfficientDet-Lite0) |
| Múltiples personas / ausencia | Basada en la confianza del detector de rostros (BlazeFace) |
| Cambio de pestaña / pérdida de foco | 100 % (eventos de navegador determinísticos) |

La certeza influye en el peso que tiene cada evento en la puntuación: una detección al 95 % pesa más que una al 65 % del mismo tipo.

---

## 8. Limitaciones del sistema

El sistema es una **herramienta de apoyo**, no un juez. Existen situaciones legítimas que pueden generar falsos positivos:

- Un estudiante que necesita beber agua puede alejarse brevemente de la cámara
- Ajustar lentes o rascarse puede desviar la mirada momentáneamente
- Cambiar de pestaña puede ocurrir accidentalmente
- Cámaras de baja resolución pueden dificultar la verificación de identidad
- Iluminación deficiente puede generar errores en la detección facial

Por eso el reporte siempre incluye las marcas de tiempo y las capturas de pantalla disponibles: **la decisión final corresponde al profesor**, quien puede contrastar los datos con el contexto del examen.

---

## 9. Resumen rápido

```
Puntuación = Señales críticas (hasta ~100 pts, con rendimientos decrecientes)
           + Señales de frecuencia (máx. 40 pts, normalizado por duración)
           + Bono por picos simultáneos (máx. 18 pts)
           → Limitado a 100

Si identidad_diferente AND teléfono → mínimo 88/100
```

> El reporte está diseñado para que el profesor identifique rápidamente si vale la pena investigar un caso, y para que las alertas describan el comportamiento en términos claros, no en datos técnicos.
