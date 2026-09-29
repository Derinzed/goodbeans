import React, { useState } from 'react';
import {
  FileText,
  Plus,
  Search,
  Pin,
  Edit2,
  Trash2,
  Tag,
  Coffee,
  Calendar,
  Filter,
} from 'lucide-react';
import { CustomNote, NoteCategory } from '../types/coffee';

interface NotesShelfViewProps {
  notes: CustomNote[];
  onAddNote: () => void;
  onEditNote: (note: CustomNote) => void;
  onDeleteNote: (noteId: string) => void;
  onTogglePin: (noteId: string) => void;
  onSelectCoffee?: (coffeeId: string) => void;
}

const CATEGORIES: ('All' | NoteCategory)[] = [
  'All',
  'Brew Technique',
  'Water Recipe',
  'Dial-in & Grind',
  'Roaster & Origin',
  'Cupping & Sensory',
  'Equipment Care',
  'General',
];

export const NotesShelfView: React.FC<NotesShelfViewProps> = ({
  notes,
  onAddNote,
  onEditNote,
  onDeleteNote,
  onTogglePin,
  onSelectCoffee,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<'All' | NoteCategory>('All');
  const [onlyPinned, setOnlyPinned] = useState(false);

  // Filter notes
  const filteredNotes = notes
    .filter((note) => {
      if (onlyPinned && !note.isPinned) return false;
      if (selectedCategory !== 'All' && note.category !== selectedCategory) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const inTitle = note.title.toLowerCase().includes(q);
        const inContent = note.content.toLowerCase().includes(q);
        const inCoffee = (note.coffeeName || '').toLowerCase().includes(q);
        const inTags = note.tags.some((t) => t.toLowerCase().includes(q));
        if (!inTitle && !inContent && !inCoffee && !inTags) return false;
      }
      return true;
    })
    .sort((a, b) => {
      // Pinned notes first, then newest date
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;
      return b.date.localeCompare(a.date);
    });

  const getCategoryColor = (cat: NoteCategory) => {
    switch (cat) {
      case 'Water Recipe':
        return 'bg-blue-50 text-blue-800 border-blue-200';
      case 'Brew Technique':
        return 'bg-amber-50 text-amber-800 border-amber-200';
      case 'Dial-in & Grind':
        return 'bg-emerald-50 text-emerald-800 border-emerald-200';
      case 'Cupping & Sensory':
        return 'bg-rose-50 text-rose-800 border-rose-200';
      case 'Roaster & Origin':
        return 'bg-purple-50 text-purple-800 border-purple-200';
      case 'Equipment Care':
        return 'bg-slate-50 text-slate-800 border-slate-200';
      default:
        return 'bg-[#FAF3EC] text-[#8C4F1A] border-[#EDE2D4]';
    }
  };

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-4 border-b border-[#E5DACD]">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#8A6D56]">
            <span>Coffee Notebook & Journal</span>
          </div>
          <h1 className="font-serif text-3xl font-bold text-[#2B1D14] tracking-tight mt-0.5">
            Custom Notes
          </h1>
          <p className="text-xs sm:text-sm text-[#6B5A4E] mt-1 max-w-xl">
            Keep custom notes on brew dial-ins, sensory experiments, water chemistry profiles, and
            roaster insights.
          </p>
        </div>

        <button
          onClick={onAddNote}
          className="self-start sm:self-auto px-4 py-2.5 bg-[#C87D32] hover:bg-[#B06B26] text-white text-xs font-semibold rounded-lg shadow-sm hover:shadow transition-all flex items-center gap-1.5"
        >
          <Plus className="w-4 h-4" />
          <span>Add Custom Note</span>
        </button>
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
              placeholder="Search notes by title, keywords, content, or tags..."
              className="w-full pl-9 pr-3 py-1.5 bg-[#FAF7F2] rounded-lg border border-[#E0D5C7] text-xs text-[#2C2118] focus:outline-none focus:ring-1 focus:ring-[#C87D32]"
            />
          </div>

          {/* Pin filter toggle */}
          <button
            onClick={() => setOnlyPinned(!onlyPinned)}
            className={`px-3 py-1.5 rounded-lg border text-xs font-medium flex items-center gap-1.5 transition-colors self-end md:self-auto ${
              onlyPinned
                ? 'bg-[#FBEEDC] text-[#8C4F1A] border-[#DDBF96]'
                : 'bg-[#FAF7F2] text-[#6B5A4E] border-[#E0D5C7] hover:text-[#2B1D14]'
            }`}
          >
            <Pin className={`w-3.5 h-3.5 ${onlyPinned ? 'fill-current' : ''}`} />
            <span>Pinned Only</span>
          </button>
        </div>

        {/* Category Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pt-2 border-t border-[#F0E6DB] text-xs pb-1">
          <span className="text-[11px] font-semibold text-[#8C7A6D] flex items-center gap-1 shrink-0 mr-1">
            <Filter className="w-3 h-3" /> Categories:
          </span>
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-2.5 py-1 rounded-md text-[11px] font-medium whitespace-nowrap transition-colors ${
                selectedCategory === cat
                  ? 'bg-[#3A291E] text-white'
                  : 'bg-[#FAF7F2] text-[#6D5A4E] border border-[#E0D5C7] hover:bg-[#F2ECE3]'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Notes Grid */}
      {filteredNotes.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredNotes.map((note) => (
            <div
              key={note.id}
              className={`bg-white rounded-xl border p-5 flex flex-col justify-between transition-all hover:shadow-md ${
                note.isPinned
                  ? 'border-[#DDBF96] bg-linear-to-b from-[#FFFDF9] to-white shadow-2xs'
                  : 'border-[#E5DACD] hover:border-[#D5C4B2]'
              }`}
            >
              <div>
                {/* Top: Category & Pin button */}
                <div className="flex items-center justify-between gap-2 mb-2.5">
                  <span
                    className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-md border ${getCategoryColor(
                      note.category
                    )}`}
                  >
                    {note.category}
                  </span>

                  <button
                    onClick={() => onTogglePin(note.id)}
                    className={`p-1 rounded transition-colors ${
                      note.isPinned
                        ? 'text-[#C87D32] hover:text-[#9B551C]'
                        : 'text-[#C7B7A7] hover:text-[#7A6453]'
                    }`}
                    title={note.isPinned ? 'Unpin note' : 'Pin note to top'}
                  >
                    <Pin className={`w-3.5 h-3.5 ${note.isPinned ? 'fill-current' : ''}`} />
                  </button>
                </div>

                {/* Title */}
                <h3 className="font-serif text-lg font-bold text-[#2B1D14] leading-snug">
                  {note.title}
                </h3>

                {/* Optional linked coffee badge */}
                {note.coffeeName && (
                  <div className="mt-1.5 inline-flex items-center gap-1 text-[11px] font-medium text-[#8C4F1A] bg-[#FAF3EC] px-2 py-0.5 rounded border border-[#EDE2D4]">
                    <Coffee className="w-3 h-3" />
                    <span>{note.coffeeName}</span>
                  </div>
                )}

                {/* Note Content */}
                <div className="mt-3 text-xs leading-relaxed text-[#4A3B30] font-mono whitespace-pre-wrap line-clamp-6 bg-[#FAF8F5] p-3 rounded-lg border border-[#F0E8DC]">
                  {note.content}
                </div>

                {/* Tags */}
                {note.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-3">
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

              {/* Bottom: Date & Actions */}
              <div className="pt-3 mt-4 border-t border-[#F0E6DB] flex items-center justify-between text-xs text-[#8C7A6D]">
                <div className="flex items-center gap-1 font-mono text-[11px]">
                  <Calendar className="w-3 h-3" />
                  <span>{note.date}</span>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => onEditNote(note)}
                    className="p-1.5 text-[#6D5A4E] hover:text-[#2B1D14] hover:bg-[#F2E8DC] rounded transition-colors"
                    title="Edit note"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => onDeleteNote(note.id)}
                    className="p-1.5 text-[#9E8B7D] hover:text-red-700 hover:bg-red-50 rounded transition-colors"
                    title="Delete note"
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
          <FileText className="w-10 h-10 text-[#A69587] mx-auto mb-3" />
          <h3 className="font-serif text-lg font-bold text-[#3B2B20]">No Notes Found</h3>
          <p className="text-xs text-[#6D5A4E] mt-1 max-w-sm mx-auto">
            {searchQuery
              ? 'No custom notes match your current search or category filter.'
              : 'Your Coffee Notebook is currently empty. Record dial-in settings, water recipes, or cupping thoughts!'}
          </p>
          <button
            onClick={onAddNote}
            className="mt-4 px-4 py-2 bg-[#C87D32] hover:bg-[#B06B26] text-white text-xs font-semibold rounded-lg transition-colors inline-flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            Add First Note
          </button>
        </div>
      )}
    </div>
  );
};
