
import { useState, useEffect, useCallback, useRef } from 'react';
import { Sign, DetectionResult } from '@/types/sign';
import { useSigns } from '@/hooks/useSigns';
import { useHandpose } from '@/hooks/useHandpose';
import { useCustomSignDetection } from '@/hooks/useCustomSignDetection';
import { toast } from 'sonner';

export const useSignDetection = (videoElement: HTMLVideoElement | null) => {
  const [detectedSign, setDetectedSign] = useState<DetectionResult | null>(null);
  const [isDetecting, setIsDetecting] = useState(false);
  const { signs } = useSigns(); // Obtener señas de la base de datos
  const { predictions, isModelLoaded } = useHandpose(videoElement);
  const { detectCustomSign } = useCustomSignDetection();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const lastDetectionRef = useRef<number>(0);
  const detectionCountdownRef = useRef<number>(0);
  const detectionSamplesRef = useRef<Array<{signName: string, confidence: number, sign: Sign}>>([]);
  
  const DETECTION_COOLDOWN = 500; // Menos frecuente para mejor precisión
  const DETECTION_TIMEOUT = 10000; // 10 segundos
  const SAMPLE_THRESHOLD = 3; // Necesita 3 detecciones consistentes

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
          ctx.arc(x, y, isImportant ? 8 : 5, 0, 2 * Math.PI);
          ctx.fillStyle = isImportant ? '#10B981' : '#3B82F6';
          ctx.fill();
          
          ctx.strokeStyle = '#FFFFFF';
          ctx.lineWidth = 2;
          ctx.stroke();
        });
        
        // Detectar señas si está en modo captura
        if (canDetect() && detectionCountdownRef.current > 0 && signs.length > 0) {
          console.log('🔍 Comparando con señas almacenadas...');
          const customResult = detectCustomSign(prediction.landmarks, signs);
          
          if (customResult.detected && customResult.confidence > 0.7) {
            console.log('✅ Seña detectada!', customResult.signName, 'Confianza:', customResult.confidence);
            
            // Añadir muestra a la colección
            detectionSamplesRef.current.push({
              signName: customResult.signName,
              confidence: customResult.confidence,
              sign: customResult.matchedSign!
            });
            
            // Mantener solo las últimas 5 muestras
            if (detectionSamplesRef.current.length > 5) {
              detectionSamplesRef.current.shift();
            }
            
            console.log('📊 Muestras actuales:', detectionSamplesRef.current);
            
            // Verificar si tenemos suficientes detecciones consistentes
            const recentSamples = detectionSamplesRef.current.slice(-SAMPLE_THRESHOLD);
            const consistentSign = checkConsistentDetection(recentSamples);
            
            if (consistentSign) {
              const avgConfidence = recentSamples.reduce((sum, sample) => sum + sample.confidence, 0) / recentSamples.length;
              console.log('🎯 Detección consistente confirmada:', consistentSign.name, 'Confianza promedio:', avgConfidence);
              detectSign(avgConfidence, consistentSign);
            }
            
            lastDetectionRef.current = Date.now();
          }
        }
        
        setTimeout(() => setIsDetecting(false), 100);
      }
    });
  }, [predictions, detectCustomSign, canDetect, signs]);
  
  // Verificar detección consistente
  const checkConsistentDetection = useCallback((samples: Array<{signName: string, confidence: number, sign: Sign}>) => {
    if (samples.length < SAMPLE_THRESHOLD) return null;
    
    // Contar ocurrencias de cada seña
    const signCounts: {[key: string]: {count: number, sign: Sign}} = {};
    samples.forEach(sample => {
      if (!signCounts[sample.signName]) {
        signCounts[sample.signName] = { count: 0, sign: sample.sign };
      }
      signCounts[sample.signName].count++;
    });
    
    console.log('📈 Conteo de señas en muestras:', signCounts);
    
    // Encontrar la seña más frecuente
    const mostFrequent = Object.entries(signCounts).reduce((a, b) => 
      signCounts[a[0]].count > signCounts[b[0]].count ? a : b
    );
    
    // Debe aparecer al menos 2 veces de 3 para ser considerada válida
    return mostFrequent[1].count >= 2 ? mostFrequent[1].sign : null;
  }, []);
  
  const detectSign = useCallback(async (confidence: number, sign: Sign) => {
    detectionCountdownRef.current = 0; // Detener detección
    detectionSamplesRef.current = []; // Limpiar muestras
    
    const detection: DetectionResult = {
      sign,
      confidence,
      timestamp: new Date()
    };
    
    setDetectedSign(detection);
    console.log(`🎯 Seña "${sign.name}" detectada:`, detection);
    
    toast.success(`🎯 ¡SEÑA ${sign.name.toUpperCase()} DETECTADA!`, {
      description: `Coincidencia confirmada - Confianza: ${(confidence * 100).toFixed(1)}%`,
      duration: 4000
    });
    
    setTimeout(() => setDetectedSign(null), 6000);
  }, []);

  // Iniciar detección
  const startDetection = useCallback(() => {
    if (!isModelLoaded) {
      toast.error('La cámara debe estar activa primero');
      return;
    }
    
    if (signs.length === 0) {
      toast.error('No hay señas guardadas en la base de datos para comparar');
      return;
    }
    
    detectionCountdownRef.current = DETECTION_TIMEOUT;
    detectionSamplesRef.current = [];
    lastDetectionRef.current = Date.now();
    
    console.log('🚀 Iniciando comparación con', signs.length, 'señas almacenadas');
    
    toast.info('🔍 Iniciando detección de señas', {
      description: `Comparando con ${signs.length} señas guardadas en la base de datos`,
      duration: 3000
    });
    
    // Auto-stop después de 10 segundos
    setTimeout(() => {
      detectionCountdownRef.current = 0;
      detectionSamplesRef.current = [];
    }, DETECTION_TIMEOUT);
  }, [isModelLoaded, signs]);

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
