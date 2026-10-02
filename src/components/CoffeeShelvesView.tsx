import React, { useState } from 'react';
import {
  Search,
  Plus,
  LayoutGrid,
  List,
  Layers,
  Heart,
  ChevronRight,
  Filter,
  X,
  BookmarkMinus,
  Trash2,
} from 'lucide-react';
import { Coffee, Shelf, RoastLevel, ProcessType, RegisteredCoffee } from '../types/coffee';
import { CoffeeBagCover } from './CoffeeBagCover';
import { StarRatingDisplay, StarRatingInput } from './StarRating';
import { getGeneralCoffeeInfo } from '../utils/communityLookup';

interface CoffeeShelvesViewProps {
  coffees: Coffee[];
  shelves: Shelf[];
  activeShelfId: string;
  onSelectShelf: (shelfId: string) => void;
  onSelectCoffee: (coffeeId: string) => void;
  onAddCoffee: () => void;
  onManageShelves: () => void;
  onToggleFavorite: (coffeeId: string) => void;
  onQuickRate: (coffeeId: string, rating: number) => void;
  onQuickChangeShelf: (coffeeId: string, shelfId: string) => void;
  onRemoveFromShelf: (coffeeId: string, shelfId: string) => void;
  onRemoveFromAllShelves: (coffeeId: string) => void;
  onDeleteCoffee: (coffeeId: string) => void;
  registeredCoffees?: RegisteredCoffee[];
}

