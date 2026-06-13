import { useEffect, useState, useRef } from 'react';
import { formatNumber, formatPercentage, formatMSE } from '../utils/colorMap';
import type { StatsPanelProps } from '../types';

function AnimatedNumber({ value, format, duration = 500 }: { value: number; format: (v: number) => string; duration?: number }) {
  const [displayValue, setDisplayValue] = useState(value);
  const previousValue = useRef(value);
  const animationRef = useRef<number | null>(null);

  useEffect(() => {
    const startValue = previousValue.current;
    const endValue = value;
    const startTime = performance.now();

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      const easeProgress = 1 - Math.pow(1 - progress, 3);
      const currentValue = startValue + (endValue - startValue) * easeProgress;
      
      setDisplayValue(currentValue);
      
      if (progress < 1) {
        animationRef.current = requestAnimationFrame(animate);
      } else {
        previousValue.current = endValue;
      }
    };

    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }
    
    animationRef.current = requestAnimationFrame(animate);
    
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [value, duration]);

  return <span>{format(displayValue)}</span>;
}

interface StatCardProps {
  title: string;
  value: number;
  format: (v: number) => string;
  gradient: string;
  icon: string;
  suffix?: string;
}

function StatCard({ title, value, format, gradient, icon, suffix }: StatCardProps) {
  return (
    <div className="bg-zinc-800/50 backdrop-blur-sm rounded-2xl p-5 border border-zinc-700/50 hover:border-zinc-600/50 transition-all duration-300 group">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm text-zinc-400 mb-1">{title}</p>
          <p className="text-2xl font-bold font-mono text-white group-hover:text-zinc-100 transition-colors">
            <AnimatedNumber value={value} format={format} />
            {suffix && <span className="text-lg text-zinc-400 ml-1">{suffix}</span>}
          </p>
        </div>
        <div 
          className="w-12 h-12 rounded-xl flex items-center justify-center text-xl"
          style={{ background: gradient }}
        >
          {icon}
        </div>
      </div>
      
      <div className="mt-4 h-1 bg-zinc-700/50 rounded-full overflow-hidden">
        <div 
          className="h-full rounded-full transition-all duration-500"
          style={{ 
            width: `${Math.min(100, (value / (title.includes('节省') ? 1 : 10000)) * 100)}%`,
            background: gradient
          }}
        />
      </div>
    </div>
  );
}

export function StatsPanel({ originalParams, loraParams, savingRatio, mse, rank }: StatsPanelProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <StatCard
        title="原始参数量"
        value={originalParams}
        format={(v) => formatNumber(v, 0)}
        gradient="linear-gradient(135deg, #6366f1, #8b5cf6)"
        icon="📊"
      />
      
      <StatCard
        title="LoRA 参数量"
        value={loraParams}
        format={(v) => formatNumber(v, 0)}
        gradient="linear-gradient(135deg, #06b6d4, #3b82f6)"
        icon="🧩"
      />
      
      <StatCard
        title="参数量节省比例"
        value={savingRatio}
        format={(v) => formatPercentage(v, 1)}
        gradient="linear-gradient(135deg, #10b981, #059669)"
        icon="💾"
      />
      
      <StatCard
        title="重构误差 (MSE)"
        value={mse}
        format={(v) => formatMSE(v, 4)}
        gradient="linear-gradient(135deg, #f59e0b, #ef4444)"
        icon="📉"
      />
    </div>
  );
}
