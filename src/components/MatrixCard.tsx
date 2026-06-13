import { Heatmap } from './Heatmap';
import type { MatrixCardProps } from '../types';

export function MatrixCard({ data, title, subtitle, colorScheme = 'warm' }: MatrixCardProps) {
  return (
    <div className="bg-zinc-800/50 backdrop-blur-sm rounded-2xl p-5 border border-zinc-700/50 hover:border-blue-500/30 transition-all duration-300 hover:shadow-lg hover:shadow-blue-500/5 group">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-white group-hover:text-blue-400 transition-colors">
            {title}
          </h3>
          {subtitle && (
            <p className="text-sm text-zinc-400 mt-0.5">{subtitle}</p>
          )}
        </div>
        <div className="bg-zinc-900/80 px-3 py-1.5 rounded-lg border border-zinc-700">
          <span className="text-sm font-mono text-blue-400">
            {data.rows} × {data.cols}
          </span>
        </div>
      </div>
      
      <div className="bg-zinc-900/50 rounded-xl p-3 border border-zinc-700/30">
        <Heatmap data={data} title={title} colorScheme={colorScheme} />
      </div>
    </div>
  );
}
