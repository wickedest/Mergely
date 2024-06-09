const path = require('path');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const TerserPlugin = require("terser-webpack-plugin");
const webpackDevConfig = require('./webpack.dev.js');

module.exports = (mode) => {
	return {
		...webpackDevConfig,
		mode: 'production',
		entry: {
			mergely: './src/mergely.js',
			'mergely.min': "./src/mergely.js",
		},
		output: {
			...webpackDevConfig.output,
			path: path.join(__dirname, 'lib'),
			filename: './[name].js',
			library: {
				name: 'mergely',
				type: 'umd',
			}
		},
		optimization: {
			minimize: true,
			minimizer: [
				new TerserPlugin({
					test: /\.min\.js$/,
					parallel: true
				})
			]
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
}
