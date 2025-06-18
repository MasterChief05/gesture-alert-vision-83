
import React from 'react';
import { useCamera } from '@/hooks/useCamera';
import { useSignDetection } from '@/hooks/useSignDetection';
import { Card } from '@/components/ui/card';
import { Camera, CameraOff, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

export const CameraView: React.FC = () => {
  const { videoRef, isStreaming, error, startCamera, stopCamera } = useCamera();
  const { detectedSign, isDetecting, setCanvasRef } = useSignDetection(
    isStreaming ? videoRef.current : null
  );

  const handleToggleCamera = () => {
    if (isStreaming) {
      stopCamera();
    } else {
      startCamera();
    }
  };

  const getSignEmoji = (signName: string) => {
    switch (signName) {
      case "Amor": return "💖 AMOR";
      case "Paz": return "✌️ PAZ";
      case "OK": return "👌 OK";
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
          
          {isStreaming && (
            <div className="absolute top-2 right-2">
              <div className="bg-green-500 text-white px-3 py-1 rounded-full text-xs font-semibold animate-pulse">
                🟢 DETECTANDO SEÑAS
              </div>
            </div>
          )}
          
          {detectedSign && (
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
        </div>

        {isStreaming && (
          <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200 text-center">
            <p className="text-blue-700 text-sm font-medium">
              💖 Sistema detectando automáticamente: AMOR, PAZ y OK 👌 con puntos mejorados
            </p>
          </div>
        )}
      </div>
    </Card>
  );
};
