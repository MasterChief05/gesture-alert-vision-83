
import { useState, useEffect, useCallback, useRef } from 'react';
import { Sign, DetectionResult } from '@/types/sign';
import { useSigns } from '@/hooks/useSigns';
import { useHandpose } from '@/hooks/useHandpose';
import { useCustomSignDetection } from '@/hooks/useCustomSignDetection';
import { toast } from 'sonner';

export const useSignDetection = (videoElement: HTMLVideoElement | null) => {
  const [detectedSign, setDetectedSign] = useState<DetectionResult | null>(null);
  const [isDetecting, setIsDetecting] = useState(false);
  const { getSignByName } = useSigns();
  const { predictions, isModelLoaded } = useHandpose(videoElement);
  const { detectCustomSign } = useCustomSignDetection();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const lastDetectionRef = useRef<number>(0);
  const detectionCountdownRef = useRef<number>(0);
  const detectionSamplesRef = useRef<Array<{signName: string, confidence: number}>>([]);
  
  const DETECTION_COOLDOWN = 500; // Reducido para más sensibilidad
  const DETECTION_TIMEOUT = 15000; // 15 segundos para detectar
  const SAMPLE_THRESHOLD = 5; // Necesita 5 detecciones consistentes

  const canDetect = useCallback(() => {
    const now = Date.now();
    return (now - lastDetectionRef.current) > DETECTION_COOLDOWN;
  }, []);

  // Dibujar puntos en tiempo real
  const drawPredictions = useCallback(() => {
    if (!canvasRef.current || !predictions.length) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Limpiar canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    predictions.forEach((prediction) => {
      if (prediction.landmarks) {
        setIsDetecting(true);
        
        // Dibujar todos los puntos con mayor detalle
        prediction.landmarks.forEach((landmark: number[], index: number) => {
          const x = landmark[0];
          const y = landmark[1];
          
          // Puntos importantes más grandes y coloridos
          const isImportant = [0, 4, 8, 12, 16, 20].includes(index);
          
          ctx.beginPath();
          ctx.arc(x, y, isImportant ? 10 : 6, 0, 2 * Math.PI);
          ctx.fillStyle = isImportant ? '#FF6B35' : '#4ECDC4';
          ctx.fill();
          
          // Contorno para mejor visibilidad
          ctx.strokeStyle = '#FFFFFF';
          ctx.lineWidth = 2;
          ctx.stroke();
          
          // Números en puntos importantes
          if (isImportant) {
            ctx.fillStyle = '#FFFFFF';
            ctx.font = 'bold 14px Arial';
            ctx.strokeStyle = '#000000';
            ctx.lineWidth = 3;
            ctx.strokeText(index.toString(), x + 12, y - 12);
            ctx.fillText(index.toString(), x + 12, y - 12);
          }
        });
        
        // Detectar señas personalizadas si está en modo captura
        if (canDetect() && detectionCountdownRef.current > 0) {
          const customResult = detectCustomSign(prediction.landmarks);
          
          if (customResult.detected && customResult.confidence > 0.6) {
            // Añadir muestra a la colección
            detectionSamplesRef.current.push({
              signName: customResult.signName,
              confidence: customResult.confidence
            });
            
            // Mantener solo las últimas 10 muestras
            if (detectionSamplesRef.current.length > 10) {
              detectionSamplesRef.current.shift();
            }
            
            // Verificar si tenemos suficientes detecciones consistentes
            const recentSamples = detectionSamplesRef.current.slice(-SAMPLE_THRESHOLD);
            const consistentSign = checkConsistentDetection(recentSamples);
            
            if (consistentSign) {
              const avgConfidence = recentSamples.reduce((sum, sample) => sum + sample.confidence, 0) / recentSamples.length;
              detectSign(avgConfidence, consistentSign);
            }
            
            lastDetectionRef.current = Date.now();
          }
        }
        
        setTimeout(() => setIsDetecting(false), 100);
      }
    });
  }, [predictions, detectCustomSign, canDetect]);
  
  // Verificar detección consistente
  const checkConsistentDetection = useCallback((samples: Array<{signName: string, confidence: number}>) => {
    if (samples.length < SAMPLE_THRESHOLD) return null;
    
    // Contar ocurrencias de cada seña
    const signCounts: {[key: string]: number} = {};
    samples.forEach(sample => {
      signCounts[sample.signName] = (signCounts[sample.signName] || 0) + 1;
    });
    
    // Encontrar la seña más frecuente
    const mostFrequent = Object.entries(signCounts).reduce((a, b) => 
      signCounts[a[0]] > signCounts[b[0]] ? a : b
    );
    
    // Debe aparecer al menos 3 veces de 5 para ser considerada válida
    return mostFrequent[1] >= 3 ? mostFrequent[0] : null;
  }, []);
  
  const detectSign = useCallback(async (confidence: number, signName: string) => {
    const sign = await getSignByName(signName);
    if (sign) {
      detectionCountdownRef.current = 0; // Detener detección
      detectionSamplesRef.current = []; // Limpiar muestras
      
      const detection: DetectionResult = {
        sign,
        confidence,
        timestamp: new Date()
      };
      
      setDetectedSign(detection);
      console.log(`🎯 Seña "${signName}" detectada con comparación mejorada:`, detection);
      
      toast.success(`🎯 ¡SEÑA ${signName.toUpperCase()} DETECTADA!`, {
        description: `Patrón confirmado tras análisis continuo - Confianza: ${(confidence * 100).toFixed(1)}%`,
        duration: 5000
      });
      
      setTimeout(() => setDetectedSign(null), 4000);
    }
  }, [getSignByName]);

  // Iniciar detección con countdown de 15 segundos
  const startDetection = useCallback(() => {
    if (!isModelLoaded) {
      toast.error('La cámara debe estar activa primero');
      return;
    }
    
    detectionCountdownRef.current = DETECTION_TIMEOUT;
    detectionSamplesRef.current = []; // Limpiar muestras previas
    lastDetectionRef.current = Date.now();
    
    toast.info('🔍 Iniciando detección avanzada de señas', {
      description: 'Tienes 15 segundos para hacer cualquier seña - El sistema compara patrones continuamente',
      duration: 3000
    });
    
    // Countdown visual cada 3 segundos
    const countdownInterval = setInterval(() => {
      detectionCountdownRef.current -= 1000;
      
      const secondsLeft = Math.ceil(detectionCountdownRef.current / 1000);
      
      if (secondsLeft > 0 && secondsLeft % 5 === 0) {
        toast.info(`⏱️ ${secondsLeft} segundos restantes`, {
          description: 'Continúa haciendo la seña para mejor detección',
          duration: 1500
        });
      }
      
      if (detectionCountdownRef.current <= 0) {
        clearInterval(countdownInterval);
        toast.info('⏰ Tiempo de detección completado');
      }
    }, 1000);
    
    // Auto-stop después de 15 segundos
    setTimeout(() => {
      clearInterval(countdownInterval);
      detectionCountdownRef.current = 0;
      detectionSamplesRef.current = [];
    }, DETECTION_TIMEOUT);
  }, [isModelLoaded]);

  // Dibujar en cada frame
  useEffect(() => {
    if (isModelLoaded) {
      drawPredictions();
    }
  }, [predictions, isModelLoaded, drawPredictions]);

  const setCanvasRef = useCallback((canvas: HTMLCanvasElement | null) => {
    canvasRef.current = canvas;
  }, []);

  return {
    detectedSign,
    isDetecting: isDetecting && isModelLoaded,
    setCanvasRef,
    startDetection,
    isDetectionActive: detectionCountdownRef.current > 0,
    timeRemaining: Math.ceil(detectionCountdownRef.current / 1000)
  };
};
