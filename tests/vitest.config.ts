import { defineConfig } from 'vitest/config'
import { resolve } from 'path'

export default defineConfig({
  root: resolve(__dirname),
  test: {
    name: 'finpolicy-compiler-qa',
    environment: 'node',
    globals: false,
    setupFiles: [resolve(__dirname, './setup/compiler-compat.ts')],
    include: ['**/*.test.ts', '**/*.spec.ts'],
    exclude: ['node_modules', 'dist'],
    reporters: ['verbose'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov'],
      include: ['../compiler/src/**/*.ts'],
      exclude: ['**/*.test.ts', '**/*.spec.ts', '**/node_modules/**'],
    },
  },
  resolve: {
    alias: [
      {
        find: /^.*\/compiler\/src\/parser$/,
        replacement: resolve(__dirname, './setup/parser-compat.ts'),
      },
      {
        find: '@finpolicy/shared',
        replacement: resolve(__dirname, '../shared/src/index.ts'),
      },
      {
        find: '@finpolicy/compiler',
        replacement: resolve(__dirname, '../compiler/src/index.ts'),
      },
      {
        find: '@',
        replacement: resolve(__dirname, '../frontend/src'),
      },
    ],
  },
})


