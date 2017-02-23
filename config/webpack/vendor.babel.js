import path from 'path';
import webpack from 'webpack';

import {
  DOCS_ROOT,
  BUILD_PATH,
  PRODUCTION,
  URL_PREFIX
} from './constants';

const PRODUCTION_PLUGINS = [
  new webpack.optimize.UglifyJsPlugin({
    compress: {
      warnings: false
    }
  })
];

export default {
  context: DOCS_ROOT,
  entry: {
    vendor: [path.resolve(DOCS_ROOT, 'vendor.js')]
  },
  plugins: [
    new webpack.DllPlugin({
      context: DOCS_ROOT,
      path: path.resolve(BUILD_PATH, '[name]-manifest.json'),
      name: '[name]_dll'
    })
  ].concat(PRODUCTION ? PRODUCTION_PLUGINS : []),
  output: {
    path: BUILD_PATH,
    publicPath: URL_PREFIX + 'build/',
    filename: '[name].dll.js',
    library: '[name]_dll'
  },
  devtool: PRODUCTION ? 'source-map' : 'cheap-module-eval-source-map'
};
