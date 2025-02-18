'use strict';

const path = require('path');
const webpack = require('webpack');
const {merge} = require('webpack-merge');
const {CleanWebpackPlugin} = require('clean-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const { execSync } = require('child_process');
const fs = require('fs');
let common = require('./webpack.config.js');
const version = require('./package.json').version;

// Update the format version function to use GitHub run attempt
const formatVersion = () => {
    try {
        const parts = version.split('.');
        // Ensure we have at least 3 parts (major.minor.patch)
        while (parts.length < 3) {
            parts.push('0');
        }
        
        // Trim to 3 parts in case there were more
        parts.length = 3;
        
        // Add GitHub run attempt as build number
        const runAttempt = process.env.GITHUB_RUN_ATTEMPT || '0';
        parts.push(runAttempt);
        
        // Ensure all parts are valid numbers
        if (!parts.every(part => !isNaN(parseInt(part)))) {
            throw new Error('Invalid version format');
        }
        
        return parts.join('.');
    } catch (error) {
        console.warn('Error formatting version:', error);
        return version; // Fall back to original version
    }
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
    try {
        const manifest = JSON.parse(buffer.toString());
        manifest.version = formattedVersion;
        manifest.gitHash = gitHash;
        manifest.buildTime = new Date().toISOString();
        return JSON.stringify(manifest, null, 2);
    } catch (error) {
        console.error('Error modifying manifest:', error);
        return buffer; // Return original content if there's an error
    }
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