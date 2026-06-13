import { useState } from 'react';
import { Database, Trash2, Download, Clock, Hash, Search, ChevronDown, ChevronUp, Loader2 } from 'lucide-react';
import type { MatrixRecord } from '../types';
import { formatPercentage, formatMSE } from '../utils/colorMap';

interface RecordPanelProps {
  records: MatrixRecord[];
  onLoadRecord: (record: MatrixRecord) => void;
  onDeleteRecord: (id: string) => void;
  onSaveCurrent: () => void;
  isLoading: boolean;
  currentSeed: number;
}

export function RecordPanel({
  records,
  onLoadRecord,
  onDeleteRecord,
  onSaveCurrent,
  isLoading,
  currentSeed,
}: RecordPanelProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [isSavingLocal, setIsSavingLocal] = useState(false);

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString('zh-CN', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  const handleDelete = (id: string) => {
    if (confirmDelete === id) {
      onDeleteRecord(id);
      setConfirmDelete(null);
    } else {
      setConfirmDelete(id);
      setTimeout(() => setConfirmDelete(null), 3000);
    }
  };

  const handleSaveClick = () => {
    if (isSavingLocal || isLoading) return;
    setIsSavingLocal(true);
    onSaveCurrent();
    setTimeout(() => {
      setIsSavingLocal(false);
    }, 1200);
  };

  return (
    <div className="bg-zinc-800/30 backdrop-blur-sm rounded-2xl border border-zinc-700/50 overflow-hidden">
      <div
        className="flex items-center justify-between p-6 hover:bg-zinc-700/20 transition-colors">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex-1 flex items-center gap-3 text-left cursor-pointer">
          <Database className="w-5 h-5 text-purple-400 flex-shrink-0" />
          <div>
            <h2 className="text-xl font-semibold text-white">矩阵数据管理</h2>
            <p className="text-sm text-zinc-400">
              保存和管理历史矩阵数据，共 {records.length} 条记录
            </p>
          </div>
        </button>
        <div className="flex items-center gap-3">
          <button
            onClick={handleSaveClick}
            disabled={isLoading || isSavingLocal}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all text-sm ${
              isSavingLocal
                ? 'bg-purple-500/50 cursor-not-allowed text-white/80 scale-95'
                : 'bg-purple-600 hover:bg-purple-500 disabled:bg-zinc-700 disabled:cursor-not-allowed text-white'
            }`}
          >
            {isSavingLocal ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                保存中...
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                保存当前
              </>
            )}
          </button>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1 hover:bg-zinc-700/50 rounded-lg transition-colors">
            {isExpanded ? (
              <ChevronUp className="w-5 h-5 text-zinc-400" />
            ) : (
              <ChevronDown className="w-5 h-5 text-zinc-400" />
            )}
          </button>
        </div>
      </div>

      {isExpanded && (
        <div className="border-t border-zinc-700/50 max-h-96 overflow-y-auto">
          {records.length === 0 ? (
            <div className="p-8 text-center">
              <Database className="w-12 h-12 text-zinc-600 mx-auto mb-3" />
              <p className="text-zinc-500">暂无保存的记录</p>
              <p className="text-zinc-600 text-sm mt-1">点击"保存当前"按钮保存当前矩阵数据</p>
            </div>
          ) : (
            <div className="divide-y divide-zinc-700/50">
              {records.map((record) => (
                <div
                  key={record.id}
                  className="p-4 hover:bg-zinc-700/20 transition-colors group"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-4 mb-2">
                        <div className="flex items-center gap-1 text-zinc-400 text-sm">
                          <Clock className="w-3.5 h-3.5" />
                          {formatDate(record.timestamp)}
                        </div>
                        <div className="flex items-center gap-1 text-zinc-400 text-sm">
                          <Hash className="w-3.5 h-3.5" />
                          Seed: {record.seed}
                        </div>
                        <div className="px-2 py-0.5 bg-blue-500/20 text-blue-400 rounded text-xs font-mono">
                          r={record.rank}
                        </div>
                        <div className="px-2 py-0.5 bg-purple-500/20 text-purple-400 rounded text-xs font-mono">
                          α={record.alpha.toFixed(1)}
                        </div>
                      </div>
                      <div className="flex items-center gap-4 text-xs text-zinc-500">
                        <span>{record.rows} × {record.cols} 矩阵</span>
                        <span>MSE: {formatMSE(record.stats.mse)}</span>
                        <span>参数节省: {formatPercentage(record.stats.savingRatio)}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => onLoadRecord(record)}
                        className="flex items-center gap-1 px-3 py-1.5 bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 rounded text-sm transition-colors"
                      >
                        <Search className="w-3.5 h-3.5" />
                        加载
                      </button>
                      <button
                        onClick={() => handleDelete(record.id)}
                        className={`flex items-center gap-1 px-3 py-1.5 rounded text-sm transition-colors ${
                          confirmDelete === record.id
                            ? 'bg-red-600 text-white'
                            : 'bg-red-500/20 hover:bg-red-500/30 text-red-400'
                        }`}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        {confirmDelete === record.id ? '确认?' : '删除'}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
