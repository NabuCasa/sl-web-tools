import nodeResolve from '@rollup/plugin-node-resolve';
import { string } from 'rollup-plugin-string';
import terser from '@rollup/plugin-terser';
import babel from '@rollup/plugin-babel';

const config = {
  input: 'dist/nabucasa-zigbee-flasher.js',
  output: {
    dir: 'dist/web',
    format: 'module',
    manualChunks(id) {
      if (id.includes('node_modules')) {
        return 'vendor';
      }
    },
  },
  preserveEntrySignatures: false,
  plugins: [
    nodeResolve({
      browser: true,
      preferBuiltins: false,
    }),
    babel({
      babelHelpers: 'bundled',
      plugins: ['@babel/plugin-transform-class-properties'],
    }),
    string({
      include: '**/*.py',
    }),
    string({
      include: '**/requirements.txt',
    }),
  ],
};

if (process.env.NODE_ENV === 'production') {
  config.plugins.push(
    terser({
      ecma: 2019,
      toplevel: true,
      format: {
        comments: false,
      },
    })
  );
}

export default config;
