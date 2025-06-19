
import { useCallback } from 'react';

// Patrones mejorados basados en análisis geométrico de la imagen
export const useCustomSignDetection = () => {
  
  const detectCustomSign = useCallback((landmarks: number[][]) => {
    if (!landmarks || landmarks.length < 21) return { detected: false, confidence: 0, signName: '' };
    
    // Puntos clave para análisis más preciso
    const thumb = landmarks[4];      // Pulgar
    const index = landmarks[8];      // Índice  
    const middle = landmarks[12];    // Medio
    const ring = landmarks[16];      // Anular
    const pinky = landmarks[20];     // Meñique
    const wrist = landmarks[0];      // Muñeca
    const thumbBase = landmarks[2];  // Base del pulgar
    const indexBase = landmarks[5];  // Base del índice
    
    // Detectar seña "OK" con geometría mejorada
    const okResult = detectOKSignAdvanced(landmarks);
    if (okResult.confidence > 0.65) {
      return { detected: true, confidence: okResult.confidence, signName: 'OK' };
    }
    
    // Detectar seña de "Amor" con análisis de forma
    const loveResult = detectLoveSignAdvanced(landmarks);
    if (loveResult.confidence > 0.6) {
      return { detected: true, confidence: loveResult.confidence, signName: 'Amor' };
    }
    
    // Detectar seña de "Paz" con verificación de ángulos
    const peaceResult = detectPeaceSignAdvanced(landmarks);
    if (peaceResult.confidence > 0.7) {
      return { detected: true, confidence: peaceResult.confidence, signName: 'Paz' };
    }
    
    return { detected: false, confidence: 0, signName: '' };
  }, []);
  
  const detectOKSignAdvanced = useCallback((landmarks: number[][]) => {
    const thumb = landmarks[4];
    const index = landmarks[8];
    const middle = landmarks[12];
    const ring = landmarks[16];
    const pinky = landmarks[20];
    const wrist = landmarks[0];
    
    // Calcular distancia del círculo OK
    const thumbIndexDistance = Math.sqrt(
      Math.pow(thumb[0] - index[0], 2) + Math.pow(thumb[1] - index[1], 2)
    );
    
    // Verificar círculo formado (ajustado según la imagen)
    const isCircleFormed = thumbIndexDistance < 60 && thumbIndexDistance > 15;
    
    // Verificar que otros dedos estén extendidos (más estricto)
    const middleExtended = middle[1] < wrist[1] - 40;
    const ringExtended = ring[1] < wrist[1] - 35;
    const pinkyExtended = pinky[1] < wrist[1] - 30;
    
    // Verificar orientación y posición de la mano
    const handOriented = Math.abs(wrist[1] - middle[1]) > 30;
    const properAngle = checkFingerAngles([middle, ring, pinky], wrist);
    
    // Calcular confianza con pesos ajustados
    let confidence = 0;
    if (isCircleFormed) confidence += 0.35;
    if (middleExtended) confidence += 0.25;
    if (ringExtended) confidence += 0.2;
    if (pinkyExtended) confidence += 0.15;
    if (handOriented && properAngle) confidence += 0.05;
    
    return { confidence };
  }, []);
  
  const detectLoveSignAdvanced = useCallback((landmarks: number[][]) => {
    const thumb = landmarks[4];
    const index = landmarks[8];
    const middle = landmarks[12];
    const ring = landmarks[16];
    const pinky = landmarks[20];
    const wrist = landmarks[0];
    
    // Verificar forma de corazón con más precisión
    const thumbIndexDistance = Math.sqrt(
      Math.pow(thumb[0] - index[0], 2) + Math.pow(thumb[1] - index[1], 2)
    );
    
    const middleRingDistance = Math.sqrt(
      Math.pow(middle[0] - ring[0], 2) + Math.pow(middle[1] - ring[1], 2)
    );
    
    // Verificar que los dedos formen la parte superior del corazón
    const thumbIndexClose = thumbIndexDistance < 80 && thumbIndexDistance > 20;
    const middleRingClose = middleRingDistance < 50;
    
    // Verificar posición relativa para forma de corazón
    const heartShape = checkHeartFormation([thumb, index, middle, ring]);
    const properOrientation = middle[1] < wrist[1] - 20 && ring[1] < wrist[1] - 20;
    
    let confidence = 0;
    if (thumbIndexClose) confidence += 0.3;
    if (middleRingClose) confidence += 0.25;
    if (heartShape) confidence += 0.3;
    if (properOrientation) confidence += 0.15;
    
    return { confidence };
  }, []);
  
  const detectPeaceSignAdvanced = useCallback((landmarks: number[][]) => {
    const index = landmarks[8];
    const middle = landmarks[12];
    const ring = landmarks[16];
    const pinky = landmarks[20];
    const wrist = landmarks[0];
    const thumb = landmarks[4];
    
    // Verificar V con análisis de ángulos
    const indexUp = index[1] < wrist[1] - 60;
    const middleUp = middle[1] < wrist[1] - 60;
    const ringDown = ring[1] > wrist[1] - 30;
    const pinkyDown = pinky[1] > wrist[1] - 30;
    const thumbTucked = thumb[1] > wrist[1] - 20;
    
    // Verificar separación entre índice y medio (V)
    const fingerSeparation = Math.abs(index[0] - middle[0]);
    const properV = fingerSeparation > 30 && fingerSeparation < 100;
    
    // Verificar ángulo de la V
    const vAngle = calculateVAngle(index, middle, wrist);
    const goodAngle = vAngle > 15 && vAngle < 60;
    
    let confidence = 0;
    if (indexUp) confidence += 0.25;
    if (middleUp) confidence += 0.25;
    if (ringDown) confidence += 0.15;
    if (pinkyDown) confidence += 0.15;
    if (properV && goodAngle) confidence += 0.2;
    
    return { confidence };
  }, []);
  
  // Funciones auxiliares para análisis geométrico
  const checkFingerAngles = useCallback((fingers: number[][], wrist: number[]) => {
    return fingers.every(finger => {
      const angle = Math.atan2(finger[1] - wrist[1], finger[0] - wrist[0]);
      return Math.abs(angle) < Math.PI / 3; // Ángulo razonable
    });
  }, []);
  
  const checkHeartFormation = useCallback((points: number[][]) => {
    // Verificar si los puntos forman una configuración similar a un corazón
    const [thumb, index, middle, ring] = points;
    const centerX = (thumb[0] + index[0] + middle[0] + ring[0]) / 4;
    const centerY = (thumb[1] + index[1] + middle[1] + ring[1]) / 4;
    
    // Los puntos superiores deben estar cerca del centro
    const thumbDistFromCenter = Math.sqrt(Math.pow(thumb[0] - centerX, 2) + Math.pow(thumb[1] - centerY, 2));
    const indexDistFromCenter = Math.sqrt(Math.pow(index[0] - centerX, 2) + Math.pow(index[1] - centerY, 2));
    
    return thumbDistFromCenter < 50 && indexDistFromCenter < 50;
  }, []);
  
  const calculateVAngle = useCallback((index: number[], middle: number[], wrist: number[]) => {
    const vector1 = [index[0] - wrist[0], index[1] - wrist[1]];
    const vector2 = [middle[0] - wrist[0], middle[1] - wrist[1]];
    
    const dot = vector1[0] * vector2[0] + vector1[1] * vector2[1];
    const mag1 = Math.sqrt(vector1[0] * vector1[0] + vector1[1] * vector1[1]);
    const mag2 = Math.sqrt(vector2[0] * vector2[0] + vector2[1] * vector2[1]);
    
    const angle = Math.acos(dot / (mag1 * mag2)) * (180 / Math.PI);
    return angle;
  }, []);
  
  return { detectCustomSign };
};
