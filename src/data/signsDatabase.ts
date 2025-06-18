
import { Sign } from "@/types/sign";

export const signsDatabase: Sign[] = [
  {
    id: "1",
    name: "Amor",
    description: "Gesto de amor con las manos en forma de corazón",
    confidence: 0.95,
    createdAt: new Date("2024-01-01"),
    videoUrl: "https://images.unsplash.com/photo-1618160702438-9b02ab6515c9?w=300&h=200&fit=crop",
    landmarks: [[0.5, 0.3], [0.6, 0.4], [0.4, 0.2]]
  },
  {
    id: "2",
    name: "Paz",
    description: "Signo de paz con dos dedos en V",
    confidence: 0.92,
    createdAt: new Date("2024-01-02"),
    videoUrl: "https://images.unsplash.com/photo-1582562124811-c09040d0a901?w=300&h=200&fit=crop",
    landmarks: [[0.3, 0.5], [0.7, 0.3], [0.5, 0.6]]
  },
  {
    id: "3",
    name: "Hola",
    description: "Saludo básico en lenguaje de señas",
    confidence: 0.90,
    createdAt: new Date("2024-01-03"),
    videoUrl: "https://images.unsplash.com/photo-1500673922987-e212871fec22?w=300&h=200&fit=crop",
    landmarks: [[0.4, 0.4], [0.6, 0.5], [0.5, 0.3]]
  },
  {
    id: "4",
    name: "Gracias",
    description: "Expresión de agradecimiento",
    confidence: 0.88,
    createdAt: new Date("2024-01-04"),
    videoUrl: "https://images.unsplash.com/photo-1465146344425-f00d5f5c8f07?w=300&h=200&fit=crop",
    landmarks: [[0.2, 0.6], [0.8, 0.4], [0.5, 0.7]]
  },
  {
    id: "5",
    name: "Adiós",
    description: "Despedida",
    confidence: 0.85,
    createdAt: new Date("2024-01-05"),
    videoUrl: "https://images.unsplash.com/photo-1618160702438-9b02ab6515c9?w=300&h=200&fit=crop",
    landmarks: [[0.5, 0.2], [0.3, 0.8], [0.7, 0.5]]
  }
];
