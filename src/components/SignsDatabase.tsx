
import React, { useState, useRef } from 'react';
import { useSigns } from '@/hooks/useSigns';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Eye, Trash2, Plus, Upload, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export const SignsDatabase: React.FC = () => {
  const { signs, loading, addSign, deleteSign } = useSigns();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newSign, setNewSign] = useState({
    name: '',
    description: '',
    imageFile: null as File | null
  });
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleAddSign = async () => {
    if (!newSign.name.trim() || !newSign.description.trim()) {
      toast.error('Por favor completa todos los campos');
      return;
    }

    if (!newSign.imageFile) {
      toast.error('Por favor selecciona una imagen de la seña');
      return;
    }

    try {
      setIsSubmitting(true);
      await addSign(newSign);
      setIsDialogOpen(false);
      setNewSign({ name: '', description: '', imageFile: null });
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error) {
      console.error('Error adding sign:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.type.startsWith('image/')) {
        setNewSign({ ...newSign, imageFile: file });
      } else {
        toast.error('Por favor selecciona un archivo de imagen válido');
        event.target.value = '';
      }
    }
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
        <h2 className="text-2xl font-bold text-gray-800">Base de Datos de Señas (IndexedDB)</h2>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="flex items-center space-x-2">
              <Plus className="w-4 h-4" />
              <span>Agregar Seña</span>
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Agregar Nueva Seña de Manos</DialogTitle>
            </DialogHeader>
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
              <div className="grid gap-2">
                <label htmlFor="image" className="text-sm font-medium">
                  Imagen de la Seña
                </label>
                <div className="flex gap-2">
                  <Input
                    ref={fileInputRef}
                    id="image"
                    type="file"
                    accept="image/*"
                    onChange={handleFileSelect}
                    className="flex-1"
                  />
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Upload className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              {newSign.imageFile && (
                <div className="mt-2">
                  <img
                    src={URL.createObjectURL(newSign.imageFile)}
                    alt="Vista previa"
                    className="w-full h-32 object-cover rounded-lg border-2 border-blue-200"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Archivo: {newSign.imageFile.name}
                  </p>
                </div>
              )}
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleAddSign} disabled={isSubmitting}>
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
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4">
        {signs.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <p>No hay señas guardadas. ¡Agrega tu primera seña!</p>
          </div>
        ) : (
          signs.map((sign) => (
            <Card key={sign.id} className="p-4 border-l-4 border-l-green-500">
              <div className="flex items-center justify-between">
                <div className="flex gap-4 flex-1">
                  {sign.videoUrl && (
                    <div className="flex-shrink-0">
                      <img
                        src={sign.videoUrl}
                        alt={sign.name}
                        className="w-20 h-20 object-cover rounded-lg border-2 border-gray-200"
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
                      <Badge variant="default" className="text-xs bg-green-100 text-green-800">
                        Local
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
