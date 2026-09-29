import React, { useState } from 'react';
import { X, Sparkles, Plus } from 'lucide-react';
import { Coffee, ProcessType, RoastLevel, Shelf } from '../types/coffee';
import { StarRatingInput } from './StarRating';
import { COMMON_FLAVORS } from '../data/initialData';

interface CoffeeModalProps {
  initialCoffee?: Coffee | null;
  shelves: Shelf[];
  onSave: (coffee: Coffee) => void;
  onClose: () => void;
}

const ROAST_LEVELS: RoastLevel[] = [
  'Light',
  'Medium-Light',
  'Medium',
  'Medium-Dark',
  'Dark',
];

const PROCESS_TYPES: ProcessType[] = [
  'Washed',
  'Natural',
  'Honey',
  'Anaerobic Natural',
  'Thermal Shock',
  'Experimental',
  'Wet-Hulled',
  'Washed & Natural',
  'Washed & Wet-Hulled',
  'Co-ferment',
];

const COLOR_PALETTES = [
  { name: 'Warm Amber', color: '#E29548' },
  { name: 'Classic Parchment', color: '#D3B478' },
  { name: 'Dark Roast Walnut', color: '#5C382A' },
  { name: 'Terracotta Red', color: '#B0413E' },
  { name: 'Berry Burgundy', color: '#D95D80' },
  { name: 'Midnight Navy', color: '#2C3E50' },
  { name: 'Forest Hunter', color: '#2F5233' },
  { name: 'Deep Espresso', color: '#221A15' },
];

