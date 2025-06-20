
import { useRef, useEffect, useState, useCallback } from 'react';

export const useCamera = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const startCamera = useCallback(async () => {
    try {
      console.log('📹 Iniciando cámara...');
      setError(null);
      
      // Configuración optimizada para velocidad
      const constraints = {
        video: {
          width: { ideal: 640, max: 640 },
          height: { ideal: 480, max: 480 },
          facingMode: 'user',
          frameRate: { ideal: 30, max: 30 }
        },
        audio: false // No necesitamos audio para este caso
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
        
        // Esperar a que el video esté listo
        await new Promise((resolve) => {
          if (videoRef.current) {
            videoRef.current.onloadedmetadata = () => {
              console.log('✅ Video metadata cargada');
              resolve(true);
            };
          }
        });
        
        setIsStreaming(true);
        console.log('✅ Cámara iniciada correctamente');
      }
    } catch (err) {
      console.error('❌ Error accediendo a la cámara:', err);
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
      
      if (errorMessage.includes('Permission denied')) {
        setError('Permiso de cámara denegado. Por favor, permite el acceso a la cámara.');
      } else if (errorMessage.includes('NotFoundError')) {
        setError('No se encontró una cámara disponible.');
      } else {
        setError('No se pudo acceder a la cámara. Verifica que esté conectada y disponible.');
      }
    }
  }, []);

  const stopCamera = useCallback(() => {
    console.log('🛑 Deteniendo cámara...');
    
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => {
        track.stop();
        console.log('🔌 Track detenido:', track.kind);
      });
      streamRef.current = null;
    }
    
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    
    setIsStreaming(false);
    console.log('✅ Cámara detenida');
  }, []);

  useEffect(() => {
    return () => {
      // Cleanup al desmontar
      stopCamera();
    };
  }, [stopCamera]);

  return {
    videoRef,
    isStreaming,
    error,
    startCamera,
    stopCamera
  };
};
