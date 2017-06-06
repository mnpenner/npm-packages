module.exports = {
    source: 'src',
    dist: 'dist',
    targets: [
        {
            name: "web",
            babel: {
                presets: [
                    [
                        'env',
                        {
                            modules: false,
                            exclude: ['transform-regenerator'],
                            targets: {
                                browsers: [
                                    '> 1%',
                                    'last 2 Firefox versions',
                                    'last 2 Chrome versions',
                                    'last 2 Edge versions',
                                    'last 2 Safari versions',
                                    'Firefox ESR',
                                    "IE >= 11"
                                ]
                            }
                        }
                    ]
                ]

            }
        },
        {
            name: "node",
            babel: {
                presets: [
                    [
                        'env',
                        {
                            exclude: ['transform-regenerator'],
                            targets: {
                                node: '7.6'
                            }
                        }
                    ]
                ]
            }
        }
    ],
    babel: target => ({
        plugins: [
            'babel-plugin-transform-class-properties',
            'babel-plugin-syntax-object-rest-spread',
            'babel-plugin-transform-object-rest-spread',
            'babel-plugin-transform-function-bind',
            ['babel-plugin-transform-define', {
                BUILD_TARGET: target.name,
            }]
        ]
    })
};