import js from '@eslint/js';
import typescript from '@typescript-eslint/eslint-plugin';
import typescriptParser from '@typescript-eslint/parser';
import vue from 'eslint-plugin-vue';
import vueParser from 'vue-eslint-parser';
import prettier from 'eslint-plugin-prettier';
import prettierConfig from 'eslint-config-prettier';

export default [
  js.configs.recommended,
  ...vue.configs['flat/recommended'],
  prettierConfig,
  {
    files: ['**/*.{js,mjs,cjs,ts,vue}'],
    languageOptions: {
      parser: vueParser,
      parserOptions: {
        parser: typescriptParser,
        ecmaVersion: 'latest',
        sourceType: 'module',
      },
      globals: {
        // browser globals
        window: 'readonly',
        document: 'readonly',
        console: 'readonly',
        confirm: 'readonly',
        alert: 'readonly',
        // node globals
        process: 'readonly',
        __dirname: 'readonly',
        __filename: 'readonly',
      },
    },
    plugins: {
      '@typescript-eslint': typescript,
      vue,
      prettier,
    },
    rules: {
      ...typescript.configs.recommended.rules,
      '@typescript-eslint/no-unused-vars': [
        'warn',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
        },
      ],
      'prettier/prettier': 'warn',
      'vue/multi-word-component-names': 'off',
      // 'vue/html-indent': ['warn', 2],
      // 'vue/script-indent': ['warn', 2, { baseIndent: 1 }],
    },
  },
  {
    files: ['**/*.vue'],
    rules: {
      // Override indent rule for .vue files to avoid conflicts with vue/script-indent
      indent: 'off',
    },
  },
];
