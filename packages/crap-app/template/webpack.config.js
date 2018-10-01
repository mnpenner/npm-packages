/* eslint-disable */
const Path = require('path')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const FS = require('fs');
const zopfli = require('@gfx/zopfli');
const CompressionPlugin = require('compression-webpack-plugin');

const webpackConfig = {
    entry: './src/index',
    mode: process.env.NODE_ENV,
    output: {
        path: Path.join(__dirname, 'dist'),
        filename: process.env.NODE_ENV === 'development' ? '[name].js' : '[name].[chunkhash].js',
    },
    devtool: process.env.NODE_ENV === 'development' ? 'cheap-module-eval-source-map' : 'source-map',
    module: {
        rules: [
            {
                test: /\.tsx?$/,
                loader: 'awesome-typescript-loader',
                options: {
                    useBabel: true,
                    useCache: false,
                    babelCore: '@babel/core',
                }
            },
        ],
    },
    resolve: {
        extensions: ['.tsx', '.ts', '.jsx', '.js'],
    },
    plugins: [
        new HtmlWebpackPlugin({
            template: 'src/index.html',
            minify: process.env.NODE_ENV !== 'development' && {
                caseSensitive: false,
                removeComments: true,
                collapseWhitespace: true,
                removeRedundantAttributes: true,
                useShortDoctype: false,
                removeEmptyAttributes: true,
                removeStyleLinkTypeAttributes: true,
                removeScriptTypeAttributes: true,
                keepClosingSlash: false,
                minifyJS: true,
                minifyCSS: true,
                minifyURLs: true,
                sortAttributes: true,
                sortClassName: true,
            },
        }),
    ],
    devServer: {
        headers: {
            'Access-Control-Allow-Origin': '*',
        },
        host: '0.0.0.0',
        useLocalIp: true,
        historyApiFallback: true,
        overlay: true,
        // https: {
        //     key: FS.readFileSync('ssl/cert.key'),
        //     cert: FS.readFileSync('ssl/cert.pem'),
        // },
        watchOptions: {
            aggregateTimeout: 250,
            poll: 50,
            ignored: /\bnode_modules\b/
        },
        stats: 'minimal',
    }
}    

if(process.env.NODE_ENV !== 'development') {
    webpackConfig.plugins.unshift(
        new CompressionPlugin({
            test: /\.(js|json|html|map|css|svg|htc|eot|woff|ttf)($|\?)/i,
            compressionOptions: {
                numiterations: 5
            },
            algorithm(input, compressionOptions, callback) {
                return zopfli.gzip(input, compressionOptions, callback);
            }
        })
    )
}

module.exports = webpackConfig;