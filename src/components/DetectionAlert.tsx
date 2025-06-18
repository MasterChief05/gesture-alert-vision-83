
import React, { useEffect } from 'react';
import { DetectionResult } from '@/types/sign';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Clock } from 'lucide-react';
import { toast } from 'sonner';

interface DetectionAlertProps {
  detection: DetectionResult | null;
  isDetecting: boolean;
}

export const DetectionAlert: React.FC<DetectionAlertProps> = ({
  detection,
  isDetecting
}) => {
  useEffect(() => {
    if (detection) {
      toast.success(`¡Seña detectada: ${detection.sign.name}!`, {
        description: `Confianza: ${(detection.confidence * 100).toFixed(1)}%`,
        duration: 3000,
      });
    }
  }, [detection]);

  if (!detection && !isDetecting) {
    return (
      <Card className="p-6 bg-gray-50 border-dashed border-2">
        <div className="text-center text-gray-500">
          <Clock className="w-8 h-8 mx-auto mb-2" />
          <p>Esperando detección de señas...</p>
        </div>
      </Card>
    );
  }

  if (isDetecting && !detection) {
    return (
      <Card className="p-6 bg-yellow-50 border-yellow-200">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-4 border-yellow-400 border-t-transparent rounded-full mx-auto mb-2"></div>
          <p className="text-yellow-700 font-medium">Analizando gestos...</p>
        </div>
      </Card>
    );
  }

  if (detection) {
    return (
      <Card className="p-6 bg-green-50 border-green-200 animate-pulse">
        <div className="flex items-center space-x-4">
          <CheckCircle className="w-12 h-12 text-green-500" />
          <div className="flex-1">
            <h3 className="text-xl font-bold text-green-800">{detection.sign.name}</h3>
            <p className="text-green-600 mb-2">{detection.sign.description}</p>
            <div className="flex items-center space-x-2">
              <Badge variant="secondary" className="bg-green-100 text-green-800">
                Confianza: {(detection.confidence * 100).toFixed(1)}%
              </Badge>
              <Badge variant="outline" className="text-xs">
                {detection.timestamp.toLocaleTimeString()}
              </Badge>
            </div>
          </div>
        </div>
      </Card>
    );
  }

  return null;
};
