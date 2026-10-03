import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  X,
  Search,
  Check,
  Coffee,
  Wrench,
  MapPin,
  FileText,
  Loader2,
  ArrowRight,
  ExternalLink,
  Edit3,
  Info,
} from 'lucide-react';
import {
  Coffee as CoffeeType,
  Equipment,
  Cafe,
  CustomNote,
  BrewRecipe,
  RegisteredCoffee,
  RegisteredEquipment,
  RegisteredCafe,
} from '../types/coffee';
import { authApi } from '../services/authApi';

type ShelfItemType = 'coffee' | 'equipment' | 'cafe' | 'note';

interface AutoPopulateShelfWidgetProps {
  currentView: 'shelves' | 'coffee-detail' | 'equipment' | 'cafes' | 'notes' | 'public-profile';
  activeShelfId: string;
  registeredCoffees?: RegisteredCoffee[];
  registeredEquipment?: RegisteredEquipment[];
  registeredCafes?: RegisteredCafe[];
  onAddCoffee: (coffee: CoffeeType) => void;
  onAddEquipment: (equipment: Equipment) => void;
  onAddCafe: (cafe: Cafe) => void;
  onAddNote: (note: CustomNote) => void;
  onOpenEditCoffee?: (coffee: CoffeeType) => void;
  onOpenEditEquipment?: (equipment: Equipment) => void;
  onOpenEditCafe?: (cafe: Cafe) => void;
  onOpenEditNote?: (note: CustomNote) => void;
}

