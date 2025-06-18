
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
  
  // Sistema de cooldown mejorado con seguimiento de landmarks
  const lastDetectionRef = useRef<{ sign: string; timestamp: number; landmarks: number[][] } | null>(null);
  const DETECTION_COOLDOWN = 2000; // 2 segundos entre detecciones
  const landmarksHistoryRef = useRef<number[][][]>([]); // Historial de landmarks para suavizado
  const HISTORY_SIZE = 5; // Tamaño del historial para suavizado

  // Función para suavizar landmarks usando promedio móvil
  const smoothLandmarks = (currentLandmarks: any[]) => {
    if (landmarksHistoryRef.current.length >= HISTORY_SIZE) {
      landmarksHistoryRef.current.shift();
    }
    
    const normalizedLandmarks = currentLandmarks.map(hand => 
      hand.map((point: any) => [point.x, point.y, point.z || 0])
    );
    
    landmarksHistoryRef.current.push(normalizedLandmarks);
    
    // Calcular promedio móvil
    if (landmarksHistoryRef.current.length > 1) {
      const smoothed = normalizedLandmarks.map((hand, handIndex) => 
        hand.map((point, pointIndex) => {
          const sum = landmarksHistoryRef.current.reduce((acc, frame) => {
            if (frame[handIndex] && frame[handIndex][pointIndex]) {
              return [
                acc[0] + frame[handIndex][pointIndex][0],
                acc[1] + frame[handIndex][pointIndex][1],
                acc[2] + (frame[handIndex][pointIndex][2] || 0)
              ];
            }
            return acc;
          }, [0, 0, 0]);
          
          const count = landmarksHistoryRef.current.length;
          return [sum[0] / count, sum[1] / count, sum[2] / count];
        })
      );
      return smoothed;
    }
    
    return normalizedLandmarks;
  };

  // Función mejorada para detectar seña de amor con landmarks dinámicos
  const detectLoveSign = (landmarks: any[]) => {
    if (landmarks.length < 2) return { detected: false, confidence: 0 };
    
    const leftHand = landmarks[0];
    const rightHand = landmarks[1];
    
    // Puntos clave para formar corazón
    const leftThumb = leftHand[4];
    const leftIndex = leftHand[8];
    const rightThumb = rightHand[4];
    const rightIndex = rightHand[8];
    const leftWrist = leftHand[0];
    const rightWrist = rightHand[0];
    
    // Calcular distancias y ángulos
    const thumbDistance = Math.abs(leftThumb.x - rightThumb.x);
    const indexDistance = Math.abs(leftIndex.x - rightIndex.x);
    const wristDistance = Math.abs(leftWrist.x - rightWrist.x);
    
    // Verificar altura relativa de las manos
    const handsHeight = Math.abs(leftWrist.y - rightWrist.y);
    
    // Condiciones más específicas para detectar corazón
    const isHeartShape = thumbDistance < 0.08 && 
                        indexDistance < 0.12 && 
                        wristDistance > 0.15 && 
                        handsHeight < 0.1;
    
    let confidence = 0;
    if (isHeartShape) {
      confidence = Math.max(0.8, 1.0 - (thumbDistance + indexDistance) * 2);
    }
    
    return { detected: isHeartShape, confidence };
  };

  // Función mejorada para detectar seña de paz con landmarks dinámicos
  const detectPeaceSign = (landmarks: any[]) => {
    for (const hand of landmarks) {
      const indexTip = hand[8];
      const middleTip = hand[12];
      const ringTip = hand[16];
      const pinkyTip = hand[20];
      const indexMcp = hand[5];
      const middleMcp = hand[9];
      const ringMcp = hand[13];
      const pinkyMcp = hand[17];
      
      // Verificar extensión de dedos con más precisión
      const indexExtended = (indexMcp.y - indexTip.y) > 0.05;
      const middleExtended = (middleMcp.y - middleTip.y) > 0.05;
      const ringFolded = (ringTip.y - ringMcp.y) > -0.02;
      const pinkyFolded = (pinkyTip.y - pinkyMcp.y) > -0.02;
      
      // Verificar separación entre índice y medio
      const fingerSeparation = Math.abs(indexTip.x - middleTip.x);
      
      if (indexExtended && middleExtended && ringFolded && pinkyFolded && fingerSeparation > 0.03) {
        const confidence = Math.min(0.95, 0.7 + fingerSeparation * 5);
        return { detected: true, confidence };
      }
    }
    return { detected: false, confidence: 0 };
  };

  // Función para comparar landmarks con señas almacenadas
  const compareWithStoredSigns = async (currentLandmarks: number[][]) => {
    for (const sign of signs) {
      if (sign.landmarks && sign.landmarks.length > 0) {
        const similarity = calculateLandmarkSimilarity(currentLandmarks, sign.landmarks);
        if (similarity > 0.75) { // Umbral de similitud
          return { sign, confidence: similarity };
        }
      }
    }
    return null;
  };

  // Función para calcular similitud entre landmarks
  const calculateLandmarkSimilarity = (landmarks1: number[][], landmarks2: number[][]) => {
    if (!landmarks1 || !landmarks2 || landmarks1.length === 0 || landmarks2.length === 0) {
      return 0;
    }

    let totalDistance = 0;
    let pointCount = 0;

    const minLength = Math.min(landmarks1.length, landmarks2.length);
    
    for (let i = 0; i < minLength; i++) {
      if (landmarks1[i] && landmarks2[i]) {
        const dx = landmarks1[i][0] - landmarks2[i][0];
        const dy = landmarks1[i][1] - landmarks2[i][1];
        const distance = Math.sqrt(dx * dx + dy * dy);
        totalDistance += distance;
        pointCount++;
      }
    }

    if (pointCount === 0) return 0;
    
    const avgDistance = totalDistance / pointCount;
    const similarity = Math.max(0, 1 - (avgDistance * 5)); // Normalizar a 0-1
    
    return similarity;
  };

  // Verificar si puede enviar alerta con landmarks dinámicos
  const canSendAlert = (signName: string, currentLandmarks: number[][]) => {
    const now = Date.now();
    if (!lastDetectionRef.current || 
        lastDetectionRef.current.sign !== signName || 
        (now - lastDetectionRef.current.timestamp) > DETECTION_COOLDOWN) {
      
      lastDetectionRef.current = { 
        sign: signName, 
        timestamp: now, 
        landmarks: currentLandmarks 
      };
      return true;
    }
    return false;
  };

  const onResults = useCallback(async (results: Results) => {
    if (!canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Limpiar canvas con animación suave
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
      setIsDetecting(true);
      
      // Suavizar landmarks
      const smoothedLandmarks = smoothLandmarks(results.multiHandLandmarks);
      
      // Dibujar landmarks con colores dinámicos
      results.multiHandLandmarks.forEach((landmarks, index) => {
        const color = index === 0 ? '#00FF00' : '#0099FF';
        drawConnectors(ctx, landmarks, HAND_CONNECTIONS, {color, lineWidth: 3});
        drawLandmarks(ctx, landmarks, {color: '#FF0000', lineWidth: 2, radius: 4});
      });
      
      // Detectar señas predefinidas con landmarks suavizados
      const loveResult = detectLoveSign(results.multiHandLandmarks);
      const peaceResult = detectPeaceSign(results.multiHandLandmarks);
      
      // Preparar landmarks para comparación
      const flatLandmarks = smoothedLandmarks.flat();
      
      if (loveResult.detected && loveResult.confidence > 0.8 && canSendAlert("Amor", flatLandmarks)) {
        const loveSign = await getSignByName("Amor");
        if (loveSign) {
          const detection: DetectionResult = {
            sign: loveSign,
            confidence: loveResult.confidence,
            timestamp: new Date()
          };
          
          setDetectedSign(detection);
          toast.success("💖 AMOR detectado", {
            description: `Confianza: ${(loveResult.confidence * 100).toFixed(1)}% - Landmarks dinámicos`,
            duration: 3000,
          });
          
          setTimeout(() => setDetectedSign(null), 3000);
        }
      } else if (peaceResult.detected && peaceResult.confidence > 0.8 && canSendAlert("Paz", flatLandmarks)) {
        const peaceSign = await getSignByName("Paz");
        if (peaceSign) {
          const detection: DetectionResult = {
            sign: peaceSign,
            confidence: peaceResult.confidence,
            timestamp: new Date()
          };
          
          setDetectedSign(detection);
          toast.success("✌️ PAZ detectada", {
            description: `Confianza: ${(peaceResult.confidence * 100).toFixed(1)}% - Landmarks dinámicos`,
            duration: 3000,
          });
          
          setTimeout(() => setDetectedSign(null), 3000);
        }
      } else {
        // Comparar con señas almacenadas en la base de datos
        const storedMatch = await compareWithStoredSigns(flatLandmarks);
        if (storedMatch && canSendAlert(storedMatch.sign.name, flatLandmarks)) {
          const detection: DetectionResult = {
            sign: storedMatch.sign,
            confidence: storedMatch.confidence,
            timestamp: new Date()
          };
          
          setDetectedSign(detection);
          toast.success(`🖐️ ${storedMatch.sign.name.toUpperCase()} detectada`, {
            description: `Confianza: ${(storedMatch.confidence * 100).toFixed(1)}% - Seña personalizada`,
            duration: 3000,
          });
          
          setTimeout(() => setDetectedSign(null), 3000);
        }
      }
      
      setTimeout(() => setIsDetecting(false), 100);
    } else {
      // Limpiar historial cuando no hay manos detectadas
      landmarksHistoryRef.current = [];
    }
  }, [getSignByName, signs]);

  useEffect(() => {
    if (!videoElement) return;
    
    const hands = new Hands({
      locateFile: (file) => {
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
    
    const processFrame = async () => {
      if (videoElement && videoElement.readyState >= 2) {
        await hands.send({image: videoElement});
      }
      requestAnimationFrame(processFrame);
    };
    
    processFrame();
    
    return () => {
      if (handsRef.current) {
        handsRef.current.close();
      }
    };
  }, [videoElement, onResults]);

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
