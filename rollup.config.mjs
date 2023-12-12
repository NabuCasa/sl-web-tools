import nodeResolve from '@rollup/plugin-node-resolve';
import { string } from 'rollup-plugin-string';
import terser from '@rollup/plugin-terser';
import babel from '@rollup/plugin-babel';

const config = {
  input: 'dist/nabucasa-zigbee-flasher.js',
  output: {
    dir: 'dist/web',
    format: 'module',
  },
  preserveEntrySignatures: false,
  plugins: [
    nodeResolve(),
    babel({
      babelHelpers: 'bundled',
      plugins: ['@babel/plugin-proposal-class-properties'],
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
