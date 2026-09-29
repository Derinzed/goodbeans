import React, { useState } from 'react';
import { X, Plus, Trash2, Sliders, Clock, Thermometer, Scale, Sparkles } from 'lucide-react';
import { BrewRecipe, BrewMethod, CustomVariable, RecipeStep, Equipment } from '../types/coffee';
import { METHOD_DEFAULTS } from '../data/initialData';

interface RecipeModalProps {
  coffeeId: string;
  coffeeName: string;
  initialRecipe?: BrewRecipe | null;
  equipmentList: Equipment[];
  onSave: (recipe: BrewRecipe) => void;
  onClose: () => void;
}

const COMMON_CUSTOM_SUGGESTIONS = [
  'Pre-infusion Profile',
  'Water Chemistry / TDS',
  'Filter Paper Type',
  'Agitation / Swirl Technique',
  'Puck Preparation',
  'Bypass Water (Americano/Iced)',
  'Pressure Decline Profile',
  'Resting Days Recommendation',
  'Flow Rate (g/sec)',
];

export const RecipeModal: React.FC<RecipeModalProps> = ({
  coffeeId,
  coffeeName,
  initialRecipe,
  equipmentList,
  onSave,
  onClose,
}) => {
  const isEditing = Boolean(initialRecipe);

  const [method, setMethod] = useState<BrewMethod>(initialRecipe?.method || 'v60');
  const [title, setTitle] = useState(
    initialRecipe?.title || `${METHOD_DEFAULTS[initialRecipe?.method || 'v60'].name} Recipe`
  );
  const [doseGrams, setDoseGrams] = useState<number>(
    initialRecipe?.doseGrams ?? METHOD_DEFAULTS[method].doseGrams
  );
  const [waterGrams, setWaterGrams] = useState<number>(
    initialRecipe?.waterGrams ?? METHOD_DEFAULTS[method].waterGrams
  );
  const [grindSize, setGrindSize] = useState<string>(
    initialRecipe?.grindSize || METHOD_DEFAULTS[method].grindSize
  );
  const [waterTempC, setWaterTempC] = useState<number>(
    initialRecipe?.waterTempC ?? METHOD_DEFAULTS[method].waterTempC
  );
  const [totalTimeSeconds, setTotalTimeSeconds] = useState<number>(
    initialRecipe?.totalTimeSeconds ?? METHOD_DEFAULTS[method].totalTimeSeconds
  );
  const [bloomGrams, setBloomGrams] = useState<number | undefined>(
    initialRecipe?.bloomGrams ?? METHOD_DEFAULTS[method].bloomGrams
  );
  const [bloomTimeSeconds, setBloomTimeSeconds] = useState<number | undefined>(
    initialRecipe?.bloomTimeSeconds ?? METHOD_DEFAULTS[method].bloomTimeSeconds
  );
  const [selectedEquipmentIds, setSelectedEquipmentIds] = useState<string[]>(
    initialRecipe?.equipmentIds || []
  );
  const [notes, setNotes] = useState(initialRecipe?.notes || '');

  // Custom variables array: empty to start when adding a new recipe
  const [customVariables, setCustomVariables] = useState<CustomVariable[]>(
    initialRecipe?.customVariables || []
  );

  // Steps array: empty to start when adding a new recipe
  const [steps, setSteps] = useState<RecipeStep[]>(
    initialRecipe?.steps || []
  );

  // Quick state for new custom variable form
  const [newVarLabel, setNewVarLabel] = useState('');
  const [newVarValue, setNewVarValue] = useState('');

  // Auto calculate ratio
  const ratio = doseGrams > 0 ? `1:${(waterGrams / doseGrams).toFixed(1)}` : '1:16.7';

  // Handle changing brew method: updates defaults for core parameters, leaving custom variables and steps as chosen
  const handleMethodChange = (newMethod: BrewMethod) => {
    setMethod(newMethod);
    const defaults = METHOD_DEFAULTS[newMethod];
    if (!isEditing) {
      setTitle(`${defaults.name} Recipe`);
      setDoseGrams(defaults.doseGrams);
      setWaterGrams(defaults.waterGrams);
      setGrindSize(defaults.grindSize);
      setWaterTempC(defaults.waterTempC);
      setTotalTimeSeconds(defaults.totalTimeSeconds);
      setBloomGrams(defaults.bloomGrams);
      setBloomTimeSeconds(defaults.bloomTimeSeconds);
    }
  };

  const handleAddCustomVariable = (label: string, value: string) => {
    if (!label.trim()) return;
    setCustomVariables([
      ...customVariables,
      {
        id: `cv-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        label: label.trim(),
        value: value.trim() || 'Custom setting',
      },
    ]);
    setNewVarLabel('');
    setNewVarValue('');
  };

  const handleRemoveCustomVariable = (id: string) => {
    setCustomVariables(customVariables.filter((cv) => cv.id !== id));
  };

  const handleUpdateCustomVariable = (id: string, field: 'label' | 'value', text: string) => {
    setCustomVariables(
      customVariables.map((cv) => (cv.id === id ? { ...cv, [field]: text } : cv))
    );
  };

  const handleAddStep = () => {
    const lastStep = steps[steps.length - 1];
    const newTime = lastStep ? lastStep.timeSeconds + 30 : 0;
    setSteps([
      ...steps,
      {
        id: `st-${Date.now()}`,
        timeSeconds: newTime,
        title: `Step ${steps.length + 1}`,
        instruction: 'Pour in circular motion',
      },
    ]);
  };

  const handleRemoveStep = (id: string) => {
    setSteps(steps.filter((s) => s.id !== id));
  };

  const handleUpdateStep = (id: string, field: keyof RecipeStep, val: unknown) => {
    setSteps(
      steps.map((st) => (st.id === id ? { ...st, [field]: val } : st))
    );
  };

  const toggleEquipment = (id: string) => {
    if (selectedEquipmentIds.includes(id)) {
      setSelectedEquipmentIds(selectedEquipmentIds.filter((eqId) => eqId !== id));
    } else {
      setSelectedEquipmentIds([...selectedEquipmentIds, id]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const recipeData: BrewRecipe = {
      id: initialRecipe?.id || `rec-${Date.now()}`,
      coffeeId,
      title: title.trim() || `${METHOD_DEFAULTS[method].name} Recipe`,
      method,
      doseGrams: Number(doseGrams) || 15,
      waterGrams: Number(waterGrams) || 250,
      ratio,
      grindSize: grindSize.trim() || 'Medium',
      waterTempC: Number(waterTempC) || 93,
      totalTimeSeconds: Number(totalTimeSeconds) || 180,
      bloomGrams: bloomGrams ? Number(bloomGrams) : undefined,
      bloomTimeSeconds: bloomTimeSeconds ? Number(bloomTimeSeconds) : undefined,
      equipmentIds: selectedEquipmentIds,
      customVariables,
      steps,
      notes: notes.trim(),
      isRecommended: initialRecipe?.isRecommended ?? true,
      createdAt: initialRecipe?.createdAt || new Date().toISOString().split('T')[0],
    };

    onSave(recipeData);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
      <div className="bg-[#FAF7F2] border border-[#E5DACD] w-full max-w-2xl rounded-xl shadow-2xl overflow-hidden my-8 animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-[#F3ECE2] border-b border-[#E8DEC0]/50">
          <div>
            <div className="text-[10px] uppercase font-bold tracking-wider text-[#8A6D56]">
              Recipe Dial-In
            </div>
            <h2 className="font-serif text-xl font-bold text-[#2B1D14]">
              {isEditing ? 'Edit Brew Recipe' : 'Add New Brew Recipe'}
            </h2>
            <p className="text-xs text-[#6B5A4E]">For {coffeeName}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-[#7A6453] hover:text-[#2B1D14] rounded-lg hover:bg-[#EAE0D3] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
          {/* Method Selection */}
          <div>
            <label className="block text-xs font-semibold text-[#5B473A] uppercase tracking-wider mb-2">
              Brew Method
            </label>
            <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
              {(Object.keys(METHOD_DEFAULTS) as BrewMethod[]).map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => handleMethodChange(m)}
                  className={`px-2.5 py-2 rounded-lg text-xs font-medium text-center border transition-all ${
                    method === m
                      ? 'bg-[#3A2A1E] text-white border-[#3A2A1E] shadow-sm'
                      : 'bg-white/80 hover:bg-white text-[#523F32] border-[#E0D5C7]'
                  }`}
                >
                  {METHOD_DEFAULTS[m].name}
                </button>
              ))}
            </div>
          </div>

          {/* Recipe Title */}
          <div>
            <label className="block text-xs font-semibold text-[#5B473A] uppercase tracking-wider mb-1">
              Recipe Name
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Hoffman One-Pour V60 or Turbo Shot 1:2.5"
              className="w-full px-3 py-2 bg-white rounded-lg border border-[#DACDC0] text-sm text-[#2C2118] focus:outline-none focus:ring-2 focus:ring-[#C87D32]/40"
              required
            />
          </div>

          {/* Common Default Variables (Dose, Water, Ratio, Grind, Temp, Time) */}
          <div className="p-4 bg-[#F2E8DC] rounded-xl border border-[#E5DACD] space-y-4">
            <div className="flex items-center gap-2 text-xs font-bold text-[#6D5441] uppercase tracking-wider">
              <Scale className="w-4 h-4 text-[#C87D32]" />
              <span>Standard Brew Parameters</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs text-[#6B5749] mb-1">Coffee Dose (g)</label>
                <input
                  type="number"
                  step="0.1"
                  min="1"
                  value={doseGrams}
                  onChange={(e) => setDoseGrams(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-1.5 bg-white rounded-md border border-[#D5C7B8] text-sm font-mono font-medium text-[#2C2017]"
                  required
                />
              </div>

              <div>
                <label className="block text-xs text-[#6B5749] mb-1">Water / Yield (g)</label>
                <input
                  type="number"
                  step="1"
                  min="5"
                  value={waterGrams}
                  onChange={(e) => setWaterGrams(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-1.5 bg-white rounded-md border border-[#D5C7B8] text-sm font-mono font-medium text-[#2C2017]"
                  required
                />
              </div>

              <div>
                <label className="block text-xs text-[#6B5749] mb-1">Calculated Ratio</label>
                <div className="px-3 py-1.5 bg-[#E8DDD0] rounded-md border border-[#D5C7B8] text-sm font-mono font-bold text-[#3B291D]">
                  {ratio}
                </div>
              </div>

              <div>
                <label className="block text-xs text-[#6B5749] mb-1 flex items-center gap-1">
                  <Thermometer className="w-3.5 h-3.5 text-[#C87D32]" />
                  <span>Water Temp (°C)</span>
                </label>
                <input
                  type="number"
                  step="1"
                  min="10"
                  max="100"
                  value={waterTempC}
                  onChange={(e) => setWaterTempC(parseInt(e.target.value) || 93)}
                  className="w-full px-3 py-1.5 bg-white rounded-md border border-[#D5C7B8] text-sm font-mono font-medium text-[#2C2017]"
                />
              </div>

              <div>
                <label className="block text-xs text-[#6B5749] mb-1 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-[#C87D32]" />
                  <span>Target Time (sec)</span>
                </label>
                <input
                  type="number"
                  step="5"
                  min="10"
                  value={totalTimeSeconds}
                  onChange={(e) => setTotalTimeSeconds(parseInt(e.target.value) || 180)}
                  className="w-full px-3 py-1.5 bg-white rounded-md border border-[#D5C7B8] text-sm font-mono font-medium text-[#2C2017]"
                />
              </div>

              <div>
                <label className="block text-xs text-[#6B5749] mb-1">Grind Size</label>
                <input
                  type="text"
                  value={grindSize}
                  onChange={(e) => setGrindSize(e.target.value)}
                  placeholder="e.g. Medium-Fine (22 clicks)"
                  className="w-full px-3 py-1.5 bg-white rounded-md border border-[#D5C7B8] text-sm text-[#2C2017]"
                />
              </div>
            </div>

            {/* Bloom parameters if applicable */}
            {method !== 'espresso' && method !== 'cold-brew' && (
              <div className="grid grid-cols-2 gap-3 pt-2 border-t border-[#DECFC0]">
                <div>
                  <label className="block text-xs text-[#6B5749] mb-1">Bloom Water (g)</label>
                  <input
                    type="number"
                    step="5"
                    value={bloomGrams ?? ''}
                    onChange={(e) =>
                      setBloomGrams(e.target.value ? parseFloat(e.target.value) : undefined)
                    }
                    placeholder="e.g. 45"
                    className="w-full px-3 py-1.5 bg-white rounded-md border border-[#D5C7B8] text-sm font-mono text-[#2C2017]"
                  />
                </div>
                <div>
                  <label className="block text-xs text-[#6B5749] mb-1">Bloom Time (sec)</label>
                  <input
                    type="number"
                    step="5"
                    value={bloomTimeSeconds ?? ''}
                    onChange={(e) =>
                      setBloomTimeSeconds(e.target.value ? parseInt(e.target.value) : undefined)
                    }
                    placeholder="e.g. 40"
                    className="w-full px-3 py-1.5 bg-white rounded-md border border-[#D5C7B8] text-sm font-mono text-[#2C2017]"
                  />
                </div>
              </div>
            )}
          </div>

          {/* CRITICAL SECTION: CUSTOM VARIABLES */}
          <div className="p-4 bg-white/90 rounded-xl border border-[#E0D5C7] space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sliders className="w-4 h-4 text-[#C87D32]" />
                <span className="text-xs font-bold text-[#553E2F] uppercase tracking-wider">
                  Custom Variables
                </span>
              </div>
              <span className="text-[11px] text-[#7D6B5D]">
                Add any unique parameter for this brew
              </span>
            </div>

            {/* Suggestions Chips */}
            <div className="flex flex-wrap items-center gap-1.5 pt-1">
              <span className="text-[10px] text-[#8C7A6D] uppercase font-semibold">
                Quick Add:
              </span>
              {COMMON_CUSTOM_SUGGESTIONS.map((sug) => (
                <button
                  key={sug}
                  type="button"
                  onClick={() => handleAddCustomVariable(sug, '')}
                  className="text-[11px] px-2 py-0.5 rounded bg-[#F2E9DE] hover:bg-[#E8DCCF] text-[#4A392D] transition-colors border border-[#E2D5C7]"
                >
                  + {sug}
                </button>
              ))}
            </div>

            {/* Existing Custom Variables list */}
            {customVariables.length > 0 ? (
              <div className="space-y-2 pt-2">
                {customVariables.map((cv) => (
                  <div
                    key={cv.id}
                    className="flex items-center gap-2 p-2 bg-[#FAF7F2] rounded-lg border border-[#E5DACD]"
                  >
                    <input
                      type="text"
                      value={cv.label}
                      onChange={(e) => handleUpdateCustomVariable(cv.id, 'label', e.target.value)}
                      placeholder="Variable Name (e.g. Pre-infusion)"
                      className="w-1/3 px-2 py-1 bg-white rounded border border-[#D5C7B8] text-xs font-semibold text-[#3B291D]"
                    />
                    <input
                      type="text"
                      value={cv.value}
                      onChange={(e) => handleUpdateCustomVariable(cv.id, 'value', e.target.value)}
                      placeholder="Value (e.g. 6s @ 3 bar, Lotus Drops 85ppm)"
                      className="flex-1 px-2 py-1 bg-white rounded border border-[#D5C7B8] text-xs text-[#2C2017]"
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveCustomVariable(cv.id)}
                      className="p-1 text-[#9E8B7D] hover:text-red-700 transition-colors"
                      title="Remove Variable"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-2.5 px-3 text-center bg-[#FAF7F2] rounded-lg border border-dashed border-[#DACDC0] space-y-1.5">
                <p className="text-xs text-[#8C7A6D] italic">
                  No custom variables added yet. Add one below or use the quick-add chips above if desired.
                </p>
                {METHOD_DEFAULTS[method].defaultCustomVariables.length > 0 && (
                  <button
                    type="button"
                    onClick={() =>
                      setCustomVariables(
                        METHOD_DEFAULTS[method].defaultCustomVariables.map((cv, idx) => ({
                          id: `cv-load-${Date.now()}-${idx}`,
                          label: cv.label,
                          value: cv.value,
                        }))
                      )
                    }
                    className="text-[11px] px-2.5 py-0.5 rounded bg-[#F2E9DE] hover:bg-[#E8DCCF] text-[#4A392D] transition-colors border border-[#E2D5C7] font-medium"
                  >
                    + Load {METHOD_DEFAULTS[method].name} Default Variables
                  </button>
                )}
              </div>
            )}

            {/* Add Custom Variable Row */}
            <div className="flex items-center gap-2 pt-2 border-t border-[#EAE0D3]">
              <input
                type="text"
                value={newVarLabel}
                onChange={(e) => setNewVarLabel(e.target.value)}
                placeholder="New variable (e.g. Agitation Swirl)"
                className="w-1/3 px-2.5 py-1.5 bg-white rounded-md border border-[#D5C7B8] text-xs text-[#2C2017]"
              />
              <input
                type="text"
                value={newVarValue}
                onChange={(e) => setNewVarValue(e.target.value)}
                placeholder="Value (e.g. Gentle swirl after bloom)"
                className="flex-1 px-2.5 py-1.5 bg-white rounded-md border border-[#D5C7B8] text-xs text-[#2C2017]"
              />
              <button
                type="button"
                onClick={() => handleAddCustomVariable(newVarLabel, newVarValue)}
                className="px-3 py-1.5 bg-[#4A392D] hover:bg-[#34261C] text-white text-xs font-semibold rounded-md flex items-center gap-1 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                Add
              </button>
            </div>
          </div>

          {/* Linked Equipment from Equipment Shelf */}
          {equipmentList.length > 0 && (
            <div>
              <label className="block text-xs font-semibold text-[#5B473A] uppercase tracking-wider mb-1.5">
                Gear Used (From your Equipment Shelf)
              </label>
              <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto p-1 bg-[#F5ECE1] rounded-lg border border-[#E5DACD]">
                {equipmentList.map((eq) => {
                  const isSelected = selectedEquipmentIds.includes(eq.id);
                  return (
                    <button
                      key={eq.id}
                      type="button"
                      onClick={() => toggleEquipment(eq.id)}
                      className={`text-xs px-2.5 py-1 rounded-md transition-all border ${
                        isSelected
                          ? 'bg-[#4A3728] text-white border-[#4A3728] font-medium shadow-sm'
                          : 'bg-white text-[#523F32] border-[#DACDC0] hover:bg-[#FAF7F2]'
                      }`}
                    >
                      {eq.name}
                      <span className="text-[10px] ml-1 opacity-70">({eq.category})</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Step Timeline Editor */}
          <div className="p-4 bg-[#F5ECE1] rounded-xl border border-[#E5DACD] space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-[#553E2F] uppercase tracking-wider block">
                  Brew Steps Timeline
                </span>
                <span className="text-[11px] text-[#7D6B5D]">
                  Timed steps for guided timer brewing (optional)
                </span>
              </div>
              <button
                type="button"
                onClick={handleAddStep}
                className="text-xs text-[#8C4F1A] hover:text-[#5E320E] font-semibold flex items-center gap-1 px-2.5 py-1 bg-white rounded-md border border-[#D5C7B8] shadow-xs transition-colors"
              >
                <Plus className="w-3.5 h-3.5" /> Add Step
              </button>
            </div>

            {steps.length > 0 ? (
              <div className="space-y-2">
                {steps.map((st, idx) => (
                  <div
                    key={st.id}
                    className="flex items-center gap-2 p-2 bg-white rounded-lg border border-[#DECFC0]"
                  >
                    <span className="text-xs font-mono font-bold text-[#8C4F1A] w-5 text-center">
                      {idx + 1}
                    </span>
                    <div className="w-20">
                      <input
                        type="number"
                        step="5"
                        min="0"
                        value={st.timeSeconds}
                        onChange={(e) =>
                          handleUpdateStep(st.id, 'timeSeconds', parseInt(e.target.value) || 0)
                        }
                        className="w-full px-2 py-1 bg-[#FAF7F2] rounded border border-[#D5C7B8] text-xs font-mono"
                        title="Time in seconds"
                      />
                      <span className="text-[9px] text-[#8C7A6D] block text-center">sec</span>
                    </div>
                    <input
                      type="text"
                      value={st.title}
                      onChange={(e) => handleUpdateStep(st.id, 'title', e.target.value)}
                      placeholder="Step title"
                      className="w-28 px-2 py-1 bg-[#FAF7F2] rounded border border-[#D5C7B8] text-xs font-medium"
                    />
                    <input
                      type="text"
                      value={st.instruction}
                      onChange={(e) => handleUpdateStep(st.id, 'instruction', e.target.value)}
                      placeholder="Instructions..."
                      className="flex-1 px-2 py-1 bg-[#FAF7F2] rounded border border-[#D5C7B8] text-xs"
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveStep(st.id)}
                      className="p-1 text-[#9E8B7D] hover:text-red-700 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-3.5 px-3 text-center bg-white/60 rounded-lg border border-dashed border-[#D5C7B8] space-y-2">
                <p className="text-xs text-[#8C7A6D] italic">
                  No brew steps added yet. Add timed steps if you want a step-by-step guided brew timeline.
                </p>
                <div className="flex items-center justify-center gap-2">
                  <button
                    type="button"
                    onClick={handleAddStep}
                    className="text-xs px-2.5 py-1 bg-[#4A392D] text-white rounded-md hover:bg-[#34261C] font-semibold inline-flex items-center gap-1 transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Step
                  </button>
                  {METHOD_DEFAULTS[method].defaultSteps.length > 0 && (
                    <button
                      type="button"
                      onClick={() =>
                        setSteps(
                          METHOD_DEFAULTS[method].defaultSteps.map((st, idx) => ({
                            id: `st-load-${Date.now()}-${idx}`,
                            timeSeconds: st.timeSeconds,
                            title: st.title,
                            waterAmountGrams: st.waterAmountGrams,
                            instruction: st.instruction,
                          }))
                        )
                      }
                      className="text-xs px-2.5 py-1 bg-[#F2E9DE] text-[#4A392D] rounded-md hover:bg-[#E8DCCF] border border-[#E2D5C7] font-semibold inline-flex items-center gap-1 transition-colors"
                    >
                      Load {METHOD_DEFAULTS[method].name} Default Steps
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Barista Notes */}
          <div>
            <label className="block text-xs font-semibold text-[#5B473A] uppercase tracking-wider mb-1">
              Barista Notes & Tips
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g., Pour very gently to avoid stirring up fines. Rest beans 10 days for best clarity."
              rows={2}
              className="w-full px-3 py-2 bg-white rounded-lg border border-[#DACDC0] text-sm text-[#2C2118] focus:outline-none focus:ring-2 focus:ring-[#C87D32]/40"
            />
          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#E8DEC0]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-[#6B5749] hover:text-[#2B1D14] transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 bg-[#C87D32] hover:bg-[#B06B26] text-white text-xs font-semibold rounded-lg shadow-sm hover:shadow transition-all flex items-center gap-1.5"
            >
              <Sparkles className="w-4 h-4" />
              {isEditing ? 'Save Recipe Changes' : 'Create Recipe'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
