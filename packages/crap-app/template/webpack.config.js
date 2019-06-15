/* eslint-disable */
const Path = require('path')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const zopfli = require('@gfx/zopfli');
const CompressionPlugin = require('compression-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const {DefinePlugin, ProvidePlugin} = require('webpack');

const isDevelopment = process.env.NODE_ENV === 'development'
const copyrightPatt = /^!|\b(copyright|license)\b|@(preserve|license|cc_on)\b/i;

const babelLoader = {
    loader: 'babel-loader',
    options: {
        cacheDirectory: true,
    },
};

const webpackConfig = {
    entry: './src/index',
    mode: process.env.NODE_ENV,
    output: {
        path: Path.join(__dirname, 'dist'),
        publicPath: '/',
        filename: isDevelopment ? '[name].js' : '[name].[chunkhash].js',
        chunkFilename: isDevelopment ? '[name].bundle.js' : '[chunkhash].js',
    },
    resolveLoader: {
        modules: ['node_modules', `${__dirname}/loaders`]
    },
    devtool: isDevelopment ? 'cheap-module-eval-source-map' : 'source-map',
    module: {
        rules: [
            {
                test: /\.tsx?$/,
                use: babelLoader,
            },
            {
                test: /\.svg($|\?)/i,
                use: [babelLoader, 'svg-to-react-webpack-loader'],
            },
            {
                test: /\.(jpe?g|png|gif)($|\?)/i,
                loader: 'url-loader',
                options: {
                    limit: 200,
                    name: '[name]-[md5:hash:base32:10].[ext]',
                },
            },
            {
                test: /\.less$/,
                use: [
                    isDevelopment ? 'style-loader' : MiniCssExtractPlugin.loader,
                    {
                        loader: 'css-loader',
                        options: {
                            sourceMap: true
                        }
                    },
                    {
                        loader: 'postcss-loader',
                        options: {
                            ident: 'postcss',
                            sourceMap: true,
                            plugins: loader => {
                                const plugins = [
                                    require('autoprefixer'),
                                ];
                                if(!isDevelopment) {
                                    plugins.push(
                                        require('cssnano')({
                                            discardComments: {
                                                remove: comment => !copyrightPatt.test(comment),
                                            },
                                            zindex: false,
                                            reduceIdents: false,
                                            mergeIdents: false,
                                            discardUnused: false,
                                            autoprefixer: false,
                                        })
                                    );
                                }
                                return plugins;
                            },
                        }
                    },
                    {
                        loader: 'less-loader',
                        options: {
                            strictMath: true,
                            strictUnits: true,
                            sourceMap: true,
                        }
                    },
                ]
            }
        ],
    },
    resolve: {
        alias: {
            '@': Path.join(__dirname, 'src'),
            'react-hot-loader': Path.join(__dirname, 'node_modules', 'react-hot-loader'),
            'react-dom': Path.join(__dirname, 'node_modules', '@hot-loader/react-dom'), // https://github.com/gaearon/react-hot-loader#react--dom
            'babel-core': Path.join(__dirname, 'node_modules', '@babel', 'core'),
        },
        extensions: ['.tsx', '.ts', '.jsx', '.js'],
    },
    plugins: [
        new HtmlWebpackPlugin({
            template: 'src/index.html',
            favicon: 'src/images/favicon.ico',
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
        new ProvidePlugin({
            'React': 'react',
        })
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
    // TODO: extract license comments in production:
    // https://webpack.js.org/guides/production/
    // https://webpack.js.org/plugins/terser-webpack-plugin
    // https://github.com/webpack-contrib/closure-webpack-plugin
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
        new MiniCssExtractPlugin({
            filename: '[name].[hash].css',
            chunkFilename: 'chunk.[chunkhash].css',
        }),
        // TODO: Brotli; https://www.npmjs.com/package/brotli#brotlicompressbuffer-istext--false
    )
}

module.exports = webpackConfig;