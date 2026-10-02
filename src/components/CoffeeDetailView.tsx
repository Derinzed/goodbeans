import React, { useState } from 'react';
import {
  ArrowLeft,
  Heart,
  Plus,
  Play,
  Edit2,
  Calendar,
  Mountain,
  MapPin,
  Sparkles,
  Layers,
  Thermometer,
  Clock,
  Scale,
  Sliders,
  Check,
  ChevronDown,
  Trash2,
  X,
  BookmarkMinus,
  FileText,
  Globe,
} from 'lucide-react';
import { Coffee, BrewRecipe, TastingEntry, Equipment, Shelf, CoffeeCustomNote } from '../types/coffee';
import { CoffeeBagCover } from './CoffeeBagCover';
import { StarRatingDisplay, StarRatingInput } from './StarRating';

interface CoffeeDetailViewProps {
  coffee: Coffee;
  allShelves: Shelf[];
  equipmentList: Equipment[];
  onBack: () => void;
  onUpdateCoffee: (updated: Coffee) => void;
  onOpenAddRecipe: (coffeeId: string) => void;
  onOpenEditRecipe: (recipe: BrewRecipe) => void;
  onDeleteRecipe: (recipeId: string) => void;
  onOpenTastingModal: (coffee: Coffee) => void;
  onDeleteTasting: (tastingId: string) => void;
  onStartBrewSession: (recipe: BrewRecipe, coffee: Coffee) => void;
  onEditCoffee: (coffee: Coffee) => void;
  onRemoveFromShelf?: (coffeeId: string, shelfId: string) => void;
  onRemoveFromAllShelves?: (coffeeId: string) => void;
  onDeleteCoffee?: (coffeeId: string) => void;
}

