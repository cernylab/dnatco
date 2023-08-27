// vim: set sw=4 ts=4 sts=4 expandtab :
const path = require('path');
const CopyPlugin = require('copy-webpack-plugin');
const CssMinimizerPlugin = require('css-minimizer-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const webpack = require('webpack');
////  const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;

const BinDir = 'bin';
const DistDir = 'dist';

function sharedConfig(productionBuild, buildingApp) {
    return {
        devServer: {
            client: {
                logging: 'warn',
                overlay: {
                    errors: true,
                    warnings: true,
                    runtimeErrors: true,
                },
                progress: true,
            },
            static: {
                directory: path.join(__dirname, DistDir),
            },
            compress: false,
            port: 8118,
        },

        node: {
            // provides the global variable named "global"
            global: true,
        },

        mode: productionBuild ? 'production' : 'development',
        module: {
            rules: [
                {
                    test: /molstar.js/,
                    use: [{
                        loader: 'file-loader',
                        options: {
                            name: '[contenthash].[ext]',
                            sourceMap: false,
                        },
                    }],
                },
                {
                    test: /\.(svg|png|jpe?g)$/,
                    use: [{
                        loader: 'file-loader',
                        options: {
                            outputPath: 'imgs',
                            name: '[contenthash].[ext]',
                            sourceMap: false,
                        },
                    }],
                },
                {
                    test: /\.ttf$/,
                    use: [{
                        loader: 'file-loader',
                        options: {
                            outputPath: 'fonts/ttf',
                            name: '[name].[ext]',
                            sourceMap: false,
                        },
                    }],
                },
                {
                    test: /\.csv$/,
                    include: [path.resolve(__dirname, 'assets/naval')],
                    use: [{
                        loader: 'file-loader',
                        options: {
                            outputPath: 'naval',
                            name: '[contenthash].[ext]',
                            sourceMap: false,
                        }
                    }],
                },
                {
                    test: /\.csv$/,
                    exclude: [path.resolve(__dirname, 'assets/naval')],
                    use: [{
                        loader: 'file-loader',
                        options: {
                            sourceMap: false,
                        }
                    }],
                },
                {
                    test: /\.(s*)css$/,
                    use: [
                        MiniCssExtractPlugin.loader,
                        'css-loader',
                    ],
                },
            ],
        },
        plugins: [
            new CssMinimizerPlugin(),
            new MiniCssExtractPlugin({ filename: 'rednatco.css' }),
            new CopyPlugin({
                patterns: [
                    {
                        from: 'assets/contour_plots/le18/**/*',
                        to() { return path.resolve(__dirname, DistDir, 'contour_plots/le18/[name][ext]') },
                        filter: async (resourcePath) => { return resourcePath.endsWith('.png') || resourcePath.endsWith('.pdf'); },
                    },
                    {
                        from: 'assets/contour_plots/gt25/**/*',
                        to() { return path.resolve(__dirname, DistDir, 'contour_plots/gt25/[name][ext]') },
                        filter: async (resourcePath) => { return resourcePath.endsWith('.png') || resourcePath.endsWith('.pdf'); },
                    },
                    // TODO: Turn the .json files into actual assets. This will allow us to do away with this lame hack
                    buildingApp
                        ? {
                            from: 'assets/angles_lengths/*.json',
                            to() { return path.resolve(__dirname, DistDir, 'angles_lengths/[name][ext]') },
                        }
                        : {
                            from: 'assets/angles_lengths/*.json',
                            to() { return path.resolve(__dirname, BinDir, 'angles_lengths/[name][ext]') },
                        },
                    // Molstar viewer image assets must be copied to dist like this
                    {
                        from: 'molstar/build/rednatco/assets/imgs/*',
                        to() { return path.resolve(__dirname, DistDir, 'imgs/[name][ext]') },
                    }
                ]
            }),
            buildingApp || true
                ? new webpack.ProvidePlugin({
                        process: 'process/browser'
                    })
                : webpack.ProvidePlugin({ process: 'process' }),
            new webpack.ProvidePlugin({
                Buffer: ['buffer', 'Buffer'],
            }),
            buildingApp
                ? new HtmlWebpackPlugin({
                    template: path.resolve(__dirname, 'assets/index.html'),
                })
                : void 0,
            // new BundleAnalyzerPlugin()
        ],
        resolve: {
            modules: [
                'node_modules',
                path.resolve(__dirname, 'lib/src'),
            ],
            alias: {
                'viewer-api': path.resolve(__dirname, 'lib/molstar/src/apps/rednatco/api.js'),
                'viewer-filters': path.resolve(__dirname, 'lib/molstar/src/apps/rednatco/filters.js'),
                'assets': path.resolve(__dirname, 'assets'),
                'process': 'process/browser'
            },
            fallback: {
                'assert': require.resolve('assert'),
                'buffer': require.resolve('buffer'),
                'stream': require.resolve('stream-browserify'),
            }
        },
        experiments: {
            topLevelAwait: true,
        }
    };
};

function createApp(name, productionBuild) {
    if (productionBuild)
        console.log('Building for production...');
    else
        console.log('Building for development');

    return {
        node: false,
        target: 'web',
        entry: {
            app: path.resolve(__dirname, `lib/src/${name}.js`),
        },
        output: {
            filename: `${name}[chunkhash].js`,
            path: path.resolve(__dirname, DistDir)
        },
        ...sharedConfig(productionBuild, true),
    };
}

function createLib(name, productionBuild) {
    if (productionBuild)
        console.log('Building for production...');
    else
        console.log('Building for development');

    return {
        node: true,
        target: 'node',
        entry: {
            app: path.resolve(__dirname, `lib/librednatco/lib/${name}.js`),
        },
        output: {
            filename: `${name}.js`,
            path: path.resolve(__dirname, BinDir)
        },
        ...sharedConfig(productionBuild, false),
    };
}

module.exports = {
    createApp,
    createLib,
};
