import type { Coffee, Equipment, Cafe, RegisteredCoffee, RegisteredEquipment, RegisteredCafe } from '../types/coffee';

export interface GeneralCoffeeInfo {
  generalRating: number;
  ratingsCount: number;
  userCount: number;
  generalTastingNotes: string[];
  tastingNotesBreakdown: Array<{ note: string; count: number }>;
}

export function getGeneralCoffeeInfo(
  coffee: Coffee | null | undefined,
  catalog: RegisteredCoffee[]
): GeneralCoffeeInfo {
  if (!coffee || !coffee.name) {
    return {
      generalRating: 0,
      ratingsCount: 0,
      userCount: 0,
      generalTastingNotes: [],
      tastingNotesBreakdown: [],
    };
  }

  const cleanName = coffee.name.trim().toLowerCase();
  const cleanRoaster = (coffee.roaster || '').trim().toLowerCase();

  const match = catalog.find((rc) => {
    const rcName = (rc.name || '').trim().toLowerCase();
    const rcRoaster = (rc.roaster || (rc as any).secondary || '').trim().toLowerCase();
    if (cleanRoaster && rcRoaster) {
      return rcName === cleanName && rcRoaster === cleanRoaster;
    }
    return rcName === cleanName;
  });

  if (match) {
    const ratingsCount = typeof match.ratingsCount === 'number' ? match.ratingsCount : 0;
    const generalRating = ratingsCount > 0 && typeof match.generalRating === 'number' ? match.generalRating : 0;

    return {
      generalRating,
      ratingsCount,
      userCount: typeof match.userCount === 'number' ? match.userCount : ratingsCount,
      generalTastingNotes: Array.isArray(match.generalTastingNotes) ? match.generalTastingNotes : [],
      tastingNotesBreakdown: Array.isArray(match.tastingNotesBreakdown) ? match.tastingNotesBreakdown : [],
    };
  }

  return {
    generalRating: 0,
    ratingsCount: 0,
    userCount: 0,
    generalTastingNotes: [],
    tastingNotesBreakdown: [],
  };
}

export interface GeneralItemInfo {
  generalRating: number;
  ratingsCount: number;
}

export function getGeneralEquipmentInfo(
  equipment: Equipment | null | undefined,
  catalog: RegisteredEquipment[]
): GeneralItemInfo {
  if (!equipment || !equipment.name) {
    return { generalRating: 0, ratingsCount: 0 };
  }

  const cleanName = equipment.name.trim().toLowerCase();
  const cleanBrand = (equipment.brand || '').trim().toLowerCase();

  const match = catalog.find((req) => {
    const reqName = (req.name || '').trim().toLowerCase();
    const reqBrand = (req.brand || (req as any).secondary || '').trim().toLowerCase();
    if (cleanBrand && reqBrand) {
      return reqName === cleanName && reqBrand === cleanBrand;
    }
    return reqName === cleanName;
  });

  if (match) {
    const ratingsCount = typeof match.ratingsCount === 'number' ? match.ratingsCount : 0;
    const generalRating = ratingsCount > 0 && typeof match.generalRating === 'number' ? match.generalRating : 0;
    return { generalRating, ratingsCount };
  }

  return { generalRating: 0, ratingsCount: 0 };
}

export function getGeneralCafeInfo(
  cafe: Cafe | null | undefined,
  catalog: RegisteredCafe[]
): GeneralItemInfo {
  if (!cafe || !cafe.name) {
    return { generalRating: 0, ratingsCount: 0 };
  }

  const cleanName = cafe.name.trim().toLowerCase();
  const cleanCity = (cafe.city || '').trim().toLowerCase();

  const match = catalog.find((rc) => {
    const rcName = (rc.name || '').trim().toLowerCase();
    const rcCity = (rc.city || (rc as any).secondary || '').trim().toLowerCase();
    if (cleanCity && rcCity) {
      return rcName === cleanName && rcCity === cleanCity;
    }
    return rcName === cleanName;
  });

  if (match) {
    const ratingsCount = typeof match.ratingsCount === 'number' ? match.ratingsCount : 0;
    const generalRating = ratingsCount > 0 && typeof match.generalRating === 'number' ? match.generalRating : 0;
    return { generalRating, ratingsCount };
  }

  return { generalRating: 0, ratingsCount: 0 };
}
