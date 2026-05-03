import { defineConfig } from 'tsdown'

export default defineConfig({
  entry: ['./src/index.ts'],
  platform: 'neutral',
  exports: {
    legacy: true,
  },
  dts: true,
  format: ['esm'],
})
