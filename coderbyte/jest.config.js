// __define-ocg__ - Enhanced Jest configuration for Tailwind CSS testing and unified design system

// Variable names as required by the specification
const varOcg = 'jest-tailwind-config';
const varFiltersCg = 'unified-test-system';

module.exports = {
  // Test environment
  testEnvironment: 'jsdom',

  // Setup files
  setupFilesAfterEnv: [
    '<rootDir>/src/setupTests.js'
  ],

  // Enhanced module name mapping for Tailwind CSS and design system
  moduleNameMapping: {
    // Path aliases (matching vite.config.mjs)
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@components/(.*)$': '<rootDir>/src/components/$1',
    '^@pages/(.*)$': '<rootDir>/src/pages/$1',
    '^@ui/(.*)$': '<rootDir>/src/ui/$1',
    '^@utils/(.*)$': '<rootDir>/src/utils/$1',
    '^@hooks/(.*)$': '<rootDir>/src/hooks/$1',
    '^@styles/(.*)$': '<rootDir>/src/styles/$1',
    '^@assets/(.*)$': '<rootDir>/src/assets/$1',
    '^@types/(.*)$': '<rootDir>/src/types/$1',

    // CSS and style file mocking
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',

    // Tailwind CSS specific mocking
    'tailwindcss': 'identity-obj-proxy',
    'tailwind.config.js': '<rootDir>/__mocks__/tailwind.config.js',

    // Asset file mocking
    '\\.(jpg|jpeg|png|gif|eot|otf|webp|svg|ttf|woff|woff2|mp4|webm|wav|mp3|m4a|aac|oga)$': 'jest-transform-stub',

    // PostCSS and CSS processing mocking
    'postcss': 'identity-obj-proxy',
    'autoprefixer': 'identity-obj-proxy',
  },

  // Transform configuration
  transform: {
    // JavaScript and JSX transformation
    '^.+\\.(js|jsx)$': 'babel-jest',

    // TypeScript transformation (if needed)
    '^.+\\.(ts|tsx)$': 'ts-jest',

    // CSS transformation for Tailwind classes
    '^.+\\.css$': '<rootDir>/jest/cssTransform.js',

    // SCSS transformation
    '^.+\\.(scss|sass)$': '<rootDir>/jest/scssTransform.js',

    // Asset transformation
    '^(?!.*\\.(js|jsx|ts|tsx|css|scss|sass|json)$)': '<rootDir>/jest/fileTransform.js',
  },

  // File extensions to consider
  moduleFileExtensions: [
    'js',
    'jsx',
    'ts',
    'tsx',
    'json',
    'node',
    'css',
    'scss',
    'sass'
  ],

  // Test file patterns
  testMatch: [
    '<rootDir>/src/**/__tests__/**/*.(js|jsx|ts|tsx)',
    '<rootDir>/src/**/?(*.)(spec|test).(js|jsx|ts|tsx)',
    '<rootDir>/src/**/*.test.(js|jsx|ts|tsx)',
    '<rootDir>/src/**/*.spec.(js|jsx|ts|tsx)',
  ],

  // Coverage configuration
  collectCoverageFrom: [
    'src/**/*.{js,jsx,ts,tsx}',
    '!src/index.js',
    '!src/main.jsx',
    '!src/setupTests.js',
    '!src/**/*.stories.{js,jsx,ts,tsx}',
    '!src/**/*.test.{js,jsx,ts,tsx}',
    '!src/**/*.spec.{js,jsx,ts,tsx}',
    '!src/**/*.d.ts',
    '!src/vite-env.d.ts',
    // Exclude style files from coverage
    '!src/styles/**',
    // Include UI components in coverage
    'src/components/**/*.{js,jsx,ts,tsx}',
    'src/ui/**/*.{js,jsx,ts,tsx}',
  ],

  // Coverage reporting
  coverageDirectory: 'coverage',
  coverageReporters: [
    'text',
    'text-summary',
    'lcov',
    'html',
    'json',
    'clover'
  ],

  // Coverage thresholds for quality gates
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70,
    },
    // Specific thresholds for UI components
    'src/components/**/*.{js,jsx}': {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
    'src/ui/**/*.{js,jsx}': {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },

  // Test path ignore patterns
  testPathIgnorePatterns: [
    '<rootDir>/node_modules/',
    '<rootDir>/dist/',
    '<rootDir>/build/',
    '<rootDir>/coverage/',
    '<rootDir>/.next/',
  ],

  // Watch path ignore patterns
  watchPathIgnorePatterns: [
    '<rootDir>/node_modules/',
    '<rootDir>/dist/',
    '<rootDir>/build/',
    '<rootDir>/coverage/',
  ],

  // Jest configuration options
  clearMocks: true,
  restoreMocks: true,
  resetMocks: true,

  // Verbose output for better debugging
  verbose: true,

  // Test timeout
  testTimeout: 10000,

  // Global setup and teardown
  globalSetup: '<rootDir>/jest/globalSetup.js',
  globalTeardown: '<rootDir>/jest/globalTeardown.js',

  // Test environment options
  testEnvironmentOptions: {
    url: 'http://localhost:3000',
    // Custom options for jsdom
    pretendToBeVisual: true,
    resources: 'usable',
  },

  // Snapshot serializers for better component testing
  snapshotSerializers: [
    // Add serializers for styled components or emotion if used
    // '@emotion/jest/serializer',
  ],

  // Custom globals for design system testing
  globals: {
    __DESIGN_SYSTEM_VERSION__: '1.0.0',
    __TAILWIND_CONFIG__: varOcg,
    __FILTER_SYSTEM__: varFiltersCg,
    // Tailwind CSS classes for testing
    __TAILWIND_CLASSES__: {
      primary: 'bg-primary-600 text-white',
      secondary: 'bg-secondary-600 text-white',
      success: 'bg-success-600 text-white',
      danger: 'bg-danger-600 text-white',
      warning: 'bg-warning-500 text-white',
      info: 'bg-info-600 text-white',
    },
  },

  // Error handling
  errorOnDeprecated: true,

  // Notify configuration
  notify: false,
  notifyMode: 'failure-change',

  // Bail configuration
  bail: 0,

  // Max workers for parallel testing
  maxWorkers: '50%',

  // Cache configuration
  cache: true,
  cacheDirectory: '<rootDir>/node_modules/.cache/jest',

  // Collect coverage from untested files
  collectCoverageFrom: [
    ...module.exports.collectCoverageFrom || [],
    // Ensure all component files are included in coverage
    'src/components/**/*.{js,jsx}',
    'src/ui/**/*.{js,jsx}',
    'src/pages/**/*.{js,jsx}',
  ],

  // Custom reporters
  reporters: [
    'default',
    // Add custom reporters for CI/CD
    // ['jest-junit', { outputDirectory: 'coverage', outputName: 'junit.xml' }],
  ],

  // Setup files before framework
  setupFiles: [
    '<rootDir>/jest/polyfills.js',
  ],

  // Transform ignore patterns
  transformIgnorePatterns: [
    'node_modules/(?!(react-router|@testing-library|tailwindcss)/)',
  ],

  // Module directories
  moduleDirectories: [
    'node_modules',
    '<rootDir>/src',
  ],

  // Resolver configuration
  resolver: '<rootDir>/jest/resolver.js',

  // Custom test results processor
  // testResultsProcessor: '<rootDir>/jest/testResultsProcessor.js',

  // Projects configuration for multi-project setup (if needed)
  // projects: [
  //   {
  //     displayName: 'components',
  //     testMatch: ['<rootDir>/src/components/**/*.test.{js,jsx}'],
  //   },
  //   {
  //     displayName: 'ui',
  //     testMatch: ['<rootDir>/src/ui/**/*.test.{js,jsx}'],
  //   },
  // ],
};
