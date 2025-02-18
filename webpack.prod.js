'use strict';

const path = require('path');
const webpack = require('webpack');
const {merge} = require('webpack-merge');
const {CleanWebpackPlugin} = require('clean-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');
let common = require('./webpack.config.js');
const version = require('./package.json').version;

const copyFileList = { patterns: [
  {from: 'assets', to: 'assets'}, 
  {from: 'dist/service-worker.js', to: 'service-worker.js'}, 
  {from: 'dist/manifest.json', to: 'manifest.json'}
] 
};

const config = merge(common, {
  mode: 'production',
  plugins: [
    new webpack.DefinePlugin({
      // Enable both canvas and WebGL for better support
      "typeof CANVAS_RENDERER": JSON.stringify(true),
      "typeof WEBGL_RENDERER": JSON.stringify(true),

      // Development env
      '_DEV_': JSON.stringify(false),
      '_VERSION_': JSON.stringify(version),
    }),
    new CleanWebpackPlugin(),
    new HtmlWebpackPlugin({
      template: 'dist/index.html',      
      inject: 'body',
    }),
    new CopyWebpackPlugin(copyFileList),
  ],
});

webpack(config, (err, stats) => {
  if (err || stats.hasErrors()) {
    // Handle errors here
    console.log(stats.compilation.errors);
  }
  // Done processing
});