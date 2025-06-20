
import { useCallback } from 'react';
import { Sign } from '@/types/sign';

export const useCustomSignDetection = () => {
  
  const detectCustomSign = useCallback((landmarks: number[][], storedSigns: Sign[]) => {
    if (!landmarks || landmarks.length < 21) {
      console.log('❌ No hay suficientes landmarks:', landmarks?.length);
      return { detected: false, confidence: 0, signName: '', matchedSign: null };
    }
    
    console.log('🔍 Comparando con', storedSigns.length, 'señas almacenadas');
    
    let bestMatch = { confidence: 0, signName: '', matchedSign: null as Sign | null };
    
    // Comparar con cada seña almacenada
    for (const sign of storedSigns) {
      if (sign.landmarks && sign.landmarks.length > 0) {
        // Comparar con cada frame de la secuencia grabada
        let maxSimilarity = 0;
        
        for (const frameData of sign.landmarks) {
          const similarity = compareHandLandmarks(landmarks, frameData);
          maxSimilarity = Math.max(maxSimilarity, similarity);
        }
        
        console.log(`📊 Similitud máxima con "${sign.name}":`, maxSimilarity.toFixed(3));
        
        if (maxSimilarity > bestMatch.confidence) {
          bestMatch = {
            confidence: maxSimilarity,
            signName: sign.name,
            matchedSign: sign
          };
        }
      }
    }
    
    // Umbral más estricto para secuencias
    if (bestMatch.confidence > 0.75) {
      console.log(`✅ Seña detectada: ${bestMatch.signName} con ${(bestMatch.confidence * 100).toFixed(1)}% de confianza`);
      return { 
        detected: true, 
        confidence: bestMatch.confidence, 
        signName: bestMatch.signName,
        matchedSign: bestMatch.matchedSign 
      };
    }
    
    return { detected: false, confidence: bestMatch.confidence, signName: '', matchedSign: null };
  }, []);
  
  // Función para comparar landmarks de manos
  const compareHandLandmarks = useCallback((current: number[][], stored: number[][]) => {
    if (!current || !stored || current.length !== stored.length) {
      return 0;
    }
    
    // Normalizar ambos conjuntos de landmarks
    const normalizedCurrent = normalizeLandmarks(current);
    const normalizedStored = normalizeLandmarks(stored);
    
    // Calcular similitud usando distancia euclidiana promedio
    let totalDistance = 0;
    const pointsToCompare = Math.min(normalizedCurrent.length, normalizedStored.length);
    
    for (let i = 0; i < pointsToCompare; i++) {
      const distance = euclideanDistance(normalizedCurrent[i], normalizedStored[i]);
      totalDistance += distance;
    }
    
    const averageDistance = totalDistance / pointsToCompare;
    
    // Convertir distancia a similitud (1 = idéntico, 0 = completamente diferente)
    const similarity = Math.max(0, 1 - (averageDistance / 200)); // Normalizado para landmarks de mano
    
    return similarity;
  }, []);
  
  // Normalizar landmarks relativos a la muñeca
  const normalizeLandmarks = useCallback((landmarks: number[][]) => {
    if (!landmarks || landmarks.length === 0) return [];
    
    const wrist = landmarks[0]; // Punto de referencia (muñeca)
    
    return landmarks.map(point => [
      point[0] - wrist[0], // Relativo en X
      point[1] - wrist[1], // Relativo en Y
      point[2] || 0        // Z si existe
    ]);
  }, []);
  
  // Calcular distancia euclidiana entre dos puntos
  const euclideanDistance = useCallback((point1: number[], point2: number[]) => {
    const dx = point1[0] - point2[0];
    const dy = point1[1] - point2[1];
    const dz = (point1[2] || 0) - (point2[2] || 0);
    
    return Math.sqrt(dx * dx + dy * dy + dz * dz);
  }, []);
  
  return { detectCustomSign };
};
