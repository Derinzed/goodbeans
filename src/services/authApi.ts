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

  async createAdminUser(
    token: string,
    userData: { username: string; password: string; role?: 'admin' | 'user'; initialData?: any }
  ): Promise<{ success: boolean; user?: any; error?: string }> {
    const res = await fetch('/api/admin/users', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(userData),
    });
    return res.json();
  },

  async updateAdminUserRole(
    token: string,
    userId: string,
    role: 'admin' | 'user'
  ): Promise<{ success: boolean; message?: string; error?: string }> {
    const res = await fetch(`/api/admin/users/${userId}/role`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ role }),
    });
    return res.json();
  },

  async resetAdminUserPassword(
    token: string,
    userId: string,
    newPassword: string
  ): Promise<{ success: boolean; message?: string; error?: string }> {
    const res = await fetch(`/api/admin/users/${userId}/password`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ newPassword }),
    });
    return res.json();
  },

  async getAdminRatings(token: string): Promise<{
    success: boolean;
    coffees?: any[];
    equipment?: any[];
    cafes?: any[];
    error?: string;
  }> {
    const res = await fetch('/api/admin/ratings', {
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.json();
  },

  async createAdminCommunityItem(
    token: string,
    type: 'coffee' | 'equipment' | 'cafe',
    item: any,
    rating?: number
  ): Promise<{ success: boolean; item?: any; message?: string; error?: string }> {
    const res = await fetch('/api/admin/community/items', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ type, item, rating }),
    });
    return res.json();
  },

  async updateAdminCommunityItem(
    token: string,
    itemId: string,
    data: any
  ): Promise<{ success: boolean; item?: any; message?: string; error?: string }> {
    const res = await fetch(`/api/admin/community/items/${itemId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });
    return res.json();
  },

  async deleteAdminCommunityItem(
    token: string,
    itemId: string
  ): Promise<{ success: boolean; message?: string; error?: string }> {
    const res = await fetch(`/api/admin/community/items/${itemId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.json();
  },

  async deleteAdminItemRating(
    token: string,
    itemId: string,
    raterKey: string
  ): Promise<{ success: boolean; message?: string; error?: string }> {
    const res = await fetch(`/api/admin/community/items/${itemId}/ratings/${encodeURIComponent(raterKey)}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.json();
  },

  async resetAdminItemRatings(
    token: string,
    itemId: string
  ): Promise<{ success: boolean; message?: string; error?: string }> {
    const res = await fetch(`/api/admin/community/items/${itemId}/reset-ratings`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.json();
  },

  async deleteAdminGuest(
    token: string,
    guestId: string
  ): Promise<{ success: boolean; message?: string; error?: string }> {
    const res = await fetch(`/api/admin/guests/${guestId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.json();
  },

  async cleanAdminSessions(
    token: string
  ): Promise<{ success: boolean; removedCount?: number; remainingCount?: number; message?: string; error?: string }> {
    const res = await fetch('/api/admin/sessions/clean', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.json();
  },

  async getUserDataAdmin(
    token: string,
    userId: string
  ): Promise<{ success: boolean; user?: any; data?: any; error?: string }> {
    const res = await fetch(`/api/admin/users/${userId}/data`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.json();
  },

  async deleteUserItemAdmin(
    token: string,
    userId: string,
    category: 'coffees' | 'equipment' | 'cafes' | 'customNotes',
    itemId: string
  ): Promise<{ success: boolean; message?: string; error?: string }> {
    const res = await fetch(`/api/admin/users/${userId}/data/${category}/${itemId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.json();
  },

  async addItemToUserAdmin(
    token: string,
    userId: string,
    category: 'coffees' | 'equipment' | 'cafes',
    item: any
  ): Promise<{ success: boolean; item?: any; message?: string; error?: string }> {
    const res = await fetch(`/api/admin/users/${userId}/data/${category}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ item }),
    });
    return res.json();
  },

  async clearUserDataAdmin(
    token: string,
    userId: string
  ): Promise<{ success: boolean; message?: string; error?: string }> {
    const res = await fetch(`/api/admin/users/${userId}/clear`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.json();
  },

  async recalculateAllRatings(
    token: string
  ): Promise<{
    success: boolean;
    recalculatedCoffees?: number;
    recalculatedEquipment?: number;
    recalculatedCafes?: number;
    message?: string;
    error?: string;
  }> {
    const res = await fetch('/api/admin/ratings/recalculate', {
      method: 'POST',
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
