const path = require('path');
const CopyWebpackPlugin = require('copy-webpack-plugin');

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
				rules: [{
					test: /\.(js)$/,
					exclude: /node_modules/,
					use: ['babel-loader']
				}]
			},
			resolve: {
				extensions: ['.js'],
				alias: {
					CodeMirror: path.join(__dirname, 'node_modules', 'codemirror'),
					jQuery: path.join(__dirname, 'node_modules', 'jquery')
				}
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
		},
		webpackServer: {
			noInfo: true
		}
	});
}
