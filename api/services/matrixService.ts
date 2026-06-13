import { Matrix, SingularValueDecomposition } from 'ml-matrix';
import type { MatrixData, DecomposeResponse } from '../types';

class SeededRandom {
  private seed: number;

  constructor(seed: number) {
    this.seed = seed;
  }

  next(): number {
    this.seed = (this.seed * 9301 + 49297) % 233280;
    return this.seed / 233280;
  }

  nextGaussian(): number {
    let u = 0, v = 0;
    while (u === 0) u = this.next();
    while (v === 0) v = this.next();
    return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
  }
}

let currentMatrix: Matrix | null = null;
let currentSeed: number = 42;

export function generateRandomMatrix(rows: number = 64, cols: number = 64, seed?: number): { matrix: Matrix; seed: number } {
  const actualSeed = seed ?? currentSeed;
  currentSeed = actualSeed;
  
  const rng = new SeededRandom(actualSeed);
  const data: number[][] = [];
  
  for (let i = 0; i < rows; i++) {
    const row: number[] = [];
    for (let j = 0; j < cols; j++) {
      row.push(rng.nextGaussian() * 0.5);
    }
    data.push(row);
  }
  
  currentMatrix = new Matrix(data);
  return { matrix: currentMatrix, seed: actualSeed };
}

export function getCurrentMatrix(): Matrix | null {
  return currentMatrix;
}

function matrixToData(matrix: Matrix): MatrixData {
  return {
    rows: matrix.rows,
    cols: matrix.columns,
    data: matrix.to2DArray()
  };
}

export function performSVD(rank: number): DecomposeResponse {
  if (!currentMatrix) {
    const { matrix } = generateRandomMatrix(64, 64, currentSeed);
    currentMatrix = matrix;
  }

  const W = currentMatrix;
  const m = W.rows;
  const n = W.columns;

  const svd = new SingularValueDecomposition(W, {
    computeLeftSingularVectors: true,
    computeRightSingularVectors: true,
    autoTranspose: true,
  });

  const U = svd.leftSingularVectors;
  const S = svd.diagonal;
  const V = svd.rightSingularVectors;

  const actualRank = Math.min(rank, S.length, m, n);

  const U_r = U.subMatrix(0, m - 1, 0, actualRank - 1);
  const S_r = Matrix.diag(S.slice(0, actualRank));
  const V_r = V.subMatrix(0, n - 1, 0, actualRank - 1);

  const sqrtS_r = S_r.clone();
  for (let i = 0; i < actualRank; i++) {
    sqrtS_r.set(i, i, Math.sqrt(sqrtS_r.get(i, i)));
  }

  const B = U_r.mmul(sqrtS_r);
  const A = sqrtS_r.mmul(V_r.transpose());

  const W_reconstructed = B.mmul(A);

  const mse = calculateMSE(W, W_reconstructed);
  const stats = calculateStats(m, n, actualRank, mse);

  return {
    matrixW: matrixToData(W),
    matrixA: matrixToData(A),
    matrixB: matrixToData(B),
    matrixReconstructed: matrixToData(W_reconstructed),
    stats
  };
}

export function calculateMSE(original: Matrix, reconstructed: Matrix): number {
  const m = original.rows;
  const n = original.columns;
  let sumSquaredError = 0;

  for (let i = 0; i < m; i++) {
    for (let j = 0; j < n; j++) {
      const diff = original.get(i, j) - reconstructed.get(i, j);
      sumSquaredError += diff * diff;
    }
  }

  return sumSquaredError / (m * n);
}

export function calculateStats(m: number, n: number, rank: number, mse: number) {
  const originalParams = m * n;
  const loraParams = rank * (m + n);
  const savingRatio = 1 - loraParams / originalParams;

  return {
    originalParams,
    loraParams,
    savingRatio,
    mse
  };
}
