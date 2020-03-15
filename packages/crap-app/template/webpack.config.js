/* eslint-disable */
const Path = require('path')
const FS = require('fs');
const HtmlWebpackPlugin = require('html-webpack-plugin')
const zopfli = require('@gfx/zopfli');
const CompressionPlugin = require('compression-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const {DefinePlugin, ProvidePlugin, ProgressPlugin} = require('webpack');
const {CleanWebpackPlugin} = require('clean-webpack-plugin');
const TerserPlugin = require('terser-webpack-plugin');

const isDevelopment = process.env.NODE_ENV === 'development'
const isDevServer = process.env.WEBPACK_DEV_SERVER; // https://stackoverflow.com/a/57474397/65387
const copyrightPatt = /^!|\b(copyright|license)\b|@(preserve|license|cc_on)\b/i;

console.log('isDevServer',isDevServer);

const babelLoader = {
    loader: 'babel-loader',
    options: {
        cacheDirectory: true,
    },
};


const cssLoader = [
    isDevelopment ? 'style-loader' : MiniCssExtractPlugin.loader,
    {
        loader: 'css-loader',
        options: {
            sourceMap: true,
            modules: {
                localIdentName: isDevelopment ? '[path][name]__[local]' : '[hash:base64]', // https://webpack.js.org/loaders/css-loader/#localidentname
            },
            localsConvention: 'camelCaseOnly',
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
                    // TODO: investigate postcss-preset-env https://preset-env.cssdb.org/features
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

const webpackConfig = {
    entry: './src/index',
    mode: process.env.NODE_ENV,
    output: {
        path: Path.join(__dirname, 'dist'),
        publicPath: '/',
        filename: isDevelopment ? '[name].js' : '[contenthash].js',
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
                    ...cssLoader,
                    {
                        loader: 'less-loader',
                        options: {
                            strictMath: true,
                            strictUnits: true,
                            sourceMap: true,
                        }
                    },
                ]
            },
            {
                test: /\.css$/,
                use: cssLoader
            }
        ],
    },
    resolve: {
        alias: {
            '@': Path.join(__dirname, 'src'),
            'babel-core': require.resolve('@babel/core'), // TODO: test if this is still needed
        },
        extensions: ['.tsx', '.ts', '.jsx', '.js'],
    },
    plugins: [
        new HtmlWebpackPlugin({
            template: 'src/index.html',
            favicon: 'src/images/favicon.ico',
            minify: isDevelopment ? false : {
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
            DEBUG: JSON.stringify(isDevelopment),
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
        // https: { // Enable chrome://flags/#allow-insecure-localhost to bypass the security warning, or delete this block to disable HTTPS.
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

if(isDevelopment) {
    Object.assign(webpackConfig.resolve.alias,{
        'react-dom': Path.join(__dirname, 'node_modules', '@hot-loader/react-dom'), // https://github.com/gaearon/react-hot-loader#react--dom
    });
} else {
    // https://webpack.js.org/guides/production/
    const compressible = /\.(js|json|html|map|css|svg|htc|eot|ttf)($|\?)/i;

    webpackConfig.plugins.push(
        new ProgressPlugin(),
        new CleanWebpackPlugin(),
        new CompressionPlugin({
            filename: '[path].gz[query]',
            test: compressible,
            compressionOptions: {
                numiterations: 5
            },
            algorithm(input, compressionOptions, callback) {
                return zopfli.gzip(input, compressionOptions, callback);
            }
        }),
        new CompressionPlugin({
            // Not currently supported by `serve` (https://github.com/zeit/serve/issues/543) but works with nginx (https://github.com/google/ngx_brotli#brotli_static)
            filename: '[path].br[query]',
            test: compressible,
            compressionOptions: {
                level: 11
            },
            algorithm: 'brotliCompress'
        }),
        new MiniCssExtractPlugin({
            filename: '[name].[contenthash].css',
            chunkFilename: 'chunk.[chunkhash].css',
        }),
    );

    webpackConfig.optimization = {
        minimizer: [
            // https://webpack.js.org/plugins/terser-webpack-plugin
            // terser-webpack-plugin produces smaller filesizes and is more compatible than closure-webpack-plugin.
            new TerserPlugin({
                cache: true,
                parallel: true,
                sourceMap: true,
                terserOptions: {
                    // https://github.com/webpack-contrib/terser-webpack-plugin#terseroptions
                    extractComments: copyrightPatt,
                }
            }),
        ],
    }
}

module.exports = webpackConfig;
