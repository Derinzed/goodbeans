import type { Coffee, Equipment, Cafe, RegisteredCoffee, RegisteredEquipment, RegisteredCafe } from '../types/coffee';

export interface GeneralCoffeeInfo {
  isRegistered: boolean;
  generalRating: number;
  ratingsCount: number;
  userCount: number;
  generalTastingNotes: string[];
  tastingNotesBreakdown: Array<{ note: string; count: number }>;
}

export function getGeneralCoffeeInfo(
  coffee: Coffee | null | undefined,
  catalog: RegisteredCoffee[] = []
): GeneralCoffeeInfo {
  if (!coffee || !coffee.name) {
    return {
      isRegistered: false,
      generalRating: 0,
      ratingsCount: 0,
      userCount: 0,
      generalTastingNotes: [],
      tastingNotesBreakdown: [],
    };
  }

  const cleanName = coffee.name.trim().toLowerCase();
  const cleanRoaster = (coffee.roaster || '').trim().toLowerCase();

  const match = (catalog || []).find((rc) => {
    const rcName = (rc.name || '').trim().toLowerCase();
    const rcRoaster = (rc.roaster || (rc as any).secondary || '').trim().toLowerCase();
    if (rcName !== cleanName) return false;
    if (cleanRoaster && rcRoaster) {
      return rcRoaster === cleanRoaster || rcRoaster.includes(cleanRoaster) || cleanRoaster.includes(rcRoaster);
    }
    return true;
  });

  if (match) {
    const ratingsCount = typeof match.ratingsCount === 'number' ? match.ratingsCount : 0;
    const generalRating = ratingsCount > 0 && typeof match.generalRating === 'number' ? match.generalRating : 0;

    return {
      isRegistered: true,
      generalRating,
      ratingsCount,
      userCount: typeof match.userCount === 'number' ? match.userCount : ratingsCount,
      generalTastingNotes: Array.isArray(match.generalTastingNotes) ? match.generalTastingNotes : [],
      tastingNotesBreakdown: Array.isArray(match.tastingNotesBreakdown) ? match.tastingNotesBreakdown : [],
    };
  }

  return {
    isRegistered: false,
    generalRating: 0,
    ratingsCount: 0,
    userCount: 0,
    generalTastingNotes: [],
    tastingNotesBreakdown: [],
  };
}

export interface GeneralItemInfo {
  isRegistered: boolean;
  generalRating: number;
  ratingsCount: number;
}

export function getGeneralEquipmentInfo(
  equipment: Equipment | null | undefined,
  catalog: RegisteredEquipment[] = []
): GeneralItemInfo {
  if (!equipment || !equipment.name) {
    return { isRegistered: false, generalRating: 0, ratingsCount: 0 };
  }

  const cleanName = equipment.name.trim().toLowerCase();
  const cleanBrand = (equipment.brand || '').trim().toLowerCase();

  const match = (catalog || []).find((req) => {
    const reqName = (req.name || '').trim().toLowerCase();
    const reqBrand = (req.brand || (req as any).secondary || '').trim().toLowerCase();
    if (reqName !== cleanName) return false;
    if (cleanBrand && reqBrand) {
      return reqBrand === cleanBrand || reqBrand.includes(cleanBrand) || cleanBrand.includes(reqBrand);
    }
    return true;
  });

  if (match) {
    const ratingsCount = typeof match.ratingsCount === 'number' ? match.ratingsCount : 0;
    const generalRating = ratingsCount > 0 && typeof match.generalRating === 'number' ? match.generalRating : 0;
    return { isRegistered: true, generalRating, ratingsCount };
  }

  return { isRegistered: false, generalRating: 0, ratingsCount: 0 };
}

export function getGeneralCafeInfo(
  cafe: Cafe | null | undefined,
  catalog: RegisteredCafe[] = []
): GeneralItemInfo {
  if (!cafe || !cafe.name) {
    return { isRegistered: false, generalRating: 0, ratingsCount: 0 };
  }

  const cleanName = cafe.name.trim().toLowerCase();
  const cleanCity = (cafe.city || '').trim().toLowerCase();

  const match = (catalog || []).find((rc) => {
    const rcName = (rc.name || '').trim().toLowerCase();
    const rcCity = (rc.city || (rc as any).secondary || '').trim().toLowerCase();
    if (rcName !== cleanName) return false;
    if (cleanCity && rcCity) {
      return rcCity === cleanCity || rcCity.includes(cleanCity) || cleanCity.includes(rcCity);
    }
    return true;
  });

  if (match) {
    const ratingsCount = typeof match.ratingsCount === 'number' ? match.ratingsCount : 0;
    const generalRating = ratingsCount > 0 && typeof match.generalRating === 'number' ? match.generalRating : 0;
    return { isRegistered: true, generalRating, ratingsCount };
  }

  return { isRegistered: false, generalRating: 0, ratingsCount: 0 };
}

/**
 * Strip server-owned general information from a coffee object.
 * User data stores ONLY user-specific information.
 */
export function stripGeneralCoffeeFields(coffee: any): any {
  if (!coffee || typeof coffee !== 'object') return coffee;
  const {
    generalRating,
    generalRatingsCount,
    communityRating,
    communityRatingsCount,
    ratingsCount,
    userCount,
    generalTastingNotes,
    tastingNotesBreakdown,
    isRegistered,
    ...userSpecific
  } = coffee;
  return userSpecific;
}

/**
 * Strip server-owned general information from equipment.
 */
export function stripGeneralEquipmentFields(equipment: any): any {
  if (!equipment || typeof equipment !== 'object') return equipment;
  const {
    generalRating,
    generalRatingsCount,
    communityRating,
    communityRatingsCount,
    ratingsCount,
    userCount,
    isRegistered,
    ...userSpecific
  } = equipment;
  return userSpecific;
}

/**
 * Strip server-owned general information from a cafe.
 */
export function stripGeneralCafeFields(cafe: any): any {
  if (!cafe || typeof cafe !== 'object') return cafe;
  const {
    generalRating,
    generalRatingsCount,
    communityRating,
    communityRatingsCount,
    ratingsCount,
    userCount,
    isRegistered,
    ...userSpecific
  } = cafe;
  return userSpecific;
}

/**
 * Sanitizes an entire user data payload so it contains strictly user-specific data.
 */
export function sanitizeUserData(data: any): any {
  if (!data || typeof data !== 'object') return data;
  const sanitized = { ...data };
  if (Array.isArray(sanitized.coffees)) {
    sanitized.coffees = sanitized.coffees.map(stripGeneralCoffeeFields);
  }
  if (Array.isArray(sanitized.equipment)) {
    sanitized.equipment = sanitized.equipment.map(stripGeneralEquipmentFields);
  }
  if (Array.isArray(sanitized.cafes)) {
    sanitized.cafes = sanitized.cafes.map(stripGeneralCafeFields);
  }
  return sanitized;
}

