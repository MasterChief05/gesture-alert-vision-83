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

// Declarar tipos globales para MediaPipe
declare global {
  interface Window {
    Hands: any;
  }
}

export const useHandpose = (videoElement: HTMLVideoElement | null) => {
  const modelRef = useRef<any>(null);
  const [isModelLoaded, setIsModelLoaded] = useState(false);
  const [predictions, setPredictions] = useState<HandPrediction[]>([]);
  const animationRef = useRef<number>();
  const [modelError, setModelError] = useState<string | null>(null);
  const isLoadingRef = useRef(false);
  
  const loadModel = useCallback(async () => {
    // Evitar cargas múltiples
    if (isLoadingRef.current || modelRef.current) {
      console.log('⚠️ Modelo ya se está cargando o ya está cargado');
      return;
    }
    
    try {
      console.log('🔄 Cargando MediaPipe Hands de forma optimizada...');
      setModelError(null);
      isLoadingRef.current = true;
      
      // Verificar si MediaPipe ya está disponible globalmente
      if (window.Hands) {
        console.log('✅ MediaPipe ya disponible globalmente');
        await initializeHands();
        return;
      }
      
      // Cargar script de forma más eficiente
      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/@mediapipe/hands/hands.js';
      script.async = true;
      
      const loadPromise = new Promise((resolve, reject) => {
        script.onload = resolve;
        script.onerror = reject;
      });
      
      document.head.appendChild(script);
      await loadPromise;
      
      await initializeHands();
      
    } catch (error) {
      console.error('❌ Error cargando MediaPipe:', error);
      setModelError('Error cargando MediaPipe');
      setIsModelLoaded(false);
      isLoadingRef.current = false;
    }
  }, []);
  
  const initializeHands = async () => {
    try {
      const { Hands } = window;
      
      if (!Hands) {
        throw new Error('MediaPipe Hands no disponible');
      }
      
      const hands = new Hands({
        locateFile: (file: string) => {
          return `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`;
        }
      });
      
      // Configuración optimizada para velocidad
      hands.setOptions({
        maxNumHands: 1,
        modelComplexity: 0, // Modelo más rápido
        minDetectionConfidence: 0.7, // Aumentar para mejor detección
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
      isLoadingRef.current = false;
      console.log('✅ MediaPipe Hands configurado correctamente');
      
    } catch (error) {
      console.error('❌ Error inicializando MediaPipe:', error);
      setModelError('Error inicializando MediaPipe');
      setIsModelLoaded(false);
      isLoadingRef.current = false;
    }
  };
  
  const detectHands = useCallback(async () => {
    if (!videoElement || !modelRef.current || !isModelLoaded) {
      if (videoElement && isModelLoaded) {
        animationRef.current = requestAnimationFrame(detectHands);
      }
      return;
    }
    
    try {
      // Verificar que el video tenga datos
      if (videoElement.readyState >= 2) {
        await modelRef.current.send({ image: videoElement });
      }
    } catch (error) {
      console.warn('⚠️ Error en detección:', error);
    }
    
    animationRef.current = requestAnimationFrame(detectHands);
  }, [videoElement, isModelLoaded]);
  
  useEffect(() => {
    if (videoElement && isModelLoaded && !animationRef.current) {
      console.log('🎯 Iniciando detección de manos');
      detectHands();
    }
    
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = undefined;
      }
    };
  }, [videoElement, isModelLoaded, detectHands]);
  
  useEffect(() => {
    loadModel();
    
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      isLoadingRef.current = false;
    };
  }, []);
  
  return {
    predictions,
    isModelLoaded,
    modelError
  };
};
