// vim: set sw=4 ts=4 sts=4 expandtab :

const path = require('path');
const CopyPlugin = require('copy-webpack-plugin');
const { createServerApp } = require('./webpack.common.js');

const DistDir = 'server';

module.exports = (env, argv) => {
    const productionBuild = argv.mode === 'production';

    return createServerApp(
        'server',
        'index',
        productionBuild,
        DistDir,
        {
            mode: productionBuild ? 'production' : 'development',

            externals: {
                'better-sqlite3': 'commonjs better-sqlite3'
            },
            plugins: [
                new CopyPlugin({
                    patterns: [
                        {
                            from: 'node_modules/bindings/**/*',
                        },
                        {
                            from: 'node_modules/file-uri-to-path/**/*',
                        },
                        {
                            from: 'node_modules/better-sqlite3/**/*',
                        },
                    ]
                })
            ],
            resolve: {
                modules: [
                    'node_modules',
                    path.resolve(__dirname, 'lib'),
                ],
            },
        }
    );
}
