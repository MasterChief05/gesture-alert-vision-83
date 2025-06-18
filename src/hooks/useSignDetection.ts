
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
  
  // Sistema de cooldown para evitar mensajes infinitos
  const lastDetectionRef = useRef<{ sign: string; timestamp: number } | null>(null);
  const DETECTION_COOLDOWN = 3000; // 3 segundos entre detecciones de la misma seña

  // Función para detectar seña de amor (corazón con las manos)
  const detectLoveSign = (landmarks: any[]) => {
    if (landmarks.length < 2) return false;
    
    const leftHand = landmarks[0];
    const rightHand = landmarks[1];
    
    // Verificar si las manos están formando un corazón
    // Puntos de referencia para dedos índice y pulgar
    const leftThumb = leftHand[4];
    const leftIndex = leftHand[8];
    const rightThumb = rightHand[4];
    const rightIndex = rightHand[8];
    
    // Calcular distancias para determinar si forman corazón
    const thumbDistance = Math.abs(leftThumb.x - rightThumb.x);
    const indexDistance = Math.abs(leftIndex.x - rightIndex.x);
    
    return thumbDistance < 0.1 && indexDistance < 0.15;
  };

  // Función para detectar seña de paz (V con dos dedos)
  const detectPeaceSign = (landmarks: any[]) => {
    for (const hand of landmarks) {
      // Puntos de referencia: índice (8), medio (12), anular (16), meñique (20)
      const indexTip = hand[8];
      const middleTip = hand[12];
      const ringTip = hand[16];
      const pinkyTip = hand[20];
      const indexMcp = hand[5];
      
      // Verificar si índice y medio están extendidos
      const indexExtended = indexTip.y < indexMcp.y;
      const middleExtended = middleTip.y < indexMcp.y;
      const ringFolded = ringTip.y > indexMcp.y;
      const pinkyFolded = pinkyTip.y > indexMcp.y;
      
      if (indexExtended && middleExtended && ringFolded && pinkyFolded) {
        return true;
      }
    }
    return false;
  };

  // Función para verificar si puede enviar alerta (cooldown)
  const canSendAlert = (signName: string) => {
    const now = Date.now();
    if (!lastDetectionRef.current || 
        lastDetectionRef.current.sign !== signName || 
        (now - lastDetectionRef.current.timestamp) > DETECTION_COOLDOWN) {
      lastDetectionRef.current = { sign: signName, timestamp: now };
      return true;
    }
    return false;
  };

  const onResults = useCallback(async (results: Results) => {
    if (!canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Limpiar canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
      setIsDetecting(true);
      
      // Dibujar landmarks
      for (const landmarks of results.multiHandLandmarks) {
        drawConnectors(ctx, landmarks, HAND_CONNECTIONS, {color: '#00FF00', lineWidth: 2});
        drawLandmarks(ctx, landmarks, {color: '#FF0000', lineWidth: 1});
      }
      
      // Detectar señas con cooldown y buscar en IndexedDB
      if (detectLoveSign(results.multiHandLandmarks) && canSendAlert("Amor")) {
        const loveSign = await getSignByName("Amor");
        if (loveSign) {
          const detection: DetectionResult = {
            sign: loveSign,
            confidence: 0.95,
            timestamp: new Date()
          };
          
          setDetectedSign(detection);
          toast.success("💖 AMOR detectado", {
            description: "Se ha reconocido la seña de amor de tu base de datos local",
            duration: 4000,
          });
          
          setTimeout(() => setDetectedSign(null), 4000);
        }
      } else if (detectPeaceSign(results.multiHandLandmarks) && canSendAlert("Paz")) {
        const peaceSign = await getSignByName("Paz");
        if (peaceSign) {
          const detection: DetectionResult = {
            sign: peaceSign,
            confidence: 0.92,
            timestamp: new Date()
          };
          
          setDetectedSign(detection);
          toast.success("✌️ PAZ detectada", {
            description: "Se ha reconocido la seña de paz de tu base de datos local",
            duration: 4000,
          });
          
          setTimeout(() => setDetectedSign(null), 4000);
        }
      }
      
      setTimeout(() => setIsDetecting(false), 100);
    }
  }, [getSignByName]);

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
      minDetectionConfidence: 0.5,
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
