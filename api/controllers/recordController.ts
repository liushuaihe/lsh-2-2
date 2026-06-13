import type { Request, Response } from 'express';
import {
  getAllRecords,
  getRecordById,
  createRecord,
  deleteRecord,
  clearAllRecords,
  findDuplicateRecord,
} from '../services/storageService';
import type { SaveRecordRequest } from '../types';

export function listRecords(req: Request, res: Response) {
  try {
    const records = getAllRecords();
    res.json({
      success: true,
      records,
    });
  } catch (error) {
    console.error('Error in listRecords:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to list records',
    });
  }
}

export function getRecord(req: Request<{ id: string }>, res: Response) {
  try {
    const { id } = req.params;
    const record = getRecordById(id);

    if (!record) {
      return res.status(404).json({
        success: false,
        error: 'Record not found',
      });
    }

    res.json({
      success: true,
      record,
    });
  } catch (error) {
    console.error('Error in getRecord:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get record',
    });
  }
}

export function saveRecord(req: Request<object, object, SaveRecordRequest>, res: Response) {
  try {
    const {
      seed,
      rank,
      alpha,
      matrixW,
      matrixA,
      matrixB,
      matrixDelta,
      matrixUpdated,
      stats,
    } = req.body;

    if (!matrixW || !matrixA || !matrixB || !matrixDelta || !matrixUpdated) {
      return res.status(400).json({
        success: false,
        error: 'All matrix data is required',
      });
    }

    const normalizedStats = stats ?? {
      originalParams: matrixW.rows * matrixW.cols,
      loraParams: rank * (matrixW.rows + matrixW.cols),
      savingRatio: 1 - (rank * (matrixW.rows + matrixW.cols)) / (matrixW.rows * matrixW.cols),
      mse: 0,
      deltaNorm: 0,
      updatedNorm: 0,
    };

    const duplicateCheck = findDuplicateRecord({
      seed: seed ?? 42,
      rank: rank ?? 8,
      alpha: alpha ?? 1.0,
      stats: normalizedStats,
    });

    if (duplicateCheck.isDuplicate && duplicateCheck.existingRecord) {
      const existing = duplicateCheck.existingRecord;
      return res.status(409).json({
        success: false,
        error: 'Duplicate record',
        message: `相同配置 (Seed=${existing.seed}, Rank=${existing.rank}, α=${existing.alpha.toFixed(2)}) 的记录已存在，保存时间: ${new Date(existing.timestamp).toLocaleString('zh-CN')}`,
        existingRecord: existing,
      });
    }

    const record = createRecord({
      seed: seed ?? 42,
      rank: rank ?? 8,
      alpha: alpha ?? 1.0,
      rows: matrixW.rows,
      cols: matrixW.cols,
      matrixW,
      matrixA,
      matrixB,
      matrixDelta,
      matrixUpdated,
      stats: normalizedStats,
    });

    res.json({
      success: true,
      record,
    });
  } catch (error) {
    console.error('Error in saveRecord:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to save record',
    });
  }
}

export function removeRecord(req: Request<{ id: string }>, res: Response) {
  try {
    const { id } = req.params;
    const deleted = deleteRecord(id);

    if (!deleted) {
      return res.status(404).json({
        success: false,
        error: 'Record not found',
      });
    }

    res.json({
      success: true,
      message: 'Record deleted successfully',
    });
  } catch (error) {
    console.error('Error in removeRecord:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete record',
    });
  }
}

export function clearRecords(req: Request, res: Response) {
  try {
    clearAllRecords();
    res.json({
      success: true,
      message: 'All records cleared successfully',
    });
  } catch (error) {
    console.error('Error in clearRecords:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to clear records',
    });
  }
}
