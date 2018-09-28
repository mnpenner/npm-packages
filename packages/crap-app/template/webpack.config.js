/* eslint-disable */
const Path = require('path')
const HtmlWebpackPlugin = require('html-webpack-plugin')

module.exports = {
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
        extensions: ['.ts', '.tsx', '.js', '.jsx'],
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
    serve: {
        clipboard: false,
        http2: false,
        devMiddleware: {
            stats: 'errors-only',
        }
    }
}    
