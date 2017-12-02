const webpack = require('webpack');
const path = require('path');
const ExtractTextPlugin = require('extract-text-webpack-plugin');

module.exports = {
    entry: {
        mergely: './lib/mergely.js'
    },
    output: {
        path: path.join(__dirname, 'dist'),
        filename: './[name].js'
    },
    module: {
        loaders: [
            { test: /\.css$/, loader: ExtractTextPlugin.extract('css-loader') }
        ]
    },
    resolve: {
        extensions: ['.js'],
        alias: {
            'mergely': path.join(__dirname, 'node_modules', 'mergely'),
            'codemirror': path.join(__dirname, 'node_modules', 'codemirror')
        }
    },
    externals: {
        jquery: 'jQuery',
        codemirror: 'CodeMirror'
    },
    plugins: [
        new webpack.optimize.UglifyJsPlugin({ exclude: /node_modules/ }),
        new ExtractTextPlugin('mergely.css')
        // new ExtractTextPlugin({
        //     filename: (getPath) => {
        //         const fname = getPath('[name].css');//.replace('[name].css', 'lib/[name].css'));
        //         return `lib/${fname}`;
        //         //return getPath('[name].css').replace('[name].css', 'lib/[name].css');
        //         // return 'lib/[name].css';
        //     }
        // })
    ]
};
