
import { useState, useEffect, useCallback, useRef } from 'react';
import { Sign, DetectionResult } from '@/types/sign';
import { useSigns } from '@/hooks/useSigns';
import { toast } from 'sonner';

// Importación correcta de MediaPipe
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
  const { signs, getSignByName } = useSigns();
  const handsRef = useRef<any>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  
  // Sistema mejorado para evitar landmarks pillados - referencias estables
  const lastDetectionRef = useRef<{ sign: string; timestamp: number } | null>(null);
  const landmarksHistoryRef = useRef<number[][][]>([]);
  const frameCountRef = useRef(0);
  const isInitializedRef = useRef(false);
  const isMediaPipeLoadedRef = useRef(false);
  
  // Constantes para control de detección
  const DETECTION_COOLDOWN = 2000;
  const HISTORY_SIZE = 2;
  const RESET_INTERVAL = 60;

  // Función de reset mejorada
  const resetDetectionSystem = useCallback(() => {
    landmarksHistoryRef.current = [];
    frameCountRef.current = 0;
    lastDetectionRef.current = null;
    setDetectedSign(null);
    console.log('🔄 Sistema de detección reiniciado completamente');
  }, []);

  // Cargar MediaPipe desde CDN
  const loadMediaPipe = useCallback(async () => {
    if (isMediaPipeLoadedRef.current) return true;
    
    try {
      // Cargar scripts de MediaPipe
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

      isMediaPipeLoadedRef.current = true;
      console.log('✅ MediaPipe cargado exitosamente');
      return true;
    } catch (error) {
      console.error('❌ Error cargando MediaPipe:', error);
      return false;
    }
  }, []);

  // Función para suavizar landmarks con reset automático frecuente
  const smoothLandmarks = useCallback((currentLandmarks: any[]) => {
    frameCountRef.current++;
    
    if (frameCountRef.current >= RESET_INTERVAL) {
      resetDetectionSystem();
      return [];
    }
    
    const normalizedLandmarks = currentLandmarks.map(hand => 
      hand.map((point: any) => [point.x, point.y, point.z || 0])
    );
    
    if (landmarksHistoryRef.current.length >= HISTORY_SIZE) {
      landmarksHistoryRef.current.shift();
    }
    
    landmarksHistoryRef.current.push(normalizedLandmarks);
    
    if (landmarksHistoryRef.current.length === 2) {
      const current = landmarksHistoryRef.current[1];
      const previous = landmarksHistoryRef.current[0];
      
      return current.map((hand, handIndex) => 
        hand.map((point, pointIndex) => {
          if (previous[handIndex] && previous[handIndex][pointIndex]) {
            const prev = previous[handIndex][pointIndex];
            return [
              (point[0] + prev[0]) / 2,
              (point[1] + prev[1]) / 2,
              (point[2] + prev[2]) / 2
            ];
          }
          return point;
        })
      );
    }
    
    return normalizedLandmarks;
  }, [resetDetectionSystem]);

  // Función mejorada para detectar seña "OK"
  const detectOKSign = useCallback((landmarks: any[]) => {
    for (const hand of landmarks) {
      const thumb = hand[4];
      const index = hand[8];
      const middle = hand[12];
      const ring = hand[16];
      const pinky = hand[20];
      const indexBase = hand[5];
      
      const thumbIndexDistance = Math.sqrt(
        Math.pow(thumb.x - index.x, 2) + Math.pow(thumb.y - index.y, 2)
      );
      
      const middleExtended = (indexBase.y - middle.y) > 0.04;
      const ringExtended = (indexBase.y - ring.y) > 0.04;
      const pinkyExtended = (indexBase.y - pinky.y) > 0.04;
      const isCircleSize = thumbIndexDistance > 0.02 && thumbIndexDistance < 0.08;
      
      if (isCircleSize && middleExtended && ringExtended && pinkyExtended) {
        const confidence = Math.max(0.85, 1.0 - thumbIndexDistance * 8);
        return { detected: true, confidence };
      }
    }
    return { detected: false, confidence: 0 };
  }, []);

  // Función para detectar seña de amor
  const detectLoveSign = useCallback((landmarks: any[]) => {
    if (landmarks.length < 2) return { detected: false, confidence: 0 };
    
    const leftHand = landmarks[0];
    const rightHand = landmarks[1];
    
    const leftThumb = leftHand[4];
    const leftIndex = leftHand[8];
    const rightThumb = rightHand[4];
    const rightIndex = rightHand[8];
    const leftWrist = leftHand[0];
    const rightWrist = rightHand[0];
    
    const thumbDistance = Math.abs(leftThumb.x - rightThumb.x);
    const indexDistance = Math.abs(leftIndex.x - rightIndex.x);
    const wristDistance = Math.abs(leftWrist.x - rightWrist.x);
    const handsHeight = Math.abs(leftWrist.y - rightWrist.y);
    
    const isHeartShape = thumbDistance < 0.08 && 
                        indexDistance < 0.12 && 
                        wristDistance > 0.15 && 
                        handsHeight < 0.1;
    
    const confidence = isHeartShape ? Math.max(0.8, 1.0 - (thumbDistance + indexDistance) * 2) : 0;
    return { detected: isHeartShape, confidence };
  }, []);

  // Función para detectar seña de paz
  const detectPeaceSign = useCallback((landmarks: any[]) => {
    for (const hand of landmarks) {
      const indexTip = hand[8];
      const middleTip = hand[12];
      const ringTip = hand[16];
      const pinkyTip = hand[20];
      const indexMcp = hand[5];
      const middleMcp = hand[9];
      const ringMcp = hand[13];
      const pinkyMcp = hand[17];
      
      const indexExtended = (indexMcp.y - indexTip.y) > 0.05;
      const middleExtended = (middleMcp.y - middleTip.y) > 0.05;
      const ringFolded = (ringTip.y - ringMcp.y) > -0.02;
      const pinkyFolded = (pinkyTip.y - pinkyMcp.y) > -0.02;
      const fingerSeparation = Math.abs(indexTip.x - middleTip.x);
      
      if (indexExtended && middleExtended && ringFolded && pinkyFolded && fingerSeparation > 0.03) {
        const confidence = Math.min(0.95, 0.7 + fingerSeparation * 5);
        return { detected: true, confidence };
      }
    }
    return { detected: false, confidence: 0 };
  }, []);

  // Nueva función para detectar seña de "Fiebre Alta"
  const detectFeverSign = useCallback((landmarks: any[]) => {
    for (const hand of landmarks) {
      const thumb = hand[4];
      const index = hand[8];
      const middle = hand[12];
      const ring = hand[16];
      const pinky = hand[20];
      const wrist = hand[0];
      const palmBase = hand[5];
      
      const isVerticalPosition = Math.abs(wrist.x - middle.x) < 0.1;
      const thumbPosition = thumb.y < index.y;
      const fingersAlignment = Math.abs(index.x - middle.x) < 0.05 && 
                              Math.abs(middle.x - ring.x) < 0.05;
      
      const thumbIndexDistance = Math.sqrt(
        Math.pow(thumb.x - index.x, 2) + Math.pow(thumb.y - index.y, 2)
      );
      
      const palmHeight = Math.abs(wrist.y - palmBase.y);
      const fingerSpread = Math.abs(index.x - pinky.x);
      
      const isCorrectThumbPosition = thumbIndexDistance > 0.03 && thumbIndexDistance < 0.12;
      const isCorrectPalmPosition = palmHeight > 0.08 && palmHeight < 0.15;
      const isCorrectFingerSpread = fingerSpread > 0.08 && fingerSpread < 0.2;
      
      if (isVerticalPosition && thumbPosition && fingersAlignment && 
          isCorrectThumbPosition && isCorrectPalmPosition && isCorrectFingerSpread) {
        
        const confidence = Math.max(0.8, 1.0 - Math.abs(thumbIndexDistance - 0.075) * 5);
        return { detected: true, confidence };
      }
    }
    return { detected: false, confidence: 0 };
  }, []);

  // Sistema de cooldown mejorado
  const canSendAlert = useCallback((signName: string) => {
    const now = Date.now();
    if (!lastDetectionRef.current || 
        lastDetectionRef.current.sign !== signName || 
        (now - lastDetectionRef.current.timestamp) > DETECTION_COOLDOWN) {
      
      lastDetectionRef.current = { sign: signName, timestamp: now };
      return true;
    }
    return false;
  }, []);

  // Función principal de procesamiento de resultados
  const onResults = useCallback(async (results: any) => {
    if (!canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Limpiar canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
      setIsDetecting(true);
      
      // Dibujar puntos de referencia usando MediaPipe
      results.multiHandLandmarks.forEach((landmarks: any, index: number) => {
        // Dibujar conexiones de la mano
        if (window.drawConnectors && window.HAND_CONNECTIONS) {
          const color = index === 0 ? '#00FF00' : '#0099FF';
          window.drawConnectors(ctx, landmarks, window.HAND_CONNECTIONS, {color, lineWidth: 2});
        }
        
        // Dibujar puntos de landmarks
        if (window.drawLandmarks) {
          window.drawLandmarks(ctx, landmarks, {color: '#FF0000', lineWidth: 1, radius: 4});
        }
        
        // Dibujar puntos numerados para depuración
        landmarks.forEach((landmark: any, i: number) => {
          const x = landmark.x * canvas.width;
          const y = landmark.y * canvas.height;
          
          // Dibujar círculo del punto
          ctx.beginPath();
          ctx.arc(x, y, 3, 0, 2 * Math.PI);
          ctx.fillStyle = '#FF0000';
          ctx.fill();
          
          // Dibujar número del punto
          ctx.fillStyle = '#FFFFFF';
          ctx.font = '10px Arial';
          ctx.fillText(i.toString(), x + 5, y - 5);
        });
      });
      
      // Suavizar landmarks
      const smoothedLandmarks = smoothLandmarks(results.multiHandLandmarks);
      
      if (smoothedLandmarks.length > 0) {
        // Detectar señas con prioridad
        const feverResult = detectFeverSign(results.multiHandLandmarks);
        const okResult = detectOKSign(results.multiHandLandmarks);
        const loveResult = detectLoveSign(results.multiHandLandmarks);
        const peaceResult = detectPeaceSign(results.multiHandLandmarks);
        
        // Procesar detecciones con prioridad - Fiebre Alta tiene alta prioridad
        if (feverResult.detected && feverResult.confidence > 0.8 && canSendAlert("Fiebre Alta")) {
          const feverSign = await getSignByName("Fiebre Alta");
          if (feverSign) {
            const detection: DetectionResult = {
              sign: feverSign,
              confidence: feverResult.confidence,
              timestamp: new Date()
            };
            
            setDetectedSign(detection);
            toast.success("🌡️ FIEBRE ALTA detectada", {
              description: `Confianza: ${(feverResult.confidence * 100).toFixed(1)}%`,
              duration: 2000,
            });
            
            setTimeout(() => setDetectedSign(null), 2000);
          }
        } else if (okResult.detected && okResult.confidence > 0.85 && canSendAlert("OK")) {
          const okSign = await getSignByName("OK");
          if (okSign) {
            const detection: DetectionResult = {
              sign: okSign,
              confidence: okResult.confidence,
              timestamp: new Date()
            };
            
            setDetectedSign(detection);
            toast.success("👌 OK detectado", {
              description: `Confianza: ${(okResult.confidence * 100).toFixed(1)}%`,
              duration: 2000,
            });
            
            setTimeout(() => setDetectedSign(null), 2000);
          }
        } else if (loveResult.detected && loveResult.confidence > 0.8 && canSendAlert("Amor")) {
          const loveSign = await getSignByName("Amor");
          if (loveSign) {
            const detection: DetectionResult = {
              sign: loveSign,
              confidence: loveResult.confidence,
              timestamp: new Date()
            };
            
            setDetectedSign(detection);
            toast.success("💖 AMOR detectado", {
              description: `Confianza: ${(loveResult.confidence * 100).toFixed(1)}%`,
              duration: 2000,
            });
            
            setTimeout(() => setDetectedSign(null), 2000);
          }
        } else if (peaceResult.detected && peaceResult.confidence > 0.8 && canSendAlert("Paz")) {
          const peaceSign = await getSignByName("Paz");
          if (peaceSign) {
            const detection: DetectionResult = {
              sign: peaceSign,
              confidence: peaceResult.confidence,
              timestamp: new Date()
            };
            
            setDetectedSign(detection);
            toast.success("✌️ PAZ detectada", {
              description: `Confianza: ${(peaceResult.confidence * 100).toFixed(1)}%`,
              duration: 2000,
            });
            
            setTimeout(() => setDetectedSign(null), 2000);
          }
        }
      }
      
      setTimeout(() => setIsDetecting(false), 100);
    } else {
      if (frameCountRef.current > 10) {
        resetDetectionSystem();
      }
    }
  }, [smoothLandmarks, detectFeverSign, detectOKSign, detectLoveSign, detectPeaceSign, canSendAlert, getSignByName, resetDetectionSystem]);

  // Effect principal para inicializar MediaPipe
  useEffect(() => {
    if (!videoElement || isInitializedRef.current) return;
    
    const initializeHands = async () => {
      try {
        console.log('🔄 Iniciando carga de MediaPipe...');
        
        // Cargar MediaPipe
        const loaded = await loadMediaPipe();
        if (!loaded) {
          throw new Error('No se pudo cargar MediaPipe');
        }
        
        // Esperar un poco para asegurar que todo esté cargado
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        if (!window.Hands) {
          throw new Error('MediaPipe Hands no está disponible');
        }
        
        const hands = new window.Hands({
          locateFile: (file: string) => {
            return `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`;
          }
        });
        
        hands.setOptions({
          maxNumHands: 2,
          modelComplexity: 1,
          minDetectionConfidence: 0.7,
          minTrackingConfidence: 0.5
        });
        
        hands.onResults(onResults);
        handsRef.current = hands;
        isInitializedRef.current = true;
        
        console.log('✅ MediaPipe inicializado correctamente');
        
        const processFrame = async () => {
          if (videoElement && videoElement.readyState >= 2 && handsRef.current) {
            try {
              await handsRef.current.send({image: videoElement});
            } catch (error) {
              console.warn('Error procesando frame:', error);
            }
          }
          if (isInitializedRef.current) {
            requestAnimationFrame(processFrame);
          }
        };
        
        processFrame();
      } catch (error) {
        console.error('❌ Error inicializando MediaPipe:', error);
        toast.error('Error al inicializar la detección de manos');
      }
    };
    
    initializeHands();
    
    return () => {
      if (handsRef.current) {
        try {
          handsRef.current.close();
        } catch (error) {
          console.warn('Error cerrando MediaPipe:', error);
        }
        handsRef.current = null;
      }
      isInitializedRef.current = false;
      resetDetectionSystem();
    };
  }, [videoElement, onResults, resetDetectionSystem, loadMediaPipe]);

  // Callback para establecer la referencia del canvas
  const setCanvasRef = useCallback((canvas: HTMLCanvasElement | null) => {
    canvasRef.current = canvas;
  }, []);

  return {
    detectedSign,
    isDetecting,
    setCanvasRef,
    availableSigns: signs
  };
};
