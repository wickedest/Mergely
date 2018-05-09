const path = require('path');
const webpackCfg = require('./webpack.config');
const ExtractTextPlugin = require('extract-text-webpack-plugin');

module.exports = function(config) {
	config.set({
		basePath: './',

		browsers: [
			'ChromeHeadless'
		],

		frameworks: [
			'mocha', 'chai'
		],

		files: [
			'node_modules/codemirror/lib/codemirror.css',
			'src/mergely.css',
			'tests/**/*.spec.js'
		],

		preprocessors: {
			'node_modules/jquery/dist/jquery.js': ['webpack'],
			'node_modules/codemirror/lib/codemirror.js': ['webpack'],
			'tests/**/*.spec.js': ['webpack'],
			'src/**/*.js': ['webpack']
		},

		reporters: ['mocha'],
		mochaReporter: {
			showDiff: true
		},

		singleRun: true,
		client: {
			captureConsole: true,
			mocha: {}
		},
		webpack: {
			entry: './src/mergely.js',
			module: {
				loaders: [
					{ test: /\.css$/, loader: ExtractTextPlugin.extract('css-loader') }
				]
			},
			resolve: {
				extensions: ['.js'],
				alias: {
					CodeMirror: path.join(__dirname, 'node_modules', 'codemirror'),
					jQuery: path.join(__dirname, 'node_modules', 'jquery')
				}
			},
			plugins: [
				new ExtractTextPlugin('mergely.css')
			]
		},
		webpackServer: {
			noInfo: true
		}
	});
}
