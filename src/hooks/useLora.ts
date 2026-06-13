import { useState, useCallback, useEffect, useRef } from 'react';
import type { 
  DecomposeResponse, 
  GenerateResponse, 
  LoraState,
  FinetuneStep,
  MatrixRecord,
  CalculateDeltaResponse,
} from '../types';

const API_BASE_URL = import.meta.env.DEV ? '' : (import.meta.env.VITE_API_URL || 'http://localhost:3001');

function debounce<T extends (...args: any[]) => any>(func: T, wait: number): (...args: Parameters<T>) => void {
  let timeout: ReturnType<typeof setTimeout> | null = null;
  return (...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

export function useLora(): LoraState {
  const [rank, setRankState] = useState<number>(8);
  const [alpha, setAlphaState] = useState<number>(1.0);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isFinetuning, setIsFinetuning] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [seed, setSeed] = useState<number>(42);
  const [matrixW, setMatrixW] = useState<LoraState['matrixW']>(null);
  const [matrixA, setMatrixA] = useState<LoraState['matrixA']>(null);
  const [matrixB, setMatrixB] = useState<LoraState['matrixB']>(null);
  const [matrixReconstructed, setMatrixReconstructed] = useState<LoraState['matrixReconstructed']>(null);
  const [matrixDelta, setMatrixDelta] = useState<LoraState['matrixDelta']>(null);
  const [matrixDeltaScaled, setMatrixDeltaScaled] = useState<LoraState['matrixDeltaScaled']>(null);
  const [matrixUpdated, setMatrixUpdated] = useState<LoraState['matrixUpdated']>(null);
  const [stats, setStats] = useState<LoraState['stats']>(null);
  const [deltaStats, setDeltaStats] = useState<LoraState['deltaStats']>(null);
  const [finetuneSteps, setFinetuneSteps] = useState<FinetuneStep[]>([]);
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(0);
  const [records, setRecords] = useState<MatrixRecord[]>([]);

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

  const calculateDelta = useCallback(async (targetRank: number, targetAlpha: number) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/calculate-delta`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ rank: targetRank, alpha: targetAlpha }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: CalculateDeltaResponse = await response.json();
      
      setMatrixDelta(data.matrixDelta);
      setMatrixDeltaScaled(data.matrixDeltaScaled);
      setMatrixUpdated(data.matrixUpdated);
      setDeltaStats(data.stats);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to calculate delta');
      console.error('Calculate delta error:', err);
    }
  }, []);

  const debouncedDecompose = useCallback(
    debounce((targetRank: number) => decompose(targetRank), 100),
    [decompose]
  );

  const debouncedCalculateDelta = useCallback(
    debounce((targetRank: number, targetAlpha: number) => calculateDelta(targetRank, targetAlpha), 100),
    [calculateDelta]
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
      setSeed(data.seed);
      
      await decompose(rank);
      await calculateDelta(rank, alpha);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate matrix');
      console.error('Generate error:', err);
    } finally {
      setIsLoading(false);
    }
  }, [rank, alpha, decompose, calculateDelta]);

  const startFinetune = useCallback(async (
    targetRank: number, 
    targetAlpha: number, 
    steps: number, 
    learningRate: number
  ) => {
    setIsFinetuning(true);
    setError(null);
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/finetune`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          rank: targetRank, 
          alpha: targetAlpha, 
          steps, 
          learningRate,
          seed
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.success && data.steps) {
        setFinetuneSteps(data.steps);
        setCurrentStepIndex(0);
        
        if (data.steps.length > 0) {
          const firstStep = data.steps[0];
          setMatrixA(firstStep.matrixA);
          setMatrixB(firstStep.matrixB);
          setMatrixDelta(firstStep.matrixDelta);
          setMatrixUpdated(firstStep.matrixUpdated);
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to simulate finetune');
      console.error('Finetune error:', err);
    } finally {
      setIsFinetuning(false);
    }
  }, [seed]);

  const setCurrentStepIndexCallback = useCallback((index: number) => {
    setCurrentStepIndex(index);
    
    if (finetuneSteps.length > 0 && index >= 0 && index < finetuneSteps.length) {
      const step = finetuneSteps[index];
      setMatrixA(step.matrixA);
      setMatrixB(step.matrixB);
      setMatrixDelta(step.matrixDelta);
      setMatrixUpdated(step.matrixUpdated);
    }
  }, [finetuneSteps]);

  const isSavingRef = useRef(false);
  const loadRecordsRef = useRef<() => Promise<void>>(() => Promise.resolve());

  const saveCurrentRecord = useCallback(async (currentSeed: number) => {
    if (isSavingRef.current) {
      console.log('Save already in progress, skipping');
      return;
    }
    
    if (!matrixW || !matrixA || !matrixB || !matrixDelta || !matrixUpdated) {
      setError('Cannot save: missing matrix data');
      return;
    }

    isSavingRef.current = true;

    try {
      const response = await fetch(`${API_BASE_URL}/api/records`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          seed: currentSeed,
          rank,
          alpha,
          matrixW,
          matrixA,
          matrixB,
          matrixDelta,
          matrixUpdated,
          stats: {
            originalParams: stats?.originalParams ?? 0,
            loraParams: stats?.loraParams ?? 0,
            savingRatio: stats?.savingRatio ?? 0,
            mse: stats?.mse ?? 0,
            deltaNorm: deltaStats?.deltaNorm ?? 0,
            updatedNorm: deltaStats?.updatedNorm ?? 0,
          },
        }),
      });

      if (!response.ok) {
        if (response.status === 409) {
          const errData = await response.json();
          setError(errData.message || '此记录已存在，无需重复保存');
          return;
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      await loadRecordsRef.current();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save record');
      console.error('Save record error:', err);
    } finally {
      setTimeout(() => {
        isSavingRef.current = false;
      }, 1000);
    }
  }, [matrixW, matrixA, matrixB, matrixDelta, matrixUpdated, rank, alpha, stats, deltaStats]);

  const loadRecords = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/records`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.success && data.records) {
        setRecords(data.records);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load records');
      console.error('Load records error:', err);
    }
  }, []);

  useEffect(() => {
    loadRecordsRef.current = loadRecords;
  }, [loadRecords]);

  const deleteRecord = useCallback(async (id: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/records/${id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      await loadRecords();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete record');
      console.error('Delete record error:', err);
    }
  }, [loadRecords]);

  const loadRecord = useCallback((record: MatrixRecord) => {
    setRankState(record.rank);
    setAlphaState(record.alpha);
    setSeed(record.seed);
    setMatrixW(record.matrixW);
    setMatrixA(record.matrixA);
    setMatrixB(record.matrixB);
    setMatrixDelta(record.matrixDelta);
    setMatrixUpdated(record.matrixUpdated);
    setStats({
      originalParams: record.stats.originalParams,
      loraParams: record.stats.loraParams,
      savingRatio: record.stats.savingRatio,
      mse: record.stats.mse,
    });
    setDeltaStats({
      deltaNorm: record.stats.deltaNorm,
      deltaScaledNorm: record.stats.deltaNorm * record.alpha,
      updatedNorm: record.stats.updatedNorm,
      originalNorm: 0,
      scaleRatio: record.alpha,
    });
    setFinetuneSteps([]);
    setCurrentStepIndex(0);
  }, []);

  useEffect(() => {
    generateMatrix(64, 64, 42);
    loadRecords();
  }, []);

  const handleRankChange = useCallback((newRank: number) => {
    setRankState(newRank);
    debouncedDecompose(newRank);
    debouncedCalculateDelta(newRank, alpha);
  }, [alpha, debouncedDecompose, debouncedCalculateDelta]);

  const handleAlphaChange = useCallback((newAlpha: number) => {
    setAlphaState(newAlpha);
    debouncedCalculateDelta(rank, newAlpha);
  }, [rank, debouncedCalculateDelta]);

  return {
    rank,
    alpha,
    isLoading,
    isFinetuning,
    error,
    matrixW,
    matrixA,
    matrixB,
    matrixReconstructed,
    matrixDelta,
    matrixDeltaScaled,
    matrixUpdated,
    stats,
    deltaStats,
    finetuneSteps,
    currentStepIndex,
    records,
    setRank: handleRankChange,
    setAlpha: handleAlphaChange,
    decompose,
    generateMatrix,
    calculateDelta,
    startFinetune,
    setCurrentStepIndex: setCurrentStepIndexCallback,
    saveCurrentRecord,
    loadRecords,
    deleteRecord,
    loadRecord,
  };
}
