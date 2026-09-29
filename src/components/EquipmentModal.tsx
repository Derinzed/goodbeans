import React, { useState } from 'react';
import { X, Wrench, Sparkles } from 'lucide-react';
import { Equipment, EquipmentCategory } from '../types/coffee';
import { StarRatingInput } from './StarRating';

interface EquipmentModalProps {
  initialEquipment?: Equipment | null;
  onSave: (equipment: Equipment) => void;
  onClose: () => void;
}

const CATEGORIES: EquipmentCategory[] = [
  'Grinder',
  'Espresso Machine',
  'Pour Over / Dripper',
  'Kettle',
  'Scale',
  'Immersion',
  'Accessory',
  'Roaster',
];

export const EquipmentModal: React.FC<EquipmentModalProps> = ({
  initialEquipment,
  onSave,
  onClose,
}) => {
  const isEditing = Boolean(initialEquipment);

  const [name, setName] = useState(initialEquipment?.name || '');
  const [brand, setBrand] = useState(initialEquipment?.brand || '');
  const [category, setCategory] = useState<EquipmentCategory>(
    initialEquipment?.category || 'Grinder'
  );
  const [status, setStatus] = useState<'Active' | 'Wishlist' | 'Archived'>(
    initialEquipment?.status || 'Active'
  );
  const [dateAcquired, setDateAcquired] = useState(
    initialEquipment?.dateAcquired || new Date().toISOString().split('T')[0]
  );
  const [settingsNotes, setSettingsNotes] = useState(initialEquipment?.settingsNotes || '');
  const [maintenanceNotes, setMaintenanceNotes] = useState(
    initialEquipment?.maintenanceNotes || ''
  );
  const [generalNotes, setGeneralNotes] = useState(initialEquipment?.generalNotes || '');
  const [rating, setRating] = useState<number>(initialEquipment?.rating || 4.5);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const data: Equipment = {
      id: initialEquipment?.id || `eq-${Date.now()}`,
      name: name.trim(),
      brand: brand.trim(),
      category,
      status,
      dateAcquired,
      settingsNotes: settingsNotes.trim(),
      maintenanceNotes: maintenanceNotes.trim(),
      generalNotes: generalNotes.trim(),
      rating,
    };
    onSave(data);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
      <div className="bg-[#FAF7F2] border border-[#E5DACD] w-full max-w-xl rounded-xl shadow-2xl overflow-hidden my-8 animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-[#F3ECE2] border-b border-[#E8DEC0]/50">
          <div>
            <div className="text-[10px] uppercase font-bold tracking-wider text-[#8A6D56]">
              Equipment Shelf
            </div>
            <h2 className="font-serif text-xl font-bold text-[#2B1D14]">
              {isEditing ? 'Edit Coffee Gear' : 'Add New Equipment'}
            </h2>
            <p className="text-xs text-[#6B5A4E]">
              Track specs, burr calibrations, dial-in clicks, and maintenance
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
          {/* Name & Brand */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[#5B473A] uppercase tracking-wider mb-1">
                Equipment Model / Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. C40 MK4 Nitro Blade"
                className="w-full px-3 py-2 bg-white rounded-lg border border-[#DACDC0] text-sm text-[#2C2118]"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#5B473A] uppercase tracking-wider mb-1">
                Manufacturer / Brand
              </label>
              <input
                type="text"
                value={brand}
                onChange={(e) => setBrand(e.target.value)}
                placeholder="e.g. Comandante, Fellow, Hario"
                className="w-full px-3 py-2 bg-white rounded-lg border border-[#DACDC0] text-sm text-[#2C2118]"
                required
              />
            </div>
          </div>

          {/* Category & Status */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[#5B473A] uppercase tracking-wider mb-1">
                Gear Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as EquipmentCategory)}
                className="w-full px-3 py-2 bg-white rounded-lg border border-[#DACDC0] text-sm text-[#2C2118]"
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#5B473A] uppercase tracking-wider mb-1">
                Status
              </label>
              <select
                value={status}
                onChange={(e) =>
                  setStatus(e.target.value as 'Active' | 'Wishlist' | 'Archived')
                }
                className="w-full px-3 py-2 bg-white rounded-lg border border-[#DACDC0] text-sm text-[#2C2118]"
              >
                <option value="Active">Active Daily Driver</option>
                <option value="Wishlist">Wishlist</option>
                <option value="Archived">Archived / Backup</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#5B473A] uppercase tracking-wider mb-1">
                Acquired Date
              </label>
              <input
                type="date"
                value={dateAcquired}
                onChange={(e) => setDateAcquired(e.target.value)}
                className="w-full px-3 py-2 bg-white rounded-lg border border-[#DACDC0] text-sm text-[#2C2118]"
              />
            </div>
          </div>

          {/* Rating */}
          <div className="p-3 bg-white rounded-lg border border-[#E0D5C7]">
            <StarRatingInput
              value={rating}
              onChange={setRating}
              label="Personal Gear Rating"
              size="md"
            />
          </div>

          {/* Settings & Calibration Notes */}
          <div>
            <label className="block text-xs font-semibold text-[#5B473A] uppercase tracking-wider mb-1 flex items-center gap-1.5">
              <Wrench className="w-3.5 h-3.5 text-[#C87D32]" />
              <span>Settings, Clicks & Calibration Notes</span>
            </label>
            <textarea
              value={settingsNotes}
              onChange={(e) => setSettingsNotes(e.target.value)}
              placeholder="e.g. V60 sweet spot is 22-24 clicks. Espresso is 14 clicks with Red Clix. Zero point aligned at chirp -1."
              rows={2}
              className="w-full px-3 py-2 bg-white rounded-lg border border-[#DACDC0] text-sm text-[#2C2118] focus:outline-none focus:ring-2 focus:ring-[#C87D32]/40"
            />
          </div>

          {/* Maintenance & Cleaning Notes */}
          <div>
            <label className="block text-xs font-semibold text-[#5B473A] uppercase tracking-wider mb-1">
              Maintenance, Descaling & Cleaning History
            </label>
            <textarea
              value={maintenanceNotes}
              onChange={(e) => setMaintenanceNotes(e.target.value)}
              placeholder="e.g. Descaled with citric acid every 60 days. Backflushed with Cafiza weekly. Silicone gasket replaced last month."
              rows={2}
              className="w-full px-3 py-2 bg-white rounded-lg border border-[#DACDC0] text-sm text-[#2C2118] focus:outline-none focus:ring-2 focus:ring-[#C87D32]/40"
            />
          </div>

          {/* General Notes & Quirks */}
          <div>
            <label className="block text-xs font-semibold text-[#5B473A] uppercase tracking-wider mb-1">
              Barista Review & Quirks
            </label>
            <textarea
              value={generalNotes}
              onChange={(e) => setGeneralNotes(e.target.value)}
              placeholder="e.g. Outstanding clarity and separation of delicate floral notes. Requires slow feeding for dense light roasts."
              rows={2}
              className="w-full px-3 py-2 bg-white rounded-lg border border-[#DACDC0] text-sm text-[#2C2118] focus:outline-none focus:ring-2 focus:ring-[#C87D32]/40"
            />
          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#E8DEC0]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-[#6B5749] hover:text-[#2B1D14] transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 bg-[#C87D32] hover:bg-[#B06B26] text-white text-xs font-semibold rounded-lg shadow-sm hover:shadow transition-all flex items-center gap-1.5"
            >
              <Sparkles className="w-4 h-4" />
              {isEditing ? 'Save Equipment' : 'Add to Equipment Shelf'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
