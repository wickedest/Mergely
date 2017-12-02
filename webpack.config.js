const webpack = require('webpack');
const path = require('path');
const ExtractTextPlugin = require('extract-text-webpack-plugin');

module.exports = {
    entry: {
        mergely: './src/mergely.js'
    },
    output: {
        path: path.join(__dirname, 'lib'),
        filename: './[name].js',
        library: 'mergely',
        libraryTarget: 'commonjs2'
    },
    module: {
        loaders: [
            { test: /\.css$/, loader: ExtractTextPlugin.extract('css-loader') }
        ]
    },
    resolve: {
        extensions: ['.js']
    },
    externals: {
        jquery: 'jQuery',
        codemirror: 'CodeMirror'
    },
    plugins: [
        new webpack.optimize.UglifyJsPlugin({ exclude: /node_modules/ }),
        new ExtractTextPlugin('mergely.css')
    ]
};
