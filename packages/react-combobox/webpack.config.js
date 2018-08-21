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
    // devtool: false,
    module: {
        rules: [
            {
                test: /\.tsx?$/,
                loader: 'awesome-typescript-loader',
                options: {
                    useBabel: true,
                    useCache: true,
                    babelCore: "@babel/core",
                }
            },
        ],
    },
    resolve: {
        extensions: ['.ts', '.tsx', '.js', '.jsx'],
        alias: {
            react: path.resolve(path.join(__dirname, './node_modules/react')),
            'babel-core': path.resolve(
                path.join(__dirname, './node_modules/@babel/core'),
            ),
        },
    },
    plugins: [
        new HtmlWebpackPlugin(),
    ],
    serve: {
        clipboard: false,
        http2: false,
        devMiddleware: {
            stats: 'errors-only',
        }
    }
}
