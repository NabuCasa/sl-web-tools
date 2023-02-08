import html from '@web/rollup-plugin-html';
import esbuild from 'rollup-plugin-esbuild';
import { string } from 'rollup-plugin-string';
import typescript from '@rollup/plugin-typescript';

export default {
  input: 'src/index.ts',
  output: {
    dir: 'dist',
    format: 'cjs',
  },
  external: [
    'lit',
    'lit/decorators.js',
    'lit/directives/class-map.js',
    '@material/mwc-button',
    '@material/mwc-icon-button',
    '@material/mwc-linear-progress',
    '@material/mwc-circular-progress',
    '@material/mwc-formfield',
    '@material/mwc-radio',
    '@material/mwc-dialog',
    '@mdi/js',
  ],
  plugins: [
    typescript(),
    string({
      include: '**/*.py',
    }),
  ],
};
