
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
  
  const DETECTION_COOLDOWN = 200; // Más sensible
  const DETECTION_TIMEOUT = 15000; // 15 segundos
  const SAMPLE_THRESHOLD = 3; // Solo necesita 3 detecciones consistentes

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
          ctx.arc(x, y, isImportant ? 12 : 8, 0, 2 * Math.PI);
          ctx.fillStyle = isImportant ? '#FF6B35' : '#4ECDC4';
          ctx.fill();
          
          // Contorno para mejor visibilidad
          ctx.strokeStyle = '#FFFFFF';
          ctx.lineWidth = 3;
          ctx.stroke();
          
          // Números en puntos importantes
          if (isImportant) {
            ctx.fillStyle = '#FFFFFF';
            ctx.font = 'bold 16px Arial';
            ctx.strokeStyle = '#000000';
            ctx.lineWidth = 4;
            ctx.strokeText(index.toString(), x + 15, y - 15);
            ctx.fillText(index.toString(), x + 15, y - 15);
          }
        });
        
        // Detectar señas personalizadas si está en modo captura
        if (canDetect() && detectionCountdownRef.current > 0) {
          console.log('🔍 Intentando detectar señas...');
          const customResult = detectCustomSign(prediction.landmarks);
          
          if (customResult.detected && customResult.confidence > 0.5) {
            console.log('✅ Seña detectada!', customResult.signName, 'Confianza:', customResult.confidence);
            
            // Añadir muestra a la colección
            detectionSamplesRef.current.push({
              signName: customResult.signName,
              confidence: customResult.confidence
            });
            
            // Mantener solo las últimas 8 muestras
            if (detectionSamplesRef.current.length > 8) {
              detectionSamplesRef.current.shift();
            }
            
            console.log('📊 Muestras actuales:', detectionSamplesRef.current);
            
            // Verificar si tenemos suficientes detecciones consistentes
            const recentSamples = detectionSamplesRef.current.slice(-SAMPLE_THRESHOLD);
            const consistentSign = checkConsistentDetection(recentSamples);
            
            if (consistentSign) {
              const avgConfidence = recentSamples.reduce((sum, sample) => sum + sample.confidence, 0) / recentSamples.length;
              console.log('🎯 Detección consistente confirmada:', consistentSign, 'Confianza promedio:', avgConfidence);
              detectSign(avgConfidence, consistentSign);
            }
            
            lastDetectionRef.current = Date.now();
          } else if (customResult.detected) {
            console.log('⚠️ Seña detectada pero confianza baja:', customResult.signName, customResult.confidence);
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
    
    console.log('📈 Conteo de señas en muestras:', signCounts);
    
    // Encontrar la seña más frecuente
    const mostFrequent = Object.entries(signCounts).reduce((a, b) => 
      signCounts[a[0]] > signCounts[b[0]] ? a : b
    );
    
    // Debe aparecer al menos 2 veces de 3 para ser considerada válida
    return mostFrequent[1] >= 2 ? mostFrequent[0] : null;
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
    
    console.log('🚀 Iniciando detección de señas por 15 segundos');
    
    toast.info('🔍 Iniciando detección avanzada de señas', {
      description: 'Tienes 15 segundos - Haz las señas: OK 👌, PAZ ✌️, AMOR 💖',
      duration: 3000
    });
    
    // Countdown visual cada segundo
    const countdownInterval = setInterval(() => {
      detectionCountdownRef.current -= 1000;
      
      const secondsLeft = Math.ceil(detectionCountdownRef.current / 1000);
      
      if (secondsLeft > 0 && secondsLeft % 5 === 0) {
        console.log(`⏱️ ${secondsLeft} segundos restantes`);
        toast.info(`⏱️ ${secondsLeft} segundos restantes`, {
          description: 'Continúa haciendo la seña para mejor detección',
          duration: 1500
        });
      }
      
      if (detectionCountdownRef.current <= 0) {
        clearInterval(countdownInterval);
        console.log('⏰ Tiempo de detección completado');
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
