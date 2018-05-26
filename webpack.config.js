const webpack = require('webpack');
const path = require('path');
const ExtractTextPlugin = require('extract-text-webpack-plugin');

module.exports = {
    entry: {
        mergely: './src/mergely.js',
        // 'mergely.min': './src/mergely.js'
    },
    output: {
        path: path.join(__dirname, 'lib'),
        filename: './[name].js',
        library: 'mergely',
        libraryTarget: 'umd',
        umdNamedDefine: true
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
        CodeMirror: 'CodeMirror'
    },
    plugins: [
        // new webpack.optimize.UglifyJsPlugin({
        //     sourceMap: true,
        //     include: /\.js$/,
        //     // include: /\.min\.js$/,
        //     exclude: /node_modules/
        // }),
        new ExtractTextPlugin('mergely.css')
    ]
};
