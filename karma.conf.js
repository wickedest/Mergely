const path = require('path');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const webpackConfig = require('./webpack.dev.js');

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
		webpack: webpackConfig,
		webpackServer: {
			noInfo: true
		}
	});
}
