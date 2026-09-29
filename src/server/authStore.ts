import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import { INITIAL_COFFEES, INITIAL_EQUIPMENT, INITIAL_CAFES } from '../data/initialData.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
// Root data directory
const DATA_DIR = path.resolve(__dirname, '../../data');
const USERS_FILE = path.join(DATA_DIR, 'users.json');
const COMMUNITY_ITEMS_FILE = path.join(DATA_DIR, 'community_items.json');

export interface UserDataPayload {
  coffees?: any[];
  equipment?: any[];
  cafes?: any[];
  notes?: any[];
  shelves?: any[];
  theme?: string;
  primaryHue?: string;
  secondaryHue?: string;
  backgroundColor?: string;
  [key: string]: any;
}

export interface StoredUser {
  id: string;
  username: string;
  passwordHash: string;
  salt: string;
  role: 'admin' | 'user';
  createdAt: string;
  lastLoginAt: string;
  updatedAt: string;
  data: UserDataPayload;
}

export interface SessionToken {
  token: string;
  userId: string;
  createdAt: number;
}

function normalizeString(str: string): string {
  return (str || '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function calculateSimilarity(a: string, b: string): number {
  const normA = normalizeString(a);
  const normB = normalizeString(b);
  if (!normA || !normB) return 0;
  if (normA === normB) return 1.0;

  // Substring check
  if (normA.includes(normB) || normB.includes(normA)) {
    const minLen = Math.min(normA.length, normB.length);
    const maxLen = Math.max(normA.length, normB.length);
    if (minLen >= 5) {
      return Math.max(0.75, minLen / maxLen);
    }
  }

  // Token-based Jaccard similarity
  const tokensA = new Set(normA.split(' ').filter(Boolean));
  const tokensB = new Set(normB.split(' ').filter(Boolean));
  if (tokensA.size === 0 || tokensB.size === 0) return 0;

  let intersectionCount = 0;
  tokensA.forEach((token) => {
    if (tokensB.has(token)) intersectionCount++;
  });
  const unionCount = tokensA.size + tokensB.size - intersectionCount;
  return unionCount > 0 ? intersectionCount / unionCount : 0;
}

// In-memory token session store (persisted in memory for fast lookup)
const activeSessions = new Map<string, SessionToken>();

function hashPassword(password: string, salt: string): string {
  return crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
}

export class AuthStore {
  private static ensureStorage() {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (!fs.existsSync(USERS_FILE)) {
      // Seed default admin account
      const adminSalt = crypto.randomBytes(16).toString('hex');
      const adminPasswordHash = hashPassword('admin123', adminSalt);
      const defaultAdmin: StoredUser = {
        id: 'user-admin',
        username: 'admin',
        passwordHash: adminPasswordHash,
        salt: adminSalt,
        role: 'admin',
        createdAt: new Date().toISOString(),
        lastLoginAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        data: {},
      };
      fs.writeFileSync(USERS_FILE, JSON.stringify([defaultAdmin], null, 2), 'utf-8');
    }
  }

  public static getUsers(): StoredUser[] {
    this.ensureStorage();
    try {
      const content = fs.readFileSync(USERS_FILE, 'utf-8');
      return JSON.parse(content || '[]');
    } catch (err) {
      console.error('Error reading users file:', err);
      return [];
    }
  }

  private static saveUsers(users: StoredUser[]): void {
    this.ensureStorage();
    fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2), 'utf-8');
  }

  public static findByUsername(username: string): StoredUser | null {
    const users = this.getUsers();
    return users.find((u) => u.username.toLowerCase() === username.trim().toLowerCase()) || null;
  }

  public static findById(id: string): StoredUser | null {
    const users = this.getUsers();
    return users.find((u) => u.id === id) || null;
  }

  public static createUser(
    username: string,
    password: string,
    initialData?: UserDataPayload
  ): StoredUser {
    const users = this.getUsers();
    const cleanUsername = username.trim();

    if (users.some((u) => u.username.toLowerCase() === cleanUsername.toLowerCase())) {
      throw new Error(`Username "${cleanUsername}" is already taken.`);
    }

    const salt = crypto.randomBytes(16).toString('hex');
    const passwordHash = hashPassword(password, salt);
    const isFirstUserAdmin = cleanUsername.toLowerCase() === 'admin';

    const newUser: StoredUser = {
      id: `user-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`,
      username: cleanUsername,
      passwordHash,
      salt,
      role: isFirstUserAdmin ? 'admin' : 'user',
      createdAt: new Date().toISOString(),
      lastLoginAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      data: initialData || {},
    };

    users.push(newUser);
    this.saveUsers(users);
    return newUser;
  }

  public static verifyCredentials(username: string, password: string): StoredUser | null {
    const user = this.findByUsername(username);
    if (!user) return null;

    const testHash = hashPassword(password, user.salt);
    if (testHash === user.passwordHash) {
      // update last login
      user.lastLoginAt = new Date().toISOString();
      const users = this.getUsers();
      const index = users.findIndex((u) => u.id === user.id);
      if (index !== -1) {
        users[index].lastLoginAt = user.lastLoginAt;
        this.saveUsers(users);
      }
      return user;
    }
    return null;
  }

  public static createSession(userId: string): string {
    const token = `gb_${crypto.randomBytes(32).toString('hex')}`;
    activeSessions.set(token, {
      token,
      userId,
      createdAt: Date.now(),
    });
    return token;
  }

  public static getUserByToken(token: string): StoredUser | null {
    if (!token) return null;
    const session = activeSessions.get(token);
    if (!session) return null;
    return this.findById(session.userId);
  }

  public static deleteSession(token: string): void {
    activeSessions.delete(token);
  }

  public static updateUserData(userId: string, data: UserDataPayload): StoredUser {
    const users = this.getUsers();
    const index = users.findIndex((u) => u.id === userId);
    if (index === -1) {
      throw new Error('User not found.');
    }

    users[index].data = {
      ...users[index].data,
      ...data,
    };
    users[index].updatedAt = new Date().toISOString();
    this.saveUsers(users);
    return users[index];
  }

  public static deleteUser(userId: string): boolean {
    const users = this.getUsers();
    const index = users.findIndex((u) => u.id === userId);
    if (index === -1) {
      return false;
    }

    users.splice(index, 1);
    this.saveUsers(users);

    // Invalidate any active sessions for this user
    for (const [token, session] of activeSessions.entries()) {
      if (session.userId === userId) {
        activeSessions.delete(token);
      }
    }
    return true;
  }

  public static getAllUsersSummary(): any[] {
    const users = this.getUsers();
    return users.map((u) => {
      const data = u.data || {};
      const coffees = Array.isArray(data.coffees) ? data.coffees : [];
      const equipment = Array.isArray(data.equipment) ? data.equipment : [];
      const cafes = Array.isArray(data.cafes) ? data.cafes : [];
      const notes = Array.isArray(data.notes) ? data.notes : [];
      const tastingsCount = coffees.reduce(
        (acc: number, c: any) => acc + (Array.isArray(c.tastingLogs) ? c.tastingLogs.length : 0),
        0
      );

      return {
        id: u.id,
        username: u.username,
        role: u.role,
        createdAt: u.createdAt,
        lastLoginAt: u.lastLoginAt,
        updatedAt: u.updatedAt,
        coffeesCount: coffees.length,
        equipmentCount: equipment.length,
        cafesCount: cafes.length,
        notesCount: notes.length,
        tastingsCount,
        hasData: coffees.length > 0 || equipment.length > 0 || cafes.length > 0 || notes.length > 0,
      };
    });
  }

  private static getCommunityItemsData(): { coffees: any[]; equipment: any[]; cafes: any[] } {
    this.ensureStorage();
    if (!fs.existsSync(COMMUNITY_ITEMS_FILE)) {
      return { coffees: [], equipment: [], cafes: [] };
    }
    try {
      const content = fs.readFileSync(COMMUNITY_ITEMS_FILE, 'utf-8');
      return JSON.parse(content || '{"coffees":[],"equipment":[],"cafes":[]}');
    } catch {
      return { coffees: [], equipment: [], cafes: [] };
    }
  }

  private static saveCommunityItemsData(data: { coffees: any[]; equipment: any[]; cafes: any[] }): void {
    this.ensureStorage();
    fs.writeFileSync(COMMUNITY_ITEMS_FILE, JSON.stringify(data, null, 2), 'utf-8');
  }

  public static recordCommunityItem(
    type: 'coffee' | 'equipment' | 'cafe',
    item: any,
    userId: string = 'community-user',
    rating?: number
  ): any {
    const data = this.getCommunityItemsData();
    if (!data.coffees) data.coffees = [];
    if (!data.equipment) data.equipment = [];
    if (!data.cafes) data.cafes = [];

    const list = type === 'coffee' ? data.coffees : type === 'equipment' ? data.equipment : data.cafes;
    const cleanName = (item.name || '').trim();
    if (!cleanName) return null;

    const secondary = (item.roaster || item.brand || item.city || '').trim().toLowerCase();
    const key = `${cleanName.toLowerCase()}::${secondary}`;

    const existingIndex = list.findIndex((x) => {
      const xSec = (x.roaster || x.brand || x.city || '').trim().toLowerCase();
      return `${(x.name || '').trim().toLowerCase()}::${xSec}` === key;
    });

    const parsedRating =
      typeof rating === 'number' && rating > 0
        ? rating
        : typeof item.userRating === 'number' && item.userRating > 0
        ? item.userRating
        : typeof item.rating === 'number' && item.rating > 0
        ? item.rating
        : undefined;

    if (existingIndex >= 0) {
      const existing = list[existingIndex];
      if (!Array.isArray(existing.ratings)) existing.ratings = [];
      if (parsedRating !== undefined) {
        existing.ratings.push(parsedRating);
      }
      if (!Array.isArray(existing.users)) existing.users = [];
      if (userId && !existing.users.includes(userId)) {
        existing.users.push(userId);
      }
      list[existingIndex] = { ...existing, ...item, ratings: existing.ratings, users: existing.users };
      this.saveCommunityItemsData(data);
      return list[existingIndex];
    } else {
      const newItem = {
        ...item,
        id: item.id || `community-${type}-${Date.now()}`,
        name: cleanName,
        ratings: parsedRating !== undefined ? [parsedRating] : [],
        users: userId ? [userId] : [],
        createdAt: new Date().toISOString(),
      };
      list.push(newItem);
      this.saveCommunityItemsData(data);
      return newItem;
    }
  }

  // Running catalog of all registered coffees across all users and defaults
  public static getRegisteredCoffees(): any[] {
    const users = this.getUsers();
    const communityData = this.getCommunityItemsData();
    const coffeeMap = new Map<string, any>();

    const processCoffeeItem = (c: any, userId?: string) => {
      if (!c || !c.name || typeof c.name !== 'string') return;
      const cleanName = c.name.trim();
      const cleanRoaster = (c.roaster || '').trim();
      const key = `${cleanName.toLowerCase()}::${cleanRoaster.toLowerCase()}`;

      // Extract ratings (personal rating + any tasting logs + existing ratings array)
      const ratings: number[] = [];
      if (typeof c.userRating === 'number' && c.userRating > 0) ratings.push(c.userRating);
      if (typeof c.rating === 'number' && c.rating > 0) ratings.push(c.rating);
      if (Array.isArray(c.ratings)) {
        c.ratings.forEach((r: any) => {
          if (typeof r === 'number' && r > 0) ratings.push(r);
        });
      }
      if (Array.isArray(c.tastingLogs)) {
        c.tastingLogs.forEach((log: any) => {
          if (typeof log?.rating === 'number' && log.rating > 0) ratings.push(log.rating);
        });
      }

      const existing = coffeeMap.get(key);
      if (existing) {
        if (userId) existing.users.add(userId);
        if (Array.isArray(c.users)) {
          c.users.forEach((u: string) => existing.users.add(u));
        }
        ratings.forEach((r) => existing.ratings.push(r));
        if (!existing.origin && c.origin) existing.origin = c.origin;
        if (!existing.process && c.process) existing.process = c.process;
        if (!existing.variety && c.variety) existing.variety = c.variety;
        if (!existing.roastLevel && c.roastLevel) existing.roastLevel = c.roastLevel;
        if (!existing.description && c.description) existing.description = c.description;
        if (Array.isArray(c.tastingNotesSummary) && c.tastingNotesSummary.length > 0) {
          existing.tastingNotesSummary = Array.from(
            new Set([...existing.tastingNotesSummary, ...c.tastingNotesSummary])
          );
        }
      } else {
        const usersSet = new Set<string>();
        if (userId) usersSet.add(userId);
        if (Array.isArray(c.users)) {
          c.users.forEach((u: string) => usersSet.add(u));
        }
        coffeeMap.set(key, {
          id: c.id || `reg-coffee-${cleanName.toLowerCase().replace(/[^a-z0-9]/g, '-')}`,
          name: cleanName,
          roaster: cleanRoaster || 'Artisan Roaster',
          origin: c.origin || { country: 'Single Origin' },
          variety: c.variety || 'Arabica',
          process: c.process || 'Washed',
          roastLevel: c.roastLevel || 'Medium',
          coverColor: c.coverColor || '#C87D32',
          description: c.description || '',
          tastingNotesSummary: Array.isArray(c.tastingNotesSummary) ? c.tastingNotesSummary : [],
          ratings: [...ratings],
          users: usersSet,
        });
      }
    };

    // 1. Ingest initial seed catalog
    INITIAL_COFFEES.forEach((c) => processCoffeeItem(c, 'seed-system'));

    // 2. Ingest all user-added coffees from stored accounts
    users.forEach((u) => {
      const userCoffees = u.data?.coffees;
      if (Array.isArray(userCoffees)) {
        userCoffees.forEach((c) => processCoffeeItem(c, u.id));
      }
    });

    // 3. Ingest community registered additions
    if (Array.isArray(communityData.coffees)) {
      communityData.coffees.forEach((c) => processCoffeeItem(c, 'community-user'));
    }

    // Format output with computed general average rating across all users
    return Array.from(coffeeMap.values()).map((item) => {
      const count = item.ratings.length;
      const sum = item.ratings.reduce((acc: number, r: number) => acc + r, 0);
      const generalRating = count > 0 ? Number((sum / count).toFixed(1)) : 4.5;
      const userCount = Math.max(1, item.users.size);

      return {
        id: item.id,
        name: item.name,
        roaster: item.roaster,
        origin: item.origin,
        variety: item.variety,
        process: item.process,
        roastLevel: item.roastLevel,
        coverColor: item.coverColor,
        description: item.description,
        tastingNotesSummary: item.tastingNotesSummary,
        generalRating,
        ratingsCount: count,
        userCount,
        isRecommended: generalRating >= 4.5 && (count >= 1 || userCount >= 1),
      };
    }).sort((a, b) => (b.isRecommended ? 1 : 0) - (a.isRecommended ? 1 : 0) || b.generalRating - a.generalRating);
  }

  // Running catalog of all registered equipment across all users and defaults
  public static getRegisteredEquipment(): any[] {
    const users = this.getUsers();
    const communityData = this.getCommunityItemsData();
    const equipmentMap = new Map<string, any>();

    const processEquipmentItem = (eq: any, userId?: string) => {
      if (!eq || !eq.name || typeof eq.name !== 'string') return;
      const cleanName = eq.name.trim();
      const cleanCategory = (eq.category || 'Accessory').trim();
      const key = `${cleanName.toLowerCase()}::${cleanCategory.toLowerCase()}`;

      const ratings: number[] = [];
      if (typeof eq.rating === 'number' && eq.rating > 0) ratings.push(eq.rating);
      if (Array.isArray(eq.ratings)) {
        eq.ratings.forEach((r: any) => {
          if (typeof r === 'number' && r > 0) ratings.push(r);
        });
      }

      const existing = equipmentMap.get(key);
      if (existing) {
        if (userId) existing.users.add(userId);
        if (Array.isArray(eq.users)) {
          eq.users.forEach((u: string) => existing.users.add(u));
        }
        ratings.forEach((r) => existing.ratings.push(r));
        if (!existing.brand && eq.brand) existing.brand = eq.brand;
        if (!existing.settingsNotes && eq.settingsNotes) existing.settingsNotes = eq.settingsNotes;
      } else {
        const usersSet = new Set<string>();
        if (userId) usersSet.add(userId);
        if (Array.isArray(eq.users)) {
          eq.users.forEach((u: string) => usersSet.add(u));
        }
        equipmentMap.set(key, {
          id: eq.id || `reg-eq-${cleanName.toLowerCase().replace(/[^a-z0-9]/g, '-')}`,
          name: cleanName,
          brand: eq.brand || 'Coffee Gear',
          category: cleanCategory,
          settingsNotes: eq.settingsNotes || '',
          maintenanceNotes: eq.maintenanceNotes || '',
          generalNotes: eq.generalNotes || '',
          ratings: [...ratings],
          users: usersSet,
        });
      }
    };

    INITIAL_EQUIPMENT.forEach((eq) => processEquipmentItem(eq, 'seed-system'));
    users.forEach((u) => {
      const userGear = u.data?.equipment;
      if (Array.isArray(userGear)) {
        userGear.forEach((eq) => processEquipmentItem(eq, u.id));
      }
    });
    if (Array.isArray(communityData.equipment)) {
      communityData.equipment.forEach((eq) => processEquipmentItem(eq, 'community-user'));
    }

    return Array.from(equipmentMap.values()).map((item) => {
      const count = item.ratings.length;
      const sum = item.ratings.reduce((acc: number, r: number) => acc + r, 0);
      const generalRating = count > 0 ? Number((sum / count).toFixed(1)) : 4.5;
      const userCount = Math.max(1, item.users.size);

      return {
        id: item.id,
        name: item.name,
        brand: item.brand,
        category: item.category,
        settingsNotes: item.settingsNotes,
        maintenanceNotes: item.maintenanceNotes,
        generalNotes: item.generalNotes,
        generalRating,
        ratingsCount: count,
        userCount,
        isRecommended: generalRating >= 4.5,
      };
    }).sort((a, b) => b.generalRating - a.generalRating);
  }

  // Running catalog of all registered cafes across all users and defaults
  public static getRegisteredCafes(): any[] {
    const users = this.getUsers();
    const communityData = this.getCommunityItemsData();
    const cafeMap = new Map<string, any>();

    const processCafeItem = (cafe: any, userId?: string) => {
      if (!cafe || !cafe.name || typeof cafe.name !== 'string') return;
      const cleanName = cafe.name.trim();
      const cleanCity = (cafe.city || '').trim();
      const key = `${cleanName.toLowerCase()}::${cleanCity.toLowerCase()}`;

      const ratings: number[] = [];
      if (typeof cafe.rating === 'number' && cafe.rating > 0) ratings.push(cafe.rating);
      if (Array.isArray(cafe.ratings)) {
        cafe.ratings.forEach((r: any) => {
          if (typeof r === 'number' && r > 0) ratings.push(r);
        });
      }

      const existing = cafeMap.get(key);
      if (existing) {
        if (userId) existing.users.add(userId);
        if (Array.isArray(cafe.users)) {
          cafe.users.forEach((u: string) => existing.users.add(u));
        }
        ratings.forEach((r) => existing.ratings.push(r));
      } else {
        const usersSet = new Set<string>();
        if (userId) usersSet.add(userId);
        if (Array.isArray(cafe.users)) {
          cafe.users.forEach((u: string) => usersSet.add(u));
        }
        cafeMap.set(key, {
          id: cafe.id || `reg-cafe-${cleanName.toLowerCase().replace(/[^a-z0-9]/g, '-')}`,
          name: cleanName,
          city: cleanCity || 'Specialty Coffee',
          country: cafe.country || '',
          address: cafe.address || '',
          vibes: Array.isArray(cafe.vibes) ? cafe.vibes : [],
          favoriteDrink: cafe.favoriteDrink || '',
          notes: cafe.notes || '',
          ratings: [...ratings],
          users: usersSet,
        });
      }
    };

    INITIAL_CAFES.forEach((c) => processCafeItem(c, 'seed-system'));
    users.forEach((u) => {
      const userCafes = u.data?.cafes;
      if (Array.isArray(userCafes)) {
        userCafes.forEach((c) => processCafeItem(c, u.id));
      }
    });
    if (Array.isArray(communityData.cafes)) {
      communityData.cafes.forEach((c) => processCafeItem(c, 'community-user'));
    }

    return Array.from(cafeMap.values()).map((item) => {
      const count = item.ratings.length;
      const sum = item.ratings.reduce((acc: number, r: number) => acc + r, 0);
      const generalRating = count > 0 ? Number((sum / count).toFixed(1)) : 4.5;
      const userCount = Math.max(1, item.users.size);

      return {
        id: item.id,
        name: item.name,
        city: item.city,
        country: item.country,
        address: item.address,
        vibes: item.vibes,
        favoriteDrink: item.favoriteDrink,
        notes: item.notes,
        generalRating,
        ratingsCount: count,
        userCount,
        isRecommended: generalRating >= 4.5,
      };
    }).sort((a, b) => b.generalRating - a.generalRating);
  }

  // Attempt name unification against registered items if confident match found
  public static unifyItem(
    query: string,
    type: 'coffee' | 'equipment' | 'cafe',
    roasterOrBrand?: string
  ): {
    isConfidentMatch: boolean;
    confidence: number;
    matchedItem: any | null;
    suggestedName: string;
    suggestedSecondary?: string;
  } {
    const cleanQuery = query.trim();
    if (!cleanQuery) {
      return {
        isConfidentMatch: false,
        confidence: 0,
        matchedItem: null,
        suggestedName: query,
      };
    }

    let candidates: any[] = [];
    if (type === 'coffee') candidates = this.getRegisteredCoffees();
    else if (type === 'equipment') candidates = this.getRegisteredEquipment();
    else candidates = this.getRegisteredCafes();

    let bestMatch: any = null;
    let highestScore = 0;

    candidates.forEach((cand) => {
      // Check full combined text (e.g. "Onyx Tropical Weather" or "Fellow Stagg EKG")
      let candCombined = cand.name;
      if (cand.roaster) candCombined = `${cand.roaster} ${cand.name}`;
      if (cand.brand) candCombined = `${cand.brand} ${cand.name}`;

      const score1 = calculateSimilarity(cleanQuery, cand.name);
      const score2 = calculateSimilarity(cleanQuery, candCombined);
      let score = Math.max(score1, score2);

      // Boost if roaster/brand matches provided hint
      if (roasterOrBrand && cand.roaster) {
        const roasterScore = calculateSimilarity(roasterOrBrand, cand.roaster);
        if (roasterScore >= 0.7) score = Math.min(1.0, score + 0.15);
      }
      if (roasterOrBrand && cand.brand) {
        const brandScore = calculateSimilarity(roasterOrBrand, cand.brand);
        if (brandScore >= 0.7) score = Math.min(1.0, score + 0.15);
      }

      if (score > highestScore) {
        highestScore = score;
        bestMatch = cand;
      }
    });

    // High confidence threshold for auto-unification
    const isConfidentMatch = highestScore >= 0.70 && bestMatch !== null;

    return {
      isConfidentMatch,
      confidence: Math.round(highestScore * 100) / 100,
      matchedItem: isConfidentMatch ? bestMatch : null,
      suggestedName: isConfidentMatch ? bestMatch.name : query,
      suggestedSecondary: isConfidentMatch ? (bestMatch.roaster || bestMatch.brand || bestMatch.city) : undefined,
    };
  }
}
