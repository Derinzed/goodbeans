import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import { INITIAL_COFFEES, INITIAL_EQUIPMENT, INITIAL_CAFES } from '../data/initialData.ts';
import {
  sanitizeUserData,
  stripGeneralCoffeeFields,
  stripGeneralEquipmentFields,
  stripGeneralCafeFields,
} from '../utils/communityLookup.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
// Root data directory
const DATA_DIR = path.resolve(__dirname, '../../data');
const USERS_FILE = path.join(DATA_DIR, 'users.json');
const BACKUP_USERS_FILE = path.resolve(__dirname, '../data/seedUsers.json');
const SESSIONS_FILE = path.join(DATA_DIR, 'sessions.json');
const GUESTS_FILE = path.join(DATA_DIR, 'guests.json');
const BACKUP_GUESTS_FILE = path.resolve(__dirname, '../data/seedGuests.json');
const COMMUNITY_ITEMS_FILE = path.join(DATA_DIR, 'community_items.json');
const BACKUP_COMMUNITY_ITEMS_FILE = path.resolve(__dirname, '../data/seedCommunityItems.json');

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

// Deeply merges two user data payloads so no custom coffees, gear, cafes, notes, or shelves are ever lost or duplicated
export function mergeUserDataPayload(
  existingData: UserDataPayload = {},
  incomingData: UserDataPayload = {}
): UserDataPayload {
  const merged: UserDataPayload = { ...(existingData || {}) };

  const mergeList = (existingList: any[] = [], incomingList: any[] = [], secondaryKey?: string) => {
    const result: any[] = [];

    const isMatch = (a: any, b: any): boolean => {
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

    (Array.isArray(existingList) ? existingList : []).forEach((item) => {
      if (!item) return;
      const idx = result.findIndex((r) => isMatch(r, item));
      if (idx === -1) {
        result.push({ ...item });
      } else {
        result[idx] = { ...result[idx], ...item };
      }
    });

    (Array.isArray(incomingList) ? incomingList : []).forEach((item) => {
      if (!item) return;
      const idx = result.findIndex((r) => isMatch(r, item));
      if (idx === -1) {
        result.push({ ...item });
      } else {
        result[idx] = {
          ...result[idx],
          ...item,
          tastingLogs:
            Array.isArray(result[idx].tastingLogs) || Array.isArray(item.tastingLogs)
              ? [...(result[idx].tastingLogs || []), ...(item.tastingLogs || [])].filter(
                  (val, i, arr) => arr.findIndex((x) => (x.id && x.id === val.id) || x === val) === i
                )
              : item.tastingLogs || result[idx].tastingLogs,
          recipes:
            Array.isArray(result[idx].recipes) || Array.isArray(item.recipes)
              ? [...(result[idx].recipes || []), ...(item.recipes || [])].filter(
                  (val, i, arr) => arr.findIndex((x) => (x.id && x.id === val.id) || x === val) === i
                )
              : item.recipes || result[idx].recipes,
        };
      }
    });

    return result;
  };

  merged.coffees = mergeList(existingData?.coffees, incomingData?.coffees, 'roaster');
  merged.equipment = mergeList(existingData?.equipment, incomingData?.equipment, 'brand');
  merged.cafes = mergeList(existingData?.cafes, incomingData?.cafes, 'city');
  merged.notes = mergeList(existingData?.notes, incomingData?.notes);
  merged.shelves = mergeList(existingData?.shelves, incomingData?.shelves);

  if (incomingData?.theme) merged.theme = incomingData.theme;
  if (incomingData?.primaryHue) merged.primaryHue = incomingData.primaryHue;
  if (incomingData?.secondaryHue) merged.secondaryHue = incomingData.secondaryHue;
  if (incomingData?.backgroundColor) merged.backgroundColor = incomingData.backgroundColor;

  return sanitizeUserData(merged);
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
  // Tasting notes evaluated by each user: userId -> string[]
  userTastingNotes?: Record<string, string[]>;
  generalRating: number;
  ratingsCount: number;
  userCount: number;
  // Aggregated top 5 tasting notes in proper casing
  generalTastingNotes?: string[];
  // Full tasting notes breakdown with counts
  tastingNotesBreakdown?: Array<{ note: string; count: number }>;
  itemData: any;
  createdAt: string;
  updatedAt: string;
}

export function toProperCasing(str: string): string {
  if (!str) return '';
  return str
    .trim()
    .toLowerCase()
    .split(/\s+/)
    .map((word) => {
      if (!word) return '';
      if (word.includes('-')) {
        return word
          .split('-')
          .map((w) => (w ? w.charAt(0).toUpperCase() + w.slice(1) : ''))
          .join('-');
      }
      return word.charAt(0).toUpperCase() + word.slice(1);
    })
    .join(' ');
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

    // 1. Seed & synchronize USERS_FILE with BACKUP_USERS_FILE across publishes/deployments
    let usersList: StoredUser[] = [];
    if (fs.existsSync(USERS_FILE)) {
      try {
        usersList = JSON.parse(fs.readFileSync(USERS_FILE, 'utf-8'));
      } catch {}
    }

    let backupList: StoredUser[] = [];
    if (fs.existsSync(BACKUP_USERS_FILE)) {
      try {
        backupList = JSON.parse(fs.readFileSync(BACKUP_USERS_FILE, 'utf-8'));
      } catch {}
    }

    // Merge users so neither file loses registered accounts or custom items
    const userMap = new Map<string, StoredUser>();
    (Array.isArray(backupList) ? backupList : []).forEach((u) => {
      if (u && u.id) userMap.set(u.id, { ...u, data: sanitizeUserData(u.data || {}) });
    });
    (Array.isArray(usersList) ? usersList : []).forEach((u) => {
      if (u && u.id) {
        const existing = userMap.get(u.id);
        if (!existing) {
          userMap.set(u.id, { ...u, data: sanitizeUserData(u.data || {}) });
        } else {
          const mergedData = mergeUserDataPayload(existing.data, u.data);
          const isUNewer = u.updatedAt && (!existing.updatedAt || u.updatedAt >= existing.updatedAt);
          userMap.set(u.id, {
            ...(isUNewer ? u : existing),
            data: mergedData,
          });
        }
      }
    });

    if (userMap.size === 0) {
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
      userMap.set(defaultAdmin.id, defaultAdmin);
    }

    const mergedUsers = Array.from(userMap.values());
    if (!fs.existsSync(USERS_FILE) || usersList.length !== mergedUsers.length) {
      fs.writeFileSync(USERS_FILE, JSON.stringify(mergedUsers, null, 2), 'utf-8');
    }
    if (!fs.existsSync(BACKUP_USERS_FILE) || backupList.length !== mergedUsers.length) {
      try {
        fs.writeFileSync(BACKUP_USERS_FILE, JSON.stringify(mergedUsers, null, 2), 'utf-8');
      } catch {}
    }

    // 2. Seed SESSIONS_FILE
    if (!fs.existsSync(SESSIONS_FILE)) {
      fs.writeFileSync(SESSIONS_FILE, JSON.stringify([], null, 2), 'utf-8');
    }

    // 3. Seed & synchronize GUESTS_FILE with BACKUP_GUESTS_FILE
    let guestsMap: Record<string, { data: UserDataPayload; updatedAt: string }> = {};
    if (fs.existsSync(GUESTS_FILE)) {
      try {
        guestsMap = JSON.parse(fs.readFileSync(GUESTS_FILE, 'utf-8')) || {};
      } catch {}
    }
    let backupGuestsMap: Record<string, { data: UserDataPayload; updatedAt: string }> = {};
    if (fs.existsSync(BACKUP_GUESTS_FILE)) {
      try {
        backupGuestsMap = JSON.parse(fs.readFileSync(BACKUP_GUESTS_FILE, 'utf-8')) || {};
      } catch {}
    }
    const mergedGuests = { ...backupGuestsMap, ...guestsMap };
    if (!fs.existsSync(GUESTS_FILE) || Object.keys(guestsMap).length !== Object.keys(mergedGuests).length) {
      fs.writeFileSync(GUESTS_FILE, JSON.stringify(mergedGuests, null, 2), 'utf-8');
    }
    if (!fs.existsSync(BACKUP_GUESTS_FILE) || Object.keys(backupGuestsMap).length !== Object.keys(mergedGuests).length) {
      try {
        fs.writeFileSync(BACKUP_GUESTS_FILE, JSON.stringify(mergedGuests, null, 2), 'utf-8');
      } catch {}
    }

    // 4. Seed & synchronize COMMUNITY_ITEMS_FILE with BACKUP_COMMUNITY_ITEMS_FILE across publishes/deployments
    let communityData: {
      coffees: StoredCommunityItem[];
      equipment: StoredCommunityItem[];
      cafes: StoredCommunityItem[];
    } = {
      coffees: [],
      equipment: [],
      cafes: [],
    };
    if (fs.existsSync(COMMUNITY_ITEMS_FILE)) {
      try {
        const parsed = JSON.parse(fs.readFileSync(COMMUNITY_ITEMS_FILE, 'utf-8'));
        if (parsed) {
          if (Array.isArray(parsed.coffees)) communityData.coffees = parsed.coffees;
          if (Array.isArray(parsed.equipment)) communityData.equipment = parsed.equipment;
          if (Array.isArray(parsed.cafes)) communityData.cafes = parsed.cafes;
        }
      } catch {}
    }

    let backupCommunityData: {
      coffees: StoredCommunityItem[];
      equipment: StoredCommunityItem[];
      cafes: StoredCommunityItem[];
    } = {
      coffees: [],
      equipment: [],
      cafes: [],
    };
    if (fs.existsSync(BACKUP_COMMUNITY_ITEMS_FILE)) {
      try {
        const parsed = JSON.parse(fs.readFileSync(BACKUP_COMMUNITY_ITEMS_FILE, 'utf-8'));
        if (parsed) {
          if (Array.isArray(parsed.coffees)) backupCommunityData.coffees = parsed.coffees;
          if (Array.isArray(parsed.equipment)) backupCommunityData.equipment = parsed.equipment;
          if (Array.isArray(parsed.cafes)) backupCommunityData.cafes = parsed.cafes;
        }
      } catch {}
    }

    // Item list merger preserving user ratings and latest updates
    const mergeItemLists = (primary: StoredCommunityItem[], backup: StoredCommunityItem[]) => {
      const itemMap = new Map<string, StoredCommunityItem>();

      const insertOrMerge = (item: StoredCommunityItem) => {
        if (!item || !item.name) return;
        const cleanName = (item.name || '').trim().toLowerCase();
        const cleanSec = (item.secondary || '').trim().toLowerCase();
        const key = `${cleanName}::${cleanSec}`;

        const existing = itemMap.get(key) || (item.id ? Array.from(itemMap.values()).find((x) => x.id === item.id) : undefined);
        if (!existing) {
          itemMap.set(key, { ...item });
        } else {
          const mergedRatings = { ...(existing.userRatings || {}), ...(item.userRatings || {}) };
          const mergedTastingNotes = { ...(existing.userTastingNotes || {}), ...(item.userTastingNotes || {}) };
          const isItemNewer = item.updatedAt && (!existing.updatedAt || item.updatedAt >= existing.updatedAt);

          itemMap.set(key, {
            ...(isItemNewer ? item : existing),
            userRatings: mergedRatings,
            userTastingNotes: item.type === 'coffee' ? mergedTastingNotes : undefined,
            itemData: { ...(existing.itemData || {}), ...(item.itemData || {}) },
          });
        }
      };

      (Array.isArray(backup) ? backup : []).forEach(insertOrMerge);
      (Array.isArray(primary) ? primary : []).forEach(insertOrMerge);
      return Array.from(itemMap.values());
    };

    const mergedCoffees = mergeItemLists(communityData.coffees, backupCommunityData.coffees);
    const mergedEquipment = mergeItemLists(communityData.equipment, backupCommunityData.equipment);
    const mergedCafes = mergeItemLists(communityData.cafes, backupCommunityData.cafes);

    // If initial items are missing from defaults, add them
    INITIAL_COFFEES.forEach((c) => {
      const cleanName = (c.name || '').trim().toLowerCase();
      const cleanRoaster = (c.roaster || '').trim().toLowerCase();
      const key = `${cleanName}::${cleanRoaster}`;
      if (!mergedCoffees.some((x) => `${(x.name || '').trim().toLowerCase()}::${(x.secondary || '').trim().toLowerCase()}` === key)) {
        mergedCoffees.push({
          id: c.id,
          name: (c.name || '').trim(),
          secondary: (c.roaster || '').trim(),
          type: 'coffee',
          userRatings: {},
          generalRating: 0,
          ratingsCount: 0,
          userCount: 0,
          generalTastingNotes: [],
          tastingNotesBreakdown: [],
          itemData: c,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
      }
    });

    INITIAL_EQUIPMENT.forEach((eq) => {
      const cleanName = (eq.name || '').trim().toLowerCase();
      const cleanBrand = (eq.brand || '').trim().toLowerCase();
      const key = `${cleanName}::${cleanBrand}`;
      if (!mergedEquipment.some((x) => `${(x.name || '').trim().toLowerCase()}::${(x.secondary || '').trim().toLowerCase()}` === key)) {
        mergedEquipment.push({
          id: eq.id,
          name: (eq.name || '').trim(),
          secondary: (eq.brand || '').trim(),
          type: 'equipment',
          userRatings: {},
          generalRating: 0,
          ratingsCount: 0,
          userCount: 0,
          itemData: eq,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
      }
    });

    INITIAL_CAFES.forEach((cafe) => {
      const cleanName = (cafe.name || '').trim().toLowerCase();
      const cleanCity = (cafe.city || '').trim().toLowerCase();
      const key = `${cleanName}::${cleanCity}`;
      if (!mergedCafes.some((x) => `${(x.name || '').trim().toLowerCase()}::${(x.secondary || '').trim().toLowerCase()}` === key)) {
        mergedCafes.push({
          id: cafe.id,
          name: (cafe.name || '').trim(),
          secondary: (cafe.city || '').trim(),
          type: 'cafe',
          userRatings: {},
          generalRating: 0,
          ratingsCount: 0,
          userCount: 0,
          itemData: cafe,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
      }
    });

    // 5. Sync user ratings for existing registered community catalog items across redeployments
    mergedUsers.forEach((u) => {
      if (Array.isArray(u.data?.coffees)) {
        u.data.coffees.forEach((c: any) => {
          if (!c || !c.name) return;
          const cleanName = (c.name || '').trim();
          const cleanRoaster = (c.roaster || '').trim();
          const key = `${cleanName.toLowerCase()}::${cleanRoaster.toLowerCase()}`;
          const existing = mergedCoffees.find(
            (x) => `${(x.name || '').trim().toLowerCase()}::${(x.secondary || '').trim().toLowerCase()}` === key || (c.id && x.id === c.id)
          );
          if (existing && typeof c.userRating === 'number' && c.userRating > 0) {
            existing.userRatings = existing.userRatings || {};
            existing.userRatings[u.id] = c.userRating;
          }
        });
      }

      if (Array.isArray(u.data?.equipment)) {
        u.data.equipment.forEach((eq: any) => {
          if (!eq || !eq.name) return;
          const cleanName = (eq.name || '').trim();
          const cleanBrand = (eq.brand || '').trim();
          const key = `${cleanName.toLowerCase()}::${cleanBrand.toLowerCase()}`;
          const existing = mergedEquipment.find(
            (x) => `${(x.name || '').trim().toLowerCase()}::${(x.secondary || '').trim().toLowerCase()}` === key || (eq.id && x.id === eq.id)
          );
          if (existing && typeof eq.rating === 'number' && eq.rating > 0) {
            existing.userRatings = existing.userRatings || {};
            existing.userRatings[u.id] = eq.rating;
          }
        });
      }

      if (Array.isArray(u.data?.cafes)) {
        u.data.cafes.forEach((cafe: any) => {
          if (!cafe || !cafe.name) return;
          const cleanName = (cafe.name || '').trim();
          const cleanCity = (cafe.city || '').trim();
          const key = `${cleanName.toLowerCase()}::${cleanCity.toLowerCase()}`;
          const existing = mergedCafes.find(
            (x) => `${(x.name || '').trim().toLowerCase()}::${(x.secondary || '').trim().toLowerCase()}` === key || (cafe.id && x.id === cafe.id)
          );
          if (existing && typeof cafe.rating === 'number' && cafe.rating > 0) {
            existing.userRatings = existing.userRatings || {};
            existing.userRatings[u.id] = cafe.rating;
          }
        });
      }
    });

    const finalCommunityData = {
      coffees: mergedCoffees,
      equipment: mergedEquipment,
      cafes: mergedCafes,
    };

    fs.writeFileSync(COMMUNITY_ITEMS_FILE, JSON.stringify(finalCommunityData, null, 2), 'utf-8');
    try {
      fs.writeFileSync(BACKUP_COMMUNITY_ITEMS_FILE, JSON.stringify(finalCommunityData, null, 2), 'utf-8');
    } catch {}

    // Auto-clean any legacy base ratings from community_items.json
    try {
      if (fs.existsSync(COMMUNITY_ITEMS_FILE)) {
        const raw = fs.readFileSync(COMMUNITY_ITEMS_FILE, 'utf-8');
        if (raw && (raw.includes('"baseRating"') || raw.includes('"baseRatingsCount"'))) {
          try {
            AuthStore.recalculateAllRatings();
          } catch {}
        }
      }
    } catch {}

    // Auto-clean any legacy general server information from users.json & guests.json
    try {
      if (fs.existsSync(USERS_FILE)) {
        const rawUsers = fs.readFileSync(USERS_FILE, 'utf-8');
        if (
          rawUsers &&
          (rawUsers.includes('"generalRating"') ||
            rawUsers.includes('"communityRating"') ||
            rawUsers.includes('"communityRatingsCount"') ||
            rawUsers.includes('"generalTastingNotes"') ||
            rawUsers.includes('"tastingNotesBreakdown"') ||
            rawUsers.includes('"isRegistered"'))
        ) {
          const parsed = JSON.parse(rawUsers);
          if (Array.isArray(parsed)) {
            const cleaned = parsed.map((u: any) => ({
              ...u,
              data: sanitizeUserData(u.data),
            }));
            fs.writeFileSync(USERS_FILE, JSON.stringify(cleaned, null, 2), 'utf-8');
          }
        }
      }
      if (fs.existsSync(GUESTS_FILE)) {
        const rawGuests = fs.readFileSync(GUESTS_FILE, 'utf-8');
        if (
          rawGuests &&
          (rawGuests.includes('"generalRating"') ||
            rawGuests.includes('"communityRating"') ||
            rawGuests.includes('"isRegistered"'))
        ) {
          const parsed = JSON.parse(rawGuests);
          if (parsed && typeof parsed === 'object') {
            const cleanedGuests: any = {};
            for (const [k, v] of Object.entries(parsed)) {
              cleanedGuests[k] = sanitizeUserData(v);
            }
            fs.writeFileSync(GUESTS_FILE, JSON.stringify(cleanedGuests, null, 2), 'utf-8');
          }
        }
      }
    } catch {}
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
    const cleanedUsers = users.map((u) => ({
      ...u,
      data: sanitizeUserData(u.data),
    }));
    this.writeJsonFile(USERS_FILE, cleanedUsers);
    try {
      this.writeJsonFile(BACKUP_USERS_FILE, cleanedUsers);
    } catch {}
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
      data: sanitizeUserData(data),
      updatedAt: new Date().toISOString(),
    };
    this.writeJsonFile(GUESTS_FILE, guests);
    try {
      this.writeJsonFile(BACKUP_GUESTS_FILE, guests);
    } catch {}
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
      data: sanitizeUserData(initialData) || {},
    };

    users.push(newUser);
    this.saveUsers(users);
    return newUser;
  }

  public static verifyCredentials(username: string, password: string): StoredUser | null {
    let user = this.findByUsername(username);
    if (!user && fs.existsSync(BACKUP_USERS_FILE)) {
      try {
        const backupUsers: StoredUser[] = JSON.parse(fs.readFileSync(BACKUP_USERS_FILE, 'utf-8'));
        const backupMatch = backupUsers.find((u) => u.username.toLowerCase() === username.trim().toLowerCase());
        if (backupMatch) {
          const users = this.getUsers();
          users.push(backupMatch);
          this.saveUsers(users);
          user = backupMatch;
        }
      } catch {}
    }
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
      let user = this.findById(verified.userId);
      if (!user && fs.existsSync(BACKUP_USERS_FILE)) {
        try {
          const backupUsers: StoredUser[] = JSON.parse(fs.readFileSync(BACKUP_USERS_FILE, 'utf-8'));
          const backupMatch = backupUsers.find((u) => u.id === verified.userId);
          if (backupMatch) {
            const users = this.getUsers();
            users.push(backupMatch);
            this.saveUsers(users);
            user = backupMatch;
          }
        } catch {}
      }

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

  public static restoreOrSyncUser(vault: any, clientData?: any): StoredUser {
    if (!vault || !vault.username) {
      throw new Error('Valid vault is required');
    }
    const cleanUsername = vault.username.trim().toLowerCase();
    const users = this.getUsers();
    let existingIndex = users.findIndex(
      (u) => u.username.toLowerCase() === cleanUsername || (vault.id && u.id === vault.id)
    );

    if (existingIndex >= 0) {
      const existing = users[existingIndex];
      const incoming = clientData || vault.data;
      if (incoming && typeof incoming === 'object') {
        const mergedData = mergeUserDataPayload(existing.data, incoming);
        existing.data = mergedData;
        existing.updatedAt = new Date().toISOString();
        users[existingIndex] = existing;
        this.saveUsers(users);
      }
      return existing;
    }

    const salt = vault.salt || crypto.randomBytes(16).toString('hex');
    const passwordHash =
      vault.passwordHash || hashPassword(vault.password || 'admin123', salt);

    const restoredUser: StoredUser = {
      id: vault.id || `user_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      username: vault.username.trim(),
      passwordHash,
      salt,
      role: vault.role === 'admin' ? 'admin' : 'user',
      createdAt: vault.createdAt || new Date().toISOString(),
      lastLoginAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      data: sanitizeUserData(clientData || vault.data || {}),
    };

    users.push(restoredUser);
    this.saveUsers(users);
    return restoredUser;
  }

  public static restoreOrSyncBatch(vaults: any[]): StoredUser[] {
    if (!Array.isArray(vaults) || vaults.length === 0) return this.getUsers();
    for (const vault of vaults) {
      if (!vault || !vault.username) continue;
      try {
        this.restoreOrSyncUser(vault, vault.data);
      } catch (err) {
        console.error('Error in restoreOrSyncBatch for user:', vault.username, err);
      }
    }
    return this.getUsers();
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

    const sanitizedData = sanitizeUserData(data);

    users[index].data = {
      ...users[index].data,
      ...sanitizedData,
    };
    users[index].updatedAt = new Date().toISOString();
    this.saveUsers(users);

    try {
      if (Array.isArray(sanitizedData.coffees)) {
        sanitizedData.coffees.forEach((c: any) => {
          if (c && c.name) {
            // onlyIfExisting = true: user data autosync or import NEVER creates new registered community items!
            this.recordCommunityItem(
              'coffee',
              c,
              userId,
              c.userRating,
              Array.isArray(c.tastingNotesSummary) ? c.tastingNotesSummary : undefined,
              true
            );
          }
        });
      }
      if (Array.isArray(sanitizedData.equipment)) {
        sanitizedData.equipment.forEach((eq: any) => {
          if (eq && eq.name) {
            this.recordCommunityItem('equipment', eq, userId, eq.rating, undefined, true);
          }
        });
      }
      if (Array.isArray(sanitizedData.cafes)) {
        sanitizedData.cafes.forEach((cf: any) => {
          if (cf && cf.name) {
            this.recordCommunityItem('cafe', cf, userId, cf.rating, undefined, true);
          }
        });
      }
    } catch {}

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
      data: sanitizeUserData(initialData) || {},
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
      data: sanitizeUserData(user.data) || {},
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

  // Emergency full reset: removes all equipment, cafes, coffees, and non-admin users from server registry
  public static emergencySystemReset(): {
    removedUsers: number;
    removedCoffees: number;
    removedEquipment: number;
    removedCafes: number;
    removedGuests: number;
    remainingAdmins: number;
  } {
    // 1. Purge all non-admin users
    const allUsers = this.getUsers();
    const adminUsers = allUsers.filter((u) => u.role === 'admin');
    const removedUsers = allUsers.length - adminUsers.length;

    // Reset admin user libraries to clean baseline state
    adminUsers.forEach((admin) => {
      admin.data = {
        coffees: [],
        equipment: [],
        cafes: [],
        notes: [],
        shelves: [],
      };
      admin.updatedAt = new Date().toISOString();
    });
    this.saveUsers(adminUsers);

    // 2. Keep only sessions of surviving admins
    const adminUserIds = new Set(adminUsers.map((a) => a.id));
    const allSessions = this.getSessions();
    const adminSessions = allSessions.filter((s) => adminUserIds.has(s.userId));
    this.saveSessions(adminSessions);

    // 3. Purge all guest session caches
    const allGuests = this.getGuests();
    const removedGuests = Object.keys(allGuests).length;
    this.writeJsonFile(GUESTS_FILE, {});

    // 4. Revert community items registry to 0
    const communityData = this.getCommunityItemsData();
    const removedCoffees = (communityData.coffees || []).length;
    const removedEquipment = (communityData.equipment || []).length;
    const removedCafes = (communityData.cafes || []).length;

    this.saveCommunityItemsData({
      coffees: [],
      equipment: [],
      cafes: [],
    });

    return {
      removedUsers,
      removedCoffees,
      removedEquipment,
      removedCafes,
      removedGuests,
      remainingAdmins: adminUsers.length,
    };
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

    const registeredUserIds = new Set(this.getUsers().map((u) => u.id));
    const processItems = (items: StoredCommunityItem[]) => {
      for (const item of items) {
        if (item.userRatings) {
          Object.keys(item.userRatings).forEach((uid) => {
            if (!registeredUserIds.has(uid)) {
              delete item.userRatings[uid];
            }
          });
        }
        const itemUserTastingNotes = item.userTastingNotes;
        if (itemUserTastingNotes) {
          Object.keys(itemUserTastingNotes).forEach((uid) => {
            if (!registeredUserIds.has(uid)) {
              delete itemUserTastingNotes[uid];
            }
          });
        }
        delete (item as any).baseRating;
        delete (item as any).baseRatingsCount;
        const ratingsMap = item.userRatings || {};
        const agg = this.calculateAggregateRating(ratingsMap);
        item.generalRating = agg.generalRating;
        item.ratingsCount = agg.ratingsCount;
        item.userCount = this.countCurrentItemOwners(item.type, item.name, item.secondary) || agg.ratingsCount;
        if (item.type === 'coffee') {
          const aggTasting = this.calculateAggregateTastingNotes(item.userTastingNotes || {});
          item.generalTastingNotes = aggTasting.generalTastingNotes;
          item.tastingNotesBreakdown = aggTasting.tastingNotesBreakdown;
        }
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
        vault: {
          id: u.id,
          username: u.username,
          passwordHash: u.passwordHash,
          salt: u.salt,
          role: u.role,
          createdAt: u.createdAt,
          updatedAt: u.updatedAt,
          data: u.data,
        },
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
    try {
      this.writeJsonFile(BACKUP_COMMUNITY_ITEMS_FILE, data);
    } catch {}
  }

  // Calculate mathematically exact aggregate general rating across all registered user ratings (defaults to 0 if unrated)
  private static calculateAggregateRating(
    userRatings: Record<string, number>
  ): { generalRating: number; ratingsCount: number } {
    // Only registered user accounts contribute to general ratings
    const registeredUserIds = new Set(this.getUsers().map((u) => u.id));
    const ratingsList = Object.entries(userRatings || {})
      .filter(([uid, r]) => registeredUserIds.has(uid) && typeof r === 'number' && r > 0)
      .map(([, r]) => r);

    const ratingsCount = ratingsList.length;
    if (ratingsCount === 0) {
      return {
        generalRating: 0,
        ratingsCount: 0,
      };
    }

    const userSum = ratingsList.reduce((acc, r) => acc + r, 0);
    const generalRating = Number((userSum / ratingsCount).toFixed(1));

    return {
      generalRating,
      ratingsCount,
    };
  }

  // Count active registered users who currently have this item in their active shelves / library
  public static countCurrentItemOwners(
    type: 'coffee' | 'equipment' | 'cafe',
    name: string,
    secondary: string
  ): number {
    const users = this.getUsers();
    const cleanName = (name || '').trim().toLowerCase();
    const cleanSec = (secondary || '').trim().toLowerCase();
    const key = `${cleanName}::${cleanSec}`;

    const owners = new Set<string>();
    users.forEach((u) => {
      const data = u.data || {};
      if (type === 'coffee' && Array.isArray(data.coffees)) {
        if (
          data.coffees.some((c: any) => {
            if (!c || !c.name) return false;
            const cn = (c.name || '').trim().toLowerCase();
            const cr = (c.roaster || '').trim().toLowerCase();
            return `${cn}::${cr}` === key || (cn === cleanName && (!cleanSec || !cr || cr === cleanSec));
          })
        ) {
          owners.add(u.id);
        }
      } else if (type === 'equipment' && Array.isArray(data.equipment)) {
        if (
          data.equipment.some((eq: any) => {
            if (!eq || !eq.name) return false;
            const cn = (eq.name || '').trim().toLowerCase();
            const cb = (eq.brand || '').trim().toLowerCase();
            return `${cn}::${cb}` === key || (cn === cleanName && (!cleanSec || !cb || cb === cleanSec));
          })
        ) {
          owners.add(u.id);
        }
      } else if (type === 'cafe' && Array.isArray(data.cafes)) {
        if (
          data.cafes.some((cafe: any) => {
            if (!cafe || !cafe.name) return false;
            const cn = (cafe.name || '').trim().toLowerCase();
            const cc = (cafe.city || '').trim().toLowerCase();
            return `${cn}::${cc}` === key || (cn === cleanName && (!cleanSec || !cc || cc === cleanSec));
          })
        ) {
          owners.add(u.id);
        }
      }
    });

    return owners.size;
  }

  // Calculate aggregate tasting notes across all user evaluations (registered accounts only, top 5 displayed in proper casing)
  public static calculateAggregateTastingNotes(
    userTastingNotes: Record<string, string[]> = {}
  ): {
    generalTastingNotes: string[];
    tastingNotesBreakdown: Array<{ note: string; count: number }>;
  } {
    const registeredUserIds = new Set(this.getUsers().map((u) => u.id));
    const noteMap = new Map<string, { display: string; userIds: Set<string> }>();

    const registerNote = (noteStr: string, userId: string) => {
      if (!noteStr || typeof noteStr !== 'string') return;
      const clean = noteStr.trim();
      if (!clean) return;
      const key = clean.toLowerCase();
      const proper = toProperCasing(clean);

      let existing = noteMap.get(key);
      if (!existing) {
        existing = { display: proper, userIds: new Set() };
        noteMap.set(key, existing);
      }
      existing.userIds.add(userId);
    };

    if (userTastingNotes && typeof userTastingNotes === 'object') {
      Object.entries(userTastingNotes).forEach(([uid, notes]) => {
        // Enforce registered users only
        if (registeredUserIds.has(uid) && Array.isArray(notes)) {
          notes.forEach((n) => registerNote(n, uid));
        }
      });
    }

    const breakdown = Array.from(noteMap.values()).map((entry) => ({
      note: entry.display,
      count: entry.userIds.size,
    }));

    breakdown.sort((a, b) => b.count - a.count || a.note.localeCompare(b.note));
    const generalTastingNotes = breakdown.slice(0, 5).map((x) => x.note);

    return {
      generalTastingNotes,
      tastingNotesBreakdown: breakdown,
    };
  }

  // Record an item or user rating / tasting notes in the community catalog
  public static recordCommunityItem(
    type: 'coffee' | 'equipment' | 'cafe',
    item: any,
    userId: string = 'community-user',
    rating?: number,
    tastingNotes?: string[],
    onlyIfExisting: boolean = false
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

    // Collect tasting notes if coffee
    const parsedNotes: string[] = [];
    if (Array.isArray(tastingNotes)) {
      parsedNotes.push(...tastingNotes);
    } else if (Array.isArray(item.tastingNotesSummary)) {
      parsedNotes.push(...item.tastingNotesSummary);
    } else if (Array.isArray(item.flavorNotes)) {
      parsedNotes.push(...item.flavorNotes);
    }
    if (Array.isArray(item.tastingLogs)) {
      item.tastingLogs.forEach((l: any) => {
        if (Array.isArray(l.flavorTags)) parsedNotes.push(...l.flavorTags);
      });
    }

    // General information applies ONLY to registered accounts.
    // Guests/unauthenticated sessions cannot create entries or modify community ratings/notes.
    const user = userId ? this.findById(userId) : null;
    const isRegisteredUser = Boolean(user && user.role !== undefined);

    if (!isRegisteredUser) {
      if (existingIndex >= 0) {
        return list[existingIndex];
      }
      return null;
    }

    if (existingIndex >= 0) {
      const existing = list[existingIndex];
      if (!existing.userRatings || typeof existing.userRatings !== 'object') {
        existing.userRatings = {};
      }
      if (!existing.userTastingNotes || typeof existing.userTastingNotes !== 'object') {
        existing.userTastingNotes = {};
      }

      // Record this user's latest rating
      if (parsedRating !== undefined && userId) {
        existing.userRatings[userId] = parsedRating;
      } else if (userId && (item.userRating === 0 || rating === 0)) {
        delete existing.userRatings[userId];
      }

      // Record this user's tasting notes
      if (type === 'coffee' && userId) {
        if (Array.isArray(tastingNotes)) {
          existing.userTastingNotes[userId] = tastingNotes;
        } else if (parsedNotes.length > 0) {
          existing.userTastingNotes[userId] = parsedNotes;
        }
      }

      // Ensure no legacy guest IDs linger in user evaluations
      const registeredUserIds = new Set(this.getUsers().map((u) => u.id));
      Object.keys(existing.userRatings).forEach((uid) => {
        if (!registeredUserIds.has(uid)) delete existing.userRatings[uid];
      });
      const existingUserTastingNotes = existing.userTastingNotes;
      if (existingUserTastingNotes) {
        Object.keys(existingUserTastingNotes).forEach((uid) => {
          if (!registeredUserIds.has(uid)) delete existingUserTastingNotes[uid];
        });
      }

      delete (existing as any).baseRating;
      delete (existing as any).baseRatingsCount;
      const agg = this.calculateAggregateRating(existing.userRatings);

      existing.generalRating = agg.generalRating;
      existing.ratingsCount = agg.ratingsCount;
      existing.userCount = this.countCurrentItemOwners(type, cleanName, secondary) || agg.ratingsCount;
      existing.updatedAt = new Date().toISOString();
      existing.itemData = { ...existing.itemData, ...item };

      if (type === 'coffee') {
        const aggTasting = this.calculateAggregateTastingNotes(existing.userTastingNotes || {});
        existing.generalTastingNotes = aggTasting.generalTastingNotes;
        existing.tastingNotesBreakdown = aggTasting.tastingNotesBreakdown;
      }

      list[existingIndex] = existing;
      this.saveCommunityItemsData(data);
      return existing;
    } else {
      // If we only want to update ratings on existing registered catalog items, do not create a new community item
      if (onlyIfExisting) {
        return null;
      }

      const userRatings: Record<string, number> = {};
      if (parsedRating !== undefined && userId) {
        userRatings[userId] = parsedRating;
      }

      const userTastingNotes: Record<string, string[]> = {};
      if (type === 'coffee' && parsedNotes.length > 0 && userId) {
        userTastingNotes[userId] = parsedNotes;
      }

      const agg = this.calculateAggregateRating(userRatings);
      const aggTasting = this.calculateAggregateTastingNotes(userTastingNotes);
      const liveOwnerCount = this.countCurrentItemOwners(type, cleanName, secondary);

      const newItem: StoredCommunityItem = {
        id: item.id || `community-${type}-${Date.now()}`,
        name: cleanName,
        secondary,
        type,
        userRatings,
        userTastingNotes: type === 'coffee' ? userTastingNotes : undefined,
        generalRating: agg.generalRating,
        ratingsCount: agg.ratingsCount,
        userCount: liveOwnerCount > 0 ? liveOwnerCount : agg.ratingsCount > 0 ? agg.ratingsCount : 1,
        generalTastingNotes: type === 'coffee' ? aggTasting.generalTastingNotes : undefined,
        tastingNotesBreakdown: type === 'coffee' ? aggTasting.tastingNotesBreakdown : undefined,
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
          updatedItem.userRatings || {}
        );
        updatedItem.generalRating = agg.generalRating;
        updatedItem.ratingsCount = agg.ratingsCount;
        updatedItem.userCount = this.countCurrentItemOwners(
          updatedItem.type,
          updatedItem.name,
          updatedItem.secondary
        ) || agg.ratingsCount;

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
          const agg = this.calculateAggregateRating(item.userRatings);
          item.generalRating = agg.generalRating;
          item.ratingsCount = agg.ratingsCount;
          item.userCount = this.countCurrentItemOwners(item.type, item.name, item.secondary) || agg.ratingsCount;
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
        const agg = this.calculateAggregateRating({});
        item.generalRating = agg.generalRating;
        item.ratingsCount = agg.ratingsCount;
        item.userCount = this.countCurrentItemOwners(item.type, item.name, item.secondary);
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

        const aggTasting =
          item.type === 'coffee'
            ? this.calculateAggregateTastingNotes(item.userTastingNotes || {})
            : undefined;

        const liveOwnerCount = this.countCurrentItemOwners(item.type, item.name, item.secondary);

        return {
          id: item.id,
          name: item.name,
          secondary: item.secondary,
          type: item.type,
          generalRating: item.generalRating,
          ratingsCount: item.ratingsCount,
          userCount: liveOwnerCount > 0 ? liveOwnerCount : item.ratingsCount,
          userRatings: ratingEntries,
          generalTastingNotes: aggTasting?.generalTastingNotes || item.generalTastingNotes || [],
          tastingNotesBreakdown: aggTasting?.tastingNotesBreakdown || item.tastingNotesBreakdown || [],
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
    const registeredUserIds = new Set(users.map((u) => u.id));
    const communityData = this.getCommunityItemsData();
    const coffeeMap = new Map<string, any>();

    // 1. Load community items as foundation
    (communityData.coffees || []).forEach((c) => {
      const cleanName = (c.name || '').trim();
      const cleanRoaster = (c.secondary || c.itemData?.roaster || '').trim();
      const key = `${cleanName.toLowerCase()}::${cleanRoaster.toLowerCase()}`;

      const userRatings: Record<string, number> = {};
      if (c.userRatings && typeof c.userRatings === 'object') {
        Object.entries(c.userRatings).forEach(([uid, r]) => {
          if (registeredUserIds.has(uid) && typeof r === 'number' && r > 0) {
            userRatings[uid] = r;
          }
        });
      }

      const userTastingNotes: Record<string, string[]> = {};
      if (c.userTastingNotes && typeof c.userTastingNotes === 'object') {
        Object.entries(c.userTastingNotes).forEach(([uid, notes]) => {
          if (registeredUserIds.has(uid) && Array.isArray(notes)) {
            userTastingNotes[uid] = notes;
          }
        });
      }

      const baseNotes: string[] = Array.isArray(c.itemData?.tastingNotesSummary)
        ? c.itemData.tastingNotesSummary
        : [];

      coffeeMap.set(key, {
        id: c.id,
        name: cleanName,
        roaster: cleanRoaster,
        currentOwners: new Set<string>(),
        userRatings,
        userTastingNotes,
        baseNotes,
        origin: c.itemData?.origin || { country: 'Single Origin' },
        variety: c.itemData?.variety || 'Arabica',
        process: c.itemData?.process || 'Washed',
        roastLevel: c.itemData?.roastLevel || 'Medium',
        coverColor: c.itemData?.coverColor || '#C87D32',
        description: c.itemData?.description || '',
        tastingNotesSummary: baseNotes,
      });
    });

    // 2. Scan all registered users and aggregate user ratings, tasting notes, and active ownership
    users.forEach((u) => {
      const userCoffees = u.data?.coffees;
      if (Array.isArray(userCoffees)) {
        userCoffees.forEach((uc) => {
          if (!uc || !uc.name) return;
          const cleanName = (uc.name || '').trim();
          const cleanRoaster = (uc.roaster || '').trim();
          const key = `${cleanName.toLowerCase()}::${cleanRoaster.toLowerCase()}`;

          let existing = coffeeMap.get(key);
          if (!existing) {
            const matchEntry = Array.from(coffeeMap.entries()).find(([k]) => k.startsWith(`${cleanName.toLowerCase()}::`));
            if (matchEntry) {
              existing = matchEntry[1];
            }
          }

          // Strictly skip private user coffees that have not been registered to the community catalog
          if (!existing) return;

          // Mark user as active owner of this coffee
          existing.currentOwners.add(u.id);

          // Personal rating or tasting logs average
          let userRating = typeof uc.userRating === 'number' && uc.userRating > 0 ? uc.userRating : 0;
          if (!userRating && Array.isArray(uc.tastingLogs) && uc.tastingLogs.length > 0) {
            const validLogs = uc.tastingLogs.filter((l: any) => typeof l?.rating === 'number' && l.rating > 0);
            if (validLogs.length > 0) {
              userRating = validLogs.reduce((acc: number, l: any) => acc + l.rating, 0) / validLogs.length;
            }
          }

          // User tasting notes
          const userNotes: string[] = [];
          if (Array.isArray(uc.tastingNotesSummary)) userNotes.push(...uc.tastingNotesSummary);
          if (Array.isArray(uc.tastingLogs)) {
            uc.tastingLogs.forEach((l: any) => {
              if (Array.isArray(l.flavorTags)) userNotes.push(...l.flavorTags);
            });
          }

          if (userRating > 0) {
            existing.userRatings[u.id] = userRating;
          }
          if (userNotes.length > 0) {
            existing.userTastingNotes[u.id] = userNotes;
          }
        });
      }
    });

    // Compute aggregate for each item (strictly registered users, defaults to 0 if no ratings)
    return Array.from(coffeeMap.values()).map((item) => {
      const agg = this.calculateAggregateRating(item.userRatings);
      const aggTasting = this.calculateAggregateTastingNotes(item.userTastingNotes);
      const userCount = item.currentOwners.size > 0 ? item.currentOwners.size : agg.ratingsCount;

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
        generalTastingNotes: aggTasting.generalTastingNotes,
        tastingNotesBreakdown: aggTasting.tastingNotesBreakdown,
        generalRating: agg.generalRating,
        communityRating: agg.generalRating,
        ratingsCount: agg.ratingsCount,
        communityRatingsCount: agg.ratingsCount,
        userCount,
        isRecommended: agg.ratingsCount > 0 && agg.generalRating >= 4.5,
      };
    }).sort((a, b) => b.generalRating - a.generalRating);
  }

  // Running catalog of all registered equipment across all users and defaults
  public static getRegisteredEquipment(): any[] {
    const users = this.getUsers();
    const registeredUserIds = new Set(users.map((u) => u.id));
    const communityData = this.getCommunityItemsData();
    const eqMap = new Map<string, any>();

    (communityData.equipment || []).forEach((eq) => {
      const cleanName = (eq.name || '').trim();
      const cleanBrand = (eq.secondary || eq.itemData?.brand || '').trim();
      const key = `${cleanName.toLowerCase()}::${cleanBrand.toLowerCase()}`;

      const userRatings: Record<string, number> = {};
      if (eq.userRatings && typeof eq.userRatings === 'object') {
        Object.entries(eq.userRatings).forEach(([uid, r]) => {
          if (registeredUserIds.has(uid) && typeof r === 'number' && r > 0) {
            userRatings[uid] = r;
          }
        });
      }

      eqMap.set(key, {
        id: eq.id,
        name: cleanName,
        brand: cleanBrand,
        category: eq.itemData?.category || 'Accessory',
        currentOwners: new Set<string>(),
        userRatings,
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
            const matchEntry = Array.from(eqMap.entries()).find(([k]) => k.startsWith(`${cleanName.toLowerCase()}::`));
            if (matchEntry) {
              existing = matchEntry[1];
            }
          }

          // Strictly skip private user gear that has not been registered to the community catalog
          if (!existing) return;

          // Mark user as active owner of this equipment
          existing.currentOwners.add(u.id);

          if (typeof ueq.rating === 'number' && ueq.rating > 0) {
            existing.userRatings[u.id] = ueq.rating;
          }
        });
      }
    });

    return Array.from(eqMap.values()).map((item) => {
      const agg = this.calculateAggregateRating(item.userRatings);
      const userCount = item.currentOwners.size > 0 ? item.currentOwners.size : agg.ratingsCount;

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
        userCount,
        isRecommended: agg.ratingsCount > 0 && agg.generalRating >= 4.5,
      };
    }).sort((a, b) => b.generalRating - a.generalRating);
  }

  // Running catalog of all registered cafes across all users and defaults
  public static getRegisteredCafes(): any[] {
    const users = this.getUsers();
    const registeredUserIds = new Set(users.map((u) => u.id));
    const communityData = this.getCommunityItemsData();
    const cafeMap = new Map<string, any>();

    (communityData.cafes || []).forEach((c) => {
      const cleanName = (c.name || '').trim();
      const cleanCity = (c.secondary || c.itemData?.city || '').trim();
      const key = `${cleanName.toLowerCase()}::${cleanCity.toLowerCase()}`;

      const userRatings: Record<string, number> = {};
      if (c.userRatings && typeof c.userRatings === 'object') {
        Object.entries(c.userRatings).forEach(([uid, r]) => {
          if (registeredUserIds.has(uid) && typeof r === 'number' && r > 0) {
            userRatings[uid] = r;
          }
        });
      }

      cafeMap.set(key, {
        id: c.id,
        name: cleanName,
        city: cleanCity,
        country: c.itemData?.country || '',
        address: c.itemData?.address || '',
        vibes: Array.isArray(c.itemData?.vibes) ? c.itemData.vibes : [],
        favoriteDrink: c.itemData?.favoriteDrink || '',
        notes: c.itemData?.notes || '',
        currentOwners: new Set<string>(),
        userRatings,
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
            const matchEntry = Array.from(cafeMap.entries()).find(([k]) => k.startsWith(`${cleanName.toLowerCase()}::`));
            if (matchEntry) {
              existing = matchEntry[1];
            }
          }

          // Strictly skip private user cafes that have not been registered to the community catalog
          if (!existing) return;

          // Mark user as active owner of this cafe
          existing.currentOwners.add(u.id);

          if (typeof uc.rating === 'number' && uc.rating > 0) {
            existing.userRatings[u.id] = uc.rating;
          } else if (typeof uc.userRating === 'number' && uc.userRating > 0) {
            existing.userRatings[u.id] = uc.userRating;
          }
        });
      }
    });

    return Array.from(cafeMap.values()).map((item) => {
      const agg = this.calculateAggregateRating(item.userRatings);
      const userCount = item.currentOwners.size > 0 ? item.currentOwners.size : agg.ratingsCount;

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
        userCount,
        isRecommended: agg.ratingsCount > 0 && agg.generalRating >= 4.5,
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
