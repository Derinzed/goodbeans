import React, { useState } from 'react';
import { X, Plus, Trash2, Layers, Sparkles } from 'lucide-react';
import { Shelf } from '../types/coffee';

interface ShelfModalProps {
  shelves: Shelf[];
  onAddShelf: (newShelf: Omit<Shelf, 'id' | 'isDefault'>) => void;
  onDeleteShelf: (shelfId: string) => void;
  onClose: () => void;
}

const SHELF_COLORS = [
  '#935824',
  '#3B6E59',
  '#55473E',
  '#A83232',
  '#6E48AA',
  '#7D4721',
  '#2C5282',
  '#B7791F',
];

export const ShelfModal: React.FC<ShelfModalProps> = ({
  shelves,
  onAddShelf,
  onDeleteShelf,
  onClose,
}) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [color, setColor] = useState('#6E48AA');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    onAddShelf({
      name: name.trim(),
      description: description.trim() || undefined,
      color,
    });
    setName('');
    setDescription('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
      <div className="bg-[#FAF7F2] border border-[#E5DACD] w-full max-w-lg rounded-xl shadow-2xl overflow-hidden my-8 animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-[#F3ECE2] border-b border-[#E8DEC0]/50">
          <div>
            <div className="text-[10px] uppercase font-bold tracking-wider text-[#8A6D56]">
              Coffee Shelves
            </div>
            <h2 className="font-serif text-xl font-bold text-[#2B1D14]">
              Manage Custom Shelves
            </h2>
            <p className="text-xs text-[#6B5A4E]">
              Organize your coffee library just like Goodreads shelves
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-[#7A6453] hover:text-[#2B1D14] rounded-lg hover:bg-[#EAE0D3] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Create New Shelf Form */}
          <form onSubmit={handleSubmit} className="p-4 bg-white rounded-xl border border-[#E0D5C7] space-y-3">
            <span className="text-xs font-bold text-[#6B5341] uppercase tracking-wider block">
              Create New Custom Shelf
            </span>

            <div>
              <label className="block text-xs text-[#6B5749] mb-1">Shelf Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Geishas & Exotics, Decaf Discoveries..."
                className="w-full px-3 py-1.5 bg-[#FAF7F2] rounded-md border border-[#D5C7B8] text-xs text-[#2C2017]"
                required
              />
            </div>

            <div>
              <label className="block text-xs text-[#6B5749] mb-1">Description (Optional)</label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="e.g. Rare high-elevation micro-lots reserved for Sunday pour overs"
                className="w-full px-3 py-1.5 bg-[#FAF7F2] rounded-md border border-[#D5C7B8] text-xs text-[#2C2017]"
              />
            </div>

            <div>
              <label className="block text-xs text-[#6B5749] mb-1">Shelf Color</label>
              <div className="flex items-center gap-2">
                {SHELF_COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setColor(c)}
                    className={`w-6 h-6 rounded-full border-2 transition-transform ${
                      color === c ? 'scale-110 border-[#2B1D14]' : 'border-white'
                    }`}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
            </div>

            <button
              type="submit"
              className="mt-2 w-full py-2 bg-[#C87D32] hover:bg-[#B06B26] text-white text-xs font-semibold rounded-md flex items-center justify-center gap-1.5 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              Create Shelf
            </button>
          </form>

          {/* Current Shelves List */}
          <div className="space-y-2">
            <span className="text-xs font-bold text-[#6B5341] uppercase tracking-wider block">
              Active Shelves
            </span>

            <div className="space-y-1.5 max-h-60 overflow-y-auto">
              {shelves.map((shelf) => (
                <div
                  key={shelf.id}
                  className="flex items-center justify-between p-2.5 bg-white rounded-lg border border-[#E5DACD] text-xs"
                >
                  <div className="flex items-center gap-2.5">
                    <div
                      className="w-3 h-3 rounded-full shrink-0"
                      style={{ backgroundColor: shelf.color || '#8C4F1A' }}
                    />
                    <div>
                      <div className="font-semibold text-[#2B1D14] flex items-center gap-1.5">
                        <span>{shelf.name}</span>
                        {shelf.isDefault && (
                          <span className="text-[10px] text-[#8C7A6D] bg-[#F2E8DC] px-1.5 py-0.2 rounded font-normal">
                            Default
                          </span>
                        )}
                      </div>
                      {shelf.description && (
                        <p className="text-[11px] text-[#7A6757] line-clamp-1">
                          {shelf.description}
                        </p>
                      )}
                    </div>
                  </div>

                  {!shelf.isDefault && (
                    <button
                      onClick={() => onDeleteShelf(shelf.id)}
                      className="text-[#9E8B7D] hover:text-red-700 p-1"
                      title="Delete custom shelf"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="px-6 py-3 bg-[#F3ECE2] border-t border-[#E8DEC0] flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-[#3D2D23] hover:bg-[#251A13] text-white text-xs font-semibold rounded-md transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
