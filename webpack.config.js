// vim: set sw=4 ts=4 sts=4 expandtab :

const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const { createApp } = require('./webpack.common.js');

const DistDir = 'dist';

module.exports = (env, argv) => {
    const productionBuild = argv.mode === 'production';

    return createApp(
        'index',
        productionBuild,
        DistDir,
        {
            plugins: [
                new HtmlWebpackPlugin({
                    template: path.resolve(__dirname, 'assets/index.html'),
                })
            ],

            copyPluginPatterns: [
                // Molstar viewer image assets must be copied to dist like this
                {
                    from: 'molstar/build/rednatco/imgs/*',
                    to() { return path.resolve(__dirname, DistDir, 'imgs/[name][ext]') },
                },
                {
                    from: 'assets/classification',
                    to() { return path.resolve(__dirname, DistDir, 'classification') },
                },

            ],

            resolveFallbacks: {
                'fs': false,
                'path': false,
            },
        }
    );
};
