import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import svgr from 'vite-plugin-svgr';
import fs from 'fs';
import path from 'path';

// Middleware for local CRUD operations on links.json
const linksMiddleware = {
  name: 'links-api',
  configureServer(server) {
    return () => {
      server.middlewares.use('/api/save-links', express.json(), (req, res) => {
        if (req.method === 'POST') {
          const linksPath = path.join(process.cwd(), 'public/links.json');
          try {
            fs.writeFileSync(linksPath, JSON.stringify(req.body, null, 2));
            res.end(JSON.stringify({ success: true, message: 'Links saved successfully' }));
          } catch (err) {
            res.statusCode = 500;
            res.end(JSON.stringify({ success: false, error: err.message }));
          }
        }
      });
    };
  },
};

// Custom middleware without express dependency
const customLinksMiddleware = {
  name: 'links-api-custom',
  configureServer(server) {
    return () => {
      // Handle /api/save-links
      server.middlewares.use('/api/save-links', (req, res, next) => {
        if (req.method === 'POST') {
          let body = '';
          req.on('data', chunk => {
            body += chunk.toString();
          });
          req.on('end', () => {
            const linksPath = path.join(process.cwd(), 'public/links.json');
            try {
              const data = JSON.parse(body);
              fs.writeFileSync(linksPath, JSON.stringify(data, null, 2));
              res.writeHead(200, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ success: true, message: 'Links saved successfully' }));
            } catch (err) {
              res.writeHead(500, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ success: false, error: err.message }));
            }
          });
        } else {
          next();
        }
      });

      // Handle /api/save-deleted-links
      server.middlewares.use('/api/save-deleted-links', (req, res, next) => {
        if (req.method === 'POST') {
          let body = '';
          req.on('data', chunk => {
            body += chunk.toString();
          });
          req.on('end', () => {
            const deletedPath = path.join(process.cwd(), 'public/recently-deleted.json');
            try {
              const data = JSON.parse(body);
              fs.writeFileSync(deletedPath, JSON.stringify(data, null, 2));
              res.writeHead(200, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ success: true, message: 'Deleted links saved successfully' }));
            } catch (err) {
              res.writeHead(500, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ success: false, error: err.message }));
            }
          });
        } else {
          next();
        }
      });

      // Handle /api/save-tags
      server.middlewares.use('/api/save-tags', (req, res, next) => {
        if (req.method === 'POST') {
          let body = '';
          req.on('data', chunk => {
            body += chunk.toString();
          });
          req.on('end', () => {
            const tagsPath = path.join(process.cwd(), 'public/tags.json');
            try {
              const data = JSON.parse(body);
              fs.writeFileSync(tagsPath, JSON.stringify(data, null, 2));
              res.writeHead(200, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ success: true, message: 'Tags saved successfully' }));
            } catch (err) {
              res.writeHead(500, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ success: false, error: err.message }));
            }
          });
        } else {
          next();
        }
      });

      // Handle /api/save-workflows
      server.middlewares.use('/api/save-workflows', (req, res, next) => {
        if (req.method === 'POST') {
          let body = '';
          req.on('data', chunk => {
            body += chunk.toString();
          });
          req.on('end', () => {
            const workflowsPath = path.join(process.cwd(), 'public/workflows.json');
            try {
              const data = JSON.parse(body);
              fs.writeFileSync(workflowsPath, JSON.stringify(data, null, 2));
              res.writeHead(200, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ success: true, message: 'Workflows saved successfully' }));
            } catch (err) {
              res.writeHead(500, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ success: false, error: err.message }));
            }
          });
        } else {
          next();
        }
      });
    };
  },
};

export default defineConfig({
  base: '/', // Change to '/cityu-internal-links/' for GitHub Pages subdirectory deployment
  plugins: [react(), svgr(), customLinksMiddleware],
  build: {
    outDir: 'dist',
    sourcemap: false,
  },
});
