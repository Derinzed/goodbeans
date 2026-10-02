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
const SESSIONS_FILE = path.join(DATA_DIR, 'sessions.json');
const GUESTS_FILE = path.join(DATA_DIR, 'guests.json');
const COMMUNITY_ITEMS_FILE = path.join(DATA_DIR, 'community_items.json');

// Stable persistent secret for signing session tokens across server reboots
const SERVER_SECRET = process.env.SESSION_SECRET || 'goodbeans-secret-key-salt-2026-coffee-shelves';

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

export interface StoredCommunityItem {
  id: string;
  name: string;
  secondary: string; // roaster, brand, or city
  type: 'coffee' | 'equipment' | 'cafe';
  // Ratings given by each user or session: userId -> rating (0.5 to 5.0)
  userRatings: Record<string, number>;
  // Baseline initial seed rating for specialty roaster catalog
  baseRating?: number;
  baseRatingsCount?: number;
  generalRating: number;
  ratingsCount: number;
  userCount: number;
  itemData: any;
  createdAt: string;
  updatedAt: string;
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

function hashPassword(password: string, salt: string): string {
  return crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
}

// Token signing: gb_<userId>_<timestamp>_<hmac>
function signToken(userId: string, timestamp: number): string {
  const payload = `${userId}.${timestamp}`;
  const hmac = crypto.createHmac('sha256', SERVER_SECRET).update(payload).digest('hex').slice(0, 32);
  return `gb_${userId}_${timestamp}_${hmac}`;
}

function verifyTokenFormat(token: string): { userId: string; timestamp: number } | null {
  if (!token || !token.startsWith('gb_')) return null;
  const parts = token.slice(3).split('_');
  if (parts.length < 3) return null;

  const hmac = parts[parts.length - 1];
  const timestampStr = parts[parts.length - 2];
  const userId = parts.slice(0, parts.length - 2).join('_');
  const timestamp = parseInt(timestampStr, 10);

  if (!userId || isNaN(timestamp)) return null;

  // Check 60 days expiration
  const maxAgeMs = 60 * 24 * 60 * 60 * 1000;
  if (Date.now() - timestamp > maxAgeMs) return null;

  const expectedHmac = crypto
    .createHmac('sha256', SERVER_SECRET)
    .update(`${userId}.${timestamp}`)
    .digest('hex')
    .slice(0, 32);

  if (crypto.timingSafeEqual(Buffer.from(hmac), Buffer.from(expectedHmac))) {
    return { userId, timestamp };
  }
  return null;
}

export class AuthStore {
  public static ensureStorage() {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }

