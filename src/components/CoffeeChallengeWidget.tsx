import React, { useState } from 'react';
import { Trophy, Edit2, Check, Sparkles } from 'lucide-react';
import { ChallengeGoal, Coffee } from '../types/coffee';

interface CoffeeChallengeWidgetProps {
  coffees: Coffee[];
  goal: ChallengeGoal;
  onUpdateGoal: (newTarget: number) => void;
}

export const CoffeeChallengeWidget: React.FC<CoffeeChallengeWidgetProps> = ({
  coffees,
  goal,
  onUpdateGoal,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [targetInput, setTargetInput] = useState(goal.targetCount.toString());

  // Count coffees tasted (has rating or has tasting logs or in 'brewed' shelf)
  const completedCount = coffees.filter(
    (c) =>
      c.shelfIds.includes('brewed') ||
      c.userRating > 0 ||
      c.tastingLogs.length > 0
  ).length;

  const percent = Math.min(100, Math.round((completedCount / (goal.targetCount || 1)) * 100));

  const handleSave = () => {
    const val = parseInt(targetInput, 10);
    if (!isNaN(val) && val > 0) {
      onUpdateGoal(val);
    }
    setIsEditing(false);
  };

  return (
    <div className="bg-white rounded-xl border border-[#E5DACD] p-4 shadow-xs">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-[#FAF1E4] rounded-lg text-[#C87D32]">
            <Trophy className="w-4 h-4" />
          </div>
          <div>
            <h4 className="font-serif text-sm font-bold text-[#2B1D14]">
              {goal.year} Coffee Tasting Challenge
            </h4>
            <p className="text-[11px] text-[#7A6757]">
              Track your exploration across beans and roasters
            </p>
          </div>
        </div>

        {isEditing ? (
          <div className="flex items-center gap-1">
            <input
              type="number"
              min="1"
              value={targetInput}
              onChange={(e) => setTargetInput(e.target.value)}
              className="w-14 px-1.5 py-0.5 text-xs border border-[#DACDC0] rounded font-mono"
            />
            <button
              onClick={handleSave}
              className="p-1 text-emerald-700 hover:bg-emerald-50 rounded"
              title="Save goal"
            >
              <Check className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          <button
            onClick={() => setIsEditing(true)}
            className="text-[11px] text-[#8C7A6D] hover:text-[#2B1D14] flex items-center gap-1"
          >
            <Edit2 className="w-3 h-3" />
            <span>Edit goal</span>
          </button>
        )}
      </div>

      {/* Progress Bar */}
      <div className="space-y-1.5 mt-3">
        <div className="flex items-center justify-between text-xs">
          <span className="font-medium text-[#4A3728]">
            <strong className="text-[#2B1D14] font-mono">{completedCount}</strong> of{' '}
            <strong className="text-[#2B1D14] font-mono">{goal.targetCount}</strong> coffees tasted
          </span>
          <span className="font-mono text-[#8C4F1A] font-bold">{percent}%</span>
        </div>

        <div className="w-full bg-[#EFE7DE] h-2 rounded-full overflow-hidden">
          <div
            className="h-full bg-[#C87D32] transition-all duration-500 rounded-full"
            style={{ width: `${percent}%` }}
          />
        </div>

        <div className="text-[11px] text-[#8C7A6D] flex items-center justify-between pt-0.5">
          <span>
            {completedCount >= goal.targetCount ? (
              <span className="text-emerald-700 font-semibold flex items-center gap-1">
                <Sparkles className="w-3 h-3" /> Goal Achieved! Cheers!
              </span>
            ) : (
              `${goal.targetCount - completedCount} more to reach your goal`
            )}
          </span>
          <span>{coffees.length} in library</span>
        </div>
      </div>
    </div>
  );
};
