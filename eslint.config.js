// For more info, see https://github.com/storybookjs/eslint-plugin-storybook#configuration-flat-config-format
import storybook from 'eslint-plugin-storybook';

import js from '@eslint/js';
import typescript from '@typescript-eslint/eslint-plugin';
import typescriptParser from '@typescript-eslint/parser';
import reactHooks from 'eslint-plugin-react-hooks';
import prettier from 'eslint-plugin-prettier';
import prettierConfig from 'eslint-config-prettier';
import globals from 'globals';
import noRawCssVar from './eslint-rules/no-raw-css-var.js';

export default [
  {
    // Unported Vue code, kept only as a reference while pages and features move to React.
    ignores: ['legacy-vue/**', 'dist/**', 'dev-dist/**', 'coverage/**', 'storybook-static/**'],
  },
  js.configs.recommended,
  reactHooks.configs.flat.recommended,
  prettierConfig,
  {
    files: ['**/*.{js,mjs,cjs,ts,tsx}'],
    languageOptions: {
      parser: typescriptParser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
        ecmaFeatures: { jsx: true },
      },
      globals: {
        ...globals.browser,
        ...globals.node,
      },
    },
    plugins: {
      '@typescript-eslint': typescript,
      prettier,
    },
    rules: {
      ...typescript.configs.recommended.rules,
      // TypeScript already reports undefined names, and no-undef doesn't understand type-only globals.
      'no-undef': 'off',
      '@typescript-eslint/no-unused-vars': [
        'warn',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
        },
      ],
      'prettier/prettier': 'warn',
    },
  },
  {
    files: ['src/**/*.{ts,tsx}', '.storybook/**/*.{ts,tsx}'],
    // The token definitions themselves are raw CSS.
    ignores: ['src/styles/tokens.ts', 'src/styles/generateTokensCss.ts'],
    plugins: {
      local: { rules: { 'no-raw-css-var': noRawCssVar } },
    },
    rules: {
      'local/no-raw-css-var': 'error',
    },
  },
  ...storybook.configs['flat/recommended'],
];
