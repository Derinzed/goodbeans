import React, { useState, useEffect } from 'react';
import {
  Coffee as CoffeeIcon,
  Plus,
  Layers,
  Wrench,
  Trophy,
  BarChart2,
  Bookmark,
  Sparkles,
  Heart,
  ChevronRight,
  Sliders,
  Scale,
  Menu,
  X,
  MapPin,
  Compass,
  FileText,
} from 'lucide-react';
import {
  Coffee,
  Equipment,
  Shelf,
  BrewRecipe,
  TastingEntry,
  ChallengeGoal,
  Cafe,
  CustomNote,
} from './types/coffee';
import {
  DEFAULT_SHELVES,
  INITIAL_COFFEES,
  INITIAL_EQUIPMENT,
  INITIAL_CAFES,
  INITIAL_NOTES,
} from './data/initialData';
import { CoffeeShelvesView } from './components/CoffeeShelvesView';
import { CoffeeDetailView } from './components/CoffeeDetailView';
import { EquipmentShelfView } from './components/EquipmentShelfView';
import { CafeShelfView } from './components/CafeShelfView';
import { NotesShelfView } from './components/NotesShelfView';
import { CoffeeModal } from './components/CoffeeModal';
import { RecipeModal } from './components/RecipeModal';
import { TastingModal } from './components/TastingModal';
import { EquipmentModal } from './components/EquipmentModal';
import { CafeModal } from './components/CafeModal';
import { NoteModal } from './components/NoteModal';
import { ShelfModal } from './components/ShelfModal';
import { BrewTimerModal } from './components/BrewTimerModal';
import { StatsModal } from './components/StatsModal';
import { CoffeeChallengeWidget } from './components/CoffeeChallengeWidget';
import { AutoPopulateShelfWidget } from './components/AutoPopulateShelfWidget';

