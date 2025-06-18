
import { Sign } from "@/types/sign";

export const signsDatabase: Sign[] = [
  {
    id: "1",
    name: "Amor",
    description: "Gesto de amor con las manos en forma de corazón",
    confidence: 0.95,
    createdAt: new Date("2024-01-01"),
    landmarks: [[0.5, 0.3], [0.6, 0.4], [0.4, 0.2]]
  },
  {
    id: "2",
    name: "Paz",
    description: "Signo de paz con dos dedos en V",
    confidence: 0.92,
    createdAt: new Date("2024-01-02"),
    landmarks: [[0.3, 0.5], [0.7, 0.3], [0.5, 0.6]]
  },
  {
    id: "3",
    name: "Hola",
    description: "Saludo básico en lenguaje de señas",
    confidence: 0.90,
    createdAt: new Date("2024-01-03"),
    landmarks: [[0.4, 0.4], [0.6, 0.5], [0.5, 0.3]]
  },
  {
    id: "4",
    name: "Gracias",
    description: "Expresión de agradecimiento",
    confidence: 0.88,
    createdAt: new Date("2024-01-04"),
    landmarks: [[0.2, 0.6], [0.8, 0.4], [0.5, 0.7]]
  },
  {
    id: "5",
    name: "Adiós",
    description: "Despedida",
    confidence: 0.85,
    createdAt: new Date("2024-01-05"),
    landmarks: [[0.5, 0.2], [0.3, 0.8], [0.7, 0.5]]
  }
];
