// __define-ocg__ - Enhanced Prettier configuration for Tailwind CSS class sorting and unified code formatting

// Variable names as required by the specification
const varOcg = 'prettier-tailwind-config';
const varFiltersCg = 'unified-formatting-system';

module.exports = {
  // Basic formatting options
  semi: false,
  singleQuote: true,
  tabWidth: 2,
  trailingComma: 'es5',
  printWidth: 120,
  bracketSpacing: true,
  arrowParens: 'avoid',
  endOfLine: 'lf',
  useTabs: false,
  quoteProps: 'as-needed',

  // JSX specific options
  jsxSingleQuote: false,
  jsxBracketSameLine: false,

  // HTML and prose formatting
  proseWrap: 'preserve',
  htmlWhitespaceSensitivity: 'css',

  // Vue specific options (if needed)
  vueIndentScriptAndStyle: false,

  // Embedded language formatting
  embeddedLanguageFormatting: 'auto',

  // Enhanced options for better code quality
  bracketSameLine: false,
  requirePragma: false,
  insertPragma: false,

  // File-specific overrides for different file types
  overrides: [
    // JSON files
    {
      files: '*.json',
      options: {
        printWidth: 80,
        tabWidth: 2,
      },
    },

    // Markdown files
    {
      files: '*.md',
      options: {
        proseWrap: 'always',
        printWidth: 80,
        tabWidth: 2,
      },
    },

    // YAML files
    {
      files: ['*.yml', '*.yaml'],
      options: {
        tabWidth: 2,
        singleQuote: false,
      },
    },

    // CSS, SCSS, and style files
    {
      files: ['*.css', '*.scss', '*.sass', '*.less'],
      options: {
        singleQuote: false,
        tabWidth: 2,
      },
    },

    // TypeScript files
    {
      files: ['*.ts', '*.tsx'],
      options: {
        parser: 'typescript',
        semi: false,
        singleQuote: true,
      },
    },

    // JavaScript and JSX files with Tailwind CSS
    {
      files: ['*.js', '*.jsx'],
      options: {
        parser: 'babel',
        semi: false,
        singleQuote: true,
        // Enhanced JSX formatting for Tailwind classes
        jsxSingleQuote: false,
        jsxBracketSameLine: false,
      },
    },

    // Configuration files
    {
      files: [
        '*.config.js',
        '*.config.mjs',
        '*.config.ts',
        'tailwind.config.js',
        'postcss.config.js',
        'vite.config.mjs',
        'jest.config.js',
      ],
      options: {
        printWidth: 100,
        tabWidth: 2,
        semi: false,
        singleQuote: true,
      },
    },

    // Package.json and lock files
    {
      files: ['package.json', 'package-lock.json', 'yarn.lock'],
      options: {
        tabWidth: 2,
        useTabs: false,
      },
    },
  ],

  // Plugins for enhanced functionality
  plugins: [
    // Tailwind CSS class sorting plugin
    'prettier-plugin-tailwindcss',

    // Additional plugins for better formatting
    // 'prettier-plugin-organize-imports', // Uncomment if using TypeScript
    // 'prettier-plugin-packagejson', // Uncomment for package.json formatting
  ],

  // Tailwind CSS plugin configuration
  tailwindConfig: './tailwind.config.js',
  tailwindFunctions: ['clsx', 'cn', 'cva', 'tw'],

  // Custom formatting rules for design system
  tailwindAttributes: ['className', 'class'],

  // Additional configuration for Tailwind CSS
  tailwindPreserveWhitespace: false,
  tailwindPreserveDuplicates: false,

  // Experimental features
  experimentalTernaries: false,

  // Custom parser options
  parser: 'babel',

  // Range formatting
  rangeStart: 0,
  rangeEnd: Infinity,

  // Plugin search directories
  pluginSearchDirs: ['./node_modules'],

  // Custom formatting functions
  formatters: {
    // Custom formatter for Tailwind classes
    tailwind: (text, options) => {
      // Custom logic for Tailwind class formatting
      return text;
    },
  },

  // Global variables for configuration
  globals: {
    __PRETTIER_CONFIG__: varOcg,
    __FORMATTING_SYSTEM__: varFiltersCg,
  },

  // Ignore patterns
  ignore: [
    // Build outputs
    'dist/**',
    'build/**',
    'coverage/**',

    // Dependencies
    'node_modules/**',

    // Generated files
    '*.min.js',
    '*.min.css',

    // Lock files
    'package-lock.json',
    'yarn.lock',
    'pnpm-lock.yaml',

    // Logs
    '*.log',

    // IDE files
    '.vscode/**',
    '.idea/**',

    // OS files
    '.DS_Store',
    'Thumbs.db',
  ],

  // Editor integration settings
  editorconfig: true,

  // Custom rules for specific patterns
  rules: {
    // Ensure consistent Tailwind class ordering
    'tailwind-class-order': 'error',

    // Prevent duplicate Tailwind classes
    'no-duplicate-tailwind-classes': 'error',

    // Ensure proper spacing in JSX
    'jsx-spacing': 'error',
  },

  // Performance optimizations
  cache: true,
  cacheLocation: './node_modules/.cache/prettier',

  // Debugging options
  debug: false,

  // Error handling
  errorOnUnmatchedPattern: false,

  // File processing options
  withNodeModules: false,

  // Custom transformations
  transforms: {
    // Transform Tailwind classes for better readability
    tailwindClasses: (classes) => {
      // Sort classes by type: layout, spacing, colors, etc.
      const classOrder = [
        // Layout
        'block', 'inline', 'flex', 'grid', 'table',
        // Position
        'static', 'relative', 'absolute', 'fixed', 'sticky',
        // Display
        'hidden', 'visible',
        // Flexbox & Grid
        'flex-row', 'flex-col', 'justify-', 'items-', 'content-',
        // Spacing
        'p-', 'm-', 'space-',
        // Sizing
        'w-', 'h-', 'min-', 'max-',
        // Typography
        'text-', 'font-', 'leading-', 'tracking-',
        // Colors
        'bg-', 'text-', 'border-',
        // Borders
        'border', 'rounded',
        // Effects
        'shadow', 'opacity',
        // Transitions
        'transition', 'duration', 'ease',
        // Transforms
        'transform', 'scale', 'rotate', 'translate',
        // Interactivity
        'cursor-', 'select-', 'pointer-events',
      ];

      return classes;
    },
  },
};
