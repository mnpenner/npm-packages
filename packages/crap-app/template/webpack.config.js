/* eslint-disable */
const Path = require('path')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const zopfli = require('@gfx/zopfli');
const CompressionPlugin = require('compression-webpack-plugin');
const {DefinePlugin} = require('webpack');

const isDevelopment = process.env.NODE_ENV === 'development'

const webpackConfig = {
    entry: './src/index',
    mode: process.env.NODE_ENV,
    output: {
        path: Path.join(__dirname, 'dist'),
        filename: isDevelopment ? '[name].js' : '[name]-[chunkhash].js',
    },
    devtool: isDevelopment ? 'cheap-module-eval-source-map' : 'source-map',
    module: {
        rules: [
            {
                test: /\.tsx?$/,
                use: [
                    {
                        loader: 'babel-loader',
                        options: {
                            cacheDirectory: true,
                        },
                    },
                    {
                        loader: "ts-loader",
                        options: {
                            compilerOptions: {
                                module: "esnext",
                            },
                            transpileOnly: true, // Skip typechecking to speed up bundling
                        },
                    },
                ],
            },
            {
                test: /\.(jpe?g|png|gif|svg)($|\?)/i,
                loader: 'url-loader',
                options: {
                    limit: 200,
                    name: '[name]-[md5:hash:base32:10].[ext]',
                },
            },
        ],
    },
    resolve: {
        alias: {
            '@': Path.join(__dirname, 'src'),
        },
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
        new DefinePlugin({
            'process.env': {
                NODE_ENV: JSON.stringify(process.env.NODE_ENV),
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
    },
    node: {
        dgram: 'empty',
        fs: 'empty',
        net: 'empty',
        tls: 'empty',
        child_process: 'empty',
    },
    performance: {
        hints: isDevelopment ? false : 'warning',
    },
}    

if(!isDevelopment) {
    webpackConfig.plugins.push(
        new CompressionPlugin({
            test: /\.(js|json|html|map|css|svg|htc|eot|woff|ttf)($|\?)/i,
            compressionOptions: {
                numiterations: 5
            },
            algorithm(input, compressionOptions, callback) {
                return zopfli.gzip(input, compressionOptions, callback);
            }
        }),
        // TODO: Brotli; https://www.npmjs.com/package/brotli#brotlicompressbuffer-istext--false
    )
}

module.exports = webpackConfig;