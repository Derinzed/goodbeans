import React from 'react';
import {
  Sparkles,
  X,
  ArrowRight,
  CheckCircle2,
  Share2,
  Lock,
  Star,
  Coffee,
  Wrench,
  MapPin,
  AlertCircle,
  HelpCircle,
  ExternalLink,
} from 'lucide-react';

export interface CatalogMatchItem {
  id: string;
  name: string;
  secondary?: string; // Roaster / Brand / City
  matchScore: number;
  matchReason: string;
  catalogItem?: any;
}

interface CatalogDuplicateMatchModalProps {
  isOpen: boolean;
  itemType: 'coffee' | 'equipment' | 'cafe';
  candidateItem: any;
  matches: CatalogMatchItem[];
  explanation: string;
  onSwapToCommunityItem: (selectedMatch: CatalogMatchItem) => void;
  onPublishAsNew: () => void;
  onSavePrivateOnly: () => void;
  onBackToEdit: () => void;
}

export const CatalogDuplicateMatchModal: React.FC<CatalogDuplicateMatchModalProps> = ({
  isOpen,
  itemType,
  candidateItem,
  matches,
  explanation,
  onSwapToCommunityItem,
  onPublishAsNew,
  onSavePrivateOnly,
  onBackToEdit,
}) => {
  if (!isOpen || !candidateItem) return null;

  const topMatch = matches[0] || null;

  const getTypeIcon = () => {
    if (itemType === 'coffee') return <Coffee className="w-4 h-4 text-[#C87D32]" />;
    if (itemType === 'equipment') return <Wrench className="w-4 h-4 text-[#C87D32]" />;
    return <MapPin className="w-4 h-4 text-[#C87D32]" />;
  };

  const getSecondaryLabel = () => {
    if (itemType === 'coffee') return 'Roaster';
    if (itemType === 'equipment') return 'Brand';
    return 'City / Location';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm overflow-y-auto animate-fade-in">
      <div className="bg-[#FAF7F2] dark:bg-[#1E1916] border border-[#E5DACD] dark:border-[#382B24] text-[#2C241E] dark:text-[#E8DDD0] w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden my-6 flex flex-col max-h-[92vh]">
        {/* Modal Header with AI Badge */}
        <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-[#F4EDE4] via-[#F8F3EC] to-[#F4EDE4] dark:from-[#261F1B] dark:via-[#2C2420] dark:to-[#261F1B] border-b border-[#E5DACD] dark:border-[#382B24]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#FAF1E4] dark:bg-[#342A24] border border-[#E5DACD] dark:border-[#4A3B31] flex items-center justify-center text-[#C87D32] shadow-xs">
              <Sparkles className="w-5 h-5 text-[#C87D32]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-serif text-lg font-bold text-[#2B1D14] dark:text-[#F3ECE4]">
                  Similar Item Found in Community Catalog
                </h3>
                <span className="px-2 py-0.5 text-[10px] font-bold bg-[#C87D32] text-white rounded-md flex items-center gap-1 uppercase tracking-wider">
                  AI Matcher
                </span>
              </div>
              <p className="text-xs text-[#7A6757] dark:text-[#A8988B]">
                We checked the community catalog to help prevent duplicate entries
              </p>
            </div>
          </div>
          <button
            onClick={onBackToEdit}
            className="p-1.5 text-[#7A6757] hover:text-[#2B1D14] dark:text-[#A8988B] dark:hover:text-white rounded-lg hover:bg-[#EAE0D3] dark:hover:bg-[#342A24] transition-colors cursor-pointer"
            title="Cancel and back to edit"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6 space-y-5 overflow-y-auto flex-1">
          {/* AI Explanation Banner */}
          <div className="p-3.5 bg-[#FAF3EC] dark:bg-[#2A211B] border border-[#ECDCCB] dark:border-[#45362B] rounded-xl flex items-start gap-3">
            <Sparkles className="w-4 h-4 text-[#C87D32] shrink-0 mt-0.5" />
            <div className="text-xs text-[#6C5341] dark:text-[#D7C7B7] leading-relaxed">
              <span className="font-bold text-[#2B1D14] dark:text-[#F3ECE4] block mb-0.5">
                AI Match Analysis
              </span>
              {explanation ||
                `Your entry closely resembles an existing registered ${itemType} in the community catalog.`}
            </div>
          </div>

          {/* Comparison Cards: Your Entry vs Existing Community Catalog Item */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Left Card: Candidate User Entry */}
            <div className="p-4 bg-white dark:bg-[#181311] rounded-xl border border-[#E0D5C7] dark:border-[#382B24] space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase font-bold text-[#8C7A6D] dark:text-[#A8988B] tracking-wider">
                  Your New Submission
                </span>
                <span className="px-2 py-0.5 text-[10px] font-semibold bg-[#F5ECE1] dark:bg-[#28201C] text-[#6B5A4E] dark:text-[#C5B7A8] rounded-md">
                  Unregistered Draft
                </span>
              </div>

              <div>
                <span className="text-[11px] font-bold text-[#C87D32] block">
                  {candidateItem.roaster || candidateItem.brand || candidateItem.city || candidateItem.secondary || 'Custom'}
                </span>
                <h4 className="font-serif text-base font-bold text-[#2B1D14] dark:text-[#F3ECE4] leading-snug">
                  {candidateItem.name}
                </h4>
              </div>

              {/* Sub-details */}
              <div className="text-[11px] text-[#7A6757] dark:text-[#A8988B] space-y-1 pt-1 border-t border-[#F0E6DB] dark:border-[#2A211C]">
                {candidateItem.origin?.country && (
                  <div>Origin: <strong>{candidateItem.origin.country}</strong></div>
                )}
                {candidateItem.category && (
                  <div>Category: <strong>{candidateItem.category}</strong></div>
                )}
                {candidateItem.address && (
                  <div>Address: <strong>{candidateItem.address}</strong></div>
                )}
                {candidateItem.process && (
                  <div>Process: <strong>{candidateItem.process}</strong></div>
                )}
              </div>
            </div>

            {/* Right Card: Existing Community Catalog Item */}
            {topMatch && (
              <div className="p-4 bg-[#FAF7F2] dark:bg-[#221B18] rounded-xl border-2 border-[#C87D32] dark:border-[#C87D32] space-y-2.5 relative">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] uppercase font-bold text-[#C87D32] tracking-wider flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Existing Community Item
                  </span>
                  <span className="px-2 py-0.5 text-[10px] font-bold bg-[#C87D32] text-white rounded-md">
                    {topMatch.matchScore}% Match
                  </span>
                </div>

                <div>
                  <span className="text-[11px] font-bold text-[#C87D32] block">
                    {topMatch.secondary || topMatch.catalogItem?.roaster || topMatch.catalogItem?.brand || topMatch.catalogItem?.city}
                  </span>
                  <h4 className="font-serif text-base font-bold text-[#2B1D14] dark:text-[#F3ECE4] leading-snug">
                    {topMatch.name}
                  </h4>
                </div>

                {/* Rating & Reviews */}
                <div className="flex items-center gap-2 text-xs pt-1 border-t border-[#EAE0D3] dark:border-[#2F2621]">
                  {typeof topMatch.catalogItem?.generalRating === 'number' && topMatch.catalogItem.generalRating > 0 ? (
                    <div className="flex items-center gap-1 text-amber-600 dark:text-amber-400 font-bold font-mono">
                      <Star className="w-3.5 h-3.5 fill-current" />
                      <span>{topMatch.catalogItem.generalRating.toFixed(1)}</span>
                      <span className="text-[10px] text-[#8C7A6D] dark:text-[#9A8B7E] font-normal">
                        ({topMatch.catalogItem.ratingsCount || 1} community ratings)
                      </span>
                    </div>
                  ) : (
                    <span className="text-[11px] text-[#8C7A6D] dark:text-[#9A8B7E] italic">
                      Registered in Community Catalog
                    </span>
                  )}
                </div>

                {/* Match reason tag */}
                {topMatch.matchReason && (
                  <div className="p-2 bg-white dark:bg-[#181311] rounded-lg border border-[#E5DACD] dark:border-[#382B24] text-[11px] text-[#6B5A4E] dark:text-[#BDB0A4]">
                    💡 {topMatch.matchReason}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Multiple matches list if more than 1 */}
          {matches.length > 1 && (
            <div className="space-y-2">
              <span className="text-[11px] font-bold text-[#7A6757] dark:text-[#A8988B] uppercase tracking-wider block">
                Other Similar Registered Items ({matches.length - 1}):
              </span>
              <div className="space-y-2">
                {matches.slice(1).map((m) => (
                  <div
                    key={m.id}
                    className="p-3 bg-white dark:bg-[#181311] rounded-xl border border-[#E0D5C7] dark:border-[#382B24] flex items-center justify-between gap-3"
                  >
                    <div>
                      <span className="text-xs font-bold text-[#2B1D14] dark:text-[#F3ECE4] block">
                        {m.name}
                      </span>
                      <span className="text-[11px] text-[#7A6757] dark:text-[#A8988B]">
                        {m.secondary || 'Community Item'} · {m.matchScore}% Match ({m.matchReason})
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => onSwapToCommunityItem(m)}
                      className="px-3 py-1.5 bg-[#FAF7F2] dark:bg-[#251F1B] hover:bg-[#F3ECE2] dark:hover:bg-[#342A24] border border-[#D5C7B8] dark:border-[#382B24] text-[#8C4F1A] dark:text-[#ECA357] text-xs font-semibold rounded-lg transition-colors cursor-pointer shrink-0"
                    >
                      Use This
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Decision Guidance */}
          <div className="text-xs text-[#7A6757] dark:text-[#A8988B] leading-relaxed pt-2">
            <strong>What would you like to do?</strong>
            <ul className="list-disc list-inside mt-1 space-y-0.5">
              <li>
                <strong>Use Existing Catalog Item:</strong> Links your entry to the official community catalog, pooling ratings together while keeping all your personal notes and shelf settings.
              </li>
              <li>
                <strong>Publish as Unique Item:</strong> If this item is truly different (e.g. distinct roast lot, revision, or location), publishes a separate community entry.
              </li>
              <li>
                <strong>Keep Private:</strong> Saves your item strictly on your personal shelves without adding it to the community catalog.
              </li>
            </ul>
          </div>
        </div>

        {/* Action Buttons Footer */}
        <div className="px-6 py-4 border-t border-[#E5DACD] dark:border-[#382B24] bg-[#F4EDE4] dark:bg-[#251F1B] flex flex-wrap items-center justify-between gap-2.5">
          <button
            type="button"
            onClick={onBackToEdit}
            className="px-3 py-2 text-xs font-semibold text-[#6B5A4E] dark:text-[#C5B7A8] hover:text-[#2B1D14] dark:hover:text-white rounded-lg hover:bg-[#EAE0D3] dark:hover:bg-[#342A24] transition-colors cursor-pointer"
          >
            Back & Edit
          </button>

          <div className="flex flex-wrap items-center gap-2">
            {/* Action 1: Private only */}
            <button
              type="button"
              onClick={onSavePrivateOnly}
              className="px-3.5 py-2 bg-white dark:bg-[#1E1916] hover:bg-[#FAF7F2] dark:hover:bg-[#28211D] text-[#55473E] dark:text-[#C5B7A8] border border-[#D5C7B8] dark:border-[#382B24] text-xs font-semibold rounded-lg shadow-2xs transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <Lock className="w-3.5 h-3.5 text-[#7A6757]" />
              <span>Keep as Private Item</span>
            </button>

            {/* Action 2: Publish as unique */}
            <button
              type="button"
              onClick={onPublishAsNew}
              className="px-3.5 py-2 bg-[#F3ECE2] dark:bg-[#2E241E] hover:bg-[#EAE0D3] dark:hover:bg-[#3A2E26] text-[#8C4F1A] dark:text-[#ECA357] border border-[#D8C7B5] dark:border-[#4A3B31] text-xs font-semibold rounded-lg shadow-2xs transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>Publish as Unique Item</span>
            </button>

            {/* Action 3: Use Community Item (Primary Recommended) */}
            {topMatch && (
              <button
                type="button"
                onClick={() => onSwapToCommunityItem(topMatch)}
                className="px-4 py-2 bg-[#C87D32] hover:bg-[#B06B26] text-white text-xs font-semibold rounded-lg shadow-sm transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Use Existing Catalog Item (Recommended)</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
