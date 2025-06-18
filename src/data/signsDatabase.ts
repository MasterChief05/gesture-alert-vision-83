
import { Sign } from "@/types/sign";

export const signsDatabase: Sign[] = [
  {
    id: "1",
    name: "Hola",
    description: "Saludo básico en lenguaje de señas",
    confidence: 0.95,
    createdAt: new Date("2024-01-01"),
    landmarks: [[0.5, 0.3], [0.6, 0.4], [0.4, 0.2]] // Simulado
  },
  {
    id: "2",
    name: "Gracias",
    description: "Expresión de agradecimiento",
    confidence: 0.90,
    createdAt: new Date("2024-01-02"),
    landmarks: [[0.3, 0.5], [0.7, 0.3], [0.5, 0.6]]
  },
  {
    id: "3",
    name: "Por favor",
    description: "Solicitud cortés",
    confidence: 0.88,
    createdAt: new Date("2024-01-03"),
    landmarks: [[0.4, 0.4], [0.6, 0.5], [0.5, 0.3]]
  },
  {
    id: "4",
    name: "Adiós",
    description: "Despedida",
    confidence: 0.92,
    createdAt: new Date("2024-01-04"),
    landmarks: [[0.2, 0.6], [0.8, 0.4], [0.5, 0.7]]
  },
  {
    id: "5",
    name: "Sí",
    description: "Confirmación positiva",
    confidence: 0.87,
    createdAt: new Date("2024-01-05"),
    landmarks: [[0.5, 0.2], [0.3, 0.8], [0.7, 0.5]]
  }
];
