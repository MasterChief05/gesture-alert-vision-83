
export interface Sign {
  id: string;
  name: string;
  description: string;
  videoUrl?: string;
  landmarks?: number[][][]; // Ahora es una secuencia de frames [frame][landmark][x,y,z]
  confidence: number;
  createdAt: Date;
}

export interface DetectionResult {
  sign: Sign;
  confidence: number;
  timestamp: Date;
}