export default function App() {
  // Local storage state initialization
  const [coffees, setCoffees] = useState<Coffee[]>(() => {
    try {
      const saved = localStorage.getItem('goodbeans_coffees');
      return saved ? JSON.parse(saved) : INITIAL_COFFEES;
    } catch {
      return INITIAL_COFFEES;
    }
  });

  const [equipment, setEquipment] = useState<Equipment[]>(() => {
    try {
      const saved = localStorage.getItem('goodbeans_equipment');
      return saved ? JSON.parse(saved) : INITIAL_EQUIPMENT;
    } catch {
      return INITIAL_EQUIPMENT;
    }
  });

  const [cafes, setCafes] = useState<Cafe[]>(() => {
    try {
      const saved = localStorage.getItem('goodbeans_cafes');
      return saved ? JSON.parse(saved) : INITIAL_CAFES;
    } catch {
      return INITIAL_CAFES;
    }
  });

  const [notes, setNotes] = useState<CustomNote[]>(() => {
    try {
      const saved = localStorage.getItem('goodbeans_notes');
      return saved ? JSON.parse(saved) : INITIAL_NOTES;
    } catch {
      return INITIAL_NOTES;
    }
  });

  const [shelves, setShelves] = useState<Shelf[]>(() => {
    try {
      const saved = localStorage.getItem('goodbeans_shelves');
      return saved ? JSON.parse(saved) : DEFAULT_SHELVES;
    } catch {
      return DEFAULT_SHELVES;
    }
  });

  const [challengeGoal, setChallengeGoal] = useState<ChallengeGoal>(() => {
    try {
      const saved = localStorage.getItem('goodbeans_goal');
      return saved ? JSON.parse(saved) : { year: 2026, targetCount: 25 };
    } catch {
      return { year: 2026, targetCount: 25 };
    }
  });

  // Navigation & views
  const [currentView, setCurrentView] = useState<
    'shelves' | 'coffee-detail' | 'equipment' | 'cafes' | 'notes'
  >('shelves');
  const [activeShelfId, setActiveShelfId] = useState<string>('all');
  const [selectedCoffeeId, setSelectedCoffeeId] = useState<string | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Modals state
  const [isCoffeeModalOpen, setIsCoffeeModalOpen] = useState(false);
  const [editingCoffee, setEditingCoffee] = useState<Coffee | null>(null);

  const [isRecipeModalOpen, setIsRecipeModalOpen] = useState(false);
  const [recipeModalCoffeeId, setRecipeModalCoffeeId] = useState<string>('');
  const [editingRecipe, setEditingRecipe] = useState<BrewRecipe | null>(null);

  const [isTastingModalOpen, setIsTastingModalOpen] = useState(false);
  const [tastingModalCoffee, setTastingModalCoffee] = useState<Coffee | null>(null);

  const [isEquipmentModalOpen, setIsEquipmentModalOpen] = useState(false);
  const [editingEquipment, setEditingEquipment] = useState<Equipment | null>(null);

  const [isCafeModalOpen, setIsCafeModalOpen] = useState(false);
  const [editingCafe, setEditingCafe] = useState<Cafe | null>(null);

  const [isNoteModalOpen, setIsNoteModalOpen] = useState(false);
  const [editingNote, setEditingNote] = useState<CustomNote | null>(null);

  const [isShelfModalOpen, setIsShelfModalOpen] = useState(false);

  const [isTimerModalOpen, setIsTimerModalOpen] = useState(false);
  const [timerRecipe, setTimerRecipe] = useState<BrewRecipe | null>(null);
  const [timerCoffee, setTimerCoffee] = useState<Coffee | null>(null);

  const [isStatsModalOpen, setIsStatsModalOpen] = useState(false);

  // Save changes to localStorage
  useEffect(() => {
    localStorage.setItem('goodbeans_coffees', JSON.stringify(coffees));
  }, [coffees]);

  useEffect(() => {
    localStorage.setItem('goodbeans_equipment', JSON.stringify(equipment));
  }, [equipment]);

  useEffect(() => {
    localStorage.setItem('goodbeans_cafes', JSON.stringify(cafes));
  }, [cafes]);

  useEffect(() => {
    localStorage.setItem('goodbeans_notes', JSON.stringify(notes));
  }, [notes]);

  useEffect(() => {
    localStorage.setItem('goodbeans_shelves', JSON.stringify(shelves));
  }, [shelves]);

  useEffect(() => {
    localStorage.setItem('goodbeans_goal', JSON.stringify(challengeGoal));
  }, [challengeGoal]);

  // Active selected coffee object
  const selectedCoffee = coffees.find((c) => c.id === selectedCoffeeId);

  // Handlers for Coffee
  const handleSelectCoffee = (coffeeId: string) => {
    setSelectedCoffeeId(coffeeId);
    setCurrentView('coffee-detail');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSaveCoffee = (coffeeData: Coffee) => {
    if (editingCoffee) {
      setCoffees((prev) =>
        prev.map((c) => (c.id === coffeeData.id ? { ...c, ...coffeeData } : c))
      );
    } else {
      setCoffees((prev) => [coffeeData, ...prev]);
    }
    setIsCoffeeModalOpen(false);
    setEditingCoffee(null);
  };

  const handleToggleFavorite = (coffeeId: string) => {
    setCoffees((prev) =>
      prev.map((c) => (c.id === coffeeId ? { ...c, isFavorite: !c.isFavorite } : c))
    );
  };

  const handleQuickRate = (coffeeId: string, rating: number) => {
    setCoffees((prev) =>
      prev.map((c) => (c.id === coffeeId ? { ...c, userRating: rating } : c))
    );
  };

  const handleQuickChangeShelf = (coffeeId: string, shelfId: string) => {
    setCoffees((prev) =>
      prev.map((c) => {
        if (c.id === coffeeId) {
          // If already in that shelf, keep it; otherwise add to shelf
          const newShelves = c.shelfIds.includes(shelfId)
            ? c.shelfIds
            : [...c.shelfIds, shelfId];
          return { ...c, shelfIds: newShelves };
        }
        return c;
      })
    );
  };

  const handleRemoveFromShelf = (coffeeId: string, shelfId: string) => {
    setCoffees((prev) => {
      const target = prev.find((c) => c.id === coffeeId);
      if (!target) return prev;
      const remainingShelves = target.shelfIds.filter((id) => id !== shelfId);
      if (remainingShelves.length === 0) {
        // When coffee is removed from all shelves, remove it entirely from library
        return prev.filter((c) => c.id !== coffeeId);
      }
      return prev.map((c) =>
        c.id === coffeeId ? { ...c, shelfIds: remainingShelves } : c
      );
    });

    if (selectedCoffeeId === coffeeId) {
      setCoffees((latest) => {
        if (!latest.some((c) => c.id === coffeeId)) {
          setSelectedCoffeeId(null);
          setCurrentView('shelves');
        }
        return latest;
      });
    }
  };

  const handleRemoveFromAllShelves = (coffeeId: string) => {
    // When coffee is removed from all shelves, remove it entirely from library
    setCoffees((prev) => prev.filter((c) => c.id !== coffeeId));
    if (selectedCoffeeId === coffeeId) {
      setSelectedCoffeeId(null);
      setCurrentView('shelves');
    }
  };

  const handleDeleteCoffee = (coffeeId: string) => {
    // Remove coffee entirely from library
    setCoffees((prev) => prev.filter((c) => c.id !== coffeeId));
    if (selectedCoffeeId === coffeeId) {
      setSelectedCoffeeId(null);
      setCurrentView('shelves');
    }
  };

  // Handlers for Recipe
  const handleOpenAddRecipe = (coffeeId: string) => {
    setRecipeModalCoffeeId(coffeeId);
    setEditingRecipe(null);
    setIsRecipeModalOpen(true);
  };

  const handleOpenEditRecipe = (recipe: BrewRecipe) => {
    setRecipeModalCoffeeId(recipe.coffeeId);
    setEditingRecipe(recipe);
    setIsRecipeModalOpen(true);
  };

  const handleSaveRecipe = (recipeData: BrewRecipe) => {
    setCoffees((prev) =>
      prev.map((coffee) => {
        if (coffee.id === recipeData.coffeeId) {
          const existingIndex = coffee.recipes.findIndex((r) => r.id === recipeData.id);
          let newRecipes: BrewRecipe[];
          if (existingIndex >= 0) {
            newRecipes = [...coffee.recipes];
            newRecipes[existingIndex] = recipeData;
          } else {
            newRecipes = [recipeData, ...coffee.recipes];
          }
          return { ...coffee, recipes: newRecipes };
        }
        return coffee;
      })
    );
    setIsRecipeModalOpen(false);
    setEditingRecipe(null);
  };

  const handleDeleteRecipe = (recipeId: string) => {
    setCoffees((prev) =>
      prev.map((coffee) => ({
        ...coffee,
        recipes: coffee.recipes.filter((r) => r.id !== recipeId),
      }))
    );
  };

  // Handlers for Tasting
  const handleOpenTastingModal = (coffee: Coffee) => {
    setTastingModalCoffee(coffee);
    setIsTastingModalOpen(true);
  };

  const handleSaveTasting = (entry: TastingEntry) => {
    if (!tastingModalCoffee) return;
    setCoffees((prev) =>
      prev.map((coffee) => {
        if (coffee.id === tastingModalCoffee.id) {
          return {
            ...coffee,
            userRating: entry.rating, // Update personal star rating with this latest score
            tastingLogs: [entry, ...coffee.tastingLogs],
          };
        }
        return coffee;
      })
    );
    setIsTastingModalOpen(false);
    setTastingModalCoffee(null);
  };

  const handleDeleteTasting = (tastingId: string) => {
    setCoffees((prev) =>
      prev.map((coffee) => ({
        ...coffee,
        tastingLogs: coffee.tastingLogs.filter((l) => l.id !== tastingId),
      }))
    );
  };

  // Handlers for Timer
  const handleStartBrewSession = (recipe: BrewRecipe, coffee: Coffee) => {
    setTimerRecipe(recipe);
    setTimerCoffee(coffee);
    setIsTimerModalOpen(true);
  };

  // Handlers for Equipment
  const handleSaveEquipment = (equipmentData: Equipment) => {
    if (editingEquipment) {
      setEquipment((prev) =>
        prev.map((eq) => (eq.id === equipmentData.id ? equipmentData : eq))
      );
    } else {
      setEquipment((prev) => [equipmentData, ...prev]);
    }
    setIsEquipmentModalOpen(false);
    setEditingEquipment(null);
  };

  const handleDeleteEquipment = (id: string) => {
    setEquipment((prev) => prev.filter((eq) => eq.id !== id));
  };

  // Handlers for Cafes
  const handleSaveCafe = (cafeData: Cafe) => {
    if (editingCafe) {
      setCafes((prev) =>
        prev.map((c) => (c.id === cafeData.id ? cafeData : c))
      );
    } else {
      setCafes((prev) => [cafeData, ...prev]);
    }
    setIsCafeModalOpen(false);
    setEditingCafe(null);
  };

  const handleDeleteCafe = (cafeId: string) => {
    setCafes((prev) => prev.filter((c) => c.id !== cafeId));
  };

  const handleToggleCafeFavorite = (cafeId: string) => {
    setCafes((prev) =>
      prev.map((c) => (c.id === cafeId ? { ...c, isFavorite: !c.isFavorite } : c))
    );
  };

  const handleQuickRateCafe = (cafeId: string, rating: number) => {
    setCafes((prev) =>
      prev.map((c) => (c.id === cafeId ? { ...c, rating } : c))
    );
  };

  // Handlers for Custom Notes
  const handleSaveNote = (noteData: CustomNote) => {
    if (editingNote) {
      setNotes((prev) =>
        prev.map((n) => (n.id === noteData.id ? noteData : n))
      );
    } else {
      setNotes((prev) => [noteData, ...prev]);
    }
    setIsNoteModalOpen(false);
    setEditingNote(null);
  };

  const handleDeleteNote = (noteId: string) => {
    setNotes((prev) => prev.filter((n) => n.id !== noteId));
  };

  const handleTogglePinNote = (noteId: string) => {
    setNotes((prev) =>
      prev.map((n) => (n.id === noteId ? { ...n, isPinned: !n.isPinned } : n))
    );
  };

  // Handlers for Shelves
  const handleAddShelf = (newShelf: Omit<Shelf, 'id' | 'isDefault'>) => {
    const shelf: Shelf = {
      id: `shelf-${Date.now()}`,
      isDefault: false,
      ...newShelf,
    };
    setShelves((prev) => [...prev, shelf]);
  };

  const handleDeleteShelf = (shelfId: string) => {
    setShelves((prev) => prev.filter((s) => s.id !== shelfId));
    if (activeShelfId === shelfId) {
      setActiveShelfId('all');
    }
  };

  // Reset to default catalog
  const handleResetData = () => {
    setCoffees(INITIAL_COFFEES);
    setEquipment(INITIAL_EQUIPMENT);
    setCafes(INITIAL_CAFES);
    setNotes(INITIAL_NOTES);
    setShelves(DEFAULT_SHELVES);
    localStorage.removeItem('goodbeans_coffees');
    localStorage.removeItem('goodbeans_equipment');
    localStorage.removeItem('goodbeans_cafes');
    localStorage.removeItem('goodbeans_notes');
    localStorage.removeItem('goodbeans_shelves');
  };

  // Import JSON backup
  const handleImportData = (jsonStr: string) => {
    try {
      const parsed = JSON.parse(jsonStr);
      if (parsed.coffees && Array.isArray(parsed.coffees)) {
        setCoffees(parsed.coffees);
      }
      if (parsed.equipment && Array.isArray(parsed.equipment)) {
        setEquipment(parsed.equipment);
      }
      if (parsed.cafes && Array.isArray(parsed.cafes)) {
        setCafes(parsed.cafes);
      }
      if (parsed.notes && Array.isArray(parsed.notes)) {
        setNotes(parsed.notes);
      }
      alert('Data restored successfully!');
    } catch {
      alert('Failed to parse backup file. Please ensure it is valid JSON.');
    }
  };

  // Count coffees per shelf
  const getShelfCount = (shelfId: string) => {
    if (shelfId === 'all') return coffees.length;
    return coffees.filter((c) => c.shelfIds.includes(shelfId)).length;
  };

  return (
    <div className="min-h-screen bg-[#F8F6F0] text-[#2C241E] flex flex-col font-sans">
      {/* TOP NAVIGATION BAR: Follows strict one-row 3-zone contract */}
      <header className="sticky top-0 z-40 bg-[#FAF7F2]/95 backdrop-blur-md border-b border-[#E5DACD] px-4 sm:px-8 py-3.5 flex items-center justify-between">
        {/* Zone 1: Brand title wordmark */}
        <button
          onClick={() => {
            setCurrentView('shelves');
            setActiveShelfId('all');
          }}
          className="flex items-center gap-2 group text-left cursor-pointer focus:outline-none"
        >
          <div className="w-8 h-8 rounded-lg bg-[#3A291E] flex items-center justify-center text-white shadow-xs group-hover:bg-[#C87D32] transition-colors">
            <CoffeeIcon className="w-4 h-4" />
          </div>
          <span className="font-serif text-xl sm:text-2xl font-bold tracking-tight text-[#2B1D14] group-hover:text-[#C87D32] transition-colors">
            Goodbeans
          </span>
        </button>

        {/* Zone 2: Clean text navigation links */}
        <nav className="hidden md:flex items-center gap-6 text-xs sm:text-sm font-medium text-[#6B5A4E]">
          <button
            onClick={() => {
              setCurrentView('shelves');
              setActiveShelfId('all');
            }}
            className={`hover:text-[#2B1D14] transition-colors cursor-pointer ${
              currentView === 'shelves' && activeShelfId === 'all'
                ? 'text-[#2B1D14] font-semibold border-b-2 border-[#C87D32] pb-0.5'
                : ''
            }`}
          >
            My Shelves
          </button>
          <button
            onClick={() => {
              setCurrentView('shelves');
              setActiveShelfId('currently-drinking');
            }}
            className={`hover:text-[#2B1D14] transition-colors cursor-pointer ${
              currentView === 'shelves' && activeShelfId === 'currently-drinking'
                ? 'text-[#2B1D14] font-semibold border-b-2 border-[#C87D32] pb-0.5'
                : ''
            }`}
          >
            Currently Drinking
          </button>
          <button
            onClick={() => setCurrentView('equipment')}
            className={`hover:text-[#2B1D14] transition-colors cursor-pointer ${
              currentView === 'equipment'
                ? 'text-[#2B1D14] font-semibold border-b-2 border-[#C87D32] pb-0.5'
                : ''
            }`}
          >
            Equipment Shelf
          </button>
          <button
            onClick={() => setCurrentView('cafes')}
            className={`hover:text-[#2B1D14] transition-colors cursor-pointer ${
              currentView === 'cafes'
                ? 'text-[#2B1D14] font-semibold border-b-2 border-[#C87D32] pb-0.5'
                : ''
            }`}
          >
            Cafe Shelf
          </button>
          <button
            onClick={() => setCurrentView('notes')}
            className={`hover:text-[#2B1D14] transition-colors cursor-pointer ${
              currentView === 'notes'
                ? 'text-[#2B1D14] font-semibold border-b-2 border-[#C87D32] pb-0.5'
                : ''
            }`}
          >
            Notes
          </button>
          <button
            onClick={() => setIsStatsModalOpen(true)}
            className="hover:text-[#2B1D14] transition-colors cursor-pointer"
          >
            Year in Coffee
          </button>
        </nav>

        {/* Zone 3: 1-2 primary actions */}
        <div className="flex items-center gap-2.5">
          {currentView === 'notes' ? (
            <button
              onClick={() => {
                setEditingNote(null);
                setIsNoteModalOpen(true);
              }}
              className="px-3.5 py-1.5 sm:px-4 sm:py-2 text-xs font-semibold text-white bg-[#C87D32] hover:bg-[#B06B26] rounded-lg shadow-sm hover:shadow transition-all whitespace-nowrap flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Note</span>
            </button>
          ) : currentView === 'cafes' ? (
            <button
              onClick={() => {
                setEditingCafe(null);
                setIsCafeModalOpen(true);
              }}
              className="px-3.5 py-1.5 sm:px-4 sm:py-2 text-xs font-semibold text-white bg-[#C87D32] hover:bg-[#B06B26] rounded-lg shadow-sm hover:shadow transition-all whitespace-nowrap flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Cafe</span>
            </button>
          ) : (
            <button
              onClick={() => {
                setEditingCoffee(null);
                setIsCoffeeModalOpen(true);
              }}
              className="px-3.5 py-1.5 sm:px-4 sm:py-2 text-xs font-semibold text-white bg-[#C87D32] hover:bg-[#B06B26] rounded-lg shadow-sm hover:shadow transition-all whitespace-nowrap flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Coffee</span>
            </button>
          )}

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden p-1.5 text-[#6B5A4E] hover:text-[#2B1D14] rounded-lg hover:bg-[#EFE8DD]"
          >
            {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </header>

      {/* Mobile Drawer */}
      {isMobileMenuOpen && (
        <div className="md:hidden bg-[#FAF7F2] border-b border-[#E5DACD] px-6 py-4 space-y-3 animate-fade-in text-sm">
          <button
            onClick={() => {
              setCurrentView('shelves');
              setActiveShelfId('all');
              setIsMobileMenuOpen(false);
            }}
            className="block w-full text-left font-medium text-[#3B291D] py-1"
          >
            All Coffee Shelves
          </button>
          <button
            onClick={() => {
              setCurrentView('shelves');
              setActiveShelfId('currently-drinking');
              setIsMobileMenuOpen(false);
            }}
            className="block w-full text-left font-medium text-[#3B291D] py-1"
          >
            Currently Drinking
          </button>
          <button
            onClick={() => {
              setCurrentView('equipment');
              setIsMobileMenuOpen(false);
            }}
            className="block w-full text-left font-medium text-[#3B291D] py-1"
          >
            Equipment Shelf
          </button>
          <button
            onClick={() => {
              setCurrentView('cafes');
              setIsMobileMenuOpen(false);
            }}
            className="block w-full text-left font-medium text-[#3B291D] py-1"
          >
            Cafe Shelf (Pinned Locations)
          </button>
          <button
            onClick={() => {
              setCurrentView('notes');
              setIsMobileMenuOpen(false);
            }}
            className="block w-full text-left font-medium text-[#3B291D] py-1"
          >
            Custom Notes (Coffee Journal)
          </button>
          <button
            onClick={() => {
              setIsStatsModalOpen(true);
              setIsMobileMenuOpen(false);
            }}
            className="block w-full text-left font-medium text-[#3B291D] py-1"
          >
            Year in Coffee Analytics
          </button>
        </div>
      )}

      {/* MAIN CONTAINER */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-8 py-6">
        {currentView === 'coffee-detail' && selectedCoffee ? (
          <CoffeeDetailView
            coffee={selectedCoffee}
            allShelves={shelves}
            equipmentList={equipment}
            onBack={() => setCurrentView('shelves')}
            onUpdateCoffee={(updated) => {
              if (!updated.shelfIds || updated.shelfIds.length === 0) {
                // If coffee has no shelves, remove it entirely from library!
                setCoffees((prev) => prev.filter((c) => c.id !== updated.id));
                setSelectedCoffeeId(null);
                setCurrentView('shelves');
                return;
              }
              setCoffees((prev) =>
                prev.map((c) => (c.id === updated.id ? updated : c))
              );
            }}
            onOpenAddRecipe={handleOpenAddRecipe}
            onOpenEditRecipe={handleOpenEditRecipe}
            onDeleteRecipe={handleDeleteRecipe}
            onOpenTastingModal={handleOpenTastingModal}
            onDeleteTasting={handleDeleteTasting}
            onStartBrewSession={handleStartBrewSession}
            onEditCoffee={(c) => {
              setEditingCoffee(c);
              setIsCoffeeModalOpen(true);
            }}
            onRemoveFromShelf={handleRemoveFromShelf}
            onRemoveFromAllShelves={handleRemoveFromAllShelves}
            onDeleteCoffee={handleDeleteCoffee}
          />
        ) : currentView === 'equipment' ? (
          <EquipmentShelfView
            equipment={equipment}
            onAddEquipment={() => {
              setEditingEquipment(null);
              setIsEquipmentModalOpen(true);
            }}
            onEditEquipment={(item) => {
              setEditingEquipment(item);
              setIsEquipmentModalOpen(true);
            }}
            onDeleteEquipment={handleDeleteEquipment}
          />
        ) : currentView === 'cafes' ? (
          <CafeShelfView
            cafes={cafes}
            onAddCafe={() => {
              setEditingCafe(null);
              setIsCafeModalOpen(true);
            }}
            onEditCafe={(c) => {
              setEditingCafe(c);
              setIsCafeModalOpen(true);
            }}
            onDeleteCafe={handleDeleteCafe}
            onToggleFavorite={handleToggleCafeFavorite}
            onQuickRate={handleQuickRateCafe}
          />
        ) : currentView === 'notes' ? (
          <NotesShelfView
            notes={notes}
            onAddNote={() => {
              setEditingNote(null);
              setIsNoteModalOpen(true);
            }}
            onEditNote={(n) => {
              setEditingNote(n);
              setIsNoteModalOpen(true);
            }}
            onDeleteNote={handleDeleteNote}
            onTogglePin={handleTogglePinNote}
            onSelectCoffee={handleSelectCoffee}
          />
        ) : (
          /* SHELVES VIEW (Goodreads 2-column sidebar layout) */
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* LEFT SIDEBAR: Shelves directory & Coffee challenge */}
            <aside className="lg:col-span-3 space-y-6">
              {/* Shelves List */}
              <div className="bg-white rounded-xl border border-[#E5DACD] p-4 shadow-xs">
                <div className="flex items-center justify-between text-xs font-bold text-[#8A6D56] uppercase tracking-wider mb-3">
                  <div className="flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-[#C87D32]" />
                    <span>Coffee Shelves</span>
                  </div>
                  <button
                    onClick={() => setIsShelfModalOpen(true)}
                    className="text-[11px] text-[#C87D32] hover:text-[#9E5D1D] lowercase font-semibold"
                  >
                    edit
                  </button>
                </div>

                <div className="space-y-1 text-xs">
                  {/* All Coffees row */}
                  <button
                    onClick={() => setActiveShelfId('all')}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-lg font-medium transition-colors ${
                      activeShelfId === 'all'
                        ? 'bg-[#3A291E] text-white shadow-2xs'
                        : 'text-[#4A3728] hover:bg-[#FAF7F2]'
                    }`}
                  >
                    <span>All Beans</span>
                    <span className="font-mono text-[11px] opacity-80">
                      ({coffees.length})
                    </span>
                  </button>

                  {/* Individual Shelves */}
                  {shelves.map((shelf) => {
                    const count = getShelfCount(shelf.id);
                    const isActive = activeShelfId === shelf.id;
                    return (
                      <button
                        key={shelf.id}
                        onClick={() => setActiveShelfId(shelf.id)}
                        className={`w-full flex items-center justify-between px-3 py-2 rounded-lg font-medium transition-colors ${
                          isActive
                            ? 'bg-[#3A291E] text-white shadow-2xs'
                            : 'text-[#4A3728] hover:bg-[#FAF7F2]'
                        }`}
                      >
                        <div className="flex items-center gap-2 truncate">
                          <div
                            className="w-2.5 h-2.5 rounded-full shrink-0"
                            style={{ backgroundColor: shelf.color || '#C87D32' }}
                          />
                          <span className="truncate">{shelf.name}</span>
                        </div>
                        <span className="font-mono text-[11px] opacity-80 shrink-0">
                          ({count})
                        </span>
                      </button>
                    );
                  })}
                </div>

                <button
                  onClick={() => setIsShelfModalOpen(true)}
                  className="mt-3 w-full py-1.5 px-2 bg-[#FAF7F2] hover:bg-[#F2E8DC] text-[#6D5A4E] border border-dashed border-[#DACDC0] rounded-lg text-xs font-medium flex items-center justify-center gap-1 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Shelf</span>
                </button>
              </div>

              {/* Equipment Shelf Shortcut */}
              <div
                onClick={() => setCurrentView('equipment')}
                className="bg-white rounded-xl border border-[#E5DACD] p-4 shadow-xs hover:border-[#C87D32] transition-all cursor-pointer group"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="p-2 bg-[#FAF1E4] rounded-lg text-[#C87D32]">
                      <Wrench className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="font-serif text-sm font-bold text-[#2B1D14] group-hover:text-[#C87D32] transition-colors">
                        Equipment Shelf
                      </h4>
                      <p className="text-[11px] text-[#7A6757]">
                        {equipment.length} tools & grinders cataloged
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-[#A8988A] group-hover:translate-x-0.5 transition-transform" />
                </div>
              </div>

              {/* Cafe Shelf Shortcut */}
              <div
                onClick={() => setCurrentView('cafes')}
                className="bg-white rounded-xl border border-[#E5DACD] p-4 shadow-xs hover:border-[#C87D32] transition-all cursor-pointer group"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="p-2 bg-[#FAF1E4] rounded-lg text-[#C87D32]">
                      <MapPin className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="font-serif text-sm font-bold text-[#2B1D14] group-hover:text-[#C87D32] transition-colors">
                        Cafe Shelf
                      </h4>
                      <p className="text-[11px] text-[#7A6757]">
                        {cafes.length} in-person spots pinned
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-[#A8988A] group-hover:translate-x-0.5 transition-transform" />
                </div>
              </div>

              {/* Notes Shelf Shortcut */}
              <div
                onClick={() => setCurrentView('notes')}
                className="bg-white rounded-xl border border-[#E5DACD] p-4 shadow-xs hover:border-[#C87D32] transition-all cursor-pointer group"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="p-2 bg-[#FAF1E4] rounded-lg text-[#C87D32]">
                      <FileText className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="font-serif text-sm font-bold text-[#2B1D14] group-hover:text-[#C87D32] transition-colors">
                        Custom Notes
                      </h4>
                      <p className="text-[11px] text-[#7A6757]">
                        {notes.length} dial-ins & observations
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-[#A8988A] group-hover:translate-x-0.5 transition-transform" />
                </div>
              </div>

              {/* Annual Coffee Challenge (Goodreads Reading Challenge) */}
              <CoffeeChallengeWidget
                coffees={coffees}
                goal={challengeGoal}
                onUpdateGoal={(newTarget) =>
                  setChallengeGoal({ ...challengeGoal, targetCount: newTarget })
                }
              />
            </aside>

            {/* RIGHT COLUMN: The Shelves Catalog */}
            <section className="lg:col-span-9">
              <CoffeeShelvesView
                coffees={coffees}
                shelves={shelves}
                activeShelfId={activeShelfId}
                onSelectShelf={setActiveShelfId}
                onSelectCoffee={handleSelectCoffee}
                onAddCoffee={() => {
                  setEditingCoffee(null);
                  setIsCoffeeModalOpen(true);
                }}
                onManageShelves={() => setIsShelfModalOpen(true)}
                onToggleFavorite={handleToggleFavorite}
                onQuickRate={handleQuickRate}
                onQuickChangeShelf={handleQuickChangeShelf}
                onRemoveFromShelf={handleRemoveFromShelf}
                onRemoveFromAllShelves={handleRemoveFromAllShelves}
                onDeleteCoffee={handleDeleteCoffee}
              />
            </section>
          </div>
        )}
      </main>

      {/* FOOTER */}
      <footer className="mt-auto border-t border-[#E5DACD] bg-[#FAF7F2] py-8 text-xs text-[#7A6757]">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-serif font-bold text-[#2B1D14] text-sm">Goodbeans</span>
            <span>· The Coffee Reader's Companion</span>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsStatsModalOpen(true)}
              className="hover:text-[#2B1D14] transition-colors"
            >
              Export & Backup
            </button>
            <button
              onClick={() => {
                setCurrentView('equipment');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="hover:text-[#2B1D14] transition-colors"
            >
              Equipment Shelf
            </button>
            <button
              onClick={() => {
                setCurrentView('cafes');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="hover:text-[#2B1D14] transition-colors"
            >
              Cafe Shelf
            </button>
            <button
              onClick={handleResetData}
              className="text-[#9E8B7D] hover:text-[#7A3E26] underline transition-colors"
            >
              Reset Sample Catalog
            </button>
          </div>
        </div>
      </footer>

      {/* MODALS */}
      {/* 1. Coffee Modal */}
      {isCoffeeModalOpen && (
        <CoffeeModal
          initialCoffee={editingCoffee}
          shelves={shelves}
          onSave={handleSaveCoffee}
          onClose={() => {
            setIsCoffeeModalOpen(false);
            setEditingCoffee(null);
          }}
        />
      )}

      {/* 2. Recipe Modal */}
      {isRecipeModalOpen && (
        <RecipeModal
          coffeeId={recipeModalCoffeeId}
          coffeeName={
            coffees.find((c) => c.id === recipeModalCoffeeId)?.name || 'Selected Coffee'
          }
          initialRecipe={editingRecipe}
          equipmentList={equipment}
          onSave={handleSaveRecipe}
          onClose={() => {
            setIsRecipeModalOpen(false);
            setEditingRecipe(null);
          }}
        />
      )}

      {/* 3. Tasting Modal */}
      {isTastingModalOpen && tastingModalCoffee && (
        <TastingModal
          coffee={tastingModalCoffee}
          onSave={handleSaveTasting}
          onClose={() => {
            setIsTastingModalOpen(false);
            setTastingModalCoffee(null);
          }}
        />
      )}

      {/* 4. Equipment Modal */}
      {isEquipmentModalOpen && (
        <EquipmentModal
          initialEquipment={editingEquipment}
          onSave={handleSaveEquipment}
          onClose={() => {
            setIsEquipmentModalOpen(false);
            setEditingEquipment(null);
          }}
        />
      )}

      {/* 5. Cafe Modal */}
      {isCafeModalOpen && (
        <CafeModal
          initialCafe={editingCafe}
          onSave={handleSaveCafe}
          onClose={() => {
            setIsCafeModalOpen(false);
            setEditingCafe(null);
          }}
        />
      )}

      {/* 6. Custom Note Modal */}
      {isNoteModalOpen && (
        <NoteModal
          initialNote={editingNote}
          coffees={coffees}
          onSave={handleSaveNote}
          onClose={() => {
            setIsNoteModalOpen(false);
            setEditingNote(null);
          }}
        />
      )}

      {/* 7. Shelf Modal */}
      {isShelfModalOpen && (
        <ShelfModal
          shelves={shelves}
          onAddShelf={handleAddShelf}
          onDeleteShelf={handleDeleteShelf}
          onClose={() => setIsShelfModalOpen(false)}
        />
      )}

      {/* 8. Brew Timer Modal */}
      {isTimerModalOpen && timerRecipe && timerCoffee && (
        <BrewTimerModal
          recipe={timerRecipe}
          coffee={timerCoffee}
          onClose={() => {
            setIsTimerModalOpen(false);
            setTimerRecipe(null);
            setTimerCoffee(null);
          }}
          onLogBrewSuccess={() => {
            setIsTimerModalOpen(false);
            handleOpenTastingModal(timerCoffee);
          }}
        />
      )}

      {/* 9. Stats & Backup Modal */}
      {isStatsModalOpen && (
        <StatsModal
          coffees={coffees}
          equipment={equipment}
          cafes={cafes}
          notes={notes}
          onResetData={handleResetData}
          onImportData={handleImportData}
          onClose={() => setIsStatsModalOpen(false)}
        />
      )}

      {/* 10. AI Auto-Populate Shelf Widget (Fixed Bottom-Right) */}
      <AutoPopulateShelfWidget
        currentView={currentView}
        activeShelfId={activeShelfId}
        onAddCoffee={(newCoffee) => {
          setCoffees((prev) => [newCoffee, ...prev]);
          setSelectedCoffeeId(newCoffee.id);
          setCurrentView('coffee-detail');
        }}
        onAddEquipment={(newEq) => {
          setEquipment((prev) => [newEq, ...prev]);
          setCurrentView('equipment');
        }}
        onAddCafe={(newCafe) => {
          setCafes((prev) => [newCafe, ...prev]);
          setCurrentView('cafes');
        }}
        onAddNote={(newNote) => {
          setNotes((prev) => [newNote, ...prev]);
          setCurrentView('notes');
        }}
      />
    </div>
  );
}
