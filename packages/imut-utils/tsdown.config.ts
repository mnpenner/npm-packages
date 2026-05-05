import { defineConfig } from 'tsdown'

export default defineConfig({
  entry: {
    index: './src/imp/index.ts',
    fp: './src/fp/index.ts',
  },
  platform: 'neutral',
  exports: {
    legacy: true,
  },
  dts: true,
  format: ['esm'],
})
