import React, { useState, useEffect, useCallback } from 'react';
import { useCamera } from '@/hooks/useCamera';
import { useSignDetection } from '@/hooks/useSignDetection';
import { SignAlert } from '@/components/SignAlert';
import { Card } from '@/components/ui/card';
import { Camera, CameraOff, AlertCircle, Hand, Timer, Search, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { useIsMobile } from '@/hooks/use-mobile';

export const CameraView: React.FC = () => {
  const { videoRef, isStreaming, error, startCamera, stopCamera } = useCamera();
  const { detectedSign, isDetecting, setCanvasRef, startDetection, isDetectionActive, timeRemaining } = useSignDetection(
    isStreaming ? videoRef.current : null
  );

  const [showAlert, setShowAlert] = useState(false);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');
  const isMobile = useIsMobile();

  // Función para cambiar de cámara
  const switchCamera = useCallback(async () => {
    if (isDetectionActive) {
      toast.warning('No se puede cambiar de cámara durante la detección');
      return;
    }

    console.log(`🔄 Cambiando cámara de ${facingMode} a ${facingMode === 'user' ? 'environment' : 'user'}`);
    
    // Detener cámara actual
    stopCamera();
    
    // Cambiar modo
    const newFacingMode = facingMode === 'user' ? 'environment' : 'user';
    setFacingMode(newFacingMode);
    
    // Esperar un poco antes de reiniciar
    setTimeout(async () => {
      try {
        // Configuración específica para la nueva cámara
        const constraints = {
          video: {
            width: { ideal: 640, max: 640 },
            height: { ideal: 480, max: 480 },
            facingMode: newFacingMode,
            frameRate: { ideal: 30, max: 30 }
          },
          audio: false
        };

        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          console.log(`✅ Cámara ${newFacingMode === 'user' ? 'frontal' : 'trasera'} activada`);
          toast.success(`Cámara ${newFacingMode === 'user' ? 'frontal' : 'trasera'} activada`);
        }
      } catch (error) {
        console.error('❌ Error al cambiar cámara:', error);
        toast.error('Error al cambiar de cámara. Volviendo a la anterior...');
        // Volver a la cámara anterior si falla
        setFacingMode(facingMode);
        startCamera();
      }
    }, 500);
  }, [facingMode, isDetectionActive, stopCamera, startCamera]);

  // Mostrar alerta cuando se detecta una seña
  useEffect(() => {
    if (detectedSign) {
      setShowAlert(true);
      // Auto-ocultar después de 5 segundos
      const timer = setTimeout(() => {
        setShowAlert(false);
      }, 5000);
      
      return () => clearTimeout(timer);
    }
  }, [detectedSign]);

  const handleToggleCamera = () => {
    if (isStreaming) {
      stopCamera();
    } else {
      startCamera();
    }
  };

  const handleStartDetection = () => {
    if (!isStreaming) {
      toast.error('Primero inicia la cámara');
      return;
    }
    startDetection();
  };

  const handleDismissAlert = () => {
    setShowAlert(false);
  };

  return (
    <>
      {/* Alerta flotante en esquina superior derecha */}
      {showAlert && detectedSign && (
        <SignAlert 
          sign={detectedSign.sign}
          confidence={detectedSign.confidence}
          onDismiss={handleDismissAlert}
        />
      )}

      <div className="w-full min-h-screen p-1 sm:p-2 lg:p-4">
        <div className="w-full max-w-none mx-auto space-y-2 sm:space-y-4">
          <div className="text-center px-2">
            <h2 className="text-base sm:text-lg lg:text-xl font-bold text-gray-800 mb-2">
              Detección con Puntos de Referencia
            </h2>
          </div>
          
          {/* Área de video más grande */}
          <div className="relative w-full">
            <div className="w-full bg-gray-900 rounded-lg overflow-hidden border border-blue-200 shadow-lg relative" 
                 style={{ aspectRatio: isMobile ? '16/12' : '16/9', minHeight: isMobile ? '400px' : '500px' }}>
              {error ? (
                <div className="flex items-center justify-center h-full text-red-500">
                  <div className="text-center p-4">
                    <AlertCircle className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-2" />
                    <p className="text-sm sm:text-base">{error}</p>
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

              {/* Botón para cambiar cámara */}
              {isStreaming && !isDetectionActive && (
                <button
                  onClick={switchCamera}
                  className="absolute top-2 right-2 sm:top-3 sm:right-3 bg-black/60 text-white p-2 sm:p-3 rounded-full hover:bg-black/80 transition-colors backdrop-blur-sm"
                  title={`Cambiar a cámara ${facingMode === 'user' ? 'trasera' : 'frontal'}`}
                >
                  <RotateCcw className="w-5 h-5 sm:w-6 sm:h-6" />
                </button>
              )}

              {/* Indicador de cámara activa */}
              {isStreaming && !isDetectionActive && (
                <div className="absolute top-2 left-2 sm:top-3 sm:left-3">
                  <div className="bg-green-500 text-white px-3 py-1 sm:px-4 sm:py-2 rounded-lg text-sm font-semibold backdrop-blur-sm">
                    📷 {facingMode === 'user' ? 'Frontal' : 'Trasera'}
                  </div>
                </div>
              )}

              {/* Indicador de detección activa */}
              {isDetectionActive && (
                <div className="absolute top-2 left-2 right-2 sm:top-3 sm:left-3 sm:right-3">
                  <div className="bg-gradient-to-r from-red-600 to-orange-600 text-white px-3 py-2 sm:px-4 sm:py-3 rounded-lg text-center font-bold animate-pulse backdrop-blur-sm">
                    <div className="flex items-center justify-center space-x-2">
                      <Timer className="w-4 h-4 sm:w-5 sm:h-5" />
                      <span className="text-sm sm:text-base">🔍 COMPARANDO - {timeRemaining}s</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Botones más grandes y responsive */}
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 w-full px-2">
            <Button
              onClick={handleToggleCamera}
              variant={isStreaming ? "destructive" : "default"}
              className="flex items-center justify-center space-x-2 px-6 py-3 sm:px-8 sm:py-4 w-full sm:w-auto text-base sm:text-lg font-semibold h-12 sm:h-14"
            >
              {isStreaming ? <CameraOff className="w-5 h-5" /> : <Camera className="w-5 h-5" />}
              <span>{isStreaming ? 'Detener Cámara' : 'Iniciar Cámara'}</span>
            </Button>

            {isStreaming && (
              <Button
                onClick={handleStartDetection}
                disabled={isDetectionActive}
                variant="secondary"
                className="flex items-center justify-center space-x-2 px-6 py-3 sm:px-8 sm:py-4 w-full sm:w-auto text-base sm:text-lg font-semibold h-12 sm:h-14"
              >
                <Search className="w-5 h-5" />
                <span className="text-center">
                  {isDetectionActive ? `Comparando... ${timeRemaining}s` : 'Comparar Señas (10s)'}
                </span>
              </Button>
            )}
          </div>

          {/* Información responsive */}
          {isStreaming && !isDetectionActive && (
            <div className="mt-4 p-4 sm:p-6 bg-blue-50 rounded-lg border border-blue-200 text-center w-full mx-2">
              <p className="text-blue-700 text-base font-medium mb-3">
                🎯 Sistema con puntos de referencia activado
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                <p className="text-blue-600">• Puntos rojos = Articulaciones principales</p>
                <p className="text-blue-600">• Puntos verdes = Landmarks de dedos</p>
                <p className="text-blue-600">• Líneas verdes = Conexiones</p>
                <p className="text-blue-600">• 🔄 Botón superior = Cambiar cámara</p>
              </div>
            </div>
          )}

          {isDetectionActive && (
            <div className="mt-4 p-4 sm:p-6 bg-gradient-to-r from-red-50 to-orange-50 rounded-lg border border-red-200 text-center w-full mx-2">
              <p className="text-red-700 text-base font-medium mb-2">
                🔥 Comparando con señas almacenadas - {timeRemaining} segundos restantes
              </p>
              <p className="text-red-600 text-sm mb-3">
                El sistema está comparando tu seña con las grabadas en la base de datos
              </p>
              <div className="bg-red-100 rounded-full h-3">
                <div 
                  className="bg-red-500 h-3 rounded-full transition-all duration-1000"
                  style={{ width: `${(timeRemaining / 10) * 100}%` }}
                ></div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
};
