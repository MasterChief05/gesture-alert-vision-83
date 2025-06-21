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

      <div className="w-full min-h-screen p-2 sm:p-4 lg:p-6">
        <Card className="w-full max-w-none lg:max-w-4xl mx-auto p-3 sm:p-4 lg:p-6 bg-gradient-to-br from-blue-50 to-indigo-100">
          <div className="flex flex-col items-center space-y-3 sm:space-y-4">
            <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-800 text-center">
              Detección con Puntos de Referencia
            </h2>
            
            <div className="relative w-full">
              <div className="aspect-video bg-gray-900 rounded-lg overflow-hidden border-2 sm:border-4 border-blue-200 shadow-lg relative">
                {error ? (
                  <div className="flex items-center justify-center h-full text-red-500">
                    <div className="text-center p-4">
                      <AlertCircle className="w-8 h-8 sm:w-12 sm:h-12 mx-auto mb-2" />
                      <p className="text-xs sm:text-sm">{error}</p>
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

                {/* Botón para cambiar cámara - responsive */}
                {isStreaming && !isDetectionActive && (
                  <button
                    onClick={switchCamera}
                    className="absolute top-1 right-1 sm:top-2 sm:right-2 bg-black/50 text-white p-1.5 sm:p-2 rounded-full hover:bg-black/70 transition-colors"
                    title={`Cambiar a cámara ${facingMode === 'user' ? 'trasera' : 'frontal'}`}
                  >
                    <RotateCcw className="w-4 h-4 sm:w-5 sm:h-5" />
                  </button>
                )}

                {/* Indicador de cámara activa - responsive */}
                {isStreaming && !isDetectionActive && (
                  <div className="absolute top-1 left-1 sm:top-2 sm:left-2">
                    <div className="bg-green-500 text-white px-2 py-0.5 sm:px-3 sm:py-1 rounded text-xs font-semibold">
                      📷 {facingMode === 'user' ? 'Frontal' : 'Trasera'}
                    </div>
                  </div>
                )}

                {isDetectionActive && (
                  <div className="absolute top-1 left-1 right-1 sm:top-2 sm:left-2 sm:right-2">
                    <div className="bg-gradient-to-r from-red-600 to-orange-600 text-white px-2 py-1 sm:px-4 sm:py-2 rounded-lg text-center font-bold animate-pulse">
                      <div className="flex items-center justify-center space-x-1 sm:space-x-2">
                        <Timer className="w-3 h-3 sm:w-4 sm:h-4" />
                        <span className="text-xs sm:text-sm">🔍 COMPARANDO - {timeRemaining}s</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Botones responsive */}
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 w-full sm:w-auto">
              <Button
                onClick={handleToggleCamera}
                variant={isStreaming ? "destructive" : "default"}
                className="flex items-center justify-center space-x-2 px-4 py-2 sm:px-6 sm:py-2 w-full sm:w-auto text-sm sm:text-base"
              >
                {isStreaming ? <CameraOff className="w-4 h-4" /> : <Camera className="w-4 h-4" />}
                <span>{isStreaming ? 'Detener Cámara' : 'Iniciar Cámara'}</span>
              </Button>

              {isStreaming && (
                <Button
                  onClick={handleStartDetection}
                  disabled={isDetectionActive}
                  variant="secondary"
                  className="flex items-center justify-center space-x-2 px-4 py-2 sm:px-6 sm:py-2 w-full sm:w-auto text-sm sm:text-base"
                >
                  <Search className="w-4 h-4" />
                  <span className="text-center">
                    {isDetectionActive ? `Comparando... ${timeRemaining}s` : 'Comparar Señas (10s)'}
                  </span>
                </Button>
              )}
            </div>

            {/* Información responsive */}
            {isStreaming && !isDetectionActive && (
              <div className="mt-3 sm:mt-4 p-3 sm:p-4 bg-blue-50 rounded-lg border border-blue-200 text-center w-full">
                <p className="text-blue-700 text-sm font-medium mb-2">
                  🎯 Sistema con puntos de referencia activado
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 sm:gap-2 text-xs sm:text-xs">
                  <p className="text-blue-600">• Puntos rojos = Articulaciones principales</p>
                  <p className="text-blue-600">• Puntos verdes = Landmarks de dedos</p>
                  <p className="text-blue-600">• Líneas verdes = Conexiones</p>
                  <p className="text-blue-600">• 🔄 Botón superior = Cambiar cámara</p>
                </div>
              </div>
            )}

            {isDetectionActive && (
              <div className="mt-3 sm:mt-4 p-3 sm:p-4 bg-gradient-to-r from-red-50 to-orange-50 rounded-lg border border-red-200 text-center w-full">
                <p className="text-red-700 text-sm font-medium mb-1">
                  🔥 Comparando con señas almacenadas - {timeRemaining} segundos restantes
                </p>
                <p className="text-red-600 text-xs mb-2">
                  El sistema está comparando tu seña con las grabadas en la base de datos
                </p>
                <div className="bg-red-100 rounded-full h-2">
                  <div 
                    className="bg-red-500 h-2 rounded-full transition-all duration-1000"
                    style={{ width: `${(timeRemaining / 10) * 100}%` }}
                  ></div>
                </div>
              </div>
            )}
          </div>
        </Card>
      </div>
    </>
  );
};
