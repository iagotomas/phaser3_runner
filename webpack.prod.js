'use strict';

const path = require('path');
const webpack = require('webpack');
const {merge} = require('webpack-merge');
const {CleanWebpackPlugin} = require('clean-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const { execSync } = require('child_process');
let common = require('./webpack.config.js');
const version = require('./package.json').version;

// Add new function to handle version formatting
const formatVersion = () => {
    const parts = version.split('.');
    // If we have less than 4 parts, add build number starting at 0
    while (parts.length < 4) {
        parts.push('0');
    }
    
    // Increment the build number (last digit)
    parts[3] = String(parseInt(parts[3]) + 1);
    
    return parts.join('.');
}

const formattedVersion = formatVersion();

// Get git hash
const getGitHash = () => {
    try {
        return execSync('git rev-parse --short HEAD').toString().trim();
    } catch (e) {
        console.warn('Unable to get git hash:', e);
        return 'unknown';
    }
}

const gitHash = getGitHash();

// Function to modify manifest.json content
const modifyManifest = (buffer) => {
    const manifest = JSON.parse(buffer.toString());
    manifest.version = formattedVersion;
    manifest.gitHash = gitHash;
    manifest.buildTime = new Date().toISOString();
    return JSON.stringify(manifest, null, 2);
}

const copyFileList = { 
    patterns: [
        {from: 'assets', to: 'assets'}, 
        {from: 'dist/service-worker.js', to: 'service-worker.js'}, 
        {
            from: 'dist/manifest.json', 
            to: 'manifest.json',
            transform(content) {
                return modifyManifest(content);
            }
        }
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
            '_VERSION_': JSON.stringify(formattedVersion),
            '_GIT_HASH_': JSON.stringify(gitHash),
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