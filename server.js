#!/usr/bin/env node

/**
 * Servidor HTTP para Fragments v2.0
 * Compatible con estructura antigua y nueva
 */

const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 3000;
const HOST = 'localhost';

const mimeTypes = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.mjs': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon'
};

const server = http.createServer((req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  let filePath = '.' + url.pathname;
  
  // Mapeo de rutas antiguas y nuevas
  const routeMap = {
    '/': './public/index.html',
    '/index': './public/index.html',
    '/game': './public/game.html',
    '/selector': './views/selector.html',
    '/editor': './views/editor.html',
    // Compatibilidad con URLs antiguas
    '/story-selector.html': './views/selector.html',
    '/story-editor.html': './views/editor.html'
  };
  
  // Aplicar mapeo de rutas
  if (routeMap[url.pathname]) {
    filePath = routeMap[url.pathname];
  }
  // Si no existe en la raíz, intentar en public/
  else if (!fs.existsSync(filePath)) {
    const publicPath = './public' + url.pathname;
    if (fs.existsSync(publicPath)) {
      filePath = publicPath;
    } else {
      // Intentar en views/
      const viewsPath = './views' + url.pathname;
      if (fs.existsSync(viewsPath)) {
        filePath = viewsPath;
      }
    }
  }
  
  const extname = String(path.extname(filePath)).toLowerCase();
  const contentType = mimeTypes[extname] || 'application/octet-stream';
  
  fs.readFile(filePath, (error, content) => {
    if (error) {
      if (error.code === 'ENOENT') {
        console.log(`❌ 404: ${url.pathname}`);
        res.writeHead(404, { 'Content-Type': 'text/html' });
        res.end('<h1>404 - Archivo no encontrado</h1><p>Ruta: ' + url.pathname + '</p>', 'utf-8');
      } else {
        console.error('Error:', error);
        res.writeHead(500);
        res.end('Error del servidor', 'utf-8');
      }
    } else {
      console.log(`✅ 200: ${url.pathname}`);
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(content, 'utf-8');
    }
  });
});

server.listen(PORT, HOST, () => {
  console.log('🚀 Servidor Fragments v2.0');
  console.log(`📍 http://${HOST}:${PORT}`);
  console.log('');
  console.log('📝 Páginas:');
  console.log(`   - http://${HOST}:${PORT}/ (o /index)`);
  console.log(`   - http://${HOST}:${PORT}/game`);
  console.log(`   - http://${HOST}:${PORT}/selector`);
  console.log(`   - http://${HOST}:${PORT}/editor`);
  console.log('');
  console.log('📂 Nueva estructura creada en: public/, views/, src/, docs/');
  console.log('📄 Ver detalles: MIGRATION_STATUS.md');
  console.log('');
  console.log('⌨️  Ctrl+C para detener');
});
