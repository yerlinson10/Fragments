#!/usr/bin/env node

/**
 * Servidor HTTP simple para desarrollo de Fragments
 * Sirve archivos estáticos con soporte para módulos ES6
 */

const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 3000;
const HOST = 'localhost';

// Tipos MIME
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
  // Remover query string de la URL
  const url = new URL(req.url, `http://${req.headers.host}`);
  let filePath = '.' + url.pathname;
  
  // Página por defecto
  if (filePath === './') {
    filePath = './index.html';
  }
  
  const extname = String(path.extname(filePath)).toLowerCase();
  const contentType = mimeTypes[extname] || 'application/octet-stream';
  
  fs.readFile(filePath, (error, content) => {
    if (error) {
      if (error.code === 'ENOENT') {
        console.log(`❌ 404: ${url.pathname} -> ${filePath}`);
        res.writeHead(404, { 'Content-Type': 'text/html' });
        res.end('<h1>404 - Archivo no encontrado</h1><p>Ruta solicitada: ' + url.pathname + '</p><p>Ruta buscada: ' + filePath + '</p>', 'utf-8');
      } else {
        console.error('Error del servidor:', error);
        res.writeHead(500);
        res.end('Error del servidor: ' + error.code, 'utf-8');
      }
    } else {
      console.log(`✅ 200: ${url.pathname}`);
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(content, 'utf-8');
    }
  });
});

server.listen(PORT, HOST, () => {
  console.log('🚀 Servidor Fragments iniciado');
  console.log(`📍 URL: http://${HOST}:${PORT}`);
  console.log('');
  console.log('📝 Páginas disponibles:');
  console.log(`   - http://${HOST}:${PORT}/index.html (Juego)`);
  console.log(`   - http://${HOST}:${PORT}/story-selector.html (Selector de historias)`);
  console.log(`   - http://${HOST}:${PORT}/story-editor.html (Editor visual)`);
  console.log(`   - http://${HOST}:${PORT}/game.html (Modo juego)`);
  console.log('');
  console.log('⌨️  Presiona Ctrl+C para detener el servidor');
});
