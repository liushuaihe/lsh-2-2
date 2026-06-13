import { useRef, useEffect, useState, useCallback } from 'react';
import { getColor, getMatrixBounds } from '../utils/colorMap';
import type { HeatmapProps } from '../types';

export function Heatmap({ data, colorScheme = 'warm' }: HeatmapProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [hoveredCell, setHoveredCell] = useState<{ row: number; col: number; value: number } | null>(null);
  const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 });

  const { min, max } = getMatrixBounds(data.data);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const containerWidth = container.clientWidth;
    const containerHeight = container.clientHeight;
    const size = Math.min(containerWidth, containerHeight);

    if (size !== canvasSize.width || size !== canvasSize.height) {
      setCanvasSize({ width: size, height: size });
    }

    const dpr = window.devicePixelRatio || 1;
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    canvas.style.width = `${size}px`;
    canvas.style.height = `${size}px`;
    ctx.scale(dpr, dpr);

    ctx.clearRect(0, 0, size, size);

    const cellWidth = size / data.cols;
    const cellHeight = size / data.rows;

    for (let row = 0; row < data.rows; row++) {
      for (let col = 0; col < data.cols; col++) {
        const value = data.data[row][col];
        const color = getColor(value, min, max, colorScheme);
        
        ctx.fillStyle = color;
        ctx.fillRect(
          col * cellWidth,
          row * cellHeight,
          cellWidth + 0.5,
          cellHeight + 0.5
        );
      }
    }

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
    ctx.lineWidth = 0.5;
    for (let i = 0; i <= data.rows; i++) {
      ctx.beginPath();
      ctx.moveTo(0, i * cellHeight);
      ctx.lineTo(size, i * cellHeight);
      ctx.stroke();
    }
    for (let j = 0; j <= data.cols; j++) {
      ctx.beginPath();
      ctx.moveTo(j * cellWidth, 0);
      ctx.lineTo(j * cellWidth, size);
      ctx.stroke();
    }
  }, [data, colorScheme, min, max, canvasSize]);

  useEffect(() => {
    draw();
    
    const handleResize = () => draw();
    window.addEventListener('resize', handleResize);
    
    return () => window.removeEventListener('resize', handleResize);
  }, [draw]);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const size = rect.width;
    
    const cellWidth = size / data.cols;
    const cellHeight = size / data.rows;
    
    const col = Math.floor(x / cellWidth);
    const row = Math.floor(y / cellHeight);
    
    if (row >= 0 && row < data.rows && col >= 0 && col < data.cols) {
      setHoveredCell({
        row,
        col,
        value: data.data[row][col]
      });
    } else {
      setHoveredCell(null);
    }
  }, [data]);

  const handleMouseLeave = useCallback(() => {
    setHoveredCell(null);
  }, []);

  return (
    <div ref={containerRef} className="relative w-full aspect-square">
      <canvas
        ref={canvasRef}
        className="rounded-lg cursor-crosshair"
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      />
      
      {hoveredCell && (
        <div
          className="absolute pointer-events-none bg-zinc-900/95 text-white text-xs px-2 py-1 rounded font-mono z-10 border border-zinc-700 shadow-lg"
          style={{
            left: `${(hoveredCell.col / data.cols) * 100 + 1}%`,
            top: `${(hoveredCell.row / data.rows) * 100 + 1}%`,
            transform: 'translateY(-110%)'
          }}
        >
          [{hoveredCell.row}, {hoveredCell.col}]: {hoveredCell.value.toFixed(4)}
        </div>
      )}
      
      <div className="absolute bottom-2 right-2 flex items-center gap-1">
        <div 
          className="w-3 h-3 rounded-sm" 
          style={{ background: getColor(min, min, max, colorScheme) }}
        />
        <span className="text-[10px] text-zinc-400 font-mono">{min.toFixed(2)}</span>
        <div 
          className="w-8 h-1.5 rounded"
          style={{
            background: `linear-gradient(to right, ${getColor(min, min, max, colorScheme)}, ${getColor((min + max) / 2, min, max, colorScheme)}, ${getColor(max, min, max, colorScheme)})`
          }}
        />
        <span className="text-[10px] text-zinc-400 font-mono">{max.toFixed(2)}</span>
        <div 
          className="w-3 h-3 rounded-sm" 
          style={{ background: getColor(max, min, max, colorScheme) }}
        />
      </div>
    </div>
  );
}
