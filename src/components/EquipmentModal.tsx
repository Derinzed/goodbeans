import React, { useState } from 'react';
import { X, Wrench, Sparkles, Search, Check, Info, Loader2 } from 'lucide-react';
import { Equipment, EquipmentCategory, RegisteredEquipment } from '../types/coffee';
import { StarRatingInput, StarRatingDisplay } from './StarRating';

interface EquipmentModalProps {
  initialEquipment?: Equipment | null;
  registeredEquipment?: RegisteredEquipment[];
  onSave: (equipment: Equipment) => void;
  onClose: () => void;
}

const CATEGORIES: EquipmentCategory[] = [
  'Grinder',
  'Espresso Machine',
  'Pour Over / Dripper',
  'Kettle',
  'Scale',
  'Immersion',
  'Accessory',
  'Roaster',
];

export const EquipmentModal: React.FC<EquipmentModalProps> = ({
  initialEquipment,
  registeredEquipment = [],
  onSave,
  onClose,
}) => {
  const isEditing = Boolean(initialEquipment);

  const [name, setName] = useState(initialEquipment?.name || '');
  const [brand, setBrand] = useState(initialEquipment?.brand || '');
  const [category, setCategory] = useState<EquipmentCategory>(
    initialEquipment?.category || 'Grinder'
  );
  const [status, setStatus] = useState<'Active' | 'Wishlist' | 'Archived'>(
    initialEquipment?.status || 'Active'
  );
  const [dateAcquired, setDateAcquired] = useState(
    initialEquipment?.dateAcquired || new Date().toISOString().split('T')[0]
  );
  const [settingsNotes, setSettingsNotes] = useState(initialEquipment?.settingsNotes || '');
  const [maintenanceNotes, setMaintenanceNotes] = useState(
    initialEquipment?.maintenanceNotes || ''
  );
  const [generalNotes, setGeneralNotes] = useState(initialEquipment?.generalNotes || '');
  const [rating, setRating] = useState<number>(initialEquipment?.rating || 4.5);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAllRegistered, setShowAllRegistered] = useState(false);
  const [isAutoFilling, setIsAutoFilling] = useState(false);
  const [autoFillError, setAutoFillError] = useState<string | null>(null);

  const handleAutoFillSpecs = async () => {
    if (!name.trim()) return;
    setIsAutoFilling(true);
    setAutoFillError(null);
    try {
      const query = brand.trim() ? `${brand} ${name}` : name.trim();
      const res = await fetch('/api/ai/populate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ itemType: 'equipment', name: query }),
      }).then((r) => r.json());

      if (res && res.success && res.item) {
        const item = res.item;
        if (item.name) setName(item.name);
        if (item.brand) setBrand(item.brand);
        if (item.category && CATEGORIES.includes(item.category)) {
          setCategory(item.category);
        }
        if (item.settingsNotes) setSettingsNotes(item.settingsNotes);
        if (item.maintenanceNotes) setMaintenanceNotes(item.maintenanceNotes);
        if (item.generalNotes) setGeneralNotes(item.generalNotes);
      } else {
        setAutoFillError('Could not auto-populate gear specs online.');
      }
    } catch {
      setAutoFillError('Failed to auto-populate specifications.');
    } finally {
      setIsAutoFilling(false);
    }
  };

  // Match against registered items by clean name and brand/category
  const matchingRegistered = registeredEquipment.find(
    (re) =>
      re.name.toLowerCase() === name.trim().toLowerCase() &&
      (!brand.trim() || re.brand.toLowerCase() === brand.trim().toLowerCase())
  );

  const effectiveGeneralRating = matchingRegistered && matchingRegistered.ratingsCount > 0
    ? matchingRegistered.generalRating
    : 0;
  const effectiveRatingsCount = matchingRegistered
    ? matchingRegistered.ratingsCount
    : 0;

  const handleSelectRegistered = (re: RegisteredEquipment) => {
    setName(re.name);
    setBrand(re.brand);
    setCategory(re.category);
    if (re.settingsNotes) setSettingsNotes(re.settingsNotes);
    if (re.maintenanceNotes) setMaintenanceNotes(re.maintenanceNotes);
    if (re.generalNotes) setGeneralNotes(re.generalNotes);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const data: Equipment = {
      id: initialEquipment?.id || `eq-${Date.now()}`,
      name: name.trim(),
      brand: brand.trim(),
      category,
      status,
      dateAcquired,
      settingsNotes: settingsNotes.trim(),
      maintenanceNotes: maintenanceNotes.trim(),
      generalNotes: generalNotes.trim(),
      rating,
    };
    onSave(data);
  };

  const recommendedItems = registeredEquipment.filter((re) => re.isRecommended || re.generalRating >= 4.5);
  const filteredRegistered = registeredEquipment.filter((re) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return re.name.toLowerCase().includes(q) || re.brand.toLowerCase().includes(q) || re.category.toLowerCase().includes(q);
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
      <div className="bg-[#FAF7F2] border border-[#E5DACD] w-full max-w-xl rounded-xl shadow-2xl overflow-hidden my-8 animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-[#F3ECE2] border-b border-[#E8DEC0]/50">
          <div>
            <div className="text-[10px] uppercase font-bold tracking-wider text-[#8A6D56]">
              Equipment Shelf
            </div>
            <h2 className="font-serif text-xl font-bold text-[#2B1D14]">
              {isEditing ? 'Edit Coffee Gear' : 'Add New Equipment'}
            </h2>
            <p className="text-xs text-[#6B5A4E]">
              Track specs, burr calibrations, dial-in clicks, and maintenance
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-[#7A6453] hover:text-[#2B1D14] rounded-lg hover:bg-[#EAE0D3] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
          {/* Running List of Registered Gear & Recommendations */}
          {!isEditing && registeredEquipment.length > 0 && (
            <div className="p-3 bg-[#FAF3EC] rounded-xl border border-[#E8DACB] space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-[#C87D32]" />
                  <span className="text-xs font-bold text-[#2B1D14] uppercase tracking-wider">
                    Community Registered Gear & Recommendations
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setShowAllRegistered(!showAllRegistered)}
                  className="text-[11px] font-semibold text-[#C87D32] hover:text-[#9E5D1D] transition-colors cursor-pointer"
                >
                  {showAllRegistered ? 'Show Recommendations' : `Browse All (${registeredEquipment.length})`}
                </button>
              </div>

              {showAllRegistered && (
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-[#8C7A6D] absolute left-2.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search gear by name, brand, or category..."
                    className="w-full pl-8 pr-3 py-1.5 bg-white rounded-lg border border-[#DACDC0] text-xs text-[#2C2118] focus:outline-none focus:ring-1 focus:ring-[#C87D32]"
                  />
                </div>
              )}

              {/* Gear chips/cards */}
              <div className="flex gap-2 overflow-x-auto pb-1 max-h-40 flex-wrap">
                {(showAllRegistered ? filteredRegistered : recommendedItems).map((re) => {
                  const isCurrent = name.trim().toLowerCase() === re.name.toLowerCase();
                  return (
                    <button
                      key={re.id}
                      type="button"
                      onClick={() => handleSelectRegistered(re)}
                      className={`text-left p-2 rounded-lg border transition-all cursor-pointer flex-1 min-w-[190px] max-w-[260px] ${
                        isCurrent
                          ? 'bg-white border-[#C87D32] shadow-xs ring-1 ring-[#C87D32]'
                          : 'bg-white/90 hover:bg-white border-[#E0D5C7]'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-1 mb-0.5">
                        <span className="text-[10px] uppercase font-bold text-[#8C4F1A] truncate">
                          {re.brand} · {re.category}
                        </span>
                        {re.isRecommended && (
                          <span className="text-[9px] font-bold px-1.5 py-0.2 bg-amber-100 text-amber-900 rounded-full flex items-center gap-0.5">
                            ★ Recommended
                          </span>
                        )}
                      </div>
                      <div className="font-serif text-xs font-bold text-[#2B1D14] truncate">
                        {re.name}
                      </div>
                      <div className="text-[10px] text-[#7A6757] mt-0.5 font-semibold text-[#8C4F1A] font-mono">
                        General Rating: ★ {re.generalRating.toFixed(1)} ({re.ratingsCount} baristas)
                      </div>
                    </button>
                  );
                })}
              </div>

              {matchingRegistered ? (
                <div className="flex items-start gap-1.5 text-[11px] text-[#3B5A3E] bg-emerald-50/80 p-2 rounded-lg border border-emerald-200">
                  <Check className="w-3.5 h-3.5 shrink-0 mt-0.5 text-emerald-600" />
                  <span>
                    Linked with registered gear: <strong>{matchingRegistered.name}</strong> ({matchingRegistered.brand}). General rating is averaged across all baristas. (You can still use your own custom name if desired).
                  </span>
                </div>
              ) : name.trim() ? (
                <div className="flex items-start gap-1.5 text-[11px] text-[#6B5A4E] bg-white/70 p-2 rounded-lg border border-[#E5DACD]">
                  <Info className="w-3.5 h-3.5 shrink-0 mt-0.5 text-[#C87D32]" />
                  <span>
                    Custom gear: <strong>"{name}"</strong> will be added as a distinct item to track in the community registry.
                  </span>
                </div>
              ) : null}
            </div>
          )}

          {/* Name & Brand */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-semibold text-[#5B473A] uppercase tracking-wider">
                  Equipment Model / Name
                </label>
                {name.trim().length > 1 && (
                  <button
                    type="button"
                    onClick={handleAutoFillSpecs}
                    disabled={isAutoFilling}
                    className="text-[11px] font-semibold text-[#C87D32] hover:text-[#9E5D1D] flex items-center gap-1 transition-colors cursor-pointer disabled:opacity-50"
                    title="Auto-fill brand, category, dial-in settings, and notes from online lookup"
                  >
                    {isAutoFilling ? (
                      <Loader2 className="w-3 h-3 animate-spin text-[#C87D32]" />
                    ) : (
                      <Sparkles className="w-3 h-3 text-[#C87D32]" />
                    )}
                    <span>{isAutoFilling ? 'Looking up...' : 'Auto-Fill Specs'}</span>
                  </button>
                )}
              </div>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. C40 MK4 Nitro Blade"
                className="w-full px-3 py-2 bg-white rounded-lg border border-[#DACDC0] text-sm text-[#2C2118]"
                required
              />
              {autoFillError && (
                <p className="text-[10px] text-red-600 mt-1">{autoFillError}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#5B473A] uppercase tracking-wider mb-1">
                Manufacturer / Brand
              </label>
              <input
                type="text"
                value={brand}
                onChange={(e) => setBrand(e.target.value)}
                placeholder="e.g. Comandante, Fellow, Hario"
                className="w-full px-3 py-2 bg-white rounded-lg border border-[#DACDC0] text-sm text-[#2C2118]"
                required
              />
            </div>
          </div>

          {/* Category & Status */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[#5B473A] uppercase tracking-wider mb-1">
                Gear Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as EquipmentCategory)}
                className="w-full px-3 py-2 bg-white rounded-lg border border-[#DACDC0] text-sm text-[#2C2118]"
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#5B473A] uppercase tracking-wider mb-1">
                Status
              </label>
              <select
                value={status}
                onChange={(e) =>
                  setStatus(e.target.value as 'Active' | 'Wishlist' | 'Archived')
                }
                className="w-full px-3 py-2 bg-white rounded-lg border border-[#DACDC0] text-sm text-[#2C2118]"
              >
                <option value="Active">Active Daily Driver</option>
                <option value="Wishlist">Wishlist</option>
                <option value="Archived">Archived / Backup</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#5B473A] uppercase tracking-wider mb-1">
                Acquired Date
              </label>
              <input
                type="date"
                value={dateAcquired}
                onChange={(e) => setDateAcquired(e.target.value)}
                className="w-full px-3 py-2 bg-white rounded-lg border border-[#DACDC0] text-sm text-[#2C2118]"
              />
            </div>
          </div>

          {/* Dual Rating: Personal & General */}
          <div className="p-3.5 bg-white rounded-lg border border-[#E0D5C7] space-y-3">
            <StarRatingInput
              value={rating}
              onChange={setRating}
              label="Personal Gear Rating (Your Evaluation)"
              size="md"
            />

            <div className="pt-2.5 border-t border-[#F0E6DB]">
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="text-[10px] uppercase font-bold text-[#8C7A6D] tracking-wider">
                  General Rating (Average Across All User Gear)
                </span>
                <span className="font-mono text-[11px] font-bold text-[#8C4F1A]">
                  {effectiveGeneralRating.toFixed(1)} ★
                </span>
              </div>
              <div className="flex items-center gap-2">
                <StarRatingDisplay
                  rating={effectiveGeneralRating}
                  count={effectiveRatingsCount}
                  size="sm"
                />
                <span className="text-[10px] text-[#7A6757]">
                  {matchingRegistered
                    ? `Live average across ${effectiveRatingsCount} barista ratings`
                    : rating > 0
                    ? `Starts at your personal rating (${rating.toFixed(1)} ★)`
                    : 'Community average across all user-added gear'}
                </span>
              </div>
            </div>
          </div>

          {/* Settings & Calibration Notes */}
          <div>
            <label className="block text-xs font-semibold text-[#5B473A] uppercase tracking-wider mb-1 flex items-center gap-1.5">
              <Wrench className="w-3.5 h-3.5 text-[#C87D32]" />
              <span>Settings, Clicks & Calibration Notes</span>
            </label>
            <textarea
              value={settingsNotes}
              onChange={(e) => setSettingsNotes(e.target.value)}
              placeholder="e.g. V60 sweet spot is 22-24 clicks. Espresso is 14 clicks with Red Clix. Zero point aligned at chirp -1."
              rows={2}
              className="w-full px-3 py-2 bg-white rounded-lg border border-[#DACDC0] text-sm text-[#2C2118] focus:outline-none focus:ring-2 focus:ring-[#C87D32]/40"
            />
          </div>

          {/* Maintenance & Cleaning Notes */}
          <div>
            <label className="block text-xs font-semibold text-[#5B473A] uppercase tracking-wider mb-1">
              Maintenance, Descaling & Cleaning History
            </label>
            <textarea
              value={maintenanceNotes}
              onChange={(e) => setMaintenanceNotes(e.target.value)}
              placeholder="e.g. Descaled with citric acid every 60 days. Backflushed with Cafiza weekly. Silicone gasket replaced last month."
              rows={2}
              className="w-full px-3 py-2 bg-white rounded-lg border border-[#DACDC0] text-sm text-[#2C2118] focus:outline-none focus:ring-2 focus:ring-[#C87D32]/40"
            />
          </div>

          {/* General Notes & Quirks */}
          <div>
            <label className="block text-xs font-semibold text-[#5B473A] uppercase tracking-wider mb-1">
              Barista Review & Quirks
            </label>
            <textarea
              value={generalNotes}
              onChange={(e) => setGeneralNotes(e.target.value)}
              placeholder="e.g. Outstanding clarity and separation of delicate floral notes. Requires slow feeding for dense light roasts."
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
              {isEditing ? 'Save Equipment' : 'Add to Equipment Shelf'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