export const CoffeeShelvesView: React.FC<CoffeeShelvesViewProps> = ({
  coffees,
  shelves,
  activeShelfId,
  onSelectShelf,
  onSelectCoffee,
  onAddCoffee,
  onManageShelves,
  onToggleFavorite,
  onQuickRate,
  onQuickChangeShelf,
  onRemoveFromShelf,
  onRemoveFromAllShelves,
  onDeleteCoffee,
  registeredCoffees = [],
}) => {
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [roastFilter, setRoastFilter] = useState<'All' | RoastLevel>('All');
  const [processFilter, setProcessFilter] = useState<'All' | ProcessType>('All');
  const [ratingFilter, setRatingFilter] = useState<'All' | '4plus' | 'unrated'>('All');
  const [sortBy, setSortBy] = useState<'dateAdded' | 'rating' | 'roastDate' | 'name' | 'roaster'>(
    'dateAdded'
  );

  // Active Shelf Info
  const isAll = activeShelfId === 'all';
  const activeShelf = shelves.find((s) => s.id === activeShelfId);

  // Filter coffees
  const filteredCoffees = coffees
    .filter((coffee) => {
      // Shelf filter
      if (!isAll && !coffee.shelfIds.includes(activeShelfId)) {
        return false;
      }
      // Roast filter
      if (roastFilter !== 'All' && coffee.roastLevel !== roastFilter) {
        return false;
      }
      // Process filter
      if (processFilter !== 'All' && coffee.process !== processFilter) {
        return false;
      }
      // Rating filter
      if (ratingFilter === '4plus' && coffee.userRating < 4.0) {
        return false;
      }
      if (ratingFilter === 'unrated' && coffee.userRating > 0) {
        return false;
      }
      // Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const inName = coffee.name.toLowerCase().includes(q);
        const inRoaster = coffee.roaster.toLowerCase().includes(q);
        const inCountry = coffee.origin.country.toLowerCase().includes(q);
        const inFlavors = coffee.tastingNotesSummary.some((f) => f.toLowerCase().includes(q));
        if (!inName && !inRoaster && !inCountry && !inFlavors) return false;
      }
      return true;
    })
    .sort((a, b) => {
      if (sortBy === 'rating') {
        return (b.userRating || 0) - (a.userRating || 0);
      }
      if (sortBy === 'roastDate') {
        return (b.roastDate || '').localeCompare(a.roastDate || '');
      }
      if (sortBy === 'name') {
        return a.name.localeCompare(b.name);
      }
      if (sortBy === 'roaster') {
        return a.roaster.localeCompare(b.roaster);
      }
      // default: dateAdded (desc)
      return b.dateAdded.localeCompare(a.dateAdded);
    });

  return (
    <div className="space-y-6">
      {/* Top Banner / Shelf Title Bar */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-4 border-b border-[#E5DACD]">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#8A6D56]">
            <span>Coffee Library</span>
            <ChevronRight className="w-3.5 h-3.5" />
            <span>{isAll ? 'All Beans' : activeShelf?.name || 'Shelf'}</span>
          </div>
          <h1 className="font-serif text-3xl font-bold text-[#2B1D14] tracking-tight mt-0.5">
            {isAll ? 'All Coffees in Library' : activeShelf?.name}
          </h1>
          <p className="text-xs text-[#6B5A4E] mt-1">
            {isAll
              ? 'Catalog of whole bean specialty roasts, recipes, and tasting evaluations'
              : activeShelf?.description || `Coffees shelved in ${activeShelf?.name}`}
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            onClick={onAddCoffee}
            className="px-4 py-2.5 bg-[#C87D32] hover:bg-[#B06B26] text-white text-xs font-semibold rounded-lg shadow-sm hover:shadow transition-all flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            Add Coffee
          </button>
        </div>
      </div>

      {/* Filter, Search & View Controls Bar */}
      <div className="bg-white/80 rounded-xl border border-[#E5DACD] p-3 space-y-3">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Search box */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-[#8C7A6D] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by coffee, roaster, origin country, or tasting notes (e.g. Peach, Geisha)..."
              className="w-full pl-9 pr-3 py-1.5 bg-[#FAF7F2] rounded-lg border border-[#E0D5C7] text-xs text-[#2C2118] focus:outline-none focus:ring-1 focus:ring-[#C87D32]"
            />
          </div>

          {/* Sort & View mode */}
          <div className="flex items-center gap-2 self-end md:self-auto">
            <div className="flex items-center gap-1 text-xs">
              <span className="text-[#8C7A6D] hidden sm:inline">Sort:</span>
              <select
                value={sortBy}
                onChange={(e) =>
                  setSortBy(
                    e.target.value as 'dateAdded' | 'rating' | 'roastDate' | 'name' | 'roaster'
                  )
                }
                className="px-2 py-1 bg-[#FAF7F2] rounded-lg border border-[#E0D5C7] text-xs font-medium text-[#2C2118]"
              >
                <option value="dateAdded">Date Added (Newest)</option>
                <option value="rating">Rating (Highest)</option>
                <option value="roastDate">Roast Date (Freshest)</option>
                <option value="name">Bean Name (A-Z)</option>
                <option value="roaster">Roaster (A-Z)</option>
              </select>
            </div>

            {/* Grid / Table Toggle */}
            <div className="flex items-center p-0.5 bg-[#FAF7F2] rounded-lg border border-[#E0D5C7]">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded transition-colors ${
                  viewMode === 'grid'
                    ? 'bg-white text-[#2B1D14] shadow-2xs'
                    : 'text-[#8C7A6D] hover:text-[#2B1D14]'
                }`}
                title="Bag Covers Grid"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('table')}
                className={`p-1.5 rounded transition-colors ${
                  viewMode === 'table'
                    ? 'bg-white text-[#2B1D14] shadow-2xs'
                    : 'text-[#8C7A6D] hover:text-[#2B1D14]'
                }`}
                title="Detailed List Table"
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Quick Filters row */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-[#F0E6DB] text-xs">
          <span className="text-[#8C7A6D] flex items-center gap-1 text-[11px] font-semibold">
            <Filter className="w-3 h-3" /> Filters:
          </span>

          {/* Roast level */}
          <select
            value={roastFilter}
            onChange={(e) => setRoastFilter(e.target.value as 'All' | RoastLevel)}
            className="px-2 py-1 bg-[#FAF7F2] rounded-md border border-[#E0D5C7] text-[11px] text-[#4A3728]"
          >
            <option value="All">All Roasts</option>
            <option value="Light">Light</option>
            <option value="Medium-Light">Medium-Light</option>
            <option value="Medium">Medium</option>
            <option value="Medium-Dark">Medium-Dark</option>
            <option value="Dark">Dark</option>
          </select>

          {/* Process filter */}
          <select
            value={processFilter}
            onChange={(e) => setProcessFilter(e.target.value as 'All' | ProcessType)}
            className="px-2 py-1 bg-[#FAF7F2] rounded-md border border-[#E0D5C7] text-[11px] text-[#4A3728]"
          >
            <option value="All">All Processes</option>
            <option value="Washed">Washed</option>
            <option value="Natural">Natural</option>
            <option value="Honey">Honey</option>
            <option value="Thermal Shock">Thermal Shock</option>
            <option value="Anaerobic Natural">Anaerobic</option>
          </select>

          {/* Rating filter */}
          <select
            value={ratingFilter}
            onChange={(e) => setRatingFilter(e.target.value as 'All' | '4plus' | 'unrated')}
            className="px-2 py-1 bg-[#FAF7F2] rounded-md border border-[#E0D5C7] text-[11px] text-[#4A3728]"
          >
            <option value="All">All Ratings</option>
            <option value="4plus">Rated 4.0+ Stars</option>
            <option value="unrated">Unrated Coffees</option>
          </select>

          {(roastFilter !== 'All' ||
            processFilter !== 'All' ||
            ratingFilter !== 'All' ||
            searchQuery) && (
            <button
              onClick={() => {
                setRoastFilter('All');
                setProcessFilter('All');
                setRatingFilter('All');
                setSearchQuery('');
              }}
              className="text-[11px] text-[#9E8B7D] hover:text-[#7A3E26] underline ml-auto"
            >
              Reset filters
            </button>
          )}
        </div>
      </div>

      {/* Main Coffee Displays */}
      {filteredCoffees.length > 0 ? (
        viewMode === 'grid' ? (
          /* GRID VIEW (Goodreads Book Cover aesthetic) */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {filteredCoffees.map((coffee) => {
              const generalInfo = getGeneralCoffeeInfo(coffee, registeredCoffees);
              return (
              <div
                key={coffee.id}
                className="bg-white rounded-xl border border-[#E5DACD] hover:border-[#D5C4B2] shadow-xs hover:shadow-md transition-all p-4 flex flex-col justify-between group cursor-pointer relative"
                onClick={() => onSelectCoffee(coffee.id)}
              >
                <div>
                  {/* Top: Bag Art + Roaster + Quick Remove Action */}
                  <div className="flex gap-3 mb-3">
                    <CoffeeBagCover
                      name={coffee.name}
                      roaster={coffee.roaster}
                      originCountry={coffee.origin.country}
                      process={coffee.process}
                      roastLevel={coffee.roastLevel}
                      coverColor={coffee.coverColor}
                      badgeText={coffee.bagBadgeText}
                      size="sm"
                      className="group-hover:scale-[1.02] transition-transform"
                    />

                    <div className="flex-1 min-w-0 flex flex-col justify-between">
                      <div>
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] uppercase font-bold tracking-wider text-[#8C4F1A] truncate max-w-[80%]">
                            {coffee.roaster}
                          </span>

                          {/* Quick Remove from this shelf & Delete coffee from library buttons */}
                          <div className="flex items-center gap-0.5">
                            {!isAll && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onRemoveFromShelf(coffee.id, activeShelfId);
                                }}
                                className="text-[#A8988A] hover:text-amber-800 hover:bg-amber-50 p-1 rounded transition-colors"
                                title={`Remove from ${activeShelf?.name}`}
                              >
                                <BookmarkMinus className="w-3.5 h-3.5" />
                              </button>
                            )}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onDeleteCoffee(coffee.id);
                              }}
                              className="text-[#A8988A] hover:text-rose-700 hover:bg-rose-50 p-1 rounded transition-colors"
                              title="Delete coffee from library"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        <h3 className="font-serif font-bold text-base text-[#2B1D14] leading-snug group-hover:text-[#C87D32] transition-colors line-clamp-2 mt-0.5">
                          {coffee.name}
                        </h3>
                        <div className="text-xs text-[#7A6757] mt-0.5 truncate">
                          {coffee.origin.country} · {coffee.process}
                        </div>
                      </div>

                      {/* Favorite button & recipe count */}
                      <div className="flex items-center justify-between pt-1">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onToggleFavorite(coffee.id);
                          }}
                          className={`p-1 rounded transition-colors ${
                            coffee.isFavorite
                              ? 'text-rose-600'
                              : 'text-[#B8A89A] hover:text-rose-600'
                          }`}
                        >
                          <Heart
                            className={`w-4 h-4 ${coffee.isFavorite ? 'fill-current' : ''}`}
                          />
                        </button>

                        <span className="text-[10px] font-mono text-[#8C7A6D]">
                          {coffee.recipes.length} recipe{coffee.recipes.length === 1 ? '' : 's'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Dual Rating Section: Personal Rating & General Rating */}
                  <div
                    className="py-2 border-t border-[#F2EAE0] space-y-1.5"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] uppercase font-semibold text-[#8C7A6D]">Personal:</span>
                        <StarRatingInput
                          value={coffee.userRating}
                          onChange={(newRating) => onQuickRate(coffee.id, newRating)}
                          size="sm"
                          showTextLabel={false}
                        />
                      </div>
                      <span className="text-[10px] font-mono text-[#8C7A6D]">
                        {coffee.userRating > 0 ? `${coffee.userRating.toFixed(1)} ★` : 'Unrated'}
                      </span>
                    </div>

                    {generalInfo.isRegistered ? (
                      <div className="flex items-center justify-between text-[10px] text-[#7A6757] bg-[#FAF7F2] px-2 py-0.5 rounded border border-[#EDE2D4]">
                        <span className="text-[#8C7A6D]">General Rating:</span>
                        <span className="font-semibold text-[#8C4F1A] font-mono">
                          {generalInfo.ratingsCount > 0 ? (
                            <>★ {generalInfo.generalRating.toFixed(1)} ({generalInfo.ratingsCount} {generalInfo.ratingsCount === 1 ? 'barista' : 'baristas'})</>
                          ) : (
                            <span className="text-[#A8988A] font-normal">Unrated (0)</span>
                          )}
                        </span>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between text-[10px] text-[#8C7A6D] bg-[#F8F5F0] px-2 py-0.5 rounded border border-dashed border-[#E5DACD]">
                        <span className="text-[#A8988A] italic">Personal Coffee</span>
                        <span className="text-[#A8988A] font-mono text-[9px]">Unregistered</span>
                      </div>
                    )}
                  </div>

                  {/* Active Shelves on Card (with individual remove 'X' icons!) */}
                  <div
                    className="flex flex-wrap gap-1 pt-1 pb-1"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {coffee.shelfIds.map((sId) => {
                      const shelf = shelves.find((s) => s.id === sId);
                      if (!shelf) return null;
                      return (
                        <span
                          key={sId}
                          className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 bg-[#FAF2E8] text-[#553E2F] border border-[#E8DACB] rounded"
                        >
                          <span>{shelf.name}</span>
                          <button
                            onClick={() => onRemoveFromShelf(coffee.id, sId)}
                            className="hover:text-rose-700 hover:bg-[#F2DEC9] rounded p-0.5 transition-colors"
                            title={`Remove from ${shelf.name}`}
                          >
                            <X className="w-2.5 h-2.5" />
                          </button>
                        </span>
                      );
                    })}
                  </div>

                  {/* Flavor Tags: General Consensus or Personal */}
                  {((generalInfo.isRegistered && generalInfo.generalTastingNotes && generalInfo.generalTastingNotes.length > 0) ||
                    (coffee.tastingNotesSummary && coffee.tastingNotesSummary.length > 0)) && (
                    <div className="flex flex-wrap gap-1 pt-1">
                      {generalInfo.isRegistered && generalInfo.generalTastingNotes && generalInfo.generalTastingNotes.length > 0 ? (
                        generalInfo.generalTastingNotes.slice(0, 3).map((f) => (
                          <span
                            key={f}
                            className="text-[10px] px-1.5 py-0.5 bg-[#FAF3EC] text-[#8C4F1A] border border-[#E8DACB] rounded font-semibold"
                            title={`Community top note: ${f}`}
                          >
                            {f}
                          </span>
                        ))
                      ) : (
                        (coffee.tastingNotesSummary || []).slice(0, 3).map((f) => (
                          <span
                            key={f}
                            className="text-[10px] px-1.5 py-0.5 bg-[#FAF7F2] text-[#554032] border border-[#EDE2D4] rounded"
                          >
                            {f}
                          </span>
                        ))
                      )}
                    </div>
                  )}
                </div>

                {/* Bottom Shelf Selector Dropdown & Remove from Shelf option */}
                <div
                  className="mt-3 pt-2.5 border-t border-[#F2EAE0] flex items-center justify-between text-xs"
                  onClick={(e) => e.stopPropagation()}
                >
                  <select
                    value={!isAll ? activeShelfId : coffee.shelfIds[0] || 'all'}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val === 'remove-current') {
                        onRemoveFromShelf(coffee.id, activeShelfId);
                      } else if (val === 'remove-all') {
                        onRemoveFromAllShelves(coffee.id);
                      } else {
                        onQuickChangeShelf(coffee.id, val);
                      }
                    }}
                    className="text-[11px] font-medium bg-[#F7F1E9] border border-[#E0D5C7] rounded px-2 py-1 text-[#3A291E] max-w-[70%] truncate"
                  >
                    <optgroup label="Add / Move to Shelf">
                      {shelves.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name}
                        </option>
                      ))}
                    </optgroup>
                    <optgroup label="Remove from Shelves">
                      {!isAll && (
                        <option value="remove-current">
                          ✕ Remove from {activeShelf?.name}
                        </option>
                      )}
                      <option value="remove-all">✕ Remove from all shelves</option>
                    </optgroup>
                  </select>

                  <span className="text-[10px] text-[#9E8B7D] font-mono">
                    {coffee.roastDate || coffee.dateAdded}
                  </span>
                </div>
              </div>
              );
            })}
          </div>
        ) : (
          /* TABLE VIEW (Goodreads Spreadsheet / Shelf list) */
          <div className="bg-white rounded-xl border border-[#E5DACD] overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-[#2C2118]">
                <thead className="bg-[#F5ECE1] border-b border-[#E0D5C7] text-[11px] uppercase font-bold text-[#6D5441]">
                  <tr>
                    <th className="py-3 px-4 w-12">Cover</th>
                    <th className="py-3 px-4">Coffee & Roaster</th>
                    <th className="py-3 px-4">Origin & Process</th>
                    <th className="py-3 px-4">Roast</th>
                    <th className="py-3 px-4">Your Rating</th>
                    <th className="py-3 px-4">General Rating</th>
                    <th className="py-3 px-4">Shelves (Click ✕ to Remove)</th>
                    <th className="py-3 px-4">Recipes</th>
                    <th className="py-3 px-4 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F0E6DB]">
                  {filteredCoffees.map((coffee) => (
                    <tr
                      key={coffee.id}
                      onClick={() => onSelectCoffee(coffee.id)}
                      className="hover:bg-[#FAF7F2] transition-colors cursor-pointer"
                    >
                      <td className="py-2 px-4">
                        <CoffeeBagCover
                          name={coffee.name}
                          roaster={coffee.roaster}
                          originCountry={coffee.origin.country}
                          process={coffee.process}
                          roastLevel={coffee.roastLevel}
                          coverColor={coffee.coverColor}
                          size="sm"
                          className="w-10 h-14"
                        />
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-serif font-bold text-sm text-[#2B1D14] hover:text-[#C87D32]">
                          {coffee.name}
                        </div>
                        <div className="text-xs text-[#8C4F1A] font-medium">
                          {coffee.roaster}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-medium">{coffee.origin.country}</div>
                        <div className="text-[11px] text-[#7A6757]">{coffee.process}</div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-medium text-[#4A3728]">{coffee.roastLevel}</span>
                      </td>
                      <td className="py-3 px-4" onClick={(e) => e.stopPropagation()}>
                        <StarRatingInput
                          value={coffee.userRating}
                          onChange={(r) => onQuickRate(coffee.id, r)}
                          size="sm"
                          showTextLabel={false}
                        />
                      </td>
                      <td className="py-3 px-4">
                        {(() => {
                          const itemGeneralInfo = getGeneralCoffeeInfo(coffee, registeredCoffees);
                          if (!itemGeneralInfo.isRegistered) {
                            return <span className="text-[#A8988A] italic text-[11px]">Personal item</span>;
                          }
                          return (
                            <div className="flex items-center gap-1.5 font-mono text-xs text-[#8C4F1A] font-semibold whitespace-nowrap">
                              {itemGeneralInfo.ratingsCount > 0 ? (
                                <>
                                  <span>★ {itemGeneralInfo.generalRating.toFixed(1)}</span>
                                  <span className="text-[11px] text-[#8C7A6D] font-normal">
                                    ({itemGeneralInfo.ratingsCount} {itemGeneralInfo.ratingsCount === 1 ? 'barista' : 'baristas'})
                                  </span>
                                </>
                              ) : (
                                <span className="text-[#A8988A] font-normal text-[11px]">Unrated (0)</span>
                              )}
                            </div>
                          );
                        })()}
                      </td>
                      <td className="py-3 px-4" onClick={(e) => e.stopPropagation()}>
                        <div className="flex flex-wrap gap-1">
                          {coffee.shelfIds.map((sId) => {
                            const shelf = shelves.find((s) => s.id === sId);
                            return (
                              <span
                                key={sId}
                                className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 bg-[#F2E8DC] text-[#4A392D] rounded border border-[#E0D5C7]"
                              >
                                <span>{shelf?.name || sId}</span>
                                <button
                                  type="button"
                                  onClick={() => onRemoveFromShelf(coffee.id, sId)}
                                  className="hover:text-rose-700 hover:bg-[#E2D2C0] rounded p-0.5 transition-colors"
                                  title={`Remove from ${shelf?.name}`}
                                >
                                  <X className="w-2.5 h-2.5" />
                                </button>
                              </span>
                            );
                          })}
                        </div>
                      </td>
                      <td className="py-3 px-4 font-mono font-medium">
                        {coffee.recipes.length}
                      </td>
                      <td className="py-3 px-4 text-center" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-center gap-1.5">
                          {!isAll && (
                            <button
                              onClick={() => onRemoveFromShelf(coffee.id, activeShelfId)}
                              className="px-2 py-1 text-[11px] text-[#8C4F1A] hover:text-amber-800 hover:bg-amber-50 border border-[#DACDC0] rounded transition-colors flex items-center gap-1"
                              title={`Remove from ${activeShelf?.name}`}
                            >
                              <BookmarkMinus className="w-3 h-3" />
                              <span>Remove</span>
                            </button>
                          )}
                          <button
                            onClick={() => onDeleteCoffee(coffee.id)}
                            className="p-1 text-[#9E8B7D] hover:text-rose-700 hover:bg-rose-50 rounded transition-colors"
                            title="Delete coffee from library"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )
      ) : (
        <div className="text-center py-16 bg-white/60 rounded-xl border border-dashed border-[#DACDC0] p-8">
          <Layers className="w-10 h-10 text-[#A69587] mx-auto mb-3" />
          <h3 className="font-serif text-lg font-bold text-[#3B2B20]">No Coffees Found</h3>
          <p className="text-xs text-[#6D5A4E] mt-1 max-w-sm mx-auto">
            {searchQuery
              ? 'No beans match your current search and filter combination.'
              : 'This shelf currently has no coffees. Add a delicious roast to get started!'}
          </p>
          <button
            onClick={onAddCoffee}
            className="mt-4 px-4 py-2 bg-[#C87D32] hover:bg-[#B06B26] text-white text-xs font-semibold rounded-lg transition-colors inline-flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            Add Coffee to Shelf
          </button>
        </div>
      )}
    </div>
  );
};
