
import React, { useState, useRef, useCallback } from 'react';
import { useCamera } from '@/hooks/useCamera';
import { useHandpose } from '@/hooks/useHandpose';
import { Button } from '@/components/ui/button';
import { Video, Square, AlertCircle, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';

interface VideoRecorderProps {
  onVideoRecorded: (videoBlob: Blob, landmarks: number[][][]) => void;
  onCancel: () => void;
}

export const VideoRecorder: React.FC<VideoRecorderProps> = ({ onVideoRecorded, onCancel }) => {
  const { videoRef, isStreaming, startCamera, stopCamera, error: cameraError } = useCamera();
  const { predictions, isModelLoaded, modelError } = useHandpose(isStreaming ? videoRef.current : null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const landmarksSequenceRef = useRef<number[][][]>([]);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const recordingIntervalRef = useRef<number | null>(null);

  // Dibujar puntos de referencia en tiempo real
  const drawLandmarks = useCallback(() => {
    if (!canvasRef.current || !predictions.length) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    predictions.forEach((prediction) => {
      if (prediction.landmarks) {
        // Conexiones de la mano
        const connections = [
          [0, 1], [1, 2], [2, 3], [3, 4], // Pulgar
          [0, 5], [5, 6], [6, 7], [7, 8], // Índice
          [0, 9], [9, 10], [10, 11], [11, 12], // Medio
          [0, 13], [13, 14], [14, 15], [15, 16], // Anular
          [0, 17], [17, 18], [18, 19], [19, 20] // Meñique
        ];
        
        // Dibujar líneas de conexión
        ctx.strokeStyle = '#10B981';
        ctx.lineWidth = 2;
        connections.forEach(([start, end]) => {
          if (prediction.landmarks[start] && prediction.landmarks[end]) {
            const startPoint = prediction.landmarks[start];
            const endPoint = prediction.landmarks[end];
            ctx.beginPath();
            ctx.moveTo(startPoint[0], startPoint[1]);
            ctx.lineTo(endPoint[0], endPoint[1]);
            ctx.stroke();
          }
        });
        
        // Dibujar puntos
        prediction.landmarks.forEach((landmark: number[], index: number) => {
          const x = landmark[0];
          const y = landmark[1];
          
          const isJoint = [0, 4, 8, 12, 16, 20].includes(index);
          
          ctx.beginPath();
          ctx.arc(x, y, isJoint ? 8 : 5, 0, 2 * Math.PI);
          ctx.fillStyle = isJoint ? '#EF4444' : '#10B981';
          ctx.fill();
          
          ctx.strokeStyle = '#FFFFFF';
          ctx.lineWidth = 2;
          ctx.stroke();
        });
        
        // Guardar landmarks si está grabando
        if (isRecording) {
          landmarksSequenceRef.current.push(prediction.landmarks);
        }
      }
    });
  }, [predictions, isRecording]);

  React.useEffect(() => {
    if (isModelLoaded && !modelError) {
      drawLandmarks();
    }
  }, [predictions, isModelLoaded, modelError, drawLandmarks]);

  const startRecording = async () => {
    if (!isStreaming || !videoRef.current) {
      toast.error('Primero inicia la cámara');
      return;
    }

    if (!isModelLoaded) {
      toast.error('El modelo de detección aún no está listo');
      return;
    }

    if (modelError) {
      toast.error('Error en el modelo de detección: ' + modelError);
      return;
    }

    try {
      const stream = videoRef.current.srcObject as MediaStream;
      mediaRecorderRef.current = new MediaRecorder(stream, {
        mimeType: 'video/webm;codecs=vp9'
      });
      
      recordedChunksRef.current = [];
      landmarksSequenceRef.current = [];
      setRecordingTime(0);

      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          recordedChunksRef.current.push(event.data);
        }
      };

      mediaRecorderRef.current.onstop = () => {
        const videoBlob = new Blob(recordedChunksRef.current, { type: 'video/webm' });
        
        if (landmarksSequenceRef.current.length === 0) {
          toast.error('No se detectaron landmarks durante la grabación');
          return;
        }
        
        onVideoRecorded(videoBlob, landmarksSequenceRef.current);
        console.log(`📹 Video grabado con ${landmarksSequenceRef.current.length} frames de landmarks`);
      };

      mediaRecorderRef.current.start(100); // Grabar en chunks de 100ms
      setIsRecording(true);
      
      // Contador de tiempo
      recordingIntervalRef.current = window.setInterval(() => {
        setRecordingTime(prev => {
          const newTime = prev + 1;
          if (newTime >= 5) {
            stopRecording();
          }
          return newTime;
        });
      }, 1000);
      
      toast.success('¡Grabación iniciada! Realiza tu seña');

    } catch (error) {
      console.error('Error starting recording:', error);
      toast.error('Error al iniciar la grabación: ' + (error as Error).message);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current);
        recordingIntervalRef.current = null;
      }
      
      toast.success(`Grabación completada - ${landmarksSequenceRef.current.length} frames capturados`);
    }
  };

  React.useEffect(() => {
    startCamera();
    return () => {
      stopCamera();
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current);
      }
    };
  }, [startCamera, stopCamera]);

  // Estado de la cámara y modelo
  const getCameraStatus = () => {
    if (cameraError) return { icon: AlertCircle, color: 'text-red-500', text: 'Error de cámara' };
    if (!isStreaming) return { icon: AlertCircle, color: 'text-yellow-500', text: 'Iniciando cámara...' };
    if (modelError) return { icon: AlertCircle, color: 'text-red-500', text: 'Error del modelo' };
    if (!isModelLoaded) return { icon: AlertCircle, color: 'text-yellow-500', text: 'Cargando modelo...' };
    return { icon: CheckCircle, color: 'text-green-500', text: 'Listo para grabar' };
  };

  const status = getCameraStatus();
  const StatusIcon = status.icon;

  return (
    <div className="space-y-4">
      {/* Estado del sistema */}
      <div className="text-center">
        <div className={`flex items-center justify-center space-x-2 ${status.color}`}>
          <StatusIcon className="w-5 h-5" />
          <span className="font-medium">{status.text}</span>
        </div>
        {predictions.length > 0 && (
          <p className="text-sm text-green-600 mt-1">
            ✋ Mano detectada - {predictions[0].landmarks?.length || 0} puntos
          </p>
        )}
      </div>

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
                🔴 GRABANDO - {5 - recordingTime}s restantes
              </div>
              <div className="bg-black/50 text-white px-2 py-1 rounded text-xs text-center mt-1">
                Frames capturados: {landmarksSequenceRef.current.length}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="flex justify-center space-x-4">
        {!isRecording ? (
          <Button
            onClick={startRecording}
            disabled={!isStreaming || !isModelLoaded || !!modelError || !!cameraError}
            className="flex items-center space-x-2 bg-red-600 hover:bg-red-700 disabled:bg-gray-400"
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
        {cameraError && <p className="text-red-500">❌ {cameraError}</p>}
        {modelError && <p className="text-red-500">❌ Modelo: {modelError}</p>}
      </div>
    </div>
  );
};
