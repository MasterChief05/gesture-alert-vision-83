
import React, { useState, useEffect } from 'react';
import { useCamera } from '@/hooks/useCamera';
import { useSignDetection } from '@/hooks/useSignDetection';
import { Card } from '@/components/ui/card';
import { Camera, CameraOff, AlertCircle, Hand, Timer } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

export const CameraView: React.FC = () => {
  const { videoRef, isStreaming, error, startCamera, stopCamera } = useCamera();
  const { detectedSign, isDetecting, setCanvasRef } = useSignDetection(
    isStreaming ? videoRef.current : null
  );
  
  const [isCapturing, setIsCapturing] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [capturePhase, setCapturePhase] = useState<'idle' | 'countdown' | 'detecting'>('idle');

  const handleToggleCamera = () => {
    if (isStreaming) {
      stopCamera();
      setIsCapturing(false);
      setCapturePhase('idle');
      setCountdown(0);
    } else {
      startCamera();
    }
  };

  const handleCaptureSign = () => {
    if (!isStreaming) {
      toast.error('Primero inicia la cámara');
      return;
    }

    setIsCapturing(true);
    setCapturePhase('countdown');
    setCountdown(5);

    toast.info('🔥 Prepárate para hacer la seña de FIEBRE', {
      description: 'El cronómetro comenzará en 5 segundos',
      duration: 2000
    });
  };

  useEffect(() => {
    if (capturePhase === 'countdown' && countdown > 0) {
      const timer = setTimeout(() => {
        setCountdown(countdown - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (capturePhase === 'countdown' && countdown === 0) {
      setCapturePhase('detecting');
      toast.success('🌡️ ¡Haz la seña de FIEBRE ahora!', {
        description: 'Tienes 5 segundos para realizar la seña',
        duration: 5000
      });
      
      // Después de 5 segundos de detección, terminar
      setTimeout(() => {
        setIsCapturing(false);
        setCapturePhase('idle');
        toast.info('Tiempo de captura terminado');
      }, 5000);
    }
  }, [capturePhase, countdown]);

  // Detectar cuando se encuentra la seña durante el modo captura
  useEffect(() => {
    if (detectedSign && capturePhase === 'detecting' && detectedSign.sign.name === 'Fiebre Alta') {
      setIsCapturing(false);
      setCapturePhase('idle');
      toast.success('🌡️ ¡SEÑA DE FIEBRE DETECTADA!', {
        description: `Cliente con fiebre confirmado - Confianza: ${(detectedSign.confidence * 100).toFixed(1)}%`,
        duration: 4000
      });
    }
  }, [detectedSign, capturePhase]);

  const getSignEmoji = (signName: string) => {
    switch (signName) {
      case "Amor": return "💖 AMOR";
      case "Paz": return "✌️ PAZ";
      case "OK": return "👌 OK";
      case "Fiebre Alta": return "🌡️ FIEBRE ALTA";
      default: return `🖐️ ${signName.toUpperCase()}`;
    }
  };

  return (
    <Card className="p-6 bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="flex flex-col items-center space-y-4">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">Cámara en Tiempo Real</h2>
        
        <div className="relative w-full max-w-lg">
          <div className="aspect-video bg-gray-900 rounded-lg overflow-hidden border-4 border-blue-200 shadow-lg relative">
            {error ? (
              <div className="flex items-center justify-center h-full text-red-500">
                <div className="text-center">
                  <AlertCircle className="w-12 h-12 mx-auto mb-2" />
                  <p className="text-sm">{error}</p>
                </div>
              </div>
            ) : (
              <>
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                />
                <canvas
                  ref={setCanvasRef}
                  width={640}
                  height={480}
                  className="absolute top-0 left-0 w-full h-full object-cover"
                />
              </>
            )}
          </div>
          
          {isStreaming && !isCapturing && (
            <div className="absolute top-2 right-2">
              <div className="bg-green-500 text-white px-3 py-1 rounded-full text-xs font-semibold animate-pulse">
                🟢 CÁMARA ACTIVA
              </div>
            </div>
          )}

          {capturePhase === 'countdown' && (
            <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
              <div className="text-white text-center">
                <Timer className="w-16 h-16 mx-auto mb-4 animate-pulse" />
                <div className="text-6xl font-bold mb-2">{countdown}</div>
                <p className="text-xl">Prepárate para la seña...</p>
              </div>
            </div>
          )}

          {capturePhase === 'detecting' && (
            <div className="absolute top-2 left-2 right-2">
              <div className="bg-red-600 text-white px-4 py-2 rounded-lg text-center font-bold animate-pulse">
                🌡️ DETECTANDO SEÑA DE FIEBRE
              </div>
            </div>
          )}
          
          {detectedSign && capturePhase === 'detecting' && (
            <div className="absolute bottom-2 left-2 right-2">
              <div className="bg-green-600 text-white px-4 py-2 rounded-lg text-center font-bold animate-bounce">
                {getSignEmoji(detectedSign.sign.name)}
              </div>
            </div>
          )}
        </div>

        <div className="flex space-x-4">
          <Button
            onClick={handleToggleCamera}
            variant={isStreaming ? "destructive" : "default"}
            className="flex items-center space-x-2 px-6 py-2"
          >
            {isStreaming ? <CameraOff className="w-4 h-4" /> : <Camera className="w-4 h-4" />}
            <span>{isStreaming ? 'Detener Cámara' : 'Iniciar Cámara'}</span>
          </Button>

          {isStreaming && (
            <Button
              onClick={handleCaptureSign}
              disabled={isCapturing}
              variant="secondary"
              className="flex items-center space-x-2 px-6 py-2"
            >
              <Hand className="w-4 h-4" />
              <span>
                {isCapturing ? 'Capturando...' : 'Capturar Seña Fiebre'}
              </span>
            </Button>
          )}
        </div>

        {isStreaming && !isCapturing && (
          <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200 text-center">
            <p className="text-blue-700 text-sm font-medium">
              🌡️ Presiona "Capturar Seña Fiebre" para iniciar el cronómetro de detección
            </p>
          </div>
        )}

        {capturePhase === 'detecting' && (
          <div className="mt-4 p-3 bg-red-50 rounded-lg border border-red-200 text-center">
            <p className="text-red-700 text-sm font-medium">
              🔥 Realiza la seña de FIEBRE ALTA ahora - Puntos de referencia activos
            </p>
          </div>
        )}
      </div>
    </Card>
  );
};
