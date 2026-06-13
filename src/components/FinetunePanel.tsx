import { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { Play, Pause, RotateCcw, Settings, Activity, TrendingDown } from 'lucide-react';
import type { FinetuneStep } from '../types';
import { formatMSE } from '../utils/colorMap';

interface FinetunePanelProps {
  steps: FinetuneStep[];
  currentStepIndex: number;
  isFinetuning: boolean;
  onStartFinetune: (steps: number, learningRate: number) => void;
  onStepChange: (index: number) => void;
  rank: number;
  alpha: number;
}

export function FinetunePanel({
  steps,
  currentStepIndex,
  isFinetuning,
  onStartFinetune,
  onStepChange,
  rank,
  alpha,
}: FinetunePanelProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [numSteps, setNumSteps] = useState(500);
  const [learningRate, setLearningRate] = useState(0.01);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(200);
  
  const animationTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isPlayingRef = useRef(false);

  isPlayingRef.current = isPlaying;

  const currentStep = steps[currentStepIndex];

  useEffect(() => {
    if (!isPlaying || steps.length === 0) {
      return;
    }

    const tick = () => {
      if (!isPlayingRef.current) return;
      
      if (currentStepIndex < steps.length - 1) {
        onStepChange(currentStepIndex + 1);
        animationTimerRef.current = setTimeout(tick, playbackSpeed);
      } else {
        setIsPlaying(false);
      }
    };

    animationTimerRef.current = setTimeout(tick, playbackSpeed);

    return () => {
      if (animationTimerRef.current) {
        clearTimeout(animationTimerRef.current);
      }
    };
  }, [isPlaying, currentStepIndex, steps.length, onStepChange, playbackSpeed]);

  const handlePlayPause = useCallback(() => {
    if (animationTimerRef.current) {
      clearTimeout(animationTimerRef.current);
      animationTimerRef.current = null;
    }
    
    if (currentStepIndex >= steps.length - 1) {
      onStepChange(0);
      setTimeout(() => setIsPlaying(true), 50);
    } else {
      setIsPlaying((prev) => !prev);
    }
  }, [currentStepIndex, steps.length, onStepChange]);

  const handleReset = useCallback(() => {
    setIsPlaying(false);
    if (animationTimerRef.current) {
      clearTimeout(animationTimerRef.current);
      animationTimerRef.current = null;
    }
    onStepChange(0);
  }, [onStepChange]);

  const handleStart = useCallback(() => {
    setIsPlaying(false);
    if (animationTimerRef.current) {
      clearTimeout(animationTimerRef.current);
      animationTimerRef.current = null;
    }
    onStartFinetune(numSteps, learningRate);
  }, [numSteps, learningRate, onStartFinetune]);

  const handleSliderChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const index = parseInt(e.target.value, 10);
    setIsPlaying(false);
    if (animationTimerRef.current) {
      clearTimeout(animationTimerRef.current);
      animationTimerRef.current = null;
    }
    onStepChange(index);
  }, [onStepChange]);

  const lossData = useMemo(() => steps.map(s => s.loss), [steps]);
  const stepNumbers = useMemo(() => steps.map(s => s.step), [steps]);

  const { minLoss, maxLoss } = useMemo(() => {
    if (lossData.length === 0) return { minLoss: 0, maxLoss: 1 };
    let min = Math.min(...lossData);
    let max = Math.max(...lossData);
    if (min === max) {
      min = min * 0.9;
      max = max * 1.1;
    }
    return { minLoss: min, maxLoss: max };
  }, [lossData]);

  const pathPoints = useMemo(() => {
    if (lossData.length <= 1) return '';
    return lossData.map((loss, i) => {
      const x = (i / (lossData.length - 1)) * 100;
      const y = 100 - ((loss - minLoss) / (maxLoss - minLoss)) * 100;
      return `${x.toFixed(2)}% ${y.toFixed(2)}%`;
    }).join(' ');
  }, [lossData, minLoss, maxLoss]);

  const currentPoint = useMemo(() => {
    if (lossData.length <= 1) return { x: 0, y: 100 };
    const x = (currentStepIndex / (lossData.length - 1)) * 100;
    const y = 100 - ((lossData[currentStepIndex] - minLoss) / (maxLoss - minLoss)) * 100;
    return { x, y };
  }, [lossData, currentStepIndex, minLoss, maxLoss]);

  return (
    <div className="bg-zinc-800/30 backdrop-blur-sm rounded-2xl border border-zinc-700/50 overflow-hidden">
      <div
        className="flex items-center justify-between p-6 hover:bg-zinc-700/20 transition-colors"
      >
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex-1 flex items-center gap-3 text-left cursor-pointer"
        >
          <Activity className="w-5 h-5 text-emerald-400 flex-shrink-0" />
          <div>
            <h2 className="text-xl font-semibold text-white">模拟 LoRA 微调</h2>
            <p className="text-sm text-zinc-400">
              观察矩阵在梯度下降过程中如何动态变化
              {steps.length > 0 && ` · 已完成 ${steps.length - 1} 步`}
            </p>
          </div>
        </button>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="p-1 hover:bg-zinc-700/50 rounded-lg transition-colors text-zinc-400"
        >
          {isExpanded ? '▲' : '▼'}
        </button>
      </div>

      {isExpanded && (
        <div className="border-t border-zinc-700/50 p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-zinc-900/50 rounded-xl p-4 border border-zinc-700/30">
              <label className="text-sm text-zinc-400 mb-2 block flex items-center gap-2">
                <Settings className="w-4 h-4" />
                训练步数
              </label>
              <input
                type="number"
                min={10}
                max={2000}
                step={10}
                value={numSteps}
                onChange={(e) => setNumSteps(Math.max(10, Math.min(2000, parseInt(e.target.value) || 100)))}
                className="w-full px-3 py-2 bg-zinc-800 border border-zinc-600 rounded-lg text-white font-mono focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div className="bg-zinc-900/50 rounded-xl p-4 border border-zinc-700/30">
              <label className="text-sm text-zinc-400 mb-2 block flex items-center gap-2">
                <Settings className="w-4 h-4" />
                学习率
              </label>
              <input
                type="number"
                min={0.001}
                max={0.5}
                step={0.001}
                value={learningRate}
                onChange={(e) => setLearningRate(Math.max(0.001, Math.min(0.5, parseFloat(e.target.value) || 0.01)))}
                className="w-full px-3 py-2 bg-zinc-800 border border-zinc-600 rounded-lg text-white font-mono focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div className="bg-zinc-900/50 rounded-xl p-4 border border-zinc-700/30">
              <label className="text-sm text-zinc-400 mb-2 block flex items-center gap-2">
                <Settings className="w-4 h-4" />
                播放速度
              </label>
              <select
                value={playbackSpeed}
                onChange={(e) => setPlaybackSpeed(parseInt(e.target.value))}
                className="w-full px-3 py-2 bg-zinc-800 border border-zinc-600 rounded-lg text-white font-mono focus:outline-none focus:border-emerald-500"
              >
                <option value={500}>慢 (0.5s)</option>
                <option value={200}>正常 (0.2s)</option>
                <option value={100}>快 (0.1s)</option>
                <option value={50}>极速 (0.05s)</option>
              </select>
            </div>

            <div className="bg-zinc-900/50 rounded-xl p-4 border border-zinc-700/30 flex flex-col justify-end">
              <button
                onClick={handleStart}
                disabled={isFinetuning}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:bg-zinc-700 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
              >
                {isFinetuning ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                    模拟中...
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4" />
                    开始模拟
                  </>
                )}
              </button>
            </div>
          </div>

          {steps.length > 0 && (
            <>
              <div className="bg-zinc-900/50 rounded-xl p-4 border border-zinc-700/30">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <TrendingDown className="w-4 h-4 text-emerald-400" />
                    <span className="text-sm text-zinc-400">损失曲线 (Loss Curve)</span>
                  </div>
                  <div className="flex items-center gap-4 text-xs">
                    <span className="text-zinc-500">
                      初始: <span className="text-zinc-300 font-mono">{formatMSE(steps[0].loss)}</span>
                    </span>
                    <span className="text-zinc-500">
                      最终: <span className="text-emerald-400 font-mono">{formatMSE(steps[steps.length - 1].loss)}</span>
                    </span>
                  </div>
                </div>

                <div className="relative h-28 bg-zinc-800 rounded-lg overflow-hidden">
                  <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                    <defs>
                      <linearGradient id="lossGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stopColor="#10b981" stopOpacity="0.4" />
                        <stop offset="100%" stopColor="#10b981" stopOpacity="0.05" />
                      </linearGradient>
                    </defs>
                    
                    {[0.25, 0.5, 0.75].map((p, i) => (
                      <line
                        key={i}
                        x1="0"
                        y1={p * 100}
                        x2="100"
                        y2={p * 100}
                        stroke="#3f3f46"
                        strokeWidth="0.2"
                        strokeDasharray="1,1"
                      />
                    ))}
                    
                    {lossData.length > 1 && (
                      <>
                        <path
                          d={`M 0 ${100 - ((lossData[0] - minLoss) / (maxLoss - minLoss)) * 100} L ${pathPoints} L 100 100 L 0 100 Z`}
                          fill="url(#lossGradient)"
                        />
                        <polyline
                          points={pathPoints}
                          fill="none"
                          stroke="#10b981"
                          strokeWidth="0.8"
                          vectorEffect="non-scaling-stroke"
                        />
                        <circle
                          cx={currentPoint.x}
                          cy={currentPoint.y}
                          r="2.5"
                          fill="#fbbf24"
                          stroke="#fff"
                          strokeWidth="0.5"
                          vectorEffect="non-scaling-stroke"
                        />
                      </>
                    )}
                  </svg>

                  <div className="absolute left-2 top-0 bottom-0 flex flex-col justify-between py-1 pointer-events-none">
                    <span className="text-[9px] text-zinc-500 font-mono">{maxLoss.toExponential(1)}</span>
                    <span className="text-[9px] text-zinc-500 font-mono">{((minLoss + maxLoss) / 2).toExponential(1)}</span>
                    <span className="text-[9px] text-zinc-500 font-mono">{minLoss.toExponential(1)}</span>
                  </div>

                  <div className="absolute bottom-0 left-6 right-2 flex justify-between pointer-events-none">
                    <span className="text-[9px] text-zinc-500 font-mono">Step {stepNumbers[0]}</span>
                    <span className="text-[9px] text-zinc-500 font-mono">Step {stepNumbers[stepNumbers.length - 1]}</span>
                  </div>
                </div>
              </div>

              <div className="bg-zinc-900/50 rounded-xl p-4 border border-zinc-700/30">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={handlePlayPause}
                      disabled={steps.length === 0}
                      className="w-10 h-10 flex items-center justify-center bg-emerald-600 hover:bg-emerald-500 disabled:bg-zinc-700 disabled:cursor-not-allowed text-white rounded-full transition-colors"
                    >
                      {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
                    </button>
                    <button
                      onClick={handleReset}
                      disabled={steps.length === 0}
                      className="w-10 h-10 flex items-center justify-center bg-zinc-700 hover:bg-zinc-600 disabled:bg-zinc-800 disabled:cursor-not-allowed text-white rounded-full transition-colors"
                    >
                      <RotateCcw className="w-5 h-5" />
                    </button>
                    <div>
                      <div className="text-white font-medium">
                        Step {currentStep?.step ?? 0} / {steps[steps.length - 1]?.step ?? 0}
                      </div>
                      <div className="text-xs text-zinc-500">
                        Loss: {currentStep ? formatMSE(currentStep.loss) : '-'}
                      </div>
                    </div>
                  </div>
                  {currentStep && (
                    <div className="flex items-center gap-4 text-xs">
                      <div className="text-right">
                        <div className="text-zinc-500">||grad_A||</div>
                        <div className="text-zinc-300 font-mono">{currentStep.gradNormA.toFixed(6)}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-zinc-500">||grad_B||</div>
                        <div className="text-zinc-300 font-mono">{currentStep.gradNormB.toFixed(6)}</div>
                      </div>
                    </div>
                  )}
                </div>

                <input
                  type="range"
                  min={0}
                  max={steps.length - 1}
                  value={currentStepIndex}
                  onChange={handleSliderChange}
                  className="w-full h-2 bg-zinc-700 rounded-full appearance-none cursor-pointer accent-emerald-500"
                />
                <div className="flex justify-between mt-1 text-xs text-zinc-600">
                  <span>Step 0</span>
                  <span>Step {steps[steps.length - 1]?.step ?? 0}</span>
                </div>
              </div>

              <div className="p-4 bg-emerald-900/20 border border-emerald-500/30 rounded-xl">
                <h3 className="text-md font-medium text-emerald-300 mb-2">💡 微调过程说明</h3>
                <div className="text-zinc-300 text-sm leading-relaxed space-y-1">
                  <p><strong>前向传播：</strong>W' = W₀ + α × (B × A)，其中 W₀ 固定，只训练 A 和 B</p>
                  <p><strong>反向传播：</strong>计算损失对 A 和 B 的梯度，使用梯度下降更新</p>
                  <p><strong>Alpha 的作用：</strong>α/r 作为缩放因子，控制低秩更新的幅度，防止小秩 r 时更新过小</p>
                </div>
              </div>
            </>
          )}

          {steps.length === 0 && !isFinetuning && (
            <div className="p-8 text-center">
              <Activity className="w-12 h-12 text-zinc-600 mx-auto mb-3" />
              <p className="text-zinc-500">配置参数后点击"开始模拟"按钮</p>
              <p className="text-zinc-600 text-sm mt-1">
                将模拟梯度下降过程，观察矩阵 A、B、ΔW 和 W' 如何动态变化
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
