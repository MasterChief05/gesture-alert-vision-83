
import React from 'react';
import { Card } from '@/components/ui/card';
import { signsDatabase } from '@/data/signsDatabase';
import { Activity, Database, TrendingUp, Clock } from 'lucide-react';

export const Statistics: React.FC = () => {
  const totalSigns = signsDatabase.length;
  const avgConfidence = signsDatabase.reduce((acc, sign) => acc + sign.confidence, 0) / totalSigns;
  const recentSigns = signsDatabase.filter(
    sign => Date.now() - sign.createdAt.getTime() < 7 * 24 * 60 * 60 * 1000
  ).length;

  const stats = [
    {
      title: 'Total de Señas',
      value: totalSigns,
      icon: Database,
      color: 'text-blue-600'
    },
    {
      title: 'Confianza Promedio',
      value: `${(avgConfidence * 100).toFixed(1)}%`,
      icon: TrendingUp,
      color: 'text-green-600'
    },
    {
      title: 'Señas Agregadas (7d)',
      value: recentSigns,
      icon: Clock,
      color: 'text-purple-600'
    },
    {
      title: 'Estado del Sistema',
      value: 'Activo',
      icon: Activity,
      color: 'text-green-600'
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat, index) => (
        <Card key={index} className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">{stat.title}</p>
              <p className="text-2xl font-bold text-gray-800">{stat.value}</p>
            </div>
            <stat.icon className={`w-8 h-8 ${stat.color}`} />
          </div>
        </Card>
      ))}
    </div>
  );
};
