import React, { useState } from 'react';
import {
  MapPin,
  Plus,
  Search,
  ExternalLink,
  Edit2,
  Trash2,
  Heart,
  Calendar,
  Compass,
  Map as MapIcon,
  LayoutGrid,
  Coffee,
  Sparkles,
} from 'lucide-react';
import { Cafe, RegisteredCafe } from '../types/coffee';
import { StarRatingDisplay, StarRatingInput } from './StarRating';
import { getGeneralCafeInfo } from '../utils/communityLookup';

interface CafeShelfViewProps {
  cafes: Cafe[];
  onAddCafe: () => void;
  onEditCafe: (cafe: Cafe) => void;
  onDeleteCafe: (cafeId: string) => void;
  onToggleFavorite: (cafeId: string) => void;
  onQuickRate: (cafeId: string, rating: number) => void;
  registeredCafes?: RegisteredCafe[];
  isRegisteredUser?: boolean;
}

export const CafeShelfView: React.FC<CafeShelfViewProps> = ({
  cafes,
  onAddCafe,
  onEditCafe,
  onDeleteCafe,
  onToggleFavorite,
  onQuickRate,
  registeredCafes = [],
  isRegisteredUser = false,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCity, setSelectedCity] = useState<string>('All');
  const [selectedRating, setSelectedRating] = useState<'All' | '5' | '4.5plus'>('All');
  const [previewingMapCafeId, setPreviewingMapCafeId] = useState<string | null>(null);

  // Extract unique cities
  const uniqueCities = Array.from(new Set(cafes.map((c) => c.city).filter(Boolean)));
  const uniqueCountries = Array.from(new Set(cafes.map((c) => c.country).filter(Boolean)));
  const fiveStarCount = cafes.filter((c) => c.rating >= 5.0).length;

  // Filter cafes
  const filteredCafes = cafes.filter((cafe) => {
    if (selectedCity !== 'All' && cafe.city !== selectedCity) return false;
    if (selectedRating === '5' && cafe.rating < 5.0) return false;
    if (selectedRating === '4.5plus' && cafe.rating < 4.5) return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const inName = cafe.name.toLowerCase().includes(q);
      const inAddress = cafe.address.toLowerCase().includes(q);
      const inCity = cafe.city.toLowerCase().includes(q);
      const inDrink = (cafe.favoriteDrink || '').toLowerCase().includes(q);
      const inNotes = (cafe.notes || '').toLowerCase().includes(q);
      const inVibes = cafe.vibes.some((v) => v.toLowerCase().includes(q));
      if (!inName && !inAddress && !inCity && !inDrink && !inNotes && !inVibes) {
        return false;
      }
    }
    return true;
  });

  const getGoogleMapsSearchUrl = (cafe: Cafe) => {
    if (cafe.googleMapsUrl) return cafe.googleMapsUrl;
    const query = `${cafe.name} ${cafe.address} ${cafe.city}`.trim();
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
  };

  const getGoogleMapsEmbedUrl = (cafe: Cafe) => {
    const query = `${cafe.name} ${cafe.address} ${cafe.city}`.trim();
    return `https://maps.google.com/maps?q=${encodeURIComponent(query)}&t=&z=16&ie=UTF8&iwloc=&output=embed`;
  };

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Top Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-4 border-b border-[#E5DACD]">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#8A6D56]">
            <span>Coffee Traveler's Journal</span>
          </div>
          <h1 className="font-serif text-3xl font-bold text-[#2B1D14] tracking-tight mt-0.5">
            Cafe Shelf
          </h1>
          <p className="text-xs sm:text-sm text-[#6B5A4E] mt-1 max-w-xl">
            In-person specialty coffee shops visited around the world. Pin their street address,
            track favorite drinks, and jump directly to Google Maps navigation.
          </p>
        </div>

        <button
          onClick={onAddCafe}
          className="self-start sm:self-auto px-4 py-2.5 bg-[#C87D32] hover:bg-[#B06B26] text-white text-xs font-semibold rounded-lg shadow-sm hover:shadow transition-all flex items-center gap-1.5"
        >
          <Plus className="w-4 h-4" />
          <span>Add Cafe Visited</span>
        </button>
      </div>

      {/* Stats Overview Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3.5 bg-white rounded-xl border border-[#E5DACD] shadow-xs">
          <div className="text-[11px] uppercase font-semibold text-[#8C7A6D]">Cafes Visited</div>
          <div className="font-serif text-2xl font-bold text-[#2B1D14] font-mono">
            {cafes.length}
          </div>
        </div>
        <div className="p-3.5 bg-white rounded-xl border border-[#E5DACD] shadow-xs">
          <div className="text-[11px] uppercase font-semibold text-[#8C7A6D]">Cities Explored</div>
          <div className="font-serif text-2xl font-bold text-[#8C4F1A] font-mono">
            {uniqueCities.length}
          </div>
        </div>
        <div className="p-3.5 bg-white rounded-xl border border-[#E5DACD] shadow-xs">
          <div className="text-[11px] uppercase font-semibold text-[#8C7A6D]">Countries</div>
          <div className="font-serif text-2xl font-bold text-[#3B6E59] font-mono">
            {uniqueCountries.length}
          </div>
        </div>
        <div className="p-3.5 bg-white rounded-xl border border-[#E5DACD] shadow-xs">
          <div className="text-[11px] uppercase font-semibold text-[#8C7A6D]">5-Star Gems</div>
          <div className="font-serif text-2xl font-bold text-[#C87D32] font-mono">
            {fiveStarCount}
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white/80 rounded-xl border border-[#E5DACD] p-3 space-y-3">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Search box */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-[#8C7A6D] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search cafes by name, city, street address, or favorite drink..."
              className="w-full pl-9 pr-3 py-1.5 bg-[#FAF7F2] rounded-lg border border-[#E0D5C7] text-xs text-[#2C2118] focus:outline-none focus:ring-1 focus:ring-[#C87D32]"
            />
          </div>

          {/* City & Rating Filter */}
          <div className="flex items-center gap-2 self-end md:self-auto">
            <select
              value={selectedCity}
              onChange={(e) => setSelectedCity(e.target.value)}
              className="px-2.5 py-1.5 bg-[#FAF7F2] rounded-lg border border-[#E0D5C7] text-xs font-medium text-[#2C2118]"
            >
              <option value="All">All Cities ({cafes.length})</option>
              {uniqueCities.map((city) => (
                <option key={city} value={city}>
                  {city}
                </option>
              ))}
            </select>

            <select
              value={selectedRating}
              onChange={(e) => setSelectedRating(e.target.value as 'All' | '5' | '4.5plus')}
              className="px-2.5 py-1.5 bg-[#FAF7F2] rounded-lg border border-[#E0D5C7] text-xs font-medium text-[#2C2118]"
            >
              <option value="All">All Ratings</option>
              <option value="5">5-Star Only</option>
              <option value="4.5plus">4.5+ Stars</option>
            </select>
          </div>
        </div>
      </div>

      {/* Cafes Cards Grid */}
      {filteredCafes.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCafes.map((cafe) => {
            const isMapExpanded = previewingMapCafeId === cafe.id;

            return (
              <div
                key={cafe.id}
                className="bg-white rounded-xl border border-[#E5DACD] hover:border-[#D5C4B2] shadow-xs hover:shadow-md transition-all p-5 flex flex-col justify-between"
              >
                <div>
                  {/* Top Bar: City & Heart */}
                  <div className="flex items-center justify-between text-xs mb-2">
                    <span className="font-semibold text-[#8C4F1A] text-[11px] bg-[#FAF3EC] px-2 py-0.5 rounded border border-[#EDE2D4]">
                      {cafe.city}, {cafe.country}
                    </span>

                    <button
                      onClick={() => onToggleFavorite(cafe.id)}
                      className={`p-1 rounded transition-colors ${
                        cafe.isFavorite ? 'text-rose-600' : 'text-[#B8A89A] hover:text-rose-600'
                      }`}
                      title={cafe.isFavorite ? 'Favorited cafe' : 'Add to favorites'}
                    >
                      <Heart className={`w-4 h-4 ${cafe.isFavorite ? 'fill-current' : ''}`} />
                    </button>
                  </div>

                  {/* Cafe Name */}
                  <h3 className="font-serif text-xl font-bold text-[#2B1D14] leading-snug">
                    {cafe.name}
                  </h3>

                  {/* Pinned Address with Google Maps link */}
                  <div className="mt-1 flex items-start gap-1.5 text-xs text-[#6B5A4E]">
                    <MapPin className="w-3.5 h-3.5 text-[#C87D32] shrink-0 mt-0.5" />
                    <span className="font-medium">{cafe.address}</span>
                  </div>

                  {/* Google Maps Actions */}
                  <div className="mt-2.5 flex items-center gap-2">
                    <a
                      href={getGoogleMapsSearchUrl(cafe)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#C87D32] hover:text-[#9B551C] bg-[#FAF1E4] hover:bg-[#F2E5D0] px-2.5 py-1 rounded-md border border-[#E8DEC0] transition-colors"
                    >
                      <ExternalLink className="w-3 h-3" />
                      <span>View in Google Maps</span>
                    </a>

                    <button
                      onClick={() =>
                        setPreviewingMapCafeId(isMapExpanded ? null : cafe.id)
                      }
                      className="inline-flex items-center gap-1 text-[11px] font-medium text-[#6B5A4E] hover:text-[#2B1D14] bg-[#F5ECE1] hover:bg-[#EDE1D3] px-2.5 py-1 rounded-md transition-colors"
                    >
                      <MapIcon className="w-3 h-3" />
                      <span>{isMapExpanded ? 'Hide Map' : 'Preview Map'}</span>
                    </button>
                  </div>

                  {/* Embedded Google Map Preview (when toggled) */}
                  {isMapExpanded && (
                    <div className="mt-3 rounded-lg overflow-hidden border border-[#DACDC0] shadow-inner animate-fade-in">
                      <iframe
                        title={`Google Maps Pin for ${cafe.name}`}
                        src={getGoogleMapsEmbedUrl(cafe)}
                        width="100%"
                        height="180"
                        style={{ border: 0 }}
                        loading="lazy"
                        referrerPolicy="no-referrer-when-downgrade"
                      />
                    </div>
                  )}

                  {/* Star Rating: Personal & General */}
                  <div className="py-2.5 mt-2 border-t border-[#F2EAE0] space-y-1.5">
                    <StarRatingInput
                      value={cafe.rating}
                      onChange={(newRating) => onQuickRate(cafe.id, newRating)}
                      size="sm"
                      label="Your Cafe Rating"
                    />
                    {(() => {
                      const generalInfo = getGeneralCafeInfo(cafe, registeredCafes);
                      if (!generalInfo.isRegistered) {
                        return (
                          <div className="flex items-center justify-between text-[10px] text-[#8C7A6D] bg-[#F8F5F0] px-2 py-0.5 rounded border border-dashed border-[#E5DACD]">
                            <span className="text-[#A8988A] italic">Personal Cafe</span>
                            <span className="text-[#A8988A] font-mono text-[9px]">Unregistered</span>
                          </div>
                        );
                      }
                      return (
                        <div className="flex items-center justify-between text-[10px] text-[#7A6757] bg-[#FAF7F2] px-2 py-0.5 rounded border border-[#EDE2D4]">
                          <span className="text-[#8C7A6D]">General Rating:</span>
                          <span className="font-semibold text-[#8C4F1A] font-mono">
                            {generalInfo.ratingsCount > 0 ? (
                              <>★ {generalInfo.generalRating.toFixed(1)} ({generalInfo.ratingsCount} {generalInfo.ratingsCount === 1 ? 'visit' : 'visits'})</>
                            ) : (
                              <span className="text-[#A8988A] font-normal">Unrated (0)</span>
                            )}
                          </span>
                        </div>
                      );
                    })()}
                  </div>

                  {/* Favorite Drink */}
                  {cafe.favoriteDrink && (
                    <div className="text-xs text-[#4A3728] mt-1 bg-[#FAF7F2] p-2 rounded-md border border-[#EDE2D4]">
                      <span className="text-[10px] uppercase font-bold text-[#8C7A6D] block">
                        Signature / Favorite Order
                      </span>
                      <span className="font-serif italic font-medium">
                        "{cafe.favoriteDrink}"
                      </span>
                    </div>
                  )}

                  {/* Roastery / Beans */}
                  {cafe.roasterOrBeansServed && (
                    <div className="text-xs text-[#6B5A4E] mt-1.5">
                      <span className="text-[#8C7A6D]">Beans: </span>
                      <span className="font-medium text-[#2B1D14]">
                        {cafe.roasterOrBeansServed}
                      </span>
                    </div>
                  )}

                  {/* Vibe Tags */}
                  {cafe.vibes.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2.5">
                      {cafe.vibes.map((v) => (
                        <span
                          key={v}
                          className="text-[10px] px-2 py-0.5 bg-[#FAF7F2] text-[#554032] border border-[#E5DACD] rounded"
                        >
                          {v}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Review Notes */}
                  {cafe.notes && (
                    <p className="text-xs text-[#6B5A4E] italic mt-3 leading-relaxed border-l-2 border-[#C87D32]/50 pl-2.5 py-0.5">
                      "{cafe.notes}"
                    </p>
                  )}
                </div>

                {/* Bottom Footer: Date & Actions */}
                <div className="pt-3 mt-4 border-t border-[#F0E6DB] flex items-center justify-between text-xs text-[#8C7A6D]">
                  <div className="flex items-center gap-1 font-mono text-[11px]">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>Visited {cafe.dateVisited || 'Recent'}</span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => onEditCafe(cafe)}
                      className="p-1.5 text-[#6D5A4E] hover:text-[#2B1D14] hover:bg-[#F2E8DC] rounded transition-colors"
                      title="Edit cafe"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => onDeleteCafe(cafe.id)}
                      className="p-1.5 text-[#9E8B7D] hover:text-red-700 hover:bg-red-50 rounded transition-colors"
                      title="Remove cafe"
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
        <div className="text-center py-16 bg-white/60 rounded-xl border border-dashed border-[#DACDC0] p-8">
          <Compass className="w-10 h-10 text-[#A69587] mx-auto mb-3" />
          <h3 className="font-serif text-lg font-bold text-[#3B2B20]">No Cafes Found</h3>
          <p className="text-xs text-[#6D5A4E] mt-1 max-w-sm mx-auto">
            {searchQuery
              ? 'No coffee shops match your current search and filters.'
              : 'Your Cafe Shelf is empty. Add your favorite in-person roasteries and coffee spots with their pinned addresses!'}
          </p>
          <button
            onClick={onAddCafe}
            className="mt-4 px-4 py-2 bg-[#C87D32] hover:bg-[#B06B26] text-white text-xs font-semibold rounded-lg transition-colors inline-flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            Add First Visited Cafe
          </button>
        </div>
      )}
    </div>
  );
};
