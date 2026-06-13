import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import type { MatrixRecord } from '../types';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_DIR = path.join(__dirname, '..', '..', 'data');
const RECORDS_FILE = path.join(DATA_DIR, 'matrix-records.json');

let records: MatrixRecord[] = [];

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

function loadRecords() {
  ensureDataDir();
  if (fs.existsSync(RECORDS_FILE)) {
    try {
      const content = fs.readFileSync(RECORDS_FILE, 'utf-8');
      records = JSON.parse(content);
    } catch (error) {
      console.error('Failed to load records:', error);
      records = [];
    }
  }
}

function saveRecords() {
  ensureDataDir();
  try {
    fs.writeFileSync(RECORDS_FILE, JSON.stringify(records, null, 2), 'utf-8');
  } catch (error) {
    console.error('Failed to save records:', error);
    throw error;
  }
}

loadRecords();

export function generateId(): string {
  return `rec_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

export function getAllRecords(): MatrixRecord[] {
  return [...records].sort((a, b) => b.timestamp - a.timestamp);
}

export function getRecordById(id: string): MatrixRecord | undefined {
  return records.find(r => r.id === id);
}

export function createRecord(record: Omit<MatrixRecord, 'id' | 'timestamp'>): MatrixRecord {
  const newRecord: MatrixRecord = {
    ...record,
    id: generateId(),
    timestamp: Date.now(),
  };
  records.unshift(newRecord);
  saveRecords();
  return newRecord;
}

export function deleteRecord(id: string): boolean {
  const index = records.findIndex(r => r.id === id);
  if (index !== -1) {
    records.splice(index, 1);
    saveRecords();
    return true;
  }
  return false;
}

export function clearAllRecords(): void {
  records = [];
  saveRecords();
}

export interface DuplicateCheckResult {
  isDuplicate: boolean;
  existingRecord?: MatrixRecord;
}

function approxEqual(a: number, b: number, epsilon: number = 1e-8): boolean {
  return Math.abs(a - b) < epsilon;
}

export function findDuplicateRecord(candidate: {
  seed: number;
  rank: number;
  alpha: number;
  stats?: {
    mse: number;
    deltaNorm: number;
    updatedNorm: number;
  };
}): DuplicateCheckResult {
  const { seed, rank, alpha, stats } = candidate;

  for (const record of records) {
    if (
      record.seed === seed &&
      record.rank === rank &&
      approxEqual(record.alpha, alpha, 1e-6) &&
      stats &&
      approxEqual(record.stats.mse, stats.mse, 1e-8) &&
      approxEqual(record.stats.deltaNorm, stats.deltaNorm, 1e-6) &&
      approxEqual(record.stats.updatedNorm, stats.updatedNorm, 1e-6)
    ) {
      return { isDuplicate: true, existingRecord: record };
    }
  }

  return { isDuplicate: false };
}
