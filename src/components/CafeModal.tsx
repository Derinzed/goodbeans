import React, { useState } from 'react';
import { X, MapPin, Sparkles, Plus, ExternalLink, Search, Check, Info, Loader2 } from 'lucide-react';
import { Cafe, RegisteredCafe } from '../types/coffee';
import { StarRatingInput, StarRatingDisplay } from './StarRating';

interface CafeModalProps {
  initialCafe?: Cafe | null;
  registeredCafes?: RegisteredCafe[];
  onSave: (cafe: Cafe) => void;
  onClose: () => void;
}

const COMMON_VIBES = [
  'Pour Over Specialist',
  'In-House Roastery',
  'Multi-Roaster',
  'Espresso Flights',
  'Work & Laptop Friendly',
  'Lush Plants & Greenery',
  'Natural Light',
  'Outdoor Patio',
  'Vinyl Music',
  'Artisanal Pastries & Food',
  'Cozy Reading Vibe',
  'Architecture & Design',
];

export const CafeModal: React.FC<CafeModalProps> = ({
  initialCafe,
  registeredCafes = [],
  onSave,
  onClose,
}) => {
  const isEditing = Boolean(initialCafe);

  const [name, setName] = useState(initialCafe?.name || '');
  const [address, setAddress] = useState(initialCafe?.address || '');
  const [city, setCity] = useState(initialCafe?.city || '');
  const [country, setCountry] = useState(initialCafe?.country || 'United States');
  const [rating, setRating] = useState<number>(initialCafe?.rating || 4.5);
  const [favoriteDrink, setFavoriteDrink] = useState(initialCafe?.favoriteDrink || '');
  const [roasterOrBeansServed, setRoasterOrBeansServed] = useState(
    initialCafe?.roasterOrBeansServed || ''
  );
  const [dateVisited, setDateVisited] = useState(
    initialCafe?.dateVisited || new Date().toISOString().split('T')[0]
  );
  const [notes, setNotes] = useState(initialCafe?.notes || '');
  const [vibes, setVibes] = useState<string[]>(
    initialCafe?.vibes || ['Pour Over Specialist', 'Natural Light']
  );
  const [customVibeInput, setCustomVibeInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [showAllRegistered, setShowAllRegistered] = useState(false);
  const [isAutoFilling, setIsAutoFilling] = useState(false);
  const [autoFillError, setAutoFillError] = useState<string | null>(null);

  const handleAutoFillSpecs = async () => {
    if (!name.trim()) return;
    setIsAutoFilling(true);
    setAutoFillError(null);
    try {
      const query = city.trim() ? `${name} ${city}` : name.trim();
      const res = await fetch('/api/ai/populate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ itemType: 'cafe', name: query }),
      }).then((r) => r.json());

      if (res && res.success && res.item) {
        const item = res.item;
        if (item.name) setName(item.name);
        if (item.address) setAddress(item.address);
        if (item.city) setCity(item.city);
        if (item.country) setCountry(item.country);
        if (item.favoriteDrink) setFavoriteDrink(item.favoriteDrink);
        if (Array.isArray(item.vibes) && item.vibes.length > 0) {
          setVibes(item.vibes);
        }
        if (item.roasterOrBeansServed) setRoasterOrBeansServed(item.roasterOrBeansServed);
        if (item.notes) setNotes(item.notes);
      } else {
        setAutoFillError('Could not auto-populate cafe specs online.');
      }
    } catch {
      setAutoFillError('Failed to auto-populate specifications.');
    } finally {
      setIsAutoFilling(false);
    }
  };

  // Match against registered items by clean name and city
  const matchingRegistered = registeredCafes.find(
    (rc) =>
      rc.name.toLowerCase() === name.trim().toLowerCase() &&
      (!city.trim() || rc.city.toLowerCase() === city.trim().toLowerCase())
  );

  const effectiveGeneralRating = matchingRegistered && matchingRegistered.ratingsCount > 0
    ? matchingRegistered.generalRating
    : 0;
  const effectiveRatingsCount = matchingRegistered
    ? matchingRegistered.ratingsCount
    : 0;

  const handleSelectRegistered = (rc: RegisteredCafe) => {
    setName(rc.name);
    setCity(rc.city);
    if (rc.country) setCountry(rc.country);
    if (rc.address) setAddress(rc.address);
    if (rc.vibes && rc.vibes.length > 0) setVibes(rc.vibes);
    if (rc.favoriteDrink) setFavoriteDrink(rc.favoriteDrink);
    if (rc.notes) setNotes(rc.notes);
  };

  const toggleVibe = (tag: string) => {
    if (vibes.includes(tag)) {
      setVibes(vibes.filter((v) => v !== tag));
    } else {
      setVibes([...vibes, tag]);
    }
  };

  const handleAddCustomVibe = () => {
    const trimmed = customVibeInput.trim();
    if (trimmed && !vibes.includes(trimmed)) {
      setVibes([...vibes, trimmed]);
      setCustomVibeInput('');
    }
  };

  const getGoogleMapsSearchUrl = () => {
    const query = `${name} ${address} ${city}`.trim();
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const data: Cafe = {
      id: initialCafe?.id || `cafe-${Date.now()}`,
      name: name.trim(),
      address: address.trim(),
      city: city.trim(),
      country: country.trim(),
      rating,
      favoriteDrink: favoriteDrink.trim() || undefined,
      roasterOrBeansServed: roasterOrBeansServed.trim() || undefined,
      dateVisited: dateVisited || undefined,
      notes: notes.trim(),
      vibes,
      googleMapsUrl: getGoogleMapsSearchUrl(),
      isFavorite: initialCafe?.isFavorite || false,
    };
    onSave(data);
  };

  const recommendedItems = registeredCafes.filter((rc) => rc.isRecommended || rc.generalRating >= 4.5);
  const filteredRegistered = registeredCafes.filter((rc) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return rc.name.toLowerCase().includes(q) || rc.city.toLowerCase().includes(q) || rc.country.toLowerCase().includes(q);
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
      <div className="bg-[#FAF7F2] border border-[#E5DACD] w-full max-w-xl rounded-xl shadow-2xl overflow-hidden my-8 animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-[#F3ECE2] border-b border-[#E8DEC0]/50">
          <div>
            <div className="text-[10px] uppercase font-bold tracking-wider text-[#8A6D56]">
              Cafe Shelf
            </div>
            <h2 className="font-serif text-xl font-bold text-[#2B1D14]">
              {isEditing ? 'Edit Visited Cafe' : 'Add Cafe to Shelf'}
            </h2>
            <p className="text-xs text-[#6B5A4E]">
              Pin the address and record your in-person coffee experiences
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
          {/* Running List of Registered Cafes & Recommendations */}
          {!isEditing && registeredCafes.length > 0 && (
            <div className="p-3 bg-[#FAF3EC] rounded-xl border border-[#E8DACB] space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-[#C87D32]" />
                  <span className="text-xs font-bold text-[#2B1D14] uppercase tracking-wider">
                    Community Registered Cafes & Picks
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setShowAllRegistered(!showAllRegistered)}
                  className="text-[11px] font-semibold text-[#C87D32] hover:text-[#9E5D1D] transition-colors cursor-pointer"
                >
                  {showAllRegistered ? 'Show Recommendations' : `Browse All (${registeredCafes.length})`}
                </button>
              </div>

              {showAllRegistered && (
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-[#8C7A6D] absolute left-2.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search cafes by name, city, or country..."
                    className="w-full pl-8 pr-3 py-1.5 bg-white rounded-lg border border-[#DACDC0] text-xs text-[#2C2118] focus:outline-none focus:ring-1 focus:ring-[#C87D32]"
                  />
                </div>
              )}

              {/* Cafe chips/cards */}
              <div className="flex gap-2 overflow-x-auto pb-1 max-h-40 flex-wrap">
                {(showAllRegistered ? filteredRegistered : recommendedItems).map((rc) => {
                  const isCurrent = name.trim().toLowerCase() === rc.name.toLowerCase();
                  return (
                    <button
                      key={rc.id}
                      type="button"
                      onClick={() => handleSelectRegistered(rc)}
                      className={`text-left p-2 rounded-lg border transition-all cursor-pointer flex-1 min-w-[190px] max-w-[260px] ${
                        isCurrent
                          ? 'bg-white border-[#C87D32] shadow-xs ring-1 ring-[#C87D32]'
                          : 'bg-white/90 hover:bg-white border-[#E0D5C7]'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-1 mb-0.5">
                        <span className="text-[10px] uppercase font-bold text-[#8C4F1A] truncate">
                          {rc.city}, {rc.country}
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
                      <div className="text-[10px] text-[#7A6757] mt-0.5 font-semibold text-[#8C4F1A] font-mono">
                        General Rating: ★ {rc.generalRating.toFixed(1)} ({rc.ratingsCount} visits)
                      </div>
                    </button>
                  );
                })}
              </div>

              {matchingRegistered ? (
                <div className="flex items-start gap-1.5 text-[11px] text-[#3B5A3E] bg-emerald-50/80 p-2 rounded-lg border border-emerald-200">
                  <Check className="w-3.5 h-3.5 shrink-0 mt-0.5 text-emerald-600" />
                  <span>
                    Linked with registered cafe: <strong>{matchingRegistered.name}</strong> ({matchingRegistered.city}). General rating averaged from all coffee travelers.
                  </span>
                </div>
              ) : name.trim() ? (
                <div className="flex items-start gap-1.5 text-[11px] text-[#6B5A4E] bg-white/70 p-2 rounded-lg border border-[#E5DACD]">
                  <Info className="w-3.5 h-3.5 shrink-0 mt-0.5 text-[#C87D32]" />
                  <span>
                    Custom spot: <strong>"{name}"</strong> will be added to the community registry as a new spot to track.
                  </span>
                </div>
              ) : null}
            </div>
          )}

          {/* Cafe Name */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-semibold text-[#5B473A] uppercase tracking-wider">
                Cafe Name
              </label>
              {name.trim().length > 1 && (
                <button
                  type="button"
                  onClick={handleAutoFillSpecs}
                  disabled={isAutoFilling}
                  className="text-[11px] font-semibold text-[#C87D32] hover:text-[#9E5D1D] flex items-center gap-1 transition-colors cursor-pointer disabled:opacity-50"
                  title="Auto-fill address, city, country, signature drinks, vibes, and notes from online lookup"
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
              placeholder="e.g. Sey Coffee, Tim Wendelboe, Heart..."
              className="w-full px-3 py-2 bg-white rounded-lg border border-[#DACDC0] text-sm text-[#2C2118]"
              required
            />
            {autoFillError && (
              <p className="text-[10px] text-red-600 mt-1">{autoFillError}</p>
            )}
          </div>

          {/* Address & City */}
          <div className="p-4 bg-white rounded-xl border border-[#E0D5C7] space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#6B5341] uppercase tracking-wider flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-[#C87D32]" />
                <span>Google Maps Location & Pin</span>
              </span>
              {address && (
                <a
                  href={getGoogleMapsSearchUrl()}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[11px] text-[#C87D32] hover:underline flex items-center gap-1 font-medium"
                >
                  <ExternalLink className="w-3 h-3" /> Test Google Maps Pin
                </a>
              )}
            </div>

            <div>
              <label className="block text-xs text-[#6B5749] mb-1">Street Address</label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="e.g. 18 Grattan St or Olaf Ryes plass 3A"
                className="w-full px-2.5 py-1.5 bg-[#FAF7F2] rounded border border-[#D5C7B8] text-xs text-[#2C2017]"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-[#6B5749] mb-1">City & State</label>
                <input
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="e.g. Brooklyn, NY or Oslo"
                  className="w-full px-2.5 py-1.5 bg-[#FAF7F2] rounded border border-[#D5C7B8] text-xs text-[#2C2017]"
                  required
                />
              </div>

              <div>
                <label className="block text-xs text-[#6B5749] mb-1">Country</label>
                <input
                  type="text"
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  placeholder="e.g. United States, Norway, Japan"
                  className="w-full px-2.5 py-1.5 bg-[#FAF7F2] rounded border border-[#D5C7B8] text-xs text-[#2C2017]"
                />
              </div>
            </div>
          </div>

          {/* Dual Rating: Personal & General */}
          <div className="p-3.5 bg-white rounded-lg border border-[#E0D5C7] space-y-3">
            <StarRatingInput
              value={rating}
              onChange={setRating}
              label="Personal Cafe Rating (Your Experience)"
              size="md"
            />

            <div className="pt-2.5 border-t border-[#F0E6DB]">
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="text-[10px] uppercase font-bold text-[#8C7A6D] tracking-wider">
                  General Rating (Average Across All Visits)
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
                    ? `Live average across ${effectiveRatingsCount} barista visits`
                    : rating > 0
                    ? `Starts at your personal rating (${rating.toFixed(1)} ★)`
                    : 'Community average across all user-added cafes'}
                </span>
              </div>
            </div>
          </div>

          {/* Favorite Drink & Roastery info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[#5B473A] uppercase tracking-wider mb-1">
                Favorite Drink Ordered
              </label>
              <input
                type="text"
                value={favoriteDrink}
                onChange={(e) => setFavoriteDrink(e.target.value)}
                placeholder="e.g. Washed Ethiopian Pour Over & Cortado"
                className="w-full px-3 py-2 bg-white rounded-lg border border-[#DACDC0] text-sm text-[#2C2118]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#5B473A] uppercase tracking-wider mb-1">
                Roasteries / Beans Served
              </label>
              <input
                type="text"
                value={roasterOrBeansServed}
                onChange={(e) => setRoasterOrBeansServed(e.target.value)}
                placeholder="e.g. Roasted on site, or DAK / Sey"
                className="w-full px-3 py-2 bg-white rounded-lg border border-[#DACDC0] text-sm text-[#2C2118]"
              />
            </div>
          </div>

          {/* Date Visited */}
          <div>
            <label className="block text-xs font-semibold text-[#5B473A] uppercase tracking-wider mb-1">
              Date Visited
            </label>
            <input
              type="date"
              value={dateVisited}
              onChange={(e) => setDateVisited(e.target.value)}
              className="w-full px-3 py-2 bg-white rounded-lg border border-[#DACDC0] text-sm text-[#2C2118]"
            />
          </div>

          {/* Vibe Tags */}
          <div className="space-y-2">
            <label className="block text-xs font-semibold text-[#5B473A] uppercase tracking-wider">
              Cafe Vibes & Features
            </label>

            <div className="flex flex-wrap gap-1.5 min-h-6">
              {vibes.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => toggleVibe(tag)}
                  className="px-2.5 py-1 rounded-md text-xs font-medium bg-[#3A291E] text-white flex items-center gap-1"
                >
                  {tag}
                  <X className="w-3 h-3 opacity-70" />
                </button>
              ))}
            </div>

            <div className="flex flex-wrap gap-1 max-h-24 overflow-y-auto p-1 bg-[#F5ECE1] rounded-lg border border-[#E5DACD]">
              {COMMON_VIBES.map((v) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => toggleVibe(v)}
                  className={`text-[11px] px-2 py-0.5 rounded transition-all ${
                    vibes.includes(v)
                      ? 'bg-[#8B4822] text-white'
                      : 'bg-white hover:bg-[#FAF7F2] text-[#4F3C2F] border border-[#DECFC0]'
                  }`}
                >
                  {v}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2 pt-1">
              <input
                type="text"
                value={customVibeInput}
                onChange={(e) => setCustomVibeInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddCustomVibe();
                  }
                }}
                placeholder="Or type custom vibe tag..."
                className="flex-1 px-3 py-1.5 bg-white rounded-md border border-[#D5C7B8] text-xs text-[#2C2017]"
              />
              <button
                type="button"
                onClick={handleAddCustomVibe}
                className="px-3 py-1.5 bg-[#523F32] hover:bg-[#3D2D23] text-white text-xs font-semibold rounded-md flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" /> Add
              </button>
            </div>
          </div>

          {/* Personal Review & Notes */}
          <div>
            <label className="block text-xs font-semibold text-[#5B473A] uppercase tracking-wider mb-1">
              Barista Review & Atmosphere Notes
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Gorgeous sunlit loft with lush plants. The barista explained the elevation and variety of each coffee on the menu. Unrivaled pour over clarity."
              rows={3}
              className="w-full px-3 py-2 bg-white rounded-lg border border-[#DACDC0] text-sm text-[#2C2118] focus:outline-none focus:ring-2 focus:ring-[#C87D32]/40"
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
              {isEditing ? 'Save Cafe Changes' : 'Add to Cafe Shelf'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