export const CoffeeModal: React.FC<CoffeeModalProps> = ({
  initialCoffee,
  shelves,
  onSave,
  onClose,
}) => {
  const isEditing = Boolean(initialCoffee);

  const [name, setName] = useState(initialCoffee?.name || '');
  const [roaster, setRoaster] = useState(initialCoffee?.roaster || '');
  const [country, setCountry] = useState(initialCoffee?.origin.country || 'Ethiopia');
  const [region, setRegion] = useState(initialCoffee?.origin.region || '');
  const [farmOrStation, setFarmOrStation] = useState(initialCoffee?.origin.farmOrStation || '');
  const [producer, setProducer] = useState(initialCoffee?.origin.producer || '');
  const [elevationMeters, setElevationMeters] = useState<number | undefined>(
    initialCoffee?.origin.elevationMeters
  );
  const [variety, setVariety] = useState(initialCoffee?.variety || 'Ethiopian Heirlooms');
  const [process, setProcess] = useState<ProcessType>(initialCoffee?.process || 'Washed');
  const [roastLevel, setRoastLevel] = useState<RoastLevel>(
    initialCoffee?.roastLevel || 'Light'
  );
  const [roastDate, setRoastDate] = useState(
    initialCoffee?.roastDate || new Date().toISOString().split('T')[0]
  );
  const [userRating, setUserRating] = useState<number>(initialCoffee?.userRating || 0);
  const [selectedShelfIds, setSelectedShelfIds] = useState<string[]>(
    initialCoffee?.shelfIds || ['currently-drinking']
  );
  const [flavorTags, setFlavorTags] = useState<string[]>(
    initialCoffee?.tastingNotesSummary || ['Candied Peach', 'Jasmine']
  );
  const [customTagInput, setCustomTagInput] = useState('');
  const [coverColor, setCoverColor] = useState(initialCoffee?.coverColor || '#E29548');
  const [description, setDescription] = useState(initialCoffee?.description || '');

  const toggleShelf = (shelfId: string) => {
    if (selectedShelfIds.includes(shelfId)) {
      setSelectedShelfIds(selectedShelfIds.filter((id) => id !== shelfId));
    } else {
      setSelectedShelfIds([...selectedShelfIds, shelfId]);
    }
  };

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
    const coffeeData: Coffee = {
      id: initialCoffee?.id || `coffee-${Date.now()}`,
      name: name.trim(),
      roaster: roaster.trim(),
      origin: {
        country: country.trim(),
        region: region.trim() || undefined,
        farmOrStation: farmOrStation.trim() || undefined,
        producer: producer.trim() || undefined,
        elevationMeters: elevationMeters ? Number(elevationMeters) : undefined,
      },
      variety: variety.trim(),
      process,
      roastLevel,
      roastDate: roastDate || undefined,
      userRating,
      communityRating: initialCoffee?.communityRating || 4.5,
      communityRatingsCount: initialCoffee?.communityRatingsCount || 1,
      shelfIds: selectedShelfIds.length > 0 ? selectedShelfIds : ['currently-drinking'],
      tastingNotesSummary: flavorTags,
      tastingLogs: initialCoffee?.tastingLogs || [],
      recipes: initialCoffee?.recipes || [],
      coverColor,
      bagBadgeText: initialCoffee?.bagBadgeText || 'Specialty Single Origin',
      description: description.trim(),
      dateAdded: initialCoffee?.dateAdded || new Date().toISOString().split('T')[0],
      isFavorite: initialCoffee?.isFavorite || false,
    };

    onSave(coffeeData);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
      <div className="bg-[#FAF7F2] border border-[#E5DACD] w-full max-w-2xl rounded-xl shadow-2xl overflow-hidden my-8 animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-[#F3ECE2] border-b border-[#E8DEC0]/50">
          <div>
            <div className="text-[10px] uppercase font-bold tracking-wider text-[#8A6D56]">
              Coffee Catalog
            </div>
            <h2 className="font-serif text-xl font-bold text-[#2B1D14]">
              {isEditing ? 'Edit Coffee' : 'Add New Coffee to Shelves'}
            </h2>
            <p className="text-xs text-[#6B5A4E]">
              Track your beans with origin details, roast level, and flavor profile
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
          {/* Coffee Name & Roaster */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#5B473A] uppercase tracking-wider mb-1">
                Coffee Bean Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Chelbesa Village or Southern Weather"
                className="w-full px-3 py-2 bg-white rounded-lg border border-[#DACDC0] text-sm text-[#2C2118]"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#5B473A] uppercase tracking-wider mb-1">
                Roaster
              </label>
              <input
                type="text"
                value={roaster}
                onChange={(e) => setRoaster(e.target.value)}
                placeholder="e.g. Sey Coffee, Onyx, Tim Wendelboe"
                className="w-full px-3 py-2 bg-white rounded-lg border border-[#DACDC0] text-sm text-[#2C2118]"
                required
              />
            </div>
          </div>

          {/* Shelves Selection (Goodreads style) */}
          <div>
            <label className="block text-xs font-semibold text-[#5B473A] uppercase tracking-wider mb-1.5">
              Add to Shelves
            </label>
            <div className="flex flex-wrap gap-1.5 p-2 bg-[#F3EBE0] rounded-lg border border-[#E5DACD]">
              {shelves.map((s) => {
                const isSelected = selectedShelfIds.includes(s.id);
                return (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => toggleShelf(s.id)}
                    className={`text-xs px-3 py-1.5 rounded-md font-medium border transition-all ${
                      isSelected
                        ? 'bg-[#3A291E] text-white border-[#3A291E] shadow-xs'
                        : 'bg-white text-[#523F32] border-[#DACDC0] hover:bg-[#FAF7F2]'
                    }`}
                  >
                    {s.name}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Origin Details */}
          <div className="p-4 bg-white rounded-xl border border-[#E0D5C7] space-y-3">
            <span className="text-xs font-bold text-[#6B5341] uppercase tracking-wider block">
              Origin & Terroir
            </span>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs text-[#6B5749] mb-1">Country</label>
                <input
                  type="text"
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  placeholder="e.g. Ethiopia, Colombia"
                  className="w-full px-2.5 py-1.5 bg-[#FAF7F2] rounded border border-[#D5C7B8] text-xs text-[#2C2017]"
                  required
                />
              </div>

              <div>
                <label className="block text-xs text-[#6B5749] mb-1">Region / Zone</label>
                <input
                  type="text"
                  value={region}
                  onChange={(e) => setRegion(e.target.value)}
                  placeholder="e.g. Yirgacheffe, Huila"
                  className="w-full px-2.5 py-1.5 bg-[#FAF7F2] rounded border border-[#D5C7B8] text-xs text-[#2C2017]"
                />
              </div>

              <div>
                <label className="block text-xs text-[#6B5749] mb-1">Elevation (meters)</label>
                <input
                  type="number"
                  step="50"
                  value={elevationMeters ?? ''}
                  onChange={(e) =>
                    setElevationMeters(e.target.value ? parseInt(e.target.value) : undefined)
                  }
                  placeholder="e.g. 2100"
                  className="w-full px-2.5 py-1.5 bg-[#FAF7F2] rounded border border-[#D5C7B8] text-xs text-[#2C2017] font-mono"
                />
              </div>

              <div>
                <label className="block text-xs text-[#6B5749] mb-1">Variety</label>
                <input
                  type="text"
                  value={variety}
                  onChange={(e) => setVariety(e.target.value)}
                  placeholder="e.g. Geisha, Pink Bourbon"
                  className="w-full px-2.5 py-1.5 bg-[#FAF7F2] rounded border border-[#D5C7B8] text-xs text-[#2C2017]"
                />
              </div>

              <div>
                <label className="block text-xs text-[#6B5749] mb-1">Process</label>
                <select
                  value={process}
                  onChange={(e) => setProcess(e.target.value as ProcessType)}
                  className="w-full px-2.5 py-1.5 bg-[#FAF7F2] rounded border border-[#D5C7B8] text-xs text-[#2C2017]"
                >
                  {PROCESS_TYPES.map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs text-[#6B5749] mb-1">Roast Level</label>
                <select
                  value={roastLevel}
                  onChange={(e) => setRoastLevel(e.target.value as RoastLevel)}
                  className="w-full px-2.5 py-1.5 bg-[#FAF7F2] rounded border border-[#D5C7B8] text-xs text-[#2C2017]"
                >
                  {ROAST_LEVELS.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Rating & Roast Date */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-3 bg-white rounded-lg border border-[#E0D5C7]">
              <StarRatingInput
                value={userRating}
                onChange={setUserRating}
                label="Your Rating (Half-stars supported)"
                size="md"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#5B473A] uppercase tracking-wider mb-1">
                Roast Date
              </label>
              <input
                type="date"
                value={roastDate}
                onChange={(e) => setRoastDate(e.target.value)}
                className="w-full px-3 py-2 bg-white rounded-lg border border-[#DACDC0] text-sm text-[#2C2118]"
              />
            </div>
          </div>

          {/* Flavor Notes Tags */}
          <div className="space-y-2">
            <label className="block text-xs font-semibold text-[#5B473A] uppercase tracking-wider">
              Tasting Notes Summary
            </label>

            <div className="flex flex-wrap gap-1.5 min-h-6">
              {flavorTags.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => toggleFlavorTag(tag)}
                  className="px-2.5 py-1 rounded-md text-xs font-medium bg-[#3A291E] text-white flex items-center gap-1"
                >
                  {tag}
                  <X className="w-3 h-3 opacity-70" />
                </button>
              ))}
            </div>

            <div className="flex flex-wrap gap-1 max-h-20 overflow-y-auto p-1 bg-[#F5ECE1] rounded-lg border border-[#E5DACD]">
              {COMMON_FLAVORS.slice(0, 15).map((f) => (
                <button
                  key={f}
                  type="button"
                  onClick={() => toggleFlavorTag(f)}
                  className={`text-[11px] px-2 py-0.5 rounded ${
                    flavorTags.includes(f)
                      ? 'bg-[#8B4822] text-white'
                      : 'bg-white hover:bg-[#FAF7F2] text-[#4F3C2F] border border-[#DECFC0]'
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>

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
                placeholder="Or type custom flavor note..."
                className="flex-1 px-3 py-1.5 bg-white rounded-md border border-[#D5C7B8] text-xs text-[#2C2017]"
              />
              <button
                type="button"
                onClick={handleAddCustomTag}
                className="px-3 py-1.5 bg-[#523F32] hover:bg-[#3D2D23] text-white text-xs font-semibold rounded-md flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" /> Add
              </button>
            </div>
          </div>

          {/* Bag Cover Color Aesthetic */}
          <div>
            <label className="block text-xs font-semibold text-[#5B473A] uppercase tracking-wider mb-1.5">
              Bag Cover Palette
            </label>
            <div className="flex items-center gap-2">
              {COLOR_PALETTES.map((p) => (
                <button
                  key={p.color}
                  type="button"
                  onClick={() => setCoverColor(p.color)}
                  className={`w-7 h-7 rounded-full transition-transform border-2 ${
                    coverColor === p.color
                      ? 'scale-110 border-[#2B1D14] ring-2 ring-[#C87D32]/40'
                      : 'border-white/80 hover:scale-105'
                  }`}
                  style={{ backgroundColor: p.color }}
                  title={p.name}
                />
              ))}
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-[#5B473A] uppercase tracking-wider mb-1">
              Roaster Notes & Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. Crisp floral jasmine aroma, delicate peach sweetness with a silky tea-like finish..."
              rows={2}
              className="w-full px-3 py-2 bg-white rounded-lg border border-[#DACDC0] text-sm text-[#2C2118]"
            />
          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#E8DEC0]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-[#6B5749] hover:text-[#2B1D14]"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 bg-[#C87D32] hover:bg-[#B06B26] text-white text-xs font-semibold rounded-lg shadow-sm hover:shadow transition-all flex items-center gap-1.5"
            >
              <Sparkles className="w-4 h-4" />
              {isEditing ? 'Save Coffee Changes' : 'Add Coffee'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
