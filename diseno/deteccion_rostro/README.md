# Detección de Rostro

## Explicación del tema

La detección de rostro consiste en identificar automáticamente la presencia, ausencia
o multiplicidad de rostros humanos dentro de un fotograma de video. En el contexto de
exámenes en línea, este módulo permite verificar que solo el estudiante registrado
esté presente frente a la cámara, detectar cuando el estudiante abandona el encuadre
y alertar si aparece una segunda persona en la escena.

## Tecnologías y enfoques considerados

- **OpenCV + Haar Cascades**: método clásico, rápido, bajo consumo computacional.
- **MediaPipe Face Detection**: solución de Google, precisa y optimizada para tiempo real.
- **face_recognition (dlib)**: permite identificación de identidad, no solo presencia.

## Casos de uso en el proyecto

- Estudiante sale del encuadre más de N segundos: evento sospechoso.
- Se detecta más de un rostro en el frame: alerta inmediata.
- No se detecta ningún rostro en el frame: alerta de ausencia.

## Enlaces relevantes

- [MediaPipe Face Detection](https://developers.google.com/mediapipe/solutions/vision/face_detector)
- [OpenCV Face Detection Tutorial](https://docs.opencv.org/4.x/db/d28/tutorial_cascade_classifier.html)
- [face_recognition library](https://github.com/ageitgey/face_recognition)

## Código de prueba
```python
import cv2

# Para obtener un clasificador preentrenado
face_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_frontalface_default.xml')

cap = cv2.VideoCapture(0)

while True:
    ret, frame = cap.read()
    gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
    faces = face_cascade.detectMultiScale(gray, scaleFactor=1.1, minNeighbors=5)

    cantidad = len(faces)

    if cantidad == 0:
        print("Alerta: no se detecta ningún rostro")
    elif cantidad > 1:
        print(f"Alerta: se detectaron {cantidad} rostros en el encuadre")

    for (x, y, w, h) in faces:
        cv2.rectangle(frame, (x, y), (x+w, y+h), (0, 255, 0), 2)

    cv2.imshow('Detección de Rostro', frame)
    if cv2.waitKey(1) & 0xFF == ord('q'):
        break

cap.release()
cv2.destroyAllWindows()
```