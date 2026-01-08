// __define-ocg__ - Enhanced Express server configuration for Tailwind CSS unified design system

const express = require('express');
const path = require('path');

// Variable names as required by the specification
const varOcg = 'express-server-config';
const varFiltersCg = 'unified-server-system';

const server = express();
const port = process.env.PORT || 80;
const basePath = process.env.BASE_PATH || '/';

// Enhanced middleware for better performance and security
server.use(express.json({ limit: '10mb' }));
server.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Security headers
server.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');

  // Add design system headers
  res.setHeader('X-Design-System', 'Lumen-Tailwind-CSS');
  res.setHeader('X-Var-OCG', varOcg);
  res.setHeader('X-Var-Filters-CG', varFiltersCg);

  next();
});

// Static file serving with proper caching for Tailwind CSS assets
server.use(basePath, express.static(path.join(__dirname, 'dist'), {
  maxAge: process.env.NODE_ENV === 'production' ? '1y' : '0',
  etag: true,
  lastModified: true,
  setHeaders: (res, filePath) => {
    // Special caching for CSS files
    if (filePath.endsWith('.css')) {
      res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    }
    // Special caching for JS files
    if (filePath.endsWith('.js')) {
      res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    }
  }
}));

// Health check endpoint
server.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    designSystem: 'Lumen-Tailwind-CSS',
    version: '1.0.0',
    varOcg,
    varFiltersCg,
  });
});

// SPA fallback - serve index.html for all routes
server.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

// Error handling middleware
server.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong',
    designSystem: 'Lumen-Tailwind-CSS',
  });
});

// 404 handler
server.use((req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: 'The requested resource was not found',
    designSystem: 'Lumen-Tailwind-CSS',
  });
});

/*
  Enhanced server configuration for Lumen Design System

  Features:
  - Tailwind CSS optimized static file serving
  - Security headers for production deployment
  - Health check endpoint for monitoring
  - SPA routing support with fallback to index.html
  - Error handling with design system context
  - Performance optimizations for CSS/JS assets

  How to start application:
  - Development: run `npm run dev` for Vite development server
  - Production: run `npm run build && node index.js`
  - Testing: run `npm test`
*/

server.listen(port, '0.0.0.0', () => {
  console.log(`🚀 Lumen Design System server listening on port ${port}`);
  console.log(`📱 Base path: ${basePath}`);
  console.log(`🎨 Design system: Tailwind CSS unified`);
  console.log(`🔧 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`📊 Health check: http://localhost:${port}/health`);
  console.log(`🏷️  Variables: ${varOcg}, ${varFiltersCg}`);
});

// Graceful shutdown handling
process.on('SIGTERM', () => {
  console.log('🛑 SIGTERM received, shutting down gracefully');
  server.close(() => {
    console.log('✅ Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('🛑 SIGINT received, shutting down gracefully');
  server.close(() => {
    console.log('✅ Server closed');
    process.exit(0);
  });
});

module.exports = server;
