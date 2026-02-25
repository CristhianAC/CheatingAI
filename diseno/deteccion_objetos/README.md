# Detección de Objetos Sospechosos

## Explicación del tema

La detección de objetos consiste en identificar y localizar elementos específicos
dentro de una imagen o video. En el contexto de exámenes en línea, el objetivo es
detectar la presencia de objetos que no deberían estar visibles durante la evaluación,
como teléfonos móviles, papeles escritos, libros o auriculares.

## Objetos de interés

- Teléfono móvil (uso para buscar respuestas o comunicarse).
- Auriculares o audífonos (posible comunicación con terceros).
- Papeles o cuadernos (consulta de apuntes).
- Segunda pantalla fuera del encuadre principal.

## Tecnologías y enfoques considerados

- **YOLOv8 (Ultralytics)**: estado del arte en detección en tiempo real,
  balance entre velocidad y precisión. Detecta celulares y auriculares
  nativamente en su versión preentrenada con COCO.
- **TensorFlow Object Detection API**: más verboso pero flexible para
  entrenar modelos personalizados.
- **Roboflow**: plataforma para anotar datasets y entrenar modelos personalizados
  si los objetos no están en datasets estándar.

## Enlaces relevantes

- [YOLOv8 - Ultralytics](https://docs.ultralytics.com/)
- [COCO Dataset - clases disponibles](https://cocodataset.org/#explore)
- [Roboflow para datasets personalizados](https://roboflow.com/)

## Código de prueba
```python 
from ultralytics import YOLO
import cv2

model = YOLO('yolov8n.pt')

OBJETOS_SOSPECHOSOS = ['cell phone', 'book', 'remote', 'earphones']

cap = cv2.VideoCapture(0)

while True:
    ret, frame = cap.read()
    results = model(frame, verbose=False)

    for result in results:
        for box in result.boxes:
            clase = result.names[int(box.cls)]
            confianza = float(box.conf)

            if clase in OBJETOS_SOSPECHOSOS and confianza > 0.5:
                print(f"Alerta: objeto sospechoso detectado -> {clase} ({confianza:.2f})")
                x1, y1, x2, y2 = map(int, box.xyxy[0])
                cv2.rectangle(frame, (x1, y1), (x2, y2), (0, 0, 255), 2)
                cv2.putText(frame, clase, (x1, y1 - 10),
                            cv2.FONT_HERSHEY_SIMPLEX, 0.8, (0, 0, 255), 2)

    cv2.imshow('Detección de Objetos', frame)
    if cv2.waitKey(1) & 0xFF == ord('q'):
        break

cap.release()
cv2.destroyAllWindows()
```