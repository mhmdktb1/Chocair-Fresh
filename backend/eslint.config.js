import pluginImport from 'eslint-plugin-import';

export default [
  {
    ignores: [
      'node_modules/',
      'dist/',
      'coverage/'
    ]
  },
  {
    files: ['**/*.js'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: {
        process: 'readonly',
        console: 'readonly'
      }
    },
    plugins: {
      import: pluginImport
    },
    rules: {
      'no-unused-vars': ['warn', { argsIgnorePattern: '^_', varsIgnorePattern: '^ignored' }]
    }
  },
  {
    files: [
      'tests/**/*.js',
      'test-*.js',
      '**/*.test.js'
    ],
    languageOptions: {
      globals: {
        describe: 'readonly',
        it: 'readonly',
        expect: 'readonly',
        beforeAll: 'readonly',
        afterAll: 'readonly',
        beforeEach: 'readonly',
        afterEach: 'readonly'
      }
    }
  }
];

