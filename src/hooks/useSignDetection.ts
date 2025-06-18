
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
  
  // Sistema mejorado para evitar landmarks pillados
  const lastDetectionRef = useRef<{ sign: string; timestamp: number; frameCount: number } | null>(null);
  const DETECTION_COOLDOWN = 1500; // Reducido para mejor respuesta
  const landmarksHistoryRef = useRef<number[][][]>([]); // Historial más pequeño
  const HISTORY_SIZE = 3; // Reducido para menos lag
  const frameCountRef = useRef(0);
  
  // Reset automático para evitar landmarks pillados
  const resetDetectionSystem = () => {
    landmarksHistoryRef.current = [];
    frameCountRef.current = 0;
    lastDetectionRef.current = null;
    console.log('🔄 Sistema de detección reiniciado');
  };

  // Función para suavizar landmarks con reset automático
  const smoothLandmarks = (currentLandmarks: any[]) => {
    frameCountRef.current++;
    
    // Reset cada 180 frames (6 segundos a 30fps) para evitar acumulación
    if (frameCountRef.current > 180) {
      resetDetectionSystem();
    }
    
    if (landmarksHistoryRef.current.length >= HISTORY_SIZE) {
      landmarksHistoryRef.current.shift();
    }
    
    const normalizedLandmarks = currentLandmarks.map(hand => 
      hand.map((point: any) => [point.x, point.y, point.z || 0])
    );
    
    landmarksHistoryRef.current.push(normalizedLandmarks);
    
    // Suavizado más ligero para mejor respuesta
    if (landmarksHistoryRef.current.length > 1) {
      const smoothed = normalizedLandmarks.map((hand, handIndex) => 
        hand.map((point, pointIndex) => {
          const recent = landmarksHistoryRef.current.slice(-2); // Solo últimos 2 frames
          const sum = recent.reduce((acc, frame) => {
            if (frame[handIndex] && frame[handIndex][pointIndex]) {
              return [
                acc[0] + frame[handIndex][pointIndex][0],
                acc[1] + frame[handIndex][pointIndex][1],
                acc[2] + (frame[handIndex][pointIndex][2] || 0)
              ];
            }
            return acc;
          }, [0, 0, 0]);
          
          const count = recent.length;
          return [sum[0] / count, sum[1] / count, sum[2] / count];
        })
      );
      return smoothed;
    }
    
    return normalizedLandmarks;
  };

  // Nueva función para detectar seña "OK"
  const detectOKSign = (landmarks: any[]) => {
    for (const hand of landmarks) {
      const thumb = hand[4];      // Punta del pulgar
      const index = hand[8];      // Punta del índice
      const middle = hand[12];    // Punta del medio
      const ring = hand[16];      // Punta del anular
      const pinky = hand[20];     // Punta del meñique
      const thumbBase = hand[3];  // Base del pulgar
      const indexBase = hand[5];  // Base del índice
      
      // Distancia entre pulgar e índice (deben estar cerca para formar círculo)
      const thumbIndexDistance = Math.sqrt(
        Math.pow(thumb.x - index.x, 2) + Math.pow(thumb.y - index.y, 2)
      );
      
      // Verificar que otros dedos estén extendidos
      const middleExtended = (indexBase.y - middle.y) > 0.04;
      const ringExtended = (indexBase.y - ring.y) > 0.04;
      const pinkyExtended = (indexBase.y - pinky.y) > 0.04;
      
      // Verificar que el círculo sea del tamaño correcto
      const isCircleSize = thumbIndexDistance > 0.02 && thumbIndexDistance < 0.08;
      
      if (isCircleSize && middleExtended && ringExtended && pinkyExtended) {
        const confidence = Math.max(0.85, 1.0 - thumbIndexDistance * 8);
        console.log(`👌 OK detectado - Distancia: ${thumbIndexDistance}, Confianza: ${confidence}`);
        return { detected: true, confidence };
      }
    }
    return { detected: false, confidence: 0 };
  };

  // Función mejorada para detectar seña de amor
  const detectLoveSign = (landmarks: any[]) => {
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
    
    let confidence = 0;
    if (isHeartShape) {
      confidence = Math.max(0.8, 1.0 - (thumbDistance + indexDistance) * 2);
    }
    
    return { detected: isHeartShape, confidence };
  };

  // Función mejorada para detectar seña de paz
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
  };

  // Función para comparar con señas almacenadas (mejorada)
  const compareWithStoredSigns = async (currentLandmarks: number[][]) => {
    for (const sign of signs) {
      if (sign.landmarks && sign.landmarks.length > 0) {
        const similarity = calculateLandmarkSimilarity(currentLandmarks, sign.landmarks);
        if (similarity > 0.70) { // Umbral más permisivo
          return { sign, confidence: similarity };
        }
      }
    }
    return null;
  };

  // Función mejorada para calcular similitud
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
    const similarity = Math.max(0, 1 - (avgDistance * 4)); // Más tolerante
    
    return similarity;
  };

  // Sistema mejorado de cooldown con reset automático
  const canSendAlert = (signName: string) => {
    const now = Date.now();
    if (!lastDetectionRef.current || 
        lastDetectionRef.current.sign !== signName || 
        (now - lastDetectionRef.current.timestamp) > DETECTION_COOLDOWN) {
      
      lastDetectionRef.current = { 
        sign: signName, 
        timestamp: now,
        frameCount: frameCountRef.current
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
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
      setIsDetecting(true);
      
      // Suavizar landmarks con sistema mejorado
      const smoothedLandmarks = smoothLandmarks(results.multiHandLandmarks);
      
      // Dibujar landmarks con colores dinámicos
      results.multiHandLandmarks.forEach((landmarks, index) => {
        const color = index === 0 ? '#00FF00' : '#0099FF';
        drawConnectors(ctx, landmarks, HAND_CONNECTIONS, {color, lineWidth: 2});
        drawLandmarks(ctx, landmarks, {color: '#FF0000', lineWidth: 1, radius: 3});
      });
      
      // Detectar señas predefinidas
      const loveResult = detectLoveSign(results.multiHandLandmarks);
      const peaceResult = detectPeaceSign(results.multiHandLandmarks);
      const okResult = detectOKSign(results.multiHandLandmarks);
      
      const flatLandmarks = smoothedLandmarks.flat();
      
      // Verificar señas con mejor prioridad
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
            duration: 2500,
          });
          
          setTimeout(() => setDetectedSign(null), 2500);
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
            duration: 2500,
          });
          
          setTimeout(() => setDetectedSign(null), 2500);
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
            duration: 2500,
          });
          
          setTimeout(() => setDetectedSign(null), 2500);
        }
      } else {
        // Comparar con señas almacenadas
        const storedMatch = await compareWithStoredSigns(flatLandmarks);
        if (storedMatch && canSendAlert(storedMatch.sign.name)) {
          const detection: DetectionResult = {
            sign: storedMatch.sign,
            confidence: storedMatch.confidence,
            timestamp: new Date()
          };
          
          setDetectedSign(detection);
          toast.success(`🖐️ ${storedMatch.sign.name.toUpperCase()} detectada`, {
            description: `Confianza: ${(storedMatch.confidence * 100).toFixed(1)}%`,
            duration: 2500,
          });
          
          setTimeout(() => setDetectedSign(null), 2500);
        }
      }
      
      setTimeout(() => setIsDetecting(false), 50);
    } else {
      // Reset cuando no hay manos detectadas
      if (frameCountRef.current > 0) {
        resetDetectionSystem();
      }
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
      resetDetectionSystem();
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
