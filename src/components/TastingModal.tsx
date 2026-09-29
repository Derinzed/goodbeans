import React, { useState } from 'react';
import { X, Sparkles, Plus } from 'lucide-react';
import { TastingEntry, Coffee } from '../types/coffee';
import { StarRatingInput } from './StarRating';
import { COMMON_FLAVORS } from '../data/initialData';

interface TastingModalProps {
  coffee: Coffee;
  onSave: (entry: TastingEntry) => void;
  onClose: () => void;
}

export const TastingModal: React.FC<TastingModalProps> = ({ coffee, onSave, onClose }) => {
  const [rating, setRating] = useState<number>(coffee.userRating || 4.5);
  const [brewMethod, setBrewMethod] = useState('V60 Pour Over');
  const [notes, setNotes] = useState('');
  const [flavorTags, setFlavorTags] = useState<string[]>(coffee.tastingNotesSummary.slice(0, 3));
  const [customTagInput, setCustomTagInput] = useState('');
  const [daysOffRoast, setDaysOffRoast] = useState<number>(7);

  // Sensory Scores (1 to 5)
  const [acidity, setAcidity] = useState(4.0);
  const [sweetness, setSweetness] = useState(4.5);
  const [body, setBody] = useState(3.5);
  const [clarity, setClarity] = useState(4.5);
  const [bitterness, setBitterness] = useState(1.5);

  const toggleFlavorTag = (tag: string) => {
    if (flavorTags.includes(tag)) {
      setFlavorTags(flavorTags.filter((t) => t !== tag));
    } else {
      setFlavorTags([...flavorTags, tag]);
    }
  };

  const handleAddCustomTag = () => {
    const trimmed = customTagInput.trim();
    if (trimmed && !flavorTags.includes(trimmed)) {
      setFlavorTags([...flavorTags, trimmed]);
      setCustomTagInput('');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const entry: TastingEntry = {
      id: `tlog-${Date.now()}`,
      date: new Date().toISOString().split('T')[0],
      brewMethod,
      rating,
      notes: notes.trim(),
      flavorTags,
      daysOffRoast,
      sensoryScores: {
        acidity,
        sweetness,
        body,
        clarity,
        bitterness,
      },
    };
    onSave(entry);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
      <div className="bg-[#FAF7F2] border border-[#E5DACD] w-full max-w-xl rounded-xl shadow-2xl overflow-hidden my-8 animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-[#F3ECE2] border-b border-[#E8DEC0]/50">
          <div>
            <div className="text-[10px] uppercase font-bold tracking-wider text-[#8A6D56]">
              Cup Journal & Tasting Note
            </div>
            <h2 className="font-serif text-xl font-bold text-[#2B1D14]">
              Log Tasting Session
            </h2>
            <p className="text-xs text-[#6B5A4E]">
              {coffee.name} · {coffee.roaster}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-[#7A6453] hover:text-[#2B1D14] rounded-lg hover:bg-[#EAE0D3] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5 max-h-[80vh] overflow-y-auto">
          {/* Half Star Rating Input */}
          <div className="p-4 bg-white rounded-xl border border-[#E0D5C7]">
            <StarRatingInput
              value={rating}
              onChange={setRating}
              label="Cup Rating (Supports Half-Stars)"
              size="lg"
            />
          </div>

          {/* Brew Context */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[#5B473A] uppercase tracking-wider mb-1">
                Brew Method
              </label>
              <select
                value={brewMethod}
                onChange={(e) => setBrewMethod(e.target.value)}
                className="w-full px-3 py-2 bg-white rounded-lg border border-[#DACDC0] text-sm text-[#2C2118]"
              >
                <option value="V60 Pour Over">V60 Pour Over</option>
                <option value="Espresso">Espresso</option>
                <option value="AeroPress">AeroPress</option>
                <option value="French Press">French Press</option>
                <option value="Chemex">Chemex</option>
                <option value="Clever Dripper">Clever Dripper</option>
                <option value="Cold Brew">Cold Brew</option>
                <option value="Moka Pot">Moka Pot</option>
                <option value="Cupping Bowl">Cupping Bowl</option>
                <option value="Auto Drip">Auto Drip</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#5B473A] uppercase tracking-wider mb-1">
                Days Off Roast
              </label>
              <input
                type="number"
                min="0"
                max="365"
                value={daysOffRoast}
                onChange={(e) => setDaysOffRoast(parseInt(e.target.value) || 0)}
                className="w-full px-3 py-2 bg-white rounded-lg border border-[#DACDC0] text-sm font-mono text-[#2C2118]"
              />
            </div>
          </div>

          {/* Tasting Notes & Sensory Impressions */}
          <div>
            <label className="block text-xs font-semibold text-[#5B473A] uppercase tracking-wider mb-1">
              Tasting Notes & Impressions
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Incredibly clean cup with pronounced floral jasmine aromatics. Sweet candied peach on the finish with juicy Meyer lemon acidity. Body is velvety tea-like."
              rows={3}
              className="w-full px-3 py-2 bg-white rounded-lg border border-[#DACDC0] text-sm text-[#2C2118] focus:outline-none focus:ring-2 focus:ring-[#C87D32]/40"
              required
            />
          </div>

          {/* Flavor Tags */}
          <div className="space-y-2">
            <label className="block text-xs font-semibold text-[#5B473A] uppercase tracking-wider">
              Flavor Notes Detected
            </label>

            {/* Selected Tags */}
            <div className="flex flex-wrap gap-1.5 min-h-6">
              {flavorTags.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => toggleFlavorTag(tag)}
                  className="px-2.5 py-1 rounded-md text-xs font-medium bg-[#3A291E] text-white flex items-center gap-1 transition-all"
                >
                  {tag}
                  <X className="w-3 h-3 opacity-70 hover:opacity-100" />
                </button>
              ))}
            </div>

            {/* Flavor Wheel Quick Picks */}
            <div className="pt-1">
              <span className="text-[10px] uppercase font-semibold text-[#8C7A6D] block mb-1">
                Tap to add flavor notes:
              </span>
              <div className="flex flex-wrap gap-1 max-h-24 overflow-y-auto p-1 bg-[#F5ECE1] rounded-lg border border-[#E5DACD]">
                {COMMON_FLAVORS.map((flavor) => {
                  const isSelected = flavorTags.includes(flavor);
                  return (
                    <button
                      key={flavor}
                      type="button"
                      onClick={() => toggleFlavorTag(flavor)}
                      className={`text-[11px] px-2 py-0.5 rounded transition-all ${
                        isSelected
                          ? 'bg-[#8B4822] text-white font-medium'
                          : 'bg-white hover:bg-[#FAF7F2] text-[#4F3C2F] border border-[#DECFC0]'
                      }`}
                    >
                      {flavor}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Custom Flavor Note input */}
            <div className="flex items-center gap-2 pt-1">
              <input
                type="text"
                value={customTagInput}
                onChange={(e) => setCustomTagInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddCustomTag();
                  }
                }}
                placeholder="Or type custom flavor note (e.g. Starfruit)..."
                className="flex-1 px-3 py-1.5 bg-white rounded-md border border-[#D5C7B8] text-xs text-[#2C2017]"
              />
              <button
                type="button"
                onClick={handleAddCustomTag}
                className="px-3 py-1.5 bg-[#523F32] hover:bg-[#3D2D23] text-white text-xs font-semibold rounded-md flex items-center gap-1 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" /> Add
              </button>
            </div>
          </div>

          {/* Sensory Profile Sliders (Acidity, Sweetness, Body, Clarity, Bitterness) */}
          <div className="p-4 bg-[#F2E8DC] rounded-xl border border-[#E5DACD] space-y-3">
            <span className="text-xs font-bold text-[#6B5341] uppercase tracking-wider block">
              Sensory Balance (1 = Low, 5 = High)
            </span>

            <div className="space-y-2.5">
              {[
                { label: 'Acidity / Brightness', val: acidity, set: setAcidity },
                { label: 'Sweetness', val: sweetness, set: setSweetness },
                { label: 'Body / Texture', val: body, set: setBody },
                { label: 'Cup Clarity', val: clarity, set: setClarity },
                { label: 'Bitterness', val: bitterness, set: setBitterness },
              ].map(({ label, val, set }) => (
                <div key={label} className="flex items-center justify-between text-xs">
                  <span className="w-36 text-[#523F32] font-medium">{label}</span>
                  <input
                    type="range"
                    min="1"
                    max="5"
                    step="0.5"
                    value={val}
                    onChange={(e) => set(parseFloat(e.target.value))}
                    className="flex-1 mx-3 accent-[#C87D32]"
                  />
                  <span className="font-mono font-bold w-6 text-right text-[#3B291D]">
                    {val.toFixed(1)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#E8DEC0]">
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
              <Sparkles className="w-4 h-4" /> Save Tasting
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
