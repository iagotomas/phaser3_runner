'use strict';

const path = require('path');

module.exports = {

  entry: {
    game: ['./src/index.js'],
  },
  resolve: {
    modules: ['src', 'assets', 'node_modules'],
  },
  output: {
    path: path.resolve(__dirname, 'build'),
    filename: '[name].js',
    publicPath: "/"
  },

  devServer: {
    contentBase: './dist'
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        loader: 'babel-loader',
        exclude: /node_modules/,
        query: {
          presets: [['@babel/preset-env']]
        }
      },
      {
        test: [ /\.vert$/, /\.frag$/],
        use: require.resolve('raw-loader'),
      },
    ],
  },

  optimization: {
    splitChunks: {
      chunks: 'all',
    },
  },

};