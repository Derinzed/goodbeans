import React, { useState } from 'react';
import {
  Plus,
  Wrench,
  Search,
  Sparkles,
  Sliders,
  Calendar,
  Layers,
  Edit2,
  Trash2,
} from 'lucide-react';
import { Equipment, EquipmentCategory, RegisteredEquipment } from '../types/coffee';
import { StarRatingDisplay, StarRatingInput } from './StarRating';
import { getGeneralEquipmentInfo } from '../utils/communityLookup';

interface EquipmentShelfViewProps {
  equipment: Equipment[];
  onAddEquipment: () => void;
  onEditEquipment: (item: Equipment) => void;
  onDeleteEquipment: (id: string) => void;
  onQuickRate?: (id: string, rating: number) => void;
  registeredEquipment?: RegisteredEquipment[];
  isRegisteredUser?: boolean;
}

const CATEGORIES: ('All' | EquipmentCategory)[] = [
  'All',
  'Grinder',
  'Espresso Machine',
  'Pour Over / Dripper',
  'Kettle',
  'Scale',
  'Immersion',
  'Accessory',
];

export const EquipmentShelfView: React.FC<EquipmentShelfViewProps> = ({
  equipment,
  onAddEquipment,
  onEditEquipment,
  onDeleteEquipment,
  onQuickRate,
  registeredEquipment = [],
  isRegisteredUser = false,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<'All' | EquipmentCategory>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | 'Active' | 'Wishlist' | 'Archived'>(
    'All'
  );

  const filteredEquipment = equipment.filter((item) => {
    if (selectedCategory !== 'All' && item.category !== selectedCategory) return false;
    if (statusFilter !== 'All' && item.status !== statusFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = item.name.toLowerCase().includes(q);
      const matchBrand = item.brand.toLowerCase().includes(q);
      const matchNotes = (item.settingsNotes + ' ' + item.generalNotes).toLowerCase().includes(q);
      if (!matchName && !matchBrand && !matchNotes) return false;
    }
    return true;
  });

  const activeCount = equipment.filter((e) => e.status === 'Active').length;
  const grinderCount = equipment.filter((e) => e.category === 'Grinder').length;
  const brewerCount = equipment.filter(
    (e) => e.category === 'Pour Over / Dripper' || e.category === 'Immersion' || e.category === 'Espresso Machine'
  ).length;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Top Header & Stats */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-4 border-b border-[#E5DACD]">
        <div>
          <div className="text-xs font-semibold uppercase tracking-wider text-[#8A6D56]">
            The Barista Toolset
          </div>
          <h1 className="font-serif text-3xl font-bold text-[#2B1D14] tracking-tight">
            Equipment Shelf
          </h1>
          <p className="text-sm text-[#6B5A4E] mt-1 max-w-xl">
            Store your grinders, brewers, espresso machines, and dial-in calibrations. Reference these
            specs when brewing and linking to coffee recipes.
          </p>
        </div>

        <button
          onClick={onAddEquipment}
          className="self-start md:self-auto px-5 py-2.5 bg-[#C87D32] hover:bg-[#B06B26] text-white text-xs font-semibold rounded-lg shadow-sm hover:shadow transition-all flex items-center gap-1.5"
        >
          <Plus className="w-4 h-4" />
          Add Equipment
        </button>
      </div>

      {/* Overview Stat Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3.5 bg-white/80 rounded-xl border border-[#E5DACD] shadow-xs">
          <div className="text-[11px] uppercase font-semibold text-[#8C7A6D]">Total Gear</div>
          <div className="font-serif text-2xl font-bold text-[#2B1D14] font-mono tabular-nums">
            {equipment.length}
          </div>
        </div>
        <div className="p-3.5 bg-white/80 rounded-xl border border-[#E5DACD] shadow-xs">
          <div className="text-[11px] uppercase font-semibold text-[#8C7A6D]">Active Daily</div>
          <div className="font-serif text-2xl font-bold text-[#3B6E59] font-mono tabular-nums">
            {activeCount}
          </div>
        </div>
        <div className="p-3.5 bg-white/80 rounded-xl border border-[#E5DACD] shadow-xs">
          <div className="text-[11px] uppercase font-semibold text-[#8C7A6D]">Grinders</div>
          <div className="font-serif text-2xl font-bold text-[#8C4F1A] font-mono tabular-nums">
            {grinderCount}
          </div>
        </div>
        <div className="p-3.5 bg-white/80 rounded-xl border border-[#E5DACD] shadow-xs">
          <div className="text-[11px] uppercase font-semibold text-[#8C7A6D]">Brewers & Machines</div>
          <div className="font-serif text-2xl font-bold text-[#2B1D14] font-mono tabular-nums">
            {brewerCount}
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 p-3 bg-white/80 rounded-xl border border-[#E5DACD]">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-[#8C7A6D] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search equipment by name, brand, or calibration notes..."
            className="w-full pl-9 pr-3 py-1.5 bg-[#FAF7F2] rounded-lg border border-[#E0D5C7] text-xs text-[#2C2118] focus:outline-none focus:ring-1 focus:ring-[#C87D32]"
          />
        </div>

        {/* Status segmented buttons */}
        <div className="flex items-center gap-1 p-1 bg-[#F2E8DC] rounded-lg text-xs self-start md:self-auto">
          {(['All', 'Active', 'Wishlist', 'Archived'] as const).map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1 rounded-md transition-all font-medium ${
                statusFilter === st
                  ? 'bg-white text-[#2B1D14] shadow-xs'
                  : 'text-[#6D5A4E] hover:text-[#2B1D14]'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Category Pills */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-3 py-1.5 rounded-lg whitespace-nowrap font-medium border transition-all ${
              selectedCategory === cat
                ? 'bg-[#3A2A1E] text-white border-[#3A2A1E]'
                : 'bg-white text-[#523F32] border-[#E0D5C7] hover:bg-[#FAF7F2]'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Equipment Cards Grid */}
      {filteredEquipment.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredEquipment.map((item) => (
            <div
              key={item.id}
              className="bg-white rounded-xl border border-[#E5DACD] shadow-xs hover:shadow-md transition-all p-5 flex flex-col justify-between"
            >
              <div>
                {/* Top category & status */}
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="font-semibold text-[#8C4F1A]">{item.category}</span>
                  <span
                    className={`text-[10px] font-semibold px-2 py-0.5 rounded ${
                      item.status === 'Active'
                        ? 'bg-emerald-100 text-emerald-800'
                        : item.status === 'Wishlist'
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-stone-200 text-stone-700'
                    }`}
                  >
                    {item.status}
                  </span>
                </div>

                {/* Title & Brand */}
                <h3 className="font-serif text-lg font-bold text-[#2B1D14] leading-snug">
                  {item.name}
                </h3>
                <div className="text-xs text-[#7D6B5D] font-medium mb-2">{item.brand}</div>

                {/* Dual Rating: Personal & General */}
                <div className="mb-3 p-2.5 bg-[#FAF7F2] rounded-lg border border-[#EDE2D4] space-y-2">
                  <StarRatingInput
                    value={item.rating || 0}
                    onChange={(newRating) => onQuickRate && onQuickRate(item.id, newRating)}
                    label="Your Gear Rating"
                    size="sm"
                  />
                  <div className="flex items-center justify-between text-[10px] text-[#7A6757] pt-1.5 border-t border-[#EDE2D4]">
                    <span className="text-[#8C7A6D]">General Rating:</span>
                    <span className="font-semibold text-[#8C4F1A] font-mono">
                      {(() => {
                        const generalInfo = getGeneralEquipmentInfo(item, registeredEquipment);
                        return generalInfo.ratingsCount > 0 ? (
                          <>★ {generalInfo.generalRating.toFixed(1)} ({generalInfo.ratingsCount} {generalInfo.ratingsCount === 1 ? 'barista' : 'baristas'})</>
                        ) : (
                          <span className="text-[#A8988A] font-normal">Unrated (0)</span>
                        );
                      })()}
                    </span>
                  </div>
                </div>

                {/* Calibration / Settings Notes */}
                {item.settingsNotes && (
                  <div className="p-2.5 bg-[#FAF7F2] rounded-lg border border-[#EDE3D8] mb-3 text-xs">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-[#8C4F1A] flex items-center gap-1 mb-1">
                      <Sliders className="w-3 h-3" />
                      <span>Dial-In & Settings</span>
                    </div>
                    <p className="text-[#3A291E] leading-relaxed font-mono text-[11px]">
                      {item.settingsNotes}
                    </p>
                  </div>
                )}

                {/* Maintenance Notes */}
                {item.maintenanceNotes && (
                  <div className="text-xs text-[#524135] mb-2.5">
                    <div className="text-[10px] font-semibold uppercase tracking-wider text-[#7A6453] flex items-center gap-1 mb-0.5">
                      <Wrench className="w-3 h-3 text-[#C87D32]" />
                      <span>Maintenance</span>
                    </div>
                    <p className="text-[#6B5A4E] text-[11px] leading-relaxed">
                      {item.maintenanceNotes}
                    </p>
                  </div>
                )}

                {/* General Notes */}
                {item.generalNotes && (
                  <p className="text-xs text-[#6B5A4E] italic leading-relaxed pt-1 border-t border-[#F0E6DB]">
                    "{item.generalNotes}"
                  </p>
                )}
              </div>

              {/* Bottom footer: date & actions */}
              <div className="pt-4 mt-3 border-t border-[#F0E6DB] flex items-center justify-between text-xs text-[#8C7A6D]">
                <div className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>Acquired {item.dateAcquired || 'Recent'}</span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => onEditEquipment(item)}
                    className="p-1.5 text-[#6D5A4E] hover:text-[#2B1D14] hover:bg-[#F2E8DC] rounded transition-colors"
                    title="Edit gear"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => onDeleteEquipment(item.id)}
                    className="p-1.5 text-[#9E8B7D] hover:text-red-700 hover:bg-red-50 rounded transition-colors"
                    title="Delete gear"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-16 bg-white/60 rounded-xl border border-dashed border-[#DACDC0] p-8">
          <Layers className="w-10 h-10 text-[#A69587] mx-auto mb-3" />
          <h3 className="font-serif text-lg font-bold text-[#3B2B20]">No Equipment Found</h3>
          <p className="text-xs text-[#6D5A4E] mt-1 max-w-sm mx-auto">
            {searchQuery
              ? 'No gear matches your search criteria. Try a different filter or query.'
              : 'Your equipment shelf is empty. Add your favorite grinder, brewer, or espresso machine to track click settings and dial-in recipes!'}
          </p>
          <button
            onClick={onAddEquipment}
            className="mt-4 px-4 py-2 bg-[#C87D32] hover:bg-[#B06B26] text-white text-xs font-semibold rounded-lg transition-colors inline-flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            Add First Piece of Gear
          </button>
        </div>
      )}
    </div>
  );
};
