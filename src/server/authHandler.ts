import type { IncomingMessage, ServerResponse } from 'http';
import { AuthStore } from './authStore.ts';

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

  // 7. GET /api/admin/users (View all registered users)
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
      data: targetUser.data,
      exportedAt: new Date().toISOString(),
    });
    return true;
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

  // 10b. POST /api/community/items/register (Register or rate an item directly)
  if (url === '/api/community/items/register' && method === 'POST') {
    try {
      const body = await readJsonBody(req);
      const { type = 'coffee', item, rating } = body;
      if (!item || !item.name) {
        sendJson(res, 400, { error: 'Item with name is required' });
        return true;
      }
      const token = getBearerToken(req);
      const user = token ? AuthStore.getUserByToken(token) : null;
      const registered = AuthStore.recordCommunityItem(type, item, user?.id || 'community-user', rating);
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
