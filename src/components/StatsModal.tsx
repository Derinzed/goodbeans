import React from 'react';
import { X, Award, MapPin, Coffee, Download, Upload, RotateCcw, Compass, FileText } from 'lucide-react';
import { Coffee as CoffeeType, Equipment, Cafe, CustomNote } from '../types/coffee';
import { stripGeneralCoffeeFields, stripGeneralEquipmentFields, stripGeneralCafeFields } from '../utils/communityLookup';

interface StatsModalProps {
  coffees: CoffeeType[];
  equipment: Equipment[];
  cafes?: Cafe[];
  notes?: CustomNote[];
  onResetData: () => void;
  onImportData: (dataJson: string) => void;
  onClose: () => void;
}

export const StatsModal: React.FC<StatsModalProps> = ({
  coffees,
  equipment,
  cafes = [],
  notes = [],
  onResetData,
  onImportData,
  onClose,
}) => {
  // Compute stats
  const totalTastings = coffees.reduce((acc, c) => acc + c.tastingLogs.length, 0);
  const totalRecipes = coffees.reduce((acc, c) => acc + c.recipes.length, 0);

  const ratedCoffees = coffees.filter((c) => c.userRating > 0);
  const avgRating =
    ratedCoffees.length > 0
      ? ratedCoffees.reduce((acc, c) => acc + c.userRating, 0) / ratedCoffees.length
      : 0;

  // Unique origins
  const uniqueOrigins = Array.from(new Set(coffees.map((c) => c.origin.country)));
  const uniqueRoasters = Array.from(new Set(coffees.map((c) => c.roaster)));

  // Export JSON (User specific data only)
  const handleExport = () => {
    const backup = {
      coffees: coffees.map(stripGeneralCoffeeFields),
      equipment: equipment.map(stripGeneralEquipmentFields),
      cafes: cafes.map(stripGeneralCafeFields),
      notes,
      exportDate: new Date().toISOString(),
      version: '1.4',
    };
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `goodbeans-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Import JSON
  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        onImportData(content);
        onClose();
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
      <div className="bg-[#FAF7F2] border border-[#E5DACD] w-full max-w-xl rounded-xl shadow-2xl overflow-hidden my-8 animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-[#F3ECE2] border-b border-[#E8DEC0]/50">
          <div>
            <div className="text-[10px] uppercase font-bold tracking-wider text-[#8A6D56]">
              Coffee Analytics & Library
            </div>
            <h2 className="font-serif text-xl font-bold text-[#2B1D14]">
              Year in Coffee & Data
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-[#7A6453] hover:text-[#2B1D14] rounded-lg hover:bg-[#EAE0D3] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Key Stats Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3 bg-white rounded-lg border border-[#E0D5C7] text-center">
              <span className="text-[10px] uppercase font-semibold text-[#8C7A6D] block">
                Total Beans
              </span>
              <span className="font-serif text-2xl font-bold text-[#2B1D14] font-mono">
                {coffees.length}
              </span>
            </div>
            <div className="p-3 bg-white rounded-lg border border-[#E0D5C7] text-center">
              <span className="text-[10px] uppercase font-semibold text-[#8C7A6D] block">
                Avg Rating
              </span>
              <span className="font-serif text-2xl font-bold text-[#C87D32] font-mono">
                {avgRating > 0 ? avgRating.toFixed(1) : '—'}
              </span>
            </div>
            <div className="p-3 bg-white rounded-lg border border-[#E0D5C7] text-center">
              <span className="text-[10px] uppercase font-semibold text-[#8C7A6D] block">
                Tastings Logged
              </span>
              <span className="font-serif text-2xl font-bold text-[#3B6E59] font-mono">
                {totalTastings}
              </span>
            </div>
            <div className="p-3 bg-white rounded-lg border border-[#E0D5C7] text-center">
              <span className="text-[10px] uppercase font-semibold text-[#8C7A6D] block">
                Dialed Recipes
              </span>
              <span className="font-serif text-2xl font-bold text-[#8C4F1A] font-mono">
                {totalRecipes}
              </span>
            </div>
          </div>

          {/* Origins & Roasters Explored */}
          <div className="p-4 bg-white rounded-xl border border-[#E0D5C7] space-y-3">
            <div>
              <span className="text-xs font-bold text-[#6B5341] uppercase tracking-wider block mb-1.5 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-[#C87D32]" />
                <span>Origins Explored ({uniqueOrigins.length} Countries)</span>
              </span>
              <div className="flex flex-wrap gap-1.5">
                {uniqueOrigins.map((country) => (
                  <span
                    key={country}
                    className="text-xs px-2.5 py-1 bg-[#F5ECE1] rounded text-[#4A3728] font-medium"
                  >
                    {country}
                  </span>
                ))}
              </div>
            </div>

            <div className="pt-2 border-t border-[#F0E6DB]">
              <span className="text-xs font-bold text-[#6B5341] uppercase tracking-wider block mb-1.5 flex items-center gap-1.5">
                <Coffee className="w-3.5 h-3.5 text-[#C87D32]" />
                <span>Roasteries ({uniqueRoasters.length} Roasters)</span>
              </span>
              <div className="flex flex-wrap gap-1.5">
                {uniqueRoasters.map((roaster) => (
                  <span
                    key={roaster}
                    className="text-xs px-2.5 py-1 bg-[#FAF7F2] rounded text-[#4A3728] border border-[#E5DACD]"
                  >
                    {roaster}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Backup & Portability Actions */}
          <div className="p-4 bg-[#F5ECE1] rounded-xl border border-[#E5DACD] space-y-3">
            <span className="text-xs font-bold text-[#553E2F] uppercase tracking-wider block">
              Library Data & Portability
            </span>
            <div className="flex flex-wrap gap-3">
              <button
                onClick={handleExport}
                className="px-3 py-2 bg-white hover:bg-[#FAF7F2] text-[#3B291D] border border-[#DACDC0] rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors shadow-2xs"
              >
                <Download className="w-4 h-4 text-[#C87D32]" />
                <span>Export JSON Backup</span>
              </button>

              <label className="px-3 py-2 bg-white hover:bg-[#FAF7F2] text-[#3B291D] border border-[#DACDC0] rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors shadow-2xs cursor-pointer">
                <Upload className="w-4 h-4 text-[#3B6E59]" />
                <span>Restore Backup</span>
                <input
                  type="file"
                  accept=".json"
                  onChange={handleFileInput}
                  className="hidden"
                />
              </label>

              <button
                onClick={() => {
                  onResetData();
                  onClose();
                }}
                className="px-3 py-2 text-xs text-[#8C7A6D] hover:text-red-700 underline transition-colors ml-auto flex items-center gap-1"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset to Default Catalog</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
