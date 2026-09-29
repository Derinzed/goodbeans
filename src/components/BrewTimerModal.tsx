import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, RotateCcw, X, Check, Volume2, VolumeX, Sparkles } from 'lucide-react';
import { BrewRecipe, Coffee } from '../types/coffee';

interface BrewTimerModalProps {
  recipe: BrewRecipe;
  coffee: Coffee;
  onClose: () => void;
  onLogBrewSuccess?: (recipe: BrewRecipe) => void;
}

export const BrewTimerModal: React.FC<BrewTimerModalProps> = ({
  recipe,
  coffee,
  onClose,
  onLogBrewSuccess,
}) => {
  const [seconds, setSeconds] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [isCompleted, setIsCompleted] = useState(false);
  const audioContextRef = useRef<AudioContext | null>(null);

  // Play chime using Web Audio API (no external asset needed)
  const playChime = (freq = 587.33) => {
    if (!soundEnabled) return;
    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext ||
          (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      }
      const ctx = audioContextRef.current;
      if (ctx.state === 'suspended') {
        ctx.resume();
      }
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, ctx.currentTime);
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.8);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.8);
    } catch {
      // Audio not permitted or supported
    }
  };

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (isRunning) {
      interval = setInterval(() => {
        setSeconds((prev) => {
          const next = prev + 1;
          // Check step alerts
          recipe.steps.forEach((step) => {
            if (step.timeSeconds === next) {
              playChime(659.25); // E5 note chime
            }
          });
          if (next === recipe.totalTimeSeconds) {
            playChime(880); // A5 note completion
            setIsCompleted(true);
          }
          return next;
        });
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRunning, recipe.steps, recipe.totalTimeSeconds, soundEnabled]);

  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remainder = secs % 60;
    return `${mins.toString().padStart(2, '0')}:${remainder.toString().padStart(2, '0')}`;
  };

  // Find active step
  const sortedSteps = [...recipe.steps].sort((a, b) => a.timeSeconds - b.timeSeconds);
  let activeStepIndex = 0;
  for (let i = 0; i < sortedSteps.length; i++) {
    if (seconds >= sortedSteps[i].timeSeconds) {
      activeStepIndex = i;
    }
  }
  const currentStep = sortedSteps[activeStepIndex];
  const progressPercent = Math.min(100, (seconds / (recipe.totalTimeSeconds || 1)) * 100);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-[#FAF7F2] border border-[#E5DACD] w-full max-w-lg rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#E8DEC0]/40 bg-[#F3EBE1]">
          <div>
            <span className="text-xs uppercase tracking-wider font-semibold text-[#8C6D53]">
              Brew Session
            </span>
            <h3 className="font-serif text-lg font-bold text-[#2B1D14] truncate max-w-xs">
              {recipe.title}
            </h3>
            <p className="text-xs text-[#6B5A4E]">
              {coffee.name} · {coffee.roaster}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              title={soundEnabled ? 'Mute chimes' : 'Enable chimes'}
              className="p-2 text-[#7A6453] hover:text-[#2B1D14] transition-colors rounded-lg hover:bg-[#EAE0D3]"
            >
              {soundEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
            </button>
            <button
              onClick={onClose}
              className="p-2 text-[#7A6453] hover:text-[#2B1D14] transition-colors rounded-lg hover:bg-[#EAE0D3]"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Recipe Quick Specs Bar */}
        <div className="grid grid-cols-4 gap-2 px-6 py-3 bg-[#EFE7DC] border-b border-[#E2D5C5] text-center text-xs">
          <div>
            <div className="text-[10px] uppercase font-semibold text-[#7D6B5D]">Dose</div>
            <div className="font-mono font-bold text-[#2E1F14]">{recipe.doseGrams}g</div>
          </div>
          <div>
            <div className="text-[10px] uppercase font-semibold text-[#7D6B5D]">Water / Yield</div>
            <div className="font-mono font-bold text-[#2E1F14]">{recipe.waterGrams}g</div>
          </div>
          <div>
            <div className="text-[10px] uppercase font-semibold text-[#7D6B5D]">Ratio</div>
            <div className="font-mono font-bold text-[#2E1F14]">{recipe.ratio}</div>
          </div>
          <div>
            <div className="text-[10px] uppercase font-semibold text-[#7D6B5D]">Temp</div>
            <div className="font-mono font-bold text-[#2E1F14]">{recipe.waterTempC}°C</div>
          </div>
        </div>

        {/* Timer Core */}
        <div className="p-6 flex flex-col items-center justify-center bg-gradient-to-b from-[#FAF7F2] to-[#F5ECE1]">
          {/* Digital Timer Clock */}
          <div className="font-mono tabular-nums text-6xl md:text-7xl font-bold tracking-tight text-[#2B1D14] my-2 drop-shadow-sm">
            {formatTime(seconds)}
          </div>

          <div className="text-xs font-mono text-[#8C6D53]">
            Target: {formatTime(recipe.totalTimeSeconds)}
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-[#E8DDD1] h-2.5 rounded-full overflow-hidden mt-4 shadow-inner">
            <div
              className="h-full bg-[#C87D32] transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            />
          </div>

          {/* Controls */}
          <div className="flex items-center gap-4 mt-6">
            <button
              onClick={() => {
                setIsRunning(false);
                setSeconds(0);
                setIsCompleted(false);
              }}
              className="p-3 rounded-full text-[#6D594B] hover:text-[#2B1D14] hover:bg-[#EAE0D3] transition-colors"
              title="Reset"
            >
              <RotateCcw className="w-6 h-6" />
            </button>

            <button
              onClick={() => setIsRunning(!isRunning)}
              className="px-8 py-3.5 rounded-full bg-[#C87D32] hover:bg-[#B06B26] text-white font-semibold flex items-center gap-2 shadow-md hover:shadow-lg transition-all active:scale-95"
            >
              {isRunning ? (
                <>
                  <Pause className="w-5 h-5 fill-white" />
                  <span>Pause</span>
                </>
              ) : (
                <>
                  <Play className="w-5 h-5 fill-white" />
                  <span>{seconds === 0 ? 'Start Brew' : 'Resume'}</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Current Instruction Spotlight */}
        {currentStep && (
          <div className="px-6 py-4 bg-[#F2E8DC] border-t border-[#E5DACD]">
            <div className="flex items-center justify-between text-xs text-[#7A6757] font-semibold mb-1">
              <span>CURRENT STEP ({activeStepIndex + 1}/{sortedSteps.length})</span>
              {currentStep.waterAmountGrams && (
                <span className="font-mono text-[#9B551C] bg-[#E8DCB8] px-2 py-0.5 rounded">
                  Target: {currentStep.waterAmountGrams}g
                </span>
              )}
            </div>
            <div className="font-serif font-bold text-base text-[#2B1D14]">
              {currentStep.title}
            </div>
            <p className="text-xs text-[#524134] mt-0.5 leading-relaxed">
              {currentStep.instruction}
            </p>
          </div>
        )}

        {/* Custom Variables Reminder */}
        {recipe.customVariables && recipe.customVariables.length > 0 && (
          <div className="px-6 py-3 bg-[#FAF7F2] border-t border-[#E8DEC0]/40 overflow-y-auto max-h-32 text-xs">
            <div className="text-[10px] font-bold uppercase tracking-wider text-[#8C6D53] mb-1.5">
              Custom Variables For This Brew
            </div>
            <div className="grid grid-cols-2 gap-2">
              {recipe.customVariables.map((cv) => (
                <div key={cv.id} className="bg-white/80 p-1.5 rounded border border-[#E8DDD1]">
                  <span className="text-[#887464] block text-[10px]">{cv.label}:</span>
                  <span className="font-medium text-[#2C2117] font-mono">{cv.value}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Completion Action */}
        <div className="p-4 bg-[#F5ECE1] border-t border-[#E5DACD] flex items-center justify-between">
          <div className="text-xs text-[#6B5A4E]">
            {isCompleted ? (
              <span className="text-emerald-700 font-semibold flex items-center gap-1">
                <Sparkles className="w-4 h-4" /> Target extraction reached!
              </span>
            ) : (
              <span>Grind size: {recipe.grindSize}</span>
            )}
          </div>
          <button
            onClick={() => {
              if (onLogBrewSuccess) onLogBrewSuccess(recipe);
              onClose();
            }}
            className="px-4 py-2 bg-[#3D2E24] hover:bg-[#2B1D14] text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors"
          >
            <Check className="w-4 h-4" />
            Finish & Log Tasting
          </button>
        </div>
      </div>
    </div>
  );
};
