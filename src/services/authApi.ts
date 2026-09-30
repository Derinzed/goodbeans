export interface UserProfile {
  id: string;
  username: string;
  role: 'admin' | 'user';
  createdAt: string;
}

export interface AdminUserSummary {
  id: string;
  username: string;
  role: 'admin' | 'user';
  createdAt: string;
  lastLoginAt: string;
  updatedAt: string;
  coffeesCount: number;
  equipmentCount: number;
  cafesCount: number;
  notesCount: number;
  tastingsCount: number;
  hasData: boolean;
}

export interface AuthResponse {
  success: boolean;
  token?: string;
  user?: UserProfile;
  data?: any;
  error?: string;
  message?: string;
}

export const authApi = {
  async register(username: string, password: string, initialData?: any): Promise<AuthResponse> {
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password, initialData }),
    });
    return res.json();
  },

  async login(username: string, password: string): Promise<AuthResponse> {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });
    return res.json();
  },

  async getMe(token: string): Promise<AuthResponse> {
    const res = await fetch('/api/auth/me', {
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.json();
  },

  async logout(token: string): Promise<void> {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
    } catch {
      // ignore
    }
  },

  async saveUserData(token: string, data: any): Promise<{ success: boolean; error?: string }> {
    const res = await fetch('/api/user/data', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ data }),
    });
    return res.json();
  },

  async deleteAccount(token: string): Promise<{ success: boolean; message?: string; error?: string }> {
    const res = await fetch('/api/user/account', {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.json();
  },

  async getAdminUsers(token: string): Promise<{ success: boolean; users?: AdminUserSummary[]; error?: string }> {
    const res = await fetch('/api/admin/users', {
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.json();
  },

  async deleteAdminUser(token: string, userId: string): Promise<{ success: boolean; error?: string }> {
    const res = await fetch(`/api/admin/users/${userId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.json();
  },

  async exportAdminUser(token: string, userId: string): Promise<any> {
    const res = await fetch(`/api/admin/users/${userId}/export`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.json();
  },

  async getRawDatabase(token: string): Promise<any> {
    const res = await fetch('/api/admin/raw-data', {
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.json();
  },

  async getGuestData(guestId: string): Promise<{ success: boolean; data?: any; error?: string }> {
    const res = await fetch(`/api/guest/data?guestId=${encodeURIComponent(guestId)}`);
    return res.json();
  },

  async saveGuestData(guestId: string, data: any): Promise<{ success: boolean; message?: string; error?: string }> {
    const res = await fetch('/api/guest/data', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ guestId, data }),
    });
    return res.json();
  },

  async getCommunityItems(): Promise<{
    success: boolean;
    coffees?: any[];
    equipment?: any[];
    cafes?: any[];
    error?: string;
  }> {
    const res = await fetch('/api/community/items');
    return res.json();
  },

  async registerCommunityItem(
    type: 'coffee' | 'equipment' | 'cafe',
    item: any,
    rating?: number
  ): Promise<{ success: boolean; registered?: any; error?: string }> {
    const token = localStorage.getItem('goodbeans_auth_token');
    const guestId = localStorage.getItem('goodbeans_guest_id');
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    if (guestId) {
      headers['x-guest-id'] = guestId;
    }
    const res = await fetch('/api/community/items/register', {
      method: 'POST',
      headers,
      body: JSON.stringify({ type, item, rating, guestId }),
    });
    return res.json();
  },

  async unifyItem(
    query: string,
    type: 'coffee' | 'equipment' | 'cafe',
    roasterOrBrand?: string
  ): Promise<{
    success: boolean;
    isConfidentMatch: boolean;
    confidence: number;
    matchedItem: any | null;
    suggestedName: string;
    suggestedSecondary?: string;
    error?: string;
  }> {
    const res = await fetch('/api/community/unify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, type, roasterOrBrand }),
    });
    return res.json();
  },
};
