import { RefreshCw } from 'lucide-react';
import { MatrixCard } from '../components/MatrixCard';
import { RankSlider } from '../components/RankSlider';
import { StatsPanel } from '../components/StatsPanel';
import { useLora } from '../hooks/useLora';

export default function Home() {
  const {
    rank,
    isLoading,
    error,
    matrixW,
    matrixA,
    matrixB,
    stats,
    setRank,
    generateMatrix,
  } = useLora();

  const handleRefresh = () => {
    const newSeed = Math.floor(Math.random() * 10000);
    generateMatrix(64, 64, newSeed);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-950">
      <div className="fixed inset-0 bg-[linear-gradient(rgba(59,130,246,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(59,130,246,0.03)_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none" />
      
      <div className="relative z-10 max-w-7xl mx-auto px-4 py-8">
        <header className="text-center mb-10">
          <h1 className="text-4xl md:text-5xl font-bold mb-3 bg-gradient-to-r from-blue-400 via-cyan-400 to-purple-400 bg-clip-text text-transparent">
            LoRA 微调机制教学沙盒
          </h1>
          <p className="text-zinc-400 text-lg max-w-2xl mx-auto">
            通过交互式可视化理解低秩适配（Low-Rank Adaptation）的核心原理
          </p>
        </header>

        {error && (
          <div className="mb-6 p-4 bg-red-900/30 border border-red-500/30 rounded-xl text-red-300 text-center">
            {error}
          </div>
        )}

        <div className="bg-zinc-800/30 backdrop-blur-sm rounded-2xl p-6 mb-8 border border-zinc-700/50">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-semibold text-white mb-1">矩阵分解可视化</h2>
              <p className="text-sm text-zinc-400">
                W' ≈ B × A，其中 W' 是低秩近似，B 是 r×m 矩阵，A 是 r×n 矩阵
              </p>
            </div>
            <button
              onClick={handleRefresh}
              disabled={isLoading}
              className="flex items-center gap-2 px-4 py-2 bg-zinc-700/50 hover:bg-zinc-700 text-white rounded-lg border border-zinc-600 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
              重新生成矩阵
            </button>
          </div>

          {isLoading && !matrixW && (
            <div className="flex items-center justify-center py-20">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500" />
            </div>
          )}

          {matrixW && matrixA && matrixB && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <MatrixCard
                data={matrixW}
                title="原始矩阵 W"
                subtitle="m × n 维参数矩阵"
                colorScheme="warm"
              />
              
              <MatrixCard
                data={matrixB}
                title={`矩阵 B (r=${rank})`}
                subtitle={`${matrixB.rows} × ${matrixB.cols} 左奇异矩阵`}
                colorScheme="cool"
              />
              
              <MatrixCard
                data={matrixA}
                title={`矩阵 A (r=${rank})`}
                subtitle={`${matrixA.rows} × ${matrixA.cols} 右奇异矩阵`}
                colorScheme="viridis"
              />
            </div>
          )}
        </div>

        <div className="bg-zinc-800/30 backdrop-blur-sm rounded-2xl p-6 mb-8 border border-zinc-700/50">
          <h2 className="text-xl font-semibold text-white mb-6">秩 (Rank) 控制</h2>
          <div className="max-w-2xl mx-auto">
            <RankSlider
              value={rank}
              min={1}
              max={64}
              onChange={setRank}
              disabled={isLoading}
            />
          </div>
        </div>

        {stats && (
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-white mb-6">实时统计</h2>
            <StatsPanel
              originalParams={stats.originalParams}
              loraParams={stats.loraParams}
              savingRatio={stats.savingRatio}
              mse={stats.mse}
              rank={rank}
            />
          </div>
        )}

        <div className="bg-zinc-800/30 backdrop-blur-sm rounded-2xl p-6 border border-zinc-700/50">
          <h2 className="text-xl font-semibold text-white mb-4">LoRA 原理简介</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-medium text-blue-400 mb-2">核心思想</h3>
              <p className="text-zinc-300 leading-relaxed">
                LoRA（Low-Rank Adaptation）通过对大模型的权重矩阵进行低秩分解来实现高效微调。
                与其直接更新整个 m×n 的权重矩阵 W，我们更新两个小矩阵 B (r×m) 和 A (r×n)，
                其中 r ≪ min(m,n)。这样可以大幅减少需要训练的参数量。
              </p>
            </div>
            <div>
              <h3 className="text-lg font-medium text-cyan-400 mb-2">数学公式</h3>
              <div className="bg-zinc-900/50 rounded-xl p-4 font-mono text-zinc-200">
                <p className="mb-2">前向传播时：</p>
                <p className="text-center text-lg">W' = W₀ + B × A</p>
                <p className="mt-4 text-sm text-zinc-400">
                  其中 W₀ 是预训练权重，B 和 A 是可训练的低秩矩阵
                </p>
              </div>
            </div>
          </div>
          
          <div className="mt-6 p-4 bg-blue-900/20 border border-blue-500/30 rounded-xl">
            <h3 className="text-md font-medium text-blue-300 mb-2">💡 权衡关系</h3>
            <p className="text-zinc-300 text-sm leading-relaxed">
              <strong>秩 r 越小</strong>：参数量节省越多 → 训练速度越快、内存占用越小 → 但重构误差越大，模型表达能力受限<br />
              <strong>秩 r 越大</strong>：重构误差越小，模型表达能力越强 → 但参数量节省减少，训练成本增加
            </p>
          </div>
        </div>

        <footer className="mt-10 text-center text-zinc-500 text-sm">
          <p>LoRA 微调机制教学沙盒 · 交互式可视化学习工具</p>
        </footer>
      </div>
    </div>
  );
}
