
import { useRef, useEffect, useCallback, useState } from 'react';

// Tipos para MediaPipe Hands
interface HandPrediction {
  handInViewConfidence: number;
  boundingBox: {
    topLeft: [number, number];
    bottomRight: [number, number];
  };
  landmarks: number[][];
  annotations: {
    [key: string]: number[][];
  };
}

export const useHandpose = (videoElement: HTMLVideoElement | null) => {
  const modelRef = useRef<any>(null);
  const [isModelLoaded, setIsModelLoaded] = useState(false);
  const [predictions, setPredictions] = useState<HandPrediction[]>([]);
  const animationRef = useRef<number>();
  
  const loadModel = useCallback(async () => {
    try {
      console.log('🔄 Cargando MediaPipe Hands...');
      
      // Usar MediaPipe Hands en lugar de TensorFlow
      const { Hands } = await import('@mediapipe/hands');
      const { drawConnectors, drawLandmarks } = await import('@mediapipe/drawing_utils');
      
      console.log('✅ MediaPipe Hands importado');
      
      // Configurar MediaPipe Hands
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
      
      hands.onResults((results) => {
        if (results.multiHandLandmarks) {
          const predictions = results.multiHandLandmarks.map((landmarks, index) => ({
            handInViewConfidence: 0.9,
            boundingBox: {
              topLeft: [0, 0] as [number, number],
              bottomRight: [100, 100] as [number, number]
            },
            landmarks: landmarks.map(landmark => [
              landmark.x * 640, // Escalar a dimensiones del video
              landmark.y * 480,
              landmark.z || 0
            ]),
            annotations: {}
          }));
          setPredictions(predictions);
        } else {
          setPredictions([]);
        }
      });
      
      modelRef.current = hands;
      setIsModelLoaded(true);
      
      console.log('✅ MediaPipe Hands cargado correctamente');
    } catch (error) {
      console.error('❌ Error cargando MediaPipe:', error);
      setIsModelLoaded(false);
    }
  }, []);
  
  const detectHands = useCallback(async () => {
    if (!videoElement || !modelRef.current || !isModelLoaded) {
      return;
    }
    
    try {
      // Enviar frame a MediaPipe
      await modelRef.current.send({ image: videoElement });
      
      // Continuar detectando
      animationRef.current = requestAnimationFrame(detectHands);
    } catch (error) {
      console.warn('Error en detección:', error);
      animationRef.current = requestAnimationFrame(detectHands);
    }
  }, [videoElement, isModelLoaded]);
  
  useEffect(() => {
    if (videoElement && isModelLoaded) {
      detectHands();
    }
    
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [videoElement, isModelLoaded, detectHands]);
  
  useEffect(() => {
    loadModel();
  }, [loadModel]);
  
  return {
    predictions,
    isModelLoaded
  };
};
