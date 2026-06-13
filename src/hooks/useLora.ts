import { useState, useCallback, useEffect } from 'react';
import type { DecomposeResponse, GenerateResponse, LoraState } from '../types';

const API_BASE_URL = import.meta.env.DEV ? '' : (import.meta.env.VITE_API_URL || 'http://localhost:3001');

function debounce<T extends (...args: any[]) => any>(func: T, wait: number): (...args: Parameters<T>) => void {
  let timeout: ReturnType<typeof setTimeout> | null = null;
  return (...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

export function useLora(): LoraState {
  const [rank, setRank] = useState<number>(8);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [matrixW, setMatrixW] = useState<DecomposeResponse['matrixW'] | null>(null);
  const [matrixA, setMatrixA] = useState<DecomposeResponse['matrixA'] | null>(null);
  const [matrixB, setMatrixB] = useState<DecomposeResponse['matrixB'] | null>(null);
  const [matrixReconstructed, setMatrixReconstructed] = useState<DecomposeResponse['matrixReconstructed'] | null>(null);
  const [stats, setStats] = useState<DecomposeResponse['stats'] | null>(null);

  const decompose = useCallback(async (targetRank: number) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/decompose`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ rank: targetRank }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: DecomposeResponse = await response.json();
      
      setMatrixW(data.matrixW);
      setMatrixA(data.matrixA);
      setMatrixB(data.matrixB);
      setMatrixReconstructed(data.matrixReconstructed);
      setStats(data.stats);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to decompose matrix');
      console.error('Decompose error:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const debouncedDecompose = useCallback(
    debounce((targetRank: number) => decompose(targetRank), 100),
    [decompose]
  );

  const generateMatrix = useCallback(async (rows?: number, cols?: number, seed?: number) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ rows, cols, seed }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: GenerateResponse = await response.json();
      setMatrixW(data.matrixW);
      
      await decompose(rank);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate matrix');
      console.error('Generate error:', err);
    } finally {
      setIsLoading(false);
    }
  }, [rank, decompose]);

  useEffect(() => {
    generateMatrix(64, 64, 42);
  }, []);

  const handleRankChange = useCallback((newRank: number) => {
    setRank(newRank);
    debouncedDecompose(newRank);
  }, [debouncedDecompose]);

  return {
    rank,
    isLoading,
    error,
    matrixW,
    matrixA,
    matrixB,
    matrixReconstructed,
    stats,
    setRank: handleRankChange,
    decompose,
    generateMatrix,
  };
}
