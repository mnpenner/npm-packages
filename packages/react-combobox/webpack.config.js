/* eslint-disable */
const path = require('path')
const webpack = require('webpack')
const HtmlWebpackPlugin = require('html-webpack-plugin')

module.exports = {
    entry: ['./src/index'],
    mode: 'development',
    output: {
        path: path.join(__dirname, 'dist'),
        filename: 'bundle.js',
    },
    devtool: false,
    module: {
        rules: [
            {
                test: /\.tsx?$/,
                use: ['awesome-typescript-loader'],
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
