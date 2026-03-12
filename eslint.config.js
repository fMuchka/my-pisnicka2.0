import js from '@eslint/js';
import typescript from '@typescript-eslint/eslint-plugin';
import typescriptParser from '@typescript-eslint/parser';
import vue from 'eslint-plugin-vue';
import vueParser from 'vue-eslint-parser';
import prettier from 'eslint-plugin-prettier';
import prettierConfig from 'eslint-config-prettier';
import globals from 'globals';

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
        ...globals.browser,
        ...globals.node,
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
  {
    // v-html is used in SongTextEditor to render chord highlights.
    // Content is HTML-escaped before chord <mark> spans are injected, so XSS is not a risk here.
    files: ['**/SongTextEditor.vue'],
    rules: {
      'vue/no-v-html': 'off',
    },
  },
];
