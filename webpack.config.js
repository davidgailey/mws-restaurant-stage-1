const path = require('path');
const package = require('./package.json');
const webpack = require('webpack');

module.exports = {
	mode: 'development',
	devtool: 'cheap-module-eval-source-map',
	entry: {
		sw: './src/sw.js',
	},
	output: {
		filename: '[name].js',
		path: path.resolve(__dirname, ''),
		publicPath: '/'
	},
};