
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
  
  const DETECTION_COOLDOWN = 1000;
  const DETECTION_TIMEOUT = 5000; // 5 segundos para detectar

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
        
        // Dibujar todos los puntos
        prediction.landmarks.forEach((landmark: number[], index: number) => {
          const x = landmark[0];
          const y = landmark[1];
          
          // Puntos importantes más grandes
          const isImportant = [0, 4, 8, 12, 16, 20].includes(index);
          
          ctx.beginPath();
          ctx.arc(x, y, isImportant ? 8 : 4, 0, 2 * Math.PI);
          ctx.fillStyle = isImportant ? '#FF4444' : '#44FF44';
          ctx.fill();
          
          // Números en puntos importantes
          if (isImportant) {
            ctx.fillStyle = '#FFFFFF';
            ctx.font = 'bold 12px Arial';
            ctx.strokeStyle = '#000000';
            ctx.lineWidth = 2;
            ctx.strokeText(index.toString(), x + 10, y - 10);
            ctx.fillText(index.toString(), x + 10, y - 10);
          }
        });
        
        // Detectar señas personalizadas si está en modo captura
        if (canDetect() && detectionCountdownRef.current > 0) {
          const customResult = detectCustomSign(prediction.landmarks);
          
          if (customResult.detected && customResult.confidence > 0.7) {
            detectSign(customResult.confidence, customResult.signName);
          }
        }
        
        setTimeout(() => setIsDetecting(false), 100);
      }
    });
  }, [predictions, detectCustomSign, canDetect]);
  
  const detectSign = useCallback(async (confidence: number, signName: string) => {
    const sign = await getSignByName(signName);
    if (sign) {
      lastDetectionRef.current = Date.now();
      detectionCountdownRef.current = 0; // Detener detección
      
      const detection: DetectionResult = {
        sign,
        confidence,
        timestamp: new Date()
      };
      
      setDetectedSign(detection);
      console.log(`🎯 Seña "${signName}" detectada:`, detection);
      
      toast.success(`🎯 ¡SEÑA ${signName.toUpperCase()} DETECTADA!`, {
        description: `Patrón reconocido con confianza: ${(confidence * 100).toFixed(1)}%`,
        duration: 4000
      });
      
      setTimeout(() => setDetectedSign(null), 3000);
    }
  }, [getSignByName]);

  // Iniciar detección con countdown de 5 segundos
  const startDetection = useCallback(() => {
    if (!isModelLoaded) {
      toast.error('La cámara debe estar activa primero');
      return;
    }
    
    detectionCountdownRef.current = DETECTION_TIMEOUT;
    lastDetectionRef.current = Date.now();
    
    toast.info('🔍 Iniciando detección de señas', {
      description: 'Tienes 5 segundos para hacer cualquier seña',
      duration: 2000
    });
    
    // Countdown
    const countdownInterval = setInterval(() => {
      detectionCountdownRef.current -= 1000;
      
      if (detectionCountdownRef.current <= 0) {
        clearInterval(countdownInterval);
        toast.info('⏰ Tiempo de detección terminado');
      }
    }, 1000);
    
    // Auto-stop después de 5 segundos
    setTimeout(() => {
      clearInterval(countdownInterval);
      detectionCountdownRef.current = 0;
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
    isDetectionActive: detectionCountdownRef.current > 0
  };
};
