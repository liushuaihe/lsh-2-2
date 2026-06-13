import type { MatrixData, DecomposeResponse, GenerateResponse } from '../../shared';

export type { MatrixData, DecomposeResponse, GenerateResponse };

export interface HeatmapProps {
  data: MatrixData;
  title: string;
  colorScheme?: 'warm' | 'cool' | 'viridis';
  minValue?: number;
  maxValue?: number;
}

export interface MatrixCardProps {
  data: MatrixData;
  title: string;
  subtitle?: string;
  colorScheme?: 'warm' | 'cool' | 'viridis';
}

export interface RankSliderProps {
  value: number;
  min?: number;
  max?: number;
  onChange: (value: number) => void;
  onChangeEnd?: (value: number) => void;
  disabled?: boolean;
}

export interface StatsPanelProps {
  originalParams: number;
  loraParams: number;
  savingRatio: number;
  mse: number;
  rank: number;
}

export interface LoraState {
  rank: number;
  isLoading: boolean;
  error: string | null;
  matrixW: MatrixData | null;
  matrixA: MatrixData | null;
  matrixB: MatrixData | null;
  matrixReconstructed: MatrixData | null;
  stats: DecomposeResponse['stats'] | null;
  setRank: (rank: number) => void;
  decompose: (rank: number) => Promise<void>;
  generateMatrix: (rows?: number, cols?: number, seed?: number) => Promise<void>;
}
