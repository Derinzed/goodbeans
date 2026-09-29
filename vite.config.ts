import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig, Plugin } from 'vite';
import { populateItemOnline } from './src/server/aiPopulate.ts';
import { handleAuthRoutes } from './src/server/authHandler.ts';

function apiPlugin(): Plugin {
  return {
    name: 'api-plugin',
    configureServer(server) {
      // Auth, User Data, and Admin routes
      server.middlewares.use(async (req, res, next) => {
        const url = req.url || '';
        if (
          url.startsWith('/api/auth') ||
          url.startsWith('/api/user') ||
          url.startsWith('/api/admin') ||
          url.startsWith('/api/community')
        ) {
          const handled = await handleAuthRoutes(req, res, next);
          if (handled) return;
        }
        next();
      });

      // AI Populate endpoint
      server.middlewares.use('/api/ai/populate', async (req, res) => {
        if (req.method !== 'POST') {
          res.statusCode = 405;
          return res.end();
        }

        let body = '';
        req.on('data', (chunk) => {
          body += chunk;
        });

        req.on('end', async () => {
          try {
            const { itemType, name } = JSON.parse(body || '{}');
            if (!name || typeof name !== 'string' || !name.trim()) {
              res.statusCode = 400;
              res.setHeader('Content-Type', 'application/json');
              return res.end(JSON.stringify({ error: 'Item name is required' }));
            }

            const item = await populateItemOnline(itemType, name.trim());
            res.statusCode = 200;
            res.setHeader('Content-Type', 'application/json');
            return res.end(JSON.stringify({ success: true, item }));
          } catch (err: any) {
            console.error('API error in Vite dev server plugin:', err);
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json');
            return res.end(JSON.stringify({ error: err.message || 'Server error' }));
          }
        });
      });
    },
  };
}

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss(), apiPlugin()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
