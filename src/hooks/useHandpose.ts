
import { useRef, useEffect, useCallback, useState } from 'react';
import * as tf from '@tensorflow/tfjs';
import * as handpose from '@tensorflow-models/handpose';

export const useHandpose = (videoElement: HTMLVideoElement | null) => {
  const modelRef = useRef<any>(null);
  const [isModelLoaded, setIsModelLoaded] = useState(false);
  const [predictions, setPredictions] = useState<any[]>([]);
  const animationRef = useRef<number>();
  
  const loadModel = useCallback(async () => {
    try {
      console.log('🔄 Cargando modelo Handpose...');
      
      // Configurar TensorFlow.js
      await tf.ready();
      
      // Cargar modelo de handpose
      const model = await handpose.load();
      modelRef.current = model;
      setIsModelLoaded(true);
      
      console.log('✅ Modelo Handpose cargado correctamente');
    } catch (error) {
      console.error('❌ Error cargando modelo:', error);
    }
  }, []);
  
  const detectHands = useCallback(async () => {
    if (!videoElement || !modelRef.current || !isModelLoaded) {
      return;
    }
    
    try {
      // Detectar manos en el video
      const predictions = await modelRef.current.estimateHands(videoElement);
      setPredictions(predictions);
      
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
