
import React, { useState, useRef, useCallback } from 'react';
import { useCamera } from '@/hooks/useCamera';
import { useHandpose } from '@/hooks/useHandpose';
import { Button } from '@/components/ui/button';
import { Video, Square, Play, Pause } from 'lucide-react';
import { toast } from 'sonner';

interface VideoRecorderProps {
  onVideoRecorded: (videoBlob: Blob, landmarks: number[][][]) => void;
  onCancel: () => void;
}

export const VideoRecorder: React.FC<VideoRecorderProps> = ({ onVideoRecorded, onCancel }) => {
  const { videoRef, isStreaming, startCamera, stopCamera } = useCamera();
  const { predictions, isModelLoaded } = useHandpose(isStreaming ? videoRef.current : null);
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const landmarksSequenceRef = useRef<number[][][]>([]);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Dibujar puntos de referencia en tiempo real
  const drawLandmarks = useCallback(() => {
    if (!canvasRef.current || !predictions.length) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    predictions.forEach((prediction) => {
      if (prediction.landmarks) {
        // Dibujar conexiones entre puntos importantes
        const connections = [
          [0, 1], [1, 2], [2, 3], [3, 4], // Pulgar
          [0, 5], [5, 6], [6, 7], [7, 8], // Índice
          [0, 9], [9, 10], [10, 11], [11, 12], // Medio
          [0, 13], [13, 14], [14, 15], [15, 16], // Anular
          [0, 17], [17, 18], [18, 19], [19, 20] // Meñique
        ];
        
        // Dibujar líneas
        ctx.strokeStyle = '#10B981';
        ctx.lineWidth = 2;
        connections.forEach(([start, end]) => {
          const startPoint = prediction.landmarks[start];
          const endPoint = prediction.landmarks[end];
          ctx.beginPath();
          ctx.moveTo(startPoint[0], startPoint[1]);
          ctx.lineTo(endPoint[0], endPoint[1]);
          ctx.stroke();
        });
        
        // Dibujar puntos
        prediction.landmarks.forEach((landmark: number[], index: number) => {
          const x = landmark[0];
          const y = landmark[1];
          
          // Puntos de articulaciones principales más grandes
          const isJoint = [0, 4, 8, 12, 16, 20].includes(index);
          
          ctx.beginPath();
          ctx.arc(x, y, isJoint ? 8 : 5, 0, 2 * Math.PI);
          ctx.fillStyle = isJoint ? '#EF4444' : '#10B981';
          ctx.fill();
          
          ctx.strokeStyle = '#FFFFFF';
          ctx.lineWidth = 2;
          ctx.stroke();
          
          // Agregar número del punto
          ctx.fillStyle = '#FFFFFF';
          ctx.font = '10px Arial';
          ctx.textAlign = 'center';
          ctx.fillText(index.toString(), x, y + 3);
        });
        
        // Si está grabando, guardar landmarks
        if (isRecording) {
          landmarksSequenceRef.current.push(prediction.landmarks);
        }
      }
    });
  }, [predictions, isRecording]);

  React.useEffect(() => {
    if (isModelLoaded) {
      drawLandmarks();
    }
  }, [predictions, isModelLoaded, drawLandmarks]);

  const startRecording = async () => {
    if (!isStreaming || !videoRef.current) {
      toast.error('Primero inicia la cámara');
      return;
    }

    try {
      const stream = videoRef.current.srcObject as MediaStream;
      mediaRecorderRef.current = new MediaRecorder(stream);
      recordedChunksRef.current = [];
      landmarksSequenceRef.current = [];

      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          recordedChunksRef.current.push(event.data);
        }
      };

      mediaRecorderRef.current.onstop = () => {
        const videoBlob = new Blob(recordedChunksRef.current, { type: 'video/webm' });
        onVideoRecorded(videoBlob, landmarksSequenceRef.current);
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);
      toast.success('¡Grabación iniciada! Haz tu seña');

      // Auto-stop después de 5 segundos
      setTimeout(() => {
        if (isRecording) {
          stopRecording();
        }
      }, 5000);

    } catch (error) {
      console.error('Error starting recording:', error);
      toast.error('Error al iniciar la grabación');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      toast.success(`Grabación completada - ${landmarksSequenceRef.current.length} frames capturados`);
    }
  };

  React.useEffect(() => {
    startCamera();
    return () => stopCamera();
  }, []);

  return (
    <div className="space-y-4">
      <div className="relative w-full max-w-lg mx-auto">
        <div className="aspect-video bg-gray-900 rounded-lg overflow-hidden border-4 border-blue-200 shadow-lg relative">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover"
          />
          <canvas
            ref={canvasRef}
            width={640}
            height={480}
            className="absolute top-0 left-0 w-full h-full object-cover"
          />
          
          {isRecording && (
            <div className="absolute top-2 left-2 right-2">
              <div className="bg-red-600 text-white px-4 py-2 rounded-lg text-center font-bold animate-pulse">
                🔴 GRABANDO - {Math.max(0, 5 - Math.floor(landmarksSequenceRef.current.length / 30))}s restantes
              </div>
            </div>
          )}
          
          {isStreaming && !isRecording && (
            <div className="absolute top-2 right-2">
              <div className="bg-green-500 text-white px-3 py-1 rounded-full text-xs font-semibold">
                🟢 LISTO PARA GRABAR
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="flex justify-center space-x-4">
        {!isRecording ? (
          <Button
            onClick={startRecording}
            disabled={!isStreaming || !isModelLoaded}
            className="flex items-center space-x-2 bg-red-600 hover:bg-red-700"
          >
            <Video className="w-4 h-4" />
            <span>Grabar Seña (5s)</span>
          </Button>
        ) : (
          <Button
            onClick={stopRecording}
            className="flex items-center space-x-2 bg-gray-600 hover:bg-gray-700"
          >
            <Square className="w-4 h-4" />
            <span>Detener</span>
          </Button>
        )}
        
        <Button variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
      </div>

      <div className="text-center text-sm text-gray-600">
        <p>🎯 Los puntos rojos son articulaciones principales</p>
        <p>🟢 Los puntos verdes son landmarks de dedos</p>
        <p>📹 El video se graba por 5 segundos automáticamente</p>
      </div>
    </div>
  );
};
