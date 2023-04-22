const path = require('path');
const CopyWebpackPlugin = require('copy-webpack-plugin');

const dev = {
	mode: 'production',

	entry: {
		mergely: './src/mergely.js',
	},

	devtool: 'eval-cheap-source-map',

	module: {
		rules: [{
			test: /worker/,
			loader: 'worker-loader',
			options: { inline: 'no-fallback' }
		}, {
			include: [
				path.resolve(__dirname, 'src'),
				path.resolve(__dirname, 'examples')
			],
			test: /\.js$/
		}, {
			test: /\.css$/,
			use: [{
				loader: 'style-loader'
			}, {
				loader: 'css-loader'
			}]
		}]
	},

	output: {
		path: path.join(__dirname, 'lib'),
		filename: './[name].js',
		library: 'mergely',
		libraryTarget: 'umd',
		umdNamedDefine: true,
		libraryTarget: 'umd'
	},


	// module: {
	// 	rules: [{
	// 		test: /worker/,
	// 		loader: 'worker-loader',
	// 		options: { inline: 'no-fallback' }
	// 	}, {
	// 		loader: 'css-loader'
	// 	}]
	// },

	resolve: {
		extensions: ['.js']
	},
	// externals: [
	// 	function external({ _, request }, cb) {
	// 		if (request.indexOf('codemirror') >= 0) {
	// 			// exclude, but expect global `CodeMirror`
	// 			return cb(null, 'CodeMirror');
	// 		}
	// 		return cb();
	// 	}
	// ]
};

const prod = {
	...dev,
	mode: 'production',
	output: {
		...dev.output,
		filename: './[name].min.js',
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

module.exports = (mode) => {
	return [ dev, prod ];
}
