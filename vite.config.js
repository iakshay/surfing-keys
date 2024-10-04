import { defineConfig } from 'vite'
import { terser } from 'rollup-plugin-terser'

export default defineConfig({
  build: {
    // Ensure the final output is a single JavaScript file
    rollupOptions: {
      input: 'src/index.js',
      output: {
        manualChunks: () => 'everything.js',  // Ensures everything is bundled into a single file
        entryFileNames: '[name].js',  // Output file without the hash
        chunkFileNames: '[name].js',  // Chunk files without the hash
        assetFileNames: '[name].[ext]',  // Assets without the hash
      },
      plugins: [
        terser({
          format: {
            comments: false,  // Disable license comments in output
          },
        }),
      ],
    },
    minify: 'terser',  // Use terser for minification
  },
})