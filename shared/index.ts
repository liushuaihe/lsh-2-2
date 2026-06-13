export interface MatrixData {
  rows: number;
  cols: number;
  data: number[][];
}

export interface DecomposeRequest {
  rank: number;
}

export interface DecomposeResponse {
  matrixW: MatrixData;
  matrixA: MatrixData;
  matrixB: MatrixData;
  matrixReconstructed: MatrixData;
  stats: {
    originalParams: number;
    loraParams: number;
    savingRatio: number;
    mse: number;
  };
}

export interface GenerateRequest {
  rows?: number;
  cols?: number;
  seed?: number;
}

export interface GenerateResponse {
  matrixW: MatrixData;
  seed: number;
}
