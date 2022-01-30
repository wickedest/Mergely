const webpack = require('webpack')
const path = require('path')
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = {
	mode: 'development',

	module: {
		rules: [{
			include: [
				path.resolve(__dirname, 'src'),
				path.resolve(__dirname, 'examples')
			],
			test: /\.js$/
		}, {
			test: /\.(js)$/,
			exclude: /node_modules/,
			use: ['babel-loader']
		}, {
			test: /\.css$/,
			use: [{
				loader: 'style-loader'
			}, {
				loader: 'css-loader'
			}]
		}]
	},

	resolve: {
		extensions: ['.js'],
		alias: {
			'CodeMirror': path.join(__dirname, 'node_modules', 'codemirror')
		}
	},

	plugins: [
		new HtmlWebpackPlugin({
			template: path.join(__dirname, 'examples', 'app.html')
		}),
		new webpack.ProvidePlugin({
			CodeMirror: 'codemirror'
		})
	],

	entry: {
		app: [
			'./examples/app',
			'./src/mergely'
		]
	},

	output: {
		filename: 'mergely.js'
	},

	optimization: {
		chunkIds: 'named'
		// splitChunks: { chunks: 'all' }
		/*
		splitChunks: {
			cacheGroups: {
				vendors: {
					priority: -10,
					test: /[\\/]node_modules[\\/]/
				}
			},
			chunks: 'async',
			minChunks: 1,
			minSize: 30000
		}
		*/
	}
}
