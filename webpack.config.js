const path = require('path');
const CopyPlugin = require('copy-webpack-plugin');
const CssMinimizerPlugin = require('css-minimizer-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const TerserPlugin = require('terser-webpack-plugin');

const DistDir = 'dist';

function sharedConfig(productionBuild) {
    return {
        module: {
            rules: [
                {
                    test: /molstar.js/,
                    use: [{
                        loader: 'file-loader',
                        options: {
                            name: '[name].[ext]',
                            sourceMap: false,
                        },
                    }],
                },
                {
                    test: /\.php$/,
                    use: [{
                        loader: 'file-loader',
                        options: {
                            name: '[name].[ext]',
                            sourceMap: false,
                        },
                    }],
                },
                {
                    test: /\.html$/,
                    use: [{
                        loader: 'file-loader',
                        options: {
                            name: '[name].[ext]',
                            outputPath: 'html/',
                            sourceMap: false,
                        }
                    }],
                },
                {
                    test: /\.(svg|png|jpe?g)$/,
                    use: [{
                        loader: 'file-loader',
                        options: {
                            outputPath: 'imgs',
                            name: '[name].[ext]',
                            sourceMap: false,
                        },
                    }],
                },
                {
                    test: /\.(s*)css$/,
                    use: [
                        MiniCssExtractPlugin.loader,
                        {
                            loader: 'css-loader',
                            options: {
                                sourceMap: false
                            },
                        },
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
                ]
            })
        ],
        optimization: {
            minimize: productionBuild,
            minimizer: [
                new CssMinimizerPlugin(),
                new TerserPlugin(),
            ],
        },
        resolve: {
            modules: [
                'node_modules',
                path.resolve(__dirname, 'lib/src'),
            ],
            alias: {
                'tscif': path.resolve(__dirname, 'lib/tscif/src'),
                'viewer-api': path.resolve(__dirname, 'lib/molstar/src/apps/rednatco/api.js'),
                'viewer-filters': path.resolve(__dirname, 'lib/molstar/src/apps/rednatco/filters.js'),
                'assets': path.resolve(__dirname, 'assets'),
            }
        },
        experiments: {
            topLevelAwait: true,
        }
    };
};

function createApp(name, productionBuild) {
    return {
        node: false,
        target: 'web',
        entry: {
            app: path.resolve(__dirname, `lib/src/${name}.js`),
        },
        output: {
            filename: `${name}.js`,
            path: path.resolve(__dirname, DistDir)
        },
        ...sharedConfig(productionBuild),
    };
}

module.exports = (env, argv) => {
    const productionBuild = argv.mode === 'production';

    return createApp('index', productionBuild);
};
