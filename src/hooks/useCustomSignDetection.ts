
import { useCallback } from 'react';

// Patrones basados en la imagen subida - seña "OK" con ambas manos
export const useCustomSignDetection = () => {
  
  const detectCustomSign = useCallback((landmarks: number[][]) => {
    if (!landmarks || landmarks.length < 21) return { detected: false, confidence: 0, signName: '' };
    
    // Puntos clave para la seña de la imagen
    const thumb = landmarks[4];      // Pulgar
    const index = landmarks[8];      // Índice  
    const middle = landmarks[12];    // Medio
    const ring = landmarks[16];      // Anular
    const pinky = landmarks[20];     // Meñique
    const wrist = landmarks[0];      // Muñeca
    
    // Detectar seña "OK" - círculo con pulgar e índice
    const thumbIndexDistance = Math.sqrt(
      Math.pow(thumb[0] - index[0], 2) + Math.pow(thumb[1] - index[1], 2)
    );
    
    // Verificar círculo formado (distancia pequeña entre pulgar e índice)
    const isCircleFormed = thumbIndexDistance < 50;
    
    // Verificar que otros dedos estén extendidos
    const middleExtended = middle[1] < wrist[1] - 30;
    const ringExtended = ring[1] < wrist[1] - 30;
    const pinkyExtended = pinky[1] < wrist[1] - 30;
    
    // Verificar orientación de la mano (vertical u horizontal)
    const handOriented = Math.abs(wrist[1] - middle[1]) > 20;
    
    // Calcular confianza para seña OK
    let okConfidence = 0;
    if (isCircleFormed) okConfidence += 0.4;
    if (middleExtended) okConfidence += 0.2;
    if (ringExtended) okConfidence += 0.2;
    if (pinkyExtended) okConfidence += 0.1;
    if (handOriented) okConfidence += 0.1;
    
    const okDetected = okConfidence > 0.7;
    
    if (okDetected) {
      return { detected: true, confidence: okConfidence, signName: 'OK' };
    }
    
    // Detectar seña de "Amor" - corazón con ambas manos
    const loveSignConfidence = detectLoveSign(landmarks);
    if (loveSignConfidence > 0.6) {
      return { detected: true, confidence: loveSignConfidence, signName: 'Amor' };
    }
    
    // Detectar seña de "Paz" - V con dedos
    const peaceSignConfidence = detectPeaceSign(landmarks);
    if (peaceSignConfidence > 0.7) {
      return { detected: true, confidence: peaceSignConfidence, signName: 'Paz' };
    }
    
    return { detected: false, confidence: 0, signName: '' };
  }, []);
  
  const detectLoveSign = useCallback((landmarks: number[][]) => {
    const thumb = landmarks[4];
    const index = landmarks[8];
    const middle = landmarks[12];
    const ring = landmarks[16];
    const pinky = landmarks[20];
    
    // Verificar posición de corazón
    const thumbIndexClose = Math.sqrt(
      Math.pow(thumb[0] - index[0], 2) + Math.pow(thumb[1] - index[1], 2)
    ) < 60;
    
    const middleRingClose = Math.sqrt(
      Math.pow(middle[0] - ring[0], 2) + Math.pow(middle[1] - ring[1], 2)
    ) < 40;
    
    let confidence = 0;
    if (thumbIndexClose) confidence += 0.3;
    if (middleRingClose) confidence += 0.3;
    
    return confidence;
  }, []);
  
  const detectPeaceSign = useCallback((landmarks: number[][]) => {
    const index = landmarks[8];
    const middle = landmarks[12];
    const ring = landmarks[16];
    const pinky = landmarks[20];
    const wrist = landmarks[0];
    
    // Verificar V con índice y medio
    const indexUp = index[1] < wrist[1] - 50;
    const middleUp = middle[1] < wrist[1] - 50;
    const ringDown = ring[1] > wrist[1] - 20;
    const pinkyDown = pinky[1] > wrist[1] - 20;
    
    let confidence = 0;
    if (indexUp) confidence += 0.3;
    if (middleUp) confidence += 0.3;
    if (ringDown) confidence += 0.2;
    if (pinkyDown) confidence += 0.2;
    
    return confidence;
  }, []);
  
  return { detectCustomSign };
};
