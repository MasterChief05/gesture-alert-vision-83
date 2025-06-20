
import React from 'react';
import { Sign } from '@/types/sign';
import { CheckCircle, X } from 'lucide-react';

interface SignAlertProps {
  sign: Sign;
  confidence: number;
  onDismiss: () => void;
}

export const SignAlert: React.FC<SignAlertProps> = ({ sign, confidence, onDismiss }) => {
  return (
    <div className="fixed top-4 right-4 z-50 animate-in slide-in-from-right-5 duration-300">
      <div className="bg-green-600 text-white rounded-lg shadow-2xl p-4 max-w-sm border-l-4 border-green-400">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3">
            <CheckCircle className="w-8 h-8 text-green-200 flex-shrink-0 mt-1" />
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-lg text-white mb-1">
                ¡Seña Detectada!
              </h3>
              <p className="text-green-100 font-semibold text-base mb-2">
                {sign.name}
              </p>
              <p className="text-green-200 text-sm mb-2">
                {sign.description}
              </p>
              <div className="flex items-center space-x-2">
                <div className="bg-green-500 px-3 py-1 rounded-full text-xs font-medium">
                  Confianza: {(confidence * 100).toFixed(1)}%
                </div>
                <div className="text-xs text-green-200">
                  {new Date().toLocaleTimeString()}
                </div>
              </div>
            </div>
          </div>
          <button 
            onClick={onDismiss}
            className="text-green-200 hover:text-white transition-colors ml-2 flex-shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        {/* Barra de progreso de confianza */}
        <div className="mt-3">
          <div className="bg-green-500 rounded-full h-2 overflow-hidden">
            <div 
              className="h-full bg-green-200 rounded-full transition-all duration-500"
              style={{ width: `${confidence * 100}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
