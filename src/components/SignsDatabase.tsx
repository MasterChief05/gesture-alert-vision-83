
import React from 'react';
import { signsDatabase } from '@/data/signsDatabase';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Eye, Trash2, Plus } from 'lucide-react';

export const SignsDatabase: React.FC = () => {
  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Base de Datos de Señas</h2>
        <Button className="flex items-center space-x-2">
          <Plus className="w-4 h-4" />
          <span>Agregar Seña</span>
        </Button>
      </div>

      <div className="grid gap-4">
        {signsDatabase.map((sign) => (
          <Card key={sign.id} className="p-4 border-l-4 border-l-blue-500">
            <div className="flex items-center justify-between">
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