export const CoffeeDetailView: React.FC<CoffeeDetailViewProps> = ({
  coffee,
  allShelves,
  equipmentList,
  onBack,
  onUpdateCoffee,
  onOpenAddRecipe,
  onOpenEditRecipe,
  onDeleteRecipe,
  onOpenTastingModal,
  onDeleteTasting,
  onStartBrewSession,
  onEditCoffee,
  onRemoveFromShelf,
  onRemoveFromAllShelves,
  onDeleteCoffee,
}) => {
  const [activeTab, setActiveTab] = useState<'recipes' | 'tastings' | 'notes' | 'overview'>('recipes');
  const [isShelfDropdownOpen, setIsShelfDropdownOpen] = useState(false);
  const [isAddingNote, setIsAddingNote] = useState(false);
  const [newNoteTitle, setNewNoteTitle] = useState('');
  const [newNoteContent, setNewNoteContent] = useState('');
  const [newNoteTags, setNewNoteTags] = useState('');
  const [personalTagInput, setPersonalTagInput] = useState('');
  const [isAddingPersonalTag, setIsAddingPersonalTag] = useState(false);

  const handleAddPersonalTag = (tagToAdd?: string) => {
    const rawTag = (tagToAdd !== undefined ? tagToAdd : personalTagInput).trim();
    if (!rawTag) return;
    const currentNotes = coffee.tastingNotesSummary || [];
    if (currentNotes.some((t) => t.toLowerCase() === rawTag.toLowerCase())) {
      setPersonalTagInput('');
      setIsAddingPersonalTag(false);
      return;
    }
    const updatedNotes = [...currentNotes, rawTag];
    onUpdateCoffee({
      ...coffee,
      tastingNotesSummary: updatedNotes,
    });
    setPersonalTagInput('');
    setIsAddingPersonalTag(false);
  };

  const handleRemovePersonalTag = (tagToRemove: string) => {
    const updatedNotes = (coffee.tastingNotesSummary || []).filter(
      (t) => t.toLowerCase() !== tagToRemove.toLowerCase()
    );
    onUpdateCoffee({
      ...coffee,
      tastingNotesSummary: updatedNotes,
    });
  };

  const handleAddCoffeeNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNoteTitle.trim() || !newNoteContent.trim()) return;
    const newNote: CoffeeCustomNote = {
      id: `coffee-note-${Date.now()}`,
      title: newNoteTitle.trim(),
      content: newNoteContent.trim(),
      date: new Date().toISOString().split('T')[0],
      tags: newNoteTags
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean),
    };
    onUpdateCoffee({
      ...coffee,
      customNotes: [newNote, ...(coffee.customNotes || [])],
    });
    setNewNoteTitle('');
    setNewNoteContent('');
    setNewNoteTags('');
    setIsAddingNote(false);
  };

  const handleDeleteCoffeeNote = (noteId: string) => {
    onUpdateCoffee({
      ...coffee,
      customNotes: (coffee.customNotes || []).filter((n) => n.id !== noteId),
    });
  };

  // Toggle favorite
  const toggleFavorite = () => {
    onUpdateCoffee({
      ...coffee,
      isFavorite: !coffee.isFavorite,
    });
  };

  // Update star rating
  const handleRatingChange = (newRating: number) => {
    onUpdateCoffee({
      ...coffee,
      userRating: newRating,
    });
  };

  // Toggle coffee in shelf
  const toggleShelf = (shelfId: string) => {
    if (coffee.shelfIds.includes(shelfId)) {
      if (onRemoveFromShelf) {
        onRemoveFromShelf(coffee.id, shelfId);
        return;
      }
      const newShelfIds = coffee.shelfIds.filter((id) => id !== shelfId);
      if (newShelfIds.length === 0) {
        if (onDeleteCoffee) {
          onDeleteCoffee(coffee.id);
        } else if (onRemoveFromAllShelves) {
          onRemoveFromAllShelves(coffee.id);
        }
        return;
      }
      onUpdateCoffee({
        ...coffee,
        shelfIds: newShelfIds,
      });
      return;
    }

    onUpdateCoffee({
      ...coffee,
      shelfIds: [...coffee.shelfIds, shelfId],
    });
  };

  const handleRemoveAll = () => {
    if (onDeleteCoffee) {
      onDeleteCoffee(coffee.id);
    } else if (onRemoveFromAllShelves) {
      onRemoveFromAllShelves(coffee.id);
    }
    setIsShelfDropdownOpen(false);
  };

  // Compute average sensory scores across tasting logs
  const computeAvgSensory = () => {
    if (coffee.tastingLogs.length === 0) return null;
    const totals = { acidity: 0, sweetness: 0, body: 0, clarity: 0, bitterness: 0 };
    coffee.tastingLogs.forEach((log) => {
      totals.acidity += log.sensoryScores.acidity;
      totals.sweetness += log.sensoryScores.sweetness;
      totals.body += log.sensoryScores.body;
      totals.clarity += log.sensoryScores.clarity;
      totals.bitterness += log.sensoryScores.bitterness;
    });
    const len = coffee.tastingLogs.length;
    return {
      acidity: totals.acidity / len,
      sweetness: totals.sweetness / len,
      body: totals.body / len,
      clarity: totals.clarity / len,
      bitterness: totals.bitterness / len,
    };
  };

  const avgSensory = computeAvgSensory();

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      {/* Navigation Breadcrumb */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#6D5A4E] hover:text-[#2B1D14] transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Coffee Shelves</span>
        </button>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onEditCoffee(coffee)}
            className="px-3 py-1.5 text-xs text-[#523F32] hover:text-[#2B1D14] bg-white hover:bg-[#FAF7F2] border border-[#DACDC0] rounded-lg transition-colors flex items-center gap-1"
          >
            <Edit2 className="w-3.5 h-3.5" />
            Edit Details
          </button>
          <button
            onClick={toggleFavorite}
            className={`p-2 rounded-lg border transition-colors ${
              coffee.isFavorite
                ? 'bg-rose-50 border-rose-200 text-rose-600'
                : 'bg-white border-[#DACDC0] text-[#7A6453] hover:text-rose-600'
            }`}
            title={coffee.isFavorite ? 'Remove from favorites' : 'Add to favorites'}
          >
            <Heart className={`w-4 h-4 ${coffee.isFavorite ? 'fill-current' : ''}`} />
          </button>
          {onDeleteCoffee && (
            <button
              onClick={() => onDeleteCoffee(coffee.id)}
              className="p-2 text-[#9E8B7D] hover:text-rose-700 hover:bg-rose-50 rounded-lg border border-[#DACDC0] transition-colors"
              title="Delete coffee from library"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Main Hero Header (Goodreads-style book presentation) */}
      <div className="bg-white rounded-2xl border border-[#E5DACD] p-6 sm:p-8 shadow-xs flex flex-col md:flex-row gap-8">
        {/* Left: Bag Cover & Shelf Status */}
        <div className="flex flex-col items-center shrink-0">
          <CoffeeBagCover
            name={coffee.name}
            roaster={coffee.roaster}
            originCountry={coffee.origin.country}
            process={coffee.process}
            roastLevel={coffee.roastLevel}
            coverColor={coffee.coverColor}
            badgeText={coffee.bagBadgeText}
            size="lg"
            className="shadow-xl"
          />

          {/* Goodreads Shelf Picker Dropdown */}
          <div className="relative mt-4 w-48">
            <button
              onClick={() => setIsShelfDropdownOpen(!isShelfDropdownOpen)}
              className="w-full px-3 py-2 bg-[#FAF7F2] hover:bg-[#F2E8DC] border border-[#DACDC0] rounded-lg text-xs font-semibold text-[#3A291E] flex items-center justify-between transition-colors shadow-2xs"
            >
              <div className="flex items-center gap-1.5 truncate">
                <Layers className="w-3.5 h-3.5 text-[#C87D32]" />
                <span className="truncate">
                  {coffee.shelfIds.length > 0
                    ? `${coffee.shelfIds.length} Shelves`
                    : 'Unshelved'}
                </span>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-[#7A6453] shrink-0" />
            </button>

            {isShelfDropdownOpen && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-[#DACDC0] rounded-lg shadow-lg z-20 p-2 space-y-1 max-h-64 overflow-y-auto">
                <div className="text-[10px] uppercase font-bold text-[#8C7A6D] px-2 py-1">
                  Add / Remove from Shelves
                </div>
                {allShelves.map((shelf) => {
                  const isInShelf = coffee.shelfIds.includes(shelf.id);
                  return (
                    <button
                      key={shelf.id}
                      onClick={() => toggleShelf(shelf.id)}
                      className="w-full text-left px-2 py-1.5 rounded text-xs flex items-center justify-between hover:bg-[#FAF7F2] text-[#3B291D] transition-colors"
                    >
                      <span className="truncate">{shelf.name}</span>
                      {isInShelf ? (
                        <span className="inline-flex items-center gap-1 text-[11px] text-emerald-700 font-medium">
                          <Check className="w-3.5 h-3.5" />
                        </span>
                      ) : (
                        <span className="text-[10px] text-[#A69587]">Add</span>
                      )}
                    </button>
                  );
                })}

                {coffee.shelfIds.length > 0 && (
                  <div className="pt-1 border-t border-[#EAE0D3]">
                    <button
                      onClick={handleRemoveAll}
                      className="w-full text-left px-2 py-1.5 rounded text-xs text-rose-700 hover:bg-rose-50 flex items-center gap-1.5 transition-colors cursor-pointer"
                      title="Remove coffee from all shelves and delete from library"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Remove from all shelves</span>
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Active Shelves Badges with instant remove X button */}
          {coffee.shelfIds.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1 max-w-[200px] justify-center">
              {coffee.shelfIds.map((sId) => {
                const shelf = allShelves.find((s) => s.id === sId);
                if (!shelf) return null;
                return (
                  <span
                    key={sId}
                    className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 bg-[#FAF1E4] text-[#5A402F] rounded border border-[#E8DACB]"
                  >
                    <span>{shelf.name}</span>
                    <button
                      type="button"
                      onClick={() => toggleShelf(sId)}
                      className="hover:text-rose-700 hover:bg-[#EFE0CE] rounded p-0.5 transition-colors"
                      title={`Remove from ${shelf.name}`}
                    >
                      <X className="w-2.5 h-2.5" />
                    </button>
                  </span>
                );
              })}
            </div>
          )}
        </div>

        {/* Right: Coffee Details & Rating */}
        <div className="flex-1 space-y-5">
          <div>
            <div className="text-xs uppercase tracking-widest font-semibold text-[#8C4F1A]">
              {coffee.roaster}
            </div>
            <h1 className="font-serif text-3xl sm:text-4xl font-bold text-[#2B1D14] tracking-tight leading-tight mt-1">
              {coffee.name}
            </h1>
            <div className="flex flex-wrap items-center gap-2 text-xs text-[#7A6757] mt-2 font-medium">
              <span>{coffee.origin.country}</span>
              {coffee.origin.region && (
                <>
                  <span aria-hidden="true">·</span>
                  <span>{coffee.origin.region}</span>
                </>
              )}
              <span aria-hidden="true">·</span>
              <span>{coffee.process}</span>
              <span aria-hidden="true">·</span>
              <span>{coffee.roastLevel} Roast</span>
              {coffee.origin.elevationMeters && (
                <>
                  <span aria-hidden="true">·</span>
                  <span>{coffee.origin.elevationMeters.toLocaleString()}m</span>
                </>
              )}
            </div>
          </div>

          {/* Dual Panel: General Information (Shared Community Aggregate) & Personal Evaluations */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* 1. General Information (Shared across all entries of this type, server-side aggregate) */}
            <div className="p-4 bg-[#FAF7F2] rounded-xl border border-[#DECFC0] flex flex-col justify-between space-y-4">
              <div>
                <div className="flex items-center justify-between gap-2 mb-2.5 pb-2 border-b border-[#EAE0D3]">
                  <div className="text-[11px] uppercase font-bold text-[#8C4F1A] tracking-wider flex items-center gap-1.5">
                    <Globe className="w-3.5 h-3.5 text-[#C87D32]" />
                    <span>General Information</span>
                  </div>
                  <span className="text-[10px] text-[#8C7A6D] bg-[#F2EAE0] px-2 py-0.5 rounded font-mono font-medium">
                    Server-Side Aggregate
                  </span>
                </div>

                {/* General Rating */}
                <div className="mb-3.5">
                  <div className="text-[10px] uppercase font-bold text-[#8C7A6D] tracking-wider mb-1 flex items-center justify-between">
                    <span>General Rating</span>
                    <span className="text-[10px] text-[#A8988A] lowercase font-normal">all baristas aggregate</span>
                  </div>
                  <StarRatingDisplay
                    rating={coffee.generalRating || coffee.communityRating || 4.5}
                    count={coffee.communityRatingsCount}
                    size="md"
                  />
                </div>

                {/* General Tasting Notes: Top 5 Aggregated */}
                <div>
                  <div className="text-[10px] uppercase font-bold text-[#8C7A6D] tracking-wider mb-1.5 flex items-center justify-between">
                    <span>General Tasting Notes (Top 5)</span>
                    <span className="text-[10px] text-[#A8988A] lowercase font-normal">consensus proper casing</span>
                  </div>
                  {coffee.generalTastingNotes && coffee.generalTastingNotes.length > 0 ? (
                    <div className="flex flex-wrap gap-1.5">
                      {coffee.generalTastingNotes.slice(0, 5).map((note) => {
                        const count = coffee.tastingNotesBreakdown?.find(
                          (b) => b.note.toLowerCase() === note.toLowerCase()
                        )?.count;
                        const isAlreadyInPersonal = (coffee.tastingNotesSummary || []).some(
                          (pt) => pt.toLowerCase() === note.toLowerCase()
                        );
                        return (
                          <button
                            key={note}
                            type="button"
                            onClick={() => !isAlreadyInPersonal && handleAddPersonalTag(note)}
                            className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-lg border transition-all ${
                              isAlreadyInPersonal
                                ? 'bg-[#F2ECE3] text-[#4A3728] border-[#DFCFC0]'
                                : 'bg-[#FAF3EC] hover:bg-[#F2E5D5] text-[#8C4F1A] border-[#E8DACB] hover:border-[#C87D32]'
                            }`}
                            title={
                              isAlreadyInPersonal
                                ? `Already in your personal notes: ${note}`
                                : `Click to add "${note}" to your personal palate notes`
                            }
                          >
                            <span>{note}</span>
                            {count !== undefined && count > 0 && (
                              <span className="text-[10px] px-1.5 py-0.2 bg-[#E6DACB] text-[#554032] rounded-full font-mono font-normal">
                                {count}
                              </span>
                            )}
                            {!isAlreadyInPersonal && (
                              <Plus className="w-2.5 h-2.5 opacity-60 ml-0.5" />
                            )}
                          </button>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-xs text-[#8C7A6D] italic bg-[#F5ECE1] p-2.5 rounded-lg border border-[#E8DEC0]">
                      Awaiting user evaluations. Rate or add personal notes below to contribute to the server-side consensus.
                    </div>
                  )}
                </div>
              </div>

              <div className="text-[10px] text-[#9E8B7D] pt-2 border-t border-[#EAE0D3] leading-relaxed">
                Shared across all entries of this roast on the server. Aggregated live from all baristas' evaluations.
              </div>
            </div>

            {/* 2. Personal Evaluations (User-specific & private) */}
            <div className="p-4 bg-white rounded-xl border border-[#DECFC0] flex flex-col justify-between space-y-4 shadow-2xs">
              <div>
                <div className="flex items-center justify-between gap-2 mb-2.5 pb-2 border-b border-[#F0E6DB]">
                  <div className="text-[11px] uppercase font-bold text-[#2B1D14] tracking-wider flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-[#C87D32]" />
                    <span>Your Personal Evaluations</span>
                  </div>
                  <span className="text-[10px] text-[#8C7A6D] bg-[#FAF5EE] px-2 py-0.5 rounded font-mono font-medium">
                    User-Specific
                  </span>
                </div>

                {/* Personal Rating */}
                <div className="mb-3.5">
                  <StarRatingInput
                    value={coffee.userRating}
                    onChange={handleRatingChange}
                    label="Your Personal Rating"
                    size="md"
                  />
                </div>

                {/* Personal Tasting Notes */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[10px] uppercase font-bold text-[#8C7A6D] tracking-wider">
                      Your Personal Tasting Notes
                    </span>
                    {!isAddingPersonalTag && (
                      <button
                        type="button"
                        onClick={() => setIsAddingPersonalTag(true)}
                        className="text-xs text-[#C87D32] hover:text-[#9B551C] font-semibold inline-flex items-center gap-1 hover:underline"
                      >
                        <Plus className="w-3 h-3" />
                        <span>Add Note</span>
                      </button>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-1.5">
                    {(coffee.tastingNotesSummary || []).map((flavor) => (
                      <span
                        key={flavor}
                        className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1 bg-[#FAF7F2] text-[#3D2C1F] font-medium rounded-md border border-[#E5DACD]"
                      >
                        <span>{flavor}</span>
                        <button
                          type="button"
                          onClick={() => handleRemovePersonalTag(flavor)}
                          className="text-[#A8988A] hover:text-red-700 hover:bg-[#F2E5D5] p-0.5 rounded transition-colors"
                          title={`Remove ${flavor}`}
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}

                    {isAddingPersonalTag ? (
                      <div className="inline-flex items-center gap-1 bg-white p-1 rounded-md border border-[#C87D32] shadow-xs">
                        <input
                          type="text"
                          value={personalTagInput}
                          onChange={(e) => setPersonalTagInput(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              handleAddPersonalTag();
                            } else if (e.key === 'Escape') {
                              setIsAddingPersonalTag(false);
                              setPersonalTagInput('');
                            }
                          }}
                          placeholder="e.g. Jasmine, Stone Fruit"
                          autoFocus
                          className="text-xs px-2 py-0.5 w-36 outline-none bg-transparent text-[#2B1D14]"
                        />
                        <button
                          type="button"
                          onClick={() => handleAddPersonalTag()}
                          className="px-2 py-0.5 bg-[#C87D32] hover:bg-[#B06B26] text-white text-[11px] font-semibold rounded"
                        >
                          Add
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setIsAddingPersonalTag(false);
                            setPersonalTagInput('');
                          }}
                          className="p-1 text-[#8C7A6D] hover:text-[#2B1D14]"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ) : (
                      (coffee.tastingNotesSummary || []).length === 0 && (
                        <span className="text-xs text-[#9E8B7D] italic">
                          No personal notes defined yet. Click "+ Add Note" to log your palate notes.
                        </span>
                      )
                    )}
                  </div>
                </div>
              </div>

              <div className="text-[10px] text-[#9E8B7D] pt-2 border-t border-[#F0E6DB] leading-relaxed">
                Your personal notes are user-specific, saved persistently, and included when exporting or restoring your account data.
              </div>
            </div>
          </div>

          {/* Description */}
          {coffee.description && (
            <p className="text-sm text-[#544337] leading-relaxed font-serif italic border-l-2 border-[#C87D32] pl-3 py-0.5">
              "{coffee.description}"
            </p>
          )}

          {/* Origin & Farm Metadata Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t border-[#EAE0D3] text-xs">
            <div>
              <span className="text-[#8C7A6D] block text-[10px] uppercase font-semibold">
                Variety
              </span>
              <span className="font-medium text-[#2B1D14] truncate block">
                {coffee.variety || 'Heirloom'}
              </span>
            </div>
            <div>
              <span className="text-[#8C7A6D] block text-[10px] uppercase font-semibold">
                Producer / Farm
              </span>
              <span className="font-medium text-[#2B1D14] truncate block">
                {coffee.origin.producer || coffee.origin.farmOrStation || 'Cooperative'}
              </span>
            </div>
            <div>
              <span className="text-[#8C7A6D] block text-[10px] uppercase font-semibold">
                Roast Date
              </span>
              <span className="font-medium text-[#2B1D14] font-mono">
                {coffee.roastDate || 'Not specified'}
              </span>
            </div>
            <div>
              <span className="text-[#8C7A6D] block text-[10px] uppercase font-semibold">
                Date Added
              </span>
              <span className="font-medium text-[#2B1D14] font-mono">{coffee.dateAdded}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs: Recipes, Tastings, Sensory Overview */}
      <div className="flex items-center gap-2 border-b border-[#E0D5C7] pb-1">
        <button
          onClick={() => setActiveTab('recipes')}
          className={`px-4 py-2 text-sm font-semibold transition-all border-b-2 -mb-1 flex items-center gap-1.5 ${
            activeTab === 'recipes'
              ? 'border-[#C87D32] text-[#2B1D14]'
              : 'border-transparent text-[#7D6B5D] hover:text-[#2B1D14]'
          }`}
        >
          <Scale className="w-4 h-4 text-[#C87D32]" />
          <span>Brew Recipes ({coffee.recipes.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('tastings')}
          className={`px-4 py-2 text-sm font-semibold transition-all border-b-2 -mb-1 flex items-center gap-1.5 ${
            activeTab === 'tastings'
              ? 'border-[#C87D32] text-[#2B1D14]'
              : 'border-transparent text-[#7D6B5D] hover:text-[#2B1D14]'
          }`}
        >
          <Sparkles className="w-4 h-4 text-[#C87D32]" />
          <span>Tasting Notes & Logs ({coffee.tastingLogs.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('notes')}
          className={`px-4 py-2 text-sm font-semibold transition-all border-b-2 -mb-1 flex items-center gap-1.5 ${
            activeTab === 'notes'
              ? 'border-[#C87D32] text-[#2B1D14]'
              : 'border-transparent text-[#7D6B5D] hover:text-[#2B1D14]'
          }`}
        >
          <FileText className="w-4 h-4 text-[#C87D32]" />
          <span>Notes ({(coffee.customNotes || []).length})</span>
        </button>

        <button
          onClick={() => setActiveTab('overview')}
          className={`px-4 py-2 text-sm font-semibold transition-all border-b-2 -mb-1 flex items-center gap-1.5 ${
            activeTab === 'overview'
              ? 'border-[#C87D32] text-[#2B1D14]'
              : 'border-transparent text-[#7D6B5D] hover:text-[#2B1D14]'
          }`}
        >
          <Sliders className="w-4 h-4 text-[#C87D32]" />
          <span>Sensory Radar</span>
        </button>
      </div>

      {/* TAB 1: BREW RECIPES (The core feature) */}
      {activeTab === 'recipes' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-serif text-xl font-bold text-[#2B1D14]">
                Dialed-In Brew Recipes
              </h2>
              <p className="text-xs text-[#7A6757]">
                Common brew variables with custom parameters tailored to this roast
              </p>
            </div>

            <button
              onClick={() => onOpenAddRecipe(coffee.id)}
              className="px-4 py-2 bg-[#C87D32] hover:bg-[#B06B26] text-white text-xs font-semibold rounded-lg shadow-sm hover:shadow transition-all flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              Add Recipe
            </button>
          </div>

          {coffee.recipes.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {coffee.recipes.map((rec) => {
                // Find linked equipment names
                const linkedGear = equipmentList.filter((eq) =>
                  rec.equipmentIds.includes(eq.id)
                );

                return (
                  <div
                    key={rec.id}
                    className="bg-white rounded-xl border border-[#E5DACD] shadow-xs hover:shadow-md transition-all p-5 flex flex-col justify-between"
                  >
                    <div>
                      {/* Method badge & recommended */}
                      <div className="flex items-center justify-between text-xs mb-2">
                        <span className="font-semibold uppercase tracking-wider text-[#8C4F1A] text-[10px] bg-[#FAF3EC] px-2 py-0.5 rounded border border-[#EDE2D4]">
                          {rec.method}
                        </span>
                        {rec.isRecommended && (
                          <span className="text-[10px] text-amber-700 bg-amber-50 px-2 py-0.5 rounded font-medium">
                            Recommended
                          </span>
                        )}
                      </div>

                      <h3 className="font-serif text-lg font-bold text-[#2B1D14] mb-3">
                        {rec.title}
                      </h3>

                      {/* Common Variables Matrix */}
                      <div className="grid grid-cols-3 gap-2 p-3 bg-[#FAF7F2] rounded-lg border border-[#EDE2D4] text-center mb-3">
                        <div>
                          <div className="text-[10px] uppercase text-[#8C7A6D] font-semibold">
                            Dose
                          </div>
                          <div className="font-mono font-bold text-sm text-[#2B1D14]">
                            {rec.doseGrams}g
                          </div>
                        </div>
                        <div>
                          <div className="text-[10px] uppercase text-[#8C7A6D] font-semibold">
                            Water / Yield
                          </div>
                          <div className="font-mono font-bold text-sm text-[#2B1D14]">
                            {rec.waterGrams}g
                          </div>
                        </div>
                        <div>
                          <div className="text-[10px] uppercase text-[#8C7A6D] font-semibold">
                            Ratio
                          </div>
                          <div className="font-mono font-bold text-sm text-[#2B1D14]">
                            {rec.ratio}
                          </div>
                        </div>
                        <div className="pt-2 border-t border-[#EAE0D3]">
                          <div className="text-[10px] uppercase text-[#8C7A6D] font-semibold">
                            Temp
                          </div>
                          <div className="font-mono text-xs text-[#2B1D14]">
                            {rec.waterTempC}°C
                          </div>
                        </div>
                        <div className="pt-2 border-t border-[#EAE0D3]">
                          <div className="text-[10px] uppercase text-[#8C7A6D] font-semibold">
                            Time
                          </div>
                          <div className="font-mono text-xs text-[#2B1D14]">
                            {Math.floor(rec.totalTimeSeconds / 60)}:
                            {(rec.totalTimeSeconds % 60).toString().padStart(2, '0')}
                          </div>
                        </div>
                        <div className="pt-2 border-t border-[#EAE0D3]">
                          <div className="text-[10px] uppercase text-[#8C7A6D] font-semibold">
                            Grind
                          </div>
                          <div className="text-xs text-[#2B1D14] truncate px-1" title={rec.grindSize}>
                            {rec.grindSize}
                          </div>
                        </div>
                      </div>

                      {/* Custom Variables Section (Crucial requirement!) */}
                      {rec.customVariables && rec.customVariables.length > 0 && (
                        <div className="mb-3 space-y-1.5">
                          <div className="text-[10px] uppercase font-bold tracking-wider text-[#8C4F1A] flex items-center gap-1">
                            <Sliders className="w-3 h-3" />
                            <span>Custom Variables</span>
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                            {rec.customVariables.map((cv) => (
                              <div
                                key={cv.id}
                                className="px-2.5 py-1.5 bg-[#F6EFE6] rounded-md border border-[#E8DDD0] text-xs"
                              >
                                <span className="text-[#887363] block text-[10px]">
                                  {cv.label}
                                </span>
                                <span className="font-medium text-[#2B1D14] font-mono text-[11px]">
                                  {cv.value}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Linked Equipment */}
                      {linkedGear.length > 0 && (
                        <div className="mb-3">
                          <span className="text-[10px] uppercase font-bold text-[#8C7A6D] block mb-1">
                            Gear Used
                          </span>
                          <div className="flex flex-wrap gap-1">
                            {linkedGear.map((gear) => (
                              <span
                                key={gear.id}
                                className="text-[10px] px-2 py-0.5 bg-white border border-[#D5C7B8] rounded text-[#4A3728]"
                              >
                                {gear.name}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Barista notes */}
                      {rec.notes && (
                        <p className="text-xs text-[#6B5A4E] italic mb-3">
                          "{rec.notes}"
                        </p>
                      )}
                    </div>

                    {/* Card Actions: Start Brew Session Timer & Edit */}
                    <div className="pt-3 border-t border-[#F0E6DB] flex items-center justify-between">
                      <button
                        onClick={() => onStartBrewSession(rec, coffee)}
                        className="px-3.5 py-2 bg-[#3A2A1E] hover:bg-[#251A13] text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 shadow-xs transition-colors"
                      >
                        <Play className="w-3.5 h-3.5 fill-white" />
                        <span>Start Brew Timer</span>
                      </button>

                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => onOpenEditRecipe(rec)}
                          className="p-1.5 text-[#6D5A4E] hover:text-[#2B1D14] hover:bg-[#F2E8DC] rounded transition-colors"
                          title="Edit recipe"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => onDeleteRecipe(rec.id)}
                          className="p-1.5 text-[#9E8B7D] hover:text-red-700 hover:bg-red-50 rounded transition-colors"
                          title="Delete recipe"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12 bg-white/70 rounded-xl border border-dashed border-[#DACDC0] p-6">
              <Scale className="w-8 h-8 text-[#A69587] mx-auto mb-2" />
              <h3 className="font-serif text-base font-bold text-[#3B2B20]">
                No recipes recorded yet
              </h3>
              <p className="text-xs text-[#6D5A4E] mt-1 max-w-sm mx-auto">
                Add your dialed-in grind size, water ratio, and custom variables to replicate your
                favorite cup.
              </p>
              <button
                onClick={() => onOpenAddRecipe(coffee.id)}
                className="mt-3 px-4 py-2 bg-[#C87D32] hover:bg-[#B06B26] text-white text-xs font-semibold rounded-lg transition-colors inline-flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                Add First Recipe
              </button>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: TASTING NOTES & LOGS */}
      {activeTab === 'tastings' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-serif text-xl font-bold text-[#2B1D14]">
                Tasting Notes & Cup History
              </h2>
              <p className="text-xs text-[#7A6757]">
                Log how the bean evolves as it degasses across multiple brew sessions
              </p>
            </div>

            <button
              onClick={() => onOpenTastingModal(coffee)}
              className="px-4 py-2 bg-[#C87D32] hover:bg-[#B06B26] text-white text-xs font-semibold rounded-lg shadow-sm hover:shadow transition-all flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              Log Tasting Session
            </button>
          </div>

          {/* Community Consensus vs Personal Palate Callout */}
          <div className="bg-[#FAF7F2] p-4 rounded-xl border border-[#E5DACD] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="text-[10px] uppercase font-bold text-[#8C4F1A] tracking-wider mb-1.5 flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5 text-[#C87D32]" />
                <span>Community Consensus Top 5 Notes</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {coffee.generalTastingNotes && coffee.generalTastingNotes.length > 0 ? (
                  coffee.generalTastingNotes.map((n) => (
                    <span
                      key={n}
                      className="text-xs px-2.5 py-0.5 bg-[#FAF3EC] text-[#553E2E] rounded border border-[#DFCFC0] font-semibold"
                    >
                      {n}
                    </span>
                  ))
                ) : (
                  <span className="text-xs text-[#8C7A6D] italic">No community evaluations yet</span>
                )}
              </div>
            </div>

            <div className="sm:border-l sm:border-[#DECFC0] sm:pl-4">
              <div className="text-[10px] uppercase font-bold text-[#8C7A6D] tracking-wider mb-1">
                Your Logged Flavor Tags ({coffee.tastingLogs.reduce((acc, l) => acc + (l.flavorTags || []).length, 0)})
              </div>
              <div className="text-xs text-[#4A3728] font-medium">
                {Array.from(new Set(coffee.tastingLogs.flatMap((l) => l.flavorTags || []))).slice(0, 5).join(', ') || 'No session tags logged yet'}
              </div>
            </div>
          </div>

          {coffee.tastingLogs.length > 0 ? (
            <div className="space-y-4">
              {coffee.tastingLogs.map((log) => (
                <div
                  key={log.id}
                  className="bg-white rounded-xl border border-[#E5DACD] p-5 shadow-xs space-y-3"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#F0E6DB] pb-3">
                    <div className="flex items-center gap-3">
                      <StarRatingDisplay rating={log.rating} size="md" />
                      <span className="text-xs text-[#6B5A4E] font-medium">
                        via {log.brewMethod || 'Pour Over'}
                      </span>
                      {log.daysOffRoast !== undefined && (
                        <span className="text-[11px] font-mono text-[#8C4F1A] bg-[#FAF3EC] px-2 py-0.5 rounded">
                          Day {log.daysOffRoast} off roast
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-3 text-xs text-[#8C7A6D]">
                      <span className="font-mono">{log.date}</span>
                      <button
                        onClick={() => onDeleteTasting(log.id)}
                        className="text-[#9E8B7D] hover:text-red-700 p-1"
                        title="Delete log"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <p className="text-sm text-[#3A291E] leading-relaxed">
                    {log.notes}
                  </p>

                  {/* Flavor Tags */}
                  {log.flavorTags.length > 0 && (
                    <div className="flex flex-wrap gap-1 pt-1">
                      {log.flavorTags.map((tag) => (
                        <span
                          key={tag}
                          className="text-[11px] px-2 py-0.5 bg-[#FAF7F2] text-[#554032] border border-[#E5DACD] rounded"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Sensory breakdown bar */}
                  <div className="grid grid-cols-5 gap-2 pt-2 border-t border-[#F2EAE0] text-center text-xs">
                    <div>
                      <span className="text-[10px] text-[#8C7A6D] block">Acidity</span>
                      <span className="font-mono font-bold text-[#2B1D14]">
                        {log.sensoryScores.acidity}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-[#8C7A6D] block">Sweetness</span>
                      <span className="font-mono font-bold text-[#2B1D14]">
                        {log.sensoryScores.sweetness}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-[#8C7A6D] block">Body</span>
                      <span className="font-mono font-bold text-[#2B1D14]">
                        {log.sensoryScores.body}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-[#8C7A6D] block">Clarity</span>
                      <span className="font-mono font-bold text-[#2B1D14]">
                        {log.sensoryScores.clarity}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-[#8C7A6D] block">Bitterness</span>
                      <span className="font-mono font-bold text-[#2B1D14]">
                        {log.sensoryScores.bitterness}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 bg-white/70 rounded-xl border border-dashed border-[#DACDC0] p-6">
              <Sparkles className="w-8 h-8 text-[#A69587] mx-auto mb-2" />
              <h3 className="font-serif text-base font-bold text-[#3B2B20]">
                No tasting logs recorded yet
              </h3>
              <p className="text-xs text-[#6D5A4E] mt-1 max-w-sm mx-auto">
                Track how this coffee tastes on Day 4 vs Day 14. Record notes on sweetness, florals, and body.
              </p>
              <button
                onClick={() => onOpenTastingModal(coffee)}
                className="mt-3 px-4 py-2 bg-[#C87D32] hover:bg-[#B06B26] text-white text-xs font-semibold rounded-lg transition-colors inline-flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                Add First Tasting Log
              </button>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: CUSTOM COFFEE NOTES */}
      {activeTab === 'notes' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="font-serif text-xl font-bold text-[#2B1D14]">
                Coffee Journal & Custom Notes
              </h2>
              <p className="text-xs text-[#7A6757]">
                Record dial-in adjustments, degassing observations, brew experiments, and resting progress
              </p>
            </div>

            <button
              onClick={() => setIsAddingNote(!isAddingNote)}
              className="self-start sm:self-auto px-4 py-2 bg-[#C87D32] hover:bg-[#B06B26] text-white text-xs font-semibold rounded-lg shadow-sm hover:shadow transition-all flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{isAddingNote ? 'Cancel' : 'Add Custom Note'}</span>
            </button>
          </div>

          {/* New Note Form */}
          {isAddingNote && (
            <form
              onSubmit={handleAddCoffeeNote}
              className="p-5 bg-white rounded-xl border border-[#E5DACD] shadow-sm space-y-3 animate-fade-in"
            >
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#8A6D56]">
                New Custom Note for {coffee.name}
              </h3>

              <div>
                <label className="block text-xs font-medium text-[#5B473A] mb-1">
                  Note Title
                </label>
                <input
                  type="text"
                  value={newNoteTitle}
                  onChange={(e) => setNewNoteTitle(e.target.value)}
                  placeholder="e.g. Day 14 Resting Dial-in, 91°C Water Temperature Test..."
                  className="w-full px-3 py-1.5 bg-[#FAF7F2] rounded-lg border border-[#D5C7B8] text-xs text-[#2C2118] focus:outline-none focus:ring-1 focus:ring-[#C87D32]"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[#5B473A] mb-1">
                  Content & Observations
                </label>
                <textarea
                  value={newNoteContent}
                  onChange={(e) => setNewNoteContent(e.target.value)}
                  placeholder="Record your observations, grind adjustments, flavor evolution, or recipe experiments..."
                  rows={4}
                  className="w-full px-3 py-2 bg-[#FAF7F2] rounded-lg border border-[#D5C7B8] text-xs text-[#2C2118] font-mono focus:outline-none focus:ring-1 focus:ring-[#C87D32]"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[#5B473A] mb-1">
                  Tags (comma separated)
                </label>
                <input
                  type="text"
                  value={newNoteTags}
                  onChange={(e) => setNewNoteTags(e.target.value)}
                  placeholder="e.g. Dial-in, Resting, 91C, Cafec Abaca"
                  className="w-full px-3 py-1.5 bg-[#FAF7F2] rounded-lg border border-[#D5C7B8] text-xs text-[#2C2118] focus:outline-none focus:ring-1 focus:ring-[#C87D32]"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#F0E6DB]">
                <button
                  type="button"
                  onClick={() => setIsAddingNote(false)}
                  className="px-3 py-1.5 text-xs text-[#6B5A4E] hover:text-[#2B1D14]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-[#C87D32] hover:bg-[#B06B26] text-white text-xs font-semibold rounded-lg transition-colors"
                >
                  Save Note
                </button>
              </div>
            </form>
          )}

          {/* Notes List */}
          {coffee.customNotes && coffee.customNotes.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {coffee.customNotes.map((note) => (
                <div
                  key={note.id}
                  className="bg-white rounded-xl border border-[#E5DACD] hover:border-[#D5C4B2] p-4 flex flex-col justify-between shadow-2xs transition-all"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="font-serif font-bold text-sm text-[#2B1D14]">
                        {note.title}
                      </h4>
                      <button
                        onClick={() => handleDeleteCoffeeNote(note.id)}
                        className="text-[#B8A89A] hover:text-red-700 p-1 rounded transition-colors"
                        title="Delete note"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="mt-2 text-xs text-[#4A3B30] font-mono leading-relaxed whitespace-pre-wrap bg-[#FAF8F5] p-2.5 rounded-lg border border-[#F0E8DC]">
                      {note.content}
                    </div>

                    {note.tags && note.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2.5">
                        {note.tags.map((t) => (
                          <span
                            key={t}
                            className="text-[10px] text-[#7A6453] bg-[#F3ECE2] px-1.5 py-0.5 rounded border border-[#E8DEC0]"
                          >
                            #{t}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="mt-3 pt-2 border-t border-[#F2EAE0] flex items-center gap-1 text-[11px] font-mono text-[#8C7A6D]">
                    <Calendar className="w-3 h-3" />
                    <span>{note.date}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 bg-white/70 rounded-xl border border-dashed border-[#DACDC0] p-6">
              <FileText className="w-8 h-8 text-[#A69587] mx-auto mb-2" />
              <h3 className="font-serif text-base font-bold text-[#3B2B20]">
                No custom notes for this coffee yet
              </h3>
              <p className="text-xs text-[#6D5A4E] mt-1 max-w-sm mx-auto">
                Record dialing-in adjustments, grind calibration, degassing progress, or personal reflections on this bag.
              </p>
              <button
                onClick={() => setIsAddingNote(true)}
                className="mt-3 px-4 py-2 bg-[#C87D32] hover:bg-[#B06B26] text-white text-xs font-semibold rounded-lg transition-colors inline-flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                Add First Custom Note
              </button>
            </div>
          )}
        </div>
      )}

      {/* TAB 4: SENSORY RADAR & AGGREGATE */}
      {activeTab === 'overview' && (
        <div className="bg-white rounded-xl border border-[#E5DACD] p-6 space-y-6">
          <h2 className="font-serif text-xl font-bold text-[#2B1D14]">
            Sensory Profile Breakdown
          </h2>

          {avgSensory ? (
            <div className="space-y-4 max-w-lg">
              {[
                { label: 'Acidity / Brightness', val: avgSensory.acidity, color: 'bg-amber-500' },
                { label: 'Sweetness', val: avgSensory.sweetness, color: 'bg-orange-500' },
                { label: 'Body / Texture', val: avgSensory.body, color: 'bg-stone-600' },
                { label: 'Clarity', val: avgSensory.clarity, color: 'bg-blue-500' },
                { label: 'Bitterness', val: avgSensory.bitterness, color: 'bg-rose-600' },
              ].map(({ label, val, color }) => (
                <div key={label} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-[#4A3728]">{label}</span>
                    <span className="font-mono font-bold text-[#2B1D14]">
                      {val.toFixed(1)} / 5.0
                    </span>
                  </div>
                  <div className="w-full bg-[#EFE7DE] h-2.5 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${color}`}
                      style={{ width: `${(val / 5) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-[#7A6757] italic">
              Log at least one tasting session to generate sensory radar graphs.
            </p>
          )}
        </div>
      )}
    </div>
  );
};
