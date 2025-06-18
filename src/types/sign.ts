
export interface Sign {
  id: string;
  name: string;
  description: string;
  videoUrl?: string;
  landmarks?: number[][];
  confidence: number;
  createdAt: Date;
}

export interface DetectionResult {
  sign: Sign;
  confidence: number;
  timestamp: Date;
}
