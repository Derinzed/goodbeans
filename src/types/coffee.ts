export type BrewMethod =
  | 'v60'
  | 'espresso'
  | 'aeropress'
  | 'french-press'
  | 'chemex'
  | 'clever'
  | 'cold-brew'
  | 'moka-pot'
  | 'auto-drip'
  | 'other';

export interface CustomVariable {
  id: string;
  label: string;
  value: string;
  unit?: string;
}

export interface RecipeStep {
  id: string;
  timeSeconds: number;
  title: string;
  waterAmountGrams?: number;
  instruction: string;
}

export interface BrewRecipe {
  id: string;
  coffeeId: string;
  title: string;
  method: BrewMethod;
  doseGrams: number;
  waterGrams: number;
  ratio: string;
  grindSize: string;
  waterTempC: number;
  totalTimeSeconds: number;
  bloomGrams?: number;
  bloomTimeSeconds?: number;
  equipmentIds: string[];
  customVariables: CustomVariable[];
  steps: RecipeStep[];
  notes?: string;
  isRecommended?: boolean;
  createdAt: string;
}

export interface SensoryScores {
  acidity: number; // 1-5
  sweetness: number; // 1-5
  body: number; // 1-5
  clarity: number; // 1-5
  bitterness: number; // 1-5
}

export interface TastingEntry {
  id: string;
  date: string;
  brewMethod?: string;
  rating: number; // 0.5 to 5.0
  notes: string;
  flavorTags: string[];
  sensoryScores: SensoryScores;
  daysOffRoast?: number;
}

export type RoastLevel =
  | 'Light'
  | 'Medium-Light'
  | 'Medium'
  | 'Medium-Dark'
  | 'Dark';

export type ProcessType =
  | 'Washed'
  | 'Natural'
  | 'Honey'
  | 'Anaerobic Natural'
  | 'Thermal Shock'
  | 'Experimental'
  | 'Wet-Hulled'
  | 'Washed & Natural'
  | 'Washed & Wet-Hulled'
  | 'Co-ferment';

export interface CoffeeOrigin {
  country: string;
  region?: string;
  farmOrStation?: string;
  producer?: string;
  elevationMeters?: number;
}

export interface CoffeeCustomNote {
  id: string;
  title: string;
  content: string;
  date: string;
  tags?: string[];
}

export interface Coffee {
  id: string;
  name: string;
  roaster: string;
  origin: CoffeeOrigin;
  variety: string;
  process: ProcessType;
  roastLevel: RoastLevel;
  roastDate?: string;
  userRating: number; // 0 to 5 personal rating
  communityRating: number; // General rating across all users
  communityRatingsCount: number;
  generalRating?: number; // General rating across all users
  shelfIds: string[];
  tastingNotesSummary: string[];
  tastingLogs: TastingEntry[];
  recipes: BrewRecipe[];
  customNotes?: CoffeeCustomNote[];
  coverColor: string;
  bagBadgeText?: string;
  description: string;
  dateAdded: string;
  dateFinished?: string;
  isFavorite: boolean;
  isRegistered?: boolean;
}

export type EquipmentCategory =
  | 'Grinder'
  | 'Espresso Machine'
  | 'Pour Over / Dripper'
  | 'Kettle'
  | 'Scale'
  | 'Immersion'
  | 'Accessory'
  | 'Roaster';

export interface Equipment {
  id: string;
  name: string;
  brand: string;
  category: EquipmentCategory;
  status: 'Active' | 'Wishlist' | 'Archived';
  dateAcquired?: string;
  settingsNotes: string;
  maintenanceNotes: string;
  generalNotes: string;
  rating?: number; // Personal rating
  generalRating?: number; // General rating across all user-added equipment
  generalRatingsCount?: number;
  isRegistered?: boolean;
}

export interface Shelf {
  id: string;
  name: string;
  description?: string;
  isDefault: boolean;
  color?: string;
}

export interface ChallengeGoal {
  year: number;
  targetCount: number;
}

export interface Cafe {
  id: string;
  name: string;
  address: string;
  city: string;
  country: string;
  rating: number; // Personal rating (0.5 to 5.0)
  generalRating?: number; // General rating across all user-added cafes
  generalRatingsCount?: number;
  favoriteDrink?: string;
  vibes: string[];
  dateVisited?: string;
  notes: string;
  roasterOrBeansServed?: string;
  googleMapsUrl?: string;
  isFavorite?: boolean;
  isRegistered?: boolean;
}

export interface RegisteredCoffee {
  id: string;
  name: string;
  roaster: string;
  origin?: CoffeeOrigin;
  variety?: string;
  process?: ProcessType;
  roastLevel?: RoastLevel;
  generalRating: number;
  ratingsCount: number;
  userCount: number;
  isRecommended: boolean;
  tastingNotesSummary?: string[];
  description?: string;
  coverColor?: string;
}

export interface RegisteredEquipment {
  id: string;
  name: string;
  brand: string;
  category: EquipmentCategory;
  generalRating: number;
  ratingsCount: number;
  userCount: number;
  isRecommended: boolean;
  generalNotes?: string;
  settingsNotes?: string;
  maintenanceNotes?: string;
}

export interface RegisteredCafe {
  id: string;
  name: string;
  city: string;
  country: string;
  generalRating: number;
  ratingsCount: number;
  userCount: number;
  isRecommended: boolean;
  notes?: string;
  address?: string;
  vibes?: string[];
  favoriteDrink?: string;
}

export type NoteCategory =
  | 'Brew Technique'
  | 'Water Recipe'
  | 'Dial-in & Grind'
  | 'Roaster & Origin'
  | 'Cupping & Sensory'
  | 'Equipment Care'
  | 'General';

export interface CustomNote {
  id: string;
  title: string;
  content: string;
  category: NoteCategory;
  tags: string[];
  isPinned?: boolean;
  date: string;
  coffeeId?: string;
  coffeeName?: string;
}

