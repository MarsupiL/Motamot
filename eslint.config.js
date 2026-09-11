import js from '@eslint/js';
import globals from 'globals';
import react from 'eslint-plugin-react';
import hooks from 'eslint-plugin-react-hooks';
import tsParser from '@typescript-eslint/parser';

export default [
  { ignores: ['dist/**', 'node_modules/**'] },
  {
    files: ['*.js', 'scripts/*.mjs', 'tests/*.mjs'],
    languageOptions: { globals: globals.node },
    rules: js.configs.recommended.rules,
  },
  {
    files: ['src/**/*.{ts,tsx}', 'vite.config.ts'],
    languageOptions: { parser: tsParser, parserOptions: { ecmaFeatures: { jsx: true } }, globals: { ...globals.browser } },
    plugins: { react, 'react-hooks': hooks },
    settings: { react: { version: '18.3' } },
    rules: {
      ...js.configs.recommended.rules,
      ...hooks.configs.recommended.rules,
      'no-undef': 'off',
      'no-unused-vars': 'off',
      'react/jsx-key': 'error',
    },
  },
];
