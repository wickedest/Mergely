const webpack = require('webpack');
const path = require('path');
const ExtractTextPlugin = require('extract-text-webpack-plugin');

var imageLoaderOptions = {
    mozjpeg: {
        quality: 65
    },
    pngquant: {
        quality: '65-90',
        speed: 4
    },
    svgo:{
        plugins: [{
            removeViewBox: false
        }, {
            removeEmptyAttrs: false
        }]
    },
    gifsicle: {
        optimizationLevel: 7,
        interlaced: false
    },
    optipng: {
        optimizationLevel: 7,
        interlaced: false
    },
    webp: {
        quality: 75
    }
}

var fileLoaderOptions = {
    hash: 'sha512',
    digest: 'hex',
    name: '[hash].[ext]',
    outputPath: './editor/'
}

module.exports = {
    entry: {
        mergely: './lib/mergely.js'
    },
    output: {
        path: path.join(__dirname, 'dist'),
        filename: '[name].js'
    },
    module: {
        loaders: [
            { test: /\.css$/, loader: ExtractTextPlugin.extract('css-loader') },
            {
                test: /\.(jpe?g|png|gif|svg)$/i,
                use: [{
                    loader: 'file-loader',
                    options: fileLoaderOptions
                }, {
                    loader: 'image-webpack-loader',
                    options: imageLoaderOptions
                }]

                // use: [
                //     'file-loader', {
                //         loader: 'image-webpack-loader',
                //         options: {
                //                 mozjpeg: {
                //                 progressive: true,
                //                 quality: 65
                //             }
                //         }
                //     }
                // ]
                // loaders: [
                //     // 'file-loader?hash=sha512&digest=hex&name=[hash].[ext]',
                //     // 'image-webpack-loader?bypassOnDebug&optimizationLevel=7&interlaced=false'
                //     {
                //         loader: 'file-loader',
                //         query: {
                //             hash: 'sha512',
                //             digest: 'hex',
                //             name: '[hash].[ext]'
                //         }
                //     },
                //     {
                //         loader: 'image-webpack-loader',
                //         query: {

                //             bypassOnDebug: true,
                //             optimizationLevel: 7,
                //             interlaced: false                            
                //         }
                //     }
                // ]
            }
        ]
    },
    // externals: /^(codemirror|jquery|\$)$/i,
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
        // new webpack.optimize.UglifyJsPlugin({
        //     comments: false,
        //     compress: {
        //         screw_ie8: true,
        //         warnings: false
        //     },
        //     mangle: {
        //         except: ['$', 'exports', 'require']
        //     }
        // }),
        new ExtractTextPlugin('mergely.css')
    ]
};
