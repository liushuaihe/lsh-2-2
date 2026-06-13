import type { Request, Response } from 'express';
import { generateRandomMatrix, performSVD, getCurrentMatrix } from '../services/matrixService';
import type { DecomposeRequest, GenerateRequest } from '../types';

export function decomposeMatrix(req: Request<object, object, DecomposeRequest>, res: Response) {
  try {
    const { rank } = req.body;
    
    if (rank === undefined || rank === null) {
      return res.status(400).json({ error: 'Rank parameter is required' });
    }
    
    if (rank < 1 || rank > 128) {
      return res.status(400).json({ error: 'Rank must be between 1 and 128' });
    }
    
    const result = performSVD(rank);
    res.json(result);
  } catch (error) {
    console.error('Error in decomposeMatrix:', error);
    res.status(500).json({ error: 'Failed to perform SVD decomposition' });
  }
}

export function generateMatrix(req: Request<object, object, GenerateRequest>, res: Response) {
  try {
    const { rows, cols, seed } = req.body;
    
    const actualRows = rows ?? 64;
    const actualCols = cols ?? 64;
    
    if (actualRows < 1 || actualRows > 128 || actualCols < 1 || actualCols > 128) {
      return res.status(400).json({ error: 'Matrix dimensions must be between 1 and 128' });
    }
    
    const { seed: generatedSeed } = generateRandomMatrix(actualRows, actualCols, seed);
    
    const matrix = getCurrentMatrix();
    if (!matrix) {
      return res.status(500).json({ error: 'Failed to generate matrix' });
    }
    
    res.json({
      matrixW: {
        rows: matrix.rows,
        cols: matrix.columns,
        data: matrix.to2DArray()
      },
      seed: generatedSeed
    });
  } catch (error) {
    console.error('Error in generateMatrix:', error);
    res.status(500).json({ error: 'Failed to generate random matrix' });
  }
}
