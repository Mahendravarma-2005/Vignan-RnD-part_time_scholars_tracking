/**
 * VFSTR Ph.D Part-Time Research Scholar Tracking Portal
 * Local Development & Production Server
 *
 * Runs locally without needing Vercel CLI.
 * Serves static assets from /public (and root fallback) and mounts serverless /api routes.
 */

try {
  require('dotenv').config();
} catch (e) {
  // dotenv optional if env vars are passed directly
}

const http = require('http');
const fs = require('fs');
const path = require('path');
const { URL } = require('url');

const PORT = parseInt(process.env.PORT || '3000', 10);
const PUBLIC_DIR = path.join(__dirname, 'public');
const ROOT_DIR = __dirname;

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf'
};

// Route handlers
const routes = {
  '/api/part-time-scholars': require('./api/part-time-scholars.js'),
  '/api/part-time-profiles': require('./api/part-time-profiles.js'),
  '/api/auth/otp/send': require('./api/auth/otp/send.js'),
  '/api/auth/otp/verify': require('./api/auth/otp/verify.js'),
  '/api/part-time-admin/login': require('./api/part-time-admin/login.js'),
  dynamic: [
    {
      pattern: /^\/api\/part-time-profile\/([^\/]+)$/i,
      paramName: 'regNo',
      handler: require('./api/part-time-profile/[regNo].js')
    },
    {
      pattern: /^\/api\/part-time-scholar-submissions\/([^\/]+)$/i,
      paramName: 'regNo',
      handler: require('./api/part-time-scholar-submissions/[regNo].js')
    }
  ]
};

// Helper: parse request body
function parseRequestBody(req) {
  return new Promise((resolve) => {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk;
      if (body.length > 5 * 1024 * 1024) { // 5MB limit
        req.destroy();
        resolve({});
      }
    });
    req.on('end', () => {
      if (!body) return resolve({});
      try {
        resolve(JSON.parse(body));
      } catch {
        try {
          resolve(Object.fromEntries(new URLSearchParams(body)));
        } catch {
          resolve({});
        }
      }
    });
    req.on('error', () => resolve({}));
  });
}

// Enhance Response object to match Express/Vercel serverless conventions
function enhanceResponse(res) {
  res.status = function (code) {
    res.statusCode = code;
    return res;
  };
  res.json = function (obj) {
    if (!res.headersSent) {
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
    }
    res.end(JSON.stringify(obj));
    return res;
  };
  res.send = function (data) {
    res.end(data);
    return res;
  };
  return res;
}

// CORS Headers
function setCorsHeaders(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
}

// Locate static file in public/ or root
function resolveStaticFilePath(urlPath) {
  let clean = decodeURIComponent(urlPath.split('?')[0]);
  if (clean === '/' || clean === '') clean = '/index.html';

  const safePath = path.normalize(clean).replace(/^(\.\.[\/\\])+/, '');
  const publicCandidate = path.join(PUBLIC_DIR, safePath);
  if (fs.existsSync(publicCandidate) && fs.statSync(publicCandidate).isFile()) {
    return publicCandidate;
  }

  const rootCandidate = path.join(ROOT_DIR, safePath);
  if (fs.existsSync(rootCandidate) && fs.statSync(rootCandidate).isFile()) {
    return rootCandidate;
  }

  return null;
}

const server = http.createServer(async (req, res) => {
  enhanceResponse(res);
  setCorsHeaders(res);

  if (req.method === 'OPTIONS') {
    res.statusCode = 204;
    return res.end();
  }

  const reqUrl = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  const pathname = reqUrl.pathname;

  // Populate req.query
  req.query = Object.fromEntries(reqUrl.searchParams);

  // Redirect /admin to /#admin
  if (pathname === '/admin' || pathname === '/admin/') {
    res.statusCode = 302;
    res.setHeader('Location', '/#admin');
    return res.end();
  }

  // 1. API Routes Handling
  if (pathname.startsWith('/api/')) {
    try {
      req.body = await parseRequestBody(req);

      // Exact route match
      if (routes[pathname]) {
        return await routes[pathname](req, res);
      }

      // Dynamic pattern matches
      for (const dyn of routes.dynamic) {
        const match = pathname.match(dyn.pattern);
        if (match) {
          req.query[dyn.paramName] = decodeURIComponent(match[1]);
          return await dyn.handler(req, res);
        }
      }

      // Not found in API routes
      return res.status(404).json({ success: false, message: `API route ${pathname} not found.` });
    } catch (err) {
      console.error(`Error processing ${pathname}:`, err);
      return res.status(500).json({ success: false, message: err.message || 'Internal Server Error' });
    }
  }

  // 2. Static File Serving
  const filePath = resolveStaticFilePath(pathname);

  if (filePath) {
    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    // Inject client-side Supabase keys into index.html if available
    if (ext === '.html') {
      try {
        let html = fs.readFileSync(filePath, 'utf8');
        const supabaseUrl = (process.env.SUPABASE_URL || '').replace(/\/rest\/v1\/?$/, '').replace(/\/+$/, '');
        const supabaseAnon = process.env.SUPABASE_ANON_KEY || '';

        const injection = `
  <script>
    window.__SUPABASE_URL__ = ${JSON.stringify(supabaseUrl)};
    window.__SUPABASE_ANON_KEY__ = ${JSON.stringify(supabaseAnon)};
  </script>
</head>`;

        html = html.replace('</head>', injection);
        res.setHeader('Content-Type', contentType);
        return res.end(html);
      } catch (err) {
        console.error('Error serving HTML:', err);
      }
    }

    res.setHeader('Content-Type', contentType);
    return fs.createReadStream(filePath).pipe(res);
  }

  // Fallback to index.html for client-side routing if requested
  const indexHtmlPath = resolveStaticFilePath('/index.html');
  if (indexHtmlPath && !pathname.includes('.')) {
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    return fs.createReadStream(indexHtmlPath).pipe(res);
  }

  res.statusCode = 404;
  res.setHeader('Content-Type', 'text/plain; charset=utf-8');
  res.end('404 Not Found');
});

server.listen(PORT, () => {
  const supabaseConfigured = Boolean(process.env.SUPABASE_URL && (process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY));
  console.log('\n' + '='.repeat(60));
  console.log(' 🎓 VFSTR Ph.D Part-Time Research Scholar Tracking Portal');
  console.log('='.repeat(60));
  console.log(` 🌐 Server running at:     http://localhost:${PORT}`);
  console.log(` 📂 Serving static files:  ${PUBLIC_DIR}`);
  console.log(` ⚡ API endpoints:         Mounted at /api/*`);
  console.log(` 🗄️  Supabase Database:     ${supabaseConfigured ? 'Connected (via .env)' : 'Offline / Demo fallback'}`);
  console.log(` 🔑 Admin Credentials:     ${process.env.ADMIN_EMAIL || 'dean_rd@vignan.ac.in'} / ${process.env.ADMIN_PASSWORD || 'passowrd123'}`);
  console.log('='.repeat(60) + '\n');
});
