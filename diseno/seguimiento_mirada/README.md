# Seguimiento de Mirada

## Explicación del tema

El seguimiento de mirada consiste en estimar la dirección hacia la que los ojos de
una persona están apuntando. En un examen en línea, la mirada del estudiante debería
concentrarse en la pantalla. Desviaciones frecuentes o prolongadas hacia los lados,
hacia abajo o fuera del encuadre pueden indicar consulta de materiales externos o
comunicación no autorizada.

## Comportamientos a detectar

- Mirada sostenida fuera de la pantalla por más de N segundos.
- Movimientos oculares bruscos o repetitivos hacia la misma dirección.
- Cierre prolongado de ojos (posible lectura en otro soporte).

## Tecnologías y enfoques considerados

- **MediaPipe Face Mesh**: provee 468 landmarks faciales incluyendo los iris,
  lo que permite estimar la dirección de la mirada sin hardware especializado.
- **GazeTracking (librería Python)**: abstracción de alto nivel sobre dlib para
  clasificar la mirada en izquierda, derecha, centrada.
- **L2CS-Net**: modelo de deep learning para estimación precisa de gaze en grados.

## Enlaces relevantes

- [MediaPipe Face Mesh](https://developers.google.com/mediapipe/solutions/vision/face_landmarker)
- [GazeTracking GitHub](https://github.com/antoinelame/GazeTracking)
- [L2CS-Net Paper](https://arxiv.org/abs/2203.03339)