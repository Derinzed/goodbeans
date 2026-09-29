import React, { useState } from 'react';
import { X, Sparkles, Pin, Plus, Tag, BookOpen } from 'lucide-react';
import { CustomNote, NoteCategory, Coffee } from '../types/coffee';

interface NoteModalProps {
  initialNote?: CustomNote | null;
  coffees?: Coffee[];
  defaultCoffeeId?: string;
  onSave: (note: CustomNote) => void;
  onClose: () => void;
}

const CATEGORIES: NoteCategory[] = [
  'Brew Technique',
  'Water Recipe',
  'Dial-in & Grind',
  'Roaster & Origin',
  'Cupping & Sensory',
  'Equipment Care',
  'General',
];

const SUGGESTED_TAGS = [
  'V60',
  'Espresso',
  'Water Chemistry',
  'Lotus Drops',
  'Grind Dial-in',
  'Degassing',
  'Nordic Roasts',
  'Fermentation',
  'Geisha',
  'Pour Flow',
  'Travel Setup',
];

export const NoteModal: React.FC<NoteModalProps> = ({
  initialNote,
  coffees = [],
  defaultCoffeeId,
  onSave,
  onClose,
}) => {
  const isEditing = Boolean(initialNote);

  const [title, setTitle] = useState(initialNote?.title || '');
  const [content, setContent] = useState(initialNote?.content || '');
  const [category, setCategory] = useState<NoteCategory>(
    initialNote?.category || 'Brew Technique'
  );
  const [isPinned, setIsPinned] = useState(initialNote?.isPinned || false);
  const [selectedCoffeeId, setSelectedCoffeeId] = useState<string>(
    initialNote?.coffeeId || defaultCoffeeId || ''
  );
  const [tags, setTags] = useState<string[]>(initialNote?.tags || []);
  const [customTagInput, setCustomTagInput] = useState('');

  const toggleTag = (tag: string) => {
    if (tags.includes(tag)) {
      setTags(tags.filter((t) => t !== tag));
    } else {
      setTags([...tags, tag]);
    }
  };

  const handleAddCustomTag = () => {
    const trimmed = customTagInput.trim();
    if (trimmed && !tags.includes(trimmed)) {
      setTags([...tags, trimmed]);
      setCustomTagInput('');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;

    const matchedCoffee = coffees.find((c) => c.id === selectedCoffeeId);

    const noteData: CustomNote = {
      id: initialNote?.id || `note-${Date.now()}`,
      title: title.trim(),
      content: content.trim(),
      category,
      tags,
      isPinned,
      date: initialNote?.date || new Date().toISOString().split('T')[0],
      coffeeId: selectedCoffeeId || undefined,
      coffeeName: matchedCoffee?.name || undefined,
    };

    onSave(noteData);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
      <div className="bg-[#FAF7F2] border border-[#E5DACD] w-full max-w-xl rounded-xl shadow-2xl overflow-hidden my-8 animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-[#F3ECE2] border-b border-[#E8DEC0]/50">
          <div>
            <div className="text-[10px] uppercase font-bold tracking-wider text-[#8A6D56]">
              Coffee Notebook
            </div>
            <h2 className="font-serif text-xl font-bold text-[#2B1D14]">
              {isEditing ? 'Edit Custom Note' : 'Add Custom Note'}
            </h2>
            <p className="text-xs text-[#6B5A4E]">
              Record brewing dial-ins, sensory experiments, water recipes, or coffee observations
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
          {/* Note Title */}
          <div>
            <label className="block text-xs font-semibold text-[#5B473A] uppercase tracking-wider mb-1">
              Note Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Aeropress Inverted 91°C Dial-in, Ethiopian Degassing..."
              className="w-full px-3 py-2 bg-white rounded-lg border border-[#DACDC0] text-sm text-[#2C2118] focus:outline-none focus:ring-2 focus:ring-[#C87D32]/40"
              required
            />
          </div>

          {/* Category & Pin Option */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[#5B473A] uppercase tracking-wider mb-1">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as NoteCategory)}
                className="w-full px-3 py-2 bg-white rounded-lg border border-[#DACDC0] text-xs font-medium text-[#2C2118]"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-end">
              <button
                type="button"
                onClick={() => setIsPinned(!isPinned)}
                className={`w-full py-2 px-3 rounded-lg border text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors ${
                  isPinned
                    ? 'bg-[#FBEEDC] text-[#8C4F1A] border-[#DDBF96]'
                    : 'bg-white text-[#7A6757] border-[#DACDC0] hover:bg-[#FAF7F2]'
                }`}
              >
                <Pin className={`w-3.5 h-3.5 ${isPinned ? 'fill-current' : ''}`} />
                <span>{isPinned ? 'Pinned to Top' : 'Pin Note'}</span>
              </button>
            </div>
          </div>

          {/* Optional Linked Coffee */}
          {coffees.length > 0 && (
            <div>
              <label className="block text-xs font-semibold text-[#5B473A] uppercase tracking-wider mb-1">
                Link to Specific Coffee (Optional)
              </label>
              <select
                value={selectedCoffeeId}
                onChange={(e) => setSelectedCoffeeId(e.target.value)}
                className="w-full px-3 py-2 bg-white rounded-lg border border-[#DACDC0] text-xs font-medium text-[#2C2118]"
              >
                <option value="">None (General Note)</option>
                {coffees.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.roaster})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Note Content */}
          <div>
            <label className="block text-xs font-semibold text-[#5B473A] uppercase tracking-wider mb-1">
              Note Content
            </label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Write your detailed observations, ratio adjustments, water chemistry, or cupping notes..."
              rows={6}
              className="w-full px-3 py-2.5 bg-white rounded-lg border border-[#DACDC0] text-xs leading-relaxed text-[#2C2118] focus:outline-none focus:ring-2 focus:ring-[#C87D32]/40 font-mono"
              required
            />
          </div>

          {/* Tags */}
          <div className="space-y-2">
            <label className="block text-xs font-semibold text-[#5B473A] uppercase tracking-wider">
              Tags & Keywords
            </label>

            <div className="flex flex-wrap gap-1.5 min-h-6">
              {tags.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => toggleTag(tag)}
                  className="px-2 py-0.5 rounded text-xs font-medium bg-[#3A291E] text-white flex items-center gap-1"
                >
                  <span>#{tag}</span>
                  <X className="w-3 h-3 opacity-70" />
                </button>
              ))}
            </div>

            <div className="flex flex-wrap gap-1 p-2 bg-[#F5ECE1] rounded-lg border border-[#E5DACD]">
              {SUGGESTED_TAGS.map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => toggleTag(t)}
                  className={`text-[11px] px-2 py-0.5 rounded transition-all ${
                    tags.includes(t)
                      ? 'bg-[#8B4822] text-white'
                      : 'bg-white hover:bg-[#FAF7F2] text-[#4F3C2F] border border-[#DECFC0]'
                  }`}
                >
                  +{t}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2 pt-1">
              <input
                type="text"
                value={customTagInput}
                onChange={(e) => setCustomTagInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddCustomTag();
                  }
                }}
                placeholder="Or type custom tag..."
                className="flex-1 px-3 py-1.5 bg-white rounded-md border border-[#D5C7B8] text-xs text-[#2C2017]"
              />
              <button
                type="button"
                onClick={handleAddCustomTag}
                className="px-3 py-1.5 bg-[#523F32] hover:bg-[#3D2D23] text-white text-xs font-semibold rounded-md flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" /> Add
              </button>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#E8DEC0]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-[#6B5749] hover:text-[#2B1D14]"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 bg-[#C87D32] hover:bg-[#B06B26] text-white text-xs font-semibold rounded-lg shadow-sm hover:shadow transition-all flex items-center gap-1.5"
            >
              <Sparkles className="w-4 h-4" />
              {isEditing ? 'Save Note' : 'Add Note'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
