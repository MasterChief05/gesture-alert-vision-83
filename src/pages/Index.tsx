
import React from 'react';
import { CameraView } from '@/components/CameraView';
import { DetectionAlert } from '@/components/DetectionAlert';
import { SignsDatabase } from '@/components/SignsDatabase';
import { Statistics } from '@/components/Statistics';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Hand, Camera, Database, BarChart3 } from 'lucide-react';

const Index = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <Hand className="w-12 h-12 text-blue-600 mr-3" />
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Reconocimiento de Señas IA
            </h1>
          </div>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Sistema inteligente de reconocimiento de lenguaje de señas en tiempo real con MediaPipe.
            Detección automática con puntos en las manos de <strong>Amor</strong> y <strong>Paz</strong>.
          </p>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="camera" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 max-w-md mx-auto">
            <TabsTrigger value="camera" className="flex items-center space-x-2">
              <Camera className="w-4 h-4" />
              <span className="hidden sm:inline">Cámara</span>
            </TabsTrigger>
            <TabsTrigger value="detection" className="flex items-center space-x-2">
              <Hand className="w-4 h-4" />
              <span className="hidden sm:inline">Detección</span>
            </TabsTrigger>
            <TabsTrigger value="database" className="flex items-center space-x-2">
              <Database className="w-4 h-4" />
              <span className="hidden sm:inline">Base de Datos</span>
            </TabsTrigger>
            <TabsTrigger value="stats" className="flex items-center space-x-2">
              <BarChart3 className="w-4 h-4" />
              <span className="hidden sm:inline">Estadísticas</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="camera" className="space-y-6">
            <CameraView />
          </TabsContent>

          <TabsContent value="detection" className="space-y-6">
            <Card className="p-6">
              <h2 className="text-2xl font-bold text-gray-800 mb-6">Estado de Detección</h2>
              
              <div className="mt-6 p-4 bg-green-50 rounded-lg border border-green-200">
                <h3 className="font-semibold text-green-800 mb-2">🟢 Sistema MediaPipe Activo</h3>
                <p className="text-green-600 text-sm">
                  El sistema está analizando continuamente los puntos de las manos con MediaPipe.
                  Detecta automáticamente las señas de <strong>Amor</strong> (corazón con manos) y <strong>Paz</strong> (V con dedos)
                  y envía alertas de texto cuando las reconoce.
                </p>
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="database">
            <SignsDatabase />
          </TabsContent>

          <TabsContent value="stats">
            <div className="space-y-6">
              <Statistics />
              <Card className="p-6">
                <h3 className="text-xl font-bold text-gray-800 mb-4">Información del Sistema</h3>
                <div className="grid md:grid-cols-2 gap-4 text-sm text-gray-600">
                  <div>
                    <h4 className="font-semibold text-gray-800 mb-2">Señas Detectadas:</h4>
                    <ul className="space-y-1">
                      <li>• 💖 Amor - Corazón con ambas manos</li>
                      <li>• ✌️ Paz - V con dedos índice y medio</li>
                      <li>• Hola - Saludo básico</li>
                      <li>• Gracias - Agradecimiento</li>
                      <li>• Adiós - Despedida</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-800 mb-2">Tecnología:</h4>
                    <ul className="space-y-1">
                      <li>• MediaPipe Hands - Detección de puntos</li>
                      <li>• Reconocimiento en tiempo real</li>
                      <li>• Alertas de texto personalizadas</li>
                      <li>• Canvas overlay para visualización</li>
                    </ul>
                  </div>
                </div>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Index;
