
import { Sign } from "@/types/sign";

export const signsDatabase: Sign[] = [
  {
    id: "1",
    name: "Amor",
    description: "Gesto de amor con las manos en forma de corazón",
    confidence: 0.95,
    createdAt: new Date("2024-01-01"),
    videoUrl: "https://images.unsplash.com/photo-1582655122993-6137c6b62d83?w=300&h=200&fit=crop",
    landmarks: [[0.5, 0.3], [0.6, 0.4], [0.4, 0.2]]
  },
  {
    id: "2",
    name: "Paz",
    description: "Signo de paz con dos dedos en V",
    confidence: 0.92,
    createdAt: new Date("2024-01-02"),
    videoUrl: "https://images.unsplash.com/photo-1493962853295-0fd70327578a?w=300&h=200&fit=crop",
    landmarks: [[0.3, 0.5], [0.7, 0.3], [0.5, 0.6]]
  },
  {
    id: "3",
    name: "OK",
    description: "Gesto de OK con pulgar e índice formando un círculo",
    confidence: 0.90,
    createdAt: new Date("2024-01-03"),
    videoUrl: "/lovable-uploads/58762ba3-297e-4b63-8b59-152746e63c01.png",
    landmarks: [[0.4, 0.4], [0.6, 0.5], [0.5, 0.3]]
  },
  {
    id: "4",
    name: "Hola",
    description: "Saludo básico en lenguaje de señas con mano abierta",
    confidence: 0.90,
    createdAt: new Date("2024-01-04"),
    videoUrl: "https://images.unsplash.com/photo-1618160702438-9b02ab6515c9?w=300&h=200&fit=crop",
    landmarks: [[0.4, 0.4], [0.6, 0.5], [0.5, 0.3]]
  },
  {
    id: "5",
    name: "Gracias",
    description: "Expresión de agradecimiento con mano al pecho",
    confidence: 0.88,
    createdAt: new Date("2024-01-05"),
    videoUrl: "https://images.unsplash.com/photo-1501286353178-1ec881214838?w=300&h=200&fit=crop",
    landmarks: [[0.2, 0.6], [0.8, 0.4], [0.5, 0.7]]
  },
  {
    id: "6",
    name: "Adiós",
    description: "Despedida con movimiento de mano",
    confidence: 0.85,
    createdAt: new Date("2024-01-06"),
    videoUrl: "https://images.unsplash.com/photo-1582655122993-6137c6b62d83?w=300&h=200&fit=crop",
    landmarks: [[0.5, 0.2], [0.3, 0.8], [0.7, 0.5]]
  }
];
