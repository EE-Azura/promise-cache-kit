import js from '@eslint/js';
import globals from 'globals';
import { FlatCompat } from '@eslint/eslintrc';

const compat = new FlatCompat({
  recommendedConfig: js.configs.recommended,
  allConfig: js.configs.all
});

export default [
  ...compat.extends('eslint:recommended', 'plugin:prettier/recommended'),
  {
    files: ['**/*.js'],
    languageOptions: {
      ecmaVersion: 2021,
      sourceType: 'module',
      globals: {
        ...globals.node,
        ...globals.browser
      }
    },
    rules: {
      indent: ['error', 2],
      'linebreak-style': ['off'], // Disable linebreak-style rule
      quotes: ['error', 'single'],
      semi: ['error', 'always'],
      camelcase: ['error', { properties: 'always' }],
      'no-magic-numbers': ['warn', { ignore: [0, 1] }],
      'prefer-arrow-callback': ['error'],
      'prefer-template': ['error'],
      'no-var': ['error'],
      'prefer-const': ['error'],
      'no-unused-vars': ['warn'],
      'no-console': ['warn'],
      'prettier/prettier': [
        'error',
        {
          singleQuote: true,
          semi: true,
          useTabs: false,
          tabWidth: 2,
          printWidth: 80,
          trailingComma: 'none',
          bracketSpacing: true,
          arrowParens: 'avoid',
          endOfLine: 'auto' // Automatically adjust line endings
        }
      ]
    }
  }
];
