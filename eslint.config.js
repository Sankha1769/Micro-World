import js from '@eslint/js';
import globals from 'globals';

/**
 * Coding standards for MICROVERSE.
 *
 * Formatting (indentation, quotes, line width, semicolons) is owned by Prettier;
 * ESLint covers correctness and the structural habits that keep code readable.
 */
const readabilityRules = {
  // Correctness
  eqeqeq: ['error', 'always', { null: 'ignore' }],
  'no-var': 'error',
  'prefer-const': 'error',
  'no-implicit-globals': 'error',
  'no-shadow': 'error',
  'no-unused-vars': ['error', { args: 'after-used', argsIgnorePattern: '^_' }],
  // Constants declared later in a module may be read from functions that only run afterwards.
  'no-use-before-define': ['error', { functions: false, classes: true, variables: false }],

  // One statement and one declaration per line
  curly: ['error', 'all'],
  'one-var': ['error', 'never'],
  'max-statements-per-line': ['error', { max: 1 }],
  'no-multi-assign': 'error',
  'no-sequences': 'error',
  'no-nested-ternary': 'error',
  'no-unneeded-ternary': 'error',

  // Modern, explicit syntax
  'object-shorthand': ['error', 'always'],
  'prefer-template': 'error',
  'prefer-arrow-callback': 'error',
  'no-lonely-if': 'error',
  'no-else-return': 'error',
  'dot-notation': 'error',

  // Structure and naming
  'max-depth': ['warn', 4],
  'max-params': ['warn', 6],
  camelcase: ['error', { properties: 'never' }],
  'id-length': [
    'warn',
    {
      min: 3,
      // Conventional short names: indices, coordinates, easing parameters, colour channels.
      exceptions: [
        'i',
        'j',
        'k',
        'n',
        't',
        'u',
        'v',
        'w',
        'x',
        'y',
        'z',
        'a',
        'b',
        'c',
        'd',
        'e',
        'r',
        'g',
        'h',
        's',
        'm',
        'p',
        'q',
        'o',
        'f',
        'l',
        '$',
        '_',
        'id',
        'to',
        'of',
        'ox',
        'oy',
        'oz',
        'dx',
        'dy',
        'dz',
        'uv',
      ],
      properties: 'never',
    },
  ],
};

export default [
  { ignores: ['node_modules/', 'dist/', 'out/'] },
  js.configs.recommended,
  {
    files: ['src/**/*.js'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: { ...globals.browser },
    },
    rules: readabilityRules,
  },
  {
    files: ['scripts/**/*.mjs', 'tests/**/*.mjs', 'eslint.config.js'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: { ...globals.node, ...globals.browser },
    },
    rules: { ...readabilityRules, 'id-length': 'off' },
  },
];
