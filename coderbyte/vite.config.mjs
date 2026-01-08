import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// __define-ocg__ - Enhanced Vite configuration for Tailwind CSS and unified design system

const basePath = process.env.BASE_PATH || '/';
const port = process.env.PORT || 80;

// Variable names as required by the specification
const varOcg = 'vite-tailwind-config';
const varFiltersCg = 'unified-build-system';

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react({
      // Enhanced React plugin configuration
      jsxImportSource: '@emotion/react',
      babel: {
        plugins: [
          // Add any Babel plugins needed for Tailwind CSS
        ],
      },
    }),
  ],
  base: basePath,

  // Enhanced resolve configuration
  resolve: {
    alias: {
      // React Native Web compatibility
      "react-native": "react-native-web",

      // Path aliases for better imports
      '@': path.resolve(__dirname, './src'),
      '@components': path.resolve(__dirname, './src/components'),
      '@pages': path.resolve(__dirname, './src/pages'),
      '@ui': path.resolve(__dirname, './src/ui'),
      '@styles': path.resolve(__dirname, './src/styles'),
      '@utils': path.resolve(__dirname, './src/utils'),
      '@hooks': path.resolve(__dirname, './src/hooks'),
      '@assets': path.resolve(__dirname, './src/assets'),
      '@types': path.resolve(__dirname, './src/types'),
    }
  },

  // Environment variables configuration
  define: {
    'process.env': 'import.meta.env',
    // Add design system variables
    __DESIGN_SYSTEM_VERSION__: JSON.stringify('1.0.0'),
    __TAILWIND_CONFIG__: JSON.stringify(varOcg),
    __FILTER_SYSTEM__: JSON.stringify(varFiltersCg),
  },

  // Enhanced ESBuild configuration for better performance
  esbuild: {
    loader: "jsx",
    include: /src\/.*\.[jt]sx?$/,
    exclude: [],
    // Enable JSX automatic runtime
    jsxInject: `import React from 'react'`,
  },

  // Optimized dependencies for better performance
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      // Pre-bundle commonly used libraries
    ],
    esbuildOptions: {
      loader: {
        '.js': 'jsx',
      },
      // Target modern browsers for better performance
      target: 'es2020',
    },
  },

  // Enhanced build configuration
  build: {
    // Target modern browsers
    target: 'es2020',

    // Optimize chunk splitting
    rollupOptions: {
      output: {
        manualChunks: {
          // Separate vendor chunks for better caching
          vendor: ['react', 'react-dom'],
          router: ['react-router-dom'],
          // Separate Tailwind CSS if using JIT
          styles: ['tailwindcss'],
        },
      },
    },

    // Enable source maps for debugging
    sourcemap: process.env.NODE_ENV === 'development',

    // Optimize for production
    minify: 'esbuild',

    // Asset handling
    assetsDir: 'assets',

    // Chunk size warnings
    chunkSizeWarningLimit: 1000,
  },

  // Enhanced CSS configuration for Tailwind
  css: {
    // PostCSS configuration
    postcss: {
      plugins: [
        // Tailwind CSS processing
        require('tailwindcss'),
        require('autoprefixer'),
        // Add cssnano for production optimization
        ...(process.env.NODE_ENV === 'production'
          ? [require('cssnano')({ preset: 'default' })]
          : []
        ),
      ],
    },

    // CSS preprocessing options
    preprocessorOptions: {
      scss: {
        // Global SCSS variables and mixins
        additionalData: `
          @import "@/styles/variables.scss";
        `,
        // Modern Sass API
        api: 'modern-compiler',
      },
    },

    // CSS modules configuration
    modules: {
      // Generate scoped class names
      generateScopedName: process.env.NODE_ENV === 'production'
        ? '[hash:base64:5]'
        : '[name]__[local]__[hash:base64:5]',

      // Hash prefix for better debugging
      hashPrefix: 'lumen',
    },

    // Enable CSS source maps in development
    devSourcemap: true,
  },

  // Development server configuration
  server: {
    host: '0.0.0.0',
    port,
    strictPort: true,
    allowedHosts: ['elb.cblab.app'],

    // Enhanced file watching
    watch: {
      usePolling: true,
      interval: 100,
      // Watch additional file types
      ignored: ['!**/node_modules/**'],
    },

    // CORS configuration
    cors: true,

    // Proxy configuration (if needed)
    proxy: {
      // Example: '/api': 'http://localhost:3001'
    },

    // HMR configuration
    hmr: {
      overlay: true,
      // Custom HMR port if needed
      // port: 24678,
    },
  },

  // Preview server configuration (for production builds)
  preview: {
    host: '0.0.0.0',
    port: 4173,
    strictPort: true,
  },

  // Environment configuration
  envPrefix: ['VITE_', 'REACT_APP_'],

  // Worker configuration
  worker: {
    format: 'es',
  },

  // Experimental features
  experimental: {
    // Enable render built-in
    renderBuiltUrl(filename, { hostType }) {
      if (hostType === 'js') {
        return { js: `/${filename}` }
      } else {
        return { relative: true }
      }
    },
  },

  // Plugin-specific configurations
  pluginOptions: {
    // Tailwind CSS specific options
    tailwindcss: {
      // Enable JIT mode for faster builds
      mode: 'jit',
      // Purge unused styles in production
      purge: process.env.NODE_ENV === 'production',
    },
  },

  // Performance optimizations
  optimizeDeps: {
    // Force optimization of these packages
    include: [
      'react',
      'react-dom',
      'react-router-dom',
    ],

    // Exclude from optimization
    exclude: [
      // Large libraries that don't benefit from pre-bundling
    ],

    // ESBuild options for dependency optimization
    esbuildOptions: {
      // Use JSX loader for .js files
      loader: {
        '.js': 'jsx',
      },
      // Target modern browsers
      target: 'es2020',
      // Enable tree shaking
      treeShaking: true,
    },
  },

  // Logging configuration
  logLevel: process.env.NODE_ENV === 'development' ? 'info' : 'warn',

  // Clear screen on rebuild
  clearScreen: false,
})
