const { build } = require('esbuild');

build({
  entryPoints: ['src/index.ts'],
  bundle: true,
  platform: 'node',
  outfile: 'dist/index.js',
  target: 'es2020',
  sourcemap: true,
})
  .then(() => console.log('Build completed!'))
  .catch(() => process.exit(1));
