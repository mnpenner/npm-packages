/* eslint-disable */
const path = require('path')
const webpack = require('webpack')
const HtmlWebpackPlugin = require('html-webpack-plugin')

module.exports = {
    entry: './src/index',
    mode: process.env.NODE_ENV,
    output: {
        path: path.join(__dirname, 'dist'),
        filename: '[name].bundle.js',
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
            title: "Combobox",
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
