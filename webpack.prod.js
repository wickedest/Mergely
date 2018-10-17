const webpack = require('webpack');
const path = require('path');
const ExtractTextPlugin = require('extract-text-webpack-plugin');

module.exports = {
	mode: 'production',
	entry: {
		mergely: './src/mergely.js',
	},
	output: {
		path: path.join(__dirname, 'lib'),
		filename: './[name].js',
		library: 'mergely',
		libraryTarget: 'umd',
		umdNamedDefine: true
	},
	module: {
		rules: [{
			test: /\.css$/,
			loader: ExtractTextPlugin.extract('css-loader')
		}]
	},
	resolve: {
		extensions: ['.js']
	},
	externals: {
		jquery: 'jQuery',
		CodeMirror: 'CodeMirror'
	},
	plugins: [
		new ExtractTextPlugin('mergely.css')
	]
};
