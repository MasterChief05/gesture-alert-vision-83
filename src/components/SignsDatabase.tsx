
import React, { useState } from 'react';
import { useSigns } from '@/hooks/useSigns';
import { VideoRecorder } from '@/components/VideoRecorder';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Eye, Trash2, Plus, Video, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export const SignsDatabase: React.FC = () => {
  const { signs, loading, addSign, deleteSign } = useSigns();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showVideoRecorder, setShowVideoRecorder] = useState(false);
  const [newSign, setNewSign] = useState({
    name: '',
    description: '',
    videoBlob: null as Blob | null,
    landmarks: [] as number[][][]
  });

  const handleAddSign = async () => {
    if (!newSign.name.trim() || !newSign.description.trim()) {
      toast.error('Por favor completa todos los campos');
      return;
    }

    if (!newSign.videoBlob || newSign.landmarks.length === 0) {
      toast.error('Por favor graba un video de la seña');
      return;
    }

    try {
      setIsSubmitting(true);
      await addSign(newSign);
      setIsDialogOpen(false);
      setShowVideoRecorder(false);
      setNewSign({ name: '', description: '', videoBlob: null, landmarks: [] });
    } catch (error) {
      console.error('Error adding sign:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVideoRecorded = (videoBlob: Blob, landmarks: number[][][]) => {
    setNewSign({ ...newSign, videoBlob, landmarks });
    setShowVideoRecorder(false);
    toast.success(`Video grabado con ${landmarks.length} frames de landmarks`);
  };

  const handleDeleteSign = async (id: string, name: string) => {
    if (window.confirm(`¿Estás seguro de que quieres eliminar la seña "${name}"?`)) {
      await deleteSign(id);
    }
  };

  if (loading) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-center space-x-2">
          <Loader2 className="w-6 h-6 animate-spin" />
          <span>Cargando señas...</span>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Base de Datos de Señas (Video + Landmarks)</h2>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="flex items-center space-x-2">
              <Plus className="w-4 h-4" />
              <span>Agregar Seña</span>
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Grabar Nueva Seña con Landmarks</DialogTitle>
            </DialogHeader>
            
            {!showVideoRecorder ? (
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <label htmlFor="name" className="text-sm font-medium">
                    Nombre de la Seña
                  </label>
                  <Input
                    id="name"
                    value={newSign.name}
                    onChange={(e) => setNewSign({ ...newSign, name: e.target.value })}
                    placeholder="Ej: Hola, Amor, Paz"
                  />
                </div>
                <div className="grid gap-2">
                  <label htmlFor="description" className="text-sm font-medium">
                    Descripción
                  </label>
                  <Textarea
                    id="description"
                    value={newSign.description}
                    onChange={(e) => setNewSign({ ...newSign, description: e.target.value })}
                    placeholder="Describe cómo hacer la seña..."
                  />
                </div>
                
                {newSign.videoBlob && (
                  <div className="mt-2 p-4 bg-green-50 rounded-lg border border-green-200">
                    <div className="flex items-center space-x-2">
                      <Video className="w-5 h-5 text-green-600" />
                      <span className="text-green-800 font-medium">Video grabado exitosamente</span>
                    </div>
                    <p className="text-green-600 text-sm mt-1">
                      {newSign.landmarks.length} frames con landmarks capturados
                    </p>
                  </div>
                )}
                
                <div className="flex justify-between">
                  <Button 
                    variant="outline" 
                    onClick={() => setShowVideoRecorder(true)}
                    className="flex items-center space-x-2"
                  >
                    <Video className="w-4 h-4" />
                    <span>{newSign.videoBlob ? 'Grabar de Nuevo' : 'Grabar Video'}</span>
                  </Button>
                  
                  <div className="flex gap-2">
                    <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                      Cancelar
                    </Button>
                    <Button 
                      onClick={handleAddSign} 
                      disabled={isSubmitting || !newSign.videoBlob}
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Guardando...
                        </>
                      ) : (
                        'Guardar Seña'
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              <VideoRecorder
                onVideoRecorded={handleVideoRecorded}
                onCancel={() => setShowVideoRecorder(false)}
              />
            )}
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4">
        {signs.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Video className="w-16 h-16 mx-auto mb-4 text-gray-300" />
            <p className="text-lg mb-2">No hay señas grabadas</p>
            <p className="text-sm">¡Graba tu primera seña con landmarks!</p>
          </div>
        ) : (
          signs.map((sign) => (
            <Card key={sign.id} className="p-4 border-l-4 border-l-blue-500">
              <div className="flex items-center justify-between">
                <div className="flex gap-4 flex-1">
                  {sign.videoUrl && (
                    <div className="flex-shrink-0">
                      <video
                        src={sign.videoUrl}
                        className="w-20 h-20 object-cover rounded-lg border-2 border-gray-200"
                        muted
                        loop
                        onMouseEnter={(e) => e.currentTarget.play()}
                        onMouseLeave={(e) => e.currentTarget.pause()}
                      />
                    </div>
                  )}
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg text-gray-800">{sign.name}</h3>
                    <p className="text-gray-600 text-sm mb-2">{sign.description}</p>
                    <div className="flex items-center space-x-2">
                      <Badge variant="secondary">
                        Confianza: {(sign.confidence * 100).toFixed(0)}%
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {sign.createdAt.toLocaleDateString()}
                      </Badge>
                      <Badge variant="default" className="text-xs bg-blue-100 text-blue-800">
                        {sign.landmarks?.length || 0} frames
                      </Badge>
                      <Badge variant="default" className="text-xs bg-green-100 text-green-800">
                        Video + Landmarks
                      </Badge>
                    </div>
                  </div>
                </div>
                <div className="flex space-x-2">
                  <Button variant="outline" size="sm">
                    <Eye className="w-4 h-4" />
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="text-red-600 hover:bg-red-50"
                    onClick={() => handleDeleteSign(sign.id, sign.name)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>
    </Card>
  );
};
