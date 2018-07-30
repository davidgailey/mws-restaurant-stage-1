const path = require('path');

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