const webpack = require('webpack');
const path = require('path');
const CopyWebpackPlugin = require('copy-webpack-plugin');

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
			test: /\.(js)$/,
			exclude: /node_modules/,
			use: ['babel-loader']
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
		new CopyWebpackPlugin({
			patterns: [{
				from: 'src/mergely.css',
				to: 'mergely.css',
				toType: 'file'
			}]
		})
	]
};
