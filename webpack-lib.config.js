// vim: set sw=4 ts=4 sts=4 expandtab :

const path = require('path');
const { createLib } = require('./webpack.common.js');

const DistDir = 'bin';

module.exports = (env, argv) => {
    const productionBuild = argv.mode === 'production';

    return createLib(
        'rednatco',
        productionBuild,
        DistDir,
        {
            externals: {
                'canvas': 'commonjs canvas',
            },

            moduleRules: [
                {
                    test: /canvas\.node$/,
                    loader: "node-loader",
                    options: {
                        name: '[name].[ext]',
                    },
                },
            ],

            copyPluginPatterns: [
                {
                    from: 'node_modules/canvas/**/*',
                },
                {
                    from: 'jsllka/src/libLLKA_node.*',
                    to() { return path.resolve(__dirname, DistDir, '[name][ext]') },
                },
            ]
        }
    );
}
