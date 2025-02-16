import js from '@eslint/js'
import tseslint from 'typescript-eslint'
import turboPlugin from 'eslint-plugin-turbo'
import onlyWarn from 'eslint-plugin-only-warn'
import eslintPluginPrettier from 'eslint-plugin-prettier'
import importPlugin from 'eslint-plugin-import'

/**
 * A shared ESLint configuration for the repository.
 *
 * @type {import("eslint").Linter.Config}
 * */
export const config = [
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    plugins: {
      turbo: turboPlugin,
      prettier: eslintPluginPrettier,
      import: importPlugin,
      onlyWarn,
    },
    rules: {
      'turbo/no-undeclared-env-vars': 'warn',
      'prefer-rest-params': 'off',
      'prettier/prettier': 'error',
      '@typescript-eslint/no-unused-vars': 'warn',
      '@typescript-eslint/no-unused-expressions': 'off',
      '@typescript-eslint/consistent-type-imports': 'error',
      '@typescript-eslint/no-import-type-side-effects': 'error',
      '@typescript-eslint/no-explicit-any': 'off',
      'no-unused-vars': 'off',
      'import/consistent-type-specifier-style': ['error', 'prefer-top-level'],
      'import/order': [
        'error',
        {
          groups: [
            'external',
            'internal',
            'parent',
            'sibling',
            'builtin',
            'object',
            'index',
            'type',
          ],
          pathGroups: [
            {
              pattern: '**/types',
              group: 'type',
              position: 'before',
            },
          ],
          alphabetize: {
            order: 'asc',
            caseInsensitive: false,
          },
          distinctGroup: false,
          'newlines-between': 'always',
        },
      ],
    },
  },
  {
    ignores: ['dist/**', 'dist/**/*.ts', 'dist/**', '**/*.mjs', '**/*.js'],
  },
]
