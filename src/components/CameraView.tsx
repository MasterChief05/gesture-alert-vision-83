import React, { useState, useEffect } from 'react';
import { useCamera } from '@/hooks/useCamera';
import { useSignDetection } from '@/hooks/useSignDetection';
import { SignAlert } from '@/components/SignAlert';
import { Card } from '@/components/ui/card';
import { Camera, CameraOff, AlertCircle, Hand, Timer, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

export const CameraView: React.FC = () => {
  const { videoRef, isStreaming, error, startCamera, stopCamera } = useCamera();
  const { detectedSign, isDetecting, setCanvasRef, startDetection, isDetectionActive, timeRemaining } = useSignDetection(
    isStreaming ? videoRef.current : null
  );

  const [showAlert, setShowAlert] = useState(false);

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

      <Card className="p-6 bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="flex flex-col items-center space-y-4">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Detección con Puntos de Referencia</h2>
          
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
            
            {isStreaming && !isDetectionActive && (
              <div className="absolute top-2 right-2">
                <div className="bg-green-500 text-white px-3 py-1 rounded-full text-xs font-semibold animate-pulse">
                  🟢 CÁMARA ACTIVA
                </div>
              </div>
            )}

            {isDetectionActive && (
              <div className="absolute top-2 left-2 right-2">
                <div className="bg-gradient-to-r from-red-600 to-orange-600 text-white px-4 py-2 rounded-lg text-center font-bold animate-pulse">
                  <div className="flex items-center justify-center space-x-2">
                    <Timer className="w-4 h-4" />
                    <span>🔍 COMPARANDO CON BASE DE DATOS - {timeRemaining}s</span>
                  </div>
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
                onClick={handleStartDetection}
                disabled={isDetectionActive}
                variant="secondary"
                className="flex items-center space-x-2 px-6 py-2"
              >
                <Search className="w-4 h-4" />
                <span>
                  {isDetectionActive ? `Comparando... ${timeRemaining}s` : 'Comparar Señas (10s)'}
                </span>
              </Button>
            )}
          </div>

          {isStreaming && !isDetectionActive && (
            <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200 text-center">
              <p className="text-blue-700 text-sm font-medium mb-2">
                🎯 Sistema con puntos de referencia activado
              </p>
              <p className="text-blue-600 text-xs mb-2">
                • Puntos rojos = Articulaciones principales (muñeca, nudillos)
              </p>
              <p className="text-blue-600 text-xs mb-2">
                • Puntos verdes = Landmarks de dedos
              </p>
              <p className="text-blue-600 text-xs">
                • Líneas verdes = Conexiones entre articulaciones
              </p>
            </div>
          )}

          {isDetectionActive && (
            <div className="mt-4 p-4 bg-gradient-to-r from-red-50 to-orange-50 rounded-lg border border-red-200 text-center">
              <p className="text-red-700 text-sm font-medium">
                🔥 Comparando con señas almacenadas - {timeRemaining} segundos restantes
              </p>
              <p className="text-red-600 text-xs">
                El sistema está comparando tu seña con las grabadas en la base de datos
              </p>
              <div className="mt-2 bg-red-100 rounded-full h-2">
                <div 
                  className="bg-red-500 h-2 rounded-full transition-all duration-1000"
                  style={{ width: `${(timeRemaining / 10) * 100}%` }}
                ></div>
              </div>
            </div>
          )}
        </div>
      </Card>
    </>
  );
};
