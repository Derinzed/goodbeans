import React, { useState } from 'react';
import { X, Sparkles, Plus, Search, Check, Info, Loader2 } from 'lucide-react';
import { Coffee, ProcessType, RoastLevel, Shelf, RegisteredCoffee } from '../types/coffee';
import { StarRatingInput, StarRatingDisplay } from './StarRating';
import { COMMON_FLAVORS } from '../data/initialData';

interface CoffeeModalProps {
  initialCoffee?: Coffee | null;
  shelves: Shelf[];
  registeredCoffees?: RegisteredCoffee[];
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
  registeredCoffees = [],
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
  const [registeredSearchQuery, setRegisteredSearchQuery] = useState('');
  const [showAllRegistered, setShowAllRegistered] = useState(false);
  const [isAutoFilling, setIsAutoFilling] = useState(false);
  const [autoFillError, setAutoFillError] = useState<string | null>(null);

  const handleAutoFillSpecs = async () => {
    if (!name.trim()) return;
    setIsAutoFilling(true);
    setAutoFillError(null);
    try {
      const query = roaster.trim() ? `${roaster} ${name}` : name.trim();
      const res = await fetch('/api/ai/populate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ itemType: 'coffee', name: query }),
      }).then((r) => r.json());

      if (res && res.success && res.item) {
        const item = res.item;
        if (item.name) setName(item.name);
        if (item.roaster) setRoaster(item.roaster);
        if (item.origin?.country) setCountry(item.origin.country);
        if (item.origin?.region) setRegion(item.origin.region);
        if (item.origin?.farmOrStation) setFarmOrStation(item.origin.farmOrStation);
        if (item.origin?.producer) setProducer(item.origin.producer);
        if (item.origin?.elevationMeters) setElevationMeters(item.origin.elevationMeters);
        if (item.variety) setVariety(item.variety);
        if (item.process) setProcess(item.process);
        if (item.roastLevel) setRoastLevel(item.roastLevel);
        if (Array.isArray(item.tastingNotesSummary) && item.tastingNotesSummary.length > 0) {
          setFlavorTags(item.tastingNotesSummary);
        }
        if (item.description) setDescription(item.description);
        if (item.coverColor) setCoverColor(item.coverColor);
      } else {
        setAutoFillError('Could not auto-populate bean specs online.');
      }
    } catch {
      setAutoFillError('Failed to auto-populate specifications.');
    } finally {
      setIsAutoFilling(false);
    }
  };

  // Match against registered items by clean name and roaster
  const matchingRegistered = registeredCoffees.find(
    (rc) =>
      rc.name.toLowerCase() === name.trim().toLowerCase() &&
      (!roaster.trim() || rc.roaster.toLowerCase() === roaster.trim().toLowerCase())
  );

  const effectiveGeneralRating = matchingRegistered
    ? matchingRegistered.generalRating
    : initialCoffee?.generalRating || initialCoffee?.communityRating || (userRating > 0 ? userRating : 4.5);
  const effectiveRatingsCount = matchingRegistered
    ? matchingRegistered.ratingsCount
    : initialCoffee?.communityRatingsCount || (userRating > 0 ? 1 : 0);

  const handleSelectRegistered = (rc: RegisteredCoffee) => {
    setName(rc.name);
    setRoaster(rc.roaster);
    if (rc.origin?.country) setCountry(rc.origin.country);
    if (rc.origin?.region) setRegion(rc.origin.region);
    if (rc.variety) setVariety(rc.variety);
    if (rc.process) setProcess(rc.process);
    if (rc.roastLevel) setRoastLevel(rc.roastLevel);
    if (rc.tastingNotesSummary && rc.tastingNotesSummary.length > 0) {
      setFlavorTags(rc.tastingNotesSummary);
    }
    if (rc.description) setDescription(rc.description);
    if (rc.coverColor) setCoverColor(rc.coverColor);
  };

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
      generalRating: effectiveGeneralRating,
      communityRating: effectiveGeneralRating,
      communityRatingsCount: effectiveRatingsCount,
      shelfIds: selectedShelfIds.length > 0 ? selectedShelfIds : ['currently-drinking'],
      tastingNotesSummary: flavorTags,
      tastingLogs: initialCoffee?.tastingLogs || [],
      recipes: initialCoffee?.recipes || [],
      coverColor,
      bagBadgeText: initialCoffee?.bagBadgeText || 'Specialty Single Origin',
      description: description.trim(),
      dateAdded: initialCoffee?.dateAdded || new Date().toISOString().split('T')[0],
      isFavorite: initialCoffee?.isFavorite || false,
      isRegistered: Boolean(matchingRegistered),
    };

    onSave(coffeeData);
  };

  // Filter registered coffees for recommendations display
  const recommendedItems = registeredCoffees.filter((rc) => rc.isRecommended || rc.generalRating >= 4.5);
  const filteredRegistered = registeredCoffees.filter((rc) => {
    if (!registeredSearchQuery.trim()) return true;
    const q = registeredSearchQuery.toLowerCase();
    return (
      rc.name.toLowerCase().includes(q) ||
      rc.roaster.toLowerCase().includes(q) ||
      (rc.origin?.country || '').toLowerCase().includes(q)
    );
  });

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
          {/* Running List of Registered Beans & Recommendations */}
          {!isEditing && registeredCoffees.length > 0 && (
            <div className="p-3.5 bg-[#FAF3EC] rounded-xl border border-[#E8DACB] space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-[#C87D32]" />
                  <span className="text-xs font-bold text-[#2B1D14] uppercase tracking-wider">
                    Community Registered Beans & Recommendations
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setShowAllRegistered(!showAllRegistered)}
                  className="text-[11px] font-semibold text-[#C87D32] hover:text-[#9E5D1D] transition-colors cursor-pointer"
                >
                  {showAllRegistered ? 'Show Recommendations' : `Browse All (${registeredCoffees.length})`}
                </button>
              </div>

              {showAllRegistered && (
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-[#8C7A6D] absolute left-2.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={registeredSearchQuery}
                    onChange={(e) => setRegisteredSearchQuery(e.target.value)}
                    placeholder="Search registered beans or roaster..."
                    className="w-full pl-8 pr-3 py-1.5 bg-white rounded-lg border border-[#DACDC0] text-xs text-[#2C2118] focus:outline-none focus:ring-1 focus:ring-[#C87D32]"
                  />
                </div>
              )}

              {/* Items chips/cards */}
              <div className="flex gap-2 overflow-x-auto pb-1 max-h-48 flex-wrap">
                {(showAllRegistered ? filteredRegistered : recommendedItems).map((rc) => {
                  const isCurrent = name.trim().toLowerCase() === rc.name.toLowerCase();
                  return (
                    <button
                      key={rc.id}
                      type="button"
                      onClick={() => handleSelectRegistered(rc)}
                      className={`text-left p-2.5 rounded-lg border transition-all cursor-pointer flex-1 min-w-[200px] max-w-[280px] ${
                        isCurrent
                          ? 'bg-white border-[#C87D32] shadow-xs ring-1 ring-[#C87D32]'
                          : 'bg-white/90 hover:bg-white border-[#E0D5C7]'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-1 mb-1">
                        <span className="text-[10px] uppercase font-bold text-[#8C4F1A] truncate">
                          {rc.roaster}
                        </span>
                        {rc.isRecommended && (
                          <span className="text-[9px] font-bold px-1.5 py-0.2 bg-amber-100 text-amber-900 rounded-full flex items-center gap-0.5">
                            ★ Recommended
                          </span>
                        )}
                      </div>
                      <div className="font-serif text-xs font-bold text-[#2B1D14] truncate">
                        {rc.name}
                      </div>
                      <div className="flex items-center justify-between text-[10px] text-[#7A6757] mt-1">
                        <span>{rc.origin?.country || 'Single Origin'} · {rc.process || 'Washed'}</span>
                        <span className="font-semibold text-[#8C4F1A] font-mono">
                          ★ {rc.generalRating.toFixed(1)} ({rc.ratingsCount})
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>

              {matchingRegistered ? (
                <div className="flex items-start gap-1.5 text-[11px] text-[#3B5A3E] bg-emerald-50/80 p-2 rounded-lg border border-emerald-200">
                  <Check className="w-3.5 h-3.5 shrink-0 mt-0.5 text-emerald-600" />
                  <span>
                    Linked with registered item: <strong>{matchingRegistered.name}</strong> by <strong>{matchingRegistered.roaster}</strong>. General rating is computed from all baristas. (You may still customize the name below to track as your own distinct item).
                  </span>
                </div>
              ) : name.trim() ? (
                <div className="flex items-start gap-1.5 text-[11px] text-[#6B5A4E] bg-white/70 p-2 rounded-lg border border-[#E5DACD]">
                  <Info className="w-3.5 h-3.5 shrink-0 mt-0.5 text-[#C87D32]" />
                  <span>
                    Custom bean: <strong>"{name}"</strong> will be registered as a new item in the community library, tracking its own general rating starting from your review.
                  </span>
                </div>
              ) : null}
            </div>
          )}

          {/* Coffee Name & Roaster */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-semibold text-[#5B473A] uppercase tracking-wider">
                  Coffee Bean Name
                </label>
                {name.trim().length > 1 && (
                  <button
                    type="button"
                    onClick={handleAutoFillSpecs}
                    disabled={isAutoFilling}
                    className="text-[11px] font-semibold text-[#C87D32] hover:text-[#9E5D1D] flex items-center gap-1 transition-colors cursor-pointer disabled:opacity-50"
                    title="Auto-fill origin, process, notes, and specs from online lookup"
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
                placeholder="e.g. Chelbesa Village or Southern Weather"
                className="w-full px-3 py-2 bg-white rounded-lg border border-[#DACDC0] text-sm text-[#2C2118]"
                required
              />
              {autoFillError && (
                <p className="text-[10px] text-red-600 mt-1">{autoFillError}</p>
              )}
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

          {/* Rating (Personal Rating & General Rating) & Roast Date */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-3 bg-white rounded-lg border border-[#E0D5C7] space-y-3">
              <div>
                <StarRatingInput
                  value={userRating}
                  onChange={setUserRating}
                  label="Personal Rating (Your Score)"
                  size="md"
                />
              </div>

              {/* General Rating hooked to average across all user added beans */}
              <div className="pt-2.5 border-t border-[#F0E6DB]">
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-[10px] uppercase font-bold text-[#8C7A6D] tracking-wider">
                    General Rating (Community Avg)
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
                      ? `Avg across all user-added "${matchingRegistered.name}" (${effectiveRatingsCount} ratings)`
                      : userRating > 0
                      ? `Starts with your personal score (${userRating.toFixed(1)} ★)`
                      : 'Will start from your personal rating'}
                  </span>
                </div>
              </div>
            </div>

            <div className="space-y-3">
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

              <div className="p-2.5 bg-[#FAF7F2] rounded-lg border border-[#E5DACD] text-[11px] text-[#6B5A4E] leading-relaxed">
                <span className="font-semibold text-[#2B1D14] block mb-0.5">Rating System:</span>
                Personal rating is your private review. General rating is the live running average across all baristas' beans on Goodbeans.
              </div>
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
