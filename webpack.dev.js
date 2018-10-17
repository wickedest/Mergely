const webpack = require('webpack')
const path = require('path')
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = {
	mode: 'development',

	module: {
		rules: [{
			include: [path.resolve(__dirname, 'src'), path.resolve(__dirname, 'examples')],
			test: /\.js$/
		}, {
			test: /\.css$/,
			use: [{
				loader: 'style-loader',
				options: {
					sourceMap: true
				}
			}, {
				loader: 'css-loader'
			}]
		}]
	},

	resolve: {
		extensions: ['.js'],
		alias: {
			'CodeMirror':	path.join(__dirname, 'node_modules', 'codemirror'),
			'jQuery':		path.join(__dirname, 'node_modules', 'jquery')
		}
	},

	plugins: [
		new HtmlWebpackPlugin({
			template: 'examples/app.html',
			filename: 'mergely.html'
		}),
		new webpack.ProvidePlugin({
			$: 'jquery',
			jQuery: 'jquery'
		}),
		new webpack.ProvidePlugin({
			CodeMirror: 'codemirror'
		})
	],

	entry: {
		app: [
			'./examples/app',
			'./src/mergely',
		]
	},

	output: {
		filename: 'mergely.js',
	},

	optimization: {
		splitChunks: {
			cacheGroups: {
				vendors: {
					priority: -10,
					test: /[\\/]node_modules[\\/]/
				}
			},

			chunks: 'async',
			minChunks: 1,
			minSize: 30000,
			name: true
		}
	}
}