const path = require('path');
const {ProvidePlugin, HotModuleReplacementPlugin} = require('webpack');

const cssLoaders = [
    'style-loader',
    {
        loader: 'css-loader',
        options: {
            importLoaders: 1,
            localIdentName: '[name]_[local]--[hash:base64:5]',
        }
    },
];

module.exports = {
    context: __dirname,
    entry: [
        `${__dirname}/pages/index`,
    ],
    output: {
        path: `${__dirname}/public`,
        filename: 'bundle.js',
        publicPath: '/',
    },
    module: {
        rules: [
            {
                test: /\.jsx?$/,
                exclude: `${__dirname}/node_modules/`,
                use: [
                    {
                        loader: 'babel-loader',
                        options: {
                            plugins: ['transform-react-jsx', 'transform-class-properties', 'transform-function-bind', 'transform-object-rest-spread'],
                        },
                    },
                ],
            },
            {
                test: /\.less$/,
                use: [
                    ...cssLoaders,
                    {
                        loader: 'less-loader',
                        options: {
                            strictMath: true,
                            strictUnits: true,
                        }
                    }
                ]
            },
            {
                test: /\.css$/,
                use: cssLoaders
            },
            {
                test: /\.(svg|eot|ttf|woff2?)($|\?)/i,
                loader: 'file-loader',
            },
        ]
    },
    target: 'web',
    resolve: {
        modules: ['node_modules'],
        extensions: ['.jsx', '.js'],
    },
    devtool: 'cheap-module-eval-source-map',
    plugins: [
        new ProvidePlugin({
            React: 'react',
        }),
        new HotModuleReplacementPlugin(),
    ],
};
