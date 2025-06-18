
import React from 'react';
import { useCamera } from '@/hooks/useCamera';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Camera, CameraOff, AlertCircle } from 'lucide-react';

interface CameraViewProps {
  isDetectionActive: boolean;
  onToggleDetection: () => void;
}

export const CameraView: React.FC<CameraViewProps> = ({
  isDetectionActive,
  onToggleDetection
}) => {
  const { videoRef, isStreaming, error, startCamera, stopCamera } = useCamera();

  const handleToggleCamera = () => {
    if (isStreaming) {
      stopCamera();
    } else {
      startCamera();
    }
  };

  return (
    <Card className="p-6 bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="flex flex-col items-center space-y-4">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">Cámara en Tiempo Real</h2>
        
        <div className="relative w-full max-w-lg">
          <div className="aspect-video bg-gray-900 rounded-lg overflow-hidden border-4 border-blue-200 shadow-lg">
            {error ? (
              <div className="flex items-center justify-center h-full text-red-500">
                <div className="text-center">
                  <AlertCircle className="w-12 h-12 mx-auto mb-2" />
                  <p className="text-sm">{error}</p>
                </div>
              </div>
            ) : (
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
              />
            )}
          </div>
          
          {isStreaming && isDetectionActive && (
            <div className="absolute top-2 right-2">
              <div className="bg-red-500 text-white px-2 py-1 rounded-full text-xs font-semibold animate-pulse">
                DETECTANDO
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

          <Button
            onClick={onToggleDetection}
            disabled={!isStreaming}
            variant={isDetectionActive ? "secondary" : "default"}
            className="px-6 py-2"
          >
            {isDetectionActive ? 'Pausar Detección' : 'Iniciar Detección'}
          </Button>
        </div>
      </div>
    </Card>
  );
};
