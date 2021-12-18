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
			'test/**/*.spec.js'
		],

		preprocessors: {
			'node_modules/codemirror/lib/codemirror.js': ['webpack'],
			'test/**/*.spec.js': ['webpack'],
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
