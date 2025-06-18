
import { useState, useEffect, useCallback, useRef } from 'react';
import { Sign, DetectionResult } from '@/types/sign';
import { useSigns } from '@/hooks/useSigns';
import { toast } from 'sonner';

// Declaración global para MediaPipe
declare global {
  interface Window {
    Hands: any;
    drawConnectors: any;
    drawLandmarks: any;
    HAND_CONNECTIONS: any;
  }
}

export const useSignDetection = (videoElement: HTMLVideoElement | null) => {
  const [detectedSign, setDetectedSign] = useState<DetectionResult | null>(null);
  const [isDetecting, setIsDetecting] = useState(false);
  const { getSignByName } = useSigns();
  const handsRef = useRef<any>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const isInitializedRef = useRef(false);
  const lastDetectionRef = useRef<number>(0);
  
  // Constantes simplificadas
  const DETECTION_COOLDOWN = 1500; // Reducido para más fluidez

  // Función simplificada para detectar "Fiebre Alta"
  const detectFeverSign = useCallback((landmarks: any[]) => {
    for (const hand of landmarks) {
      const thumb = hand[4];
      const index = hand[8];
      const middle = hand[12];
      const ring = hand[16];
      const pinky = hand[20];
      
      // Detección más simple y directa
      const thumbIndexDistance = Math.sqrt(
        Math.pow(thumb.x - index.x, 2) + Math.pow(thumb.y - index.y, 2)
      );
      
      // Verificar que los dedos estén en posición vertical
      const isVertical = middle.y < thumb.y && index.y < thumb.y;
      const correctDistance = thumbIndexDistance > 0.03 && thumbIndexDistance < 0.15;
      
      if (isVertical && correctDistance) {
        return { detected: true, confidence: 0.9 };
      }
    }
    return { detected: false, confidence: 0 };
  }, []);

  // Función simplificada para detectar "OK"
  const detectOKSign = useCallback((landmarks: any[]) => {
    for (const hand of landmarks) {
      const thumb = hand[4];
      const index = hand[8];
      const middle = hand[12];
      const ring = hand[16];
      const pinky = hand[20];
      
      const thumbIndexDistance = Math.sqrt(
        Math.pow(thumb.x - index.x, 2) + Math.pow(thumb.y - index.y, 2)
      );
      
      const isCircle = thumbIndexDistance > 0.02 && thumbIndexDistance < 0.08;
      const othersExtended = middle.y < index.y && ring.y < index.y && pinky.y < index.y;
      
      if (isCircle && othersExtended) {
        return { detected: true, confidence: 0.9 };
      }
    }
    return { detected: false, confidence: 0 };
  }, []);

  // Función simplificada para detectar "Amor"
  const detectLoveSign = useCallback((landmarks: any[]) => {
    if (landmarks.length < 2) return { detected: false, confidence: 0 };
    
    const leftHand = landmarks[0];
    const rightHand = landmarks[1];
    
    const leftThumb = leftHand[4];
    const rightThumb = rightHand[4];
    const leftIndex = leftHand[8];
    const rightIndex = rightHand[8];
    
    const thumbDistance = Math.abs(leftThumb.x - rightThumb.x);
    const indexDistance = Math.abs(leftIndex.x - rightIndex.x);
    
    const isHeartShape = thumbDistance < 0.1 && indexDistance < 0.15;
    
    if (isHeartShape) {
      return { detected: true, confidence: 0.85 };
    }
    return { detected: false, confidence: 0 };
  }, []);

  // Función simplificada para detectar "Paz"
  const detectPeaceSign = useCallback((landmarks: any[]) => {
    for (const hand of landmarks) {
      const indexTip = hand[8];
      const middleTip = hand[12];
      const ringTip = hand[16];
      const pinkyTip = hand[20];
      const wrist = hand[0];
      
      const indexUp = wrist.y - indexTip.y > 0.05;
      const middleUp = wrist.y - middleTip.y > 0.05;
      const ringDown = ringTip.y - wrist.y > -0.02;
      const pinkyDown = pinkyTip.y - wrist.y > -0.02;
      const separation = Math.abs(indexTip.x - middleTip.x) > 0.03;
      
      if (indexUp && middleUp && ringDown && pinkyDown && separation) {
        return { detected: true, confidence: 0.85 };
      }
    }
    return { detected: false, confidence: 0 };
  }, []);

  // Control de cooldown simplificado
  const canDetect = useCallback(() => {
    const now = Date.now();
    return (now - lastDetectionRef.current) > DETECTION_COOLDOWN;
  }, []);

  // Función principal de procesamiento - SIMPLIFICADA
  const onResults = useCallback(async (results: any) => {
    if (!canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Limpiar canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
      setIsDetecting(true);
      
      // Dibujar puntos de referencia de forma simple
      results.multiHandLandmarks.forEach((landmarks: any) => {
        // Dibujar solo los puntos principales sin líneas complicadas
        landmarks.forEach((landmark: any, i: number) => {
          const x = landmark.x * canvas.width;
          const y = landmark.y * canvas.height;
          
          // Punto rojo simple
          ctx.beginPath();
          ctx.arc(x, y, 3, 0, 2 * Math.PI);
          ctx.fillStyle = '#FF0000';
          ctx.fill();
          
          // Número del punto
          if (i % 4 === 0) { // Solo mostrar algunos números para no saturar
            ctx.fillStyle = '#FFFFFF';
            ctx.font = '8px Arial';
            ctx.fillText(i.toString(), x + 5, y - 5);
          }
        });
      });
      
      // Detectar señas de forma directa sin suavizado
      if (canDetect()) {
        const feverResult = detectFeverSign(results.multiHandLandmarks);
        const okResult = detectOKSign(results.multiHandLandmarks);
        const loveResult = detectLoveSign(results.multiHandLandmarks);
        const peaceResult = detectPeaceSign(results.multiHandLandmarks);
        
        // Procesar detecciones con prioridad
        if (feverResult.detected && feverResult.confidence > 0.8) {
          const feverSign = await getSignByName("Fiebre Alta");
          if (feverSign) {
            lastDetectionRef.current = Date.now();
            const detection: DetectionResult = {
              sign: feverSign,
              confidence: feverResult.confidence,
              timestamp: new Date()
            };
            
            setDetectedSign(detection);
            toast.success("🌡️ FIEBRE ALTA detectada", {
              description: `Confianza: ${(feverResult.confidence * 100).toFixed(1)}%`,
              duration: 1500,
            });
            
            setTimeout(() => setDetectedSign(null), 1500);
          }
        } else if (okResult.detected && okResult.confidence > 0.8) {
          const okSign = await getSignByName("OK");
          if (okSign) {
            lastDetectionRef.current = Date.now();
            const detection: DetectionResult = {
              sign: okSign,
              confidence: okResult.confidence,
              timestamp: new Date()
            };
            
            setDetectedSign(detection);
            toast.success("👌 OK detectado", {
              description: `Confianza: ${(okResult.confidence * 100).toFixed(1)}%`,
              duration: 1500,
            });
            
            setTimeout(() => setDetectedSign(null), 1500);
          }
        } else if (loveResult.detected && loveResult.confidence > 0.8) {
          const loveSign = await getSignByName("Amor");
          if (loveSign) {
            lastDetectionRef.current = Date.now();
            const detection: DetectionResult = {
              sign: loveSign,
              confidence: loveResult.confidence,
              timestamp: new Date()
            };
            
            setDetectedSign(detection);
            toast.success("💖 AMOR detectado", {
              description: `Confianza: ${(loveResult.confidence * 100).toFixed(1)}%`,
              duration: 1500,
            });
            
            setTimeout(() => setDetectedSign(null), 1500);
          }
        } else if (peaceResult.detected && peaceResult.confidence > 0.8) {
          const peaceSign = await getSignByName("Paz");
          if (peaceSign) {
            lastDetectionRef.current = Date.now();
            const detection: DetectionResult = {
              sign: peaceSign,
              confidence: peaceResult.confidence,
              timestamp: new Date()
            };
            
            setDetectedSign(detection);
            toast.success("✌️ PAZ detectada", {
              description: `Confianza: ${(peaceResult.confidence * 100).toFixed(1)}%`,
              duration: 1500,
            });
            
            setTimeout(() => setDetectedSign(null), 1500);
          }
        }
      }
      
      setTimeout(() => setIsDetecting(false), 50); // Más rápido
    }
  }, [detectFeverSign, detectOKSign, detectLoveSign, detectPeaceSign, canDetect, getSignByName]);

  // Cargar MediaPipe de forma más directa
  const loadMediaPipe = useCallback(async () => {
    try {
      const scripts = [
        'https://cdn.jsdelivr.net/npm/@mediapipe/camera_utils/camera_utils.js',
        'https://cdn.jsdelivr.net/npm/@mediapipe/control_utils/control_utils.js',
        'https://cdn.jsdelivr.net/npm/@mediapipe/drawing_utils/drawing_utils.js',
        'https://cdn.jsdelivr.net/npm/@mediapipe/hands/hands.js'
      ];

      for (const src of scripts) {
        await new Promise<void>((resolve, reject) => {
          const script = document.createElement('script');
          script.src = src;
          script.onload = () => resolve();
          script.onerror = () => reject(new Error(`Failed to load ${src}`));
          document.head.appendChild(script);
        });
      }

      console.log('✅ MediaPipe cargado');
      return true;
    } catch (error) {
      console.error('❌ Error cargando MediaPipe:', error);
      return false;
    }
  }, []);

  // Inicialización simplificada
  useEffect(() => {
    if (!videoElement || isInitializedRef.current) return;
    
    const initializeHands = async () => {
      try {
        const loaded = await loadMediaPipe();
        if (!loaded) return;
        
        await new Promise(resolve => setTimeout(resolve, 500));
        
        if (!window.Hands) {
          console.error('MediaPipe Hands no disponible');
          return;
        }
        
        const hands = new window.Hands({
          locateFile: (file: string) => {
            return `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`;
          }
        });
        
        hands.setOptions({
          maxNumHands: 2,
          modelComplexity: 0, // Reducido para mejor rendimiento
          minDetectionConfidence: 0.6, // Reducido para más sensibilidad
          minTrackingConfidence: 0.4 // Reducido para mejor tracking
        });
        
        hands.onResults(onResults);
        handsRef.current = hands;
        isInitializedRef.current = true;
        
        console.log('✅ MediaPipe inicializado - modo fluido');
        
        // Loop de procesamiento más simple
        const processFrame = async () => {
          if (videoElement && videoElement.readyState >= 2 && handsRef.current && isInitializedRef.current) {
            try {
              await handsRef.current.send({image: videoElement});
            } catch (error) {
              console.warn('Error frame:', error);
            }
          }
          if (isInitializedRef.current) {
            requestAnimationFrame(processFrame);
          }
        };
        
        processFrame();
      } catch (error) {
        console.error('❌ Error inicialización:', error);
        toast.error('Error iniciando detección');
      }
    };
    
    initializeHands();
    
    return () => {
      if (handsRef.current) {
        try {
          handsRef.current.close();
        } catch (error) {
          console.warn('Error cerrando:', error);
        }
        handsRef.current = null;
      }
      isInitializedRef.current = false;
    };
  }, [videoElement, onResults, loadMediaPipe]);

  const setCanvasRef = useCallback((canvas: HTMLCanvasElement | null) => {
    canvasRef.current = canvas;
  }, []);

  return {
    detectedSign,
    isDetecting,
    setCanvasRef
  };
};