export const AutoPopulateShelfWidget: React.FC<AutoPopulateShelfWidgetProps> = ({
  currentView,
  activeShelfId,
  registeredCoffees = [],
  registeredEquipment = [],
  registeredCafes = [],
  onAddCoffee,
  onAddEquipment,
  onAddCafe,
  onAddNote,
  onOpenEditCoffee,
  onOpenEditEquipment,
  onOpenEditCafe,
  onOpenEditNote,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [itemType, setItemType] = useState<ShelfItemType>('coffee');
  const [queryName, setQueryName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generatedResult, setGeneratedResult] = useState<any | null>(null);
  const [addedSuccess, setAddedSuccess] = useState(false);
  const [unificationMatch, setUnificationMatch] = useState<any | null>(null);
  const [useUnifiedName, setUseUnifiedName] = useState<boolean>(true);

  // Automatically sync item type with whichever shelf tab the user is on!
  useEffect(() => {
    if (currentView === 'equipment') {
      setItemType('equipment');
    } else if (currentView === 'cafes') {
      setItemType('cafe');
    } else if (currentView === 'notes') {
      setItemType('note');
    } else {
      setItemType('coffee');
    }
  }, [currentView]);

  const getPlaceholder = () => {
    switch (itemType) {
      case 'coffee':
        return 'e.g. Sey Coffee Chelbesa Washed, Onyx Southern Weather...';
      case 'equipment':
        return 'e.g. Fellow Ode Gen 2, Comandante C40 MK4, Acaia Lunar...';
      case 'cafe':
        return 'e.g. Sey Coffee Brooklyn, Proud Mary Melbourne, Tim Wendelboe Oslo...';
      case 'note':
        return 'e.g. Lotus water drops for light roast, Aeropress inverted recipe...';
    }
  };

  const getItemTypeLabel = (type: ShelfItemType) => {
    switch (type) {
      case 'coffee':
        return 'Coffee';
      case 'equipment':
        return 'Equipment';
      case 'cafe':
        return 'Cafe';
      case 'note':
        return 'Note';
    }
  };

  const handleExecutePopulate = async (customQuery?: string, customType?: ShelfItemType) => {
    const targetQuery = (customQuery !== undefined ? customQuery : queryName).trim();
    const targetType = customType || itemType;
    if (!targetQuery) return;

    if (customQuery !== undefined) {
      setQueryName(customQuery);
    }
    if (customType) {
      setItemType(customType);
    }

    setIsLoading(true);
    setError(null);
    setGeneratedResult(null);
    setAddedSuccess(false);
    setUnificationMatch(null);
    setUseUnifiedName(true);

    try {
      // 1. Check unification against registered items
      const unifyPromise = authApi.unifyItem(targetQuery, targetType as any).catch(() => null);

      // 2. Query AI/heuristic specifications
      const popPromise = fetch('/api/ai/populate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ itemType: targetType, name: targetQuery }),
      }).then((r) => r.json());

      const [unifyData, popData] = await Promise.all([unifyPromise, popPromise]);

      if (unifyData?.isConfidentMatch && unifyData.matchedItem) {
        setUnificationMatch(unifyData.matchedItem);
        setUseUnifiedName(true);
      }

      if (!popData || !popData.success) {
        throw new Error(popData?.error || 'Failed to auto-populate item specifications');
      }

      setGeneratedResult(popData.item);
    } catch (err: any) {
      console.error(err);
      setError(
        err.message || 'Could not fetch information online. Please check the name and try again.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    await handleExecutePopulate();
  };

  const handleConfirmAdd = () => {
    if (!generatedResult) return;

    const idSuffix = Date.now().toString();

    // Determine final name and attributes based on user's choice: unified vs custom name
    const finalName = useUnifiedName && unificationMatch ? unificationMatch.name : (generatedResult.name || queryName);
    const isUnified = Boolean(useUnifiedName && unificationMatch);

    if (itemType === 'coffee') {
      const finalRoaster = isUnified && unificationMatch?.roaster ? unificationMatch.roaster : (generatedResult.roaster || 'Specialty Roaster');
      const finalGeneralRating = isUnified && unificationMatch && unificationMatch.ratingsCount > 0 && typeof unificationMatch.generalRating === 'number' ? unificationMatch.generalRating : 0;
      const finalRatingsCount = isUnified && unificationMatch && typeof unificationMatch.ratingsCount === 'number' ? unificationMatch.ratingsCount : 0;

      const coffeeObj: CoffeeType = {
        id: `coffee-ai-${idSuffix}`,
        name: finalName,
        roaster: finalRoaster,
        origin: {
          country: isUnified && unificationMatch?.origin?.country ? unificationMatch.origin.country : (generatedResult.origin?.country || 'Single Origin'),
          region: generatedResult.origin?.region,
          farmOrStation: generatedResult.origin?.farmOrStation,
          producer: generatedResult.origin?.producer,
          elevationMeters: generatedResult.origin?.elevationMeters,
        },
        variety: generatedResult.variety || 'Heirloom',
        process: generatedResult.process || 'Washed',
        roastLevel: generatedResult.roastLevel || 'Light',
        tastingNotesSummary: generatedResult.tastingNotesSummary || ['Citrus', 'Floral', 'Sweet'],
        description: generatedResult.description || '',
        bagBadgeText: generatedResult.bagBadgeText || (isUnified ? 'Community' : 'Specialty'),
        coverColor: generatedResult.coverColor || '#3B291E',
        userRating: 0,
        generalRating: finalGeneralRating,
        communityRating: finalGeneralRating,
        communityRatingsCount: finalRatingsCount,
        shelfIds: [activeShelfId === 'all' ? 'currently-drinking' : activeShelfId],
        dateAdded: new Date().toISOString().split('T')[0],
        isFavorite: false,
        isRegistered: isUnified,
        tastingLogs: [],
        recipes: generatedResult.recommendedRecipe
          ? [
              {
                id: `recipe-${idSuffix}`,
                coffeeId: `coffee-ai-${idSuffix}`,
                title: generatedResult.recommendedRecipe.title || 'Recommended V60 Dial-In',
                method: generatedResult.recommendedRecipe.method || 'v60',
                doseGrams: generatedResult.recommendedRecipe.doseGrams || 15,
                waterGrams: generatedResult.recommendedRecipe.waterGrams || 250,
                ratio: generatedResult.recommendedRecipe.ratio || '1:16.7',
                grindSize: generatedResult.recommendedRecipe.grindSize || 'Medium-Fine',
                waterTempC: generatedResult.recommendedRecipe.waterTempC || 93,
                totalTimeSeconds: generatedResult.recommendedRecipe.totalTimeSeconds || 195,
                bloomGrams: generatedResult.recommendedRecipe.bloomGrams || 45,
                bloomTimeSeconds: generatedResult.recommendedRecipe.bloomTimeSeconds || 40,
                equipmentIds: [],
                customVariables: generatedResult.recommendedRecipe.customVariables || [],
                steps: generatedResult.recommendedRecipe.steps || [],
                notes: generatedResult.recommendedRecipe.notes,
                isRecommended: true,
                createdAt: new Date().toISOString(),
              },
            ]
          : [],
      };
      onAddCoffee(coffeeObj);
      if (isUnified) {
        authApi.registerCommunityItem('coffee', coffeeObj, undefined, undefined, true).catch(() => {});
      }
    } else if (itemType === 'equipment') {
      const finalBrand = isUnified && unificationMatch?.brand ? unificationMatch.brand : (generatedResult.brand || 'Gear Brand');
      const finalGeneralRating = isUnified && unificationMatch && unificationMatch.ratingsCount > 0 && typeof unificationMatch.generalRating === 'number' ? unificationMatch.generalRating : 0;
      const finalRatingsCount = isUnified && unificationMatch && typeof unificationMatch.ratingsCount === 'number' ? unificationMatch.ratingsCount : 0;

      const eqObj: Equipment = {
        id: `eq-ai-${idSuffix}`,
        name: finalName,
        brand: finalBrand,
        category: generatedResult.category || (isUnified ? unificationMatch.category : 'Accessory'),
        status: 'Active',
        settingsNotes: generatedResult.settingsNotes || (isUnified ? unificationMatch.settingsNotes : ''),
        maintenanceNotes: generatedResult.maintenanceNotes || '',
        generalNotes: generatedResult.generalNotes || '',
        rating: 0,
        generalRating: finalGeneralRating,
        generalRatingsCount: finalRatingsCount,
        isRegistered: isUnified,
        dateAcquired: new Date().toISOString().split('T')[0],
      };
      onAddEquipment(eqObj);
      if (isUnified) {
        authApi.registerCommunityItem('equipment', eqObj, 0, undefined, true).catch(() => {});
      }
    } else if (itemType === 'cafe') {
      const finalCity = isUnified && unificationMatch?.city ? unificationMatch.city : (generatedResult.city || 'City');
      const finalGeneralRating = isUnified && unificationMatch && unificationMatch.ratingsCount > 0 && typeof unificationMatch.generalRating === 'number' ? unificationMatch.generalRating : 0;
      const finalRatingsCount = isUnified && unificationMatch && typeof unificationMatch.ratingsCount === 'number' ? unificationMatch.ratingsCount : 0;

      const cafeObj: Cafe = {
        id: `cafe-ai-${idSuffix}`,
        name: finalName,
        address: generatedResult.address || (isUnified ? unificationMatch.address : 'Address unlisted'),
        city: finalCity,
        country: generatedResult.country || 'Country',
        rating: 0,
        generalRating: finalGeneralRating,
        generalRatingsCount: finalRatingsCount,
        favoriteDrink: generatedResult.favoriteDrink,
        vibes: generatedResult.vibes || (isUnified ? unificationMatch.vibes : ['Specialty Coffee']),
        notes: generatedResult.notes || '',
        roasterOrBeansServed: generatedResult.roasterOrBeansServed,
        dateVisited: new Date().toISOString().split('T')[0],
        googleMapsUrl: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
          `${finalName} ${generatedResult.address || ''} ${finalCity}`
        )}`,
        isRegistered: isUnified,
      };
      onAddCafe(cafeObj);
      if (isUnified) {
        authApi.registerCommunityItem('cafe', cafeObj, 0, undefined, true).catch(() => {});
      }
    } else {
      const noteObj: CustomNote = {
        id: `note-ai-${idSuffix}`,
        title: generatedResult.title || queryName,
        category: generatedResult.category || 'Brew Technique',
        content: generatedResult.content || '',
        tags: generatedResult.tags || ['Specialty'],
        isPinned: generatedResult.isPinned || false,
        date: new Date().toISOString().split('T')[0],
      };
      onAddNote(noteObj);
    }

    setAddedSuccess(true);
    setTimeout(() => {
      setGeneratedResult(null);
      setUnificationMatch(null);
      setQueryName('');
      setAddedSuccess(false);
      setIsOpen(false);
    }, 1200);
  };

  return (
    <>
      {/* Floating Trigger Button in Bottom Right */}
      <div className="fixed bottom-6 right-6 z-40">
        {!isOpen ? (
          <button
            onClick={() => setIsOpen(true)}
            className="flex items-center gap-2 px-4 py-3 bg-[#2B1D14] hover:bg-[#3D291C] text-white rounded-full shadow-xl hover:shadow-2xl border border-[#D5C4B2]/40 transition-all hover:scale-105 group cursor-pointer"
            title="Auto-populate item from online information"
          >
            <div className="p-1 rounded-full bg-[#C87D32] text-white group-hover:rotate-12 transition-transform">
              <Sparkles className="w-4 h-4" />
            </div>
            <span className="text-xs font-semibold tracking-wide pr-1">
              Auto-Add {getItemTypeLabel(itemType)}
            </span>
          </button>
        ) : (
          /* Single-Input Auto-Populate Card */
          <div className="bg-[#FAF7F2] border border-[#D5C4B2] w-96 max-w-[calc(100vw-3rem)] rounded-2xl shadow-2xl overflow-hidden animate-fade-in flex flex-col max-h-[85vh]">
            {/* Card Header */}
            <div className="flex items-center justify-between px-4 py-3 bg-[#F3ECE2] border-b border-[#E5DACD]">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-[#2B1D14] text-white">
                  <Sparkles className="w-3.5 h-3.5 text-[#C87D32]" />
                </div>
                <div>
                  <h3 className="font-serif text-sm font-bold text-[#2B1D14]">
                    Auto-Add to Shelf
                  </h3>
                  <p className="text-[10px] text-[#7A6757]">
                    Online lookup & field auto-population
                  </p>
                </div>
              </div>

              <button
                onClick={() => {
                  setIsOpen(false);
                  setGeneratedResult(null);
                  setError(null);
                }}
                className="p-1 text-[#8C7A6D] hover:text-[#2B1D14] rounded-md transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Target Item Type Selector Tabs */}
            <div className="flex items-center justify-between bg-white border-b border-[#EDE2D4] p-1 text-[11px] font-medium text-[#7A6757]">
              {(['coffee', 'equipment', 'cafe', 'note'] as ShelfItemType[]).map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => {
                    setItemType(type);
                    setGeneratedResult(null);
                    setError(null);
                  }}
                  className={`flex-1 py-1.5 px-2 rounded-lg text-center transition-all ${
                    itemType === type
                      ? 'bg-[#3A291E] text-white font-semibold shadow-2xs'
                      : 'hover:bg-[#FAF7F2] text-[#6B5A4E]'
                  }`}
                >
                  {getItemTypeLabel(type)}
                </button>
              ))}
            </div>

            {/* Form Body */}
            <div className="p-4 space-y-3 overflow-y-auto">
              {!generatedResult ? (
                <form onSubmit={handleGenerate} className="space-y-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-[#5B473A] uppercase tracking-wider mb-1">
                      {getItemTypeLabel(itemType)} Name or Release
                    </label>
                    <input
                      type="text"
                      value={queryName}
                      onChange={(e) => setQueryName(e.target.value)}
                      placeholder={getPlaceholder()}
                      disabled={isLoading}
                      className="w-full px-3 py-2 bg-white rounded-lg border border-[#DACDC0] text-xs text-[#2C2118] focus:outline-none focus:ring-2 focus:ring-[#C87D32]/40"
                      autoFocus
                    />
                    <p className="text-[10px] text-[#8C7A6D] mt-1">
                      Specifications, origin details, flavor notes, and recipes will be gathered online.
                    </p>

                    {/* Recommended items to Auto-Add */}
                    {itemType === 'coffee' && registeredCoffees.length > 0 && (
                      <div className="pt-2">
                        <span className="text-[9px] uppercase font-bold text-[#8C7A6D] block mb-1">
                          Recommended from Community Catalog (Click to Auto-Fill):
                        </span>
                        <div className="flex flex-wrap gap-1">
                          {registeredCoffees.slice(0, 4).map((c) => (
                            <button
                              key={c.id}
                              type="button"
                              onClick={() => handleExecutePopulate(`${c.roaster} ${c.name}`, 'coffee')}
                              className="text-[10px] px-2 py-0.5 bg-[#F2E8DC] hover:bg-[#E2D2BF] text-[#4A3728] rounded-md transition-colors truncate max-w-[200px] cursor-pointer font-medium border border-[#DACDC0]/60 hover:border-[#C87D32]"
                              title={`Auto-populate ${c.roaster} ${c.name}`}
                            >
                              ★ {c.generalRating.toFixed(1)} {c.name}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                    {itemType === 'equipment' && registeredEquipment.length > 0 && (
                      <div className="pt-2">
                        <span className="text-[9px] uppercase font-bold text-[#8C7A6D] block mb-1">
                          Recommended Gear (Click to Auto-Fill):
                        </span>
                        <div className="flex flex-wrap gap-1">
                          {registeredEquipment.slice(0, 4).map((e) => (
                            <button
                              key={e.id}
                              type="button"
                              onClick={() => handleExecutePopulate(`${e.brand} ${e.name}`, 'equipment')}
                              className="text-[10px] px-2 py-0.5 bg-[#F2E8DC] hover:bg-[#E2D2BF] text-[#4A3728] rounded-md transition-colors truncate max-w-[200px] cursor-pointer font-medium border border-[#DACDC0]/60 hover:border-[#C87D32]"
                              title={`Auto-populate ${e.brand} ${e.name}`}
                            >
                              ★ {e.generalRating.toFixed(1)} {e.name}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                    {itemType === 'cafe' && registeredCafes.length > 0 && (
                      <div className="pt-2">
                        <span className="text-[9px] uppercase font-bold text-[#8C7A6D] block mb-1">
                          Recommended Cafes (Click to Auto-Fill):
                        </span>
                        <div className="flex flex-wrap gap-1">
                          {registeredCafes.slice(0, 4).map((c) => (
                            <button
                              key={c.id}
                              type="button"
                              onClick={() => handleExecutePopulate(`${c.name} ${c.city}`, 'cafe')}
                              className="text-[10px] px-2 py-0.5 bg-[#F2E8DC] hover:bg-[#E2D2BF] text-[#4A3728] rounded-md transition-colors truncate max-w-[200px] cursor-pointer font-medium border border-[#DACDC0]/60 hover:border-[#C87D32]"
                              title={`Auto-populate ${c.name} (${c.city})`}
                            >
                              ★ {c.generalRating.toFixed(1)} {c.name}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {error && (
                    <div className="p-2.5 bg-red-50 border border-red-200 rounded-lg text-[11px] text-red-700 leading-snug">
                      {error}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={isLoading || !queryName.trim()}
                    className="w-full py-2.5 bg-[#C87D32] hover:bg-[#B06B26] disabled:opacity-50 text-white text-xs font-semibold rounded-lg shadow-sm transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Searching online & populating fields...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>Gather Info & Auto-Populate</span>
                      </>
                    )}
                  </button>
                </form>
              ) : (
                /* Auto-Populated Result Preview */
                <div className="space-y-3 animate-fade-in">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] uppercase font-bold tracking-wider text-[#355E3B] bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded flex items-center gap-1">
                      <Check className="w-3 h-3 text-emerald-600" />
                      Auto-Populated Specs
                    </span>
                    <button
                      onClick={() => setGeneratedResult(null)}
                      className="text-[10px] text-[#8C7A6D] hover:underline"
                    >
                      Search Another
                    </button>
                  </div>

                  {/* Name Unification Card if confident match was found */}
                  {unificationMatch && (
                    <div className="p-3 bg-amber-50/95 border border-amber-200/90 rounded-xl space-y-2">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-amber-900">
                        <Sparkles className="w-3.5 h-3.5 text-[#C87D32]" />
                        <span>Name Unification Match Detected</span>
                      </div>
                      <p className="text-[11px] text-amber-800 leading-snug">
                        Another user has already added this item before:
                        <strong> {unificationMatch.name}</strong> ({unificationMatch.roaster || unificationMatch.brand || unificationMatch.city}).
                        General community rating: {unificationMatch.ratingsCount > 0 ? (
                          <>
                            <strong>★ {unificationMatch.generalRating?.toFixed(1)}</strong> ({unificationMatch.ratingsCount} {unificationMatch.ratingsCount === 1 ? 'barista' : 'baristas'}).
                          </>
                        ) : (
                          <strong>Unrated (0 baristas).</strong>
                        )}
                      </p>
                      <div className="flex flex-col gap-1.5 pt-1 text-[11px]">
                        <button
                          type="button"
                          onClick={() => setUseUnifiedName(true)}
                          className={`py-1.5 px-2.5 rounded-md font-semibold text-center transition-all cursor-pointer ${
                            useUnifiedName
                              ? 'bg-[#3A291E] text-white shadow-xs'
                              : 'bg-white text-[#5B473A] border border-amber-300 hover:bg-amber-100'
                          }`}
                        >
                          ✓ Use Unified Name ({unificationMatch.name})
                        </button>
                        <button
                          type="button"
                          onClick={() => setUseUnifiedName(false)}
                          className={`py-1.5 px-2.5 rounded-md font-semibold text-center transition-all cursor-pointer ${
                            !useUnifiedName
                              ? 'bg-[#C87D32] text-white shadow-xs'
                              : 'bg-white text-[#5B473A] border border-amber-300 hover:bg-amber-100'
                          }`}
                        >
                          Keep My Custom Name ("{queryName}")
                        </button>
                      </div>
                      {!useUnifiedName && (
                        <p className="text-[10px] text-[#7A6757] italic leading-tight">
                          * Will be tracked as a new distinct item in the library with your custom name.
                        </p>
                      )}
                    </div>
                  )}

                  {/* Summary Card based on Type */}
                  <div className="p-3 bg-white rounded-xl border border-[#DACDC0] space-y-2 text-xs">
                    {itemType === 'coffee' && (
                      <>
                        <div>
                          <div className="text-[10px] uppercase font-bold text-[#8C4F1A]">
                            {generatedResult.roaster}
                          </div>
                          <div className="font-serif text-base font-bold text-[#2B1D14]">
                            {generatedResult.name}
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-1 text-[10px] text-[#6B5A4E]">
                          <span className="bg-[#FAF7F2] px-1.5 py-0.5 rounded border border-[#EDE2D4]">
                            {generatedResult.origin?.country}
                            {generatedResult.origin?.region ? ` · ${generatedResult.origin.region}` : ''}
                          </span>
                          <span className="bg-[#FAF7F2] px-1.5 py-0.5 rounded border border-[#EDE2D4]">
                            {generatedResult.process}
                          </span>
                          <span className="bg-[#FAF7F2] px-1.5 py-0.5 rounded border border-[#EDE2D4]">
                            {generatedResult.variety}
                          </span>
                          {generatedResult.origin?.elevationMeters && (
                            <span className="bg-[#FAF7F2] px-1.5 py-0.5 rounded border border-[#EDE2D4]">
                              {generatedResult.origin.elevationMeters}m
                            </span>
                          )}
                        </div>

                        {(generatedResult.origin?.farmOrStation || generatedResult.origin?.producer) && (
                          <div className="text-[10px] text-[#7A6757] italic">
                            {generatedResult.origin?.farmOrStation}
                            {generatedResult.origin?.producer ? ` · Producer: ${generatedResult.origin.producer}` : ''}
                          </div>
                        )}

                        {generatedResult.tastingNotesSummary && (
                          <div className="flex flex-wrap gap-1 pt-1">
                            {generatedResult.tastingNotesSummary.map((flavor: string) => (
                              <span
                                key={flavor}
                                className="text-[10px] px-2 py-0.5 bg-[#FAF1E4] text-[#8C4F1A] font-medium rounded border border-[#E8DEC0]"
                              >
                                {flavor}
                              </span>
                            ))}
                          </div>
                        )}

                        {generatedResult.recommendedRecipe && (
                          <div className="p-2 bg-[#FAF7F2] rounded border border-[#EDE2D4] text-[10px] text-[#554032] flex items-center justify-between">
                            <span className="font-semibold text-[#8C4F1A]">
                              {generatedResult.recommendedRecipe.title || 'Dialed-In V60'}
                            </span>
                            <span className="font-mono">
                              {generatedResult.recommendedRecipe.doseGrams}g : {generatedResult.recommendedRecipe.waterGrams}g ({generatedResult.recommendedRecipe.waterTempC}°C)
                            </span>
                          </div>
                        )}

                        {generatedResult.description && (
                          <p className="text-[11px] text-[#6B5A4E] italic line-clamp-2 border-l-2 border-[#C87D32] pl-2 mt-1">
                            "{generatedResult.description}"
                          </p>
                        )}
                      </>
                    )}

                    {itemType === 'equipment' && (
                      <>
                        <div>
                          <div className="text-[10px] uppercase font-bold text-[#8C4F1A]">
                            {generatedResult.brand} · {generatedResult.category}
                          </div>
                          <div className="font-serif text-base font-bold text-[#2B1D14]">
                            {generatedResult.name}
                          </div>
                        </div>

                        {generatedResult.settingsNotes && (
                          <div className="text-[11px] text-[#554233] bg-[#FAF7F2] p-2 rounded border border-[#EDE2D4]">
                            <span className="text-[9px] uppercase font-bold text-[#8C7A6D] block">
                              Dial-in Guidelines
                            </span>
                            {generatedResult.settingsNotes}
                          </div>
                        )}

                        {generatedResult.generalNotes && (
                          <p className="text-[11px] text-[#6B5A4E] line-clamp-2">
                            {generatedResult.generalNotes}
                          </p>
                        )}
                      </>
                    )}

                    {itemType === 'cafe' && (
                      <>
                        <div>
                          <div className="font-serif text-base font-bold text-[#2B1D14]">
                            {generatedResult.name}
                          </div>
                          <div className="text-[11px] text-[#6B5A4E] flex items-center gap-1 mt-0.5">
                            <MapPin className="w-3 h-3 text-[#C87D32]" />
                            <span>
                              {generatedResult.address}, {generatedResult.city}
                            </span>
                          </div>
                        </div>

                        {generatedResult.favoriteDrink && (
                          <div className="text-[11px] text-[#4A3728] bg-[#FAF7F2] p-2 rounded border border-[#EDE2D4]">
                            <span className="text-[9px] uppercase font-bold text-[#8C7A6D] block">
                              Recommended Order
                            </span>
                            "{generatedResult.favoriteDrink}"
                          </div>
                        )}

                        {generatedResult.vibes && (
                          <div className="flex flex-wrap gap-1">
                            {generatedResult.vibes.map((v: string) => (
                              <span
                                key={v}
                                className="text-[10px] px-1.5 py-0.5 bg-[#FAF7F2] text-[#554032] border border-[#E5DACD] rounded"
                              >
                                {v}
                              </span>
                            ))}
                          </div>
                        )}
                      </>
                    )}

                    {itemType === 'note' && (
                      <>
                        <div>
                          <span className="text-[9px] uppercase font-bold text-[#8C4F1A] bg-[#FAF3EC] px-1.5 py-0.5 rounded border border-[#EDE2D4]">
                            {generatedResult.category}
                          </span>
                          <div className="font-serif text-base font-bold text-[#2B1D14] mt-1">
                            {generatedResult.title}
                          </div>
                        </div>

                        <div className="text-[11px] text-[#4A3B30] font-mono leading-relaxed bg-[#FAF8F5] p-2 rounded border border-[#F0E8DC] line-clamp-4 whitespace-pre-wrap">
                          {generatedResult.content}
                        </div>
                      </>
                    )}
                  </div>

                  {/* Confirmation Button */}
                  <button
                    type="button"
                    onClick={handleConfirmAdd}
                    disabled={addedSuccess}
                    className={`w-full py-2.5 rounded-lg text-xs font-semibold text-white shadow-sm transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                      addedSuccess
                        ? 'bg-emerald-600'
                        : 'bg-[#C87D32] hover:bg-[#B06B26]'
                    }`}
                  >
                    {addedSuccess ? (
                      <>
                        <Check className="w-4 h-4" />
                        <span>Added to {getItemTypeLabel(itemType)} Shelf!</span>
                      </>
                    ) : (
                      <>
                        <Check className="w-4 h-4" />
                        <span>Confirm & Add to Shelf</span>
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </>
  );
};
