
import { useRef, useEffect, useCallback, useState } from 'react';

// Tipos para TensorFlow.js y Handpose
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
      console.log('🔄 Cargando TensorFlow.js y modelo Handpose...');
      
      // Importación dinámica para evitar problemas de build
      const [tf, handposeModule] = await Promise.all([
        import('@tensorflow/tfjs'),
        import('@tensorflow-models/handpose')
      ]);
      
      // Configurar TensorFlow.js
      await tf.ready();
      console.log('✅ TensorFlow.js listo');
      
      // Cargar modelo de handpose
      const model = await handposeModule.load();
      modelRef.current = model;
      setIsModelLoaded(true);
      
      console.log('✅ Modelo Handpose cargado correctamente');
    } catch (error) {
      console.error('❌ Error cargando modelo:', error);
      setIsModelLoaded(false);
    }
  }, []);
  
  const detectHands = useCallback(async () => {
    if (!videoElement || !modelRef.current || !isModelLoaded) {
      return;
    }
    
    try {
      // Detectar manos en el video
      const predictions = await modelRef.current.estimateHands(videoElement);
      setPredictions(predictions as HandPrediction[]);
      
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
