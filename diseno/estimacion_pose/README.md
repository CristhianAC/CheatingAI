# Estimación de Pose Corporal

## Explicación del tema

La estimación de pose corporal es el proceso de detectar y rastrear los puntos clave
del cuerpo humano (hombros, codos, muñecas, cabeza, etc.) en tiempo real a partir de
imágenes o video. En el contexto de exámenes en línea, permite identificar movimientos
corporales que podrían indicar consulta de materiales no autorizados o comunicación
con terceros.

## Comportamientos a detectar

- Giro del torso o cabeza hacia los lados de forma repetida.
- Movimiento de manos fuera del encuadre (debajo del escritorio).
- Postura de cabeza inclinada hacia abajo de forma prolongada (posible lectura de apuntes).

## Tecnologías y enfoques considerados

- **MediaPipe Pose**: detecta 33 puntos del cuerpo en tiempo real, funciona en CPU.
- **OpenPose (CMU)**: muy preciso pero requiere GPU para tiempo real.
- **MoveNet (TensorFlow Lite)**: ligero, ideal para dispositivos con recursos limitados.

## Enlaces relevantes

- [MediaPipe Pose](https://developers.google.com/mediapipe/solutions/vision/pose_landmarker)
- [MoveNet en TensorFlow Hub](https://www.tensorflow.org/hub/tutorials/movenet)

## Código de prueba
```python
import cv2
import mediapipe as mp
from mediapipe.tasks import python
from mediapipe.tasks.python import vision
import numpy as np
import urllib.request
import os

model_path = "pose_landmarker_lite.task"
if not os.path.exists(model_path):
    urllib.request.urlretrieve(
        "https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/latest/pose_landmarker_lite.task",
        model_path
    )
    print("Modelo descargado")

base_options = python.BaseOptions(model_asset_path=model_path)
options = vision.PoseLandmarkerOptions(
    base_options=base_options,
    output_segmentation_masks=False
)

cap = cv2.VideoCapture(0)

with vision.PoseLandmarker.create_from_options(options) as landmarker:
    while cap.isOpened():
        ret, frame = cap.read()
        if not ret:
            break

        rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        mp_image = mp.Image(image_format=mp.ImageFormat.SRGB, data=rgb_frame)

        results = landmarker.detect(mp_image)

        if results.pose_landmarks:
            for landmarks in results.pose_landmarks:
                h, w, _ = frame.shape
                
                for landmark in landmarks:
                    cx = int(landmark.x * w)
                    cy = int(landmark.y * h)
                    cv2.circle(frame, (cx, cy), 5, (0, 255, 0), -1)

                
                connections = mp.solutions.pose.POSE_CONNECTIONS if hasattr(mp, 'solutions') else []
                for connection in vision.PoseLandmarker.POSE_CONNECTIONS if hasattr(vision.PoseLandmarker, 'POSE_CONNECTIONS') else []:
                    start = connection[0]
                    end = connection[1]
                    x1 = int(landmarks[start].x * w)
                    y1 = int(landmarks[start].y * h)
                    x2 = int(landmarks[end].x * w)
                    y2 = int(landmarks[end].y * h)
                    cv2.line(frame, (x1, y1), (x2, y2), (0, 255, 255), 2)

        cv2.imshow('Estimación de Pose', frame)
        if cv2.waitKey(10) & 0xFF == ord('q'):
            break

cap.release()
cv2.destroyAllWindows()
```