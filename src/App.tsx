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
  Sun,
  Moon,
  Palette,
  User,
  UserPlus,
  LogIn,
  Shield,
  CheckCircle,
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
  RegisteredCoffee,
  RegisteredEquipment,
  RegisteredCafe,
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
import { DarkHueModal } from './components/DarkHueModal';
import { AuthModal } from './components/AuthModal';
import { UserAccountModal } from './components/UserAccountModal';
import { AdminUsersModal } from './components/AdminUsersModal';
import { authApi, UserProfile } from './services/authApi';
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

  // Theme state: light or dark roast
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    try {
      const saved = localStorage.getItem('goodbeans_theme');
      if (saved === 'dark' || saved === 'light') return saved;
      return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches
        ? 'dark'
        : 'light';
    } catch {
      return 'light';
    }
  });

  // Dark view customizable hues & background
  const [primaryHue, setPrimaryHue] = useState<string>(() => {
    try {
      return localStorage.getItem('goodbeans_dark_primary_hue') || '#C87D32';
    } catch {
      return '#C87D32';
    }
  });

  const [secondaryHue, setSecondaryHue] = useState<string>(() => {
    try {
      return localStorage.getItem('goodbeans_dark_secondary_hue') || '#ECA357';
    } catch {
      return '#ECA357';
    }
  });

  const [backgroundColor, setBackgroundColor] = useState<string>(() => {
    try {
      return localStorage.getItem('goodbeans_dark_bg') || '#14110F';
    } catch {
      return '#14110F';
    }
  });

  const [isHueModalOpen, setIsHueModalOpen] = useState(false);

  // Authentication and Account state
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(() => {
    try {
      const saved = localStorage.getItem('goodbeans_current_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [authToken, setAuthToken] = useState<string | null>(() => {
    try {
      return localStorage.getItem('goodbeans_auth_token');
    } catch {
      return null;
    }
  });

  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [isAdminModalOpen, setIsAdminModalOpen] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Running catalog of registered items across all users
  const [registeredCoffees, setRegisteredCoffees] = useState<RegisteredCoffee[]>([]);
  const [registeredEquipment, setRegisteredEquipment] = useState<RegisteredEquipment[]>([]);
  const [registeredCafes, setRegisteredCafes] = useState<RegisteredCafe[]>([]);

  const fetchCommunityCatalog = async () => {
    try {
      const res = await authApi.getCommunityItems();
      if (res && res.success) {
        if (Array.isArray(res.coffees)) setRegisteredCoffees(res.coffees);
        if (Array.isArray(res.equipment)) setRegisteredEquipment(res.equipment);
        if (Array.isArray(res.cafes)) setRegisteredCafes(res.cafes);
      }
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    fetchCommunityCatalog();
  }, []);

  // Auto-dismiss toast
  useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => setToastMessage(null), 3500);
      return () => clearTimeout(timer);
    }
  }, [toastMessage]);

  // Verify stored session on mount
  useEffect(() => {
    const savedToken = localStorage.getItem('goodbeans_auth_token');
    if (!savedToken) return;

    authApi
      .getMe(savedToken)
      .then((res) => {
        if (res.success && res.user) {
          setCurrentUser(res.user);
          setAuthToken(savedToken);
          if (res.data) {
            if (Array.isArray(res.data.coffees) && res.data.coffees.length > 0) {
              setCoffees(res.data.coffees);
            }
            if (Array.isArray(res.data.equipment) && res.data.equipment.length > 0) {
              setEquipment(res.data.equipment);
            }
            if (Array.isArray(res.data.cafes) && res.data.cafes.length > 0) {
              setCafes(res.data.cafes);
            }
            if (Array.isArray(res.data.notes) && res.data.notes.length > 0) {
              setNotes(res.data.notes);
            }
            if (Array.isArray(res.data.shelves) && res.data.shelves.length > 0) {
              setShelves(res.data.shelves);
            }
            if (res.data.theme) setTheme(res.data.theme);
            if (res.data.primaryHue) setPrimaryHue(res.data.primaryHue);
            if (res.data.secondaryHue) setSecondaryHue(res.data.secondaryHue);
            if (res.data.backgroundColor) setBackgroundColor(res.data.backgroundColor);
          }
        } else {
          localStorage.removeItem('goodbeans_auth_token');
          localStorage.removeItem('goodbeans_current_user');
          setCurrentUser(null);
          setAuthToken(null);
        }
      })
      .catch(() => {});
  }, []);

  // Debounced auto-sync to server when user is logged in
  useEffect(() => {
    if (!authToken || !currentUser) return;
    setIsSyncing(true);
    const timeout = setTimeout(async () => {
      try {
        await authApi.saveUserData(authToken, {
          coffees,
          equipment,
          cafes,
          notes,
          shelves,
          theme,
          primaryHue,
          secondaryHue,
          backgroundColor,
        });
        setLastSyncedAt(new Date().toISOString());
      } catch (err) {
        console.error('Server sync error:', err);
      } finally {
        setIsSyncing(false);
      }
    }, 1200);

    return () => clearTimeout(timeout);
  }, [
    coffees,
    equipment,
    cafes,
    notes,
    shelves,
    theme,
    primaryHue,
    secondaryHue,
    backgroundColor,
    authToken,
    currentUser,
  ]);

  const handleAuthSuccess = (user: UserProfile, token: string, serverData?: any) => {
    setCurrentUser(user);
    setAuthToken(token);
    try {
      localStorage.setItem('goodbeans_current_user', JSON.stringify(user));
      localStorage.setItem('goodbeans_auth_token', token);
    } catch {
      // ignore
    }

    if (serverData && typeof serverData === 'object' && Object.keys(serverData).length > 0) {
      if (Array.isArray(serverData.coffees) && serverData.coffees.length > 0) {
        setCoffees(serverData.coffees);
      }
      if (Array.isArray(serverData.equipment) && serverData.equipment.length > 0) {
        setEquipment(serverData.equipment);
      }
      if (Array.isArray(serverData.cafes) && serverData.cafes.length > 0) {
        setCafes(serverData.cafes);
      }
      if (Array.isArray(serverData.notes) && serverData.notes.length > 0) {
        setNotes(serverData.notes);
      }
      if (Array.isArray(serverData.shelves) && serverData.shelves.length > 0) {
        setShelves(serverData.shelves);
      }
      if (serverData.theme) setTheme(serverData.theme);
      if (serverData.primaryHue) setPrimaryHue(serverData.primaryHue);
      if (serverData.secondaryHue) setSecondaryHue(serverData.secondaryHue);
      if (serverData.backgroundColor) setBackgroundColor(serverData.backgroundColor);
    } else {
      // Push initial library to newly created account
      authApi.saveUserData(token, {
        coffees,
        equipment,
        cafes,
        notes,
        shelves,
        theme,
        primaryHue,
        secondaryHue,
        backgroundColor,
      });
    }

    setToastMessage(`Welcome back, ${user.username}!`);
  };

  const handleLogout = async () => {
    if (authToken) {
      await authApi.logout(authToken);
    }
    setCurrentUser(null);
    setAuthToken(null);
    try {
      localStorage.removeItem('goodbeans_current_user');
      localStorage.removeItem('goodbeans_auth_token');
    } catch {
      // ignore
    }
    setIsUserModalOpen(false);
    setToastMessage('Signed out successfully.');
  };

  const handleDeleteAccount = async () => {
    if (!authToken || !currentUser) return;
    try {
      const res = await authApi.deleteAccount(authToken);
      if (res.success) {
        setCurrentUser(null);
        setAuthToken(null);
        try {
          localStorage.removeItem('goodbeans_current_user');
          localStorage.removeItem('goodbeans_auth_token');
        } catch {
          // ignore
        }
        handleResetData();
        setToastMessage(res.message || 'Your account and data were permanently deleted.');
      } else {
        setToastMessage(res.error || 'Failed to delete account.');
      }
    } catch {
      setToastMessage('Network error while deleting account.');
    }
  };

  const handleManualSync = async () => {
    if (!authToken || !currentUser) return;
    setIsSyncing(true);
    try {
      await authApi.saveUserData(authToken, {
        coffees,
        equipment,
        cafes,
        notes,
        shelves,
        theme,
        primaryHue,
        secondaryHue,
        backgroundColor,
      });
      setLastSyncedAt(new Date().toISOString());
      setToastMessage('Saved successfully to your server account!');
    } catch {
      setToastMessage('Failed to sync to server.');
    } finally {
      setIsSyncing(false);
    }
  };

  useEffect(() => {
    try {
      localStorage.setItem('goodbeans_theme', theme);
    } catch {
      // ignore
    }
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  // Synchronize CSS custom properties with current hues & background
  useEffect(() => {
    try {
      localStorage.setItem('goodbeans_dark_primary_hue', primaryHue);
      localStorage.setItem('goodbeans_dark_secondary_hue', secondaryHue);
      localStorage.setItem('goodbeans_dark_bg', backgroundColor);
    } catch {
      // ignore
    }
    const root = document.documentElement;
    root.style.setProperty('--dark-primary', primaryHue);
    root.style.setProperty('--dark-primary-hover', `color-mix(in srgb, ${primaryHue} 85%, black)`);
    root.style.setProperty('--dark-secondary', secondaryHue);
    root.style.setProperty('--dark-secondary-bg', `color-mix(in srgb, ${secondaryHue} 18%, transparent)`);
    root.style.setProperty('--dark-secondary-border', `color-mix(in srgb, ${secondaryHue} 35%, transparent)`);
    root.style.setProperty('--dark-bg', backgroundColor);
  }, [primaryHue, secondaryHue, backgroundColor]);

  const handleResetHues = () => {
    setPrimaryHue('#C87D32');
    setSecondaryHue('#ECA357');
    setBackgroundColor('#14110F');
  };

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
  };

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
    // Register with community items to average ratings across all users
    authApi.registerCommunityItem('coffee', coffeeData, coffeeData.userRating).catch(() => {});
    fetchCommunityCatalog();
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
      prev.map((c) => {
        if (c.id === coffeeId) {
          const updated = { ...c, userRating: rating };
          authApi.registerCommunityItem('coffee', updated, rating).catch(() => {});
          return updated;
        }
        return c;
      })
    );
    fetchCommunityCatalog();
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
    // Register with community items to average ratings across all users
    authApi.registerCommunityItem('equipment', equipmentData, equipmentData.rating).catch(() => {});
    fetchCommunityCatalog();
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
    // Register with community items to average ratings across all users
    authApi.registerCommunityItem('cafe', cafeData, cafeData.rating).catch(() => {});
    fetchCommunityCatalog();
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
      prev.map((c) => {
        if (c.id === cafeId) {
          const updated = { ...c, rating };
          authApi.registerCommunityItem('cafe', updated, rating).catch(() => {});
          return updated;
        }
        return c;
      })
    );
    fetchCommunityCatalog();
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
    setToastMessage('Reset library to default catalog.');
  };

  // Export JSON backup
  const handleExportData = () => {
    const backup = {
      coffees,
      equipment,
      cafes,
      notes,
      shelves,
      theme,
      primaryHue,
      secondaryHue,
      backgroundColor,
      exportDate: new Date().toISOString(),
      account: currentUser ? currentUser.username : 'guest',
      version: '1.3',
    };
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `goodbeans-${currentUser ? currentUser.username : 'backup'}-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setToastMessage('Backup file exported!');
  };

  // Import JSON backup (and automatically sync to server if logged in!)
  const handleImportData = async (jsonStr: string) => {
    try {
      const parsed = JSON.parse(jsonStr);
      let updatedCoffees = coffees;
      let updatedEquipment = equipment;
      let updatedCafes = cafes;
      let updatedNotes = notes;
      let updatedShelves = shelves;

      if (parsed.coffees && Array.isArray(parsed.coffees)) {
        updatedCoffees = parsed.coffees;
        setCoffees(updatedCoffees);
      }
      if (parsed.equipment && Array.isArray(parsed.equipment)) {
        updatedEquipment = parsed.equipment;
        setEquipment(updatedEquipment);
      }
      if (parsed.cafes && Array.isArray(parsed.cafes)) {
        updatedCafes = parsed.cafes;
        setCafes(updatedCafes);
      }
      if (parsed.notes && Array.isArray(parsed.notes)) {
        updatedNotes = parsed.notes;
        setNotes(updatedNotes);
      }
      if (parsed.shelves && Array.isArray(parsed.shelves)) {
        updatedShelves = parsed.shelves;
        setShelves(updatedShelves);
      }

      // If logged in, update server account information immediately!
      if (authToken && currentUser) {
        await authApi.saveUserData(authToken, {
          coffees: updatedCoffees,
          equipment: updatedEquipment,
          cafes: updatedCafes,
          notes: updatedNotes,
          shelves: updatedShelves,
          theme,
          primaryHue,
          secondaryHue,
          backgroundColor,
        });
        setLastSyncedAt(new Date().toISOString());
        // Also register imported items to the community catalog
        if (Array.isArray(updatedCoffees)) {
          updatedCoffees.forEach((c) => authApi.registerCommunityItem('coffee', c, c.userRating).catch(() => {}));
        }
        if (Array.isArray(updatedEquipment)) {
          updatedEquipment.forEach((eq) => authApi.registerCommunityItem('equipment', eq, eq.rating).catch(() => {}));
        }
        if (Array.isArray(updatedCafes)) {
          updatedCafes.forEach((cf) => authApi.registerCommunityItem('cafe', cf, cf.rating).catch(() => {}));
        }
        fetchCommunityCatalog();
        setToastMessage('Data restored and updated in your server account!');
      } else {
        setToastMessage('Data restored successfully!');
      }
    } catch {
      setToastMessage('Failed to parse backup file. Please ensure it is valid JSON.');
    }
  };

  // File input change for user account modal
  const handleImportBackupFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        handleImportData(content);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
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
          {currentUser?.role === 'admin' && (
            <button
              onClick={() => setIsAdminModalOpen(true)}
              className="text-[#C87D32] hover:text-[#B06B26] font-semibold flex items-center gap-1 transition-colors cursor-pointer"
              title="View all registered users"
            >
              <Shield className="w-3.5 h-3.5" />
              <span>Admin Users</span>
            </button>
          )}
        </nav>

        {/* Zone 3: 1-2 primary actions & theme toggle & user account */}
        <div className="flex items-center gap-2">
          {/* User Account / Sign In Button */}
          {currentUser ? (
            <button
              onClick={() => setIsUserModalOpen(true)}
              title={`Account: ${currentUser.username} (${currentUser.role})`}
              className="px-2.5 py-1.5 text-xs text-[#2B1D14] bg-[#FAF7F2] hover:bg-[#F2E8DC] rounded-lg transition-colors cursor-pointer border border-[#E5DACD] flex items-center gap-1.5 shadow-2xs font-medium"
            >
              <div className="w-5 h-5 rounded-md bg-[#3A291E] text-white flex items-center justify-center text-[10px] font-bold">
                {currentUser.username.slice(0, 1).toUpperCase()}
              </div>
              <span className="max-w-[70px] sm:max-w-[110px] truncate">{currentUser.username}</span>
              {currentUser.role === 'admin' && (
                <span className="hidden sm:inline px-1 py-0.2 text-[9px] font-bold bg-[#C87D32] text-white rounded uppercase">
                  Admin
                </span>
              )}
            </button>
          ) : (
            <button
              onClick={() => setIsAuthModalOpen(true)}
              title="Sign In or Create Account"
              className="px-2.5 py-1.5 text-xs text-[#6B5A4E] hover:text-[#2B1D14] bg-[#FAF7F2] hover:bg-[#EFE8DD] rounded-lg transition-colors cursor-pointer border border-[#E5DACD] flex items-center gap-1.5 shadow-2xs font-medium whitespace-nowrap"
            >
              <User className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Account</span>
            </button>
          )}
          {/* Dark View Palette & Background Customizer Button */}
          {theme === 'dark' && (
            <button
              onClick={() => setIsHueModalOpen(true)}
              aria-label="Customize dark view colors"
              title="Customize dark view primary hue, secondary hue & background"
              className="px-2.5 py-1.5 text-xs text-[#EDE4DC] bg-[#261F1A] hover:bg-[#332923] rounded-lg transition-colors cursor-pointer border border-[#3D3128] flex items-center gap-1.5 shadow-2xs font-medium"
            >
              <Palette className="w-3.5 h-3.5" style={{ color: primaryHue }} />
              <span className="hidden sm:inline">Palette</span>
              <div className="flex items-center -space-x-1">
                <span
                  className="w-2.5 h-2.5 rounded-full border border-black/40 z-20"
                  style={{ backgroundColor: primaryHue }}
                  title="Primary hue"
                />
                <span
                  className="w-2.5 h-2.5 rounded-full border border-black/40 z-10"
                  style={{ backgroundColor: secondaryHue }}
                  title="Secondary hue"
                />
                <span
                  className="w-2.5 h-2.5 rounded-full border border-white/20 z-0"
                  style={{ backgroundColor: backgroundColor }}
                  title="Background color"
                />
              </div>
            </button>
          )}

          {/* Theme Toggle Button in Upper Right */}
          <button
            onClick={toggleTheme}
            aria-label={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
            title={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark roast theme'}
            className="p-2 text-[#6B5A4E] hover:text-[#2B1D14] hover:bg-[#EFE8DD] rounded-lg transition-colors cursor-pointer border border-[#E5DACD] flex items-center justify-center shadow-2xs"
          >
            {theme === 'dark' ? (
              <Sun className="w-4 h-4 text-[#F3A63B]" />
            ) : (
              <Moon className="w-4 h-4 text-[#5D4738]" />
            )}
          </button>

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

          {/* Mobile Account Section */}
          <div className="pt-2 border-t border-[#E5DACD] space-y-2">
            {currentUser ? (
              <>
                <button
                  onClick={() => {
                    setIsUserModalOpen(true);
                    setIsMobileMenuOpen(false);
                  }}
                  className="w-full text-left font-medium py-1.5 px-2 rounded-md bg-[#FAF7F2] border border-[#E5DACD] flex items-center justify-between text-xs text-[#2B1D14]"
                >
                  <span className="flex items-center gap-2">
                    <User className="w-3.5 h-3.5 text-[#C87D32]" />
                    Account: <strong>{currentUser.username}</strong>
                  </span>
                  {currentUser.role === 'admin' && (
                    <span className="px-1.5 py-0.5 text-[9px] bg-[#C87D32] text-white rounded font-bold">
                      Admin
                    </span>
                  )}
                </button>
                {currentUser.role === 'admin' && (
                  <button
                    onClick={() => {
                      setIsAdminModalOpen(true);
                      setIsMobileMenuOpen(false);
                    }}
                    className="w-full text-left font-medium py-1.5 px-2 rounded-md bg-[#FAF3EC] border border-[#EDE2D4] flex items-center gap-2 text-xs text-[#8C4F1A]"
                  >
                    <Shield className="w-3.5 h-3.5" />
                    Registered Users Directory
                  </button>
                )}
              </>
            ) : (
              <button
                onClick={() => {
                  setIsAuthModalOpen(true);
                  setIsMobileMenuOpen(false);
                }}
                className="w-full text-left font-medium py-1.5 px-2 rounded-md bg-[#FAF7F2] border border-[#E5DACD] flex items-center gap-2 text-xs text-[#2B1D14]"
              >
                <UserPlus className="w-3.5 h-3.5 text-[#C87D32]" />
                Sign In / Create Account
              </button>
            )}
          </div>
          <div className="pt-2 border-t border-[#E5DACD] flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-[#6B5A4E]">Appearance</span>
              <button
                onClick={toggleTheme}
                className="px-2.5 py-1 text-xs rounded-md border border-[#E5DACD] flex items-center gap-1.5 text-[#3B291D]"
              >
                {theme === 'dark' ? (
                  <>
                    <Sun className="w-3.5 h-3.5 text-[#F3A63B]" />
                    <span>Light Mode</span>
                  </>
                ) : (
                  <>
                    <Moon className="w-3.5 h-3.5 text-[#5D4738]" />
                    <span>Dark Roast</span>
                  </>
                )}
              </button>
            </div>
            {theme === 'dark' && (
              <button
                onClick={() => {
                  setIsHueModalOpen(true);
                  setIsMobileMenuOpen(false);
                }}
                className="w-full text-left font-medium py-1.5 px-2 rounded-md bg-[#261F1A] border border-[#3D3128] flex items-center justify-between text-xs text-[#EDE4DC]"
              >
                <span className="flex items-center gap-2">
                  <Palette className="w-3.5 h-3.5" style={{ color: primaryHue }} />
                  Customize Palette & Background
                </span>
                <div className="flex items-center -space-x-1">
                  <span className="w-3 h-3 rounded-full border border-black/40 z-20" style={{ backgroundColor: primaryHue }} />
                  <span className="w-3 h-3 rounded-full border border-black/40 z-10" style={{ backgroundColor: secondaryHue }} />
                  <span className="w-3 h-3 rounded-full border border-white/20 z-0" style={{ backgroundColor: backgroundColor }} />
                </div>
              </button>
            )}
          </div>
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
          registeredCoffees={registeredCoffees}
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
          registeredEquipment={registeredEquipment}
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
          registeredCafes={registeredCafes}
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

      {/* 9b. Dark View Hue & Background Customizer Modal */}
      <DarkHueModal
        isOpen={isHueModalOpen}
        onClose={() => setIsHueModalOpen(false)}
        primaryHue={primaryHue}
        secondaryHue={secondaryHue}
        backgroundColor={backgroundColor}
        onPrimaryHueChange={setPrimaryHue}
        onSecondaryHueChange={setSecondaryHue}
        onBackgroundColorChange={setBackgroundColor}
        onReset={handleResetHues}
      />

      {/* 9c. Authentication Modal (Register / Login) */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onAuthSuccess={handleAuthSuccess}
        initialDataToSave={{
          coffees,
          equipment,
          cafes,
          notes,
          shelves,
          theme,
          primaryHue,
          secondaryHue,
          backgroundColor,
        }}
      />

      {/* 9d. User Account & Data Portability Modal */}
      {currentUser && (
        <UserAccountModal
          isOpen={isUserModalOpen}
          onClose={() => setIsUserModalOpen(false)}
          user={currentUser}
          stats={{
            coffeesCount: coffees.length,
            equipmentCount: equipment.length,
            cafesCount: cafes.length,
            notesCount: notes.length,
            shelvesCount: shelves.length,
          }}
          isSyncing={isSyncing}
          lastSyncedAt={lastSyncedAt}
          onManualSync={handleManualSync}
          onExportData={handleExportData}
          onImportBackupFile={handleImportBackupFile}
          onLogout={handleLogout}
          onDeleteAccount={handleDeleteAccount}
          onOpenAdminPanel={() => setIsAdminModalOpen(true)}
        />
      )}

      {/* 9e. Admin Users Directory Modal */}
      <AdminUsersModal
        isOpen={isAdminModalOpen}
        onClose={() => setIsAdminModalOpen(false)}
        token={authToken}
        currentUserId={currentUser?.id || ''}
      />

      {/* Floating In-App Toast Feedback */}
      {toastMessage && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-[#261F1A] text-white px-4 py-2.5 rounded-xl shadow-lg border border-[#3D3128] text-xs flex items-center gap-2 animate-fade-in pointer-events-none">
          <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* 10. AI Auto-Populate Shelf Widget (Fixed Bottom-Right) */}
      <AutoPopulateShelfWidget
        currentView={currentView}
        activeShelfId={activeShelfId}
        registeredCoffees={registeredCoffees}
        registeredEquipment={registeredEquipment}
        registeredCafes={registeredCafes}
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
        onOpenEditCoffee={(c) => {
          setEditingCoffee(c);
          setIsCoffeeModalOpen(true);
        }}
        onOpenEditEquipment={(e) => {
          setEditingEquipment(e);
          setIsEquipmentModalOpen(true);
        }}
        onOpenEditCafe={(c) => {
          setEditingCafe(c);
          setIsCafeModalOpen(true);
        }}
        onOpenEditNote={(n) => {
          setEditingNote(n);
          setIsNoteModalOpen(true);
        }}
      />
    </div>
  );
}
