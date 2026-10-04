import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { populateItemOnline } from './src/server/aiPopulate.ts';
import { matchItemAgainstCatalog } from './src/server/aiCatalogMatcher.ts';
import { AuthStore } from './src/server/authStore.ts';
import { handleAuthRoutes } from './src/server/authHandler.ts';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
// Nginx listens on 8080 and reverse-proxies to port 3000 (DEFAULT_APP_PORT).
// The backend server must always listen on port 3000.
const port = 3000;

app.use(express.json());

// Health check endpoints for container readiness probes
app.get('/health', (_req, res) => res.status(200).send('OK'));
app.get('/healthz', (_req, res) => res.status(200).send('OK'));

// Auth, User Accounts, and Admin endpoints
app.use(async (req, res, next) => {
  const url = req.url || '';
  if (
    url.startsWith('/api/auth') ||
    url.startsWith('/api/user') ||
    url.startsWith('/api/guest') ||
    url.startsWith('/api/admin') ||
    url.startsWith('/api/community')
  ) {
    const handled = await handleAuthRoutes(req, res, next);
    if (handled) return;
  }
  next();
});

// Endpoint: Auto-populate coffee, equipment, cafe, or note from web information
app.post('/api/ai/populate', async (req, res) => {
  try {
    const { itemType, name } = req.body;

    if (!name || typeof name !== 'string' || !name.trim()) {
      return res.status(400).json({ error: 'Item name is required' });
    }

    const item = await populateItemOnline(itemType, name.trim());
    return res.json({ success: true, item });
  } catch (error: any) {
    console.error('AI Auto-Populate Error:', error);
    return res.status(500).json({
      error: 'Failed to auto-populate item from online information.',
      details: error?.message || String(error),
    });
  }
});

// Endpoint: AI-assisted catalog deduplication & similarity matcher
app.post('/api/ai/match-catalog', async (req, res) => {
  try {
    const { itemType, candidateItem, catalogItems } = req.body;

    if (!itemType || !candidateItem || !candidateItem.name) {
      return res.status(400).json({ error: 'itemType and candidateItem are required' });
    }

    // Determine catalog items pool: use provided or query AuthStore
    let pool = Array.isArray(catalogItems) && catalogItems.length > 0 ? catalogItems : [];
    if (pool.length === 0) {
      if (itemType === 'coffee') pool = AuthStore.getRegisteredCoffees();
      else if (itemType === 'equipment') pool = AuthStore.getRegisteredEquipment();
      else if (itemType === 'cafe') pool = AuthStore.getRegisteredCafes();
    }

    const matchResult = await matchItemAgainstCatalog(itemType, candidateItem, pool);
    return res.json({
      success: true,
      ...matchResult,
    });
  } catch (error: any) {
    console.error('AI Catalog Matcher Error:', error);
    return res.status(500).json({
      error: 'Failed to perform AI catalog similarity check.',
      hasCloseMatch: false,
      confidence: 'low',
      explanation: '',
      matches: [],
    });
  }
});

// Serve frontend: Vite middlewares in dev, static dist/ in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.resolve(__dirname, 'dist')));
  app.get('*', (_req, res) => {
    res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
  });
} else {
  const { createServer: createViteServer } = await import('vite');
  const vite = await createViteServer({
    server: { middlewareMode: true },
    appType: 'spa',
  });
  app.use(vite.middlewares);
}

app.listen(port, '0.0.0.0', () => {
  console.log(`Server listening on http://0.0.0.0:${port}`);
});
