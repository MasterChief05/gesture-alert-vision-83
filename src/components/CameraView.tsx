
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

      <div className="w-full min-h-screen p-2 sm:p-4 md:p-6 lg:p-8">
        <div className="w-full max-w-7xl mx-auto space-y-4 sm:space-y-6">
          <div className="text-center px-2">
            <h2 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold text-gray-800 mb-2 sm:mb-4">
              Detección con Puntos de Referencia
            </h2>
          </div>
          
          {/* Área de video completamente responsiva */}
          <div className="relative w-full">
            <div className="w-full bg-gray-900 rounded-lg sm:rounded-xl overflow-hidden border-2 border-blue-200 shadow-xl relative" 
                 style={{ 
                   aspectRatio: '16/9',
                   minHeight: '300px',
                   height: 'clamp(300px, 70vh, 800px)'
                 }}>
              {error ? (
                <div className="flex items-center justify-center h-full text-red-500">
                  <div className="text-center p-4 sm:p-6">
                    <AlertCircle className="w-12 h-12 sm:w-16 sm:h-16 md:w-20 md:h-20 mx-auto mb-4" />
                    <p className="text-sm sm:text-base md:text-lg">{error}</p>
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

              {/* Botón para cambiar cámara - responsivo */}
              {isStreaming && !isDetectionActive && (
                <button
                  onClick={switchCamera}
                  className="absolute top-2 right-2 sm:top-4 sm:right-4 md:top-6 md:right-6 bg-black/70 text-white p-2 sm:p-3 md:p-4 rounded-full hover:bg-black/90 transition-colors backdrop-blur-sm shadow-lg"
                  title={`Cambiar a cámara ${facingMode === 'user' ? 'trasera' : 'frontal'}`}
                >
                  <RotateCcw className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6" />
                </button>
              )}

              {/* Indicador de cámara activa - responsivo */}
              {isStreaming && !isDetectionActive && (
                <div className="absolute top-2 left-2 sm:top-4 sm:left-4 md:top-6 md:left-6">
                  <div className="bg-green-500 text-white px-2 py-1 sm:px-3 sm:py-2 md:px-4 md:py-2 rounded-lg text-xs sm:text-sm md:text-base font-semibold backdrop-blur-sm shadow-lg">
                    📷 {facingMode === 'user' ? 'Frontal' : 'Trasera'}
                  </div>
                </div>
              )}

              {/* Indicador de detección activa - completamente responsivo */}
              {isDetectionActive && (
                <div className="absolute top-2 left-2 right-2 sm:top-4 sm:left-4 sm:right-4 md:top-6 md:left-6 md:right-6">
                  <div className="bg-gradient-to-r from-red-600 to-orange-600 text-white px-3 py-2 sm:px-4 sm:py-3 md:px-6 md:py-4 rounded-lg text-center font-bold animate-pulse backdrop-blur-sm shadow-lg">
                    <div className="flex items-center justify-center space-x-2">
                      <Timer className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6" />
                      <span className="text-sm sm:text-base md:text-lg">🔍 COMPARANDO - {timeRemaining}s</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Botones completamente responsivos */}
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 md:gap-6 w-full px-2">
            <Button
              onClick={handleToggleCamera}
              variant={isStreaming ? "destructive" : "default"}
              className="flex items-center justify-center space-x-2 px-4 py-3 sm:px-6 sm:py-4 md:px-8 md:py-5 w-full sm:w-auto text-sm sm:text-base md:text-lg font-semibold h-12 sm:h-14 md:h-16"
            >
              {isStreaming ? <CameraOff className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6" /> : <Camera className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6" />}
              <span>{isStreaming ? 'Detener Cámara' : 'Iniciar Cámara'}</span>
            </Button>

            {isStreaming && (
              <Button
                onClick={handleStartDetection}
                disabled={isDetectionActive}
                variant="secondary"
                className="flex items-center justify-center space-x-2 px-4 py-3 sm:px-6 sm:py-4 md:px-8 md:py-5 w-full sm:w-auto text-sm sm:text-base md:text-lg font-semibold h-12 sm:h-14 md:h-16"
              >
                <Search className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6" />
                <span className="text-center">
                  {isDetectionActive ? `Comparando... ${timeRemaining}s` : 'Comparar Señas (10s)'}
                </span>
              </Button>
            )}
          </div>

          {/* Información completamente responsiva */}
          {isStreaming && !isDetectionActive && (
            <div className="mt-4 sm:mt-6 p-4 sm:p-6 md:p-8 bg-blue-50 rounded-lg sm:rounded-xl border border-blue-200 text-center w-full">
              <p className="text-blue-700 text-sm sm:text-base md:text-lg font-medium mb-3 sm:mb-4">
                🎯 Sistema con puntos de referencia activado
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 text-xs sm:text-sm md:text-base">
                <p className="text-blue-600">• Puntos rojos = Articulaciones principales</p>
                <p className="text-blue-600">• Puntos verdes = Landmarks de dedos</p>
                <p className="text-blue-600">• Líneas verdes = Conexiones</p>
                <p className="text-blue-600">• 🔄 Botón superior = Cambiar cámara</p>
              </div>
            </div>
          )}

          {isDetectionActive && (
            <div className="mt-4 sm:mt-6 p-4 sm:p-6 md:p-8 bg-gradient-to-r from-red-50 to-orange-50 rounded-lg sm:rounded-xl border border-red-200 text-center w-full">
              <p className="text-red-700 text-sm sm:text-base md:text-lg font-medium mb-2 sm:mb-3">
                🔥 Comparando con señas almacenadas - {timeRemaining} segundos restantes
              </p>
              <p className="text-red-600 text-xs sm:text-sm md:text-base mb-3 sm:mb-4">
                El sistema está comparando tu seña con las grabadas en la base de datos
              </p>
              <div className="bg-red-100 rounded-full h-2 sm:h-3 md:h-4">
                <div 
                  className="bg-red-500 h-2 sm:h-3 md:h-4 rounded-full transition-all duration-1000"
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
