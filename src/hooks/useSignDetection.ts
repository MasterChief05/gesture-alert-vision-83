
import { useState, useEffect, useCallback } from 'react';
import { Sign, DetectionResult } from '@/types/sign';
import { signsDatabase } from '@/data/signsDatabase';

export const useSignDetection = (isActive: boolean) => {
  const [detectedSign, setDetectedSign] = useState<DetectionResult | null>(null);
  const [isDetecting, setIsDetecting] = useState(false);

  // Simulación de detección de señas
  const simulateDetection = useCallback(() => {
    if (!isActive) return;

    setIsDetecting(true);
    
    // Simular proceso de detección con delay aleatorio
    const detectionDelay = Math.random() * 3000 + 2000; // 2-5 segundos
    
    setTimeout(() => {
      // Probabilidad del 30% de detectar una seña
      if (Math.random() > 0.7) {
        const randomSign = signsDatabase[Math.floor(Math.random() * signsDatabase.length)];
        const confidence = Math.random() * 0.3 + 0.7; // 70-100% confianza
        
        const detection: DetectionResult = {
          sign: randomSign,
          confidence,
          timestamp: new Date()
        };
        
        setDetectedSign(detection);
        
        // Limpiar detección después de 3 segundos
        setTimeout(() => {
          setDetectedSign(null);
        }, 3000);
      }
      
      setIsDetecting(false);
      
      // Continuar el ciclo de detección
      if (isActive) {
        setTimeout(simulateDetection, 1000);
      }
    }, detectionDelay);
  }, [isActive]);

  useEffect(() => {
    if (isActive) {
      simulateDetection();
    } else {
      setDetectedSign(null);
      setIsDetecting(false);
    }
  }, [isActive, simulateDetection]);

  return {
    detectedSign,
    isDetecting
  };
};
