import React, { useState, useEffect } from 'react';
import {
  Coffee as CoffeeIcon,
  Shield,
  Calendar,
  Star,
  Award,
  Share2,
  Check,
  ArrowLeft,
  Flame,
  Globe,
  MapPin,
  Wrench,
  Sparkles,
  ExternalLink,
  Layers,
  Heart,
  BookOpen,
} from 'lucide-react';
import { authApi } from '../services/authApi';

interface PublicProfileViewProps {
  username: string;
  currentLoggedInUsername?: string | null;
  onBackToShelves: () => void;
  onOpenCoffeeModal?: () => void;
}

export const PublicProfileView: React.FC<PublicProfileViewProps> = ({
  username,
  currentLoggedInUsername,
  onBackToShelves,
}) => {
  const [profile, setProfile] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'coffees' | 'gear' | 'cafes' | 'sensory'>('coffees');

  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);
    setError(null);

    authApi
      .getPublicProfile(username)
      .then((res) => {
        if (!isMounted) return;
        if (res.success && res.profile) {
          setProfile(res.profile);
        } else {
          setError(res.error || `Barista profile for "${username}" not found.`);
        }
      })
      .catch((err) => {
        if (!isMounted) return;
        setError(err.message || 'Failed to load public profile.');
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [username]);

  const handleCopyLink = () => {
    const shareUrl = `${window.location.origin}?profile=${encodeURIComponent(username)}`;
    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(shareUrl).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2500);
      });
    }
  };

  const isOwnProfile =
    currentLoggedInUsername &&
    currentLoggedInUsername.trim().toLowerCase() === username.trim().toLowerCase();

  if (isLoading) {
    return (
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-12 text-center animate-fade-in">
        <div className="inline-flex p-4 bg-[#F5ECE1] dark:bg-[#1E1916] rounded-2xl border border-[#E0D5C7] dark:border-[#382B24] mb-4">
          <CoffeeIcon className="w-8 h-8 text-[#C87D32] animate-bounce" />
        </div>
        <h2 className="font-serif text-xl font-bold text-[#2B1D14] dark:text-[#E8DDD0]">
          Brewing Barista Profile...
        </h2>
        <p className="text-xs text-[#7A6757] dark:text-[#A8988B] mt-1">
          Fetching specialty shelves and brew collection for @{username}
        </p>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center animate-fade-in">
        <div className="p-6 bg-white dark:bg-[#1C1714] border border-[#E5DACD] dark:border-[#382B24] rounded-2xl shadow-sm space-y-4">
          <div className="w-12 h-12 rounded-full bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-400 mx-auto flex items-center justify-center">
            <CoffeeIcon className="w-6 h-6" />
          </div>
          <h2 className="font-serif text-xl font-bold text-[#2B1D14] dark:text-[#E8DDD0]">
            Profile Not Found
          </h2>
          <p className="text-xs text-[#7A6757] dark:text-[#A8988B] leading-relaxed">
            {error || `We couldn't find a public barista profile for "${username}". It may have been renamed or deleted.`}
          </p>
          <button
            type="button"
            onClick={onBackToShelves}
            className="px-4 py-2 bg-[#3A291E] hover:bg-[#251A13] dark:bg-[#C87D32] dark:hover:bg-[#B06B26] text-white text-xs font-semibold rounded-lg shadow-sm transition-colors inline-flex items-center gap-2 cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Return to Shelves</span>
          </button>
        </div>
      </div>
    );
  }

  const { user, stats, coffees = [], equipment = [], cafes = [] } = profile;

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6 animate-fade-in">
      {/* Top Navigation */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={onBackToShelves}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[#5B473A] dark:text-[#C5B7A8] hover:text-[#2B1D14] dark:hover:text-white bg-white dark:bg-[#1E1916] border border-[#E0D5C7] dark:border-[#382B24] rounded-lg shadow-2xs hover:bg-[#FAF7F2] dark:hover:bg-[#28211D] transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Brew Bar</span>
        </button>

        <button
          type="button"
          onClick={handleCopyLink}
          className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-lg border shadow-xs transition-all cursor-pointer ${
            copied
              ? 'bg-emerald-600 text-white border-emerald-600'
              : 'bg-[#C87D32] hover:bg-[#B06B26] text-white border-[#B06B26]'
          }`}
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5" />
              <span>Link Copied!</span>
            </>
          ) : (
            <>
              <Share2 className="w-3.5 h-3.5" />
              <span>Share Profile URL</span>
            </>
          )}
        </button>
      </div>

      {/* Hero Barista Header */}
      <div className="relative overflow-hidden bg-gradient-to-br from-[#2E2017] via-[#3A291E] to-[#1C140E] text-white rounded-3xl p-6 sm:p-8 shadow-xl border border-[#4E3728]/50">
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-[#C87D32]/15 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div className="flex items-center gap-4 sm:gap-5">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-br from-[#C87D32] to-[#8C4F1A] p-0.5 shadow-lg flex items-center justify-center shrink-0">
              <div className="w-full h-full bg-[#2B1D14] rounded-[14px] flex items-center justify-center text-white font-serif text-2xl sm:text-3xl font-bold">
                {user.username.slice(0, 1).toUpperCase()}
              </div>
            </div>

            <div>
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <h1 className="font-serif text-2xl sm:text-3xl font-bold tracking-tight text-[#FDF8F3]">
                  {user.username}
                </h1>
                {user.role === 'admin' ? (
                  <span className="px-2.5 py-0.5 text-[10px] font-bold bg-[#C87D32] text-white rounded-md flex items-center gap-1 uppercase tracking-wider shadow-2xs">
                    <Shield className="w-3 h-3" />
                    Admin
                  </span>
                ) : (
                  <span className="px-2.5 py-0.5 text-[10px] font-bold bg-white/15 text-[#EFE7DC] rounded-md backdrop-blur-xs flex items-center gap-1 uppercase tracking-wider">
                    <Award className="w-3 h-3 text-[#ECA357]" />
                    Specialty Barista
                  </span>
                )}
                {isOwnProfile && (
                  <span className="px-2 py-0.5 text-[10px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-md">
                    You (Viewing Public Link)
                  </span>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-[#D5C2B2]">
                <span className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-[#C87D32]" />
                  Joined {new Date(user.createdAt).toLocaleDateString(undefined, { month: 'short', year: 'numeric' })}
                </span>
                <span className="flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 text-[#ECA357]" />
                  {stats.totalTastings} Brew Logs Dialed
                </span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 w-full sm:w-auto text-center">
            <div className="bg-white/10 backdrop-blur-md rounded-xl p-2.5 sm:p-3 border border-white/10 min-w-[76px]">
              <span className="text-[10px] uppercase font-bold text-[#ECA357] block">Beans</span>
              <span className="font-serif text-lg sm:text-xl font-bold text-white">{stats.totalCoffees}</span>
            </div>
            <div className="bg-white/10 backdrop-blur-md rounded-xl p-2.5 sm:p-3 border border-white/10 min-w-[76px]">
              <span className="text-[10px] uppercase font-bold text-[#ECA357] block">Gear</span>
              <span className="font-serif text-lg sm:text-xl font-bold text-white">{stats.totalEquipment}</span>
            </div>
            <div className="bg-white/10 backdrop-blur-md rounded-xl p-2.5 sm:p-3 border border-white/10 min-w-[76px]">
              <span className="text-[10px] uppercase font-bold text-[#ECA357] block">Cafes</span>
              <span className="font-serif text-lg sm:text-xl font-bold text-white">{stats.totalCafes}</span>
            </div>
            <div className="bg-white/10 backdrop-blur-md rounded-xl p-2.5 sm:p-3 border border-white/10 min-w-[76px]">
              <span className="text-[10px] uppercase font-bold text-[#ECA357] block">Favs</span>
              <span className="font-serif text-lg sm:text-xl font-bold text-white">{stats.favoriteCoffeesCount}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-[#E0D5C7] dark:border-[#382B24] gap-2 sm:gap-4 overflow-x-auto pb-px">
        <button
          type="button"
          onClick={() => setActiveTab('coffees')}
          className={`pb-3 px-2 text-xs sm:text-sm font-semibold flex items-center gap-2 border-b-2 transition-colors cursor-pointer whitespace-nowrap ${
            activeTab === 'coffees'
              ? 'border-[#C87D32] text-[#C87D32] dark:text-[#ECA357]'
              : 'border-transparent text-[#7A6757] dark:text-[#A8988B] hover:text-[#2B1D14] dark:hover:text-white'
          }`}
        >
          <CoffeeIcon className="w-4 h-4" />
          <span>Coffee Collection ({coffees.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('gear')}
          className={`pb-3 px-2 text-xs sm:text-sm font-semibold flex items-center gap-2 border-b-2 transition-colors cursor-pointer whitespace-nowrap ${
            activeTab === 'gear'
              ? 'border-[#C87D32] text-[#C87D32] dark:text-[#ECA357]'
              : 'border-transparent text-[#7A6757] dark:text-[#A8988B] hover:text-[#2B1D14] dark:hover:text-white'
          }`}
        >
          <Wrench className="w-4 h-4" />
          <span>Brew Bar Setup ({equipment.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('cafes')}
          className={`pb-3 px-2 text-xs sm:text-sm font-semibold flex items-center gap-2 border-b-2 transition-colors cursor-pointer whitespace-nowrap ${
            activeTab === 'cafes'
              ? 'border-[#C87D32] text-[#C87D32] dark:text-[#ECA357]'
              : 'border-transparent text-[#7A6757] dark:text-[#A8988B] hover:text-[#2B1D14] dark:hover:text-white'
          }`}
        >
          <MapPin className="w-4 h-4" />
          <span>Visited Cafes ({cafes.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('sensory')}
          className={`pb-3 px-2 text-xs sm:text-sm font-semibold flex items-center gap-2 border-b-2 transition-colors cursor-pointer whitespace-nowrap ${
            activeTab === 'sensory'
              ? 'border-[#C87D32] text-[#C87D32] dark:text-[#ECA357]'
              : 'border-transparent text-[#7A6757] dark:text-[#A8988B] hover:text-[#2B1D14] dark:hover:text-white'
          }`}
        >
          <Sparkles className="w-4 h-4" />
          <span>Sensory & Origins ({stats.topOrigins.length})</span>
        </button>
      </div>

      {/* Tab: Coffees */}
      {activeTab === 'coffees' && (
        <div className="space-y-4">
          {coffees.length === 0 ? (
            <div className="p-12 text-center bg-white dark:bg-[#1E1916] rounded-2xl border border-[#E0D5C7] dark:border-[#382B24]">
              <CoffeeIcon className="w-10 h-10 text-[#C87D32]/60 mx-auto mb-2" />
              <p className="text-sm font-semibold text-[#2B1D14] dark:text-[#E8DDD0]">
                No public coffees logged yet
              </p>
              <p className="text-xs text-[#7A6757] dark:text-[#A8988B] mt-0.5">
                This barista is currently exploring new origins.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {coffees.map((coffee: any) => {
                const userRating = typeof coffee.userRating === 'number' && coffee.userRating > 0 ? coffee.userRating : null;
                return (
                  <div
                    key={coffee.id}
                    className="bg-white dark:bg-[#1E1916] border border-[#E5DACD] dark:border-[#382B24] rounded-2xl p-5 shadow-xs hover:shadow-md transition-shadow flex flex-col justify-between relative overflow-hidden"
                  >
                    <div
                      className="absolute top-0 left-0 right-0 h-1.5"
                      style={{ backgroundColor: coffee.coverColor || '#C87D32' }}
                    />

                    <div className="space-y-3 pt-1">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <span className="text-[10px] uppercase font-bold text-[#8C4F1A] dark:text-[#ECA357] tracking-wider block truncate">
                            {coffee.roaster}
                          </span>
                          <h3 className="font-serif text-lg font-bold text-[#2B1D14] dark:text-[#F3ECE4] leading-snug">
                            {coffee.name}
                          </h3>
                        </div>
                        {coffee.isFavorite && (
                          <div className="p-1.5 bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 rounded-lg shrink-0">
                            <Heart className="w-4 h-4 fill-current" />
                          </div>
                        )}
                      </div>

                      {/* Origin & Specs */}
                      <div className="flex flex-wrap gap-1.5 text-[11px] text-[#55473E] dark:text-[#BDB0A4]">
                        {coffee.origin?.country && (
                          <span className="px-2 py-0.5 bg-[#F5ECE1] dark:bg-[#2A221E] rounded-md font-medium flex items-center gap-1">
                            <Globe className="w-3 h-3 text-[#C87D32]" />
                            {coffee.origin.country}
                          </span>
                        )}
                        {coffee.process && (
                          <span className="px-2 py-0.5 bg-[#F5ECE1] dark:bg-[#2A221E] rounded-md">
                            {coffee.process}
                          </span>
                        )}
                        {coffee.roastLevel && (
                          <span className="px-2 py-0.5 bg-[#F5ECE1] dark:bg-[#2A221E] rounded-md flex items-center gap-1">
                            <Flame className="w-3 h-3 text-amber-600" />
                            {coffee.roastLevel} Roast
                          </span>
                        )}
                      </div>

                      {/* Tasting Flavor Tags */}
                      {Array.isArray(coffee.tastingNotesSummary) && coffee.tastingNotesSummary.length > 0 && (
                        <div className="flex flex-wrap gap-1 pt-1">
                          {coffee.tastingNotesSummary.slice(0, 4).map((tag: string) => (
                            <span
                              key={tag}
                              className="text-[10px] font-semibold px-2 py-0.5 bg-[#FAF3EC] dark:bg-[#2F2621] text-[#8C4F1A] dark:text-[#ECA357] border border-[#ECDCCB] dark:border-[#44362E] rounded-full"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Description */}
                      {coffee.description && (
                        <p className="text-xs text-[#6B5A4E] dark:text-[#A8988B] line-clamp-2 leading-relaxed">
                          {coffee.description}
                        </p>
                      )}
                    </div>

                    {/* Bottom Personal Score */}
                    <div className="pt-4 mt-4 border-t border-[#F0E6DA] dark:border-[#2F2621] flex items-center justify-between text-xs">
                      <div>
                        {userRating ? (
                          <div className="flex items-center gap-1">
                            <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                            <span className="font-bold text-[#2B1D14] dark:text-white font-mono">
                              {userRating.toFixed(1)}
                            </span>
                            <span className="text-[10px] text-[#8C7A6D] dark:text-[#9A8B7E]">
                              Personal Score
                            </span>
                          </div>
                        ) : (
                          <span className="text-[11px] text-[#8C7A6D] dark:text-[#9A8B7E] italic">
                            Unrated
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2 text-[11px] text-[#8C7A6D] dark:text-[#9A8B7E]">
                        {coffee.tastingsCount > 0 && (
                          <span className="flex items-center gap-0.5">
                            <Sparkles className="w-3 h-3 text-[#C87D32]" />
                            {coffee.tastingsCount} logs
                          </span>
                        )}
                        {coffee.recipesCount > 0 && (
                          <span className="flex items-center gap-0.5">
                            <BookOpen className="w-3 h-3 text-[#3B6E59]" />
                            {coffee.recipesCount} recipes
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Tab: Gear */}
      {activeTab === 'gear' && (
        <div className="space-y-4">
          {equipment.length === 0 ? (
            <div className="p-12 text-center bg-white dark:bg-[#1E1916] rounded-2xl border border-[#E0D5C7] dark:border-[#382B24]">
              <Wrench className="w-10 h-10 text-[#C87D32]/60 mx-auto mb-2" />
              <p className="text-sm font-semibold text-[#2B1D14] dark:text-[#E8DDD0]">
                No brew gear logged yet
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {equipment.map((gear: any) => (
                <div
                  key={gear.id}
                  className="bg-white dark:bg-[#1E1916] border border-[#E5DACD] dark:border-[#382B24] rounded-2xl p-5 shadow-xs flex flex-col justify-between space-y-3"
                >
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="text-[10px] uppercase font-bold text-[#8C4F1A] dark:text-[#ECA357] tracking-wider block">
                          {gear.brand} · {gear.category}
                        </span>
                        <h3 className="font-serif text-base font-bold text-[#2B1D14] dark:text-[#F3ECE4]">
                          {gear.name}
                        </h3>
                      </div>
                      {typeof gear.rating === 'number' && gear.rating > 0 && (
                        <div className="flex items-center gap-1 font-mono text-xs font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 px-2 py-0.5 rounded-md border border-amber-200/50">
                          <Star className="w-3 h-3 fill-current" />
                          <span>{gear.rating.toFixed(1)}</span>
                        </div>
                      )}
                    </div>

                    {gear.settingsNotes && (
                      <div className="p-2.5 bg-[#FAF7F2] dark:bg-[#261E1A] rounded-lg border border-[#EAE0D3] dark:border-[#382B24] text-xs">
                        <span className="font-bold text-[#634937] dark:text-[#D5C2B2] block text-[10px] uppercase tracking-wider mb-0.5">
                          Dial-in Settings & Clicks:
                        </span>
                        <p className="text-[#3A291E] dark:text-[#E0D5C7] leading-relaxed line-clamp-3">
                          {gear.settingsNotes}
                        </p>
                      </div>
                    )}

                    {gear.generalNotes && (
                      <p className="text-xs text-[#6B5A4E] dark:text-[#A8988B] line-clamp-2 leading-relaxed">
                        {gear.generalNotes}
                      </p>
                    )}
                  </div>

                  <div className="pt-2 border-t border-[#F0E6DA] dark:border-[#2F2621] flex items-center justify-between text-[11px] text-[#8C7A6D] dark:text-[#9A8B7E]">
                    <span>Status: <strong className="text-[#3A291E] dark:text-[#E8DDD0]">{gear.status || 'Active'}</strong></span>
                    <span className="font-mono">{gear.category}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab: Cafes */}
      {activeTab === 'cafes' && (
        <div className="space-y-4">
          {cafes.length === 0 ? (
            <div className="p-12 text-center bg-white dark:bg-[#1E1916] rounded-2xl border border-[#E0D5C7] dark:border-[#382B24]">
              <MapPin className="w-10 h-10 text-[#C87D32]/60 mx-auto mb-2" />
              <p className="text-sm font-semibold text-[#2B1D14] dark:text-[#E8DDD0]">
                No visited cafes logged yet
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {cafes.map((cafe: any) => (
                <div
                  key={cafe.id}
                  className="bg-white dark:bg-[#1E1916] border border-[#E5DACD] dark:border-[#382B24] rounded-2xl p-5 shadow-xs flex flex-col justify-between space-y-3"
                >
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="text-[10px] uppercase font-bold text-[#8C4F1A] dark:text-[#ECA357] tracking-wider block">
                          {cafe.city}, {cafe.country}
                        </span>
                        <h3 className="font-serif text-base font-bold text-[#2B1D14] dark:text-[#F3ECE4]">
                          {cafe.name}
                        </h3>
                      </div>
                      {typeof cafe.rating === 'number' && cafe.rating > 0 && (
                        <div className="flex items-center gap-1 font-mono text-xs font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 px-2 py-0.5 rounded-md border border-amber-200/50">
                          <Star className="w-3 h-3 fill-current" />
                          <span>{cafe.rating.toFixed(1)}</span>
                        </div>
                      )}
                    </div>

                    {cafe.favoriteDrink && (
                      <div className="text-xs text-[#553E2F] dark:text-[#D5C2B2]">
                        <span className="text-[10px] uppercase font-bold text-[#8C7A6D] dark:text-[#A8988B] block">
                          Favorite Order:
                        </span>
                        <strong>{cafe.favoriteDrink}</strong>
                      </div>
                    )}

                    {Array.isArray(cafe.vibes) && cafe.vibes.length > 0 && (
                      <div className="flex flex-wrap gap-1 pt-1">
                        {cafe.vibes.map((v: string) => (
                          <span
                            key={v}
                            className="text-[10px] font-semibold px-2 py-0.5 bg-[#F5ECE1] dark:bg-[#2A221E] text-[#55473E] dark:text-[#D5C2B2] rounded-md"
                          >
                            {v}
                          </span>
                        ))}
                      </div>
                    )}

                    {cafe.notes && (
                      <p className="text-xs text-[#6B5A4E] dark:text-[#A8988B] line-clamp-2 leading-relaxed">
                        {cafe.notes}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab: Sensory & Origins */}
      {activeTab === 'sensory' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Top Flavor Notes */}
          <div className="bg-white dark:bg-[#1E1916] border border-[#E5DACD] dark:border-[#382B24] rounded-2xl p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-serif text-lg font-bold text-[#2B1D14] dark:text-[#F3ECE4] flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#C87D32]" />
                <span>Signature Flavor Palette</span>
              </h3>
              <span className="text-xs text-[#8C7A6D] dark:text-[#9A8B7E]">
                From {stats.totalTastings} cups brewed
              </span>
            </div>

            {stats.topFlavors.length === 0 ? (
              <p className="text-xs text-[#7A6757] dark:text-[#A8988B] italic">
                No flavor tags logged yet.
              </p>
            ) : (
              <div className="space-y-2.5">
                {stats.topFlavors.map((item: { name: string; count: number }, idx: number) => {
                  const max = stats.topFlavors[0]?.count || 1;
                  const percentage = Math.round((item.count / max) * 100);
                  return (
                    <div key={item.name} className="space-y-1">
                      <div className="flex items-center justify-between text-xs font-semibold text-[#2B1D14] dark:text-[#E8DDD0]">
                        <span className="flex items-center gap-1.5">
                          <span className="text-[10px] font-mono text-[#8C7A6D] dark:text-[#9A8B7E] w-4">
                            #{idx + 1}
                          </span>
                          <span>{item.name}</span>
                        </span>
                        <span className="font-mono text-[11px] text-[#8C4F1A] dark:text-[#ECA357]">
                          {item.count} {item.count === 1 ? 'time' : 'times'}
                        </span>
                      </div>
                      <div className="h-2 w-full bg-[#FAF5EE] dark:bg-[#2A221E] rounded-full overflow-hidden border border-[#EDE2D4] dark:border-[#382B24]">
                        <div
                          className="h-full bg-gradient-to-r from-[#C87D32] to-[#ECA357] rounded-full transition-all duration-500"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Origins Explored */}
          <div className="bg-white dark:bg-[#1E1916] border border-[#E5DACD] dark:border-[#382B24] rounded-2xl p-6 shadow-xs space-y-4">
            <h3 className="font-serif text-lg font-bold text-[#2B1D14] dark:text-[#F3ECE4] flex items-center gap-2">
              <Globe className="w-4 h-4 text-[#3B6E59]" />
              <span>Origins & Terroirs Explored</span>
            </h3>

            {stats.topOrigins.length === 0 ? (
              <p className="text-xs text-[#7A6757] dark:text-[#A8988B] italic">
                No origin countries recorded yet.
              </p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {stats.topOrigins.map((origin: string) => (
                  <div
                    key={origin}
                    className="px-3 py-2 bg-[#F5ECE1] dark:bg-[#2A221E] border border-[#E0D5C7] dark:border-[#382B24] rounded-xl flex items-center gap-2 text-xs font-semibold text-[#2B1D14] dark:text-[#E8DDD0]"
                  >
                    <Globe className="w-3.5 h-3.5 text-[#3B6E59]" />
                    <span>{origin}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
