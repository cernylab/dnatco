// vim: set sw=4 ts=4 sts=4 expandtab :

const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const webpack = require('webpack');
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
                new webpack.ProvidePlugin({ process: 'process/browser' }),
                new HtmlWebpackPlugin({
                    template: path.resolve(__dirname, 'assets/index.html'),
                })
            ],

            copyPluginPatterns: [
                // Molstar viewer image assets must be copied to dist like this
                {
                    from: 'molstar/build/rednatco/assets/imgs/*',
                    to() { return path.resolve(__dirname, DistDir, 'imgs/[name][ext]') },
                }
            ],

            resolveFallbacks: {
                'fs': false,
                'path': false,
            },
        }
    );
};
