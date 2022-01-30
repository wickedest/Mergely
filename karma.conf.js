const os = require('os');
const path = require('path');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const webpackConfig = require('./webpack.dev.js');

const ENTROPY_SIZE = 1000000;
const outputPath = `${path.join(os.tmpdir(), "_karma_webpack_")}${Math.floor(Math.random() * ENTROPY_SIZE)}`;

module.exports = function(config) {
	config.set({
		basePath: './',
		// browserNoActivityTimeout: 3600000,
		// pingTimeout: 60000,
		restartOnFileChange: true,

		browsers: [
			'ChromeHeadless'
		],

		frameworks: [
			'mocha', 'chai'
		],

		files: [
			'node_modules/codemirror/lib/codemirror.css',
			'src/mergely.css',
			'test/**/*.spec.js',
			{
				pattern: `${outputPath}/**/*`,
				watched: false,
				included: false
			}
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
			mocha: {
				timeout: 50000
			}
		},
		// https://github.com/scottohara/tvmanager/issues/99
		webpack: {
			...webpackConfig,
			output: {
				path: outputPath
			}
		},
		webpackServer: {
			noInfo: true
		}
	});
}
