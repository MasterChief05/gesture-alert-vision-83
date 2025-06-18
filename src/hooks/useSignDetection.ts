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
  
  // Constantes para detección
  const DETECTION_COOLDOWN = 1000;

  // Función mejorada para detectar "Fiebre Alta"
  const detectFeverSign = useCallback((landmarks: any[]) => {
    for (const hand of landmarks) {
      const thumb = hand[4];
      const index = hand[8];
      const middle = hand[12];
      const ring = hand[16];
      const pinky = hand[20];
      const wrist = hand[0];
      
      // Detectar posición específica de fiebre
      const thumbIndexDistance = Math.sqrt(
        Math.pow(thumb.x - index.x, 2) + Math.pow(thumb.y - index.y, 2)
      );
      
      // Verificar que el pulgar e índice estén cerca (como en la imagen)
      const thumbIndexClose = thumbIndexDistance < 0.08;
      
      // Verificar que los otros dedos estén extendidos
      const middleExtended = middle.y < wrist.y - 0.05;
      const ringExtended = ring.y < wrist.y - 0.05;
      const pinkyExtended = pinky.y < wrist.y - 0.05;
      
      // Verificar orientación de la mano
      const handUpright = wrist.y > thumb.y;
      
      if (thumbIndexClose && middleExtended && ringExtended && pinkyExtended && handUpright) {
        return { detected: true, confidence: 0.95 };
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

  // Control de cooldown
  const canDetect = useCallback(() => {
    const now = Date.now();
    return (now - lastDetectionRef.current) > DETECTION_COOLDOWN;
  }, []);

  // Función principal de procesamiento
  const onResults = useCallback(async (results: any) => {
    if (!canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Limpiar canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
      setIsDetecting(true);
      
      // Dibujar puntos de referencia
      results.multiHandLandmarks.forEach((landmarks: any) => {
        landmarks.forEach((landmark: any, i: number) => {
          const x = landmark.x * canvas.width;
          const y = landmark.y * canvas.height;
          
          // Puntos importantes más visibles
          const isImportantPoint = [0, 4, 8, 12, 16, 20].includes(i);
          
          ctx.beginPath();
          ctx.arc(x, y, isImportantPoint ? 6 : 3, 0, 2 * Math.PI);
          ctx.fillStyle = isImportantPoint ? '#FF0000' : '#00FF00';
          ctx.fill();
          
          // Números en puntos importantes
          if (isImportantPoint) {
            ctx.fillStyle = '#FFFFFF';
            ctx.font = '12px Arial';
            ctx.strokeStyle = '#000000';
            ctx.lineWidth = 2;
            ctx.strokeText(i.toString(), x + 8, y - 8);
            ctx.fillText(i.toString(), x + 8, y - 8);
          }
        });
        
        // Conectar puntos importantes
        const importantPoints = [0, 4, 8, 12, 16, 20];
        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = 2;
        for (let i = 0; i < importantPoints.length - 1; i++) {
          const point1 = landmarks[importantPoints[i]];
          const point2 = landmarks[importantPoints[i + 1]];
          
          ctx.beginPath();
          ctx.moveTo(point1.x * canvas.width, point1.y * canvas.height);
          ctx.lineTo(point2.x * canvas.width, point2.y * canvas.height);
          ctx.stroke();
        }
      });
      
      // Detectar seña de fiebre
      if (canDetect()) {
        const feverResult = detectFeverSign(results.multiHandLandmarks);
        
        if (feverResult.detected && feverResult.confidence > 0.9) {
          const feverSign = await getSignByName("Fiebre Alta");
          if (feverSign) {
            lastDetectionRef.current = Date.now();
            const detection: DetectionResult = {
              sign: feverSign,
              confidence: feverResult.confidence,
              timestamp: new Date()
            };
            
            setDetectedSign(detection);
            console.log('🌡️ Seña de fiebre detectada:', detection);
            
            setTimeout(() => setDetectedSign(null), 2000);
          }
        }
      }
      
      setTimeout(() => setIsDetecting(false), 100);
    }
  }, [detectFeverSign, canDetect, getSignByName]);

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

  // Inicialización
  useEffect(() => {
    if (!videoElement || isInitializedRef.current) return;
    
    const initializeHands = async () => {
      try {
        // Cargar MediaPipe
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

        await new Promise(resolve => setTimeout(resolve, 1000));
        
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
          modelComplexity: 1,
          minDetectionConfidence: 0.7,
          minTrackingConfidence: 0.5
        });
        
        hands.onResults(onResults);
        handsRef.current = hands;
        isInitializedRef.current = true;
        
        console.log('✅ MediaPipe inicializado para detección de fiebre');
        
        // Loop de procesamiento
        const processFrame = async () => {
          if (videoElement && videoElement.readyState >= 2 && handsRef.current && isInitializedRef.current) {
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
        console.error('❌ Error inicialización MediaPipe:', error);
        toast.error('Error iniciando detección de fiebre');
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
    };
  }, [videoElement, onResults]);

  const setCanvasRef = useCallback((canvas: HTMLCanvasElement | null) => {
    canvasRef.current = canvas;
  }, []);

  return {
    detectedSign,
    isDetecting,
    setCanvasRef
  };
};
