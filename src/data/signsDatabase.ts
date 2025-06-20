
import { Sign } from "@/types/sign";

export const signsDatabase: Sign[] = [
  {
    id: "1",
    name: "Amor",
    description: "Gesto de amor con las manos en forma de corazón",
    confidence: 0.95,
    createdAt: new Date("2024-01-01"),
    videoUrl: "https://images.unsplash.com/photo-1582655122993-6137c6b62d83?w=300&h=200&fit=crop",
    landmarks: [
      // Frame 1
      [[0.5, 0.3, 0], [0.6, 0.4, 0], [0.4, 0.2, 0]],
      // Frame 2  
      [[0.51, 0.31, 0], [0.61, 0.41, 0], [0.41, 0.21, 0]]
    ]
  },
  {
    id: "2",
    name: "Paz",
    description: "Signo de paz con dos dedos en V",
    confidence: 0.92,
    createdAt: new Date("2024-01-02"),
    videoUrl: "https://images.unsplash.com/photo-1493962853295-0fd70327578a?w=300&h=200&fit=crop",
    landmarks: [
      // Frame 1
      [[0.3, 0.5, 0], [0.7, 0.3, 0], [0.5, 0.6, 0]],
      // Frame 2
      [[0.31, 0.51, 0], [0.71, 0.31, 0], [0.51, 0.61, 0]]
    ]
  },
  {
    id: "3",
    name: "OK",
    description: "Gesto de OK con pulgar e índice formando un círculo",
    confidence: 0.90,
    createdAt: new Date("2024-01-03"),
    videoUrl: "/lovable-uploads/58762ba3-297e-4b63-8b59-152746e63c01.png",
    landmarks: [
      // Frame 1
      [[0.4, 0.4, 0], [0.6, 0.5, 0], [0.5, 0.3, 0]],
      // Frame 2
      [[0.41, 0.41, 0], [0.61, 0.51, 0], [0.51, 0.31, 0]]
    ]
  },
  {
    id: "4",
    name: "Hola",
    description: "Saludo básico en lenguaje de señas con mano abierta",
    confidence: 0.90,
    createdAt: new Date("2024-01-04"),
    videoUrl: "https://images.unsplash.com/photo-1618160702438-9b02ab6515c9?w=300&h=200&fit=crop",
    landmarks: [
      // Frame 1
      [[0.4, 0.4, 0], [0.6, 0.5, 0], [0.5, 0.3, 0]],
      // Frame 2
      [[0.42, 0.42, 0], [0.62, 0.52, 0], [0.52, 0.32, 0]]
    ]
  },
  {
    id: "5",
    name: "Gracias",
    description: "Expresión de agradecimiento con mano al pecho",
    confidence: 0.88,
    createdAt: new Date("2024-01-05"),
    videoUrl: "https://images.unsplash.com/photo-1501286353178-1ec881214838?w=300&h=200&fit=crop",
    landmarks: [
      // Frame 1
      [[0.2, 0.6, 0], [0.8, 0.4, 0], [0.5, 0.7, 0]],
      // Frame 2
      [[0.21, 0.61, 0], [0.81, 0.41, 0], [0.51, 0.71, 0]]
    ]
  },
  {
    id: "6",
    name: "Adiós",
    description: "Despedida con movimiento de mano",
    confidence: 0.85,
    createdAt: new Date("2024-01-06"),
    videoUrl: "https://images.unsplash.com/photo-1582655122993-6137c6b62d83?w=300&h=200&fit=crop",
    landmarks: [
      // Frame 1
      [[0.5, 0.2, 0], [0.3, 0.8, 0], [0.7, 0.5, 0]],
      // Frame 2
      [[0.52, 0.22, 0], [0.32, 0.82, 0], [0.72, 0.52, 0]]
    ]
  },
  {
    id: "7",
    name: "Fiebre Alta",
    description: "Seña de fiebre alta con posición específica de dedos y palma",
    confidence: 0.92,
    createdAt: new Date("2024-01-07"),
    videoUrl: "/lovable-uploads/36a792af-b09b-4ed4-b765-145a54512338.png",
    landmarks: [
      // Frame 1
      [[0.3, 0.4, 0], [0.7, 0.3, 0], [0.5, 0.6, 0], [0.4, 0.7, 0], [0.6, 0.8, 0]],
      // Frame 2
      [[0.31, 0.41, 0], [0.71, 0.31, 0], [0.51, 0.61, 0], [0.41, 0.71, 0], [0.61, 0.81, 0]]
    ]
  }
];
