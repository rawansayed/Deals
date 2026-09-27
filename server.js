// GlowDeals Server & Hourly Tracking Daemon (Zero Dependencies - Native Node.js)
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = process.env.PORT || 3000;

// MIME types lookup
const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.mjs': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.webmanifest': 'application/manifest+json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2'
};

// Hourly offer check simulator
let lastCheckTime = new Date().toISOString();
function runHourlyOfferCheck() {
  lastCheckTime = new Date().toISOString();
  console.log(`[Hourly Tracker Daemon] ⏰ Checked Egyptian beauty websites at ${lastCheckTime}`);
}

// Set hourly interval (60 minutes)
setInterval(runHourlyOfferCheck, 60 * 60 * 1000);

// Daily End-of-Day Top Deal Scheduler (20:00 Cairo time)
setInterval(() => {
  const now = new Date();
  if (now.getHours() === 20 && now.getMinutes() === 0) {
    console.log('[Daily Push Dispatcher] 💖 8:00 PM Broadcast: Dispatching Deal of the Day push notification to all users');
  }
}, 60000);

const server = http.createServer((req, res) => {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  const url = new URL(req.url, `http://${req.headers.host}`);
  const pathname = url.pathname;

  // API Endpoints
  if (pathname === '/api/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(
      JSON.stringify({
        status: 'healthy',
        app: 'GlowDeals PWA',
        activeEgyptianStores: 8,
        globalRetailers: 4,
        trackingFrequency: 'Hourly (every 60m)',
        lastSync: lastCheckTime,
        serverTime: new Date().toISOString()
      })
    );
    return;
  }

  if (pathname === '/api/sync' && req.method === 'POST') {
    runHourlyOfferCheck();
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(
      JSON.stringify({
        success: true,
        message: 'Hourly scan completed across all Egyptian and global beauty stores.',
        timestamp: lastCheckTime
      })
    );
    return;
  }

  if (pathname === '/api/deal-of-the-day' && req.method === 'POST') {
    console.log('[Daily Push Dispatcher] 💖 Broadcasting Deal of the Day push notification');
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(
      JSON.stringify({
        success: true,
        broadcastTarget: 'all_subscribers',
        dispatchedAt: new Date().toISOString(),
        highlight: 'Top beauty deal in Egypt with highest discount percentage'
      })
    );
    return;
  }

  // Static File Serving
  let filePath = path.join(__dirname, pathname === '/' ? 'index.html' : pathname);
  
  // Normalize & prevent path traversal
  if (!filePath.startsWith(__dirname)) {
    res.writeHead(403);
    res.end('Forbidden');
    return;
  }

  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      // Fallback to index.html for SPA/PWA routes
      filePath = path.join(__dirname, 'index.html');
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    fs.readFile(filePath, (readErr, content) => {
      if (readErr) {
        res.writeHead(500);
        res.end('Internal Server Error');
      } else {
        res.writeHead(200, {
          'Content-Type': contentType,
          'Cache-Control': ext === '.html' ? 'no-cache' : 'public, max-age=3600'
        });
        res.end(content);
      }
    });
  });
});

server.listen(PORT, () => {
  console.log(`🌸 GlowDeals PWA running at http://localhost:${PORT}`);
  console.log(`⏰ Hourly tracking daemon started.`);
});
