const os = require('os');
const path = require('path');
const webpack = require('webpack');
const webpackConfig = require('./webpack.dev.js');

const ENTROPY_SIZE = 1000000;
const outputPath = `${path.join(os.tmpdir(), "_karma_webpack_")}${Math.floor(Math.random() * ENTROPY_SIZE)}`;

module.exports = function(config) {
	config.set({
		restartOnFileChange: true,

		browsers: [ 'MyHeadlessChrome' ],

		customLaunchers: {
			MyHeadlessChrome: {
				base: 'ChromeHeadless',
				flags: [ '--no-sandbox' ]
			}
		},

		frameworks: [
			'webpack',
			'mocha',
			'chai'
		],

		plugins: [
			'karma-webpack',
			'karma-mocha',
			'karma-chai',
			'karma-chrome-launcher',
			'karma-sourcemap-loader',
			'karma-mocha-reporter',
			'karma-coverage-istanbul-reporter',
			// 'karma-coverage-istanbul-instrumenter'
		],

		files: [
			'node_modules/codemirror/lib/codemirror.css',
			'src/mergely.css',
			'src/*.js',
			'test/**/*.spec.js'
		],

		preprocessors: {
			'node_modules/codemirror/lib/codemirror.js': [ 'webpack' ],
			'test/*.spec.js': [ 'webpack' ],
			// 'src/*.js': [ 'webpack', 'sourcemap', 'karma-coverage-istanbul-instrumenter' ]
			'src/*.js': [ 'webpack', 'sourcemap' ]
		},

		reporters: [ 'mocha', 'coverage-istanbul' ],

		coverageIstanbulReporter: {
			reports: [ 'html', 'lcov', 'text-summary' ],
			dir: path.join(__dirname, 'coverage'),
			fixWebpackSourcePaths: false,
			esModules: false,
			// enforce percentage thresholds
			// anything under these percentages will cause karma to fail
			// with an exit code of 1 if not running in watch mode
			thresholds: {
					// set to `true` to not fail the test command when thresholds are not met
					emitWarning: true,
					global: { // thresholds for all files
							statements: 94.09,
							branches: 89.92,
							functions: 92.67,
							lines: 94.33
					}
			}
		},

		colors: true,

		logLevel: config.LOG_DEBUG,

		singleRun: true,

		webpack: tweakWebpack(webpackConfig),
	});
}

function tweakWebpack(webpackConfig) {
	const config = {
		...webpackConfig,
		output: {
			// https://github.com/scottohara/tvmanager/issues/99
			path: outputPath
		},
		externals: {
			CodeMirror: 'CodeMirror'
		}
	};
	if (!config.plugins) {
		config.plugins = [];
	}
	config.plugins.push(
		new webpack.ProvidePlugin({
			CodeMirror: 'codemirror'
		})
	);
	config.devtool = 'inline-source-map';

	return config;
}
