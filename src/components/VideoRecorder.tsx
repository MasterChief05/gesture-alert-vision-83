import React, { useState, useRef, useCallback, useEffect } from 'react';
import { useCamera } from '@/hooks/useCamera';
import { useHandpose } from '@/hooks/useHandpose';
import { Button } from '@/components/ui/button';
import { Video, Square, AlertCircle, CheckCircle, Camera, RotateCcw } from 'lucide-react';
import { toast } from 'sonner';
import { useIsMobile } from '@/hooks/use-mobile';

interface VideoRecorderProps {
  onVideoRecorded: (videoBlob: Blob, landmarks: number[][][]) => void;
  onCancel: () => void;
}

export const VideoRecorder: React.FC<VideoRecorderProps> = ({ onVideoRecorded, onCancel }) => {
  const { videoRef, isStreaming, startCamera, stopCamera, error: cameraError } = useCamera();
  const { predictions, isModelLoaded, modelError } = useHandpose(isStreaming ? videoRef.current : null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const landmarksSequenceRef = useRef<number[][][]>([]);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const recordingIntervalRef = useRef<number | null>(null);
  const isMobile = useIsMobile();

  // Función para cambiar de cámara
  const switchCamera = useCallback(async () => {
    if (isRecording) {
      toast.warning('No se puede cambiar de cámara mientras se está grabando');
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
  }, [facingMode, isRecording, stopCamera, startCamera]);

  // Inicializar cámara cuando el componente se monta
  useEffect(() => {
    console.log('🎥 VideoRecorder montado, iniciando cámara...');
    startCamera();

    return () => {
      console.log('🛑 VideoRecorder desmontado, limpiando...');
      stopCamera();
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current);
      }
    };
  }, [startCamera, stopCamera]);

  // Dibujar landmarks optimizado
  const drawLandmarks = useCallback(() => {
    if (!canvasRef.current || !predictions.length) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    predictions.forEach((prediction) => {
      if (prediction.landmarks) {
        // Conexiones básicas
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

  useEffect(() => {
    if (isModelLoaded && !modelError) {
      drawLandmarks();
    }
  }, [predictions, isModelLoaded, modelError, drawLandmarks]);

  const startRecording = useCallback(async () => {
    console.log('🎬 Intentando iniciar grabación...');
    
    if (!isStreaming) {
      toast.error('La cámara no está activa');
      return;
    }

    if (!isModelLoaded) {
      toast.error('El modelo de detección aún se está cargando...');
      return;
    }

    if (!videoRef.current || !videoRef.current.srcObject) {
      toast.error('Video no disponible');
      return;
    }

    try {
      const stream = videoRef.current.srcObject as MediaStream;
      
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
      
      // Contador de tiempo
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
  }, [isStreaming, isModelLoaded, videoRef, onVideoRecorded]);

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

  // Estado del sistema
  const getSystemStatus = () => {
    if (cameraError) return { 
      icon: AlertCircle, 
      color: 'text-red-500', 
      text: 'Error de cámara: ' + cameraError,
      canRecord: false
    };
    
    if (!isStreaming) return { 
      icon: Camera, 
      color: 'text-yellow-500', 
      text: 'Inicializando cámara...',
      canRecord: false
    };
    
    if (modelError) return { 
      icon: AlertCircle, 
      color: 'text-red-500', 
      text: 'Error del modelo: ' + modelError,
      canRecord: false
    };
    
    if (!isModelLoaded) return { 
      icon: AlertCircle, 
      color: 'text-blue-500', 
      text: 'Cargando detección de manos...',
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
    <div className="w-full min-h-screen p-1 sm:p-2">
      <div className="max-w-none mx-auto space-y-3 sm:space-y-4">
        {/* Estado del sistema */}
        <div className="text-center px-2">
          <div className={`flex items-center justify-center space-x-2 ${status.color} mb-2`}>
            <StatusIcon className="w-5 h-5 sm:w-6 sm:h-6" />
            <span className="font-medium text-base sm:text-lg">{status.text}</span>
          </div>
          {predictions.length > 0 && (
            <p className="text-sm sm:text-base text-green-600">
              ✋ Mano detectada ({predictions[0].landmarks?.length || 0} puntos)
            </p>
          )}
        </div>

        {/* Video container más grande */}
        <div className="relative w-full">
          <div className="w-full bg-gray-900 rounded-lg overflow-hidden border border-blue-200 shadow-lg relative"
               style={{ aspectRatio: isMobile ? '16/12' : '16/9', minHeight: isMobile ? '400px' : '500px' }}>
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
            
            {/* Botón para cambiar cámara */}
            {isStreaming && !isRecording && (
              <button
                onClick={switchCamera}
                className="absolute top-2 right-2 sm:top-3 sm:right-3 bg-black/60 text-white p-2 sm:p-3 rounded-full hover:bg-black/80 transition-colors backdrop-blur-sm"
                title={`Cambiar a cámara ${facingMode === 'user' ? 'trasera' : 'frontal'}`}
              >
                <RotateCcw className="w-5 h-5 sm:w-6 sm:h-6" />
              </button>
            )}

            {/* Indicador de cámara activa */}
            {isStreaming && (
              <div className="absolute top-2 left-2 sm:top-3 sm:left-3">
                <div className="bg-green-500 text-white px-3 py-1 sm:px-4 sm:py-2 rounded-lg text-sm font-semibold backdrop-blur-sm">
                  📷 {facingMode === 'user' ? 'Frontal' : 'Trasera'}
                </div>
              </div>
            )}
            
            {/* Indicador de grabación */}
            {isRecording && (
              <div className="absolute top-12 left-2 right-2 sm:top-16 sm:left-3 sm:right-3">
                <div className="bg-red-600 text-white px-3 py-2 sm:px-4 sm:py-3 rounded-lg text-center font-bold animate-pulse backdrop-blur-sm">
                  <span className="text-sm sm:text-base">🔴 GRABANDO - {5 - recordingTime}s</span>
                </div>
                <div className="bg-black/60 text-white px-3 py-1 sm:px-3 sm:py-2 rounded text-sm text-center mt-2 backdrop-blur-sm">
                  Frames: {landmarksSequenceRef.current.length}
                </div>
              </div>
            )}

            {!isStreaming && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                <div className="text-white text-center p-6">
                  <Camera className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-4 animate-pulse" />
                  <p className="text-base sm:text-lg">Inicializando cámara...</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Botones más grandes y responsive */}
        <div className="flex flex-col sm:flex-row justify-center gap-3 sm:gap-4 px-2">
          {!isRecording ? (
            <Button
              onClick={startRecording}
              disabled={!status.canRecord}
              className="flex items-center justify-center space-x-2 bg-red-600 hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed w-full sm:w-auto px-6 py-3 sm:px-8 sm:py-4 text-base sm:text-lg font-semibold h-12 sm:h-14"
            >
              <Video className="w-5 h-5" />
              <span>Grabar Seña (5s)</span>
            </Button>
          ) : (
            <Button
              onClick={stopRecording}
              className="flex items-center justify-center space-x-2 bg-gray-600 hover:bg-gray-700 w-full sm:w-auto px-6 py-3 sm:px-8 sm:py-4 text-base sm:text-lg font-semibold h-12 sm:h-14"
            >
              <Square className="w-5 h-5" />
              <span>Detener</span>
            </Button>
          )}
          
          <Button 
            variant="outline" 
            onClick={onCancel}
            className="w-full sm:w-auto px-6 py-3 sm:px-8 sm:py-4 text-base sm:text-lg font-semibold h-12 sm:h-14"
          >
            Cancelar
          </Button>
        </div>

        {/* Información */}
        <div className="text-center text-sm sm:text-base text-gray-600 px-2 space-y-2 bg-blue-50 p-4 rounded-lg">
          <p className="font-medium text-blue-700 mb-2">📋 Instrucciones:</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 text-sm">
            <p>🎯 Puntos rojos: articulaciones principales</p>
            <p>🟢 Puntos verdes: landmarks de dedos</p>
            <p>📹 Grabación automática de 5 segundos</p>
            <p>🔄 Botón superior derecho para cambiar cámara</p>
          </div>
        </div>
      </div>
    </div>
  );
};
