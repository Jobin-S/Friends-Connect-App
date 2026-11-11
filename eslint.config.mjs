// Flat ESLint config for the whole monorepo (TypeScript, no type-aware rules to keep it fast).
import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import prettier from 'eslint-config-prettier';
import globals from 'globals';

export default tseslint.config(
  {
    ignores: ['**/node_modules/**', '**/dist/**', '**/.next/**', '**/next-env.d.ts', 'mobile/**'],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    languageOptions: { globals: { ...globals.node, ...globals.browser } },
    rules: {
      // The existing code uses `any` in places; tighten this as modules are rewritten.
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
      // `import x = require('x')` is the right way to load CommonJS modules without esModuleInterop.
      '@typescript-eslint/no-require-imports': ['error', { allowAsImport: true }],
    },
  },
  {
    files: ['**/*.js', '**/*.cjs'],
    rules: { '@typescript-eslint/no-require-imports': 'off' },
  },
  prettier,
);
