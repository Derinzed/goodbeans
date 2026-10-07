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

    // Calculate on-demand from the member tasting notes breakdown
    let generalTastingNotes: string[] = [];
    let tastingNotesBreakdown: Array<{ note: string; count: number }> = [];

    if (Array.isArray(match.tastingNotesBreakdown) && match.tastingNotesBreakdown.length > 0) {
      tastingNotesBreakdown = [...match.tastingNotesBreakdown].sort((a, b) => (b.count || 0) - (a.count || 0));
      generalTastingNotes = tastingNotesBreakdown.slice(0, 5).map((x) => x.note);
    } else if (Array.isArray(match.generalTastingNotes) && match.generalTastingNotes.length > 0) {
      generalTastingNotes = match.generalTastingNotes.slice(0, 5);
      tastingNotesBreakdown = generalTastingNotes.map((note) => ({ note, count: ratingsCount || 1 }));
    } else if (Array.isArray(match.tastingNotesSummary) && match.tastingNotesSummary.length > 0) {
      generalTastingNotes = match.tastingNotesSummary.slice(0, 5);
      tastingNotesBreakdown = generalTastingNotes.map((note) => ({ note, count: ratingsCount || 1 }));
    }

    return {
      isRegistered: true,
      generalRating,
      ratingsCount,
      userCount: typeof match.userCount === 'number' ? match.userCount : ratingsCount,
      generalTastingNotes,
      tastingNotesBreakdown,
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
 * Deduplicates an array of items by matching either identical IDs or identical (name + secondary key).
 */
export function deduplicateItems<T extends { id?: string; name?: string; [key: string]: any }>(
  list: T[],
  secondaryKey?: string
): T[] {
  if (!Array.isArray(list)) return [];
  const result: T[] = [];

  const isMatch = (a: T, b: T): boolean => {
    if (!a || !b) return false;
    const aId = a.id ? String(a.id).trim() : '';
    const bId = b.id ? String(b.id).trim() : '';
    if (aId && bId && aId === bId) return true;

    const aName = a.name ? String(a.name).trim().toLowerCase() : '';
    const bName = b.name ? String(b.name).trim().toLowerCase() : '';
    if (aName && bName && aName === bName) {
      if (!secondaryKey) return true;
      const aSec = a[secondaryKey] ? String(a[secondaryKey]).trim().toLowerCase() : '';
      const bSec = b[secondaryKey] ? String(b[secondaryKey]).trim().toLowerCase() : '';
      return aSec === bSec;
    }
    return false;
  };

  list.forEach((item) => {
    if (!item) return;
    const existingIdx = result.findIndex((r) => isMatch(r, item));
    if (existingIdx === -1) {
      result.push({ ...item });
    } else {
      result[existingIdx] = {
        ...result[existingIdx],
        ...item,
        ...(Array.isArray((result[existingIdx] as any).tastingLogs) || Array.isArray((item as any).tastingLogs)
          ? {
              tastingLogs: [
                ...((result[existingIdx] as any).tastingLogs || []),
                ...((item as any).tastingLogs || []),
              ].filter((val, i, arr) => arr.findIndex((x) => (x.id && x.id === val.id) || x === val) === i),
            }
          : {}),
        ...(Array.isArray((result[existingIdx] as any).recipes) || Array.isArray((item as any).recipes)
          ? {
              recipes: [
                ...((result[existingIdx] as any).recipes || []),
                ...((item as any).recipes || []),
              ].filter((val, i, arr) => arr.findIndex((x) => (x.id && x.id === val.id) || x === val) === i),
            }
          : {}),
      };
    }
  });

  return result;
}

/**
 * Sanitizes an entire user data payload so it contains strictly user-specific data and no duplicates.
 */
export function sanitizeUserData(data: any): any {
  if (!data || typeof data !== 'object') return data;
  const sanitized = { ...data };
  if (Array.isArray(sanitized.coffees)) {
    sanitized.coffees = deduplicateItems(sanitized.coffees.map(stripGeneralCoffeeFields), 'roaster');
  }
  if (Array.isArray(sanitized.equipment)) {
    sanitized.equipment = deduplicateItems(sanitized.equipment.map(stripGeneralEquipmentFields), 'brand');
  }
  if (Array.isArray(sanitized.cafes)) {
    sanitized.cafes = deduplicateItems(sanitized.cafes.map(stripGeneralCafeFields), 'city');
  }
  return sanitized;
}

