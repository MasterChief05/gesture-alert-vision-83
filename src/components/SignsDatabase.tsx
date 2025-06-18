
import React, { useState } from 'react';
import { signsDatabase } from '@/data/signsDatabase';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Eye, Trash2, Plus, Upload } from 'lucide-react';

export const SignsDatabase: React.FC = () => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newSign, setNewSign] = useState({
    name: '',
    description: '',
    imageUrl: ''
  });

  const handleAddSign = () => {
    // Aquí se agregaría la lógica para guardar la nueva seña
    console.log('Nueva seña:', newSign);
    setIsDialogOpen(false);
    setNewSign({ name: '', description: '', imageUrl: '' });
  };

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Base de Datos de Señas</h2>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="flex items-center space-x-2">
              <Plus className="w-4 h-4" />
              <span>Agregar Seña</span>
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Agregar Nueva Seña</DialogTitle>
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
                  placeholder="Ej: Hola"
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
                  placeholder="Describe la seña..."
                />
              </div>
              <div className="grid gap-2">
                <label htmlFor="image" className="text-sm font-medium">
                  URL de la Imagen
                </label>
                <div className="flex gap-2">
                  <Input
                    id="image"
                    value={newSign.imageUrl}
                    onChange={(e) => setNewSign({ ...newSign, imageUrl: e.target.value })}
                    placeholder="https://ejemplo.com/imagen.jpg"
                  />
                  <Button variant="outline" size="sm">
                    <Upload className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              {newSign.imageUrl && (
                <div className="mt-2">
                  <img
                    src={newSign.imageUrl}
                    alt="Vista previa"
                    className="w-full h-32 object-cover rounded-lg"
                  />
                </div>
              )}
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleAddSign}>
                Guardar Seña
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4">
        {signsDatabase.map((sign) => (
          <Card key={sign.id} className="p-4 border-l-4 border-l-blue-500">
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
                  </div>
                </div>
              </div>
              <div className="flex space-x-2">
                <Button variant="outline" size="sm">
                  <Eye className="w-4 h-4" />
                </Button>
                <Button variant="outline" size="sm" className="text-red-600 hover:bg-red-50">
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </Card>
  );
};
