
import { useState, useEffect, useCallback, useRef } from 'react';
import { Sign, DetectionResult } from '@/types/sign';
import { useSigns } from '@/hooks/useSigns';
import { toast } from 'sonner';
import { Hands, Results, HAND_CONNECTIONS } from '@mediapipe/hands';
import { drawConnectors, drawLandmarks } from '@mediapipe/drawing_utils';

export const useSignDetection = (videoElement: HTMLVideoElement | null) => {
  const [detectedSign, setDetectedSign] = useState<DetectionResult | null>(null);
  const [isDetecting, setIsDetecting] = useState(false);
  const { signs, getSignByName } = useSigns();
  const handsRef = useRef<Hands | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  
  // Sistema mejorado para evitar landmarks pillados - referencias estables
  const lastDetectionRef = useRef<{ sign: string; timestamp: number } | null>(null);
  const landmarksHistoryRef = useRef<number[][][]>([]);
  const frameCountRef = useRef(0);
  const isInitializedRef = useRef(false);
  
  // Constantes para control de detección
  const DETECTION_COOLDOWN = 2000;
  const HISTORY_SIZE = 2; // Historial muy pequeño para evitar lag
  const RESET_INTERVAL = 60; // Reset cada 60 frames (~2 segundos)

  // Función de reset mejorada
  const resetDetectionSystem = useCallback(() => {
    landmarksHistoryRef.current = [];
    frameCountRef.current = 0;
    lastDetectionRef.current = null;
    setDetectedSign(null);
    console.log('🔄 Sistema de detección reiniciado completamente');
  }, []);

  // Función para suavizar landmarks con reset automático frecuente
  const smoothLandmarks = useCallback((currentLandmarks: any[]) => {
    frameCountRef.current++;
    
    // Reset automático cada cierto número de frames
    if (frameCountRef.current >= RESET_INTERVAL) {
      resetDetectionSystem();
      return [];
    }
    
    const normalizedLandmarks = currentLandmarks.map(hand => 
      hand.map((point: any) => [point.x, point.y, point.z || 0])
    );
    
    // Mantener historial muy pequeño
    if (landmarksHistoryRef.current.length >= HISTORY_SIZE) {
      landmarksHistoryRef.current.shift();
    }
    
    landmarksHistoryRef.current.push(normalizedLandmarks);
    
    // Suavizado muy ligero - solo promedio simple entre frame actual y anterior
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
  const onResults = useCallback(async (results: Results) => {
    if (!canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Limpiar canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
      setIsDetecting(true);
      
      // Suavizar landmarks
      const smoothedLandmarks = smoothLandmarks(results.multiHandLandmarks);
      
      // Solo dibujar si tenemos landmarks suavizados
      if (smoothedLandmarks.length > 0) {
        results.multiHandLandmarks.forEach((landmarks, index) => {
          const color = index === 0 ? '#00FF00' : '#0099FF';
          drawConnectors(ctx, landmarks, HAND_CONNECTIONS, {color, lineWidth: 2});
          drawLandmarks(ctx, landmarks, {color: '#FF0000', lineWidth: 1, radius: 3});
        });
        
        // Detectar señas
        const okResult = detectOKSign(results.multiHandLandmarks);
        const loveResult = detectLoveSign(results.multiHandLandmarks);
        const peaceResult = detectPeaceSign(results.multiHandLandmarks);
        
        // Procesar detecciones con prioridad
        if (okResult.detected && okResult.confidence > 0.85 && canSendAlert("OK")) {
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
      // Reset cuando no hay manos detectadas por un tiempo
      if (frameCountRef.current > 10) {
        resetDetectionSystem();
      }
    }
  }, [smoothLandmarks, detectOKSign, detectLoveSign, detectPeaceSign, canSendAlert, getSignByName, resetDetectionSystem]);

  // Effect principal para inicializar MediaPipe
  useEffect(() => {
    if (!videoElement || isInitializedRef.current) return;
    
    const initializeHands = async () => {
      try {
        const hands = new Hands({
          locateFile: (file) => {
            return `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`;
          }
        });
        
        hands.setOptions({
          maxNumHands: 2,
          modelComplexity: 0, // Reducido para mejor rendimiento
          minDetectionConfidence: 0.7,
          minTrackingConfidence: 0.5
        });
        
        hands.onResults(onResults);
        handsRef.current = hands;
        isInitializedRef.current = true;
        
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
        console.error('Error inicializando MediaPipe:', error);
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
  }, [videoElement, onResults, resetDetectionSystem]);

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
