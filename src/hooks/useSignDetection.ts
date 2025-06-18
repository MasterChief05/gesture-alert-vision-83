
import { useState, useEffect, useCallback } from 'react';
import { Sign, DetectionResult } from '@/types/sign';
import { signsDatabase } from '@/data/signsDatabase';
import { toast } from 'sonner';

export const useSignDetection = () => {
  const [detectedSign, setDetectedSign] = useState<DetectionResult | null>(null);
  const [isDetecting, setIsDetecting] = useState(false);

  // Simulación de detección de señas - siempre activa
  const simulateDetection = useCallback(() => {
    setIsDetecting(true);
    
    // Simular proceso de detección con delay aleatorio
    const detectionDelay = Math.random() * 4000 + 2000; // 2-6 segundos
    
    setTimeout(() => {
      // Probabilidad del 40% de detectar una seña
      if (Math.random() > 0.6) {
        // Priorizar detección de "Amor" y "Paz"
        let randomSign;
        const specialSigns = signsDatabase.filter(sign => 
          sign.name === "Amor" || sign.name === "Paz"
        );
        
        if (Math.random() > 0.5 && specialSigns.length > 0) {
          // 50% probabilidad de detectar amor o paz
          randomSign = specialSigns[Math.floor(Math.random() * specialSigns.length)];
        } else {
          randomSign = signsDatabase[Math.floor(Math.random() * signsDatabase.length)];
        }
        
        const confidence = Math.random() * 0.3 + 0.7; // 70-100% confianza
        
        const detection: DetectionResult = {
          sign: randomSign,
          confidence,
          timestamp: new Date()
        };
        
        setDetectedSign(detection);
        
        // Mostrar alerta de texto específica para amor y paz
        if (randomSign.name === "Amor") {
          toast.success("💖 AMOR detectado", {
            description: "Se ha reconocido la seña de amor",
            duration: 4000,
          });
        } else if (randomSign.name === "Paz") {
          toast.success("✌️ PAZ detectada", {
            description: "Se ha reconocido la seña de paz",
            duration: 4000,
          });
        } else {
          toast.success(`Seña detectada: ${randomSign.name}`, {
            description: `Confianza: ${(confidence * 100).toFixed(1)}%`,
            duration: 3000,
          });
        }
        
        // Limpiar detección después de 4 segundos
        setTimeout(() => {
          setDetectedSign(null);
        }, 4000);
      }
      
      setIsDetecting(false);
      
      // Continuar el ciclo de detección automáticamente
      setTimeout(simulateDetection, 1500);
    }, detectionDelay);
  }, []);

  useEffect(() => {
    // Iniciar detección automáticamente
    simulateDetection();
  }, [simulateDetection]);

  return {
    detectedSign,
    isDetecting
  };
};
