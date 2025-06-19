
import { useCallback } from 'react';

export const useFeverDetection = () => {
  
  // Detectar seña de fiebre basada en la imagen proporcionada
  const detectFeverSign = useCallback((landmarks: number[][]) => {
    if (!landmarks || landmarks.length < 21) return { detected: false, confidence: 0 };
    
    // Puntos clave según imagen de fiebre
    const thumb = landmarks[4];      // Pulgar
    const index = landmarks[8];      // Índice
    const middle = landmarks[12];    // Medio
    const ring = landmarks[16];      // Anular
    const pinky = landmarks[20];     // Meñique
    const wrist = landmarks[0];      // Muñeca
    
    // Calcular distancias
    const thumbIndexDistance = Math.sqrt(
      Math.pow(thumb[0] - index[0], 2) + Math.pow(thumb[1] - index[1], 2)
    );
    
    // Verificar que pulgar e índice estén juntos (como termómetro)
    const thumbIndexClose = thumbIndexDistance < 40;
    
    // Verificar que otros dedos estén extendidos hacia arriba
    const middleUp = middle[1] < wrist[1] - 20;
    const ringUp = ring[1] < wrist[1] - 20;
    const pinkyUp = pinky[1] < wrist[1] - 20;
    
    // Verificar orientación correcta (mano vertical)
    const handVertical = Math.abs(wrist[0] - middle[0]) < 50;
    
    // Calcular confianza
    let confidence = 0;
    if (thumbIndexClose) confidence += 0.3;
    if (middleUp) confidence += 0.2;
    if (ringUp) confidence += 0.2;
    if (pinkyUp) confidence += 0.2;
    if (handVertical) confidence += 0.1;
    
    const detected = confidence > 0.8;
    
    return { detected, confidence };
  }, []);
  
  return { detectFeverSign };
};
