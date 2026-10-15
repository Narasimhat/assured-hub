import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const distDir = path.resolve(__dirname, '..', 'dist');

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.mjs': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.ab1': 'application/octet-stream',
  '.webmanifest': 'application/manifest+json'
};

const port = process.env.PORT || 3000;

const server = http.createServer((req, res) => {
  let reqPath = decodeURIComponent(req.url.split('?')[0]);

  if (reqPath === '/qc' || reqPath === '/design' || reqPath === '/studio' || reqPath === '/academy') {
    res.writeHead(301, { Location: `${reqPath}/` });
    res.end();
    return;
  }

  let filePath = path.join(distDir, reqPath);

  if (fs.existsSync(filePath) && fs.statSync(filePath).isDirectory()) {
    filePath = path.join(filePath, 'index.html');
  } else if (!path.extname(filePath) && fs.existsSync(filePath + '.html')) {
    filePath = filePath + '.html';
  }

  if (fs.existsSync(filePath) && !fs.statSync(filePath).isDirectory()) {
    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';
    res.writeHead(200, { 'Content-Type': contentType });
    fs.createReadStream(filePath).pipe(res);
  } else {
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end(`404 Not Found: ${reqPath}`);
  }
});

server.listen(port, () => {
  console.log(`ASSURED Hub preview running at http://localhost:${port}`);
  console.log(`  - Hub:     http://localhost:${port}/`);
  console.log(`  - Studio:  http://localhost:${port}/studio/`);
  console.log(`  - Design:  http://localhost:${port}/design/`);
  console.log(`  - QC:      http://localhost:${port}/qc/`);
  console.log(`  - Academy: http://localhost:${port}/academy/`);
});
