const path = require('path');
const package = require('./package.json');
const webpack = require('webpack');

module.exports = {
	mode: 'development',
	devtool: 'cheap-module-eval-source-map',
	entry: {
		// see here for how multiple outputs work 
		// https://stackoverflow.com/questions/35903246/how-to-create-multiple-output-paths-in-webpack-config
		'sw' : './src/sw.js',
		'dist/js/restaurant_info' : './src/restaurant_info.js'
	},
	output: {
		filename: '[name].js',
		path: path.resolve(__dirname, ''),
		publicPath: '/'
	},
};