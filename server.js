#!/usr/bin/env node

/**
 * Servidor HTTP para Fragments v2.0
 * Usando Express.js para routing limpio
 */

const express = require('express');
const path = require('path');

const app = express();
const PORT = 3000;
const HOST = 'localhost';

// Middleware para logging
app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`);
  next();
});

// Servir archivos estáticos desde múltiples carpetas
app.use('/css', express.static(path.join(__dirname, 'public/css')));
app.use('/js', express.static(path.join(__dirname, 'public/js')));
app.use('/assets', express.static(path.join(__dirname, 'public/assets')));
app.use('/engine', express.static(path.join(__dirname, 'engine')));
app.use('/stories', express.static(path.join(__dirname, 'stories')));
app.use('/node_modules', express.static(path.join(__dirname, 'node_modules')));
app.use('/docs', express.static(path.join(__dirname, 'docs')));

// Rutas principales (URLs limpias)
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public/index.html'));
});

app.get('/index', (req, res) => {
  res.sendFile(path.join(__dirname, 'public/index.html'));
});

app.get('/game', (req, res) => {
  res.sendFile(path.join(__dirname, 'public/game.html'));
});

app.get('/selector', (req, res) => {
  res.sendFile(path.join(__dirname, 'views/selector.html'));
});

app.get('/editor', (req, res) => {
  res.sendFile(path.join(__dirname, 'views/editor.html'));
});

// Rutas de compatibilidad (URLs antiguas con preservación de query params)
app.get('/index.html', (req, res) => {
  const queryString = req.url.includes('?') ? req.url.split('?')[1] : '';
  res.redirect('/' + (queryString ? '?' + queryString : ''));
});

app.get('/game.html', (req, res) => {
  const queryString = req.url.includes('?') ? req.url.split('?')[1] : '';
  res.redirect('/game' + (queryString ? '?' + queryString : ''));
});

app.get('/story-selector.html', (req, res) => {
  const queryString = req.url.includes('?') ? req.url.split('?')[1] : '';
  res.redirect('/selector' + (queryString ? '?' + queryString : ''));
});

app.get('/story-editor.html', (req, res) => {
  const queryString = req.url.includes('?') ? req.url.split('?')[1] : '';
  res.redirect('/editor' + (queryString ? '?' + queryString : ''));
});

// Manejo de 404
app.use((req, res) => {
  console.log(`❌ 404: ${req.url}`);
  res.status(404).send('<h1>404 - Página no encontrada</h1><p>Ruta: ' + req.url + '</p>');
});

// Iniciar servidor
app.listen(PORT, HOST, () => {
  console.log('🚀 Servidor Fragments v2.0 (Express)');
  console.log(`📍 http://${HOST}:${PORT}`);
  console.log('');
  console.log('📝 Páginas:');
  console.log(`   - http://${HOST}:${PORT}/ (landing)`);
  console.log(`   - http://${HOST}:${PORT}/game`);
  console.log(`   - http://${HOST}:${PORT}/selector`);
  console.log(`   - http://${HOST}:${PORT}/editor`);
  console.log('');
  console.log('� Rutas antiguas redirigen automáticamente');
  console.log('� Archivos estáticos en: public/, views/, engine/, stories/');
  console.log('');
  console.log('⌨️  Ctrl+C para detener');
});
