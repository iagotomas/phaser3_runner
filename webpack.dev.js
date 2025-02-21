'use strict';

const fs = require('fs');
const path = require('path');
const webpack = require('webpack');
const { merge } = require('webpack-merge');
const WebpackDevServer = require('webpack-dev-server');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const common = require('./webpack.config.js');
const version = require('./package.json').version;
const CopyWebpackPlugin = require('copy-webpack-plugin');

const copyFileList = { patterns: [
  {from: 'dist/service-worker.js', to: 'service-worker.js'}, 
  {from: 'dist/manifest.json', to: 'manifest.json'}
] 
};

const portfinder = require('portfinder');
portfinder.basePort = 4000;

portfinder.getPort(function(err, finalPort) {
  if (err) {
    callback(err);
  }
  const compiler = webpack(merge(common, {
    entry: {
      game: [
        // Live-reload
        `webpack-dev-server/client?http://localhost:${finalPort}`,
      ],
      vendor: ['phaser']
    },
    devtool: 'source-map',
    mode: 'development',
    plugins: [
      new webpack.DefinePlugin({
        // Enable both canvas and WebGL for better support
        "CANVAS_RENDERER": JSON.stringify(true),
        "WEBGL_RENDERER": JSON.stringify(true),

        // Development env
        '_DEV_': JSON.stringify(true),
        '_VERSION_': JSON.stringify(version),
      }),
      new HtmlWebpackPlugin({
        template: 'dist/index.html',
        inject: 'body',
      }),
      new CopyWebpackPlugin(copyFileList)
    ],
  }));
  const server = new WebpackDevServer(compiler, {
    https: {
      key: fs.readFileSync(path.join(__dirname, 'certs/private.key')),
      cert: fs.readFileSync(path.join(__dirname, 'certs/certificate.crt')),
    },
    stats: {
      colors: true,
    },
  });
  server.listen(finalPort, null, function() {
    console.log('Project is running at: https://localhost:' + finalPort);
  });
});