    // 1. Seed USERS_FILE
    if (!fs.existsSync(USERS_FILE)) {
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

    // 2. Seed SESSIONS_FILE
    if (!fs.existsSync(SESSIONS_FILE)) {
      fs.writeFileSync(SESSIONS_FILE, JSON.stringify([], null, 2), 'utf-8');
    }

    // 3. Seed GUESTS_FILE
    if (!fs.existsSync(GUESTS_FILE)) {
      fs.writeFileSync(GUESTS_FILE, JSON.stringify({}, null, 2), 'utf-8');
    }

    // 4. Seed COMMUNITY_ITEMS_FILE
    if (!fs.existsSync(COMMUNITY_ITEMS_FILE)) {
      // Seed with initial coffees, equipment, and cafes
      const initialCatalog: {
        coffees: StoredCommunityItem[];
        equipment: StoredCommunityItem[];
        cafes: StoredCommunityItem[];
      } = {
        coffees: [],
        equipment: [],
        cafes: [],
      };

      INITIAL_COFFEES.forEach((c) => {
        const cleanName = (c.name || '').trim();
        const cleanRoaster = (c.roaster || '').trim();
        const baseRating = typeof c.communityRating === 'number' && c.communityRating > 0 ? c.communityRating : 4.7;
        const baseCount = typeof c.communityRatingsCount === 'number' && c.communityRatingsCount > 0 ? c.communityRatingsCount : 24;

        initialCatalog.coffees.push({
          id: c.id,
          name: cleanName,
          secondary: cleanRoaster,
          type: 'coffee',
          userRatings: {},
          baseRating,
          baseRatingsCount: baseCount,
          generalRating: baseRating,
          ratingsCount: baseCount,
          userCount: baseCount,
          itemData: c,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
      });

      INITIAL_EQUIPMENT.forEach((eq) => {
        const cleanName = (eq.name || '').trim();
        const cleanBrand = (eq.brand || '').trim();
        const baseRating = typeof eq.rating === 'number' && eq.rating > 0 ? eq.rating : 4.8;
        const baseCount = 18;

        initialCatalog.equipment.push({
          id: eq.id,
          name: cleanName,
          secondary: cleanBrand,
          type: 'equipment',
          userRatings: {},
          baseRating,
          baseRatingsCount: baseCount,
          generalRating: baseRating,
          ratingsCount: baseCount,
          userCount: baseCount,
          itemData: eq,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
      });

      INITIAL_CAFES.forEach((cafe) => {
        const cleanName = (cafe.name || '').trim();
        const cleanCity = (cafe.city || '').trim();
        const baseRating = typeof cafe.rating === 'number' && cafe.rating > 0 ? cafe.rating : 4.8;
        const baseCount = 35;

        initialCatalog.cafes.push({
          id: cafe.id,
          name: cleanName,
          secondary: cleanCity,
          type: 'cafe',
          userRatings: {},
          baseRating,
          baseRatingsCount: baseCount,
          generalRating: baseRating,
          ratingsCount: baseCount,
          userCount: baseCount,
          itemData: cafe,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
      });

      fs.writeFileSync(COMMUNITY_ITEMS_FILE, JSON.stringify(initialCatalog, null, 2), 'utf-8');
    }
  }

  // Safe file reader helper
  private static readJsonFile<T>(filePath: string, fallback: T): T {
    this.ensureStorage();
    try {
      if (!fs.existsSync(filePath)) return fallback;
      const content = fs.readFileSync(filePath, 'utf-8');
      return content ? JSON.parse(content) : fallback;
    } catch (err) {
      console.error(`Error reading ${filePath}:`, err);
      return fallback;
    }
  }

  // Safe atomic file writer
  private static writeJsonFile(filePath: string, data: any): void {
    this.ensureStorage();
    const tempFile = `${filePath}.${Date.now()}.${Math.random().toString(36).slice(2)}.tmp`;
    try {
      fs.writeFileSync(tempFile, JSON.stringify(data, null, 2), 'utf-8');
      fs.renameSync(tempFile, filePath);
    } catch (err) {
      console.error(`Error writing ${filePath}:`, err);
      try {
        if (fs.existsSync(tempFile)) fs.unlinkSync(tempFile);
      } catch {}
      fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
    }
  }

  public static getUsers(): StoredUser[] {
    return this.readJsonFile<StoredUser[]>(USERS_FILE, []);
  }

  private static saveUsers(users: StoredUser[]): void {
    this.writeJsonFile(USERS_FILE, users);
  }

  public static getSessions(): SessionToken[] {
    return this.readJsonFile<SessionToken[]>(SESSIONS_FILE, []);
  }

  private static saveSessions(sessions: SessionToken[]): void {
    this.writeJsonFile(SESSIONS_FILE, sessions);
  }

  public static getGuests(): Record<string, { data: UserDataPayload; updatedAt: string }> {
    return this.readJsonFile<Record<string, { data: UserDataPayload; updatedAt: string }>>(GUESTS_FILE, {});
  }

  public static getGuestData(guestId: string): UserDataPayload | null {
    if (!guestId) return null;
    const guests = this.getGuests();
    return guests[guestId]?.data || null;
  }

  public static saveGuestData(guestId: string, data: UserDataPayload): void {
    if (!guestId) return;
    const guests = this.getGuests();
    guests[guestId] = {
      data,
      updatedAt: new Date().toISOString(),
    };
    this.writeJsonFile(GUESTS_FILE, guests);
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
    const timestamp = Date.now();
    const token = signToken(userId, timestamp);

    const sessions = this.getSessions();
    sessions.push({
      token,
      userId,
      createdAt: timestamp,
    });
    // Keep last 1000 sessions
    if (sessions.length > 1000) sessions.splice(0, sessions.length - 1000);
    this.saveSessions(sessions);

    return token;
  }

  public static getUserByToken(token: string): StoredUser | null {
    if (!token) return null;

    // 1. First check persisted sessions list
    const sessions = this.getSessions();
    const sessionMatch = sessions.find((s) => s.token === token);
    if (sessionMatch) {
      return this.findById(sessionMatch.userId);
    }

    // 2. If session wasn't found in memory/file, verify cryptographic token format directly
    const verified = verifyTokenFormat(token);
    if (verified) {
      const user = this.findById(verified.userId);
      if (user) {
        // Re-persist session into sessions.json
        sessions.push({
          token,
          userId: verified.userId,
          createdAt: verified.timestamp,
        });
        this.saveSessions(sessions);
        return user;
      }
    }

    return null;
  }

  public static deleteSession(token: string): void {
    const sessions = this.getSessions().filter((s) => s.token !== token);
    this.saveSessions(sessions);
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

    const sessions = this.getSessions().filter((s) => s.userId !== userId);
    this.saveSessions(sessions);
    return true;
  }

  public static createUserByAdmin(
    username: string,
    password: string,
    role: 'admin' | 'user' = 'user',
    initialData?: UserDataPayload
  ): StoredUser {
    const users = this.getUsers();
    const cleanUsername = username.trim();

    if (users.some((u) => u.username.toLowerCase() === cleanUsername.toLowerCase())) {
      throw new Error(`Username "${cleanUsername}" is already taken.`);
    }

    const salt = crypto.randomBytes(16).toString('hex');
    const passwordHash = hashPassword(password, salt);

    const newUser: StoredUser = {
      id: `user-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`,
      username: cleanUsername,
      passwordHash,
      salt,
      role,
      createdAt: new Date().toISOString(),
      lastLoginAt: '',
      updatedAt: new Date().toISOString(),
      data: initialData || {},
    };

    users.push(newUser);
    this.saveUsers(users);
    return newUser;
  }

  public static updateUserRole(userId: string, newRole: 'admin' | 'user'): boolean {
    const users = this.getUsers();
    const index = users.findIndex((u) => u.id === userId);
    if (index === -1) return false;
    users[index].role = newRole;
    users[index].updatedAt = new Date().toISOString();
    this.saveUsers(users);
    return true;
  }

  public static resetUserPassword(userId: string, newPassword: string): boolean {
    const users = this.getUsers();
    const index = users.findIndex((u) => u.id === userId);
    if (index === -1) return false;
    const salt = crypto.randomBytes(16).toString('hex');
    users[index].salt = salt;
    users[index].passwordHash = hashPassword(newPassword, salt);
    users[index].updatedAt = new Date().toISOString();
    this.saveUsers(users);
    return true;
  }

  public static deleteGuest(guestId: string): boolean {
    const guests = this.getGuests();
    if (!guests[guestId]) return false;
    delete guests[guestId];
    this.writeJsonFile(GUESTS_FILE, guests);
    return true;
  }

  public static cleanStaleSessions(): { removedCount: number; remainingCount: number } {
    const sessions = this.getSessions();
    const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
    const active = sessions.filter((s) => s.createdAt > thirtyDaysAgo);
    const removedCount = sessions.length - active.length;
    this.saveSessions(active);
    return { removedCount, remainingCount: active.length };
  }

  public static getUserFullData(userId: string): { user: any; data: UserDataPayload } | null {
    const user = this.findById(userId);
    if (!user) return null;
    const { passwordHash, salt, ...safeUser } = user;
    return {
      user: safeUser,
      data: user.data || {},
    };
  }

  public static deleteUserItem(
    userId: string,
    category: 'coffees' | 'equipment' | 'cafes' | 'customNotes',
    itemId: string
  ): boolean {
    const users = this.getUsers();
    const index = users.findIndex((u) => u.id === userId);
    if (index === -1) return false;

    const userData = users[index].data || {};
    const list = (userData as any)[category];
    if (!Array.isArray(list)) return false;

    const initialLen = list.length;
    (userData as any)[category] = list.filter((item: any) => item.id !== itemId);
    if ((userData as any)[category].length === initialLen) return false;

    users[index].data = userData;
    users[index].updatedAt = new Date().toISOString();
    this.saveUsers(users);
    return true;
  }

  public static addItemToUser(
    userId: string,
    category: 'coffees' | 'equipment' | 'cafes',
    item: any
  ): any {
    const users = this.getUsers();
    const index = users.findIndex((u) => u.id === userId);
    if (index === -1) throw new Error('User not found');

    const userData = users[index].data || {};
    if (!Array.isArray((userData as any)[category])) {
      (userData as any)[category] = [];
    }

    const newItem = {
      ...item,
      id: item.id || `admin_gen_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      createdAt: item.createdAt || new Date().toISOString(),
    };

    (userData as any)[category].unshift(newItem);
    users[index].data = userData;
    users[index].updatedAt = new Date().toISOString();
    this.saveUsers(users);
    return newItem;
  }

  public static clearUserData(userId: string): boolean {
    const users = this.getUsers();
    const index = users.findIndex((u) => u.id === userId);
    if (index === -1) return false;

    users[index].data = {
      coffees: [],
      equipment: [],
      cafes: [],
      customNotes: [],
      customShelves: [],
    };
    users[index].updatedAt = new Date().toISOString();
    this.saveUsers(users);
    return true;
  }

  public static recalculateAllRatings(): {
    recalculatedCoffees: number;
    recalculatedEquipment: number;
    recalculatedCafes: number;
  } {
    const communityData = this.getCommunityItemsData();

    const tally = {
      recalculatedCoffees: (communityData.coffees || []).length,
      recalculatedEquipment: (communityData.equipment || []).length,
      recalculatedCafes: (communityData.cafes || []).length,
    };

    const processItems = (items: StoredCommunityItem[]) => {
      for (const item of items) {
        const ratingsMap = item.userRatings || {};
        const agg = this.calculateAggregateRating(
          ratingsMap,
          item.baseRating,
          item.baseRatingsCount
        );
        item.generalRating = agg.generalRating;
        item.ratingsCount = agg.ratingsCount;
        item.userCount = agg.userCount;
        item.updatedAt = new Date().toISOString();
      }
    };

    processItems(communityData.coffees || []);
    processItems(communityData.equipment || []);
    processItems(communityData.cafes || []);

    this.saveCommunityItemsData(communityData);
    return tally;
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

  // --- COMMUNITY CATALOG & GENERAL RATING AGGREGATION SYSTEM ---

  public static getCommunityItemsData(): {
    coffees: StoredCommunityItem[];
    equipment: StoredCommunityItem[];
    cafes: StoredCommunityItem[];
  } {
    this.ensureStorage();
    return this.readJsonFile<{
      coffees: StoredCommunityItem[];
      equipment: StoredCommunityItem[];
      cafes: StoredCommunityItem[];
    }>(COMMUNITY_ITEMS_FILE, { coffees: [], equipment: [], cafes: [] });
  }

  public static saveCommunityItemsData(data: {
    coffees: StoredCommunityItem[];
    equipment: StoredCommunityItem[];
    cafes: StoredCommunityItem[];
  }): void {
    this.writeJsonFile(COMMUNITY_ITEMS_FILE, data);
  }

  // Calculate mathematically exact aggregate general rating across all user ratings
  private static calculateAggregateRating(
    userRatings: Record<string, number>,
    baseRating?: number,
    baseRatingsCount?: number
  ): { generalRating: number; ratingsCount: number; userCount: number } {
    const ratingsList = Object.values(userRatings || {}).filter(
      (r): r is number => typeof r === 'number' && r > 0
    );

    const userSum = ratingsList.reduce((acc, r) => acc + r, 0);
    const userCount = ratingsList.length;

    const baseCount = typeof baseRatingsCount === 'number' ? baseRatingsCount : 0;
    const baseSum = typeof baseRating === 'number' ? baseRating * baseCount : 0;

    const totalSum = userSum + baseSum;
    const totalCount = userCount + baseCount;

    const generalRating = totalCount > 0 ? Number((totalSum / totalCount).toFixed(1)) : 4.5;

    return {
      generalRating,
      ratingsCount: totalCount,
      userCount,
    };
  }

  // Record an item or user rating in the community catalog
  public static recordCommunityItem(
    type: 'coffee' | 'equipment' | 'cafe',
    item: any,
    userId: string = 'community-user',
    rating?: number
  ): StoredCommunityItem | null {
    const data = this.getCommunityItemsData();
    if (!data.coffees) data.coffees = [];
    if (!data.equipment) data.equipment = [];
    if (!data.cafes) data.cafes = [];

    const list = type === 'coffee' ? data.coffees : type === 'equipment' ? data.equipment : data.cafes;
    const cleanName = (item.name || '').trim();
    if (!cleanName) return null;

    const secondary = (item.roaster || item.brand || item.city || '').trim();
    const key = `${cleanName.toLowerCase()}::${secondary.toLowerCase()}`;

    const existingIndex = list.findIndex((x) => {
      const xSec = (x.secondary || '').trim().toLowerCase();
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
      if (!existing.userRatings || typeof existing.userRatings !== 'object') {
        existing.userRatings = {};
      }

      // Record this user's latest rating
      if (parsedRating !== undefined && userId) {
        existing.userRatings[userId] = parsedRating;
      }

      const agg = this.calculateAggregateRating(
        existing.userRatings,
        existing.baseRating,
        existing.baseRatingsCount
      );

      existing.generalRating = agg.generalRating;
      existing.ratingsCount = agg.ratingsCount;
      existing.userCount = agg.userCount;
      existing.updatedAt = new Date().toISOString();
      existing.itemData = { ...existing.itemData, ...item };

      list[existingIndex] = existing;
      this.saveCommunityItemsData(data);
      return existing;
    } else {
      const userRatings: Record<string, number> = {};
      if (parsedRating !== undefined && userId) {
        userRatings[userId] = parsedRating;
      }

      const agg = this.calculateAggregateRating(userRatings, item.communityRating, item.communityRatingsCount);

      const newItem: StoredCommunityItem = {
        id: item.id || `community-${type}-${Date.now()}`,
        name: cleanName,
        secondary,
        type,
        userRatings,
        baseRating: item.communityRating || (parsedRating ? parsedRating : 4.5),
        baseRatingsCount: item.communityRatingsCount || (parsedRating ? 1 : 0),
        generalRating: agg.generalRating,
        ratingsCount: agg.ratingsCount,
        userCount: agg.userCount,
        itemData: item,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      list.push(newItem);
      this.saveCommunityItemsData(data);
      return newItem;
    }
  }

  public static deleteCommunityItem(itemId: string): boolean {
    const data = this.getCommunityItemsData();
    let found = false;

    if (Array.isArray(data.coffees)) {
      const idx = data.coffees.findIndex((c) => c.id === itemId);
      if (idx !== -1) {
        data.coffees.splice(idx, 1);
        found = true;
      }
    }
    if (!found && Array.isArray(data.equipment)) {
      const idx = data.equipment.findIndex((e) => e.id === itemId);
      if (idx !== -1) {
        data.equipment.splice(idx, 1);
        found = true;
      }
    }
    if (!found && Array.isArray(data.cafes)) {
      const idx = data.cafes.findIndex((c) => c.id === itemId);
      if (idx !== -1) {
        data.cafes.splice(idx, 1);
        found = true;
      }
    }

    if (found) {
      this.saveCommunityItemsData(data);
    }
    return found;
  }

  public static updateCommunityItem(
    itemId: string,
    updates: Partial<StoredCommunityItem>
  ): StoredCommunityItem | null {
    const data = this.getCommunityItemsData();
    const lists = [data.coffees, data.equipment, data.cafes];

    for (const list of lists) {
      if (!Array.isArray(list)) continue;
      const idx = list.findIndex((x) => x.id === itemId);
      if (idx !== -1) {
        const item = list[idx];
        const updatedItem = {
          ...item,
          ...updates,
          itemData: { ...item.itemData, ...(updates.itemData || {}) },
          updatedAt: new Date().toISOString(),
        };

        if (updates.name) updatedItem.name = updates.name.trim();
        if (updates.secondary) updatedItem.secondary = updates.secondary.trim();

        const agg = this.calculateAggregateRating(
          updatedItem.userRatings || {},
          updatedItem.baseRating,
          updatedItem.baseRatingsCount
        );
        updatedItem.generalRating = agg.generalRating;
        updatedItem.ratingsCount = agg.ratingsCount;
        updatedItem.userCount = agg.userCount;

        list[idx] = updatedItem;
        this.saveCommunityItemsData(data);
        return updatedItem;
      }
    }
    return null;
  }

  public static deleteCommunityItemRating(itemId: string, raterKey: string): boolean {
    const data = this.getCommunityItemsData();
    const lists = [data.coffees, data.equipment, data.cafes];

    for (const list of lists) {
      if (!Array.isArray(list)) continue;
      const idx = list.findIndex((x) => x.id === itemId);
      if (idx !== -1) {
        const item = list[idx];
        if (item.userRatings && item.userRatings[raterKey] !== undefined) {
          delete item.userRatings[raterKey];
          const agg = this.calculateAggregateRating(
            item.userRatings,
            item.baseRating,
            item.baseRatingsCount
          );
          item.generalRating = agg.generalRating;
          item.ratingsCount = agg.ratingsCount;
          item.userCount = agg.userCount;
          item.updatedAt = new Date().toISOString();
          list[idx] = item;
          this.saveCommunityItemsData(data);
          return true;
        }
      }
    }
    return false;
  }

  public static resetCommunityItemRatings(itemId: string): boolean {
    const data = this.getCommunityItemsData();
    const lists = [data.coffees, data.equipment, data.cafes];

    for (const list of lists) {
      if (!Array.isArray(list)) continue;
      const idx = list.findIndex((x) => x.id === itemId);
      if (idx !== -1) {
        const item = list[idx];
        item.userRatings = {};
        const agg = this.calculateAggregateRating({}, item.baseRating, item.baseRatingsCount);
        item.generalRating = agg.generalRating;
        item.ratingsCount = agg.ratingsCount;
        item.userCount = agg.userCount;
        item.updatedAt = new Date().toISOString();
        list[idx] = item;
        this.saveCommunityItemsData(data);
        return true;
      }
    }
    return false;
  }

  public static getDetailedRatingsBreakdown(): any {
    const communityData = this.getCommunityItemsData();
    const users = this.getUsers();
    const userMap = new Map(users.map((u) => [u.id, u.username]));

    const formatList = (items: StoredCommunityItem[]) =>
      (items || []).map((item) => {
        const ratingEntries = Object.entries(item.userRatings || {}).map(([userId, rating]) => ({
          userId,
          username:
            userMap.get(userId) ||
            (userId.startsWith('guest-') ? `Guest (${userId.slice(6, 14)})` : userId),
          rating,
        }));

        return {
          id: item.id,
          name: item.name,
          secondary: item.secondary,
          type: item.type,
          generalRating: item.generalRating,
          ratingsCount: item.ratingsCount,
          userCount: item.userCount,
          baseRating: item.baseRating,
          baseRatingsCount: item.baseRatingsCount,
          userRatings: ratingEntries,
          itemData: item.itemData || {},
          createdAt: item.createdAt,
          updatedAt: item.updatedAt,
        };
      });

    return {
      coffees: formatList(communityData.coffees),
      equipment: formatList(communityData.equipment),
      cafes: formatList(communityData.cafes),
    };
  }

  // Running catalog of all registered coffees across all users, community ratings, and defaults
  public static getRegisteredCoffees(): any[] {
    const users = this.getUsers();
    const communityData = this.getCommunityItemsData();
    const coffeeMap = new Map<string, any>();

    // 1. Load community items as foundation
    (communityData.coffees || []).forEach((c) => {
      const cleanName = (c.name || '').trim();
      const cleanRoaster = (c.secondary || c.itemData?.roaster || '').trim();
      const key = `${cleanName.toLowerCase()}::${cleanRoaster.toLowerCase()}`;

      const userRatings: Record<string, number> = { ...(c.userRatings || {}) };

      coffeeMap.set(key, {
        id: c.id,
        name: cleanName,
        roaster: cleanRoaster,
        userRatings,
        baseRating: c.baseRating || 4.7,
        baseRatingsCount: c.baseRatingsCount || 24,
        origin: c.itemData?.origin || { country: 'Single Origin' },
        variety: c.itemData?.variety || 'Arabica',
        process: c.itemData?.process || 'Washed',
        roastLevel: c.itemData?.roastLevel || 'Medium',
        coverColor: c.itemData?.coverColor || '#C87D32',
        description: c.itemData?.description || '',
        tastingNotesSummary: Array.isArray(c.itemData?.tastingNotesSummary)
          ? c.itemData.tastingNotesSummary
          : [],
      });
    });

    // 2. Scan all registered users and aggregate user ratings
    users.forEach((u) => {
      const userCoffees = u.data?.coffees;
      if (Array.isArray(userCoffees)) {
        userCoffees.forEach((uc) => {
          if (!uc || !uc.name) return;
          const cleanName = (uc.name || '').trim();
          const cleanRoaster = (uc.roaster || '').trim();
          const key = `${cleanName.toLowerCase()}::${cleanRoaster.toLowerCase()}`;

          // Personal rating or tasting logs average
          let userRating = typeof uc.userRating === 'number' && uc.userRating > 0 ? uc.userRating : 0;
          if (!userRating && Array.isArray(uc.tastingLogs) && uc.tastingLogs.length > 0) {
            const validLogs = uc.tastingLogs.filter((l: any) => typeof l?.rating === 'number' && l.rating > 0);
            if (validLogs.length > 0) {
              userRating = validLogs.reduce((acc: number, l: any) => acc + l.rating, 0) / validLogs.length;
            }
          }

          let existing = coffeeMap.get(key);
          if (!existing) {
            existing = {
              id: uc.id || `reg-coffee-${cleanName.toLowerCase().replace(/[^a-z0-9]/g, '-')}`,
              name: cleanName,
              roaster: cleanRoaster || 'Artisan Roaster',
              userRatings: {},
              baseRating: typeof uc.communityRating === 'number' && uc.communityRating > 0 ? uc.communityRating : 4.5,
              baseRatingsCount: typeof uc.communityRatingsCount === 'number' ? uc.communityRatingsCount : 0,
              origin: uc.origin || { country: 'Single Origin' },
              variety: uc.variety || 'Arabica',
              process: uc.process || 'Washed',
              roastLevel: uc.roastLevel || 'Medium',
              coverColor: uc.coverColor || '#C87D32',
              description: uc.description || '',
              tastingNotesSummary: Array.isArray(uc.tastingNotesSummary) ? uc.tastingNotesSummary : [],
            };
            coffeeMap.set(key, existing);
          }

          if (userRating > 0) {
            existing.userRatings[u.id] = userRating;
          }
        });
      }
    });

    // Compute aggregate for each item
    return Array.from(coffeeMap.values()).map((item) => {
      const agg = this.calculateAggregateRating(item.userRatings, item.baseRating, item.baseRatingsCount);

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
        generalRating: agg.generalRating,
        communityRating: agg.generalRating,
        ratingsCount: agg.ratingsCount,
        communityRatingsCount: agg.ratingsCount,
        userCount: agg.userCount,
        isRecommended: agg.generalRating >= 4.5,
      };
    }).sort((a, b) => b.generalRating - a.generalRating);
  }

  // Running catalog of all registered equipment across all users and defaults
  public static getRegisteredEquipment(): any[] {
    const users = this.getUsers();
    const communityData = this.getCommunityItemsData();
    const eqMap = new Map<string, any>();

    (communityData.equipment || []).forEach((eq) => {
      const cleanName = (eq.name || '').trim();
      const cleanBrand = (eq.secondary || eq.itemData?.brand || '').trim();
      const key = `${cleanName.toLowerCase()}::${cleanBrand.toLowerCase()}`;

      eqMap.set(key, {
        id: eq.id,
        name: cleanName,
        brand: cleanBrand,
        category: eq.itemData?.category || 'Accessory',
        userRatings: { ...(eq.userRatings || {}) },
        baseRating: eq.baseRating || 4.8,
        baseRatingsCount: eq.baseRatingsCount || 18,
        settingsNotes: eq.itemData?.settingsNotes || '',
        maintenanceNotes: eq.itemData?.maintenanceNotes || '',
        generalNotes: eq.itemData?.generalNotes || '',
      });
    });

    users.forEach((u) => {
      const userGear = u.data?.equipment;
      if (Array.isArray(userGear)) {
        userGear.forEach((ueq) => {
          if (!ueq || !ueq.name) return;
          const cleanName = (ueq.name || '').trim();
          const cleanBrand = (ueq.brand || '').trim();
          const key = `${cleanName.toLowerCase()}::${cleanBrand.toLowerCase()}`;

          let existing = eqMap.get(key);
          if (!existing) {
            existing = {
              id: ueq.id || `reg-eq-${cleanName.toLowerCase().replace(/[^a-z0-9]/g, '-')}`,
              name: cleanName,
              brand: cleanBrand || 'Coffee Gear',
              category: ueq.category || 'Accessory',
              userRatings: {},
              baseRating: 4.8,
              baseRatingsCount: 0,
              settingsNotes: ueq.settingsNotes || '',
              maintenanceNotes: ueq.maintenanceNotes || '',
              generalNotes: ueq.generalNotes || '',
            };
            eqMap.set(key, existing);
          }

          if (typeof ueq.rating === 'number' && ueq.rating > 0) {
            existing.userRatings[u.id] = ueq.rating;
          }
        });
      }
    });

    return Array.from(eqMap.values()).map((item) => {
      const agg = this.calculateAggregateRating(item.userRatings, item.baseRating, item.baseRatingsCount);

      return {
        id: item.id,
        name: item.name,
        brand: item.brand,
        category: item.category,
        settingsNotes: item.settingsNotes,
        maintenanceNotes: item.maintenanceNotes,
        generalNotes: item.generalNotes,
        generalRating: agg.generalRating,
        ratingsCount: agg.ratingsCount,
        userCount: agg.userCount,
        isRecommended: agg.generalRating >= 4.5,
      };
    }).sort((a, b) => b.generalRating - a.generalRating);
  }

  // Running catalog of all registered cafes across all users and defaults
  public static getRegisteredCafes(): any[] {
    const users = this.getUsers();
    const communityData = this.getCommunityItemsData();
    const cafeMap = new Map<string, any>();

    (communityData.cafes || []).forEach((c) => {
      const cleanName = (c.name || '').trim();
      const cleanCity = (c.secondary || c.itemData?.city || '').trim();
      const key = `${cleanName.toLowerCase()}::${cleanCity.toLowerCase()}`;

      cafeMap.set(key, {
        id: c.id,
        name: cleanName,
        city: cleanCity,
        country: c.itemData?.country || '',
        address: c.itemData?.address || '',
        vibes: Array.isArray(c.itemData?.vibes) ? c.itemData.vibes : [],
        favoriteDrink: c.itemData?.favoriteDrink || '',
        notes: c.itemData?.notes || '',
        userRatings: { ...(c.userRatings || {}) },
        baseRating: c.baseRating || 4.8,
        baseRatingsCount: c.baseRatingsCount || 25,
      });
    });

    users.forEach((u) => {
      const userCafes = u.data?.cafes;
      if (Array.isArray(userCafes)) {
        userCafes.forEach((uc) => {
          if (!uc || !uc.name) return;
          const cleanName = (uc.name || '').trim();
          const cleanCity = (uc.city || '').trim();
          const key = `${cleanName.toLowerCase()}::${cleanCity.toLowerCase()}`;

          let existing = cafeMap.get(key);
          if (!existing) {
            existing = {
              id: uc.id || `reg-cafe-${cleanName.toLowerCase().replace(/[^a-z0-9]/g, '-')}`,
              name: cleanName,
              city: cleanCity || 'Specialty Coffee',
              country: uc.country || '',
              address: uc.address || '',
              vibes: Array.isArray(uc.vibes) ? uc.vibes : [],
              favoriteDrink: uc.favoriteDrink || '',
              notes: uc.notes || '',
              userRatings: {},
              baseRating: 4.8,
              baseRatingsCount: 0,
            };
            cafeMap.set(key, existing);
          }

          if (typeof uc.rating === 'number' && uc.rating > 0) {
            existing.userRatings[u.id] = uc.rating;
          }
        });
      }
    });

    return Array.from(cafeMap.values()).map((item) => {
      const agg = this.calculateAggregateRating(item.userRatings, item.baseRating, item.baseRatingsCount);

      return {
        id: item.id,
        name: item.name,
        city: item.city,
        country: item.country,
        address: item.address,
        vibes: item.vibes,
        favoriteDrink: item.favoriteDrink,
        notes: item.notes,
        generalRating: agg.generalRating,
        ratingsCount: agg.ratingsCount,
        userCount: agg.userCount,
        isRecommended: agg.generalRating >= 4.5,
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
      let candCombined = cand.name;
      if (cand.roaster) candCombined = `${cand.roaster} ${cand.name}`;
      if (cand.brand) candCombined = `${cand.brand} ${cand.name}`;

      const score1 = calculateSimilarity(cleanQuery, cand.name);
      const score2 = calculateSimilarity(cleanQuery, candCombined);
      let score = Math.max(score1, score2);

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

    const isConfidentMatch = highestScore >= 0.70 && bestMatch !== null;

    return {
      isConfidentMatch,
      confidence: Math.round(highestScore * 100) / 100,
      matchedItem: isConfidentMatch ? bestMatch : null,
      suggestedName: isConfidentMatch ? bestMatch.name : query,
      suggestedSecondary: isConfidentMatch ? (bestMatch.roaster || bestMatch.brand || bestMatch.city) : undefined,
    };
  }

  // Complete raw database dump for Administrator inspection & backups
  public static getRawDatabaseDump(): any {
    const users = this.getUsers().map((u) => {
      // Exclude password hashes from export for security
      const { passwordHash, salt, ...safeUser } = u;
      return safeUser;
    });

    const communityData = this.getCommunityItemsData();
    const sessions = this.getSessions().map((s) => ({
      userId: s.userId,
      createdAt: new Date(s.createdAt).toISOString(),
    }));
    const guests = this.getGuests();

    return {
      serverTime: new Date().toISOString(),
      storageDirectory: DATA_DIR,
      tables: {
        users: {
          file: 'users.json',
          count: users.length,
          records: users,
        },
        communityItems: {
          file: 'community_items.json',
          counts: {
            coffees: (communityData.coffees || []).length,
            equipment: (communityData.equipment || []).length,
            cafes: (communityData.cafes || []).length,
          },
          records: communityData,
        },
        sessions: {
          file: 'sessions.json',
          count: sessions.length,
          records: sessions,
        },
        guests: {
          file: 'guests.json',
          count: Object.keys(guests).length,
          records: guests,
        },
      },
    };
  }
}
