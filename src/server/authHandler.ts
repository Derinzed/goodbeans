import type { IncomingMessage, ServerResponse } from 'http';
import { AuthStore } from './authStore.ts';
import { sanitizeUserData } from '../utils/communityLookup.ts';

// Helper to extract bearer token
function getBearerToken(req: IncomingMessage): string | null {
  const authHeader = req.headers['authorization'] || req.headers['Authorization'];
  if (!authHeader || typeof authHeader !== 'string') return null;
  const parts = authHeader.split(' ');
  if (parts.length === 2 && parts[0].toLowerCase() === 'bearer') {
    return parts[1];
  }
  return null;
}

// Helper to read JSON body
function readJsonBody(req: IncomingMessage): Promise<any> {
  return new Promise((resolve, reject) => {
    // If body already parsed by express
    if ((req as any).body && typeof (req as any).body === 'object') {
      return resolve((req as any).body);
    }
    let body = '';
    req.on('data', (chunk) => {
      body += chunk;
    });
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (err) {
        reject(new Error('Invalid JSON format'));
      }
    });
    req.on('error', (err) => reject(err));
  });
}

function sendJson(res: ServerResponse, statusCode: number, data: any) {
  res.statusCode = statusCode;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(data));
}

export async function handleAuthRoutes(
  req: IncomingMessage,
  res: ServerResponse,
  next?: () => void
): Promise<boolean> {
  const url = req.url || '';
  const method = req.method || 'GET';

  // 1. POST /api/auth/register
  if (url === '/api/auth/register' && method === 'POST') {
    try {
      const body = await readJsonBody(req);
      const { username, password, initialData } = body;

      if (!username || typeof username !== 'string' || !username.trim()) {
        sendJson(res, 400, { error: 'Username is required' });
        return true;
      }
      if (!password || typeof password !== 'string' || password.length < 3) {
        sendJson(res, 400, { error: 'Password must be at least 3 characters long' });
        return true;
      }

      const newUser = AuthStore.createUser(username.trim(), password, initialData);
      const token = AuthStore.createSession(newUser.id);

      sendJson(res, 201, {
        success: true,
        token,
        user: {
          id: newUser.id,
          username: newUser.username,
          role: newUser.role,
          createdAt: newUser.createdAt,
        },
        data: newUser.data,
      });
      return true;
    } catch (err: any) {
      sendJson(res, 400, { error: err.message || 'Registration failed' });
      return true;
    }
  }

  // 2. POST /api/auth/login
  if (url === '/api/auth/login' && method === 'POST') {
    try {
      const body = await readJsonBody(req);
      const { username, password } = body;

      if (!username || !password) {
        sendJson(res, 400, { error: 'Username and password are required' });
        return true;
      }

      const user = AuthStore.verifyCredentials(username, password);
      if (!user) {
        sendJson(res, 401, { error: 'Invalid username or password' });
        return true;
      }

      const token = AuthStore.createSession(user.id);
      sendJson(res, 200, {
        success: true,
        token,
        user: {
          id: user.id,
          username: user.username,
          role: user.role,
          createdAt: user.createdAt,
        },
        data: user.data,
      });
      return true;
    } catch (err: any) {
      sendJson(res, 500, { error: err.message || 'Login failed' });
      return true;
    }
  }

  // 3. GET /api/auth/me
  if (url === '/api/auth/me' && method === 'GET') {
    const token = getBearerToken(req);
    const user = token ? AuthStore.getUserByToken(token) : null;
    if (!user) {
      sendJson(res, 401, { error: 'Unauthorized' });
      return true;
    }

    sendJson(res, 200, {
      success: true,
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
        createdAt: user.createdAt,
      },
      data: user.data,
    });
    return true;
  }

  // 4. POST /api/auth/logout
  if (url === '/api/auth/logout' && method === 'POST') {
    const token = getBearerToken(req);
    if (token) {
      AuthStore.deleteSession(token);
    }
    sendJson(res, 200, { success: true, message: 'Logged out successfully' });
    return true;
  }

  // 5. PUT /api/user/data (Update/Sync User Data)
  if (url === '/api/user/data' && (method === 'PUT' || method === 'POST')) {
    const token = getBearerToken(req);
    const user = token ? AuthStore.getUserByToken(token) : null;
    if (!user) {
      sendJson(res, 401, { error: 'Unauthorized. Please sign in to save your data.' });
      return true;
    }

    try {
      const body = await readJsonBody(req);
      const updatedUser = AuthStore.updateUserData(user.id, body.data || body);
      sendJson(res, 200, {
        success: true,
        updatedAt: updatedUser.updatedAt,
        message: 'Account data saved successfully on server.',
      });
      return true;
    } catch (err: any) {
      sendJson(res, 500, { error: err.message || 'Failed to update user data' });
      return true;
    }
  }

  // 6. DELETE /api/user/account (Delete Logged-in Account)
  if (url === '/api/user/account' && method === 'DELETE') {
    const token = getBearerToken(req);
    const user = token ? AuthStore.getUserByToken(token) : null;
    if (!user) {
      sendJson(res, 401, { error: 'Unauthorized' });
      return true;
    }

    const success = AuthStore.deleteUser(user.id);
    if (success) {
      sendJson(res, 200, {
        success: true,
        message: `Account "${user.username}" and all associated data have been permanently deleted.`,
      });
    } else {
      sendJson(res, 500, { error: 'Failed to delete account' });
    }
    return true;
  }

  // 6b. GET /api/guest/data (Retrieve persistent data for anonymous/guest session)
  if (url.startsWith('/api/guest/data') && method === 'GET') {
    try {
      const parsedUrl = new URL(url, 'http://localhost');
      const guestId = parsedUrl.searchParams.get('guestId') || (req.headers['x-guest-id'] as string);
      if (!guestId) {
        sendJson(res, 400, { error: 'guestId is required' });
        return true;
      }
      const data = AuthStore.getGuestData(guestId);
      sendJson(res, 200, {
        success: true,
        data,
      });
      return true;
    } catch (err: any) {
      sendJson(res, 500, { error: err.message || 'Failed to fetch guest data' });
      return true;
    }
  }

  // 6c. POST /api/guest/data (Continuously save persistent data for anonymous/guest session)
  if (url.startsWith('/api/guest/data') && (method === 'POST' || method === 'PUT')) {
    try {
      const body = await readJsonBody(req);
      const guestId = body.guestId || (req.headers['x-guest-id'] as string);
      if (!guestId) {
        sendJson(res, 400, { error: 'guestId is required' });
        return true;
      }
      AuthStore.saveGuestData(guestId, body.data || body);
      sendJson(res, 200, {
        success: true,
        message: 'Guest session data saved persistently on server.',
      });
      return true;
    } catch (err: any) {
      sendJson(res, 500, { error: err.message || 'Failed to save guest data' });
      return true;
    }
  }

  // 7. GET /api/admin/raw-data (Admin inspects complete raw database tables: users, community items, sessions, guests)
  if (url === '/api/admin/raw-data' && method === 'GET') {
    const token = getBearerToken(req);
    const user = token ? AuthStore.getUserByToken(token) : null;

    if (!user || user.role !== 'admin') {
      sendJson(res, 403, { error: 'Access denied. Administrator privileges required.' });
      return true;
    }

    try {
      const dump = AuthStore.getRawDatabaseDump();
      sendJson(res, 200, {
        success: true,
        ...dump,
      });
      return true;
    } catch (err: any) {
      sendJson(res, 500, { error: err.message || 'Failed to export raw database dump' });
      return true;
    }
  }

  // 7b. GET /api/admin/users (View all registered users)
  if (url === '/api/admin/users' && method === 'GET') {
    const token = getBearerToken(req);
    const user = token ? AuthStore.getUserByToken(token) : null;

    // Allow if role === 'admin', or if token user is admin
    if (!user || user.role !== 'admin') {
      sendJson(res, 403, { error: 'Access denied. Administrator privileges required.' });
      return true;
    }

    const usersSummary = AuthStore.getAllUsersSummary();
    sendJson(res, 200, {
      success: true,
      totalUsers: usersSummary.length,
      users: usersSummary,
    });
    return true;
  }

  // 7c. POST /api/admin/users (Admin manually creates a user)
  if (url === '/api/admin/users' && method === 'POST') {
    const token = getBearerToken(req);
    const user = token ? AuthStore.getUserByToken(token) : null;
    if (!user || user.role !== 'admin') {
      sendJson(res, 403, { error: 'Access denied. Administrator privileges required.' });
      return true;
    }

    try {
      const body = await readJsonBody(req);
      const { username, password, role = 'user', initialData } = body;
      if (!username || !password) {
        sendJson(res, 400, { error: 'Username and password are required' });
        return true;
      }
      const created = AuthStore.createUserByAdmin(username, password, role, initialData);
      sendJson(res, 201, {
        success: true,
        user: {
          id: created.id,
          username: created.username,
          role: created.role,
          createdAt: created.createdAt,
        },
      });
      return true;
    } catch (err: any) {
      sendJson(res, 400, { error: err.message || 'Failed to create user' });
      return true;
    }
  }

  // 7d. PUT /api/admin/users/:userId/role (Admin updates user role)
  if (url.match(/^\/api\/admin\/users\/[^/]+\/role/) && method === 'PUT') {
    const token = getBearerToken(req);
    const user = token ? AuthStore.getUserByToken(token) : null;
    if (!user || user.role !== 'admin') {
      sendJson(res, 403, { error: 'Access denied. Administrator privileges required.' });
      return true;
    }

    const targetUserId = url.split('/')[4];
    try {
      const body = await readJsonBody(req);
      const { role } = body;
      if (role !== 'admin' && role !== 'user') {
        sendJson(res, 400, { error: 'Role must be admin or user' });
        return true;
      }
      if (targetUserId === user.id && role !== 'admin') {
        sendJson(res, 400, { error: 'You cannot demote your own admin account.' });
        return true;
      }
      const updated = AuthStore.updateUserRole(targetUserId, role);
      if (updated) {
        sendJson(res, 200, { success: true, message: `Role updated to ${role}.` });
      } else {
        sendJson(res, 404, { error: 'User not found' });
      }
      return true;
    } catch (err: any) {
      sendJson(res, 500, { error: err.message || 'Failed to update role' });
      return true;
    }
  }

  // 7e. PUT /api/admin/users/:userId/password (Admin resets user password)
  if (url.match(/^\/api\/admin\/users\/[^/]+\/password/) && method === 'PUT') {
    const token = getBearerToken(req);
    const user = token ? AuthStore.getUserByToken(token) : null;
    if (!user || user.role !== 'admin') {
      sendJson(res, 403, { error: 'Access denied. Administrator privileges required.' });
      return true;
    }

    const targetUserId = url.split('/')[4];
    try {
      const body = await readJsonBody(req);
      const { newPassword } = body;
      if (!newPassword || typeof newPassword !== 'string' || newPassword.length < 3) {
        sendJson(res, 400, { error: 'New password must be at least 3 characters long.' });
        return true;
      }
      const updated = AuthStore.resetUserPassword(targetUserId, newPassword);
      if (updated) {
        sendJson(res, 200, { success: true, message: 'Password reset successfully.' });
      } else {
        sendJson(res, 404, { error: 'User not found' });
      }
      return true;
    } catch (err: any) {
      sendJson(res, 500, { error: err.message || 'Failed to reset password' });
      return true;
    }
  }

  // 7f. GET /api/admin/ratings (Preview all ratings with user breakdowns)
  if (url === '/api/admin/ratings' && method === 'GET') {
    const token = getBearerToken(req);
    const user = token ? AuthStore.getUserByToken(token) : null;
    if (!user || user.role !== 'admin') {
      sendJson(res, 403, { error: 'Access denied. Administrator privileges required.' });
      return true;
    }

    try {
      const breakdown = AuthStore.getDetailedRatingsBreakdown();
      sendJson(res, 200, {
        success: true,
        ...breakdown,
      });
      return true;
    } catch (err: any) {
      sendJson(res, 500, { error: err.message || 'Failed to fetch ratings breakdown' });
      return true;
    }
  }

  // 7g. POST /api/admin/community/items (Admin manually adds community catalog entry)
  if (url === '/api/admin/community/items' && method === 'POST') {
    const token = getBearerToken(req);
    const user = token ? AuthStore.getUserByToken(token) : null;
    if (!user || user.role !== 'admin') {
      sendJson(res, 403, { error: 'Access denied. Administrator privileges required.' });
      return true;
    }

    try {
      const body = await readJsonBody(req);
      const { type = 'coffee', item, rating } = body;
      if (!item || !item.name) {
        sendJson(res, 400, { error: 'Item with name is required' });
        return true;
      }
      const created = AuthStore.recordCommunityItem(type, item, user.id, rating);
      sendJson(res, 201, {
        success: true,
        item: created,
        message: 'Community entry created successfully.',
      });
      return true;
    } catch (err: any) {
      sendJson(res, 500, { error: err.message || 'Failed to create community entry' });
      return true;
    }
  }

  // 7h. PUT /api/admin/community/items/:itemId (Admin updates community entry)
  if (url.match(/^\/api\/admin\/community\/items\/[^/]+$/) && method === 'PUT') {
    const token = getBearerToken(req);
    const user = token ? AuthStore.getUserByToken(token) : null;
    if (!user || user.role !== 'admin') {
      sendJson(res, 403, { error: 'Access denied. Administrator privileges required.' });
      return true;
    }

    const itemId = url.split('/')[5];
    try {
      const body = await readJsonBody(req);
      const updated = AuthStore.updateCommunityItem(itemId, body);
      if (updated) {
        sendJson(res, 200, { success: true, item: updated, message: 'Item updated successfully.' });
      } else {
        sendJson(res, 404, { error: 'Community item not found' });
      }
      return true;
    } catch (err: any) {
      sendJson(res, 500, { error: err.message || 'Failed to update community item' });
      return true;
    }
  }

  // 7i. DELETE /api/admin/community/items/:itemId (Admin deletes community entry)
  if (url.match(/^\/api\/admin\/community\/items\/[^/]+$/) && method === 'DELETE') {
    const token = getBearerToken(req);
    const user = token ? AuthStore.getUserByToken(token) : null;
    if (!user || user.role !== 'admin') {
      sendJson(res, 403, { error: 'Access denied. Administrator privileges required.' });
      return true;
    }

    const itemId = url.split('/')[5];
    const deleted = AuthStore.deleteCommunityItem(itemId);
    if (deleted) {
      sendJson(res, 200, { success: true, message: 'Item deleted from community catalog.' });
    } else {
      sendJson(res, 404, { error: 'Community item not found' });
    }
    return true;
  }

  // 7j. DELETE /api/admin/community/items/:itemId/ratings/:raterUserId (Admin deletes specific user rating)
  if (url.match(/^\/api\/admin\/community\/items\/[^/]+\/ratings\/[^/]+/) && method === 'DELETE') {
    const token = getBearerToken(req);
    const user = token ? AuthStore.getUserByToken(token) : null;
    if (!user || user.role !== 'admin') {
      sendJson(res, 403, { error: 'Access denied. Administrator privileges required.' });
      return true;
    }

    const parts = url.split('/');
    const itemId = parts[5];
    const raterKey = parts[7];
    const deleted = AuthStore.deleteCommunityItemRating(itemId, raterKey);
    if (deleted) {
      sendJson(res, 200, { success: true, message: 'Rating deleted successfully.' });
    } else {
      sendJson(res, 404, { error: 'Rating not found for this item' });
    }
    return true;
  }

  // 7k. POST /api/admin/community/items/:itemId/reset-ratings (Admin resets all ratings on an item)
  if (url.match(/^\/api\/admin\/community\/items\/[^/]+\/reset-ratings/) && method === 'POST') {
    const token = getBearerToken(req);
    const user = token ? AuthStore.getUserByToken(token) : null;
    if (!user || user.role !== 'admin') {
      sendJson(res, 403, { error: 'Access denied. Administrator privileges required.' });
      return true;
    }

    const itemId = url.split('/')[5];
    const reset = AuthStore.resetCommunityItemRatings(itemId);
    if (reset) {
      sendJson(res, 200, { success: true, message: 'All user ratings for this item have been reset.' });
    } else {
      sendJson(res, 404, { error: 'Community item not found' });
    }
    return true;
  }

  // 7l. DELETE /api/admin/guests/:guestId (Admin clears a guest library)
  if (url.startsWith('/api/admin/guests/') && method === 'DELETE') {
    const token = getBearerToken(req);
    const user = token ? AuthStore.getUserByToken(token) : null;
    if (!user || user.role !== 'admin') {
      sendJson(res, 403, { error: 'Access denied. Administrator privileges required.' });
      return true;
    }

    const guestId = url.replace('/api/admin/guests/', '').split('?')[0];
    const deleted = AuthStore.deleteGuest(guestId);
    if (deleted) {
      sendJson(res, 200, { success: true, message: `Guest session ${guestId} removed.` });
    } else {
      sendJson(res, 404, { error: 'Guest session not found' });
    }
    return true;
  }

  // 7m. POST /api/admin/sessions/clean (Admin cleans stale sessions)
  if (url === '/api/admin/sessions/clean' && method === 'POST') {
    const token = getBearerToken(req);
    const user = token ? AuthStore.getUserByToken(token) : null;
    if (!user || user.role !== 'admin') {
      sendJson(res, 403, { error: 'Access denied. Administrator privileges required.' });
      return true;
    }

    const result = AuthStore.cleanStaleSessions();
    sendJson(res, 200, {
      success: true,
      ...result,
      message: `Cleaned ${result.removedCount} expired sessions. ${result.remainingCount} active sessions remain.`,
    });
    return true;
  }

  // 8. DELETE /api/admin/users/:userId (Admin deletes a user)
  if (url.startsWith('/api/admin/users/') && method === 'DELETE') {
    const token = getBearerToken(req);
    const user = token ? AuthStore.getUserByToken(token) : null;
    if (!user || user.role !== 'admin') {
      sendJson(res, 403, { error: 'Access denied. Administrator privileges required.' });
      return true;
    }

    const targetUserId = url.replace('/api/admin/users/', '').split('?')[0];
    if (targetUserId === user.id) {
      sendJson(res, 400, { error: 'You cannot delete your own active admin account from the admin table.' });
      return true;
    }

    const deleted = AuthStore.deleteUser(targetUserId);
    if (deleted) {
      sendJson(res, 200, { success: true, message: 'User deleted successfully.' });
    } else {
      sendJson(res, 404, { error: 'User not found.' });
    }
    return true;
  }

  // 9. GET /api/admin/users/:userId/export (Admin downloads user backup)
  if (url.match(/^\/api\/admin\/users\/[^/]+\/export/) && method === 'GET') {
    const token = getBearerToken(req);
    const user = token ? AuthStore.getUserByToken(token) : null;
    if (!user || user.role !== 'admin') {
      sendJson(res, 403, { error: 'Access denied.' });
      return true;
    }

    const targetUserId = url.split('/')[4];
    const targetUser = AuthStore.findById(targetUserId);
    if (!targetUser) {
      sendJson(res, 404, { error: 'User not found.' });
      return true;
    }

    sendJson(res, 200, {
      success: true,
      username: targetUser.username,
      data: sanitizeUserData(targetUser.data),
      exportedAt: new Date().toISOString(),
    });
    return true;
  }

  // 9b. GET /api/admin/users/:userId/data (Admin inspects detailed user library)
  if (url.match(/^\/api\/admin\/users\/[^/]+\/data$/) && method === 'GET') {
    const token = getBearerToken(req);
    const user = token ? AuthStore.getUserByToken(token) : null;
    if (!user || user.role !== 'admin') {
      sendJson(res, 403, { error: 'Access denied.' });
      return true;
    }

    const targetUserId = url.split('/')[4];
    const details = AuthStore.getUserFullData(targetUserId);
    if (!details) {
      sendJson(res, 404, { error: 'User not found' });
      return true;
    }

    sendJson(res, 200, {
      success: true,
      ...details,
    });
    return true;
  }

  // 9c. DELETE /api/admin/users/:userId/data/:category/:itemId (Admin deletes an entry from user's library)
  if (url.match(/^\/api\/admin\/users\/[^/]+\/data\/[^/]+\/[^/]+$/) && method === 'DELETE') {
    const token = getBearerToken(req);
    const user = token ? AuthStore.getUserByToken(token) : null;
    if (!user || user.role !== 'admin') {
      sendJson(res, 403, { error: 'Access denied.' });
      return true;
    }

    const parts = url.split('/');
    const targetUserId = parts[4];
    const category = parts[6] as 'coffees' | 'equipment' | 'cafes' | 'customNotes';
    const itemId = parts[7];

    const deleted = AuthStore.deleteUserItem(targetUserId, category, itemId);
    if (deleted) {
      sendJson(res, 200, { success: true, message: `Removed item from user's ${category}.` });
    } else {
      sendJson(res, 404, { error: 'Item not found in user library.' });
    }
    return true;
  }

  // 9d. POST /api/admin/users/:userId/data/:category (Admin injects an item into user's library)
  if (url.match(/^\/api\/admin\/users\/[^/]+\/data\/[^/]+$/) && method === 'POST') {
    const token = getBearerToken(req);
    const user = token ? AuthStore.getUserByToken(token) : null;
    if (!user || user.role !== 'admin') {
      sendJson(res, 403, { error: 'Access denied.' });
      return true;
    }

    const parts = url.split('/');
    const targetUserId = parts[4];
    const category = parts[6] as 'coffees' | 'equipment' | 'cafes';

    try {
      const body = await readJsonBody(req);
      const item = body.item || body;
      const created = AuthStore.addItemToUser(targetUserId, category, item);
      sendJson(res, 201, {
        success: true,
        item: created,
        message: `Successfully added to user's ${category}.`,
      });
      return true;
    } catch (err: any) {
      sendJson(res, 400, { error: err.message || 'Failed to add item to user' });
      return true;
    }
  }

  // 9e. POST /api/admin/users/:userId/clear (Admin wipes user's library items)
  if (url.match(/^\/api\/admin\/users\/[^/]+\/clear$/) && method === 'POST') {
    const token = getBearerToken(req);
    const user = token ? AuthStore.getUserByToken(token) : null;
    if (!user || user.role !== 'admin') {
      sendJson(res, 403, { error: 'Access denied.' });
      return true;
    }

    const targetUserId = url.split('/')[4];
    const cleared = AuthStore.clearUserData(targetUserId);
    if (cleared) {
      sendJson(res, 200, { success: true, message: 'User library wiped successfully.' });
    } else {
      sendJson(res, 404, { error: 'User not found.' });
    }
    return true;
  }

  // 9f. POST /api/admin/ratings/recalculate (Admin forces recalculation of all ratings)
  if (url === '/api/admin/ratings/recalculate' && method === 'POST') {
    const token = getBearerToken(req);
    const user = token ? AuthStore.getUserByToken(token) : null;
    if (!user || user.role !== 'admin') {
      sendJson(res, 403, { error: 'Access denied.' });
      return true;
    }

    try {
      const tally = AuthStore.recalculateAllRatings();
      sendJson(res, 200, {
        success: true,
        ...tally,
        message: `Recalculated ratings for ${tally.recalculatedCoffees} coffees, ${tally.recalculatedEquipment} gear, and ${tally.recalculatedCafes} cafes.`,
      });
      return true;
    } catch (err: any) {
      sendJson(res, 500, { error: err.message || 'Failed to recalculate ratings' });
      return true;
    }
  }

  // 9d. POST /api/admin/system/reset (Emergency Full System Purge: removes non-admin users, guest sessions, and reverts all community coffees/equipment/cafes to 0)
  if (url === '/api/admin/system/reset' && method === 'POST') {
    const token = getBearerToken(req);
    const user = token ? AuthStore.getUserByToken(token) : null;
    if (!user || user.role !== 'admin') {
      sendJson(res, 403, { error: 'Access denied. Administrator privileges required.' });
      return true;
    }

    try {
      const summary = AuthStore.emergencySystemReset();
      sendJson(res, 200, {
        success: true,
        summary,
        message: `Emergency reset complete. Reverted stored community registry to 0 (${summary.removedCoffees} coffees, ${summary.removedEquipment} equipment, ${summary.removedCafes} cafes). Purged ${summary.removedUsers} non-admin accounts and ${summary.removedGuests} guest sessions.`,
      });
      return true;
    } catch (err: any) {
      sendJson(res, 500, { error: err.message || 'Failed to execute emergency system reset' });
      return true;
    }
  }

  // 10. GET /api/community/items (Running list of registered items with general ratings)
  if (url === '/api/community/items' && method === 'GET') {
    try {
      const coffees = AuthStore.getRegisteredCoffees();
      const equipment = AuthStore.getRegisteredEquipment();
      const cafes = AuthStore.getRegisteredCafes();
      sendJson(res, 200, {
        success: true,
        coffees,
        equipment,
        cafes,
      });
      return true;
    } catch (err: any) {
      sendJson(res, 500, { error: err.message || 'Failed to fetch community items' });
      return true;
    }
  }

  // 10b. POST /api/community/items/register (Register or rate an item directly - registered users only)
  if (url === '/api/community/items/register' && method === 'POST') {
    try {
      const body = await readJsonBody(req);
      const { type = 'coffee', item, rating, tastingNotes, onlyIfExisting = false } = body;
      if (!item || !item.name) {
        sendJson(res, 400, { error: 'Item with name is required' });
        return true;
      }
      const token = getBearerToken(req);
      const user = token ? AuthStore.getUserByToken(token) : null;
      if (!user) {
        // General information applies ONLY to registered accounts
        sendJson(res, 200, {
          success: true,
          message: 'General community information is restricted to registered accounts only. Please sign in to contribute evaluations.',
          registered: null,
        });
        return true;
      }
      const registered = AuthStore.recordCommunityItem(
        type,
        item,
        user.id,
        rating,
        tastingNotes,
        Boolean(onlyIfExisting)
      );
      sendJson(res, 200, {
        success: true,
        registered,
      });
      return true;
    } catch (err: any) {
      sendJson(res, 500, { error: err.message || 'Failed to register item in community catalog' });
      return true;
    }
  }

  // 11. POST /api/community/unify (Attempt name unification against registered items)
  if (url === '/api/community/unify' && method === 'POST') {
    try {
      const body = await readJsonBody(req);
      const { query, type = 'coffee', roasterOrBrand } = body;
      if (!query || typeof query !== 'string') {
        sendJson(res, 400, { error: 'Query is required' });
        return true;
      }

      const result = AuthStore.unifyItem(query, type, roasterOrBrand);
      sendJson(res, 200, {
        success: true,
        ...result,
      });
      return true;
    } catch (err: any) {
      sendJson(res, 500, { error: err.message || 'Failed to unify item name' });
      return true;
    }
  }

  if (next) {
    next();
  }
  return false;
}
