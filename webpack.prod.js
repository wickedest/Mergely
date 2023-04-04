const path = require('path');
const CopyWebpackPlugin = require('copy-webpack-plugin');

const dev = {
	mode: 'development',
	entry: {
		mergely: './src/mergely.js',
	},
	devtool: 'inline-source-map',
	output: {
		path: path.join(__dirname, 'lib'),
		filename: './[name].js',
		library: 'mergely',
		libraryTarget: 'umd',
		umdNamedDefine: true
	},
	module: {
		rules: [{
			test: /worker/,
			loader: 'worker-loader',
			options: { inline: 'no-fallback' }
		}]
	},
	resolve: {
		extensions: ['.js']
	},
	externals: {
		CodeMirror: 'CodeMirror'
	}
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
