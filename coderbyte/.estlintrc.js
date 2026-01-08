// __define-ocg__ - Enhanced ESLint configuration for Tailwind CSS and unified design system

// Variable names as required by the specification
const varOcg = 'eslint-tailwind-config';
const varFiltersCg = 'unified-linting-system';

module.exports = {
  env: {
    browser: true,
    es2021: true,
    node: true,
    jest: true,
  },
  extends: [
    'eslint:recommended',
    'plugin:react/recommended',
    'plugin:react-hooks/recommended',
    'plugin:jsx-a11y/recommended',
    'plugin:tailwindcss/recommended',
    'prettier', // Must be last to override other configs
  ],
  parser: '@babel/eslint-parser',
  parserOptions: {
    ecmaFeatures: {
      jsx: true,
      experimentalObjectRestSpread: true,
    },
    ecmaVersion: 2022,
    sourceType: 'module',
    requireConfigFile: false,
    babelOptions: {
      presets: ['@babel/preset-react'],
    },
  },
  plugins: [
    'react',
    'react-hooks',
    'jsx-a11y',
    'tailwindcss',
    'import',
  ],
  rules: {
    // React specific rules
    'react/prop-types': 'off',
    'react/react-in-jsx-scope': 'off',
    'react/jsx-uses-react': 'off',
    'react/jsx-uses-vars': 'error',
    'react/jsx-no-undef': 'error',
    'react/jsx-pascal-case': 'error',
    'react/jsx-key': 'error',
    'react/no-array-index-key': 'warn',
    'react/no-unused-state': 'warn',
    'react/prefer-stateless-function': 'warn',
    'react/self-closing-comp': 'error',
    'react/jsx-curly-brace-presence': ['error', { props: 'never', children: 'never' }],

    // React Hooks rules
    'react-hooks/rules-of-hooks': 'error',
    'react-hooks/exhaustive-deps': 'warn',

    // Tailwind CSS specific rules
    'tailwindcss/classnames-order': 'error',
    'tailwindcss/enforces-negative-arbitrary-values': 'error',
    'tailwindcss/enforces-shorthand': 'error',
    'tailwindcss/migration-from-tailwind-2': 'error',
    'tailwindcss/no-arbitrary-value': 'off', // Allow arbitrary values for custom designs
    'tailwindcss/no-custom-classname': 'off', // Allow custom classes for component libraries
    'tailwindcss/no-contradicting-classname': 'error',
    'tailwindcss/no-unnecessary-arbitrary-value': 'error',

    // Accessibility rules
    'jsx-a11y/alt-text': 'error',
    'jsx-a11y/anchor-has-content': 'error',
    'jsx-a11y/anchor-is-valid': 'error',
    'jsx-a11y/aria-props': 'error',
    'jsx-a11y/aria-proptypes': 'error',
    'jsx-a11y/aria-role': 'error',
    'jsx-a11y/aria-unsupported-elements': 'error',
    'jsx-a11y/click-events-have-key-events': 'warn',
    'jsx-a11y/heading-has-content': 'error',
    'jsx-a11y/interactive-supports-focus': 'error',
    'jsx-a11y/label-has-associated-control': 'error',
    'jsx-a11y/no-noninteractive-element-interactions': 'warn',
    'jsx-a11y/role-has-required-aria-props': 'error',
    'jsx-a11y/role-supports-aria-props': 'error',

    // General JavaScript rules
    'no-unused-vars': ['warn', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
    'no-console': process.env.NODE_ENV === 'production' ? 'error' : 'warn',
    'no-debugger': process.env.NODE_ENV === 'production' ? 'error' : 'warn',
    'prefer-const': 'error',
    'no-var': 'error',
    'prefer-arrow-callback': 'error',
    'arrow-spacing': 'error',
    'no-duplicate-imports': 'error',
    'no-multiple-empty-lines': ['error', { max: 2, maxEOF: 1, maxBOF: 0 }],
    'eol-last': 'error',
    'no-trailing-spaces': 'error',

    // Import rules
    'import/order': [
      'error',
      {
        groups: [
          'builtin',
          'external',
          'internal',
          'parent',
          'sibling',
          'index',
        ],
        'newlines-between': 'always',
        alphabetize: {
          order: 'asc',
          caseInsensitive: true,
        },
      },
    ],
    'import/no-unresolved': 'error',
    'import/no-duplicates': 'error',
    'import/newline-after-import': 'error',

    // Code style rules (handled by Prettier, but kept for consistency)
    'semi': 'off', // Handled by Prettier
    'quotes': 'off', // Handled by Prettier
    'indent': 'off', // Handled by Prettier
    'comma-dangle': 'off', // Handled by Prettier
    'object-curly-spacing': 'off', // Handled by Prettier
    'array-bracket-spacing': 'off', // Handled by Prettier
    'space-before-function-paren': 'off', // Handled by Prettier
    'keyword-spacing': 'off', // Handled by Prettier
    'space-infix-ops': 'off', // Handled by Prettier
  },
  settings: {
    react: {
      version: 'detect',
    },
    'import/resolver': {
      node: {
        extensions: ['.js', '.jsx', '.ts', '.tsx'],
        moduleDirectory: ['node_modules', 'src/'],
      },
      alias: {
        map: [
          ['@', './src'],
          ['@components', './src/components'],
          ['@pages', './src/pages'],
          ['@ui', './src/ui'],
          ['@utils', './src/utils'],
          ['@hooks', './src/hooks'],
          ['@styles', './src/styles'],
          ['@assets', './src/assets'],
          ['@types', './src/types'],
        ],
        extensions: ['.js', '.jsx', '.ts', '.tsx', '.json'],
      },
    },
    tailwindcss: {
      config: './tailwind.config.js',
      cssFiles: [
        '**/*.css',
        '!**/node_modules',
        '!**/.*',
        '!**/dist',
        '!**/build',
      ],
      removeDuplicates: true,
      skipClassAttribute: false,
      whitelist: [
        // Allow custom classes that might not be in Tailwind
        'varOcg',
        'varFiltersCg',
      ],
    },
  },
  overrides: [
    {
      files: ['**/*.test.js', '**/*.test.jsx', '**/*.spec.js', '**/*.spec.jsx'],
      env: {
        jest: true,
      },
      extends: ['plugin:testing-library/react'],
      rules: {
        'testing-library/await-async-query': 'error',
        'testing-library/no-await-sync-query': 'error',
        'testing-library/no-debugging-utils': 'warn',
        'testing-library/no-dom-import': 'error',
        'testing-library/prefer-screen-queries': 'error',
        'testing-library/render-result-naming-convention': 'error',
      },
    },
    {
      files: ['**/*.stories.js', '**/*.stories.jsx'],
      rules: {
        'import/no-anonymous-default-export': 'off',
        'react-hooks/rules-of-hooks': 'off',
      },
    },
    {
      files: ['vite.config.*', 'tailwind.config.*', 'postcss.config.*', 'jest.config.*'],
      env: {
        node: true,
      },
      rules: {
        'no-console': 'off',
        'import/no-extraneous-dependencies': 'off',
      },
    },
  ],
  ignorePatterns: [
    'dist/',
    'build/',
    'coverage/',
    'node_modules/',
    '*.min.js',
    '*.min.css',
    'public/',
    '.cache/',
    'storybook-static/',
  ],
  globals: {
    __DESIGN_SYSTEM_VERSION__: 'readonly',
    __TAILWIND_CONFIG__: 'readonly',
    __FILTER_SYSTEM__: 'readonly',
    [varOcg]: 'readonly',
    [varFiltersCg]: 'readonly',
  },
  reportUnusedDisableDirectives: true,
};
