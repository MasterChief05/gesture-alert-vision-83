
import React, { useState, useRef, useCallback } from 'react';
import { useCamera } from '@/hooks/useCamera';
import { useHandpose } from '@/hooks/useHandpose';
import { Button } from '@/components/ui/button';
import { Video, Square, AlertCircle, CheckCircle, Camera } from 'lucide-react';
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
  const [cameraInitialized, setCameraInitialized] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const landmarksSequenceRef = useRef<number[][][]>([]);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const recordingIntervalRef = useRef<number | null>(null);

  // Dibujar landmarks optimizado
  const drawLandmarks = useCallback(() => {
    if (!canvasRef.current || !predictions.length) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    predictions.forEach((prediction) => {
      if (prediction.landmarks) {
        // Conexiones simplificadas para mejor rendimiento
        const connections = [
          [0, 1], [1, 2], [2, 3], [3, 4], // Pulgar
          [0, 5], [5, 6], [6, 7], [7, 8], // Índice
          [0, 9], [9, 10], [10, 11], [11, 12], // Medio
          [0, 13], [13, 14], [14, 15], [15, 16], // Anular
          [0, 17], [17, 18], [18, 19], [19, 20] // Meñique
        ];
        
        // Dibujar líneas más eficientemente
        ctx.strokeStyle = '#10B981';
        ctx.lineWidth = 2;
        ctx.beginPath();
        connections.forEach(([start, end]) => {
          if (prediction.landmarks[start] && prediction.landmarks[end]) {
            const startPoint = prediction.landmarks[start];
            const endPoint = prediction.landmarks[end];
            ctx.moveTo(startPoint[0], startPoint[1]);
            ctx.lineTo(endPoint[0], endPoint[1]);
          }
        });
        ctx.stroke();
        
        // Dibujar puntos
        prediction.landmarks.forEach((landmark: number[], index: number) => {
          const x = landmark[0];
          const y = landmark[1];
          const isJoint = [0, 4, 8, 12, 16, 20].includes(index);
          
          ctx.beginPath();
          ctx.arc(x, y, isJoint ? 6 : 4, 0, 2 * Math.PI);
          ctx.fillStyle = isJoint ? '#EF4444' : '#10B981';
          ctx.fill();
        });
        
        // Guardar landmarks solo si está grabando
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

  const initializeCamera = useCallback(async () => {
    if (!cameraInitialized) {
      console.log('🎥 Inicializando cámara...');
      try {
        await startCamera();
        setCameraInitialized(true);
        console.log('✅ Cámara inicializada');
      } catch (error) {
        console.error('❌ Error inicializando cámara:', error);
      }
    }
  }, [startCamera, cameraInitialized]);

  const startRecording = useCallback(async () => {
    console.log('🎬 Intentando iniciar grabación...');
    console.log('Estado:', { isStreaming, isModelLoaded, modelError, cameraError });
    
    if (!isStreaming) {
      toast.error('La cámara no está activa');
      return;
    }

    if (!isModelLoaded) {
      toast.error('El modelo de detección aún se está cargando...');
      return;
    }

    if (modelError) {
      toast.error('Error en el modelo: ' + modelError);
      return;
    }

    if (!videoRef.current) {
      toast.error('Video no disponible');
      return;
    }

    try {
      const stream = videoRef.current.srcObject as MediaStream;
      if (!stream) {
        toast.error('Stream de video no disponible');
        return;
      }
      
      // Verificar soporte de codecs
      let mimeType = 'video/webm;codecs=vp9';
      if (!MediaRecorder.isTypeSupported(mimeType)) {
        mimeType = 'video/webm;codecs=vp8';
        if (!MediaRecorder.isTypeSupported(mimeType)) {
          mimeType = 'video/webm';
        }
      }
      
      mediaRecorderRef.current = new MediaRecorder(stream, { mimeType });
      
      recordedChunksRef.current = [];
      landmarksSequenceRef.current = [];
      setRecordingTime(0);

      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          recordedChunksRef.current.push(event.data);
        }
      };

      mediaRecorderRef.current.onstop = () => {
        const videoBlob = new Blob(recordedChunksRef.current, { type: mimeType });
        
        if (landmarksSequenceRef.current.length === 0) {
          toast.error('No se detectaron landmarks durante la grabación');
          return;
        }
        
        onVideoRecorded(videoBlob, landmarksSequenceRef.current);
        console.log(`✅ Video grabado: ${landmarksSequenceRef.current.length} frames`);
        toast.success(`¡Grabación exitosa! ${landmarksSequenceRef.current.length} frames capturados`);
      };

      mediaRecorderRef.current.start(100);
      setIsRecording(true);
      
      // Contador optimizado
      recordingIntervalRef.current = window.setInterval(() => {
        setRecordingTime(prev => {
          const newTime = prev + 1;
          if (newTime >= 5) {
            stopRecording();
            return 5;
          }
          return newTime;
        });
      }, 1000);
      
      toast.success('¡Grabación iniciada!');

    } catch (error) {
      console.error('❌ Error iniciando grabación:', error);
      toast.error('Error al iniciar grabación: ' + (error as Error).message);
    }
  }, [isStreaming, isModelLoaded, modelError, videoRef, onVideoRecorded]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current);
        recordingIntervalRef.current = null;
      }
    }
  }, [isRecording]);

  // Inicializar cámara al montar
  React.useEffect(() => {
    initializeCamera();
    return () => {
      stopCamera();
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current);
      }
    };
  }, [initializeCamera, stopCamera]);

  // Estado del sistema optimizado
  const getSystemStatus = () => {
    if (cameraError) return { 
      icon: AlertCircle, 
      color: 'text-red-500', 
      text: 'Error de cámara',
      canRecord: false
    };
    
    if (!cameraInitialized || !isStreaming) return { 
      icon: Camera, 
      color: 'text-yellow-500', 
      text: 'Iniciando cámara...',
      canRecord: false
    };
    
    if (modelError) return { 
      icon: AlertCircle, 
      color: 'text-red-500', 
      text: 'Error del modelo',
      canRecord: false
    };
    
    if (!isModelLoaded) return { 
      icon: AlertCircle, 
      color: 'text-blue-500', 
      text: 'Cargando detección...',
      canRecord: false
    };
    
    return { 
      icon: CheckCircle, 
      color: 'text-green-500', 
      text: '¡Listo para grabar!',
      canRecord: true
    };
  };

  const status = getSystemStatus();
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
            ✋ Mano detectada ({predictions[0].landmarks?.length || 0} puntos)
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
                🔴 GRABANDO - {5 - recordingTime}s
              </div>
              <div className="bg-black/50 text-white px-2 py-1 rounded text-xs text-center mt-1">
                Frames: {landmarksSequenceRef.current.length}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="flex justify-center space-x-4">
        {!isRecording ? (
          <Button
            onClick={startRecording}
            disabled={!status.canRecord}
            className="flex items-center space-x-2 bg-red-600 hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
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
        <p>🎯 Puntos rojos: articulaciones principales</p>
        <p>🟢 Puntos verdes: landmarks de dedos</p>
        <p>📹 Grabación automática de 5 segundos</p>
        {cameraError && <p className="text-red-500">❌ {cameraError}</p>}
        {modelError && <p className="text-red-500">❌ {modelError}</p>}
      </div>
    </div>
  );
};
