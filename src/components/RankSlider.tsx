import { useState, useCallback, useRef, useEffect } from 'react';
import type { RankSliderProps } from '../types';

export function RankSlider({
  value,
  min = 1,
  max = 64,
  onChange,
  onChangeEnd,
  disabled = false
}: RankSliderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const labelRef = useRef<HTMLDivElement>(null);

  const ticks = [1, 4, 8, 16, 32, 64];

  const handleInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = parseInt(e.target.value, 10);
    onChange(newValue);
  }, [onChange]);

  const handleMouseDown = useCallback(() => {
    setIsDragging(true);
  }, []);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    if (onChangeEnd) {
      onChangeEnd(value);
    }
  }, [onChangeEnd, value]);

  const percentage = ((value - min) / (max - min)) * 100;

  useEffect(() => {
    const handleGlobalMouseUp = () => {
      if (isDragging) {
        setIsDragging(false);
        if (onChangeEnd) {
          onChangeEnd(value);
        }
      }
    };

    window.addEventListener('mouseup', handleGlobalMouseUp);
    return () => window.removeEventListener('mouseup', handleGlobalMouseUp);
  }, [isDragging, onChangeEnd, value]);

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-3">
        <label className="text-sm font-medium text-zinc-300">
          秩 (Rank)
        </label>
        <div 
          ref={labelRef}
          className="bg-gradient-to-r from-blue-600 to-cyan-500 px-4 py-1.5 rounded-lg font-mono font-bold text-white shadow-lg shadow-blue-500/30 transition-all duration-150"
          style={{
            transform: isDragging ? 'scale(1.1)' : 'scale(1)',
          }}
        >
          {value}
        </div>
      </div>
    
      <div className="relative">
        <div className="h-2 bg-zinc-700 rounded-full overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-blue-600 to-cyan-500 rounded-full transition-all duration-75"
            style={{ width: `${percentage}%` }}
          />
        </div>
      
        <input
          type="range"
          min={min}
          max={max}
          value={value}
          onChange={handleInput}
          onMouseDown={handleMouseDown}
          onMouseUp={handleMouseUp}
          disabled={disabled}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
        />
      
        <div 
          className="absolute top-1/2 -translate-y-1/2 w-5 h-5 bg-white rounded-full shadow-lg border-2 border-blue-500 pointer-events-none transition-all duration-75"
          style={{ 
            left: `calc(${percentage}% - 10px)`,
            boxShadow: isDragging ? '0 0 0 4px rgba(59, 130, 246, 0.3)' : '0 1px 3px rgba(0,0,0,0.3)',
            transform: `translateY(-50%) ${isDragging ? 'scale(1.2)' : 'scale(1)'}`,
          }}
        />
      </div>
    
      <div className="flex justify-between mt-2">
        {ticks.map((tick) => (
          <div
            key={tick}
            className="flex flex-col items-center"
          >
            <div 
              className="w-0.5 h-2 rounded-full transition-colors duration-200"
              style={{
                backgroundColor: value >= tick ? 'rgba(59, 130, 246, 1)' : 'rgba(113, 113, 122, 0.5)',
              }}
            />
            <span 
              className="text-xs mt-1 font-mono transition-colors duration-200"
              style={{
                color: value >= tick ? '#60a5fa' : '#71717a',
              }}
            >
              {tick}
            </span>
          </div>
        ))}
      </div>
    
      <p className="text-xs text-zinc-500 mt-3">
        拖动滑块观察矩阵分解效果。较低的秩意味着更多参数量节省，但重构误差更大
      </p>
    </div>
  );
}
