
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
  const [modelError, setModelError] = useState<string | null>(null);
  
  const loadModel = useCallback(async () => {
    try {
      console.log('🔄 Intentando cargar MediaPipe Hands...');
      setModelError(null);
      
      // Usar un enfoque más simple primero
      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/@mediapipe/hands/hands.js';
      script.onload = async () => {
        try {
          // @ts-ignore - MediaPipe se carga globalmente
          const { Hands } = window;
          
          if (!Hands) {
            throw new Error('MediaPipe Hands no está disponible');
          }
          
          const hands = new Hands({
            locateFile: (file: string) => {
              return `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`;
            }
          });
          
          hands.setOptions({
            maxNumHands: 1,
            modelComplexity: 0, // Usar modelo más simple
            minDetectionConfidence: 0.5,
            minTrackingConfidence: 0.5
          });
          
          hands.onResults((results: any) => {
            if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
              const predictions = results.multiHandLandmarks.map((landmarks: any) => ({
                handInViewConfidence: 0.9,
                boundingBox: {
                  topLeft: [0, 0] as [number, number],
                  bottomRight: [640, 480] as [number, number]
                },
                landmarks: landmarks.map((landmark: any) => [
                  landmark.x * 640,
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
          console.error('❌ Error configurando MediaPipe:', error);
          setModelError('Error configurando MediaPipe');
          setIsModelLoaded(false);
        }
      };
      
      script.onerror = () => {
        console.error('❌ Error cargando script de MediaPipe');
        setModelError('Error cargando MediaPipe desde CDN');
        setIsModelLoaded(false);
      };
      
      document.head.appendChild(script);
      
    } catch (error) {
      console.error('❌ Error general cargando MediaPipe:', error);
      setModelError('Error general de MediaPipe');
      setIsModelLoaded(false);
    }
  }, []);
  
  const detectHands = useCallback(async () => {
    if (!videoElement || !modelRef.current || !isModelLoaded) {
      animationRef.current = requestAnimationFrame(detectHands);
      return;
    }
    
    try {
      await modelRef.current.send({ image: videoElement });
    } catch (error) {
      console.warn('Error en detección de manos:', error);
    }
    
    animationRef.current = requestAnimationFrame(detectHands);
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
    isModelLoaded,
    modelError
  };
};
