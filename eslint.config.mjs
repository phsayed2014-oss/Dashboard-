import js from '@eslint/js';

export default [
  {
    ignores: [
      'node_modules/**',
      'dist/**',
      'PharmaDash-v3-medical-ready.html',
      'pharmdash v3 medical.html',
      'src/app.js',
    ],
  },
  js.configs.recommended,
  {
    files: ['src/core/**/*.mjs', 'scripts/**/*.mjs', 'tests/**/*.mjs'],
    languageOptions: {
      ecmaVersion: 2024,
      sourceType: 'module',
      globals: {
        Buffer: 'readonly',
        console: 'readonly',
        process: 'readonly',
        URL: 'readonly',
      },
    },
    rules: {
      'no-console': 'off',
    },
  },
  {
    files: ['tests/e2e/**/*.mjs'],
    languageOptions: {
      globals: {
        indexedDB: 'readonly',
        localStorage: 'readonly',
        sessionStorage: 'readonly',
        setBranchData: 'readonly',
        STATE: 'readonly',
        renderAll: 'readonly',
        _idbPut: 'readonly',
        _idbGet: 'readonly',
        _IDB_KEY: 'readonly',
        _buildSnapshot: 'readonly',
        PharmaCore: 'readonly',
        aggregate: 'readonly',
        rebuildBranchFromPeriods: 'readonly',
        doLogout: 'readonly',
        printVisitCard: 'readonly',
        saveData: 'readonly',
        flushSaveData: 'readonly',
        aggregateAsync: 'writable',
        loadSavedData: 'readonly',
        lockInMemoryData: 'readonly',
        dtOpenUpload: 'readonly',
        dtHandleFile: 'readonly',
        DT: 'readonly',
        charts: 'readonly',
        window: 'readonly',
      },
    },
  },
];
