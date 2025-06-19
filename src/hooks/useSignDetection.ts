
import { useState, useEffect, useCallback, useRef } from 'react';
import { Sign, DetectionResult } from '@/types/sign';
import { useSigns } from '@/hooks/useSigns';
import { useHandpose } from '@/hooks/useHandpose';
import { useFeverDetection } from '@/hooks/useFeverDetection';
import { toast } from 'sonner';

export const useSignDetection = (videoElement: HTMLVideoElement | null) => {
  const [detectedSign, setDetectedSign] = useState<DetectionResult | null>(null);
  const [isDetecting, setIsDetecting] = useState(false);
  const { getSignByName } = useSigns();
  const { predictions, isModelLoaded } = useHandpose(videoElement);
  const { detectFeverSign } = useFeverDetection();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const lastDetectionRef = useRef<number>(0);
  
  const DETECTION_COOLDOWN = 1000;

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
        
        // Detectar fiebre si está en modo captura
        if (canDetect()) {
          const feverResult = detectFeverSign(prediction.landmarks);
          
          if (feverResult.detected && feverResult.confidence > 0.8) {
            detectSign(feverResult.confidence);
          }
        }
        
        setTimeout(() => setIsDetecting(false), 100);
      }
    });
  }, [predictions, detectFeverSign, canDetect]);
  
  const detectSign = useCallback(async (confidence: number) => {
    const feverSign = await getSignByName("Fiebre Alta");
    if (feverSign) {
      lastDetectionRef.current = Date.now();
      const detection: DetectionResult = {
        sign: feverSign,
        confidence,
        timestamp: new Date()
      };
      
      setDetectedSign(detection);
      console.log('🌡️ Seña de fiebre detectada con TensorFlow:', detection);
      
      setTimeout(() => setDetectedSign(null), 2000);
    }
  }, [getSignByName]);

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
    setCanvasRef
  };
};
