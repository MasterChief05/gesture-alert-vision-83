
import { useState, useEffect } from 'react';
import { Sign } from '@/types/sign';
import { dbService } from '@/services/indexedDBService';
import { toast } from 'sonner';

export const useSigns = () => {
  const [signs, setSigns] = useState<Sign[]>([]);
  const [loading, setLoading] = useState(true);

  const loadSigns = async () => {
    try {
      setLoading(true);
      const loadedSigns = await dbService.getAllSigns();
      setSigns(loadedSigns);
    } catch (error) {
      console.error('Error loading signs:', error);
      toast.error('Error al cargar las señas');
    } finally {
      setLoading(false);
    }
  };

  const addSign = async (signData: { 
    name: string; 
    description: string; 
    videoBlob: Blob;
    landmarks: number[][][]
  }) => {
    try {
      // Convertir video blob a base64 para almacenamiento
      const videoUrl = await blobToBase64(signData.videoBlob);

      const newSign = await dbService.addSign({
        name: signData.name,
        description: signData.description,
        videoUrl: videoUrl,
        confidence: 1.0,
        landmarks: signData.landmarks,
        createdAt: new Date()
      });

      setSigns(prev => [...prev, newSign]);
      toast.success(`Seña "${newSign.name}" grabada con ${signData.landmarks.length} frames`);
      return newSign;
    } catch (error) {
      console.error('Error adding sign:', error);
      toast.error('Error al agregar la seña');
      throw error;
    }
  };

  const deleteSign = async (id: string) => {
    try {
      await dbService.deleteSign(id);
      setSigns(prev => prev.filter(sign => sign.id !== id));
      toast.success('Seña eliminada correctamente');
    } catch (error) {
      console.error('Error deleting sign:', error);
      toast.error('Error al eliminar la seña');
    }
  };

  const getSignByName = async (name: string) => {
    try {
      return await dbService.getSignByName(name);
    } catch (error) {
      console.error('Error getting sign by name:', error);
      return null;
    }
  };

  useEffect(() => {
    loadSigns();
  }, []);

  return {
    signs,
    loading,
    addSign,
    deleteSign,
    getSignByName,
    loadSigns
  };
};

const blobToBase64 = (blob: Blob): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(blob);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = error => reject(error);
  });
};
