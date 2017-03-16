const {ProvidePlugin, HotModuleReplacementPlugin, NamedModulesPlugin} = require('webpack');

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
        // 'react-hot-loader/patch',
        // 'webpack-dev-server/client?http://localhost:8080',
        // 'webpack/hot/only-dev-server',
        'normalize.css',
        './pages',
    ],
    output: {
        path: `${__dirname}/public`,
        filename: 'bundle.js',
        publicPath: '/',
    },
    devServer: {
        contentBase: `./public`,
        hot: false,
    },
    watchOptions: {
        aggregateTimeout: 50,
        poll: 50
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
                            compact: false,
                            plugins: [
                                'transform-react-jsx',
                                'transform-class-properties',
                                'transform-function-bind',
                                'transform-object-rest-spread',
                                // 'react-hot-loader/babel',
                            ],
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
        // new HotModuleReplacementPlugin(),
        new NamedModulesPlugin(),
    ],
};
