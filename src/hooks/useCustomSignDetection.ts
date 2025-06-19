
import { useCallback } from 'react';

// Detección mejorada con logs detallados para debugging
export const useCustomSignDetection = () => {
  
  const detectCustomSign = useCallback((landmarks: number[][]) => {
    if (!landmarks || landmarks.length < 21) {
      console.log('❌ No hay suficientes landmarks:', landmarks?.length);
      return { detected: false, confidence: 0, signName: '' };
    }
    
    console.log('🔍 Analizando landmarks:', landmarks.length, 'puntos');
    
    // Detectar seña "OK" 
    const okResult = detectOKSignAdvanced(landmarks);
    console.log('👌 Resultado OK:', okResult);
    if (okResult.confidence > 0.6) {
      return { detected: true, confidence: okResult.confidence, signName: 'OK' };
    }
    
    // Detectar seña de "Paz" (V con dos dedos)
    const peaceResult = detectPeaceSignAdvanced(landmarks);
    console.log('✌️ Resultado Paz:', peaceResult);
    if (peaceResult.confidence > 0.65) {
      return { detected: true, confidence: peaceResult.confidence, signName: 'Paz' };
    }
    
    // Detectar seña de "Amor" (corazón con las manos)
    const loveResult = detectLoveSignAdvanced(landmarks);
    console.log('💖 Resultado Amor:', loveResult);
    if (loveResult.confidence > 0.55) {
      return { detected: true, confidence: loveResult.confidence, signName: 'Amor' };
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
    
    // Distancia entre pulgar e índice (círculo OK)
    const thumbIndexDistance = Math.sqrt(
      Math.pow(thumb[0] - index[0], 2) + Math.pow(thumb[1] - index[1], 2)
    );
    
    // Verificar círculo formado
    const isCircleFormed = thumbIndexDistance < 50 && thumbIndexDistance > 10;
    
    // Verificar que otros dedos estén extendidos
    const middleExtended = middle[1] < wrist[1] - 30;
    const ringExtended = ring[1] < wrist[1] - 25;
    const pinkyExtended = pinky[1] < wrist[1] - 20;
    
    let confidence = 0;
    if (isCircleFormed) confidence += 0.4;
    if (middleExtended) confidence += 0.25;
    if (ringExtended) confidence += 0.2;
    if (pinkyExtended) confidence += 0.15;
    
    console.log('👌 OK - Círculo:', isCircleFormed, 'Dist:', thumbIndexDistance.toFixed(1), 
               'Dedos ext:', middleExtended, ringExtended, pinkyExtended, 'Conf:', confidence);
    
    return { confidence };
  }, []);
  
  const detectPeaceSignAdvanced = useCallback((landmarks: number[][]) => {
    const index = landmarks[8];
    const middle = landmarks[12];
    const ring = landmarks[16];
    const pinky = landmarks[20];
    const wrist = landmarks[0];
    const thumb = landmarks[4];
    
    // Verificar que índice y medio estén arriba
    const indexUp = index[1] < wrist[1] - 40;
    const middleUp = middle[1] < wrist[1] - 40;
    
    // Verificar que anular y meñique estén abajo
    const ringDown = ring[1] > wrist[1] - 20;
    const pinkyDown = pinky[1] > wrist[1] - 20;
    const thumbDown = thumb[1] > wrist[1] - 25;
    
    // Verificar separación entre índice y medio (V)
    const fingerSeparation = Math.abs(index[0] - middle[0]);
    const properV = fingerSeparation > 25 && fingerSeparation < 80;
    
    // Verificar que los dedos estén relativamente a la misma altura
    const sameHeight = Math.abs(index[1] - middle[1]) < 30;
    
    let confidence = 0;
    if (indexUp) confidence += 0.25;
    if (middleUp) confidence += 0.25;
    if (ringDown) confidence += 0.15;
    if (pinkyDown) confidence += 0.15;
    if (thumbDown) confidence += 0.1;
    if (properV && sameHeight) confidence += 0.1;
    
    console.log('✌️ PAZ - Índice up:', indexUp, 'Medio up:', middleUp, 
               'Ring/Pinky down:', ringDown, pinkyDown, 'V:', properV, 
               'Sep:', fingerSeparation.toFixed(1), 'Conf:', confidence);
    
    return { confidence };
  }, []);
  
  const detectLoveSignAdvanced = useCallback((landmarks: number[][]) => {
    const thumb = landmarks[4];
    const index = landmarks[8];
    const middle = landmarks[12];
    const ring = landmarks[16];
    const pinky = landmarks[20];
    const wrist = landmarks[0];
    
    // Para "amor" buscamos una forma específica: pulgar e índice juntos formando parte de un corazón
    const thumbIndexDistance = Math.sqrt(
      Math.pow(thumb[0] - index[0], 2) + Math.pow(thumb[1] - index[1], 2)
    );
    
    // Los dedos medio y anular también deben estar en posición específica
    const middleRingDistance = Math.sqrt(
      Math.pow(middle[0] - ring[0], 2) + Math.pow(middle[1] - ring[1], 2)
    );
    
    // Verificar proximidad para formar corazón
    const thumbIndexClose = thumbIndexDistance < 60 && thumbIndexDistance > 15;
    const middleRingClose = middleRingDistance < 45;
    
    // Verificar posición relativa de los dedos (deben estar hacia arriba)
    const fingersUp = index[1] < wrist[1] - 20 && middle[1] < wrist[1] - 20 && 
                     ring[1] < wrist[1] - 20 && thumb[1] < wrist[1] - 10;
    
    // Verificar que el meñique esté más separado
    const pinkyAway = Math.abs(pinky[0] - ring[0]) > 20;
    
    let confidence = 0;
    if (thumbIndexClose) confidence += 0.25;
    if (middleRingClose) confidence += 0.25;
    if (fingersUp) confidence += 0.3;
    if (pinkyAway) confidence += 0.2;
    
    console.log('💖 AMOR - Pulgar-Índice:', thumbIndexClose, 'Dist:', thumbIndexDistance.toFixed(1),
               'Medio-Anular:', middleRingClose, 'Dedos up:', fingersUp, 
               'Meñique sep:', pinkyAway, 'Conf:', confidence);
    
    return { confidence };
  }, []);
  
  return { detectCustomSign };
};
